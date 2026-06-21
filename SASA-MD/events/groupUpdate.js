// ── Group Participant Update Events ───────────────────
import { getGroup } from '../lib/database.js';
import config from '../config.js';

export async function handleGroupUpdate(sock, { id, participants, action }) {
  try {
    const gs   = await getGroup(id);
    const meta = await sock.groupMetadata(id).catch(() => null);
    const name = meta?.subject || 'Group';

    for (const jid of participants) {
      const num = jid.split('@')[0];

      if (action === 'add' && gs.welcome) {
        const txt = gs.welcomeMsg
          ? gs.welcomeMsg.replace('{user}', `@${num}`).replace('{group}', name)
          : `👋 Welcome to *${name}*, @${num}! 🎉\n\nWe're glad you're here!`;
        await sock.sendMessage(id, { text: txt, mentions: [jid] });
      }

      if (action === 'remove' && gs.goodbye) {
        const txt = gs.goodbyeMsg
          ? gs.goodbyeMsg.replace('{user}', num).replace('{group}', name)
          : `👋 @${num} has left *${name}*.\n\nWe'll miss you! 💙`;
        await sock.sendMessage(id, { text: txt, mentions: [jid] });
      }

      if (action === 'promote') {
        await sock.sendMessage(id, {
          text: `⬆️ @${num} has been promoted to admin!`,
          mentions: [jid],
        });
      }

      if (action === 'demote') {
        await sock.sendMessage(id, {
          text: `⬇️ @${num} has been demoted from admin.`,
          mentions: [jid],
        });
      }
    }
  } catch (e) {
    // Non-critical
  }
}
