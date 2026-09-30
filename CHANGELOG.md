# Changelog

Notable changes to Brand Foundry. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Add new entries under the newest
heading until it is released.

## [1.0.0] - Unreleased

First public release.

### Added

- **Library and editor** with Brand Settings: colors, heading and body fonts and
  handle, set once and applied to every template.
- **Editor controls:** compact panels, image collection fields with thumbnails,
  and preview images you can click to replace.
- **Still templates:** case study carousel and poster, starter slide and poster.
- **Motion templates:** speaker nameplate, stat spotlight, three-step process,
  starter headline, and the Goo Spawn title and logo reveals.
- **Export** to PNG, MP4 and transparent MOV through a local API that Claude Code
  and Codex can drive.
- **Agent skill:** `skills/brand-foundry/SKILL.md` follows the Agent Skills
  standard and installs with one command in Claude Code, Codex and other agent
  apps. It can set up and start the studio when it is not installed yet.
- **Windows reliability:** builds wait out the brief file locks Windows places on
  freshly written files, so relaunching the studio does not fail.
- **Tests** for the editor, brand, setup, build, file locks and export paths.
- **Contributor tooling:** issue forms, a pull request template and a
  contributing guide built around one-template pull requests.

[1.0.0]: https://github.com/bbm-media/brand-foundry/releases/tag/v1.0.0
