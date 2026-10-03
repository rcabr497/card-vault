"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      setName(data.name);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label>Name</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
          <button type="submit" className="btn btn-primary" disabled={saving || name.trim() === initial}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {saved && <span style={{ fontSize: 13, color: "var(--text-soft)" }}>Saved.</span>}
    </form>
  );
}
