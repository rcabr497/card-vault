import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, formatMoney } from "@/lib/stats";
import { needsActionWhere, tradeView } from "@/lib/trades";
import { getDeckSummaries } from "@/lib/deckSummaries";
import { AppShell, SCAN_HREF } from "@/components/AppShell";
import { CardTile } from "@/components/CardTile";
import { IconPlus, IconScanFrame, IconTrade, IconAlert, IconCheck, IconChevronRight } from "@/components/icons";

const CATEGORY_COLORS: Record<string, string> = { pokemon: "#d9a21b", mtg: "#6d5bd0", sports: "#2f8f83", other: "#9aa0ac" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, { totals, breakdown, recent, trend }, trades, decks] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    getDashboardStats(userId),
    prisma.trade.findMany({
      where: needsActionWhere(userId),
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: { proposer: { select: { handle: true } }, recipient: { select: { handle: true } }, items: true },
    }),
    getDeckSummaries(userId),
  ]);

  const firstName = (user.name ?? "").trim().split(/\s+/)[0];
  const breakdownTotal = breakdown.byCategory.reduce((s, b) => s + b.count, 0);
  const problemDecks = decks.filter((d) => d.verdict === "illegal").slice(0, 3);
  const needsYou = trades.length + problemDecks.length;

  return (
    <AppShell active="dashboard" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          {firstName && <div className="topbar-eyebrow">Welcome back, {firstName}</div>}
          <h1 className="topbar-title">Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <Link href={SCAN_HREF} className="btn btn-secondary">
            <IconScanFrame size={18} />
            Scan a card
          </Link>
          <Link href="/cards/new" className="btn btn-primary">
            <IconPlus />
            Add card
          </Link>
        </div>
      </div>

      <div className="page-pad dash">
        <section aria-label="Collection value" className="ink-card value-band">
          <div className="value-band-main">
            <div>
              <div className="value-band-label">Collection value</div>
              <div className="num-display value-band-total">{formatMoney(totals.totalValue)}</div>
            </div>
            <div className="value-band-stats">
              {[
                [totals.cardsLogged, "cards"],
                [totals.setsTracked, "sets"],
                [totals.bindersCount, "binders"],
                [totals.gradedCount, "graded"],
              ].map(([n, label]) => (
                <div key={label}>
                  <div className="num-display" style={{ fontSize: 30 }}>
                    {Number(n).toLocaleString()}
                  </div>
                  <div className="value-band-label" style={{ margin: 0 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="value-band-chart" aria-label="Value over the last 6 months">
            <div className="value-band-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Value over time</span>
              <span>Last 6 months</span>
            </div>
            <div className="value-bars">
              {trend.map((t, i) => (
                <div key={t.label} className="value-bar">
                  <span>{t.value}</span>
                  <div style={{ height: t.h, background: i === trend.length - 1 ? "var(--highlight)" : "#4a4f5c" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {trend.map((t) => (
                <span key={t.label} style={{ flex: 1, textAlign: "center", fontSize: 12.5, color: "var(--ink-soft)" }}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="What's in the vault" className="surface-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section-head">
            <h2 className="section-title">What&apos;s in the vault</h2>
            <Link href="/collection" className="text-link">
              View collection
            </Link>
          </div>
          {breakdownTotal === 0 ? (
            <p style={{ color: "var(--text-soft)" }}>No cards logged yet. Scan or add your first card to get started.</p>
          ) : (
            <>
              <div className="breakdown-bar" aria-hidden="true">
                {breakdown.byCategory.map((b) => (
                  <div key={b.key} style={{ width: `${(b.count / breakdownTotal) * 100}%`, background: CATEGORY_COLORS[b.key] }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px" }}>
                {breakdown.byCategory.map((b) => (
                  <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[b.key] }} />
                    <strong>{b.count.toLocaleString()}</strong>
                    <span style={{ color: "var(--text-soft)" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <div className="dash-cols">
          <section aria-label="Recent additions" className="dash-main">
            <div className="section-head">
              <h2 className="section-title">Recent additions</h2>
              <Link href="/collection" className="text-link">
                See all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p style={{ color: "var(--text-soft)" }}>Nothing logged yet.</p>
            ) : (
              <div className="recent-row">
                {recent.slice(0, 8).map((c) => (
                  <CardTile
                    key={c.id}
                    href={`/cards/${c.id}?from=/dashboard`}
                    name={c.name}
                    imageUrl={c.imageUrl}
                    category={c.category}
                    meta={c.set}
                    value={c.value}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="dash-side">
            <section aria-label="Needs you" className="surface-card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column" }}>
              <h2 className="section-title" style={{ marginBottom: 10 }}>
                Needs you
              </h2>
              {needsYou === 0 && (
                <p style={{ color: "var(--text-soft)", paddingTop: 12, borderTop: "1px solid var(--divider)" }}>
                  You&apos;re all caught up.
                </p>
              )}
              {trades.map((t) => {
                const v = tradeView(t, userId);
                return (
                  <Link key={t.id} href={`/trades/${t.id}`} className="needs-row">
                    <span className="needs-icon badge-info">
                      <IconTrade size={18} />
                    </span>
                    <span className="needs-text">
                      <strong>
                        @{v.otherHandle} · {v.label}
                      </strong>
                      <span>{v.summary}</span>
                    </span>
                    <IconChevronRight size={16} />
                  </Link>
                );
              })}
              {problemDecks.map((d) => (
                <Link key={d.id} href={`/decks/${d.id}#deck-check`} className="needs-row">
                  <span className="needs-icon badge-bad">
                    <IconAlert />
                  </span>
                  <span className="needs-text">
                    <strong>{d.name} isn&apos;t legal yet</strong>
                    <span>
                      {d.failCount} rule {d.failCount === 1 ? "problem" : "problems"} for {d.formatLabel}
                    </span>
                  </span>
                  <IconChevronRight size={16} />
                </Link>
              ))}
            </section>

            {decks.length > 0 && (
              <section aria-label="Decks" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="section-head">
                  <h2 className="section-title">Decks</h2>
                  <Link href="/decks" className="text-link">
                    See all
                  </Link>
                </div>
                <div className="surface-card list-card">
                  {decks.slice(0, 4).map((d) => (
                    <Link key={d.id} href={`/decks/${d.id}`} className="list-row">
                      <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</strong>
                        <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
                          {[d.formatLabel ?? d.format, `${d.cardCount} cards`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {d.verdict === "legal" && (
                        <span className="badge badge-good">
                          <IconCheck size={14} />
                          Legal
                        </span>
                      )}
                      {d.verdict === "illegal" && (
                        <span className="badge badge-bad">
                          {d.failCount} {d.failCount === 1 ? "problem" : "problems"}
                        </span>
                      )}
                      {d.verdict === "unverified" && <span className="badge badge-info">Unverified</span>}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
