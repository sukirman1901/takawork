import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X, ShieldCheck } from 'lucide-react';
import { presets, avatarSchema, capabilities, capabilityNames, type AvatarConfig, type WorkerInput } from '../../../packages/contracts/src';
import { Portrait } from '../../../packages/avatar/src/Portrait';
import { AvatarPreview } from './AvatarPreview';
import { useWorkspace } from './state';
import { Select } from './Select';

const steps = ['Identitas','Avatar','Kemampuan','Tinjau'];
export function WorkerWizard({onClose}: {onClose:()=>void}) {
  const ref = useRef<HTMLDialogElement>(null), formRef = useRef<HTMLFormElement>(null);
  const [step,setStep] = useState(0), [error,setError] = useState('');
  const [draft,setDraft] = useState<WorkerInput>({ name:'',role:'',description:'',avatar:{...presets[1].config},capabilities:[],roomId:useWorkspace.getState().roomId });
  const data = useWorkspace(s=>s.data), add = useWorkspace(s=>s.addWorker);
  useEffect(()=>{const dialog=ref.current!, trigger=document.activeElement as HTMLElement;dialog.showModal();return()=>{dialog.close();if(trigger?.isConnected)trigger.focus();};},[]);
  function next() {
    if (!formRef.current?.reportValidity()) return;
    if(step===0&&(!draft.name.trim()||!draft.role.trim()||!draft.description.trim())){setError('Nama, role, dan tanggung jawab tidak boleh hanya spasi.');return;}
    setError('');setStep(n=>n+1);
  }
  function avatar(update:Partial<AvatarConfig>) {setDraft(d=>({...d,avatar:avatarSchema.parse({...d.avatar,...update})}));}
  function submit() {
    try { const id=add(draft); if(draft.roomId)useWorkspace.getState().setRoom(draft.roomId); onClose(); useWorkspace.getState().selectWorker(id); }
    catch(e){setError(e instanceof Error?e.message:'Worker gagal dibuat.');}
  }
  return <dialog ref={ref} className="worker-dialog" onCancel={e=>{e.preventDefault();onClose();}} aria-labelledby="wizard-title">
    <div className="dialog-heading"><div><span className="eyebrow">Takaloka</span><h2 id="wizard-title">Tambah worker</h2></div><button className="icon-button" aria-label="Tutup pembuatan worker" onClick={onClose}><X/></button></div>
    <ol className="steps">{steps.map((label,i)=><li key={label} aria-current={i===step?'step':undefined} className={i<=step?'active':''}><span>{i<step?<Check size={12}/>:i+1}</span>{label}</li>)}</ol>
    <form ref={formRef} onSubmit={e=>{e.preventDefault();if(step===3)submit();else next();}}>
      <div className="wizard-body">
      {step===0 && <div className="identity-step"><div><h3>Siapa yang akan bergabung?</h3><p>Role dan tanggung jawab menjadi identitas worker. Izin alat diatur terpisah.</p></div>
        <label>Nama<input autoFocus required maxLength={40} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Contoh: Maya"/></label>
        <label>Role<input required maxLength={60} value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})} placeholder="Contoh: Research Analyst"/></label>
        <label>Tanggung jawab<textarea required maxLength={1000} rows={3} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Jelaskan pekerjaan dan hasil yang diharapkan…"/></label>
        <p className="helper">Kode NSA dibuat otomatis. Nama tidak menentukan jenis avatar.</p>
      </div>}
      {step===1 && <div className="avatar-step"><div className="avatar-stage"><AvatarPreview config={draft.avatar}/><span>Drag untuk memutar preview</span></div><div className="avatar-options">
        <h3>Pilih wajah timmu.</h3><div className="preset-grid">{presets.map(p=><button key={p.id} type="button" className="preset" onClick={()=>setDraft({...draft,avatar:{...p.config}})} aria-label={`Preset ${p.name}`}><Portrait config={p.config} size={42}/><span>{p.name}</span></button>)}</div>
        <div className="field-grid"><Select label="Preset gender" value={draft.avatar.presentation} onValueChange={value=>avatar({presentation:value,hair:value==='f'?'long':'short'})} options={[{value:'f',label:'Wanita'},{value:'m',label:'Pria'}]}/>
          <Select label="Bentuk kepala" value={draft.avatar.head} onValueChange={value=>avatar({head:value})} options={[{value:'angular',label:'Geometris'},{value:'soft',label:'Membulat'}]}/>
          <Select<AvatarConfig['hair']> label="Rambut / kerudung" value={draft.avatar.hair} onValueChange={value=>avatar({hair:value})} options={[...(draft.avatar.presentation==='m'?[{value:'short' as const,label:'Pendek'}]:[]),{value:'long',label:'Panjang'},{value:'ponytail',label:'Kuncir'},{value:'hijab',label:'Kerudung'}]}/>
          <Select label="Pakaian" value={draft.avatar.outfit} onValueChange={value=>avatar({outfit:value})} options={[{value:'shirt',label:'Kemeja'},{value:'blazer',label:'Blazer'},{value:'tunic',label:'Tunik'}]}/>
          <Select label="Kulit" value={draft.avatar.skin} onValueChange={value=>avatar({skin:value})} options={[{value:'#d8a47f',label:'Terang hangat'},{value:'#b98360',label:'Medium hangat'},{value:'#8f5f3e',label:'Cokelat'}]}/>
          <Select label="Warna rambut" value={draft.avatar.hairColor} onValueChange={value=>avatar({hairColor:value})} options={[{value:'#292e28',label:'Hitam'},{value:'#634634',label:'Cokelat'},{value:'#87847c',label:'Abu-abu'}]}/>
          <Select label="Alis" value={draft.avatar.brows} onValueChange={value=>avatar({brows:value})} options={[{value:'straight',label:'Lurus terpisah'},{value:'soft',label:'Lembut terpisah'}]}/>
          <Select label="Mata" value={draft.avatar.eyes} onValueChange={value=>avatar({eyes:value})} options={[{value:'dot',label:'Titik'},{value:'slim',label:'Tipis'}]}/>
          <label className="check-label"><input type="checkbox" checked={draft.avatar.glasses} onChange={e=>avatar({glasses:e.target.checked})}/> Kacamata</label>
        </div>
        <fieldset className="colors"><legend>Warna pakaian / kerudung</legend>{[['#376653','Hijau'],['#c8553d','Terakota'],['#d8a64b','Kuning'],['#5d7fa3','Biru'],['#9c4f6e','Mawar']].map(([color,name])=><label key={color} title={name}><input type="radio" name="avatar-color" aria-label={name} checked={draft.avatar.color===color} onChange={()=>avatar({color:color as AvatarConfig['color']})}/><span style={{background:color}}/></label>)}</fieldset>
      </div></div>}
      {step===2 && <div className="identity-step"><div><h3>Batas kerja yang jelas.</h3><p>Pilih kategori kemampuan untuk rancangan worker. Semua akses pada prototype ini <strong>hanya metadata demo</strong>.</p></div>
        <div className="runtime-card"><ShieldCheck/><div><strong>Runtime demo lokal</strong><p>Seluruh aksi hanya visual: belum ada alat, file, atau koneksi web yang diberikan.</p></div><span className="badge">Demo</span></div>
        {capabilities.map(cap=><label key={cap} className="capability"><input type="checkbox" checked={draft.capabilities.includes(cap)} onChange={e=>setDraft({...draft,capabilities:e.target.checked?[...draft.capabilities,cap]:draft.capabilities.filter(c=>c!==cap)})}/><span><strong>{capabilityNames[cap]}</strong><small>Preferensi tugas · tidak mengaktifkan akses nyata</small></span></label>)}
      </div>}
      {step===3 && <div className="identity-step"><div className="review-person"><Portrait config={draft.avatar} size={72}/><div><h3>{draft.name}</h3><p>{draft.role}</p><span className="badge">ID otomatis · NSA</span></div></div><p className="description">{draft.description}</p>
        <Select label="Penempatan" value={draft.roomId??''} onValueChange={value=>setDraft({...draft,roomId:value||null})} options={[...data.rooms.map(r=>{const count=data.workers.filter(w=>w.roomId===r.id).length;return {value:r.id,label:`${r.name} · ${count}/${r.capacity} meja`,disabled:count>=r.capacity};}),{value:'',label:'Tanpa meja dulu'}]}/>
        <p className="helper">Worker tanpa meja tetap bisa diajak chat dari daftar. Ruangan tidak membatasi jumlah worker.</p>
        <div className="review-line"><span>Runtime</span><strong>Demo lokal · tanpa akses nyata</strong></div><div className="review-line"><span>Kemampuan demo</span><strong>{draft.capabilities.map(c=>capabilityNames[c]).join(', ')||'Belum dipilih'}</strong></div>
      </div>}
      {error&&<p className="form-error" role="alert">{error}</p>}
      </div><div className="dialog-footer"><button type="button" className="button" onClick={()=>step?setStep(n=>n-1):onClose()}><ArrowLeft size={15}/>{step?'Kembali':'Batal'}</button><span>{step+1} dari 4</span><button className="button primary" type="submit">{step===3?'Buat worker':'Lanjut'}{step===3?<Check size={15}/>:<ArrowRight size={15}/>}</button></div>
    </form>
  </dialog>;
}
