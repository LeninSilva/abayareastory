// Hand-modelled landmarks, placed at their true coordinates with true heights.
import * as THREE from 'three';
import { landmarkMaterial } from './shaders.js';
import { LANDMARKS, LIBRARIES, TOWERS, toXZ } from '../geo.js';

const MATS = new Map();
function M(color, opts = {}) { const key = color + JSON.stringify(opts); if (!MATS.has(key)) MATS.set(key, landmarkMaterial(Object.assign({ color }, opts))); return MATS.get(key); }

/* canvas textures: window grids, stripes, signs */
const TEX = new Map();
function windowTex(key, wall, glass, cols, rows, opts = {}) {
  if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
  const cw = 256 / cols, rh = 256 / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    g.fillStyle = glass; const px = opts.px || 0.22, py = opts.py || 0.25;
    if (opts.arch) { g.beginPath(); const x = k * cw + cw * px, w = cw * (1 - 2 * px), y = r * rh + rh * py, h = rh * (1 - py - 0.12); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.fill(); }
    else g.fillRect(k * cw + cw * px, r * rh + rh * py, cw * (1 - 2 * px), rh * (1 - py - 0.12));
  }
  if (opts.bands) { g.fillStyle = opts.bands; for (let r = 0; r < rows; r++) g.fillRect(0, r * rh, 256, rh * 0.08); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  TEX.set(key, t); return t;
}
function signTex(text, fg, bg, vertical) {
  const key = 'sign:' + text + fg + bg + vertical; if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas'); c.width = vertical ? 128 : 512; c.height = vertical ? 512 : 128; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (vertical) { g.font = 'bold 72px Georgia, serif'; [...text].forEach((ch, i) => g.fillText(ch, 64, 50 + i * (412 / Math.max(1, text.length - 1)))); }
  else { g.font = 'bold 64px Georgia, serif'; g.fillText(text, 256, 68); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TEX.set(key, t); return t;
}
function texMat(tex, rx, ry, opts = {}) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return landmarkMaterial(Object.assign({ map: t }, opts)); }

/* geometry helpers */
function box(g, w, h, d, mat, x = 0, y = 0, z = 0, ry = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.rotation.y = ry; g.add(m); return m; }
function cyl(g, rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y + h / 2, z); g.add(m); return m; }
function dome(g, r, h, mat, x = 0, y = 0, z = 0) { const geo = new THREE.SphereGeometry(r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2); geo.scale(1, h / r, 1); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; }
function cone(g, r, h, mat, x = 0, y = 0, z = 0, seg = 4, ry = Math.PI / 4) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat); m.position.set(x, y + h / 2, z); m.rotation.y = ry; g.add(m); return m; }
function gable(g, w, h, d, mat, x = 0, y = 0, z = 0, ry = 0) {  // triangular prism roof along z
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
}
function columns(g, n, r, h, mat, x0, z0, x1, z1, y = 0) { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); cyl(g, r, r * 1.1, h, mat, x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, 10); } }
/** Frustum-like tower from a list of [y, halfX, halfZ] rings (square section). */
function taper(rings, mat) {
  const pos = [], idx = [];
  rings.forEach(([y, hx, hz]) => { pos.push(-hx, y, -hz, hx, y, -hz, hx, y, hz, -hx, y, hz); });
  for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < 4; k++) { const a = r * 4 + k, b = r * 4 + (k + 1) % 4, c = a + 4, d = b + 4; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const ng = geo.toNonIndexed(); ng.computeVertexNormals();
  // planar UVs: around the perimeter and up
  const p = ng.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + p.getZ(i)) / 20; uv[i * 2 + 1] = p.getY(i) / 20; }
  ng.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return new THREE.Mesh(ng, mat);
}
/** Rounded-square loft (Salesforce Tower). */
function roundedLoft(levels, radius, mat) {
  const seg = 6, ring = [];
  const corner = (hs, rr) => { const pts = []; for (const [cx, cz, a0] of [[1, 1, 0], [-1, 1, Math.PI / 2], [-1, -1, Math.PI], [1, -1, Math.PI * 1.5]]) for (let s = 0; s <= seg; s++) { const a = a0 + s / seg * Math.PI / 2; pts.push([cx * (hs - rr) + Math.cos(a) * rr, cz * (hs - rr) + Math.sin(a) * rr]); } return pts; };
  const pos = [], uv = [], idx = [];
  levels.forEach(([y, hs], li) => { const rr = Math.min(radius, hs * 0.9); const pts = corner(hs, rr); pts.forEach(([x, z], k) => { pos.push(x, y, z); uv.push(k / pts.length * 8, y / 12); }); ring.push(pts.length); });
  const n = ring[0];
  for (let l = 0; l < levels.length - 1; l++) for (let k = 0; k < n; k++) { const a = l * n + k, b = l * n + (k + 1) % n; idx.push(a, a + n, b, b, a + n, b + n); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}
function tube(points, r, mat, seg = 64) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg, r, 6), mat); }

/** Place a landmark group: `bearing` is the compass direction its local +x axis points (degrees). */
function place(city, group, lat, lon, bearing = 90, yOff = 0, groundAt) {
  const [x, z] = toXZ(lat, lon);
  const y = groundAt != null ? groundAt : city.heightAt(x, z);
  group.position.set(x, y + yOff, z);
  const b = bearing * Math.PI / 180, dx = Math.sin(b), dz = -Math.cos(b);
  group.rotation.y = -Math.atan2(dz, dx);
  return group;
}
/** Solid footprint for a landmark part, in the landmark's local frame. */
function solid(city, group, lx, lz, w, d, h, y0 = -2) {
  group.updateMatrixWorld(true);
  const p = new THREE.Vector3(lx, 0, lz).applyMatrix4(group.matrixWorld);
  const ang = -group.rotation.y;
  city.colliders.addBox(p.x, p.z, w, d, ang, group.position.y + y0, group.position.y + h, 'landmark');
}

