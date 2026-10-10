// Deployment consistency: the same files must reach the published site however it is built (npm run build, GitHub Pages,
// Vercel), and every file the service worker precaches must exist (cache.addAll rejects, and offline play breaks, if any is missing).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('vercel.json copies every folder that tools/bundle.mjs publishes', () => {
  const bundled = read('tools/bundle.mjs').match(/for \(const f of \[([^\]]*)\]\) cpSync/)[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));
  const cmd = JSON.parse(read('vercel.json')).buildCommand, copied = cmd.match(/cp -r (.*) public\//)[1].split(/\s+/);
  for (const f of bundled) assert.ok(copied.includes(f), `${f} is bundled by npm run build but not copied by vercel.json`);
});

test('every file the service worker precaches exists in the repository', () => {
  const files = read('src/sw.template.js').match(/const FILES = \[([^\]]*)\]/)[1].match(/'([^']+)'/g).map(s => s.slice(1, -1)).filter(f => f !== './');
  for (const f of files) assert.ok(existsSync(new URL('../' + f, import.meta.url)), `${f} is precached but missing`);
});

test('the title screen artwork is part of the build and the offline cache', () => {
  assert.match(read('src/style.css'), /url\("assets\/jiquilpan-vista\.jpg"\)/);
  assert.match(read('src/sw.template.js'), /assets\/jiquilpan-vista\.jpg/);
});
