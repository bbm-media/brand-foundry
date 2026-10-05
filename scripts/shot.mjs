// Dev helper: screenshot any studio URL. node scripts/shot.mjs <url> <out.png> [w] [h]
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const [url, out, w = 1440, h = 1100] = process.argv.slice(2);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const chrome = process.env.CHROME_PATH || execFileSync(npx, ["hyperframes", "browser", "path"],
  { encoding: "utf8", shell: process.platform === "win32" }).trim().split(/\r?\n/).filter(Boolean).pop();
if (!existsSync(chrome)) throw new Error("chrome not found: " + chrome);

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log("wrote", out);
