// ╔═══════════════════════════════════════════════════════╗
// ║         SASA MD — WhatsApp Multi Device Bot          ║
// ║         Version 2.0.0  |  Author: PAHAN              ║
// ╚═══════════════════════════════════════════════════════╝

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto,
  jidNormalizedUser,
} from '@whiskeysockets/baileys';

import pino      from 'pino';
import { Boom }  from '@hapi/boom';
import fs        from 'fs-extra';
import NodeCache from 'node-cache';
import config    from './config.js';
import { initDB, getSettings, updateSetting, getGroup, cacheMessage } from './lib/database.js';
import { loadCommands, processMessage } from './lib/handler.js';
import { log, banner }  from './lib/logger.js';
import { handleGroupUpdate }   from './events/groupUpdate.js';
import { handleMessageCache, handleDeletedMessage } from './events/antiDelete.js';

// ── Global state ───────────────────────────────────────
let sock          = null;
let reactCount    = 0;
let pairServer    = null;

export { sock, reactCount };

// ── Anti-crash ─────────────────────────────────────────
process.on('uncaughtException',  e => log.error(`Uncaught Exception: ${e.message}`));
process.on('unhandledRejection', e => log.error(`Unhandled Rejection: ${e?.message || e}`));

// ── In-memory store ────────────────────────────────────
const logger = pino({ level: 'silent' });
const store  = makeInMemoryStore({ logger });
await fs.ensureDir('./database');
store?.readFromFile('./database/store.json');
setInterval(() => store?.writeToFile('./database/store.json'), 15_000);

const msgRetryCache = new NodeCache();

// ── Init ───────────────────────────────────────────────
banner();
await initDB();
log.success('Database initialized');

const { commands } = await loadCommands();

// ══════════════════════════════════════════════════════
//  MAIN CONNECTION FUNCTION
// ══════════════════════════════════════════════════════
async function connectToWhatsApp() {
  await fs.ensureDir(config.sessionPath);
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  log.info(`Baileys version: ${version.join('.')} | Latest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache: msgRetryCache,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const m = await store.loadMessage(key.remoteJid, key.id);
        return m?.message || undefined;
      }
      return proto.Message.fromObject({});
    },
  });

  store?.bind(sock.ev);

  // ── Connection update ──────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log.info('QR Code generated — scan via terminal or /pair website');
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      log.warn(`Connection closed (${code}). Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 3000);
      } else {
        log.error('Logged out — delete session/ folder and restart.');
      }
    }

    if (connection === 'open') {
      log.connect('✅ Connected to WhatsApp!');
      const me = sock.user;
      log.info(`Logged in as: ${me?.name || me?.id}`);

      // Notify owner
      if (config.ownerNumber) {
        await sock.sendMessage(`${config.ownerNumber.replace(/[^0-9]/g,'')}@s.whatsapp.net`, {
          text: `*${config.botName} v${config.botVersion}* is online! 🚀\n⌨️ Prefix: \`${config.prefix}\`\n🌐 Mode: ${config.mode}\n📦 Commands: ${commands.size}`,
        }).catch(() => {});
      }

      // Auto bio update
      if (config.autoBio) startAutoBio();

      // Restore pair site with live socket
      if (pairServer?.setSocket) pairServer.setSocket(sock);
    }
  });

  // ── Credentials save ───────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Messages ───────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;

      // Cache all messages for anti-delete
      const settings = await getSettings();
      if (settings.antiDelete !== false) {
        await handleMessageCache(msg);
      }

      // Anti-view-once: re-send view-once media
      if (settings.antiViewOnce !== false) {
        await handleViewOnce(msg);
      }

      // Anti-link detection
      await handleAntiLink(msg);

      // Process command
      await processMessage(sock, msg);
    }
  });

  // ── Message delete (anti-delete) ────────────────────
  sock.ev.on('messages.update', async (updates) => {
    const settings = await getSettings();
    if (!settings.antiDelete) return;
    const deletions = updates.filter(u => u.update?.messageStubType === 1);
    if (deletions.length) {
      await handleDeletedMessage(sock, { keys: deletions.map(d => d.key) });
    }
  });

  // ── Group updates ──────────────────────────────────
  sock.ev.on('group-participants.update', async (update) => {
    await handleGroupUpdate(sock, update);
  });

  // ── Calls ──────────────────────────────────────────
  sock.ev.on('call', async (calls) => {
    for (const call of calls) {
      if (call.status === 'offer') {
        // Auto-reject calls if configured
        await sock.sendMessage(call.from, {
          text: `❌ *${config.botName}* does not accept voice/video calls.\nContact owner: +${config.ownerNumber}`,
        }).catch(() => {});
      }
    }
  });

  return sock;
}

