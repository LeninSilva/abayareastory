// Close-up city: the things you only see when you're standing in the street, built around you as you move.
// Bay windows that really step out (drawn with the same facade shader, so they match the house), cornices,
// rooftop machinery and wooden water tanks, iron fire escapes, shop awnings, cobra-head street lamps and
// parked cars that follow the slope of the hill. The same car kit drives the traffic.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { landmarkMaterial } from './shaders.js';
import { boxInstances, BASE_DROP } from './buildings.js';
import { LAMP_SP, LAMP_PH, LAMP_MINW, LAMP_REACH } from './ground.js';

const SW = 3.2;
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const CAR_COLORS = [0xe8e8e6, 0xe8e8e6, 0x1a1a1c, 0x1a1a1c, 0x9aa0a6, 0x9aa0a6, 0x5a6068, 0x23324a, 0x7a1c1c, 0x2d4a3a, 0xc8b89a, 0x3a6a8a, 0xb03020, 0x4a4a52];

/* ---------------- a small sky to reflect in paint and glass ---------------- */
let ENV = null;
export function envMap(renderer) {
  if (ENV) return ENV;
  const sc = new THREE.Scene();
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec3 vP; void main(){ float y = normalize(vP).y; vec3 c = y > 0. ? mix(vec3(.95,.9,.84), vec3(.45,.6,.85), pow(y, .6)) : mix(vec3(.55,.52,.48), vec3(.18,.17,.16), pow(-y, .5)); gl_FragColor = vec4(c, 1.); }' });
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), m));
  const pm = new THREE.PMREMGenerator(renderer);
  ENV = pm.fromScene(sc, 0.02).texture; pm.dispose();
  return ENV;
}

