// Onboarding wizard.  npm run setup
//
// Two ways in:
//   npm run setup           interactive Q&A
//   npm run setup -- --paste  paste a JSON config an LLM wrote for you (see ONBOARDING.md)
//
// Writes studio.config.json, scaffolds your category folders, and seeds each one
// with a working template so you have something to look at immediately.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(ROOT, "studio.config.json");
const base = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
// Keep selectable media independent of the currently enabled navigation.
const builtins = [
  { id: 'carousels', label: 'Carousels', icon: 'layers', dir: 'carousels', kind: 'still', blurb: 'Multi-slide decks. Export every slide as a PNG.' },
  { id: 'statics', label: 'Statics', icon: 'image', dir: 'statics', kind: 'still', blurb: 'Single-frame posters and infographics. Export as PNG.' },
  { id: 'video', label: 'Video', icon: 'play', dir: 'video', kind: 'motion', blurb: 'Animated overlays. Export as MP4 or transparent MOV.' },
];
const mediaCatalog = [...new Map([...builtins, ...(base.mediaCatalog ?? []), ...base.media].map(m => [m.id, m])).values()];

const C = { dim: "\x1b[2m", b: "\x1b[1m", blue: "\x1b[38;5;69m", green: "\x1b[32m", r: "\x1b[0m" };
const say = (s = "") => console.log(s);
const hexOk = (s) => /^#[0-9a-fA-F]{6}$/.test(s);

