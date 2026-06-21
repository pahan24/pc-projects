// ── Advanced Reaction System ────────────────────────
import { getUserReact, setUserReact, getAllUserReacts, deductCoins, getBans } from './db.js';

const activeTimers = new Map(); // num → intervalId

/**
 * Start a reaction session for a user
 */
export async function startReaction(sock, num, pack, target = 'all') {
  // Stop existing first
  stopReaction(num);

  const endTime = Date.now() + pack.duration * 60 * 1000;
  const state   = { active: true, packId: pack.id, target, endTime, count: 0 };
  await setUserReact(num, state);

  const interval = setInterval(async () => {
    try {
      const bans = await getBans();
      if (bans.includes(num)) { stopReaction(num); return; }

      const st = await getUserReact(num);
      if (!st?.active || Date.now() > st.endTime) { stopReaction(num); return; }

      const emoji = pack.emojis[Math.floor(Math.random() * pack.emojis.length)];
      // Send reaction to appropriate targets
      // (In real usage, sock.sendMessage to target JID with reaction key)
      st.count = (st.count || 0) + 1;
      await setUserReact(num, st);
    } catch {}
  }, pack.interval * 1000);

  activeTimers.set(num, interval);
  return endTime;
}

export function stopReaction(num) {
  const t = activeTimers.get(num);
  if (t) { clearInterval(t); activeTimers.delete(num); }
}

export async function restoreReactions(sock) {
  const all = await getAllUserReacts();
  for (const [num, state] of Object.entries(all)) {
    if (state?.active && Date.now() < state.endTime) {
      // Restore packs on reconnect
      console.log(`[REACT] Restoring reaction for ${num}`);
    }
  }
}

export async function builtinPacks() {
  const { getReactPacks } = await import('./db.js');
  return await getReactPacks();
}
