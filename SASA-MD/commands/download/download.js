// ── Download Commands ──────────────────────────────────
import axios from 'axios';

async function apiGet(url, params = {}) {
  const res = await axios.get(url, { params, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  return res.data;
}

export default [
  {
    name: 'yt', aliases: ['youtube', 'yts'],
    description: 'Search YouTube videos', usage: 'yt <query>',
    category: 'download', cooldown: 5,
    async execute({ sock, msg, jid, args }) {
      if (!args.length) return await sock.sendMessage(jid, { text: '❌ Usage: .yt <search term>', quoted: msg });
      const query = args.join(' ');
      await sock.sendMessage(jid, { text: `🔍 Searching: *${query}*`, quoted: msg });
      try {
        const ytSearch = await import('yt-search');
        const result   = await ytSearch.default(query);
        const videos   = result.videos.slice(0, 5);
        if (!videos.length) return await sock.sendMessage(jid, { text: '❌ No results found.', quoted: msg });
        let text = `🎬 *YouTube Results for:* "${query}"\n${'─'.repeat(30)}\n\n`;
        videos.forEach((v, i) => {
          text += `*${i+1}.* ${v.title}\n`;
          text += `   ⏱️ ${v.timestamp} | 👁 ${v.views?.toLocaleString() || '?'} views\n`;
          text += `   🔗 ${v.url}\n\n`;
        });
        await sock.sendMessage(jid, { text, quoted: msg });
      } catch (e) {
        await sock.sendMessage(jid, { text: `❌ Search failed: ${e.message}`, quoted: msg });
      }
    },
  },

  {
    name: 'ytmp3', aliases: ['mp3', 'audio'],
    description: 'Download YouTube audio (MP3)', usage: 'ytmp3 <YouTube URL or name>',
    category: 'download', cooldown: 10,
    async execute({ sock, msg, jid, args }) {
      if (!args.length) return await sock.sendMessage(jid, { text: '❌ Usage: .ytmp3 <URL or name>', quoted: msg });
      await sock.sendMessage(jid, { text: `⏳ Processing audio download...`, quoted: msg });
      const query = args.join(' ');
      try {
        // Integration point for ytdl-core
        const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
        const url   = isUrl ? query : (await import('yt-search').then(m => m.default(query))).videos[0]?.url;
        if (!url) return await sock.sendMessage(jid, { text: '❌ No video found.', quoted: msg });
        const ytdl = await import('ytdl-core');
        const info  = await ytdl.default.getInfo(url);
        const title = info.videoDetails.title;
        // stream audio
        await sock.sendMessage(jid, {
          audio: ytdl.default(url, { filter: 'audioonly', quality: 'highestaudio' }),
          mimetype: 'audio/mp4',
          fileName: `${title}.mp3`,
        });
      } catch (e) {
        await sock.sendMessage(jid, { text: `❌ Audio download failed: ${e.message}\n_Try a different video_`, quoted: msg });
      }
    },
  },

  {
    name: 'ytmp4', aliases: ['mp4', 'video'],
    description: 'Download YouTube video (MP4)', usage: 'ytmp4 <YouTube URL>',
    category: 'download', cooldown: 15,
    async execute({ sock, msg, jid, args }) {
      if (!args.length) return await sock.sendMessage(jid, { text: '❌ Usage: .ytmp4 <URL>', quoted: msg });
      await sock.sendMessage(jid, { text: `⏳ Processing video download...`, quoted: msg });
      const url = args[0];
      try {
        const ytdl = await import('ytdl-core');
        const info  = await ytdl.default.getInfo(url);
        const title = info.videoDetails.title;
        const format = ytdl.default.chooseFormat(info.formats, { quality: '18', filter: 'videoandaudio' });
        if (!format) throw new Error('No compatible format found');
        await sock.sendMessage(jid, {
          video: ytdl.default(url, { format }),
          caption: `🎬 *${title}*`,
          fileName: `${title}.mp4`,
        });
      } catch (e) {
        await sock.sendMessage(jid, { text: `❌ Video download failed: ${e.message}`, quoted: msg });
      }
    },
  },

  {
    name: 'tiktok', aliases: ['tt', 'tk'],
    description: 'Download TikTok video without watermark', usage: 'tiktok <TikTok URL>',
    category: 'download', cooldown: 8,
    async execute({ sock, msg, jid, args }) {
      const url = args[0];
      if (!url) return await sock.sendMessage(jid, { text: '❌ Usage: .tiktok <URL>', quoted: msg });
      await sock.sendMessage(jid, { text: '⏳ Fetching TikTok...', quoted: msg });
      try {
        const res = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, { timeout: 12000 });
        if (res.data?.token) {
          const dlUrl = `https://tikmate.app/download/${res.data.token}.mp4`;
          await sock.sendMessage(jid, {
            video: { url: dlUrl },
            caption: `🎵 TikTok Video\n🔗 ${url}`,
            gifPlayback: false,
          });
        } else {
          throw new Error('Invalid response');
        }
      } catch (e) {
        await sock.sendMessage(jid, { text: `❌ TikTok download failed: ${e.message}\n_Make sure URL is valid and public_`, quoted: msg });
      }
    },
  },

  {
    name: 'facebook', aliases: ['fb'],
    description: 'Download Facebook video', usage: 'facebook <URL>',
    category: 'download', cooldown: 10,
    async execute({ sock, msg, jid, args }) {
      const url = args[0];
      if (!url) return await sock.sendMessage(jid, { text: '❌ Usage: .facebook <URL>', quoted: msg });
      await sock.sendMessage(jid, { text: `📘 Downloading Facebook video...\n_Configure FB downloader API for full support_`, quoted: msg });
    },
  },

  {
    name: 'insta', aliases: ['instagram', 'ig'],
    description: 'Download Instagram post/reel', usage: 'insta <URL>',
    category: 'download', cooldown: 10,
    async execute({ sock, msg, jid, args }) {
      const url = args[0];
      if (!url) return await sock.sendMessage(jid, { text: '❌ Usage: .insta <URL>', quoted: msg });
      await sock.sendMessage(jid, { text: `📸 Fetching Instagram media...\n_Configure Instagram API for full support_`, quoted: msg });
    },
  },

  {
    name: 'mediafire', aliases: ['mf'],
    description: 'Download MediaFire file info', usage: 'mediafire <URL>',
    category: 'download', cooldown: 8,
    async execute({ sock, msg, jid, args }) {
      const url = args[0];
      if (!url) return await sock.sendMessage(jid, { text: '❌ Usage: .mediafire <URL>', quoted: msg });
      try {
        const { data } = await axios.get(url, { timeout: 10000 });
        const $         = (await import('cheerio')).load(data);
        const filename  = $('.dl-btn-label').text().trim() || 'Unknown File';
        const size      = $('.details-list li:contains("File Size")').text().replace('File Size','').trim() || '?';
        const dlLink    = $('#downloadButton').attr('href') || url;
        await sock.sendMessage(jid, {
          text: [
            `📦 *MediaFire File*`,
            `📄 Name: ${filename}`,
            `💾 Size: ${size}`,
            `🔗 Download: ${dlLink}`,
          ].join('\n'), quoted: msg,
        });
      } catch (e) {
        await sock.sendMessage(jid, { text: `❌ Failed to fetch MediaFire: ${e.message}`, quoted: msg });
      }
    },
  },
];
