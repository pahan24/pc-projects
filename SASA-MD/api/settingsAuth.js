// ══════════════════════════════════════════════════
//  SASA MD — Settings Auth API
//  Permanent keys (no expiry), manual revoke only
// ══════════════════════════════════════════════════
import crypto   from 'crypto';
import fs       from 'fs-extra';
import path     from 'path';
import NodeCache from 'node-cache';

const KEYS_FILE  = path.join(process.cwd(), 'database', 'settingsKeys.json');
const RATE_CACHE = new NodeCache({ stdTTL: 900 }); // 15-min window
const MAX_ATTEMPTS_IP    = 10;
const MAX_ATTEMPTS_PHONE = 5;

// ── File helpers ──────────────────────────────────
async function readKeys() {
  try { return await fs.readJson(KEYS_FILE); }
  catch { return {}; }
}
async function writeKeys(data) {
  await fs.ensureDir(path.dirname(KEYS_FILE));
  await fs.writeJson(KEYS_FILE, data, { spaces: 2 });
}

// ── Generate permanent login key ──────────────────
export async function generatePermanentKey(phone) {
  const db = await readKeys();

  // If key already exists for this phone, return existing
  const existing = Object.entries(db).find(([, v]) => v.phone === phone);
  if (existing) {
    return { key: existing[0], isNew: false };
  }

  const key = crypto.randomBytes(32).toString('hex'); // 64-char hex
  db[key] = {
    phone,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastUsed: null,
    revoked: false,
  };
  await writeKeys(db);
  return { key, isNew: true };
}

// ── Validate login key (no expiry check) ─────────
export async function validateSettingsKey(phone, key, ip = 'unknown') {
  // Rate limit by IP
  const ipKey  = `ip_${ip}`;
  const ipCnt  = (RATE_CACHE.get(ipKey) || 0) + 1;
  RATE_CACHE.set(ipKey, ipCnt);
  if (ipCnt > MAX_ATTEMPTS_IP)
    return { ok: false, error: 'Too many attempts from this IP. Try again in 15 minutes.' };

  // Rate limit by phone
  const phKey = `ph_${phone}`;
  const phCnt = (RATE_CACHE.get(phKey) || 0) + 1;
  RATE_CACHE.set(phKey, phCnt);
  if (phCnt > MAX_ATTEMPTS_PHONE)
    return { ok: false, error: 'Too many attempts for this phone. Try again in 15 minutes.' };

  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  const cleanKey   = String(key   || '').replace(/[^a-f0-9]/gi, '').toLowerCase();

  if (!cleanPhone || !cleanKey)
    return { ok: false, error: 'Phone and key are required.' };

  const db    = await readKeys();
  const entry = db[cleanKey];

  if (!entry)                   return { ok: false, error: 'Invalid login key.' };
  if (entry.phone !== cleanPhone) return { ok: false, error: 'Phone number does not match.' };
  if (entry.revoked)             return { ok: false, error: 'This login key has been revoked.' };

  // Update last used
  db[cleanKey].lastUsed = new Date().toISOString();
  await writeKeys(db);

  // Reset rate limits on success
  RATE_CACHE.del(ipKey);
  RATE_CACHE.del(phKey);

  return { ok: true, phone: cleanPhone, role: entry.role };
}

// ── Revoke a key ──────────────────────────────────
export async function revokeKey(phone) {
  const db = await readKeys();
  let found = false;
  for (const [k, v] of Object.entries(db)) {
    if (v.phone === phone) {
      db[k].revoked = true;
      found = true;
    }
  }
  if (found) await writeKeys(db);
  return found;
}

// ── List all keys (admin use) ─────────────────────
export async function listAllKeys() {
  const db = await readKeys();
  return Object.entries(db).map(([key, v]) => ({
    keyPreview: key.slice(0, 8) + '...',
    phone: v.phone,
    role: v.role,
    createdAt: v.createdAt,
    lastUsed: v.lastUsed,
    revoked: v.revoked,
  }));
}
