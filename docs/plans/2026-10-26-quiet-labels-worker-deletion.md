# Quiet Labels + Worker Deletion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the remaining demo-disconnected copy from chat and wizard, and let users delete a worker from its Pengaturan tab behind an explicit confirmation.

**Architecture:** `deleteWorker` joins the contracts domain (removes worker + conversations + runs). The store wraps it with selection fallback. UI adds a danger zone in WorkerSettings with a native confirm dialog. Text edits only touch the connection strip and wizard copy.

**Tech Stack:** TypeScript, React 19, Zustand, Zod, Vitest.

---

### Task 1: Contracts — deleteWorker (TDD)

**Files:** Modify `packages/contracts/src/domain.test.ts`, `packages/contracts/src/index.ts`.

1. Write failing tests: `deleteWorker` removes the worker, all of its conversations, and all of its runs; throws “Worker tidak ditemukan.” for unknown ids; leaves other workers untouched.
2. Run `npm test -- packages/contracts/src/domain.test.ts`, observe failure, implement `deleteWorker`.
3. Re-run to green.

### Task 2: Store — removeWorker action

**Files:** Modify `apps/web/src/state.ts`.

1. `removeWorker(id)` wraps the contract, persists, and clears `selectedWorkerId`/`selectedConversationId`/`fullChat` when the selected worker is removed.

### Task 3: UI — danger zone in Pengaturan + text removal

**Files:** Modify `apps/web/src/ChatPanel.tsx`, `apps/web/src/WorkerWizard.tsx`, `apps/web/src office-ui` suite `apps/web/src/office-ui.test.ts`.

1. Failing office-ui tests first: App source no longer contains `Hermes belum terhubung` or `Demo lokal · bukan Hermes`; ChatPanel contains the danger zone (aria “Hapus worker” plus confirm dialog labelled “Hapus worker?” with a warning line).
2. Implement: remove the connection strip line; rewrite wizard runtime card to keep it honest (“Runtime demo lokal… belum ada alat, file, atau koneksi web yang diberikan”) without the disconnected phrasing; settings tab gains the danger zone with confirm dialog; deleting closes the chat.

### Task 4: Verification

1. Browser via una: connect status strip gone; settings danger zone deletes a worker after confirmation; dock/directory update; assistant messages still show the Demo badge.
2. `npm test`, `npm run test:legacy`, `npm run build`, `git diff --check`; commit only this change. Do not push unless asked.
