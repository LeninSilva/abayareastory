// Bundles the game into one self-contained index.html (styles and script inline), plus the service worker.
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const r = await esbuild.build({ entryPoints: ['src/main.js'], bundle: true, format: 'esm', minify: !process.env.DEV, write: false, target: 'es2020', legalComments: 'none', define: { 'process.env.NODE_ENV': '"production"' } });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('src/style.css', 'utf8');
const html = readFileSync('src/index.template.html', 'utf8').replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
writeFileSync('index.html', html);
const version = Date.now().toString(36);
writeFileSync('sw.js', readFileSync('src/sw.template.js', 'utf8').replace('__VERSION__', version));
console.log(`index.html ${(html.length / 1024).toFixed(0)} KB, script ${(js.length / 1024).toFixed(0)} KB`);

// The deployable site: everything a static host needs, in public/ (Vercel's default output folder).
import { rmSync, mkdirSync, cpSync } from 'node:fs';
rmSync('public', { recursive: true, force: true });
mkdirSync('public', { recursive: true });
for (const f of ['index.html', 'sw.js', 'manifest.webmanifest', 'icons', 'data', 'assets']) cpSync(f, 'public/' + f, { recursive: true });
console.log('public/ ready');