/* ---------------- the landmarks ---------------- */
const BUILD = {
  ferry(city, g) {
    const wall = texMat(windowTex('ferry', '#e2d7c0', '#7d8f99', 8, 2, { arch: true, px: 0.18, py: 0.2 }), 20, 1);
    box(g, 200, 16, 30, wall); box(g, 202, 1.2, 32, M(0xcbbb9c), 0, 16);
    box(g, 196, 4, 26, M(0x9a8f80), 0, 17.2);
    // the clock tower, after the Giralda in Seville
    box(g, 13, 45, 13, texMat(windowTex('ferryT', '#e4d9c2', '#34424c', 2, 6, { arch: true }), 1, 3), 0, 16);
    box(g, 15, 2, 15, M(0xcbbb9c), 0, 60);
    for (const [x, z, ry] of [[0, 7.6, 0], [0, -7.6, Math.PI], [7.6, 0, Math.PI / 2], [-7.6, 0, -Math.PI / 2]]) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), M(0xf4efe2, { emissive: 0x332b18 })); f.position.set(x, 53, z); f.rotation.y = ry; g.add(f);
    }
    box(g, 10, 7, 10, texMat(windowTex('ferryB', '#e4d9c2', '#1d252c', 3, 1, { arch: true }), 1, 1), 0, 62);
    cyl(g, 3.6, 5, 5, M(0xd8ccb4), 0, 69, 0, 16); dome(g, 3.6, 3, M(0x8a8f86), 0, 74); cyl(g, 0.15, 0.15, 5, M(0x333333), 0, 76);
    solid(city, g, 0, 0, 200, 30, 20); solid(city, g, 0, 0, 14, 14, 80);
  },
  transamerica(city, g) {
    const skin = texMat(windowTex('ta', '#e8e3d6', '#55606a', 4, 8, { px: 0.3, py: 0.3 }), 6, 30);
    const main = taper([[0, 26, 26], [212, 7, 7]], skin); g.add(main);
    g.add(taper([[212, 7, 7], [260, 0.3, 0.3]], M(0xdedad0, { metalness: 0.3, roughness: 0.4 })));
    // the two "wings": elevators to the east, stairs to the west
    for (const s of [-1, 1]) { const w = taper([[90, 3.5, 6], [238, 2, 3]], M(0xe0dbcd)); w.position.x = s * 15; w.scale.x = 1; g.add(w); w.position.x = s * (26 - (90 / 212) * 19) * 0.95; }
    // the angled legs at the base
    for (const [x, z] of [[-20, -20], [20, -20], [20, 20], [-20, 20]]) { const leg = box(g, 2.2, 16, 2.2, M(0xcfc9ba), x, 0, z); leg.rotation.z = x > 0 ? 0.25 : -0.25; }
    solid(city, g, 0, 0, 52, 52, 260);
  },
  salesforce(city, g) {
    const lv = []; for (let i = 0; i <= 20; i++) { const t = i / 20, y = t * 296; lv.push([y, 26 - 5.5 * Math.pow(t, 1.3)]); }
    for (let i = 1; i <= 6; i++) { const t = i / 6; lv.push([296 + t * 30, 20.5 - 8 * t * t]); }
    const skin = texMat(windowTex('sf', '#dfe2e3', '#6b7c88', 6, 2, { px: 0.12, py: 0.02, bands: '#cfd4d6' }), 1, 1, { roughness: 0.35, metalness: 0.2 });
    const t = roundedLoft(lv.slice(0, 21), 8, skin); g.add(t);
    const crown = roundedLoft(lv.slice(20), 8, M(0xeaf0f2, { transparent: true, opacity: 0.55, emissive: 0x223038 })); g.add(crown);
    solid(city, g, 0, 0, 52, 52, 326);
  },
  bofa(city, g) {
    const granite = texMat(windowTex('bofa', '#4a2b27', '#2a2226', 3, 4, { px: 0.28, py: 0.14 }), 4, 16, { roughness: 0.4 });
    box(g, 50, 237, 50, granite, 0, 0, 0);
    // sawtooth bay windows: vertical ribs down every face
    const rib = M(0x55322c, { roughness: 0.35 });
    for (let i = -4; i <= 4; i++) { box(g, 2, 225, 2.4, rib, i * 5.5, 0, 25.6).rotation.y = 0.78; box(g, 2, 225, 2.4, rib, i * 5.5, 0, -25.6).rotation.y = 0.78; box(g, 2.4, 225, 2, rib, 25.6, 0, i * 5.5).rotation.y = 0.78; box(g, 2.4, 225, 2, rib, -25.6, 0, i * 5.5).rotation.y = 0.78; }
    box(g, 38, 8, 30, granite, -4, 237, 4); box(g, 24, 6, 18, granite, 6, 237, -8);
    solid(city, g, 0, 0, 52, 52, 245);
  },
  coit(city, g) {
    const geo = new THREE.CylinderGeometry(5.6, 5.9, 64, 48, 8, true), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z) * (1 + 0.04 * Math.cos(a * 16)); p.setX(i, Math.cos(a) * r); p.setZ(i, Math.sin(a) * r); }
    geo.computeVertexNormals(); const shaft = new THREE.Mesh(geo, M(0xe9e1d0)); shaft.position.y = 32; g.add(shaft);
    // arched windows under the crown
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(g, 1.4, 4, 0.4, M(0x2c3238), Math.cos(a) * 5.7, 56, Math.sin(a) * 5.7, -a); }
    cyl(g, 6.3, 6.3, 1.2, M(0xdad2c0), 0, 63.5, 0, 32);
    box(g, 26, 7, 26, M(0xe4dccb)); box(g, 28, 1, 28, M(0xd2c8b4), 0, 7);
    solid(city, g, 0, 0, 26, 26, 70);
  },
  sutro(city, g) {
    const red = M(0xc4402e), white = M(0xeeeae2);
    const legs = [0, 1, 2].map(i => i / 3 * Math.PI * 2 + Math.PI / 2);
    const baseR = 36, midR = 11;
    for (const a of legs) {
      const x0 = Math.cos(a) * baseR, z0 = Math.sin(a) * baseR, x1 = Math.cos(a) * midR, z1 = Math.sin(a) * midR;
      const pts = [new THREE.Vector3(x0, 0, z0), new THREE.Vector3((x0 + x1) / 2, 120, (z0 + z1) / 2), new THREE.Vector3(x1, 210, z1), new THREE.Vector3(x1 * 0.9, 262, z1 * 0.9)];
      g.add(tube(pts, 2.4, red, 40));
      cyl(g, 0.7, 0.9, 38, white, x1 * 0.9, 262, z1 * 0.9, 8);
    }
    for (const [y, r] of [[60, 28], [140, 18], [210, 11], [262, 10]]) {
      for (let i = 0; i < 3; i++) { const a = legs[i], b = legs[(i + 1) % 3]; const pa = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), pb = new THREE.Vector3(Math.cos(b) * r, y, Math.sin(b) * r); g.add(tube([pa, pa.clone().lerp(pb, 0.5), pb], 1.1, y > 200 ? red : white, 8)); }
    }
    for (const a of legs) solid(city, g, Math.cos(a) * baseR, Math.sin(a) * baseR, 5, 5, 30);
  },
  cityhall(city, g) {
    const wall = texMat(windowTex('ch', '#d9d4c8', '#43505a', 3, 3, { arch: true, px: 0.3 }), 16, 1);
    box(g, 124, 25, 93, wall); box(g, 126, 2, 95, M(0xcfc9ba), 0, 25);
    columns(g, 16, 1.1, 18, M(0xe6e1d6), -30, 47.5, 30, 47.5, 5); columns(g, 16, 1.1, 18, M(0xe6e1d6), -30, -47.5, 30, -47.5, 5);
    box(g, 30, 6, 4, M(0xd8d2c4), 0, 23, 48);
    cyl(g, 22, 22, 18, texMat(windowTex('chd', '#dcd6ca', '#3a4650', 16, 1, { arch: true, px: 0.3 }), 4, 1), 0, 27, 0, 48);
    columns(g, 1, 0, 0, M(0), 0, 0, 0, 0);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; cyl(g, 0.8, 0.8, 16, M(0xece7dd), Math.cos(a) * 22.8, 28, Math.sin(a) * 22.8, 8); }
    dome(g, 20.5, 26, M(0x9aa597, { roughness: 0.6, metalness: 0.2 }), 0, 45);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * Math.PI / 2; pts.push(new THREE.Vector3(Math.cos(a) * 20.7 * Math.cos(t), 45 + 26 * Math.sin(t), Math.sin(a) * 20.7 * Math.cos(t))); } g.add(tube(pts, 0.35, M(0xd9b24a, { metalness: 0.7, roughness: 0.3 }), 12)); }
    cyl(g, 4.5, 5, 9, M(0xe6e1d6), 0, 70, 0, 16); dome(g, 4.5, 4, M(0xd9b24a, { metalness: 0.7, roughness: 0.3 }), 0, 79); cyl(g, 0.3, 0.6, 11, M(0xd9b24a, { metalness: 0.7 }), 0, 83, 0, 8);
    solid(city, g, 0, 0, 124, 93, 30);
  },
  library(city, g) { box(g, 110, 30, 58, texMat(windowTex('lib', '#d8d1c3', '#3e4b56', 4, 5, {}), 10, 2)); box(g, 112, 1.5, 60, M(0xc9c1b1), 0, 30); solid(city, g, 0, 0, 110, 58, 32); },
  unplaza(city, g) {
    box(g, 60, 0.4, 44, M(0xbdb6aa));
    for (let i = 0; i < 12; i++) box(g, 3 + (i % 3), 1 + (i % 4) * 0.6, 3, M(0x8a847a), -12 + (i % 4) * 6, 0.4, -6 + Math.floor(i / 4) * 6);
    for (let i = 0; i < 8; i++) { cyl(g, 0.12, 0.12, 12, M(0xdddddd), -26 + i * 7.4, 0, 18, 6); }
    solid(city, g, 0, 0, 22, 16, 3);
  },
  warmemorial(city, g) { box(g, 70, 26, 55, texMat(windowTex('wm', '#dcd6ca', '#44515c', 3, 2, { arch: true }), 8, 1)); columns(g, 12, 1, 14, M(0xe8e3d8), -24, 28, 24, 28, 8); solid(city, g, 0, 0, 70, 55, 30); },
  operahouse(city, g) { BUILD.warmemorial(city, g); },
  flood(city, g) {
    const wall = texMat(windowTex('flood', '#d7d0c2', '#3f4a54', 3, 12, {}), 10, 1);
    box(g, 50, 49, 40, wall, 8, 0, 0); cyl(g, 11, 11, 49, texMat(windowTex('floodc', '#d7d0c2', '#3f4a54', 6, 12, {}), 2, 1), -17, 0, 10, 32);
    box(g, 52, 2, 42, M(0xc7bfae), 8, 49); solid(city, g, 0, 0, 72, 44, 52);
  },
  paintedladies(city, g) {
    // seven Queen Anne Victorians on Steiner Street, facing west over Alamo Square
    const colors = [0x93aec2, 0xe6c987, 0xd9a0a6, 0xa6c69f, 0xeee0c2, 0xb4a1c9, 0x86a7bd], trim = M(0xf6f2e8), dark = M(0x2d3440);
    for (let i = 0; i < 7; i++) {
      const z = -i * 7.8, wall = M(colors[i]), acc = M([0x6a2f3a, 0x2f4a6a, 0x3f6a4a, 0x7a5a2a][i % 4]);
      box(g, 20, 10, 7.4, wall, 0, 0, z);
      gable(g, 7.4, 5.2, 20, wall, 0, 10, z, Math.PI / 2);
      gable(g, 8, 5.8, 1.2, trim, -10.4, 9.8, z, Math.PI / 2);          // the decorated gable end
      box(g, 2.6, 7, 4.2, wall, -11.2, 1.8, z + 1.2);                   // the bay window
      for (const zz of [-0.9, 0.9]) box(g, 0.2, 2, 0.9, dark, -12.6, 3, z + 1.2 + zz), box(g, 0.2, 2, 0.9, dark, -12.6, 6.4, z + 1.2 + zz);
      box(g, 0.2, 2.4, 1.2, dark, -12.6, 5, z + 1.2);
      box(g, 0.3, 0.4, 7.6, trim, -10.2, 9.8, z); box(g, 0.3, 0.3, 4.4, trim, -12.6, 8.8, z + 1.2);
      box(g, 0.2, 2.8, 1.4, acc, -10.2, 1.4, z - 2.4);                    // front door
      for (let s = 0; s < 6; s++) box(g, 1.2, 0.25, 1.6, trim, -10.8 - s * 0.35, s * 0.25, z - 2.4);   // stoop
      box(g, 0.2, 1.4, 1.1, dark, -10.2, 7, z - 2.3);
    }
    solid(city, g, 0, -23.4, 22, 55, 16);
  },
  palacefa(city, g) {
    const ochre = M(0xc8966e), pale = M(0xd9b894);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cyl(g, 1.8, 2, 30, pale, Math.cos(a) * 18, 0, Math.sin(a) * 18, 12); }
    cyl(g, 19, 19, 5, ochre, 0, 28, 0, 8); dome(g, 18.5, 17, M(0xc98d62), 0, 33); cyl(g, 2, 2, 4, pale, 0, 49, 0, 12);
    for (let i = 0; i < 26; i++) { const a = -1.4 + i / 25 * 2.8; cyl(g, 1, 1.1, 14, pale, Math.cos(a) * 95 + 40, 0, Math.sin(a) * 95, 10); if (i % 3 === 0) box(g, 4, 18, 4, pale, Math.cos(a) * 102 + 40, 0, Math.sin(a) * 102); }
    const lagoon = new THREE.Mesh(new THREE.CircleGeometry(60, 40), M(0x4f7f78, { roughness: 0.15, metalness: 0.2 })); lagoon.rotation.x = -Math.PI / 2; lagoon.position.set(75, 0.4, 0); lagoon.scale.set(1, 1.6, 1); g.add(lagoon);
    solid(city, g, 0, 0, 36, 36, 50);
  },
  missiondolores(city, g) {
    const adobe = M(0xf1ece0), tile = M(0xa9573c);
    box(g, 35, 10, 8, adobe); gable(g, 9, 3.6, 36, tile, 0, 10, 0, Math.PI / 2);
    box(g, 1, 11, 9.4, adobe, -18, 0, 0); for (const z of [-2.6, 0, 2.6]) cyl(g, 0.45, 0.5, 8, M(0xe7e0cf), -18.8, 0, z, 8);
    for (const z of [-2.2, 0, 2.2]) box(g, 0.4, 1.4, 1, M(0x6d5230), -18.6, 11.5, z);
    // the Basilica next door
    box(g, 40, 18, 22, M(0xece0c6), 5, 0, 18); for (const z of [9, 27]) { box(g, 7, 34, 7, M(0xece0c6), -15, 0, z); cone(g, 4, 8, M(0xd9c7a2), -15, 34, z, 8); }
    solid(city, g, 0, 0, 36, 9, 13); solid(city, g, 5, 18, 42, 24, 36);
  },
  castro(city, g) {
    box(g, 12, 16, 40, M(0xd9c4a0)); box(g, 1, 3, 20, M(0x2a2830, { emissive: 0x201810 }), -6.5, 5, 0);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 15, 3), [M(0x8a2f24), M(0x8a2f24), M(0x8a2f24), M(0x8a2f24), landmarkMaterial({ map: signTex('CASTRO', '#ffe9a8', '#8a2f24', true), emissive: 0x663311 }), landmarkMaterial({ map: signTex('CASTRO', '#ffe9a8', '#8a2f24', true), emissive: 0x663311 })]);
    sign.rotation.y = Math.PI / 2; sign.position.set(-7, 16, 0); g.add(sign);
    solid(city, g, 0, 0, 12, 40, 18);
  },
  stignatius(city, g) {
    const buff = M(0xdcc9a4);
    box(g, 70, 26, 34, buff); gable(g, 34, 10, 70, M(0x8e7a62), 0, 26, 0, 0);
    for (const z of [-14, 14]) { box(g, 10, 52, 10, buff, -36, 0, z); cyl(g, 4, 5, 6, buff, -36, 52, z, 8); dome(g, 4, 5, M(0x9aa597), -36, 58, z); cyl(g, 0.2, 0.2, 5, M(0x333333), -36, 63, z, 6); }
    solid(city, g, 0, 0, 72, 36, 30); solid(city, g, -36, 0, 11, 40, 60);
  },
  sfsu(city, g) {
    const w = texMat(windowTex('sfsu', '#d7d2c7', '#40505c', 5, 3, {}), 4, 1);
    box(g, 90, 18, 40, w, -60, 0, -70); box(g, 70, 22, 40, texMat(windowTex('lib2', '#c9d2d6', '#3a5060', 8, 4, { px: 0.08 }), 4, 1), 60, 0, -70);
    box(g, 60, 14, 50, w, -80, 0, 60); box(g, 80, 12, 36, w, 70, 0, 70);
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), M(0x5d8a3a)); lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.3; g.add(lawn);
    for (const [x, z, a, b] of [[-60, -70, 90, 40], [60, -70, 70, 40], [-80, 60, 60, 50], [70, 70, 80, 36]]) solid(city, g, x, z, a, b, 22);
  },
  parkmerced(city, g) {
    const w = texMat(windowTex('pm', '#e7e0d0', '#4a5663', 6, 13, {}), 3, 1);
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, x = Math.cos(a) * 95, z = Math.sin(a) * 95; const t = box(g, 22, 40, 22, w, x, 0, z); t.rotation.y = a; solid(city, g, x, z, 22, 22, 42); }
  },
  dragongate(city, g) {
    const stone = M(0xc9c1b0), green = M(0x3f7a52), red = M(0xa3382c);
    for (const x of [-7, -2.5, 2.5, 7]) box(g, 1.2, 6, 1.2, stone, x, 0, 0);
    box(g, 6, 1.2, 2.4, red, 0, 6, 0); gable(g, 7.5, 1.8, 3.2, green, 0, 7.2, 0, Math.PI / 2 * 0);
    box(g, 4, 0.8, 2, red, -4.7, 5, 0); box(g, 4, 0.8, 2, red, 4.7, 5, 0);
    gable(g, 5, 1.2, 2.6, green, -4.7, 5.8, 0); gable(g, 5, 1.2, 2.6, green, 4.7, 5.8, 0);
    for (const x of [-7, 7]) solid(city, g, x, 0, 1.4, 1.4, 7); for (const x of [-2.5, 2.5]) solid(city, g, x, 0, 1.4, 1.4, 7);
  },
  tinhow(city, g) {
    box(g, 12, 16, 18, M(0x9b7f68)); box(g, 1.2, 1.2, 14, M(0x3f7a52), -6.6, 13, 0);
    for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), M(0xd8342a, { emissive: 0x8a1a10 })); l.position.set(-7, 12.2, -5 + i * 2.5); g.add(l); }
    solid(city, g, 0, 0, 12, 18, 16);
  },
  peterpaul(city, g) {
    const white = M(0xf0ece2);
    box(g, 24, 22, 60, white, 0, 0, -12); for (const x of [-9, 9]) { box(g, 7, 42, 7, white, x, 0, 16); cone(g, 3.6, 16, M(0xe6e0d2), x, 42, 16, 8, 0); }
    box(g, 12, 16, 3, white, 0, 0, 18); gable(g, 24, 6, 60, M(0xb8b2a4), 0, 22, -12, 0);
    solid(city, g, 0, -2, 26, 44, 60);
  },
  citylights(city, g) {
    box(g, 10, 13, 22, M(0x9a6c52));
    const s = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), landmarkMaterial({ map: signTex('CITY LIGHTS', '#f5dc8a', '#2a2622', false), emissive: 0x332a10 })); s.position.set(-5.1, 5, 0); s.rotation.y = -Math.PI / 2; g.add(s);
    solid(city, g, 0, 0, 10, 22, 13);
  },
  oracle(city, g) {
    const brick = texMat(windowTex('op', '#8a4a36', '#2c2f36', 6, 3, { arch: true }), 12, 1);
    const shape = new THREE.Shape(); shape.absarc(0, 0, 118, -0.3, Math.PI * 1.3, false); shape.absarc(0, 0, 78, Math.PI * 1.3, -0.3, true);
    const stands = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 32, bevelEnabled: false, curveSegments: 40 }), brick); stands.rotation.x = -Math.PI / 2; g.add(stands);
    const field = new THREE.Mesh(new THREE.CircleGeometry(78, 40), M(0x4f8a36)); field.rotation.x = -Math.PI / 2; field.position.y = 0.4; g.add(field);
    box(g, 9, 44, 9, M(0x7a3f2e), -70, 0, 95); cyl(g, 3.5, 3.5, 3, M(0xf2efe2, { emissive: 0x333322 }), -70, 34, 99.6, 20);
    for (const a of [0.2, 1.4, 2.6, 3.7]) cyl(g, 0.8, 1, 50, M(0xdddddd), Math.cos(a) * 125, 0, Math.sin(a) * 125, 8);
    solid(city, g, 0, 0, 190, 190, 34, 40);
  },
  conservatory(city, g) {
    const white = M(0xf6f6f2), glass = M(0xd9ece8, { transparent: true, opacity: 0.8, roughness: 0.2 });
    cyl(g, 9, 9, 10, glass, 0, 0, 0, 24); dome(g, 9.5, 10, glass, 0, 10); cyl(g, 1.5, 2, 4, white, 0, 19, 0, 12);
    for (const s of [-1, 1]) { box(g, 34, 8, 12, glass, s * 24, 0, 0); const r = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 34, 20, 1, false, 0, Math.PI), glass); r.rotation.z = Math.PI / 2; r.rotation.y = 0; r.position.set(s * 24, 8, 0); g.add(r); box(g, 10, 12, 14, glass, s * 44, 0, 0); }
    solid(city, g, 0, 0, 100, 16, 20);
  },
  deyoung(city, g) {
    const copper = texMat(windowTex('dy', '#8a5a3c', '#6a4a30', 16, 16, { px: 0.4, py: 0.4 }), 4, 4, { roughness: 0.7, metalness: 0.3 });
    box(g, 160, 12, 60, copper, 0, 0, 0);
    const t = new THREE.BoxGeometry(22, 44, 22, 1, 8, 1); t.translate(0, 22, 0); const p = t.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = y / 44 * 0.7, x = p.getX(i), z = p.getZ(i); p.setX(i, x * Math.cos(a) - z * Math.sin(a)); p.setZ(i, x * Math.sin(a) + z * Math.cos(a)); }
    t.computeVertexNormals(); const tw = new THREE.Mesh(t, copper); tw.position.set(60, 0, 15); g.add(tw);
    solid(city, g, 0, 0, 160, 60, 14); solid(city, g, 60, 15, 26, 26, 44);
  },
  academy(city, g) {
    box(g, 170, 12, 110, texMat(windowTex('ca', '#d2d6d4', '#50616a', 10, 2, { px: 0.05 }), 4, 1));
    for (const [x, z, r] of [[-50, -20, 22], [-10, 10, 26], [35, -15, 22], [55, 30, 16], [-40, 32, 16], [10, -38, 14], [70, -35, 14]]) dome(g, r, r * 0.5, M(0x5b8a3a), x, 12, z);
    solid(city, g, 0, 0, 170, 110, 14);
  },
  davidson(city, g) { const c = M(0xd9d4c8); box(g, 3, 31, 3, c); box(g, 12, 3, 3, c, 0, 21); solid(city, g, 0, 0, 3.5, 3.5, 31); },
  alcatraz(city, g, y0) {
    const rock = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(0x6f6a5a)); rock.scale.set(250, 40, 100); g.add(rock);
    box(g, 150, 18, 40, texMat(windowTex('alc', '#cfc9b8', '#2a2e33', 10, 3, {}), 6, 1), 10, 32, 5);
    cyl(g, 2.5, 3.2, 26, M(0xe9e4d8), -70, 36, 0, 12); cyl(g, 2.2, 2.2, 3, M(0xfff1b0, { emissive: 0x665522 }), -70, 62, 0, 12);
    box(g, 30, 10, 14, M(0xb9ae98), -30, 30, -30);
    box(g, 14, 30, 14, M(0xd6d2c4), 90, 30, -20);
    solid(city, g, 0, 0, 440, 170, 60, -30);
  },
  lombard(city, g) {
    const brick = M(0x9a4a3a), hedge = M(0x3f6e36), flower = M(0xd46a8a);
    for (let i = 0; i < 8; i++) {
      const z = -55 + i * 14, s = i % 2 ? 1 : -1;
      const road = box(g, 4, 0.3, 26, brick, 0, 0, z); road.rotation.y = s * 0.55;
      box(g, 3, 1, 8, hedge, s * 7, 0, z + 5); box(g, 2, 0.8, 5, flower, -s * 7, 0.3, z - 3);
    }
  },
  grace(city, g) {
    const c = M(0xc6c3bc);
    box(g, 50, 24, 90, c, 0, 0, 0); gable(g, 50, 12, 90, M(0x8a8a86), 0, 24, 0);
    for (const x of [-18, 18]) { box(g, 14, 62, 14, c, x, 0, -48); cone(g, 6, 10, c, x, 62, -48, 4); }
    const rose = new THREE.Mesh(new THREE.CircleGeometry(7, 24), M(0x5a4a7a, { emissive: 0x1a1030 })); rose.position.set(0, 30, -45.2); rose.rotation.y = Math.PI; g.add(rose);
    solid(city, g, 0, -8, 52, 104, 40);
  },
  cliffhouse(city, g) {
    box(g, 50, 14, 24, M(0xe3ddd0), 0, 0, 0);
    for (let i = 0; i < 5; i++) box(g, 18, 1.2, 60, M(0x9a948a), -40 + (i % 2) * 12, -12 + i * 0.5, -70 - i * 10);
    solid(city, g, 0, 0, 50, 24, 16);
  },
  legion(city, g) {
    const w = M(0xefeade);
    box(g, 70, 16, 12, w, 0, 0, 30); box(g, 12, 16, 60, w, -30, 0, 0); box(g, 12, 16, 60, w, 30, 0, 0); columns(g, 10, 0.9, 12, w, -24, 24, 24, 24, 0);
    box(g, 30, 4, 12, M(0xdfd9cb), 0, 0, -30); cyl(g, 1.2, 1.2, 3.5, M(0x3a3226), 0, 4, -30, 8);
    solid(city, g, 0, 30, 70, 12, 18); solid(city, g, -30, 0, 12, 60, 18); solid(city, g, 30, 0, 12, 60, 18);
  },
  fortpoint(city, g) { box(g, 50, 16, 50, texMat(windowTex('fp', '#8e5040', '#2a2020', 8, 3, { arch: true }), 3, 1)); solid(city, g, 0, 0, 50, 50, 18); },
  palacehotel(city, g) { box(g, 90, 32, 70, texMat(windowTex('ph', '#e0d6c2', '#41505a', 3, 8, {}), 14, 1)); box(g, 92, 1.5, 72, M(0xcfc5b1), 0, 32); solid(city, g, 0, 0, 90, 70, 34); },
  pactel(city, g) {
    const w = texMat(windowTex('pt', '#e6e0d4', '#3f4a54', 3, 10, { px: 0.3 }), 6, 8);
    box(g, 42, 90, 30, w); box(g, 34, 20, 24, w, 0, 90); box(g, 24, 16, 16, w, 0, 110); box(g, 12, 6, 8, w, 0, 126);
    solid(city, g, 0, 0, 42, 30, 132);
  },
  unionsq(city, g) {
    box(g, 90, 0.5, 90, M(0xc9c1b2)); cyl(g, 1.3, 1.6, 26, M(0xe3ddd0), 0, 0.5, 0, 16);
    const v = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4, 6), M(0xc9a43a, { metalness: 0.7, roughness: 0.3 })); v.position.set(0, 29, 0); g.add(v);
    for (const [x, z] of [[-35, -35], [35, -35], [35, 35], [-35, 35]]) { cyl(g, 0.35, 0.45, 9, M(0x7a6450), x, 0, z, 6); dome(g, 2.8, 2, M(0x5d7f3a), x, 9, z); }
    solid(city, g, 0, 0, 3.2, 3.2, 26);
  },
  lotta(city, g) { cyl(g, 0.5, 1.2, 7, M(0x6f6f4a, { metalness: 0.5 }), 0, 0, 0, 12); cyl(g, 1.3, 1.3, 1, M(0x6f6f4a), 0, 7, 0, 12); solid(city, g, 0, 0, 2.4, 2.4, 8); },
  windmill(city, g) {
    cyl(g, 4, 7, 20, M(0x8a6f58), 0, 0, 0, 8); cone(g, 4.6, 5, M(0x4a3a2e), 0, 20, 0, 8, 0);
    const hub = new THREE.Group(); hub.position.set(0, 21, -5); g.add(hub);
    for (let i = 0; i < 4; i++) { const blade = new THREE.Mesh(new THREE.BoxGeometry(1.8, 13, 0.3), M(0xe9e1d0)); blade.position.y = 7; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; arm.add(blade); hub.add(arm); }
    g.userData.spin = hub;
    solid(city, g, 0, 0, 12, 12, 24);
  },
  twinpeaks(city, g) {},
  excelsior(city, g) {},
  floodmansion(city, g) {
    const brown = texMat(windowTex('fm', '#8a6a52', '#2c2a2c', 5, 3, { arch: true }), 3, 1);
    box(g, 44, 18, 34, brown); box(g, 46, 1.4, 36, M(0x74584a), 0, 18); for (const x of [-14, 14]) box(g, 3, 20, 3, M(0x6b5040), x, 0, -18);
    solid(city, g, 0, 0, 44, 34, 20);
  },
  huntington(city, g) { const f = cyl(g, 4, 4.5, 0.8, M(0xc9c1b2), 0, 0, 0, 20); cyl(g, 0.6, 0.8, 2.4, M(0x8a8a80), 0, 0.8, 0, 10); },
  cablebarn(city, g) { box(g, 50, 14, 50, texMat(windowTex('cb', '#9a5a44', '#2c2626', 6, 2, { arch: true }), 3, 1)); solid(city, g, 0, 0, 50, 50, 16); },
  'baybridge-sf'(city, g) {},
  esperanza(city, g) {
    box(g, 22, 16, 18, texMat(windowTex('esp', '#e4c9a0', '#2e3238', 5, 4, { arch: true }), 1, 1));
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, 11, 2), [M(0x2a2830), M(0x2a2830), M(0x2a2830), M(0x2a2830), landmarkMaterial({ map: signTex('ESPERANZA', '#7ff0e0', '#1b1d22', true), emissive: 0x114a44 }), landmarkMaterial({ map: signTex('ESPERANZA', '#7ff0e0', '#1b1d22', true), emissive: 0x114a44 })]);
    s.rotation.y = Math.PI / 2; s.position.set(-11.4, 10, 0); g.add(s);
    solid(city, g, 0, 0, 22, 18, 18);
  },
  vanehouse(city, g) {
    const w = texMat(windowTex('vh', '#efe9dc', '#2b3440', 6, 3, {}), 2, 1);
    box(g, 40, 14, 28, w); box(g, 20, 6, 28, w, 10, 14); box(g, 42, 1, 30, M(0xd8d0c0), 0, 14);
    for (let i = 0; i < 6; i++) cyl(g, 0.6, 0.7, 10, M(0xf6f2e8), -20.6, 0, -10 + i * 4, 10);
    solid(city, g, 0, 0, 40, 28, 20);
  },
  remnant(city, g) {
    box(g, 26, 14, 30, texMat(windowTex('rem', '#7a4a3a', '#1f2328', 6, 3, { arch: true }), 1, 1));
    const s = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.6), landmarkMaterial({ map: signTex('REMNANT', '#c9c3b8', '#1f2328', false) })); s.position.set(-13.1, 10, 0); s.rotation.y = -Math.PI / 2; g.add(s);
    solid(city, g, 0, 0, 26, 30, 14);
  },
  southpark(city, g) { const l = new THREE.Mesh(new THREE.PlaneGeometry(40, 150), M(0x5d8a3a)); l.rotation.x = -Math.PI / 2; l.position.y = 0.3; g.add(l); },
  lonemountain(city, g) {}
};
// orientation (bearing of local +x) for landmarks whose facing matters
const BEARING = { ferry: 340, paintedladies: 0, castro: 90, missiondolores: 90, stignatius: 110, peterpaul: 90, citylights: 60, oracle: 120, palacefa: 90, cityhall: 90, grace: 90, lombard: 90, esperanza: 90, remnant: 45, vanehouse: 90, flood: 45, legion: 90, deyoung: 90 };

