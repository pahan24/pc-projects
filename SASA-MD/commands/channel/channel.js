// ── Channel Commands ────────────────────────────────
export const mychannels = {
  name: 'mychannels', emoji: '📡', aliases: ['channels'],
  description: 'View bot channels', usage: 'mychannels', access: 'Public',
  async execute({ sock, msg, jid }) {
    await sock.sendMessage(jid, {
      text: `📡 *SASA MD Channels*\n\n_Configure channels in config.js_`,
      quoted: msg,
    });
  },
};

export const setchannel = {
  name: 'setchannel', emoji: '📌', ownerOnly: true,
  description: 'Set bot update channel', usage: 'setchannel <jid>', access: 'Owner',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const { updateSettings } = await import('../../lib/db.js');
    await updateSettings('updateChannel', args[0]);
    await sock.sendMessage(jid, { text: `✅ Update channel set.`, quoted: msg });
  },
};

export const delchannel = {
  name: 'delchannel', emoji: '🗑️', ownerOnly: true,
  description: 'Remove update channel', usage: 'delchannel', access: 'Owner',
  async execute({ sock, msg, jid, isOwner }) {
    if (!isOwner) return;
    const { updateSettings } = await import('../../lib/db.js');
    await updateSettings('updateChannel', '');
    await sock.sendMessage(jid, { text: `✅ Update channel removed.`, quoted: msg });
  },
};

export const creact = {
  name: 'cpost', emoji: '📢', ownerOnly: true,
  description: 'Post to channel', usage: 'cpost <message>', access: 'Owner',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return;
    const { getSettings } = await import('../../lib/db.js');
    const settings = await getSettings();
    if (!settings.updateChannel) return await sock.sendMessage(jid, { text: '❌ No channel set. Use .setchannel', quoted: msg });
    await sock.sendMessage(settings.updateChannel, { text: args.join(' ') });
    await sock.sendMessage(jid, { text: '✅ Posted to channel.', quoted: msg });
  },
};
