"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CardListItem = {
  id: string;
  name: string;
  setName: string | null;
  cardNumber: string | null;
  condition: string;
  currentValue: string;
  imageUrl: string | null;
  binderName: string;
};

export function CardGridOrList({ cards }: { cards: CardListItem[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return cards;
    return cards.filter((c) => c.name.toLowerCase().includes(term));
  }, [cards, q]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 14, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, margin: 0 }}>All cards</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="search"
            className="input"
            placeholder="Search your collection…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 220 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className={`pill${view === "grid" ? " pill-active" : ""}`}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              type="button"
              className={`pill${view === "list" ? " pill-active" : ""}`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No cards logged yet.</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No cards match &quot;{q}&quot;.</p>
      ) : view === "grid" ? (
        <div className="grid grid-5">
          {filtered.map((c) => (
            <Link key={c.id} href={`/cards/${c.id}`} className="tile" style={{ padding: 12, gap: 8 }}>
              <div className="card-photo">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} />
                ) : (
                  <span className="card-photo-label">CARD PHOTO</span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-soft)" }}>{c.cardNumber ?? c.setName ?? "—"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`condition-pill condition-${c.condition}`}>{c.condition}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-ink)" }}>{c.currentValue}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="surface-card" style={{ overflow: "hidden" }}>
          {filtered.map((c, i) => (
            <Link
              key={c.id}
              href={`/cards/${c.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 18px",
                borderTop: i === 0 ? "none" : "1px solid var(--divider)",
                color: "var(--text)",
              }}
            >
              <div className="card-photo" style={{ width: 32, aspectRatio: "5/7", flex: "none" }}>
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-soft)", width: 160 }}>{c.binderName}</div>
              <span className={`condition-pill condition-${c.condition}`}>{c.condition}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-ink)", width: 70, textAlign: "right" }}>
                {c.currentValue}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
