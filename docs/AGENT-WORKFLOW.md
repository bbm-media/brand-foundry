# Connect an agent to Brand Foundry

For templates from another GitHub repository, follow
[IMPORTING-TEMPLATES.md](IMPORTING-TEMPLATES.md). Import a separate local copy,
adapt it to this studio's brand, then use the discovery and rendering steps below.

## What connects to what

Claude Code or Codex uses its terminal and filesystem tools to access the local
checkout, and an HTTP client to call Brand Foundry. The studio's server is the
connection; AGENTS.md and SKILL.md explain how to use it. No dedicated Asset
Studio MCP server is included or required for this workflow.

The agent and studio must be on the same host, or have an explicitly configured
connection. Localhost in a cloud agent, container or WSL environment may refer to
a different machine/network namespace. Do not expose the unauthenticated studio
to the public internet to work around this. Use the local agent workspace.

## 1. Locate and start the studio

Open the Brand Foundry checkout as the agent's working directory, or provide its
absolute path and permission to read/write it. Read studio.config.json. Check
the existing server first; if absent, run:

```sh
npm start
```

Keep that process running. Use the printed URL; 4800 is only the default port.
For an agent working on another editing project, give it the checkout path and
server URL, and point it to this guide. It can run commands from the checkout
without moving the editing project into the library.

## 2. Discover templates and fields

`GET /api/manifest` returns templates with id, variables, sizes, kind and duration.
Pick an existing template and inspect its declared variable IDs and defaults.
Use a suffix from that template's sizes array. Do not invent field IDs, formats,
or template paths. The current starter IDs include:

- statics/posters/starter-poster
- carousels/slides/starter-slide
- video/overlays/starter-headline

## 3. Populate and render

Use `POST /api/export/png` or `POST /api/export/video` with JSON:

```json
{
  "id": "video/overlays/starter-headline",
  "suffix": "wide",
  "variables": {
    "line1": "Your headline",
    "line2": "Your supporting point",
    "caption": "Your call to action"
  },
  "transparent": true
}
```

For the video endpoint, transparent=true produces MOV; otherwise it produces
MP4. PNG supports an optional scale field. Omitted variables use the built brand
defaults. These calls create exports; they do not save a browser editor draft or
rewrite the source template. Keep the input JSON with the editing project if
the populated version needs to be reproducible later.

Use Node's built-in fetch from an agent terminal; no additional HTTP package is
needed. This JavaScript example can be saved as an .mjs file in the editing
project. Set STUDIO_URL and STUDIO_ROOT to the actual server and checkout:

```js
import path from 'node:path';
import { access } from 'node:fs/promises';

const base = process.env.STUDIO_URL;
const root = process.env.STUDIO_ROOT;
if (!base || !root) throw new Error('Set STUDIO_URL and STUDIO_ROOT first');
const inventory = await fetch(new URL('/api/manifest', base));
if (!inventory.ok) throw new Error(await inventory.text());
const manifest = await inventory.json();
const template = manifest.templates.find(t => t.id === 'video/overlays/starter-headline');
if (!template?.sizes.some(s => s.suffix === 'wide')) throw new Error('Required template/size is not available');
const response = await fetch(new URL('/api/export/video', base), {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    id: template.id, suffix: 'wide', transparent: true,
    variables: { line1: 'Your headline', line2: 'Supporting point', caption: '' }
  })
});
const result = await response.json();
if (!response.ok) throw new Error(result.error || 'Export failed');
if (!/^\/exports\/[^/\\]+$/.test(result.url)) throw new Error('Unexpected export path');
const localFile = path.join(root, 'exports', path.basename(result.url));
await access(localFile);
console.log(JSON.stringify({ localFile, url: new URL(result.url, base).href }));
```

The request stays open until rendering finishes. There is no job/status endpoint
and only one video render runs at a time; HTTP 429 means another render is active.
Do not blindly retry an uncertain request because it may create another export.
Use npm run doctor if dependencies prevent rendering.

To populate an image field, first POST multipart form-data with field `file` to
`/api/upload/<template-id>`. Pass the returned relative path into the template's
declared image variable. Uploads are reused across output sizes and rebuilds.

## 4. Hand the exported file to the editor

Give the verified absolute file path to the connected Premiere/Resolve tools.
The agent should know the target sequence/timeline, start time, duration and
track from the user's request or the editing project's context. Inspect the
available editor tools, perform supported import/placement operations, and
verify the resulting timeline. Transparent MOV is appropriate for overlays;
MP4 is appropriate when the rendered background should remain visible.

Brand Foundry does not implement editor timeline operations. If the editor MCP
lacks an operation, report that limitation and provide the rendered file rather
than claiming placement. Confirm the file is accessible to the editor's host.

## 5. Add a new reusable design when necessary

If no existing template fits, read TEMPLATE-GUIDE.md, write a new template under
templates/<media>/<category>/, and run npm run build. Confirm the new ID in the
manifest, then use the same render flow. There is no HTTP template-creation
endpoint; creating and modifying templates uses the agent's filesystem access.
