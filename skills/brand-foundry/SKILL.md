---
name: brand-foundry
description: Make branded images, carousels, stat cards, lower thirds, logo reveals and video overlays from reusable templates, rendered locally to PNG, MP4 or transparent MOV. Use whenever someone asks for a poster, carousel slide, social graphic, quote or stat card, thumbnail, title or logo animation, video overlay, or any branded asset that should be reusable rather than one-off. Also use to create a new template, add a category, rebrand the studio, or diagnose a template that is not appearing.
license: MIT
compatibility: Runs a local Brand Foundry server. Needs Node.js 22+, Chrome for PNG export, and FFmpeg for video. The agent needs a terminal and access to localhost.
metadata:
  author: Payton Kaleiwahea
  publisher: Business Based Media
  version: "1.0.0"
  homepage: https://github.com/bbm-media/brand-foundry
---

# Brand Foundry

Use an existing template when it fits. Create a new reusable template when the
design itself is new.

## Before anything else: find or set up the studio

This skill drives a local app. The studio is a checkout of
[bbm-media/brand-foundry](https://github.com/bbm-media/brand-foundry), identified
by `studio.config.json` and `generate.mjs` at its root.

1. **Find it.** If the person has not said where it is, look for that pair of
   files, then ask once and remember the answer for the session. Never create a
   second copy; there is one library and everything goes in it.
2. **If it is not installed,** ask before downloading anything, then:

   ```bash
   git clone https://github.com/bbm-media/brand-foundry.git
   cd brand-foundry
   npm install
   npm run doctor     # reports missing Chrome or FFmpeg, with install commands
   ```

3. **Start it if it is not running.** Probe the address in `studio.config.json`
   (default `http://127.0.0.1:4800`) with `GET /api/manifest`. If nothing
   answers, run `node launch.mjs --no-open` from the checkout in the background
   and use the URL it prints. Do not start a second server when one is already
   up, and do not assume a server on 4800 belongs to this checkout.

Paths below are relative to the checkout. Read `docs/TEMPLATE-GUIDE.md` before
writing your first template in a session: it is the authoring contract and it
changes per fork.

## Using existing templates

Read `docs/AGENT-WORKFLOW.md`. Connect to the running studio through its local HTTP API, inspect the manifest, pass field values to an export endpoint, and verify the returned local file. The connection requires local terminal and HTTP access; these instructions do not install an MCP or connect a cloud agent to localhost.

For Premiere or Resolve placement, use the separately connected editor tools and verify the timeline result. Do not create another template merely to populate an existing design. Keep render-input JSON with the editing project when it needs to be reused; export calls do not save browser drafts.

The authoring steps below apply only when a new or changed reusable design is needed.

## Creating a new template

A template, not a picture. The difference:

| Not this | This |
|---|---|
| One HTML file with the text baked in | A template with declared variables anyone can refill |
| Written to a temp folder or pasted in chat | Written to `templates/<media>/<category>/` |
| Described to the user | Built, verified in the manifest, and named back to them |

If you produce something the person cannot reopen and edit tomorrow from the
dashboard, you have not finished the task.

## Steps

**1. Decide media and category.**

Read `studio.config.json`. `media[]` gives the top-level types and their
folders, typically `statics`, `carousels`, and `video`. Pick the one that
matches the output. Then pick a category subfolder inside it. Reuse an existing
category when one fits. Creating a new folder adds a nav item automatically, so
make a new one when the asset genuinely starts a new group rather than forcing a
bad fit.

**2. Name it for reuse.**

Kebab-case, describing the form, not the campaign. `stat-counter.html` and
`quote-card.html` are right. `q4-webinar-promo.html` is wrong, because nobody
reuses it.

**3. Write the template.**

Follow the contract in `docs/TEMPLATE-GUIDE.md`. The essentials:

- Declare every editable field in `data-composition-variables` on `<html>`.
  That JSON alone drives the editor UI. Types are `string`, `color`, `enum`,
  `number`, `boolean` and `font`, and each can carry a `group` and `description`.
- Give the root `data-composition-id`, `data-width="{{WIDTH}}"`,
  `data-height="{{HEIGHT}}"`, and `data-duration` (0 for stills, seconds for
  motion). The exporter screenshots this element, so it defines the frame.
- Use `{{WIDTH}}`, `{{HEIGHT}}`, and `{{LABEL}}`. Never hardcode canvas pixels;
  one template is stamped once per configured size.
- Target a specific ratio with `html[data-size="<suffix>"]` in CSS, using the
  suffixes from `sizes` in the config.
- Inherit the studio brand: add `"brandKey"` (`accent`, `accentSoft`, `paper`,
  `ink`, `handle`) to color and text variables, and `data-brand-fonts` on `<html>`.
  Hardcoding brand values breaks the fork.

**4. Build it into the library.**

```bash
npm run build
```

This is not optional and it is the step most often skipped. Until it runs, the
template is invisible to the dashboard.

**5. Verify and report.**

Confirm the template's id appears in `build/manifest.json`. Then tell the person
the template name, the category it landed in, and that it is live at
`http://127.0.0.1:4800` (start it as described at the top if it is not up).

## Three traps

These are shipped bugs, not hypotheticals.

**Theme toggle silently dead.** Declared variables are written as inline styles
on `#root`, and inline styles beat class rules. So exposing `bgColor` or
`textColor` as variables on a themed template kills the `.dark` / `.light`
switch. Expose only `accentColor` and let the theme own the rest as custom
properties on `#root` and `#root.dark`.

**Runtime-parsed text getting clobbered.** The preview re-stamps every
`[data-var-text]` element after your inline script runs. If you split a variable
into child elements, they get overwritten with the raw string. Omit
`data-var-text` on those elements and read the value with
`window.__hyperframes?.getVariables?.() ?? window.__studio?.getVariables?.() ?? {}` instead.

**Invisible SVG.** `document.createElement("path")` makes an inert HTML element
that never paints. Use `document.createElementNS` with the SVG namespace. And
text inside a `clip-path` gets cropped, so keep the clipped shape and the text
in separate sibling elements.

## Useful patterns

- **Blank hides.** Remove an element when its variable is empty, so one template
  covers the with-caption and without-caption cases.
- **Auto-fit.** Measure the widest line against the container and scale the font
  down so long headlines never overflow.
- **One field, many lines.** Use a separator like `|` inside a single string
  variable so the person controls line breaks without extra fields.

## Rebranding

Everything brandable lives in `studio.config.json`: colors, fonts, output sizes,
nav taxonomy, and port. To rebrand, edit that file, then `npm run build`. Do not
hunt through templates for hardcoded values; if you find one, move it into the
config.

## Boundaries

Rendering is deterministic by design: HTML stamped into sizes, then screenshotted
or frame-rendered in headless Chrome. Same input, same output. Do not introduce
an image model into the render path.

Keep templates shipped with the repo generic. Client and personal creative
belongs in a private fork, not in the starter library.
