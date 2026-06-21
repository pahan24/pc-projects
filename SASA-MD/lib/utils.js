// ══════════════════════════════════════════════════════
//  SASA MD — Utility Functions
// ══════════════════════════════════════════════════════
import moment from 'moment';
import fs from 'fs-extra';

export function msToHuman(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function formatNum(n) { return n.toLocaleString(); }

export function progressBar(current, max, size = 10) {
  const filled = Math.round((current / max) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

export async function downloadBuffer(url, headers = {}) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export function jidToNum(jid) { return jid.split('@')[0]; }
export function numToJid(num, isGroup = false) {
  const clean = num.replace(/[^0-9]/g, '');
  return isGroup ? `${clean}@g.us` : `${clean}@s.whatsapp.net`;
}

export function shortJid(jid) {
  const num = jid.split('@')[0];
  return `+${num.slice(0, 3)}****${num.slice(-4)}`;
}

export function limitText(txt, max = 200) {
  return txt.length > max ? txt.slice(0, max) + '...' : txt;
}

export const LEVEL_TITLES = [
  'Newbie 🌱', 'Starter 🌿', 'Active 🌳', 'Regular ⭐', 'Pro 🌟',
  'Expert 💫', 'Master 🏅', 'Elite 🥇', 'Legend 👑', 'God Mode 🔱',
];
export function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(Math.floor(level / 5), LEVEL_TITLES.length - 1)];
}
