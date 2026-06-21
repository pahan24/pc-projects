// ── Fun Commands ───────────────────────────────────────
import axios from 'axios';
import { randomItem } from '../../lib/utils.js';

const JOKES = [
  "Why don't programmers like nature? 🌿 It has too many bugs! 🐛",
  "I told my wife she was drawing her eyebrows too high. 👁️ She looked surprised.",
  "Why do cows wear bells? 🔔 Because their horns don't work! 📯",
  "What do you call a fish without eyes? 🐟 A fsh!",
  "Why did the scarecrow win an award? 🏆 He was outstanding in his field! 🌾",
  "I'm reading a book about anti-gravity. 📚 It's impossible to put down!",
  "Why can't you give Elsa a balloon? 🎈 Because she'll let it go!",
  "What's a computer's favorite snack? 💻 Microchips! 🍟",
];

const QUOTES = [
  '"The only way to do great work is to love what you do." — Steve Jobs',
  '"Innovation distinguishes between a leader and a follower." — Steve Jobs',
  '"Life is what happens when you\'re busy making other plans." — John Lennon',
  '"The future belongs to those who believe in the beauty of their dreams." — Eleanor Roosevelt',
  '"In the middle of every difficulty lies opportunity." — Albert Einstein',
  '"Success is not final, failure is not fatal: it is the courage to continue that counts." — Churchill',
  '"The best time to plant a tree was 20 years ago. The second best time is now." — Chinese Proverb',
  '"Be yourself; everyone else is already taken." — Oscar Wilde',
];

const FACTS = [
  '🔬 Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs!',
  '🐬 Dolphins sleep with one eye open.',
  '🌙 The Moon is moving away from Earth at about 3.8 cm per year.',
  '🦑 A group of flamingos is called a "flamboyance".',
  '💀 The human body contains enough carbon to make 9,000 pencils.',
  '🧠 The brain uses about 20% of the body\'s total oxygen and energy.',
  '🌊 The Pacific Ocean is larger than all land masses on Earth combined.',
  '🐘 Elephants are the only animals that cannot jump.',
  '⚡ Lightning strikes Earth about 100 times per second.',
  '🦋 Butterflies taste with their feet!',
];

const TRUTHS = [
  "What's one thing you've never told anyone?",
  "Who was your first crush?",
  "What's your most embarrassing moment?",
  "Have you ever lied to get out of trouble?",
  "What's the strangest dream you've ever had?",
  "What's your biggest fear?",
  "Have you ever cheated on a test?",
  "What's one thing you wish you could change about yourself?",
];

const DARES = [
  "Send a selfie with a funny face to the group! 🤪",
  "Type a message using only emojis for your next 3 replies!",
  "Change your profile picture to something funny for 1 hour!",
  "Send a voice note singing any song for 10 seconds!",
  "Write a poem about the person above you!",
  "Text your best friend 'I love broccoli' with no explanation!",
  "Do 10 jumping jacks and send a voice note while doing it!",
  "Set a funny status for 30 minutes!",
];

const MEME_APIS = [
  'https://meme-api.com/gimme',
  'https://api.imgflip.com/get_memes',
];

export default [
  {
    name: 'meme', aliases: ['memes'],
    description: 'Get a random meme', usage: 'meme',
    category: 'fun', cooldown: 5,
    async execute({ sock, msg, jid }) {
      try {
        const res  = await axios.get('https://meme-api.com/gimme', { timeout: 8000 });
        const meme = res.data;
        await sock.sendMessage(jid, {
          image: { url: meme.url },
          caption: `😂 *${meme.title}*\n📌 r/${meme.subreddit}`,
        });
      } catch {
        await sock.sendMessage(jid, { text: '❌ Could not fetch meme right now.', quoted: msg });
      }
    },
  },

  {
    name: 'joke', aliases: ['jokes'],
    description: 'Get a random joke', usage: 'joke',
    category: 'fun', cooldown: 3,
    async execute({ sock, msg, jid }) {
      try {
        const res = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 5000 });
        const j   = res.data;
        await sock.sendMessage(jid, { text: `😂 *Joke Time!*\n\n${j.setup}\n\n...\n\n${j.punchline} 😄`, quoted: msg });
      } catch {
        await sock.sendMessage(jid, { text: `😂 ${randomItem(JOKES)}`, quoted: msg });
      }
    },
  },

  {
    name: 'quote', aliases: ['quotes', 'qod'],
    description: 'Get an inspiring quote', usage: 'quote',
    category: 'fun', cooldown: 3,
    async execute({ sock, msg, jid }) {
      try {
        const res   = await axios.get('https://api.quotable.io/random', { timeout: 5000 });
        const q     = res.data;
        await sock.sendMessage(jid, { text: `💬 *"${q.content}"*\n\n— _${q.author}_`, quoted: msg });
      } catch {
        await sock.sendMessage(jid, { text: `💬 ${randomItem(QUOTES)}`, quoted: msg });
      }
    },
  },

  {
    name: 'fact', aliases: ['facts'],
    description: 'Get a random interesting fact', usage: 'fact',
    category: 'fun', cooldown: 3,
    async execute({ sock, msg, jid }) {
      try {
        const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', { timeout: 5000 });
        await sock.sendMessage(jid, { text: `🧠 *Random Fact*\n\n${res.data.text}`, quoted: msg });
      } catch {
        await sock.sendMessage(jid, { text: `🧠 *Random Fact*\n\n${randomItem(FACTS)}`, quoted: msg });
      }
    },
  },

  {
    name: 'truth',
    description: 'Get a truth or dare — truth', usage: 'truth',
    category: 'fun', cooldown: 3,
    async execute({ sock, msg, jid }) {
      await sock.sendMessage(jid, { text: `🎯 *TRUTH*\n\n${randomItem(TRUTHS)}`, quoted: msg });
    },
  },

  {
    name: 'dare',
    description: 'Get a truth or dare — dare', usage: 'dare',
    category: 'fun', cooldown: 3,
    async execute({ sock, msg, jid }) {
      await sock.sendMessage(jid, { text: `🔥 *DARE*\n\n${randomItem(DARES)}`, quoted: msg });
    },
  },

  {
    name: 'ship', aliases: ['love', 'lovecalc'],
    description: 'Calculate love compatibility', usage: 'ship <name1> + <name2>',
    category: 'fun', cooldown: 3,
    async execute({ sock, msg, jid, args }) {
      const combined = args.join(' ');
      const parts    = combined.split(/\+|and|&/i).map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) return await sock.sendMessage(jid, { text: '❌ Usage: .ship <name1> + <name2>', quoted: msg });
      const [a, b] = parts;
      const score  = Math.floor(Math.random() * 51) + 50; // 50–100 for fun
      const hearts = '❤️'.repeat(Math.floor(score / 20)) + '🤍'.repeat(5 - Math.floor(score / 20));
      let verdict  = '';
      if (score >= 90) verdict = '💫 Soulmates! Perfect match!';
      else if (score >= 75) verdict = '🥰 Great couple material!';
      else if (score >= 60) verdict = '😊 Pretty good compatibility!';
      else verdict = '🌱 Love takes time — keep it up!';
      await sock.sendMessage(jid, {
        text: [
          `💘 *Love Calculator*`,
          `${'─'.repeat(25)}`,
          `👤 ${a} ❤️ ${b}`,
          `📊 Score: *${score}%*`,
          `${hearts}`,
          `💬 ${verdict}`,
        ].join('\n'), quoted: msg,
      });
    },
  },
];
