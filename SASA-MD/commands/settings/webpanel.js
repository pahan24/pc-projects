// ══════════════════════════════════════════════════
//  SASA MD — Web Panel Commands
//  .settings and .coinpanel — generate secure keys
// ══════════════════════════════════════════════════
import { generateLoginKey } from '../../web/api/auth.js';
import config from '../../config.js';

// ── Helper ────────────────────────────────────────
function formatKey(token) {
  // Show first 8 chars + ... for readability in WhatsApp
  return token.slice(0, 8) + '-' + token.slice(8, 16) + '-...' ;
}

function getBaseUrl() {
  return process.env.WEB_URL || `http://localhost:${process.env.WEB_PORT || 4000}`;
}

export const settingsPanel = {
  name: 'settings', aliases: ['panel', 'webpanel'],
  description: 'Get a one-time login key for the Settings web panel',
  usage: '.settings',
  category: 'settings',
  cooldown: 10,

  async run({ sock, msg, jid, senderNum, isOwner, isGroup }) {
    // Restrict to private chat only for security
    if (isGroup) {
      return sock.sendMessage(jid, {
        text: '🔒 *Security:* Use this command in private chat only.',
        quoted: msg,
      });
    }

    try {
      const { token, expiry } = await generateLoginKey(senderNum, 'settings');
      const base = getBaseUrl();
      const expiresIn = '5 minutes';
      const expiryTime = new Date(expiry).toLocaleTimeString();

      await sock.sendMessage(jid, {
        text: [
          `🔐 *SASA MD — Web Settings Access*`,
          `${'─'.repeat(34)}`,
          ``,
          `📱 *Phone:* ${senderNum}`,
          `🔑 *Login Key:*`,
          `\`\`\`${token}\`\`\``,
          ``,
          `⏳ *Expires in:* ${expiresIn} (at ${expiryTime})`,
          `♻️ *One-time use:* Key deletes on login`,
          ``,
          `🌐 *Open Settings Panel:*`,
          `${base}/settings`,
          ``,
          `⚠️ _Do NOT share this key with anyone._`,
          `⚠️ _Key expires at ${expiryTime}._`,
        ].join('\n'),
        quoted: msg,
      });
    } catch (e) {
      await sock.sendMessage(jid, {
        text: `❌ Failed to generate key: ${e.message}`,
        quoted: msg,
      });
    }
  },
};

export const coinPanel = {
  name: 'coinpanel', aliases: ['coins', 'wallet', 'mywallet'],
  description: 'Get a one-time login key for the Coin web panel',
  usage: '.coinpanel',
  category: 'economy',
  cooldown: 10,

  async run({ sock, msg, jid, senderNum, isGroup }) {
    if (isGroup) {
      return sock.sendMessage(jid, {
        text: '🔒 *Security:* Use this command in private chat only.',
        quoted: msg,
      });
    }

    try {
      const { token, expiry } = await generateLoginKey(senderNum, 'coins');
      const base = getBaseUrl();
      const expiresIn = '5 minutes';
      const expiryTime = new Date(expiry).toLocaleTimeString();

      await sock.sendMessage(jid, {
        text: [
          `💰 *SASA MD — Coin Panel Access*`,
          `${'─'.repeat(34)}`,
          ``,
          `📱 *Phone:* ${senderNum}`,
          `🔑 *Login Key:*`,
          `\`\`\`${token}\`\`\``,
          ``,
          `⏳ *Expires in:* ${expiresIn} (at ${expiryTime})`,
          `♻️ *One-time use:* Key deletes on login`,
          ``,
          `🌐 *Open Coin Panel:*`,
          `${base}/coins`,
          ``,
          `💡 _Use the panel to:_`,
          `   • Check your balance & XP`,
          `   • Claim daily reward`,
          `   • Transfer coins`,
          `   • View leaderboard`,
          ``,
          `⚠️ _Do NOT share this key with anyone._`,
        ].join('\n'),
        quoted: msg,
      });
    } catch (e) {
      await sock.sendMessage(jid, {
        text: `❌ Failed to generate key: ${e.message}`,
        quoted: msg,
      });
    }
  },
};
