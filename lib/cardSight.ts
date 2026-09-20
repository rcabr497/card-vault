import { put } from "@vercel/blob";
import { POKEMON_TYPES, type CardDetails } from "./cardDetails";

type IdentifyResult = {
  name: string | null;
  setName: string | null;
  cardNumber: string | null;
  year: number | null;
  rarity: string | null;
  confidence: "High" | "Medium" | "Low" | null;
  needsReview: boolean;
  gradingCompany: string | null;
  grade: string | null;
  thumbnailUrl: string | null;
  cardSightId: string | null;
  estimatedValue: number | null;
  team: string | null;
};

type PricingRecord = { price: number; listing_type?: "auction" | "fixed" | null };

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// CardSight's pricing endpoint returns raw listing records (real eBay sold
// prices as "auction", asking prices as "fixed"), not a single summary number
// — so we compute one ourselves. Completed sales are a truer value than
// asking prices, so prefer those when there are enough of them.
export async function fetchCardSightPrice(cardId: string, apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/pricing/${cardId}?period=1y&listing_type=both`, {
      headers: { "X-API-Key": apiKey },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const records: PricingRecord[] = data?.raw?.records ?? [];
    if (records.length === 0) return null;

    const sold = records.filter((r) => r.listing_type === "auction").map((r) => r.price);
    const prices = sold.length >= 3 ? sold : records.map((r) => r.price);
    return median(prices);
  } catch {
    return null;
  }
}

// The full catalog record for a card CardSight has already identified — the same
// rich record a scan returns (rules text, fields, tags), plus, for sports cards,
// the league-team tag and the list of parallels with their print runs. Used to
// show everything we know about a card, and to backfill cards scanned before we
// kept any of it. Returns null on any failure (including CardSight's rate limit).
export async function fetchCardSightDetails(cardId: string, apiKey: string): Promise<CardDetails | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/catalog/cards/${cardId}`, {
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const d = await res.json();
    if (!d?.id) return null;

    return {
      v: 1,
      source: "cardsight",
      fetchedAt: new Date().toISOString(),
      data: {
        name: d.name ?? null,
        number: d.number ?? null,
        setName: d.setName ?? null,
        releaseName: d.releaseName ?? null,
        releaseYear: d.releaseYear ?? null,
        description: d.description ?? null,
        attributes: Array.isArray(d.attributes) ? d.attributes : [],
        fields: Array.isArray(d.fields) ? d.fields : [],
        parallelCount: d.parallelCount ?? 0,
        parallels: Array.isArray(d.parallels)
          ? d.parallels.map((p: { name?: string; numberedTo?: number }) => ({ name: p.name, numberedTo: p.numberedTo }))
          : [],
      },
    };
  } catch {
    return null;
  }
}

type CardSightField = { key?: string; value?: unknown };
type CardSightCard = {
  id?: string;
  name?: string;
  number?: string;
  setName?: string;
  year?: string | number;
  fields?: CardSightField[];
  attributes?: string[];
  grading?: { company?: string; grade?: string };
};

const BASE_URL = "https://api.cardsight.ai";

function findFieldValue(card: CardSightCard | undefined, keyPattern: RegExp): string | null {
  const field = card?.fields?.find((f) => keyPattern.test(f?.key ?? ""));
  if (field?.value != null) return String(field.value);
  return null;
}

// CardSight puts MTG's color identity in a plain field, in the same raw-letter
// format (e.g. "R", "W, U") Scryfall's color_identity already gives us via the
// manual-lookup path — mtgColorLabel() in lib/deckTypeBreakdown.ts parses this
// directly. Empty/missing means colorless.
function mtgColorIdentityOf(card: CardSightCard | undefined): string | null {
  return findFieldValue(card, /^COLOR_IDENTITY$/i);
}

// Confirmed live against a real identify response: CardSight doesn't expose a
// clean "type" field for Pokémon, but tags the elemental type(s) as
// "pokemon-<type>" entries in `attributes` (e.g. "pokemon-fire" alongside
// "pokemon-ex", "pokemon-hyper-rare", etc.) — filter to the real type names.
function pokemonTypesOf(card: CardSightCard | undefined): string | null {
  const types = (card?.attributes ?? [])
    .map((a) => a.match(/^pokemon-(.+)$/i)?.[1]?.toLowerCase())
    .filter((t): t is string => !!t && POKEMON_TYPES.includes(t))
    .map((t) => t[0].toUpperCase() + t.slice(1));
  return types.length ? types.join(", ") : null;
}

