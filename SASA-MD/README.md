# ⚡ SASA MD v2.0.0
### Advanced WhatsApp Multi Device Bot

> Built with Node.js + Baileys MD | By **PAHAN**

---

## 🚀 Quick Start

```bash
git clone <repo>
cd SASA-MD
npm install
cp .env.example .env
# Edit .env with your values
node index.js
```

Then open `http://localhost:3001` to pair your device.

---

## 📁 Structure

```
SASA-MD/
├── index.js              ← Main entry point
├── config.js             ← All configuration
├── package.json
├── .env.example
├── commands/
│   ├── tools/menu.js     ← ping, alive, menu, stats, runtime
│   ├── owner/owner.js    ← setprefix, setmode, block, broadcast...
│   ├── group/group.js    ← tagall, kick, add, promote, antilink...
│   ├── settings/settings.js ← react, autoread, autotyping...
│   ├── ai/ai.js          ← chat, code, explain, imagine
│   ├── news/news.js      ← hiru, derana, sirasa, itn, newsfirst...
│   ├── download/download.js ← yt, ytmp3, ytmp4, tiktok, insta...
│   ├── fun/fun.js        ← meme, joke, quote, fact, truth, dare, ship
│   ├── economy/economy.js ← balance, daily, give, richlist
│   └── level/level.js    ← rank, toplevel
├── events/
│   ├── groupUpdate.js    ← Welcome/goodbye/promote events
│   └── antiDelete.js     ← Cache + restore deleted messages
├── lib/
│   ├── database.js       ← Full JSON DB system
│   ├── handler.js        ← Dynamic command loader + processor
│   ├── menu.js           ← Menu builder
│   ├── logger.js         ← Colored console + file logging
│   └── utils.js          ← Shared utilities
├── pair-site/
│   ├── server.js         ← Express + Socket.io pair server
│   └── public/index.html ← Premium neon pair website
├── database/             ← Auto-created JSON files
└── session/              ← WhatsApp auth session
```

---

## ⚙️ Environment Variables

| Key | Description | Default |
|-----|-------------|---------|
| `OWNER_NUMBER` | Your WhatsApp number | required |
| `BOT_NUMBER` | Bot's number | required |
| `PREFIX` | Command prefix | `.` |
| `MODE` | Bot mode | `public` |
| `AI_API_KEY` | OpenAI API key | optional |
| `PAIR_PORT` | Pair website port | `3001` |

---

## 📱 Pairing Methods

### Method 1 — Terminal QR
Start the bot and scan the QR code printed in terminal.

### Method 2 — Pair Website
1. Start bot: `node index.js`
2. Open: `http://localhost:3001`
3. Enter phone number → Generate code
4. WhatsApp → Linked Devices → Link with phone number

---

## 🚀 Deploy

### VPS + PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

### Railway
- Connect GitHub repo
- Set environment variables in Railway dashboard
- Deploys automatically on push

### Render
```yaml
# render.yaml
services:
  - type: web
    name: sasa-md
    env: node
    buildCommand: npm install
    startCommand: node index.js
```

---

## ➕ Adding Commands

Create `/commands/<category>/mycommand.js`:

```js
export default {
  name: 'mycommand',
  aliases: ['mc'],
  description: 'Does something cool',
  usage: 'mycommand <arg>',
  category: 'tools',
  cooldown: 3,          // seconds
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,

  async execute({ sock, msg, jid, args, senderNum, isOwner }) {
    await sock.sendMessage(jid, { text: '🔥 Hello World!', quoted: msg });
  },
};
```

The handler auto-discovers it on restart.

---

## 📋 Commands

### 🛠️ Tools
`menu` `ping` `alive` `runtime` `stats`

### 👑 Owner  
`setprefix` `setmode` `setreact` `setcooldown` `restart` `shutdown` `block` `unblock` `broadcast` `addpremium` `delpremium`

### ⚙️ Settings
`react` `autoread` `autotyping` `autorecording` `cooldown` `prefix` `botsettings`

### 👥 Group
`tagall` `kick` `add` `promote` `demote` `group` `antilink` `welcome` `ginfo`

### 🤖 AI
`chat` `imagine` `code` `explain`

### 📰 News
`hiru` `derana` `sirasa` `itn` `newsfirst` `swarnavahini`

### 📥 Download
`yt` `ytmp3` `ytmp4` `tiktok` `facebook` `insta` `mediafire`

### 🎮 Fun
`meme` `joke` `quote` `fact` `truth` `dare` `ship`

### 💰 Economy
`balance` `daily` `give` `richlist` `transactions`

### 🏆 Level
`rank` `toplevel`

---

## 🛡️ Security Features

- ✅ Anti-spam (10s sliding window)
- ✅ Per-user command cooldowns
- ✅ Blocked user list
- ✅ Owner-only commands
- ✅ Admin-only group commands
- ✅ Anti-link per group (configurable)
- ✅ Anti-delete message restore
- ✅ Anti-view-once bypass
- ✅ Mode locking (public/private/group)

---

MIT License | SASA MD by PAHAN
