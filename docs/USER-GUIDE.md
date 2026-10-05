# Get the most out of Brand Foundry

Brand Foundry is your local workshop for reusable branded graphics and video
assets. Start with a template, change the content, save, inspect, and export.
Use an AI coding agent when you need a new design or want to automate a batch.

## 1. Start your studio

Follow [START-HERE.md](START-HERE.md) for the launcher on your operating system.
Keep the launcher running while using the studio. Use the same folder each time.
Chrome is required for image exports; video also requires HyperFrames, FFmpeg
and FFprobe. Run `npm run doctor` if something is missing.

You can use the interface without an AI agent. For agent-assisted setup, open
the extracted studio folder in a local coding agent and paste:

> Read AGENTS.md and START-HERE.md. Check the dependencies, run the launcher,
> and give me the studio URL. Preserve my templates and settings. Help me create
> my first asset using an existing template before making a new design.

A cloud chat does not automatically have access to your local files or server.

## 2. Set your brand once

Open **Brand Settings** and choose your name, handle, colors, and fonts. Setup
can be skipped and reopened later. Brand-connected templates inherit these
defaults; independent templates and explicit saved field values may retain their
own styling. Review existing saved assets after changing your brand.

Google Fonts need an internet connection to load. Check the exported result if
you work offline, because fallback fonts can change line breaks.

## 3. Create your first asset

1. Choose a template and an output size.
2. Fill in all your text, colors and optional background image. Typing does not
   rebuild the preview; it continues showing the last applied values.
3. Click **Save and preview** to apply the complete set of changes.
4. Inspect the still. Use **Play live preview** if you need to check motion.
5. Download the appropriate format and open the exported file to verify it.

Downloads and live playback use the saved values, not unapplied edits. If the
editor says **Unsaved changes**, save before exporting. Uploading an image
stores the file immediately, but applying it to the preview still requires Save.

Switching between sizes preserves field values. Check each crop and line break:
the same content does not necessarily fit every aspect ratio equally well.
Values are shared across sizes, so saving different copy in square also changes
the saved copy used for portrait. Use separate templates or agent-managed input
files if you need independent variants.

## 4. Choose the right output

| Output | Use it for | Check before using it |
|---|---|---|
| PNG | Carousel slides, posters and still graphics | Text, crop, background and dimensions |
| MP4 | A complete animated graphic with its background | Timing, text visibility and playback |
| Transparent MOV | An overlay to place above footage | Alpha transparency and contrast over your footage |

The starter carousel is a reusable single-slide template, not an automatic deck
writer or bulk slide exporter. Create and export slides one at a time, or ask an
agent to plan the sequence and export each slide with its own values. Keep a
numbered set of outputs such as `01-cover.png`, `02-problem.png`, `03-example.png`.

**The motion starter defaults to four seconds. That is not a maximum.** You can
ask your agent to adapt a template for a different length, such as an eight-second
callout or a fifteen-second explainer. Those are examples of requested durations,
not a guarantee that every design fits them without adjustment.

Duration is authored in the template, not currently a general editor control.
Simply requesting a longer export does not override an unchanged template. Ask
the agent to adjust the composition, scene and animation timing together, rebuild,
and verify the actual exported duration. Preserve the original template when you
want to keep both versions. The preview loops; the export has a finite duration.
The server's ten-minute timeout limits processing time, not finished video length.
Longer or more complex renders require more resources; a maximum supported video
length has not been established by testing.

### Best practice: include timing in your brief

Tell the agent how long you want the asset to be before it creates or adapts it.
Also describe how the time should be used:

- **Total length:** specify seconds, or a start/end time in your edit.
- **Entrance:** how quickly the graphic should become readable.
- **Hold:** how long the complete message stays visible; allow time to read it.
- **Exit or loop:** say whether it should animate out, hold until the end, or loop.
- **Placement:** explain whether it overlays speech or is a standalone sequence.

