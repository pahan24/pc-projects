// ╔══════════════════════════════════════════════════╗
// ║        SASA MD - Group Event Handlers            ║
// ╚══════════════════════════════════════════════════╝
import { getGroup } from '../lib/database.js';
import config       from '../config.js';

export async function handleGroupParticipantUpdate(sock, update) {
  const { id, participants, action } = update;
  const gs = await getGroup(id);

  for (const jid of participants) {
    const num = jid.split('@')[0];

    if (action === 'add' && gs.welcomeEnabled) {
      const meta = await sock.groupMetadata(id).catch(() => null);
      const text = gs.welcomeMsg
        ? gs.welcomeMsg.replace('{user}', `@${num}`).replace('{group}', meta?.subject || '')
        : `👋 Welcome to *${meta?.subject || 'the group'}*, @${num}!\n\n_Feel free to introduce yourself._`;
      await sock.sendMessage(id, { text, mentions: [jid] }).catch(() => {});
    }

    if (action === 'remove' && gs.goodbyeEnabled) {
      await sock.sendMessage(id, {
        text: `👋 *@${num}* has left the group. Goodbye!`,
        mentions: [jid],
      }).catch(() => {});
    }
  }
}

export async function handleAntiLink(sock, msg, jid, sender, body) {
  const gs = await getGroup(jid);
  if (!gs.antiLink) return false;

  const linkRegex = /https?:\/\/|www\.|chat\.whatsapp\.com/i;
  if (!linkRegex.test(body)) return false;

  // Check if sender is admin
  try {
    const meta   = await sock.groupMetadata(jid);
    const admins = meta.participants.filter(p => p.admin).map(p => p.id);
    if (admins.includes(sender)) return false; // Admins exempt
  } catch {}

  // Delete the message and warn
  await sock.sendMessage(jid, {
    delete: msg.key,
  }).catch(() => {});

  await sock.sendMessage(jid, {
    text: `⚠️ @${sender.split('@')[0]} Links are not allowed in this group!`,
    mentions: [sender],
  }).catch(() => {});

  return true;
}