/** Lighter sibling of the accent, used for gradients and secondary marks. */
function lighten(hex, amount = 0.38) {
  const n = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return "#" + ch.map((c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0")).join("");
}

// Line reader that also survives piped/redirected stdin: once the stream ends,
// further reads resolve empty so callers fall back to their defaults instead of
// hanging forever on an unsettled promise.
function lineReader() {
  const rl = readline.createInterface({ input, output, terminal: input.isTTY });
  const queued = [], waiting = [];
  let ended = false;
  rl.on("line", (l) => (waiting.length ? waiting.shift()(l) : queued.push(l)));
  rl.on("close", () => { ended = true; while (waiting.length) waiting.shift()(null); });
  return {
    read: () => new Promise((res) => {
      if (queued.length) return res(queued.shift());
      if (ended) return res(null);
      waiting.push(res);
    }),
    prompt(text) { output.write(text); return this.read(); },
    get ended() { return ended; },
    close: () => rl.close(),
  };
}

const PRESET_ACCENTS = [
  ["Electric blue", "#2453FF"], ["Emerald", "#10B981"], ["Violet", "#7C3AED"],
  ["Amber", "#F59E0B"], ["Crimson", "#E11D48"], ["Slate", "#334155"],
];

const STARTERS = {
  statics: "templates/statics/posters/starter-poster.html",
  carousels: "templates/carousels/slides/starter-slide.html",
  video: "templates/video/overlays/starter-headline.html",
};

// ---------- apply a finished config ----------
function apply(cfg, { seed = true, keepStarters = !cfg.hideStarters } = {}) {
  if (!Array.isArray(cfg.media)) throw new Error('media must be an array');
  cfg.media = cfg.media.map(m => ({ ...m, dir: m.dir || m.id, label: m.label || m.id }));
  for (const m of cfg.media) {
    if (m.categories != null && !Array.isArray(m.categories)) throw new Error('categories must be an array');
    if (![m.id, m.dir, ...(m.categories ?? [])].every(v => typeof v === 'string' && /^[a-zA-Z0-9_-]+$/.test(v))) throw new Error('Media IDs, directories and categories must be simple folder names');
    if (!cfg.sizes[m.kind]) throw new Error(`Unknown media kind: ${m.kind}`);
  }
  cfg.hideStarters = !keepStarters;
  cfg.brandSetup = 'complete';
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n");

  const made = [];
  for (const m of cfg.media) {
    const mediaDir = path.join(ROOT, "templates", m.dir);
    mkdirSync(mediaDir, { recursive: true });
    for (const cat of m.categories ?? []) {
      const dir = path.join(mediaDir, cat);
      mkdirSync(dir, { recursive: true });
      // Seed an empty category with the matching starter so it renders on day one.
      if (seed && !readdirSync(dir).length) {
        const src = path.join(ROOT, STARTERS[m.id] || STARTERS[m.kind === "motion" ? "video" : "statics"] || "");
        if (src && existsSync(src)) {
          copyFileSync(src, path.join(dir, path.basename(src).replace("starter-", "")));
          made.push(`templates/${m.dir}/${cat}/`);
        }
      }
    }
  }

  // `categories` is a setup-time convenience; the build reads folders, not config.
  const clean = { ...cfg, media: cfg.media.map(({ categories, ...m }) => m) };
  writeFileSync(CONFIG_PATH, JSON.stringify(clean, null, 2) + "\n");

  // Originals remain available for future category seeding. The build hides them.
  return made;
}

// ---------- paste mode ----------
async function pasteMode(rl) {
  say(`\n${C.b}Paste the JSON your LLM produced${C.r} (see ONBOARDING.md for the prompt).`);
  say(`${C.dim}Paste it, then type END on its own line.${C.r}\n`);
  const lines = [];
  for (;;) {
    const l = await rl.read();
    if (l === null || l.trim() === "END") break;
    lines.push(l);
  }
  let cfg;
  try {
    const raw = lines.join("\n").replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "");
    cfg = JSON.parse(raw);
  } catch (e) { say(`\n${C.b}That isn't valid JSON:${C.r} ${e.message}\n`); process.exit(1); }

  // Merge over the shipped config so a partial answer still works.
  const b = cfg.brand || {};
  const merged = {
    ...base, ...cfg,
    brand: {
      ...base.brand, ...b,
      accentSoft: b.accentSoft || (b.accent && hexOk(b.accent) ? lighten(b.accent) : base.brand.accentSoft),
      fonts: { ...base.brand.fonts, ...(b.fonts || {}) },
    },
    sizes: { ...base.sizes, ...(cfg.sizes || {}) },
    render: { ...base.render, ...(cfg.render || {}) },
    server: { ...base.server, ...(cfg.server || {}) },
    media: cfg.media || base.media,
  };
  if (!hexOk(merged.brand.accent)) { say(`\n${C.b}brand.accent must be a #RRGGBB hex.${C.r}\n`); process.exit(1); }
  const made = apply(merged);
  done(merged, made);
}

// ---------- interactive mode ----------
async function interactive(rl) {
  say(`\n${C.blue}${C.b}  Brand Foundry · setup${C.r}`);
  say(`${C.dim}  Press Enter to accept the [default]. Ctrl+C to bail.${C.r}\n`);

  const ask = async (q, def) => {
    const a = await rl.prompt(`  ${q} ${C.dim}[${def}]${C.r} `);
    if (a === null) { output.write("\n"); return def; }   // stdin ended → take the default
    return a.trim() || def;
  };

  const name = await ask("What's this studio called?", base.brand.name);
  const handle = await ask("Your handle or site (appears on templates)", base.brand.handle);

  say(`\n  ${C.b}Accent color${C.r} ${C.dim}(the one color that brands the UI + templates)${C.r}`);
  PRESET_ACCENTS.forEach(([n, h], i) => say(`   ${i + 1}. ${n} ${C.dim}${h}${C.r}`));
  let accent = await ask("Pick a number, or paste a #hex", base.brand.accent);
  const pick = PRESET_ACCENTS[Number(accent) - 1];
  if (pick) accent = pick[1];
  while (!hexOk(accent)) {
    if (rl.ended) { accent = PRESET_ACCENTS[0][1]; break; }
    accent = await ask("  Needs to be #RRGGBB", "#2453FF");
  }

  say(`\n  ${C.b}What do you make?${C.r} ${C.dim}(these become your top-level nav)${C.r}`);
  const wanted = [];
  for (const m of mediaCatalog) {
    const yes = (await ask(`Include ${m.label}? (y/n)`, base.media.some(enabled => enabled.id === m.id) ? 'y' : 'n')).toLowerCase().startsWith("y");
    if (!yes) continue;
    const mediaDir = path.join(ROOT, 'templates', m.dir);
    const existingCats = existsSync(mediaDir) ? readdirSync(mediaDir, { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name !== 'assets').map(entry => entry.name) : [];
    const defCats = existingCats.join(', ') || ({ statics: "posters, quotes, stats", carousels: "slides, covers", video: "overlays, titles" }[m.id] || "general");
    const cats = await ask(`  Categories for ${m.label} ${C.dim}(comma separated)${C.r}`, defCats);
    wanted.push({
      ...m,
      categories: cats.split(",").map((s) => s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-")).filter(Boolean),
    });
  }
  if (!wanted.length) { say(`\n  You need at least one. Re-run when ready.\n`); process.exit(1); }

  const keep = (await ask("\n  Keep the starter templates as examples? (y/n)", base.hideStarters ? 'n' : 'y')).toLowerCase().startsWith("y");

  const cfg = {
    ...base,
    brand: { ...base.brand, name, handle, accent, accentSoft: accent === base.brand.accent ? base.brand.accentSoft : lighten(accent) },
    mediaCatalog,
    media: wanted,
  };
  const made = apply(cfg, { seed: true, keepStarters: keep });
  done(cfg, made);
}

function done(cfg, made) {
  say(`\n${C.green}  ✓ studio.config.json written${C.r}`);
  if (made.length) {
    say(`${C.green}  ✓ seeded ${made.length} categor${made.length === 1 ? "y" : "ies"}:${C.r}`);
    made.forEach((m) => say(`      ${C.dim}${m}${C.r}`));
  }
  say(`\n  ${C.b}${cfg.brand.name}${C.r} ${C.dim}· ${cfg.brand.handle} · ${cfg.brand.accent}${C.r}`);
  say(`\n  Next:`);
  say(`    ${C.b}npm start${C.r}   ${C.dim}build + open the studio${C.r}`);
  say(`  Then rename the seeded templates and make them yours.`);
  say(`  ${C.dim}Authoring spec (also pasteable to an LLM): TEMPLATE-GUIDE.md${C.r}\n`);
}

const rl = lineReader();
try {
  if (process.argv.includes("--paste")) await pasteMode(rl);
  else await interactive(rl);
} finally { rl.close(); }
