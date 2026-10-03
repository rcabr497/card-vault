import { CATEGORY_LABELS } from "./stats";

// Human-readable versions of the raw values we store on a card.

const MTG_COLOR_NAMES: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

// Providers send rarity as "uncommon" or "Rare Holo" — title-case the
// all-lowercase ones and leave anything already capitalized alone.
export function rarityLabel(rarity: string | null): string | null {
  if (!rarity) return null;
  return rarity === rarity.toLowerCase() ? rarity.replace(/\b\w/g, (c) => c.toUpperCase()) : rarity;
}

// Magic stores color identity as letters ("R", "R,G", "WU"); spell them out.
export function teamLabel(category: string, team: string | null): string | null {
  if (category !== "mtg") return team;
  if (team === null) return null;
  const letters = team.toUpperCase().replace(/[^WUBRG]/g, "").split("");
  return letters.length ? Array.from(new Set(letters)).map((l) => MTG_COLOR_NAMES[l]).join(", ") : "Colorless";
}

// What the team field means for each game.
export function teamFieldLabel(category: string): string {
  return category === "mtg" ? "Color" : category === "pokemon" ? "Type" : category === "sports" ? "Team" : "Team / Type";
}
