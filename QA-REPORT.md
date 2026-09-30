# Brand Foundry regression QA

## Pre-push QA of Brand Settings

Found and fixed a failed-save recovery bug: a malformed template previously left
build/ unavailable even after the brand config was restored. Generation now
stages a complete build before replacing the working directory, restores the old
directory if promotion fails, and cleans temporary build directories.

Verified malformed-template brand save returns an error while preserving the
exact prior manifest and brand; the library API still returns HTTP 200. Added
`node tests/build-regression.mjs` for failed build preservation and recovery.
Re-tested first-run Skip, dismissal after reload, reopening Brand Settings,
full brand save, saved values after reload, and invalid-color rejection.
Verified uploaded backgrounds survive a brand-save rebuild in every output size.

## Brand setup QA

- Browser-tested the first-run invitation, Skip for now, permanent Brand Settings
  link, live colors/font preview, save, reload persistence, and return to the
  branded library. Skipping does not remove access to settings.
- Fixed preview scaling found during visual QA; the complete starter now fits
  inside the preview panel using CSS container sizing.
- Verified name, handle, primary/secondary colors, background/text colors, and
  heading/body fonts. Invalid color input is rejected without changing config.
- Manifest defaults match the saved brand across all three starters. Inspected
  a branded PNG and an extracted MP4 frame with Montserrat/Roboto, cream
  background, dark text, brick primary, and green secondary accents.
- Brand and repeat-setup regression scripts pass. HyperFrames check passes with
  no runtime, layout or motion issues; the existing missing stage ID warning
  remains. No media repository feature was added; ROADMAP.md records the direction.

Run `node tests/brand-regression.mjs` and `node tests/setup-regression.mjs` from
the repository root. This section supersedes the earlier browser-access limitation
for the brand workflow only.

## Follow-up fixes after independent review

- Motion PNGs and thumbnails now pause and seek the timeline to its final pose.
  Three consecutive wide motion PNG exports were byte-identical (SHA-256
  `d005bd42ddac469b0f794c5da25f03f26701b4b962159387db98aa7972b917d8`).
  Inspected the exported image: Line 2 and Caption are both fully revealed.
  Normal editor previews still loop. The thumbnail cache version was changed
  so old mid-animation thumbnails are not reused.
- Setup now defaults to current brand values, preserves an unchanged custom
  accentSoft value and the current starter visibility, and uses existing category
  folders as defaults. Extended setup regression passes.
- The selectable media catalog is separate from enabled media. Excluding Video
  and then re-enabling it in a later wizard run passes the regression test.
- The independent review supplied by the user reports passing interactive size
  switching, reload persistence, and still preview/export parity. Those results
  are reviewer-reported, not a new browser run by this agent.

Repeat screenshot QA against a running standard studio with
`node tests/motion-png-regression.mjs`. Set STUDIO_URL for another local port.
Keep the shipped video starter enabled for this test. It creates three PNGs in
exports/. Templates with an exit animation intentionally capture their final
pose as authored, which may be empty.

Tested 2026-09-11 on Windows, Node 24.14.0, HyperFrames 0.8.34,
FFmpeg/FFprobe 8.1 and Headless Chrome 152.0.7977.30.

## Passed

- PNG, MP4 and transparent MOV exports from a repository directory containing
  spaces, using a template filename that also contains a space. The export
  regression sequence, including rebuild and upload checks, took 45.069 seconds.
- Inspected extracted video frames at two seconds: filled Line 2 and Caption
  appear; blank Line 2 and Caption disappear; the uploaded purple background
  appears in MP4. Transparent MOV excludes the background and grid.
- Decoded MOV alpha values span 0 to 255, with 2,025,056 fully transparent pixels
  out of 2,073,600 pixels at the inspected frame.
- Uploaded image survives rebuilding and exists at every output size. A legacy
  upload stored only in build/ migrates into uploads/ and survives rebuilding.
- PNG export with the server bound to HOST=0.0.0.0 uses loopback successfully.
- Encoded apostrophe in a variable label parses correctly. An unescaped
  apostrophe fails the build with the template path and encoding guidance.
- Setup with no starter examples preserves originals and hides them in the
  build. Running setup again seeds a new category. Paste mode defaults dir to id;
  invalid directory input fails without changing the config.
- Doctor launches Chrome, reports all installed dependencies, and exits with
  failure for a missing explicit CHROME_PATH.
- HyperFrames check of the wide motion starter: no runtime, layout, motion or
  contrast failures. One existing warning: the stage has no editable element ID.

## Reviewed in source

Dashboard cards use their first output size's aspect ratio. Category count says
"in this view". README and CLAUDE command tables include doctor; README includes
setup and instructions for discovering/registering the root skill. Starter and
authoring documents use the HyperFrames variable API with a studio fallback.
MIT LICENSE added. Uploaded images remain gitignored and need separate backups.

## Not verified

Interactive browser QA was blocked by automatic approval review reporting an
account usage limit. Size-switch draft persistence was reviewed in existing code,
but was not interactively re-tested in this round. Docker itself and IPv6 binding
were not tested; the wildcard IPv4 binding was tested locally.

Malformed templates fail loudly while preserving the last successful build.
Fix the reported template and rebuild to publish the new changes.

## Repeat setup check

Run `node tests/setup-regression.mjs` from the repository root. This creates an
isolated fixture in the operating system temporary directory and does not change
your studio configuration or templates.
