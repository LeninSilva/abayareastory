// Builds data/city.bin + data/city.json from open San Francisco data.
//
//   node tools/build-data.mjs <raw-dir>
//
// Inputs (downloaded by tools/fetch-data.sh):
//   hoods.geojson     SF neighbourhood boundaries (click_that_hood)            -> coastline, districts
//   sfcontour.json    DataSF elevation contours, feet (kepler.gl sample data)  -> terrain
//   trees.csv         DataSF street tree list (kepler.gl sample data)          -> street network, street trees
//
// Streets are traced from the street trees: trees stand on both sidewalks, so the trees that share a
// street name, ordered along the street, trace its centreline. Buildings are generated along those
// streets by district style (real footprints are not available offline), leaving landmarks and parks clear.
import fs from 'node:fs';
import path from 'node:path';
import { toXZ, HALF, DISTRICT_STYLE, STYLES, STREET_WIDTH, LANDMARKS, TOWERS, PARKS, LIBRARIES } from '../src/geo.js';

const RAW = process.argv[2] || 'raw';
const OUT = 'data';
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

// deterministic random
let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const rr = (a, b) => a + (b - a) * rnd();

/* ---------------- districts & coastline ---------------- */
const hoods = JSON.parse(fs.readFileSync(path.join(RAW, 'hoods.geojson'), 'utf8')).features;
const DISTRICTS = hoods.map(f => f.properties.name);
const NL = 720, CL = (2 * HALF) / NL;                       // district/land grid, 20 m cells
const land = new Uint8Array(NL * NL);                       // 0 = water, else district index + 1
const cellOf = (x, z, n, c) => [Math.floor((x + HALF) / c), Math.floor((z + HALF) / c)];

function fillPolygon(grid, n, c, rings, value) {
  // even-odd scanline fill of polygon rings given in world metres
  const edges = [];
  for (const ring of rings) for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (a[1] !== b[1]) edges.push(a, b);
  }
  let zmin = Infinity, zmax = -Infinity;
  for (const p of edges) { zmin = Math.min(zmin, p[1]); zmax = Math.max(zmax, p[1]); }
  const j0 = Math.max(0, Math.floor((zmin + HALF) / c)), j1 = Math.min(n - 1, Math.ceil((zmax + HALF) / c));
  for (let j = j0; j <= j1; j++) {
    const zc = -HALF + (j + 0.5) * c, xs = [];
    for (let e = 0; e < edges.length; e += 2) {
      const a = edges[e], b = edges[e + 1];
      if ((a[1] <= zc && b[1] > zc) || (b[1] <= zc && a[1] > zc)) xs.push(a[0] + (zc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] + HALF) / c - 0.5)), i1 = Math.min(n - 1, Math.floor((xs[k + 1] + HALF) / c - 0.5));
      for (let i = i0; i <= i1; i++) grid[j * n + i] = value;
    }
  }
}
const toRings = geom => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates).map(poly => poly.map(ring => ring.map(([lon, lat]) => toXZ(lat, lon))));
hoods.forEach((f, i) => { for (const rings of toRings(f.geometry)) fillPolygon(land, NL, CL, rings, i + 1); });
// Alcatraz is not in the neighbourhood file
{ const [ax, az] = toXZ(37.8267, -122.4230); for (let j = 0; j < NL; j++) for (let i = 0; i < NL; i++) { const x = -HALF + (i + .5) * CL, z = -HALF + (j + .5) * CL; if (((x - ax) / 270) ** 2 + ((z - az) / 110) ** 2 < 1) land[j * NL + i] = 255; } }
const isLand = (x, z) => { const [i, j] = cellOf(x, z, NL, CL); return i >= 0 && j >= 0 && i < NL && j < NL && land[j * NL + i] > 0; };
const districtAt = (x, z) => { const [i, j] = cellOf(x, z, NL, CL); const v = (i >= 0 && j >= 0 && i < NL && j < NL) ? land[j * NL + i] : 0; return v && v !== 255 ? DISTRICTS[v - 1] : null; };
log('districts', DISTRICTS.length, 'land cells', land.reduce((s, v) => s + (v ? 1 : 0), 0));

