import { expect, it } from 'vitest';
import { initialData } from '../../../packages/contracts/src';
import { projectOffice, sceneMessageSchema, sceneReplySchema } from './office-contract';

it('projects real demo job history to the room board without private chat text',()=>{
  const data=initialData();
  data.conversations.push({id:'c',workerId:'demo-budi',title:'PRIVATE',messages:[{id:'m',role:'user',text:'PRIVATE REQUEST',createdAt:'2026-10-25'}]});
  data.runs.push({id:'r',workerId:'demo-budi',conversationId:'c',status:'running',summary:'Menyiapkan balasan',createdAt:'2026-10-25'});
  expect(projectOffice(data,'engineering').board).toEqual([{id:'r',workerId:'demo-budi',name:'Budi',summary:'Menyiapkan balasan',status:'running'}]);
  expect(projectOffice(data,'operations').board).toEqual([]);
  expect(JSON.stringify(projectOffice(data,'engineering'))).not.toContain('PRIVATE');
});

it('projects only room occupants and short demo state, never conversation text', () => {
  const data = initialData();
  data.workers[2].roomId = null;
  const view = projectOffice(data, 'engineering');
  expect(view.workers).toHaveLength(2);
  expect(view.workers[1].avatar.presentation).toBe('f');
  expect(JSON.stringify(view)).not.toContain('description');
  expect(view.workers[0].busy).toBe(false);
});
it('validates the scene protocol and rejects unknown commands and oversized rooms', () => {
  expect(sceneMessageSchema.safeParse({ type: 'eval', code: 'anything' }).success).toBe(false);
  expect(sceneReplySchema.safeParse({ type: 'select', workerId: 12 }).success).toBe(false);
  const view = projectOffice(initialData(), 'engineering');
  expect(sceneMessageSchema.safeParse({type:'sync', ...view, workers:Array(7).fill(view.workers[0]), selectedId:null, night:false, motion:true, suspended:false}).success).toBe(false);
});
