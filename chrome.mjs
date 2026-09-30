import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function resolveChrome() {
  if (process.env.CHROME_PATH) {
    if (existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
    throw new Error('CHROME_PATH does not exist: ' + process.env.CHROME_PATH);
  }
  try {
    const out = execFileSync(process.execPath, [fileURLToPath(new URL('./node_modules/hyperframes/bin/hyperframes.mjs', import.meta.url)), 'browser', 'path'], { encoding: 'utf8', windowsHide: true, timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] });
    const candidate = out.trim().split(/\r?\n/).pop();
    if (candidate && existsSync(candidate)) return candidate;
  } catch {}
  for (const candidate of [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    ...(process.env.LOCALAPPDATA ? [process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe'] : []),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ]) if (existsSync(candidate)) return candidate;
  throw new Error('No Chrome found. Install Chrome or set CHROME_PATH to its executable.');
}
