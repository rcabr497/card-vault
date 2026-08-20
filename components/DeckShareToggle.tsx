"use client";

import { useState } from "react";
import { IconShare } from "./icons";

export function DeckShareToggle({
  deckId,
  initialShared,
  initialSlug,
}: {
  deckId: string;
  initialShared: boolean;
  initialSlug: string | null;
}) {
  const [isShared, setIsShared] = useState(initialShared);
  const [slug, setSlug] = useState(initialSlug);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/decks/${deckId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enable: !isShared }),
    });
    const data = await res.json();
    setIsShared(data.isShared);
    setSlug(data.shareSlug);
    setBusy(false);
  }

  const shareUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/share/decks/${slug}` : "";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
      <button type="button" className="btn btn-secondary" onClick={toggle} disabled={busy}>
        <IconShare />
        {isShared ? "Sharing on" : "Share"}
      </button>
      {isShared && shareUrl && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input className="input" readOnly value={shareUrl} style={{ width: 220, fontSize: 12 }} />
          <button
            type="button"
            className="pill"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
