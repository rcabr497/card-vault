"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconCards,
  IconBinder,
  IconDeck,
  IconShare,
  IconClose,
  IconTrade,
  IconDownload,
  IconVault,
  IconScanFrame,
  IconMore,
} from "./icons";
import { TradesBadge, useTradesCount } from "./TradesBadge";

type NavKey = "dashboard" | "collection" | "binders" | "decks" | "trades" | "showcase" | "export";

const NAV_ITEMS: { key: NavKey; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: <IconDashboard size={18} /> },
  { key: "collection", href: "/collection", label: "Collection", icon: <IconCards size={18} /> },
  { key: "binders", href: "/binders", label: "Binders", icon: <IconBinder size={18} /> },
  { key: "decks", href: "/decks", label: "Decks", icon: <IconDeck size={18} /> },
  { key: "trades", href: "/trades", label: "Trades", icon: <IconTrade size={18} /> },
  { key: "showcase", href: "/showcase", label: "Showcase", icon: <IconShare size={18} /> },
  { key: "export", href: "/export", label: "Export", icon: <IconDownload size={18} /> },
];

// On phones the bottom tab bar holds the everyday sections; the rest live in "More".
const MORE_KEYS: NavKey[] = ["binders", "showcase", "export"];

export const SCAN_HREF = "/cards/new?mode=camera";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Brand() {
  return (
    <Link href="/dashboard" className="sidebar-brand">
      <span className="brand-mark">
        <IconVault />
      </span>
      <span className="brand-wordmark">Card Vault</span>
    </Link>
  );
}

export function AppShell({
  active,
  user,
  children,
}: {
  active?: NavKey;
  user: { name: string; plan: string };
  children: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const tradesCount = useTradesCount();
  const pathname = usePathname();

  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const tab = (key: NavKey, href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      className={`tab-bar-item${active === key ? " active" : ""}`}
      aria-current={active === key ? "page" : undefined}
    >
      {icon}
      {label}
      {key === "trades" && <TradesBadge count={tradesCount} />}
    </Link>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`sidebar-nav-item${item.key === active ? " active" : ""}`}
              aria-current={item.key === active ? "page" : undefined}
            >
              {item.icon}
              {item.label}
              {item.key === "trades" && <TradesBadge count={tradesCount} />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link href="/changelog" className="sidebar-footer-link">
            Changelog
          </Link>
          <Link href="/profile" className="sidebar-user">
            <span className="avatar-badge">{initials(user.name)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-plan">{user.plan === "free" ? "Free plan" : user.plan}</div>
            </div>
          </Link>
        </div>
      </aside>

      <header className="mobile-header">
        <Brand />
        <div className="mobile-header-actions">
          <button
            type="button"
            className="icon-btn"
            style={{ border: "none", background: "transparent" }}
            aria-label="More sections"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
          >
            <IconMore />
          </button>
          <Link href="/profile" className="mobile-avatar" aria-label="Profile">
            {initials(user.name)}
          </Link>
        </div>
      </header>

      <div className="more-sheet" data-open={moreOpen} onClick={() => setMoreOpen(false)}>
        <div className="more-sheet-panel" role="dialog" aria-label="More sections" onClick={(e) => e.stopPropagation()}>
          <div className="more-sheet-head">
            <h2 style={{ fontSize: 24 }}>More</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={() => setMoreOpen(false)}>
              <IconClose size={18} />
            </button>
          </div>
          {NAV_ITEMS.filter((i) => MORE_KEYS.includes(i.key)).map((item) => (
            <Link key={item.key} href={item.href} className={`more-sheet-link${item.key === active ? " active" : ""}`}>
              {item.icon}
              {item.label}
            </Link>
          ))}
          <Link href="/profile" className="more-sheet-link">
            <span className="avatar-badge" style={{ width: 22, height: 22, fontSize: 11 }}>
              {initials(user.name)}
            </span>
            Profile
          </Link>
          <Link href="/changelog" className="more-sheet-link" style={{ color: "var(--text-soft)" }}>
            Changelog
          </Link>
        </div>
      </div>

      <div className="shell-main">{children}</div>

      <nav className="tab-bar" aria-label="Main">
        {tab("dashboard", "/dashboard", "Home", <IconDashboard size={22} />)}
        {tab("collection", "/collection", "Collection", <IconCards size={22} />)}
        <Link href={SCAN_HREF} className="tab-bar-scan" aria-label="Scan a card">
          <IconScanFrame size={26} />
        </Link>
        {tab("decks", "/decks", "Decks", <IconDeck size={22} />)}
        {tab("trades", "/trades", "Trades", <IconTrade size={22} />)}
      </nav>
    </div>
  );
}
