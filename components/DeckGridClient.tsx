"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type DeckTile = {
  id: string;
  name: string;
  featuredImageUrl: string | null;
  meta: string;
  updatedLabel: string;
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
            <Link key={d.id} href={`/decks/${d.id}`} className="tile" style={{ overflow: "hidden" }}>
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
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{d.meta}</div>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-soft)" }}>{d.updatedLabel}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
