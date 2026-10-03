"use client";

import { useState } from "react";

// Wraps the filter controls. Always visible on desktop; on phones they sit
// behind a "Filters (N)" button so the cards aren't pushed below the fold.
export function CollapsibleFilters({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="collapsible-filters" data-open={open}>
      <button type="button" className="pill filters-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Filters{activeCount ? ` (${activeCount})` : ""}
        <span aria-hidden="true">{open ? " ▴" : " ▾"}</span>
      </button>
      <div className="filters-body">{children}</div>
    </div>
  );
}
