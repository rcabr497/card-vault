import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { HandleForm } from "@/components/HandleForm";
import { TradeInviteLink } from "@/components/TradeInviteLink";
import { IconPlus } from "@/components/icons";
import { relativeUpdated } from "@/lib/format";
import { formatMoney } from "@/lib/stats";
import { tradeView } from "@/lib/trades";
import { gameTint } from "@/components/CardTile";

type SideItem = { name: string; quantity: number; currentValue: unknown; thumbnailUrl: string | null; imageUrl: string | null; category: string };

function TradeSide({ title, items }: { title: string; items: SideItem[] }) {
  const total = items.reduce((s, i) => s + Number(i.currentValue ?? 0) * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="trade-side">
      <span className="trade-side-title">{title}</span>
      {items.length === 0 ? (
        <span style={{ color: "var(--text-soft)", fontSize: 14 }}>Nothing</span>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6 }}>
            {items.slice(0, 3).map((i, n) => (
              <div key={n} className="card-photo" style={{ width: 40, borderRadius: 5, background: i.thumbnailUrl || i.imageUrl ? undefined : gameTint(i.category) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {(i.thumbnailUrl || i.imageUrl) && <img src={i.thumbnailUrl ?? i.imageUrl ?? ""} alt="" loading="lazy" decoding="async" />}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
            {items[0].quantity > 1 ? `${items[0].quantity}× ` : ""}
            {items[0].name}
            {count > items[0].quantity ? ` + ${count - items[0].quantity} more` : ""}
          </span>
          <strong>{formatMoney(total)}</strong>
        </>
      )}
    </div>
  );
}

const TABS = [
  { key: "needs", label: "Needs you" },
  { key: "waiting", label: "Waiting" },
  { key: "history", label: "History" },
] as const;

export default async function TradesPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await auth();
  const userId = session!.user.id;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const shell = { name: user.name ?? user.email, plan: user.plan };

  if (!user.handle) {
    return (
      <AppShell active="trades" user={shell}>
        <div className="topbar">
          <h1 className="topbar-title">Trades</h1>
        </div>
        <div className="page-pad">
          <div className="surface-card" style={{ padding: 24, maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 23, margin: 0 }}>Choose your trading handle</h2>
            <p style={{ fontSize: 14, color: "var(--text-soft)", margin: 0 }}>
              Other collectors find you and see you by your handle. Your name and email are never shown to them.
            </p>
            <HandleForm initial={null} />
          </div>
        </div>
      </AppShell>
    );
  }

  const trades = await prisma.trade.findMany({
    where: { OR: [{ proposerId: userId }, { recipientId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      proposer: { select: { handle: true } },
      recipient: { select: { handle: true } },
      items: {
        select: { ownerId: true, quantity: true, thumbnailUrl: true, imageUrl: true, name: true, currentValue: true, category: true },
        orderBy: { name: "asc" },
      },
    },
  });
  const views = trades.map((t) => ({ trade: t, view: tradeView(t, userId) }));
  const tab = TABS.some((t) => t.key === searchParams.tab) ? (searchParams.tab as (typeof TABS)[number]["key"]) : "needs";
  const counts = Object.fromEntries(TABS.map((t) => [t.key, views.filter((v) => v.view.bucket === t.key).length]));
  const shown = views.filter((v) => v.view.bucket === tab);

  return (
    <AppShell active="trades" user={shell}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Trades</h1>
          <div className="topbar-subtitle">You trade as @{user.handle}</div>
        </div>
        <div className="topbar-actions">
          <Link href="/trades/new" className="btn btn-primary">
            <IconPlus />
            New trade
          </Link>
        </div>
      </div>

      <div className="page-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 6 }}>
            Share your trade link so friends can send you offers:
          </div>
          <TradeInviteLink handle={user.handle} />
        </div>

        <nav className="segmented" aria-label="Trade lists" style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
          {TABS.map((t) => (
            <Link key={t.key} href={`/trades?tab=${t.key}`} aria-current={t.key === tab ? "page" : undefined}>
              {t.label}
              {counts[t.key] ? ` · ${counts[t.key]}` : ""}
            </Link>
          ))}
        </nav>

        {shown.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-soft)" }}>
            {tab === "needs"
              ? "Nothing needs you right now."
              : tab === "waiting"
                ? "No trades waiting on anyone else."
                : "No finished trades yet."}
          </p>
        ) : (
          <div className="trade-cards">
            {shown.map(({ trade, view }) => {
              const daysLeft = Math.ceil((trade.expiresAt.getTime() - Date.now()) / 864e5);
              const open = view.status === "proposed" || view.status === "accepted";
              return (
                <article key={trade.id} className="surface-card trade-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span className="avatar-badge" style={{ background: "var(--surface)", color: "var(--text)" }}>
                        {view.otherHandle.slice(0, 1).toUpperCase()}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <strong>@{view.otherHandle}</strong>
                        <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
                          {open && daysLeft > 0
                            ? `Expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
                            : `Updated ${relativeUpdated(trade.updatedAt).toLowerCase()}`}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`badge ${view.tone === "action" ? "badge-info" : view.tone === "good" ? "badge-good" : ""}`}
                      style={view.tone === "open" || view.tone === "closed" ? { background: "var(--surface)" } : undefined}
                    >
                      {view.label}
                    </span>
                  </div>
                  <div className="trade-sides-row">
                    <TradeSide title="You give" items={view.myItems} />
                    <TradeSide title="You get" items={view.theirItems} />
                  </div>
                  <Link href={`/trades/${trade.id}`} className={`btn ${view.tone === "action" ? "btn-primary" : "btn-secondary"}`}>
                    {view.tone === "action" ? (view.status === "accepted" ? "Confirm swap" : "Review offer") : "View trade"}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
