"use client";

import { useState } from "react";
import Link from "next/link";
import { IconDashboard, IconBinder, IconDeck, IconShare, IconMenu, IconClose } from "./icons";

type NavKey = "dashboard" | "binders" | "decks" | "showcase";

const NAV_ITEMS: { key: NavKey; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { key: "binders", href: "/binders", label: "Binder", icon: <IconBinder /> },
  { key: "decks", href: "/decks", label: "Decks", icon: <IconDeck /> },
  { key: "showcase", href: "/showcase", label: "Showcase", icon: <IconShare /> },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-brand">
            <span className="brand-mark" />
            <span className="brand-wordmark">Card Vault</span>
          </Link>
          <button
            type="button"
            className="sidebar-menu-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        <div className={`sidebar-collapsible${mobileOpen ? " is-open" : ""}`}>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-nav-item${item.key === active ? " active" : ""}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/changelog"
            style={{ fontSize: 11.5, color: "var(--text-soft)", padding: "0 14px", marginTop: "auto" }}
          >
            Changelog
          </Link>
          <Link href="/profile" className="sidebar-user" style={{ marginTop: 12 }}>
            <span className="avatar-badge">{initials(user.name)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-plan">{user.plan === "free" ? "Free plan" : user.plan}</div>
            </div>
          </Link>
        </div>
      </aside>
      <div className="shell-main">{children}</div>
    </div>
  );
}
