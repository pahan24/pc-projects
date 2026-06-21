// ── tools: menu, ping, alive, runtime, stats ──────────
import { buildMainMenu, buildCategoryMenu } from '../../lib/menu.js';
import { getSettings } from '../../lib/database.js';
import os from 'os';

export default [
  {
    name: 'menu', aliases: ['help', 'cmds'],
    description: 'Show all commands menu', usage: 'menu [category]',
    category: 'tools', cooldown: 5,
    async execute({ sock, msg, jid, args, commands, senderNum }) {
      const settings = await getSettings();
      const catMap   = { dl:'download', dl2:'download', media:'media', news:'news', ai:'ai',
        fun:'fun', owner:'owner', group:'group', tools:'tools', set:'settings', eco:'economy', lvl:'level' };
      const cat = args[0] ? catMap[args[0].toLowerCase()] || args[0].toLowerCase() : null;

      if (cat) {
        const text = buildCategoryMenu(commands, cat, settings);
        return await sock.sendMessage(jid, { text, quoted: msg });
      }
      const text = buildMainMenu(commands, settings, senderNum);
      await sock.sendMessage(jid, { text, quoted: msg });
    },
  },

  {
    name: 'ping', aliases: ['speed'],
    description: 'Check bot response time', usage: 'ping',
    category: 'tools', cooldown: 3,
    async execute({ sock, msg, jid }) {
      const t    = Date.now();
      const sent = await sock.sendMessage(jid, { text: '🏓 Pinging...', quoted: msg });
      const ms   = Date.now() - t;
      await sock.sendMessage(jid, { text: `🏓 *Pong!*\n⚡ Speed: \`${ms}ms\`` }, { quoted: sent });
    },
  },

  {
    name: 'alive', aliases: ['on', 'status'],
    description: 'Check if bot is alive', usage: 'alive',
    category: 'tools', cooldown: 5,
    async execute({ sock, msg, jid, settings, config }) {
      const s = process.uptime();
      const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
      const ram = (process.memoryUsage().heapUsed/1024/1024).toFixed(1);
      await sock.sendMessage(jid, {
        text: [
          `╔══ ⚡ *SASA MD ALIVE* ══╗`,
          `║ 🤖 *Bot:* ${config.botName} v${config.botVersion}`,
          `║ ✅ *Status:* Online`,
          `║ ⏱️ *Uptime:* ${h}h ${m}m ${sec}s`,
          `║ 💾 *RAM:* ${ram}MB`,
          `║ 👑 *Owner:* ${config.ownerName}`,
          `║ 🌐 *Mode:* ${(settings.mode||config.mode).toUpperCase()}`,
          `╚${'═'.repeat(22)}╝`,
        ].join('\n'), quoted: msg,
      });
    },
  },

  {
    name: 'runtime', aliases: ['uptime'],
    description: 'Show bot uptime', usage: 'runtime',
    category: 'tools', cooldown: 5,
    async execute({ sock, msg, jid }) {
      const s = process.uptime();
      const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600),
            m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
      await sock.sendMessage(jid, {
        text: `⏱️ *Bot Runtime*\n\`\`${d}d ${h}h ${m}m ${sec}s\`\``, quoted: msg,
      });
    },
  },

  {
    name: 'stats', aliases: ['info'],
    description: 'Show bot system stats', usage: 'stats',
    category: 'tools', cooldown: 10,
    async execute({ sock, msg, jid, commands }) {
      const mem = process.memoryUsage();
      const cpu = os.cpus()[0];
      await sock.sendMessage(jid, {
        text: [
          `📊 *SYSTEM STATS*`,
          `─────────────────`,
          `🖥️ OS: ${os.type()} ${os.release()}`,
          `⚙️ CPU: ${cpu.model.split('@')[0].trim()}`,
          `🧠 RAM Used: ${(mem.heapUsed/1024/1024).toFixed(1)}MB`,
          `📦 Total RAM: ${(os.totalmem()/1024/1024).toFixed(0)}MB`,
          `📦 Node: ${process.version}`,
          `🔢 Commands: ${commands.size}`,
          `🔢 PID: ${process.pid}`,
        ].join('\n'), quoted: msg,
      });
    },
  },
];
