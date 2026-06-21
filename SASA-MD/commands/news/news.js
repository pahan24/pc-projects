// ── Sri Lanka News Commands ────────────────────────────
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeNews(url, selector, titleSel, linkSel, descSel, sourceName, limit = 5) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 12000,
  });
  const $     = cheerio.load(data);
  const items = [];

  $(selector).each((i, el) => {
    if (i >= limit) return false;
    const title = $(el).find(titleSel).first().text().trim();
    const desc  = descSel ? $(el).find(descSel).first().text().trim().slice(0, 120) : '';
    let link    = $(el).find(linkSel || 'a').first().attr('href') || '';
    if (link && !link.startsWith('http')) link = new URL(link, url).href;
    if (title) items.push({ title, desc, link });
  });
  return items;
}

function formatNews(items, source) {
  if (!items.length) return `📰 No news found from ${source} right now.`;
  let out = `📰 *${source} — Latest News*\n${'═'.repeat(30)}\n\n`;
  items.forEach((n, i) => {
    out += `*${i + 1}.* ${n.title}\n`;
    if (n.desc) out += `_${n.desc}_\n`;
    if (n.link) out += `🔗 ${n.link}\n`;
    out += '\n';
  });
  out += `_Source: ${source}_`;
  return out;
}

async function fetchAndSend(sock, msg, jid, fetchFn, sourceName) {
  await sock.sendMessage(jid, { text: `📰 Fetching *${sourceName}* news...`, quoted: msg });
  try {
    const items = await fetchFn();
    await sock.sendMessage(jid, { text: formatNews(items, sourceName), quoted: msg });
  } catch (e) {
    await sock.sendMessage(jid, {
      text: `❌ Could not fetch ${sourceName} news.\n_${e.message}_\n\nVisit the website directly for latest news.`,
      quoted: msg,
    });
  }
}

export default [
  {
    name: 'hiru', aliases: ['hirunews'],
    description: 'Latest Hiru TV news', usage: 'hiru',
    category: 'news', cooldown: 15,
    async execute({ sock, msg, jid }) {
      await fetchAndSend(sock, msg, jid,
        () => scrapeNews('https://www.hirunews.lk', 'article, .news-item, .entry-item', 'h2, h3, .title', 'a', '.desc, p', 'Hiru TV'),
        'Hiru TV'
      );
    },
  },
  {
    name: 'derana', aliases: ['derananews', 'tv1'],
    description: 'Latest Derana TV news', usage: 'derana',
    category: 'news', cooldown: 15,
    async execute({ sock, msg, jid }) {
      await fetchAndSend(sock, msg, jid,
        () => scrapeNews('https://www.derana.lk/category/local', 'article, .news-card', 'h2, h3, a', 'a', 'p', 'Derana TV'),
        'Derana TV'
      );
    },
  },
  {
    name: 'sirasa', aliases: ['sirasanews'],
    description: 'Latest Sirasa TV news', usage: 'sirasa',
    category: 'news', cooldown: 15,
    async execute({ sock, msg, jid }) {
      await fetchAndSend(sock, msg, jid,
        () => scrapeNews('https://www.sirasatv.lk', '.news-item, article', 'h2, h3', 'a', 'p', 'Sirasa TV'),
        'Sirasa TV'
      );
    },
  },
  {
    name: 'itn', aliases: ['itnnews'],
    description: 'Latest ITN news', usage: 'itn',
    category: 'news', cooldown: 15,
    async execute({ sock, msg, jid }) {
      await fetchAndSend(sock, msg, jid,
        () => scrapeNews('https://www.itnnews.lk', 'article, .item', 'h2, h3', 'a', 'p', 'ITN'),
        'ITN'
      );
    },
  },
  {
    name: 'newsfirst', aliases: ['nf'],
    description: 'Latest NewsFirst news', usage: 'newsfirst',
    category: 'news', cooldown: 15,
    async execute({ sock, msg, jid }) {
      await fetchAndSend(sock, msg, jid,
        () => scrapeNews('https://www.newsfirst.lk', 'article, .news-item', 'h2, h3', 'a', 'p', 'NewsFirst'),
        'NewsFirst'
      );
    },
  },
  {
    name: 'swarnavahini', aliases: ['swarna'],
    description: 'Latest Swarnavahini news', usage: 'swarnavahini',
    category: 'news', cooldown: 15,
    async execute({ sock, msg, jid }) {
      await fetchAndSend(sock, msg, jid,
        () => scrapeNews('https://www.swarnavahini.lk', 'article, .news', 'h2, h3', 'a', 'p', 'Swarnavahini'),
        'Swarnavahini'
      );
    },
  },
];
