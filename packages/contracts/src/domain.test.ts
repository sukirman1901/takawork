import { describe, it, expect } from 'vitest';
import { createWorker, assignWorker, createConversation, appendMessage, recoverData, initialData, createRoom, renameRoom, deleteRoom, deleteWorker, presets, dataSchema, defaultRooms, type WorkspaceData } from './index';

describe('worker identity and capacity', () => {
  it('keeps internal identity separate from display name and allocates unique codes', () => {
    const data = initialData();
    const next = createWorker(data, { name: 'Budi', role: 'QA', description: 'Memeriksa hasil', avatar: presets[1].config, capabilities: [], roomId: 'engineering' });
    const worker = next.workers.at(-1)!;
    expect(worker.id).not.toBe(worker.name);
    expect(worker.avatar.presentation).toBe('f');
    expect(new Set(next.workers.map(w => w.code)).size).toBe(next.workers.length);
    expect(data.workers.length).toBe(3);
  });
  it('rejects full/unknown rooms but permits unplaced workers', () => {
    let data = initialData();
    const input = { name: 'Maya', role: 'QA', description: 'Periksa laporan', avatar: presets[1].config, capabilities: [], roomId: 'engineering' as string | null };
    for (let i = 0; i < 3; i++) data = createWorker(data, input);
    expect(() => createWorker(data, input)).toThrow(/penuh/i);
    const unplaced = createWorker(data, { ...input, roomId: null });
    expect(unplaced.workers.at(-1)!.roomId).toBe(null);
    expect(() => assignWorker(unplaced, unplaced.workers.at(-1)!.id, 'missing')).toThrow();
  });
  it('validates empty identity and incompatible appearance', () => {
    const data = initialData();
    expect(() => createWorker(data, { name: ' ', role: 'QA', description: 'x', avatar: presets[0].config, capabilities: [], roomId: null })).toThrow();
    expect(dataSchema.safeParse({ ...data, workers: [{ ...data.workers[0], avatar: { ...presets[0].config, presentation: 'f', hair: 'short' } }] }).success).toBe(false);
  });
});
describe('room management', () => {
  it('adds rooms with unique ids and guarded names', () => {
    let data = initialData();
    data = createRoom(data, 'Lab');
    expect(data.rooms.map(r => r.name)).toContain('Lab');
    expect(data.rooms.find(r => r.name === 'Lab')!.capacity).toBe(6);
    expect(() => createRoom(data, 'lab')).toThrow(/dipakai/i);
    expect(() => createRoom(data, '  ')).toThrow();
    expect(() => createRoom(data, 'x'.repeat(25))).toThrow();
    for (let i = data.rooms.length; i < 8; i++) data = createRoom(data, `Ruangan ${i}`);
    expect(() => createRoom(data, 'Terlalu banyak')).toThrow(/maksimal/i);
  });
  it('renames rooms without breaking worker placement or duplicates', () => {
    let data = initialData();
    data = renameRoom(data, 'engineering', 'Rekayasa');
    expect(data.rooms.find(r => r.id === 'engineering')!.name).toBe('Rekayasa');
    expect(data.workers[0].roomId).toBe('engineering');
    data = createRoom(data, 'Lab');
    expect(() => renameRoom(data, 'lab', 'rekayasa')).toThrow(/dipakai/i);
    expect(() => renameRoom(data, 'missing', 'Apa')).toThrow(/tidak ditemukan/i);
  });
  it('deletes empty rooms, moves occupants, and protects the last room and full destinations', () => {
    let data = initialData();
    data = createRoom(data, 'Lab');
    data = deleteRoom(data, 'lab');
    expect(data.rooms.map(r => r.id)).toEqual(defaultRooms.map(r => r.id));
    expect(() => deleteRoom(data, 'lab')).toThrow(/tidak ditemukan/i);
    data = deleteRoom(data, 'operations');
    data = deleteRoom(data, 'research');
    expect(() => deleteRoom(data, 'engineering')).toThrow(/satu ruangan/i);
    data = createRoom(data, 'Lab');
    data = deleteRoom(data, 'engineering', 'lab');
    expect(data.rooms.map(r => r.id)).not.toContain('engineering');
    expect(data.workers.every(w => w.roomId === 'lab')).toBe(true);
    expect(() => deleteRoom(data, 'research', 'missing')).toThrow(/tidak ditemukan/i);
  });
  it('always surfaces a room list, including for legacy data saved before rooms existed', () => {
    const legacy: Partial<WorkspaceData> = { version: 1, workers: [], conversations: [], runs: [] };
    const parsed = dataSchema.parse(legacy);
    expect(parsed.rooms.map(r => r.name)).toEqual(defaultRooms.map(r => r.name));
    expect(initialData().rooms).toHaveLength(3);
  });
});
describe('worker deletion', () => {
  it('removes only the named worker with its conversations and runs', () => {
    let data = initialData();
    const budi = data.workers[0];
    data = createConversation(data, budi.id);
    const conversationId = data.conversations.at(-1)!.id;
    data = appendMessage(data, conversationId, { id: 'm1', role: 'user', text: 'Cek laporan', createdAt: '2026-10-26T00:00:00Z' });
    data.runs.push({ id: 'run-1', workerId: budi.id, conversationId, status: 'completed', summary: 'Selesai', createdAt: '2026-10-26T00:00:00Z' });
    expect(() => deleteWorker(data, 'missing')).toThrow(/tidak ditemukan/i);
    const next = deleteWorker(data, budi.id);
    expect(next.workers.some(w => w.id === budi.id)).toBe(false);
    expect(next.conversations.some(c => c.workerId === budi.id)).toBe(false);
    expect(next.runs.some(r => r.workerId === budi.id)).toBe(false);
    expect(next.workers).toHaveLength(data.workers.length - 1);
    expect(next.conversations).toHaveLength(data.conversations.length - 1);
    expect(next.runs).toHaveLength(data.runs.length - 1);
  });
});
describe('conversation and recovery', () => {
  it('never mixes messages between workers or conversations', () => {
    let data = initialData();
    data = createConversation(data, data.workers[0].id);
    const first = data.conversations.at(-1)!;
    data = createConversation(data, data.workers[1].id);
    data = appendMessage(data, first.id, { id: 'message-1', role: 'user', text: 'Cek laporan', createdAt: '2026-10-25T00:00:00Z' });
    expect(data.conversations.find(c => c.id === first.id)!.messages).toHaveLength(1);
    expect(data.conversations.at(-1)!.messages).toHaveLength(0);
    expect(() => appendMessage(data, 'missing', { id: 'x', role: 'user', text: 'x', createdAt: '2026-10-25T00:00:00Z' })).toThrow();
  });
  it('marks interrupted demo work as failed after reload instead of pretending to run', () => {
    const data = initialData();
    data.runs.push({ id: 'run-1', workerId: data.workers[0].id, conversationId: 'conversation-1', status: 'running', summary: 'Balasan demo', createdAt: '2026-10-25T00:00:00Z' });
    const restored = recoverData(data);
    expect(restored.runs[0].status).toBe('failed');
    expect(data.runs[0].status).toBe('running');
  });
});
