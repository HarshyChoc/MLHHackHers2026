"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import anime from "animejs";
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

  useEffect(() => {
    const timeline = anime.timeline({
      easing: "easeOutExpo",
      duration: 700
    });

    timeline
      .add({
        targets: ".workbench-header",
        opacity: [0, 1],
        translateY: [18, 0]
      })
      .add(
        {
          targets: ".paper-card",
          opacity: [0, 1],
          translateY: [20, 0],
          delay: anime.stagger(120)
        },
        "-=420"
      )
      .add(
        {
          targets: ".output-panel",
          opacity: [0, 1],
          translateY: [16, 0]
        },
        "-=300"
      );

    const ambientDrift = anime({
      targets: ".ghibli-orb, .ghibli-cloud, .ghibli-mist, .ghibli-leaf",
      translateY: [-8, 12],
      translateX: [10, -10],
      scale: [0.985, 1.015],
      duration: 7600,
      easing: "easeInOutSine",
      direction: "alternate",
      loop: true,
      autoplay: false,
      delay: anime.stagger(950)
    });

    timeline.finished.then(() => {
      ambientDrift.play();
    });

    return () => {
      timeline.pause();
      ambientDrift.pause();
    };
  }, []);

  return (
    <main className="scene">
      <div className="ghibli-skywash" />
      <div className="ghibli-orb" style={{ top: "14%", right: "10%" }} />
      <div className="ghibli-cloud" style={{ top: "40%", left: "6%" }} />
      <div className="ghibli-mist" style={{ bottom: "6%", right: "18%" }} />
      <div className="ghibli-leaf" style={{ top: "22%", left: "18%" }} />
      <div className="ghibli-leaf" style={{ bottom: "18%", right: "12%" }} />
      <div className="ghibli-haze" />
      <div className="ghibli-grain" />
      <div className="workbench-shell">
        <header className="workbench-header">
          <span className="pill">API Workbench</span>
          <h1>Goal Coach Workbench</h1>
          <p>This page exercises the fixed API contract endpoints with a calm, guided flow.</p>
        </header>

        <section className="paper-card">
          <h2>1. Auth</h2>
        <form onSubmit={onQuickLogin}>
            <button className="button" type="submit">
              Quick Login (demo@goalcoach.app)
            </button>
        </form>
        <p>
          Access token: <code>{token || "(none)"}</code>
        </p>
      </section>

        <section className="paper-card">
          <h2>2. Goal + Habit</h2>
          <div className="toolbar">
            <button
              className="button"
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
              className="button secondary"
              disabled={!canCallApi}
              onClick={() =>
                void runAction(async () => {
                  const goal = await getActiveGoal(token);
                  setGoalId(goal.id);
                  return goal;
                })
              }
            >
              Get Active Goal
            </button>

            <button
              className="button"
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
            >
              Create Habit
            </button>

            <button
              className="button secondary"
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
            >
              Log Habit Done
            </button>
          </div>
        </section>

        <section className="paper-card">
          <h2>3. Dashboard + Chat</h2>
          <div className="toolbar">
            <button className="button" disabled={!canCallApi} onClick={() => void runAction(() => getDashboardToday(token))}>
              Fetch Dashboard Today
            </button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!canCallApi) {
                return;
              }
              void runAction(() => sendChat({ thread_id: threadId, message: chatInput }, token));
            }}
            className="toolbar"
          >
            <input
              className="input"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
            />
            <button className="button secondary" type="submit" disabled={!canCallApi}>
              Send Chat
            </button>
          </form>
        </section>

        <section className="paper-card dark">
          <h2>Output</h2>
          <pre className="output-panel">{output || "Run an action to view response"}</pre>
        </section>
      </div>
    </main>
  );
}
