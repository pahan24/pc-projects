// ╔══════════════════════════════════════════════════════════════╗
// ║  SASA MD — Web Panel Bot Commands                            ║
// ║  .settings  .coinpanel — secure one-time key generation      ║
// ╚══════════════════════════════════════════════════════════════╝
import { generateLoginKey } from '../../web/api/auth.js';

const WEB_DOMAIN = process.env.WEB_DOMAIN || `http://localhost:${process.env.WEB_PORT || 3000}`;

// ── Helper: format a countdown ────────────────────────────────
function fmtMs(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
}

// ── Helper: build the secure message ─────────────────────────
function buildMessage(phone, key, expiresAt, page, url) {
  const ttl = fmtMs(expiresAt - Date.now());
  const icon = page === 'settings' ? '⚙️' : '💰';
  const title = page === 'settings' ? '🔐 WEB SETTINGS ACCESS' : '💰 COIN PANEL ACCESS';

  return [
    `╔══════════════════════════╗`,
    `║  ${title}`,
    `╚══════════════════════════╝`,
    ``,
    `📱 *Phone:* +${phone}`,
    ``,
    `🔑 *Login Key:*`,
    `\`${key}\``,
    ``,
    `⏳ *Expires in:* ${ttl}`,
    `♻️  *One-time use only*`,
    ``,
    `🌐 *Open:*`,
    `${url}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚠️ _Do NOT share this key._`,
    `_It expires in 5 minutes and can only be used once._`,
  ].join('\n');
}

// ── .settings command ─────────────────────────────────────────
export const settings = {
  name: 'settings',
  aliases: ['webpanel', 'panel', 'wpanel'],
  description: 'Get a secure one-time link to the Settings web panel',
  usage: '.settings',
  category: 'owner',

  async run({ sock, msg, jid, senderNum }) {
    // Security: private chat only
    if (jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: '🔒 *Security*: The `.settings` command only works in private chat to protect your login key.',
        quoted: msg,
      });
    }

    try {
      const { key, expiresAt } = await generateLoginKey(senderNum, 'settings');
      const url = `${WEB_DOMAIN}/settings`;
      await sock.sendMessage(jid, {
        text: buildMessage(senderNum, key, expiresAt, 'settings', url),
        quoted: msg,
      });
    } catch (err) {
      await sock.sendMessage(jid, {
        text: `❌ Failed to generate login key: ${err.message}`,
        quoted: msg,
      });
    }
  },
};

// ── .coinpanel command ────────────────────────────────────────
export const coinpanel = {
  name: 'coinpanel',
  aliases: ['mycoin', 'coinweb', 'economyweb'],
  description: 'Get a secure one-time link to the Coin Economy web panel',
  usage: '.coinpanel',
  category: 'economy',

  async run({ sock, msg, jid, senderNum }) {
    // Security: private chat only
    if (jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: '🔒 *Security*: The `.coinpanel` command only works in private chat to protect your login key.',
        quoted: msg,
      });
    }

    try {
      const { key, expiresAt } = await generateLoginKey(senderNum, 'coins');
      const url = `${WEB_DOMAIN}/coins`;
      await sock.sendMessage(jid, {
        text: buildMessage(senderNum, key, expiresAt, 'coins', url),
        quoted: msg,
      });
    } catch (err) {
      await sock.sendMessage(jid, {
        text: `❌ Failed to generate login key: ${err.message}`,
        quoted: msg,
      });
    }
  },
};
