"use client";

import { useMemo, useState } from "react";
import { columnsForScope, type ExportScope } from "@/lib/exportColumns";

type Option = { id: string; name: string };

export function ExportWizard({ binders, decks }: { binders: Option[]; decks: Option[] }) {
  const [step, setStep] = useState(1);
  const [scopeType, setScopeType] = useState<ExportScope | "">("");
  const [scopeId, setScopeId] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  const availableColumns = useMemo(() => (scopeType ? columnsForScope(scopeType) : []), [scopeType]);

  function chooseScope(type: ExportScope) {
    setScopeType(type);
    setScopeId("");
  }

  function goToStep2() {
    const cols = columnsForScope(scopeType as ExportScope);
    setSelectedColumns(new Set(cols.map((c) => c.key)));
    setStep(2);
  }

  function toggleColumn(key: string) {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const canProceedStep1 = scopeType === "collection" || (!!scopeType && !!scopeId);

  const scopeLabel =
    scopeType === "collection"
      ? "Whole collection"
      : scopeType === "binder"
        ? `Binder — ${binders.find((b) => b.id === scopeId)?.name ?? ""}`
        : scopeType === "deck"
          ? `Deck — ${decks.find((d) => d.id === scopeId)?.name ?? ""}`
          : "";

  const exportHref = (() => {
    const params = new URLSearchParams({
      scope: scopeType,
      columns: Array.from(selectedColumns).join(","),
    });
    if (scopeId) params.set("id", scopeId);
    return `/api/export?${params.toString()}`;
  })();

  return (
    <div className="surface-card" style={{ padding: 28, maxWidth: 640 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: s <= step ? "var(--accent)" : "var(--divider)",
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, margin: 0 }}>
            Step 1 — What do you want to export?
          </h2>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="radio" name="scope" checked={scopeType === "collection"} onChange={() => chooseScope("collection")} />
            Whole collection
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="radio" name="scope" checked={scopeType === "binder"} onChange={() => chooseScope("binder")} />
            A binder
          </label>
          {scopeType === "binder" && (
            <select className="input" value={scopeId} onChange={(e) => setScopeId(e.target.value)} style={{ marginLeft: 24, width: "auto" }}>
              <option value="">Select a binder…</option>
              {binders.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="radio" name="scope" checked={scopeType === "deck"} onChange={() => chooseScope("deck")} />
            A deck
          </label>
          {scopeType === "deck" && (
            <select className="input" value={scopeId} onChange={(e) => setScopeId(e.target.value)} style={{ marginLeft: 24, width: "auto" }}>
              <option value="">Select a deck…</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <div>
            <button type="button" className="btn btn-primary" disabled={!canProceedStep1} onClick={goToStep2}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, margin: 0 }}>
            Step 2 — Choose columns
          </h2>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="pill"
              onClick={() => setSelectedColumns(new Set(availableColumns.map((c) => c.key)))}
            >
              Select all
            </button>
            <button type="button" className="pill" onClick={() => setSelectedColumns(new Set())}>
              Select none
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {availableColumns.map((c) => (
              <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5 }}>
                <input type="checkbox" checked={selectedColumns.has(c.key)} onChange={() => toggleColumn(c.key)} />
                {c.label}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" disabled={selectedColumns.size === 0} onClick={() => setStep(3)}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, margin: 0 }}>
            Step 3 — Confirm & export
          </h2>

          <div>
            <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 4 }}>Exporting</div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{scopeLabel}</div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 6 }}>Columns</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {availableColumns
                .filter((c) => selectedColumns.has(c.key))
                .map((c) => (
                  <span key={c.key} className="pill pill-active" style={{ cursor: "default" }}>
                    {c.label}
                  </span>
                ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <a href={exportHref} className="btn btn-primary">
              Export CSV
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
