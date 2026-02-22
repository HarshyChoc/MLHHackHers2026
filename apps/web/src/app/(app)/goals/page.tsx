const habits = [
  {
    title: "Morning stretch",
    cadence: "Weekdays",
    target: "10 min",
    status: "Active"
  },
  {
    title: "Deep work block",
    cadence: "3x per week",
    target: "60 min",
    status: "Active"
  },
  {
    title: "Hydration check",
    cadence: "Daily",
    target: "8 cups",
    status: "Paused"
  }
];

export default function GoalsPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="pill">Goal management</span>
          <h1>Current goal</h1>
          <p className="muted">Run a 10k by June 30. Created Feb 1, 2026.</p>
        </div>
        <div className="date-controls">
          <button className="button secondary" type="button">
            Switch goal
          </button>
          <button className="button" type="button">
            Create new goal
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Habits in this goal</h3>
          <button className="button secondary" type="button">
            Add habit
          </button>
        </div>
        <div className="table">
          <div className="table-row table-head">
            <span>Habit</span>
            <span>Cadence</span>
            <span>Target</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {habits.map((habit) => (
            <div key={habit.title} className="table-row">
              <span>{habit.title}</span>
              <span className="muted">{habit.cadence}</span>
              <span>{habit.target}</span>
              <span className={`status-pill ${habit.status === "Active" ? "done" : "missed"}`}>{habit.status}</span>
              <div className="table-actions">
                <button className="chip" type="button">
                  Edit
                </button>
                <button className="chip" type="button">
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
