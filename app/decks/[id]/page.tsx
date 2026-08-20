import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { DeckNotes } from "@/components/DeckNotes";
import { DeckShareToggle } from "@/components/DeckShareToggle";
import { AddCardToDeckDialog } from "@/components/AddCardToDeckDialog";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

const PAGE_SIZE = 15;

export default async function DeckDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({
    where: { id: params.id, userId },
    include: { deckCards: { include: { card: true }, orderBy: { card: { name: "asc" } } } },
  });
  if (!deck) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const allUserCards = await prisma.card.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, setName: true },
  });

  const totalCount = deck.deckCards.reduce((s, dc) => s + dc.quantity, 0);
  const totalValue = deck.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0);

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(deck.deckCards.length / PAGE_SIZE));
  const pageItems = deck.deckCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const breakdown = new Map<string, number>();
  for (const dc of deck.deckCards) {
    const key = dc.card.team || "Other";
    breakdown.set(key, (breakdown.get(key) ?? 0) + dc.quantity);
  }
  const typeBreakdown = Array.from(breakdown.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count, pct: totalCount ? Math.round((count / totalCount) * 100) : 0 }));

  return (
    <AppShell active="decks" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/decks" className="back-link">
            ← All decks
          </Link>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>Deck</div>
          <h1 className="topbar-title">{deck.name}</h1>
          <div className="topbar-subtitle">
            {totalCount} cards{deck.format ? ` · ${deck.format}` : ""} · {formatMoney(totalValue)} value
          </div>
        </div>
        <div className="topbar-actions">
          <DeckShareToggle deckId={deck.id} initialShared={deck.isShared} initialSlug={deck.shareSlug} />
          <AddCardToDeckDialog deckId={deck.id} cards={allUserCards} />
        </div>
      </div>

      <div className="grid deck-cols" style={{ gridTemplateColumns: "1fr 300px", gap: 0 }}>
        <div className="page-pad">
          {pageItems.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No cards in this deck yet.</p>
          ) : (
            <div className="grid grid-5">
              {pageItems.map((dc) => (
                <div key={dc.cardId} className="tile" style={{ padding: 12, gap: 8, position: "relative" }}>
                  <span className="qty-badge">x{dc.quantity}</span>
                  <div className="card-photo">
                    {dc.card.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dc.card.imageUrl} alt={dc.card.name} />
                    ) : (
                      <span className="card-photo-label">CARD PHOTO</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dc.card.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--text-soft)" }}>{dc.card.team ?? "—"}</div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pager">
              <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}>
                Showing {pageItems.length} of {deck.deckCards.length} cards
              </span>
              <div className="pager-controls">
                <Link href={`/decks/${deck.id}?page=${Math.max(1, page - 1)}`} className="pager-btn">
                  <IconChevronLeft />
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={`/decks/${deck.id}?page=${p}`} className={`pager-btn${p === page ? " active" : ""}`}>
                    {p}
                  </Link>
                ))}
                <Link href={`/decks/${deck.id}?page=${Math.min(totalPages, page + 1)}`} className="pager-btn">
                  <IconChevronRight />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "0 28px 32px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>
            Type breakdown
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            {typeBreakdown.length === 0 && (
              <p style={{ fontSize: 12.5, color: "var(--text-soft)" }}>Add cards to see a breakdown.</p>
            )}
            {typeBreakdown.map((t) => (
              <div key={t.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span>{t.label}</span>
                  <span style={{ color: "var(--text-soft)" }}>{t.count}</span>
                </div>
                <div style={{ height: 7, background: "var(--surface)", borderRadius: 999 }}>
                  <div style={{ height: "100%", background: "var(--accent)", borderRadius: 999, width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>
            Deck notes
          </h2>
          <DeckNotes deckId={deck.id} initialNotes={deck.notes ?? ""} />
        </div>
      </div>
    </AppShell>
  );
}
