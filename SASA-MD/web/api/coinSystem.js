// ══════════════════════════════════════════════════
//  SASA MD — Coin System API (server-side only)
//  All coin operations validated server-side
// ══════════════════════════════════════════════════
import {
  getCoins, claimDaily, getTransactions,
  getLeaderboard, getXP, getAllUsers,
  deductCoins, addCoins,
} from '../../lib/database.js';
import { msToReadable } from '../../lib/utils.js';

export async function getUserCoinData(phone) {
  const [coinData, xpData, txns, board] = await Promise.all([
    getCoins(phone),
    getXP(phone),
    getTransactions(phone),
    getLeaderboard(),
  ]);

  const xpForNext   = xpData.level * 100;
  const xpProgress  = Math.round(((xpData.xp % 100) / 100) * 100);
  const rank        = board.findIndex(u => u.num === phone) + 1;
  const dailyReady  = (Date.now() - (coinData.lastDaily || 0)) >= 24 * 60 * 60 * 1000;
  const nextDaily   = dailyReady ? 0 : (24 * 60 * 60 * 1000 - (Date.now() - (coinData.lastDaily || 0)));

  return {
    phone,
    balance:     coinData.balance,
    dailyReady,
    nextDailyIn: nextDaily > 0 ? msToReadable(nextDaily) : null,
    xp:          xpData.xp,
    level:       xpData.level,
    msgCount:    xpData.msgCount || 0,
    xpProgress,
    xpForNext,
    rank:        rank || null,
    recentTxns:  txns.slice(0, 8),
    leaderboard: board.slice(0, 5),
  };
}

export async function performDailyClaim(phone) {
  const { claimDaily } = await import('../../lib/database.js');
  const result = await claimDaily(phone);
  if (!result.ok) {
    return {
      ok: false,
      error: `Already claimed! Next in: ${msToReadable(result.remaining)}`,
    };
  }
  const coinData = await getCoins(phone);
  return { ok: true, newBalance: coinData.balance, earned: 5 };
}

export async function performTransfer(fromPhone, toPhone, amount) {
  // Validate
  const amt = parseInt(amount);
  if (!amt || amt < 1 || amt > 100000)
    return { ok: false, error: 'Amount must be between 1 and 100,000.' };

  const toClean = String(toPhone).replace(/[^0-9]/g, '');
  if (!toClean || toClean.length < 5)
    return { ok: false, error: 'Invalid recipient phone number.' };

  if (toClean === fromPhone)
    return { ok: false, error: 'Cannot transfer to yourself.' };

  const sender = await getCoins(fromPhone);
  if (sender.balance < amt)
    return { ok: false, error: `Insufficient balance. You have ${sender.balance} coins.` };

  await deductCoins(fromPhone, amt, `Transfer to ${toClean}`);
  await addCoins(toClean, amt, `Transfer from ${fromPhone}`);

  const updated = await getCoins(fromPhone);
  return { ok: true, sent: amt, to: toClean, newBalance: updated.balance };
}
