# Takawork

**Takaloka** is a visual workspace for AI workers: a full-screen living office, custom avatars, per-worker conversations, and a shared job board. This repository contains the frontend prototype and a proposed adapter boundary for [Nous Research's Hermes Agent](https://github.com/NousResearch/hermes-agent).

**Hermes is not connected yet.** Current responses and job activity are explicitly labelled local demos. No real AI work, tool permissions, authentication, or backend execution is implemented. The next goal is to make this UI a control surface for an existing Hermes installation, not to build a competing agent engine.

## Run locally

Node.js 22.22.0 was used during development.

```bash
npm ci
npm run dev
```

Open the localhost URL printed by Vite (normally `http://127.0.0.1:5173`).

```bash
npm test
npm run test:legacy
npm run build
```

Build output: `apps/web/dist/`. Serve **both** `index.html` and `office.html` and their assets over HTTP. Do not open the production app via `file://`.

## Project structure

| Path | Purpose |
| --- | --- |
| `apps/web/src/` | React UI, custom selectors, worker wizard, chat, local store and scene bridge |
| `apps/web/legacy-office.ts` | Checked build-time adaptation of the original office renderer |
| `apps/web/office.html` | Same-origin scene iframe entry point |
| `packages/contracts/src/` | Versioned schemas, worker/avatar presets and domain rules |
| `packages/avatar/src/` | Low-poly avatar builder and portraits |
| `packages/runtime-hermes/src/` | Proposed adapter interface and explicit demo runtime |
| `kantor-sim.html` / `character-model.js` | Required original scene/model sources; not obsolete files |
| `avatar-preview.*` / `tests/` | Original avatar previews and regression tests |
| `docs/HERMES_HANDOFF.md` | Product constraints, verified upstream integration surfaces and next work |

The original scene is bundled with a matching Three.js r128 alias (`three-office`); modern avatar previews use the current Three.js dependency separately. Custom menus use the browser Popover API for top-layer placement, with custom-rendered options. Modern browser and WebGL support are required. IBM Plex Sans is loaded from jsDelivr, with system font fallback.

## Current behavior

- Create/customize workers, assign them to one of three six-desk rooms, or leave them unplaced and accessible through the directory.
- Stable internal UUID and generated `NSA-xxx` display code. Renaming does not replace identity or history.
- Separate conversations per worker, abortable demo replies, run history and interrupted-run recovery.
- Whiteboard shows up to six demo jobs for the current room, active first. It does not expose private chat text or claim to run real tasks.
- Name **and short activity** remain visible over each character. Typing/walking/pantry gestures are visual ambiance, not evidence of AI work.
- Full-screen office with compact floating chrome; chat is an overlay, not a resized office layout.
- Neutral Takaloka-inspired palette, shared custom dropdowns and concentric menu radii. Preserve the established UI rather than replacing it with a dashboard.

## Local data / legacy identifiers

Data currently lives in browser localStorage under `nusaiba.prototype.v1` (the earlier internal project name). Existing package names, scene-module identifiers and `NSA` codes intentionally remain unchanged for compatibility. Do not rename persistence keys or clear stored data as part of cosmetic rebranding.

Local storage is neither a backup nor server persistence. Avoid sensitive data. Invalid saved data is preserved rather than overwritten; that session uses sample data without saving changes. There is no export/import UI yet.

## Verification and limits

Before this public handoff, the working project had 34 prototype tests and 40 legacy tests passing and a successful production typecheck/build. Re-run all three commands above in your environment. Build emits known large-bundle and dependency-comment warnings; these are not a claim of production readiness.

No live Hermes compatibility, model credentials, VPS changes, deployment, physical-device testing or comprehensive screen-reader audit is claimed. This repository deliberately excludes credentials, server access details, browser state, local conversation history, installed dependencies, build artifacts and workstation-specific notes.
