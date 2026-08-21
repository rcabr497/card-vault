import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { relativeUpdated } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { IconPlus } from "@/components/icons";
import { DeckGridClient } from "@/components/DeckGridClient";

export default async function DecksPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { deckCards: { include: { card: { select: { currentValue: true } } } } },
  });

  const tiles = decks.map((d) => {
    const count = d.deckCards.reduce((s, dc) => s + dc.quantity, 0);
    const value = d.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0);
    return {
      id: d.id,
      name: d.name,
      featuredImageUrl: d.featuredImageUrl,
      meta: `${count} cards${d.format ? ` · ${d.format}` : ""} · ${formatMoney(value)}`,
      updatedLabel: relativeUpdated(d.updatedAt),
    };
  });

  return (
    <AppShell active="decks" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Decks</h1>
          <div className="topbar-subtitle">{decks.length} {decks.length === 1 ? "deck" : "decks"}</div>
        </div>
        <div className="topbar-actions">
          <Link href="/decks/new" className="btn btn-primary">
            <IconPlus />
            New Deck
          </Link>
        </div>
      </div>

      <div className="page-pad">
        {decks.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No decks yet — build your first one.</p>
        ) : (
          <DeckGridClient decks={tiles} />
        )}
      </div>
    </AppShell>
  );
}
