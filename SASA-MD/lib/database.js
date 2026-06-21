// ══════════════════════════════════════════════════════
//  SASA MD — JSON Database System
// ══════════════════════════════════════════════════════
import fs from 'fs-extra';
import path from 'path';
import config from '../config.js';

const DB = config.dbPath;

// All database file paths
const PATHS = {
  users:        path.join(DB, 'users.json'),
  groups:       path.join(DB, 'groups.json'),
  economy:      path.join(DB, 'economy.json'),
  transactions: path.join(DB, 'transactions.json'),
  levels:       path.join(DB, 'levels.json'),
  premium:      path.join(DB, 'premium.json'),
  blocked:      path.join(DB, 'blocked.json'),
  settings:     path.join(DB, 'settings.json'),
  antidelete:   path.join(DB, 'antidelete.json'),
  spam:         path.join(DB, 'spam.json'),
};

// Default values
const DEFAULTS = {
  users:        {},
  groups:       {},
  economy:      {},
  transactions: {},
  levels:       {},
  premium:      [],
  blocked:      [],
  settings:     {
    prefix:        config.prefix,
    mode:          config.mode,
    autoRead:      config.autoRead,
    autoTyping:    config.autoTyping,
    autoRecording: config.autoRecording,
    antiDelete:    config.antiDelete,
    antiViewOnce:  config.antiViewOnce,
    antiSpam:      config.antiSpam,
    reactEnabled:  config.reactEnabled,
    reactDelay:    config.reactDelay,
    categoryReacts: config.categoryReacts,
    cooldown:      config.cooldown,
  },
  antidelete:   {},
  spam:         {},
};

// ── Init all tables ────────────────────────────────────
export async function initDB() {
  await fs.ensureDir(DB);
  for (const [key, file] of Object.entries(PATHS)) {
    if (!await fs.pathExists(file)) {
      await fs.writeJson(file, DEFAULTS[key], { spaces: 2 });
    }
  }
}

// ── Generic helpers ────────────────────────────────────
async function read(file) {
  return await fs.readJson(file).catch(() => ({}));
}
async function write(file, data) {
  return await fs.writeJson(file, data, { spaces: 2 });
}

// ══════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════
export async function getUser(jid) {
  const db = await read(PATHS.users);
  const num = jid.split('@')[0];
  if (!db[num]) {
    db[num] = { jid, num, name: '', msgCount: 0, cmdCount: 0, firstSeen: Date.now(), lastSeen: Date.now() };
    await write(PATHS.users, db);
  }
  return db[num];
}

export async function updateUser(jid, data) {
  const db = await read(PATHS.users);
  const num = jid.split('@')[0];
  db[num] = { ...(db[num] || {}), ...data, lastSeen: Date.now() };
  await write(PATHS.users, db);
  return db[num];
}

export async function getAllUsers() { return await read(PATHS.users); }
export async function getUserCount() { return Object.keys(await getAllUsers()).length; }

// ══════════════════════════════════════════════════════
//  GROUPS
// ══════════════════════════════════════════════════════
export async function getGroup(jid) {
  const db = await read(PATHS.groups);
  if (!db[jid]) {
    db[jid] = {
      jid,
      antiLink: false,
      antiSpam: false,
      welcome:  false,
      goodbye:  false,
      welcomeMsg: '',
      goodbyeMsg: '',
      muted: false,
      nsfw: false,
    };
    await write(PATHS.groups, db);
  }
  return db[jid];
}

export async function updateGroup(jid, data) {
  const db = await read(PATHS.groups);
  db[jid] = { ...(db[jid] || {}), ...data };
  await write(PATHS.groups, db);
  return db[jid];
}

export async function getAllGroups() { return await read(PATHS.groups); }

// ══════════════════════════════════════════════════════
//  ECONOMY
// ══════════════════════════════════════════════════════
export async function getEconomy(num) {
  const db = await read(PATHS.economy);
  if (!db[num]) {
    db[num] = { balance: config.startCoins, bank: 0, lastDaily: 0, totalEarned: config.startCoins };
    await write(PATHS.economy, db);
  }
  return db[num];
}

export async function addCoins(num, amount, reason = '') {
  const db = await read(PATHS.economy);
  if (!db[num]) db[num] = { balance: config.startCoins, bank: 0, lastDaily: 0, totalEarned: 0 };
  db[num].balance = (db[num].balance || 0) + amount;
  db[num].totalEarned = (db[num].totalEarned || 0) + (amount > 0 ? amount : 0);
  await write(PATHS.economy, db);
  await logTransaction(num, amount, reason);
  return db[num].balance;
}

export async function deductCoins(num, amount, reason = '') {
  const db = await read(PATHS.economy);
  if (!db[num] || db[num].balance < amount) return false;
  db[num].balance -= amount;
  await write(PATHS.economy, db);
  await logTransaction(num, -amount, reason);
  return true;
}

