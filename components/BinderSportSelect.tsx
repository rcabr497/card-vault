"use client";

import { useState } from "react";
import { updateBinderSport } from "@/app/binders/actions";

const SPORT_OPTIONS: { value: string; label: string }[] = [
  { value: "baseball", label: "Baseball" },
  { value: "basketball", label: "Basketball" },
  { value: "football", label: "Football" },
  { value: "hockey", label: "Hockey" },
  { value: "soccer", label: "Soccer" },
  { value: "mma", label: "MMA" },
];

export function BinderSportSelect({ binderId, initialSport }: { binderId: string; initialSport: string | null }) {
  const [sport, setSport] = useState(initialSport ?? "");
  const [busy, setBusy] = useState(false);

  async function handleChange(value: string) {
    setSport(value);
    setBusy(true);
    try {
      await updateBinderSport(binderId, value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      className="input"
      style={{ width: "auto", minHeight: 32, padding: "4px 10px", fontSize: 12.5 }}
      value={sport}
      disabled={busy}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="">No sport set</option>
      {SPORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
