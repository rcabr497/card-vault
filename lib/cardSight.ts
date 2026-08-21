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
};

type CardSightField = { key?: string; value?: unknown };
type CardSightCard = {
  name?: string;
  number?: string;
  setName?: string;
  year?: string | number;
  fields?: CardSightField[];
  attributes?: unknown[];
  grading?: { company?: string; grade?: string };
};

const BASE_URL = "https://api.cardsight.ai";

function findFieldValue(card: CardSightCard | undefined, keyPattern: RegExp): string | null {
  const field = card?.fields?.find((f) => keyPattern.test(f?.key ?? ""));
  if (field?.value != null) return String(field.value);
  return null;
}

export async function identifyCardImage(imageUrl: string, categoryHint?: string): Promise<IdentifyResult> {
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
  // pokemon/mtg, so no lookup/translation is needed. "sports" has no single
  // matching segment (no specific sport collected at the binder level) — omit
  // it and let CardSight fall back to its own default.
  const segment = categoryHint === "pokemon" || categoryHint === "mtg" ? categoryHint : null;

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
  };
}
