'use strict';

const { createCharacter, poseCharacter } = OfficeCharacters;

if (typeof module !== 'undefined' && module.exports) module.exports = { createCharacter, poseCharacter };
if (typeof document !== 'undefined') {
  try { startPreview(); }
  catch (error) {
    const notice = document.getElementById('error');
    notice.hidden = false;
    notice.textContent = 'Preview tidak bisa dimuat. Pastikan WebGL aktif dan koneksi ke CDN tersedia. ' + error.message;
  }
}

function startPreview() {
  const stage = document.getElementById('stage');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe9e9e0);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Model Budi low-poly, putar dengan drag');
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 40);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.minDistance = 1.1; controls.maxDistance = 11;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa2a893, 0.7));
  const light = new THREE.DirectionalLight(0xfff8ee, 0.7);
  light.position.set(-3, 6, 5); light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.1, far: 20 });
  light.shadow.normalBias = 0.025; scene.add(light);
  const propMaterials = new Map();
  function prop(parent, dims, color, x, y, z) {
    if (!propMaterials.has(color)) propMaterials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dims), propMaterials.get(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  prop(scene, [5.8, 0.12, 4.5], 0xd1c9b3, 0.5, -0.1, 0.4);
  prop(scene, [5.8, 2.7, 0.10], 0xdedfd3, 0.5, 1.22, -1.8);
  prop(scene, [0.10, 2.7, 4.5], 0xdedfd3, -2.35, 1.22, 0.4);
  const desk = new THREE.Group(); scene.add(desk);
  prop(desk, [1.65, 0.07, 0.75], 0xb59c72, 0, 1.08, 0.72);
  for (const x of [-0.7, 0.7]) prop(desk, [0.055, 1.05, 0.055], 0x556053, x, 0.525, 0.72);
  prop(desk, [0.52, 0.025, 0.34], 0x555d56, 0, 1.13, 0.62);
  const lid = prop(desk, [0.52, 0.32, 0.025], 0x555d56, 0, 1.3, 0.77); lid.rotation.x = 0.15;
  prop(lid, [0.47, 0.27, 0.003], 0xc0cbb8, 0, 0, -0.014);
  const chair = new THREE.Group(); scene.add(chair);
  prop(chair, [0.58, 0.08, 0.54], 0x566950, 0, 0.55, 0);
  prop(chair, [0.55, 0.55, 0.075], 0x566950, 0, 0.86, -0.26);
  prop(chair, [0.06, 0.5, 0.06], 0x556053, 0, 0.25, 0);
  prop(chair, [0.5, 0.04, 0.38], 0x556053, 0, 0.02, 0);
  const plant = new THREE.Group(); plant.position.set(-1.65, 0, -1.05); scene.add(plant);
  prop(plant, [0.38, 0.4, 0.38], 0xb4ad96, 0, 0.2, 0);
  const leafGeo = new THREE.ConeGeometry(0.18, 0.8, 5);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x728467, roughness: 1, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat); leaf.position.set((i - 1) * 0.1, 0.7, 0);
    leaf.rotation.z = (i - 1) * 0.25; plant.add(leaf);
  }
  const avatar = createCharacter(); scene.add(avatar.root);
  // Hex palette is authored in sRGB; lighting calculations need linear colors.
  const converted = new Set();
  scene.traverse(object => {
    if (object.material && !converted.has(object.material)) {
      object.material.color.convertSRGBToLinear();
      converted.add(object.material);
    }
  });
  let mode = 'stand', view = 'room';
  function setView(next) {
    view = next;
    const headY = mode === 'sit' ? 1.44 : 1.72;
    if (view === 'portrait') { camera.position.set(0.55, headY + 0.10, 1.85); controls.target.set(0, headY - 0.03, 0); }
    else { camera.position.set(3.8, 2.8, 5.6); controls.target.set(0.35, 0.95, 0.25); }
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    controls.update();
  }
  function setPose(next) {
    mode = next;
    desk.position.x = chair.position.x = mode === 'sit' ? 0 : 1.55;
    document.querySelectorAll('[data-pose]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pose === mode)));
    document.getElementById('pose-status').textContent = {
      stand: 'Berdiri · tinggi karakter sekitar 1,9 m', sit: 'Duduk · pose mengetik di meja', walk: 'Jalan di tempat · studi gerak tangan dan kaki'
    }[mode];
    poseCharacter(avatar, mode, 0);
    if (view === 'portrait') setView(view);
  }
  document.querySelectorAll('[data-pose]').forEach(button => button.addEventListener('click', () => setPose(button.dataset.pose)));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
  }
  new ResizeObserver(resize).observe(stage);
  resize(); setPose('stand'); setView('room');
  let frame = null;
  function animate(now) {
    if (document.hidden) { frame = null; return; }
    poseCharacter(avatar, mode, now / 1000);
    controls.update(); renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = null; }
    else if (frame === null) frame = requestAnimationFrame(animate);
  });
  if (!document.hidden) frame = requestAnimationFrame(animate);
}