/* ---------------- terrain ---------------- */
const ND = 480, CD = (2 * HALF) / ND;                       // 30 m elevation grid
const sum = new Float64Array(ND * ND), cnt = new Float32Array(ND * ND);
const contours = JSON.parse(fs.readFileSync(path.join(RAW, 'sfcontour.json'), 'utf8')).features;
for (const f of contours) {
  if (!f.geometry) continue;
  const h = f.properties.elevation * 0.3048;                // feet -> metres
  const pts = f.geometry.coordinates.map(([lon, lat]) => toXZ(lat, lon));
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / (CD * 0.5)));
    for (let s = 0; s < n; s++) {
      const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n, [i, j] = cellOf(x, z, ND, CD);
      if (i >= 0 && j >= 0 && i < ND && j < ND) { sum[j * ND + i] += h; cnt[j * ND + i]++; }
    }
  }
}
const dem = new Float32Array(ND * ND), fixed = new Uint8Array(ND * ND);
for (let j = 0; j < ND; j++) for (let i = 0; i < ND; i++) {
  const k = j * ND + i, x = -HALF + (i + .5) * CD, z = -HALF + (j + .5) * CD;
  if (cnt[k]) { dem[k] = sum[k] / cnt[k]; fixed[k] = 1; }
  else if (!isLand(x, z)) {
    // open water: fixed depth, deeper farther from shore
    let near = false; for (let dj = -2; dj <= 2 && !near; dj++) for (let di = -2; di <= 2; di++) if (isLand(x + di * CD, z + dj * CD)) { near = true; break; }
    if (!near) { dem[k] = -9; fixed[k] = 1; } else dem[k] = -2;
  } else dem[k] = 20;
}
// Fill the gaps between contours by relaxation, coarse to fine (a small multigrid).
function relax(grid, fix, n, iters) {
  for (let it = 0; it < iters; it++) for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
    const k = j * n + i; if (fix[k]) continue;
    grid[k] = (grid[k - 1] + grid[k + 1] + grid[k - n] + grid[k + n]) * 0.25;
  }
}
for (const f of [8, 4, 2, 1]) {
  const n = ND / f, g = new Float32Array(n * n), fx = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    let s = 0, c = 0, fs2 = 0, fc = 0;
    for (let dj = 0; dj < f; dj++) for (let di = 0; di < f; di++) { const k = (j * f + dj) * ND + i * f + di; s += dem[k]; c++; if (fixed[k]) { fs2 += dem[k]; fc++; } }
    if (fc) { g[j * n + i] = fs2 / fc; fx[j * n + i] = 1; } else g[j * n + i] = s / c;
  }
  relax(g, fx, n, f === 1 ? 400 : 250);
  for (let j = 0; j < ND; j++) for (let i = 0; i < ND; i++) { const k = j * ND + i; if (!fixed[k]) dem[k] = g[Math.floor(j / f) * n + Math.floor(i / f)]; }
}
relax(dem, fixed, ND, 200);
// light smoothing of the contour steps, and keep land above the sea
const dem2 = dem.slice();
for (let j = 1; j < ND - 1; j++) for (let i = 1; i < ND - 1; i++) {
  const k = j * ND + i; dem2[k] = (dem[k] * 4 + dem[k - 1] + dem[k + 1] + dem[k - ND] + dem[k + ND]) / 8;
  const x = -HALF + (i + .5) * CD, z = -HALF + (j + .5) * CD;
  if (isLand(x, z)) dem2[k] = Math.max(dem2[k], 1.2); else dem2[k] = Math.min(dem2[k], -1.5);
}
dem.set(dem2);
let hmax = -1e9; for (const v of dem) hmax = Math.max(hmax, v);
log('terrain done, max elevation', hmax.toFixed(1), 'm');
const heightAt = (x, z) => {
  const fx = (x + HALF) / CD - 0.5, fz = (z + HALF) / CD - 0.5, i = Math.max(0, Math.min(ND - 2, Math.floor(fx))), j = Math.max(0, Math.min(ND - 2, Math.floor(fz)));
  const u = Math.min(1, Math.max(0, fx - i)), v = Math.min(1, Math.max(0, fz - j)), k = j * ND + i;
  return (dem[k] * (1 - u) + dem[k + 1] * u) * (1 - v) + (dem[k + ND] * (1 - u) + dem[k + ND + 1] * u) * v;
};

