// ── Social/Media Commands ───────────────────────────
import axios from 'axios';

export const song = {
  name: 'song', emoji: '🎵', aliases: ['music', 'yt', 'audio'],
  description: 'Download audio from YouTube', usage: 'song <name>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    if (!args.length) return await sock.sendMessage(jid, { text: '❌ Provide a song name.', quoted: msg });
    await sock.sendMessage(jid, { text: `🎵 Searching: *${args.join(' ')}*\n_Note: Configure YT downloader API for full functionality_`, quoted: msg });
    // Integration point: use ytdl-core or rapidapi endpoint
    // const url = await searchYoutube(args.join(' '));
    // await sock.sendMessage(jid, { audio: { url }, mimetype: 'audio/mp4' });
  },
};

export const video = {
  name: 'video', emoji: '🎬', aliases: ['yt2', 'ytv'],
  description: 'Download video from YouTube', usage: 'video <name>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    if (!args.length) return await sock.sendMessage(jid, { text: '❌ Provide a video name.', quoted: msg });
    await sock.sendMessage(jid, { text: `🎬 Searching: *${args.join(' ')}*\n_Configure YT API for full functionality_`, quoted: msg });
  },
};

export const fb = {
  name: 'fb', emoji: '📘', aliases: ['facebook'],
  description: 'Download Facebook video', usage: 'fb <url>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: '❌ Provide a Facebook URL.', quoted: msg });
    await sock.sendMessage(jid, { text: `📘 Downloading Facebook video...\n_Configure FB API for full functionality_`, quoted: msg });
  },
};

export const tiktok = {
  name: 'tiktok', emoji: '🎵', aliases: ['tk', 'tt'],
  description: 'Download TikTok video (no watermark)', usage: 'tiktok <url>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: '❌ Provide a TikTok URL.', quoted: msg });
    try {
      // TikTok downloader via public API
      const res = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, { timeout: 10000 }).catch(() => null);
      if (res?.data?.token) {
        const dlUrl = `https://tikmate.app/download/${res.data.token}.mp4`;
        await sock.sendMessage(jid, { video: { url: dlUrl }, caption: '🎵 Downloaded from TikTok' });
      } else {
        await sock.sendMessage(jid, { text: '❌ Could not download. Try another URL.', quoted: msg });
      }
    } catch {
      await sock.sendMessage(jid, { text: '❌ Download failed. Configure TikTok API.', quoted: msg });
    }
  },
};

export const insta = {
  name: 'insta', emoji: '📸', aliases: ['ig', 'instagram'],
  description: 'Download Instagram post', usage: 'insta <url>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: '❌ Provide an Instagram URL.', quoted: msg });
    await sock.sendMessage(jid, { text: `📸 Downloading Instagram post...\n_Configure Instagram API for full functionality_`, quoted: msg });
  },
};

export const twitter = {
  name: 'twitter', emoji: '🐦', aliases: ['tw', 'x'],
  description: 'Download Twitter/X video', usage: 'twitter <url>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const url = args[0];
    if (!url) return await sock.sendMessage(jid, { text: '❌ Provide a Twitter URL.', quoted: msg });
    await sock.sendMessage(jid, { text: `🐦 Downloading Twitter/X video...\n_Configure Twitter API for full functionality_`, quoted: msg });
  },
};

export const movie = {
  name: 'movie', emoji: '🎥', aliases: ['film'],
  description: 'Search movie info', usage: 'movie <name>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    if (!args.length) return await sock.sendMessage(jid, { text: '❌ Provide a movie name.', quoted: msg });
    const name = args.join(' ');
    try {
      const res = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(name)}&apikey=trilogy`, { timeout: 8000 });
      const m   = res.data;
      if (m.Response === 'False') return await sock.sendMessage(jid, { text: `❌ Movie not found: ${name}`, quoted: msg });
      await sock.sendMessage(jid, {
        text: [
          `🎥 *${m.Title}* (${m.Year})`,
          `⭐ Rating: ${m.imdbRating}/10`,
          `🎭 Genre: ${m.Genre}`,
          `⏱️ Runtime: ${m.Runtime}`,
          `🌍 Country: ${m.Country}`,
          `📝 Plot: ${m.Plot}`,
          `🎬 Director: ${m.Director}`,
          `👥 Actors: ${m.Actors}`,
        ].join('\n'),
        quoted: msg,
      });
    } catch {
      await sock.sendMessage(jid, { text: '❌ Configure OMDB_API_KEY for movie search.', quoted: msg });
    }
  },
};

export const apk = {
  name: 'apk', emoji: '📱', aliases: ['app'],
  description: 'Search APK info', usage: 'apk <app name>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    await sock.sendMessage(jid, { text: `📱 Searching APK: *${args.join(' ')}*\n_Configure APK API for full functionality_`, quoted: msg });
  },
};

export const img = {
  name: 'img', emoji: '🖼️', aliases: ['image', 'pic'],
  description: 'Search for images', usage: 'img <query>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    if (!args.length) return await sock.sendMessage(jid, { text: '❌ Provide a search query.', quoted: msg });
    await sock.sendMessage(jid, { text: `🖼️ Searching: *${args.join(' ')}*\n_Configure image search API for full functionality_`, quoted: msg });
  },
};

export const sticker = {
  name: 'sticker', emoji: '🎭', aliases: ['s', 'stk'],
  description: 'Convert image to sticker', usage: 'sticker (reply to image)', access: 'Public',
  async execute({ sock, msg, jid }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
    if (!imgMsg) return await sock.sendMessage(jid, { text: '❌ Reply to an image.', quoted: msg });
    const buffer = await sock.downloadMediaMessage(msg.message?.extendedTextMessage ? { message: quoted } : msg).catch(() => null);
    if (!buffer) return await sock.sendMessage(jid, { text: '❌ Could not download image.', quoted: msg });
    await sock.sendMessage(jid, {
      sticker: buffer,
      stickerMetadata: { type: 1, packname: 'SASA MD', author: 'PAHAN' },
    });
  },
};
