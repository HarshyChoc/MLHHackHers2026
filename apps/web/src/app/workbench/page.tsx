"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  createGoal,
  createHabit,
  getActiveGoal,
  getDashboardToday,
  logHabit,
  loginDemoUser,
  sendChat
} from "../../lib/api";

function createThreadId(): string {
  return crypto.randomUUID();
}

export default function WorkbenchPage() {
  const [token, setToken] = useState("");
  const [goalId, setGoalId] = useState("");
  const [habitId, setHabitId] = useState("");
  const [threadId] = useState(createThreadId);
  const [chatInput, setChatInput] = useState("I finished my workout today");
  const [output, setOutput] = useState("");

  const canCallApi = useMemo(() => token.length > 0, [token]);

  async function runAction(action: () => Promise<unknown>) {
    try {
      const result = await action();
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput(String(error));
    }
  }

  function onQuickLogin(event: FormEvent) {
    event.preventDefault();
    void runAction(async () => {
      const session = await loginDemoUser();
      setToken(session.access_token);
      return session;
    });
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 16, maxWidth: 1024, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 0 }}>Goal Coach Workbench</h1>
      <p style={{ marginTop: 0, color: "#4d5663" }}>This page exercises the fixed API contract endpoints.</p>

      <section style={{ padding: 16, background: "#ffffff", border: "1px solid #e5e9f0", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>1. Auth</h2>
        <form onSubmit={onQuickLogin}>
          <button type="submit">Quick Login (demo@goalcoach.app)</button>
        </form>
        <p>
          Access token: <code>{token || "(none)"}</code>
        </p>
      </section>

      <section style={{ padding: 16, background: "#ffffff", border: "1px solid #e5e9f0", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>2. Goal + Habit</h2>
        <button
          disabled={!canCallApi}
          onClick={() =>
            void runAction(async () => {
              const date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
              const goal = await createGoal(
                {
                  statement: "Ship habit streaks for 30 days",
                  motivation: "Build consistency",
                  constraints: "Work travel twice this month",
                  target_date: date
                },
                token
              );
              setGoalId(goal.id);
              return goal;
            })
          }
        >
          Create Goal
        </button>

        <button
          disabled={!canCallApi}
          onClick={() =>
            void runAction(async () => {
              const goal = await getActiveGoal(token);
              setGoalId(goal.id);
              return goal;
            })
          }
          style={{ marginLeft: 8 }}
        >
          Get Active Goal
        </button>

        <button
          disabled={!canCallApi || !goalId}
          onClick={() =>
            void runAction(async () => {
              const habit = await createHabit(
                {
                  goal_id: goalId,
                  title: "Deep work block",
                  frequency: { cadence: "weekdays" },
                  measurement: { type: "duration_minutes", target_value: 60 },
                  difficulty_1_to_10: 5,
                  default_time_window: { start_local: "08:00", end_local: "10:00" }
                },
                token
              );
              setHabitId(habit.id);
              return habit;
            })
          }
          style={{ marginLeft: 8 }}
        >
          Create Habit
        </button>

        <button
          disabled={!canCallApi || !habitId}
          onClick={() =>
            void runAction(async () => {
              return logHabit(
                {
                  habit_id: habitId,
                  date_local: new Date().toISOString().slice(0, 10),
                  status: "done"
                },
                token
              );
            })
          }
          style={{ marginLeft: 8 }}
        >
          Log Habit Done
        </button>
      </section>

      <section style={{ padding: 16, background: "#ffffff", border: "1px solid #e5e9f0", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>3. Dashboard + Chat</h2>
        <button disabled={!canCallApi} onClick={() => void runAction(() => getDashboardToday(token))}>
          Fetch Dashboard Today
        </button>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!canCallApi) {
              return;
            }
            void runAction(() => sendChat({ thread_id: threadId, message: chatInput }, token));
          }}
          style={{ marginTop: 12, display: "flex", gap: 8 }}
        >
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button type="submit" disabled={!canCallApi}>
            Send Chat
          </button>
        </form>
      </section>

      <section style={{ padding: 16, background: "#111827", color: "#f9fafb", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Output</h2>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{output || "Run an action to view response"}</pre>
      </section>
    </main>
  );
}
