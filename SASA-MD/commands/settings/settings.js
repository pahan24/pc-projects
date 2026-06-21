// ╔══════════════════════════════════════════════════╗
// ║        SASA MD - Settings Commands               ║
// ╚══════════════════════════════════════════════════╝
import { setSetting, getSettings } from '../../lib/database.js';
import config from '../../config.js';

function makeToggle(name, desc, configKey) {
  return {
    name, category: 'settings',
    description: desc, usage: `${name} on|off`,
    ownerOnly: true,
    async execute({ sock, msg, jid, args, isOwner }) {
      if (!isOwner) return sock.sendMessage(jid, { text: '🚫 Owner only.', quoted: msg });
      const state = args[0]?.toLowerCase() === 'on';
      await setSetting(configKey, state);
      config[configKey] = state;
      await sock.sendMessage(jid, { text: `⚙️ *${name}:* ${state ? '✅ ON' : '❌ OFF'}`, quoted: msg });
    },
  };
}

export const react        = makeToggle('react',         'Toggle command react emojis',    'reactEnabled');
export const autoread     = makeToggle('autoread',      'Toggle auto-read messages',       'autoRead');
export const autotyping   = makeToggle('autotyping',    'Toggle auto-typing indicator',    'autoTyping');
export const autorecording= makeToggle('autorecording', 'Toggle auto-recording indicator', 'autoRecording');
export const antidelete   = makeToggle('antidelete',    'Toggle anti-delete messages',     'antiDelete');
export const antiviewonce = makeToggle('antiviewonce',  'Toggle anti-view-once bypass',    'antiViewOnce');
export const antispam     = makeToggle('antispam',      'Toggle anti-spam protection',     'antiSpam');

export const cooldown = {
  name: 'cooldown', category: 'settings', ownerOnly: true,
  description: 'Set cooldown seconds', usage: 'cooldown <seconds>',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return sock.sendMessage(jid, { text: '🚫 Owner only.', quoted: msg });
    const secs = parseInt(args[0]);
    if (isNaN(secs)) return sock.sendMessage(jid, { text: '❌ Provide valid seconds.', quoted: msg });
    await setSetting('cooldownSecs', secs);
    config.cooldownSecs = secs;
    await sock.sendMessage(jid, { text: `⏱️ Cooldown set to *${secs}s*`, quoted: msg });
  },
};

export const prefix = {
  name: 'prefix', category: 'settings', ownerOnly: true,
  description: 'Change command prefix', usage: 'prefix <character>',
  async execute({ sock, msg, jid, args, isOwner }) {
    if (!isOwner) return sock.sendMessage(jid, { text: '🚫 Owner only.', quoted: msg });
    const p = args[0];
    if (!p) return sock.sendMessage(jid, { text: '❌ Provide a prefix.', quoted: msg });
    await setSetting('prefix', p);
    config.prefix = p;
    await sock.sendMessage(jid, { text: `⌨️ Prefix changed to: *${p}*`, quoted: msg });
  },
};

export const settings = {
  name: 'settings', category: 'settings', aliases: ['cfg'],
  description: 'View all bot settings', usage: 'settings',
  async execute({ sock, msg, jid }) {
    const s   = await getSettings();
    const cfg = { ...config, ...s };
    const txt = [
      `⚙️ *SASA MD Settings*`,
      `${'─'.repeat(28)}`,
      `🌐 Mode: ${cfg.mode}`,
      `⌨️ Prefix: ${cfg.prefix}`,
      `👁️ Auto Read: ${cfg.autoRead ? '✅' : '❌'}`,
      `⌨️ Auto Typing: ${cfg.autoTyping ? '✅' : '❌'}`,
      `🎙️ Auto Recording: ${cfg.autoRecording ? '✅' : '❌'}`,
      `🎭 React: ${cfg.reactEnabled ? '✅' : '❌'}`,
      `🔗 Anti-Link: ${cfg.antiLink ? '✅' : '❌'}`,
      `🚫 Anti-Spam: ${cfg.antiSpam ? '✅' : '❌'}`,
      `🗑️ Anti-Delete: ${cfg.antiDelete ? '✅' : '❌'}`,
      `⏱️ Cooldown: ${cfg.cooldownSecs}s`,
    ].join('\n');
    await sock.sendMessage(jid, { text: txt, quoted: msg });
  },
};
