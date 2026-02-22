import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="auth-form">
      <div className="auth-header">
        <span className="pill">Welcome back</span>
        <h2>Log in to your coach space</h2>
        <p>Continue your goal rhythm and check in with your AI listener.</p>
      </div>

      <form className="form-grid">
        <label className="field">
          Email address
          <input className="input input-block" type="email" placeholder="you@domain.com" required />
        </label>
        <label className="field">
          Password
          <input className="input input-block" type="password" placeholder="••••••••" required />
        </label>
        <div className="form-row">
          <label className="checkbox">
            <input type="checkbox" />
            Remember me
          </label>
          <button className="link" type="button">
            Forgot password?
          </button>
        </div>
        <div className="alert error">
          Login failed. Double-check your email, password, or verification status.
        </div>
        <button className="button button-block" type="submit">
          Log in
        </button>
      </form>

      <div className="auth-footer">
        <span>New here?</span>
        <Link href="/register">Create an account</Link>
      </div>
    </div>
  );
}
