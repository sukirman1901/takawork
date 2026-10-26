# Room management design

Let the user add, rename, and delete rooms (Engineering, Operasional, Riset are defaults) instead of a fixed three-room list.

- **Scope:** rooms differ by name only. All rooms reuse the same 3D office scene; no scene changes in `kantor-sim.html`.
- **Entry point:** a small gear icon (`Settings2`) attached inside the room-picker pill (top-left), aria-label “Kelola ruangan”. It opens a “Kelola ruangan” dialog built like the existing Directory dialog (native `<dialog>`, opaque panel, Escape/Tab handling).
- **Dialog contents:**
  - List rows: room name, occupancy `x/6`, rename action (inline input + save/Escape), delete action.
  - Delete rules: only when the dialog allows it — empty rooms delete directly; occupied rooms require choosing a destination room via the shared custom `Select` before workers are moved. The last remaining room cannot be deleted.
  - Add form at the footer: name input + “Tambah” button; max 8 rooms.
- **Persistence:** `rooms` moves into `dataSchema` (`WorkspaceData.rooms`, zod `.default(defaultRooms)`), so the existing `nusaiba.prototype.v1` key keeps parsing old saves unchanged and custom rooms persist with the same workers/ conversations.
- **Renaming** changes only `name`; ids and worker `roomId` references stay stable. Default three rooms remain available.
- **Capacity** stays 6 per room (matches the scene sync `max(6)` guard).
- **Active-room fallback:** deleting the currently viewed room moves `roomId` to the first remaining room; no crash on `rooms.find(...)!`.
