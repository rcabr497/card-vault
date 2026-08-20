"use client";

import { useState } from "react";

export function DeckNotes({ deckId, initialNotes }: { deckId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/decks/${deckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div>
        <p style={{ fontSize: 13, color: "var(--text-soft)", margin: 0, whiteSpace: "pre-wrap" }}>
          {notes || "No notes yet."}
        </p>
        <button type="button" className="pill" style={{ marginTop: 10 }} onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea className="input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
