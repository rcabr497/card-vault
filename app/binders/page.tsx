import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { relativeUpdated } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { NewBinderDialog } from "@/components/NewBinderDialog";
import { BinderGridClient } from "@/components/BinderGridClient";

export default async function BindersPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const binders = await prisma.binder.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { cards: { select: { currentValue: true, quantity: true, imageUrl: true } } },
  });

  const totalCards = binders.reduce((sum, b) => sum + b.cards.reduce((s, c) => s + c.quantity, 0), 0);

  const tiles = binders.map((b) => ({
    id: b.id,
    name: b.name,
    count: b.cards.reduce((s, c) => s + c.quantity, 0),
    value: formatMoney(b.cards.reduce((s, c) => s + Number(c.currentValue ?? 0) * c.quantity, 0)),
    swatches: Array.from({ length: 4 }, (_, i) => b.cards[i]?.imageUrl ?? null),
    updatedLabel: relativeUpdated(b.updatedAt),
  }));

  return (
    <AppShell active="binders" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Binders</h1>
          <div className="topbar-subtitle">
            {binders.length} {binders.length === 1 ? "binder" : "binders"} · {totalCards.toLocaleString()} cards total
          </div>
        </div>
        <div className="topbar-actions">
          <NewBinderDialog />
        </div>
      </div>

      <div className="page-pad">
        {binders.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
            No binders yet — create one to start logging cards.
          </p>
        ) : (
          <BinderGridClient binders={tiles} />
        )}
      </div>
    </AppShell>
  );
}
