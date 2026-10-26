import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronLeft, Maximize2, Minimize2, Plus, Square, X } from 'lucide-react';
import { capabilityNames, type Worker } from '../../../packages/contracts/src';
import { Portrait } from '../../../packages/avatar/src/Portrait';
import { useWorkspace } from './state';
import { nearTranscriptEnd, transcriptTarget } from './chat-scroll';
import { Select } from './Select';

function Settings({worker}: {worker:Worker}) {
  const update=useWorkspace(s=>s.updateWorker), assign=useWorkspace(s=>s.assign), remove=useWorkspace(s=>s.removeWorker), data=useWorkspace(s=>s.data);
  const [name,setName]=useState(worker.name),[role,setRole]=useState(worker.role),[description,setDescription]=useState(worker.description),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const confirm=useRef<HTMLDialogElement>(null);
  const removals=data.conversations.filter(c=>c.workerId===worker.id).length;
  return <form className="settings-form" onSubmit={e=>{e.preventDefault();try{update(worker.id,{name,role,description});setSaved(true);setError('');}catch(e){setError(e instanceof Error?e.message:'Gagal menyimpan.');}}}>
    <span className="eyebrow">Identitas worker</span><label>Nama<input value={name} required maxLength={40} onChange={e=>{setName(e.target.value);setSaved(false);}}/></label><label>Role<input value={role} required maxLength={60} onChange={e=>{setRole(e.target.value);setSaved(false);}}/></label><label>Tanggung jawab<textarea rows={4} required maxLength={1000} value={description} onChange={e=>{setDescription(e.target.value);setSaved(false);}}/></label>
    <div className="id-line"><span>Kode worker</span><code>{worker.code}</code></div><p className="helper">ID internal tidak berubah saat nama diedit. {worker.id}</p>
    <button className="button primary" type="submit">{saved?<><Check size={16}/>Tersimpan</>:'Simpan identitas'}</button>
    <hr/><Select label="Ruangan" value={worker.roomId??''} onValueChange={value=>{try{assign(worker.id,value||null);setError('');}catch(e){setError(e instanceof Error?e.message:'Penempatan gagal.');}}} options={[...data.rooms.map(r=>({value:r.id,label:`${r.name} · ${data.workers.filter(w=>w.roomId===r.id).length}/${r.capacity}`,disabled:r.id!==worker.roomId&&data.workers.filter(w=>w.roomId===r.id).length>=r.capacity})),{value:'',label:'Tanpa meja'}]}/>
    <span className="eyebrow">Kemampuan</span><p>{worker.capabilities.map(c=>capabilityNames[c]).join(' · ')||'Belum ada kategori kemampuan.'}</p><p className="helper">Hermes belum dikonfigurasi. Tidak ada API key atau izin alat yang disimpan di browser.</p>{error&&<p className="form-error" role="alert">{error}</p>}
    <hr/><div className="danger-zone">
      <span className="eyebrow">Zona bahaya</span>
      <p>Hapus {worker.name} secara permanen beserta {removals} percakapan, tugas, dan catatan papan kantor.</p>
      <button className="button destructive" type="button" aria-label="Hapus worker" onClick={()=>confirm.current?.showModal()}>Hapus worker</button>
    </div>
    <dialog ref={confirm} className="confirm-dialog" aria-labelledby="confirm-remove-title">
      <div className="dialog-heading"><div><span className="eyebrow">Permanen</span><h2 id="confirm-remove-title">Hapus {worker.name}?</h2></div></div>
      <p className="confirm-body">Worker, {removals} percakapan, tugas, dan riwayat papan kantor terkait akan dihapus dari browser. Tindakan ini tidak bisa dibatalkan.</p>
      <div className="dialog-footer"><button type="button" className="button" onClick={()=>confirm.current?.close()}>Batal</button><button type="button" className="button destructive" onClick={()=>{confirm.current?.close();remove(worker.id);}}>Hapus permanen</button></div>
    </dialog>
  </form>;
}
export function ChatPanel({worker}: {worker:Worker}) {
  const data=useWorkspace(s=>s.data), conversationId=useWorkspace(s=>s.selectedConversationId), choose=useWorkspace(s=>s.selectConversation), newChat=useWorkspace(s=>s.newConversation), send=useWorkspace(s=>s.send), cancel=useWorkspace(s=>s.cancel), close=useWorkspace(s=>s.selectWorker), full=useWorkspace(s=>s.fullChat), setFull=useWorkspace(s=>s.setFull);
  const [tab,setTab]=useState<'chat'|'tasks'|'settings'>('chat'),[draft,setDraft]=useState('');
  const transcript=useRef<HTMLDivElement>(null), input=useRef<HTMLTextAreaElement>(null);
  const following=useRef(true), previous=useRef<{id:string|null;count:number;element:HTMLDivElement|null}>({id:null,count:0,element:null});
  const [unseen,setUnseen]=useState(false);
  const conversations=data.conversations.filter(c=>c.workerId===worker.id), conversation=conversations.find(c=>c.id===conversationId);
  const workerRuns=data.runs.filter(r=>r.workerId===worker.id), active=workerRuns.find(r=>r.status==='running');
  const relatedRuns=workerRuns.filter(r=>r.conversationId===conversationId);
  useEffect(()=>{setDraft('');},[conversationId]);
  useLayoutEffect(()=>{
    const el=transcript.current;if(!el||tab!=='chat')return;
    const count=conversation?.messages.length??0;
    const target=transcriptTarget({count,previousCount:previous.current.count,changed:previous.current.id!==conversationId||previous.current.element!==el,nearEnd:following.current,userSent:conversation?.messages.at(-1)?.role==='user'});
    if(target!=='preserve'){
      el.scrollTop=target==='start'?0:el.scrollHeight;following.current=true;setUnseen(false);
    }else if(count>previous.current.count)setUnseen(true);
    previous.current={id:conversationId,count,element:el};
  },[conversation?.messages.length,conversationId,tab,active?.id]);
  useEffect(()=>{if(!matchMedia('(max-width: 599px)').matches)input.current?.focus();},[worker.id,tab]);
  function submit() {if(!draft.trim()||active)return;const message=draft;setDraft('');void send(message);}
  return <section className={`chat-panel ${full?'is-full':''}`} aria-label={`Ruang kerja ${worker.name}`} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close(null);}}}>
    <header className="chat-header"><button className="icon-button mobile-only" aria-label="Kembali ke kantor" title="Kembali ke kantor" onClick={()=>close(null)}><ChevronLeft/></button><Portrait config={worker.avatar} size={36} className="active-portrait"/><div className="chat-identity"><h2>{worker.name}</h2><p>{worker.role} <span>· {worker.code}</span></p></div><button className="icon-button desktop-only" aria-label={full?'Kecilkan chat':'Perbesar chat'} title={full?'Kecilkan chat':'Perbesar chat'} onClick={()=>setFull(!full)}>{full?<Minimize2/>:<Maximize2/>}</button><button className="icon-button desktop-only" aria-label="Tutup chat" title="Tutup chat · Esc" onClick={()=>close(null)}><X/></button></header>
    <nav className="panel-tabs" aria-label="Bagian worker">{([['chat','Chat'],['tasks','Tugas'],['settings','Pengaturan']] as const).map(([key,label])=><button key={key} className={tab===key?'active':''} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}{key==='tasks'&&workerRuns.length>0&&<small>{workerRuns.length}</small>}</button>)}</nav>
    {tab==='chat'&&<>
      <div className="conversation-picker"><Select id="conversation-select" label="Percakapan" hideLabel variant="plain" value={conversationId??''} onValueChange={choose} options={conversations.map(c=>({value:c.id,label:c.title}))}/><button className="icon-button" aria-label="Percakapan baru" title="Percakapan baru" onClick={newChat}><Plus/></button></div>
      <div className="transcript" ref={transcript} role="log" aria-label={`Percakapan dengan ${worker.name}`} aria-live="polite" onScroll={e=>{const el=e.currentTarget;following.current=nearTranscriptEnd(el.scrollHeight,el.clientHeight,el.scrollTop);if(following.current)setUnseen(false);}}>
        {!conversation?.messages.length&&<div className="chat-empty"><h3>Mulai percakapan</h3><p>Tulis brief untuk {worker.name}, atau coba contoh berikut.</p><button className="suggestion" onClick={()=>{setDraft('Bantu saya menyusun rencana kerja untuk minggu ini.');input.current?.focus();}}>Susun rencana kerja minggu ini <ArrowUp size={14}/></button></div>}
        {conversation?.messages.map(m=><article key={m.id} className={`message ${m.role}`}><div className="message-meta"><strong>{m.role==='user'?'Kamu':worker.name}</strong><time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</time>{m.role==='assistant'&&<span className="badge">Lokal</span>}</div><div className="message-text">{m.text}</div></article>)}
        {active?.conversationId===conversationId&&<div className="pending-reply" role="status"><span className="status-dot"/>Menyiapkan balasan…</div>}
        {relatedRuns.at(-1)?.status==='cancelled'&&<p className="run-notice">Balasan dibatalkan. Pesanmu tetap tersimpan.</p>}
        {relatedRuns.at(-1)?.status==='failed'&&<p className="form-error" role="alert">{relatedRuns.at(-1)!.summary}</p>}
      </div>
      {unseen&&<button className="new-message-button button" onClick={()=>{const el=transcript.current;if(el)el.scrollTop=el.scrollHeight;following.current=true;setUnseen(false);}}>Balasan baru ↓</button>}
      <form className="composer" onSubmit={e=>{e.preventDefault();submit();}}><label className="sr-only" htmlFor="message-input">Pesan untuk {worker.name}</label><textarea ref={input} id="message-input" rows={2} maxLength={12000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={`Tulis pesan untuk ${worker.name}…`} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();submit();}}}/><div className="composer-bottom"><span>Enter kirim · Shift+Enter baris baru</span>{active?<button type="button" className="button stop-button" onClick={()=>cancel(active.id)}><Square size={12}/>Hentikan</button>:<button className="button primary send-button" type="submit" disabled={!draft.trim()} aria-label="Kirim pesan"><ArrowUp size={17}/></button>}</div></form><p className="privacy-note">Disimpan di browser · hindari data sensitif</p>
    </>}
    {tab==='tasks'&&<div className="task-list"><div><h3>Riwayat</h3><p>Balasan dibuat lokal di browser, belum oleh Hermes.</p></div>{!workerRuns.length&&<p className="empty-state">Belum ada aktivitas. Kirim pesan untuk mencoba.</p>}{workerRuns.slice().reverse().map(run=><article key={run.id} className="run-card"><span className={`run-state ${run.status}`}>{({running:'Berlangsung',completed:'Selesai',cancelled:'Dibatalkan',failed:'Terputus'})[run.status]}</span><p>{run.summary}</p><button className="text-button" onClick={()=>{choose(run.conversationId);setTab('chat');}}>Buka percakapan →</button></article>)}</div>}
    {tab==='settings'&&<Settings worker={worker}/>}
  </section>;
}
