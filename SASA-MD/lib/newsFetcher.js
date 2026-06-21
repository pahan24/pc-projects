// ── Sri Lanka News Fetcher ──────────────────────────
import axios   from 'axios';
import config  from '../config.js';

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000,
  });
  return data;
}

// Generic RSS/HTML parser – each channel has custom scrape logic
async function parseHiruNews() {
  const { load } = await import('cheerio');
  const html = await fetchHtml(config.newsSources.hiru);
  const $    = load(html);
  const items = [];
  $('article, .news-item, .entry').each((i, el) => {
    if (i >= 5) return false;
    const title = $(el).find('h2,h3,a').first().text().trim();
    const link  = $(el).find('a').first().attr('href') || '';
    if (title) items.push({ title, link: link.startsWith('http') ? link : config.newsSources.hiru + link });
  });
  return items;
}

async function parseDerana() {
  const { load } = await import('cheerio');
  const html = await fetchHtml(config.newsSources.derana);
  const $    = load(html);
  const items = [];
  $('article, .news-card, .article-item').each((i, el) => {
    if (i >= 5) return false;
    const title = $(el).find('h2,h3,a').first().text().trim();
    const link  = $(el).find('a').first().attr('href') || '';
    if (title) items.push({ title, link: link.startsWith('http') ? link : 'https://www.derana.lk' + link });
  });
  return items;
}

export async function fetchNews(source = 'hiru') {
  try {
    switch (source) {
      case 'hiru':    return await parseHiruNews();
      case 'derana':  return await parseDerana();
      default:        return await parseHiruNews();
    }
  } catch (e) {
    console.error('[NEWS]', e.message);
    return [];
  }
}

export function formatNewsMessage(items, source) {
  if (!items.length) return '📰 No news available right now.';
  let msg = `📰 *Latest ${source.toUpperCase()} News*\n${'─'.repeat(30)}\n`;
  items.forEach((n, i) => {
    msg += `${i + 1}. ${n.title}\n`;
    if (n.link) msg += `   🔗 ${n.link}\n`;
    msg += '\n';
  });
  return msg;
}
