import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { computeTypeBreakdown } from "@/lib/deckTypeBreakdown";
import { ImportToCollectionButton } from "@/components/ImportToCollectionButton";

export default async function SharedDeckPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const deck = await prisma.deck.findFirst({
    where: { shareSlug: params.slug, isShared: true },
    include: { deckCards: { include: { card: true }, orderBy: { card: { name: "asc" } } } },
  });
  if (!deck) notFound();

  const totalCount = deck.deckCards.reduce((s, dc) => s + dc.quantity, 0);
  const totalValue = deck.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0);

  const typeBreakdown = computeTypeBreakdown(deck.deckCards);

  return (
    <div>
      <nav className="nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)" }}>
          <span className="brand-mark" style={{ width: 32, height: 32 }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19 }}>Card Vault</span>
        </Link>
        <div style={{ marginLeft: "auto" }}>
          <Link href={session?.user?.id ? "/dashboard" : "/signup"} className="btn btn-primary">
            {session?.user?.id ? "Dashboard" : "Sign Up"}
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
            {deck.featuredImageUrl && (
              <div className="card-photo" style={{ width: 200, aspectRatio: "2.5/3.5", flex: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={deck.featuredImageUrl} alt={deck.name} loading="lazy" decoding="async" />
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
              {deck.originalOwnerName && (
                <div style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 4 }}>
                  Originally created by {deck.originalOwnerName}
                </div>
              )}
              {deck.notes && (
                <p style={{ fontSize: 13.5, color: "var(--text-soft)", marginTop: 16, maxWidth: "60ch" }}>
                  {deck.notes}
                </p>
              )}
            </div>
          </div>
          <Suspense fallback={null}>
            <ImportToCollectionButton kind="decks" slug={deck.shareSlug!} isLoggedIn={!!session?.user?.id} />
          </Suspense>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: typeBreakdown.length > 0 ? "1fr 260px" : "1fr", gap: 32 }}
          className="deck-cols"
        >
          <div className="grid grid-5">
            {deck.deckCards.map((dc) => (
              <div key={dc.cardId} className="tile" style={{ padding: 12, gap: 8, position: "relative" }}>
                <span className="qty-badge">x{dc.quantity}</span>
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
                <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {dc.card.name}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-soft)" }}>{dc.card.team ?? "—"}</div>
              </div>
            ))}
          </div>

          {typeBreakdown.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
