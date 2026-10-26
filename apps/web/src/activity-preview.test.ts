import { expect, it } from 'vitest';
import { initialData } from '../../../packages/contracts/src';
import { activityPreview } from './activity-preview';
it('shows a quiet empty activity preview when there are no runs',()=>{
  expect(activityPreview(initialData())).toBe('Belum ada aktivitas');
});
it('keeps the compact summary short while leaving the full run untouched',()=>{
  const data=initialData();
  data.runs.push({id:'r',workerId:'demo-budi',conversationId:'c',status:'completed',summary:'Balasan selesai · tidak menjalankan alat',createdAt:'2026-10-25'});
  expect(activityPreview(data)).toBe('Budi · Balasan selesai');
  expect(data.runs[0].summary).toContain('tidak menjalankan alat');
});
