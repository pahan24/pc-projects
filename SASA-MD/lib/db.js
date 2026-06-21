// ── Database Layer (JSON with MongoDB-ready structure) ──
import fs from 'fs-extra';
import path from 'path';
import config from '../config.js';

const DB = config.dbPath;

// ── File paths ──────────────────────────────────────
const FILES = {
  users:        path.join(DB, 'users.json'),
  groups:       path.join(DB, 'groups.json'),
  coins:        path.join(DB, 'coins.json'),
  transactions: path.join(DB, 'transactions.json'),
  reactPacks:   path.join(DB, 'reactPackages.json'),
  userReacts:   path.join(DB, 'userReacts.json'),
  sudo:         path.join(DB, 'sudo.json'),
  ban:          path.join(DB, 'ban.json'),
  settings:     path.join(DB, 'settings.json'),
  cmdCount:     path.join(DB, 'cmdCount.json'),
  cooldowns:    path.join(DB, 'cooldowns.json'),
};

// ── Init DB ─────────────────────────────────────────
export async function initDB() {
  await fs.ensureDir(DB);
  for (const [key, file] of Object.entries(FILES)) {
    if (!await fs.pathExists(file)) {
      let def = {};
      if (key === 'sudo')        def = [];
      if (key === 'ban')         def = [];
      if (key === 'reactPacks')  def = config.defaultReactPacks;
      if (key === 'settings')    def = {
        mode: config.mode, prefix: config.prefix,
        autoRead: config.autoRead, autoTyping: config.autoTyping,
        antiLink: config.antiLink, antiBadWord: config.antiBadWord,
        welcomeMsg: config.welcomeMsg, goodbyeMsg: config.goodbyeMsg,
        rejectCalls: false,
        badWords: ['spam','scam'],
      };
      await fs.writeJson(file, def, { spaces: 2 });
    }
  }
  console.log('[DB] Database initialized.');
}

// ── Generic read/write ──────────────────────────────
async function read(file)       { return await fs.readJson(file).catch(() => ({})); }
async function write(file, data){ return await fs.writeJson(file, data, { spaces: 2 }); }

// ── Users ───────────────────────────────────────────
export async function getUser(num) {
  const db = await read(FILES.users);
  return db[num] || null;
}

export async function createUser(num) {
  const db = await read(FILES.users);
  if (!db[num]) {
    db[num] = { num, xp: 0, level: 1, msgCount: 0, firstSeen: Date.now(), lastSeen: Date.now() };
    await write(FILES.users, db);
    // Welcome bonus
    await addCoins(num, config.welcomeBonus, 'Welcome Bonus');
  }
  db[num].lastSeen = Date.now();
  db[num].msgCount = (db[num].msgCount || 0) + 1;
  await write(FILES.users, db);
  return db[num];
}

export async function getAllUsers() { return await read(FILES.users); }

// ── XP / Level ──────────────────────────────────────
export async function addXP(num, xp) {
  const db = await read(FILES.users);
  if (!db[num]) return;
  db[num].xp = (db[num].xp || 0) + xp;
  const newLevel = Math.floor(db[num].xp / 100) + 1;
  if (newLevel > db[num].level) db[num].level = newLevel;
  await write(FILES.users, db);
  return db[num];
}

// ── Coins ───────────────────────────────────────────
export async function getCoins(num) {
  const db = await read(FILES.coins);
  if (!db[num]) { db[num] = { balance: 0, lastDaily: 0 }; await write(FILES.coins, db); }
  return db[num];
}

export async function addCoins(num, amount, reason = '') {
  const db = await read(FILES.coins);
  if (!db[num]) db[num] = { balance: 0, lastDaily: 0 };
  db[num].balance = (db[num].balance || 0) + amount;
  await write(FILES.coins, db);
  await logTransaction(num, amount, reason);
  return db[num].balance;
}

export async function deductCoins(num, amount, reason = '') {
  const db = await read(FILES.coins);
  if (!db[num] || db[num].balance < amount) return false;
  db[num].balance -= amount;
  await write(FILES.coins, db);
  await logTransaction(num, -amount, reason);
  return true;
}

export async function transferCoins(from, to, amount) {
  const deducted = await deductCoins(from, amount, `Transfer to ${to}`);
  if (!deducted) return false;
  await addCoins(to, amount, `Transfer from ${from}`);
  return true;
}

