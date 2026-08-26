"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconChevronRight } from "./icons";

export type BinderTile = {
  id: string;
  name: string;
  count: number;
  value: string;
  swatches: (string | null)[];
  updatedLabel: string;
};

export function BinderGridClient({ binders }: { binders: BinderTile[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return binders;
    return binders.filter((b) => b.name.toLowerCase().includes(term));
  }, [binders, q]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <input
          type="search"
          className="input"
          placeholder="Search binders…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 220 }}
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No binders match &quot;{q}&quot;.</p>
      ) : (
        <div className="grid grid-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/binders/${b.id}`} className="tile" style={{ padding: 20, gap: 14 }}>
              <div style={{ display: "flex", gap: 6, height: 64 }}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const imageUrl = b.swatches[i];
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        overflow: "hidden",
                        backgroundImage: imageUrl ? undefined : "repeating-linear-gradient(135deg, #e2ddd2 0 5px, #cfc7b7 5px 10px)",
                      }}
                    >
                      {imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  {b.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                  {b.count} cards · {b.value}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--divider)",
                  paddingTop: 12,
                }}
              >
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-soft)" }}>{b.updatedLabel}</span>
                <span style={{ color: "var(--accent-ink)" }}>
                  <IconChevronRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
