import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { relativeUpdated } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { NewBinderDialog } from "@/components/NewBinderDialog";
import { IconChevronRight } from "@/components/icons";

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
          <input type="search" placeholder="Search binders…" className="input" style={{ width: 220 }} />
          <NewBinderDialog />
        </div>
      </div>

      <div className="page-pad">
        {binders.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
            No binders yet — create one to start logging cards.
          </p>
        ) : (
          <div className="grid grid-3">
            {binders.map((b) => {
              const value = b.cards.reduce((s, c) => s + Number(c.currentValue ?? 0) * c.quantity, 0);
              const count = b.cards.reduce((s, c) => s + c.quantity, 0);
              const swatches = b.cards.slice(0, 4);
              return (
                <Link key={b.id} href={`/binders/${b.id}`} className="tile" style={{ padding: 20, gap: 14 }}>
                  <div style={{ display: "flex", gap: 6, height: 64 }}>
                    {Array.from({ length: 4 }).map((_, i) => {
                      const card = swatches[i];
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            borderRadius: 8,
                            overflow: "hidden",
                            backgroundImage:
                              card?.imageUrl ? undefined : "repeating-linear-gradient(135deg, #e2ddd2 0 5px, #cfc7b7 5px 10px)",
                          }}
                        >
                          {card?.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={card.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {b.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                      {count} cards · {formatMoney(value)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid var(--divider)",
                      paddingTop: 12,
                    }}
                  >
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-soft)" }}>
                      {relativeUpdated(b.updatedAt)}
                    </span>
                    <span style={{ color: "var(--accent-ink)" }}>
                      <IconChevronRight />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
