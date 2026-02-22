import type { ReactNode } from "react";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/review", label: "Review" },
  { href: "/goals", label: "Goals" },
  { href: "/settings", label: "Settings" }
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="app-rail">
        <div className="app-brand">
          <Link href="/">Goal Coach</Link>
          <span className="badge">Beta</span>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="app-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="app-rail-card">
          <h4>Today’s intention</h4>
          <p>Protect a 60 minute deep work block and log your energy level.</p>
          <button className="button secondary button-block" type="button">
            Start check-in
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <span className="muted">Sunday, February 22, 2026</span>
            <h2>Welcome back, Jordan</h2>
          </div>
          <div className="topbar-actions">
            <button className="button secondary" type="button">
              New goal
            </button>
            <button className="button" type="button">
              Open chat
            </button>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>

      <nav className="app-bottom">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="app-link">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
