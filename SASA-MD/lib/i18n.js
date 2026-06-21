// ── Internationalisation (English + Sinhala) ───────
const messages = {
  en: {
    ownerOnly:    '🚫 Owner only command.',
    sudoOnly:     '🚫 Sudo/Owner only command.',
    adminOnly:    '🚫 Admin only command.',
    groupOnly:    '🚫 This command only works in groups.',
    cooldown:     '⏳ Wait {s}s before using this command again.',
    banned:       '🚫 You are banned from using this bot.',
    noBalance:    '💸 Insufficient coins.',
    welcome:      '👋 Welcome to *{group}*, @{user}!',
    goodbye:      '👋 Goodbye @{user}! We will miss you.',
  },
  si: {
    ownerOnly:    '🚫 Owner විසින් පමණක් භාවිත කළ හැකි command එකක්.',
    sudoOnly:     '🚫 Sudo/Owner විසින් පමණක් භාවිත කළ හැකි command.',
    adminOnly:    '🚫 Admin command පමණයි.',
    groupOnly:    '🚫 Group chat ලදී පමණකි.',
    cooldown:     '⏳ {s} තත්පර රැඳෙන්න.',
    banned:       '🚫 ඔබ ban කර ඇත.',
    noBalance:    '💸 ප්‍රමාණවත් කාසි නැත.',
    welcome:      '👋 *{group}* හා සාදරයෙන් පිළිගනිමු, @{user}!',
    goodbye:      '👋 @{user} ගිහිල්ල. අපි miss කරනවා!',
  },
};

import config from '../config.js';
export function getMessage(key, vars = {}) {
  const lang = config.language || 'en';
  let txt = (messages[lang] || messages.en)[key] || key;
  for (const [k, v] of Object.entries(vars)) txt = txt.replace(`{${k}}`, v);
  return txt;
}
