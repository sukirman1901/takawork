import { useEffect, useRef, useState } from 'react';
import { projectOffice, sceneReplySchema, type CameraView, type SceneMessage } from './office-contract';
import { useWorkspace } from './state';

export function Office({night,motion,suspended,view,revision}:{night:boolean;motion:boolean;suspended:boolean;view:CameraView;revision:number}) {
  const frame=useRef<HTMLIFrameElement>(null);
  const loaded=useRef(false);
  const [ready,setReady]=useState(false),[error,setError]=useState('');
  const data=useWorkspace(s=>s.data),roomId=useWorkspace(s=>s.roomId),selectedId=useWorkspace(s=>s.selectedWorkerId);
  const projected=JSON.stringify(projectOffice(data,roomId));
  const send=(message:SceneMessage)=>frame.current?.contentWindow?.postMessage(message,location.origin);
  useEffect(()=>{
    function receive(event:MessageEvent){
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;
      const result=sceneReplySchema.safeParse(event.data);if(!result.success)return;
      if(result.data.type==='ready'){loaded.current=true;setError('');setReady(true);}
      if(result.data.type==='error')setError('Tampilan 3D tidak tersedia. Daftar worker dan chat tetap bisa digunakan.');
      if(result.data.type==='select'){
        const id=result.data.workerId, current=useWorkspace.getState();
        if(current.data.workers.some(w=>w.id===id&&w.roomId===current.roomId))current.selectWorker(id);
      }
    }
    window.addEventListener('message',receive);
    const timeout=setTimeout(()=>{if(!loaded.current)setError(current=>current||'Kantor belum merespons. Coba muat ulang; daftar worker tetap tersedia.');},20000);
    return()=>{window.removeEventListener('message',receive);clearTimeout(timeout);};
  },[]);
  useEffect(()=>{
    if(ready)send({type:'sync',...JSON.parse(projected),selectedId,night,motion,suspended});
  },[ready,projected,selectedId,night,motion,suspended]);
  useEffect(()=>{if(ready)send({type:'camera',view});},[ready,view,revision]);
  return <>
    <iframe ref={frame} src="/office.html" title="Kantor Takaloka — suasana visual" className="office-frame"/>
    {!ready&&!error&&<div className="scene-loading" role="status">Menyiapkan kantor…</div>}
    {error&&!ready&&<div className="scene-loading scene-error" role="status">{error}</div>}
  </>;
}