export function makeLandmarks(city) {
  const group = new THREE.Group(), animated = [];
  for (const l of LANDMARKS) {
    const fn = BUILD[l.id]; if (!fn) continue;
    const g = new THREE.Group();
    place(city, g, l.lat, l.lon, BEARING[l.id] ?? 90, 0, l.id === 'alcatraz' ? -8 : undefined);
    fn(city, g);
    if (g.userData.spin) animated.push(g.userData.spin);
    group.add(g);
  }
  // round towers
  for (const t of TOWERS) if (t.round) {
    const g = new THREE.Group(); place(city, g, t.lat, t.lon);
    cyl(g, t.w / 2, t.w / 2, t.h, texMat(windowTex('round' + t.name, '#d9d6cf', '#46535e', 16, 20, {}), 3, 6), 0, -2, 0, 40);
    city.colliders.addCircle(g.position.x, g.position.z, t.w / 2, g.position.y - 2, g.position.y + t.h, 'tower');
    group.add(g);
  }
  // libraries: small civic buildings with a lamp over the door (safe houses)
  for (const lib of LIBRARIES) {
    if (lib.id === 'lib-main') continue;
    const g = new THREE.Group(); place(city, g, lib.lat, lib.lon);
    box(g, 16, 9, 12, texMat(windowTex('lib-branch', '#d9cfbc', '#3a4650', 4, 2, { arch: true }), 1, 1), 0, 0, 0);
    gable(g, 12, 3, 17, M(0x9a5a44), 0, 9, 0, Math.PI / 2);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), M(0xffe2a0, { emissive: 0xffb050, emissiveIntensity: 1.4 })); lamp.position.set(-8.4, 4.2, 0); g.add(lamp);
    city.colliders.addBox(g.position.x, g.position.z, 16, 12, 0, g.position.y - 2, g.position.y + 12, 'library');
    group.add(g);
  }
  group.userData.update = t => { for (const s of animated) s.rotation.z = t * 0.25; };
  return group;
}

