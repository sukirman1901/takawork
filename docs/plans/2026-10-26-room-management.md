# Room Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users add, rename, and delete rooms from a “Kelola ruangan” dialog opened by a gear icon inside the room-picker pill. Rooms are name-only entries over the same 3D scene; data persists in `WorkspaceData.rooms`.

**Architecture:** Contracts own the domain rules (schema + create/rename/delete). The store wraps them with persistence and active-room fallback. The UI consumes `data.rooms` everywhere `rooms` was used and gains a native-dialog manager that never uses native selects.

**Tech Stack:** TypeScript, React 19, Zustand, Zod, Vitest, existing custom `Select`.

---

### Task 1: Contracts — rooms in WorkspaceData + room domain functions (TDD)

**Files:** Modify `packages/contracts/src/domain.test.ts`, `packages/contracts/src/index.ts`.

1. Write failing tests: `createRoom` adds a room with unique id (names deduped case-insensitively, rejects empty/too long names and >8 rooms); `renameRoom` changes only the name (rejects duplicates); `deleteRoom` rejects the last room, deletes empty rooms, rejects occupied rooms without destination, moves occupants when a destination is given (rejecting a full destination); `checkRoom` reads `data.rooms`; parsing legacy data without `rooms` yields the default three.
2. Run `npm test -- packages/contracts/src/domain.test.ts`, observe the failures.
3. Implement: `roomSchema` (`id`, `name` 1–24, `capacity` literal 6 default), `defaultRooms` export, `rooms` array field with `.max(8).default(defaultRooms)` in `dataSchema`, `initialData` includes rooms, `checkRoom` uses `data.rooms`, and the three domain functions (slugified unique ids like `room-lab`).
4. Run the focused test; verify it passes.

### Task 2: Store — addRoom/renameRoom/removeRoom + active-room fallback

**Files:** Modify `apps/web/src/state.ts`.

1. `addRoom(name)`, `renameRoom(id, name)`, `removeRoom(id, destination?)` wrap contracts, `set` + `persist`; `removeRoom` sets `roomId` to the first remaining room when the active room is deleted.
2. No new store tests beyond Task 1 semantics (store is a thin wrapper); TypeScript enforces wiring.

### Task 3: UI — data.rooms everywhere + gear + Kelola ruangan dialog

**Files:** Modify `apps/web/src/App.tsx`, `apps/web/src/ChatPanel.tsx`, `apps/web/src/WorkerWizard.tsx`; add `apps/web/src/RoomManager.tsx`.

1. Replace the imported `rooms` const with `data.rooms` in the room select, Directory location labels, and both assignment selects.
2. Add a `Settings2` gear `icon-button` in `.room-picker` (aria-label “Kelola ruangan”) that mounts `RoomManager`.
3. `RoomManager`: native `<dialog>`, aria-labelledby, Escape onCancel, inline rename inputs, delete flow (direct when empty + not last; occupied rooms reveal a destination `Select` + confirm), footer add form, honest error line from thrown errors.
4. Keep the custom `Select` (no native `<select>`) and the room-picker fallback `data.rooms.find(r=>r.id===roomId) ?? data.rooms[0]`.

### Task 4: Styles + regression tests

**Files:** Modify `apps/web/src/styles.css`, `apps/web/src/office-ui.test.ts`.

1. Failing tests first: App contains the “Kelola ruangan” gear and `RoomManager`; room-picker gear gets pill radius (`,.room-picker .icon-button` in the existing pill rule); `.room-dialog` styles exist (opaque panel, radius tokens, no glass on dialogs).
2. Run `npm test -- apps/web/src/office-ui.test.ts`, observe failures, then implement the styles.

### Task 5: Verification

1. Browser via una on http://127.0.0.1:5174/: open the dialog, add a room, rename it, place a worker there via ChatPanel, then delete it choosing a destination; confirm picker updates and scene stays stable.
2. Verify 320/390/768/1024/1440 layouts; `npm test`, `npm run test:legacy`, `npm run build`, `git diff --check`.
3. Commit implementation. Do not push unless asked.
