import { boot } from 'virtual:nusaiba-scene';
import { sceneMessageSchema, type SceneWorker } from './office-contract';
import { boardLines, drawBoard } from './board';

const send=(data:unknown)=>window.parent.postMessage(data,location.origin);
let motion=false, suspended=false;
let current:SceneWorker[]=[];
let identity='';
let boardIdentity='';
try {
  const office=boot({
    onSelect:workerId=>send({type:'select',workerId}),
    motion:()=>motion,suspended:()=>suspended,
    bubble:ag=>{
      if(current.find(w=>w.id===ag.data.id)?.busy)return 'Menyiapkan balasan · demo';
      const labels:Record<string,string>={desk:'Di meja',coffee:'Di pantry',lounge:'Istirahat',whiteboard:'Di papan',meeting:'Berkumpul'};
      return `${labels[ag.state]??'Berjalan'} · suasana`;
    },
  });
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==window.parent)return;
    const parsed=sceneMessageSchema.safeParse(event.data);if(!parsed.success)return;
    const message=parsed.data;
    if(message.type==='camera'){office.camera(message.view);return;}
    const nextBoard=JSON.stringify(message.board);
    if(nextBoard!==boardIdentity){
      boardIdentity=nextBoard;office.board(canvas=>drawBoard(canvas,message.board));
      let accessible=document.getElementById('worker-jobs');
      if(!accessible){accessible=document.createElement('section');accessible.id='worker-jobs';accessible.className='sr-only';accessible.setAttribute('aria-label','Pekerjaan worker · demo');document.body.appendChild(accessible);}
      accessible.replaceChildren(...boardLines(message.board).map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
      document.body.dataset.jobs=String(message.board.length);
    }
    const nextIdentity=JSON.stringify([message.roomId,message.workers.map(({busy,...w})=>w)]);
    current=message.workers;
    if(identity!==nextIdentity){
      identity=nextIdentity;
      office.load({id:message.roomId,name:'Takaloka',schedule:false,members:current.map(w=>({
        id:w.id,name:w.name,role:w.role,color:w.avatar.color,gender:w.avatar.presentation,status:'online',
        task:'Suasana visual · bukan pekerjaan AI',lines:['Suasana visual'],
        look:{g:w.avatar.presentation,skin:parseInt(w.avatar.skin.slice(1),16),
          hair:({short:'pendek',long:'panjang',ponytail:'kuncir',hijab:'hijab'})[w.avatar.hair],
          hairCol:parseInt(w.avatar.hairColor.slice(1),16),hijab:parseInt(w.avatar.color.slice(1),16),
          top:({shirt:'kemeja-pendek',tunic:'tunik',blazer:'blazer'})[w.avatar.outfit],
          topCol:parseInt(w.avatar.color.slice(1),16),pants:0x36413e,glasses:w.avatar.glasses,avatar:w.avatar},
      }))});
      office.agents.forEach((a,i)=>{a.timer=5+i*8;});
    }
    if(suspended&&!message.suspended)office.resume();
    motion=message.motion;suspended=message.suspended;
    office.lighting(message.night);office.select(message.selectedId);
    office.agents.forEach(a=>{
      const busy=!!current.find(w=>w.id===a.data.id)?.busy;
      a.bubbleEl?.classList.toggle('is-busy',busy);
      if(busy)a.timer=Math.max(a.timer,5);
      if(a.bubbleEl)a.bubbleEl.lastChild!.textContent=current.find(w=>w.id===a.data.id)?.busy?'Menyiapkan balasan · demo':`${({desk:'Di meja',coffee:'Di pantry',whiteboard:'Di papan'} as Record<string,string>)[a.state]??'Suasana kantor'} · suasana`;
    });
    document.body.dataset.workers=String(current.length);
    document.body.dataset.motion=String(motion);
  });
  office.board(canvas=>drawBoard(canvas,[]));office.start();
  document.body.dataset.scene='ready';send({type:'ready'});
} catch(error) {
  document.body.dataset.scene='failed';
  send({type:'error',message:error instanceof Error?error.message:'Kantor 3D tidak tersedia'});
}
