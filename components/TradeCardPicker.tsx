"use client";

import { useMemo, useState } from "react";

export type TradePickerCard = {
  id: string;
  name: string;
  setName: string | null;
  imageUrl: string | null;
  // Copies not already promised in another trade.
  available: number;
};

// Pick cards (and how many copies) from your own collection for a trade.
export function TradeCardPicker({
  cards,
  selected,
  onChange,
}: {
  cards: TradePickerCard[];
  selected: Record<string, number>;
  onChange: (selected: Record<string, number>) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return cards;
    return cards.filter((c) => c.name.toLowerCase().includes(term) || (c.setName ?? "").toLowerCase().includes(term));
  }, [cards, q]);

  function toggle(card: TradePickerCard) {
    const next = { ...selected };
    if (next[card.id]) delete next[card.id];
    else next[card.id] = 1;
    onChange(next);
  }

  function setQty(card: TradePickerCard, qty: number) {
    onChange({ ...selected, [card.id]: Math.min(card.available, Math.max(1, Math.floor(qty) || 1)) });
  }

  return (
    <div className="surface-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Search your cards…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: "1 1 180px", minWidth: 140, maxWidth: 280 }}
        />
        <span style={{ fontSize: 12.5, color: "var(--text-soft)", whiteSpace: "nowrap" }}>
          {Object.keys(selected).length} selected
        </span>
      </div>

      {cards.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>You don&apos;t have any cards yet.</p>
      ) : (
        <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {filtered.map((c) => {
            const unavailable = c.available <= 0 && !selected[c.id];
            return (
              <label
                key={c.id}
                className="trade-item"
                style={{ cursor: unavailable ? "not-allowed" : "pointer", opacity: unavailable ? 0.55 : 1 }}
              >
                <input type="checkbox" checked={!!selected[c.id]} disabled={unavailable} onChange={() => toggle(c)} />
                <div className="card-photo" style={{ width: 34, flex: "none" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" decoding="async" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                    {[c.setName, unavailable ? "In another trade" : `${c.available} available`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {selected[c.id] && c.available > 1 ? (
                  <input
                    type="number"
                    min={1}
                    max={c.available}
                    className="input"
                    aria-label={`Copies of ${c.name}`}
                    style={{ width: 64, minHeight: 32, padding: "4px 8px" }}
                    value={selected[c.id]}
                    onClick={(e) => e.preventDefault()}
                    onChange={(e) => setQty(c, Number(e.target.value))}
                  />
                ) : null}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
