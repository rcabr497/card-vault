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
  };
}

export async function lookupCardByName(name: string): Promise<LookupResult | null> {
  const [pokemon, mtg] = await Promise.allSettled([searchPokemon(name), searchScryfall(name)]);
  if (pokemon.status === "fulfilled" && pokemon.value) return pokemon.value;
  if (mtg.status === "fulfilled" && mtg.value) return mtg.value;
  return null;
}
