// Dev helper: screenshot a studio URL with a forced theme.
//   node scripts/shot-light.mjs <url> <out.png> [light|dark] [w] [h]
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const [url, out, theme = "light", w = 1440, h = 1050] = process.argv.slice(2);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const chrome = process.env.CHROME_PATH || execFileSync(npx, ["hyperframes", "browser", "path"],
  { encoding: "utf8", shell: process.platform === "win32" }).trim().split(/\r?\n/).filter(Boolean).pop();
if (!existsSync(chrome)) throw new Error("chrome not found: " + chrome);

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((t) => localStorage.setItem("studio-theme", t), theme);
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: out });
await browser.close();
console.log("wrote", out);
