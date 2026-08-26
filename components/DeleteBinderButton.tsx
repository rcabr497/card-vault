"use client";

import { useState } from "react";
import { deleteBinder } from "@/app/binders/actions";

export function DeleteBinderButton({ binderId }: { binderId: string }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this binder? Cards inside it stay in your collection — this only removes the binder.")) {
      return;
    }
    setBusy(true);
    await deleteBinder(binderId);
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
