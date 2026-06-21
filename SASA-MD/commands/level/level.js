// ── Level System Commands ──────────────────────────────
import { getLevel, getLeaderboard } from '../../lib/database.js';
import { progressBar, getLevelTitle, formatNum } from '../../lib/utils.js';
import config from '../../config.js';

export default [
  {
    name: 'rank', aliases: ['level', 'xp', 'profile'],
    description: 'Show your level and XP', usage: 'rank',
    category: 'level', cooldown: 5,
    async execute({ sock, msg, jid, senderNum }) {
      const data   = await getLevel(senderNum);
      const needed = config.xpToLevelUp(data.level);
      const bar    = progressBar(data.xp, needed, 12);
      const title  = getLevelTitle(data.level);
      await sock.sendMessage(jid, {
        text: [
          `🏆 *RANK CARD*`,
          `${'─'.repeat(25)}`,
          `👤 @${senderNum}`,
          `⭐ Level: *${data.level}* (${title})`,
          `✨ XP: *${formatNum(data.xp)} / ${formatNum(needed)}*`,
          `[${bar}]`,
          `🌟 Total XP: *${formatNum(data.totalXp)}*`,
        ].join('\n'),
        mentions: [`${senderNum}@s.whatsapp.net`],
        quoted: msg,
      });
    },
  },

  {
    name: 'toplevel', aliases: ['topxp', 'lvlboard'],
    description: 'Show XP leaderboard', usage: 'toplevel',
    category: 'level', cooldown: 10,
    async execute({ sock, msg, jid }) {
      const list   = await getLeaderboard();
      const medals = ['🥇', '🥈', '🥉'];
      let text     = `🏆 *LEVEL LEADERBOARD*\n${'═'.repeat(28)}\n\n`;
      list.forEach((u, i) => {
        const medal = medals[i] || `${i+1}.`;
        const title = getLevelTitle(u.level);
        text += `${medal} @${u.num}\n   Level ${u.level} (${title}) — ${formatNum(u.totalXp)} XP\n\n`;
      });
      await sock.sendMessage(jid, { text, quoted: msg });
    },
  },
];