/* ---------------- streets from street trees ---------------- */
const csv = fs.readFileSync(path.join(RAW, 'trees.csv'), 'utf8').split(/\r?\n/);
const head = csv[0].split(',');
const iAddr = head.indexOf('qAddress'), iLat = head.indexOf('latitude'), iLon = head.indexOf('longitude'), iSp = head.indexOf('qSpecies');
function parseCSVLine(line) { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; }
const byStreet = new Map(), treeList = [];
const normStreet = s => s.replace(/^0(\d)/, '$1').replace(/\s+/g, ' ').trim();
for (let r = 1; r < csv.length; r++) {
  if (!csv[r]) continue;
  const c = parseCSVLine(csv[r]);
  const lat = +c[iLat], lon = +c[iLon];
  if (!lat || !lon || lat < 37.70 || lat > 37.84 || lon < -122.52 || lon > -122.35) continue;
  const [x, z] = toXZ(lat, lon);
  if (!isLand(x, z)) continue;
  treeList.push({ x, z, sp: (c[iSp] || '').toLowerCase() });
  const m = /^\s*[\d-]+[A-Za-z]?\s+(.+)$/.exec(c[iAddr] || '');
  if (!m) continue;
  const name = normStreet(m[1]);
  if (!byStreet.has(name)) byStreet.set(name, []);
  byStreet.get(name).push([x, z]);
}
log('trees', treeList.length, 'named streets', byStreet.size);

function clusters(pts, eps) {
  // union-find on a grid of eps-sized buckets
  const parent = pts.map((_, i) => i), find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const grid = new Map(), key = (i, j) => i * 100000 + j;
  pts.forEach((p, k) => { const g = key(Math.floor(p[0] / eps), Math.floor(p[1] / eps)); if (!grid.has(g)) grid.set(g, []); grid.get(g).push(k); });
  pts.forEach((p, k) => {
    const gi = Math.floor(p[0] / eps), gj = Math.floor(p[1] / eps);
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) for (const q of grid.get(key(gi + di, gj + dj)) || []) {
      if (q > k && Math.hypot(pts[q][0] - p[0], pts[q][1] - p[1]) < eps) parent[find(q)] = find(k);
    }
  });
  const groups = new Map(); pts.forEach((p, k) => { const r = find(k); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(p); });
  return [...groups.values()];
}
function dp(pts, tol) {   // Douglas-Peucker
  if (pts.length < 3) return pts;
  const [ax, az] = pts[0], [bx, bz] = pts[pts.length - 1], L = Math.hypot(bx - ax, bz - az) || 1;
  let best = -1, bi = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((bx - ax) * (az - pts[i][1]) - (ax - pts[i][0]) * (bz - az)) / L; if (d > best) { best = d; bi = i; } }
  if (best < tol) return [pts[0], pts[pts.length - 1]];
  return dp(pts.slice(0, bi + 1), tol).slice(0, -1).concat(dp(pts.slice(bi), tol));
}
const streets = [];
for (const [name, pts] of byStreet) {
  for (const cl of clusters(pts, 230)) {
    if (cl.length < 3) continue;
    let mx = 0, mz = 0; for (const p of cl) { mx += p[0]; mz += p[1]; } mx /= cl.length; mz /= cl.length;
    let sxx = 0, sxz = 0, szz = 0; for (const p of cl) { const dx = p[0] - mx, dz = p[1] - mz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; }
    const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(ang), uz = Math.sin(ang);
    const proj = cl.map(p => [(p[0] - mx) * ux + (p[1] - mz) * uz, p]).sort((a, b) => a[0] - b[0]);
    const span = proj[proj.length - 1][0] - proj[0][0];
    if (span < 40) continue;
    // bin along the street: the mean position of both sidewalks is the centreline
    const BIN = 45, bins = [];
    let cur = null;
    for (const [t, p] of proj) {
      const b = Math.floor((t - proj[0][0]) / BIN);
      if (!cur || cur.b !== b) { cur = { b, x: 0, z: 0, n: 0, t: 0 }; bins.push(cur); }
      cur.x += p[0]; cur.z += p[1]; cur.n++; cur.t += t;
    }
    let line = bins.map(b => [b.x / b.n, b.z / b.n, b.t / b.n]);
    // a bin holding trees from only one sidewalk sits off-centre: pull every point onto the local trend
    line = line.map((p, i) => {
      const a = line[Math.max(0, i - 2)], c = line[Math.min(line.length - 1, i + 2)];
      return [p[0] * 0.5 + (a[0] + c[0]) * 0.25, p[1] * 0.5 + (a[1] + c[1]) * 0.25, p[2]];
    });
    // extend ends half a bin so streets meet at intersections
    const ext = (a, b, d) => { const L = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; return [a[0] + (a[0] - b[0]) / L * d, a[1] + (a[1] - b[1]) / L * d]; };
    if (line.length >= 2) { line.unshift(ext(line[0], line[1], 22)); line.push(ext(line[line.length - 1], line[line.length - 2], 22)); }
    // split where the trees stop for a long way (a park, a hill, a freeway)
    let part = [];
    const flush = () => { if (part.length >= 2) streets.push({ name, width: STREET_WIDTH[name] || 20, pts: dp(part.map(p => [p[0], p[1]]), 3) }); part = []; };
    for (let i = 0; i < line.length; i++) {
      if (part.length && Math.hypot(line[i][0] - part[part.length - 1][0], line[i][1] - part[part.length - 1][1]) > 320) flush();
      part.push(line[i]);
    }
    flush();
  }
}
let slen = 0; for (const s of streets) for (let i = 1; i < s.pts.length; i++) slen += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
log('streets', streets.length, 'total km', (slen / 1000).toFixed(0));

