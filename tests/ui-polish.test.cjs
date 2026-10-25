const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../kantor-sim.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

test('activity starts compact and has a native keyboard toggle', () => {
  assert.match(html, /<button[^>]*id="activity-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="ticker-log"/);
  assert.match(html, /id="ticker-log"[^>]*hidden/);
  assert.match(html, /id="activity-preview"/);
});
test('activity toggle synchronizes expanded state, preview and label', () => {
  const nodes = {
    'ticker-log': { hidden: true }, 'activity-preview': { hidden: false },
    'activity-toggle-label': { textContent: 'Buka' },
    'activity-toggle': { setAttribute(key, value) { this[key] = value; } }
  };
  const context = { window: {}, document: { getElementById: id => nodes[id] } };
  vm.createContext(context);
  const start = script.indexOf('window.toggleTickerLog =');
  const end = script.indexOf('function pushActivityLog(', start);
  vm.runInContext(script.slice(start, end), context);
  context.window.toggleTickerLog();
  assert.equal(nodes['ticker-log'].hidden, false);
  assert.equal(nodes['activity-preview'].hidden, true);
  assert.equal(nodes['activity-toggle']['aria-expanded'], 'true');
  assert.equal(nodes['activity-toggle-label'].textContent, 'Tutup');
  context.window.toggleTickerLog();
  assert.equal(nodes['ticker-log'].hidden, true);
  assert.equal(nodes['activity-preview'].hidden, false);
  assert.equal(nodes['activity-toggle']['aria-expanded'], 'false');
  assert.equal(nodes['activity-toggle-label'].textContent, 'Buka');
});
test('recruit uses a named native modal and a real submit form', () => {
  assert.match(html, /<dialog[^>]*id="spawn-modal"[^>]*aria-labelledby="spawn-title"/);
  assert.match(html, /<form[^>]*id="spawn-form"/);
  assert.match(html, /id="recruit-submit"[^>]*type="submit"/);
  assert.match(script, /\.showModal\(\)/);
  assert.match(script, /\.addEventListener\('close'/);
});
test('every color radio has a name and focus reaches its visible swatch', () => {
  const radios = [...html.matchAll(/<input[^>]*name="color-pick"[^>]*>/g)].map(m => m[0]);
  assert.equal(radios.length, 5);
  assert.ok(radios.every(radio => /aria-label="[^"]+"/.test(radio)));
  assert.match(html, /\.swatches input:focus-visible \+ span/);
});
test('secondary text token clears 4.5:1 against white', () => {
  const hex = html.match(/--ink-3: #(\w{6})/)[1];
  const rgb = hex.match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  assert.ok(1.05 / (luminance + 0.05) >= 4.5);
});
test('small/short screens avoid stacked panels and retain camera presets', () => {
  assert.match(html, /body\.has-agent-detail #bottom-ticker/);
  assert.match(html, /max-height: calc\(100dvh - 148px\)/);
  assert.match(html, /<details[^>]*id="camera-menu"/);
  assert.match(html, /id="camera-menu"[\s\S]*?setCameraView\('whiteboard'\)/);
});
test('application has a main landmark and a polite user-action status region', () => {
  assert.match(html, /<main[^>]*id="workspace-app"/);
  assert.match(html, /<h1[^>]*id="workspace-title"/);
  assert.match(html, /id="ui-status"[^>]*role="status"/);
});
