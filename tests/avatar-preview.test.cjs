const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '../avatar-preview.js');

function modelContext() {
  const shared = path.join(__dirname, '../character-model.js');
  const code = (fs.existsSync(shared) ? fs.readFileSync(shared, 'utf8') + '\n' : '') + fs.readFileSync(file, 'utf8');
  class Node {
    constructor(geometry, material) {
      this.geometry = geometry; this.material = material; this.children = []; this.isMesh = !!geometry;
      this.position = { x: 0, y: 0, z: 0, set(x,y,z) { Object.assign(this,{x,y,z}); }, copy(point) { Object.assign(this, { x: point.x, y: point.y, z: point.z }); } };
      this.rotation = { x: 0, y: 0, z: 0, set(x,y,z) { Object.assign(this,{x,y,z}); } };
      this.scale = { x: 1, y: 1, z: 1, set(x,y,z) { Object.assign(this,{x,y,z}); } };
    }
    add(...nodes) { this.children.push(...nodes); }
    traverse(fn) { fn(this); this.children.forEach(c => c.traverse(fn)); }
  }
  class Geometry { constructor(...args) { this.args = args; } }
  class BufferGeometry extends Geometry {
    constructor() { super(); this.attributes = {}; }
    setAttribute(name, value) { this.attributes[name] = value; }
    setIndex(indices) { this.index = { array: indices }; }
    computeVertexNormals() {}
  }
  const THREE = {
    Group: Node, Mesh: Node, BoxGeometry: Geometry, SphereGeometry: Geometry,
    CylinderGeometry: Geometry, PlaneGeometry: Geometry,
    BufferGeometry, Float32BufferAttribute: class { constructor(values, itemSize) { this.array = Float32Array.from(values); this.itemSize = itemSize; } },
    MeshStandardMaterial: class { constructor(options) { Object.assign(this, options); this.color = { value: options.color, convertSRGBToLinear() {} }; } },
    MeshBasicMaterial: class { constructor(options) { Object.assign(this, options); } }
  };
  const context = { THREE, module: { exports: {} } };
  vm.createContext(context); vm.runInContext(code, context);
  return { ...context.module.exports, evaluate: code => vm.runInContext(code, context) };
}

