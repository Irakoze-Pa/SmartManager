import { spawn } from 'node:child_process';

const apiHealthUrl = 'http://127.0.0.1:7310/api/health';

async function isSmartShopApiRunning() {
  try {
    const response = await fetch(apiHealthUrl, { signal: AbortSignal.timeout(1200) });
    if (!response.ok) return false;
    const health = await response.json();
    return health.service === 'smartshop-pro-api';
  } catch {
    return false;
  }
}

const reuseApi = await isSmartShopApiRunning();
const commands = [
  ['client', ['run', 'dev', '--prefix', 'client']],
  ...(!reuseApi ? [['server', ['run', 'dev', '--prefix', 'server']]] : []),
];

if (reuseApi) console.log('Reusing the SmartShop API already running on port 7310.');

const children = new Map();
let exiting = false;

function stopChildren(signal = 'SIGTERM') {
  if (exiting) return;
  exiting = true;
  for (const child of children.values()) if (!child.killed) child.kill(signal);
}

for (const [name, args] of commands) {
  const child = spawn('npm', args, { stdio: 'inherit' });
  children.set(name, child);
  child.once('error', (error) => {
    console.error(`Could not start ${name}:`, error.message);
    stopChildren();
    process.exitCode = 1;
  });
  child.once('exit', (code) => {
    if (exiting) return;
    process.exitCode = code ?? 1;
    stopChildren();
  });
}

process.once('SIGINT', () => stopChildren('SIGINT'));
process.once('SIGTERM', () => stopChildren('SIGTERM'));
