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
it('keeps a labelled add action at tablet widths and uses a phone-only chat sheet',()=>{
  expect(app.includes("(max-width: 599px)")).toBe(true);
  expect(app.includes('aria-pressed={selectedId===w.id}')).toBe(true);
  expect(styles.includes('@media (max-width:599px)')).toBe(true);
  expect(styles.includes('.tool-group')).toBe(true);
});
