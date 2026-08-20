import Link from "next/link";
import { IconDashboard, IconBinder, IconDeck } from "./icons";

type NavKey = "dashboard" | "binders" | "decks";

const NAV_ITEMS: { key: NavKey; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { key: "binders", href: "/binders", label: "Binder", icon: <IconBinder /> },
  { key: "decks", href: "/decks", label: "Decks", icon: <IconDeck /> },
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
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand">
          <span className="brand-mark" />
          <span className="brand-wordmark">Card Vault</span>
        </Link>
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
        <Link href="/profile" className="sidebar-user">
          <span className="avatar-badge">{initials(user.name)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-plan">{user.plan === "free" ? "Free plan" : user.plan}</div>
          </div>
        </Link>
      </aside>
      <div className="shell-main">{children}</div>
    </div>
  );
}
