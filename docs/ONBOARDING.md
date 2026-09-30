# Onboarding

**Start with [START-HERE.md](START-HERE.md).** On Windows, double-click
`Start Brand Foundry.bat`; on macOS/Linux, use the launcher instructions there.
It starts the server and opens the browser. Keep its window open while working.
Use Brand Settings for colors, searchable Google Fonts and font pairings.
The command-line workflows below are optional alternatives.

Two ways to set up your fork. Both end with a working, branded studio.

---

## Option A · the wizard (2 minutes)

```bash
npm install
npm run setup
```

It asks a handful of questions (name, handle, accent color, what you make, your categories),
then writes `studio.config.json`, creates your category folders, and drops a working template
into each so there's something on screen immediately.

```bash
npm start
```

---

## Option B · let an LLM do it

Better if you want it to *think* about your brand and category structure rather than you
guessing. Paste the prompt below into Claude, GPT, or Hermes. Answer its questions. It gives
you a JSON block. Then:

```bash
npm run setup -- --paste
```

Paste the JSON, type `END` on its own line, hit Enter.

### The prompt

> You are setting up my fork of **Brand Foundry**, a local tool that turns HTML templates into
> branded social assets (PNG images and video overlays).
>
> **Interview me first.** Ask me, a few at a time, about:
> - what my brand/business is and who it's for
> - my brand name and the handle that should appear on assets
> - my colors (get a specific accent hex; if I only describe it, propose one)
> - what content I actually post: carousels? single images? short video?
> - the recurring *kinds* of posts I make (these become categories)
>
> Push back if my categories overlap or are too vague. I want 2 to 5 categories per media type,
> named as **lowercase-hyphenated** slugs describing the *job* of the asset (e.g. `proof`,
> `hot-takes`, `case-studies`), not the visual style.
>
> When you have enough, output **only** a JSON block in exactly this shape:
>
> ```json
> {
>   "brand": {
>     "name": "My Studio",
>     "handle": "@myhandle",
>     "accent": "#2453FF",
>     "accentSoft": "#5C7CFF"
>   },
>   "media": [
>     { "id": "carousels", "label": "Carousels", "icon": "layers", "dir": "carousels",
>       "kind": "still", "blurb": "Multi-slide decks.",
>       "categories": ["slides", "covers"] },
>     { "id": "statics", "label": "Statics", "icon": "image", "dir": "statics",
>       "kind": "still", "blurb": "Single-frame posters.",
>       "categories": ["posters", "proof"] },
>     { "id": "video", "label": "Video", "icon": "play", "dir": "video",
>       "kind": "motion", "blurb": "Animated overlays.",
>       "categories": ["overlays"] }
>   ]
> }
> ```
>
> Rules:
> - `kind` is `"still"` (exports PNG) or `"motion"` (exports video). Only use `motion` if I said I make video.
> - `icon` is one of: `layers`, `image`, `play`.
> - `dir` must equal `id`.
> - Drop any media type I don't actually use.
> - `accent` must be a `#RRGGBB` hex with enough contrast to sit behind white text.
> - Output the JSON and nothing else, with no commentary after it.

### Then keep going

The same assistant can write your templates. Paste it **TEMPLATE-GUIDE.md** and ask for a
template for one of your categories. Save the result to
`templates/<media>/<category>/<name>.html`, run `npm run build`, refresh.

That loop, *describe an asset → get a template → it lives in your library forever*, is the
whole point of this thing.

---

## What setup actually changes

| File | What happens |
|---|---|
| `studio.config.json` | Rewritten with your brand + media types |
| `templates/<media>/<category>/` | Folders created for every category you named |
| `templates/.../<name>.html` | A working starter copied into each new category |

Nothing else is touched. Re-run `npm run setup` any time to change your mind; it only adds
folders, it never deletes your templates.

## Changing things later

- **Rebrand**: edit `brand` in `studio.config.json`, then `npm run build`.
- **New category**: just make the folder. It appears in the nav on the next build.
- **New output size**: add to `sizes.still` or `sizes.motion` in the config.

Choosing not to keep starter examples sets `hideStarters` in the config. Original files remain available for future category seeding; no templates are deleted.

## Browser setup

First launch offers a skippable brand setup. Skipping opens the template library and is remembered in the config. Use Brand Settings from the library or editor anytime to return. Saving applies primary/secondary, background/text, heading/body fonts and the handle to connected starter defaults. CLI setup completion also dismisses the first-run invitation. Browser setup does not change your media categories.
