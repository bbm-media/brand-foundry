import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolveChrome } from './chrome.mjs';
import puppeteer from 'puppeteer-core';

const command = (name) => process.platform === "win32" ? `${name}.exe` : name;
const checks = [];

function probe(name, args = ["-version"]) {
  try {
    const first = execFileSync(command(name), args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
      .trim().split(/\r?\n/)[0];
    checks.push({ name, ok: true, detail: first });
  } catch {
    checks.push({ name, ok: false, detail: "not found on PATH" });
  }
}

probe("node", ["--version"]);
if (Number(process.versions.node.split('.')[0]) < 22) {
  checks[0].ok = false;
  checks[0].detail += ' (Node 22 or newer required)';
}
probe("ffmpeg");
probe("ffprobe");
try {
  const browser = await puppeteer.launch({ executablePath: resolveChrome(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { checks.push({ name: 'Chrome', ok: true, detail: await browser.version() }); }
  finally { await browser.close(); }
} catch (e) { checks.push({ name: 'Chrome', ok: false, detail: e.message }); }

let hyperframes = false;
try {
  const pkg = JSON.parse(await readFile(new URL("./node_modules/hyperframes/package.json", import.meta.url), "utf8"));
  hyperframes = pkg.version;
} catch { /* optional dependency is absent */ }
checks.push({ name: "hyperframes", ok: Boolean(hyperframes), detail: hyperframes ? `v${hyperframes}` : "not installed" });

for (const check of checks) console.log(`${check.ok ? "✓" : "✗"} ${check.name}: ${check.detail}`);

const required = checks.filter((c) => ['node', 'Chrome'].includes(c.name) && !c.ok);
const video = checks.filter((c) => ["ffmpeg", "ffprobe", "hyperframes"].includes(c.name) && !c.ok);
if (video.length) {
  console.log("\nPNG and carousel export require the Node and Chrome checks to pass. Video export also needs every video dependency above.");
  console.log("See README.md → Video export setup.");
}
if (required.length) process.exitCode = 1;