/* ---------------- geometry helpers ---------------- */
function frustum(x0, x1, y0, y1, zb, tx0, tx1, zt) {   // a box whose top is narrower: bottom x0..x1 wide zb, top tx0..tx1 wide zt
  const g = new THREE.BoxGeometry(1, 1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const top = p.getY(i) > 0, x = p.getX(i) + 0.5, z = p.getZ(i);
    p.setXYZ(i, top ? tx0 + (tx1 - tx0) * x : x0 + (x1 - x0) * x, top ? y1 : y0, z * (top ? zt : zb));
  }
  g.computeVertexNormals(); return g;
}
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function colored(g, c) { const n = g.attributes.position.count, a = new Float32Array(n * 3), col = new THREE.Color(c); for (let i = 0; i < n; i++) a.set([col.r, col.g, col.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
function strip(g) { for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k); return g; }

/* ---------------- cars: three kinds, four parts each ---------------- */
function carParts(kind) {
  // forward is +x, up is +y, width along z
  const S = [
    { L: 4.5, W: 1.8, b0: 0.3, b1: 0.92, c1: 1.42, cb: [-1.2, 1.3], ct: [-0.85, 0.65], r: 0.32, ax: 1.38 },    // sedan
    { L: 4.7, W: 1.9, b0: 0.36, b1: 1.12, c1: 1.78, cb: [-1.9, 1.25], ct: [-1.95, 0.85], r: 0.36, ax: 1.45 },  // SUV / hatchback
    { L: 5.1, W: 1.95, b0: 0.36, b1: 1.3, c1: 2.2, cb: [-2.5, 1.55], ct: [-2.5, 1.05], r: 0.35, ax: 1.7 }      // van
  ][kind];
  const body = [box(S.L, S.b1 - S.b0, S.W, 0, (S.b0 + S.b1) / 2, 0),
    box(S.L * 0.96, 0.1, S.W * 0.97, 0, S.b1 + 0.02, 0).scale(1, 1, 1),                     // hood and trunk lip
    box(S.ct[1] - S.ct[0] - 0.1, 0.06, S.W * 0.74, (S.ct[0] + S.ct[1]) / 2, S.c1 + 0.03, 0),  // roof
    box(0.2, 0.08, 0.26, S.L * 0.18, S.b1 + 0.28, S.W / 2 + 0.06), box(0.2, 0.08, 0.26, S.L * 0.18, S.b1 + 0.28, -S.W / 2 - 0.06)]; // mirrors
  const glass = [frustum(S.cb[0], S.cb[1], S.b1, S.c1, S.W * 0.46, S.ct[0], S.ct[1], S.W * 0.38)];
  const wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) wheels.push(new THREE.CylinderGeometry(S.r, S.r, 0.24, 14).rotateX(Math.PI / 2).translate(sx * S.ax, S.r, sz * (S.W / 2 - 0.1)));
  const lights = [];
  for (const sz of [-1, 1]) {
    lights.push(colored(box(0.05, 0.12, 0.34, S.L / 2 + 0.02, S.b1 - 0.18, sz * (S.W / 2 - 0.3)), 0xfff6e0));
    lights.push(colored(box(0.05, 0.12, 0.3, -S.L / 2 - 0.02, S.b1 - 0.14, sz * (S.W / 2 - 0.28)), 0xff2a18));
  }
  return { body: mergeGeometries(body.map(strip)), glass: mergeGeometries(glass.map(strip)), wheels: mergeGeometries(wheels.map(strip)), lights: mergeGeometries(lights.map(strip)), L: S.L, W: S.W };
}

/** Instanced cars with a fixed capacity; set(i, x, y, z, ang, pitch, kind, color); commit(). */
export class CarKit {
  constructor(renderer, capacity) {
    const env = envMap(renderer);
    this.cap = capacity;
    this.mats = {
      body: landmarkMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.3, envMap: env }),
      glass: landmarkMaterial({ color: 0x0e1418, metalness: 0.3, roughness: 0.06, envMap: env }),
      wheels: landmarkMaterial({ color: 0x151515, roughness: 0.85 }),
      lights: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })
    };
    this.group = new THREE.Group();
    this.kinds = [0, 1, 2].map(k => {
      const parts = carParts(k), meshes = {};
      for (const part of ['body', 'glass', 'wheels', 'lights']) {
        const m = new THREE.InstancedMesh(parts[part], this.mats[part], capacity);
        m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        if (part === 'body') m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
        meshes[part] = m; this.group.add(m);
      }
      return { meshes, n: 0, L: parts.L, W: parts.W };
    });
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1); this._c = new THREE.Color();
    this._Y = new THREE.Vector3(0, 1, 0); this._Z = new THREE.Vector3(0, 0, 1);
  }
  begin() { for (const k of this.kinds) k.n = 0; }
  add(x, y, z, ang, pitch, kind, color) {
    const K = this.kinds[kind]; if (K.n >= this.cap) return;
    this._q.setFromAxisAngle(this._Y, -ang); this._q2.setFromAxisAngle(this._Z, pitch); this._q.multiply(this._q2);
    this._m.compose(this._v.set(x, y, z), this._q, this._s);
    for (const m of Object.values(K.meshes)) m.setMatrixAt(K.n, this._m);
    K.meshes.body.setColorAt(K.n, this._c.setHex(color));
    K.n++;
  }
  commit() {
    for (const K of this.kinds) for (const m of Object.values(K.meshes)) { m.count = K.n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
  night(n) { this.mats.lights.color.setScalar(0.5 + n * 3.5); for (const k of ['body', 'glass']) this.mats[k].envMapIntensity = 1 - n * 0.85; }
}

/* ---------------- the close-up builder ---------------- */
export function makeDetail(city, renderer, quality) {
  const group = new THREE.Group();
  const RADIUS = quality === 'low' ? 140 : quality === 'medium' ? 220 : 300, CAP = quality === 'low' ? 6000 : 16000;
  // materials
  const prop = landmarkMaterial({ color: 0xffffff, roughness: 0.8 });
  const iron = landmarkMaterial({ color: 0x2b2b2e, roughness: 0.55, metalness: 0.5 });
  const bars = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 3); g.fillRect(0, 29, 64, 3); for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 2, 32); const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t; })();
  const rail = landmarkMaterial({ color: 0x2b2b2e, map: bars, alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.4, roughness: 0.6 });
  const canvasMat = landmarkMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
  const lampPole = landmarkMaterial({ color: 0x6a6e70, metalness: 0.6, roughness: 0.45 });
  const lampGlow = new THREE.MeshBasicMaterial({ color: 0xfff1d6, fog: false });
  // instanced parts with a fixed capacity
  const inst = (geo, mat, cap, color) => { const m = new THREE.InstancedMesh(geo, mat, cap); m.count = 0; m.frustumCulled = false; if (color) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); group.add(m); return m; };
  const P = {
    block: inst(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), prop, CAP, true),        // cornices, rooftop units, chimneys, penthouses
    tank: inst(mergeGeometries([new THREE.CylinderGeometry(0.5, 0.5, 1, 14).translate(0, 0.5, 0), new THREE.ConeGeometry(0.56, 0.35, 14).translate(0, 1.17, 0)].map(strip)), prop, 400, true),
    legs: inst(mergeGeometries([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => new THREE.BoxGeometry(0.08, 1, 0.08).translate(a * 0.3, 0.5, b * 0.3)).map(strip)), iron, 400),
    plat: inst(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), iron, 3000),               // fire escape landings and ladders
    rail: inst(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), rail, 3000),
    awning: inst(new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5), canvasMat, 3000, true),
    pole: inst(mergeGeometries([new THREE.CylinderGeometry(0.07, 0.12, 8.4, 8).translate(0, 4.2, 0), new THREE.CylinderGeometry(0.2, 0.24, 0.5, 8).translate(0, 0.25, 0), new THREE.CylinderGeometry(0.045, 0.045, 1.95, 6).rotateZ(Math.PI / 2 - 0.08).translate(0.97, 8.5, 0)].map(strip)), lampPole, 2500),
    head: inst(mergeGeometries([new THREE.BoxGeometry(0.7, 0.16, 0.34).translate(0, 0, 0)].map(strip)), lampPole, 2500),
    glow: inst(new THREE.BoxGeometry(0.56, 0.03, 0.26), lampGlow, 2500)
  };
  const bays = boxInstances(new Array(CAP / 4).fill(0).map(() => ({ x: 0, y: -9999, z: 0, w: 1, h: 1, d: 1, ang: 0, style: 1, seed: 0, houses: 1, kind: 1 })));
  bays.count = 0; bays.frustumCulled = false; group.add(bays);
  const cars = new CarKit(renderer, quality === 'low' ? 120 : 500); group.add(cars.group);
  group.userData.cars = cars;

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  const put = (mesh, x, y, z, ang, sx, sy, sz, color, tilt = 0) => {
    if (mesh.count >= mesh.instanceMatrix.count) return;
    q.setFromAxisAngle(Y, -ang); if (tilt) { q2.setFromAxisAngle(X, tilt); q.multiply(q2); }
    m4.compose(v.set(x, y, z), q, s.set(sx, sy, sz)); mesh.setMatrixAt(mesh.count, m4);
    if (color !== undefined && mesh.instanceColor) mesh.setColorAt(mesh.count, col.setHex(color));
    mesh.count++;
  };

  /* ---- buildings: which side faces the street, and what to hang on it (cached per building) ---- */
  const CELL = 60, bgrid = new Map();
  city.buildings.forEach((b, i) => { const k = Math.floor(b.x / CELL) * 100000 + Math.floor(b.z / CELL); let a = bgrid.get(k); if (!a) bgrid.set(k, a = []); a.push(i); });
  const bcache = new Map(), hits = [];
  function dressBuilding(i) {
    const b = city.buildings[i], st = b.styleId, ca = Math.cos(b.ang), sa = Math.sin(b.ang), seed = b.seed / 255;
    const W = (lx, lz) => [b.x + lx * ca - lz * sa, b.z + lx * sa + lz * ca];
    // the street side: the face whose outside lies in a street
    let side = 0, best = -1;
    for (const sg of [1, -1]) { const [x, z] = W(0, sg * (b.d / 2 + 5)); for (const h of city.streetsAt(x, z, hits)) { const depth = h.half - Math.abs(h.d); if (depth > best) { best = depth; side = sg; } } }
    const out = { bays: [], blocks: [], tanks: [], plats: [], rails: [], awnings: [] };
    const inset = 1 - 0.012 * (0.3 + seed), fz = b.d / 2 * inset;
    const R = k => hash(i, k, 7);
    const houses = Math.max(1, Math.min(b.houses, Math.floor(b.w / 5.5))), hw = b.w / houses;
    const fh = (st >= 12 && st !== 16 && st !== 17) ? 3.9 : (st === 13 || st === 14) ? 3.8 : 3.15;
    const top = b.y + b.h;
    const trim = st <= 2 ? 0xefe8d8 : st === 10 ? 0xd8cfbf : st === 11 ? 0xf0e6d0 : (st === 13 || st === 14) ? 0xcbc4b4 : st === 12 ? 0x8a7a6a : 0xdcd6c8;
    if (side) {
      // cornice along the street face, with a deeper cap
      if (st !== 5 && st !== 6 && st !== 7 && st !== 16) {
        const [x, z] = W(0, side * (fz + 0.18));
        out.blocks.push([x, top - 0.62, z, b.ang, b.w + 0.3, 0.62, 0.5, trim]);
        const [x2, z2] = W(0, side * (fz + 0.3));
        out.blocks.push([x2, top - 0.14, z2, b.ang, b.w + 0.5, 0.14, 0.72, trim]);
      }
      // bay windows on the painted houses (and some Mission and mansion fronts)
      if ((st === 1 || st === 2 || (st === 11 && R(1) < 0.5) || (st === 4 && R(1) < 0.6)) && b.h > fh + 3.5) {
        for (let k = 0; k < houses; k++) {
          const bw = (st === 4 ? 0.3 : 0.46) * hw, lx = -b.w / 2 + (k + 0.35) * hw, [x, z] = W(lx, side * (fz + 0.42));
          out.bays.push({ x, y: b.y + fh, z, w: bw, h: b.h - fh - 0.95, d: 0.85, ang: b.ang, style: st, seed, houses: 1, hOff: k, yOff: BASE_DROP + fh, fullH: b.h + BASE_DROP, kind: 1 });
        }
      }
      // fire escapes on the brick and apartment blocks
      if ((st === 8 || st === 9 || st === 10 || st === 12) && R(2) < 0.55 && b.h > 9) {
        const floors = Math.floor(b.h / fh), lx = (R(3) - 0.5) * (b.w - 5), wEsc = Math.min(3.2, b.w * 0.4);
        for (let f = 1; f < floors; f++) {
          const y = b.y + f * fh, [x, z] = W(lx, side * (fz + 0.55)), [rx, rz] = W(lx, side * (fz + 1.08));
          out.plats.push([x, y, z, b.ang, wEsc, 0.06, 1.1]);
          out.rails.push([rx, y, rz, b.ang, wEsc, 1.0]);
          if (f + 1 < floors) { const [lx2, lz2] = W(lx + wEsc * 0.3, side * (fz + 0.8)); out.plats.push([lx2, y + 0.05, lz2, b.ang, 0.4, fh * 1.02, 0.06, 0.62]); }
        }
      }
      // awnings over the shops
      if ((st === 9 || st === 10 || st === 11 || (st === 13 && R(4) < 0.5) || (st === 14 && R(4) < 0.3)) && b.h > 6) {
        const cols = Math.max(1, Math.round(b.w / 7));
        for (let k = 0; k < cols; k++) {
          if (R(10 + k) < 0.3) continue;
          const cw = b.w / cols, lx = -b.w / 2 + (k + 0.5) * cw, [x, z] = W(lx, side * fz);
          const c = st === 10 ? [0xa02818, 0x1e5a3c, 0xc8a030][Math.floor(R(20 + k) * 3)] : [0x7a1e1e, 0x1e3a5a, 0x2e4a2e, 0x5a4a3a, 0xa05a1e, 0x1a1a1a][Math.floor(R(20 + k) * 6)];
          out.awnings.push([x, b.y + 3.15 * 0.74 + 0.25, z, b.ang + (side < 0 ? Math.PI : 0), cw * 0.86, 0.06, 1.4, c]);
        }
      }
    }
    // roofs: machinery downtown, tanks on the old brick, chimneys on the houses
    const roofPt = (u, w) => W((u - 0.5) * (b.w - 2 - w), (R(u * 91) - 0.5) * (b.d - 4));
    if (st === 8 || st === 12 || st === 13 || st === 14 || st === 15) {
      const n = 1 + Math.floor(R(5) * 3);
      for (let k = 0; k < n; k++) { const w = 1.2 + R(30 + k) * 1.8, [x, z] = roofPt(R(40 + k), w); out.blocks.push([x, top, z, b.ang, w, 0.9 + R(50 + k) * 1.2, w * (0.6 + R(60 + k) * 0.6), 0x8e9092]); }
      if (R(6) < 0.5 && b.h > 14) { const [x, z] = roofPt(0.3 + R(7) * 0.4, 4); out.blocks.push([x, top, z, b.ang, 3.4, 3.0, 4.2, trim]); }
    }
    if ((st === 9 || st === 10 || st === 12 || st === 8) && R(8) < 0.3 && b.h > 10) { const [x, z] = roofPt(0.2 + R(9) * 0.6, 3); out.tanks.push([x, top, z, 2.6 + R(11)]); }
    if (st === 1 || st === 2 || st === 11 || st === 4) {
      const n = st === 4 ? 2 : 1 + Math.floor(R(12) * 2);
      for (let k = 0; k < n; k++) { const [x, z] = W((R(70 + k) - 0.5) * (b.w - 1.5), (R(80 + k) - 0.5) * (b.d - 3)); out.blocks.push([x, top, z, b.ang, 0.55, 1.1 + R(90 + k) * 0.6, 0.8, 0x8a4a3a]); }
    }
    return out;
  }

  /* ---- places that must stay clear: quest markers, people, doors ---- */
  const reserved = new Map(), RC = 20;
  const isReserved = (x, z, r) => { for (let j = Math.floor((z - r) / RC); j <= Math.floor((z + r) / RC); j++) for (let i = Math.floor((x - r) / RC); i <= Math.floor((x + r) / RC); i++) { const a = reserved.get(i * 100000 + j); if (a) for (const [px, pz] of a) if ((px - x) ** 2 + (pz - z) ** 2 < r * r) return true; } return false; };
  /* ---- streets: lamps and parked cars (cached per street) ---- */
  const scache = new Map();
  function dressStreet(si) {
    const st = city.streets[si], out = { lamps: [], cars: [] };
    if (st.width < LAMP_MINW) return out;
    const roadHalf = st.width / 2 - SW, pts = st.pts;
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    let seg = 0;
    const at = a => { while (seg < pts.length - 2 && cum[seg + 1] < a) seg++; while (seg > 0 && cum[seg] > a) seg--; const l = cum[seg + 1] - cum[seg] || 1, u = (a - cum[seg]) / l, [ax, az] = pts[seg], [bx, bz] = pts[seg + 1]; return [ax + (bx - ax) * u, az + (bz - az) * u, (bx - ax) / l, (bz - az) / l]; };
    const others = (x, z, pad) => city.streetsAt(x, z, hits).some(h => h.si !== si && Math.abs(h.d) < h.half + pad);
    for (let k = 0; LAMP_PH + k * LAMP_SP < L; k++) {
      const [px, pz, tx, tz] = at(LAMP_PH + k * LAMP_SP), side = k % 2 ? 1 : -1, o = side * (roadHalf + 0.45);
      const x = px + tz * o, z = pz - tx * o;
      if (others(x, z, 0) || !city.isLand(x, z) || isReserved(x, z, 2)) continue;
      out.lamps.push([x, city.heightAt(x, z) + 0.3, z, Math.atan2(tx * side, -tz * side), roadHalf + 0.45 - (roadHalf - LAMP_REACH)]);
    }
    if (roadHalf >= 5.4) {
      seg = 0;
      for (let a = 6, n = 0; a < L - 6; a += 6.3, n++) for (const side of [-1, 1]) {
        if (hash(si, n, side + 5) > 0.62) continue;
        const [px, pz, tx, tz] = at(a), o = side * (roadHalf - 1.15), x = px + tz * o, z = pz - tx * o;
        if (others(x, z, 6) || !city.isLand(x, z) || isReserved(x, z, 5)) continue;
        const dir = side > 0 ? 1 : -1, ang = Math.atan2(tz * dir, tx * dir);
        const y0 = city.heightAt(x - tx * dir * 2, z - tz * dir * 2), y1 = city.heightAt(x + tx * dir * 2, z + tz * dir * 2);
        const kind = hash(si, n, side + 11) < 0.6 ? 0 : hash(si, n, side + 13) < 0.8 ? 1 : 2;
        out.cars.push([x, (y0 + y1) / 2 + 0.12, z, ang, Math.atan2(y1 - y0, 4), kind, CAR_COLORS[Math.floor(hash(si, n, side + 17) * CAR_COLORS.length)]]);
      }
    }
    return out;
  }

  /* ---- rebuild around the player ---- */
  const liveColl = new Map();   // key → collider
  let cx = 1e9, cz = 1e9;
  function rebuild(px, pz) {
    cx = px; cz = pz;
    for (const m of Object.values(P)) m.count = 0;
    const bayItems = [];
    const r2 = RADIUS * RADIUS, i0 = Math.floor((px - RADIUS) / CELL), i1 = Math.floor((px + RADIUS) / CELL), j0 = Math.floor((pz - RADIUS) / CELL), j1 = Math.floor((pz + RADIUS) / CELL);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const a = bgrid.get(i * 100000 + j); if (!a) continue;
      for (const bi of a) {
        const b = city.buildings[bi]; if ((b.x - px) ** 2 + (b.z - pz) ** 2 > r2) continue;
        let d = bcache.get(bi); if (!d) bcache.set(bi, d = dressBuilding(bi));
        for (const it of d.bays) bayItems.push(it);
        for (const [x, y, z, ang, w, h, dd, c] of d.blocks) put(P.block, x, y, z, ang, w, h, dd, c);
        for (const [x, y, z, h] of d.tanks) { put(P.legs, x, y, z, 0, 1, 1.2, 1); put(P.tank, x, y + 1.2, z, 0, 2.6, h, 2.6, 0x6a5038); }
        for (const [x, y, z, ang, w, h, dd, tilt] of d.plats) put(P.plat, x, y, z, ang, w, h, dd, undefined, tilt || 0);
        for (const [x, y, z, ang, w, h] of d.rails) put(P.rail, x, y, z, ang, w, h);
        for (const [x, y, z, ang, w, h, dd, c] of d.awnings) put(P.awning, x, y, z, ang, w, h, dd, c, 0.32);
      }
    }
    // bays go through the facade shader
    const ba = bays.geometry.attributes, cap = ba.aStyle.count;
    bays.count = Math.min(cap, bayItems.length);
    for (let k = 0; k < bays.count; k++) {
      const b = bayItems[k];
      q.setFromAxisAngle(Y, -b.ang); m4.compose(v.set(b.x, b.y, b.z), q, s.set(b.w, b.h, b.d)); bays.setMatrixAt(k, m4);
      ba.aStyle.setXYZW(k, b.style, b.seed, 1, 0); ba.aExtra.setXYZW(k, b.hOff, b.yOff, b.fullH, 1);
    }
    bays.instanceMatrix.needsUpdate = true; ba.aStyle.needsUpdate = true; ba.aExtra.needsUpdate = true;
    // streets near here
    const sis = new Set(), SC = city.segCell;
    for (let j = Math.floor((pz - RADIUS) / SC); j <= Math.floor((pz + RADIUS) / SC); j++) for (let i = Math.floor((px - RADIUS) / SC); i <= Math.floor((px + RADIUS) / SC); i++) { const a = city.segGrid.get(i * 100000 + j); if (a) for (let n = 0; n < a.length; n += 2) sis.add(a[n]); }
    cars.begin();
    const keep = new Set();
    for (const si of sis) {
      let d = scache.get(si); if (!d) scache.set(si, d = dressStreet(si));
      d.lamps.forEach(([x, y, z, ang, arm], k) => {
        if ((x - px) ** 2 + (z - pz) ** 2 > r2) return;
        put(P.pole, x, y, z, ang, 1, 1, 1);
        const hx = x + Math.cos(ang) * (arm + 0.2), hz = z + Math.sin(ang) * (arm + 0.2);
        put(P.head, hx, y + 8.55, hz, ang, 1, 1, 1); put(P.glow, hx, y + 8.46, hz, ang, 1, 1, 1);
        const key = 'l' + si + ':' + k; keep.add(key); if (!liveColl.has(key)) liveColl.set(key, city.colliders.addCircle(x, z, 0.16, y - 1, y + 8.6, 'lamp'));
      });
      d.cars.forEach(([x, y, z, ang, pitch, kind, c], k) => {
        if ((x - px) ** 2 + (z - pz) ** 2 > r2) return;
        cars.add(x, y, z, ang, pitch, kind, c);
        const key = 'c' + si + ':' + k; keep.add(key);
        if (!liveColl.has(key)) { const K = cars.kinds[kind]; liveColl.set(key, city.colliders.addBox(x, z, K.L, K.W, ang, y - 1, y + (kind === 2 ? 2.2 : 1.6), 'car')); }
      });
    }
    for (const [key, c] of liveColl) if (!keep.has(key)) { city.colliders.remove(c); liveColl.delete(key); }
    cars.commit();
    for (const m of Object.values(P)) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
  group.userData.update = (px, pz, agl, night) => {
    cars.night(night); lampGlow.color.setScalar(0.35 + night * 3.2);
    group.visible = agl < 260;
    if (!group.visible) return;
    if (Math.hypot(px - cx, pz - cz) > RADIUS * 0.2) rebuild(px, pz);
  };
  group.userData.rebuild = rebuild;
  /** Keep these spots free of cars and lamps: [[x, z], ...]. Clears what was already placed. */
  group.userData.reserve = pts => {
    for (const [x, z] of pts) { const k = Math.floor(x / RC) * 100000 + Math.floor(z / RC); let a = reserved.get(k); if (!a) reserved.set(k, a = []); a.push([x, z]); }
    scache.clear(); cx = 1e9;
  };
  return group;
}
