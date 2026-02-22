export default function GoalOnboardingPage() {
  return (
    <div className="onboarding-content">
      <div className="section-header">
        <span className="pill">Step 1</span>
        <h2>Define your north star goal</h2>
        <p>Your coach will use this statement to anchor daily check-ins.</p>
      </div>

      <form className="form-grid">
        <label className="field">
          Goal statement
          <input className="input input-block" type="text" placeholder="Run a 10k by June" required />
        </label>
        <label className="field">
          Motivation
          <textarea className="input input-block input-textarea" rows={3} placeholder="Why does this matter?" />
        </label>
        <label className="field">
          Constraints (optional)
          <textarea className="input input-block input-textarea" rows={3} placeholder="Travel, schedule limits, etc." />
        </label>
        <label className="field">
          Target date
          <input className="input input-block" type="date" />
        </label>
        <button className="button button-block" type="submit">
          Save goal and continue
        </button>
      </form>
    </div>
  );
}
