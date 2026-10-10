// Every minigame can be left with Escape, even those that never register a key handler of their own.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('Escape ends a minigame that has no key handler, and the handler is removed afterwards', async () => {
  const dom = new JSDOM('<!doctype html><body></body>'); const { window } = dom;
  Object.assign(globalThis, { document: window.document, addEventListener: window.addEventListener.bind(window), removeEventListener: window.removeEventListener.bind(window), cancelAnimationFrame() {}, requestAnimationFrame() { return 0; } });
  const { MiniGames } = await import('../src/game/minigames.js');
  let paused = []; const g = { pauseInput: v => paused.push(v) };
  const m = new MiniGames(g); const p = m.open('Test', 'sub');
  assert.ok(m.root, 'dialog opened'); assert.deepEqual(paused, [true]);
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  const r = await p; assert.deepEqual(r, { win: false, quit: true }); assert.equal(m.root, null); assert.deepEqual(paused, [true, false]);
  // a second Escape does nothing (listener removed): no throw, no extra pauseInput call
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); assert.deepEqual(paused, [true, false]);
});
