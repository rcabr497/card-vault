import type { CardDetails } from "./cardDetails";

// Keep just these keys of a provider's record — enough to show everything useful
// about the card without storing image URLs, purchase links, and other noise.
function pick(record: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (record[k] !== undefined && record[k] !== null) out[k] = record[k];
  return out;
}

const POKEMON_TCG_KEYS = [
  "hp", "supertype", "subtypes", "types", "evolvesFrom", "evolvesTo", "abilities", "attacks", "weaknesses",
  "resistances", "retreatCost", "rules", "flavorText", "artist", "rarity", "number", "nationalPokedexNumbers",
  "legalities",
];

const SCRYFALL_KEYS = [
  "oracle_text", "mana_cost", "cmc", "type_line", "colors", "color_identity", "power", "toughness", "loyalty",
  "keywords", "legalities", "finishes", "artist", "flavor_text", "rarity", "set_name", "set", "collector_number",
  "released_at", "edhrec_rank", "reserved", "prices", "border_color", "lang",
];

type LookupResult = {
  category: "pokemon" | "mtg";
  name: string;
  setName: string | null;
  cardNumber: string | null;
  year: number | null;
  rarity: string | null;
  team: string | null;
  imageUrl: string | null;
  estimatedValue: number | null;
  details: CardDetails;
};

async function searchPokemon(name: string): Promise<LookupResult | null> {
  const headers: Record<string, string> = {};
  if (process.env.POKEMONTCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;

  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`name:"${name}"`)}&pageSize=1&orderBy=-set.releaseDate`,
    { headers }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const card = data?.data?.[0];
  if (!card) return null;

  const tcgPrices = card.tcgplayer?.prices;
  const marketPrice =
    tcgPrices?.normal?.market ??
    tcgPrices?.holofoil?.market ??
    tcgPrices?.reverseHolofoil?.market ??
    tcgPrices?.["1stEditionHolofoil"]?.market ??
    null;

  return {
    category: "pokemon",
    name: card.name,
    setName: card.set?.name ?? null,
    cardNumber: card.number ?? null,
    year: card.set?.releaseDate ? Number(card.set.releaseDate.slice(0, 4)) : null,
    rarity: card.rarity ?? null,
    team: Array.isArray(card.types) ? card.types.join(", ") : null,
    imageUrl: card.images?.large ?? null,
    estimatedValue: typeof marketPrice === "number" ? marketPrice : null,
    details: {
      v: 1,
      source: "pokemontcg",
      fetchedAt: new Date().toISOString(),
      data: {
        ...pick(card, POKEMON_TCG_KEYS),
        set: card.set ? pick(card.set, ["name", "series", "printedTotal", "total", "ptcgoCode", "releaseDate"]) : undefined,
        tcgplayer: card.tcgplayer?.prices ? { prices: card.tcgplayer.prices } : undefined,
        cardmarket: card.cardmarket?.prices ? { prices: card.cardmarket.prices } : undefined,
      },
    },
  };
}

async function searchScryfall(name: string): Promise<LookupResult | null> {
  const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
  if (!res.ok) return null;
  const card = await res.json();
  if (!card?.name) return null;

  const imageUrl = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null;
  const usdPrice = card.prices?.usd ? parseFloat(card.prices.usd) : null;

  return {
    category: "mtg",
    name: card.name,
    setName: card.set_name ?? null,
    cardNumber: card.collector_number ?? null,
    year: card.released_at ? Number(card.released_at.slice(0, 4)) : null,
    rarity: card.rarity ?? null,
    team: Array.isArray(card.color_identity) ? card.color_identity.join(", ") : null,
    imageUrl,
    estimatedValue: usdPrice !== null && !Number.isNaN(usdPrice) ? usdPrice : null,
    details: {
      v: 1,
      source: "scryfall",
      fetchedAt: new Date().toISOString(),
      data: {
        ...pick(card, SCRYFALL_KEYS),
        // Two-faced cards keep their rules text on each face.
        card_faces: Array.isArray(card.card_faces)
          ? card.card_faces.map((f: Record<string, unknown>) =>
              pick(f, ["name", "mana_cost", "type_line", "oracle_text", "power", "toughness", "loyalty"])
            )
          : undefined,
      },
    },
  };
}

export async function lookupCardByName(name: string): Promise<LookupResult | null> {
  const [pokemon, mtg] = await Promise.allSettled([searchPokemon(name), searchScryfall(name)]);
  if (pokemon.status === "fulfilled" && pokemon.value) return pokemon.value;
  if (mtg.status === "fulfilled" && mtg.value) return mtg.value;
  return null;
}
