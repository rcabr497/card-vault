import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { DeckNotes } from "@/components/DeckNotes";
import { DeckShareToggle } from "@/components/DeckShareToggle";
import { AddCardToDeckDialog } from "@/components/AddCardToDeckDialog";
import { DeleteDeckButton } from "@/components/DeleteDeckButton";
import { IconChevronLeft, IconChevronRight, IconPlus } from "@/components/icons";
import { computeTypeBreakdown } from "@/lib/deckTypeBreakdown";
import { teamLabel } from "@/lib/cardLabels";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EmptyState } from "@/components/EmptyState";
import { DeckCheckPanel } from "@/components/DeckCheckPanel";
import { DeckFormatEditor } from "@/components/DeckFormatEditor";
import { resolveFormat, type DeckGame } from "@/lib/deckFormats";
import { checkDeck } from "@/lib/deckCheck";

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

  const typeBreakdown = computeTypeBreakdown(deck.deckCards);

  const cardGames = deck.deckCards.map((dc) =>
    dc.card.category === "mtg" || dc.card.category === "pokemon" ? (dc.card.category as DeckGame) : null
  );
  const format = resolveFormat(deck.format, cardGames);
  const check = format ? checkDeck(format, deck.deckCards) : null;
  const failCount = check?.items.filter((i) => i.status === "fail").length ?? 0;
  const deckPath = `/decks/${deck.id}`;

  return (
    <AppShell active="decks" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/decks" className="back-link">
            ← All decks
          </Link>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>Deck</div>
          <h1 className="topbar-title">{deck.name}</h1>
          <div className="topbar-subtitle">
            {totalCount} cards{deck.format ? ` · ${format?.label ?? deck.format}` : ""} · {formatMoney(totalValue)} value
          </div>
          {check && (
            <a href="#deck-check" className={`check-chip check-verdict-${check.verdict === "legal" ? "good" : check.verdict === "illegal" ? "bad" : "open"}`}>
              {check.verdict === "legal"
                ? "Legal"
                : check.verdict === "illegal"
                  ? `${failCount} ${failCount === 1 ? "rule problem" : "rule problems"}`
                  : "Some cards unverified"}
            </a>
          )}
          {deck.originalOwnerName && (
            <div style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 4 }}>
              Originally created by {deck.originalOwnerName}
            </div>
          )}
        </div>
        <div className="topbar-actions">
          <Link href={`/decks/${deck.id}/add`} className="btn btn-primary">
            <IconPlus />
            New card
          </Link>
          <AddCardToDeckDialog deckId={deck.id} cards={allUserCards} />
          <ActionsMenu>
            <DeckShareToggle deckId={deck.id} initialShared={deck.isShared} initialSlug={deck.shareSlug} />
            <DeleteDeckButton deckId={deck.id} />
          </ActionsMenu>
        </div>
      </div>

      <div className="grid deck-cols" style={{ gridTemplateColumns: "1fr 300px", gap: 0 }}>
        <div className="page-pad">
          {pageItems.length === 0 ? (
            <EmptyState
              title="No cards in this deck yet"
              body="Use New card to scan or look one up, or Add from collection to pick cards you already own."
              action={{ href: `/decks/${deck.id}/add`, label: "Add a new card" }}
            />
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
              {pageItems.map((dc) => (
                <Link
                  key={dc.cardId}
                  href={`/cards/${dc.cardId}?from=${encodeURIComponent(deckPath)}`}
                  className="tile"
                  style={{ padding: 12, gap: 8, position: "relative" }}
                >
                  <span className="qty-badge">x{dc.quantity}</span>
                  {check?.flagged[dc.cardId] && (
                    <span className="deck-flag" title={check.flagged[dc.cardId]}>
                      <span aria-hidden="true">!</span>
                      <span className="visually-hidden">{check.flagged[dc.cardId]}</span>
                    </span>
                  )}
                  <div className="card-photo">
                    {dc.card.thumbnailUrl ?? dc.card.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dc.card.thumbnailUrl ?? dc.card.imageUrl ?? undefined}
                        alt={dc.card.name}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="card-photo-label">CARD PHOTO</span>
                    )}
                  </div>
                  <div className="clamp-2" style={{ fontSize: 13, fontWeight: 700 }}>
                    {dc.card.name}
                  </div>
                  {teamLabel(dc.card.category, dc.card.team) && (
                    <div style={{ fontSize: 12.5, color: "var(--text-soft)" }}>{teamLabel(dc.card.category, dc.card.team)}</div>
                  )}
                </Link>
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
          <h2 id="deck-check" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, margin: "0 0 12px", scrollMarginTop: 16 }}>
            Deck check
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <DeckCheckPanel result={check} formatText={deck.format} backTo={deckPath} />
            <DeckFormatEditor deckId={deck.id} initialFormat={format?.label ?? deck.format ?? ""} />
          </div>

          {typeBreakdown.length > 0 && (
            <>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>
                Type breakdown
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
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
            </>
          )}

          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>
            Deck notes
          </h2>
          <DeckNotes deckId={deck.id} initialNotes={deck.notes ?? ""} />
        </div>
      </div>
    </AppShell>
  );
}
