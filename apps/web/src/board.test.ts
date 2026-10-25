import { expect,it } from 'vitest';
import { boardLines } from './board';
it('shows an honest empty state instead of fictional tasks',()=>{
  expect(boardLines([])).toEqual(['Belum ada pekerjaan.','Kirim pesan ke worker untuk memulai demo.']);
});
it('shows worker name, job summary and lifecycle status',()=>{
  expect(boardLines([{id:'r',workerId:'w',name:'Budi',summary:'Menyiapkan balasan demo',status:'running'}])[0]).toContain('Budi');
  expect(boardLines([{id:'r',workerId:'w',name:'Budi',summary:'Balasan demo selesai',status:'completed'}])[0]).toContain('Selesai');
});
