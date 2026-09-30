import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import net from 'node:net';

const root = path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const noOpen = process.argv.includes('--no-open');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const identity = createHash('sha256').update(root).digest('hex');
function openBrowser(url) {
  if (noOpen) return;
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  const child = spawn(command, args, { windowsHide: true, stdio: 'ignore' });
  child.on('error', () => console.log(`Open this address in your browser: ${url}`));
  child.unref();
}
async function sameStudio(url) {
  try {
    const response = await fetch(`${url}/api/studio`, {signal: AbortSignal.timeout(1200)});
    return response.ok && (await response.json()).identity === identity;
  } catch { return false; }
}
async function occupied(host, port) {
  return new Promise(resolve => {
    const socket = net.createConnection({host, port});
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.setTimeout(1200, () => { socket.destroy(); resolve(true); });
  });
}
async function main() {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Install Node.js 22 or newer from https://nodejs.org, then reopen this launcher.');
  const config = JSON.parse(readFileSync('studio.config.json', 'utf8'));
  const bind = process.env.HOST || config.server.host;
  const host = bind === '0.0.0.0' ? '127.0.0.1' : bind === '::' ? '::1' : bind;
  const port = Number(process.env.PORT || config.server.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server port in studio.config.json or PORT.');
  const url = `http://${host.includes(':') ? `[${host}]` : host}:${port}`;
  if (await sameStudio(url)) { console.log(`Your studio is already running: ${url}`); openBrowser(url); return; }
  if (await occupied(host, port)) throw new Error(`Port ${port} is already in use. Stop the other server or choose a different port in studio.config.json. No second server was started.`);
  if (!existsSync('node_modules/express/package.json') || !existsSync('node_modules/puppeteer-core/package.json') || !existsSync('node_modules/multer/package.json')) {
    console.log('First launch: installing dependencies with npm. This requires internet access.');
    if (process.platform === 'win32') execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm install'], {cwd:root, stdio:'inherit', windowsHide:true});
    else execFileSync('npm', ['install'], {cwd:root, stdio:'inherit'});
  }
  console.log('Preparing your templates…');
  execFileSync(process.execPath, ['generate.mjs'], {cwd:root, stdio:'inherit'});
  console.log('Keep this window open while using Brand Foundry. Press Ctrl+C to stop it.');
  const server = spawn(process.execPath, ['server.mjs'], {cwd:root, stdio:'inherit', windowsHide:true});
  let ended = false;
  server.on('error', error => { ended=true; console.error(error.message); process.exitCode=1; });
  server.on('exit', code => { ended=true; if(code) process.exitCode=code; });
  process.once('SIGINT', () => server.kill());
  process.once('SIGTERM', () => server.kill());
  for(let attempt=0; attempt<60 && !ended; attempt++) {
    if(await sameStudio(url)) { console.log(`Open your studio: ${url}\nBrand setup is available anytime in Brand Settings.`); openBrowser(url); return; }
    await delay(500);
  }
  if(!ended) { console.error('The studio did not become ready. Review the errors above and run npm run doctor.'); server.kill(); process.exitCode=1; }
}
main().catch(error => { console.error(`\nCould not start Brand Foundry: ${error.message}\nRead docs/START-HERE.md for setup help.`); process.exitCode=1; });