For example:

> Adapt this lower third to last eight seconds: animate in for half a second,
> hold fully readable for seven seconds, then animate out for half a second.
> Export a transparent MOV. Keep the original four-second version and verify
> the new file's duration, readability and ending.

When the right length is unclear, ask the agent to suggest timing based on the
copy and intended use. Review the whole exported clip, including its last frame;
stretching an entrance animation is usually different from extending the hold.

Transparent export clears the background in supported templates. Custom templates
must implement that behavior too; inspect the actual alpha before relying on it.

## 5. Work efficiently with an AI agent

For ordinary content changes, reuse an existing design. For a new visual format,
create a reusable template. Give the agent your message, intended placement,
output size, brand references and desired duration for motion.

**Populate an existing asset**

> Read AGENTS.md and AGENT-WORKFLOW.md. Find a suitable existing template for
> [purpose]. Use [copy], export at [size], and verify the file. Do not create a
> new template just to change the wording. For motion, I need [duration] seconds
> with [entrance / hold / exit timing]; check whether the source timing needs to
> change before exporting. Save the render input JSON alongside
> the output so I can reproduce it later.

**Create a reusable design**

> Read TEMPLATE-GUIDE.md. Create a new [quote card / lower third / statistic card]
> using my current brand. Make the content editable, preserve existing templates,
> and test the supported sizes. For motion, use [duration] seconds, with
> [entrance / readable hold / exit or loop behavior]. Verify the exported duration
> and inspect the animation and ending. Give me the template ID and file paths.

**Make a carousel**

> Plan a [number]-slide carousel for [audience] about [topic]. Give each slide one
> clear point. Use a consistent existing template and my brand. Export numbered
> PNGs at [size], preserve the input for every slide, and check for clipped text.

Agent API exports do not read your browser's saved fields. Supply the intended
values explicitly. See [AGENT-WORKFLOW.md](AGENT-WORKFLOW.md) for the actual API.

Premiere Pro and DaVinci Resolve require their own connected tools for automated
timeline placement. Brand Foundry creates the file; the editor integration imports
and places it if that integration supports those operations. Manual import works too.

## 6. Use backgrounds effectively

Upload a PNG, JPEG, WebP, GIF or SVG through an image field. Adjust fit, position
and readability wash where the template offers them, then save. Keep a quiet area
behind text and inspect every crop you plan to export.

External AI tools can create artwork for you to upload. A useful starting brief:

> Create a background for [subject], in [palette/style], at [aspect ratio]. Place
> the main subject on [side] and leave clean negative space on [side] for editable
> text. No lettering, labels or logos. Keep details away from the text area.

Inspect generated artwork before use; prompting for no text is not a guarantee.
Built-in paid image-generation providers and API-key settings are planned, not
available in this release. Keep final headlines and brand text editable in the
template when possible.

## 7. Keep it lightweight while editing or on a call

The default preview is a cached still, at most 640 pixels on its longest side.
Live playback is optional and stops when the tab is hidden. Full exports retain
their configured quality; a soft-looking preview does not imply a low-quality export.

Finish your edits before saving. Leave live playback stopped when you are not
checking motion, and run heavy video exports between calls when practical.
Screenshot jobs run one at a time, but video exports can still overlap them.
The hidden screenshot browser closes after 60 idle seconds; its next launch may
make the first uncached preview slower. Existing cached previews can be reused.

A local server sitting idle is different from an active render. Hosting remotely
can move exports off the computer, but interactive HTML playback still uses the
viewer's browser. See [CLOUD-ACCESS.md](CLOUD-ACCESS.md) for current limitations.

## 8. Understand what is saved

| Item | Storage | What to know |
|---|---|---|
| Template source and packaged assets | `templates/` | Back this up |
| Brand configuration | `studio.config.json` | Back this up |
| Uploaded files | `uploads/` | Back this up; not included in a normal Git push |
| Finished files | `exports/` | Copy deliverables into your editing project |
| Generated builds and preview cache | `build/`, `.cache/` | Regenerable; cache grows as you create variants |

