"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type DeckTile = {
  id: string;
  name: string;
  featuredImageUrl: string | null;
  meta: string;
  updatedLabel: string;
  verdict: "legal" | "illegal" | "unverified" | null;
  failCount: number;
};

export function DeckGridClient({ decks }: { decks: DeckTile[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return decks;
    return decks.filter((d) => d.name.toLowerCase().includes(term));
  }, [decks, q]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <input
          type="search"
          className="input"
          placeholder="Search decks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 220 }}
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No decks match &quot;{q}&quot;.</p>
      ) : (
        <div className="grid grid-3">
          {filtered.map((d) => (
            <Link key={d.id} href={`/decks/${d.id}`} className="tile surface-card" style={{ overflow: "hidden" }}>
              <div className="card-photo" style={{ aspectRatio: "2.5/1.4", borderRadius: 0 }}>
                {d.featuredImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.featuredImageUrl}
                    alt={d.name}
                    style={{ objectPosition: "top" }}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="card-photo-label">DECK COVER</span>
                )}
              </div>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 24, lineHeight: 1, textTransform: "uppercase", marginBottom: 6 }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{d.meta}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-soft)" }}>{d.updatedLabel}</span>
                  {d.verdict === "legal" && <span className="badge badge-good">Legal</span>}
                  {d.verdict === "illegal" && (
                    <span className="badge badge-bad">
                      {d.failCount} {d.failCount === 1 ? "problem" : "problems"}
                    </span>
                  )}
                  {d.verdict === "unverified" && <span className="badge badge-info">Unverified</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
