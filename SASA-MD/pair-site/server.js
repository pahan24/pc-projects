// ══════════════════════════════════════════════════════
//  SASA MD — Pair Site Server
// ══════════════════════════════════════════════════════
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';
import { log } from '../lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _sock = null;

export async function startPairServer(sock) {
  _sock = sock;
  const app    = express();
  const server = createServer(app);
  const io     = new Server(server, { cors: { origin: '*' } });

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Status endpoint
  app.get('/api/status', (req, res) => {
    res.json({ online: !!_sock?.user, botName: config.botName, version: config.botVersion });
  });

  // Generate pair code
  app.post('/api/pair', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    try {
      if (!_sock) return res.status(503).json({ error: 'Bot not connected. Start bot first.' });
      const code = await _sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
      res.json({ code, success: true });
    } catch (e) {
      res.status(500).json({ error: e.message, success: false });
    }
  });

  // Serve HTML
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Socket status broadcast
  io.on('connection', (socket) => {
    const send = () => socket.emit('status', { online: !!_sock?.user });
    send();
    const iv = setInterval(send, 3000);
    socket.on('disconnect', () => clearInterval(iv));
  });

  server.listen(config.pairPort, () => {
    log.success(`Pair Site → http://localhost:${config.pairPort}`);
  });

  return {
    setSocket: (s) => { _sock = s; },
    app, server, io,
  };
}
