// ── Media Commands ─────────────────────────────────────
export default [
  {
    name: 'sticker', aliases: ['s', 'stk'],
    description: 'Convert image/video to sticker', usage: 'sticker (reply to media)',
    category: 'media', cooldown: 5,
    async execute({ sock, msg, jid }) {
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      const imgMsg = ctx?.quotedMessage?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return await sock.sendMessage(jid, { text: '❌ Reply to an image.', quoted: msg });
      const buffer = await sock.downloadMediaMessage(
        ctx ? { message: ctx.quotedMessage, key: { remoteJid: jid, id: ctx.stanzaId } } : msg, 'buffer'
      );
      await sock.sendMessage(jid, {
        sticker: buffer,
        stickerMetadata: { packname: 'SASA MD', author: 'PAHAN', type: 1 },
      });
    },
  },
  {
    name: 'toimg', aliases: ['toimage'],
    description: 'Convert sticker to image', usage: 'toimg (reply to sticker)',
    category: 'media', cooldown: 5,
    async execute({ sock, msg, jid }) {
      const stickerMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
      if (!stickerMsg) return await sock.sendMessage(jid, { text: '❌ Reply to a sticker.', quoted: msg });
      const buffer = await sock.downloadMediaMessage(
        { message: { stickerMessage: stickerMsg }, key: msg.key }, 'buffer'
      );
      await sock.sendMessage(jid, { image: buffer, caption: '🖼️ Converted from sticker' });
    },
  },
];
