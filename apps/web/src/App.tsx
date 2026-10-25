import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Moon, Pause, Play, Plus, RotateCcw, Search, Sun, Users, X } from 'lucide-react';
import { rooms, workerActivity } from '../../../packages/contracts/src';
import { Portrait } from '../../../packages/avatar/src/Portrait';
import { useWorkspace } from './state';
import { ChatPanel } from './ChatPanel';
import type { CameraView } from './office-contract';
import { activityPreview } from './activity-preview';
import { Select } from './Select';
const Office=lazy(()=>import('./Office').then(module=>({default:module.Office})));
const WorkerWizard=lazy(()=>import('./WorkerWizard').then(module=>({default:module.WorkerWizard})));

function Clock() {
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30_000);return()=>clearInterval(timer);},[]);
  return <div className="clock paper"><time>{now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}).replace('.',':')}</time><span>{now.toLocaleDateString('id-ID',{weekday:'long'})}</span></div>;
}
function Directory({onClose}: {onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null),[search,setSearch]=useState('');
  const data=useWorkspace(s=>s.data),select=useWorkspace(s=>s.selectWorker),setRoom=useWorkspace(s=>s.setRoom);
  useEffect(()=>{const d=ref.current!,trigger=document.activeElement as HTMLElement;d.showModal();return()=>{d.close();if(trigger?.isConnected)trigger.focus();};},[]);
  const workers=data.workers.filter(w=>`${w.name} ${w.role} ${w.code}`.toLowerCase().includes(search.toLowerCase()));
  return <dialog ref={ref} className="directory-dialog" onCancel={e=>{e.preventDefault();onClose();}} aria-labelledby="directory-title"><div className="dialog-heading"><div><span className="eyebrow">Semua ruangan</span><h2 id="directory-title">Daftar worker</h2></div><button className="icon-button" aria-label="Tutup daftar worker" onClick={onClose}><X/></button></div><label className="search-field"><Search size={17}/><input autoFocus type="search" aria-label="Cari worker" placeholder="Cari nama, role, atau kode…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="directory-list">{workers.map(w=><button key={w.id} className="worker-row" onClick={()=>{if(w.roomId)setRoom(w.roomId);select(w.id);onClose();}}><Portrait config={w.avatar} size={42}/><span><strong>{w.name}</strong><small>{w.role} · {w.code}</small></span><span className="directory-location">{rooms.find(r=>r.id===w.roomId)?.name??'Tanpa meja'}</span><ArrowUpRight size={16}/></button>)}{!workers.length&&<p className="empty-state">Tidak ada worker yang cocok. Coba kata lain.</p>}</div><p className="directory-footer">Worker tanpa meja tetap dapat diajak chat.</p></dialog>;
}
export function App() {
  const data=useWorkspace(s=>s.data),roomId=useWorkspace(s=>s.roomId),setRoom=useWorkspace(s=>s.setRoom),selectedId=useWorkspace(s=>s.selectedWorkerId),select=useWorkspace(s=>s.selectWorker),notice=useWorkspace(s=>s.notice),dismiss=useWorkspace(s=>s.clearNotice),full=useWorkspace(s=>s.fullChat);
  const [wizard,setWizard]=useState(false),[directory,setDirectory]=useState(false),[night,setNight]=useState(false),[revision,setRevision]=useState(0),[activity,setActivity]=useState(false);
  const [view,setView]=useState<CameraView>('overview');
  const [motion,setMotion]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [small,setSmall]=useState(()=>matchMedia('(max-width: 599px)').matches);
  const cameraMenu=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const screen=matchMedia('(max-width: 599px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const resize=()=>setSmall(screen.matches),reduce=()=>{if(reduced.matches)setMotion(false);};
    screen.addEventListener('change',resize);reduced.addEventListener('change',reduce);
    return()=>{screen.removeEventListener('change',resize);reduced.removeEventListener('change',reduce);};
  },[]);
  function camera(next:CameraView){setView(next);setRevision(n=>n+1);if(cameraMenu.current?.open){cameraMenu.current.open=false;cameraMenu.current.querySelector('summary')?.focus();}}
  const worker=data.workers.find(w=>w.id===selectedId),room=rooms.find(r=>r.id===roomId)!;
  const occupants=data.workers.filter(w=>w.roomId===roomId);
  const lastActivity=activityPreview(data);
  const covered=!!worker&&(small||full);
  return <div className={`workspace ${worker?'has-chat':''} ${full?'full-chat':''}`}>
    <h1 className="sr-only">Takaloka — workspace AI worker</h1>
    <header className="workspace-header" inert={covered}><Clock/><div className="header-actions paper">
      <div className="tool-group" role="group" aria-label="Navigasi kantor">
      <div className="room-picker"><span className="workspace-name">Takaloka</span><span className="tool-divider"/><Select id="room-select" label="Ruangan aktif" hideLabel variant="toolbar" value={roomId} onValueChange={setRoom} options={rooms.map(r=>({value:r.id,label:r.name}))}/></div>
      <span className="tool-divider room-divider"/>
      <div className="camera-presets" aria-label="Sudut pandang"><button aria-pressed={view==='overview'} onClick={()=>camera('overview')}>Ruangan</button><button aria-pressed={view==='whiteboard'} onClick={()=>camera('whiteboard')}>Papan tulis</button><button aria-pressed={view==='lounge'} onClick={()=>camera('lounge')}>Pantry</button></div>
      <details ref={cameraMenu} className="camera-menu" onKeyDown={e=>{if(e.key==='Escape'&&cameraMenu.current){cameraMenu.current.open=false;cameraMenu.current.querySelector('summary')?.focus();}}}><summary className="icon-button" aria-label="Pilihan kamera" title="Pilihan kamera"><Camera/></summary><div className="camera-options paper"><button onClick={()=>camera('overview')}>Seluruh ruangan</button><button onClick={()=>camera('whiteboard')}>Papan tulis</button><button onClick={()=>camera('lounge')}>Pantry</button><button onClick={()=>camera('overview')}><RotateCcw size={14}/>Reset kamera</button><button className="menu-motion" aria-pressed={!motion} onClick={()=>setMotion(!motion)}>{motion?<Pause size={14}/>:<Play size={14}/>} {motion?'Jeda suasana':'Lanjutkan suasana'}</button></div></details>
      <button className="icon-button reset-camera" aria-label="Reset kamera" title="Reset kamera" onClick={()=>camera('overview')}><RotateCcw/></button>
      </div><span className="tool-divider"/>
      <div className="tool-group" role="group" aria-label="Tampilan kantor">
      <button className="icon-button" aria-label={night?'Cahaya sore':'Cahaya lembur'} aria-pressed={night} title={night?'Cahaya sore':'Cahaya lembur'} onClick={()=>setNight(!night)}>{night?<Moon/>:<Sun/>}</button>
      <button className="icon-button motion-toggle" aria-label={motion?'Jeda suasana':'Lanjutkan suasana'} aria-pressed={!motion} title={motion?'Jeda suasana':'Lanjutkan suasana'} onClick={()=>setMotion(!motion)}>{motion?<Pause/>:<Play/>}</button>
      </div><span className="tool-divider action-divider"/>
      <button className="button primary add-worker" aria-label="Tambah worker" onClick={()=>setWizard(true)}><Plus size={15}/><span>Worker</span></button>
    </div></header>
    {notice&&<div className="storage-notice" role="alert"><span>{notice}</span><button className="icon-button" aria-label="Tutup pemberitahuan" onClick={dismiss}><X/></button></div>}
    <main className="workspace-body"><section className="office-panel" aria-label={`Kantor ${room.name}`} inert={covered}>
      <div className="office-canvas"><Suspense fallback={<div className="scene-loading" role="status">Menyiapkan kantor…</div>}><Office night={night} motion={motion} suspended={covered||wizard||directory} view={view} revision={revision}/></Suspense></div>
      {!occupants.length&&<div className="room-empty paper"><strong>Belum ada worker di {room.name}.</strong><button className="text-button" onClick={()=>setDirectory(true)}>Pilih dari daftar worker →</button></div>}
      <div className={`activity-card paper ${activity?'expanded':''}`}><button onClick={()=>setActivity(!activity)} aria-expanded={activity} aria-controls="activity-list"><strong>Aktivitas</strong><span>{activity?'Tutup':'Buka'}</span></button><p title={lastActivity}>{lastActivity}</p>{activity&&<div id="activity-list"><p className="simulation-note">Gerak, mengetik, dan istirahat adalah suasana visual. Balasan chat masih demo.</p>{data.runs.slice(-8).reverse().map(run=><button key={run.id} className="activity-entry" onClick={()=>{select(run.workerId);useWorkspace.getState().selectConversation(run.conversationId);setActivity(false);}}><span>{data.workers.find(w=>w.id===run.workerId)?.name}</span><p>{run.summary}</p></button>)}</div>}</div>
      <footer className="worker-dock paper"><span className="dock-label">Tim</span><div className="dock-avatars">{occupants.map(w=><button key={w.id} className={`dock-avatar ${selectedId===w.id?'active':''}`} aria-label={`Chat dengan ${w.name}`} aria-pressed={selectedId===w.id} title={`${w.name} · ${workerActivity(data,w.id)}`} onClick={()=>select(w.id)}><Portrait config={w.avatar} size={24}/></button>)}</div><span className="dock-divider"/><button className="icon-button" aria-label="Lihat semua worker" title={`${data.workers.length} worker · termasuk tanpa meja`} onClick={()=>setDirectory(true)}><Users size={16}/></button></footer>
    </section>{worker&&<ChatPanel key={worker.id} worker={worker}/>}</main>
    {wizard&&<Suspense fallback={<p className="loading-toast" role="status">Menyiapkan pembuatan worker…</p>}><WorkerWizard onClose={()=>setWizard(false)}/></Suspense>}{directory&&<Directory onClose={()=>setDirectory(false)}/>}
  </div>;
}
