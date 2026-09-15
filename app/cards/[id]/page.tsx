import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { RefreshPrice } from "@/components/RefreshPrice";
import { DeleteCardButton } from "@/components/DeleteCardButton";

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const card = await prisma.card.findFirst({
    where: { id: params.id, userId },
  });
  if (!card) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const heroImage = card.thumbnailUrl ?? card.imageUrl;
  // A captured/uploaded photo only earns its own gallery entry when it's
  // genuinely distinct from the official art now shown as the hero — manual
  // lookups have thumbnailUrl === imageUrl (the same official image reused
  // for both), so no redundant gallery shows for those.
  const showGallery = !!card.thumbnailUrl && !!card.imageUrl && card.imageUrl !== card.thumbnailUrl;

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
          <Link href="/binders" className="back-link">
            ← All binders
          </Link>
          <h1 className="topbar-title">{card.name}</h1>
        </div>
        <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
          <Link href={`/cards/${card.id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <DeleteCardButton cardId={card.id} />
        </div>
      </div>

      <div className="page-pad" style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "none" }}>
          <div className="card-photo" style={{ width: 220, aspectRatio: "5/7" }}>
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt={card.name} loading="lazy" decoding="async" />
            ) : (
              <span className="card-photo-label">CARD PHOTO</span>
            )}
          </div>

          {showGallery && (
            <div>
              <div style={{ fontSize: 11, color: "var(--text-soft)", marginBottom: 6 }}>Your photo</div>
              <div className="card-photo" style={{ width: 90, aspectRatio: "5/7" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.imageUrl!} alt={`${card.name} — your photo`} loading="lazy" decoding="async" />
              </div>
            </div>
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
