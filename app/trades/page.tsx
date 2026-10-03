import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { HandleForm } from "@/components/HandleForm";
import { TradeInviteLink } from "@/components/TradeInviteLink";
import { IconPlus } from "@/components/icons";
import { relativeUpdated } from "@/lib/format";
import { tradeView } from "@/lib/trades";

const TABS = [
  { key: "needs", label: "Needs you" },
  { key: "waiting", label: "Waiting on them" },
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
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, margin: 0 }}>Choose your trading handle</h2>
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
      items: { select: { ownerId: true, quantity: true, thumbnailUrl: true, imageUrl: true } },
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <Link key={t.key} href={`/trades?tab=${t.key}`} className={`pill${t.key === tab ? " pill-active" : ""}`}>
              {t.label}
              {counts[t.key] ? ` (${counts[t.key]})` : ""}
            </Link>
          ))}
        </div>

        {shown.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-soft)" }}>
            {tab === "needs"
              ? "Nothing needs you right now."
              : tab === "waiting"
                ? "No trades waiting on anyone else."
                : "No finished trades yet."}
          </p>
        ) : (
          <div className="surface-card" style={{ overflow: "hidden" }}>
            {shown.map(({ trade, view }) => (
              <Link key={trade.id} href={`/trades/${trade.id}`} className="trade-row">
                <div style={{ display: "flex", gap: 4, flex: "none" }}>
                  {trade.items.slice(0, 3).map((i, n) => (
                    <div key={n} className="card-photo" style={{ width: 30 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {(i.thumbnailUrl || i.imageUrl) && <img src={i.thumbnailUrl ?? i.imageUrl ?? ""} alt="" loading="lazy" decoding="async" />}
                    </div>
                  ))}
                </div>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>@{view.otherHandle}</div>
                  <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{view.summary}</div>
                </div>
                <span className={`trade-status trade-status-${view.tone}`}>{view.label}</span>
                <span style={{ fontSize: 12, color: "var(--text-soft)", whiteSpace: "nowrap" }}>{relativeUpdated(trade.updatedAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
