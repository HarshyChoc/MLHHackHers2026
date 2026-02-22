const habitStats = [
  {
    title: "Morning stretch",
    completion: 92,
    done: 6,
    target: 7,
    recommendation: "Keep"
  },
  {
    title: "Deep work block",
    completion: 71,
    done: 5,
    target: 7,
    recommendation: "Simplify"
  },
  {
    title: "Hydration check",
    completion: 100,
    done: 7,
    target: 7,
    recommendation: "Increase"
  }
];

const planChanges = [
  "Shift deep work block to 10:00 AM on Wednesdays",
  "Add hydration reminder after lunch",
  "Defer Saturday stretch"
];

export default function ReviewPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="pill">Weekly review</span>
          <h1>Week of Feb 16 - Feb 22</h1>
          <p className="muted">Celebrate wins, surface blockers, and approve plan changes.</p>
        </div>
        <div className="date-controls">
          <button className="button secondary" type="button">
            Previous week
          </button>
          <button className="button secondary" type="button">
            Next week
          </button>
        </div>
      </section>

      <section className="grid-three">
        {habitStats.map((habit) => (
          <div key={habit.title} className="card">
            <div className="card-header">
              <strong>{habit.title}</strong>
              <span className="badge">{habit.recommendation}</span>
            </div>
            <div className="progress-bar">
              <div style={{ width: `${habit.completion}%` }} />
            </div>
            <p className="muted">
              {habit.done} of {habit.target} completed
            </p>
            <div className="stat-row">
              <span>Completion</span>
              <strong>{habit.completion}%</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="grid-two">
        <div className="card">
          <h3>Wins</h3>
          <ul className="list clean">
            <li>Completed 5 deep work blocks despite travel.</li>
            <li>Logged mood every day this week.</li>
            <li>Kept the stretch habit even on busy days.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Misses</h3>
          <ul className="list clean">
            <li>Skipped two hydration checks on Thursday.</li>
            <li>Late-night workouts disrupted sleep.</li>
          </ul>
        </div>
      </section>

      <section className="grid-two">
        <div className="card">
          <h3>Blockers identified</h3>
          <ul className="list clean">
            <li>Back-to-back meetings pushed deep work later in the day.</li>
            <li>Evening social events reduced recovery time.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Suggested fixes</h3>
          <ul className="list clean">
            <li>Front-load deep work to mornings three days a week.</li>
            <li>Switch to 30 minute workouts on travel days.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Pending plan changes</h3>
          <span className="muted">3 proposals</span>
        </div>
        <div className="list">
          {planChanges.map((change) => (
            <div key={change} className="plan-row">
              <p>{change}</p>
              <div className="plan-actions">
                <button className="chip" type="button">
                  Approve
                </button>
                <button className="chip" type="button">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
        <label className="field">
          Add a note to your coach
          <textarea className="input input-block input-textarea" rows={3} placeholder="Share context for next week..." />
        </label>
        <button className="button button-block" type="button">
          Apply selected changes
        </button>
      </section>
    </div>
  );
}
