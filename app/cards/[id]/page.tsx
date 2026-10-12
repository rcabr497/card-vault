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
import { categoryLabel, rarityLabel, teamFieldLabel, teamLabel } from "@/lib/cardLabels";
import { gameTint } from "@/components/CardTile";
import { IconChevronRight } from "@/components/icons";

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
      <h3 style={{ fontSize: 19, marginBottom: 12 }}>{s.title}</h3>
      {head.length > 0 && <DetailList rows={head} />}
      {rest.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 13.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
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
            <span key={c.label} className={`chip${c.on ? " chip-on" : ""}`}>
              {c.on ? "✓ " : ""}
              {c.label}
              <span className="visually-hidden">{c.on ? " — legal" : " — not legal"}</span>
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
    include: {
      binderCards: { include: { binder: { select: { id: true, name: true } } } },
      deckCards: { include: { deck: { select: { id: true, name: true } } } },
    },
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
      ["Year", card.year ? String(card.year) : null],
      [teamFieldLabel(card.category), teamLabel(card.category, card.team)],
      ["Grading company", card.gradingCompany],
      ["Grade", card.grade],
    ] as [string, string | null][]
  ).filter((f): f is [string, string] => !!f[1]);

  const metaLine = [card.setName, card.cardNumber ? `#${card.cardNumber}` : null, rarityLabel(card.rarity)].filter(Boolean).join(" · ");
  const homes = [
    ...card.binderCards.map((bc) => ({ key: `b-${bc.binder.id}`, kind: "Binder", name: bc.binder.name, href: `/binders/${bc.binder.id}` })),
    ...card.deckCards.map((dc) => ({ key: `d-${dc.deck.id}`, kind: "Deck", name: `${dc.deck.name} (×${dc.quantity})`, href: `/decks/${dc.deck.id}` })),
  ];

  return (
    <AppShell active={back.nav} user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar" style={{ paddingBottom: 8 }}>
        <Link href={back.href} className="back-link" style={{ margin: 0 }}>
          {back.label}
        </Link>
        <div className="topbar-actions">
          <Link href={`/cards/${card.id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <DeleteCardButton cardId={card.id} />
        </div>
      </div>

      <div className="page-pad card-page">
        <div className="card-hero">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <div className="card-photo card-hero-image" style={{ background: heroImage ? undefined : gameTint(card.category) }}>
              {heroImage ? <ZoomableImage src={heroImage} alt={card.name} /> : <span className="card-photo-label">NO PHOTO</span>}
            </div>
            {showGallery && (
              <div style={{ alignSelf: "flex-start" }}>
                <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 6 }}>Your photo</div>
                <div className="card-photo" style={{ width: 90 }}>
                  <ZoomableImage src={card.imageUrl!} alt={`${card.name} — your photo`} />
                </div>
              </div>
            )}
          </div>

          <div className="card-hero-info">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h1 className="card-title">{card.name}</h1>
              {metaLine && <div style={{ color: "var(--text-soft)", fontSize: 15.5 }}>{metaLine}</div>}
              <div className="card-chips">
                <span className="badge badge-outline">{categoryLabel(card.category)}</span>
                <span className={`badge condition-${card.condition}`}>{card.condition}</span>
                {card.quantity > 1 && <span className="badge badge-outline">×{card.quantity}</span>}
                {card.gradingCompany && card.grade && (
                  <span className="badge badge-good">
                    {card.gradingCompany} {card.grade}
                  </span>
                )}
              </div>
            </div>

            <section aria-label="Value" className="ink-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="value-band-label">Market value</div>
                <div className="num-display" style={{ fontSize: 52 }}>
                  {formatMoney(card.currentValue)}
                </div>
              </div>
              {card.purchasePrice && (
                <div style={{ fontSize: 14, color: "var(--ink-soft)", borderTop: "1px solid #2e323b", paddingTop: 12 }}>
                  Paid <strong style={{ color: "#fff" }}>{formatMoney(card.purchasePrice)}</strong>
                </div>
              )}
              <RefreshPrice cardId={card.id} onDark />
            </section>

            {fields.length > 0 && (
              <dl className="surface-card card-facts">
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <section aria-label="Where it lives" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 className="section-title">Where it lives</h2>
              {homes.length === 0 ? (
                <p style={{ color: "var(--text-soft)" }}>Not in a binder or deck yet.</p>
              ) : (
                <div className="surface-card list-card">
                  {homes.map((h) => (
                    <Link key={h.key} href={h.href} className="list-row">
                      <span>
                        <span style={{ color: "var(--text-soft)" }}>{h.kind}</span> · <strong>{h.name}</strong>
                      </span>
                      <IconChevronRight size={16} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {card.notes && (
              <section aria-label="Notes" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 className="section-title">Notes</h2>
                <p style={{ fontSize: 15, margin: 0, whiteSpace: "pre-wrap" }}>{card.notes}</p>
              </section>
            )}
          </div>
        </div>

        {(presented || needsDetails) && (
          <div style={{ flexBasis: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h2 className="section-title">Card data</h2>
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
