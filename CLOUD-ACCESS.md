# Cloud access and self-hosting

Brand Foundry currently runs locally. Claude Code or Codex can use it when their
execution environment can reach the server and, for template authoring, the files.
A cloud chat's `localhost` refers to its own environment, not your computer.

Cloud access is planned for a future phase, with no release date set. There is no
managed cloud service or bundled remote MCP server in this release.

## Can I host my copy now?

Yes, as an advanced self-hosting project. A VPS can run the existing Node server
and HTTP endpoints. A Hostinger VPS is one option because it provides root access
for Chrome, FFmpeg and other system dependencies. Node hosting alone is not enough
to establish that a plan supports this rendering stack. See Hostinger's
[VPS capabilities](https://www.hostinger.com/support/8852150-what-is-a-self-managed-vps-at-hostinger/).
This repository has not been deployment-tested on Hostinger.

## Five steps to remote access

1. **Install the studio on a VPS.** Clone your fork, install Node.js 22+, Chrome,
   FFmpeg/FFprobe and the npm dependencies, including HyperFrames for video.
   Run `npm run doctor`, build, and test PNG and video exports on the server.
   [DEPLOY.md](DEPLOY.md) contains the Linux service and proxy examples.
2. **Protect the service before exposing it.** Keep the app bound to loopback
   behind an HTTPS reverse proxy. Require authentication for the dashboard,
   API, uploads and downloads. Use credentials your agent's tooling supports.
   Brand Settings currently compares browser origins to the backend's HTTP
   protocol; TLS termination can cause a 403. Proxy-aware origin handling must
   be implemented and tested with a narrowly trusted proxy before calling the
   browser setup complete. Do not remove the origin check to bypass this.
3. **Connect the agent to the existing API.** Give an authorized HTTP-capable
   agent the HTTPS base URL and authentication through its credential mechanism.
   It can read the manifest, fill template variables and request renders.
   A cloud chat needs a supported tool integration or remote MCP bridge that
   exposes these operations; simply sharing the URL does not install one.
   Alternatively, run your coding agent on the VPS. Creating new templates still
   requires authorized filesystem access or a deployment workflow; there is no
   template-creation HTTP endpoint.
4. **Keep the files and rendering service reliable.** Persist and back up
   templates, brand configuration and uploads. Keep exports until downloaded.
   Grant the service write access for configuration saves and staged builds.
   Align proxy timeouts with synchronous renders, monitor disk/memory and test
   your actual workload. Video rendering currently accepts one render at a time;
   a durable queue and multi-user isolation are not included.
5. **Download the result to the editing machine.** Resolve the returned relative
   export URL against the hosted base URL and download it with authentication.
   Then use the local Premiere Pro or DaVinci Resolve MCP integration to import
   that local file and place it on the timeline, where supported. A file path on
   the VPS is not a file path on your editor's computer. Fully remote-to-desktop
   operation requires an additional authorized local bridge.

## Endpoints already included

| Operation | Endpoint |
|---|---|
| Discover templates, sizes and variables | `GET /api/manifest` |
| Render a still | `POST /api/export/png` |
| Render video, including transparent MOV | `POST /api/export/video` |
| Upload a template image | `POST /api/upload/<template-id>` |
| Download a rendered file | `GET /exports/<filename>` |

See [AGENT-WORKFLOW.md](AGENT-WORKFLOW.md) for request bodies. Its local filesystem
example assumes the agent shares the checkout; for a remote deployment, download
the returned URL instead. Render requests complete synchronously, with no job
status endpoint. Protect download routes as well as render routes.

## Before describing your deployment as ready

Verify authenticated access and denial of unauthenticated requests; brand setup,
save and preview through HTTPS; PNG and video rendering with uploaded images;
file persistence after restart/rebuild; and download/import on the editing machine.
The deployment examples are a starting point, not a certification of hosted support.
