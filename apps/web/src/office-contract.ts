import { z } from 'zod';
import { avatarSchema, type WorkspaceData } from '../../../packages/contracts/src';

const sceneWorkerSchema = z.object({
  id:z.string().min(1), name:z.string().max(40), role:z.string().max(60),
  avatar:avatarSchema, busy:z.boolean(),
});
const boardJobSchema=z.object({id:z.string(),workerId:z.string(),name:z.string().max(40),summary:z.string().max(160),status:z.enum(['running','completed','cancelled','failed'])});
export type BoardJob=z.infer<typeof boardJobSchema>;
export const sceneMessageSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('sync'), roomId:z.string(), workers:z.array(sceneWorkerSchema).max(6), board:z.array(boardJobSchema).max(6), selectedId:z.string().nullable(), night:z.boolean(), motion:z.boolean(), suspended:z.boolean()}),
  z.object({type:z.literal('camera'), view:z.enum(['overview','whiteboard','lounge'])}),
]);
export const sceneReplySchema = z.discriminatedUnion('type',[
  z.object({type:z.literal('ready')}),
  z.object({type:z.literal('select'), workerId:z.string().min(1)}),
  z.object({type:z.literal('error'), message:z.string()}),
]);
export type SceneMessage = z.infer<typeof sceneMessageSchema>;
export type SceneWorker = z.infer<typeof sceneWorkerSchema>;
export type CameraView = 'overview'|'whiteboard'|'lounge';
export function projectOffice(data:WorkspaceData, roomId:string) {
  const occupants=data.workers.filter(w=>w.roomId===roomId);
  const roomRuns=data.runs.filter(r=>occupants.some(w=>w.id===r.workerId)).slice().reverse();
  const ordered=[...roomRuns.filter(r=>r.status==='running'),...roomRuns.filter(r=>r.status!=='running')].slice(0,6);
  const board:BoardJob[]=ordered.map(r=>({id:r.id,workerId:r.workerId,name:occupants.find(w=>w.id===r.workerId)!.name,summary:r.summary.slice(0,160),status:r.status}));
  return {roomId,board, workers:occupants.map(w=>({
    id:w.id,name:w.name,role:w.role,avatar:w.avatar,
    busy:data.runs.some(r=>r.workerId===w.id&&r.status==='running'),
  }))};
}
