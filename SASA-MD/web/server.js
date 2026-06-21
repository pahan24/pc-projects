// ══════════════════════════════════════════════════
//  SASA MD — Unified Web Server v2
//  Express: Settings + Admin Panel + Pair Site
// ══════════════════════════════════════════════════
import express     from 'express';
import path        from 'path';
import crypto      from 'crypto';
import NodeCache   from 'node-cache';
import fs          from 'fs-extra';
import { fileURLToPath } from 'url';

import { generatePermanentKey, validateSettingsKey, revokeKey, listAllKeys } from '../api/settingsAuth.js';
import { getFullSettings, updateOneSetting, updateBulkSettings }             from '../api/settingsUpdate.js';
import { adminLogin, requireAdmin }                                            from '../api/adminAuth.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR    = __dirname;
const SESSIONS   = new NodeCache({ stdTTL: 86400 }); // 24h user sessions
const IP_RATE    = new NodeCache({ stdTTL: 900   });

// ── Global bot reference (set from index.js) ──────
let _sock = null;
export function setBotSock(s) { _sock = s; }

export function createWebServer(port = 4000) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Trust proxy for real IP
  app.set('trust proxy', 1);

  // ── Static: public web files ───────────────────
  app.use(express.static(path.join(WEB_DIR, 'public')));

  // ── User session middleware ────────────────────
  function requireUserSession(req, res, next) {
    const token   = req.headers['x-session-token'];
    const session = token && SESSIONS.get(token);
    if (!session) return res.status(401).json({ ok: false, error: 'Not authenticated.' });
    req.userSession = session;
    next();
  }

  // ── IP rate limiter ────────────────────────────
  function ipLimit(max = 10) {
    return (req, res, next) => {
      const ip  = req.ip || 'unknown';
      const key = `ipl_${ip}`;
      const cnt = (IP_RATE.get(key) || 0) + 1;
      IP_RATE.set(key, cnt);
      if (cnt > max) return res.status(429).json({ ok: false, error: 'Rate limit exceeded.' });
      next();
    };
  }

  // ══════════════════════════════════════════════
  //  SETTINGS AUTH ROUTES
  // ══════════════════════════════════════════════

  // POST /api/settings/login
  app.post('/api/settings/login', ipLimit(15), async (req, res) => {
    try {
      const phone = String(req.body.phone || '').replace(/[^0-9]/g, '').slice(0, 20);
      const key   = String(req.body.key   || '').replace(/[^a-f0-9]/gi, '').toLowerCase().slice(0, 128);
      const ip    = req.ip || 'unknown';

      const result = await validateSettingsKey(phone, key, ip);
      if (!result.ok) return res.status(401).json(result);

      const token = crypto.randomBytes(32).toString('hex');
      SESSIONS.set(token, { phone: result.phone, role: result.role });

      res.json({ ok: true, sessionToken: token, phone: result.phone });
    } catch {
      res.status(500).json({ ok: false, error: 'Server error.' });
    }
  });

  // GET /api/settings/data — get all settings
  app.get('/api/settings/data', requireUserSession, async (req, res) => {
    try {
      const s = await getFullSettings();
      res.json({ ok: true, settings: s, phone: req.userSession.phone });
    } catch {
      res.status(500).json({ ok: false, error: 'Failed to load settings.' });
    }
  });

  // POST /api/settings/update — update one setting
  app.post('/api/settings/update', requireUserSession, async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ ok: false, error: 'key required.' });
      const result = await updateOneSetting(key, value);
      if (!result.ok) return res.status(400).json(result);
      res.json(result);
    } catch {
      res.status(500).json({ ok: false, error: 'Update failed.' });
    }
  });

  // POST /api/settings/update-bulk
  app.post('/api/settings/update-bulk', requireUserSession, async (req, res) => {
    try {
      const result = await updateBulkSettings(req.body.updates);
      if (!result.ok) return res.status(400).json(result);
      res.json(result);
    } catch {
      res.status(500).json({ ok: false, error: 'Bulk update failed.' });
    }
  });

  // POST /api/settings/revoke — revoke own key
  app.post('/api/settings/revoke', requireUserSession, async (req, res) => {
    try {
      await revokeKey(req.userSession.phone);
      const token = req.headers['x-session-token'];
      SESSIONS.del(token);
      res.json({ ok: true, message: 'Key revoked. You have been logged out.' });
    } catch {
      res.status(500).json({ ok: false, error: 'Revoke failed.' });
    }
  });

  // ══════════════════════════════════════════════
  //  ADMIN ROUTES — Hidden path, no public links
  // ══════════════════════════════════════════════
  const ADMIN_SECRET_PATH = process.env.ADMIN_PATH || '_sasa_owner_panel_987654';

  // POST /api/admin/login — admin login (hidden)
  app.post(`/api/admin/login`, ipLimit(5), async (req, res) => {
    try {
      const { username, password } = req.body;
      const ip = req.ip || 'unknown';
      const result = await adminLogin(username, password, ip);
      if (!result.ok) return res.status(401).json(result);
      res.json(result);
    } catch {
      res.status(500).json({ ok: false, error: 'Server error.' });
    }
  });

  // Admin API routes (all protected by requireAdmin)
  const adminAPI = express.Router();
  adminAPI.use(requireAdmin);

  // GET stats
  adminAPI.get('/stats', async (req, res) => {
    try {
      const [users, groups, keys] = await Promise.all([
        fs.readJson(path.join(process.cwd(), 'database', 'users.json')).catch(() => ({})),
        fs.readJson(path.join(process.cwd(), 'database', 'groups.json')).catch(() => ({})),
        listAllKeys(),
      ]);
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);
      const mem = process.memoryUsage();
      res.json({
        ok: true,
        userCount:   Object.keys(users).length,
        groupCount:  Object.keys(groups).length,
        keyCount:    keys.length,
        uptime:      `${h}h ${m}m ${s}s`,
        memUsed:     `${(mem.heapUsed  / 1048576).toFixed(1)} MB`,
        memTotal:    `${(mem.heapTotal / 1048576).toFixed(1)} MB`,
        nodeVersion: process.version,
        botConnected: !!_sock,
        activeKeys: keys.filter(k => !k.revoked),
      });
    } catch {
      res.status(500).json({ ok: false, error: 'Failed to load stats.' });
    }
  });

  // GET logs
  adminAPI.get('/logs', async (req, res) => {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      const files   = await fs.readdir(logsDir).catch(() => []);
      if (!files.length) return res.json({ ok: true, logs: [] });
      const latest  = files.sort().reverse()[0];
      const content = await fs.readFile(path.join(logsDir, latest), 'utf8').catch(() => '');
      const lines   = content.split('\n').filter(Boolean).slice(-200).reverse();
      res.json({ ok: true, file: latest, logs: lines });
    } catch {
      res.status(500).json({ ok: false, error: 'Failed to load logs.' });
    }
  });

  // POST restart
  adminAPI.post('/restart', async (req, res) => {
    res.json({ ok: true, message: 'Restarting...' });
    setTimeout(() => process.exit(0), 1500);
  });

  // POST shutdown
  adminAPI.post('/shutdown', async (req, res) => {
    res.json({ ok: true, message: 'Shutting down...' });
    setTimeout(() => process.exit(1), 1500);
  });

  // POST broadcast
  adminAPI.post('/broadcast', async (req, res) => {
    try {
      const text = String(req.body.message || '').slice(0, 2000);
      if (!text) return res.status(400).json({ ok: false, error: 'Message required.' });
      if (!_sock) return res.status(503).json({ ok: false, error: 'Bot not connected.' });
      const users = await fs.readJson(path.join(process.cwd(), 'database', 'users.json')).catch(() => ({}));
      let sent = 0;
      for (const num of Object.keys(users)) {
        try {
          await _sock.sendMessage(`${num}@s.whatsapp.net`, { text: `📢 *SASA MD Admin*\n\n${text}` });
          sent++;
          await new Promise(r => setTimeout(r, 1000));
        } catch {}
      }
      res.json({ ok: true, sent });
    } catch {
      res.status(500).json({ ok: false, error: 'Broadcast failed.' });
    }
  });

  // POST ban / unban
  adminAPI.post('/ban', async (req, res) => {
    try {
      const phone = String(req.body.phone || '').replace(/[^0-9]/g, '');
      if (!phone) return res.status(400).json({ ok: false, error: 'Phone required.' });
      const f = path.join(process.cwd(), 'database', 'ban.json');
      const list = await fs.readJson(f).catch(() => []);
      if (!list.includes(phone)) list.push(phone);
      await fs.writeJson(f, list, { spaces: 2 });
      res.json({ ok: true, message: `Banned ${phone}` });
    } catch {
      res.status(500).json({ ok: false, error: 'Ban failed.' });
    }
  });

  adminAPI.post('/unban', async (req, res) => {
    try {
      const phone = String(req.body.phone || '').replace(/[^0-9]/g, '');
      const f = path.join(process.cwd(), 'database', 'ban.json');
      const list = (await fs.readJson(f).catch(() => [])).filter(n => n !== phone);
      await fs.writeJson(f, list, { spaces: 2 });
      res.json({ ok: true, message: `Unbanned ${phone}` });
    } catch {
      res.status(500).json({ ok: false, error: 'Unban failed.' });
    }
  });

  // POST add/remove coins
  adminAPI.post('/coins/add', async (req, res) => {
    try {
      const phone  = String(req.body.phone  || '').replace(/[^0-9]/g, '');
      const amount = parseInt(req.body.amount);
      if (!phone || isNaN(amount) || amount <= 0)
        return res.status(400).json({ ok: false, error: 'Valid phone and amount required.' });
      const { addCoins } = await import('../lib/database.js');
      const newBal = await addCoins(phone, amount, 'Admin Grant 👑');
      res.json({ ok: true, phone, added: amount, newBalance: newBal });
    } catch {
      res.status(500).json({ ok: false, error: 'Failed.' });
    }
  });

  adminAPI.post('/coins/remove', async (req, res) => {
    try {
      const phone  = String(req.body.phone  || '').replace(/[^0-9]/g, '');
      const amount = parseInt(req.body.amount);
      if (!phone || isNaN(amount) || amount <= 0)
        return res.status(400).json({ ok: false, error: 'Valid phone and amount required.' });
      const { deductCoins } = await import('../lib/database.js');
      const ok = await deductCoins(phone, amount, 'Admin Deduction 👑');
      if (!ok) return res.status(400).json({ ok: false, error: 'Insufficient balance.' });
      res.json({ ok: true, phone, removed: amount });
    } catch {
      res.status(500).json({ ok: false, error: 'Failed.' });
    }
  });

  // POST revoke user key (admin)
  adminAPI.post('/keys/revoke', async (req, res) => {
    try {
      const phone = String(req.body.phone || '').replace(/[^0-9]/g, '');
      const found = await revokeKey(phone);
      res.json({ ok: true, revoked: found });
    } catch {
      res.status(500).json({ ok: false, error: 'Revoke failed.' });
    }
  });

  app.use('/api/admin', adminAPI);

  // ══════════════════════════════════════════════
  //  PAGE ROUTES
  // ══════════════════════════════════════════════

  // Public pages
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  app.get('/settings', (req, res) => res.sendFile(path.join(WEB_DIR, 'settings.html')));
  app.get('/login',    (req, res) => res.sendFile(path.join(WEB_DIR, 'login.html')));

  // Hidden admin panel — ONLY accessible via secret path
  const adminPath = `/${ADMIN_SECRET_PATH}`;
  app.get(adminPath, (req, res) => res.sendFile(path.join(WEB_DIR, 'admin', 'index.html')));

  // 404 for everything else
  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

  app.listen(port, () => {
    console.log(`🌐 Web server: http://localhost:${port}`);
    console.log(`🔒 Admin panel: http://localhost:${port}/${ADMIN_SECRET_PATH}`);
  });

  return app;
}
