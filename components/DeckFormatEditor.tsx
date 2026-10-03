"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeckFormatField } from "./DeckFormatField";

export function DeckFormatEditor({ deckId, initialFormat }: { deckId: string; initialFormat: string }) {
  const router = useRouter();
  const [format, setFormat] = useState(initialFormat);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: format.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't save the format. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button type="button" className="pill" onClick={() => setEditing(true)}>
        {initialFormat ? "Change format" : "Choose format"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && <div className="form-error">{error}</div>}
      <DeckFormatField id="deck-format" value={format} onChange={setFormat} />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setFormat(initialFormat);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
