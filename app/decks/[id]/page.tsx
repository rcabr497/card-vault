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
import { IconPlus, IconAlert, IconCheck } from "@/components/icons";
import { computeTypeBreakdown } from "@/lib/deckTypeBreakdown";
import { ActionsMenu } from "@/components/ActionsMenu";
import { EmptyState } from "@/components/EmptyState";
import { DeckCheckPanel } from "@/components/DeckCheckPanel";
import { DeckFormatEditor } from "@/components/DeckFormatEditor";
import { DeckSections } from "@/components/DeckSections";
import { CardTile } from "@/components/CardTile";
import { resolveFormat, GAME_LABELS, type DeckGame } from "@/lib/deckFormats";
import { checkDeck } from "@/lib/deckCheck";
import { cardTypeGroup, MTG_GROUP_ORDER, POKEMON_GROUP_ORDER } from "@/lib/cardType";

export default async function DeckDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({
    where: { id: params.id, userId },
    include: { deckCards: { include: { card: true }, orderBy: { card: { name: "asc" } } } },
  });
  if (!deck) notFound();

  const [user, allUserCards] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.card.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, setName: true },
    }),
  ]);

  const totalCount = deck.deckCards.reduce((s, dc) => s + dc.quantity, 0);
  const totalValue = deck.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0);
  const typeBreakdown = computeTypeBreakdown(deck.deckCards);

  const cardGames = deck.deckCards.map((dc) =>
    dc.card.category === "mtg" || dc.card.category === "pokemon" ? (dc.card.category as DeckGame) : null
  );
  const format = resolveFormat(deck.format, cardGames);
  const check = format ? checkDeck(format, deck.deckCards) : null;
  const failCount = check?.items.filter((i) => i.status === "fail").length ?? 0;
  const unverified = new Set(check?.items.find((i) => i.id === "unverified")?.cards?.map((c) => c.id) ?? []);
  const deckPath = `/decks/${deck.id}`;

  // The deck's main game: the format's, else whichever most of its cards are.
  const mtgCount = cardGames.filter((g) => g === "mtg").length;
  const pokemonCount = cardGames.filter((g) => g === "pokemon").length;
  const game: DeckGame | null = format?.game ?? (mtgCount || pokemonCount ? (mtgCount >= pokemonCount ? "mtg" : "pokemon") : null);
  const order = game === "mtg" ? MTG_GROUP_ORDER : game === "pokemon" ? POKEMON_GROUP_ORDER : ["Other"];
  const offGameTitle = game ? `Not a ${GAME_LABELS[game]} card` : "Other";

  // Printings of the same card share a group: one with saved data types the rest.
  const typeByName = new Map<string, string>();
  for (const dc of deck.deckCards) {
    const t = cardTypeGroup(dc.card);
    if (t !== "Other") typeByName.set(dc.card.name.trim().toLowerCase(), t);
  }
  const groups = new Map<string, typeof deck.deckCards>();
  for (const dc of deck.deckCards) {
    const title =
      game && dc.card.category !== game
        ? offGameTitle
        : game
          ? typeByName.get(dc.card.name.trim().toLowerCase()) ?? "Other"
          : "Cards";
    groups.set(title, [...(groups.get(title) ?? []), dc]);
  }
  const groupList = Array.from(groups.entries()).sort(([a], [b]) => {
    const rank = (t: string) => (t === offGameTitle ? 999 : order.indexOf(t) === -1 ? 998 : order.indexOf(t));
    return rank(a) - rank(b);
  });

  const verdictChip = check && (
    <a
      href="#deck-check"
      className={`badge ${check.verdict === "legal" ? "badge-good" : check.verdict === "illegal" ? "badge-bad" : "badge-info"}`}
      style={{ minHeight: 30 }}
    >
      {check.verdict === "legal" ? <IconCheck size={14} /> : <IconAlert size={14} />}
      {check.verdict === "legal"
        ? "Legal"
        : check.verdict === "illegal"
          ? `${failCount} ${failCount === 1 ? "rule problem" : "rule problems"}`
          : "Some cards unverified"}
    </a>
  );

  const cardsPanel =
    deck.deckCards.length === 0 ? (
      <EmptyState
        title="No cards in this deck yet"
        body="Use New card to scan or look one up, or Add from collection to pick cards you already own."
        action={{ href: `/decks/${deck.id}/add`, label: "Add a new card" }}
      />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {groupList.map(([title, items]) => (
          <div key={title} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 className="section-title" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              {title}
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--text-soft)", letterSpacing: 0 }}>
                {items.reduce((s, dc) => s + dc.quantity, 0)}
              </span>
            </h2>
            <div className="card-grid deck-card-grid">
              {items.map((dc) => {
                const flag = check?.flagged[dc.cardId];
                const note = flag
                  ? { text: flag, tone: "bad" as const }
                  : unverified.has(dc.cardId)
                    ? { text: "Couldn't verify", tone: "info" as const }
                    : null;
                return (
                  <CardTile
                    key={dc.cardId}
                    href={`/cards/${dc.cardId}?from=${encodeURIComponent(deckPath)}`}
                    name={dc.card.name}
                    imageUrl={dc.card.thumbnailUrl ?? dc.card.imageUrl}
                    category={dc.card.category}
                    showGame={false}
                    note={note}
                    style={flag ? { ["--tile-ring" as string]: "var(--accent2)" } : undefined}
                    badge={
                      <>
                        <span className="qty-badge">×{dc.quantity}</span>
                        {flag && (
                          <span className="deck-flag" aria-hidden="true">
                            !
                          </span>
                        )}
                      </>
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );

  const checkPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section className="surface-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 id="deck-check" className="section-title" style={{ scrollMarginTop: 16 }}>
          Deck check
        </h2>
        <DeckCheckPanel result={check} formatText={deck.format} backTo={deckPath} />
        <DeckFormatEditor deckId={deck.id} initialFormat={format?.label ?? deck.format ?? ""} />
      </section>
      {typeBreakdown.length > 0 && (
        <section className="surface-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 className="section-title">Type breakdown</h2>
          {typeBreakdown.map((t) => (
            <div key={t.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span>{t.label}</span>
                <strong>{t.count}</strong>
              </div>
              <div style={{ height: 8, background: "var(--surface)", borderRadius: 999 }}>
                <div style={{ height: "100%", background: "var(--ink)", borderRadius: 999, width: `${t.pct}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );

  const notesPanel = (
    <section className="surface-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 className="section-title">Notes</h2>
      <DeckNotes deckId={deck.id} initialNotes={deck.notes ?? ""} />
    </section>
  );

  return (
    <AppShell active="decks" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <Link href="/decks" className="back-link" style={{ margin: 0 }}>
            ← All decks
          </Link>
          {(deck.format || check) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {deck.format && (
                <span className="badge badge-outline" style={{ minHeight: 30 }}>
                  {format?.label ?? deck.format}
                </span>
              )}
              {verdictChip}
            </div>
          )}
          <h1 className="topbar-title">{deck.name}</h1>
          <div className="topbar-subtitle" style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
            <span>
              <strong>{totalCount}</strong>
              {format?.minCards ? ` / ${format.minCards}` : ""} cards
            </span>
            <span>
              <strong>{formatMoney(totalValue)}</strong> value
            </span>
            {deck.originalOwnerName && <span>Originally created by {deck.originalOwnerName}</span>}
          </div>
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

      <div className="page-pad">
        <DeckSections
          cards={cardsPanel}
          check={checkPanel}
          notes={notesPanel}
          checkLabel={check && failCount ? `Check · ${failCount}` : "Check"}
        />
      </div>
    </AppShell>
  );
}
