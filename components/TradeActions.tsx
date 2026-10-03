"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TradeCardPicker, type TradePickerCard } from "./TradeCardPicker";
import { TRADES_CHANGED } from "./TradesBadge";

type Status = "proposed" | "accepted" | "declined" | "cancelled" | "completed" | "expired";
type TheirItem = { cardId: string | null; name: string; quantity: number };

export function TradeActions({
  tradeId,
  status,
  myTurn,
  myConfirmed,
  theirConfirmed,
  otherHandle,
  myItems,
  theirItems,
  myCards,
}: {
  tradeId: string;
  status: Status;
  myTurn: boolean;
  myConfirmed: boolean;
  theirConfirmed: boolean;
  otherHandle: string;
  myItems: { cardId: string | null; quantity: number }[];
  theirItems: TheirItem[];
  myCards: TradePickerCard[] | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countering, setCountering] = useState(false);
  const [mine, setMine] = useState<Record<string, number>>(() =>
    Object.fromEntries(myItems.filter((i) => i.cardId).map((i) => [i.cardId as string, i.quantity]))
  );
  const [theirs, setTheirs] = useState<Record<string, number>>(() =>
    Object.fromEntries(theirItems.filter((i) => i.cardId).map((i) => [i.cardId as string, i.quantity]))
  );
  const [note, setNote] = useState("");

  async function act(action: string, body?: unknown, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/trades/${tradeId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      setCountering(false);
      window.dispatchEvent(new Event(TRADES_CHANGED));
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function sendCounter() {
    const toList = (r: Record<string, number>) => Object.entries(r).map(([cardId, quantity]) => ({ cardId, quantity }));
    if (Object.keys(mine).length + Object.keys(theirs).length === 0) {
      setError("A trade needs at least one card.");
      return;
    }
    act("counter", { mine: toList(mine), theirs: toList(theirs), note });
  }

  const errorBox = error && <div className="form-error">{error}</div>;

  if (countering && myCards) {
    const theirOriginal = theirItems.filter((i) => i.cardId);
    return (
      <div className="surface-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Counter-offer</div>
        {errorBox}
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>You give</div>
          <TradeCardPicker cards={myCards} selected={mine} onChange={setMine} />
        </div>
        {theirOriginal.length > 0 && (
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>You get</div>
            <p style={{ fontSize: 12.5, color: "var(--text-soft)", margin: "0 0 8px" }}>
              You can remove cards from @{otherHandle}&apos;s side or ask for fewer copies — use the note to ask for something else.
            </p>
            <div className="surface-card" style={{ padding: "4px 16px" }}>
              {theirOriginal.map((i) => {
                const id = i.cardId as string;
                const kept = theirs[id] !== undefined;
                return (
                  <label key={id} className="trade-item" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={kept}
                      onChange={() => {
                        const next = { ...theirs };
                        if (kept) delete next[id];
                        else next[id] = i.quantity;
                        setTheirs(next);
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{i.name}</span>
                    {kept && i.quantity > 1 && (
                      <input
                        type="number"
                        className="input"
                        min={1}
                        max={i.quantity}
                        aria-label={`Copies of ${i.name}`}
                        style={{ width: 64, minHeight: 32, padding: "4px 8px" }}
                        value={theirs[id]}
                        onClick={(e) => e.preventDefault()}
                        onChange={(e) =>
                          setTheirs({ ...theirs, [id]: Math.min(i.quantity, Math.max(1, Math.floor(Number(e.target.value)) || 1)) })
                        }
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
        <div className="field">
          <label>Note (optional)</label>
          <textarea className="input" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={sendCounter} disabled={!!busy}>
            {busy === "counter" ? "Sending…" : `Send to @${otherHandle}`}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setCountering(false)} disabled={!!busy}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {errorBox}

      {status === "proposed" && myTurn && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={() => act("accept")} disabled={!!busy}>
            {busy === "accept" ? "Accepting…" : "Accept"}
          </button>
          {myCards && (
            <button type="button" className="btn btn-secondary" onClick={() => setCountering(true)} disabled={!!busy}>
              Counter
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => act("decline", undefined, "Decline this trade?")}
            disabled={!!busy}
          >
            {busy === "decline" ? "Declining…" : "Decline"}
          </button>
        </div>
      )}

      {status === "proposed" && !myTurn && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13.5, color: "var(--text-soft)" }}>Waiting for @{otherHandle} to respond.</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => act("cancel", undefined, "Withdraw this trade offer?")}
            disabled={!!busy}
          >
            {busy === "cancel" ? "Withdrawing…" : "Withdraw offer"}
          </button>
        </div>
      )}

      {status === "accepted" && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {myConfirmed ? (
            <span style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
              You confirmed. Waiting for @{otherHandle} to confirm their part.
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                act(
                  "confirm",
                  undefined,
                  theirConfirmed
                    ? "Confirm you've sent your cards and received theirs? This moves the cards between your collections."
                    : "Confirm you've sent your cards and received theirs?"
                )
              }
              disabled={!!busy}
            >
              {busy === "confirm" ? "Confirming…" : "My part is done"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => act("cancel", undefined, "Cancel this trade? Nothing will move between collections.")}
            disabled={!!busy}
          >
            {busy === "cancel" ? "Cancelling…" : "Cancel trade"}
          </button>
        </div>
      )}

      {status === "completed" && (
        <Link href="/collection" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
          View your collection
        </Link>
      )}
    </div>
  );
}
