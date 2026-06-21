// ── System Info Utilities ───────────────────────────
import os from 'os';
import { execSync } from 'child_process';

export function getSystemInfo() {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  const memUsed = process.memoryUsage().heapUsed;
  const memTotal = os.totalmem();

  return {
    os:       `${os.type()} ${os.release()}`,
    arch:     os.arch(),
    node:     process.version,
    platform: process.platform,
    cpus:     os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    ramUsed:  (memUsed / 1024 / 1024).toFixed(1) + ' MB',
    ramTotal: (memTotal / 1024 / 1024).toFixed(0) + ' MB',
    uptime:   `${h}h ${m}m ${s}s`,
    pid:      process.pid,
  };
}

export async function pingBot() {
  const start = Date.now();
  return Date.now() - start;
}
