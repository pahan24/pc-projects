/**
 * web/routes/api.js
 * Dashboard API routes.
 */

"use strict";

const express = require("express");
const db      = require("../../lib/db");
const config  = require("../../config");
const system  = require("../../lib/system");
const { verifyToken } = require("./auth");

const router = express.Router();

// ── Status (public) ──────────────────────────────────────────
router.get("/status", async (req, res) => {
  res.json({
    connected:  global.botConnected || false,
    botJid:     global.botJid || null,
    version:    config.version,
    botName:    config.botName,
    owner:      config.owner,
    hasQR:      !!global.currentQR,
  });
});

// ── Settings ─────────────────────────────────────────────────
router.get("/settings", verifyToken, async (req, res) => {
  try { res.json(await db.settings.get()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/settings", verifyToken, async (req, res) => {
  try {
    const { key, value } = req.body;
    const allowed = ["mode","prefix","antiLink","antiBadword","autoRead","autoTyping","welcome","goodbye"];
    if (!allowed.includes(key)) return res.status(400).json({ error: "Invalid key" });
    await db.settings.set(key, value);
    if (key === "mode")   config.mode   = value;
    if (key === "prefix") config.prefix = value;
    res.json({ success: true, key, value });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Users ────────────────────────────────────────────────────
router.get("/users", verifyToken, async (req, res) => {
  try {
    const users  = await db.users.all();
    const coins  = await db.coins.all();
    const list   = Object.values(users).map(u => ({
      ...u,
      coins: coins[u.jid]?.balance || 0,
    }));
    res.json({ total: list.length, users: list.slice(0, 100) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Coins ─────────────────────────────────────────────────────
router.get("/coins", verifyToken, async (req, res) => {
  try {
    const allCoins = await db.coins.all();
    const total    = Object.values(allCoins).reduce((s, u) => s + (u.balance || 0), 0);
    res.json({ total, breakdown: allCoins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── React Packages ────────────────────────────────────────────
router.get("/react-packages", verifyToken, async (req, res) => {
  try { res.json(await db.reactPackages.list()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/react-packages", verifyToken, async (req, res) => {
  try {
    const { id, name, price, emojis, count, interval } = req.body;
    if (!id || !name || !price) return res.status(400).json({ error: "id, name, price required" });
    const pack = { name, price: Number(price), emojis: emojis || ["👍"], count: Number(count)||1, interval: Number(interval)||1 };
    await db.reactPackages.set(id, pack);
    res.json({ success: true, id, pack });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/react-packages/:id", verifyToken, async (req, res) => {
  try {
    await db.reactPackages.del(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── System Stats ─────────────────────────────────────────────
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const users     = await db.users.all();
    const allCoins  = await db.coins.all();
    const totalCoins= Object.values(allCoins).reduce((s,u) => s + (u.balance||0), 0);
    const mem       = system.memUsage();
    res.json({
      totalUsers:  Object.keys(users).length,
      totalCoins,
      uptime:      system.uptime(),
      memory:      mem,
      botName:     config.botName,
      version:     config.version,
      connected:   global.botConnected || false,
      mode:        config.mode,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Broadcast ─────────────────────────────────────────────────
router.post("/broadcast", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });
    const users = await db.users.all();
    let sent = 0, failed = 0;
    for (const jid of Object.keys(users)) {
      try {
        await global.sock?.sendMessage(jid, { text: `📣 *SASA MD Broadcast*\n\n${message}` });
        sent++;
        await new Promise(r => setTimeout(r, 500));
      } catch { failed++; }
    }
    res.json({ sent, failed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Restart ───────────────────────────────────────────────────
router.post("/restart", verifyToken, (req, res) => {
  res.json({ message: "Restarting..." });
  setTimeout(() => process.exit(0), 1000);
});

// ── Sudo list ─────────────────────────────────────────────────
router.get("/sudo", verifyToken, async (req, res) => {
  res.json(await db.sudo.list());
});

// ── Ban list ──────────────────────────────────────────────────
router.get("/ban", verifyToken, async (req, res) => {
  res.json(await db.ban.list());
});

module.exports = router;
