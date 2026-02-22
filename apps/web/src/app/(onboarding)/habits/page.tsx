const sampleHabits = [
  {
    title: "Morning stretch",
    frequency: "Weekdays",
    measurement: "Duration · 10 min",
    window: "07:00 - 08:00",
    difficulty: 3
  },
  {
    title: "Deep work block",
    frequency: "3x per week",
    measurement: "Duration · 60 min",
    window: "09:00 - 11:00",
    difficulty: 6
  }
];

export default function HabitOnboardingPage() {
  return (
    <div className="onboarding-content">
      <div className="section-header">
        <span className="pill">Step 2</span>
        <h2>Shape the habits that serve the goal</h2>
        <p>Add multiple habits, then fine-tune their cadence, targets, and time windows.</p>
      </div>

      <div className="split-grid">
        <form className="form-grid">
          <label className="field">
            Habit title
            <input className="input input-block" type="text" placeholder="Evening walk" required />
          </label>
          <label className="field">
            Frequency
            <select className="input input-block" defaultValue="weekdays">
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="custom">Specific days</option>
              <option value="xperweek">X per week</option>
            </select>
          </label>
          <div className="field-row">
            <label className="field">
              Measurement type
              <select className="input input-block" defaultValue="duration">
                <option value="binary">Yes / No</option>
                <option value="count">Count</option>
                <option value="duration">Duration (minutes)</option>
              </select>
            </label>
            <label className="field">
              Target value
              <input className="input input-block" type="number" placeholder="10" />
            </label>
          </div>
          <label className="field">
            Difficulty (1-10)
            <input className="range" type="range" min={1} max={10} defaultValue={4} />
          </label>
          <div className="field-row">
            <label className="field">
              Start time
              <input className="input input-block" type="time" defaultValue="07:00" />
            </label>
            <label className="field">
              End time
              <input className="input input-block" type="time" defaultValue="08:00" />
            </label>
          </div>
          <button className="button button-block" type="submit">
            Add habit
          </button>
        </form>

        <div className="stack">
          <h3>Habits in this goal</h3>
          {sampleHabits.map((habit) => (
            <div key={habit.title} className="card">
              <div className="card-header">
                <strong>{habit.title}</strong>
                <span className="badge">Difficulty {habit.difficulty}</span>
              </div>
              <p className="muted">{habit.frequency}</p>
              <p>{habit.measurement}</p>
              <div className="card-row">
                <span className="chip">{habit.window}</span>
                <button className="link" type="button">
                  Edit
                </button>
              </div>
            </div>
          ))}
          <button className="button secondary button-block" type="button">
            Continue to schedule setup
          </button>
        </div>
      </div>
    </div>
  );
}
