// ── Education Commands ──────────────────────────────
export const paper = {
  name: 'paper', emoji: '📄', aliases: ['pastpaper'],
  description: 'Search past exam papers', usage: 'paper <subject> <year>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const query = args.join(' ');
    if (!query) return await sock.sendMessage(jid, { text: '❌ Usage: .paper <subject> <year>', quoted: msg });
    await sock.sendMessage(jid, {
      text: [
        `📄 *Past Papers Search*`,
        `🔍 Query: ${query}`,
        `🌐 Search here:`,
        `• https://www.mohe.gov.lk`,
        `• https://pastpapers.wiki`,
        `• https://www.examresult.lk`,
        `_Configure EDUCATION_API for auto-download_`,
      ].join('\n'),
      quoted: msg,
    });
  },
};

export const pastpaper = {
  name: 'pastpaper', emoji: '📚',
  description: 'Download past exam paper', usage: 'pastpaper <subject> <year>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const [subject, year] = args;
    if (!subject) return await sock.sendMessage(jid, { text: '❌ Usage: .pastpaper <subject> <year>', quoted: msg });
    await sock.sendMessage(jid, {
      text: `📚 Searching: *${subject}* (${year || 'Latest'})\n_Configure education DB for this feature_`,
      quoted: msg,
    });
  },
};

export const syllabus = {
  name: 'syllabus', emoji: '📋',
  description: 'Get exam syllabus', usage: 'syllabus <subject>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const subject = args.join(' ');
    if (!subject) return await sock.sendMessage(jid, { text: '❌ Provide a subject.', quoted: msg });
    await sock.sendMessage(jid, {
      text: `📋 Syllabus for: *${subject}*\n🌐 Source: https://nie.lk\n_Configure NIE API for full content_`,
      quoted: msg,
    });
  },
};

export const notes = {
  name: 'notes', emoji: '📝', aliases: ['note'],
  description: 'Get study notes', usage: 'notes <subject>', access: 'Public',
  async execute({ sock, msg, jid, args }) {
    const subject = args.join(' ');
    if (!subject) return await sock.sendMessage(jid, { text: '❌ Provide a subject.', quoted: msg });
    await sock.sendMessage(jid, {
      text: `📝 Notes for: *${subject}*\n_Configure notes database for this feature_`,
      quoted: msg,
    });
  },
};
