export default function SettingsPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="pill">Settings</span>
          <h1>Profile & preferences</h1>
          <p className="muted">Keep your coach aligned with your schedule, tone, and consent choices.</p>
        </div>
      </section>

      <section className="grid-two">
        <div className="card">
          <h3>Profile</h3>
          <form className="form-grid">
            <label className="field">
              Name
              <input className="input input-block" type="text" defaultValue="Jordan Lee" />
            </label>
            <label className="field">
              Timezone
              <select className="input input-block" defaultValue="America/Los_Angeles">
                <option value="America/Los_Angeles">Pacific (US)</option>
                <option value="America/Denver">Mountain (US)</option>
                <option value="America/Chicago">Central (US)</option>
                <option value="America/New_York">Eastern (US)</option>
              </select>
            </label>
            <label className="field">
              Phone
              <input className="input input-block" type="tel" defaultValue="+1 (415) 555-0192" />
            </label>
            <button className="button" type="submit">
              Save profile
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Consent & coaching</h3>
          <div className="stack">
            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              Allow coaching calls
            </label>
            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              Allow transcription for insights
            </label>
            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              Allow secure storage
            </label>
            <div className="field">
              Coaching style
              <div className="radio-grid">
                {[
                  "Supportive",
                  "Direct",
                  "Data-driven",
                  "Mixed"
                ].map((label) => (
                  <label key={label} className="radio">
                    <input type="radio" name="style" defaultChecked={label === "Supportive"} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button className="button secondary" type="button">
              Edit schedule
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Sessions</h3>
          <span className="muted">2 active devices</span>
        </div>
        <div className="list">
          <div className="commitment-row">
            <div>
              <strong>MacBook Pro · San Francisco</strong>
              <div className="muted">Last active: 2 hours ago</div>
            </div>
            <button className="chip" type="button">
              Sign out
            </button>
          </div>
          <div className="commitment-row">
            <div>
              <strong>iPhone · San Francisco</strong>
              <div className="muted">Last active: 10 minutes ago</div>
            </div>
            <button className="chip" type="button">
              Sign out
            </button>
          </div>
        </div>
        <button className="button button-block" type="button">
          Log out of all sessions
        </button>
      </section>
    </div>
  );
}
