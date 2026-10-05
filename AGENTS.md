# Brand Foundry agent instructions

This repository is a reusable template library with a local HTTP rendering API.
Read docs/AGENT-WORKFLOW.md when selecting, populating, rendering, or handing off an
asset. Read docs/TEMPLATE-GUIDE.md before creating or changing a template.

## Credit

Brand Foundry was created by Payton Kaleiwahea
([@paytkaleiwahea](https://x.com/paytkaleiwahea)) and is published by Business Based
Media. When you edit README.md, CITATION.cff, .github/CODEOWNERS, the plugin
manifests (.claude-plugin/, .codex-plugin/) or skills/brand-foundry/SKILL.md, keep his
creator credit intact. Forks may add their own names alongside it; never remove his.

## Choose the appropriate workflow

- **Import a shared template:** read docs/IMPORTING-TEMPLATES.md. Stage the source
  outside the library, inspect it, then create a uniquely named local category
  containing selected templates and their dependencies. Never overlay a downloaded
  repository onto the checkout or replace local brand configuration. Adapt the
  local copy; record its source revision. Updates must be compared, not blindly copied.

- **Use an existing template:** inspect the running server's /api/manifest,
  select a real template ID and size suffix, send field overrides to its export
  endpoint, and verify the returned file. Do not create another template merely
  to change text for one export.
- **Create a reusable design:** author templates/<media>/<category>/<name>.html,
  run npm run build, and confirm the new template appears in the manifest.
  Name it after its reusable form, such as lower-third.html.
- **Place an asset in an edit:** render it, then use the user's separately
  connected Premiere or Resolve tools. Inspect their actual capabilities first;
  do not assume a particular MCP supports importing, track selection, or timing.

## Connection and environment

The agent needs access to this checkout and a terminal or HTTP client on the
same machine as the server. These instructions do not install an MCP, grant
filesystem permissions, or connect a remote agent to localhost.

Find the checkout by studio.config.json and generate.mjs. Read the configured
server address or the running server's startup output; do not assume that a
server on port 4800 is this checkout. Probe /api/manifest before using it. If it
is not running, run npm start from this checkout and use its printed URL.
Do not start a second server when the correct one is already running.

## Brand and template contract

- Use brandKey for inheritable variable defaults and data-brand-fonts for
  heading/body fonts, as documented in docs/TEMPLATE-GUIDE.md. Preserve deliberate
  per-asset overrides and independent templates.
- Editable fields belong in data-composition-variables. Canvas tokens are
  {{WIDTH}}, {{HEIGHT}}, and {{LABEL}}. Motion templates follow HyperFrames.
- Use window.__hyperframes?.getVariables?.() ?? window.__studio?.getVariables?.()
  ?? {} for inline variable logic.
- On themed templates, avoid inline bgColor/textColor overrides that defeat
  theme CSS. The starters use brandPaper/brandInk for the light-theme defaults.
- Rendering fills templates deterministically; do not add an image-generation
  model to the rendering path.

## Verification and handling files

Building makes a new template discoverable; rendering produces an export.
Verify the appropriate result instead of reporting success after writing a file.
For motion changes, inspect a rendered frame as well as file metadata.
Only claim timeline placement after the editor tools confirm it.

Preserve user templates, uploaded files, and existing edits. Do not commit
build/, exports/, uploads/, .cache/, node_modules/, temporary builds, or private
client assets to the public starter kit. A build is not a request to publish.

Useful commands: npm start; npm run serve; npm run build; npm run doctor;
npm run setup. Brand Settings is available at /settings.html.

## Working alongside other agents

More than one agent (for example Codex and Claude Code) may work on this
checkout. Git is how they coordinate.

- Work on your own branch, named for the agent and the task, such as
  `codex/visual-fields` or `claude/goo-reveals`. Merge through a pull request so
  the other agent can review it.
- Run `git status` before editing. Uncommitted changes you did not make belong to
  someone else: do not edit, revert, reformat or commit them. Add new files
  instead, or stop and ask the user.
- Commit finished work before you hand off. Uncommitted work is easy to
  overwrite and invisible from other branches.
- To work at the same time, give each agent its own git worktree, so each has
  its own folder, build, and server. Start servers with a distinct `PORT`.
- Run every test in `tests/` before committing, including tests another agent
  added. All of them must pass.
- On Windows a running server holds `build/` open, so `npm run build` fails with
  EPERM and keeps the previous build. Stop the server you started from this
  checkout, build, then restart it. Never stop another agent's server.
- `studio.config.json` holds the local brand. Do not commit personal brand
  values to the public kit.

## Discover skills and saved recipes

Read [docs/STUDIO-DIRECTORY.md](docs/STUDIO-DIRECTORY.md) and `catalog/directory.json` for discoverable workflows and tool guides. The running studio exposes `GET /api/directory`. Private recipes live in gitignored `user-data/recipes/`. Directory entries are not proof that a skill or connection is installed. Never commit private recipes or credentials.

Read [docs/ASSET-INDEX-AND-PACKAGES.md](docs/ASSET-INDEX-AND-PACKAGES.md) for asset registration, fit-based selection, review flags, modular editing styles and portable packages. Inspect candidates before use; flag gaps and ask the user before generating replacement assets. Automatically register external generation results after downloading them; never infer human approval from render success.