**Save and preview saves field values in this browser's local storage.** It does
not modify the template HTML or create a named project file. Unsaved drafts are
kept in the tab's session storage. Browser storage is tied to the origin, including
the port: changing browser, port or computer can make saved values unavailable.
Clearing browser data can remove them. Do not treat browser storage as your only
backup. An agent can preserve explicit render-input JSON in your project.

Avoid running unrelated studio folders at the same browser address: their matching
template IDs can share saved browser values. Portable saved-project files are planned.

To reclaim generated cache space, stop the studio, run `npm run clean`, then
restart. This removes `build/` and `.cache/`, not your source templates, uploads
or exports. The next build and uncached previews take work again. Export files
are not automatically cleaned up.

## 9. Share a template others can actually use

1. Package the HTML and its required files under a category's `assets/` folder.
   A temporary upload path on your machine is not a portable dependency.
2. Use relative asset paths and editable fields. Leave private client content and
   API keys out of the package.
3. Include source, authorship and license information. Confirm you can redistribute
   any included fonts, stock assets and artwork.
4. Test a copy outside your working library before publishing it to GitHub.
5. Have the recipient follow [IMPORTING-TEMPLATES.md](IMPORTING-TEMPLATES.md),
   creating a separate local copy and adapting that copy to their brand.

Publishing is a separate action from creating or exporting. The studio does not
automatically push your files. Recipients need no generation API key to reuse a
packaged image; they need their own provider access to generate something new.

## When something goes wrong

| Symptom | First action |
|---|---|
| Preview ignores newly typed text | Click Save and preview and check the error area |
| Browser link will not open | Start the launcher; use its printed address |
| PNG or video export fails | Run `npm run doctor` and capture the error |
| Imported template has missing images | Check packaged relative paths and required files |
| Editing or calls stutter | Stop live playback and exports; compare with a cached still |

For a useful bug report, include the OS, repository commit or download date,
template ID, size, steps, expected result and actual error. Do not include keys
or private client assets.

**First useful result:** brand one starter, save it, export a PNG and place it in
an actual post or editing project. Expand the library after that workflow works.

## Design controls and reusable backgrounds

The editor groups fields into Content, Brand, Background, Layout, and Timing when a template provides them. Number fields enforce their stated bounds; checkboxes control optional sections. Font selectors offer system fonts or the inherited brand font. Installing a font or configuring its URL remains necessary when using a custom font.

On any single background-image field, open **Create a reusable background**, choose Gradient, Halo, or Grid and two colors, then click **Create background**. This writes a local SVG through the normal upload system. Click **Save and preview** to apply it. No AI subscription, external generation request, or continuous animation is involved. Upload your own generated artwork the same way. Include the referenced file when sharing a template; local uploads are not automatically published to GitHub.

The new **Case Studies / Case Study** templates appear under both Carousels and Statics. Supply one headline, story, metric list (`label|value`, one per line), and up to six image paths. Choose Overview, Results, or Gallery to create related slides using the same brief. Export each layout separately; this is not an automatic deck exporter. The bundled artwork is original SVG and the sample metrics are fictional. Replace them with verified results before publishing.

The **Starter Headline** now exposes total duration (2-120 seconds), entrance and exit timing. Its four-second default is not a video-engine limit. Entrance and exit are each capped at 45% of the total so there is always a readable hold. Zero exit keeps the final frame visible. Still exports capture the readable pose before the exit. Other templates retain their authored timing unless they opt into timing controls; longer durations can still be authored in their source.

**Save visual style** stores the current template's colors and font selections in this browser. **Apply saved style** restores matching fields to the draft, including brand-key colors across compatible templates. Click Save and preview afterward. This preset does not overwrite studio.config.json or travel with a GitHub download.
