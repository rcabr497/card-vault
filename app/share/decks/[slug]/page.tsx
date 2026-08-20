import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";

export default async function SharedDeckPage({ params }: { params: { slug: string } }) {
  const deck = await prisma.deck.findFirst({
    where: { shareSlug: params.slug, isShared: true },
    include: { deckCards: { include: { card: true }, orderBy: { card: { name: "asc" } } } },
  });
  if (!deck) notFound();

  const totalCount = deck.deckCards.reduce((s, dc) => s + dc.quantity, 0);
  const totalValue = deck.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0);

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
    <div>
      <nav className="nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)" }}>
          <span className="brand-mark" style={{ width: 32, height: 32 }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19 }}>Card Vault</span>
        </Link>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 40 }}>
          {deck.featuredImageUrl && (
            <div className="card-photo" style={{ width: 200, aspectRatio: "2.5/3.5", flex: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deck.featuredImageUrl} alt={deck.name} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>
              Shared deck
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 32, margin: "0 0 8px" }}>
              {deck.name}
            </h1>
            <div style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
              {totalCount} cards{deck.format ? ` · ${deck.format}` : ""} · {formatMoney(totalValue)} value
            </div>
            {deck.notes && (
              <p style={{ fontSize: 13.5, color: "var(--text-soft)", marginTop: 16, maxWidth: "60ch" }}>
                {deck.notes}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 32 }} className="deck-cols">
          <div className="grid grid-5">
            {deck.deckCards.map((dc) => (
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

          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>
              Type breakdown
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
