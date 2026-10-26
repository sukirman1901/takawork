# Quiet Empty Office Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the redundant disconnected demo sentence from the empty Activity preview and whiteboard while retaining truthful runtime labeling in chat and the whiteboard's demo prompt.

**Architecture:** Change the empty return value of `activityPreview` and remove the unconditional subtitle draw call in `drawBoard`. All run/job data, chat labels, and drawing of board rows remain unchanged.

**Tech Stack:** TypeScript, React, Vitest, HTML canvas.

---

### Task 1: Activity preview

**Files:** Modify `apps/web/src/activity-preview.test.ts`, `apps/web/src/activity-preview.ts`.

1. Change the empty-run test to expect `Belum ada aktivitas`; keep its existing populated-run assertion.
2. Run `npm test -- apps/web/src/activity-preview.test.ts`, observe the expected failure.
3. Replace the empty-run fallback string in `activityPreview`.
4. Run the same focused test and verify it passes.

### Task 2: Whiteboard subtitle

**Files:** Modify `apps/web/src/board.test.ts`, `apps/web/src/board.ts`.

1. Add a canvas-render test asserting that `drawBoard` does not draw `Demo lokal · Hermes belum terhubung` for either empty or populated jobs, and that the demo-specific empty prompt and job status remain.
2. Run `npm test -- apps/web/src/board.test.ts`, observe the expected failure.
3. Remove the subtitle draw call only. Leave the `boardLines` empty message and job rendering intact.
4. Run the focused test and verify it passes.

### Task 3: Verification

1. Check the live office via una, including the Activity preview, whiteboard and demo-marked chat.
2. Run `npm test`, `npm run test:legacy`, `npm run build`, `git diff --check`.
3. Commit only this change. Do not push unless asked.
