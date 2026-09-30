// Loads data/city.bin + data/city.json and answers spatial questions about the city.
import { STYLE_BY_ID, LANDMARKS, TOWERS, LIBRARIES, toXZ } from './geo.js';
import { prepWaterfront } from './waterfront.js';

export const SIDEWALK = 3.2;   // sidewalk width on each side of a street (m)

export async function loadCity(onProgress) {
  const meta = await (await fetch('data/city.json')).json();
  const res = await fetch('data/city.bin');
  const total = +res.headers.get('content-length') || 0;
  let buf;
  if (res.body && total) {
    const reader = res.body.getReader(), chunks = []; let got = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; onProgress && onProgress(got / total); }
    buf = new Uint8Array(got); let o = 0; for (const c of chunks) { buf.set(c, o); o += c.length; }
    buf = buf.buffer;
  } else buf = await res.arrayBuffer();
  const T = { Int16Array, Uint8Array, Uint16Array, Uint32Array, Float32Array };
  const S = n => { const s = meta.sections[n]; return new T[s.type](buf, s.offset, s.length); };
  return new City(meta, S);
}

export class City {
  constructor(meta, S) {
    this.meta = meta; this.half = meta.half;
    this.demN = meta.demN; this.dem = Float32Array.from(S('dem'), v => v / 10);
    this.landN = meta.landN; this.land = S('land');
    this.districts = meta.districts;
    // streets
    const sp = S('streetPts'), so = S('streetOff'), sw = S('streetW'), sn = S('streetName');
    this.streets = [];
    for (let s = 0; s + 1 < so.length; s++) {
      const pts = []; for (let k = so[s]; k < so[s + 1]; k++) pts.push([sp[k * 2] / 4, sp[k * 2 + 1] / 4]);
      this.streets.push({ pts, width: sw[s], name: meta.streetNames[sn[s]] });
    }
    // buildings
    const bi = S('bldI'), bs = S('bldS'), n = bi.length / 7;
    this.buildings = new Array(n);
    for (let k = 0; k < n; k++) this.buildings[k] = { x: bi[k * 7] / 4, z: bi[k * 7 + 1] / 4, w: bi[k * 7 + 2] / 10, d: bi[k * 7 + 3] / 10, ang: bi[k * 7 + 4] / 10000, h: bi[k * 7 + 5] / 10, y: bi[k * 7 + 6] / 10, style: STYLE_BY_ID[bs[k * 3]], styleId: bs[k * 3], seed: bs[k * 3 + 1], houses: bs[k * 3 + 2] };
    // trees
    const ti = S('treeI'), ts = S('treeS');
    this.trees = new Float32Array(ti.length / 2 * 4);
    for (let k = 0; k < ti.length / 2; k++) { this.trees[k * 4] = ti[k * 2] / 4; this.trees[k * 4 + 1] = ti[k * 2 + 1] / 4; this.trees[k * 4 + 2] = ts[k * 2]; this.trees[k * 4 + 3] = ts[k * 2 + 1] / 100; }
    // alleys, places, lanes and courts are narrow: an alley in Chinatown is not a 20 m boulevard
    for (const st of this.streets) if (/\b(ALY|ALLEY|PL|LN|WAY|TER|CT|WALK|STPS|STAIRS|PATH|ROW)$/.test(st.name || '')) st.width = Math.min(st.width, 9);
    this._segIndex();
    this._dedupeStreets();
    prepWaterfront(this);
    this._treesOffTheRoad();
    this.colliders = new Colliders(this.half);
    for (const b of this.buildings) this.colliders.addBox(b.x, b.z, b.w, b.d, b.ang, b.y - 2, b.y + b.h, 'building');
    for (const t of TOWERS) { const [x, z] = toXZ(t.lat, t.lon); t.x = x; t.z = z; }
    for (const l of LANDMARKS) { const [x, z] = toXZ(l.lat, l.lon); l.x = x; l.z = z; }
    for (const l of LIBRARIES) { const [x, z] = toXZ(l.lat, l.lon); l.x = x; l.z = z; }
  }
  /* Street segments in a spatial hash: which street is under a point, and how far from its centerline. */
  _segIndex() {
    const CELL = 40, grid = new Map(); this.segCell = CELL; this.segGrid = grid;
    this.streets.forEach((st, si) => {
      for (let k = 0; k + 1 < st.pts.length; k++) {
        const [ax, az] = st.pts[k], [bx, bz] = st.pts[k + 1], r = st.width / 2 + 2;
        const i0 = Math.floor((Math.min(ax, bx) - r) / CELL), i1 = Math.floor((Math.max(ax, bx) + r) / CELL);
        const j0 = Math.floor((Math.min(az, bz) - r) / CELL), j1 = Math.floor((Math.max(az, bz) + r) / CELL);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const key = i * 100000 + j; let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(si, k); }
      }
    });
  }
  /* The tracer sometimes followed one street twice (its trees were listed under two spellings of the name).
     Each shorter trace gives up the stretches that run inside a longer trace of the same street. */
  _dedupeStreets() {
    const len = st => { let L = 0; for (let i = 1; i < st.pts.length; i++) L += Math.hypot(st.pts[i][0] - st.pts[i - 1][0], st.pts[i][1] - st.pts[i - 1][1]); return L; };
    const key = st => (st.name || '').toUpperCase().replace(/\s+/g, ' ').trim();
    const L = this.streets.map(len), K = this.streets.map(key), hits = [], out = [];
    let trimmed = 0;
    this.streets.forEach((st, si) => {
      // densify to ~10 m so trimming is precise
      const pts = [];
      for (let i = 1; i < st.pts.length; i++) { const [ax, az] = st.pts[i - 1], [bx, bz] = st.pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 10)); for (let k = i === 1 ? 0 : 1; k <= n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
      const covered = pts.map(([x, z]) => this.streetsAt(x, z, hits).some(h => h.si !== si && K[h.si] === K[si] && (L[h.si] > L[si] || (L[h.si] === L[si] && h.si < si)) && Math.abs(h.d) < h.half - 1));
      if (!covered.some(Boolean)) { out.push(st); return; }
      trimmed++;
      let run = [];
      pts.forEach((p, i) => { if (!covered[i]) run.push(p); else { if (run.length > 1) out.push({ ...st, pts: run }); run = []; } });
      if (run.length > 1) out.push({ ...st, pts: run });
    });
    this.streets = out; this.dedupe = trimmed;
    this._segIndex();
  }
  // every street whose right-of-way contains (x,z): [{ si, d (signed, left -), half, tx, tz }]
  streetsAt(x, z, out = []) {
    out.length = 0;
    const a = this.segGrid.get(Math.floor(x / this.segCell) * 100000 + Math.floor(z / this.segCell)); if (!a) return out;
    for (let n = 0; n < a.length; n += 2) {
      const st = this.streets[a[n]], [ax, az] = st.pts[a[n + 1]], [bx, bz] = st.pts[a[n + 1] + 1];
      const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, u = ((x - ax) * dx + (z - az) * dz) / L2;
      if (u < -0.02 || u > 1.02) continue;
      const L = Math.sqrt(L2), d = ((x - ax) * dz - (z - az) * dx) / L;
      if (Math.abs(d) <= st.width / 2) out.push({ si: a[n], d, half: st.width / 2, tx: dx / L, tz: dz / L });
    }
    return out;
  }
  // true if (x,z) is on the roadway (between the curbs) of any street
  onRoad(x, z) { for (const h of this.streetsAt(x, z, this._tmp || (this._tmp = []))) if (Math.abs(h.d) < h.half - SIDEWALK + 0.2) return true; return false; }
  /* Street trees are recorded by address; our streets are traced from them and run a few metres off.
     Move every tree that ended up in a roadway onto the nearest sidewalk, and drop any that still can't find one. */
  _treesOffTheRoad() {
    const T = this.trees, keep = [], hits = [];
    let moved = 0, dropped = 0;
    for (let k = 0; k < T.length / 4; k++) {
      let x = T[k * 4], z = T[k * 4 + 1];
      for (let pass = 0; pass < 3; pass++) {
        const road = this.streetsAt(x, z, hits).find(h => Math.abs(h.d) < h.half - SIDEWALK + 0.6);
        if (!road) break;
        const side = road.d >= 0 ? 1 : -1, target = side * (road.half - Math.min(1.3, SIDEWALK * 0.4)), shift = target - road.d;
        x += road.tz * shift; z -= road.tx * shift; moved++;
      }
      if (this.onRoad(x, z)) { dropped++; continue; }
      keep.push(x, z, T[k * 4 + 2], T[k * 4 + 3]);
    }
    this.trees = Float32Array.from(keep);
    this.treeFix = { moved, dropped };
  }
  // Bilinear ground height (metres above sea level)
  heightAt(x, z) {
    const N = this.demN, C = (2 * this.half) / N;
    const fx = (x + this.half) / C - 0.5, fz = (z + this.half) / C - 0.5;
    const i = Math.max(0, Math.min(N - 2, Math.floor(fx))), j = Math.max(0, Math.min(N - 2, Math.floor(fz)));
    const u = Math.min(1, Math.max(0, fx - i)), v = Math.min(1, Math.max(0, fz - j)), k = j * N + i, d = this.dem;
    return (d[k] * (1 - u) + d[k + 1] * u) * (1 - v) + (d[k + N] * (1 - u) + d[k + N + 1] * u) * v;
  }
  landIndex(x, z) {
    const N = this.landN, C = (2 * this.half) / N;
    const i = Math.floor((x + this.half) / C), j = Math.floor((z + this.half) / C);
    if (i < 0 || j < 0 || i >= N || j >= N) return 0;
    return this.land[j * N + i];
  }
  isLand(x, z) { return this.landIndex(x, z) > 0; }
  district(x, z) { const v = this.landIndex(x, z); return v && v !== 255 ? this.districts[v - 1] : v === 255 ? 'Alcatraz' : null; }
}