/* ---------------- building lots ---------------- */
const NB = 3600, CB = (2 * HALF) / NB;                      // 4 m occupancy grid
const occ = new Uint8Array(NB * NB);                        // 1 blocked
for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) { const x = -HALF + (i + .5) * CB, z = -HALF + (j + .5) * CB; const d = districtAt(x, z); if (!d || DISTRICT_STYLE[d] === 'park') occ[j * NB + i] = 1; }
function stampDisc(x, z, r) { const i0 = Math.floor((x - r + HALF) / CB), i1 = Math.floor((x + r + HALF) / CB), j0 = Math.floor((z - r + HALF) / CB), j1 = Math.floor((z + r + HALF) / CB); for (let j = Math.max(0, j0); j <= Math.min(NB - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(NB - 1, i1); i++) { const cx = -HALF + (i + .5) * CB, cz = -HALF + (j + .5) * CB; if ((cx - x) ** 2 + (cz - z) ** 2 <= r * r) occ[j * NB + i] = 1; } }
function stampSegment(ax, az, bx, bz, w) { const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / (CB * 0.7)); for (let s = 0; s <= n; s++) stampDisc(ax + (bx - ax) * s / n, az + (bz - az) * s / n, w / 2); }
for (const s of streets) for (let i = 1; i < s.pts.length; i++) stampSegment(s.pts[i - 1][0], s.pts[i - 1][1], s.pts[i][0], s.pts[i][1], s.width);
for (const p of PARKS) { const [x, z] = toXZ(p.lat, p.lon); stampDisc(x, z, p.r); }
for (const l of LANDMARKS) { const [x, z] = toXZ(l.lat, l.lon); stampDisc(x, z, l.r); }
for (const t of TOWERS) { const [x, z] = toXZ(t.lat, t.lon); stampDisc(x, z, Math.max(t.w, t.d) * 0.75 + 4); }
for (const l of LIBRARIES) { const [x, z] = toXZ(l.lat, l.lon); stampDisc(x, z, 14); }
// Keep a path of open ground along the shore (piers and the Embarcadero promenade are drawn separately).

