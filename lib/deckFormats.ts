// The formats Card Vault knows the deck-building rules for. A deck's format is
// stored as free text (Deck.format); picking one of these stores its label, and
// older free-text values like "standard" or "EDH" are matched by resolveFormat.

export type DeckGame = "mtg" | "pokemon";

export type DeckFormat = {
  id: string;
  game: DeckGame;
  // What's stored on the deck and shown in the UI.
  label: string;
  // Key in the providers' legality lists (Scryfall / Pokémon TCG API / CardSight tags).
  legalityKey: string;
  minCards: number;
  // Undefined when there's no upper limit.
  maxCards?: number;
  // Copies allowed per card name, before exceptions like basic lands.
  copyLimit: number;
  // Vintage: "restricted" cards are legal as a single copy.
  restrictedAsOne?: boolean;
  // Other names people type for it (lowercase, without the game name).
  aliases?: string[];
};

export const GAME_LABELS: Record<DeckGame, string> = { mtg: "Magic", pokemon: "Pokémon" };

const mtgConstructed = { game: "mtg" as const, minCards: 60, copyLimit: 4 };
const pokemonConstructed = { game: "pokemon" as const, minCards: 60, maxCards: 60, copyLimit: 4 };

export const DECK_FORMATS: DeckFormat[] = [
  { ...mtgConstructed, id: "mtg-standard", label: "Magic Standard", legalityKey: "standard" },
  { ...mtgConstructed, id: "mtg-pioneer", label: "Magic Pioneer", legalityKey: "pioneer" },
  { ...mtgConstructed, id: "mtg-modern", label: "Magic Modern", legalityKey: "modern" },
  { ...mtgConstructed, id: "mtg-legacy", label: "Magic Legacy", legalityKey: "legacy" },
  { ...mtgConstructed, id: "mtg-vintage", label: "Magic Vintage", legalityKey: "vintage", restrictedAsOne: true },
  { ...mtgConstructed, id: "mtg-pauper", label: "Magic Pauper", legalityKey: "pauper" },
  {
    id: "mtg-commander",
    game: "mtg",
    label: "Magic Commander",
    legalityKey: "commander",
    minCards: 100,
    maxCards: 100,
    copyLimit: 1,
    aliases: ["edh", "commander / edh"],
  },
  { ...pokemonConstructed, id: "pokemon-standard", label: "Pokémon Standard", legalityKey: "standard" },
  { ...pokemonConstructed, id: "pokemon-expanded", label: "Pokémon Expanded", legalityKey: "expanded" },
  { ...pokemonConstructed, id: "pokemon-unlimited", label: "Pokémon Unlimited", legalityKey: "unlimited" },
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GAME_WORDS: Record<DeckGame, RegExp> = {
  mtg: /\b(magic the gathering|magic|mtg)\b/g,
  pokemon: /\b(pokemon tcg|pokemon|ptcg)\b/g,
};

// Match a stored format to one we know. Text without a game in it ("Standard")
// is read as the game most of the deck's cards belong to.
export function resolveFormat(text: string | null | undefined, cardGames: (DeckGame | null)[] = []): DeckFormat | null {
  if (!text?.trim()) return null;
  const exact = DECK_FORMATS.find((f) => f.label === text.trim());
  if (exact) return exact;

  let base = normalize(text);
  let game: DeckGame | null = null;
  for (const g of Object.keys(GAME_WORDS) as DeckGame[]) {
    if (GAME_WORDS[g].test(base)) {
      game = g;
      base = base.replace(GAME_WORDS[g], " ");
    }
    GAME_WORDS[g].lastIndex = 0;
  }
  base = base.replace(/\b(format|tcg)\b/g, " ").replace(/\s+/g, " ").trim();

  const candidates = DECK_FORMATS.filter((f) => {
    const name = normalize(f.label.replace(/^\S+ /, ""));
    return name === base || f.aliases?.includes(base);
  });
  if (candidates.length === 0) return null;
  if (game) return candidates.find((f) => f.game === game) ?? null;
  if (candidates.length === 1) return candidates[0];

  const mtg = cardGames.filter((g) => g === "mtg").length;
  const pokemon = cardGames.filter((g) => g === "pokemon").length;
  if (mtg === pokemon) return null;
  return candidates.find((f) => f.game === (mtg > pokemon ? "mtg" : "pokemon")) ?? null;
}
