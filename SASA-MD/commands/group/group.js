// ── Group Commands ─────────────────────────────────────
import { getGroup, updateGroup } from '../../lib/database.js';

export default [
  {
    name: 'tagall', aliases: ['everyone', 'all'],
    description: 'Tag all group members', usage: 'tagall [message]',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 10,
    async execute({ sock, msg, jid, args }) {
      const meta    = await sock.groupMetadata(jid);
      const members = meta.participants.map(p => p.id);
      const text    = args.join(' ') || `👥 *Attention everyone!*`;
      const tags    = members.map(m => `@${m.split('@')[0]}`).join(' ');
      await sock.sendMessage(jid, { text: `${text}\n\n${tags}`, mentions: members, quoted: msg });
    },
  },

  {
    name: 'kick', aliases: ['remove'],
    description: 'Remove member from group', usage: 'kick @user',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 5,
    async execute({ sock, msg, jid, mentioned, isBotAdmin }) {
      if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Bot must be admin.', quoted: msg });
      if (!mentioned.length) return await sock.sendMessage(jid, { text: '❌ Mention a user.', quoted: msg });
      await sock.groupParticipantsUpdate(jid, mentioned, 'remove');
      await sock.sendMessage(jid, { text: `✅ Removed ${mentioned.length} member(s).`, quoted: msg });
    },
  },

  {
    name: 'add',
    description: 'Add member to group', usage: 'add <number>',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 5,
    async execute({ sock, msg, jid, args, isBotAdmin }) {
      if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Bot must be admin.', quoted: msg });
      const num = args[0]?.replace(/[^0-9]/g, '');
      if (!num) return await sock.sendMessage(jid, { text: '❌ Provide a number.', quoted: msg });
      await sock.groupParticipantsUpdate(jid, [`${num}@s.whatsapp.net`], 'add');
      await sock.sendMessage(jid, { text: `✅ Added +${num}`, quoted: msg });
    },
  },

  {
    name: 'promote',
    description: 'Promote member to admin', usage: 'promote @user',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 5,
    async execute({ sock, msg, jid, mentioned, isBotAdmin }) {
      if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Bot must be admin.', quoted: msg });
      if (!mentioned.length) return await sock.sendMessage(jid, { text: '❌ Mention a user.', quoted: msg });
      await sock.groupParticipantsUpdate(jid, mentioned, 'promote');
      await sock.sendMessage(jid, { text: `✅ Promoted ${mentioned.length} member(s).`, quoted: msg });
    },
  },

  {
    name: 'demote',
    description: 'Demote admin to member', usage: 'demote @user',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 5,
    async execute({ sock, msg, jid, mentioned, isBotAdmin }) {
      if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Bot must be admin.', quoted: msg });
      if (!mentioned.length) return await sock.sendMessage(jid, { text: '❌ Mention a user.', quoted: msg });
      await sock.groupParticipantsUpdate(jid, mentioned, 'demote');
      await sock.sendMessage(jid, { text: `✅ Demoted ${mentioned.length} admin(s).`, quoted: msg });
    },
  },

  {
    name: 'group', aliases: ['groupset'],
    description: 'Open or close group messages', usage: 'group <open|close>',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 5,
    async execute({ sock, msg, jid, args, isBotAdmin }) {
      if (!isBotAdmin) return await sock.sendMessage(jid, { text: '❌ Bot must be admin.', quoted: msg });
      const sub = args[0]?.toLowerCase();
      if (sub === 'open') {
        await sock.groupSettingUpdate(jid, 'not_announcement');
        return await sock.sendMessage(jid, { text: '🟢 Group opened — all can send.', quoted: msg });
      }
      if (sub === 'close') {
        await sock.groupSettingUpdate(jid, 'announcement');
        return await sock.sendMessage(jid, { text: '🔒 Group closed — admins only.', quoted: msg });
      }
      await sock.sendMessage(jid, { text: '❌ Usage: .group <open|close>', quoted: msg });
    },
  },

  {
    name: 'antilink',
    description: 'Toggle anti-link in group', usage: 'antilink <on|off>',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 3,
    async execute({ sock, msg, jid, args }) {
      const val = args[0]?.toLowerCase() === 'on';
      await updateGroup(jid, { antiLink: val });
      await sock.sendMessage(jid, { text: `🔗 Anti-Link: *${val ? 'ON ✅' : 'OFF ❌'}*`, quoted: msg });
    },
  },

  {
    name: 'welcome',
    description: 'Toggle welcome messages', usage: 'welcome <on|off> [custom message]',
    category: 'group', groupOnly: true, adminOnly: true, cooldown: 3,
    async execute({ sock, msg, jid, args }) {
      const val      = args[0]?.toLowerCase() === 'on';
      const customMsg = args.slice(1).join(' ') || '';
      await updateGroup(jid, { welcome: val, welcomeMsg: customMsg });
      await sock.sendMessage(jid, { text: `👋 Welcome Message: *${val ? 'ON ✅' : 'OFF ❌'}*`, quoted: msg });
    },
  },

  {
    name: 'ginfo', aliases: ['groupinfo'],
    description: 'Show group information', usage: 'ginfo',
    category: 'group', groupOnly: true, cooldown: 5,
    async execute({ sock, msg, jid }) {
      const meta   = await sock.groupMetadata(jid);
      const admins = meta.participants.filter(p => p.admin).length;
      const gs     = await getGroup(jid);
      await sock.sendMessage(jid, {
        text: [
          `📋 *Group Info*`,
          `Name: ${meta.subject}`,
          `Members: ${meta.participants.length}`,
          `Admins: ${admins}`,
          `Created: ${new Date(meta.creation * 1000).toLocaleDateString()}`,
          `Anti-Link: ${gs.antiLink ? '✅' : '❌'}`,
          `Welcome: ${gs.welcome ? '✅' : '❌'}`,
        ].join('\n'), quoted: msg,
      });
    },
  },
];
