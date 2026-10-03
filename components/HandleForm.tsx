"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Pick or change your public trading handle.
export function HandleForm({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [handle, setHandle] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/handle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      setHandle(data.handle);
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
      <div className="handle-input">
        <span style={{ fontWeight: 700, color: "var(--text-soft)" }}>@</span>
        <input
          className="input"
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/^@/, "").toLowerCase())}
          placeholder="ash_ketchum"
          maxLength={20}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Trading handle"
          required
        />
        <button type="submit" className="btn btn-primary" disabled={saving || handle === (initial ?? "")}>
          {saving ? "Saving…" : initial ? "Change" : "Save"}
        </button>
      </div>
      <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}>
        {saved ? "Saved." : "3–20 lowercase letters, numbers, or underscores. This is the only name other traders see."}
      </span>
    </form>
  );
}
