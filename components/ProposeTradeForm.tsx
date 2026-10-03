"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TradeCardPicker, type TradePickerCard } from "./TradeCardPicker";

export function ProposeTradeForm({ initialHandle, cards }: { initialHandle: string; cards: TradePickerCard[] }) {
  const router = useRouter();
  const [handle, setHandle] = useState(initialHandle);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (Object.keys(selected).length === 0) {
      setError("Pick at least one of your cards to offer.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientHandle: handle,
          note,
          cards: Object.entries(selected).map(([cardId, quantity]) => ({ cardId, quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        setSaving(false);
        return;
      }
      router.push(`/trades/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 720 }}>
      {error && <div className="form-error">{error}</div>}

      <div className="field" style={{ maxWidth: 360 }}>
        <label>Trade with</label>
        <div className="handle-input">
          <span style={{ fontWeight: 700, color: "var(--text-soft)" }}>@</span>
          <input
            className="input"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/^@/, "").toLowerCase())}
            placeholder="their_handle"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>You give</h2>
        <p style={{ fontSize: 13, color: "var(--text-soft)", margin: "0 0 12px" }}>
          Pick the cards you&apos;re offering. Leave it as a gift, or say what you&apos;d like in return below — they&apos;ll add
          their side when they respond.
        </p>
        <TradeCardPicker cards={cards} selected={selected} onChange={setSelected} />
      </div>

      <div className="field">
        <label>Note (optional)</label>
        <textarea
          className="input"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Looking for your Charizard ex — or it's a gift!"
        />
      </div>

      <div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Sending…" : "Send trade offer"}
        </button>
      </div>
    </form>
  );
}
