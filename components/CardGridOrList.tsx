"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "./icons";

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

export function CardGridOrList({
  cards,
  q,
  page,
  totalPages,
  basePath,
}: {
  cards: CardListItem[];
  q: string;
  page: number;
  totalPages: number;
  basePath: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [value, setValue] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value === q) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams({ page: "1" });
      if (value.trim()) params.set("q", value.trim());
      router.push(`${basePath}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const linkWith = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ page: String(page), ...overrides });
    if (!params.get("q")) params.delete("q");
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 14, flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, margin: 0 }}>All cards</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="search"
            className="input"
            placeholder="Search your collection…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
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
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
          {q ? <>No cards match &quot;{q}&quot;.</> : "No cards logged yet."}
        </p>
      ) : view === "grid" ? (
        <div className="grid grid-3">
          {cards.map((c) => (
            <Link key={c.id} href={`/cards/${c.id}`} className="tile" style={{ padding: 12, gap: 8 }}>
              <div className="card-photo">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} loading="lazy" decoding="async" />
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
          {cards.map((c, i) => (
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
                  <img src={c.imageUrl} alt={c.name} loading="lazy" decoding="async" />
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

      {totalPages > 1 && (
        <div className="pager">
          <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}>
            Page {page} of {totalPages}
          </span>
          <div className="pager-controls">
            <Link href={linkWith({ page: String(Math.max(1, page - 1)) })} className="pager-btn">
              <IconChevronLeft />
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={linkWith({ page: String(p) })} className={`pager-btn${p === page ? " active" : ""}`}>
                {p}
              </Link>
            ))}
            <Link href={linkWith({ page: String(Math.min(totalPages, page + 1)) })} className="pager-btn">
              <IconChevronRight />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
