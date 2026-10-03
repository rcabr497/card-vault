import Link from "next/link";
import type { CheckStatus, DeckCheckResult } from "@/lib/deckCheck";

const VERDICT: Record<DeckCheckResult["verdict"], { cls: string; text: (label: string) => string }> = {
  legal: { cls: "check-verdict-good", text: (l) => `Legal in ${l}` },
  illegal: { cls: "check-verdict-bad", text: (l) => `Not legal in ${l} yet` },
  unverified: { cls: "check-verdict-open", text: (l) => `Looks legal in ${l} — some cards unverified` },
};

const STATUS: Record<CheckStatus, { mark: string; label: string }> = {
  pass: { mark: "✓", label: "Passes" },
  fail: { mark: "✕", label: "Fails" },
  warn: { mark: "?", label: "Couldn't check" },
};

function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// The deck's rule check. `result` is null when the deck has no format we know
// the rules for; `formatText` is what's stored, to explain why.
export function DeckCheckPanel({
  result,
  formatText,
  backTo,
}: {
  result: DeckCheckResult | null;
  formatText: string | null;
  backTo: string;
}) {
  if (!result) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-soft)", margin: 0 }}>
        {formatText
          ? `Card Vault doesn't know the rules for "${formatText}". Choose a Magic or Pokémon format to check this deck.`
          : "Choose a format to check card count, copy limits, and banned cards."}
      </p>
    );
  }

  const verdict = VERDICT[result.verdict];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className={`check-verdict ${verdict.cls}`} role="status">
        {verdict.text(result.format.label)}
      </div>

      <ul className="check-list">
        {result.items.map((item) => (
          <li key={item.id} className={`check-item check-${item.status}`}>
            <span className="check-mark" aria-hidden="true">
              {STATUS[item.status].mark}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                <span className="visually-hidden">{STATUS[item.status].label}: </span>
                {item.title}
              </div>
              {item.detail && <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>{item.detail}</div>}
              {item.cards && item.cards.length > 0 && (
                <ul className="check-cards">
                  {item.cards.map((c) => (
                    <li key={c.id}>
                      <Link href={`/cards/${c.id}?from=${encodeURIComponent(backTo)}`}>{c.name}</Link>
                      {c.note && <span style={{ color: "var(--text-soft)" }}> · {c.note}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>

      {(result.notes.length > 0 || result.dataAsOf) && (
        <div style={{ fontSize: 12, color: "var(--text-soft)", display: "flex", flexDirection: "column", gap: 4 }}>
          {result.notes.map((n) => (
            <span key={n}>{n}</span>
          ))}
          {result.dataAsOf && (
            <span>
              Legality uses the card data saved with each card (oldest from {monthYear(result.dataAsOf)}), so recent bans or
              rotations may not show.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
