// Close-up city: the things you only see when you're standing in the street, built around you as you move.
// Bay windows that really step out (drawn with the same facade shader, so they match the house), cornices,
// rooftop machinery and wooden water tanks, iron fire escapes, shop awnings, cobra-head street lamps and
// parked cars that follow the slope of the hill. The same car kit drives the traffic.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { landmarkMaterial } from './shaders.js';
import { boxInstances, BASE_DROP } from './buildings.js';
import { LAMP_SP, LAMP_PH, LAMP_MINW, LAMP_REACH } from './ground.js';

const SW = 1.6;
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

/* ---------------- vehicles of the Ciénega: rounded bodies extruded from real side profiles ----------------
   0 Nissan Tsuru sedan · 1 Renault SUV · 2 combi (Nissan Urvan-style van) · 3 Italika scooter · 4 taxi (Tsuru)
   5 old Toyota pickup · 6 scooter with rider · 7 Nissan March hatch · 8 Vocho · 9 a Japanese electric hatch (rare)
   10 a Porsche (very rare) · 11 a road bicycle with its rider (the jersey takes the instance colour) */
export const KIND = { sedan: 0, suv: 1, van: 2, moto: 3, taxi: 4, pickup: 5, rider: 6, hatch: 7, vocho: 8, ev: 9, porsche: 10, bike: 11 };
const PROFILES = {
  0: { L: 4.3, W: 1.66, r: 0.29, ax: 1.25, body: [[-2.15, .32], [-2.15, .78], [-2.0, .9], [-1.3, .93], [1.12, .93], [1.95, .84], [2.15, .68], [2.15, .32]], glass: [[-1.32, .93], [-.78, 1.38], [.42, 1.4], [1.04, .93]], roof: [-.74, .4, 1.36] },
  1: { L: 4.3, W: 1.82, r: 0.34, ax: 1.32, body: [[-2.15, .45], [-2.15, 1.05], [1.38, 1.05], [2.08, .93], [2.15, .62], [2.15, .45]], glass: [[-2.02, 1.05], [-1.92, 1.6], [.55, 1.63], [1.32, 1.06]], roof: [-1.92, .55, 1.58], rails: true },
  2: { L: 5.0, W: 1.9, r: 0.33, ax: 1.65, body: [[-2.5, .42], [-2.5, 1.28], [2.28, 1.3], [2.5, 1.08], [2.5, .42]], glass: [[-2.45, 1.28], [-2.45, 1.84], [2.0, 1.86], [2.44, 1.32]], roof: [-2.45, 2.02, 1.84, 2.12] },
  5: { L: 4.9, W: 1.76, r: 0.36, ax: 1.6, body: [[-2.45, .48], [-2.45, 1.02], [1.95, 1.02], [2.42, .9], [2.45, .62], [2.45, .48]], glass: [[-.42, 1.02], [-.36, 1.56], [.72, 1.58], [1.42, 1.03]], roof: [-.36, .72, 1.55], bed: true },
  7: { L: 3.8, W: 1.66, r: 0.29, ax: 1.2, body: [[-1.9, .34], [-1.9, .95], [-1.75, .99], [1.2, .95], [1.83, .8], [1.9, .6], [1.9, .34]], glass: [[-1.76, .98], [-1.6, 1.46], [.3, 1.48], [1.14, .96]], roof: [-1.58, .28, 1.44] },
  8: { L: 4.05, W: 1.55, r: 0.3, ax: 1.2, body: [[-2.0, .36], [-2.02, .68], [-1.82, .93], [-1.2, 1.0], [1.15, 1.0], [1.72, .9], [2.0, .64], [2.0, .36]], glass: [[-1.28, 1.0], [-.98, 1.3], [-.4, 1.46], [.35, 1.42], [.82, 1.18], [1.04, 1.0]], roof: [-.8, .3, 1.42], round: true },
  9: { L: 4.45, W: 1.77, r: 0.31, ax: 1.35, body: [[-2.2, .38], [-2.22, .98], [-2.0, 1.03], [1.35, .98], [2.1, .82], [2.22, .62], [2.22, .38]], glass: [[-2.02, 1.02], [-1.75, 1.52], [.35, 1.55], [1.3, .99]], roof: [-1.72, .32, 1.5] },
  10: { L: 4.5, W: 1.85, r: 0.33, ax: 1.22, body: [[-2.25, .3], [-2.26, .74], [-2.0, .86], [-1.25, .92], [1.5, .84], [2.2, .62], [2.25, .3]], glass: [[-1.35, .92], [-.55, 1.26], [.32, 1.27], [1.08, .87]], roof: [-.5, .3, 1.25], low: true }
};
function profileGeo(pts, width, bevel) {
  const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
  const b = bevel || 0.06, g = new THREE.ExtrudeGeometry(sh, { depth: width - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.9, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(width - 2 * b) / 2); return g;
}
function wheelGeo(r, w, x, z) { return [new THREE.CylinderGeometry(r, r, w, 22).rotateX(Math.PI / 2).translate(x, r, z), new THREE.TorusGeometry(r * 0.86, r * 0.16, 6, 22).translate(x, r, z)]; }
function carParts(kind) {
  if (kind === 3 || kind === 6) return motoParts(kind === 6);
  if (kind === 11) return bikeParts();
  const P = PROFILES[kind === 4 ? 0 : kind] || PROFILES[0], W = P.W, L = P.L;
  const body = [profileGeo(P.body, W, P.round ? 0.18 : 0.07)];
  const [r0, r1, ry, ry2] = P.roof; body.push(new THREE.BoxGeometry(r1 - r0, (ry2 || ry + 0.05) - ry + 0.04, W * 0.84).translate((r0 + r1) / 2, (ry + (ry2 || ry + 0.05)) / 2, 0));
  if (P.round) for (const sx of [-1, 1]) for (const sz of [-1, 1]) body.push(new THREE.SphereGeometry(0.42, 14, 10).scale(1.25, 0.9, 0.55).translate(sx * P.ax, 0.55, sz * (W / 2 - 0.12)));
  const glass = [profileGeo(P.glass, W * (P.round ? 0.8 : 0.86), 0.04)];
  const chrome = [], trim = [], wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [t, rim] = wheelGeo(P.r, 0.22, sx * P.ax, sz * (W / 2 - 0.1)); wheels.push(t); chrome.push(rim, new THREE.CircleGeometry(P.r * 0.55, 14).translate(0, 0, 0.112 * sz).rotateY(sz > 0 ? 0 : Math.PI).translate(sx * P.ax, P.r, sz * (W / 2 - 0.1))); }
  // bumpers, grille, mirrors, door seams, a licence plate
  trim.push(new THREE.BoxGeometry(0.14, 0.18, W * 0.98).translate(L / 2 - 0.02, P.body[P.body.length - 1][1] + 0.12, 0), new THREE.BoxGeometry(0.14, 0.18, W * 0.98).translate(-L / 2 + 0.02, P.body[0][1] + 0.12, 0));
  trim.push(new THREE.BoxGeometry(0.03, 0.12, W * 0.42).translate(L / 2 + 0.01, P.body[P.body.length - 2][1] - 0.12, 0));
  for (const sz of [-1, 1]) trim.push(new THREE.BoxGeometry(0.16, 0.1, 0.08).translate(P.glass[P.glass.length - 1][0] - 0.05, P.glass[0][1] + 0.12, sz * (W / 2 + 0.04)));
  for (const sz of [-1, 1]) trim.push(new THREE.BoxGeometry(0.012, (P.body[1][1] - P.body[0][1]) * 0.8, 0.012).translate(P.glass[0][0] + (P.glass[P.glass.length - 1][0] - P.glass[0][0]) * 0.5, (P.body[0][1] + P.body[1][1]) / 2 + 0.05, sz * W / 2));
  chrome.push(new THREE.BoxGeometry(0.02, 0.12, 0.34).translate(L / 2 + 0.06, P.body[P.body.length - 1][1] + 0.12, 0), new THREE.BoxGeometry(0.02, 0.12, 0.34).translate(-L / 2 - 0.06, P.body[0][1] + 0.14, 0));
  if (P.rails) for (const sz of [-1, 1]) trim.push(new THREE.BoxGeometry(r1 - r0, 0.05, 0.05).translate((r0 + r1) / 2, ry + 0.1, sz * W * 0.36));
  if (P.bed) trim.push(new THREE.BoxGeometry(2.0, 0.06, W * 0.86).translate(-1.45, 1.0, 0));
  const lights = [];
  const fy = P.body[P.body.length - 2][1] - 0.1, ry0 = P.body[1][1] - 0.12;
  for (const sz of [-1, 1]) {
    lights.push(colored(new THREE.BoxGeometry(0.05, 0.12, 0.3).translate(L / 2 + 0.01, fy, sz * (W / 2 - 0.28)), 0xfff6e0));
    lights.push(colored(new THREE.BoxGeometry(0.05, 0.14, 0.26).translate(-L / 2 - 0.01, ry0, sz * (W / 2 - 0.25)), 0xff2a18));
  }
  if (kind === 4) lights.push(colored(new THREE.BoxGeometry(0.34, 0.18, 0.72).translate(-0.15, 1.5, 0), 0xfff1b0));
  if (kind === 2) lights.push(colored(new THREE.BoxGeometry(0.06, 0.2, 1.1).translate(2.3, 1.95, 0), 0xfff6d0));
  if (kind === 9) lights.push(colored(new THREE.BoxGeometry(0.04, 0.03, W * 0.7).translate(L / 2 + 0.02, fy + 0.1, 0), 0x6ac8ff));
  const M = a => mergeGeometries(a.map(g => strip(g.index ? g.toNonIndexed() : g)));
  return { body: M(body), glass: M(glass), wheels: M(wheels), lights: M(lights), chrome: M(chrome), trim: M(trim), L, W };
}
function motoParts(rider) {
  // forward +x: a step-through scooter, 1.8 m long
  const body = [box(0.9, 0.12, 0.34, -0.05, 0.36, 0), box(0.16, 0.7, 0.42, 0.5, 0.62, 0), box(0.62, 0.3, 0.4, -0.42, 0.62, 0), box(0.26, 0.12, 0.3, 0.72, 0.4, 0)];
  const glass = [box(0.04, 0.3, 0.36, 0.56, 1.1, 0)];
  const wheels = [new THREE.CylinderGeometry(0.24, 0.24, 0.1, 18).rotateX(Math.PI / 2).translate(0.68, 0.24, 0), new THREE.CylinderGeometry(0.24, 0.24, 0.1, 18).rotateX(Math.PI / 2).translate(-0.62, 0.24, 0), box(0.06, 0.06, 0.62, 0.5, 1.02, 0), box(0.5, 0.12, 0.3, -0.35, 0.83, 0)];
  if (rider) wheels.push(new THREE.CapsuleGeometry(0.17, 0.3, 4, 10).translate(-0.28, 1.2, 0), new THREE.SphereGeometry(0.15, 14, 10).translate(-0.22, 1.62, 0), new THREE.CapsuleGeometry(0.06, 0.42, 4, 8).rotateZ(Math.PI / 2).translate(0.05, 0.84, 0.15), new THREE.CapsuleGeometry(0.06, 0.42, 4, 8).rotateZ(Math.PI / 2).translate(0.05, 0.84, -0.15),
    new THREE.CapsuleGeometry(0.045, 0.45, 4, 8).rotateZ(1.1).translate(0.15, 1.12, 0.2), new THREE.CapsuleGeometry(0.045, 0.45, 4, 8).rotateZ(1.1).translate(0.15, 1.12, -0.2));
  const chrome = [new THREE.TorusGeometry(0.2, 0.025, 6, 18).translate(0.68, 0.24, 0.06), new THREE.TorusGeometry(0.2, 0.025, 6, 18).translate(-0.62, 0.24, 0.06), box(0.3, 0.04, 0.04, -0.85, 0.3, 0.12)];
  const lights = [colored(box(0.05, 0.1, 0.14, 0.6, 0.92, 0), 0xfff6e0), colored(box(0.05, 0.08, 0.16, -0.74, 0.7, 0), 0xff2a18)];
  const M = a => mergeGeometries(a.map(g => strip(g.index ? g.toNonIndexed() : g)));
  return { body: M(body), glass: M(glass), wheels: M(wheels), lights: M(lights), chrome: M(chrome), trim: M([box(0.01, 0.01, 0.01)]), L: 1.8, W: 0.7 };
}
function bikeParts() {
  // a road bike and its rider, heading +x; the jersey, helmet and arms take the instance colour (team kit)
  const tube = (x0, y0, x1, y1, r = 0.018) => { const L = Math.hypot(x1 - x0, y1 - y0), g = new THREE.CylinderGeometry(r, r, L, 6); g.rotateZ(-Math.atan2(x1 - x0, y1 - y0)); return g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0); };
  const body = [new THREE.CapsuleGeometry(0.16, 0.34, 4, 10).rotateZ(-1.0).translate(0.02, 1.1, 0), new THREE.SphereGeometry(0.135, 14, 10).scale(1.25, 0.85, 1).translate(0.38, 1.42, 0),
    new THREE.CapsuleGeometry(0.045, 0.42, 4, 8).rotateZ(-0.9).translate(0.38, 1.12, 0.16), new THREE.CapsuleGeometry(0.045, 0.42, 4, 8).rotateZ(-0.9).translate(0.38, 1.12, -0.16)];
  const wheels = [new THREE.TorusGeometry(0.34, 0.018, 6, 28).translate(0.52, 0.34, 0), new THREE.TorusGeometry(0.34, 0.018, 6, 28).translate(-0.5, 0.34, 0),
    tube(-0.5, 0.34, -0.12, 0.38), tube(-0.12, 0.38, 0.38, 0.86), tube(-0.12, 0.38, -0.2, 0.9), tube(-0.2, 0.9, 0.38, 0.86), tube(-0.5, 0.34, -0.2, 0.9), tube(0.52, 0.34, 0.4, 0.92), box(0.04, 0.04, 0.44, 0.44, 0.94, 0), box(0.22, 0.04, 0.08, -0.2, 0.94, 0),
    new THREE.CapsuleGeometry(0.055, 0.38, 4, 8).rotateZ(0.5).translate(-0.12, 0.66, 0.11), new THREE.CapsuleGeometry(0.055, 0.38, 4, 8).rotateZ(-0.4).translate(-0.08, 0.62, -0.11)];
  const chrome = [new THREE.CircleGeometry(0.06, 10).translate(0, 0, 0.02).translate(-0.12, 0.38, 0)];
  const glass = [new THREE.SphereGeometry(0.11, 12, 8).scale(0.9, 1, 0.95).translate(0.4, 1.34, 0)];
  const lights = [colored(box(0.03, 0.03, 0.05, 0.46, 0.96, 0), 0xffffff), colored(box(0.03, 0.04, 0.05, -0.32, 0.9, 0), 0xff2a18)];
  const M = a => mergeGeometries(a.map(g => strip(g.index ? g.toNonIndexed() : g)));
  return { body: M(body), glass: M(glass), wheels: M(wheels), lights: M(lights), chrome: M(chrome), trim: M([box(0.01, 0.01, 0.01)]), L: 1.75, W: 0.5 };
}

