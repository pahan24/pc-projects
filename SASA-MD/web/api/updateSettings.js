// ══════════════════════════════════════════════════
//  SASA MD — Settings Update API
//  Applies changes to database + live config
// ══════════════════════════════════════════════════
import { getSettings, updateSetting } from '../../lib/database.js';

// Allowed setting keys and their types
const ALLOWED_SETTINGS = {
  prefix:         'string',
  mode:           'enum:public,private,group',
  reactEnabled:   'boolean',
  reactEmoji:     'string',
  reactDelay:     'number',
  autoRead:       'boolean',
  autoTyping:     'boolean',
  autoRecording:  'boolean',
  cooldownSeconds:'number',
  welcomeMsg:     'string',
  goodbyeMsg:     'string',
  antiLink:       'boolean',
  antiSpam:       'boolean',
  antiDelete:     'boolean',
  antiViewOnce:   'boolean',
  levelAnnounce:  'boolean',
};

export async function applySettingUpdate(key, value) {
  const type = ALLOWED_SETTINGS[key];
  if (!type) return { ok: false, error: `Setting '${key}' is not allowed.` };

  // Validate and coerce value
  let coerced;
  if (type === 'boolean') {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false')
      return { ok: false, error: `${key} must be a boolean.` };
    coerced = value === true || value === 'true';

  } else if (type === 'number') {
    coerced = Number(value);
    if (isNaN(coerced) || coerced < 0)
      return { ok: false, error: `${key} must be a positive number.` };

  } else if (type.startsWith('enum:')) {
    const options = type.split(':')[1].split(',');
    coerced = String(value).toLowerCase();
    if (!options.includes(coerced))
      return { ok: false, error: `${key} must be one of: ${options.join(', ')}.` };

  } else {
    // string — sanitize
    coerced = String(value).slice(0, 500).replace(/<[^>]*>/g, '');
  }

  await updateSetting(key, coerced);
  return { ok: true, key, value: coerced };
}

export async function getAllSettings() {
  const s = await getSettings();
  // Only expose allowed keys
  const safe = {};
  for (const key of Object.keys(ALLOWED_SETTINGS)) {
    if (s[key] !== undefined) safe[key] = s[key];
  }
  return safe;
}
