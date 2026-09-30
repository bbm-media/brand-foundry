# Directory QA - 2026-09-23

Implemented searchable Library/Workflows/Recipes/Connections navigation, curated agent handoffs, and private local recipe storage with JSON import/export and duplication. No provider integration or installed skill is implied.

Verified using an isolated Express fixture and headless Chrome:
- Search filters across catalog entries and saved recipe content.
- Recipe files written to disk and visible after reload.
- Duplicating preserves the original; import opens a review form; exported JSON contains the saved prompt.
- Cross-origin writes and common credential fields are rejected. This is not a complete secret scanner.
- Directory navigation issues no thumbnail, preview or export requests.
- Directory fits 375, 768 and 1400 pixel viewports.

Live server checks: workflow cards load without page errors; desktop/mobile screenshots inspected; existing video editor preview loads. Saved-edit and brand regression tests pass. Existing design-controls regression exercises size navigation, saved styles, uploads, numeric validation and 18 PNG exports.

Limits: no generation APIs, automatic skill installation, connection detection, recipe deletion/update UI. Connections remain manually configured. Third-party workflows are linked, not tested integrations. Private prompts/files are excluded from Git via user-data/. Later asset indexing and portable-package checks are documented separately.
