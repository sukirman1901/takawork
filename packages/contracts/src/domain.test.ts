import { describe, it, expect } from 'vitest';
import { createWorker, assignWorker, createConversation, appendMessage, recoverData, initialData, presets, dataSchema } from './index';

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
