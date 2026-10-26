import type { Message, Worker } from '../../contracts/src';

// This is Nusaiba's adapter contract, NOT a claim about Hermes' actual API.
export interface WorkerRuntime {
  kind: 'demo' | 'hermes';
  respond(worker: Worker, messages: Message[], signal: AbortSignal): Promise<string>;
}
export const demoRuntime: WorkerRuntime = {
  kind: 'demo',
  respond(worker, messages, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) { reject(new DOMException('Dibatalkan', 'AbortError')); return; }
      const onAbort = () => { clearTimeout(timer); reject(new DOMException('Dibatalkan', 'AbortError')); };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        const text = messages.filter(m => m.role === 'user').at(-1)?.text ?? '';
        resolve(`Ini balasan lokal dari ${worker.name}, bukan hasil Hermes.\n\nPermintaan: “${text.slice(0, 300)}”\n\nSebagai ${worker.role}, alur yang akan saya usulkan:\n1. Perjelas kebutuhan dan hasil yang diharapkan.\n2. Susun langkah kerja serta bahan yang diperlukan.\n3. Tinjau hasil bersama sebelum tindakan berikutnya.\n\nBelum ada file, web, atau alat yang dijalankan. Sambungan Hermes akan ditambahkan setelah kontrak integrasinya diverifikasi.`);
      }, 1400);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  },
};
