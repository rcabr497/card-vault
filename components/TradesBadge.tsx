"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const TRADES_CHANGED = "cardvault:trades-changed";

// Count of trades waiting on you, shown next to "Trades" in the sidebar.
// Fetched client-side so the pages that render AppShell don't each query it.
export function TradesBadge() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/trades/count")
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((d) => !cancelled && setCount(Number(d.count) || 0))
        .catch(() => {});
    load();
    // Refresh after acting on a trade, and when coming back to the tab.
    window.addEventListener(TRADES_CHANGED, load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener(TRADES_CHANGED, load);
      window.removeEventListener("focus", load);
    };
  }, [pathname]);

  if (count === 0) return null;
  return (
    <span className="nav-badge" aria-label={`${count} waiting on you`}>
      {count}
    </span>
  );
}
