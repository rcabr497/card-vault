"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeckCardPicker, type PickerCard } from "./DeckCardPicker";
import { IconPlus } from "./icons";

export function AddCardToDeckDialog({ deckId, cards }: { deckId: string; cards: PickerCard[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (Object.keys(selected).length === 0) {
      setOpen(false);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/decks/${deckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards: Object.entries(selected).map(([cardId, quantity]) => ({ cardId, quantity })) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setOpen(false);
    setSelected({});
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <IconPlus />
        Add Card
      </button>

      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2>Add cards to deck</h2>
            {error && <div className="form-error">{error}</div>}
            <DeckCardPicker cards={cards} selected={selected} onChange={setSelected} />
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? "Adding…" : "Add to deck"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
