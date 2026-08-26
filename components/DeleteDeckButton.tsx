"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteDeckButton({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this deck? This can't be undone.")) return;
    setBusy(true);
    await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
    router.push("/decks");
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
