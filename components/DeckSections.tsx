"use client";

import { useEffect, useState } from "react";

type Tab = "cards" | "check" | "notes";

// Desktop shows the cards with a side column (check, breakdown, notes). On
// phones the same parts become Cards / Check / Notes tabs. A link to
// #deck-check (verdict chip, dashboard) opens the Check tab.
export function DeckSections({
  cards,
  check,
  notes,
  checkLabel,
}: {
  cards: React.ReactNode;
  check: React.ReactNode;
  notes: React.ReactNode;
  checkLabel: string;
}) {
  const [tab, setTab] = useState<Tab>("cards");

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#deck-check") setTab("check");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const tabs: [Tab, string][] = [
    ["cards", "Cards"],
    ["check", checkLabel],
    ["notes", "Notes"],
  ];

  return (
    <div className="deck-layout" data-tab={tab}>
      <div className="segmented deck-tabs" role="tablist" aria-label="Deck sections">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`deck-tab-${id}`}
            aria-controls={`deck-panel-${id}`}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <section id="deck-panel-cards" className="deck-panel deck-panel-cards" aria-labelledby="deck-tab-cards">
        {cards}
      </section>
      <div className="deck-rail">
        <section id="deck-panel-check" className="deck-panel deck-panel-check" aria-labelledby="deck-tab-check">
          {check}
        </section>
        <section id="deck-panel-notes" className="deck-panel deck-panel-notes" aria-labelledby="deck-tab-notes">
          {notes}
        </section>
      </div>
    </div>
  );
}
