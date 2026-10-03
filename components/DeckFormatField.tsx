"use client";

import { useState } from "react";
import { DECK_FORMATS, GAME_LABELS, type DeckGame } from "@/lib/deckFormats";

const CUSTOM = "__custom";

// Pick one of the formats Card Vault can check, or type any other (casual,
// cube, a local house format) — those are saved but not checked.
export function DeckFormatField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const known = DECK_FORMATS.some((f) => f.label === value);
  const [custom, setCustom] = useState(!known && value !== "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <select
        id={id}
        className="input"
        value={custom ? CUSTOM : value}
        onChange={(e) => {
          const next = e.target.value;
          setCustom(next === CUSTOM);
          onChange(next === CUSTOM ? "" : next);
        }}
      >
        <option value="">No format</option>
        {(Object.keys(GAME_LABELS) as DeckGame[]).map((game) => (
          <optgroup key={game} label={GAME_LABELS[game]}>
            {DECK_FORMATS.filter((f) => f.game === game).map((f) => (
              <option key={f.id} value={f.label}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM}>Other…</option>
      </select>
      {custom && (
        <input
          className="input"
          aria-label="Format name"
          value={value}
          maxLength={60}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Cube, Kitchen table"
          autoFocus
        />
      )}
    </div>
  );
}
