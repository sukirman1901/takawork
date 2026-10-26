import { z } from 'zod';

export const avatarSchema = z.object({
  version: z.literal(1), presentation: z.enum(['f', 'm']),
  head: z.enum(['angular', 'soft']).default('angular'),
  hair: z.enum(['short', 'long', 'ponytail', 'hijab']),
  skin: z.enum(['#d8a47f', '#b98360', '#8f5f3e']),
  hairColor: z.enum(['#292e28', '#634634', '#87847c']),
  outfit: z.enum(['shirt', 'blazer', 'tunic']),
  color: z.enum(['#376653', '#c8553d', '#d8a64b', '#5d7fa3', '#9c4f6e']),
  glasses: z.boolean(), eyes: z.enum(['dot', 'slim']), brows: z.enum(['straight', 'soft']),
}).refine(a => a.presentation !== 'f' || a.hair !== 'short', { message: 'Pilih rambut panjang, kuncir, atau kerudung untuk preset wanita.', path: ['hair'] });
export type AvatarConfig = z.infer<typeof avatarSchema>;
export const capabilities = ['documents', 'research', 'code'] as const;
export const capabilityNames: Record<typeof capabilities[number], string> = { documents: 'Dokumen', research: 'Riset', code: 'Coding' };
export const workerSchema = z.object({
  id: z.string(), code: z.string(), name: z.string().trim().min(1).max(40),
  role: z.string().trim().min(1).max(60), description: z.string().trim().min(1).max(1000),
  avatar: avatarSchema, capabilities: z.array(z.enum(capabilities)),
  roomId: z.string().nullable(), connection: z.literal('demo'),
});
export type Worker = z.infer<typeof workerSchema>;
export const messageSchema = z.object({ id: z.string(), role: z.enum(['user', 'assistant']), text: z.string().min(1).max(12000), createdAt: z.string() });
export type Message = z.infer<typeof messageSchema>;
export const conversationSchema = z.object({ id: z.string(), workerId: z.string(), title: z.string(), messages: z.array(messageSchema) });
export type Conversation = z.infer<typeof conversationSchema>;
export const runSchema = z.object({
  id: z.string(), workerId: z.string(), conversationId: z.string(),
  status: z.enum(['running', 'completed', 'cancelled', 'failed']), summary: z.string(), createdAt: z.string(),
});
export type Run = z.infer<typeof runSchema>;
export const roomSchema = z.object({
  id: z.string().min(1), name: z.string().trim().min(1).max(24), capacity: z.literal(6).default(6),
});
export type Room = z.infer<typeof roomSchema>;
export const defaultRooms: Room[] = [
  { id: 'engineering', name: 'Engineering', capacity: 6 },
  { id: 'operations', name: 'Operasional', capacity: 6 },
  { id: 'research', name: 'Riset', capacity: 6 },
];
export const dataSchema = z.object({
  version: z.literal(1), rooms: z.array(roomSchema).min(1).max(8).default(defaultRooms),
  workers: z.array(workerSchema), conversations: z.array(conversationSchema), runs: z.array(runSchema),
});
export type WorkspaceData = z.infer<typeof dataSchema>;
const base: AvatarConfig = { version: 1, presentation: 'm', head: 'angular', hair: 'short', skin: '#b98360', hairColor: '#292e28', outfit: 'shirt', color: '#376653', glasses: true, eyes: 'dot', brows: 'straight' };
export const presets: { id: string; name: string; config: AvatarConfig }[] = [
  { id: 'budi', name: 'Budi', config: { ...base } },
  { id: 'sari', name: 'Sari', config: { ...base, presentation: 'f', hair: 'long', glasses: false, outfit: 'shirt', color: '#d8a64b' } },
  { id: 'rina', name: 'Rina', config: { ...base, presentation: 'f', hair: 'hijab', glasses: false, outfit: 'tunic', color: '#c8553d', skin: '#d8a47f' } },
  { id: 'dewi', name: 'Dewi', config: { ...base, presentation: 'f', hair: 'hijab', glasses: false, outfit: 'blazer', color: '#9c4f6e' } },
  { id: 'maya', name: 'Maya', config: { ...base, presentation: 'f', hair: 'ponytail', glasses: false, color: '#5d7fa3' } },
  { id: 'joko', name: 'Joko', config: { ...base, glasses: false, skin: '#8f5f3e', color: '#5d7fa3' } },
];
export function initialData(): WorkspaceData {
  return { version: 1, rooms: defaultRooms, conversations: [], runs: [], workers: [
    { id: 'demo-budi', code: 'NSA-001', name: 'Budi', role: 'Engineering', description: 'Membantu meninjau kode dan merencanakan implementasi.', avatar: { ...presets[0].config }, capabilities: ['code'], roomId: 'engineering', connection: 'demo' },
    { id: 'demo-sari', code: 'NSA-002', name: 'Sari', role: 'Design', description: 'Membantu menyusun desain, alur produk, dan dokumentasi.', avatar: { ...presets[1].config }, capabilities: ['documents'], roomId: 'engineering', connection: 'demo' },
    { id: 'demo-rina', code: 'NSA-003', name: 'Rina', role: 'Operations', description: 'Membantu merapikan laporan dan kebutuhan operasional.', avatar: { ...presets[2].config }, capabilities: ['documents', 'research'], roomId: 'engineering', connection: 'demo' },
  ] };
}
export type WorkerInput = Pick<Worker, 'name' | 'role' | 'description' | 'avatar' | 'capabilities' | 'roomId'>;
export function checkRoom(data: WorkspaceData, roomId: string | null, workerId?: string) {
  if (roomId === null) return;
  const room = data.rooms.find(r => r.id === roomId);
  if (!room) throw new Error('Ruangan tidak ditemukan.');
  if (data.workers.filter(w => w.roomId === roomId && w.id !== workerId).length >= room.capacity) throw new Error('Ruangan penuh. Pilih ruangan lain atau tanpa meja.');
}
export function createWorker(data: WorkspaceData, input: WorkerInput): WorkspaceData {
  checkRoom(data, input.roomId);
  const highest = data.workers.reduce((n, w) => Math.max(n, Number(w.code.replace('NSA-', '')) || 0), 0);
  const worker = workerSchema.parse({ ...input, id: crypto.randomUUID(), code: `NSA-${String(highest + 1).padStart(3, '0')}`, connection: 'demo' });
  return { ...data, workers: [...data.workers, worker] };
}
export function assignWorker(data: WorkspaceData, id: string, roomId: string | null): WorkspaceData {  if (!data.workers.some(w => w.id === id)) throw new Error('Worker tidak ditemukan.');
  checkRoom(data, roomId, id);
  return { ...data, workers: data.workers.map(w => w.id === id ? { ...w, roomId } : w) };
}
function roomData(data: WorkspaceData, rooms: Room[]): WorkspaceData {
  const parsed = dataSchema.parse({ ...data, rooms }).rooms;
  return { ...data, rooms: parsed };
}
function uniqueRoomId(data: WorkspaceData, name: string) {
  const slug = name.toLowerCase().replace(/\P{L}|\p{N}+/gu, '-').replace(/^-+|-+$/g, '') || 'baru';
  let id = slug;for (let i = 2; data.rooms.some(r => r.id === id); i++) id = `${slug}-${i}`;
  return id;
}
function roomName(input: string, data: WorkspaceData, excludeId?: string) {
  const name = input.trim();
  if (name.length < 1 || name.length > 24) throw new Error('Nama ruangan harus 1 sampai 24 karakter.');
  if (data.rooms.some(r => r.name.toLowerCase() === name.toLowerCase() && r.id !== excludeId)) throw new Error('Nama ruangan sudah dipakai.');
  return name;
}
export function createRoom(data: WorkspaceData, name: string): WorkspaceData {
  if (data.rooms.length >= 8) throw new Error('Maksimal 8 ruangan.');
  const room = roomSchema.parse({ id: uniqueRoomId(data, name.trim() || 'Ruangan'), name: roomName(name, data) });
  return roomData(data, [...data.rooms, room]);
}
export function renameRoom(data: WorkspaceData, roomId: string, name: string): WorkspaceData {
  if (!data.rooms.some(r => r.id === roomId)) throw new Error('Ruangan tidak ditemukan.');
  const rooms = data.rooms.map(r => r.id === roomId ? roomSchema.parse({ ...r, name: roomName(name, data, roomId) }) : r);
  return roomData(data, rooms);
}
export function deleteRoom(data: WorkspaceData, roomId: string, destinationId?: string): WorkspaceData {
  const room = data.rooms.find(r => r.id === roomId);
  if (!room) throw new Error('Ruangan tidak ditemukan.');
  if (data.rooms.length <= 1) throw new Error('Minimal tersisa satu ruangan. Buat ruangan lain sebelum menghapus.');
  const occupants = data.workers.filter(w => w.roomId === roomId);
  if (occupants.length) {
    const destination = destinationId === undefined ? null : data.rooms.find(r => r.id === destinationId);
    if (!destination) throw new Error(`Ruang masih ada ${occupants.length} worker. Pilih tujuan pemindahan.`);
    if (destination.id !== roomId && data.workers.filter(w => w.roomId === destination.id).length + occupants.length > destination.capacity) throw new Error('Tujuan penuh. Pilih tujuan lain atau kosongkan ruangan.');
  }
  const rooms = data.rooms.filter(r => r.id !== roomId);
  const remapped = destinationId === undefined ? data : { ...data, workers: data.workers.map(w => w.roomId === roomId ? { ...w, roomId: destinationId } : w) };
  return roomData(remapped, rooms);
}
export function deleteWorker(data: WorkspaceData, id: string): WorkspaceData {
  if (!data.workers.some(w => w.id === id)) throw new Error('Worker tidak ditemukan.');
  return { ...data,
    workers: data.workers.filter(w => w.id !== id),
    conversations: data.conversations.filter(c => c.workerId !== id),
    runs: data.runs.filter(r => r.workerId !== id),
  };
}
export function createConversation(data: WorkspaceData, workerId: string): WorkspaceData {
  if (!data.workers.some(w => w.id === workerId)) throw new Error('Worker tidak ditemukan.');
  const count = data.conversations.filter(c => c.workerId === workerId).length;
  return { ...data, conversations: [...data.conversations, { id: crypto.randomUUID(), workerId, title: `Percakapan ${count + 1}`, messages: [] }] };
}
export function appendMessage(data: WorkspaceData, conversationId: string, message: Message): WorkspaceData {
  if (!data.conversations.some(c => c.id === conversationId)) throw new Error('Percakapan tidak ditemukan.');
  const validated = messageSchema.parse(message);
  return { ...data, conversations: data.conversations.map(c => c.id !== conversationId ? c : {
    ...c, title: c.messages.length === 0 && message.role === 'user' ? message.text.slice(0, 36) : c.title,
    messages: [...c.messages, validated],
  }) };
}
export function recoverData(data: WorkspaceData): WorkspaceData {
  return { ...data, runs: data.runs.map(r => r.status === 'running' ? { ...r, status: 'failed', summary: 'Balasan terputus saat halaman ditutup. Kirim ulang pesan jika diperlukan.' } : r) };
}
export function workerActivity(data: WorkspaceData, id: string) {
  return data.runs.some(r => r.workerId === id && r.status === 'running') ? 'Menyiapkan balasan' : 'Siap';
}
