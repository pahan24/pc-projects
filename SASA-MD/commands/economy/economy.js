// ── Economy Commands ───────────────────────────────────
import {
  getEconomy, addCoins, deductCoins, claimDaily,
  getRichList, getTransactions
} from '../../lib/database.js';
import { msToHuman, formatNum } from '../../lib/utils.js';

export default [
  {
    name: 'balance', aliases: ['bal', 'wallet', 'coins'],
    description: 'Check your coin balance', usage: 'balance',
    category: 'economy', cooldown: 3,
    async execute({ sock, msg, jid, senderNum }) {
      const eco = await getEconomy(senderNum);
      await sock.sendMessage(jid, {
        text: [
          `💰 *WALLET*`,
          `${'─'.repeat(20)}`,
          `👤 @${senderNum}`,
          `💵 Balance: *${formatNum(eco.balance)} coins*`,
          `🏦 Bank: *${formatNum(eco.bank || 0)} coins*`,
          `📈 Total Earned: *${formatNum(eco.totalEarned || 0)} coins*`,
        ].join('\n'),
        mentions: [`${senderNum}@s.whatsapp.net`],
        quoted: msg,
      });
    },
  },

  {
    name: 'daily', aliases: ['claim', 'reward'],
    description: 'Claim daily coin reward', usage: 'daily',
    category: 'economy', cooldown: 0,
    async execute({ sock, msg, jid, senderNum, config }) {
      const result = await claimDaily(senderNum);
      if (!result.success) {
        return await sock.sendMessage(jid, {
          text: `⏳ *Already claimed!*\nCome back in *${msToHuman(result.remaining)}*`,
          quoted: msg,
        });
      }
      const eco = await getEconomy(senderNum);
      await sock.sendMessage(jid, {
        text: [
          `🎁 *Daily Reward Claimed!*`,
          `+${formatNum(config.dailyCoins)} coins 🪙`,
          `💰 New Balance: *${formatNum(eco.balance)} coins*`,
          `\n_Come back in 24h for more!_`,
        ].join('\n'), quoted: msg,
      });
    },
  },

  {
    name: 'give', aliases: ['transfer', 'pay'],
    description: 'Transfer coins to another user', usage: 'give @user <amount>',
    category: 'economy', cooldown: 5,
    async execute({ sock, msg, jid, args, mentioned, senderNum }) {
      const toNum = (mentioned[0]?.split('@')[0] || args[0]?.replace(/[^0-9]/g, ''));
      const amount = parseInt(mentioned.length ? args[0] : args[1]);
      if (!toNum || !amount || amount < 1) {
        return await sock.sendMessage(jid, { text: '❌ Usage: .give @user <amount>', quoted: msg });
      }
      if (toNum === senderNum) return await sock.sendMessage(jid, { text: '❌ Cannot give coins to yourself.', quoted: msg });
      const ok = await deductCoins(senderNum, amount, `Transfer to ${toNum}`);
      if (!ok) return await sock.sendMessage(jid, { text: '❌ Insufficient coins.', quoted: msg });
      await addCoins(toNum, amount, `Transfer from ${senderNum}`);
      await sock.sendMessage(jid, {
        text: `💸 Transferred *${formatNum(amount)} coins* to @${toNum}!`,
        mentions: [`${toNum}@s.whatsapp.net`],
        quoted: msg,
      });
    },
  },

  {
    name: 'richlist', aliases: ['topcoins', 'leaderboard'],
    description: 'Show top coin holders', usage: 'richlist',
    category: 'economy', cooldown: 10,
    async execute({ sock, msg, jid }) {
      const list   = await getRichList();
      const medals = ['🥇', '🥈', '🥉'];
      let text     = `💰 *RICH LIST*\n${'═'.repeat(25)}\n\n`;
      list.forEach((u, i) => {
        const medal = medals[i] || `${i+1}.`;
        text += `${medal} @${u.num} — *${formatNum(u.balance)} coins*\n`;
      });
      await sock.sendMessage(jid, { text, quoted: msg });
    },
  },

  {
    name: 'transactions', aliases: ['history', 'txn'],
    description: 'View transaction history', usage: 'transactions',
    category: 'economy', cooldown: 5,
    async execute({ sock, msg, jid, senderNum }) {
      const txns = await getTransactions(senderNum);
      if (!txns.length) return await sock.sendMessage(jid, { text: '📜 No transactions yet.', quoted: msg });
      let text = `📜 *Transaction History*\n${'─'.repeat(25)}\n\n`;
      txns.slice(0, 10).forEach(t => {
        const sign = t.amount > 0 ? '+' : '';
        const time = new Date(t.time).toLocaleDateString();
        text += `${sign}${t.amount} coins — ${t.reason} (${time})\n`;
      });
      await sock.sendMessage(jid, { text, quoted: msg });
    },
  },
];