test('preview script parses and exposes model independently of browser', () => {
  assert.ok(fs.existsSync(file), 'avatar-preview.js has not been implemented');
  const { createCharacter, poseCharacter } = modelContext();
  assert.equal(typeof createCharacter, 'function');
  assert.equal(typeof poseCharacter, 'function');
});
test('character has articulated limbs with a restrained mesh budget', () => {
  const { createCharacter } = modelContext();
  const avatar = createCharacter();
  let meshes = 0;
  avatar.root.traverse(o => { if (o.geometry) meshes++; });
  assert.ok(meshes >= 15 && meshes <= 45, `mesh count ${meshes}`);
  for (const side of ['left', 'right']) {
    assert.ok(avatar[side + 'Arm'].shoulder);
    assert.ok(avatar[side + 'Arm'].elbow);
    assert.ok(avatar[side + 'Leg'].hip);
    assert.ok(avatar[side + 'Leg'].knee);
  }
});
test('standing, sitting and walking poses are reversible and finite', () => {
  const { createCharacter, poseCharacter } = modelContext();
  const avatar = createCharacter();
  poseCharacter(avatar, 'sit', 0);
  assert.ok(avatar.body.position.y < 0);
  assert.ok(avatar.leftLeg.hip.rotation.x < -1);
  poseCharacter(avatar, 'walk', 0.4);
  assert.notEqual(avatar.leftLeg.hip.rotation.x, avatar.rightLeg.hip.rotation.x);
  poseCharacter(avatar, 'stand', 0);
  assert.equal(avatar.body.position.y, 0);
  assert.equal(avatar.leftLeg.hip.rotation.x, 0);
  assert.equal(avatar.leftLeg.knee.rotation.x, 0);
  avatar.root.traverse(o => {
    for (const axis of ['x', 'y', 'z']) assert.ok(Number.isFinite(o.rotation[axis]));
  });
});
test('seated hands clear the desktop and reach the keyboard edge', () => {
  const { createCharacter, poseCharacter } = modelContext();
  const avatar = createCharacter();
  for (const time of [0, 0.2, 0.8, 1.5]) {
    poseCharacter(avatar, 'sit', time);
    for (const side of ['left', 'right']) {
      const arm = avatar[side + 'Arm'];
      const shoulderAngle = arm.shoulder.rotation.x;
      const forearmAngle = shoulderAngle + arm.elbow.rotation.x;
      const handY = avatar.body.position.y + arm.shoulder.position.y
        - 0.28 * Math.cos(shoulderAngle) - 0.27 * Math.cos(forearmAngle);
      const handZ = -0.28 * Math.sin(shoulderAngle) - 0.27 * Math.sin(forearmAngle);
      assert.ok(handY - 0.045 > 1.115, `${side} hand must not penetrate tabletop: ${handY}`);
      assert.ok(handZ >= 0.43 && handZ <= 0.79, `${side} hand should reach keyboard: ${handZ}`);
    }
  }
});
test('eyebrows are two thin separate shapes, not a joined forehead bar', () => {
  const { createCharacter } = modelContext();
  const avatar = createCharacter();
  const brows = avatar.head.children.filter(o => o.geometry && o.geometry.args[1] === 0.012);
  assert.equal(brows.length, 2);
  const [left, right] = brows.sort((a, b) => a.position.x - b.position.x);
  assert.ok(left.position.x + left.geometry.args[0] / 2 < right.position.x - right.geometry.args[0] / 2);
  assert.ok(!avatar.head.children.some(o => o.geometry && o.geometry.args[0] === 0.29 && o.geometry.args[1] === 0.065));
});
test('long hair crown, sides and back are one connected mesh', () => {
  const { createCharacter } = modelContext();
  const avatar = createCharacter({ g: 'f', hair: 'panjang', glasses: false });
  const hair = avatar.head.children.filter(o => o.name === 'hair');
  assert.equal(hair.length, 1, 'one shared-vertex curved shell, without separate blocks');
  assertConnectedShell(hair[0].geometry, -0.28);
});
test('hijab is a continuous head-to-shoulder shell with an unobstructed face opening', () => {
  const { createCharacter } = modelContext();
  const avatar = createCharacter({ g: 'f', hair: 'hijab', hijab: 0x9c4f6e });
  assert.equal(avatar.body.children.filter(o => o.name === 'hijab').length, 0, 'separate torso drape can disconnect when the head turns');
  const cloth = avatar.head.children.filter(o => o.name === 'hijab');
  assert.equal(cloth.length, 1);
  assertConnectedShell(cloth[0].geometry, -0.37);
});
test('female ponytail uses a connected face-framing shell rather than the male short cap', () => {
  const { createCharacter } = modelContext();
  const avatar = createCharacter({ g: 'f', hair: 'kuncir' });
  const pieces = avatar.head.children.filter(o => o.name === 'hair');
  const shell = pieces.find(o => o.geometry.attributes);
  const ponytail = pieces.find(o => !o.geometry.attributes);
  assert.ok(shell && ponytail);
  assertConnectedShell(shell.geometry, -0.15);
  assert.ok(ponytail.position.y + 0.10 * ponytail.scale.y > 0.19);
  assert.ok(ponytail.position.z + 0.10 * ponytail.scale.z > -0.20, 'tail root must reach the back of the shell');
  assert.equal(avatar.look.g, 'f');
});
test('custom hair geometry is reused across appearances and repeated workspace loads', () => {
  const { createCharacter } = modelContext();
  const cache = new Map();
  const resources = { customGeometry(key, build) { if (!cache.has(key)) cache.set(key, build()); return cache.get(key); } };
  for (const style of ['panjang', 'kuncir', 'hijab']) {
    const first = createCharacter({ g: 'f', hair: style, hijab: 0xe8b04b }, resources);
    const second = createCharacter({ g: 'f', hair: style, hijab: 0x9c4f6e }, resources);
    const shell = avatar => avatar.head.children.find(o => o.geometry && o.geometry.attributes);
    assert.equal(shell(first).geometry, shell(second).geometry);
  }
  assert.equal(cache.size, 3);
});

