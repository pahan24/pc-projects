// ╔══════════════════════════════════════════════════════╗
// ║            SASA MD — CONFIGURATION                  ║
// ║         Advanced WhatsApp Multi Device Bot           ║
// ╚══════════════════════════════════════════════════════╝

import dotenv from 'dotenv';
dotenv.config();

const config = {
  // ── BOT IDENTITY ─────────────────────────────────────
  botName:       'SASA MD',
  botVersion:    '2.0.0',
  ownerName:     process.env.OWNER_NAME    || 'PAHAN',
  ownerNumber:   process.env.OWNER_NUMBER  || '94XXXXXXXXX',
  botNumber:     process.env.BOT_NUMBER    || '',
  prefix:        process.env.PREFIX        || '.',
  
  // ── MODE: 'public' | 'private' | 'group' ─────────────
  mode:          process.env.MODE          || 'public',

  // ── SESSION ──────────────────────────────────────────
  sessionPath:   './session',

  // ── DATABASE ─────────────────────────────────────────
  dbPath:        './database',

  // ── LOGS ─────────────────────────────────────────────
  logsPath:      './logs',

  // ── FEATURES ─────────────────────────────────────────
  autoRead:      true,
  autoTyping:    true,
  autoRecording: false,
  antiDelete:    true,
  antiViewOnce:  true,
  antiLink:      false,       // per-group override in db
  antiSpam:      true,

  // ── REACT SYSTEM ─────────────────────────────────────
  reactEnabled:  true,
  reactDelay:    0,           // ms
  categoryReacts: {
    download:   '📥',
    media:      '🎵',
    news:       '📰',
    ai:         '🤖',
    fun:        '🎮',
    owner:      '👑',
    group:      '👥',
    tools:      '🛠️',
    settings:   '⚙️',
    economy:    '💰',
    level:      '🏆',
  },

  // ── COOLDOWNS ────────────────────────────────────────
  cooldown:        3,          // seconds per user per command
  spamThreshold:   5,          // max messages per 10s before spam block

  // ── ECONOMY ──────────────────────────────────────────
  dailyCoins:     100,
  startCoins:     50,
  dailyCooldownMs: 24 * 60 * 60 * 1000,

  // ── LEVEL SYSTEM ─────────────────────────────────────
  xpPerMessage:   5,
  xpPerCommand:   10,
  xpToLevelUp:    (level) => level * 100,

  // ── AUTO BIO ─────────────────────────────────────────
  autoBio:        true,
  bioUpdateMs:    30 * 60 * 1000,   // every 30 minutes

  // ── PAIR SITE ────────────────────────────────────────
  pairPort:       process.env.PAIR_PORT || 3001,

  // ── AI ───────────────────────────────────────────────
  aiApiKey:       process.env.AI_API_KEY  || '',
  aiModel:        process.env.AI_MODEL    || 'gpt-3.5-turbo',
  aiApiUrl:       process.env.AI_API_URL  || 'https://api.openai.com/v1/chat/completions',

  // ── THUMBNAIL ────────────────────────────────────────
  thumbnail:      './assets/thumb.jpg',
};

export default config;

// ── Admin Panel ───────────────────────────────────
// Set ADMIN_USERNAME, ADMIN_PASSWORD in .env
// Or ADMIN_PASS_HASH (SHA-256 hex of password) for production
