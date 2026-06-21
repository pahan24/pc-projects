// ══════════════════════════════════════════════════════
//  SASA MD — Logger System
// ══════════════════════════════════════════════════════
import chalk from 'chalk';
import fs from 'fs-extra';
import moment from 'moment';
import config from '../config.js';

await fs.ensureDir(config.logsPath);

const logFile = () => `${config.logsPath}/${moment().format('YYYY-MM-DD')}.log`;

function timestamp() { return moment().format('HH:mm:ss'); }

async function writeLog(level, msg) {
  const line = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] [${level}] ${msg}\n`;
  await fs.appendFile(logFile(), line).catch(() => {});
}

export const log = {
  info:    (msg) => { console.log(chalk.cyan(`[${timestamp()}]`) + chalk.white(` ℹ  ${msg}`));   writeLog('INFO',    msg); },
  success: (msg) => { console.log(chalk.cyan(`[${timestamp()}]`) + chalk.green(` ✅ ${msg}`));    writeLog('SUCCESS', msg); },
  warn:    (msg) => { console.log(chalk.cyan(`[${timestamp()}]`) + chalk.yellow(` ⚠  ${msg}`));  writeLog('WARN',    msg); },
  error:   (msg) => { console.log(chalk.cyan(`[${timestamp()}]`) + chalk.red(` ❌ ${msg}`));     writeLog('ERROR',   msg); },
  cmd:     (user, cmd, jid) => {
    const short = jid.includes('@g.us') ? 'GROUP' : 'PM';
    const line  = `CMD [${short}] @${user} → ${config.prefix}${cmd}`;
    console.log(chalk.cyan(`[${timestamp()}]`) + chalk.magenta(` ⚡ ${line}`));
    writeLog('CMD', line);
  },
  connect: (msg) => { console.log(chalk.cyan(`[${timestamp()}]`) + chalk.bold.green(` 🌐 ${msg}`)); writeLog('CONNECT', msg); },
};

export function banner() {
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════╗
║                                              ║
║           ⚡  S A S A   M D  ⚡              ║
║     Advanced WhatsApp Multi Device Bot       ║
║           Version 2.0.0 by PAHAN            ║
║                                              ║
╚══════════════════════════════════════════════╝
`));
}
