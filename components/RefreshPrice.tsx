"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshPrice({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function checkPrice() {
    setBusy(true);
    setStatus("Checking price…");
    setEstimate(null);
    try {
      const res = await fetch(`/api/cards/${cardId}/refresh-price`);
      const data = await res.json();
      if (typeof data.estimatedValue === "number") {
        setEstimate(data.estimatedValue);
        setStatus(data.source === "cardsight" ? "From CardSight's real sold/asking listings." : null);
      } else {
        setStatus("No market price found for this card.");
      }
    } catch {
      setStatus("Price check failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function applyValue() {
    if (estimate === null) return;
    setBusy(true);
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentValue: estimate }),
    });
    setBusy(false);
    setEstimate(null);
    setStatus("Value updated.");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <button type="button" className="btn btn-secondary" onClick={checkPrice} disabled={busy}>
        Refresh price
      </button>
      {estimate !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13.5 }}>Estimated market value: ${estimate.toFixed(2)}</span>
          <button type="button" className="pill pill-active" onClick={applyValue} disabled={busy}>
            Update to ${estimate.toFixed(2)}
          </button>
        </div>
      )}
      {status && <p style={{ fontSize: 12.5, color: "var(--text-soft)", margin: 0 }}>{status}</p>}
    </div>
  );
}
