// Stacking order regressions. The title screen is a full-screen layer; the menu is opened from it (Settings,
// About), so the menu must sit above it, but below the story card.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const z = sel => { const m = css.match(new RegExp('(?:^|\\n)' + sel.replace(/[.#]/g, '\\$&') + '\\s*\\{[^}]*?z-index:\\s*(\\d+)')); return m ? +m[1] : null; };

test('the menu opened from the title screen stacks above the title and below the story card', () => {
  assert.ok(z('.screen') != null && z('#menu') != null && z('#card') != null, 'z-index values found');
  assert.ok(z('#menu') > z('.screen'), `#menu (${z('#menu')}) must be above .screen/#title (${z('.screen')})`);
  assert.ok(z('#menu') < z('#card'), `#menu (${z('#menu')}) must be below #card (${z('#card')})`);
});

test('the side panel and dialogue stay below the menu (the menu pauses everything)', () => {
  assert.ok(z('#side') < z('#menu'));
});

test('on small screens the menu\'s close button is pinned to the corner, not left at the end of the scrolling tab strip', () => {
  const small = css.slice(css.indexOf('@media (max-width: 760px)'));
  const m = small.match(/#tabs \.close\s*\{([^}]*)\}/);
  assert.ok(m, 'a #tabs .close rule exists in the small-screen block');
  assert.match(m[1], /position:\s*fixed/);
  assert.match(m[1], /right:\s*\d+px/);
  assert.match(small, /#tabs\s*\{[^}]*margin-right:\s*\d+px/, 'the strip leaves room for the pinned button');
});

test('a minigame taller than the screen keeps its Leave button reachable (no overflow above the top, sticky header)', () => {
  const mini = css.match(/(?:^|\n)\.mini\s*\{([^}]*)\}/)[1];
  assert.doesNotMatch(mini, /justify-content:\s*center/, 'justify-content:center clips the top of an overflowing column');
  assert.match(mini, /overflow-y:\s*auto/);
  assert.match(css, /\.mini > :first-child\s*\{[^}]*margin-top:\s*auto/);
  assert.match(css, /\.mini-head\s*\{[^}]*position:\s*sticky/);
});
