import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const OTP_LIFETIME = 5 * 60;
const RESEND_WAIT = 30;

export default function VerifyOtpPage() {
  const email = useLocation().state?.email;
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_LIFETIME);
  const [resendWait, setResendWait] = useState(RESEND_WAIT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((remaining) => Math.max(remaining - 1, 0));
      setResendWait((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!email) return <Navigate to="/register" replace />;

  async function handleVerify(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await verifyOtp(email, otp);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await resendOtp(email);
      setOtp('');
      setSecondsLeft(OTP_LIFETIME);
      setResendWait(RESEND_WAIT);
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="otp-heading">
        <div className="auth-mark" aria-hidden="true">A</div>
        <p className="auth-eyebrow">ASTRA SENTINEL</p>
        <h1 id="otp-heading">Verify your email</h1>
        <p className="auth-subtitle">Enter the six-digit code sent to <strong>{email}</strong>.</p>

        <form className="auth-form" onSubmit={handleVerify}>
          <label>
            Verification code
            <input
              aria-label="Six-digit verification code"
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>
          <p className="muted">Code expires in {minutes}:{seconds}</p>
          {error && <p className="message error" role="alert">{error}</p>}
          {message && <p className="message ok" role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={busy || otp.length !== 6 || secondsLeft === 0}>
            {busy ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>

        <button className="link-button otp-resend" type="button" onClick={handleResend} disabled={busy || resendWait > 0}>
          {resendWait > 0 ? `Resend code in ${resendWait}s` : 'Resend verification code'}
        </button>
        <p className="auth-switch"><Link to="/register">Back to registration</Link></p>
      </section>
    </main>
  );
}
