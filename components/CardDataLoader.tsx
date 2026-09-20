"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// auto: fetch CardSight's full record once on mount (cards that have none yet).
// Otherwise renders a small "Refresh data" action for cards that already do.
export function CardDataLoader({ cardId, auto }: { cardId: string; auto: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(auto);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards/${cardId}/details`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!auto || started.current) return;
    started.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {auto && busy && <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}>Loading card data…</span>}
      {error && <span className="form-error">{error}</span>}
      {(!auto || error) && (
        <button type="button" className="pill" onClick={load} disabled={busy}>
          {busy ? "Loading…" : auto ? "Try again" : "Refresh data"}
        </button>
      )}
    </div>
  );
}
