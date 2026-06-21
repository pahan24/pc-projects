// ══════════════════════════════════════════════════
//  SASA MD — .settings Command (upgraded)
//  Shows full status + generates permanent login key
// ══════════════════════════════════════════════════
import { generatePermanentKey } from '../../api/settingsAuth.js';
import { getFullSettings }       from '../../api/settingsUpdate.js';
import config                    from '../../config.js';

function yesno(v) { return v ? '✅ ON' : '🔴 OFF'; }
function getBaseUrl() { return process.env.WEB_URL || `http://localhost:${process.env.WEB_PORT || 4000}`; }

export const settingsCmd = {
  name: 'settings', aliases: ['config', 'panel', 'webpanel'],
  description: 'View bot status + get web settings access link',
  usage: '.settings',
  category: 'settings',
  cooldown: 8,

  async run({ sock, msg, jid, senderNum, isGroup }) {
    // Must be private chat for security
    if (isGroup) {
      return sock.sendMessage(jid, {
        text: '🔒 *Security:* Send *.settings* in a private chat — not in groups.',
        quoted: msg,
      });
    }

    try {
      const s = await getFullSettings();
      const { key, isNew } = await generatePermanentKey(senderNum);
      const base = getBaseUrl();

      const statusBlock = [
        `╔═══════════════════════════════╗`,
        `║  ⚙️  SASA MD — Bot Status      ║`,
        `╚═══════════════════════════════╝`,
        ``,
        `🌐 *Mode:*            ${(s.mode || 'public').toUpperCase()}`,
        `⌨️  *Prefix:*          ${s.prefix || '.'}`,
        ``,
        `━━ AUTO FEATURES ━━━━━━━━━━━━━`,
        `👁️  Auto Read:         ${yesno(s.autoRead)}`,
        `✍️  Auto Typing:       ${yesno(s.autoTyping)}`,
        `🎙️  Auto Recording:    ${yesno(s.autoRecording)}`,
        `⚡ Auto React:        ${yesno(s.reactEnabled)}`,
        `😊 React Emoji:       ${s.reactEmoji || '⚡'}`,
        `⏳ React Delay:       ${s.reactDelay || 800}ms`,
        ``,
        `━━ PROTECTION ━━━━━━━━━━━━━━━━`,
        `🗑️  Anti Delete:       ${yesno(s.antiDelete)}`,
        `🔗 Anti Link:         ${yesno(s.antiLink)}`,
        `🚫 Anti Spam:         ${yesno(s.antiSpam)}`,
        `⏱️  Cooldown:          ${s.cooldownSeconds || 3}s`,
        ``,
        `━━ GROUP EVENTS ━━━━━━━━━━━━━━`,
        `👋 Welcome:           ${yesno(s.welcomeEnabled)}`,
        `🚪 Goodbye:           ${yesno(s.goodbyeEnabled)}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join('\n');

      const loginBlock = [
        ``,
        `🔐 *WEB SETTINGS ACCESS*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📱 *Phone:* ${senderNum}`,
        ``,
        `🔑 *Login Key:*`,
        `\`\`\`${key}\`\`\``,
        ``,
        `${isNew ? '🆕 _New key generated_' : '♻️ _Your existing key_'}`,
        `⚠️ _Keep this key private. It does not expire._`,
        ``,
        `🌐 *Open Settings Panel:*`,
        `${base}/settings`,
        ``,
        `_To revoke your key, send:_ *.revokekey*`,
      ].join('\n');

      await sock.sendMessage(jid, {
        text: statusBlock + loginBlock,
        quoted: msg,
      });

    } catch (e) {
      await sock.sendMessage(jid, {
        text: `❌ Error: ${e.message}`,
        quoted: msg,
      });
    }
  },
};

export const revokeKey = {
  name: 'revokekey', aliases: ['revoke'],
  description: 'Revoke your web settings login key',
  usage: '.revokekey',
  category: 'settings',
  cooldown: 30,

  async run({ sock, msg, jid, senderNum, isGroup }) {
    if (isGroup) return;
    try {
      const { revokeKey: revoke } = await import('../../api/settingsAuth.js');
      const found = await revoke(senderNum);
      if (found) {
        await sock.sendMessage(jid, {
          text: [
            `✅ *Login key revoked.*`,
            `Your web settings access has been disabled.`,
            `Send *.settings* again to generate a new key.`,
          ].join('\n'),
          quoted: msg,
        });
      } else {
        await sock.sendMessage(jid, {
          text: `ℹ️ No active key found for your number.`,
          quoted: msg,
        });
      }
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ ${e.message}`, quoted: msg });
    }
  },
};
