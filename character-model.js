'use strict';

// Shared by the office and the approved preview. +Z is the character's face.
const OfficeCharacters = (() => {
  // Each row is [height, radius, front-opening half-angle]. Adjacent rows share
  // vertices: crown, sides and back are a single continuous surface, not blocks.
  const SHELL_PROFILES = {
    panjang: [[0.29, 0, 0], [0.25, 0.15, 0], [0.19, 0.225, 0], [0.16, 0.24, 0], [0.12, 0.235, 0.80], [-0.10, 0.225, 0.80], [-0.30, 0.23, 0.80]],
    kuncir: [[0.29, 0, 0], [0.25, 0.15, 0], [0.19, 0.225, 0], [0.16, 0.24, 0], [0.12, 0.235, 0.80], [-0.10, 0.225, 0.80], [-0.16, 0.22, 0.80]],
    hijab: [[0.30, 0, 0], [0.255, 0.16, 0], [0.19, 0.235, 0], [0.16, 0.25, 0], [0.12, 0.25, 0.85], [-0.10, 0.245, 0.85], [-0.22, 0.245, 0.45], [-0.40, 0.31, 0]]
  };
  function buildShell(style) {
    const profile = SHELL_PROFILES[style], segments = 16, stride = segments + 1;
    const surfaceSize = profile.length * stride, positions = [], indices = [];
    const thickness = 0.018;
    for (let inner = 0; inner < 2; inner++) {
      for (const [height, radius, opening] of profile) {
        const r = Math.max(0, radius - inner * thickness);
        for (let column = 0; column <= segments; column++) {
          const angle = opening + (Math.PI * 2 - opening * 2) * column / segments;
          positions.push(Math.sin(angle) * r, height, Math.cos(angle) * r * 0.9);
        }
      }
    }
    for (let inner = 0; inner < 2; inner++) {
      const offset = inner * surfaceSize;
      for (let row = 0; row < profile.length - 1; row++) for (let column = 0; column < segments; column++) {
        const a = offset + row * stride + column, b = a + 1, c = a + stride, d = c + 1;
        if (inner) indices.push(a, b, c, b, d, c);
        else indices.push(a, c, b, b, c, d);
      }
    }
    // Thickness closes both edges of the face opening and the bottom hem.
    for (let row = 0; row < profile.length - 1; row++) for (const column of [0, segments]) {
      const a = row * stride + column, b = a + stride, c = a + surfaceSize, d = b + surfaceSize;
      if (column === 0) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
    const bottom = (profile.length - 1) * stride;
    for (let column = 0; column < segments; column++) {
      const a = bottom + column, b = a + 1, c = a + surfaceSize, d = b + surfaceSize;
      indices.push(a, c, b, b, c, d);
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    result.setIndex(indices); result.computeVertexNormals();
    return result;
  }

  function createCharacter(appearance = {}, resources = {}) {
    const look = Object.assign({
      g: 'm', skin: 0xb98360, top: 'polo', topCol: 0x376653,
      pants: 0x36413e, hair: 'pendek', hairCol: 0x292e28,
      hijab: 0x376653, glasses: true
    }, appearance);
    // Explicit looks do not inherit Budi's glasses unless requested.
    if (Object.keys(appearance).length && appearance.glasses == null) look.glasses = false;
    const root = new THREE.Group(), body = new THREE.Group();
    root.name = 'low-poly-character'; body.name = 'body'; root.add(body);
    const materials = new Map(), geometries = new Map();
    const material = color => {
      if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true }));
      return materials.get(color);
    };
    function geometry(type, ...args) {
      if (resources.geometry) return resources.geometry(type, ...args);
      const key = type + ':' + JSON.stringify(args);
      if (!geometries.has(key)) geometries.set(key, new THREE[type](...args));
      return geometries.get(key);
    }
    function shellGeometry(style) {
      const key = 'character-shell:' + style;
      if (resources.customGeometry) return resources.customGeometry(key, () => buildShell(style));
      if (!geometries.has(key)) geometries.set(key, buildShell(style));
      return geometries.get(key);
    }
    function mesh(parent, geo, color, x = 0, y = 0, z = 0, name = '') {
      const part = new THREE.Mesh(geo, material(color));
      part.position.set(x, y, z); part.name = name;
      part.castShadow = true; part.receiveShadow = true;
      parent.add(part); return part;
    }
    const box = (parent, dims, color, x, y, z, name) => mesh(parent, geometry('BoxGeometry', ...dims), color, x, y, z, name);
    const skin = look.skin, shirt = look.topCol, trousers = look.pants, hair = look.hairCol, ink = 0x292d28;
    const female = look.g === 'f';
    const width = look.belly ? 0.52 : female ? 0.42 : 0.46;
    const depth = look.belly ? 0.36 : 0.28, front = depth / 2;
    box(body, [width, 0.53, depth], shirt, 0, 1.18, 0, 'shirt');
    box(body, [0.38, 0.18, 0.26], trousers, 0, 0.91, 0, 'trousers');
    box(body, [0.12, 0.14, 0.12], skin, 0, 1.49, 0);
    if (look.top === 'tunik') box(body, [width + 0.025, 0.19, depth + 0.015], shirt, 0, 0.92, 0, 'tunic');
    if (look.top === 'blazer') {
      box(body, [0.14, 0.40, 0.012], 0xe8e3d2, 0, 1.20, front + 0.008, 'blazer');
      for (const sign of [-1, 1]) {
        const lapel = box(body, [0.045, 0.27, 0.018], shirt, sign * 0.07, 1.28, front + 0.022);
        lapel.rotation.z = sign * 0.16;
      }
    }
    if (look.top === 'batik') {
      for (const x of [-0.12, 0.12]) for (const y of [1.03, 1.18, 1.33]) {
        const motif = box(body, [0.038, 0.038, 0.006], 0xc7a06a, x, y, front + 0.004, 'batik');
        motif.rotation.z = Math.PI / 4;
      }
    }
    box(body, [0.065, 0.085, 0.009], 0xe7e5d8, 0.13, 1.23, front + 0.006, 'badge');

    const head = new THREE.Group(); head.name = 'head'; head.position.y = 1.72; body.add(head);
    const headMesh = mesh(head, geometry('CylinderGeometry', 0.20, 0.18, 0.38, 8), skin, 0, 0, 0, 'face');
    headMesh.scale.x = female ? 0.92 : 1;
    headMesh.scale.z = 0.86;
    if (look.hair === 'hijab') {
      mesh(head, shellGeometry('hijab'), look.hijab, 0, 0, 0, 'hijab');
    } else if (look.hair === 'panjang' || look.hair === 'kuncir') {
      mesh(head, shellGeometry(look.hair), hair, 0, 0, 0, 'hair');
      if (look.hair === 'kuncir') {
        const ponytail = mesh(head, geometry('SphereGeometry', 0.10, 8, 6), hair, 0, 0.07, -0.21, 'hair');
        ponytail.scale.set(0.85, 1.9, 0.9);
      }
    } else {
      const cap = mesh(head, geometry('SphereGeometry', 0.23, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), hair, 0, 0.16, 0, 'hair');
      cap.scale.set(1, look.hair === 'cepak' || look.hair === 'tipis' ? 0.38 : 0.65, 0.86);
      if (look.hair === 'acak') cap.rotation.z = 0.06;
    }
    const eyes = [];
    for (const side of [-1, 1]) {
      if (look.hair !== 'hijab') box(head, [0.035, 0.075, 0.065], skin, side * 0.19, -0.02, 0);
      box(head, [0.075, 0.012, 0.01], look.hair === 'hijab' ? ink : hair, side * 0.068, 0.083, 0.18, 'eyebrow');
      const eye = new THREE.Group(); eye.name = 'eye'; eye.position.set(side * 0.068, 0.015, 0.176); head.add(eye);
      box(eye, [0.017, 0.021, 0.009], ink, 0, 0, 0); eyes.push(eye);
      if (look.glasses) for (const edge of [-1, 1]) {
        box(head, [0.09, 0.007, 0.01], ink, side * 0.068, 0.015 + edge * 0.035, 0.184, 'glasses');
        box(head, [0.007, 0.07, 0.01], ink, side * 0.068 + edge * 0.045, 0.015, 0.184, 'glasses');
      }
    }
    if (look.glasses) box(head, [0.045, 0.007, 0.01], ink, 0, 0.02, 0.187, 'glasses');
    box(head, [0.03, 0.045, 0.025], skin, 0, -0.025, 0.18);
    const mouth = box(head, [0.045, 0.006, 0.008], 0x694a3c, 0, -0.094, 0.17, 'mouth');
    if (look.mustache) box(head, [0.073, 0.018, 0.012], hair, 0, -0.065, 0.179, 'mustache');

    function arm(side) {
      const shoulder = new THREE.Group(); shoulder.position.set(side * (width / 2 + 0.045), 1.405, 0); body.add(shoulder);
      box(shoulder, [0.145, 0.28, 0.18], shirt, 0, -0.14, 0);
      const elbow = new THREE.Group(); elbow.position.y = -0.28; shoulder.add(elbow);
      const shortSleeve = look.top === 'polo' || look.top === 'kemeja-pendek';
      box(elbow, [0.105, 0.235, 0.12], shortSleeve ? skin : shirt, 0, -0.118, 0);
      box(elbow, [0.105, 0.09, 0.12], skin, 0, -0.27, 0);
      return { shoulder, elbow };
    }
    function leg(side) {
      const hip = new THREE.Group(); hip.position.set(side * 0.105, 0.9, 0); body.add(hip);
      box(hip, [0.165, 0.42, 0.19], trousers, 0, -0.21, 0);
      const knee = new THREE.Group(); knee.position.y = -0.42; hip.add(knee);
      box(knee, [0.145, 0.40, 0.16], trousers, 0, -0.20, 0);
      box(knee, [0.17, 0.085, 0.29], 0x292e2a, 0, -0.425, 0.055);
      return { hip, knee };
    }
    const leftArm = arm(-1), rightArm = arm(1), leftLeg = leg(-1), rightLeg = leg(1);
    // Tiny face details do not need their own shadow silhouettes.
    head.traverse(part => { if (part.geometry && part !== headMesh && part.name !== 'hair' && part.name !== 'hijab') part.castShadow = false; });
    return { root, body, head, eyes, mouth, leftArm, rightArm, leftLeg, rightLeg, look };
  }

  function poseCharacter(avatar, mode, time) {
    const sitting = mode === 'sit', walking = mode === 'walk';
    const swing = walking ? Math.sin(time * 6) : 0;
    avatar.body.position.y = sitting ? -0.28 : walking ? Math.abs(Math.sin(time * 6)) * 0.015 : 0;
    avatar.head.rotation.set(0, 0, 0);
    for (const [side, sign] of [['left', 1], ['right', -1]]) {
      const arm = avatar[side + 'Arm'], leg = avatar[side + 'Leg'];
      leg.hip.rotation.x = sitting ? -Math.PI / 2 : swing * 0.4 * sign;
      leg.knee.rotation.x = sitting ? Math.PI / 2 : Math.max(0, -swing * sign) * 0.5;
      arm.shoulder.rotation.set(sitting ? -1.12 : -swing * 0.32 * sign, 0, -sign * 0.035);
      arm.elbow.rotation.x = sitting ? -1.24 + Math.sin(time * 8 + sign) * 0.025 : -0.08;
    }
  }

  return { createCharacter, poseCharacter };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = OfficeCharacters;
