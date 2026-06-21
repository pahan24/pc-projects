// ── Anti Delete Event ─────────────────────────────────
import { cacheMessage, getCachedMessage } from '../lib/database.js';
import { log } from '../lib/logger.js';

export async function handleMessageCache(msg) {
  if (!msg?.message) return;
  const jid   = msg.key.remoteJid;
  const msgId = msg.key.id;
  const type  = Object.keys(msg.message)[0];
  const data  = { type, message: msg.message, sender: msg.key.participant || msg.key.remoteJid, time: Date.now() };
  await cacheMessage(jid, msgId, data).catch(() => {});
}

export async function handleDeletedMessage(sock, { keys }) {
  for (const key of keys) {
    try {
      const cached = await getCachedMessage(key.remoteJid, key.id);
      if (!cached) continue;

      const sender = cached.sender?.split('@')[0] || 'Unknown';
      const type   = cached.type;

      let text = `🗑️ *ANTI DELETE*\n📍 Chat: ${key.remoteJid.includes('@g.us') ? 'Group' : 'PM'}\n👤 Sender: @${sender}\n`;

      if (type === 'conversation' || type === 'extendedTextMessage') {
        const msgText = cached.message?.conversation || cached.message?.extendedTextMessage?.text || '';
        text += `📝 Message: ${msgText}`;
        await sock.sendMessage(key.remoteJid, {
          text, mentions: [cached.sender],
        });
      } else if (type === 'imageMessage') {
        // Could resend buffered media
        text += `📸 Type: Image`;
        await sock.sendMessage(key.remoteJid, { text, mentions: [cached.sender] });
      } else if (type === 'videoMessage') {
        text += `🎬 Type: Video`;
        await sock.sendMessage(key.remoteJid, { text, mentions: [cached.sender] });
      } else {
        text += `📎 Type: ${type}`;
        await sock.sendMessage(key.remoteJid, { text, mentions: [cached.sender] });
      }
    } catch {}
  }
}
