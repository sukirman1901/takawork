# Floating Office Overlay Implementation Plan

> **Execution:** Follow this plan task-by-task; use test-driven-development and verification-before-completion before claiming completion.

**Goal:** Rearrange the existing Takawork chrome into a clean, image-inspired floating overlay while retaining the full-screen 3D office, 3D avatars, worker labels and existing behavior.

**Architecture:** Keep `App.tsx` as the single owner of camera, room, light, motion, activity, directory and wizard state. Reorganize its existing controls into a compact top location/action strip, a left camera rail and a right/bottom team affordance; style with existing monochrome tokens in `styles.css`. Leave the scene iframe, domain store and Hermes boundary unchanged.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Vite, una browser verification.

---

### Task 1: Capture a UI baseline and define layout regressions

**Files:** Modify `apps/web/src/office-ui.test.ts`; inspect `apps/web/src/App.tsx`, `apps/web/src/styles.css`.

1. Run `npm run dev` without touching a Hermes service. Use una to capture the existing home and chat states at desktop and phone widths. Record overlaps and visible control labels; the existing tests are mostly source assertions and do not substitute for visual checks.
2. Add failing assertions that the app renders a separately labelled camera rail and that CSS positions it above, not inside, the scene; retain assertions for the full-viewport office, existing views, labelled add action and unchanged scene behind chat. Example target assertion: `expect(app).toContain('aria-label="Sudut pandang kantor"');` and `expect(styles).toMatch(/\.camera-rail\s*\{[^}]*position:\s*absolute/);`.
3. Run `npm test -- apps/web/src/office-ui.test.ts` and confirm the new assertion fails before implementation.

### Task 2: Move existing controls without changing their actions

**Files:** Modify `apps/web/src/App.tsx:43-65`, `apps/web/src/styles.css:49-95`, `apps/web/src/styles.css:237-280`; test `apps/web/src/office-ui.test.ts`.

1. Extract camera buttons from the top bar into a left-side `<nav className="camera-rail paper" aria-label="Sudut pandang kantor">` within `.office-panel`; use existing `camera('overview'|'whiteboard'|'lounge')`, `aria-pressed`, reset action, and keyboard-focus styles. Keep camera menu and its Escape/focus behavior if used at narrower widths; never duplicate simultaneously visible controls with conflicting pressed states.
2. Keep `room-picker` and custom `Select` in a compact top-left location control and move other top actions into a quiet top-right group. Preserve every existing handler and the `Clock` only if it does not crowd mobile. Keep add-worker and directory reachable on desktop/tablet/phone.
3. Position the rail absolutely over the office, with reserved safe areas for header, activity, dock and chat. Preserve `.workspace`, `.workspace-body`, `.office-panel`, `.office-canvas` full-viewport positioning. Do not change `Office.tsx` or the legacy office sources.
4. Run `npm test -- apps/web/src/office-ui.test.ts` and `npm run build`, resolve any failures, then commit only relevant files.

### Task 3: Polish floating surfaces and collision states

**Files:** Modify `apps/web/src/styles.css:3-11,54-150,237-328` and possibly `apps/web/src/App.tsx:59-65`; test `apps/web/src/office-ui.test.ts`.

1. Add a regression assertion for a scoped phone layout rule so the camera controls cannot cover the room picker. Run the focused test red, then implement the narrow-screen placement. Keep the activity card compact by default and directory a real dialog rather than a permanent dashboard.
2. Apply existing `--line`, `--shadow`, radius and neutral surface tokens consistently to the room picker, rail, activity card, dock and chat. Prefer subtle opacity/shadow over bright accent colors. Do not change scene colors, character models, state schema, demo labels or custom select implementation.
3. Make 320 px and short-height layouts avoid rail/chat, rail/dock and room-picker/menu collisions; use existing media queries and preserve visible focus, minimum touch targets, reduced motion and camera zoom stability.
4. Run `npm test -- apps/web/src/office-ui.test.ts`, `npm test`, `npm run test:legacy` and `npm run build`; commit the scoped polish.

### Task 4: Browser verification and final corrections

**Files:** Only amend `apps/web/src/App.tsx`, `apps/web/src/styles.css` and focused tests for issues actually observed.

1. With the dev server running, use una (`open` → `snap` → action → fresh `snap` → `check`) to inspect viewport widths 320, 768, 1024 and 1440 px. Verify office/avatars remain visible behind floating UI and chat; check labels/activity, room switch, camera presets/reset, directory, chat, wizard, open custom selector, Esc, Tab and focus return. Check a short viewport and reduced-motion preference if available.
2. Fix actual failures with a failing regression where semantics can be asserted, then rerun the affected browser check. Do not assert success from source-string tests alone.
3. Rerun `npm test`, `npm run test:legacy`, `npm run build` and `git diff --check`. Report browser checks, any bundle warnings and cases not exercised. Do not connect or send messages to Hermes.

## Boundaries

The screenshot is a visual composition reference, not a specification for meeting, microphone, participants or event features. No scene or avatar replacement; no changes to localStorage keys, worker IDs, agent execution or credentials.
