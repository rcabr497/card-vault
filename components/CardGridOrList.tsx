"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconChevronLeft, IconChevronRight, IconSearch } from "./icons";
import { EmptyState } from "./EmptyState";
import { CardTile, gameTint } from "./CardTile";

export type CardListItem = {
  id: string;
  name: string;
  category: string;
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
  extraParams = {},
  toolbar,
}: {
  cards: CardListItem[];
  q: string;
  page: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string>;
  // Filter chips and controls shown under the search row.
  toolbar?: React.ReactNode;
}) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [value, setValue] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value === q) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams({ ...extraParams, page: "1" });
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.push(`${basePath}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const linkWith = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ ...extraParams, ...(q ? { q } : {}), page: String(page), ...overrides });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label className="search-field">
          <IconSearch />
          <span className="visually-hidden">Search your cards</span>
          <input type="search" placeholder="Search your cards" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <div className="segmented" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
            Grid
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
            List
          </button>
        </div>
      </div>

      {toolbar}

      {cards.length === 0 ? (
        q || Object.keys(extraParams).length > 0 ? (
          <EmptyState
            title="No matching cards"
            body={q ? `Nothing in your collection matches “${q}” with these filters.` : "Nothing in your collection matches these filters."}
            action={{ href: basePath, label: "Clear filters" }}
          />
        ) : (
          <EmptyState
            title="Your collection is empty"
            body="Scan a card with your camera, upload a photo, or look one up by name to get started."
            action={{ href: "/cards/new", label: "Add your first card" }}
          />
        )
      ) : view === "grid" ? (
        <div className="card-grid">
          {cards.map((c) => (
            <CardTile
              key={c.id}
              href={`/cards/${c.id}`}
              name={c.name}
              imageUrl={c.imageUrl}
              category={c.category}
              meta={c.setName ?? c.cardNumber ?? "—"}
              value={c.currentValue}
            />
          ))}
        </div>
      ) : (
        <div className="surface-card list-card">
          {cards.map((c) => (
            <Link key={c.id} href={`/cards/${c.id}`} className="list-row" style={{ justifyContent: "flex-start" }}>
              <div className="card-photo" style={{ width: 34, flex: "none", borderRadius: 5, background: c.imageUrl ? undefined : gameTint(c.category) }}>
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" loading="lazy" decoding="async" />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</strong>
                <span style={{ fontSize: 13, color: "var(--text-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {[c.setName, c.binderName !== "—" ? c.binderName : null].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
              <span className={`condition-pill condition-${c.condition}`}>{c.condition}</span>
              <strong style={{ width: 64, textAlign: "right", flex: "none" }}>{c.currentValue}</strong>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pager">
          <span style={{ fontSize: 13, color: "var(--text-soft)" }}>
            Page {page} of {totalPages}
          </span>
          <div className="pager-controls">
            <Link href={linkWith({ page: String(Math.max(1, page - 1)) })} className="pager-btn" aria-label="Previous page">
              <IconChevronLeft />
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={linkWith({ page: String(p) })} className={`pager-btn${p === page ? " active" : ""}`}>
                {p}
              </Link>
            ))}
            <Link href={linkWith({ page: String(Math.min(totalPages, page + 1)) })} className="pager-btn" aria-label="Next page">
              <IconChevronRight />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
