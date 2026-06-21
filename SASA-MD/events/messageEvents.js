// ╔══════════════════════════════════════════════════╗
// ║        SASA MD - Message Event Processor         ║
// ╚══════════════════════════════════════════════════╝
import logger               from '../lib/logger.js';
import { checkCooldown, checkSpam } from '../lib/handler.js';
import { ensureUser, addXP, getBanned, getSudos, incrementCmd, incrementMsg, getSettings } from '../lib/database.js';
import { getText, getSender, clean, sleep } from '../lib/utils.js';
import { handleAntiLink }   from './groupEvents.js';
import config               from '../config.js';

export async function processMessage(sock, msg, commands) {
  if (!msg.message) return;
  const startTime = Date.now();

  // ── Extract context ─────────────────────────────
  const jid      = msg.key.remoteJid;
  const isGroup  = jid.endsWith('@g.us');
  const fromMe   = msg.key.fromMe;
  const sender   = isGroup ? msg.key.participant : jid;
  const senderNum = clean(sender);

  if (!senderNum) return;

  // ── Get current settings ─────────────────────────
  const settings = await getSettings();
  const prefix   = settings.prefix || config.prefix;
  const mode     = settings.mode   || config.mode;

  // ── Auto read ────────────────────────────────────
  if (settings.autoRead && !fromMe) {
    await sock.readMessages([msg.key]).catch(() => {});
  }

  // ── Spam check ────────────────────────────────────
  if (!fromMe && settings.antiSpam) {
    if (checkSpam(senderNum, config.spamMaxMsg, config.spamWindow)) return;
  }

  // ── Ban check ─────────────────────────────────────
  const banned = await getBanned();
  if (banned.includes(senderNum) && !fromMe) return;

  // ── Get message text ──────────────────────────────
  const body = getText(msg);

  // ── Ensure user + XP ─────────────────────────────
  if (!fromMe) {
    const pushName = msg.pushName || senderNum;
    await ensureUser(senderNum, pushName);
    await addXP(senderNum, config.xpPerMessage);
    await incrementMsg();
  }

  // ── Anti-link ─────────────────────────────────────
  if (isGroup && !fromMe && body) {
    const blocked = await handleAntiLink(sock, msg, jid, sender, body);
    if (blocked) return;
  }

  // ── Anti delete ───────────────────────────────────
  // (handled in messages.delete event)

  // ── Anti view once ────────────────────────────────
  if (settings.antiViewOnce) {
    const viewOnce = msg.message?.viewOnceMessage || msg.message?.viewOnceMessageV2;
    if (viewOnce) {
      try {
        const inner = viewOnce.message;
        if (inner?.imageMessage) await sock.sendMessage(jid, { image: { url: await sock.downloadMediaMessage(msg) }, quoted: msg });
        if (inner?.videoMessage) await sock.sendMessage(jid, { video: { url: await sock.downloadMediaMessage(msg) }, quoted: msg });
      } catch {}
    }
  }

  // ── Mode check ────────────────────────────────────
  if (!body.startsWith(prefix)) return;

  // Private mode
  if (mode === 'private' && !fromMe) {
    const sudos = await getSudos();
    if (!sudos.includes(senderNum) && senderNum !== config.ownerNumber) return;
  }

  // Group mode — only respond in groups
  if (mode === 'group' && !isGroup) return;

  // ── Parse command ─────────────────────────────────
  const args    = body.slice(prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  if (!cmdName) return;

  const cmd = commands.get(cmdName);
  if (!cmd) return;

  // ── Cooldown ──────────────────────────────────────
  if (!fromMe && settings.cooldownEnabled !== false) {
    const wait = checkCooldown(`${senderNum}_${cmdName}`, settings.cooldownSecs ?? config.cooldownSecs);
    if (wait) {
      return sock.sendMessage(jid, { text: `⏳ Wait *${wait}s* before using this command again.`, quoted: msg });
    }
  }

  // ── Group / owner / admin checks ──────────────────
  const isOwner = senderNum === config.ownerNumber || fromMe;
  const sudos   = await getSudos();
  const isSudo  = sudos.includes(senderNum) || isOwner;

  if (cmd.ownerOnly && !isOwner) {
    return sock.sendMessage(jid, { text: '🚫 This command is *owner only*.', quoted: msg });
  }
  if (cmd.sudoOnly && !isSudo) {
    return sock.sendMessage(jid, { text: '🚫 This command is *sudo only*.', quoted: msg });
  }
  if (cmd.groupOnly && !isGroup) {
    return sock.sendMessage(jid, { text: '🚫 This command only works in *groups*.', quoted: msg });
  }
  if (cmd.privateOnly && isGroup) {
    return sock.sendMessage(jid, { text: '🚫 This command only works in *private chat*.', quoted: msg });
  }

  // ── Group admin check ─────────────────────────────
  let isAdmin = false, isBotAdmin = false;
  if (isGroup) {
    try {
      const meta = await sock.groupMetadata(jid);
      const admins = meta.participants.filter(p => p.admin).map(p => p.id);
      isAdmin    = admins.includes(sender);
      isBotAdmin = admins.includes(sock.user.id);
    } catch {}
  }
  if (cmd.adminOnly && !isAdmin && !isOwner) {
    return sock.sendMessage(jid, { text: '🚫 This command is *admin only*.', quoted: msg });
  }

  // ── Typing / Recording presence ───────────────────
  if (settings.autoTyping && !isGroup) {
    await sock.sendPresenceUpdate('composing', jid).catch(() => {});
  }
  if (settings.autoRecording && !isGroup) {
    await sock.sendPresenceUpdate('recording', jid).catch(() => {});
  }

  // ── React ─────────────────────────────────────────
  if (settings.reactEnabled !== false) {
    const emoji = config.reactEmojis[cmd.category] || config.reactEmojis.default;
    if (emoji) {
      await sleep(config.reactDelay);
      await sock.sendMessage(jid, {
        react: { text: emoji, key: msg.key },
      }).catch(() => {});
    }
  }

  // ── Execute command ───────────────────────────────
  logger.cmd(`${senderNum} → ${prefix}${cmdName} [${args.join(' ')}]`);

  try {
    await cmd.execute({
      sock, msg, jid, sender, senderNum,
      senderName: msg.pushName || senderNum,
      args, body, commands,
      isGroup, isOwner, isSudo, isAdmin, isBotAdmin,
      start: startTime,
      prefix,
    });

    const execTime = Date.now() - startTime;
    await incrementCmd();
    logger.success(`${cmdName} executed in ${execTime}ms`);

    // XP for command
    await addXP(senderNum, config.xpPerCommand);

  } catch (err) {
    logger.error(`Command ${cmdName} error: ${err.message}`);
    await sock.sendMessage(jid, {
      text: `❌ *Error executing* \`${cmdName}\`:\n${err.message}`,
      quoted: msg,
    }).catch(() => {});
  }
}
