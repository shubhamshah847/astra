import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';

const configuredSecret = process.env.JWT_WEB_TOKEN || process.env.JWT_SECRET;
if (!configuredSecret && process.env.NODE_ENV === 'production') {
  throw new Error('Set JWT_WEB_TOKEN in server/.env before starting in production');
}

function getDevelopmentSecret() {
  const secretPath = fileURLToPath(new URL('../.dev-jwt-secret', import.meta.url));
  try {
    return readFileSync(secretPath, 'utf8').trim();
  } catch {
    const generated = randomBytes(32).toString('hex');
    try {
      writeFileSync(secretPath, generated, { flag: 'wx', mode: 0o600 });
      return generated;
    } catch {
      try {
        return readFileSync(secretPath, 'utf8').trim();
      } catch {
        return generated;
      }
    }
  }
}

const secret = configuredSecret || getDevelopmentSecret();
if (!configuredSecret) {
  console.warn('JWT_WEB_TOKEN is unset; using a local development secret. Set it in server/.env for production.');
}

export function createAuthToken(userId) {
  return jwt.sign({ id: String(userId) }, secret, { expiresIn: '7d' });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, secret);
}
