"use client";

import { useEffect, useState } from "react";

// Your shareable "trade with me" link, with a copy button.
export function TradeInviteLink({ handle }: { handle: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/trades/new?with=${encodeURIComponent(handle)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is still selectable.
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <code
        style={{
          fontSize: 12.5,
          background: "var(--surface)",
          padding: "6px 10px",
          borderRadius: 6,
          overflowWrap: "anywhere",
          maxWidth: "100%",
        }}
      >
        {link}
      </code>
      <button type="button" className="pill" onClick={copy}>
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
