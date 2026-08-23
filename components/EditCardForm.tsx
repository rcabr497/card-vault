"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "pokemon", label: "Pokémon" },
  { value: "mtg", label: "Magic: The Gathering" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

const CONDITIONS = ["NM", "LP", "EX", "MINT"];

type Fields = {
  name: string;
  category: string;
  setName: string;
  cardNumber: string;
  year: string;
  team: string;
  rarity: string;
  condition: string;
  gradingCompany: string;
  grade: string;
  quantity: string;
  purchasePrice: string;
  currentValue: string;
  notes: string;
};

export type EditableCard = {
  id: string;
  name: string;
  category: string;
  setName: string | null;
  cardNumber: string | null;
  year: number | null;
  team: string | null;
  rarity: string | null;
  condition: string;
  gradingCompany: string | null;
  grade: string | null;
  quantity: number;
  purchasePrice: string | null;
  currentValue: string | null;
  notes: string | null;
};

function toFields(card: EditableCard): Fields {
  return {
    name: card.name,
    category: card.category,
    setName: card.setName ?? "",
    cardNumber: card.cardNumber ?? "",
    year: card.year ? String(card.year) : "",
    team: card.team ?? "",
    rarity: card.rarity ?? "",
    condition: card.condition,
    gradingCompany: card.gradingCompany ?? "",
    grade: card.grade ?? "",
    quantity: String(card.quantity),
    purchasePrice: card.purchasePrice ? String(card.purchasePrice) : "",
    currentValue: card.currentValue ? String(card.currentValue) : "",
    notes: card.notes ?? "",
  };
}

export function EditCardForm({ card }: { card: EditableCard }) {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(() => toFields(card));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSaving(false);
        return;
      }
      router.push(`/cards/${card.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="field">
          <label>Card Name</label>
          <input className="input" value={fields.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="field">
          <label>Category</label>
          <select className="input" value={fields.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Set / Product</label>
          <input className="input" value={fields.setName} onChange={(e) => set("setName", e.target.value)} />
        </div>
        <div className="field">
          <label>Card #</label>
          <input className="input" value={fields.cardNumber} onChange={(e) => set("cardNumber", e.target.value)} />
        </div>
        <div className="field">
          <label>Year</label>
          <input className="input" value={fields.year} onChange={(e) => set("year", e.target.value)} maxLength={4} />
        </div>
        <div className="field">
          <label>Team / Type</label>
          <input className="input" value={fields.team} onChange={(e) => set("team", e.target.value)} />
        </div>
        <div className="field">
          <label>Rarity</label>
          <input className="input" value={fields.rarity} onChange={(e) => set("rarity", e.target.value)} />
        </div>
        <div className="field">
          <label>Condition</label>
          <select className="input" value={fields.condition} onChange={(e) => set("condition", e.target.value)}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Grading company</label>
          <input
            className="input"
            value={fields.gradingCompany}
            onChange={(e) => set("gradingCompany", e.target.value)}
            placeholder="PSA, BGS, CGC…"
          />
        </div>
        <div className="field">
          <label>Grade</label>
          <input className="input" value={fields.grade} onChange={(e) => set("grade", e.target.value)} placeholder="9.5" />
        </div>
        <div className="field">
          <label>Quantity</label>
          <input
            className="input"
            type="number"
            min={1}
            value={fields.quantity}
            onChange={(e) => set("quantity", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Purchase price ($)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={fields.purchasePrice}
            onChange={(e) => set("purchasePrice", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Current value ($)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={fields.currentValue}
            onChange={(e) => set("currentValue", e.target.value)}
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Notes</label>
          <textarea className="input" rows={3} value={fields.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
