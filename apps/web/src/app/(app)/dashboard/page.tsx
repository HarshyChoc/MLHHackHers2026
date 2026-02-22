const habits = [
  {
    title: "Morning stretch",
    window: "7:00 - 7:20 AM",
    status: "pending",
    difficulty: 3
  },
  {
    title: "Deep work block",
    window: "9:30 - 11:00 AM",
    status: "done",
    difficulty: 6
  },
  {
    title: "Hydration check",
    window: "All day",
    status: "partial",
    difficulty: 2
  }
];

const commitments = [
  { title: "Send project update", due: "Today" },
  { title: "Schedule coach call", due: "Tomorrow" }
];

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="pill">Today</span>
          <h1>Build a rhythm you can keep</h1>
          <p className="muted">Goal: Run a 10k by June 30</p>
        </div>
        <div className="date-controls">
          <button className="button secondary" type="button">
            Previous day
          </button>
          <button className="button secondary" type="button">
            Next day
          </button>
        </div>
      </section>

      <section className="focus-banner">
        <div>
          <h3>Weekly focus</h3>
          <p>Prioritize sleep consistency and keep workouts under 45 minutes.</p>
        </div>
        <button className="button" type="button">
          Review weekly plan
        </button>
      </section>

      <section className="grid-two">
        <div className="card">
          <div className="card-header">
            <h3>Habit checklist</h3>
            <span className="muted">3 habits today</span>
          </div>
          <div className="list">
            {habits.map((habit) => (
              <div key={habit.title} className="habit-row">
                <div>
                  <strong>{habit.title}</strong>
                  <div className="muted">{habit.window}</div>
                </div>
                <div className={`status-pill ${habit.status}`}>{habit.status}</div>
                <div className="chip">Difficulty {habit.difficulty}</div>
                <div className="habit-actions">
                  <button className="chip" type="button">
                    Done
                  </button>
                  <button className="chip" type="button">
                    Partial
                  </button>
                  <button className="chip" type="button">
                    Missed
                  </button>
                  <button className="chip" type="button">
                    Skip
                  </button>
                </div>
                <textarea className="input input-block input-textarea" rows={2} placeholder="Optional note" />
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-header">
              <h3>Streak pulse</h3>
              <span className="muted">7-day view</span>
            </div>
            <div className="progress-grid">
              <div className="progress-ring">
                <span>86%</span>
                <small>Completion</small>
              </div>
              <div className="progress-list">
                <div>
                  <span>Current streak</span>
                  <strong>9 days</strong>
                </div>
                <div>
                  <span>Best streak</span>
                  <strong>16 days</strong>
                </div>
                <div>
                  <span>Consistency</span>
                  <strong>High</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Commitments</h3>
              <button className="link" type="button">
                Add
              </button>
            </div>
            <div className="list">
              {commitments.map((item) => (
                <div key={item.title} className="commitment-row">
                  <div>
                    <strong>{item.title}</strong>
                    <div className="muted">Due {item.due}</div>
                  </div>
                  <div className="commitment-actions">
                    <button className="chip" type="button">
                      Complete
                    </button>
                    <button className="chip" type="button">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <details className="card">
            <summary className="card-header">
              <h3>Last call recap</h3>
              <span className="muted">Today, 8:15 AM</span>
            </summary>
            <p className="muted">You reported medium energy, completed your stretch, and committed to a 30 minute walk.</p>
          </details>

          <div className="card empty">
            <h4>No logs for late afternoon yet</h4>
            <p className="muted">Your coach will nudge after 4:00 PM if there is no update.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
