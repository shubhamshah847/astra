import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { serverURI } from "../App";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes validity
const RESEND_COOLDOWN_SECONDS = 10; // 10 seconds wait to resend

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [otp, setOtp] = useState("");
  
  // 5-minute OTP expiration timer
  const [otpTimeLeft, setOtpTimeLeft] = useState(() => {
    const savedExpiry = localStorage.getItem("otpExpiresAt");
    if (savedExpiry) {
      const remaining = Math.ceil((Number(savedExpiry) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return OTP_EXPIRY_SECONDS;
  });

  // 10-second Resend button cooldown timer
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Safeguard: Redirect if userId is missing
  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
    }
  }, [userId, navigate]);

  // Handle 5-Minute OTP Expiry Countdown
  useEffect(() => {
    let savedExpiry = localStorage.getItem("otpExpiresAt");

    if (!savedExpiry) {
      savedExpiry = String(Date.now() + OTP_EXPIRY_SECONDS * 1000);
      localStorage.setItem("otpExpiresAt", savedExpiry);
    }

    const updateTimer = () => {
      const expiry = Number(localStorage.getItem("otpExpiresAt"));
      const remaining = Math.ceil((expiry - Date.now()) / 1000);

      if (remaining <= 0) {
        setOtpTimeLeft(0);
        localStorage.removeItem("otpExpiresAt");
      } else {
        setOtpTimeLeft(remaining);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle 10-Second Resend Cooldown Countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    if (value.length <= 6) {
      setOtp(value);
      setError("");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${serverURI}/auth/verify-otp`,
        { _id: userId, otp },
        { withCredentials: true }
      );

      setMessage(response.data.message);
      localStorage.removeItem("otpExpiresAt");

      setTimeout(() => {
        navigate("/login/user");
      }, 900);
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError("");
      setMessage("");

      const response = await axios.post(
        `${serverURI}/auth/generate-new-otp`,
        { _id: userId },
        { withCredentials: true }
      );

      setMessage(response.data.message);
      setOtp("");

      // Reset 5-minute expiry timer
      const newExpiry = Date.now() + OTP_EXPIRY_SECONDS * 1000;
      localStorage.setItem("otpExpiresAt", String(newExpiry));
      setOtpTimeLeft(OTP_EXPIRY_SECONDS);

      // Reset 10-second resend cooldown timer
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate new OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
        <div className="otp-icon">🔐</div>

        <h1>Verify Your Email</h1>

        <p className="otp-description">
          We have sent a 6-digit verification code to your email address.
        </p>

        <form onSubmit={handleVerify}>
          <label>Enter OTP</label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            placeholder="••••••"
            className="otp-input"
            autoFocus
          />

          <div className="otp-dots">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <span
                key={index}
                className={index < otp.length ? "active" : ""}
              ></span>
            ))}
          </div>

          <div className="timer">
            {otpTimeLeft > 0 ? (
              <>
                OTP expires in <strong>{formatTime(otpTimeLeft)}</strong>
              </>
            ) : (
              <span className="expired">OTP has expired</span>
            )}
          </div>

          {error && <div className="otp-error">{error}</div>}
          {message && <div className="otp-success">{message}</div>}

          <button
            type="submit"
            className="verify-btn"
            disabled={loading || otp.length !== 6 || otpTimeLeft === 0}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="resend-section">
          <p>Didn't receive the code?</p>

          <button
            type="button"
            className="resend-btn"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
          >
            {resending
              ? "Sending..."
              : resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : "Resend OTP"}
          </button>
        </div>

        <div className="otp-footer">
          <span>Yumzo</span> • Secure Email Verification
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;