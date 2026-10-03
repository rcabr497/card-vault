"use client";

import { useEffect, useRef, useState } from "react";

// "⋯ More" button that opens a small panel of secondary actions (share,
// delete…), keeping page headers down to one or two primary buttons.
export function ActionsMenu({ label = "More", children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="actions-menu" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⋯</span>
        {label}
      </button>
      {open && <div className="actions-menu-panel">{children}</div>}
    </div>
  );
}
