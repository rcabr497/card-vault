import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { relativeUpdated } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { IconPlus } from "@/components/icons";
import { DeckGridClient } from "@/components/DeckGridClient";
import { getDeckSummaries } from "@/lib/deckSummaries";

export default async function DecksPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const decks = await getDeckSummaries(userId);

  const tiles = decks.map((d) => ({
    id: d.id,
    name: d.name,
    featuredImageUrl: d.featuredImageUrl,
    meta: `${d.cardCount} cards${d.format ? ` · ${d.formatLabel ?? d.format}` : ""} · ${formatMoney(d.value)}`,
    updatedLabel: relativeUpdated(d.updatedAt),
    verdict: d.verdict,
    failCount: d.failCount,
  }));

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
          <EmptyState
            title="No decks yet"
            body="Build a deck from cards you own, or add new ones as you go. Share it with a public link when it's ready."
            action={{ href: "/decks/new", label: "Build your first deck" }}
          />
        ) : (
          <DeckGridClient decks={tiles} />
        )}
      </div>
    </AppShell>
  );
}
