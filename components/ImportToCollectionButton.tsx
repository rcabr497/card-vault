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
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ranAutoImport = useRef(false);

  async function handleImport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/${kind}/${slug}/import`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }
      setImported(data.imported);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn && searchParams.get("autoImport") === "1" && !ranAutoImport.current) {
      ranAutoImport.current = true;
      handleImport();
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
      <button type="button" className="btn btn-primary" onClick={handleImport} disabled={busy}>
        <IconPlus />
        {busy ? "Importing…" : imported !== null ? "Imported!" : "Import to Collection"}
      </button>
      {error && <div className="form-error">{error}</div>}
      {imported !== null && !error && (
        <span style={{ fontSize: 12, color: "var(--text-soft)" }}>
          Added {imported} card{imported === 1 ? "" : "s"} to your collection.
        </span>
      )}
    </div>
  );
}
