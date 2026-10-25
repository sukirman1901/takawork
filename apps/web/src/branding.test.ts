import { readFileSync } from 'node:fs';
import { expect,it } from 'vitest';
it('brands visible UI and scene as Takaloka without losing existing browser data',()=>{
  for(const path of ['./App.tsx','./WorkerWizard.tsx','./Office.tsx','./office-entry.ts','../index.html']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    expect(source.includes('Takaloka')).toBe(true);
    expect(source.includes('Nusaiba')).toBe(false);
  }
  expect(readFileSync(new URL('./state.ts',import.meta.url),'utf8')).toContain("const KEY = 'nusaiba.prototype.v1'");
});
