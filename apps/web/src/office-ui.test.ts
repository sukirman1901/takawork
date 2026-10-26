import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
it('keeps the office full-screen with floating UI rather than dashboard chrome', () => {
  expect(app).not.toContain('className="runtime-footer"');
  expect(app).not.toContain('className="office-caption"');
  expect(app).toContain('Papan tulis');
  expect(app).toContain('Pantry');
  expect(app).toContain('Jeda suasana');
});
it('does not remove the scene when chat is opened', () => {
  expect(styles).not.toMatch(/\.has-chat\s+\.office-panel\s*\{display:none/);
  expect(styles).not.toMatch(/\.full-chat\s+\.office-panel\s*\{display:none/);
});
it('anchors the interface to the viewport independently of camera zoom and document scrolling', () => {
  expect(styles).toMatch(/\.workspace\s*\{\s*position:\s*fixed/);
  expect(app).not.toContain('transform:');
});
it('places camera views in a separate floating rail above the 3D office', () => {
  expect(app).toContain('className="camera-rail paper"');
  expect(app).toContain('aria-label="Sudut pandang kantor"');
  expect(styles).toMatch(/\.camera-rail\s*\{[^}]*position:\s*absolute/);
  expect(styles).toContain('.workspace,.workspace-body,.office-panel,.office-canvas { position: absolute; inset: 0; }');
});
it('uses a compact horizontal camera rail on phones so worker labels remain visible', () => {
  expect(app).toContain('className="icon-button rail-motion"');
  expect(styles).toMatch(/@media \(max-width:599px\)\s*\{[\s\S]*?\.camera-rail\s*\{[^}]*flex-direction:\s*row/);
  expect(styles).toMatch(/\.rail-motion\s*\{\s*display:\s*inline-flex/);
  expect(styles).toMatch(/@media \(max-width:479px\)\s*\{[\s\S]*?\.camera-rail \.icon-button\s*\{[^}]*width:\s*44px;\s*height:\s*44px/);
});
it('keeps the camera rail away from character labels at tablet widths', () => {
  expect(styles).toMatch(/@media \(max-width:1199px\)\s*\{\s*\.camera-rail\s*\{[^}]*flex-direction:\s*row/);
});
it('gives only floating chrome a readable glass treatment and pill-shaped top and team groups', () => {
  expect(styles).toContain('.room-picker.paper,.clock.paper,.header-actions.paper,.camera-rail.paper,.worker-dock.paper,.activity-card.paper');
  expect(styles).toMatch(/\.room-picker,.clock,.header-actions,.worker-dock\s*\{\s*border-radius:\s*var\(--radius-pill\)/);
  expect(styles).toContain('backdrop-filter: blur(');
  expect(styles).toMatch(/\.room-picker \.select-toolbar \.select-trigger,\.header-actions \.add-worker\s*\{\s*border-radius:\s*var\(--radius-pill\)/);
  expect(styles).toMatch(/\.header-actions \.icon-button,\.worker-dock \.icon-button,\.room-picker \.icon-button,\.dock-avatar\s*\{\s*border-radius:\s*var\(--radius-pill\)/);
  expect(styles).not.toContain('border-color: #ffffffb8;');
  expect(styles).toContain('.chat-panel { position: absolute;');
});
it('compacts the phone activity preview without hiding its expandable content or the team dock', () => {
  expect(app).toContain("className={`activity-card paper ${activity?'expanded':''}`}");
  expect(app).toContain('aria-expanded={activity} aria-controls="activity-list"');
  expect(styles).toMatch(/@media \(max-width:599px\)\s*\{[\s\S]*?\.activity-card:not\(\.expanded\) > p\s*\{[^}]*white-space:\s*nowrap/);
  expect(styles).toMatch(/\.worker-dock\s*\{[^}]*bottom:\s*calc\(var\(--edge\) \+ env\(safe-area-inset-bottom/);
});
it('keeps a labelled add action at tablet widths and uses a phone-only chat sheet',()=>{
  expect(app.includes("(max-width: 599px)")).toBe(true);
  expect(app.includes('aria-pressed={selectedId===w.id}')).toBe(true);
  expect(styles.includes('@media (max-width:599px)')).toBe(true);
  expect(styles.includes('.tool-group')).toBe(true);
});
it('exposes room management from the room picker, not from hidden menus', ()=>{
  expect(app).toContain('aria-label="Kelola ruangan"');
  expect(app).toContain('RoomManager');
  expect(app).toContain('data.rooms.map(r=>({value:r.id,label:r.name}))');
  expect(app).toContain('data.rooms.find(r=>r.id===roomId)??data.rooms[0]');
});
it('keeps the kelola dialog opaque and the picker gear pill-shaped', ()=>{
  expect(styles).toMatch(/\.room-picker \.icon-button/);
  expect(styles).toMatch(/\.room-dialog\s*\{[^}]*border-radius:\s*var\(--radius-panel\)/);
  expect(styles).not.toMatch(/\.room-dialog[^{]*\{[^}]*backdrop-filter/);
});
