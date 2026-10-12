import Link from "next/link";

const GAME_LABELS: Record<string, string> = { pokemon: "Pokémon", mtg: "Magic", sports: "Sports", other: "Other" };
const GAME_TINTS: Record<string, string> = { pokemon: "#f3e3b3", mtg: "#dcd5f2", sports: "#cfe5df", other: "#e9e3d6" };

export function gameTint(category: string | null | undefined): string {
  return GAME_TINTS[category ?? "other"] ?? GAME_TINTS.other;
}

// Card art (or a tinted placeholder labelled with its game), name, and a meta row.
export function CardTile({
  href,
  name,
  imageUrl,
  category,
  meta,
  value,
  badge,
  note,
  showGame = true,
  style,
}: {
  href: string;
  name: string;
  imageUrl: string | null | undefined;
  category?: string | null;
  meta?: string | null;
  value?: string | null;
  badge?: React.ReactNode;
  // A short line under the name, e.g. why the card breaks a deck rule.
  note?: { text: string; tone: "bad" | "info" } | null;
  showGame?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Link href={href} className="tile" style={{ gap: 8, ...style }}>
      <div className="card-photo" style={{ background: imageUrl ? undefined : gameTint(category) }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} loading="lazy" decoding="async" />
        ) : (
          <>
            {showGame && category && (
              <span className="card-game-chip">{GAME_LABELS[category] ?? "Other"}</span>
            )}
            <span className="card-photo-label">NO PHOTO</span>
          </>
        )}
        {badge}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
      {note && (
        <div style={{ fontSize: 13, fontWeight: 700, color: note.tone === "bad" ? "var(--accent2-ink)" : "var(--accent-ink)" }}>
          {note.text}
        </div>
      )}
      {(meta || value) && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
          <span style={{ color: "var(--text-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta}</span>
          {value && <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{value}</span>}
        </div>
      )}
    </Link>
  );
}
