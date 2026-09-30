# Template Guide

How to author a template for Brand Foundry. **You can paste this whole file to an LLM**
(Claude, GPT, Hermes) along with what you want, and it will produce a compliant template.

---

## Where it goes

```
templates/<media>/<category>/<name>.html
```

`<media>` must match a `media[].dir` in `studio.config.json` (`statics`, `carousels`, `video`).
`<category>` is any folder name, and it becomes a nav item automatically. Then `npm run build`.

---

## The contract

### 1. Declare your variables on `<html>`

```html
<html lang="en" data-composition-variables='[
  {"id":"headline","type":"string","label":"Headline","default":"Your headline"},
  {"id":"caption","type":"string","label":"Caption (blank hides)","default":"Supporting line"},
  {"id":"photoImage","type":"string","label":"Photo","default":"assets/placeholder.svg"},
  {"id":"theme","type":"enum","label":"Theme","default":"light","options":[
    {"value":"light","label":"Light"},{"value":"dark","label":"Dark"}]},
  {"id":"accentColor","type":"color","label":"Accent","default":"#2453FF"}
]'>
```

Types: `string`, `color`, `enum`. This JSON drives the entire editor UI.
Any variable whose `id` contains **image / img / photo / logo / shot** gets an upload button
and drag-and-drop for free.

For a reusable full-canvas background, use `backgroundImage` plus enum variables for
`backgroundFit`, `backgroundPosition`, and an optional readability treatment. Keep the
background as an `<img>` layer behind the content so user-uploaded photos and exported
gradient images use the same path. See the three starter templates for the complete pattern.

### 2. Size tokens

The build stamps these per output size. Use them, don't hardcode:

- `{{WIDTH}}` / `{{HEIGHT}}`: canvas pixels
- `{{LABEL}}`: human size label (e.g. "4:5 portrait")

Target a specific ratio in CSS with the stamped attribute:

```css
html[data-size="sq"] .headline { font-size: 76px; }   /* suffix from studio.config.json */
html[data-size="st"] .headline { font-size: 104px; }
```

### 3. Root element

```html
<div id="root" data-composition-id="my-template"
     data-width="{{WIDTH}}" data-height="{{HEIGHT}}" data-duration="0">
```

`data-duration` is `0` for stills, seconds for video. The exporter screenshots the
`[data-composition-id]` element, so it defines the frame.

### 4. Bind values

```html
<h1 data-var-text="headline">Your headline</h1>
<img data-var-src="photoImage" src="assets/placeholder.svg" alt="">
```

Color variables are also exposed as CSS custom properties: `var(--accentColor)`.

### 5. Read variables in script

```html
<script>
  const vars = window.__hyperframes?.getVariables?.() ?? window.__studio?.getVariables?.() ?? {};
</script>
```

---

## Patterns worth copying

**Blank-hides:** let a field disappear when emptied:

```js
if (String(vars.caption ?? "").trim() === "") document.getElementById("caption").remove();
```

**Auto-fit:** shrink text until the longest line fits:

```js
const avail = box.clientWidth, widest = Math.max(...lines.map(l => l.scrollWidth));
if (widest > avail) lines.forEach(l => l.style.fontSize =
  (parseFloat(getComputedStyle(lines[0]).fontSize) * (avail / widest)) + "px");
```

**Multi-line from one field:** use a separator so one input controls the line breaks:
`"LINE ONE|LINE TWO"` split on `|` into elements.

---

## Three traps that will cost you an hour each

These are real bugs that shipped before. Read them.

### ❌ Don't expose `bgColor`/`textColor` as variables on a themed template

The preview writes every **declared** variable as an **inline style** on `#root`.
Inline styles beat class rules, so your `.dark` / `.light` theme toggle silently does nothing.

```css
/* ✅ theme owns bg/text as plain custom properties */
#root      { --bgColor: #F6F7F9; --textColor: #16181D; }
#root.dark { --bgColor: #0D0E11; --textColor: #F2F3F5; }
```

Expose only `accentColor` as a color variable. Same rule for any property the theme controls.

### ❌ Don't put `data-var-text` on an element you parse at runtime

The preview re-stamps `[data-var-text]` elements **after** your inline script runs. If you
split a variable into child elements, the shim overwrites them with the raw string.

