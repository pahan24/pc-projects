// ╔══════════════════════════════════════════════════╗
// ║         SASA MD - Owner Commands                 ║
// ╚══════════════════════════════════════════════════╝
import { setSetting, getSettings, banUser, unbanUser, getAllUsers } from '../../lib/database.js';
import config from '../../config.js';

export const setprefix = {
  name: 'setprefix', category: 'owner', ownerOnly: true,
  description: 'Change bot prefix', usage: 'setprefix <char>',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const newPrefix = args[0];
    if (!newPrefix) return sock.sendMessage(jid, { text: '❌ Provide a prefix character.', quoted: msg });
    await setSetting('prefix', newPrefix);
    config.prefix = newPrefix;
    await sock.sendMessage(jid, { text: `✅ Prefix changed to: *${newPrefix}*`, quoted: msg });
  },
};

export const setmode = {
  name: 'setmode', category: 'owner', ownerOnly: true,
  description: 'Set bot mode', usage: 'setmode public|private|group',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const mode = args[0]?.toLowerCase();
    if (!['public', 'private', 'group'].includes(mode)) {
      return sock.sendMessage(jid, { text: '❌ Usage: .setmode public|private|group', quoted: msg });
    }
    await setSetting('mode', mode);
    config.mode = mode;
    await sock.sendMessage(jid, { text: `✅ Mode set to: *${mode.toUpperCase()}*`, quoted: msg });
  },
};

export const setreact = {
  name: 'setreact', category: 'owner', ownerOnly: true,
  description: 'Change react emoji for category', usage: 'setreact <category> <emoji>',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const [cat, emoji] = args;
    if (!cat || !emoji) return sock.sendMessage(jid, { text: '❌ Usage: .setreact <category> <emoji>', quoted: msg });
    config.reactEmojis[cat] = emoji;
    await sock.sendMessage(jid, { text: `✅ React for *${cat}* set to: ${emoji}`, quoted: msg });
  },
};

export const setcooldown = {
  name: 'setcooldown', category: 'owner', ownerOnly: true,
  description: 'Set command cooldown', usage: 'setcooldown <seconds>',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const secs = parseInt(args[0]);
    if (isNaN(secs) || secs < 0) return sock.sendMessage(jid, { text: '❌ Provide valid seconds.', quoted: msg });
    await setSetting('cooldownSecs', secs);
    config.cooldownSecs = secs;
    await sock.sendMessage(jid, { text: `✅ Cooldown set to *${secs}* seconds.`, quoted: msg });
  },
};

export const restart = {
  name: 'restart', category: 'owner', ownerOnly: true,
  description: 'Restart the bot', usage: 'restart',
  async execute({ sock, msg, jid, isOwner }) {
    if (!isOwner) return;
    await sock.sendMessage(jid, { text: '🔄 Restarting SASA MD...', quoted: msg });
    setTimeout(() => process.exit(0), 2000);
  },
};

export const shutdown = {
  name: 'shutdown', category: 'owner', ownerOnly: true,
  description: 'Shutdown the bot', usage: 'shutdown',
  async execute({ sock, msg, jid, isOwner }) {
    if (!isOwner) return;
    await sock.sendMessage(jid, { text: '⚠️ Shutting down SASA MD...', quoted: msg });
    setTimeout(() => process.exit(1), 2000);
  },
};

export const block = {
  name: 'block', category: 'owner', ownerOnly: true,
  description: 'Block a user', usage: 'block @user or number',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const num = (mentioned || args[0])?.replace(/[^0-9]/g, '');
    if (!num) return sock.sendMessage(jid, { text: '❌ Provide a number.', quoted: msg });
    await banUser(num);
    await sock.sendMessage(jid, { text: `✅ Banned ${num} from bot.`, quoted: msg });
  },
};

export const unblock = {
  name: 'unblock', category: 'owner', ownerOnly: true,
  description: 'Unblock a user', usage: 'unblock <number>',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const num = args[0]?.replace(/[^0-9]/g, '');
    if (!num) return sock.sendMessage(jid, { text: '❌ Provide a number.', quoted: msg });
    await unbanUser(num);
    await sock.sendMessage(jid, { text: `✅ Unbanned ${num}.`, quoted: msg });
  },
};

export const broadcast = {
  name: 'broadcast', category: 'owner', ownerOnly: true,
  description: 'Broadcast to all users', usage: 'broadcast <message>',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const text = args.join(' ');
    if (!text) return sock.sendMessage(jid, { text: '❌ Provide a message.', quoted: msg });
    const { getAllUsers } = await import('../../lib/database.js');
    const users = await getAllUsers();
    let sent = 0;
    for (const num of Object.keys(users)) {
      try {
        await sock.sendMessage(`${num}@s.whatsapp.net`, {
          text: `📢 *Broadcast — SASA MD*\n\n${text}`,
        });
        sent++;
        await new Promise(r => setTimeout(r, 1200));
      } catch {}
    }
    await sock.sendMessage(jid, { text: `✅ Broadcast sent to *${sent}* users.`, quoted: msg });
  },
};

// getAllUsers helper needed by broadcast
async function getAllUsers() {
  const { read } = await import('../../lib/database.js');
  return {};
}
