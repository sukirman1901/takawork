import { beforeEach, afterEach, it, expect, vi } from 'vitest';
let storage: Map<string,string>;
beforeEach(()=>{
  vi.resetModules();vi.useFakeTimers();storage=new Map();
  vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)});
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('sends one run per worker, isolates replies while another worker is selected, and persists them',async()=>{
  const {useWorkspace}=await import('./state');const s=useWorkspace.getState;
  s().selectWorker('demo-budi');const conversation=s().selectedConversationId;
  const pending=s().send('Rencana minggu ini');
  await s().send('Duplikat ketika sibuk');
  s().selectWorker('demo-sari');
  await vi.runAllTimersAsync();await pending;
  expect(s().data.runs).toHaveLength(1);
  expect(s().data.conversations.find(c=>c.id===conversation)!.messages).toHaveLength(2);
  expect(s().data.conversations.find(c=>c.workerId==='demo-sari')!.messages).toHaveLength(0);
  expect(s().selectedWorkerId).toBe('demo-sari');
  expect(JSON.parse(storage.get('nusaiba.prototype.v1')!).runs[0].status).toBe('completed');
});
it('cancelled replies never append an assistant message later',async()=>{
  const {useWorkspace}=await import('./state');const s=useWorkspace.getState;
  s().selectWorker('demo-budi');const pending=s().send('Batalkan');
  s().cancel(s().data.runs[0].id);await vi.runAllTimersAsync();await pending;
  expect(s().data.runs[0].status).toBe('cancelled');
  expect(s().data.conversations[0].messages).toHaveLength(1);
});
it('invalid storage is not silently overwritten',async()=>{
  storage.set('nusaiba.prototype.v1','invalid JSON');
  const {useWorkspace}=await import('./state');useWorkspace.getState().selectWorker('demo-budi');
  expect(useWorkspace.getState().notice).toContain('tanpa menimpa');
  expect(storage.get('nusaiba.prototype.v1')).toBe('invalid JSON');
});
it('renaming retains ID, code and conversation history',async()=>{
  const {useWorkspace}=await import('./state');const s=useWorkspace.getState;
  s().selectWorker('demo-budi');const id=s().selectedConversationId;
  s().updateWorker('demo-budi',{name:'Bima',role:'QA',description:'Memeriksa dokumen.'});
  expect(s().data.workers[0].code).toBe('NSA-001');
  expect(s().data.conversations[0].id).toBe(id);
  expect(s().data.workers[0].name).toBe('Bima');
});
