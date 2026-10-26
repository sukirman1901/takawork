# Glass Overlay and Mobile Framing Implementation Plan

> **Execution:** Implement in this session with test-driven-development; verify with a browser before completion.

**Goal:** Make existing persistent office chrome quietly translucent and fully rounded where requested, while keeping controls and the 3D office legible at phone sizes.

**Architecture:** Scoped glass tokens and pill styles apply only to persistent chrome in `styles.css`; dialogs/chat/custom popovers stay opaque. A bounded perspective FOV adjustment in `kantor-sim.html` applies only on aspect changes and leaves orbit position/target untouched. The original 3D scene and avatars remain active; `legacy-office.ts` continues its checked adaptation.

**Tech Stack:** React, CSS, Three.js legacy room, Vitest, Node legacy tests, una and CDP viewport fallback.

---

### Task 1: Glass chrome and pill groups

**Files:** Modify `apps/web/src/styles.css:3-38,49-100,230-330`; test `apps/web/src/office-ui.test.ts`.

1. Add a failing test asserting scoped glass treatment on `.room-picker.paper`, `.clock.paper`, `.header-actions.paper`, `.camera-rail.paper`, `.worker-dock.paper`; require `border-radius: var(--radius-pill)` for the room, clock, actions and Tim dock. Assert chat/dialog/select-list remain opaque.
2. Run `npm test -- apps/web/src/office-ui.test.ts`, observe expected failure.
3. Add neutral translucency with a robust opaque fallback, restrained blur, border and shadow. Keep black primary action and readable text; avoid applying blur to the office itself or overlays containing long text.
4. Rerun focused tests, inspect on real browser, commit.

### Task 2: Mobile hierarchy and bottom control collisions

**Files:** Modify `apps/web/src/styles.css:54-95,240-335`; possibly `apps/web/src/App.tsx:42-70`; test `apps/web/src/office-ui.test.ts`.

1. Add a failing regression for compact phone dock/activity positioning without overlap; preserve activity's expandable state and Tim access.
2. Run focused test red. Update 320/390 widths: top room/actions stay full pills, camera rail stays horizontal with ≥44px touch targets, activity preview collapses into a discreet readable panel, and Tim pill anchors bottom. Respect safe area and short-height breakpoints. Do not hide character labels or chat affordances.
3. Run focused test green; inspect short-height chat, directory and selectors with una; commit.

### Task 3: Bounded mobile 3D framing

**Files:** Modify `kantor-sim.html:500-530,1711-1727,1791-1795`; test `tests/camera.test.cjs`.

1. Add a behavior test extracting a pure perspective-FOV calculation from the original scene. Assert desktop aspect preserves 42° vertical FOV; narrow aspect widens within a bounded maximum; invalid/aspect transitions do not move camera position or orbit target.
2. Run `npm run test:legacy`, observe expected failure.
3. Implement the minimal FOV helper and apply it during camera initialization and on resize, before `camera.updateProjectionMatrix()`. Do not call camera preset/reset from resize; do not alter the legacy adapter anchors, room meshes or avatar source.
4. Run legacy and browser checks for overview/reset/manual orbit, then commit.

### Task 4: Verify final state

**Files:** Touch only files implicated by observed failures.

1. Via una, confirm room selector, camera rail, Tim/directory, worker chat, wizard and keyboard focus. For unavailable viewport control, use CDP only to size/capture the same una-opened local tab; review 320/390/768/1024/1440 and a short phone viewport.
2. Run `npm test`, `npm run test:legacy`, `npm run build`, `git diff --check`; report remaining warnings and unverified states.

Do not connect Hermes, alter credentials, storage keys, worker identities or 3D asset content.
