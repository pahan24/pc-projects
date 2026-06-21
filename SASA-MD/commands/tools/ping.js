/**
 * commands/tools/tools.js
 * ping, alive, menu, bot, runtime, speed, system, owner, help
 */

"use strict";

const { buildMenu, buildHelp } = require("../../lib/menu");
const system  = require("../../lib/system");
const config  = require("../../config");
const { commands } = require("../../lib/handler");

// ── ping ────────────────────────────────────────────────────
module.exports = [

{
  name: "ping",
  emoji: "🏓",
  description: "Check bot response speed.",
  usage: "ping",
  cooldown: 5,
  async run(sock, ctx) {
    const start = Date.now();
    await ctx.reply("⏳ Testing...");
    const ms = Date.now() - start;
    await ctx.reply(`🏓 *Pong!*\n⚡ *Speed:* ${ms}ms`);
  },
},

// ── alive ───────────────────────────────────────────────────
{
  name: "alive",
  emoji: "💚",
  description: "Check if the bot is online.",
  usage: "alive",
  cooldown: 10,
  async run(sock, ctx) {
    await ctx.reply(`💚 *SASA MD is alive!*

🤖 *Bot:* ${config.botName}
👑 *Owner:* ${config.owner}
📌 *Version:* v${config.version}
⏱️ *Uptime:* ${system.uptime()}
🌐 *Mode:* ${ctx.settings.mode?.toUpperCase()}`);
  },
},

// ── system ──────────────────────────────────────────────────
{
  name: "system",
  emoji: "🖥️",
  description: "Show bot system information.",
  usage: "system",
  cooldown: 10,
  async run(sock, ctx) {
    await ctx.reply(system.sysInfo());
  },
},

// ── runtime ─────────────────────────────────────────────────
{
  name: ["runtime", "uptime"],
  emoji: "⏱️",
  description: "Show bot uptime.",
  usage: "runtime",
  cooldown: 5,
  async run(sock, ctx) {
    await ctx.reply(`⏱️ *Bot Runtime:* ${system.uptime()}`);
  },
},

// ── speed ───────────────────────────────────────────────────
{
  name: "speed",
  emoji: "⚡",
  description: "Test bot speed with 3 pings.",
  usage: "speed",
  cooldown: 15,
  async run(sock, ctx) {
    const results = [];
    for (let i = 0; i < 3; i++) {
      const s = Date.now();
      await sock.sendMessage(ctx.jid, { text: `🔄 Test ${i+1}/3...` }, { quoted: ctx.msg });
      results.push(Date.now() - s);
      await new Promise(r => setTimeout(r, 500));
    }
    const avg = Math.round(results.reduce((a,b) => a+b, 0) / 3);
    await ctx.reply(`⚡ *Speed Test Results*\n\nTest 1: ${results[0]}ms\nTest 2: ${results[1]}ms\nTest 3: ${results[2]}ms\n\n📊 *Average:* ${avg}ms`);
  },
},

// ── owner ───────────────────────────────────────────────────
{
  name: "owner",
  emoji: "👑",
  description: "Get owner contact info.",
  usage: "owner",
  cooldown: 30,
  async run(sock, ctx) {
    const ownerJid = config.ownerNumber + "@s.whatsapp.net";
    await sock.sendMessage(ctx.jid, {
      text: `👑 *Bot Owner*\n\n📛 *Name:* ${config.owner}\n📞 *Number:* +${config.ownerNumber}`,
      mentions: [ownerJid],
    }, { quoted: ctx.msg });
  },
},

// ── bot ─────────────────────────────────────────────────────
{
  name: "bot",
  emoji: "🤖",
  description: "Show bot information.",
  usage: "bot",
  cooldown: 10,
  async run(sock, ctx) {
    const cmdCount = commands.size;
    await ctx.reply(`🤖 *${config.botName}*

👑 *Owner:* ${config.owner}
📌 *Version:* v${config.version}
🔧 *Prefix:* ${ctx.settings.prefix || config.prefix}
🌐 *Mode:* ${ctx.settings.mode?.toUpperCase()}
📦 *Commands:* ${cmdCount}
⏱️ *Uptime:* ${system.uptime()}
🟢 *Node.js:* ${process.version}`);
  },
},

// ── menu ────────────────────────────────────────────────────
{
  name: ["menu", "help", "m"],
  emoji: "📋",
  description: "Show the full command menu or help for a specific command.",
  usage: "menu [command]",
  cooldown: 5,
  async run(sock, ctx) {
    const [arg] = ctx.args;

    if (arg) {
      // Specific command help
      const cmd = commands.get(arg.toLowerCase());
      if (!cmd) return ctx.reply(`❌ Command \`${arg}\` not found.`);
      return ctx.reply(buildHelp(cmd, ctx.settings.prefix || config.prefix));
    }

    const menuText = buildMenu(ctx.settings, ctx.isOwner, ctx.isSudo);
    await sock.sendMessage(ctx.jid, {
      text: menuText,
    }, { quoted: ctx.msg });
  },
},

]; // export array — handler.js registers each individually

// ── Trick: export each command from the array ───────────────
// handler.js reads files that export arrays or single objects
// We handle this in the loader: if the export is an array, register each.
