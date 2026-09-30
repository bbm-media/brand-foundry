// Build step. Walks templates/<media>/<category>/<name>.html, stamps one project
// per output size into build/, and writes build/manifest.json.
//
// The manifest is the contract with the server: it parses HTML exactly once here,
// at build time, so the dashboard never pays that cost per request.
//
//   node generate.mjs
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, cpSync, renameSync,
} from "node:fs";
import { brandTemplate } from "./brand.mjs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(readFileSync(path.join(ROOT, "studio.config.json"), "utf8"));
const TPL_ROOT = path.join(ROOT, "templates");
const BUILD = path.join(ROOT, "build");
const STAGE = path.join(ROOT, `.build-stage-${randomUUID()}`);
const PREVIOUS = path.join(ROOT, `.build-previous-${randomUUID()}`);
function removeTemporaryBuild(directory) {
  const resolved = path.resolve(directory);
  if (path.dirname(resolved) !== ROOT || !/^\.build-(stage|previous)-[a-f0-9-]+$/.test(path.basename(resolved))) throw new Error('Refusing to remove a path outside this build workspace');
  rmSync(resolved, { recursive: true, force: true });
}

const dirs = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);
const htmls = (p) => (existsSync(p) ? readdirSync(p).filter((f) => f.endsWith(".html")) : []);
const title = (s) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Pull the declared variable manifest + composition metadata out of a template. */
function parseTemplate(html) {
  let variables = [];
  const v = html.match(/data-composition-variables\s*=\s*(["'])([\s\S]*?)\1/);
  if (v) {
    const decoded = v[2].replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    try { variables = JSON.parse(decoded); }
    catch (e) { throw new Error(`Invalid data-composition-variables: ${e.message}. Encode apostrophes as &#39; in single-quoted HTML attributes.`); }
    if (!Array.isArray(variables)) throw new Error('data-composition-variables must be a JSON array');
  } else if (html.includes('data-composition-variables')) throw new Error('Malformed data-composition-variables attribute');
  const dur = html.match(/data-duration="([\d.]+)"/);
  return { variables, duration: dur ? Number(dur[1]) : 0 };
}

/** Replace {{TOKENS}} for one size and tag <html> so CSS can target the ratio. */
function stamp(html, size) {
  let out = html
    .replaceAll("{{WIDTH}}", String(size.w))
    .replaceAll("{{HEIGHT}}", String(size.h))
    .replaceAll("{{LABEL}}", size.label);
  const unresolved = [...out.matchAll(/{{([A-Z][A-Z0-9_]*)}}/g)].map((m) => m[1]);
  if (unresolved.length) throw new Error(`unresolved token(s): ${[...new Set(unresolved)].join(", ")}`);
  return out.replace(/<html(\s|>)/, `<html data-size="${size.suffix}" data-ratio="${size.w}x${size.h}"$1`);
}

// Preserve uploads from versions that stored them only in generated projects.
const oldManifest = path.join(BUILD, 'manifest.json');
if (existsSync(oldManifest)) {
  for (const tpl of JSON.parse(readFileSync(oldManifest, 'utf8')).templates ?? []) {
    if (!/^[\w-]+\/[\w-]+\/[\w -]+$/.test(tpl.id)) continue;
    for (const size of tpl.sizes ?? []) {
      const source = path.resolve(ROOT, size.dir, 'assets');
      if (!source.startsWith(BUILD + path.sep) || !existsSync(source)) continue;
      for (const file of readdirSync(source)) {
        if (!/^[a-f0-9-]{36}\.(png|jpg|webp|gif|svg)$/.test(file)) continue;
        const dest = path.join(ROOT, 'uploads', tpl.id);
        mkdirSync(dest, { recursive: true });
        cpSync(path.join(source, file), path.join(dest, file), { force: false });
      }
    }
  }
}
mkdirSync(STAGE, { recursive: true });

try {

const manifest = [];
let count = 0;

for (const media of CONFIG.media) {
  const mediaDir = path.join(TPL_ROOT, media.dir);
  const sizes = CONFIG.sizes[media.kind];
  if (!sizes) throw new Error(`studio.config.json: no sizes defined for kind "${media.kind}"`);

  // Categories are subfolders. Files sitting directly in the media folder land in "general".
  const categories = [...dirs(mediaDir).map((c) => ({ id: c, dir: path.join(mediaDir, c) }))];
  if (htmls(mediaDir).length) categories.unshift({ id: "general", dir: mediaDir });

  for (const cat of categories) {
    for (const file of htmls(cat.dir)) {
      if (CONFIG.hideStarters && ['statics/posters/starter-poster.html', 'carousels/slides/starter-slide.html', 'video/overlays/starter-headline.html'].includes(`${media.dir}/${cat.id}/${file}`)) continue;
      const name = file.replace(/\.html$/, "");
      let src;
      try { src = brandTemplate(readFileSync(path.join(cat.dir, file), "utf8"), CONFIG.brand); }
      catch (e) { throw new Error(`${path.join(cat.dir, file)}: ${e.message}. Check the variable declaration and encode apostrophes as &#39;.`); }
      let metadata;
      try { metadata = parseTemplate(src); } catch (e) { throw new Error(`${path.join(cat.dir, file)}: ${e.message}`); }
      const { variables, duration } = metadata;
      // Content hash keys the thumbnail cache: edit a template, thumb regenerates.
      const hash = createHash("sha1").update(src).digest("hex").slice(0, 12);

      const built = sizes.map((size) => {
        const dir = path.posix.join("build", media.id, cat.id, `${name}-${size.suffix}`);
        const abs = path.join(STAGE, path.posix.relative('build', dir));
        mkdirSync(abs, { recursive: true });
        writeFileSync(path.join(abs, "index.html"), stamp(src, size));
        const assets = path.join(cat.dir, "assets");
        if (existsSync(assets)) cpSync(assets, path.join(abs, "assets"), { recursive: true });
        const shared = path.join(TPL_ROOT, "_shared");
        if (existsSync(shared)) cpSync(shared, path.join(abs, "assets"), { recursive: true, force: false });
        const uploads = path.join(ROOT, 'uploads', media.id, cat.id, name);
        if (existsSync(uploads)) cpSync(uploads, path.join(abs, 'assets'), { recursive: true });
        return { ...size, dir };
      });

      manifest.push({
        id: `${media.id}/${cat.id}/${name}`,
        media: media.id, mediaLabel: media.label, kind: media.kind,
        category: cat.id, categoryLabel: title(cat.id),
        name, label: title(name), hash, duration, variables, sizes: built,
      });
      count++;
    }
  }
}

writeFileSync(path.join(STAGE, "manifest.json"), JSON.stringify({
  brand: CONFIG.brand, media: CONFIG.media, render: CONFIG.render,
  builtAt: new Date().toISOString(), templates: manifest,
}, null, 2));

// Publish only a complete build. Restore the old directory if promotion fails.
if (existsSync(BUILD)) renameSync(BUILD, PREVIOUS);
try { renameSync(STAGE, BUILD); }
catch (e) {
  if (existsSync(PREVIOUS)) renameSync(PREVIOUS, BUILD);
  throw e;
}
if (existsSync(PREVIOUS)) {
  try { removeTemporaryBuild(PREVIOUS); }
  catch { console.warn(`Previous build cleanup deferred: ${PREVIOUS}`); }
}

console.log(`\n  Built ${count} template${count === 1 ? "" : "s"} → build/`);
for (const m of CONFIG.media) {
  const n = manifest.filter((t) => t.media === m.id).length;
  const cats = [...new Set(manifest.filter((t) => t.media === m.id).map((t) => t.categoryLabel))];
  console.log(`   ${m.label.padEnd(10)} ${String(n).padStart(3)} template(s)  ${cats.join(", ") || "none"}`);
}
if (!count) console.log("   (no templates yet. Add one under templates/<media>/<category>/)");
console.log("");
} finally {
  if (existsSync(STAGE)) removeTemporaryBuild(STAGE);
}