function assertConnectedShell(geometry, minimumY) {
  const p = geometry.attributes.position.array, indices = geometry.index.array;
  const vertices = p.length / 3, adjacency = Array.from({ length: vertices }, () => []);
  let bottom = Infinity, top = -Infinity;
  for (let i = 0; i < p.length; i += 3) { bottom = Math.min(bottom, p[i + 1]); top = Math.max(top, p[i + 1]); }
  assert.ok(bottom <= minimumY && top >= 0.24);
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = indices.slice(i, i + 3);
    for (const index of triangle) {
      assert.ok(index >= 0 && index < vertices);
      adjacency[index].push(...triangle);
    }
  }
  const seen = new Set(), queue = [0];
  while (queue.length) { const v = queue.pop(); if (seen.has(v)) continue; seen.add(v); queue.push(...adjacency[v].filter(n => !seen.has(n))); }
  assert.equal(seen.size, vertices, 'all surface vertices must be connected');
  // Front edge at eye level stays outside both eyes; the upper crown covers the scalp.
  const eyeLevel = [];
  for (let i = 0; i < p.length; i += 3) if (Math.abs(p[i + 1] - 0.12) < 0.001 && p[i + 2] > 0.12) eyeLevel.push(Math.abs(p[i]));
  assert.ok(eyeLevel.length > 0 && Math.min(...eyeLevel) > 0.14);
}
test('shared character model supports the identities of the entire office roster', () => {
  assert.ok(fs.existsSync(path.join(__dirname, '../character-model.js')), 'shared character model is missing');
  const { createCharacter } = modelContext();
  const variants = [
    { g: 'f', hair: 'hijab', hijab: 0xe8b04b, top: 'tunik', topCol: 0xc8553d },
    { g: 'm', hair: 'tipis', hairCol: 0x8d8a85, top: 'batik', glasses: true, mustache: true, belly: true },
    { g: 'f', hair: 'panjang', top: 'kemeja', topCol: 0xe8b04b },
    { g: 'm', hair: 'acak', top: 'polo', glasses: true },
    { g: 'f', hair: 'hijab', hijab: 0x9c4f6e, top: 'blazer' },
    { g: 'm', hair: 'cepak', top: 'kemeja-pendek' },
    { g: 'f', hair: 'kuncir', top: 'kemeja' }
  ];
  for (const look of variants) {
    const avatar = createCharacter(look);
    const names = [], meshes = [];
    avatar.root.traverse(o => { names.push(o.name); if (o.geometry) meshes.push(o); });
    assert.ok(names.includes(look.hair === 'hijab' ? 'hijab' : 'hair'));
    assert.equal(names.includes('glasses'), !!look.glasses);
    assert.equal(names.includes('mustache'), !!look.mustache);
    if (look.top === 'batik') assert.ok(names.includes('batik'));
    assert.ok(meshes.length <= 55, `${look.hair}/${look.top}: too many meshes (${meshes.length})`);
    assert.equal(avatar.eyes.length, 2);
    assert.ok(avatar.mouth);
  }
});
test('office factory and typing IK work for every default look and seeded recruits', () => {
  const { evaluate } = modelContext();
  const html = fs.readFileSync(path.join(__dirname, '../kantor-sim.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const looks = script.slice(script.indexOf('const LOOKS ='), script.indexOf('function createAgentModel('));
  const factory = script.slice(script.indexOf('function createAgentModel('), script.indexOf('// 7. NAVIGASI'));
  const poses = script.slice(script.indexOf('const HIP_SEAT_Y ='), script.indexOf('function setChair('));
  evaluate(`
    const scene = new THREE.Group(), clickableMeshes = [], geometryCache = new Map();
    const deskSlots = [{ seatPos: { x: 0, y: 0, z: 0.88 }, chairRotY: Math.PI }];
    const sharedGeometry = (type, ...args) => new THREE[type](...args);
    function setChair() {}
    ${looks}
    ${factory}
    ${poses}
  `);
  for (const name of ['Rina', 'Pak Darto', 'Sari', 'Budi', 'Dewi', 'Joko', 'Maya']) {
    const ag = evaluate(`createAgentModel({ id: ${JSON.stringify(name)}, name: ${JSON.stringify(name)}, color: '#c8553d', deskIndex: 0, mood: 70 })`);
    assert.equal(ag.mesh.name, 'low-poly-character');
    assert.equal(ag.eyes.length, 2);
    assert.equal(ag.mesh.userData.name, name);
    for (const side of ['left', 'right']) {
      const arm = ag[side + 'Arm'];
      const sh = arm.shoulder.rotation.x, el = arm.elbow.rotation.x, roll = arm.shoulder.rotation.z;
      const handY = ag.bodyGroup.position.y + arm.shoulder.position.y
        - 0.28 * Math.cos(roll) * Math.cos(sh)
        - 0.27 * Math.cos(el) * Math.cos(roll) * Math.cos(sh)
        + 0.27 * Math.sin(el) * Math.sin(sh);
      assert.ok(handY - 0.045 >= 1.14, `${name}/${side} hand penetrates desk: ${handY}`);
      assert.ok(handY < 1.25, `${name}/${side} hand floats too high: ${handY}`);
      let lowest = Infinity;
      for (const x of [-0.0525, 0.0525]) for (const y of [-0.315, -0.225]) for (const z of [-0.06, 0.06]) {
        const elbowY = y * Math.cos(el) - z * Math.sin(el);
        const elbowZ = y * Math.sin(el) + z * Math.cos(el);
        const worldY = ag.bodyGroup.position.y + arm.shoulder.position.y
          - 0.28 * Math.cos(roll) * Math.cos(sh)
          + (x * Math.sin(roll) + elbowY * Math.cos(roll)) * Math.cos(sh) - elbowZ * Math.sin(sh);
        lowest = Math.min(lowest, worldY);
      }
      assert.ok(lowest >= 1.16, `${name}/${side} full hand geometry clips the keyboard: ${lowest}`);
    }
  }
  for (const name of ['Budi', 'Pak Darto', 'Joko', 'Maya']) {
    const appearance = evaluate(`lookFor({ id: 'new-woman', name: ${JSON.stringify(name)}, gender: 'f', color: '#c8553d' })`);
    assert.equal(appearance.g, 'f', `explicit female selection must override the preset name ${name}`);
  }
});
