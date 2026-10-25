import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { sceneDocument, sceneModule } from '../legacy-office';
const html = readFileSync(new URL('../../../kantor-sim.html', import.meta.url),'utf8');
it('reuses the complete room and pathfinding but removes CDN scripts and legacy controls from interaction', () => {
  const doc = sceneDocument(html);
  expect(doc).not.toContain('cdnjs.cloudflare.com');
  expect(doc).not.toContain('onclick=');
  expect(doc).toContain('/src/office-entry.ts');
  expect(doc).toContain('id="canvas-container"');
  const module = sceneModule(html);
  expect(module).toContain('function gridPath');
  expect(module).toContain('coffeeGroup');
  expect(module).toContain('layoutDesks(6)');
  expect(module).toContain('hooks.onSelect');
  expect(module).toContain('hooks.motion()');
  expect(module).toContain('renderer.render(scene, camera); return loaded');
  expect(module.includes("planAgentTrip(ag, 'meeting')")).toBe(true);
  expect(module.includes('selection-ring')).toBe(true);
  expect(doc.includes('.bubble span{display:block')).toBe(true);
  expect(doc.includes('.bubble.compact span{display:block')).toBe(true);
  expect(doc.includes('#2f5d50')).toBe(false);
});
it('fails loudly rather than silently losing hooks after incompatible legacy changes', () => {
  expect(() => sceneModule('<html></html>')).toThrow();
});
