"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "./CameraCapture";
import { IconUpload } from "./icons";

type Mode = "manual" | "upload" | "camera";

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
  imageUrl: string;
  thumbnailUrl: string;
  cardSightId: string;
};

function emptyFields(defaultCategory: string): Fields {
  return {
    name: "",
    category: defaultCategory,
    setName: "",
    cardNumber: "",
    year: "",
    team: "",
    rarity: "",
    condition: "NM",
    gradingCompany: "",
    grade: "",
    quantity: "1",
    purchasePrice: "",
    currentValue: "",
    notes: "",
    imageUrl: "",
    thumbnailUrl: "",
    cardSightId: "",
  };
}

export function AddCardForm({ binderId, binderType }: { binderId: string; binderType: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("manual");
  const [fields, setFields] = useState<Fields>(() => emptyFields(binderType));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastLookedUpRef = useRef("");

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleLookupByName() {
    const trimmed = fields.name.trim();
    if (!trimmed) return;
    lastLookedUpRef.current = trimmed;
    setBusy(true);
    setStatus("Looking up…");
    setError(null);
    try {
      const res = await fetch(`/api/cards/lookup-name?name=${encodeURIComponent(fields.name)}`);
      const data = await res.json();
      if (data.found === false) {
        setStatus("No match found — enter the rest of the details manually.");
      } else {
        setFields((f) => ({
          ...f,
          name: data.name ?? f.name,
          category: data.category ?? f.category,
          setName: data.setName ?? "",
          cardNumber: data.cardNumber ?? "",
          year: data.year ? String(data.year) : "",
          rarity: data.rarity ?? "",
          team: data.team ?? "",
          imageUrl: data.imageUrl ?? f.imageUrl,
          // Manual entry has no separate user photo — the one official image
          // it finds serves as both the detail-page image and the tile thumbnail.
          thumbnailUrl: data.imageUrl ?? f.thumbnailUrl,
          currentValue: typeof data.estimatedValue === "number" ? String(data.estimatedValue) : f.currentValue,
        }));
        const detected = CATEGORIES.find((c) => c.value === data.category)?.label ?? data.category;
        setStatus(
          typeof data.estimatedValue === "number"
            ? `Detected: ${detected} — est. value $${data.estimatedValue.toFixed(2)}`
            : `Detected: ${detected}`
        );
      }
    } catch {
      setStatus(null);
      setError("Lookup failed — you can still enter details manually.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (mode !== "manual" || busy) return;
    const trimmed = fields.name.trim();
    if (trimmed.length < 3 || trimmed === lastLookedUpRef.current) return;
    const timer = setTimeout(() => handleLookupByName(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.name, mode, busy]);

  async function handlePhoto(fileOrBlob: File | Blob) {
    setBusy(true);
    setStatus("Uploading photo…");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", fileOrBlob, "card.jpg");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed.");

      set("imageUrl", uploadData.url);
      setStatus("Identifying card…");

      const identifyRes = await fetch("/api/cards/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url, categoryHint: binderType }),
      });
      const identifyData = await identifyRes.json();

      if (!identifyRes.ok) {
        setStatus("Photo saved — couldn't auto-identify the card, enter details manually.");
        setError(identifyData.error ?? "Card recognition failed.");
        return;
      }

      if (identifyData.needsReview || !identifyData.name) {
        setStatus("Photo saved — low confidence match, please review the details below.");
      } else {
        setFields((f) => ({
          ...f,
          name: identifyData.name ?? f.name,
          setName: identifyData.setName ?? f.setName,
          cardNumber: identifyData.cardNumber ?? f.cardNumber,
          year: identifyData.year ? String(identifyData.year) : f.year,
          rarity: identifyData.rarity ?? f.rarity,
          gradingCompany: identifyData.gradingCompany ?? f.gradingCompany,
          grade: identifyData.grade ?? f.grade,
          thumbnailUrl: identifyData.thumbnailUrl ?? f.thumbnailUrl,
          cardSightId: identifyData.cardSightId ?? f.cardSightId,
          currentValue:
            typeof identifyData.estimatedValue === "number" ? String(identifyData.estimatedValue) : f.currentValue,
        }));
        const confidenceLabel = identifyData.confidence ?? "unknown";
        setStatus(
          typeof identifyData.estimatedValue === "number"
            ? `Matched with ${confidenceLabel} confidence — est. value $${identifyData.estimatedValue.toFixed(2)}`
            : `Matched with ${confidenceLabel} confidence — review and save.`
        );
      }
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCard(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, binderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSaving(false);
        return false;
      }
      return true;
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
      return false;
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const ok = await saveCard();
    if (ok) {
      router.push(`/binders/${binderId}`);
      router.refresh();
    }
  }

  async function handleSaveAndAddNew() {
    const ok = await saveCard();
    if (ok) {
      setFields(emptyFields(binderType));
      lastLookedUpRef.current = "";
      setSaving(false);
      setError(null);
      setStatus("Card saved — add another below.");
      router.refresh();
    }
  }

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {(["manual", "upload", "camera"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`pill${mode === m ? " pill-active" : ""}`}
            onClick={() => setMode(m)}
          >
            {m === "manual" ? "Manual" : m === "upload" ? "Upload photo" : "Take picture"}
          </button>
        ))}
      </div>

      <div className="surface-card" style={{ padding: 20 }}>
        {mode === "manual" && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Card Name</label>
              <input
                className="input"
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Charizard"
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={handleLookupByName} disabled={busy}>
              Look up
            </button>
          </div>
        )}

        {mode === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            {fields.imageUrl && (
              <div className="card-photo" style={{ width: 140 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fields.imageUrl} alt="Uploaded card" />
              </div>
            )}
            <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
              <IconUpload size={16} />
              Choose photo
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
              />
            </label>
          </div>
        )}

        {mode === "camera" && <CameraCapture onCapture={handlePhoto} />}

        {status && <p style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 14 }}>{status}</p>}
        {error && (
          <div className="form-error" style={{ marginTop: 14 }}>
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
            <textarea
              className="input"
              rows={3}
              value={fields.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Card"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSaveAndAddNew} disabled={saving}>
            {saving ? "Saving…" : "Save + Add New"}
          </button>
        </div>
      </form>
    </div>
  );
}
