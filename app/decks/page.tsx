import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { relativeUpdated } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { IconPlus } from "@/components/icons";

export default async function DecksPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { deckCards: { include: { card: { select: { currentValue: true } } } } },
  });

  return (
    <AppShell active="decks" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Decks</h1>
          <div className="topbar-subtitle">{decks.length} {decks.length === 1 ? "deck" : "decks"}</div>
        </div>
        <div className="topbar-actions">
          <input type="search" placeholder="Search decks…" className="input" style={{ width: 220 }} />
          <Link href="/decks/new" className="btn btn-primary">
            <IconPlus />
            New Deck
          </Link>
        </div>
      </div>

      <div className="page-pad">
        {decks.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No decks yet — build your first one.</p>
        ) : (
          <div className="grid grid-3">
            {decks.map((d) => {
              const count = d.deckCards.reduce((s, dc) => s + dc.quantity, 0);
              const value = d.deckCards.reduce((s, dc) => s + Number(dc.card.currentValue ?? 0) * dc.quantity, 0);
              return (
                <Link key={d.id} href={`/decks/${d.id}`} className="tile" style={{ overflow: "hidden" }}>
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
                      <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                        {count} cards{d.format ? ` · ${d.format}` : ""} · {formatMoney(value)}
                      </div>
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-soft)" }}>
                      {relativeUpdated(d.updatedAt)}
                    </div>
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
