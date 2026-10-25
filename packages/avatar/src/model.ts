import * as THREE from 'three';
import type { AvatarConfig } from '../../contracts/src';

// The approved low-poly proportions; independent from the frozen legacy global script.
const profiles = {
  long: [[.29,0,0],[.25,.15,0],[.19,.225,0],[.16,.24,0],[.12,.235,.80],[-.10,.225,.80],[-.30,.23,.80]],
  ponytail: [[.29,0,0],[.25,.15,0],[.19,.225,0],[.16,.24,0],[.12,.235,.80],[-.10,.225,.80],[-.16,.22,.80]],
  hijab: [[.30,0,0],[.255,.16,0],[.19,.235,0],[.16,.25,0],[.12,.25,.85],[-.10,.245,.85],[-.22,.245,.45],[-.40,.31,0]],
};
function shell(style: keyof typeof profiles) {
  const rows = profiles[style], segments = 16, stride = 17, size = rows.length * stride;
  const p: number[] = [], indices: number[] = [];
  for (let inner = 0; inner < 2; inner++) for (const [y, radius, opening] of rows) {
    for (let column = 0; column <= segments; column++) {
      const a = opening + (Math.PI * 2 - opening * 2) * column / segments, r = Math.max(0, radius - inner * .018);
      p.push(Math.sin(a) * r, y, Math.cos(a) * r * .9);
    }
  }
  for (let inner = 0; inner < 2; inner++) for (let row = 0; row < rows.length - 1; row++) for (let column = 0; column < segments; column++) {
    const a = inner * size + row * stride + column, b = a + 1, c = a + stride, d = c + 1;
    if (inner) indices.push(a,b,c,b,d,c); else indices.push(a,c,b,b,c,d);
  }
  for (let row = 0; row < rows.length - 1; row++) for (const column of [0,segments]) {
    const a = row * stride + column, b = a + stride, c = a + size, d = b + size;
    if (!column) indices.push(a,c,b,b,c,d); else indices.push(a,b,c,b,d,c);
  }
  for (let col = 0; col < segments; col++) { const a = (rows.length - 1) * stride + col; indices.push(a,a+size,a+1,a+1,a+size,a+size+1); }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(p,3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
export function buildAvatar(config: AvatarConfig, seated = false) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color: string) => { if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .95, flatShading: true })); return materials.get(color)!; };
  function part(parent: THREE.Group, geometry: THREE.BufferGeometry, color: string, x=0,y=0,z=0) {
    const mesh = new THREE.Mesh(geometry, mat(color)); mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  const box = (parent: THREE.Group, dims: [number,number,number], color: string,x=0,y=0,z=0) => part(parent,new THREE.BoxGeometry(...dims),color,x,y,z);
  const width = config.presentation === 'f' ? .42 : .46, ink = '#292d28';
  box(body,[width,.53,.28],config.color,0,1.18);
  box(body,[.38,.18,.26],'#36413e',0,.91);
  box(body,[.12,.14,.12],config.skin,0,1.49);
  if (config.outfit === 'tunic') box(body,[width+.025,.19,.29],config.color,0,.92);
  if (config.outfit === 'blazer') box(body,[.12,.40,.012],'#e8e3d2',0,1.2,.149);
  box(body,[.06,.08,.008],'#ecebdf',.12,1.23,.15);
  const head = new THREE.Group(); head.position.y = 1.72; body.add(head);
  const face = part(head,config.head==='soft'?new THREE.SphereGeometry(.20,8,8):new THREE.CylinderGeometry(.20,.18,.38,8),config.skin);
  face.scale.set(config.presentation === 'f' ? .92 : 1,config.head==='soft'?1.05:1,.86);
  if (config.hair === 'short') {
    const cap = part(head,new THREE.SphereGeometry(.23,8,4,0,Math.PI*2,0,Math.PI/2),config.hairColor,0,.16); cap.scale.set(1,.65,.86);
  } else {
    part(head,shell(config.hair),config.hair === 'hijab' ? config.color : config.hairColor);
    if (config.hair === 'ponytail') { const tail = part(head,new THREE.SphereGeometry(.10,8,6),config.hairColor,0,.07,-.21); tail.scale.set(.85,1.9,.9); }
  }
  for (const side of [-1,1]) {
    const brow = box(head,[.075,.012,.010],config.hairColor,side*.068,.083,.18);
    if (config.brows === 'soft') brow.rotation.z = side * -.09;
    box(head,[config.eyes === 'dot' ? .017 : .025,config.eyes === 'dot' ? .021 : .012,.009],ink,side*.068,.015,.176);
    if (config.glasses) for (const edge of [-1,1]) {
      box(head,[.09,.007,.01],ink,side*.068,.015+edge*.035,.184);
      box(head,[.007,.07,.01],ink,side*.068+edge*.045,.015,.184);
    }
  }
  if (config.glasses) box(head,[.045,.007,.01],ink,0,.02,.187);
  box(head,[.03,.045,.025],config.skin,0,-.025,.18);
  box(head,[.045,.006,.008],'#694a3c',0,-.094,.17);
  for (const side of [-1,1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(side*(width/2+.045),1.405,0); body.add(shoulder);
    box(shoulder,[.145,.28,.18],config.color,0,-.14);
    const elbow = new THREE.Group(); elbow.position.y = -.28; shoulder.add(elbow);
    box(elbow,[.105,.235,.12],config.outfit === 'shirt' ? config.skin : config.color,0,-.118);
    box(elbow,[.105,.09,.12],config.skin,0,-.27);
    const hip = new THREE.Group(); hip.position.set(side*.105,.9,0); body.add(hip);
    box(hip,[.165,.42,.19],'#36413e',0,-.21);
    const knee = new THREE.Group(); knee.position.y = -.42; hip.add(knee);
    box(knee,[.145,.4,.16],'#36413e',0,-.2); box(knee,[.17,.085,.29],ink,0,-.425,.055);
    if (seated) { hip.rotation.x=-Math.PI/2; knee.rotation.x=Math.PI/2; shoulder.rotation.x=-1.12; elbow.rotation.x=-1.24; }
  }
  if (seated) body.position.y=-.28;
  return root;
}
export function disposeAvatar(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(o => { if (o instanceof THREE.Mesh) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m=>materials.add(m)); } });
  geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
}
