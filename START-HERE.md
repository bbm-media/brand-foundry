# Open your Brand Foundry

Read the [practical user guide](USER-GUIDE.md) for the full create, save, export and share workflow.

1. Extract the entire download into a folder. Keep your studio in that folder.
2. Install Node.js 22 or newer from https://nodejs.org if it is not installed.
3. On Windows, double-click **Start Brand Foundry.bat**. On macOS, open Terminal
   in the folder and run `sh "Start Brand Foundry.command"`. On Linux, run
   `node launch.mjs` from the folder.
4. The launcher installs npm dependencies on first use, builds your templates,
   starts the local server and opens your browser. Internet is needed for the
   first installation. Keep the launcher window open while working.
5. Open **Brand Settings** to choose your colors and search the bundled Google
   Fonts catalog. You can skip brand setup and return to it anytime.

## Coming back tomorrow

Open the same launcher again. A browser bookmark alone cannot start the studio.
If this copy is already running, the launcher reopens it instead of starting a
duplicate. If another app owns the port, it explains how to resolve the conflict.
Close the launcher or press Ctrl+C to stop a studio started by that window.

## Export requirements

Chrome is needed for PNGs. Video exports also need HyperFrames (installed by npm
when available), FFmpeg and FFprobe. The launcher does not install native Chrome
or FFmpeg. See [README.md](README.md#video-export-setup) for installation steps.
If export fails, run `npm run doctor` from this folder.

Font names are bundled so browsing the list needs no API key. Loading Google Fonts
for previews and exports needs internet access; unavailable fonts use fallbacks.
Use the Google Fonts link in Brand Settings to browse the current online library.

For an agent: "Open this Brand Foundry folder, read AGENTS.md, and run node
launch.mjs. Help me set my brand and create my first reusable template."