export async function claimDaily(num) {
  const db = await read(PATHS.economy);
  if (!db[num]) db[num] = { balance: 0, bank: 0, lastDaily: 0, totalEarned: 0 };
  const now = Date.now();
  if (now - db[num].lastDaily < config.dailyCooldownMs) {
    return { success: false, remaining: config.dailyCooldownMs - (now - db[num].lastDaily) };
  }
  db[num].lastDaily = now;
  await write(PATHS.economy, db);
  const earned = config.dailyCoins;
  await addCoins(num, earned, 'Daily Reward');
  return { success: true, amount: earned, balance: db[num].balance + earned };
}

export async function getRichList() {
  const db  = await read(PATHS.economy);
  return Object.entries(db)
    .map(([num, data]) => ({ num, balance: data.balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);
}

async function logTransaction(num, amount, reason) {
  const db = await read(PATHS.transactions);
  if (!db[num]) db[num] = [];
  db[num].unshift({ amount, reason, time: Date.now() });
  db[num] = db[num].slice(0, 30);
  await write(PATHS.transactions, db);
}

export async function getTransactions(num) {
  const db = await read(PATHS.transactions);
  return db[num] || [];
}

// ══════════════════════════════════════════════════════
//  LEVEL / XP
// ══════════════════════════════════════════════════════
export async function getLevel(num) {
  const db = await read(PATHS.levels);
  if (!db[num]) { db[num] = { xp: 0, level: 1, totalXp: 0 }; await write(PATHS.levels, db); }
  return db[num];
}

export async function addXP(num, amount) {
  const db = await read(PATHS.levels);
  if (!db[num]) db[num] = { xp: 0, level: 1, totalXp: 0 };
  db[num].xp      += amount;
  db[num].totalXp += amount;
  let leveledUp = false, newLevel = db[num].level;
  while (db[num].xp >= config.xpToLevelUp(db[num].level)) {
    db[num].xp -= config.xpToLevelUp(db[num].level);
    db[num].level++;
    leveledUp = true;
    newLevel = db[num].level;
  }
  await write(PATHS.levels, db);
  return { leveledUp, newLevel, xp: db[num].xp, level: db[num].level };
}

export async function getLeaderboard() {
  const db = await read(PATHS.levels);
  return Object.entries(db)
    .map(([num, d]) => ({ num, level: d.level, totalXp: d.totalXp }))
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, 10);
}

// ══════════════════════════════════════════════════════
//  PREMIUM
// ══════════════════════════════════════════════════════
export async function isPremium(num) { return (await read(PATHS.premium)).includes(num); }
export async function addPremium(num) { const d = await read(PATHS.premium); if (!d.includes(num)) d.push(num); await write(PATHS.premium, d); }
export async function removePremium(num) { const d = await read(PATHS.premium); await write(PATHS.premium, d.filter(n => n !== num)); }
export async function getPremiumList() { return await read(PATHS.premium); }

// ══════════════════════════════════════════════════════
//  BLOCKED
// ══════════════════════════════════════════════════════
export async function isBlocked(num) { return (await read(PATHS.blocked)).includes(num); }
export async function blockUser(num) { const d = await read(PATHS.blocked); if (!d.includes(num)) d.push(num); await write(PATHS.blocked, d); }
export async function unblockUser(num) { const d = await read(PATHS.blocked); await write(PATHS.blocked, d.filter(n => n !== num)); }
export async function getBlockedList() { return await read(PATHS.blocked); }

// ══════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════
export async function getSettings() { return await read(PATHS.settings); }
export async function updateSetting(key, value) {
  const db = await read(PATHS.settings);
  db[key] = value;
  await write(PATHS.settings, db);
  return db;
}

// ══════════════════════════════════════════════════════
//  ANTI DELETE CACHE
// ══════════════════════════════════════════════════════
export async function cacheMessage(jid, msgId, data) {
  const db = await read(PATHS.antidelete);
  if (!db[jid]) db[jid] = {};
  db[jid][msgId] = { ...data, cachedAt: Date.now() };
  // Keep only last 50 per chat
  const entries = Object.entries(db[jid]);
  if (entries.length > 50) {
    const sorted = entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    db[jid] = Object.fromEntries(sorted.slice(-50));
  }
  await write(PATHS.antidelete, db);
}

export async function getCachedMessage(jid, msgId) {
  const db = await read(PATHS.antidelete);
  return db[jid]?.[msgId] || null;
}

// ══════════════════════════════════════════════════════
//  SPAM TRACKER
// ══════════════════════════════════════════════════════
const spamMap = new Map();
export function checkSpam(num, threshold = config.spamThreshold) {
  const now    = Date.now();
  const window = 10000; // 10s
  const times  = (spamMap.get(num) || []).filter(t => now - t < window);
  times.push(now);
  spamMap.set(num, times);
  return times.length > threshold;
}

// ══════════════════════════════════════════════════════
//  COOLDOWN
// ══════════════════════════════════════════════════════
const cooldowns = new Map();
export function getCooldown(key) { return cooldowns.get(key) || 0; }
export function setCooldown(key, ms) { cooldowns.set(key, Date.now() + ms); }
export function isOnCooldown(key) { return Date.now() < (cooldowns.get(key) || 0); }
