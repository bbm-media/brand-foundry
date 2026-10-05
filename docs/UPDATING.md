# Updating Brand Foundry

Brand Foundry does not currently include an automatic updater. Restarting an older installation does not download new application code. Your templates and saved media are separate from the version of the application displaying them.

Get the latest version from the [releases page](https://github.com/bbm-media/brand-foundry/releases). Each release lists what changed and includes a ZIP download.

## Before updating

Stop the Studio server and back up your existing folder, especially `studio.config.json`, `templates/`, `uploads/`, `exports/`, and `user-data/`. Keep any other custom source files and local credentials private. Browser editor drafts/styles live in browser storage and are not part of that folder backup; save important work and retain its input values before changing installations or server addresses.

## If you cloned with Git

Run `git status --short` first. If it reports changes, preserve them in a private local commit or backup and review conflicts before proceeding. Never reset or clean your checkout to force an update. Do not push personal configuration or media to the public repository.

With a clean checkout:

```sh
git fetch origin
git switch main
git pull --ff-only origin main
npm ci
npm run doctor
npm start
```

If switching or pulling fails, stop and reconcile your local changes with the update. The commands do not migrate or merge conflicting personal brand settings automatically. Reapply your saved brand settings carefully, retaining new configuration fields and sizes. Brand Foundry does not include an MCP server; agents keep using the local HTTP API.

## If you downloaded a ZIP

Extract the new version into a different folder and keep the old installation intact. Install its dependencies, then transfer `uploads/`, `exports/`, and `user-data/` with their relative paths preserved. Merge your custom templates and their dependencies into distinct categories using [the template import guide](IMPORTING-TEMPLATES.md). Review any modified shipped templates instead of replacing the new templates wholesale.

Use Brand Settings to reapply your branding, or carefully merge the brand section of your old configuration into the new configuration. Preserve custom categories and sizes you need. Do not copy `node_modules/`, `build/`, or `.cache/`; install dependencies and rebuild with `npm start` in the new folder. Run `npm run doctor`, verify a template, an uploaded background, a saved recipe and an export, then use the new installation. Keep the backup until those checks pass.

There is no one-click migration or rollback tool yet. Updating the application also does not update independently imported shared packages: review and import those separately.
