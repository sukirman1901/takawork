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
it('keeps a labelled add action at tablet widths and uses a phone-only chat sheet',()=>{
  expect(app.includes("(max-width: 599px)")).toBe(true);
  expect(app.includes('aria-pressed={selectedId===w.id}')).toBe(true);
  expect(styles.includes('@media (max-width:599px)')).toBe(true);
  expect(styles.includes('.tool-group')).toBe(true);
});
