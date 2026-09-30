<p align="center">
  <img src="docs/media/hero-goo-spawn.gif" alt="The words Brand Foundry melting out of two liquid blobs into crisp type, rendered by one of the included templates" width="760">
</p>

<h1 align="center">Brand Foundry</h1>

<p align="center">
  <b>Templates your AI agents fill.</b><br>
  Branded images, carousels and video, made on your machine and kept in your library.
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-2453FF"></a>
  <img alt="Node 22 or newer" src="https://img.shields.io/badge/node-22%2B-16181D">
  <img alt="Works with Claude Code and Codex" src="https://img.shields.io/badge/agents-Claude%20Code%20%C2%B7%20Codex-C4361F">
</p>

---

When you make something good with Claude, ChatGPT or Codex, it usually disappears into a chat
log. Brand Foundry turns it into a **template you own**. Describe an asset once, and you or
your agent can fill it forever: new words, new photos, every size, always on brand.

The animation above was rendered by Brand Foundry, from the included **Goo Spawn** template.

## What you get

- **Stills:** carousels and posters exported as PNG at 4:5, 1:1 and 9:16.
- **Motion:** overlays, lower thirds, stat hits and reveals exported as MP4, or as a
  **transparent MOV** that drops straight onto a Premiere or Resolve timeline.
- **Your brand, set once:** colors, fonts and handle apply to every template automatically.
- **Built for agents:** Claude Code and Codex can write new templates, fill existing ones and
  render them through a local API. Instructions for both ship in the repo.
- **Local and deterministic:** no design SaaS, no per-asset cost, no image model in the render
  path. Same input, same output, every time.

<p align="center">
  <img src="docs/media/library.png" alt="The Brand Foundry library: a sidebar of carousels, statics and video categories beside a grid of template thumbnails" width="880">
</p>

<p align="center">
  <img src="docs/media/editor.png" alt="The editor: a logo template preview on the left and a compact panel of content, brand, spawn and timing controls on the right" width="880">
</p>

## Quick start

**Download and double-click.** Grab the ZIP from the [latest release](https://github.com/bbm-media/brand-foundry/releases/latest),
extract it, and open **Start Brand Foundry.bat** (Windows) or run
`sh "Start Brand Foundry.command"` (macOS). The launcher installs what it needs on first run,
builds your templates and opens your browser. Keep its window open while you work.

**Or clone it:**

```bash
git clone https://github.com/bbm-media/brand-foundry.git
cd brand-foundry
npm start          # builds templates, then serves http://127.0.0.1:4800
```

You need **Node.js 22 or newer**. PNG export uses Chrome. Video export also uses FFmpeg and
FFprobe; see [video export setup](#video-export-setup). Run `npm run doctor` to check everything.

First launch offers a short brand setup. Skip it if you just want to explore the included
templates first; **Brand Settings** is always one click away.

## Included templates

| Media | Template | Exports |
|---|---|---|
| Carousels | Case Study · Starter Slide | PNG |
| Statics | Case Study · Starter Poster | PNG |
| Video · Overlays | Speaker Nameplate · Starter Headline | PNG, MP4, transparent MOV |
| Video · Data | Stat Spotlight | PNG, MP4, transparent MOV |
| Video · Explainers | Three Step Process | PNG, MP4, transparent MOV |
| Video · Reveals | Goo Spawn Title · Goo Spawn Logo | PNG, MP4, transparent MOV |

## Make your own template with AI

Paste **[TEMPLATE-GUIDE.md](TEMPLATE-GUIDE.md)** into Claude, ChatGPT or any capable model,
describe the asset you want, and save what it gives you as
`templates/<media>/<category>/<name>.html`. Run `npm run build` and it appears in your library.

Folders are the navigation: add a folder under `templates/video/` and it becomes a new
category in the sidebar, with no code change.

## Use it with agents

- **Claude Code** reads [CLAUDE.md](CLAUDE.md); **Codex** reads [AGENTS.md](AGENTS.md). Both
  point to the same shared instructions.
- To register it as a skill, copy [SKILL.md](SKILL.md) to `.claude/skills/brand-foundry/SKILL.md`
  (Claude Code) or `.agents/skills/brand-foundry/SKILL.md` (Codex).
- [AGENT-WORKFLOW.md](AGENT-WORKFLOW.md) shows the local API: pick a template, send field values,
  get back a PNG, MP4 or MOV, and hand it to Premiere or Resolve.

The connection is your running local server plus file access to this folder. No MCP server
is bundled, and a cloud agent cannot reach your `localhost` on its own. See
[CLOUD-ACCESS.md](CLOUD-ACCESS.md) for self-hosting.

This repository is itself built by Claude Code and Codex working side by side. The rules they
follow are in [AGENTS.md](AGENTS.md).

## Video export setup

`npm install` pulls in the HyperFrames renderer. FFmpeg and FFprobe are native programs you
install once:

```powershell
# Windows
winget install --id Gyan.FFmpeg -e
```

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt update && sudo apt install -y ffmpeg
```

Then restart the studio and run `npm run doctor`. If Chrome is not found, set `CHROME_PATH`.

## Commands

| Command | What it does |
|---|---|
| `npm start` | Build templates, then serve the studio |
| `npm run doctor` | Check Chrome, FFmpeg and the video renderer |
| `npm run setup` | Configure your brand and categories from the terminal |
| `npm run build` | Rebuild templates and the manifest |
| `npm run serve` | Serve without rebuilding |
| `npm run clean` | Clear generated builds and the thumbnail cache |

## Docs

| Read this | When you want to |
|---|---|
| [USER-GUIDE.md](USER-GUIDE.md) | Create, save, export and share, step by step |
| [START-HERE.md](START-HERE.md) | Install from a download, or fix setup problems |
| [ONBOARDING.md](ONBOARDING.md) | Set up your brand with a wizard, or let an AI interview you |
| [TEMPLATE-GUIDE.md](TEMPLATE-GUIDE.md) | Write templates, by hand or with AI |
| [IMPORTING-TEMPLATES.md](IMPORTING-TEMPLATES.md) | Bring in templates someone else shared |
| [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md) | Understand the render pipeline, caching, drafts and layout |
| [docs/UPDATING.md](docs/UPDATING.md) | Update without losing your library |
| [DEPLOY.md](DEPLOY.md) | Host it on your own server |

## Contributing

The easiest contribution is a template: one HTML file in one pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md). Bug reports and ideas are welcome in the issues.

## Made by BBM

Brand Foundry is the first open tool from **[Business Based Media](https://bbm.media)**:
open systems for making content, with research, media, post-production, copywriting and
thumbnail agents to follow. Built by [Payton Kaleiwahea](https://github.com/paytkaleiwahea).

**Rather not run it yourself?** BBM runs the whole media department for you, turning one
recorded session into a month of content. [bbm.media](https://bbm.media)

MIT licensed. Use it, fork it, sell what you make with it.
