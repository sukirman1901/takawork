import { useMemo } from 'react';
import * as THREE from 'three';
import type { AvatarConfig } from '../../contracts/src';
import { buildAvatar, disposeAvatar } from './model';

let renderer: THREE.WebGLRenderer | null = null;
const cache = new Map<string,string>();
function portrait(config: AvatarConfig) {
  const key = JSON.stringify(config); if (cache.has(key)) return cache.get(key);
  let model: THREE.Group | null = null;
  try {
    renderer ??= new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(128,144); renderer.setClearColor('#eceee6',1);
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight('#ffffff','#a2a893',2));
    const sun = new THREE.DirectionalLight('#fff8ee',2.5); sun.position.set(-3,6,5); scene.add(sun);
    model = buildAvatar(config); scene.add(model);
    const camera = new THREE.PerspectiveCamera(25,128/144,.05,10); camera.position.set(.18,1.77,1.75); camera.lookAt(0,1.68,0);
    renderer.render(scene,camera); const url = renderer.domElement.toDataURL();
    if (cache.size >= 128) cache.delete(cache.keys().next().value!);
    cache.set(key,url); return url;
  } catch { return undefined; }
  finally { if(model) disposeAvatar(model); }
}
export function Portrait({ config, size=32, label='', className='' }: { config: AvatarConfig; size?: number; label?: string; className?: string }) {
  const image = useMemo(()=>portrait(config),[JSON.stringify(config)]);
  return <span className={`portrait ${className}`} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} style={{ width:size,height:size,backgroundColor:config.color,backgroundImage:image?`url(${image})`:undefined }}>{!image && '◉'}</span>;
}
