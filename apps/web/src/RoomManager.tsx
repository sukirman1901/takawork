import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useWorkspace } from './state';
import { Select } from './Select';

// Native <dialog> like Directory: opaque panel, Escape/Tab handled by the platform,
// and placement moves use the shared custom Select — never a native <select>.
export function RoomManager({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const data = useWorkspace(s => s.data), add = useWorkspace(s => s.addRoom), rename = useWorkspace(s => s.renameRoom), remove = useWorkspace(s => s.removeRoom);
  const [editing, setEditing] = useState<string | null>(null), [draftName, setDraftName] = useState('');
  const [moving, setMoving] = useState<string | null>(null), [moveTarget, setMoveTarget] = useState('');
  const [newName, setNewName] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    const d = ref.current!, trigger = document.activeElement as HTMLElement;
    d.showModal();
    return () => { d.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  function run(action: () => void) {
    try { action(); setError(''); } catch (error) { setError(error instanceof Error ? error.message : 'Perubahan ruangan gagal.'); }
  }
  function removeRow(roomId: string, occupants: number) {
    if (!occupants) return run(() => { remove(roomId); setMoving(null); setMoveTarget(''); });
    return run(() => {
      remove(roomId, moveTarget);
      setMoving(null); setMoveTarget('');
    });
  }
  function startMove(roomId: string) { setMoving(roomId); setMoveTarget(data.rooms.find(r => r.id !== roomId)?.id ?? ''); }
  return <dialog ref={ref} className="room-dialog" onCancel={e => { e.preventDefault(); onClose(); }} aria-labelledby="room-title">
    <div className="dialog-heading"><div><span className="eyebrow">Ruangan kantor</span><h2 id="room-title">Kelola ruangan</h2></div><button className="icon-button" aria-label="Tutup kelola ruangan" onClick={onClose}><X/></button></div>
    <div className="room-list">
      {data.rooms.map(room => {
        const occupants = data.workers.filter(w => w.roomId === room.id).length;
        return <div key={room.id} className="room-row">
          {editing === room.id
            ? <form className="room-inline" onSubmit={e => { e.preventDefault(); run(() => { rename(room.id, draftName); setEditing(null); }); }}>
              <input value={draftName} autoFocus maxLength={24} aria-label={`Nama ruangan ${room.name}`} onChange={e => setDraftName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(null); } }} required/>
              <button className="icon-button" type="submit" aria-label={`Simpan nama ${room.name}`}><Check size={15}/></button>
              <button className="icon-button" type="button" aria-label={`Batal mengedit ${room.name}`} onClick={() => setEditing(null)}><X size={15}/></button>
            </form>
            : moving === room.id
              ? <form className="room-inline" onSubmit={e => { e.preventDefault(); removeRow(room.id, occupants); }}>
                <span>Pindahkan {occupants} worker dari {room.name} ke <Select label="Tujuan pemindahan" hideLabel value={moveTarget} onValueChange={setMoveTarget} options={data.rooms.filter(r => r.id !== room.id).map(r => ({ value: r.id, label: `${r.name} · ${data.workers.filter(w => w.roomId === r.id).length}/${r.capacity}` }))}/></span>
                <button className="icon-button" type="submit" aria-label={`Pindahkan worker lalu hapus ${room.name}`}><Check size={15}/></button>
                <button className="icon-button" type="button" aria-label={`Batal menghapus ${room.name}`} onClick={() => { setMoving(null); setMoveTarget(''); }}><X size={15}/></button>
              </form>
              : <>
                <span><strong>{room.name}</strong><small>{occupants}/{room.capacity} meja</small></span>
                <button className="icon-button" aria-label={`Ganti nama ${room.name}`} onClick={() => { setEditing(room.id); setDraftName(room.name); }}><Pencil size={15}/></button>
                <button className="icon-button" aria-label={`Hapus ${room.name}`} title={data.rooms.length <= 1 ? 'Minimal tersisa satu ruangan' : occupants ? 'Worker dipindahkan setelah memilih tujuan' : 'Hapus ruangan'} disabled={data.rooms.length <= 1} onClick={() => occupants ? startMove(room.id) : removeRow(room.id, 0)}><Trash2 size={15}/></button>
              </>}
        </div>;
      })}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <form className="room-add" onSubmit={e => { e.preventDefault(); run(() => { add(newName); setNewName(''); }); }}>
      <input value={newName} maxLength={24} required aria-label="Nama ruangan baru" placeholder="Nama ruangan baru…" onChange={e => setNewName(e.target.value)}/>
      <button className="button" type="submit"><Plus size={15}/>Tambah</button>
    </form>
    <p className="helper">Maksimal 8 ruangan. Semua ruangan memakai tata kantor 3D yang sama; nama dan penghuninya yang berbeda.</p>
  </dialog>;
}
