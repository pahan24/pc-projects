// ── Economy Helper ──────────────────────────────────
import { getCoins, addCoins, deductCoins, claimDaily, transferCoins, getTransactions } from './db.js';

export { getCoins, addCoins, deductCoins, claimDaily, transferCoins, getTransactions };

export function formatBalance(bal) {
  return `💰 *${bal.toLocaleString()}* coins`;
}

export function formatTransaction(tx) {
  const sign  = tx.amount > 0 ? '+' : '';
  const time  = new Date(tx.time).toLocaleString();
  return `${sign}${tx.amount} coins — ${tx.reason} (${time})`;
}

export function msToHuman(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
