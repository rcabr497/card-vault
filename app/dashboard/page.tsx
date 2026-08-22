import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { CardGridOrList } from "@/components/CardGridOrList";
import { IconPlus } from "@/components/icons";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, { stats, recent, trend }, allCards] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    getDashboardStats(userId),
    prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { binder: { select: { name: true } } },
    }),
  ]);

  return (
    <AppShell active="dashboard" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <h1 className="topbar-title">Dashboard</h1>
        <div className="topbar-actions">
          <Link href="/export" className="btn btn-secondary">
            Export
          </Link>
          <Link href="/binders" className="btn btn-primary">
            <IconPlus />
            Add Card
          </Link>
        </div>
      </div>

      <div className="page-pad">
        <div className="grid grid-4" style={{ marginBottom: 36 }}>
          {stats.map((s) => (
            <div key={s.label} className="surface-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", marginBottom: 8 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid dashboard-cols" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 24, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, margin: 0 }}>
                Recent additions
              </h2>
              <Link href="/binders" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent-ink)" }}>
                View binders →
              </Link>
            </div>
            <div className="grid grid-4">
              {recent.length === 0 && (
                <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>Nothing logged yet.</p>
              )}
              {recent.map((c) => (
                <div key={c.id} className="tile" style={{ padding: 10, gap: 8 }}>
                  <div className="card-photo">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} />
                    ) : (
                      <span className="card-photo-label">CARD PHOTO</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--text-soft)" }}>
                    <span>{c.set}</span>
                    <span style={{ color: "var(--accent-ink)", fontWeight: 700 }}>{c.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, margin: "0 0 16px" }}>
              Value over time
            </h2>
            <div className="surface-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120, marginBottom: 12 }}>
                {trend.map((t) => (
                  <div
                    key={t.label}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}
                  >
                    <div style={{ width: "100%", background: "var(--accent)", borderRadius: "6px 6px 0 0", height: t.h }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, borderTop: "1px solid var(--divider)", paddingTop: 8 }}>
                {trend.map((t) => (
                  <div key={t.label} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--text-soft)" }}>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <CardGridOrList
          cards={allCards.map((c) => ({
            id: c.id,
            name: c.name,
            setName: c.setName,
            cardNumber: c.cardNumber,
            condition: c.condition,
            currentValue: formatMoney(c.currentValue),
            imageUrl: c.thumbnailUrl ?? c.imageUrl,
            binderId: c.binderId,
            binderName: c.binder.name,
          }))}
        />
      </div>
    </AppShell>
  );
}
