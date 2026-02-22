import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <Link href="/" className="auth-brand">
          Goal Coach
        </Link>
        <h1>Build habits with a calm, responsive coach.</h1>
        <p>
          Plan the goal, shape the ritual, and let the AI listener keep the momentum alive through chat and voice
          check-ins.
        </p>
        <div className="auth-highlight">
          <span>New in beta</span>
          <strong>Voice coaching + autonomous habit logging</strong>
        </div>
      </div>
      <div className="auth-card">{children}</div>
    </div>
  );
}
