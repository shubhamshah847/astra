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
    <!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Verify your email</title></head>
      <body style="margin:0;padding:0;background-color:#f5f1f2;font-family:Arial,Helvetica,sans-serif;color:#292129;-webkit-font-smoothing:antialiased">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your ASTRA Sentinel verification code expires in 5 minutes.</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f1f2">
          <tr><td align="center" style="padding:36px 16px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #eadfe2;border-radius:18px;overflow:hidden">
              <tr><td style="padding:25px 32px;background-color:#251f27;background-image:linear-gradient(120deg,#251f27,#3a2631)">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                  <td width="42" valign="middle"><div style="width:38px;height:38px;line-height:38px;text-align:center;border-radius:12px;background-color:#c8263b;color:#ffffff;font-size:20px;font-weight:700">A</div></td>
                  <td valign="middle" style="padding-left:12px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px">ASTRA SENTINEL<br><span style="color:#cdbcc2;font-size:10px;font-weight:400;letter-spacing:1.5px">INTELLIGENCE, IN FOCUS</span></td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:38px 36px 34px">
                <p style="margin:0 0 10px;color:#c8263b;font-size:11px;font-weight:700;letter-spacing:1.8px">SECURE ACCOUNT ACCESS</p>
                <h1 style="margin:0 0 14px;color:#292129;font-size:27px;line-height:1.25;letter-spacing:-.5px">Verify your email</h1>
                <p style="margin:0 0 24px;color:#71656b;font-size:15px;line-height:1.7">Hi ${safeName},<br>Enter this one-time code to verify your ASTRA Sentinel account.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px"><tr><td align="center" style="padding:20px 12px;background-color:#fff5f6;border:1px solid #f2dadd;border-radius:12px">
                  <span style="color:#8f1529;font-size:34px;font-weight:700;letter-spacing:10px;font-variant-numeric:tabular-nums">${otp}</span>
                </td></tr></table>
                <p style="margin:0;color:#71656b;font-size:13px;line-height:1.7">This code expires in <strong style="color:#292129">5 minutes</strong>. For your security, never share it with anyone.</p>
                <div style="height:1px;margin:26px 0 18px;background-color:#eee5e7"></div>
                <p style="margin:0;color:#94888d;font-size:12px;line-height:1.7">If you didn’t request an account, you can safely ignore this email.</p>
              </td></tr>
            </table>
            <p style="margin:18px 0 0;color:#9a8d92;font-size:11px;line-height:1.6">ASTRA SENTINEL &nbsp;·&nbsp; Defence technology intelligence</p>
          </td></tr>
        </table>
      </body>
    </html>`;

  await sendEmail(userEmail, subject, text, html);
}

export async function sendWelcomeEmail(userEmail, name) {
  const safeName = escapeHtml(name);
  const subject = 'Welcome to ASTRA Sentinel';
  const text = `Hi ${name},\n\nYour email is verified and your ASTRA Sentinel account is ready. Sign in to view the defence technology intelligence dashboard.`;
  const html = `
    <!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Welcome to ASTRA Sentinel</title></head>
      <body style="margin:0;padding:0;background-color:#f5f1f2;font-family:Arial,Helvetica,sans-serif;color:#292129;-webkit-font-smoothing:antialiased">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your account is verified. Welcome to ASTRA Sentinel.</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f1f2">
          <tr><td align="center" style="padding:36px 16px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #eadfe2;border-radius:18px;overflow:hidden">
              <tr><td style="padding:25px 32px;background-color:#251f27;background-image:linear-gradient(120deg,#251f27,#3a2631)">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                  <td width="42" valign="middle"><div style="width:38px;height:38px;line-height:38px;text-align:center;border-radius:12px;background-color:#c8263b;color:#ffffff;font-size:20px;font-weight:700">A</div></td>
                  <td valign="middle" style="padding-left:12px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px">ASTRA SENTINEL<br><span style="color:#cdbcc2;font-size:10px;font-weight:400;letter-spacing:1.5px">INTELLIGENCE, IN FOCUS</span></td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:38px 36px 34px">
                <div style="display:inline-block;margin:0 0 18px;padding:7px 11px;border:1px solid #d9eee0;border-radius:999px;background-color:#f0fbf3;color:#246b3c;font-size:11px;font-weight:700;letter-spacing:.4px">&#10003; &nbsp; EMAIL VERIFIED</div>
                <h1 style="margin:0 0 14px;color:#292129;font-size:29px;line-height:1.25;letter-spacing:-.7px">Welcome aboard, ${safeName}.</h1>
                <p style="margin:0 0 23px;color:#71656b;font-size:15px;line-height:1.7">Your account is ready. ASTRA Sentinel brings defence technology reporting, AI analysis, and focused intelligence briefs together in one place.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px"><tr>
                  <td width="33%" valign="top" style="padding:13px 10px 13px 12px;border-left:3px solid #c8263b;background-color:#fff7f8"><div style="color:#8f1529;font-size:11px;font-weight:700;letter-spacing:.5px">MONITOR</div><div style="padding-top:5px;color:#71656b;font-size:12px;line-height:1.5">Track key domains</div></td>
                  <td width="8"></td>
                  <td width="33%" valign="top" style="padding:13px 10px 13px 12px;border-left:3px solid #c8263b;background-color:#fff7f8"><div style="color:#8f1529;font-size:11px;font-weight:700;letter-spacing:.5px">ANALYSE</div><div style="padding-top:5px;color:#71656b;font-size:12px;line-height:1.5">Surface article signals</div></td>
                  <td width="8"></td>
                  <td width="33%" valign="top" style="padding:13px 10px 13px 12px;border-left:3px solid #c8263b;background-color:#fff7f8"><div style="color:#8f1529;font-size:11px;font-weight:700;letter-spacing:.5px">BRIEF</div><div style="padding-top:5px;color:#71656b;font-size:12px;line-height:1.5">Connect saved sources</div></td>
                </tr></table>
                <p style="margin:0;color:#71656b;font-size:14px;line-height:1.7">Sign in to open your intelligence dashboard and begin.</p>
                <div style="height:1px;margin:26px 0 18px;background-color:#eee5e7"></div>
                <p style="margin:0;color:#94888d;font-size:12px;line-height:1.7">You’re receiving this email because an ASTRA Sentinel account was created with this address.</p>
              </td></tr>
            </table>
            <p style="margin:18px 0 0;color:#9a8d92;font-size:11px;line-height:1.6">ASTRA SENTINEL &nbsp;·&nbsp; Defence technology intelligence</p>
          </td></tr>
        </table>
      </body>
    </html>`;

  await sendEmail(userEmail, subject, text, html);
}

// Backwards-compatible names used by the supplied auth snippets.
export const sendOtp = sendOtpEmail;
export const registrationEmail = sendWelcomeEmail;
export const regrestationEmail = sendWelcomeEmail;
