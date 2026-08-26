"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCardButton({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this card? This can't be undone.")) return;
    setBusy(true);
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    router.push("/binders");
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
