import { prisma } from "./prisma";
import { checkDeck, type DeckCheckResult } from "./deckCheck";
import { resolveFormat, type DeckGame } from "./deckFormats";

export type DeckSummary = {
  id: string;
  name: string;
  featuredImageUrl: string | null;
  format: string | null;
  // The known format's label when the stored text matches one.
  formatLabel: string | null;
  cardCount: number;
  value: number;
  updatedAt: Date;
  verdict: DeckCheckResult["verdict"] | null;
  failCount: number;
};

// Every deck with its card count, value, and deck-check verdict, newest first.
export async function getDeckSummaries(userId: string): Promise<DeckSummary[]> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      deckCards: {
        include: { card: { select: { id: true, name: true, category: true, metadataJson: true, currentValue: true } } },
      },
    },
  });

  return decks.map((d) => {
    const games = d.deckCards.map((dc) =>
      dc.card.category === "mtg" || dc.card.category === "pokemon" ? (dc.card.category as DeckGame) : null
    );
    const format = resolveFormat(d.format, games);
    const check = format ? checkDeck(format, d.deckCards) : null;
    return {
      id: d.id,
      name: d.name,
      featuredImageUrl: d.featuredImageUrl,
      format: d.format,
      formatLabel: format?.label ?? null,
      cardCount: d.deckCards.reduce((s, dc) => s + dc.quantity, 0),
      value: d.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0),
      updatedAt: d.updatedAt,
      verdict: check?.verdict ?? null,
      failCount: check?.items.filter((i) => i.status === "fail").length ?? 0,
    };
  });
}
