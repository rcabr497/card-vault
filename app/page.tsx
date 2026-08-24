import Link from "next/link";
import { IconLayers, IconTrendUp, IconScan, IconBarChart, IconArrowRight } from "@/components/icons";
import { getPublicShowcase } from "@/lib/stats";

export const revalidate = 300;

const TILE_COLORS = [
  "oklch(45% 0.14 255)",
  "oklch(48% 0.16 25)",
  "oklch(45% 0.13 145)",
  "oklch(42% 0.02 40)",
  "oklch(50% 0.15 300)",
  "oklch(55% 0.17 60)",
];

const FALLBACK_CARDS = [
  { name: "M. Torres", team: "Riverside Larks", teamColor: "oklch(45% 0.14 255)", value: "$42.00", cond: "NM" },
  { name: "D. Ferris", team: "Portside Anchors", teamColor: "oklch(48% 0.16 25)", value: "$8.50", cond: "LP" },
  { name: "J. Alden", team: "Cascade Timbers", teamColor: "oklch(45% 0.13 145)", value: "$120.00", cond: "MINT" },
  { name: "R. Cole", team: "Prairie Wolves", teamColor: "oklch(42% 0.02 40)", value: "$3.25", cond: "NM" },
  { name: "T. Nakamura", team: "Harbor Kings", teamColor: "oklch(50% 0.15 300)", value: "$16.00", cond: "EX" },
  { name: "S. Ibarra", team: "Summit Comets", teamColor: "oklch(55% 0.17 60)", value: "$64.00", cond: "NM" },
];
const FALLBACK_CARDS_LOGGED = "1,204";
const FALLBACK_TOTAL_VALUE = "$18,340";

const FEATURES = [
  {
    icon: <IconLayers />,
    title: "Inventory tracking",
    body: "Log every card once. See your whole collection sorted, searchable, and never double-counted.",
    tone: "accent" as const,
  },
  {
    icon: <IconTrendUp />,
    title: "Value tracking",
    body: "Live market pricing keeps your collection's worth up to date, card by card.",
    tone: "accent" as const,
  },
  {
    icon: <IconScan />,
    title: "Photo scanning",
    body: "Snap a photo — Card Vault fills in the name, set, and condition.",
    tone: "accent3" as const,
  },
  {
    icon: <IconBarChart />,
    title: "Stats & insights",
    body: "Track growth, spot your priciest pulls, and see your collection at a glance.",
    tone: "accent" as const,
  },
];

export default async function LandingPage() {
  const showcase = await getPublicShowcase();
  const vaultCards = showcase
    ? showcase.cards.map((c, i) => ({
        name: c.name,
        team: c.label,
        teamColor: TILE_COLORS[i % TILE_COLORS.length],
        value: c.value,
        cond: c.condition,
      }))
    : FALLBACK_CARDS;
  const cardsLogged = showcase ? showcase.cardsLogged.toLocaleString() : FALLBACK_CARDS_LOGGED;
  const totalValue = showcase ? showcase.totalValue : FALLBACK_TOTAL_VALUE;

  return (
    <div>
      <nav className="nav">
        <Link href="#top" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)" }}>
          <span className="brand-mark" style={{ width: 32, height: 32 }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19 }}>Card Vault</span>
        </Link>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#vault">The vault</a>
        </div>
        <Link href="/signup" className="btn btn-primary">
          Sign Up
        </Link>
      </nav>

      <section id="top" className="hero">
        <div>
          <div className="eyebrow-pill">For hobbyist collectors</div>
          <h1>Know what&apos;s in your binder.</h1>
          <p style={{ fontSize: 17, maxWidth: "46ch", color: "var(--text-soft)", margin: "0 0 32px" }}>
            Card Vault logs every pull, tracks what it&apos;s worth today, and turns your shoebox of cards into a
            collection you can actually search. Built for people who&apos;d rather be sorting cards than
            spreadsheets.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Sign Up
            </Link>
            <a
              href="#features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--accent-ink)",
                padding: "14px 6px",
              }}
            >
              See how it works
              <IconArrowRight />
            </a>
          </div>
        </div>

        <div id="vault" className="surface-card" style={{ padding: 24, boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14 }}>Your Vault</span>
            <span style={{ fontSize: 11.5, color: "var(--text-soft)" }}>Updated just now</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {vaultCards.map((c) => (
              <div
                key={c.name}
                style={{
                  background: "var(--surface-2)",
                  borderRadius: 8,
                  border: "1px solid var(--divider)",
                  overflow: "hidden",
                }}
              >
                <div style={{ height: 6, background: c.teamColor }} />
                <div className="card-photo" style={{ aspectRatio: "5/7" }}>
                  <span className="card-photo-label">CARD PHOTO</span>
                </div>
                <div style={{ padding: "8px 4px 2px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 10.5 }}>{c.name}</div>
                  <div style={{ fontSize: 9, color: "var(--text-soft)", marginBottom: 6 }}>{c.team}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{c.value}</span>
                    <span className={`condition-pill condition-${c.cond}`}>{c.cond}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid var(--divider)",
              paddingTop: 14,
              fontSize: 13,
            }}
          >
            <span>
              <strong style={{ fontFamily: "var(--font-heading)" }}>{cardsLogged}</strong> cards logged
            </span>
            <span>
              <strong style={{ fontFamily: "var(--font-heading)", color: "var(--accent-ink)" }}>{totalValue}</strong>{" "}
              total value
            </span>
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: "16px 48px 88px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 12 }}>
          What you get
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 34, margin: "0 0 48px", maxWidth: "20ch" }}>
          Built for the shoebox-to-spreadsheet leap.
        </h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div
                className="feature-icon"
                style={{
                  background: f.tone === "accent" ? "var(--accent-light)" : "var(--accent3-light)",
                  color: f.tone === "accent" ? "var(--accent-ink)" : "var(--accent3-ink)",
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px" }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: "var(--text-soft)", margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <h2 style={{ fontWeight: 800, fontSize: 36, margin: 0, maxWidth: "16ch" }}>
          Stop guessing what&apos;s in the box.
        </h2>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
          <Link
            href="/signup"
            className="btn"
            style={{ background: "var(--bg)", color: "var(--accent-ink)", fontSize: 15, padding: "14px 28px" }}
          >
            Sign Up
          </Link>
          <span style={{ fontSize: 12.5, opacity: 0.9 }}>Free to start. No card left behind.</span>
        </div>
      </section>

      <footer style={{ padding: "24px 48px 40px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14 }}>Card Vault</span>
        <Link href="/changelog" style={{ fontSize: 12, color: "var(--text-soft)" }}>
          Changelog
        </Link>
        <span style={{ fontSize: 12, color: "var(--text-soft)", marginLeft: "auto" }}>
          © 2026 Card Vault. Built for collectors, by collectors.
        </span>
      </footer>
    </div>
  );
}
