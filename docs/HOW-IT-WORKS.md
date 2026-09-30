# How Brand Foundry works

The technical detail behind the [README](../README.md): the render pipeline, why it stays
fast, how drafts and saves behave, and where everything lives.

## The render pipeline

There is no AI image model in the render path. It is deliberately boring and repeatable:

1. A template is an **HTML page** with blanks (`data-var-text`, `data-var-src`) and a
   declared list of variables.
2. `generate.mjs` stamps each template once per output size into `build/`, and writes
   `build/manifest.json`.
3. `server.mjs` serves the library and editor. When you export, it opens the page in
   **headless Chrome** and screenshots it (PNG) or renders it frame by frame (video).

Same input, same output, every time. Motion templates follow the
[HyperFrames](https://github.com/heygen-com/hyperframes) contract: one paused GSAP timeline,
seek-safe, so any frame can be rendered in any order. Remotion is not required; adding it
here would introduce a second rendering system without improving these templates.

## Why it stays fast

The first version was clunky: the library rendered a **live iframe per card**, so opening
it booted dozens of browsers inside a browser. The fixes now built in:

- **Cards show cached PNG thumbnails**, not iframes. Live rendering happens only in the editor.
- **Thumbnails are keyed by template content hash.** Edit one template and exactly one
  thumbnail regenerates. They are served `immutable`, so repeat visits are free.
- **The manifest is parsed once at build time** and held in memory, re-read only when its
  modified time changes. No HTML parsing per request.
- **One shared headless Chrome** handles screenshots, not one per render. It closes after
  60 idle seconds and relaunches on demand (`STUDIO_BROWSER_IDLE_MS` overrides this,
  minimum 1000). Repeated simultaneous requests for the same still share one capture.
- **Lazy loading:** thumbnails fetch as cards scroll into view. Startup thumbnail warming
  is off unless `STUDIO_WARM_THUMBS=1`.

Video exports use a separate renderer and can overlap screenshot work.

## Editor preview, drafts and saves

- The editor shows a cached still by default, at most 640 pixels on the longest edge.
  **Play live** runs the real HTML; switching tabs stops it.
- Changes are **drafts** until you click **Save and preview**. Typing never triggers a render.
- Downloads and live playback use **saved** values. Saved values persist in this browser's
  local storage; unsaved drafts stay per tab. Both are keyed by template, not output size.
- Saving does not modify the template's source HTML or create a portable project file.
- Motion PNG exports and thumbnails use the timeline's final pose; the live preview keeps playing.
- Cached previews live in `.cache/`. Clear them with `npm run clean`.

## Your brand

On first launch, choose **Set up my brand** or **Skip for now**. You can return anytime
through **Brand Settings** in the library or editor: name, handle, four colors, and heading
and body fonts, with a live preview before you save. Saving rebuilds brand-connected
templates and updates thumbnail cache keys. Existing drafts keep their overrides.

Font suggestions come from Google Fonts and need internet access. Enter a Google Fonts family
name, not a file path. Unknown or unavailable fonts fall back to browser defaults; custom
font uploads are not included. Background and text colors apply to the starters' light
theme; their dark theme is an explicit alternate palette.

The command-line setup and the agent interview write the same `studio.config.json`.
Rebuild after editing the config by hand.

## Uploads

Uploaded images live in the gitignored `uploads/` folder. Builds copy them into every output
size, and rebuilding or cleaning preserves them. Back up `uploads/` with your templates.

## Light and dark interface

The sun and moon switch sits top right in the library and editor. It follows your OS
preference until you pick a side, then remembers the choice. The theme is applied before
first paint, so there is no flash. This is the interface theme only, independent of a
template's own `theme` variable, so you can design a dark poster in a light interface.

## Search, workflows and recipes

The top navigation has Library, Workflows, Recipes and Connections. Search covers all four.
Recipes are saved prompt and settings combinations you can duplicate and import or export
as JSON. See [the directory guide](STUDIO-DIRECTORY.md). Workflow entries are agent-ready
guides; they do not install skills or connect paid providers.

## Repository layout

```
studio.config.json     your brand, nav taxonomy and output sizes
generate.mjs           build step: build/ + manifest.json
server.mjs             library, editor, preview, export, caching
launch.mjs             one-click launcher used by Start Brand Foundry
templates/
  _shared/             assets copied into every build
  <media>/<category>/  one folder per nav item, one .html per template
public/                library and editor UI
tests/                 regression suite
build/                 generated (gitignored)
.cache/                thumbnails (gitignored)
exports/               your finished files (gitignored)
uploads/               your uploaded images (gitignored)
```
