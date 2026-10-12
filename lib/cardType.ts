import { parseCardDetails } from "./cardDetails";

// Which section of a deck list a card goes in ("Trainers", "Creatures", …),
// from the provider data saved on the card. Cards without that data fall back
// to what their name gives away (basic lands, energy) or "Other".

const MTG_GROUPS: [RegExp, string][] = [
  [/\bcreature\b/i, "Creatures"],
  [/\bplaneswalker\b/i, "Planeswalkers"],
  [/\binstant\b/i, "Instants"],
  [/\bsorcery\b/i, "Sorceries"],
  [/\bbattle\b/i, "Battles"],
  [/\bartifact\b/i, "Artifacts"],
  [/\benchantment\b/i, "Enchantments"],
  [/\bland\b/i, "Lands"],
];
export const MTG_GROUP_ORDER = [...MTG_GROUPS.map(([, g]) => g), "Other"];
export const POKEMON_GROUP_ORDER = ["Pokémon", "Trainers", "Energy", "Other"];

const BASIC_LANDS = /^(snow-covered )?(plains|island|swamp|mountain|forest|wastes)$/i;

type Data = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

export function cardTypeGroup(card: { name: string; category: string; metadataJson: string | null }): string {
  const details = parseCardDetails(card.metadataJson);
  const d: Data = details?.data ?? {};

  if (card.category === "mtg") {
    let typeLine = "";
    if (details?.source === "scryfall") {
      const faces = Array.isArray(d.card_faces) ? (d.card_faces as Data[]) : [];
      typeLine = str(d.type_line) || str(faces[0]?.type_line);
    } else if (details?.source === "cardsight") {
      const fields = Array.isArray(d.fields) ? (d.fields as Data[]) : [];
      typeLine = str(fields.find((f) => f.key === "TYPE_LINE")?.value);
    }
    // A creature land is played as a land; check that first.
    if (/\bland\b/i.test(typeLine) && !/\bcreature\b/i.test(typeLine.split("—")[0].replace(/land/i, ""))) return "Lands";
    for (const [re, group] of MTG_GROUPS) if (re.test(typeLine)) return group;
    if (BASIC_LANDS.test(card.name.trim())) return "Lands";
    return "Other";
  }

  if (card.category === "pokemon") {
    if (details?.source === "pokemontcg") {
      const supertype = str(d.supertype).toLowerCase();
      if (supertype.startsWith("pok")) return "Pokémon";
      if (supertype === "trainer") return "Trainers";
      if (supertype === "energy") return "Energy";
    } else if (details?.source === "cardsight") {
      const tags = Array.isArray(d.attributes) ? (d.attributes as unknown[]).map((a) => str(a).toLowerCase()) : [];
      if (tags.includes("pokemon-trainer")) return "Trainers";
      if (tags.includes("pokemon-energy")) return "Energy";
      const fields = Array.isArray(d.fields) ? (d.fields as Data[]) : [];
      if (fields.some((f) => f.key === "HP" && str(f.value))) return "Pokémon";
    }
    if (/\benergy$/i.test(card.name.trim())) return "Energy";
    return "Other";
  }

  return "Other";
}
