import { expect,it } from 'vitest';
import { boardLines, drawBoard } from './board';
it('shows an honest empty board without the redundant connection subtitle',()=>{
  const drawn:string[]=[];
  const canvas={getContext:()=>({fillRect:()=>{},fillText:(text:string)=>drawn.push(text),measureText:(text:string)=>({width:text.length*10})})} as unknown as HTMLCanvasElement;
  drawBoard(canvas,[]);
  expect(drawn).toContain('Belum ada pekerjaan.');
  expect(drawn).toContain('Kirim pesan ke worker untuk mulai bekerja.');
  expect(drawn).not.toContain('Demo lokal · Hermes belum terhubung');
  drawn.length=0;
  drawBoard(canvas,[{id:'r',workerId:'w',name:'Budi',summary:'Balasan selesai',status:'completed'}]);
  expect(drawn).toContain('Budi');
  expect(drawn).not.toContain('Demo lokal · Hermes belum terhubung');
});
it('shows an honest empty state instead of fictional tasks',()=>{
  expect(boardLines([])).toEqual(['Belum ada pekerjaan.','Kirim pesan ke worker untuk mulai bekerja.']);
});
it('shows worker name, job summary and lifecycle status',()=>{
  expect(boardLines([{id:'r',workerId:'w',name:'Budi',summary:'Menyiapkan balasan',status:'running'}])[0]).toContain('Budi');
  expect(boardLines([{id:'r',workerId:'w',name:'Budi',summary:'Balasan selesai',status:'completed'}])[0]).toContain('Selesai');
});
