"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeckCardPicker, type PickerCard } from "./DeckCardPicker";
import { cropImageToRatio, TCG_CARD_RATIO } from "@/lib/imageCrop";
import { IconUpload } from "./icons";

export function NewDeckForm({ cards }: { cards: PickerCard[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleImage(file: File) {
    setImageBusy(true);
    setError(null);
    try {
      const cropped = await cropImageToRatio(file, TCG_CARD_RATIO);
      const form = new FormData();
      form.append("file", cropped, "deck-cover.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give your deck a name.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          format: format || null,
          featuredImageUrl: imageUrl || null,
          cards: Object.entries(selected).map(([cardId, quantity]) => ({ cardId, quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSaving(false);
        return;
      }
      router.push(`/decks/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      {error && <div className="form-error">{error}</div>}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 160, flex: "none" }}>
          <div className="card-photo" style={{ aspectRatio: `${TCG_CARD_RATIO}`, marginBottom: 10 }}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Deck featured" />
            ) : (
              <span className="card-photo-label">FEATURED IMAGE</span>
            )}
          </div>
          <label className="btn btn-secondary" style={{ cursor: "pointer", width: "100%" }}>
            <IconUpload size={16} />
            {imageBusy ? "Uploading…" : "Choose image"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={imageBusy}
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
          </label>
        </div>

        <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field">
            <label>Deck name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Charizard EX Build" required />
          </div>
          <div className="field">
            <label>Format (optional)</label>
            <input className="input" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Standard" />
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
          Add cards
        </h2>
        <DeckCardPicker cards={cards} selected={selected} onChange={setSelected} />
      </div>

      <div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Creating…" : "Create Deck"}
        </button>
      </div>
    </form>
  );
}
