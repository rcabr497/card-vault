"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconPlus } from "./icons";

export function ImportToCollectionButton({
  kind,
  slug,
  isLoggedIn,
}: {
  kind: "decks" | "binders";
  slug: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<"cards" | "container" | null>(null);
  const [result, setResult] = useState<{ imported: number; id?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ranAutoImport = useRef(false);

  const containerLabel = kind === "decks" ? "deck" : "binder";
  const containerMode = kind === "decks" ? "deck" : "binder";

  async function handleImport(mode: "cards" | "container") {
    setBusy(mode);
    setError(null);
    try {
      const res = await fetch(`/api/share/${kind}/${slug}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: mode === "container" ? containerMode : "cards" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      setResult({ imported: data.imported, id: data.binderId ?? data.deckId });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (isLoggedIn && searchParams.get("autoImport") === "1" && !ranAutoImport.current) {
      ranAutoImport.current = true;
      handleImport("cards");
      router.replace(`/share/${kind}/${slug}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    const callbackUrl = `/share/${kind}/${slug}?autoImport=1`;
    return (
      <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="btn btn-primary">
        <IconPlus />
        Log in to Import
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn"
          onClick={() => handleImport("cards")}
          disabled={busy !== null}
          title={`Add these cards to your collection without keeping the ${containerLabel}`}
        >
          <IconPlus />
          {busy === "cards" ? "Importing…" : "Import Cards Only"}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleImport("container")}
          disabled={busy !== null}
          title={`Copy the whole ${containerLabel}, keeping its name and details`}
        >
          <IconPlus />
          {busy === "container" ? "Copying…" : `Copy as New ${containerLabel === "deck" ? "Deck" : "Binder"}`}
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      {result && !error && (
        <span style={{ fontSize: 12, color: "var(--text-soft)" }}>
          {result.id ? (
            <>
              Copied {containerLabel} with {result.imported} card{result.imported === 1 ? "" : "s"}.{" "}
              <Link href={`/${kind}/${result.id}`}>View it →</Link>
            </>
          ) : (
            <>Added {result.imported} card{result.imported === 1 ? "" : "s"} to your collection.</>
          )}
        </span>
      )}
    </div>
  );
}