function rectFree(cx, cz, ux, uz, w, d) {
  // rectangle centred at (cx,cz), width w along u, depth d along the normal
  const vx = -uz, vz = ux;
  // test the interior only: the street stamp's cell edges reach a few metres past the curb
  const m = CB * 0.75;
  for (let a = -w / 2 + m; a <= w / 2 - m + 0.01; a += CB * 0.8) for (let b = -d / 2 + m; b <= d / 2 - m + 0.01; b += CB * 0.8) {
    const x = cx + ux * a + vx * b, z = cz + uz * a + vz * b, i = Math.floor((x + HALF) / CB), j = Math.floor((z + HALF) / CB);
    if (i < 0 || j < 0 || i >= NB || j >= NB || occ[j * NB + i]) return false;
  }
  return true;
}
function rectMark(cx, cz, ux, uz, w, d) {
  const vx = -uz, vz = ux;
  for (let a = -w / 2 - 1; a <= w / 2 + 1; a += CB * 0.6) for (let b = -d / 2 - 1; b <= d / 2 + 1; b += CB * 0.6) {
    const x = cx + ux * a + vx * b, z = cz + uz * a + vz * b, i = Math.floor((x + HALF) / CB), j = Math.floor((z + HALF) / CB);
    if (i >= 0 && j >= 0 && i < NB && j < NB) occ[j * NB + i] = 1;
  }
}
const towerCores = [[37.7919, -122.4000], [37.7895, -122.3960], [37.7880, -122.4020], [37.7935, -122.4010]].map(([a, b]) => toXZ(a, b));
const buildings = [];
// widest streets first so corners are claimed by the main streets
const order = streets.slice().sort((a, b) => b.width - a.width);
for (const s of order) {
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i];
      const L = Math.hypot(bx - ax, bz - az); if (L < 8) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz * side, nz = ux * side;
      let t = 4;
      while (t < L - 4) {
        const mx = ax + ux * t, mz = az + uz * t;
        const dist = districtAt(mx + nx * (s.width / 2 + 10), mz + nz * (s.width / 2 + 10));
        const style = dist && STYLES[DISTRICT_STYLE[dist]];
        if (!style) { t += 10; continue; }
        const houses = Math.max(1, Math.round(rr(style.row[0], style.row[1] + 0.99) - 0.49));
        let w = style.lot * houses * rr(0.92, 1.1);
        if (t + w > L - 3) w = Math.max(style.lot, L - 3 - t);
        let d = rr(style.depth[0], style.depth[1]);
        let placed = false;
        for (const shrink of [1, 0.7, 0.5]) {
          const dd = d * shrink, off = s.width / 2 + 0.3 + dd / 2;
          const cx = mx + ux * w / 2 + nx * off, cz = mz + uz * w / 2 + nz * off;
          if (rectFree(cx, cz, ux, uz, w, dd)) {
            rectMark(cx, cz, ux, uz, w + (style.gap || 0), dd);
            let h = rr(style.h[0], style.h[1]);
            if (style.id === STYLES.downtown.id) {
              // taller toward the historic core and Transbay
              const near = Math.min(...towerCores.map(([tx, tz]) => Math.hypot(cx - tx, cz - tz)));
              h = Math.max(24, (rnd() ** 1.6) * 150 * Math.max(0.25, 1 - near / 900) + 20);
            }
            if (style.id === STYLES.soma.id && rnd() < 0.08) h = rr(50, 110);
            buildings.push({ cx, cz, w, d: dd, ang: Math.atan2(uz, ux), h, style: style.id, seed: Math.floor(rnd() * 255), houses, y: heightAt(cx, cz) });
            placed = true; break;
          }
        }
        t += placed ? w + (style.gap || 0) + 0.2 : 6;
      }
    }
  }
}
log('buildings', buildings.length);

