# Brand Foundry direction

## This release: reusable templates

The library contains editable template designs. First-run brand setup can be
skipped, and Brand Settings remains available from the library and editor.
Users choose their name, handle, primary and secondary colors, background and
text colors, and heading and body fonts. Brand-connected templates inherit these
defaults; per-asset edits remain overrides.

## Future phase: cloud access

Make the studio accessible to remote agents through authenticated hosted access,
with documented deployment, reliable rendering and downloadable outputs.
Cloud access is planned, with no release date set. It is not included in this release.
The intended work includes proxy-aware settings, an agent connection guide,
deployment QA, and a clear handoff to local editing applications.

Advanced users can already adapt the HTTP server for a private VPS deployment.
See [CLOUD-ACCESS.md](CLOUD-ACCESS.md) for prerequisites and remaining gaps.
Hosting the studio does not itself connect Premiere Pro or DaVinci Resolve on
someone's desktop, and does not automatically install a cloud-agent connector.

## Future: a reusable media library

Photos, videos, GIFs, logos and graphics could become a separate collection that
templates and agents draw from. This collection would support original and
AI-generated media, with descriptive names, tags, usage notes and previews.
The aim is to help an agent find the correct reusable file and place it into a
template, using a clear file structure and machine-readable metadata.

This is a future direction, not a feature in this release. There is no new media
catalog, ingestion pipeline, GIF browser or video asset manager. Existing image
uploads for template backgrounds continue to work.

## Proposed v1.1: useful creation and sharing

- Optional generated backgrounds with server-side local API keys and saved local outputs.
- Portable template packages with required assets, source information and collision-safe imports.
- Saved-project export/import so browser storage is not the only saved copy.

## Proposed v1.2: larger libraries and remote rendering

- Incremental builds and less asset duplication across output sizes.
- Cache/export usage display and selective cleanup.
- Coordinated video and screenshot workloads, cancellation and priority handling.
- Optional authenticated remote rendering after deployment QA.

These are proposed priorities, not shipped features or promised release dates.
