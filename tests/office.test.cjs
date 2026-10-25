const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../kantor-sim.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

test('inline JavaScript parses', () => { new vm.Script(script); });
test('default workspace is branded Nusaiba without breaking its existing config ID', () => {
  assert.match(html, /<title>Nusaiba · Workspace<\/title>/);
  assert.match(script, /id: 'kantor-sejati', name: 'Nusaiba'/);
  assert.doesNotMatch(html, /Kantor Sejati/);
});
test('office loads the approved shared low-poly character library', () => {
  assert.match(html, /<script src="character-model.js"><\/script>/);
  const factory = script.slice(script.indexOf('function createAgentModel('), script.indexOf('// 7. NAVIGASI'));
  assert.match(factory, /OfficeCharacters.createCharacter\(L/);
  assert.doesNotMatch(factory, /SphereGeometry\(0\.17, 24, 20\)/);
});
test('floor and desk plants have leaf roots embedded in the soil', () => {
  class Group {
    constructor() {
      this.children = [];
      this.position = { x: 0, y: 0, z: 0 };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.scale = { set(x, y, z) { Object.assign(this, { x, y, z }); } };
    }
    add(child) { this.children.push(child); }
  }
  class Mesh extends Group { constructor(geometry) { super(); this.geometry = geometry; } }
  const context = {
    THREE: { Group, Mesh, CylinderGeometry: class {}, CircleGeometry: class {} },
    plantMat: () => ({}), sharedGeometry: () => ({ leaf: true })
  };
  vm.createContext(context);
  const start = script.indexOf('function makePlant(');
  const end = script.indexOf('function createWorkstation(', start);
  vm.runInContext(script.slice(start, end), context);
  for (const size of ['floor', 'desk']) {
    const plant = vm.runInContext(`makePlant('${size}')`, context);
    const soil = plant.children[2];
    const pivots = plant.children.slice(3);
    assert.ok(pivots.length >= 10);
    for (const pivot of pivots) {
      const lean = pivot.children[0], leaf = lean.children[0];
      const rootY = pivot.position.y + Math.cos(lean.rotation.x) * (leaf.position.y - leaf.scale.y);
      assert.ok(rootY <= soil.position.y, `${size} leaf root ${rootY} floats above soil ${soil.position.y}`);
      assert.ok(pivot.position.y + Math.cos(lean.rotation.x) * (leaf.position.y + leaf.scale.y) > soil.position.y);
    }
  }
});
test('screen artwork has no dark top/left bands that look like uneven bezel margins', () => {
  const rectangles = [], labels = [];
  const ctx = { fillRect(...args) { rectangles.push(args); }, fillText(...args) { labels.push(args); } };
  const canvas = { getContext: () => ctx };
  const context = { document: { createElement: () => canvas }, THREE: { CanvasTexture: class {} } };
  vm.createContext(context);
  const start = script.indexOf('function generateScreenTexture(');
  const end = script.indexOf('// 1.4', start);
  vm.runInContext(script.slice(start, end) + "\ngenerateScreenTexture('kas.xlsx');", context);
  assert.deepEqual(rectangles, [[0, 0, 512, 320]], 'screen must have one edge-to-edge background, not editor chrome along top and left');
  assert.ok(labels.some(([text]) => text === 'kas.xlsx'));
  assert.ok(labels.some(([text]) => text.includes('Kas kecil')));
});
test('laptop display stays centered on the tilted bezel with uniform margins', () => {
  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry; this.material = material;
      this.position = { x: 0, y: 0, z: 0, set(x, y, z) { Object.assign(this, { x, y, z }); } };
      this.rotation = { x: 0, y: 0, z: 0 };
    }
    add(child) { child.parent = this; }
  }
  const geometry = class { constructor(width, height, depth) { this.parameters = { width, height, depth }; } };
  const context = { THREE: { Mesh, BoxGeometry: geometry, PlaneGeometry: geometry, MeshBasicMaterial: class {} }, laptopBodyMat: {}, screenTexture: {}, laptop: new Mesh() };
  vm.createContext(context);
  const start = script.indexOf('const screenBezel =');
  const end = script.indexOf('ws.add(laptop);', start);
  vm.runInContext(script.slice(start, end), context);
  assert.equal(vm.runInContext('screenDisplay.parent === screenBezel', context), true, 'display must inherit bezel tilt, not use an independently offset plane');
  assert.equal(vm.runInContext('screenDisplay.position.x', context), 0);
  assert.equal(vm.runInContext('screenDisplay.position.y', context), 0);
  assert.equal(vm.runInContext('screenDisplay.rotation.x', context), 0);
  assert.ok(vm.runInContext('screenDisplay.position.z > screenBezel.geometry.parameters.depth / 2', context));
  const margins = vm.runInContext('[(screenBezel.geometry.parameters.width-screenDisplay.geometry.parameters.width)/2,(screenBezel.geometry.parameters.height-screenDisplay.geometry.parameters.height)/2]', context);
  assert.ok(Math.abs(margins[0] - margins[1]) < 1e-10);
});
test('clock panel contains time/day but no workspace selector or count', () => {
  const panel = html.match(/<div class="paper brand">([\s\S]*?)<div class="paper tools">/)[1];
  assert.match(panel, /id="sim-clock"/);
  assert.match(panel, /id="sim-day"/);
  assert.doesNotMatch(panel, /ws-select|agent-count-badge/);
});
test('lighting control is icon-only with an accessible label and pressed state', () => {
  const control = html.match(/<button[^>]*id="lighting-toggle"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(control, 'lighting toggle needs a stable identity');
  assert.match(control[0], /aria-label="Aktifkan mode lembur"/);
  assert.match(control[0], /aria-pressed="false"/);
  assert.match(control[0], /aria-hidden="true">☀<\/span>/);
  assert.match(control[0], /aria-hidden="true">☾<\/span>/);
  assert.doesNotMatch(control[0], />[^<]*(Sore|Lembur)/);
});
test('team portraits are compact and not zoomed', () => {
  const chip = html.match(/\.chip \{([^}]+)\}/)[1];
  assert.match(chip, /width: 24px/);
  assert.match(chip, /height: 24px/);
  assert.doesNotMatch(chip, /150%/);
});
test('team panel matches header height and leaves room around avatar rings', () => {
  const panel = html.match(/#roster-bar \{([^}]+)\}/)[1];
  assert.match(panel, /height: var\(--bar-h\)/);
  const height = Number(html.match(/--bar-h: (\d+)px/)[1]);
  const avatar = Number(html.match(/\.chip \{[^}]*width: (\d+)px/)[1]);
  assert.ok((height - 2 - avatar - 4) / 2 >= 7, 'at least 7px vertical clearance outside the avatar ring and panel border');
});
test('render budget excludes laptop lights', () => {
  assert.match(script, /setPixelRatio\(Math.min\(window.devicePixelRatio, 1\.5\)\)/);
  assert.match(script, /shadow.mapSize.width = 1024/);
  assert.doesNotMatch(script, /const screenGlow/);
});
test('animation has throttled bubbles and visibility lifecycle', () => {
  assert.match(script, /now - lastBubbleTime >= 50/);
  assert.match(script, /visibilitychange/);
  assert.match(script, /cancelAnimationFrame\(animationFrame\)/);
});
test('first frame cannot move simulation time backwards after slow initialization', () => {
  const dt = script.match(/const dt = ([^;]+);/)[1];
  assert.equal(vm.runInNewContext(dt, { now: 1000, prevTime: 7000 }), 0);
});
test('hidden tab cancels animation and resumes only one loop', () => {
  const start = script.indexOf('let prevTime =');
  const end = script.indexOf('function animate(now)', start);
  let handler, scheduled = 0, cancelled;
  const context = {
    document: { hidden: false, addEventListener(event, fn) { handler = fn; } },
    performance: { now: () => 500 },
    animate() {},
    requestAnimationFrame() { return ++scheduled; },
    cancelAnimationFrame(id) { cancelled = id; }
  };
  vm.createContext(context);
  vm.runInContext(script.slice(start, end) + '\nanimationStarted = true; animationFrame = 7;', context);
  context.document.hidden = true;
  handler();
  assert.equal(cancelled, 7);
  assert.equal(vm.runInContext('animationFrame', context), null);
  context.document.hidden = false;
  handler(); handler();
  assert.equal(scheduled, 1);
  assert.equal(vm.runInContext('prevTime', context), 500);
});
test('geometry cache returns the same resource for equal parameters', () => {
  const start = script.indexOf('const geometryCache =');
  assert.notEqual(start, -1, 'geometry cache is missing');
  const end = script.indexOf('// 1.1', start);
  const context = { THREE: { BoxGeometry: class { constructor(...args) { this.args = args; } } } };
  vm.createContext(context);
  vm.runInContext(script.slice(start, end), context);
  assert.equal(vm.runInContext("sharedGeometry('BoxGeometry', 1, 2, 3) === sharedGeometry('BoxGeometry', 1, 2, 3)", context), true);
  assert.equal(vm.runInContext("sharedGeometry('BoxGeometry', 1) === sharedGeometry('BoxGeometry', 2)", context), false);
});
test('workspace cleanup releases removed resources and preserves shared ones', () => {
  const start = script.indexOf('function disposeRemovedGroups(');
  assert.notEqual(start, -1);
  const end = script.indexOf('function layoutDesks(', start);
  const resource = () => ({ disposed: 0, dispose() { this.disposed++; } });
  const shared = resource(), removed = resource(), texture = { ...resource(), isTexture: true }, cached = resource();
  const material = { ...resource(), map: texture };
  const group = objects => ({ traverse(fn) { objects.forEach(fn); } });
  const context = { scene: group([{ geometry: shared }]), geometryCache: new Map([['cached', cached]]) };
  vm.createContext(context);
  vm.runInContext(script.slice(start, end), context);
  context.groups = [group([{ geometry: shared, material }, { geometry: removed }, { geometry: cached, material }])];
  vm.runInContext('disposeRemovedGroups(groups)', context);
  assert.equal(shared.disposed, 0);
  assert.equal(cached.disposed, 0);
  assert.equal(removed.disposed, 1);
  assert.equal(material.disposed, 1);
  assert.equal(texture.disposed, 1);
  assert.match(script, /disposeRemovedGroups\(removedGroups\)/);
});
