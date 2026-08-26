import { CardCategory } from "@prisma/client";

const MTG_COLOR_NAMES: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

function mtgColorLabel(team: string | null): string {
  const colors = (team ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (colors.length === 0) return "Colorless";
  if (colors.length > 1) return "Multicolor";
  return MTG_COLOR_NAMES[colors[0]] ?? "Colorless";
}

type BreakdownCard = { category: CardCategory; team: string | null };

// Mana type for MTG, elemental type for Pokémon — sports/other cards have no
// "type" concept, so they're left out of the breakdown entirely rather than
// being mislabeled by whatever happens to be in their team field.
export function computeTypeBreakdown<T extends { quantity: number; card: BreakdownCard }>(
  deckCards: T[]
): { label: string; count: number; pct: number }[] {
  const breakdown = new Map<string, number>();
  let total = 0;

  for (const dc of deckCards) {
    let label: string | null = null;
    if (dc.card.category === "mtg") {
      label = mtgColorLabel(dc.card.team);
    } else if (dc.card.category === "pokemon") {
      label = dc.card.team?.trim() || "Colorless";
    }

    if (label) {
      breakdown.set(label, (breakdown.get(label) ?? 0) + dc.quantity);
      total += dc.quantity;
    }
  }

  return Array.from(breakdown.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count, pct: total ? Math.round((count / total) * 100) : 0 }));
}
