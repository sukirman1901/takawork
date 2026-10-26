import type { BoardJob } from './office-contract';
const statuses:Record<BoardJob['status'],string>={running:'Berlangsung',completed:'Selesai',cancelled:'Dibatalkan',failed:'Terputus'};
export function boardLines(jobs:BoardJob[]) {
  return jobs.length?jobs.map(job=>`${job.name} · ${statuses[job.status]} — ${job.summary}`):['Belum ada pekerjaan.','Kirim pesan ke worker untuk mulai bekerja.'];
}
function fit(ctx:CanvasRenderingContext2D,text:string,width:number) {
  if(ctx.measureText(text).width<=width)return text;
  let result=text;while(result&&ctx.measureText(`${result}…`).width>width)result=result.slice(0,-1);
  return `${result}…`;
}
export function drawBoard(canvas:HTMLCanvasElement,jobs:BoardJob[]) {
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1024,512);
  ctx.fillStyle='#141414';ctx.font='500 32px "IBM Plex Sans", sans-serif';
  ctx.fillText('Pekerjaan worker',36,48);
  if(!jobs.length){
    boardLines([]).forEach((line,i)=>{ctx.fillStyle=i?'#6b6b6b':'#141414';ctx.font=`${i?22:28}px "IBM Plex Sans", sans-serif`;ctx.fillText(line,36,160+i*40);});return;
  }
  jobs.forEach((job,i)=>{
    const y=112+i*63;
    ctx.fillStyle='#e8e8e8';ctx.fillRect(36,y,952,1);
    ctx.fillStyle='#141414';ctx.font='500 21px "IBM Plex Sans", sans-serif';ctx.fillText(fit(ctx,job.name,220),36,y+28);
    ctx.fillStyle='#6b6b6b';ctx.font='19px "IBM Plex Sans", sans-serif';ctx.fillText(fit(ctx,job.summary,590),280,y+28);
    ctx.textAlign='right';ctx.font='18px "IBM Plex Sans", sans-serif';ctx.fillText(statuses[job.status],988,y+50);ctx.textAlign='left';
  });
}
