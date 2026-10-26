# Quiet labels + worker deletion design

Two approved changes:

1. **Remove every residual “Demo lokal · Hermes belum terhubung” copy.** The chat connection strip and the WorkerWizard phrases (“Hermes belum terhubung”, “Demo lokal · bukan Hermes”) go away. Honesty stays via the per-message “Demo” badge, the Tasks tab note (“Aktivitas balasan lokal, bukan eksekusi Hermes”), and the settings helper (“Hermes belum dikonfigurasi…”). Wizard keeps its demo-runtime card but describes it without the disconnected phrasing.
2. **Delete a worker from its Pengaturan tab.** A danger-zone button “Hapus worker” opens a native confirm dialog explaining permanent removal of the worker, conversations, tasks, and board history. Domain function `deleteWorker` removes the worker plus its conversations/runs, refuses unknown ids, and the store additionally clears the selection when the active worker is deleted.
