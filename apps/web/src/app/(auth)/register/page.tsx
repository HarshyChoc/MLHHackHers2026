import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="auth-form">
      <div className="auth-header">
        <span className="pill">Get started</span>
        <h2>Create your Goal Coach account</h2>
        <p>Set up your profile so your coach can tailor nudges, voice check-ins, and progress summaries.</p>
      </div>

      <form className="form-grid">
        <label className="field">
          Full name
          <input className="input input-block" type="text" placeholder="Jordan Lee" required />
        </label>
        <label className="field">
          Email address
          <input className="input input-block" type="email" placeholder="you@domain.com" required />
        </label>
        <label className="field">
          Password
          <input className="input input-block" type="password" placeholder="Minimum 8 characters" required />
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
          Phone number (optional)
          <input className="input input-block" type="tel" placeholder="+1 (415) 555-0192" />
        </label>

        <div className="consent-grid">
          <label className="checkbox">
            <input type="checkbox" defaultChecked />
            I agree to receive coaching calls
          </label>
          <label className="checkbox">
            <input type="checkbox" defaultChecked />
            I consent to transcription for summaries
          </label>
          <label className="checkbox">
            <input type="checkbox" defaultChecked />
            I consent to secure storage of session data
          </label>
        </div>

        <button className="button button-block" type="submit">
          Create account
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account?</span>
        <Link href="/login">Log in</Link>
      </div>
    </div>
  );
}
