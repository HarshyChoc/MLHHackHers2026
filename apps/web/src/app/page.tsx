import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 32, maxWidth: 920, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Goal Coach</h1>
      <p style={{ color: "#4d5663" }}>
        Contract-first implementation started. Use the workbench to hit `/v1` API endpoints for onboarding, habits,
        dashboard, and chat.
      </p>
      <Link href="/workbench" style={{ color: "#0a58ca", fontWeight: 600 }}>
        Open Workbench
      </Link>
    </main>
  );
}
