// Loads data/jiquilpan.bin + data/jiquilpan.json and answers spatial questions about the town and the valley.
import { CLEAR, HALF, PLACES, barrio } from './geo.js';

export const SIDEWALK = 1.6;   // banquetas in Jiquilpan are narrow

export async function loadCity(onProgress) {
  const meta = await (await fetch('data/jiquilpan.json')).json();
  const res = await fetch('data/jiquilpan.bin');
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

class Grid {
  constructor(m, data, scale) { Object.assign(this, m); this.d = Float32Array.from(data, v => v * scale); }
  at(x, z) {
    const n = this.n, fx = (x - this.x0) / (this.x1 - this.x0) * (n - 1), fz = (z - this.z0) / (this.z1 - this.z0) * (n - 1);
    if (!(fx >= 0 && fz >= 0 && fx < n - 1 && fz < n - 1)) return null;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * n + i, d = this.d;
    return (d[k] * (1 - u) + d[k + 1] * u) * (1 - v) + (d[k + n] * (1 - u) + d[k + n + 1] * u) * v;
  }
  // how far inside the grid (0 at the edge), for blending one grid into the next
  inside(x, z) { return Math.min(x - this.x0, this.x1 - x, z - this.z0, this.z1 - z); }
}

export class City {
  constructor(meta, S) {
    this.meta = meta; this.half = HALF; this.walkHalf = 10500; this.flyHalf = 11000;
    this.demTown = new Grid(meta.demTown, S('demTown'), 0.1);
    this.demMid = new Grid(meta.demMid, S('demMid'), 0.1);
    this.demRegion = new Grid(meta.demRegion, S('demRegion'), 1);
    this.cover = S('cover'); this.coverM = meta.cover;
    this.places = meta.places; this.streams = meta.streams;
    // streets: road (kind 0) with sidewalks, footway 1, steps 2, track 3, pedestrian 4
    const sp = S('streetPts'), so = S('streetOff'), si = S('streetInfo');
    this.streets = [];
    for (let s = 0; s + 1 < so.length; s++) {
      const pts = []; for (let k = so[s]; k < so[s + 1]; k++) pts.push([sp[k * 2], sp[k * 2 + 1]]);
      this.streets.push({ pts, width: si[s * 3], kind: si[s * 3 + 1], name: meta.streetNames[si[s * 3 + 2]] || '' });
    }
    const t = S('trees'), keep = [], clear0 = CLEAR.map(([x, z, hw, hd]) => ({ x, z, hw, hd }));
    for (let k = 0; k < t.length / 4; k++) { const x = t[k * 4], z = t[k * 4 + 1]; if (!clear0.some(c => Math.abs(x - c.x) < c.hw && Math.abs(z - c.z) < c.hd)) keep.push(x, z, t[k * 4 + 2], t[k * 4 + 3]); }
    this.trees = Float32Array.from(keep);
    this._segIndex();
    this._anchor(S);
    // buildings: x z w d ang h y style seed houses floors
    const b = this._bld, clear = CLEAR.map(([x, z, hw, hd]) => ({ x, z, hw, hd }));
    this.buildings = [];
    for (let k = 0; k < b.length / 11; k++) {
      const o = k * 11, x = b[o], z = b[o + 1];
      if (clear.some(c => Math.abs(x - c.x) < c.hw && Math.abs(z - c.z) < c.hd)) continue;
      this.buildings.push({ x, z, w: b[o + 2], d: b[o + 3], ang: b[o + 4], h: b[o + 5], y: b[o + 6], styleId: b[o + 7], seed: b[o + 8], houses: b[o + 9], floors: b[o + 10] });
    }
    this.colliders = new Colliders(12000);
    for (const q of this.buildings) this.colliders.addBox(q.x, q.z, q.w, q.d, q.ang, q.y - 3, q.y + q.h, 'building');
  }
  /* The story's invented places, put on real ground: Rosa's garage on a real street frontage,
     Aurelio's house in a real house of San Cayetano. */
  _anchor(S) {
    this._bld = S('bld');
    const near = (x0, z0, test) => { let best = null, bd = Infinity; for (const st of this.streets) { if (!test(st)) continue; for (let k = 0; k + 1 < st.pts.length; k++) { const [ax, az] = st.pts[k], [bx, bz] = st.pts[k + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x0 - ax) * dx + (z0 - az) * dz) / L2)), px = ax + dx * u, pz = az + dz * u, d = Math.hypot(px - x0, pz - z0); if (d < bd) { bd = d; const L = Math.sqrt(L2); best = { x: px, z: pz, tx: dx / L, tz: dz / L, half: st.width / 2 }; } } } return best; };
    const t = PLACES.taller, r = near(t.x, t.z, st => st.kind === 0 && st.width >= 11);
    if (r) {
      let nx = r.tz, nz = -r.tx; if ((t.x - r.x) * nx + (t.z - r.z) * nz < 0) { nx = -nx; nz = -nz; }
      t.x = r.x + nx * (r.half + 7.5); t.z = r.z + nz * (r.half + 7.5); t.ry = Math.atan2(nx, nz);
      const c = CLEAR.find(q => q[0] === 560); if (c) { c[0] = t.x; c[1] = t.z; c[2] = c[3] = 12; }
    }
    // Aurelio's house: the nearest real house to where the story put it, and its street door
    const b = this._bld, a = PLACES.casaAurelio; let bi = -1, bd = Infinity;
    for (let k = 0; k < b.length / 11; k++) { const d = Math.hypot(b[k * 11] - a.x, b[k * 11 + 1] - a.z); if (d < bd && (b[k * 11 + 7] === 41 || b[k * 11 + 7] === 40) && b[k * 11 + 2] > 6) { bd = d; bi = k; } }
    if (bi >= 0) {
      const o = bi * 11, x = b[o], z = b[o + 1], d = b[o + 3], ang = b[o + 4], lzx = -Math.sin(ang), lzz = Math.cos(ang);
      let side = 1; const hits = []; for (const sg of [1, -1]) if (this.streetsAt(x + lzx * sg * (d / 2 + 3), z + lzz * sg * (d / 2 + 3), hits).length) { side = sg; break; }
      a.x = x + lzx * side * (d / 2 + 1.3); a.z = z + lzz * side * (d / 2 + 1.3);
    }
  }
  /* Street segments in a spatial hash. */
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
  onRoad(x, z) { for (const h of this.streetsAt(x, z, this._tmp || (this._tmp = []))) if (this.streets[h.si].kind === 0 && Math.abs(h.d) < h.half - SIDEWALK + 0.2) return true; return false; }
  // ground height: fine near town, coarser in the hills, coarsest across the valley; blended at the seams
  heightAt(x, z) {
    const t = this.demTown.at(x, z), m = this.demMid.at(x, z), r = this.demRegion.at(x, z);
    const far = r === null ? 0 : r;
    const mid = m === null ? far : m;
    if (t === null) { if (m === null) return far; const w = Math.min(1, this.demMid.inside(x, z) / 600); return far + (mid - far) * w; }
    const w = Math.min(1, this.demTown.inside(x, z) / 300); return mid + (t - mid) * w;
  }
  coverAt(x, z) {
    const c = this.coverM, i = Math.floor((x - c.x0) / (c.x1 - c.x0) * c.n), j = Math.floor((z - c.z0) / (c.z1 - c.z0) * c.n);
    return i >= 0 && j >= 0 && i < c.n && j < c.n ? this.cover[j * c.n + i] : 0;
  }
  isLand() { return true; }
  district(x, z) { return barrio(x, z); }
}

