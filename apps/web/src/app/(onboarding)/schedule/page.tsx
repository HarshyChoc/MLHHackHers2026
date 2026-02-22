export default function ScheduleOnboardingPage() {
  return (
    <div className="onboarding-content">
      <div className="section-header">
        <span className="pill">Step 3</span>
        <h2>Plan your check-in rhythm</h2>
        <p>Choose when the coach should call or ping, plus how persistent it should be.</p>
      </div>

      <form className="form-grid">
        <div className="form-section">
          <h3>Call windows</h3>
          <div className="field-row">
            <label className="field">
              Days
              <select className="input input-block" defaultValue="weekdays">
                <option value="weekdays">Weekdays</option>
                <option value="daily">Daily</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="field">
              Time range
              <input className="input input-block" type="text" placeholder="8:00 AM - 11:00 AM" />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Do-not-disturb windows</h3>
          <div className="field-row">
            <label className="field">
              Days
              <select className="input input-block" defaultValue="weekends">
                <option value="weekends">Weekends</option>
                <option value="daily">Daily</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="field">
              Time range
              <input className="input input-block" type="text" placeholder="9:00 PM - 7:00 AM" />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Preferred check-in times</h3>
          <div className="chip-grid">
            <button type="button" className="chip">Morning</button>
            <button type="button" className="chip">Midday</button>
            <button type="button" className="chip">Evening</button>
            <button type="button" className="chip">After workouts</button>
          </div>
        </div>

        <div className="form-section">
          <h3>Retry policy</h3>
          <div className="field-row">
            <label className="field">
              Max attempts
              <input className="input input-block" type="number" defaultValue={2} />
            </label>
            <label className="field">
              Delay between attempts
              <input className="input input-block" type="text" placeholder="15 minutes" />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Coaching style preference</h3>
          <div className="radio-grid">
            {[
              "Supportive",
              "Direct",
              "Data-driven",
              "Mixed"
            ].map((label) => (
              <label key={label} className="radio">
                <input type="radio" name="style" defaultChecked={label === "Mixed"} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button className="button button-block" type="submit">
          Finish onboarding
        </button>
      </form>
    </div>
  );
}
