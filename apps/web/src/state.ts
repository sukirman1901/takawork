import { create } from 'zustand';
import { appendMessage, assignWorker, createConversation, createRoom as createRoomDomain, createWorker, dataSchema, deleteRoom as deleteRoomDomain, deleteWorker as deleteWorkerDomain, initialData, renameRoom as renameRoomDomain, recoverData, workerSchema, type WorkerInput, type WorkspaceData } from '../../../packages/contracts/src';
import { demoRuntime } from '../../../packages/runtime-hermes/src';

const KEY = 'nusaiba.prototype.v1';
let initialNotice = '';
let writable = true;
function load(): WorkspaceData {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return initialData();
    if (saved.length > 8_000_000) throw new Error('Data demo terlalu besar.');
    const data = dataSchema.parse(JSON.parse(saved));
    if (data.runs.some(r => r.status === 'running')) initialNotice = 'Balasan demo terputus saat halaman ditutup. Pesan tetap tersimpan; kirim ulang bila perlu.';
    return recoverData(data);
  } catch {
    writable = false;
    initialNotice = 'Data lokal tidak dapat dibaca. Contoh dimuat tanpa menimpa data lama; perubahan tidak disimpan sampai penyimpanan direset.';
    return initialData();
  }
}
function persist(data: WorkspaceData) {
  if (!writable) return;
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch { useWorkspace.setState({ notice: 'Penyimpanan browser penuh atau tidak tersedia. Perubahan hanya bertahan di tab ini.' }); }
}
const controllers = new Map<string, AbortController>();
interface WorkspaceState {
  data: WorkspaceData; selectedWorkerId: string | null; selectedConversationId: string | null;
  roomId: string; notice: string; fullChat: boolean;
  setRoom(id: string): void; selectWorker(id: string | null): void; selectConversation(id: string): void;
  newConversation(): void; addWorker(input: WorkerInput): string; updateWorker(id: string, input: Pick<WorkerInput, 'name' | 'role' | 'description'>): void;
  assign(id: string, roomId: string | null): void; addRoom(name: string): void; renameRoom(id: string, name: string): void; removeRoom(id: string, destination?: string): void;
  removeWorker(id: string): void;
  send(text: string): Promise<void>; cancel(runId: string): void;
  clearNotice(): void; setFull(value: boolean): void;
}
export const useWorkspace = create<WorkspaceState>((set, get) => ({
  data: load(), selectedWorkerId: null, selectedConversationId: null, roomId: 'engineering', notice: initialNotice, fullChat: false,
  setRoom: roomId => set({ roomId }), clearNotice: () => set({ notice: '' }), setFull: fullChat => set({ fullChat }),
  selectWorker(id) {
    if (id === null) { set({ selectedWorkerId: null, selectedConversationId: null, fullChat: false }); return; }
    let data = get().data;
    if (!data.workers.some(w => w.id === id)) return;
    let conversation = data.conversations.filter(c => c.workerId === id).at(-1);
    if (!conversation) { data = createConversation(data, id); conversation = data.conversations.at(-1)!; }
    set({ data, selectedWorkerId: id, selectedConversationId: conversation.id }); persist(data);
  },
  selectConversation(id) {
    if (get().data.conversations.some(c => c.id === id && c.workerId === get().selectedWorkerId)) set({ selectedConversationId: id });
  },
  newConversation() {
    const id = get().selectedWorkerId; if (!id) return;
    const data = createConversation(get().data, id);
    set({ data, selectedConversationId: data.conversations.at(-1)!.id }); persist(data);
  },
  addWorker(input) {
    const data = createWorker(get().data, input), id = data.workers.at(-1)!.id;
    set({ data }); persist(data); get().selectWorker(id); return id;
  },
  updateWorker(id, input) {
    const existing = get().data.workers.find(w => w.id === id); if (!existing) throw new Error('Worker tidak ditemukan.');
    const worker = workerSchema.parse({ ...existing, ...input });
    const data = { ...get().data, workers: get().data.workers.map(w => w.id === id ? worker : w) };
    set({ data }); persist(data);
  },
  assign(id, roomId) { const data = assignWorker(get().data, id, roomId); set({ data }); persist(data); },
  addRoom(name) { const data = createRoomDomain(get().data, name); set({ data }); persist(data); },
  renameRoom(id, name) { const data = renameRoomDomain(get().data, id, name); set({ data }); persist(data); },
  removeRoom(id, destination) {
    const data = deleteRoomDomain(get().data, id, destination);
    const fallback = data.rooms.some(r => r.id === get().roomId) ? get().roomId : data.rooms[0].id;
    set({ data, roomId: fallback }); persist(data);
  },
  removeWorker(id) {
    const data = deleteWorkerDomain(get().data, id);
    const cleared = get().selectedWorkerId === id;
    set({ data, ...(cleared ? { selectedWorkerId: null, selectedConversationId: null, fullChat: false } : {}) }); persist(data);
  },
  async send(text) {
    text = text.trim(); if (!text || text.length > 12000) return;
    const { selectedWorkerId: workerId, selectedConversationId: conversationId } = get();
    const worker = get().data.workers.find(w => w.id === workerId);
    if (!worker || !conversationId || get().data.runs.some(r => r.workerId === workerId && r.status === 'running')) return;
    const runId = crypto.randomUUID(), controller = new AbortController(), createdAt = new Date().toISOString();
    controllers.set(runId, controller);
    let data = appendMessage(get().data, conversationId, { id: crypto.randomUUID(), role: 'user', text, createdAt });
    data = { ...data, runs: [...data.runs, { id: runId, workerId: worker.id, conversationId, status: 'running', summary: 'Menyiapkan balasan demo', createdAt }] };
    set({ data }); persist(data);
    try {
      const reply = await demoRuntime.respond(worker, data.conversations.find(c => c.id === conversationId)!.messages, controller.signal);
      // Ignore stale or cancelled completions, even if a future adapter ignores AbortSignal.
      if (get().data.runs.find(r => r.id === runId)?.status !== 'running') return;
      let latest = appendMessage(get().data, conversationId, { id: crypto.randomUUID(), role: 'assistant', text: reply, createdAt: new Date().toISOString() });
      latest = { ...latest, runs: latest.runs.map(r => r.id === runId ? { ...r, status: 'completed', summary: 'Balasan demo selesai · tidak menjalankan alat' } : r) };
      set({ data: latest }); persist(latest);
    } catch (error) {
      if (get().data.runs.find(r => r.id === runId)?.status !== 'running') return;
      const cancelled = error instanceof DOMException && error.name === 'AbortError';
      const latest: WorkspaceData = { ...get().data, runs: get().data.runs.map(r => r.id === runId ? { ...r, status: cancelled ? 'cancelled' : 'failed', summary: cancelled ? 'Balasan demo dibatalkan' : 'Balasan demo gagal. Pesan tersimpan; silakan kirim ulang.' } : r) };
      set({ data: latest }); persist(latest);
    } finally { controllers.delete(runId); }
  },
  cancel(runId) {
    const data: WorkspaceData = { ...get().data, runs: get().data.runs.map(r => r.id === runId && r.status === 'running' ? { ...r, status: 'cancelled', summary: 'Balasan demo dibatalkan' } : r) };
    set({ data }); persist(data); controllers.get(runId)?.abort();
  },
}));
