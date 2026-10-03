import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { TradeActions } from "@/components/TradeActions";
import { pickerCards, tradeView } from "@/lib/trades";
import type { TradeItem } from "@prisma/client";

function sideValue(items: TradeItem[]) {
  return items.reduce((s, i) => s + Number(i.currentValue ?? 0) * i.quantity, 0);
}

function Side({ title, items, emptyText }: { title: string; items: TradeItem[]; emptyText: string }) {
  return (
    <div className="surface-card" style={{ padding: 18, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
        {items.length > 0 && <div style={{ fontSize: 13, color: "var(--text-soft)" }}>≈ {formatMoney(sideValue(items))}</div>}
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-soft)", margin: "6px 0 0" }}>{emptyText}</p>
      ) : (
        items.map((i) => (
          <div key={i.id} className="trade-item">
            <div className="card-photo" style={{ width: 44, flex: "none" }}>
              {(i.thumbnailUrl ?? i.imageUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.thumbnailUrl ?? i.imageUrl ?? ""} alt={i.name} loading="lazy" decoding="async" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>
                {i.quantity > 1 && <span style={{ color: "var(--accent-ink)" }}>{i.quantity}× </span>}
                {i.name}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-soft)" }}>
                {[i.setName, i.cardNumber && `#${i.cardNumber}`, i.year, i.gradingCompany && `${i.gradingCompany} ${i.grade ?? ""}`.trim()]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <span className={`condition-pill condition-${i.condition}`}>{i.condition}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const trade = await prisma.trade.findUnique({
    where: { id: params.id },
    include: {
      proposer: { select: { handle: true } },
      recipient: { select: { handle: true } },
      items: { orderBy: { name: "asc" } },
    },
  });
  if (!trade || (trade.proposerId !== userId && trade.recipientId !== userId)) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const v = tradeView(trade, userId);
  const myCards = v.myTurn ? await pickerCards(prisma, userId, trade.id) : null;
  const dateLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const instructions: Record<string, string> = {
    proposed: v.myTurn
      ? `@${v.otherHandle} sent you this offer. Accept it, decline it, or counter by adding cards from your collection.`
      : `Sent to @${v.otherHandle}. They can accept, decline, or counter. Expires ${dateLabel(trade.expiresAt)}.`,
    accepted: `You both agreed. Swap the cards by mail or in person, then each confirm below. Cards move between your collections only after you've both confirmed${
      v.theirConfirmed ? ` — @${v.otherHandle} already has.` : "."
    }`,
    completed: `Completed ${trade.completedAt ? dateLabel(trade.completedAt) : ""}. The cards have moved to each collection.`,
    declined: "This trade was declined.",
    cancelled: "This trade was cancelled. Nothing moved between collections.",
    expired: "This trade expired without being finished. Nothing moved between collections.",
  };

  return (
    <AppShell active="trades" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/trades" className="back-link">
            ← Trades
          </Link>
          <h1 className="topbar-title">Trade with @{v.otherHandle}</h1>
          <div className="topbar-subtitle">{v.summary}</div>
        </div>
        <div className="topbar-actions">
          <span className={`trade-status trade-status-${v.tone}`}>{v.label}</span>
        </div>
      </div>

      <div className="page-pad" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
        <p style={{ fontSize: 14.5, margin: 0 }}>{instructions[v.status]}</p>

        {trade.note && (
          <div className="surface-card" style={{ padding: "12px 16px", fontSize: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            <span style={{ fontSize: 12.5, color: "var(--text-soft)", display: "block", marginBottom: 2 }}>Note</span>
            {trade.note}
          </div>
        )}

        <div className="trade-sides">
          <Side
            title="You give"
            items={v.myItems}
            emptyText={
              v.status === "proposed" && v.myTurn
                ? "Nothing yet. Accept it as a gift, or counter to add cards from your collection."
                : `Nothing — a gift from @${v.otherHandle}.`
            }
          />
          <Side
            title="You get"
            items={v.theirItems}
            emptyText={
              v.status === "proposed" && !v.myTurn
                ? `Nothing yet. @${v.otherHandle} can accept it as a gift or counter with their cards.`
                : `Nothing — your gift to @${v.otherHandle}.`
            }
          />
        </div>

        <TradeActions
          tradeId={trade.id}
          status={v.status}
          myTurn={v.myTurn}
          myConfirmed={v.myConfirmed}
          theirConfirmed={v.theirConfirmed}
          otherHandle={v.otherHandle}
          myItems={v.myItems.map((i) => ({ cardId: i.cardId, quantity: i.quantity }))}
          theirItems={v.theirItems.map((i) => ({ cardId: i.cardId, name: i.name, quantity: i.quantity }))}
          myCards={myCards}
        />

        <p style={{ fontSize: 12.5, color: "var(--text-soft)", margin: 0 }}>
          Card Vault keeps track of trades but doesn&apos;t handle shipping or payment. Values are estimates. Only trade with people you trust.
        </p>
      </div>
    </AppShell>
  );
}
