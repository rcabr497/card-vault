"use client";

import { useMemo, useState } from "react";

export type PickerCard = { id: string; name: string; setName: string | null };

export function DeckCardPicker({
  cards,
  selected,
  onChange,
}: {
  cards: PickerCard[];
  selected: Record<string, number>;
  onChange: (selected: Record<string, number>) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return cards;
    return cards.filter((c) => c.name.toLowerCase().includes(term));
  }, [cards, q]);

  function toggle(cardId: string) {
    const next = { ...selected };
    if (next[cardId]) {
      delete next[cardId];
    } else {
      next[cardId] = 1;
    }
    onChange(next);
  }

  function setQty(cardId: string, qty: number) {
    onChange({ ...selected, [cardId]: Math.max(1, qty) });
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="surface-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Search your cards…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: "1 1 180px", minWidth: 140, maxWidth: 260 }}
        />
        <span style={{ fontSize: 12.5, color: "var(--text-soft)", whiteSpace: "nowrap" }}>{selectedCount} selected</span>
      </div>

      {cards.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
          You don&apos;t have any cards yet — add some to a binder first.
        </p>
      ) : (
        <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {filtered.map((c, i) => (
            <label
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 4px",
                borderTop: i === 0 ? "none" : "1px solid var(--divider)",
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={!!selected[c.id]} onChange={() => toggle(c.id)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name}
                </div>
                {c.setName && <div style={{ fontSize: 11, color: "var(--text-soft)" }}>{c.setName}</div>}
              </div>
              {selected[c.id] ? (
                <input
                  type="number"
                  min={1}
                  className="input"
                  style={{ width: 60, minHeight: 32, padding: "4px 8px" }}
                  value={selected[c.id]}
                  onClick={(e) => e.preventDefault()}
                  onChange={(e) => setQty(c.id, Number(e.target.value))}
                />
              ) : null}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
