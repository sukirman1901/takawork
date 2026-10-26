const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../kantor-sim.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('overview framing widens on narrow screens without exceeding camera limits or resetting user orbit on resize', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(functionSource('overviewFraming'), context);
  const desktop = context.overviewFraming(16 / 9);
  const phone = context.overviewFraming(320 / 568);
  assert.equal(desktop.fov, 42);
  assert.equal(desktop.distance, 1);
  assert.ok(phone.fov > desktop.fov && phone.fov <= 60);
  assert.ok(phone.distance > 1 && phone.distance <= 1.28);
  assert.ok(Number.isFinite(context.overviewFraming(0).fov));
  assert.match(script, /const compact = dist > 30 && w >= 600/);
  assert.match(script, /cameraManuallyMoved\s*=\s*true/);
  assert.match(script, /!cameraManuallyMoved\s*&&\s*activeCameraView\s*===\s*'overview'/);
  assert.match(functionSource('focusAgent'), /activeCameraView\s*=\s*'focused'/);
  assert.doesNotMatch(script.match(/window\.addEventListener\('resize',[\s\S]*?\n\s*\}\);/)?.[0] ?? '', /setCameraView\(/);
});
function functionSource(name) {
  const start = script.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} is missing`);
  const body = script.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < script.length; i++) {
    if (script[i] === '{') depth++;
    if (script[i] === '}' && --depth === 0) return script.slice(start, i + 1);
  }
  throw new Error('unclosed function');
}
function guards(position, target = { x: 0, y: 1.4, z: 0 }) {
  const context = {
    camera: { position: { ...position } }, controls: { target: { ...target } }, roomWidth: 26, roomDepth: 22,
    wallLeft: {}, wallRight: {}, bbL: {}, bbR: {}, rearFacade: {}
  };
  vm.createContext(context);
  vm.runInContext(functionSource('updateCameraGuards') + '\nupdateCameraGuards();', context);
  return context;
}
test('orbiting outside a side wall cuts away the near wall instead of hiding the room', () => {
  const left = guards({ x: -24, y: 4, z: 0 });
  assert.equal(left.wallLeft.visible, false); assert.equal(left.wallRight.visible, true);
  assert.equal(left.bbL.visible, false);
  const right = guards({ x: 24, y: 4, z: 0 });
  assert.equal(right.wallRight.visible, false); assert.equal(right.wallLeft.visible, true);
});
test('rear orbit hides pillars, windows and backdrop together; returning restores them', () => {
  assert.equal(guards({ x: 0, y: 4, z: -24 }).rearFacade.visible, false);
  const front = guards({ x: 0, y: 13.5, z: 21.5 });
  assert.equal(front.rearFacade.visible, true);
  assert.equal(front.wallLeft.visible, true); assert.equal(front.wallRight.visible, true);
});
test('panning cannot lose the room and clamping preserves the camera-to-target offset', () => {
  const result = guards({ x: 110, y: 20, z: -120 }, { x: 100, y: 10, z: -100 });
  const t = result.controls.target, p = result.camera.position;
  assert.ok(Math.abs(t.x) <= 11.5 && Math.abs(t.z) <= 9.5 && t.y >= 0.8 && t.y <= 3);
  assert.equal(p.x - t.x, 10); assert.equal(p.y - t.y, 10); assert.equal(p.z - t.z, -20);
});
function picking() {
  const canvasListeners = {}, windowListeners = {}, picked = [];
  const canvas = { addEventListener(type, fn) { canvasListeners[type] = fn; } };
  const context = {
    renderer: { domElement: canvas }, window: { innerWidth: 800, innerHeight: 600, addEventListener(type, fn) { windowListeners[type] = fn; } },
    camera: {}, pointer: {}, clickableMeshes: [], focusAgent: id => picked.push(id),
    raycaster: { setFromCamera() {}, intersectObjects() { return [{ object: { userData: { id: 'budi' } } }]; } }
  };
  vm.createContext(context);
  vm.runInContext(functionSource('installAgentPicking') + '\ninstallAgentPicking();', context);
  const event = values => ({ target: canvas, pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: 100, ...values });
  return { canvasListeners, windowListeners, picked, event };
}
test('agent selection happens on a click release, never on pointerdown or drag', () => {
  const p = picking();
  p.canvasListeners.pointerdown(p.event()); assert.equal(p.picked.length, 0);
  p.windowListeners.pointerup(p.event()); assert.deepEqual(p.picked, ['budi']);
  p.canvasListeners.pointerdown(p.event());
  p.windowListeners.pointermove(p.event({ clientX: 200 }));
  p.windowListeners.pointermove(p.event()); // returning to the start is still a drag
  p.windowListeners.pointerup(p.event()); assert.equal(p.picked.length, 1);
});
test('multitouch, cancel and right-button pan cannot accidentally select an agent', () => {
  const p = picking();
  p.canvasListeners.pointerdown(p.event());
  p.canvasListeners.pointerdown(p.event({ pointerId: 2, isPrimary: false }));
  p.windowListeners.pointerup(p.event());
  p.canvasListeners.pointerdown(p.event()); p.windowListeners.pointercancel(p.event()); p.windowListeners.pointerup(p.event());
  p.canvasListeners.pointerdown(p.event({ button: 2 })); p.windowListeners.pointerup(p.event({ button: 2 }));
  assert.deepEqual(p.picked, []);
});
test('camera reset remains available when desktop camera presets are hidden', () => {
  assert.match(html, /aria-label="Reset kamera"/);
  assert.match(script, /controls.screenSpacePanning = false/);
  assert.match(script, /controls.update\(\);\s*updateCameraGuards\(\)/);
});