const ROOFS = new Set(['building', 'tower']);

/* 2D oriented boxes and circles in a spatial hash, for walking collision. */
export class Colliders {
  constructor(half, cell = 32) { this.half = half; this.cell = cell; this.n = Math.ceil(2 * half / cell); this.grid = new Map(); this.items = []; }
  _cells(minx, minz, maxx, maxz, fn) {
    const c = this.cell, h = this.half;
    const i0 = Math.floor((minx + h) / c), i1 = Math.floor((maxx + h) / c), j0 = Math.floor((minz + h) / c), j1 = Math.floor((maxz + h) / c);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * this.n + i);
  }
  _insert(item, r) { const id = this.items.push(item) - 1; item.id = id; item.r = r; this._cells(item.x - r, item.z - r, item.x + r, item.z + r, k => { let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(id); }); return item; }
  /** Take a collider out again (street furniture and parked cars come and go as you move). */
  remove(item) {
    if (!item || item.dead) return; item.dead = true; const r = item.r;
    this._cells(item.x - r, item.z - r, item.x + r, item.z + r, k => { const a = this.grid.get(k); if (!a) return; const i = a.indexOf(item.id); if (i >= 0) a.splice(i, 1); });
    this.items[item.id] = null;
  }
  addBox(x, z, w, d, ang, y0, y1, tag) { return this._insert({ type: 'box', x, z, hw: w / 2, hd: d / 2, c: Math.cos(ang), s: Math.sin(ang), y0, y1, tag }, Math.hypot(w, d) / 2); }
  addCircle(x, z, r, y0, y1, tag) { return this._insert({ type: 'circle', x, z, r, y0, y1, tag }, r); }
  query(x, z, r, fn) {
    const seen = new Set();
    this._cells(x - r, z - r, x + r, z + r, k => { const a = this.grid.get(k); if (a) for (const id of a) if (!seen.has(id)) { seen.add(id); const it = this.items[id]; if (it) fn(it); } });
  }
  // Push a circle (x,z,r) at height y out of everything it overlaps. Returns the corrected position.
  resolve(x, z, r, yFeet, yHead) {
    for (let pass = 0; pass < 4; pass++) {
      let moved = false;
      this.query(x, z, r + 2, it => {
        if (it.solid || yHead < it.y0 || yFeet > it.y1 - 0.4) return;   // above or below it (steps up onto low things)
        if (it.type === 'circle') {
          const dx = x - it.x, dz = z - it.z, d = Math.hypot(dx, dz), m = r + it.r;
          if (d < m) { const k = d > 1e-4 ? (m - d) / d : 1; x += (d > 1e-4 ? dx : 1) * k; z += (d > 1e-4 ? dz : 0) * k; moved = true; }
          return;
        }
        // box: work in the box's frame
        const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c;
        const cx = Math.max(-it.hw, Math.min(it.hw, lx)), cz = Math.max(-it.hd, Math.min(it.hd, lz));
        let ox = lx - cx, oz = lz - cz, d = Math.hypot(ox, oz);
        if (d >= r) return;
        let nx, nz, push;
        if (d > 1e-4) { nx = ox / d; nz = oz / d; push = r - d; }
        else {  // centre inside the box: leave by the nearest face
          const fx = it.hw - Math.abs(lx), fz = it.hd - Math.abs(lz);
          if (fx < fz) { nx = Math.sign(lx) || 1; nz = 0; push = fx + r; } else { nx = 0; nz = Math.sign(lz) || 1; push = fz + r; }
        }
        const wx = nx * it.c - nz * it.s, wz = nx * it.s + nz * it.c;
        x += wx * push; z += wz * push; moved = true;
      });
      if (!moved) break;
    }
    return [x, z];
  }
  // Solid, walkable blocks (temple terraces, steps, piers, interiors): tops are floors, sides are walls.
  addSolid(x, z, w, d, ang, y0, top, tag) { return this._insert({ type: 'box', solid: true, x, z, hw: w / 2, hd: d / 2, c: Math.cos(ang), s: Math.sin(ang), y0, y1: top, tag }, Math.hypot(w, d) / 2); }
  // Highest solid top under (x,z) that a walker with feet at yFeet can step onto; and whether a taller solid blocks.
  floorAt(x, z, yFeet, step, roofs = true) {
    let floor = -Infinity, wall = false;
    this.query(x, z, 0.1, it => {
      const roof = roofs && !it.solid && it.type === 'box' && ROOFS.has(it.tag);
      if (!it.solid && !roof) return;
      const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c;
      if (Math.abs(lx) > it.hw || Math.abs(lz) > it.hd) return;
      // a roof is a floor only from above (you land on it; you never step up onto it)
      if (roof) { if (it.y1 <= yFeet + 0.05 && it.y1 > floor) floor = it.y1; return; }
      if (it.y1 <= yFeet + step) { if (it.y1 > floor) floor = it.y1; }
      else if (it.y0 < yFeet + 1.6) wall = true;
    });
    return { floor, wall };
  }
  blocked(x, z, r, yFeet, yHead) {
    let hit = false;
    this.query(x, z, r + 2, it => {
      if (hit || it.solid || yHead < it.y0 || yFeet > it.y1 - 0.4) return;
      if (it.type === 'circle') { if (Math.hypot(x - it.x, z - it.z) < r + it.r - 0.01) hit = true; return; }
      const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c;
      const cx = Math.max(-it.hw, Math.min(it.hw, lx)), cz = Math.max(-it.hd, Math.min(it.hd, lz));
      if (Math.hypot(lx - cx, lz - cz) < r - 0.01) hit = true;
    });
    return hit;
  }
}