// ══════════════════════════════════════════════════════
//  ANTI-VIEW-ONCE
// ══════════════════════════════════════════════════════
async function handleViewOnce(msg) {
  try {
    const jid  = msg.key.remoteJid;
    const m    = msg.message;
    if (!m) return;

    const voTypes = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'];
    const voKey   = voTypes.find(t => m[t]);
    if (!voKey) return;

    const inner   = m[voKey].message;
    const type    = Object.keys(inner)[0];
    const content = inner[type];

    if (type === 'imageMessage') {
      const buffer = await sock.downloadMediaMessage(
        { message: inner, key: msg.key }, 'buffer'
      );
      await sock.sendMessage(jid, {
        image: buffer,
        caption: `👁️ *Anti-View Once*\n${content.caption || ''}`,
      });
    } else if (type === 'videoMessage') {
      const buffer = await sock.downloadMediaMessage(
        { message: inner, key: msg.key }, 'buffer'
      );
      await sock.sendMessage(jid, {
        video: buffer,
        caption: `👁️ *Anti-View Once*\n${content.caption || ''}`,
      });
    }
  } catch {}
}

// ══════════════════════════════════════════════════════
//  ANTI-LINK
// ══════════════════════════════════════════════════════
const LINK_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

async function handleAntiLink(msg) {
  try {
    const jid     = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return;
    const gs = await getGroup(jid);
    if (!gs.antiLink) return;

    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!LINK_REGEX.test(body)) return;

    const sender = msg.key.participant || msg.key.remoteJid;
    const meta   = await sock.groupMetadata(jid).catch(() => null);
    const admins = meta?.participants?.filter(p => p.admin).map(p => p.id) || [];

    if (!admins.includes(sender)) {
      await sock.sendMessage(jid, { delete: msg.key });
      await sock.sendMessage(jid, {
        text: `🔗 *Anti-Link*: Links are not allowed here, @${sender.split('@')[0]}!`,
        mentions: [sender],
      });
    }
  } catch {}
}

// ══════════════════════════════════════════════════════
//  AUTO BIO UPDATE
// ══════════════════════════════════════════════════════
let bioInterval = null;
function startAutoBio() {
  if (bioInterval) clearInterval(bioInterval);
  bioInterval = setInterval(async () => {
    try {
      const s       = process.uptime();
      const h       = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      const bio     = `${config.botName} v${config.botVersion} | Uptime: ${h}h${m}m | Commands: ${commands.size} | by ${config.ownerName}`;
      await sock?.updateProfileStatus(bio);
    } catch {}
  }, config.bioUpdateMs);
}

// ══════════════════════════════════════════════════════
//  START PAIR SITE
// ══════════════════════════════════════════════════════
async function startPairSite() {
  try {
    const mod = await import('./pair-site/server.js');
    pairServer = await mod.startPairServer(sock);
    log.success(`Pair site running at http://localhost:${config.pairPort}`);
  } catch (e) {
    log.warn(`Pair site not started: ${e.message}`);
  }
}

// ── Start ──────────────────────────────────────────────
await connectToWhatsApp();
await startPairSite();

// ── Web panel server (auto-start) ─────────────────
// Note: web server starts automatically with the bot
(async () => {
  try {
    const { createWebServer } = await import('./web/server.js');
    const webPort = parseInt(process.env.WEB_PORT) || 4000;
    createWebServer(webPort);
  } catch (e) {
    // Web server error doesn't kill the bot
    log.warn(`Web server error: ${e.message}`);
  }
})();