// Fetches CardSight's own official card art and re-hosts it on our Blob storage
// (their image endpoint requires our API key, so the browser can't load it
// directly). A missing/failed thumbnail is never a hard failure — the caller
// just falls back to the user's own photo for tile display.
async function fetchAndStoreThumbnail(cardId: string, userId: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/images/cards/${cardId}?format=json`, {
      headers: { "X-API-Key": apiKey },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const dataUri: string | undefined = data?.data;
    const match = dataUri?.match(/^data:(.+);base64,(.+)$/);
    if (!match) return null;

    const [, contentType, base64] = match;
    const buffer = Buffer.from(base64, "base64");
    const ext = contentType.split("/")[1] || "jpg";

    if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
    const blob = await put(`${userId}/thumbnails/${cardId}-${Date.now()}.${ext}`, buffer, {
      access: "public",
      contentType,
    });
    return blob.url;
  } catch {
    return null;
  }
}

// CardSight's identifiable sport segments, confirmed live against
// GET /v1/catalog/segments (is_identifiable: true). Golf, racing, and
// multi-sport exist in their catalog but aren't identifiable, so they're
// deliberately excluded here.
const IDENTIFIABLE_SPORTS = new Set(["baseball", "basketball", "football", "hockey", "soccer", "mma"]);

export async function identifyCardImage(
  imageUrl: string,
  categoryHint: string | undefined,
  userId: string,
  sportHint?: string
): Promise<IdentifyResult> {
  const apiKey = process.env.CARDSIGHT_API_KEY;
  if (!apiKey) {
    throw new Error("CARDSIGHT_API_KEY is not configured.");
  }

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Couldn't fetch the uploaded image (${imgRes.status}).`);
  }
  const imageBlob = await imgRes.blob();

  // Confirmed live against CardSight's real catalog (GET /v1/catalog/segments):
  // our own category values already match their segment "shortname" exactly for
  // pokemon/mtg, so no lookup/translation is needed. For "sports", the binder's
  // specific sport (if set) maps directly to CardSight's own identifiable sport
  // segments — falling back to the generic default only when no sport is set.
  const segment =
    categoryHint === "pokemon" || categoryHint === "mtg"
      ? categoryHint
      : categoryHint === "sports" && sportHint && IDENTIFIABLE_SPORTS.has(sportHint)
        ? sportHint
        : null;

  const form = new FormData();
  form.append("image", imageBlob, "card.jpg");

  const url = segment ? `${BASE_URL}/v1/identify/card/${segment}` : `${BASE_URL}/v1/identify/card`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
    body: form,
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`CardSight identify failed (${res.status})${bodyText ? `: ${bodyText.slice(0, 300)}` : ""}`);
  }

  const data = await res.json();
  const detection = data?.detections?.[0];
  const card: CardSightCard | undefined = detection?.card;
  const confidence: IdentifyResult["confidence"] = detection?.confidence ?? null;

  const [thumbnailUrl, estimatedValue] = await Promise.all([
    card?.id ? fetchAndStoreThumbnail(card.id, userId, apiKey) : Promise.resolve(null),
    card?.id ? fetchCardSightPrice(card.id, apiKey) : Promise.resolve(null),
  ]);

  return {
    name: card?.name ?? null,
    setName: card?.setName ?? null,
    cardNumber: card?.number ?? null,
    year: card?.year ? Number(card.year) : null,
    rarity: findFieldValue(card, /rarity/i),
    confidence,
    needsReview: confidence === "Low" || !card?.name,
    gradingCompany: card?.grading?.company ?? null,
    grade: card?.grading?.grade ?? null,
    thumbnailUrl,
    cardSightId: card?.id ?? null,
    estimatedValue,
    team: segment === "mtg" ? mtgColorIdentityOf(card) : segment === "pokemon" ? pokemonTypesOf(card) : null,
  };
}
