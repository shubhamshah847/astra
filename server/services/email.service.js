import 'dotenv/config';
import nodemailer from 'nodemailer';

const sender = process.env.EMAIL_USER;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: sender,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

async function sendEmail(to, subject, text, html) {
  if (!sender || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REFRESH_TOKEN) {
    throw new Error('Email is not configured. Set EMAIL_USER, CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN.');
  }

  return transporter.sendMail({
    from: `ASTRA Sentinel <${sender}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendOtpEmail(userEmail, name, otp) {
  const safeName = escapeHtml(name);
  const subject = 'Your ASTRA Sentinel verification code';
  const text = `Hi ${name},\n\nYour ASTRA Sentinel verification code is ${otp}. It expires in 5 minutes. If you did not create this account, ignore this email.`;
  const html = `
    <div style="max-width:520px;margin:32px auto;padding:28px;font-family:Arial,sans-serif;color:#172b3a;border:1px solid #d9e2ea;border-radius:14px">
      <p style="margin:0;color:#1f4e79;font-weight:bold;letter-spacing:2px">ASTRA SENTINEL</p>
      <h1 style="font-size:23px">Verify your email</h1>
      <p>Hi ${safeName}, use this code to verify your account:</p>
      <div style="margin:24px 0;padding:18px;text-align:center;background:#eef4f9;border-radius:10px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1f4e79">${otp}</div>
      <p>This code expires in 5 minutes. Never share it with anyone.</p>
      <p style="color:#667788;font-size:12px">If you did not request this code, you can ignore this email.</p>
    </div>`;

  await sendEmail(userEmail, subject, text, html);
}

export async function sendWelcomeEmail(userEmail, name) {
  const safeName = escapeHtml(name);
  const subject = 'Welcome to ASTRA Sentinel';
  const text = `Hi ${name},\n\nYour email is verified and your ASTRA Sentinel account is ready. Sign in to view the defence technology intelligence dashboard.`;
  const html = `
    <div style="max-width:520px;margin:32px auto;padding:28px;font-family:Arial,sans-serif;color:#172b3a;border:1px solid #d9e2ea;border-radius:14px">
      <p style="margin:0;color:#1f4e79;font-weight:bold;letter-spacing:2px">ASTRA SENTINEL</p>
      <h1 style="font-size:23px">Welcome, ${safeName}</h1>
      <p>Your email has been verified and your account is ready.</p>
      <p>You can now sign in to view the defence technology intelligence dashboard.</p>
    </div>`;

  await sendEmail(userEmail, subject, text, html);
}

// Backwards-compatible names used by the supplied auth snippets.
export const sendOtp = sendOtpEmail;
export const registrationEmail = sendWelcomeEmail;
export const regrestationEmail = sendWelcomeEmail;
