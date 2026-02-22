import type { ReactNode } from "react";
import Link from "next/link";

const steps = [
  { href: "/onboarding/goal", label: "Goal" },
  { href: "/onboarding/habits", label: "Habits" },
  { href: "/onboarding/schedule", label: "Schedule" }
];

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="onboarding-shell">
      <header className="onboarding-header">
        <div>
          <Link href="/" className="auth-brand">
            Goal Coach
          </Link>
          <h1>Let’s build your first habit loop</h1>
          <p>Answer a few prompts so your coach can configure the right plan and check-in rhythm.</p>
        </div>
        <nav className="onboarding-steps">
          {steps.map((step) => (
            <Link key={step.href} href={step.href} className="step-pill">
              {step.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="onboarding-card">{children}</div>
    </div>
  );
}