/* ---------------- the bridges ---------------- */
// Walkable decks: the player's floor is max(ground, deck) inside these strips.
export const DECKS = [];
function deckStrip(a, b, w, y0, y1) { DECKS.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], w, y0, y1 }); }
export function deckHeight(x, z) {
  let best = -Infinity;
  for (const d of DECKS) {
    const dx = d.bx - d.ax, dz = d.bz - d.az, L2 = dx * dx + dz * dz, t = ((x - d.ax) * dx + (z - d.az) * dz) / L2;
    if (t < 0 || t > 1) continue;
    const px = d.ax + dx * t, pz = d.az + dz * t;
    if (Math.hypot(x - px, z - pz) > d.w / 2) continue;
    best = Math.max(best, d.y0 + (d.y1 - d.y0) * t);
  }
  return best;
}

export function makeBridges(city) {
  const group = new THREE.Group();
  const orange = M(0xc0452f, { roughness: 0.55 }), orangeDark = M(0x8f3222, { roughness: 0.6 });
  /* Golden Gate Bridge: midspan, axis, towers 640 m either side of midspan */
  const mid = toXZ(37.81900, -122.47830), north = toXZ(37.83240, -122.48100), south = toXZ(37.81060, -122.47700);
  const ax = north[0] - south[0], az = north[1] - south[1], AL = Math.hypot(ax, az), ux = ax / AL, uz = az / AL;
  const at = (s) => [mid[0] + ux * s, mid[1] + uz * s];
  const DECK = 67, TOWER = 227;
  const gg = new THREE.Group(); group.add(gg);
  const deckLen = AL + 200, sEnd = Math.hypot(south[0] - mid[0], south[1] - mid[1]);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(27, 7.6, deckLen), orangeDark);
  const c = at((AL / 2 - sEnd)); deck.position.set(mid[0] + ux * ((AL / 2) - sEnd) * 0, DECK - 3.8, mid[1]);
  // orient deck along the bridge axis
  const yaw = -Math.atan2(az, ax) + Math.PI / 2; deck.rotation.y = yaw; deck.position.set((south[0] + north[0]) / 2, DECK - 3.8, (south[1] + north[1]) / 2); gg.add(deck);
  const road = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, deckLen), M(0x3a3a3e)); road.rotation.y = yaw; road.position.set(deck.position.x, DECK + 0.02, deck.position.z); gg.add(road);
  for (const side of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.3, deckLen), orange); rail.rotation.y = yaw; rail.position.set(deck.position.x + Math.cos(yaw) * side * 13.2, DECK + 0.7, deck.position.z - Math.sin(yaw) * side * 13.2); gg.add(rail); }
  const perp = [uz, -ux];   // across the deck
  const towers = [-640, 640];
  for (const s of towers) {
    const [tx, tz] = at(s), tg = new THREE.Group(); tg.position.set(tx, 0, tz); tg.rotation.y = yaw; gg.add(tg);
    for (const side of [-1, 1]) {
      // each leg steps back as it rises, art deco setbacks
      const legs = [[0, 96, 11, 16], [96, 160, 9.5, 14], [160, 205, 8.5, 12.5], [205, TOWER, 7.5, 11]];
      for (const [y0, y1, w, d] of legs) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, y1 - y0, d), orange); m.position.set(side * 14.5, (y0 + y1) / 2, 0); tg.add(m); }
    }
    for (const y of [DECK + 22, 120, 165, 210]) { const b = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 7), orange); b.position.set(0, y, 0); tg.add(b); for (let k = -2; k <= 2; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.7, 8, 7.4), orangeDark); f.position.set(k * 3.4, y, 0); tg.add(f); } }
    const pier = new THREE.Mesh(new THREE.BoxGeometry(46, 30, 26), M(0x8a8a82)); pier.position.set(0, -10, 0); tg.add(pier);
    for (const side of [-1, 1]) city.colliders.addBox(tx + perp[0] * side * 14.5, tz + perp[1] * side * 14.5, 12, 17, Math.atan2(uz, ux), DECK - 5, TOWER, 'bridge');
  }
  // main cables and suspenders
  const cableY = (s) => { const a = Math.abs(s); if (a <= 640) return DECK + 4 + (TOWER - 2 - DECK - 4) * Math.pow(a / 640, 2); return TOWER - 2 - (TOWER - 2 - DECK - 4) * Math.min(1, (a - 640) / 340) ** 1.2; };
  const susp = [];
  for (const side of [-1, 1]) {
    const pts = []; for (let s = -980; s <= 980; s += 20) { const [x, z] = at(s); pts.push(new THREE.Vector3(x + perp[0] * side * 13.2, cableY(s), z + perp[1] * side * 13.2)); }
    gg.add(tube(pts, 0.55, orange, 200));
    for (let s = -960; s <= 960; s += 15) { const [x, z] = at(s); const px = x + perp[0] * side * 13.2, pz = z + perp[1] * side * 13.2; susp.push(px, DECK, pz, px, cableY(s), pz); }
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(susp, 3));
  gg.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xa8402c })));
  deckStrip(at(-sEnd - 60), at(AL - sEnd + 60), 24, DECK, DECK);
  // the south approach meets the Presidio bluff
  const sa = at(-sEnd - 60), land = at(-sEnd - 420);
  deckStrip(land, sa, 24, city.heightAt(land[0], land[1]) + 0.5, DECK);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(24, 1, 360), M(0x4a4a4e)); ramp.rotation.y = yaw; ramp.position.set((sa[0] + land[0]) / 2, (DECK + city.heightAt(land[0], land[1])) / 2, (sa[1] + land[1]) / 2);
  ramp.rotation.x = Math.atan2(DECK - city.heightAt(land[0], land[1]), 360) * (ux * Math.sin(yaw) + uz * Math.cos(yaw) > 0 ? 1 : -1); gg.add(ramp);
  group.userData.ggNorthEnd = at(AL - sEnd + 40);

  /* Bay Bridge, western span: two suspension spans meeting at the centre anchorage */
  const bSF = toXZ(37.78780, -122.38950), bMid = toXZ(37.79950, -122.37650), bYBI = toXZ(37.81030, -122.36480);
  const silver = M(0xb9bec2, { roughness: 0.5, metalness: 0.3 });
  const BD = 58;
  const span = (a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), yawB = -Math.atan2(dz, dx) + Math.PI / 2;
    const d = new THREE.Mesh(new THREE.BoxGeometry(22, 9, L), M(0x8f9498)); d.rotation.y = yawB; d.position.set((a[0] + b[0]) / 2, BD - 4.5, (a[1] + b[1]) / 2); group.add(d);
    const px = dz / L, pz = -dx / L;
    for (const t of [0.25, 0.75]) {
      const x = a[0] + dx * t, z = a[1] + dz * t;
      for (const side of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(5, 160, 7), silver); leg.position.set(x + px * side * 12, 80, z + pz * side * 12); leg.rotation.y = yawB; group.add(leg); }
      for (const y of [BD + 20, 110, 150]) { const xb = new THREE.Mesh(new THREE.BoxGeometry(28, 3, 3), silver); xb.position.set(x, y, z); xb.rotation.y = yawB + Math.PI / 2; group.add(xb); }
    }
    for (const side of [-1, 1]) {
      const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40, x = a[0] + dx * t, z = a[1] + dz * t; const u = t < 0.25 ? t / 0.25 : t > 0.75 ? (1 - t) / 0.25 : 1 - Math.abs(t - 0.5) / 0.25; const y = t < 0.25 || t > 0.75 ? BD + 8 + (152 - BD - 8) * u : BD + 8 + (152 - BD - 8) * Math.pow(Math.abs(t - 0.5) / 0.25, 2); pts.push(new THREE.Vector3(x + px * side * 12, y, z + pz * side * 12)); }
      group.add(tube(pts, 0.5, silver, 80));
    }
    deckStrip(a, b, 20, BD, BD);
  };
  span(bSF, bMid); span(bMid, bYBI);
  const anch = new THREE.Mesh(new THREE.BoxGeometry(40, BD + 20, 30), M(0x9a9a92)); anch.position.set(bMid[0], (BD + 20) / 2 - 10, bMid[1]); group.add(anch);
  const land2 = toXZ(37.78580, -122.39220);
  deckStrip(land2, bSF, 20, city.heightAt(land2[0], land2[1]) + 1, BD);
  group.userData.bayEnd = bYBI;
  return group;
}
