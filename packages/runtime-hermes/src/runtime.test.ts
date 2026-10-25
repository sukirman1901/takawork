import { it, expect, vi } from 'vitest';
import { demoRuntime } from './index';
import { initialData } from '../../contracts/src';
it('labels replies as demo and can cancel without returning a successful reply', async () => {
  vi.useFakeTimers();
  const worker = initialData().workers[0];
  const controller = new AbortController();
  const pending = demoRuntime.respond(worker, [], controller.signal);
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort(); await rejected;
  const reply = demoRuntime.respond(worker, [], new AbortController().signal);
  await vi.runAllTimersAsync();
  expect(await reply).toContain('bukan hasil Hermes');
  vi.useRealTimers();
});
