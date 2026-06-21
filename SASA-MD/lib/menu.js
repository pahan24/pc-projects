// ══════════════════════════════════════════════════════
//  SASA MD — Menu Generator
// ══════════════════════════════════════════════════════
import os from 'os';
import moment from 'moment';
import config from '../config.js';

const catEmojis = {
  download: '📥', media: '🎵', news: '📰', ai: '🤖',
  fun: '🎮', owner: '👑', group: '👥', tools: '🛠️',
  settings: '⚙️', economy: '💰', level: '🏆',
};

const catTitles = {
  download: 'DOWNLOAD', media: 'MEDIA', news: 'NEWS', ai: 'AI',
  fun: 'FUN', owner: 'OWNER', group: 'GROUP', tools: 'TOOLS',
  settings: 'SETTINGS', economy: 'ECONOMY', level: 'LEVEL',
};

function getUptime() {
  const s = Math.floor(process.uptime());
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

function getRam() {
  const used  = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const total = (os.totalmem() / 1024 / 1024).toFixed(0);
  return `${used}MB / ${total}MB`;
}

export function buildMainMenu(commands, settings, userName, reactCount = 0) {
  const prefix = settings.prefix || config.prefix;

  // Group by category
  const cats = {};
  const seen = new Set();
  for (const [, cmd] of commands) {
    if (seen.has(cmd.name)) continue;
    seen.add(cmd.name);
    const cat = cmd.category || 'tools';
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(cmd);
  }

  let text = ``;
  text += `╔══════════════════════════╗\n`;
  text += `║  ⚡  *SASA MD* v${config.botVersion}  ⚡  ║\n`;
  text += `╚══════════════════════════╝\n\n`;

  text += `👤 *User:* ${userName || 'User'}\n`;
  text += `👑 *Owner:* ${config.ownerName}\n`;
  text += `🌐 *Mode:* ${(settings.mode || config.mode).toUpperCase()}\n`;
  text += `⌨️  *Prefix:* \`${prefix}\`\n`;
  text += `🕐 *Uptime:* ${getUptime()}\n`;
  text += `💾 *RAM:* ${getRam()}\n`;
  text += `⚡ *React Count:* ${reactCount}\n`;
  text += `📦 *Commands:* ${commands.size}\n\n`;

  text += `${'─'.repeat(30)}\n`;
  text += `📂 *CATEGORIES*\n`;
  text += `${'─'.repeat(30)}\n\n`;

  const order = ['download','media','news','ai','fun','group','tools','settings','economy','level','owner'];
  for (const cat of order) {
    if (!cats[cat]) continue;
    const emoji = catEmojis[cat] || '📌';
    const title = catTitles[cat] || cat.toUpperCase();
    text += `${emoji} *${title} MENU*\n`;
    cats[cat].forEach(cmd => {
      text += `  ▸ \`${prefix}${cmd.name}\`\n`;
    });
    text += '\n';
  }

  text += `${'─'.repeat(30)}\n`;
  text += `_${config.botName} by ${config.ownerName}_`;
  return text;
}

export function buildCategoryMenu(commands, category, settings) {
  const prefix = settings.prefix || config.prefix;
  const emoji  = catEmojis[category] || '📌';
  const title  = catTitles[category] || category.toUpperCase();
  const cmds   = [...new Map([...commands].filter(([,c]) => c.category === category)).values()];

  if (!cmds.length) return `❌ No commands in *${title}* category.`;

  let text = `${emoji} *${title} MENU*\n${'═'.repeat(30)}\n\n`;
  for (const cmd of cmds) {
    text += `🔹 *${prefix}${cmd.name}*\n`;
    text += `   📝 ${cmd.description || 'No description'}\n`;
    text += `   💡 \`${prefix}${cmd.usage || cmd.name}\`\n`;
    if (cmd.aliases?.length) text += `   🔄 Aliases: ${cmd.aliases.map(a=>`\`${prefix}${a}\``).join(', ')}\n`;
    text += '\n';
  }
  return text.trim();
}
