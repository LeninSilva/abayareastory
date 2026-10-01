// The house you build: assembled from the parts the albañiles have finished, in the style you chose, with scaffold
// and half-raised block on whatever they are working on now. Also the "SE VENDE" sign on a lot for sale.
// Lot frame: 16 m wide (x), 20 m deep (z); the street is on the -z side.
import * as THREE from 'three';
import { landmarkMaterial } from './shaders.js';
import { HOUSE_STYLES } from '../game/shops.js';

const MATS = new Map();
function M(color, o = {}) { const k = color + JSON.stringify(o); if (!MATS.has(k)) MATS.set(k, landmarkMaterial(Object.assign({ color, roughness: 0.85 }, o))); return MATS.get(k); }
function box(g, w, h, d, x, y, z, m) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y + h / 2, z); g.add(me); return me; }
function plane(g, w, h, x, y, z, ry, m) { const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.position.set(x, y, z); me.rotation.y = ry; g.add(me); return me; }
function signTex(lines, bg, fg) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 256); x.strokeStyle = fg; x.lineWidth = 10; x.strokeRect(10, 10, 492, 236);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => { x.font = `${i ? 600 : 800} ${i ? 34 : 66}px Inter, Arial, sans-serif`; x.fillText(l, 256, 256 * (i + 1) / (lines.length + 1), 480); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const LOT_W = 16, LOT_D = 20;

/* rooms: [x0, x1, z0, z1, height, floor] in lot coordinates */
const ROOMS = {
  sala: [-4, 4, -9, -2, 3.3, 0], cochera: [-7.6, -4, -9, -3, 3, 0], tienda: [4, 7.6, -9, -3, 3.2, 0],
  cocina: [-7.6, -2, 2, 7.5, 3, 0], recamara: [2, 7.6, 2, 7.5, 3, 0], bano: [4.4, 7.6, -2.4, 2, 3, 0], segundo: [-4, 7.6, -9, -2, 3, 1]
};

/** spec: { style, color, parts[], building: partId|null, name, owned, forSale, owner } */
export function buildHouse(spec) {
  const g = new THREE.Group(), S = HOUSE_STYLES[spec.style] || HOUSE_STYLES.colonial, colliders = [];
  const has = p => spec.parts.includes(p), wallC = S.walls[(spec.color || 0) % S.walls.length];
  const wall = M(wallC), trim = M(S.trim), dark = M(0x1a1612), glass = M(0x26323a, { metalness: 0.4, roughness: 0.12 }), wood = M(0x5a3a22), tile = M(0xa24a2c), iron = M(0x1f1f22, { metalness: 0.5, roughness: 0.5 });
  const concrete = M(0x9a968e), block = M(0x8a8a86);
  // the ground of the lot
  box(g, LOT_W, 0.08, LOT_D, 0, 0, 0, M(0x8a7a5a));
  if (!spec.owned) {
    // for sale: a sign on two posts by the street
    for (const s of [-1, 1]) box(g, 0.12, 2.4, 0.12, s * 1.3, 0, -LOT_D / 2 + 1, wood);
    const tx = signTex(['SE VENDE', spec.forSale || 'Bienes Raíces Jiquilpan', 'Lic. Partida · junto al Jardín'], '#f2d24a', '#1a1a1a');
    plane(g, 3, 1.5, 0, 1.9, -LOT_D / 2 + 0.92, Math.PI, landmarkMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.8 }));
    for (let k = 0; k < 14; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + (k % 3) * 0.15, 0), M(0x6a7a3a)); s.position.set(-6 + (k * 37 % 120) / 10, 0.2, -6 + (k * 53 % 140) / 10); g.add(s); }
    return { group: g, colliders };
  }
  if (!spec.parts.length && !spec.building) {
    for (const s of [-1, 1]) box(g, 0.12, 2, 0.12, s * 1.1, 0, -LOT_D / 2 + 1, wood);
    plane(g, 2.6, 1.1, 0, 1.6, -LOT_D / 2 + 0.92, Math.PI, landmarkMaterial({ map: signTex(['PROPIEDAD PRIVADA', spec.owner || ''], '#efe9dc', '#2a2a2a'), side: THREE.DoubleSide }));
  }
  if (has('cimientos')) box(g, LOT_W - 0.6, 0.25, LOT_D - 0.6, 0, 0, 0, concrete);
  const roomH = (id, R) => R[5] ? 3.3 + 0.25 : 0.25;
  const room = (id, under) => {
    const R = ROOMS[id], [x0, x1, z0, z1, h] = R, y = roomH(id, R), w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const mat = under ? block : spec.style === 'obra' ? block : wall, hh = under ? h * 0.45 : h;
    box(g, w, hh, d, cx, y, cz, mat);
    colliders.push([cx, cz, w, d, y, y + hh]);
    if (under) return;
    // a guardapolvo, the red band along the bottom of colonial walls
    if (spec.style === 'colonial' && !R[5]) box(g, w + 0.04, 0.9, d + 0.04, cx, y, cz, trim);
    if (spec.style === 'nortena') box(g, w + 0.04, 0.5, d + 0.04, cx, y + h - 0.5, cz, trim);
    if (spec.style === 'piedra') for (let k = 0; k < 16; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.5 + (k % 3) * 0.2, 0.3, 0.06), M(0x4a4440)); s.position.set(cx - w / 2 + 0.4 + (k * 0.71 % (w - 0.8)), y + 0.4 + (k * 1.37 % (h - 0.8)), z0 - 0.03); g.add(s); }
    // the roof
    const top = y + h;
    if (S.roof === 'gable' && !(id === 'sala' && has('segundo'))) {
      const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.4, 0); sh.lineTo(d / 2 + 0.4, 0); sh.lineTo(0, Math.min(2.2, d * 0.32)); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: w + 0.6, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.6) / 2); rg.rotateY(Math.PI / 2);
      const roof = new THREE.Mesh(rg, tile); roof.position.set(cx, top, cz); g.add(roof);
      if (spec.style === 'adobe') for (let k = 0; k < Math.floor(w / 1.2); k++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 6), wood); v.rotation.x = Math.PI / 2; v.position.set(x0 + 0.6 + k * 1.2, top - 0.25, z0 - 0.3); g.add(v); }
    } else {
      box(g, w + 0.3, 0.18, d + 0.3, cx, top, cz, spec.style === 'colonial' || spec.style === 'piedra' ? tile : spec.style === 'moderna' ? M(0x3a3a3c) : spec.style === 'obra' ? concrete : trim);
      if (spec.style === 'obra' && !has('segundo')) for (let k = 0; k < 6; k++) box(g, 0.04, 1.1, 0.04, x0 + 0.3 + (k % 3) * (w - 0.6) / 2, top + 0.18, k < 3 ? z0 + 0.3 : z1 - 0.3, M(0x6a4a3a, { metalness: 0.6 }));
    }
    // openings on the street side (z0) and the patio side
    const front = z0 - 0.02, fy = y;
    if (id === 'sala') {
      plane(g, 1.3, 2.3, cx, fy + 1.15, front, Math.PI, wood);
      for (const s of [-1, 1]) {
        const ww = spec.style === 'moderna' ? 2.6 : 1.1, wx = cx + s * 2.6;
        plane(g, ww, 1.5, wx, fy + 1.7, front, Math.PI, spec.style === 'moderna' ? glass : dark);
        if (spec.style !== 'obra' && spec.style !== 'moderna') { plane(g, ww + 0.3, 0.15, wx, fy + 2.52, front - 0.01, Math.PI, trim); plane(g, ww + 0.3, 0.15, wx, fy + 0.88, front - 0.01, Math.PI, trim); }
        if (spec.style === 'colonial' || spec.style === 'nortena') plane(g, ww, 1.5, wx, fy + 1.7, front - 0.06, Math.PI, iron);
      }
      if (spec.style === 'nortena') for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, h, 10), trim); c.position.set(cx + s * 1.2, y + h / 2, z0 - 1.2); g.add(c); }
      if (spec.style === 'nortena') box(g, 3.2, 0.3, 1.4, cx, y + h - 0.3, z0 - 0.7, trim);
      if (spec.style === 'piedra' || spec.style === 'adobe') for (let k = 0; k < 3; k++) box(g, 2, 0.2, 0.5, cx, y - 0.2 + k * 0.0, z0 - 0.4 - k * 0.5, M(0x5a524a));
      if (spec.style === 'moderna') for (let k = 0; k < 8; k++) box(g, 0.08, h - 0.4, 0.1, x1 - 0.3 - k * 0.22, y + 0.2, z0 - 0.06, trim);
      if (spec.name) plane(g, 2.2, 0.45, cx, fy + 2.85, front - 0.02, Math.PI, landmarkMaterial({ map: signTex([spec.name], '#efe9dc', '#3a2a1a') }));
    }
    if (id === 'cochera') { plane(g, w - 0.6, 2.4, cx, fy + 1.2, front, Math.PI, iron); }
    if (id === 'tienda') {
      plane(g, w - 0.8, 2, cx, fy + 1.3, front, Math.PI, glass);
      const aw = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 1.2), M([0xc02820, 0x1e5aa0, 0x2e7a3a][(spec.color || 0) % 3])); aw.position.set(cx, fy + 2.5, z0 - 0.55); aw.rotation.x = 0.25; g.add(aw);
      plane(g, w - 0.4, 0.5, cx, fy + 2.9, front - 0.02, Math.PI, landmarkMaterial({ map: signTex([spec.shopName || 'ABARROTES'], '#f0c830', '#1a1a1a') }));
    }
    if (id === 'segundo') {
      for (let k = 0; k < 3; k++) plane(g, spec.style === 'moderna' ? 2.6 : 1.1, 1.4, x0 + 1.8 + k * 3.8, y + 1.6, front, Math.PI, spec.style === 'moderna' ? glass : dark);
    }
    if (id === 'cocina' || id === 'recamara' || id === 'bano') plane(g, 1, 1, cx, y + 1.8, z0 - 0.02, Math.PI, dark);
  };
  for (const id of ['sala', 'cochera', 'tienda', 'cocina', 'recamara', 'bano', 'segundo']) { if (has(id)) room(id); else if (spec.building === id) room(id, true); }
  if (has('patio') || spec.building === 'patio') {
    box(g, 4, 0.12, 8, 0, 0.25, 3, M(0x4a7a32));
    if (has('patio')) {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.8, 6), wood); tr.position.set(-1, 1.15, 5); g.add(tr);
      const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), M(0x3e7a2a)); cr.position.set(-1, 2.4, 5); g.add(cr);
      for (let k = 0; k < 6; k++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.35, 8), M(0xa85a34)); pot.position.set(1.6, 0.45, -0.5 + k * 1.2); g.add(pot); const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), M([0xd02040, 0xe86aa0, 0xf0c030][k % 3])); fl.position.set(1.6, 0.8, -0.5 + k * 1.2); g.add(fl); }
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.5, 14), M(0xb8a898)); f.position.set(0.5, 0.5, 2); g.add(f);
    }
  }
  if (has('balcon')) for (let k = 0; k < 3; k++) { const x = -4 + 1.8 + k * 3.8; box(g, 1.6, 0.1, 0.7, x, 3.55 + 0.25, -9.35, iron); plane(g, 1.6, 0.9, x, 4.3, -9.7, Math.PI, iron); }
  if (has('azotea')) {
    const topY = (has('segundo') ? 6.6 : 3.55) + 0.18;
    for (const [w, d, x, z] of [[8, 0.15, 0, -9], [8, 0.15, 0, -2], [0.15, 7, -4, -5.5], [0.15, 7, 4, -5.5]]) box(g, w, 0.8, d, x, topY, z, wall);
    const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 14), M(0x1a1a1c)); tk.position.set(2.6, topY + 0.6 + 0.5, -3.4); g.add(tk);
    box(g, 1.2, 0.5, 1.2, 2.6, topY, -3.4, iron);
    const line = new THREE.Mesh(new THREE.BoxGeometry(5, 0.02, 0.02), M(0xdddddd)); line.position.set(-1, topY + 1.4, -6); g.add(line);
  }
  if (has('barda')) {
    const bm = spec.style === 'obra' ? block : wall;
    for (const [w, d, x, z] of [[0.25, LOT_D, -LOT_W / 2 + 0.12, 0], [0.25, LOT_D, LOT_W / 2 - 0.12, 0], [LOT_W, 0.25, 0, LOT_D / 2 - 0.12]]) { box(g, w, 2, d, x, 0, z, bm); colliders.push([x, z, w, d, 0, 2]); }
  }
  // the crew's scaffold, while they work
  if (spec.building) {
    const R = ROOMS[spec.building] || [-3, 3, -3, 3, 3, 0], y = R[5] ? 3.55 : 0.25;
    for (const [x, z] of [[R[0] - 0.4, R[2] - 0.4], [R[1] + 0.4, R[2] - 0.4], [R[0] - 0.4, R[3] + 0.4], [R[1] + 0.4, R[3] + 0.4]]) box(g, 0.08, R[4] + 1, 0.08, x, y, z, M(0x9a7a4a));
    for (const t of [1.2, 2.4]) box(g, R[1] - R[0] + 1, 0.06, 0.5, (R[0] + R[1]) / 2, y + t, R[2] - 0.5, M(0x8a6a3a));
    for (let k = 0; k < 6; k++) box(g, 0.4, 0.2, 0.2, -6 + k * 0.42, 0.3, -9.6, block);
    const sand = new THREE.Mesh(new THREE.ConeGeometry(1, 0.8, 10), M(0xc8b080)); sand.position.set(6.5, 0.65, -9); g.add(sand);
  }
  return { group: g, colliders };
}
