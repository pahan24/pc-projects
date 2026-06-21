// ── AI Commands ────────────────────────────────────────
import axios from 'axios';
import config from '../../config.js';

async function askAI(systemPrompt, userMsg) {
  if (!config.aiApiKey) return '⚠️ AI API key not configured. Set AI_API_KEY in .env';
  const res = await axios.post(config.aiApiUrl, {
    model: config.aiModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg },
    ],
    max_tokens: 1000,
    temperature: 0.8,
  }, {
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
  return res.data.choices[0].message.content.trim();
}

export default [
  {
    name: 'chat', aliases: ['gpt', 'ai'],
    description: 'Chat with AI assistant', usage: 'chat <message>',
    category: 'ai', cooldown: 5,
    async execute({ sock, msg, jid, args }) {
      if (!args.length) return await sock.sendMessage(jid, { text: '❌ Usage: .chat <message>', quoted: msg });
      await sock.sendPresenceUpdate('composing', jid);
      const reply = await askAI(`You are ${config.botName}, a helpful WhatsApp bot assistant. Be concise and friendly.`, args.join(' ')).catch(e => `❌ Error: ${e.message}`);
      await sock.sendMessage(jid, { text: `🤖 ${reply}`, quoted: msg });
    },
  },
  {
    name: 'imagine', aliases: ['img', 'image'],
    description: 'Generate image from text (requires image API)', usage: 'imagine <prompt>',
    category: 'ai', cooldown: 10,
    async execute({ sock, msg, jid, args }) {
      if (!args.length) return await sock.sendMessage(jid, { text: '❌ Provide a prompt.', quoted: msg });
      await sock.sendMessage(jid, {
        text: `🎨 *Image generation*\nPrompt: "${args.join(' ')}"\n\n_Configure IMAGE_API_KEY for DALL-E or Stability AI_`,
        quoted: msg,
      });
    },
  },
  {
    name: 'code',
    description: 'Generate code with AI', usage: 'code <description>',
    category: 'ai', cooldown: 8,
    async execute({ sock, msg, jid, args }) {
      if (!args.length) return await sock.sendMessage(jid, { text: '❌ Describe what code you need.', quoted: msg });
      await sock.sendPresenceUpdate('composing', jid);
      const reply = await askAI('You are an expert programmer. Generate clean, well-commented code. Use code blocks.', args.join(' ')).catch(e => `❌ ${e.message}`);
      await sock.sendMessage(jid, { text: `💻 *Code Output*\n\n${reply}`, quoted: msg });
    },
  },
  {
    name: 'explain',
    description: 'Explain code or concept', usage: 'explain <text>',
    category: 'ai', cooldown: 5,
    async execute({ sock, msg, jid, args }) {
      if (!args.length) return await sock.sendMessage(jid, { text: '❌ Provide something to explain.', quoted: msg });
      await sock.sendPresenceUpdate('composing', jid);
      const reply = await askAI('Explain this in simple, easy-to-understand terms. Be concise.', args.join(' ')).catch(e => `❌ ${e.message}`);
      await sock.sendMessage(jid, { text: `📖 *Explanation*\n\n${reply}`, quoted: msg });
    },
  },
];