/** Instanced cars with a fixed capacity; set(i, x, y, z, ang, pitch, kind, color); commit(). */
export class CarKit {
  constructor(renderer, capacity) {
    this.cap = capacity;
    this.mats = {
      body: landmarkMaterial({ color: 0xffffff, metalness: 0.55, roughness: 0.28 }),   // clear-coat paint; reflects the live sky (scene.environment)
      glass: landmarkMaterial({ color: 0x0e1418, metalness: 0.3, roughness: 0.05 }),
      wheels: landmarkMaterial({ color: 0x151515, roughness: 0.85 }),
      lights: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }),
      chrome: landmarkMaterial({ color: 0xd8dade, metalness: 0.9, roughness: 0.22 }),
      trim: landmarkMaterial({ color: 0x1a1a1c, roughness: 0.7 })
    };
    this.group = new THREE.Group();
    this.kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => {
      const parts = carParts(k), meshes = {};
      for (const part of ['body', 'glass', 'wheels', 'lights', 'chrome', 'trim']) {
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
    for (const K of this.kinds) for (const m of Object.values(K.meshes)) { m.count = K.n; m.visible = K.n > 0; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
  night(n) { this.mats.lights.color.setScalar(0.5 + n * 3.5); for (const k of ['body', 'glass']) this.mats[k].envMapIntensity = 1 - n * 0.85; }
}

/* ---------------- the close-up builder ---------------- */
export function makeDetail(city, renderer, quality) {
  const group = new THREE.Group();
  const RADIUS = quality === 'low' ? 140 : quality === 'medium' ? 220 : quality === 'high' ? 300 : 380, CAP = quality === 'low' ? 6000 : 16000;
  // materials
  const prop = landmarkMaterial({ color: 0xffffff, roughness: 0.8 });
  const iron = landmarkMaterial({ color: 0x2b2b2e, roughness: 0.55, metalness: 0.5 });
  const bars = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 3); g.fillRect(0, 29, 64, 3); for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 2, 32); const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t; })();
  const rail = landmarkMaterial({ color: 0x2b2b2e, map: bars, alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.4, roughness: 0.6 });
  const canvasMat = landmarkMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
  const lampPole = landmarkMaterial({ color: 0x9a968e, roughness: 0.85 });   // concrete utility poles
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
    pole: inst(mergeGeometries([new THREE.CylinderGeometry(0.1, 0.17, 9.2, 8).translate(0, 4.6, 0), new THREE.BoxGeometry(0.1, 0.1, 1.4).translate(0, 8.9, 0), new THREE.CylinderGeometry(0.04, 0.04, 1.95, 6).rotateZ(Math.PI / 2 - 0.08).translate(0.97, 8.2, 0)].map(strip)), lampPole, 2500),
    head: inst(mergeGeometries([new THREE.BoxGeometry(0.7, 0.16, 0.34).translate(0, 0, 0)].map(strip)), lampPole, 2500),
    glow: inst(new THREE.BoxGeometry(0.56, 0.03, 0.26), lampGlow, 2500),
    // the centro's colonial lamps: a white post on a red base, four globes on scrolled arms
    cpost: inst(mergeGeometries([new THREE.CylinderGeometry(0.07, 0.09, 3.6, 8).translate(0, 2.3, 0), new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8).translate(0, 4.1, 0), new THREE.BoxGeometry(1.0, 0.05, 0.05).translate(0, 3.9, 0), new THREE.BoxGeometry(0.05, 0.05, 1.0).translate(0, 3.9, 0)].map(strip)), landmarkMaterial({ color: 0xf2efe8, roughness: 0.6 }), 1500),
    cbase: inst(mergeGeometries([new THREE.CylinderGeometry(0.16, 0.2, 0.55, 8).translate(0, 0.27, 0), new THREE.CylinderGeometry(0.1, 0.13, 0.5, 8).translate(0, 0.75, 0)].map(strip)), landmarkMaterial({ color: 0xa8281e, roughness: 0.6 }), 1500),
    cglobe: inst(mergeGeometries([[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [0, 0]].map(([x, z], i) => new THREE.SphereGeometry(i < 4 ? 0.17 : 0.2, 10, 8).translate(x, i < 4 ? 4.12 : 4.42, z))), lampGlow, 1500),
    dish: inst(mergeGeometries([new THREE.SphereGeometry(0.38, 12, 6, 0, Math.PI * 2, 0, 0.9).rotateX(-Math.PI / 2 - 0.5), new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5).translate(0, -0.45, 0)].map(strip)), prop, 1500)
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
  // styles: 40 centro, 41 barrio, 42 obra negra, 43 comercio, 44 bodega, 45 escuela
  function dressBuilding(i) {
    const b = city.buildings[i], st = b.styleId, ca = Math.cos(b.ang), sa = Math.sin(b.ang), seed = b.seed / 255;
    const W = (lx, lz) => [b.x + lx * ca - lz * sa, b.z + lx * sa + lz * ca];
    let side = 0, best = -1;
    for (const sg of [1, -1]) { const [x, z] = W(0, sg * (b.d / 2 + 3)); for (const h of city.streetsAt(x, z, hits)) { const depth = h.half - Math.abs(h.d); if (depth > best) { best = depth; side = sg; } } }
    const out = { bays: [], blocks: [], tanks: [], plats: [], rails: [], awnings: [], dishes: [] };
    const fz = b.d / 2 * (1 - 0.01 * (0.3 + seed));
    const R = k => hash(i, k, 7);
    const houses = Math.max(1, Math.min(b.houses, Math.floor(b.w / 5))), hw = b.w / houses;
    const fh = st === 40 || st === 45 ? 3.4 : st === 44 ? 5 : 3;
    const top = b.y + b.h;
    if (side) {
      // a cantera cornice along the centro's fronts
      if (st === 40) { const [x, z] = W(0, side * (fz + 0.15)); out.blocks.push([x, top - 0.55, z, b.ang, b.w + 0.2, 0.55, 0.4, 0xbfa294]); }
      // iron balconies upstairs in the centro
      if (st === 40 && b.floors >= 2) for (let k = 0; k < houses; k++) {
        const cols = Math.max(1, Math.floor(hw / 3.4));
        for (let c = 0; c < cols; c++) {
          if (R(30 + k * 7 + c) < 0.35) continue;
          const lx = -b.w / 2 + k * hw + (c + 0.5) * hw / cols, y = b.y + fh + 0.02, bw = hw / cols * 0.55;
          const [x, z] = W(lx, side * (fz + 0.35)), [rx, rz] = W(lx, side * (fz + 0.68));
          out.plats.push([x, y, z, b.ang, bw + 0.3, 0.1, 0.7]);
          out.rails.push([rx, y + 0.1, rz, b.ang, bw + 0.3, 1.0]);
        }
      }
      // lonas: canvas awnings over the shops
      if ((st === 43 || (st === 40 && R(4) < 0.5)) && b.h > 3) {
        for (let k = 0; k < houses; k++) {
          if (R(10 + k) < 0.4) continue;
          const lx = -b.w / 2 + (k + 0.5) * hw, [x, z] = W(lx, side * fz);
          const c = [0x1e5aa0, 0xc02820, 0x2e7a3a, 0xd8a020, 0xe8e0d0, 0x7a2a6a][Math.floor(R(20 + k) * 6)];
          out.awnings.push([x, b.y + 2.35, z, b.ang + (side < 0 ? Math.PI : 0), hw * 0.8, 0.05, 1.3, c]);
        }
      }
    }
    // the azotea: black tinacos on stands, rebar waiting for the next floor, satellite dishes
    for (let k = 0; k < houses; k++) {
      const lx = -b.w / 2 + (k + 0.5) * hw;
      if (st !== 44 && st !== 45 && R(40 + k) < 0.82) {
        const [x, z] = W(lx + (R(50 + k) - 0.5) * hw * 0.5, (R(60 + k) - 0.5) * (b.d - 3));
        out.tanks.push([x, top, z, R(70 + k) < 0.85 ? 0x1a1a1c : 0x3a5a8a]);
      }
      if ((st === 42 || (st === 41 && R(80 + k) < 0.3)) && b.floors < 3) {
        for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]]) { const [x, z] = W(lx + u * (hw / 2 - 0.2), v * (b.d / 2 - 0.2)); out.plats.push([x, top, z, b.ang, 0.03, 0.9 + R(90 + k + u) * 0.8, 0.03]); }
      }
      if (st !== 44 && R(100 + k) < 0.22) { const [x, z] = W(lx + hw * 0.3, side * (b.d / 2 - 0.6)); out.dishes.push([x, top + 0.9, z, b.ang + (side < 0 ? Math.PI : 0)]); }
    }
    if (st === 44) for (let k = 0; k < 2; k++) { const [x, z] = W((R(110 + k) - 0.5) * (b.w - 3), (R(120 + k) - 0.5) * (b.d - 3)); out.blocks.push([x, top, z, b.ang, 1.4, 0.9, 1.4, 0x8e9092]); }
    return out;
  }

  /* ---- places that must stay clear: quest markers, people, doors ---- */
  const reserved = new Map(), RC = 20;
  const isReserved = (x, z, r) => { for (let j = Math.floor((z - r) / RC); j <= Math.floor((z + r) / RC); j++) for (let i = Math.floor((x - r) / RC); i <= Math.floor((x + r) / RC); i++) { const a = reserved.get(i * 100000 + j); if (a) for (const [px, pz] of a) if ((px - x) ** 2 + (pz - z) ** 2 < r * r) return true; } return false; };
  /* ---- streets: lamps and parked cars (cached per street) ---- */
  const scache = new Map();
  function dressStreet(si) {
    const st = city.streets[si], out = { lamps: [], cars: [] };
    if (st.width < LAMP_MINW || st.kind !== 0) return out;
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
      out.lamps.push([x, city.heightAt(x, z) + 0.3, z, Math.atan2(tx * side, -tz * side), roadHalf + 0.45 - (roadHalf - LAMP_REACH), Math.hypot(x + 60, z + 20) < 520 ? 1 : 0]);
    }
    if (roadHalf >= 2.8) {
      seg = 0;
      for (let a = 6, n = 0; a < L - 6; a += 5.6, n++) for (const side of roadHalf >= 5 ? [-1, 1] : [1]) {
        if (hash(si, n, side + 5) > 0.55) continue;
        const [px, pz, tx, tz] = at(a), o = side * (roadHalf - 1.05), x = px + tz * o, z = pz - tx * o;
        if (others(x, z, 6) || !city.isLand(x, z) || isReserved(x, z, 5)) continue;
        const dir = side > 0 ? 1 : -1, ang = Math.atan2(tz * dir, tx * dir);
        const y0 = city.heightAt(x - tx * dir * 2, z - tz * dir * 2), y1 = city.heightAt(x + tx * dir * 2, z + tz * dir * 2);
        const r = hash(si, n, side + 11), far = Math.hypot(px + 60, pz + 20) > 900;
        if (r < 0.16) {   // an Italika scooter, nosed in against the curb, sometimes two
          const mo = side * (roadHalf - 0.55), mx = px + tz * mo, mz = pz - tx * mo, ma = ang + side * 1.25;
          for (let m = 0; m < (hash(si, n, 31) < 0.3 ? 2 : 1); m++) out.cars.push([mx + tx * m * 0.9, city.heightAt(mx, mz) + 0.05, mz + tz * m * 0.9, ma, 0, 3, [0xc02820, 0x1a1a1c, 0x2850a0, 0xe8e8e6, 0xd86a1a][Math.floor(hash(si, n, 37 + m) * 5)]]);
          continue;
        }
        const h2 = hash(si, n, side + 13), kind = r < 0.42 ? 0 : r < 0.6 ? 7 : r < 0.66 ? 8 : h2 < (far ? 0.55 : 0.35) ? 5 : h2 < 0.75 ? 1 : h2 < 0.8 ? 2 : h2 < 0.81 ? 9 : 0;
        out.cars.push([x, (y0 + y1) / 2 + 0.12, z, ang, Math.atan2(y1 - y0, 4), kind, CAR_COLORS[Math.floor(hash(si, n, side + 17) * CAR_COLORS.length)]]);
      }
    }
    return out;
  }

  /* ---- rebuild around the player ---- */
  const liveColl = new Map();   // key → collider
  const taken = new Set(), live = [], wires = [];
  const wireGeo = new THREE.BufferGeometry(), wireLines = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.8 }));
  wireLines.frustumCulled = false; group.add(wireLines);
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
        for (const [x, y, z, c] of d.tanks) { put(P.legs, x, y, z, 0, 1.4, 0.5, 1.4); put(P.tank, x, y + 0.5, z, 0, 1.1, 1.25, 1.1, c); }
        for (const [x, y, z, ang, w, h, dd, tilt] of d.plats) put(P.plat, x, y, z, ang, w, h, dd, undefined, tilt || 0);
        for (const [x, y, z, ang, w, h] of d.rails) put(P.rail, x, y, z, ang, w, h);
        for (const [x, y, z, ang, w, h, dd, c] of d.awnings) put(P.awning, x, y, z, ang, w, h, dd, c, 0.3);
        for (const [x, y, z, ang] of d.dishes) put(P.dish, x, y, z, ang, 1, 1, 1);
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
    cars.begin(); live.length = 0; wires.length = 0;
    const keep = new Set();
    for (const si of sis) {
      let d = scache.get(si); if (!d) scache.set(si, d = dressStreet(si));
      d.lamps.forEach(([x, y, z, ang, arm, colonial], k) => {
        if ((x - px) ** 2 + (z - pz) ** 2 > r2) return;
        if (colonial) {
          put(P.cbase, x, y - 0.3, z, ang, 1, 1, 1); put(P.cpost, x, y - 0.3, z, ang, 1, 1, 1); put(P.cglobe, x, y - 0.3, z, ang, 1, 1, 1);
          const key = 'l' + si + ':' + k; keep.add(key); if (!liveColl.has(key)) liveColl.set(key, city.colliders.addCircle(x, z, 0.16, y - 1, y + 4, 'lamp'));
          return;
        }
        put(P.pole, x, y, z, ang, 1, 1, 1);
        const hx = x + Math.cos(ang) * (arm + 0.2), hz = z + Math.sin(ang) * (arm + 0.2);
        put(P.head, hx, y + 8.25, hz, ang, 1, 1, 1); put(P.glow, hx, y + 8.16, hz, ang, 1, 1, 1);
        wires.push([x, y + 8.9, z, si, k]);
        const key = 'l' + si + ':' + k; keep.add(key); if (!liveColl.has(key)) liveColl.set(key, city.colliders.addCircle(x, z, 0.16, y - 1, y + 8.6, 'lamp'));
      });
      d.cars.forEach(([x, y, z, ang, pitch, kind, c], k) => {
        if ((x - px) ** 2 + (z - pz) ** 2 > r2) return;
        const key = 'c' + si + ':' + k; if (taken.has(key)) return;
        cars.add(x, y, z, ang, pitch, kind, c); live.push({ key, x, y, z, ang, pitch, kind, color: c }); keep.add(key);
        if (!liveColl.has(key)) { const K = cars.kinds[kind]; liveColl.set(key, city.colliders.addBox(x, z, K.L, K.W, ang, y - 1, y + (kind === 2 ? 2.2 : kind === 3 ? 1.1 : 1.6), 'car')); }
      });
    }
    for (const [key, c] of liveColl) if (!keep.has(key)) { city.colliders.remove(c); liveColl.delete(key); }
    cars.commit();
    // overhead wires between every other pole (the ones on the same side of the street)
    const wp = [];
    for (let i = 0; i < wires.length; i++) for (let j = i + 1; j < Math.min(wires.length, i + 4); j++) {
      const a = wires[i], b = wires[j]; if (a[3] !== b[3] || b[4] !== a[4] + 2) continue;
      const L = Math.hypot(b[0] - a[0], b[2] - a[2]), N = 6;
      for (let t = 0; t < N; t++) for (const u of [t / N, (t + 1) / N]) wp.push(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(Math.PI * u) * L * 0.02, a[2] + (b[2] - a[2]) * u);
    }
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wireGeo.computeBoundingSphere();
    for (const m of Object.values(P)) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
  group.userData.update = (px, pz, agl, night) => {
    cars.night(night); lampGlow.color.setScalar(0.35 + night * 3.2);
    group.visible = agl < 260;
    if (!group.visible) return;
    if (Math.hypot(px - cx, pz - cz) > RADIUS * 0.2) rebuild(px, pz);
  };
  group.userData.rebuild = rebuild;
  /** The parked car nearest (x, z) within r, or null. */
  group.userData.nearestCar = (x, z, r) => { let best = null, bd = r * r; for (const c of live) { const d = (c.x - x) ** 2 + (c.z - z) ** 2; if (d < bd) { bd = d; best = c; } } return best; };
  /** Somebody drove this one away: stop drawing it where it was parked. */
  group.userData.take = key => { taken.add(key); const c = liveColl.get(key); if (c) { city.colliders.remove(c); liveColl.delete(key); } cx = 1e9; };
  /** Keep these spots free of cars and lamps: [[x, z], ...]. Clears what was already placed. */
  group.userData.reserve = pts => {
    for (const [x, z] of pts) { const k = Math.floor(x / RC) * 100000 + Math.floor(z / RC); let a = reserved.get(k); if (!a) reserved.set(k, a = []); a.push([x, z]); }
    scache.clear(); cx = 1e9;
  };
  return group;
}
