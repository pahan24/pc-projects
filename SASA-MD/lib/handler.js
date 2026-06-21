// ══════════════════════════════════════════════════════
//  SASA MD — Command Handler (Modular, Dynamic Loader)
// ══════════════════════════════════════════════════════
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';
import {
  getSettings, isBlocked, checkSpam, isOnCooldown, setCooldown,
  addXP, getUser, updateUser, getGroup, updateGroup
} from './database.js';
import config from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CMDS_DIR  = path.join(__dirname, '../commands');

// Command registry
export const commands = new Map();
export const aliases  = new Map();

// ── Load all commands from /commands/<category>/<file>.js ──
export async function loadCommands() {
  commands.clear(); aliases.clear();
  const cats = await fs.readdir(CMDS_DIR);
  let total  = 0;

  for (const cat of cats) {
    const catPath = path.join(CMDS_DIR, cat);
    if (!(await fs.stat(catPath)).isDirectory()) continue;
    const files = (await fs.readdir(catPath)).filter(f => f.endsWith('.js'));

    for (const file of files) {
      try {
        const filePath = `${catPath}/${file}`;
        // bust cache for hot-reload
        const mod = await import(`${filePath}?t=${Date.now()}`);
        const cmds = Array.isArray(mod.default) ? mod.default : [mod.default];
        for (const cmd of cmds) {
          if (!cmd?.name) continue;
          cmd.category = cat;
          commands.set(cmd.name.toLowerCase(), cmd);
          if (cmd.aliases) {
            for (const alias of cmd.aliases) aliases.set(alias.toLowerCase(), cmd.name.toLowerCase());
          }
          total++;
        }
      } catch (e) {
        log.error(`Failed to load ${cat}/${file}: ${e.message}`);
      }
    }
  }
  log.success(`Loaded ${total} commands from ${cats.length} categories`);
  return { commands, total };
}

