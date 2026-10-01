import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/user.models.js';
import { isAuth } from '../middleware/auth.middleware.js';
import { createAuthToken } from '../utils/authToken.js';
import { redis } from '../utils/redis.js';
import { sendOtpEmail, sendWelcomeEmail } from '../services/email.service.js';

const router = express.Router();
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

function setSessionCookie(res, userId) {
  res.cookie('token', createAuthToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_AGE,
  });
}

function emailKeys(email) {
  const digest = createHash('sha256').update(email).digest('hex');
  return {
    code: `auth:otp:${digest}`,
    attempts: `auth:otp-attempts:${digest}`,
    resend: `auth:otp-resend:${digest}`,
  };
}

function redisUnavailable(res) {
  if (redis.status === 'ready') return false;
  res.status(503).json({ error: 'Email verification is temporarily unavailable because Redis is offline' });
  return true;
}

async function deliverOtp(user) {
  const keys = emailKeys(user.email);
  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const otpHash = createHash('sha256').update(otp).digest('hex');

  await redis.set(keys.code, otpHash, 'EX', OTP_TTL_SECONDS);
  await redis.set(keys.attempts, '0', 'EX', OTP_TTL_SECONDS);
  await redis.set(keys.resend, '1', 'EX', RESEND_COOLDOWN_SECONDS);

  try {
    await sendOtpEmail(user.email, user.name, otp);
  } catch (error) {
    await redis.del(keys.code, keys.attempts, keys.resend);
    throw error;
  }
}

async function findPendingUser(body = {}) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email) return User.findOne({ email });
  if (mongoose.isValidObjectId(body._id)) return User.findById(body._id);
  return null;
}

async function register(req, res, next) {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!name || name.length > 100) {
      return res.status(400).json({ error: 'Name is required and must be under 100 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8 to 128 characters' });
    }
    if (redisUnavailable(res)) return;

    let user = await User.findOne({ email });
    let createdHere = false;
    if (user?.isVerified) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    if (user) {
      const waitSeconds = await redis.ttl(emailKeys(email).resend);
      if (waitSeconds > 0) {
        return res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting another code`, retryAfter: waitSeconds });
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      user = await User.create({ name, email, password: passwordHash, isVerified: false });
      createdHere = true;
    }

    try {
      await deliverOtp(user);
    } catch (error) {
      if (createdHere) await User.deleteOne({ _id: user._id }).catch(() => {});
      console.error('Could not send verification email:', error.message);
      return res.status(503).json({ error: 'Could not send the verification email. Check the mail settings and try again.' });
    }

    return res.status(201).json({
      pendingVerification: true,
      userId: user._id,
      email: user.email,
      message: 'A six-digit verification code was sent to your email.',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Verify your email before signing in', verificationRequired: true });
    }

    setSessionCookie(res, user._id);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Enter the six-digit verification code' });
    }
    if (redisUnavailable(res)) return;

    const user = await findPendingUser(req.body);
    if (!user) return res.status(404).json({ error: 'Registration not found' });
    if (user.isVerified) return res.status(409).json({ error: 'This email is already verified. Please sign in.' });

    const keys = emailKeys(user.email);
    const storedHash = await redis.get(keys.code);
    if (!storedHash) return res.status(400).json({ error: 'The code expired. Request a new one.' });

    const attempts = await redis.incr(keys.attempts);
    if (attempts > MAX_OTP_ATTEMPTS) {
      await redis.del(keys.code, keys.attempts);
      return res.status(429).json({ error: 'Too many incorrect codes. Request a new code.' });
    }

    const providedHash = createHash('sha256').update(otp).digest('hex');
    const matches = timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(providedHash, 'hex'));
    if (!matches) {
      return res.status(400).json({ error: `Incorrect code. ${MAX_OTP_ATTEMPTS - attempts} attempts remaining.` });
    }

    user.isVerified = true;
    await user.save();
    await redis.del(keys.code, keys.attempts, keys.resend);

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Account verified, but welcome email could not be sent:', error.message);
    }

    setSessionCookie(res, user._id);
    return res.json({ user: publicUser(user), message: 'Email verified. Welcome to ASTRA Sentinel.' });
  } catch (error) {
    return next(error);
  }
}

async function resendOtp(req, res, next) {
  if (redisUnavailable(res)) return;

  try {
    const user = await findPendingUser(req.body);
    if (!user || user.isVerified) {
      return res.status(404).json({ error: 'Unverified registration was not found' });
    }

    const keys = emailKeys(user.email);
    const waitSeconds = await redis.ttl(keys.resend);
    if (waitSeconds > 0) {
      return res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting another code`, retryAfter: waitSeconds });
    }

    try {
      await deliverOtp(user);
    } catch (error) {
      await redis.del(keys.code, keys.attempts, keys.resend);
      console.error('Could not resend verification email:', error.message);
      return res.status(503).json({ error: 'Could not send the verification email. Check the mail settings and try again.' });
    }

    return res.json({ message: 'A new verification code was sent to your email.' });
  } catch (error) {
    return next(error);
  }
}

router.post(['/register', '/user/register'], register);
router.post(['/login', '/user/login'], login);
router.post(['/verify-otp', '/user/verify-otp'], verifyOtp);
router.post(['/resend-otp', '/generate-new-otp'], resendOtp);

router.get(['/me', '/get-current-user'], isAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select('name email');
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post(['/logout', '/user/logout'], (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ ok: true });
});

export default router;
