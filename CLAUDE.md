# Brand Foundry

Read and follow [AGENTS.md](AGENTS.md) for the shared repository instructions.

For using existing templates through the local API, including populated exports
and the editor handoff, read [AGENT-WORKFLOW.md](AGENT-WORKFLOW.md).
For creating reusable templates, read [TEMPLATE-GUIDE.md](TEMPLATE-GUIDE.md).

These files provide instructions. The actual connection is filesystem access
plus HTTP access to the locally running studio, not a bundled MCP server.

## Discover skills and saved recipes

Read [docs/STUDIO-DIRECTORY.md](docs/STUDIO-DIRECTORY.md) and `catalog/directory.json` for discoverable workflows and tool guides. The running studio exposes `GET /api/directory`. Private recipes live in gitignored `user-data/recipes/`. Directory entries are not proof that a skill or connection is installed. Never commit private recipes or credentials.

Read [docs/ASSET-INDEX-AND-PACKAGES.md](docs/ASSET-INDEX-AND-PACKAGES.md) for asset registration, fit-based selection, review flags, modular editing styles and portable packages. Inspect candidates before use; flag gaps and ask the user before generating replacement assets. Automatically register external generation results after downloading them; never infer human approval from render success.
