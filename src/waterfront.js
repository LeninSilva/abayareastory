// The Embarcadero: the waterfront boulevard, drawn from its real course (Oracle Park to Pier 39).
// This module is geometry only. It reshapes the ground under the waterfront, clears generated buildings
// and trees out of the corridor, and answers "where am I relative to the Embarcadero?".
import { toXZ, STYLES } from './geo.js';

// centerline, south to north (King St at Oracle Park -> Beach St at Pier 39)
const LINE = [[37.77840, -122.38885], [37.78430, -122.38775], [37.78850, -122.38810], [37.79020, -122.38900], [37.79130, -122.39030],
  [37.79280, -122.39180], [37.79450, -122.39420], [37.79670, -122.39530], [37.79860, -122.39720], [37.80110, -122.39940],
  [37.80360, -122.40250], [37.80620, -122.40500], [37.80800, -122.41000]];

/* Cross-section, in metres from the centerline (positive toward the bay). */
export const XS = {
  landEdge: -26,      // inland building line
  landCurb: -21,      // inland sidewalk | roadway
  medianIn: -6,       // roadway | median
  medianOut: 6,       // median | bayside roadway
  bayCurb: 21,        // roadway | promenade
  seawall: 38,        // promenade edge, the railing, then the bay
  deckY: 2.05         // the landfill waterfront sits about two metres above the bay
};

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
}

export const WF = (() => {
  const C = LINE.map(([a, b]) => toXZ(a, b));
  const pts = [];
  for (let i = 0; i < C.length - 1; i++) {
    const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(C.length - 1, i + 2)];
    const n = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 8);
    for (let k = 0; k < n; k++) pts.push(catmull(p0, p1, p2, p3, k / n));
  }
  pts.push(C[C.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  // tangents and bayward normals
  const tan = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); return [dx / L, dz / L]; });
  // the bay is to the right of travel (east/north-east): normal = rotate tangent clockwise in x/z (x east, z south)
  const nor = tan.map(([tx, tz]) => [-tz, tx]);
  // spatial hash of samples
  const CELL = 60, grid = new Map();
  pts.forEach((p, i) => { const k = Math.floor(p[0] / CELL) * 100000 + Math.floor(p[1] / CELL); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
  for (const [x, z] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); minz = Math.min(minz, z); maxz = Math.max(maxz, z); }
  return { pts, cum, tan, nor, length: cum[cum.length - 1], grid, CELL, bbox: [minx - 300, minz - 300, maxx + 300, maxz + 300] };
})();

// Signed offset s (bayward +) and distance t along the line, for a point near the waterfront; null if far away.
export function wfLocal(x, z, reach = 260) {
  if (x < WF.bbox[0] || x > WF.bbox[2] || z < WF.bbox[1] || z > WF.bbox[3]) return null;
  const n = Math.ceil(reach / WF.CELL), ci = Math.floor(x / WF.CELL), cj = Math.floor(z / WF.CELL);
  let best = -1, bd = Infinity;
  for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) {
    const a = WF.grid.get((ci + di) * 100000 + cj + dj); if (!a) continue;
    for (const i of a) { const d = (WF.pts[i][0] - x) ** 2 + (WF.pts[i][1] - z) ** 2; if (d < bd) { bd = d; best = i; } }
  }
  if (best < 0) return null;
  // refine on the neighbouring segment
  let i = best; const nxt = Math.min(WF.pts.length - 1, i + 1), prv = Math.max(0, i - 1);
  const proj = (a, b) => { const [ax, az] = WF.pts[a], [bx, bz] = WF.pts[b]; const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1; const u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)); return { u, px: ax + dx * u, pz: az + dz * u, d: (x - ax - dx * u) ** 2 + (z - az - dz * u) ** 2 }; };
  const A = proj(prv, i), B = proj(i, nxt);
  const [s0, s1, P] = A.d < B.d ? [prv, i, A] : [i, nxt, B];
  const t = WF.cum[s0] + (WF.cum[s1] - WF.cum[s0]) * P.u;
  const nx = WF.nor[s0][0], nz = WF.nor[s0][1];
  const s = (x - P.px) * nx + (z - P.pz) * nz;
  const beyond = (s1 === s0) || (t <= 0.01 && best === 0) || (t >= WF.length - 0.01);
  return { s, t, i: s0, end: beyond };
}
// World position of (s, t)
export function wfPoint(t, s) {
  t = Math.max(0, Math.min(WF.length, t));
  let lo = 0, hi = WF.cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (WF.cum[m] <= t) lo = m; else hi = m; }
  const u = (t - WF.cum[lo]) / Math.max(1e-6, WF.cum[hi] - WF.cum[lo]);
  const x = WF.pts[lo][0] + (WF.pts[hi][0] - WF.pts[lo][0]) * u, z = WF.pts[lo][1] + (WF.pts[hi][1] - WF.pts[lo][1]) * u;
  const nx = WF.nor[lo][0] + (WF.nor[hi][0] - WF.nor[lo][0]) * u, nz = WF.nor[lo][1] + (WF.nor[hi][1] - WF.nor[lo][1]) * u, L = Math.hypot(nx, nz);
  return [x + nx / L * s, z + nz / L * s, Math.atan2(WF.tan[lo][1], WF.tan[lo][0])];
}
// Inside the waterfront corridor (road, median, promenade)?
export function inCorridor(x, z, pad = 0) {
  const q = wfLocal(x, z, 120); if (!q || q.t < 1 || q.t > WF.length - 1) return false;
  return q.s >= XS.landEdge - pad && q.s <= XS.seawall + pad;
}

