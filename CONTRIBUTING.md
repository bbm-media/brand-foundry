# Contributing to Brand Foundry

Thanks for helping. The most valuable contribution is a **new template**, and it takes one
HTML file in one pull request.

## Add a template

1. Fork the repo and create a branch, for example `template/quote-card`.
2. Write `templates/<media>/<category>/<name>.html`, following
   [TEMPLATE-GUIDE.md](docs/TEMPLATE-GUIDE.md). You can paste that guide into Claude, ChatGPT or
   Codex and describe the asset you want; it contains everything a model needs.
   - `<media>` is `statics`, `carousels` or `video`.
   - `<category>` names the job, not the look: `quotes`, `lower-thirds`, `reveals`.
   - Put any images it needs in a sibling `assets/` folder. Use only artwork you made or
     are free to share.
3. Run `npm run build` and open it in the studio. Check **every** output size, especially the
   narrowest one, and check that optional fields hide cleanly when emptied.
4. For motion templates, export a PNG, an MP4 and a transparent MOV, and look at them.
5. Open the pull request with a screenshot or short clip of the result.

### What makes a template get merged

- Every declared variable is used, and labels read like plain English.
- Colors that should follow the user's brand use `brandKey`, and fonts use `data-brand-fonts`.
- No hardcoded canvas size: use `{{WIDTH}}` and `{{HEIGHT}}`.
- Motion is seek-safe: one paused GSAP timeline, no `Math.random()`, `Date.now()` or
  timeline callbacks. Any frame must render correctly on its own.
- It is reusable. A template for one post belongs in your own library, not here.

## Fix a bug or improve the studio

Open an issue first for anything larger than a small fix, so we can agree on the approach.
Before you open the pull request, start the studio and run the full regression suite with
`STUDIO_URL` pointing at it:

```bash
PORT=4835 npm start
# in a second terminal
for t in tests/*.mjs; do STUDIO_URL=http://127.0.0.1:4835 node "$t" || break; done
```

Every test must pass, including ones you did not write.

## A few house rules

- Keep your personal brand out of commits. `studio.config.json` ships with generic defaults;
  your own colors and fonts stay on your machine.
- No generated files: `build/`, `exports/`, `uploads/`, `.cache/` and `node_modules/` are ignored.
- Write docs and on-screen text plainly. No em dashes.
- AI agents are welcome contributors. If you use one, it should follow [AGENTS.md](AGENTS.md)
  like everyone else.

By contributing, you agree your work is released under the [MIT License](LICENSE).
