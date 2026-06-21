/**
 * web/routes/auth.js
 * JWT authentication routes.
 */

"use strict";

const express = require("express");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
const config  = require("../../config");
const db      = require("../../lib/db");

const router = express.Router();

// ── Init hashed password on first run ────────────────────────
let hashedPassword = null;

async function getHashedPw() {
  if (hashedPassword) return hashedPassword;
  const settings = await db.settings.get();
  if (settings.hashedPassword) {
    hashedPassword = settings.hashedPassword;
  } else {
    hashedPassword = await bcrypt.hash(config.botPassword, 10);
    await db.settings.set("hashedPassword", hashedPassword);
  }
  return hashedPassword;
}
getHashedPw(); // init early

// ── POST /api/auth/login ──────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password required" });

    const hash  = await getHashedPw();
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { role: "admin", ts: Date.now() },
      config.jwtSecret,
      { expiresIn: "24h" }
    );
    res.json({ token, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/change-password ───────────────────────────
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.settings.set("hashedPassword", hashedPassword);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/verify ─────────────────────────────────────
router.get("/verify", verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ── Middleware ───────────────────────────────────────────────
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = router;
module.exports.verifyToken = verifyToken;