/* Ferry Building position along the line (the plaza reaches out to it) */
export const FERRY = (() => { const [x, z] = toXZ(37.79553, -122.39367); const q = wfLocal(x, z, 400); return { t: q ? q.t : 2079, s: q ? q.s : 85 }; })();

/* Piers: number, distance along the line, length into the bay, width. Odd north of the Ferry Building, even south. */
export const PIERS = [
  [40, 230, 150, 60], [38, 420, 190, 45], ['30–32', 690, 260, 110], [28, 880, 200, 40], [26, 990, 220, 45], [24, 1110, 200, 40],
  ['22½', 1260, 60, 25], [14, 1708, 190, 7, 'walk'], [1, 2240, 190, 55], [3, 2340, 230, 50], [5, 2440, 230, 50], [7, 2560, 260, 9, 'walk'],
  [9, 2690, 250, 50], [15, 2860, 260, 55], [17, 2960, 250, 50], [19, 3080, 240, 55], [23, 3290, 240, 55], [27, 3470, 250, 70],
  [29, 3610, 220, 60], [31, 3720, 200, 50], [33, 3820, 180, 45], [35, 3930, 230, 60]
].map(([n, t, len, w, kind]) => ({ n: String(n), t, len, w, kind: kind || 'shed' }));

/* Rincon Park lawn, between Folsom and Howard, on the bay side (home of the bow and arrow) */
export const RINCON = { t0: 1340, t1: 1520 };

/* Prepare the city data: flatten the landfill, cut a straight seawall, and keep the corridor clear. */
export function prepWaterfront(city) {
  const N = city.demN, C = (2 * city.half) / N;
  const [x0, z0, x1, z1] = WF.bbox;
  const pierAt = (t, s) => PIERS.some(p => Math.abs(t - p.t) < p.w / 2 + 2 && s > XS.seawall - 1 && s < XS.seawall + p.len);
  const ferryPlaza = (t, s) => Math.abs(t - FERRY.t) < 110 && s < FERRY.s + 40;
  // ground: level promenade inland of the wall, deep water beyond (the decks and seawall cover the seam)
  for (let j = 0; j < N; j++) {
    const z = -city.half + (j + 0.5) * C; if (z < z0 || z > z1) continue;
    for (let i = 0; i < N; i++) {
      const x = -city.half + (i + 0.5) * C; if (x < x0 || x > x1) continue;
      const q = wfLocal(x, z); if (!q || q.end) continue;
      const k = j * N + i;
      if (q.s < XS.landEdge - 40) continue;
      if (q.s < XS.landEdge) { const f = (q.s - (XS.landEdge - 40)) / 40; city.dem[k] = city.dem[k] * (1 - f) + XS.deckY * f; continue; }
      if (q.s < XS.seawall - 34) city.dem[k] = XS.deckY - 0.05;
      else city.dem[k] = Math.min(city.dem[k], -7);
    }
  }
  // land mask: a clean seawall
  const LN = city.landN, LC = (2 * city.half) / LN;
  let district = 0;
  { const [fx, fz] = toXZ(37.7940, -122.3960); district = city.landIndex(fx, fz) || 1; }
  for (let j = 0; j < LN; j++) {
    const z = -city.half + (j + 0.5) * LC; if (z < z0 || z > z1) continue;
    for (let i = 0; i < LN; i++) {
      const x = -city.half + (i + 0.5) * LC; if (x < x0 || x > x1) continue;
      const q = wfLocal(x, z); if (!q || q.end) continue;
      const k = j * LN + i;
      if (q.s > XS.seawall && !pierAt(q.t, q.s) && !ferryPlaza(q.t, q.s)) city.land[k] = 0;
      else if (q.s >= XS.landEdge - 20 && q.s <= XS.seawall && !city.land[k]) city.land[k] = district;
    }
  }
  // generated buildings: none inside the corridor, out over the water, or on the plaza and the Hyatt's site
  const clear = CLEAR.map(([a, b, r]) => { const [x, z] = toXZ(a, b); return { x, z, r }; });
  city.buildings = city.buildings.filter(b => {
    const r = Math.hypot(b.w, b.d) / 2;
    if (clear.some(c => Math.hypot(b.x - c.x, b.z - c.z) < c.r + r * 0.6)) return false;
    const q = wfLocal(b.x, b.z); if (!q || q.end) return true;
    return q.s + r < XS.landEdge - 1;
  });
  frontage(city, clear);
  // street trees: none in the corridor (the median gets its own palms)
  const T = city.trees, keep = [];
  for (let k = 0; k < T.length / 4; k++) {
    const q = wfLocal(T[k * 4], T[k * 4 + 1]);
    if (q && !q.end && q.s > XS.landEdge - 1.5) continue;
    keep.push(T[k * 4], T[k * 4 + 1], T[k * 4 + 2], T[k * 4 + 3]);
  }
  city.trees = Float32Array.from(keep);
}

