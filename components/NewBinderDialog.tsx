"use client";

import { useState } from "react";
import { createBinder } from "@/app/binders/actions";
import { IconPlus } from "@/components/icons";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "pokemon", label: "Pokémon" },
  { value: "mtg", label: "Magic: The Gathering" },
  { value: "sports", label: "Sports" },
];

export function NewBinderDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        <IconPlus />
        New Binder
      </button>

      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>New Binder</h2>
            <form action={createBinder} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="field">
                <label htmlFor="binder-name">Name</label>
                <input id="binder-name" name="name" className="input" placeholder="Base Set" required autoFocus />
              </div>
              <div className="field">
                <label htmlFor="binder-type">Type</label>
                <select id="binder-type" name="type" className="input" defaultValue="pokemon" required>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Binder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
