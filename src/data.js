// Loads data/city.bin + data/city.json and answers spatial questions about the city.
import { STYLE_BY_ID, LANDMARKS, TOWERS, LIBRARIES, toXZ } from './geo.js';

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
    this.colliders = new Colliders(this.half);
    for (const b of this.buildings) this.colliders.addBox(b.x, b.z, b.w, b.d, b.ang, b.y - 2, b.y + b.h, 'building');
    for (const t of TOWERS) { const [x, z] = toXZ(t.lat, t.lon); t.x = x; t.z = z; }
    for (const l of LANDMARKS) { const [x, z] = toXZ(l.lat, l.lon); l.x = x; l.z = z; }
    for (const l of LIBRARIES) { const [x, z] = toXZ(l.lat, l.lon); l.x = x; l.z = z; }
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

/* 2D oriented boxes and circles in a spatial hash, for walking collision. */
export class Colliders {
  constructor(half, cell = 32) { this.half = half; this.cell = cell; this.n = Math.ceil(2 * half / cell); this.grid = new Map(); this.items = []; }
  _cells(minx, minz, maxx, maxz, fn) {
    const c = this.cell, h = this.half;
    const i0 = Math.floor((minx + h) / c), i1 = Math.floor((maxx + h) / c), j0 = Math.floor((minz + h) / c), j1 = Math.floor((maxz + h) / c);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * this.n + i);
  }
  _insert(item, r) { const id = this.items.push(item) - 1; this._cells(item.x - r, item.z - r, item.x + r, item.z + r, k => { let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(id); }); return item; }
  addBox(x, z, w, d, ang, y0, y1, tag) { return this._insert({ type: 'box', x, z, hw: w / 2, hd: d / 2, c: Math.cos(ang), s: Math.sin(ang), y0, y1, tag }, Math.hypot(w, d) / 2); }
  addCircle(x, z, r, y0, y1, tag) { return this._insert({ type: 'circle', x, z, r, y0, y1, tag }, r); }
  query(x, z, r, fn) {
    const seen = new Set();
    this._cells(x - r, z - r, x + r, z + r, k => { const a = this.grid.get(k); if (a) for (const id of a) if (!seen.has(id)) { seen.add(id); fn(this.items[id]); } });
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
  floorAt(x, z, yFeet, step) {
    let floor = -Infinity, wall = false;
    this.query(x, z, 0.1, it => {
      if (!it.solid) return;
      const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c;
      if (Math.abs(lx) > it.hw || Math.abs(lz) > it.hd) return;
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
