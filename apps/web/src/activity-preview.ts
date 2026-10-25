import type { Run, WorkspaceData } from '../../../packages/contracts/src';
const summaries:Record<Run['status'],string>={
  running:'Menyiapkan balasan demo',completed:'Balasan demo selesai',
  cancelled:'Balasan demo dibatalkan',failed:'Balasan demo terputus',
};
export function activityPreview(data:WorkspaceData) {
  const run=data.runs.at(-1);
  if(!run)return 'Demo lokal · Hermes belum terhubung';
  const name=data.workers.find(w=>w.id===run.workerId)?.name??'Worker';
  return `${name} · ${summaries[run.status]}`;
}
