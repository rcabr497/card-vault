"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// auto: fetch CardSight's full record once on mount (cards that have none yet),
// showing a skeleton in the space the data will fill. Otherwise renders a small
// "Refresh data" action for cards that already have it.
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

  if (auto) {
    return (
      <div role="status" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {busy && (
          <>
            <span className="visually-hidden">Loading card data…</span>
            <div className="skeleton-grid" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="surface-card skeleton-card">
                  <div className="skeleton-line" style={{ width: "40%" }} />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" style={{ width: "85%" }} />
                  <div className="skeleton-line" style={{ width: "60%" }} />
                </div>
              ))}
            </div>
          </>
        )}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="form-error">{error}</span>
            <button type="button" className="pill" onClick={load} disabled={busy}>
              {busy ? "Loading…" : "Try again"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {error && <span className="form-error">{error}</span>}
      <button type="button" className="pill" onClick={load} disabled={busy}>
        {busy ? "Loading…" : "Refresh data"}
      </button>
    </div>
  );
}