/* 2D oriented boxes and circles in a spatial hash, for walking and driving collision. */
const ROOFS = new Set(['building', 'tower', 'roof']);
export class Colliders {
  constructor(half, cell = 32) { this.half = half; this.cell = cell; this.n = Math.ceil(2 * half / cell); this.grid = new Map(); this.items = []; }
  _cells(minx, minz, maxx, maxz, fn) {
    const c = this.cell, h = this.half;
    const i0 = Math.floor((minx + h) / c), i1 = Math.floor((maxx + h) / c), j0 = Math.floor((minz + h) / c), j1 = Math.floor((maxz + h) / c);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * this.n + i);
  }
  _insert(item, r) { const id = this.items.push(item) - 1; item.id = id; item.r = r; this._cells(item.x - r, item.z - r, item.x + r, item.z + r, k => { let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(id); }); return item; }
  remove(item) {
    if (!item || item.dead) return; item.dead = true; const r = item.r;
    this._cells(item.x - r, item.z - r, item.x + r, item.z + r, k => { const a = this.grid.get(k); if (!a) return; const i = a.indexOf(item.id); if (i >= 0) a.splice(i, 1); });
    this.items[item.id] = null;
  }
  addBox(x, z, w, d, ang, y0, y1, tag) { return this._insert({ type: 'box', x, z, hw: w / 2, hd: d / 2, c: Math.cos(ang), s: Math.sin(ang), y0, y1, tag }, Math.hypot(w, d) / 2); }
  addCircle(x, z, r, y0, y1, tag) { return this._insert({ type: 'circle', x, z, r: r, rad: r, y0, y1, tag }, r); }
  query(x, z, r, fn) {
    const seen = new Set();
    this._cells(x - r, z - r, x + r, z + r, k => { const a = this.grid.get(k); if (a) for (const id of a) if (!seen.has(id)) { seen.add(id); const it = this.items[id]; if (it) fn(it); } });
  }
  resolve(x, z, r, yFeet, yHead) {
    for (let pass = 0; pass < 4; pass++) {
      let moved = false;
      this.query(x, z, r + 2, it => {
        if (it.solid || yHead < it.y0 || yFeet > it.y1 - 0.4) return;
        if (it.type === 'circle') {
          const dx = x - it.x, dz = z - it.z, d = Math.hypot(dx, dz), m = r + it.rad;
          if (d < m) { const k = d > 1e-4 ? (m - d) / d : 1; x += (d > 1e-4 ? dx : 1) * k; z += (d > 1e-4 ? dz : 0) * k; moved = true; }
          return;
        }
        const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c;
        const cx = Math.max(-it.hw, Math.min(it.hw, lx)), cz = Math.max(-it.hd, Math.min(it.hd, lz));
        let ox = lx - cx, oz = lz - cz, d = Math.hypot(ox, oz);
        if (d >= r) return;
        let nx, nz, push;
        if (d > 1e-4) { nx = ox / d; nz = oz / d; push = r - d; }
        else { const fx = it.hw - Math.abs(lx), fz = it.hd - Math.abs(lz); if (fx < fz) { nx = Math.sign(lx) || 1; nz = 0; push = fx + r; } else { nx = 0; nz = Math.sign(lz) || 1; push = fz + r; } }
        const wx = nx * it.c - nz * it.s, wz = nx * it.s + nz * it.c;
        x += wx * push; z += wz * push; moved = true;
      });
      if (!moved) break;
    }
    return [x, z];
  }
  addSolid(x, z, w, d, ang, y0, top, tag) { return this._insert({ type: 'box', solid: true, x, z, hw: w / 2, hd: d / 2, c: Math.cos(ang), s: Math.sin(ang), y0, y1: top, tag }, Math.hypot(w, d) / 2); }
  floorAt(x, z, yFeet, step, roofs = true) {
    let floor = -Infinity, wall = false;
    this.query(x, z, 0.1, it => {
      const roof = roofs && !it.solid && it.type === 'box' && ROOFS.has(it.tag);
      if (!it.solid && !roof) return;
      const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c;
      if (Math.abs(lx) > it.hw || Math.abs(lz) > it.hd) return;
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
      if (it.type === 'circle') { if (Math.hypot(x - it.x, z - it.z) < r + it.rad - 0.01) hit = true; return; }
      const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c;
      const cx = Math.max(-it.hw, Math.min(it.hw, lx)), cz = Math.max(-it.hd, Math.min(it.hd, lz));
      if (Math.hypot(lx - cx, lz - cz) < r - 0.01) hit = true;
    });
    return hit;
  }
}