```html
<!-- ✅ no data-var-text; read the value via getVariables() instead -->
<div class="statement" id="statement">LINE ONE|LINE TWO</div>
```

### ❌ Don't build SVG with `createElement`

`document.createElement("path")` makes an inert HTML element that never paints. Use:

```js
document.createElementNS("http://www.w3.org/2000/svg", "path");
```

Also: text inside a `clip-path` shape gets **cropped**. Put the clipped shape in one element
and the text in an unclipped sibling on top.

---

## Motion templates (video)

Same contract, plus:

```js
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });          // must be paused
tl.from("#title", { y: 50, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.15);
window.__timelines["my-template"] = tl;               // key = data-composition-id
```

Rules, because frames render out of order:

- **Seek-safe only.** Animate transforms, `opacity`, `strokeDashoffset`. Never `Math.random()`,
  `Date.now()`, or `tl.call()` callbacks.
- **Never animate the same property of the same element from two tweens.** They fight.
  Use one tween, or a wrapper element.
- For transparent overlays, gate decoration on `var(--gridOpacity, 1)` so the exporter can
  drop it out.

---

## Checklist before you commit

- [ ] Every variable in the manifest is actually used
- [ ] `{{WIDTH}}` / `{{HEIGHT}}` used, no hardcoded canvas size
- [ ] Looks right at **every** configured size (check the narrowest one)
- [ ] Optional fields blank-hide cleanly
- [ ] Themed? bg/text are custom properties, **not** declared variables
- [ ] `npm run build` passes, thumbnail looks right on the dashboard

For JSON in a single-quoted HTML attribute, encode apostrophes as `&#39;` (for example `What&#39;s the headline`). Malformed declarations fail the build with the template path instead of silently removing editor fields.

## Inherit the studio brand

Opt a variable into a brand default with `"brandKey":"accent"`. Supported keys are `handle`, `accent` (primary), `accentSoft` (secondary), `paper` (background), and `ink` (text). Variables without brandKey keep their authored defaults. Add `data-brand-fonts` to the html element and use CSS variables `--serif` and `--sans` to inherit heading and body fonts. The build applies the brand before generating the manifest and hashes, so editor defaults, thumbnails and video renders agree. Individual editor values still override these defaults.

## Grouped and typed controls

Variables may specify `group` and `description`. Supported editor types now include `number` (`min`, `max`, `step`), `boolean`, and `font`, alongside string/color/enum. Font values are CSS font-family names, not downloadable font files. Set `multiline: true` for lists: these render as textareas and do not receive an image upload button even when their ID contains `image`.

Keep changes draft-only; Save and preview applies them. The editor validates numeric fields before saving. Templates should also bound values read from HTTP/agent overrides.

For opt-in configurable video length, declare a number variable `durationSeconds` with min 2 and max 120. Put `data-duration-var="durationSeconds"` on the root and clips whose `data-duration` must track it. Brand Foundry stamps these attributes before parsing/rendering, in a temporary composition next to the original (so relative asset paths work). Never rewrite the shared source during export. Build the seek-safe timeline using the same value. Set `root.dataset.posterTime` to a readable timestamp when the timeline includes an exit fade. See starter-headline.html.

Case-study galleries accept newline-separated relative image paths and resize the grid by count. The three bundled SVG examples are original project artwork. There is no dependency on Toolcraft or Diffusion Studio and no third-party source was copied for this implementation.

## Visual collections and preview image editing

For image collections use a string variable with `ui: "image-list"` and `maxItems` matching the template limit. For paired result labels and values use `ui: "metrics"`. The case-study starters use six images and three results. The editor shows thumbnails and structured rows, while the stored API values remain newline-separated image paths and `label|value` rows for compatibility. IDs `imageList` and `metrics` also select these controls for older templates.

To make a gallery image clickable in the still preview, set `data-studio-image="imageList"` and its zero-based `data-studio-index` on each rendered `<img>`. Single image bindings using `data-var-src` are also detected. The server captures normalized image bounds during the existing still render and caches them beside the PNG; it does not run another live preview. Clicks open the corresponding upload control. Unsaved collection changes disable stale image targets until Save and preview finishes.

Descriptions in variable metadata appear in keyboard-accessible information buttons. Use plain language, meaningful units and explicit limits when defining controls. Raw paths and separator syntax belong in the API contract, not in the normal user-facing form.
