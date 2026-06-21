/**
 * web/routes/pair.js
 * Pairing routes: QR code + Pair Code generation.
 */

"use strict";

const express = require("express");
const QRCode  = require("qrcode");
const config  = require("../../config");

const router = express.Router();

// ── GET /api/pair/qr ─────────────────────────────────────────
// Returns QR code as base64 PNG
router.get("/qr", async (req, res) => {
  try {
    if (!global.currentQR) {
      return res.status(202).json({
        status: global.botConnected ? "connected" : "waiting",
        message: global.botConnected ? "Bot is already connected!" : "QR not yet generated. Please wait...",
      });
    }

    const qrBase64 = await QRCode.toDataURL(global.currentQR, {
      width: 400,
      margin: 2,
      color: { dark: "#00ff99", light: "#0d0d0d" },
    });

    res.json({
      status: "pending",
      qr: qrBase64,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/pair/code ───────────────────────────────────────
// Generate a pair code for a phone number
router.post("/code", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    const cleaned = phone.replace(/[^0-9]/g, "");
    if (!cleaned || cleaned.length < 7)
      return res.status(400).json({ error: "Invalid phone number" });

    if (!global.sock) return res.status(503).json({ error: "Bot not started yet" });
    if (global.botConnected) return res.status(409).json({ error: "Bot is already connected" });

    const code = await global.sock.requestPairingCode(cleaned);
    res.json({ code, phone: cleaned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/pair/status ──────────────────────────────────────
router.get("/status", (req, res) => {
  res.json({
    connected: global.botConnected || false,
    botJid:    global.botJid || null,
    hasQR:     !!global.currentQR,
  });
});

module.exports = router;
