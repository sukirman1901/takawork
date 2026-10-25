import { readFileSync } from 'node:fs';
import { expect,it } from 'vitest';
const read=(file:string)=>readFileSync(new URL(file,import.meta.url),'utf8');
it('uses the Takaloka neutral tokens and derived inner radii instead of green UI chrome',()=>{
  const css=read('./styles.css');
  expect(css.includes('--accent: #141414')).toBe(true);
  expect(css.includes('IBM Plex Sans')).toBe(true);
  expect(css.includes('--radius-menu-item: calc(')).toBe(true);
  expect(css.includes('#2f5d50')).toBe(false);
});
it('uses the shared custom selector in every React UI, including worker creation',()=>{
  for(const file of ['./App.tsx','./ChatPanel.tsx','./WorkerWizard.tsx']){
    const source=read(file);
    expect(source.includes('<select')).toBe(false);
    expect(source.includes('<Select')).toBe(true);
  }
});
