import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";

export default async function SharedBinderPage({ params }: { params: { slug: string } }) {
  const binder = await prisma.binder.findFirst({
    where: { shareSlug: params.slug, isShared: true },
    include: { binderCards: { include: { card: true }, orderBy: { card: { name: "asc" } } } },
  });
  if (!binder) notFound();

  const totalCount = binder.binderCards.reduce((s, bc) => s + bc.card.quantity, 0);
  const totalValue = binder.binderCards.reduce((s, bc) => s + Number(bc.card.currentValue ?? 0) * bc.card.quantity, 0);

  const breakdown = new Map<string, number>();
  for (const bc of binder.binderCards) {
    const key = bc.card.team || "Other";
    breakdown.set(key, (breakdown.get(key) ?? 0) + bc.card.quantity);
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
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>
            Shared binder
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 32, margin: "0 0 8px" }}>
            {binder.name}
          </h1>
          <div style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
            {totalCount} cards · {formatMoney(totalValue)} value
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 32 }} className="deck-cols">
          <div className="grid grid-5">
            {binder.binderCards.map((bc) => (
              <div key={bc.cardId} className="tile" style={{ padding: 12, gap: 8 }}>
                <div className="card-photo">
                  {bc.card.thumbnailUrl ?? bc.card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bc.card.thumbnailUrl ?? bc.card.imageUrl ?? undefined} alt={bc.card.name} />
                  ) : (
                    <span className="card-photo-label">CARD PHOTO</span>
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {bc.card.name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={`condition-pill condition-${bc.card.condition}`}>{bc.card.condition}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-ink)" }}>
                    {formatMoney(bc.card.currentValue)}
                  </span>
                </div>
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
