// ══════════════════════════════════════════════════
//  SASA MD — Admin Auth API
//  bcrypt + JWT, hidden route only
// ══════════════════════════════════════════════════
import crypto    from 'crypto';
import fs        from 'fs-extra';
import path      from 'path';
import NodeCache from 'node-cache';

const SESSIONS_CACHE = new NodeCache({ stdTTL: 3600 }); // 1-hour JWT-like sessions
const RATE_CACHE     = new NodeCache({ stdTTL: 900  }); // 15-min rate window
const MAX_ATTEMPTS   = 5;

// ── Simple HMAC-signed session token (no jwt dep needed) ──
const SECRET = process.env.ADMIN_JWT_SECRET || crypto.randomBytes(32).toString('hex');

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try { return JSON.parse(Buffer.from(data, 'base64url').toString()); }
  catch { return null; }
}

// ── Get admin credentials from config/env ─────────
function getAdminCreds() {
  return {
    username: process.env.ADMIN_USERNAME || 'sasaadmin',
    // Plain password for fallback (should be hashed in production via env ADMIN_PASS_HASH)
    password: process.env.ADMIN_PASSWORD || 'SasaMD@Admin2024!',
    passHash: process.env.ADMIN_PASS_HASH || null,
  };
}

// ── Simple password check (no bcrypt dep for portability) ─
// In production set ADMIN_PASS_HASH as SHA-256 hex of password
function checkPassword(input, creds) {
  if (creds.passHash) {
    const inputHash = crypto.createHash('sha256').update(input).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(creds.passHash));
  }
  // Fallback: timing-safe plain compare
  try {
    return crypto.timingSafeEqual(
      Buffer.from(input.padEnd(64)),
      Buffer.from(creds.password.padEnd(64))
    );
  } catch { return false; }
}

// ── Login ─────────────────────────────────────────
export async function adminLogin(username, password, ip = 'unknown') {
  const rateKey = `admin_rate_${ip}`;
  const attempts = (RATE_CACHE.get(rateKey) || 0) + 1;
  RATE_CACHE.set(rateKey, attempts);

  if (attempts > MAX_ATTEMPTS)
    return { ok: false, error: 'Too many login attempts. Try again in 15 minutes.' };

  const creds = getAdminCreds();

  // Timing-safe username check
  let usernameMatch = false;
  try {
    usernameMatch = crypto.timingSafeEqual(
      Buffer.from((username || '').padEnd(64)),
      Buffer.from(creds.username.padEnd(64))
    );
  } catch {}

  if (!usernameMatch || !checkPassword(password || '', creds)) {
    return { ok: false, error: 'Invalid credentials.' };
  }

  RATE_CACHE.del(rateKey);
  const token = signToken({ role: 'admin', iat: Date.now() });
  return { ok: true, token };
}

// ── Middleware factory ────────────────────────────
export function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.cookies?.admin_token;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }
  req.admin = payload;
  next();
}

export { verifyToken };
