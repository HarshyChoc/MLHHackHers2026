import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="auth-form">
      <div className="auth-header">
        <span className="pill">Phone verification</span>
        <h2>Enter the 6-digit code</h2>
        <p>We just sent a one-time passcode to +1 (415) 555-0192.</p>
      </div>

      <form className="form-grid">
        <div className="otp-row">
          {Array.from({ length: 6 }).map((_, index) => (
            <input key={index} className="otp-input" inputMode="numeric" maxLength={1} />
          ))}
        </div>
        <div className="form-row">
          <button className="link" type="button">
            Resend code
          </button>
          <span className="muted">00:42 remaining</span>
        </div>
        <button className="button button-block" type="submit">
          Verify number
        </button>
      </form>

      <div className="auth-footer">
        <Link href="/register">Change phone number</Link>
      </div>
    </div>
  );
}
