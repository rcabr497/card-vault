import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { relativeUpdated } from "@/lib/format";

export const revalidate = 300;

export default async function ShowcasePage() {
  const [sharedDecks, sharedBinders] = await Promise.all([
    prisma.deck.findMany({
      where: { isShared: true },
      orderBy: { updatedAt: "desc" },
      select: {
        name: true,
        format: true,
        featuredImageUrl: true,
        shareSlug: true,
        updatedAt: true,
        deckCards: { select: { quantity: true, card: { select: { currentValue: true } } } },
      },
    }),
    prisma.binder.findMany({
      where: { isShared: true },
      orderBy: { updatedAt: "desc" },
      select: {
        name: true,
        shareSlug: true,
        updatedAt: true,
        binderCards: {
          select: {
            card: { select: { currentValue: true, quantity: true, thumbnailUrl: true, imageUrl: true } },
          },
        },
      },
    }),
  ]);

  const deckTiles = sharedDecks.map((d) => {
    const count = d.deckCards.reduce((s, dc) => s + dc.quantity, 0);
    const value = d.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0);
    return {
      slug: d.shareSlug!,
      name: d.name,
      featuredImageUrl: d.featuredImageUrl,
      meta: `${count} cards${d.format ? ` · ${d.format}` : ""} · ${formatMoney(value)}`,
      updatedLabel: relativeUpdated(d.updatedAt),
    };
  });

  const binderTiles = sharedBinders.map((b) => {
    const cards = b.binderCards.map((bc) => bc.card);
    return {
      slug: b.shareSlug!,
      name: b.name,
      count: cards.reduce((s, c) => s + c.quantity, 0),
      value: formatMoney(cards.reduce((s, c) => s + Number(c.currentValue ?? 0) * c.quantity, 0)),
      swatches: Array.from({ length: 4 }, (_, i) => cards[i]?.thumbnailUrl ?? cards[i]?.imageUrl ?? null),
      updatedLabel: relativeUpdated(b.updatedAt),
    };
  });

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

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 34, margin: "0 0 8px" }}>
          Showcase
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-soft)", margin: "0 0 40px" }}>
          Decks and binders the community has made public.
        </p>

        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 19, margin: "0 0 16px" }}>
          Public decks
        </h2>
        {deckTiles.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 48 }}>No public decks yet.</p>
        ) : (
          <div className="grid grid-3" style={{ marginBottom: 48 }}>
            {deckTiles.map((d) => (
              <Link key={d.slug} href={`/share/decks/${d.slug}`} className="tile" style={{ overflow: "hidden" }}>
                <div className="card-photo" style={{ aspectRatio: "2.5/1.4", borderRadius: 0 }}>
                  {d.featuredImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.featuredImageUrl} alt={d.name} style={{ objectPosition: "top" }} />
                  ) : (
                    <span className="card-photo-label">DECK COVER</span>
                  )}
                </div>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{d.meta}</div>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-soft)" }}>{d.updatedLabel}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 19, margin: "0 0 16px" }}>
          Public binders
        </h2>
        {binderTiles.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No public binders yet.</p>
        ) : (
          <div className="grid grid-3">
            {binderTiles.map((b) => (
              <Link
                key={b.slug}
                href={`/share/binders/${b.slug}`}
                className="tile"
                style={{ padding: 20, gap: 14 }}
              >
                <div style={{ display: "flex", gap: 6, height: 64 }}>
                  {b.swatches.map((imageUrl, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        overflow: "hidden",
                        backgroundImage: imageUrl
                          ? undefined
                          : "repeating-linear-gradient(135deg, #e2ddd2 0 5px, #cfc7b7 5px 10px)",
                      }}
                    >
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                    {b.count} cards · {b.value}
                  </div>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-soft)" }}>{b.updatedLabel}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer style={{ padding: "24px 48px 40px", display: "flex", alignItems: "center", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14 }}>Card Vault</span>
        <Link href="/changelog" style={{ fontSize: 12, color: "var(--text-soft)" }}>
          Changelog
        </Link>
        <span style={{ fontSize: 12, color: "var(--text-soft)", marginLeft: "auto" }}>
          © 2026 Card Vault. Built for collectors, by collectors.
        </span>
      </footer>
    </div>
  );
}