export async function claimDaily(num) {
  const db = await read(FILES.coins);
  if (!db[num]) db[num] = { balance: 0, lastDaily: 0 };
  const now = Date.now();
  if (now - db[num].lastDaily < config.dailyCooldown) {
    const remaining = config.dailyCooldown - (now - db[num].lastDaily);
    return { success: false, remaining };
  }
  db[num].lastDaily = now;
  await write(FILES.coins, db);
  await addCoins(num, config.dailyCoins, 'Daily Reward');
  return { success: true };
}

export async function getTotalCoins() {
  const db = await read(FILES.coins);
  return Object.values(db).reduce((s, u) => s + (u.balance || 0), 0);
}

// ── Transactions ────────────────────────────────────
async function logTransaction(num, amount, reason) {
  const db = await read(FILES.transactions);
  if (!db[num]) db[num] = [];
  db[num].unshift({ amount, reason, time: Date.now() });
  db[num] = db[num].slice(0, 50); // keep last 50
  await write(FILES.transactions, db);
}

export async function getTransactions(num) {
  const db = await read(FILES.transactions);
  return db[num] || [];
}

// ── Sudo ─────────────────────────────────────────────
export async function getSudos()         { return await read(FILES.sudo); }
export async function addSudo(num)       { const d = await getSudos(); if (!d.includes(num)) d.push(num); await write(FILES.sudo, d); }
export async function removeSudo(num)    { const d = await getSudos(); await write(FILES.sudo, d.filter(n => n !== num)); }

// ── Bans ─────────────────────────────────────────────
export async function getBans()          { return await read(FILES.ban); }
export async function banUser(num)       { const d = await getBans(); if (!d.includes(num)) d.push(num); await write(FILES.ban, d); }
export async function unbanUser(num)     { const d = await getBans(); await write(FILES.ban, d.filter(n => n !== num)); }

// ── Settings ─────────────────────────────────────────
export async function getSettings()     { return await read(FILES.settings); }
export async function updateSettings(k, v) {
  const d = await read(FILES.settings);
  d[k] = v;
  await write(FILES.settings, d);
  // Sync to config for runtime
  config[k] = v;
  return d;
}

// ── Group settings ────────────────────────────────────
export async function getGroupSettings(jid) {
  const db = await read(FILES.groups);
  return db[jid] || {};
}

export async function updateGroupSettings(jid, data) {
  const db = await read(FILES.groups);
  db[jid] = { ...(db[jid] || {}), ...data };
  await write(FILES.groups, db);
  return db[jid];
}

// ── Reaction Packs ────────────────────────────────────
export async function getReactPacks()         { return await read(FILES.reactPacks); }
export async function addReactPack(pack)      { const d = await getReactPacks(); d.push(pack); await write(FILES.reactPacks, d); }
export async function updateReactPack(id, data) {
  const d = await getReactPacks();
  const i = d.findIndex(p => p.id === id);
  if (i === -1) return false;
  d[i] = { ...d[i], ...data };
  await write(FILES.reactPacks, d);
  return true;
}
export async function deleteReactPack(id) {
  const d = await getReactPacks();
  await write(FILES.reactPacks, d.filter(p => p.id !== id));
}

// ── User Reacts ───────────────────────────────────────
export async function getUserReact(num)       { const d = await read(FILES.userReacts); return d[num] || null; }
export async function setUserReact(num, data) { const d = await read(FILES.userReacts); d[num] = data; await write(FILES.userReacts, d); }
export async function getAllUserReacts()       { return await read(FILES.userReacts); }

// ── Command counter ────────────────────────────────────
export async function incrementCommandCount(cmd) {
  const d = await read(FILES.cmdCount);
  d[cmd] = (d[cmd] || 0) + 1;
  d['_total'] = (d['_total'] || 0) + 1;
  await write(FILES.cmdCount, d);
}
export async function getCommandStats() { return await read(FILES.cmdCount); }

// ── Cooldowns ──────────────────────────────────────────
const cdMemory = new Map(); // in-memory for speed
export async function getCooldown(key)        { return cdMemory.get(key) || null; }
export async function setCooldown(key, time)  { cdMemory.set(key, time); }
