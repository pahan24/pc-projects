// ══════════════════════════════════════════════════
//  SASA MD — Settings Update API (server-side only)
// ══════════════════════════════════════════════════
import fs     from 'fs-extra';
import path   from 'path';

const DB_FILE = path.join(process.cwd(), 'database', 'settings.json');

// Allowed keys with strict type validation
const SCHEMA = {
  prefix:          { type: 'string',  min: 1, max: 5 },
  mode:            { type: 'enum',    values: ['public', 'private', 'group'] },
  reactEnabled:    { type: 'boolean' },
  reactEmoji:      { type: 'string',  min: 1, max: 10 },
  reactDelay:      { type: 'number',  min: 0, max: 10000 },
  autoRead:        { type: 'boolean' },
  autoTyping:      { type: 'boolean' },
  autoRecording:   { type: 'boolean' },
  antiDelete:      { type: 'boolean' },
  antiLink:        { type: 'boolean' },
  antiSpam:        { type: 'boolean' },
  antiViewOnce:    { type: 'boolean' },
  cooldownSeconds: { type: 'number',  min: 0, max: 300 },
  welcomeEnabled:  { type: 'boolean' },
  goodbyeEnabled:  { type: 'boolean' },
  welcomeMsg:      { type: 'string',  max: 500 },
  goodbyeMsg:      { type: 'string',  max: 500 },
  levelAnnounce:   { type: 'boolean' },
};

async function readSettings() {
  try { return await fs.readJson(DB_FILE); } catch { return {}; }
}
async function saveSettings(data) {
  await fs.ensureDir(path.dirname(DB_FILE));
  await fs.writeJson(DB_FILE, data, { spaces: 2 });
}

export async function getFullSettings() {
  return await readSettings();
}

export async function updateOneSetting(key, rawValue) {
  const rule = SCHEMA[key];
  if (!rule) return { ok: false, error: `Unknown setting: '${key}'` };

  let value;
  try {
    if (rule.type === 'boolean') {
      if (rawValue === true || rawValue === 'true'  || rawValue === 1 || rawValue === '1') value = true;
      else if (rawValue === false || rawValue === 'false' || rawValue === 0 || rawValue === '0') value = false;
      else throw new Error('must be boolean');

    } else if (rule.type === 'number') {
      value = Number(rawValue);
      if (isNaN(value)) throw new Error('must be a number');
      if (rule.min !== undefined && value < rule.min) throw new Error(`min ${rule.min}`);
      if (rule.max !== undefined && value > rule.max) throw new Error(`max ${rule.max}`);

    } else if (rule.type === 'enum') {
      value = String(rawValue).toLowerCase().trim();
      if (!rule.values.includes(value)) throw new Error(`must be one of: ${rule.values.join(', ')}`);

    } else {
      // string
      value = String(rawValue).replace(/<[^>]*>/g, '').slice(0, rule.max || 500);
      if (rule.min && value.length < rule.min) throw new Error(`min length ${rule.min}`);
    }
  } catch (e) {
    return { ok: false, error: `${key}: ${e.message}` };
  }

  const db = await readSettings();
  db[key]  = value;
  await saveSettings(db);
  return { ok: true, key, value };
}

export async function updateBulkSettings(updates) {
  if (!updates || typeof updates !== 'object') return { ok: false, error: 'updates must be an object' };
  const results = [];
  for (const [key, value] of Object.entries(updates)) {
    results.push(await updateOneSetting(key, value));
  }
  const errors = results.filter(r => !r.ok).map(r => r.error);
  if (errors.length) return { ok: false, errors };
  return { ok: true, updated: results.length };
}
