import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { RefreshPrice } from "@/components/RefreshPrice";
import { DeleteCardButton } from "@/components/DeleteCardButton";
import { CardDataLoader } from "@/components/CardDataLoader";
import { parseCardDetails, presentCardDetails, type DetailRow, type DetailSection } from "@/lib/cardDetails";
import { ManaText } from "@/components/ManaText";
import { ZoomableImage } from "@/components/ZoomableImage";

// Where the visitor came from, so the back link and sidebar match. Only known
// in-app paths are honored (never an arbitrary URL).
function resolveFrom(from: string | undefined) {
  const path = from && /^\/(binders|decks|collection|dashboard)(\/[\w-]+)?(\?[\w=&%.+-]*)?$/.test(from) ? from : null;
  if (path?.startsWith("/binders/")) return { href: path, label: "← Back to binder", nav: "binders" as const };
  if (path?.startsWith("/decks/")) return { href: path, label: "← Back to deck", nav: "decks" as const };
  if (path?.startsWith("/dashboard")) return { href: "/dashboard", label: "← Dashboard", nav: "dashboard" as const };
  return { href: path ?? "/collection", label: "← Collection", nav: "collection" as const };
}

function DetailValue({ row }: { row: DetailRow }) {
  return row.mana ? <ManaText text={row.value} /> : <>{row.value}</>;
}

function DetailList({ rows }: { rows: DetailRow[] }) {
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: 0 }}>
      {rows.map((r, i) => (
        <div key={`${r.label}-${i}`} style={{ display: "contents" }}>
          <dt style={{ fontSize: 13, color: "var(--text-soft)" }}>{r.label}</dt>
          <dd style={{ fontSize: 14, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            <DetailValue row={r} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SectionCard({ s }: { s: DetailSection }) {
  const head = s.collapseAfter && s.rows.length > s.collapseAfter + 2 ? s.rows.slice(0, s.collapseAfter) : s.rows;
  const rest = s.rows.slice(head.length);
  return (
    <div className="surface-card" style={{ padding: 18, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{s.title}</div>
      {head.length > 0 && <DetailList rows={head} />}
      {rest.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--accent-ink)" }}>
            Show all {s.rows.length}
          </summary>
          <div style={{ marginTop: 10 }}>
            <DetailList rows={rest} />
          </div>
        </details>
      )}
      {s.chips && s.chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {s.chips.map((c) => (
            <span key={c.label} className={`chip${c.on ? " chip-on" : ""}`} title={c.on ? "Legal" : "Not legal"}>
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function CardDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;

  const card = await prisma.card.findFirst({
    where: { id: params.id, userId },
  });
  if (!card) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const back = resolveFrom(searchParams.from);

  const heroImage = card.thumbnailUrl ?? card.imageUrl;
  // A captured/uploaded photo only earns its own gallery entry when it's
  // genuinely distinct from the official art now shown as the hero — manual
  // lookups have thumbnailUrl === imageUrl (the same official image reused
  // for both), so no redundant gallery shows for those.
  const showGallery = !!card.thumbnailUrl && !!card.imageUrl && card.imageUrl !== card.thumbnailUrl;

  const details = parseCardDetails(card.metadataJson);
  const presented = details
    ? presentCardDetails(details, card.category, [card.setName, card.cardNumber, card.year, card.rarity])
    : null;
  const primarySections = presented?.sections.filter((s) => s.primary) ?? [];
  const otherSections = presented?.sections.filter((s) => !s.primary) ?? [];
  // Scanned cards from before we kept the provider's full record get it fetched
  // once, on first view.
  const needsDetails = !details && !!card.cardSightId;

  // Only rows that have a value — no wall of "—" — except the always-relevant ones.
  const fields: [string, string][] = (
    [
      ["Category", card.category],
      ["Set / Product", card.setName],
      ["Card #", card.cardNumber],
      ["Year", card.year ? String(card.year) : null],
      ["Team / Type", card.team],
      ["Rarity", card.rarity],
      ["Grading company", card.gradingCompany],
      ["Grade", card.grade],
      ["Quantity", String(card.quantity)],
      ["Purchase price", card.purchasePrice ? formatMoney(card.purchasePrice) : null],
    ] as [string, string | null][]
  ).filter((f): f is [string, string] => !!f[1]);

  return (
    <AppShell active={back.nav} user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href={back.href} className="back-link">
            {back.label}
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
              <ZoomableImage src={heroImage} alt={card.name} />
            ) : (
              <span className="card-photo-label">CARD PHOTO</span>
            )}
          </div>

          {showGallery && (
            <div>
              <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 6 }}>Your photo</div>
              <div className="card-photo" style={{ width: 90, aspectRatio: "5/7" }}>
                <ZoomableImage src={card.imageUrl!} alt={`${card.name} — your photo`} />
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <span className={`condition-pill condition-${card.condition}`}>{card.condition}</span>
            </div>
            <div>
              <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 2 }}>Current value</div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 34, lineHeight: 1.15, marginBottom: 12 }}>
                {formatMoney(card.currentValue)}
              </div>
              <RefreshPrice cardId={card.id} />
            </div>
          </div>

          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 24px" }}>
            {fields.map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <dt style={{ fontSize: 13.5, color: "var(--text-soft)" }}>{label}</dt>
                <dd style={{ fontSize: 14.5 }}>{value}</dd>
              </div>
            ))}
          </dl>

          {card.notes && (
            <div>
              <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 6 }}>Notes</div>
              <p style={{ fontSize: 14.5, margin: 0, whiteSpace: "pre-wrap" }}>{card.notes}</p>
            </div>
          )}
        </div>

        {(presented || needsDetails) && (
          <div style={{ flexBasis: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 19, margin: 0 }}>Card data</h2>
              {presented && (
                <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
                  From {presented.sourceLabel} ·{" "}
                  {new Date(presented.fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {details?.source === "cardsight" && <CardDataLoader cardId={card.id} auto={false} />}
            </div>

            {needsDetails && <CardDataLoader cardId={card.id} auto />}

            {primarySections.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
                {primarySections.map((s) => (
                  <SectionCard key={s.title} s={s} />
                ))}
              </div>
            )}

            {otherSections.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 16 }}>
                {otherSections.map((s) => (
                  <SectionCard key={s.title} s={s} />
                ))}
              </div>
            )}

            {presented && presented.raw.length > 0 && (
              <details className="surface-card" style={{ padding: 18 }}>
                <summary style={{ fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  All raw fields ({presented.raw.length})
                </summary>
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: "14px 0 0" }}>
                  {presented.raw.map((r, i) => (
                    <div key={`${r.label}-${i}`} style={{ display: "contents" }}>
                      <dt style={{ fontSize: 12.5, color: "var(--text-soft)", fontFamily: "monospace", overflowWrap: "anywhere" }}>
                        {r.label}
                      </dt>
                      <dd style={{ fontSize: 13.5, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
