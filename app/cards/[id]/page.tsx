import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { RefreshPrice } from "@/components/RefreshPrice";

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const card = await prisma.card.findFirst({
    where: { id: params.id, userId },
    include: { binder: { select: { id: true, name: true } } },
  });
  if (!card) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const fields: [string, string][] = [
    ["Category", card.category],
    ["Set / Product", card.setName ?? "—"],
    ["Card #", card.cardNumber ?? "—"],
    ["Year", card.year ? String(card.year) : "—"],
    ["Team / Type", card.team ?? "—"],
    ["Rarity", card.rarity ?? "—"],
    ["Grading company", card.gradingCompany ?? "—"],
    ["Grade", card.grade ?? "—"],
    ["Quantity", String(card.quantity)],
    ["Purchase price", card.purchasePrice ? formatMoney(card.purchasePrice) : "—"],
  ];

  return (
    <AppShell active="binders" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href={`/binders/${card.binder.id}`} className="back-link">
            ← {card.binder.name}
          </Link>
          <h1 className="topbar-title">{card.name}</h1>
        </div>
      </div>

      <div className="page-pad" style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="card-photo" style={{ width: 220, aspectRatio: "5/7", flex: "none" }}>
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt={card.name} />
          ) : (
            <span className="card-photo-label">CARD PHOTO</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <span className={`condition-pill condition-${card.condition}`}>{card.condition}</span>
          </div>

          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 24px" }}>
            {fields.map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <dt style={{ fontSize: 12.5, color: "var(--text-soft)" }}>{label}</dt>
                <dd style={{ fontSize: 13.5 }}>{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 6 }}>Current value</div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 24, marginBottom: 12 }}>
              {formatMoney(card.currentValue)}
            </div>
            <RefreshPrice cardId={card.id} />
          </div>

          {card.notes && (
            <div>
              <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 6 }}>Notes</div>
              <p style={{ fontSize: 13.5, margin: 0, whiteSpace: "pre-wrap" }}>{card.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
