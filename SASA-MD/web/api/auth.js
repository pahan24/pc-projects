// ══════════════════════════════════════════════════
//  SASA MD — Auth API
//  Generates & validates one-time login keys
// ══════════════════════════════════════════════════
import crypto    from 'crypto';
import fs        from 'fs-extra';
import path      from 'path';
import NodeCache from 'node-cache';

const KEYS_FILE    = path.join(process.cwd(), 'database', 'webKeys.json');
const RATE_CACHE   = new NodeCache({ stdTTL: 900 }); // 15-min window
const MAX_ATTEMPTS = 5;
const KEY_TTL_MS   = 5 * 60 * 1000; // 5 minutes

// ── DB helpers ────────────────────────────────────
async function readKeys() {
  try { return await fs.readJson(KEYS_FILE); }
  catch { return {}; }
}

async function writeKeys(data) {
  await fs.ensureDir(path.dirname(KEYS_FILE));
  await fs.writeJson(KEYS_FILE, data, { spaces: 2 });
}

// ── Generate a secure one-time login key ──────────
export async function generateLoginKey(phone, page) {
  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + KEY_TTL_MS;

  const db = await readKeys();
  // Remove any existing key for this phone+page
  for (const [k, v] of Object.entries(db)) {
    if (v.phone === phone && v.page === page) delete db[k];
  }
  db[token] = { phone, page, expiry, used: false };
  await writeKeys(db);

  return { token, expiry };
}

// ── Validate a one-time login key ─────────────────
export async function validateLoginKey(phone, token, page) {
  // Rate limit by phone
  const ratKey = `rate_${phone}`;
  const count  = (RATE_CACHE.get(ratKey) || 0) + 1;
  RATE_CACHE.set(ratKey, count);
  if (count > MAX_ATTEMPTS) {
    return { ok: false, error: 'Too many attempts. Try again in 15 minutes.' };
  }

  const db    = await readKeys();
  const entry = db[token];

  if (!entry)                    return { ok: false, error: 'Invalid login key.' };
  if (entry.phone !== phone)     return { ok: false, error: 'Phone number mismatch.' };
  if (entry.page  !== page)      return { ok: false, error: 'Key not valid for this page.' };
  if (entry.used)                return { ok: false, error: 'Key already used.' };
  if (Date.now() > entry.expiry) {
    delete db[token];
    await writeKeys(db);
    return { ok: false, error: 'Login key expired.' };
  }

  // ✅ Valid — mark as used and delete immediately
  delete db[token];
  await writeKeys(db);

  // Reset rate limit on success
  RATE_CACHE.del(ratKey);

  return { ok: true, phone };
}

// ── Clean expired keys (run periodically) ─────────
export async function cleanExpiredKeys() {
  const db  = await readKeys();
  const now = Date.now();
  let changed = false;
  for (const [k, v] of Object.entries(db)) {
    if (now > v.expiry) { delete db[k]; changed = true; }
  }
  if (changed) await writeKeys(db);
}

// Auto-clean every 2 minutes
setInterval(cleanExpiredKeys, 2 * 60 * 1000);