/* ---------------- trees: the real street trees, plus park forests ---------------- */
const treeType = sp => /palm|phoenix|washingtonia|syagrus|trachycarpus/.test(sp) ? 1 : /pine|pinus|cypress|cupressus|redwood|sequoia|cedar|cedrus|juniper|podocarpus/.test(sp) ? 2 : /eucalyptus|gum|melaleuca|tristaniopsis|lophostemon|swamp myrtle|brisbane/.test(sp) ? 3 : 0;
const trees = [];
for (const t of treeList) { const i = Math.floor((t.x + HALF) / CB), j = Math.floor((t.z + HALF) / CB); if (i < 0 || j < 0 || i >= NB || j >= NB) continue; trees.push([t.x, t.z, treeType(t.sp), Math.floor(rr(60, 130))]); }
const forest = [];
const addForest = (x, z, type) => { if (isLand(x, z) && heightAt(x, z) > 1) forest.push([x, z, type, Math.floor(rr(90, 190))]); };
// Golden Gate Park and the Presidio are districts of their own in the city's data
for (let k = 0; k < 420000; k++) {
  const x = rr(-HALF, HALF), z = rr(-HALF, HALF), d = districtAt(x, z);
  if (d === 'Golden Gate Park' && rnd() < 0.55) addForest(x, z, rnd() < 0.5 ? 2 : 3);
  if (d === 'Presidio' && rnd() < 0.5) { const i = Math.floor((x + HALF) / CB), j = Math.floor((z + HALF) / CB); if (!occ[j * NB + i] || rnd() < 0.3) addForest(x, z, rnd() < 0.6 ? 2 : 3); }
}
for (const p of PARKS) {
  if (!p.trees) continue;
  const [px, pz] = toXZ(p.lat, p.lon), n = Math.floor(p.r * p.r * 0.0035 * p.trees);
  for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * p.r; addForest(px + Math.cos(a) * r, pz + Math.sin(a) * r, p.name.includes('Sutro') || p.name.includes('Davidson') ? 3 : rnd() < 0.5 ? 2 : 0); }
}
log('street trees', trees.length, 'park trees', forest.length);

/* ---------------- write ---------------- */
const parts = [], meta = { half: HALF, demN: ND, landN: NL, districts: DISTRICTS, sections: {}, streetNames: [], source: 'DataSF elevation contours and street tree list (via kepler.gl sample data), SF neighbourhoods (click_that_hood)' };
let offset = 0;
function add(name, arr) { const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (offset % 4)) % 4; if (pad) { parts.push(Buffer.alloc(pad)); offset += pad; } meta.sections[name] = { offset, length: arr.length, type: arr.constructor.name }; parts.push(buf); offset += buf.length; }
add('dem', Int16Array.from(dem, v => Math.round(v * 10)));
add('land', land);
const sp = [], so = [0], sw = [], sn = [];
streets.forEach(s => { for (const p of s.pts) sp.push(Math.round(p[0] * 4), Math.round(p[1] * 4)); so.push(sp.length / 2); sw.push(s.width); let k = meta.streetNames.indexOf(s.name); if (k < 0) { k = meta.streetNames.length; meta.streetNames.push(s.name); } sn.push(k); });
add('streetPts', Int16Array.from(sp)); add('streetOff', Uint32Array.from(so)); add('streetW', Uint8Array.from(sw)); add('streetName', Uint16Array.from(sn));
const bi = new Int16Array(buildings.length * 7), bs = new Uint8Array(buildings.length * 3);
buildings.forEach((b, k) => { bi.set([Math.round(b.cx * 4), Math.round(b.cz * 4), Math.round(b.w * 10), Math.round(b.d * 10), Math.round(b.ang * 10000), Math.round(b.h * 10), Math.round(b.y * 10)], k * 7); bs.set([b.style, b.seed, b.houses], k * 3); });
add('bldI', bi); add('bldS', bs);
const all = trees.concat(forest), ti = new Int16Array(all.length * 2), ts = new Uint8Array(all.length * 2);
all.forEach((t, k) => { ti[k * 2] = Math.round(t[0] * 4); ti[k * 2 + 1] = Math.round(t[1] * 4); ts[k * 2] = t[2]; ts[k * 2 + 1] = t[3]; });
add('treeI', ti); add('treeS', ts);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'city.bin'), Buffer.concat(parts));
fs.writeFileSync(path.join(OUT, 'city.json'), JSON.stringify(meta));
log('wrote', (offset / 1e6).toFixed(2), 'MB');