// ── Get text from any message type ────────────────────
export function getMessageText(msg) {
  return (
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    msg?.message?.videoMessage?.caption ||
    msg?.message?.documentMessage?.caption ||
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

// ── Get quoted message ────────────────────────────────
export function getQuoted(msg) {
  return msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

// ── Mentioned JIDs ────────────────────────────────────
export function getMentioned(msg) {
  return msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}

// ── Main message processor ─────────────────────────────
export async function processMessage(sock, msg) {
  if (!msg?.message) return;
  const jid     = msg.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const fromMe  = msg.key.fromMe;
  const sender  = isGroup ? (msg.key.participant || msg.key.remoteJid) : msg.key.remoteJid;
  const senderNum = sender.split('@')[0];

  // ── Load settings from DB (runtime) ──────────────────
  const settings = await getSettings();
  const prefix   = settings.prefix || config.prefix;

  // ── Skip non-message types ────────────────────────────
  const body = getMessageText(msg);

  // ── Auto-read ─────────────────────────────────────────
  if (settings.autoRead) {
    await sock.readMessages([msg.key]).catch(() => {});
  }

  // ── Block check ───────────────────────────────────────
  if (!fromMe && await isBlocked(senderNum)) return;

  // ── Anti-spam ─────────────────────────────────────────
  if (settings.antiSpam && !fromMe && checkSpam(senderNum, settings.spamThreshold || 5)) {
    return;
  }

  // ── Ensure user exists ────────────────────────────────
  const user = await getUser(sender);
  await updateUser(sender, { msgCount: (user.msgCount || 0) + 1 });

  // ── XP for any message ────────────────────────────────
  await addXP(senderNum, config.xpPerMessage);

  // ── Command check ─────────────────────────────────────
  if (!body.startsWith(prefix)) return;

  const args    = body.slice(prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  if (!cmdName) return;

  // Resolve alias
  const resolvedName = aliases.get(cmdName) || cmdName;
  const cmd          = commands.get(resolvedName);
  if (!cmd) return;

  const isOwner = senderNum === config.ownerNumber || senderNum === config.ownerNumber.replace(/[^0-9]/g, '');
  const isPremiumUser = await import('./database.js').then(m => m.isPremium(senderNum));

  // ── Mode check ────────────────────────────────────────
  const mode = settings.mode || config.mode;
  if (mode === 'private' && !isOwner) return;
  if (mode === 'group' && !isGroup && !isOwner) {
    return await sock.sendMessage(jid, { text: '❌ Bot is in group-only mode.', quoted: msg });
  }

  // ── Access control ────────────────────────────────────
  if (cmd.ownerOnly && !isOwner) {
    return await sock.sendMessage(jid, { text: '👑 *Owner only command.*', quoted: msg });
  }
  if (cmd.premiumOnly && !isPremiumUser && !isOwner) {
    return await sock.sendMessage(jid, { text: '💎 *Premium users only.*', quoted: msg });
  }
  if (cmd.groupOnly && !isGroup) {
    return await sock.sendMessage(jid, { text: '👥 *Group-only command.*', quoted: msg });
  }
  if (cmd.privateOnly && isGroup) {
    return await sock.sendMessage(jid, { text: '📩 *Private chat only.*', quoted: msg });
  }

  // ── Admin check ───────────────────────────────────────
  let isAdmin = false, isBotAdmin = false;
  if (isGroup) {
    try {
      const meta   = await sock.groupMetadata(jid);
      const admins = meta.participants.filter(p => p.admin).map(p => p.id);
      isAdmin    = admins.includes(sender) || isOwner;
      isBotAdmin = admins.includes(sock.user?.id);
    } catch {}
  }
  if (cmd.adminOnly && !isAdmin) {
    return await sock.sendMessage(jid, { text: '🔐 *Admin only command.*', quoted: msg });
  }

  // ── Cooldown check ────────────────────────────────────
  const cdSecs = cmd.cooldown ?? settings.cooldown ?? config.cooldown;
  const cdKey  = `${senderNum}_${resolvedName}`;
  if (isOnCooldown(cdKey) && !isOwner) {
    const left = Math.ceil((getCooldown(cdKey) - Date.now()) / 1000);
    return await sock.sendMessage(jid, { text: `⏳ Wait *${left}s* before using this again.`, quoted: msg });
  }
  setCooldown(cdKey, cdSecs * 1000);

  // ── Auto typing ───────────────────────────────────────
  if (settings.autoTyping) {
    await sock.sendPresenceUpdate('composing', jid).catch(() => {});
  }

  // ── React to command ─────────────────────────────────
  if (settings.reactEnabled !== false) {
    const emoji = settings.categoryReacts?.[cmd.category] || '⚡';
    const delay = settings.reactDelay || 0;
    setTimeout(async () => {
      await sock.sendMessage(jid, {
        react: { text: emoji, key: msg.key },
      }).catch(() => {});
    }, delay);
  }

  // ── XP for command ────────────────────────────────────
  const xpResult = await addXP(senderNum, config.xpPerCommand);

  // ── Execute command ───────────────────────────────────
  const start = Date.now();
  log.cmd(senderNum, resolvedName, jid);

  try {
    await cmd.execute({
      sock, msg, jid, sender, senderNum,
      args, body, isGroup, isOwner, isPremiumUser,
      isAdmin, isBotAdmin, fromMe,
      quoted: getQuoted(msg),
      mentioned: getMentioned(msg),
      commands, settings, config,
      prefix, xpResult,
      execTime: () => Date.now() - start,
    });
    await updateUser(sender, { cmdCount: (user.cmdCount || 0) + 1 });
  } catch (err) {
    log.error(`CMD ${resolvedName} error: ${err.message}`);
    await sock.sendMessage(jid, {
      text: `❌ *Error:* ${err.message}\n\n_Report to owner: ${config.ownerNumber}_`,
      quoted: msg,
    }).catch(() => {});
  }
}
