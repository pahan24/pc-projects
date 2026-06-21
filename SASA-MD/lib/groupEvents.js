/**
 * lib/groupEvents.js
 * Handles group participant events:
 * - Welcome message for new members
 * - Goodbye message for leaving members
 */

"use strict";

const db     = require("./db");
const config = require("../config");

module.exports = async function groupEvents(sock, update) {
  const { id: jid, participants, action } = update;
  const settings = await db.settings.get();
  const grp      = await db.groups.get(jid);

  for (const participant of participants) {
    const tag = `@${participant.split("@")[0]}`;

    if (action === "add") {
      // ── Welcome ──────────────────────────────────────────
      const showWelcome = grp.welcome !== undefined ? grp.welcome : settings.welcome;
      if (!showWelcome) continue;

      const welcomeMsg = grp.welcomeMsg ||
        `👋 *Welcome to the group!*\n\nHey ${tag} 🎉\nWe're glad to have you here!\n\n📌 Please read the group rules.\n🤖 Use *${settings.prefix || config.prefix}menu* to see bot commands.`;

      await sock.sendMessage(jid, {
        text: welcomeMsg,
        mentions: [participant],
      });

      // Give welcome bonus if first time
      await db.users.getOrCreate(participant);

    } else if (action === "remove") {
      // ── Goodbye ──────────────────────────────────────────
      const showGoodbye = grp.goodbye !== undefined ? grp.goodbye : settings.goodbye;
      if (!showGoodbye) continue;

      const goodbyeMsg = grp.goodbyeMsg ||
        `👋 *Goodbye!*\n\n${tag} has left the group.\nWe'll miss you! 💔`;

      await sock.sendMessage(jid, {
        text: goodbyeMsg,
        mentions: [participant],
      });
    }
  }
};