// open ground kept free of generated buildings: Embarcadero Plaza, the Hyatt Regency, Rincon Center's plaza
const CLEAR = [[37.79530, -122.39560, 70], [37.79430, -122.39590, 45], [37.79530, -122.39480, 40]];
// towers and landmarks that already stand near the water (kept clear of the new frontage)
const KEEP = [[37.79455, -122.39630, 45], [37.79440, -122.39800, 45], [37.79370, -122.39470, 35], [37.78965, -122.39425, 30], [37.78960, -122.39220, 28],
  [37.78565, -122.39205, 30], [37.77859, -122.38927, 150], [37.78800, -122.38950, 70], [37.79553, -122.39367, 120]];

/* The inland side of the boulevard: a continuous frontage of the right kind of building for each stretch.
   South Beach apartments, SoMa brick and glass under the Bay Bridge, the Northeast Waterfront's old warehouses. */
function frontage(city, clear) {
  const keep = KEEP.map(([a, b, r]) => { const [x, z] = toXZ(a, b); return { x, z, r }; }).concat(clear);
  const near = (x, z, r) => {
    if (keep.some(k => Math.hypot(x - k.x, z - k.z) < k.r + r)) return true;
    for (const b of city.buildings) { if (Math.abs(b.x - x) > 60 || Math.abs(b.z - z) > 60) continue; if (Math.hypot(b.x - x, b.z - z) < (Math.hypot(b.w, b.d) / 2 + r) * 0.8) return true; }
    return false;
  };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const add = [];
  for (let t = 20; t < WF.length - 20;) {
    const kind = t < 1000 ? ['apartment', 'soma'] : t < 1990 ? ['soma', 'downtown'] : t < 2200 ? null : t < 3000 ? ['soma', 'industrial'] : ['northbeach', 'industrial'];
    const w = 18 + rnd() * 22;
    if (!kind) { t += w; continue; }
    const style = kind[rnd() < 0.5 ? 0 : 1], d = 18 + rnd() * 14;
    const h = style === 'apartment' ? 20 + rnd() * 34 : style === 'downtown' ? 30 + rnd() * 60 : style === 'soma' ? 12 + rnd() * 20 : 9 + rnd() * 9;
    const s = XS.landEdge - 2 - d / 2;
    const [x, z, ang] = wfPoint(t + w / 2, s);
    const r = Math.hypot(w, d) / 2;
    if (!near(x, z, r)) {
      const y = city.heightAt(x, z);
      add.push({ x, z, w: w - 1.5, d, ang, h, y, style, styleId: STYLES[style].id, seed: Math.floor(rnd() * 255), houses: style === 'soma' || style === 'industrial' ? 1 : Math.max(1, Math.round(w / 12)) });
    }
    t += w;
  }
  city.buildings.push(...add);
}
