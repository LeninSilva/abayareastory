// Jiquilpan's landmarks, built by hand at their real positions (from OpenStreetMap/Overture):
// the Jardín and its kiosco, the Plaza Aguadora, the Parroquia de San Francisco, the Biblioteca Gabino Ortiz
// (the old Guadalupe sanctuary, with its bronze door of 22 figures), the Casa de Lázaro Cárdenas, the Presidencia,
// the Estadio 18 de Marzo and its portada with Cárdenas' words, the Plaza de la Feria, the Monumento, the
// Santuario de Guadalupe, San Cayetano, Santa Anita, the Plaza de Toros, the museum, the Bosque's gate,
// the summit of the Cerro de San Francisco, and the places of this story (Rosa's garage, Doña Petra's house,
// the indigo cave). Where the real building's exact form isn't known, the model follows the town's own idiom.
import * as THREE from 'three';
import { landmarkMaterial } from './shaders.js';
import { PLACES } from '../geo.js';
import { makePerson } from './people.js';

const MATS = new Map();
function M(color, opts = {}) { const key = color + JSON.stringify(opts); if (!MATS.has(key)) MATS.set(key, landmarkMaterial(Object.assign({ color }, opts))); return MATS.get(key); }
const WHITE = 0xefe9dc, CANTERA = 0xc0a292, CANTERA_D = 0x9c8274, OXBLOOD = 0x8a2a1e, TILE = 0xa24a2c, IRON = 0x1f2a22, BRONZE = 0x7a5a32;
function box(g, w, h, d, x, y, z, m, ry = 0) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y + h / 2, z); me.rotation.y = ry; g.add(me); return me; }
function cyl(g, r0, r1, h, x, y, z, m, seg = 16) { const me = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); me.position.set(x, y + h / 2, z); g.add(me); return me; }

/* text on stone or bronze, drawn once into a canvas */
function textTex(lines, { w = 1024, h = 256, bg = '#c9ae9c', fg = '#3a2a22', font = 'Cormorant Garamond, Georgia, serif', weight = 600, border = true, size } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  // weathering
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},${Math.random() * .05})`; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 2 + Math.random() * 6); }
  if (border) { x.strokeStyle = fg; x.globalAlpha = .5; x.lineWidth = 6; x.strokeRect(12, 12, w - 24, h - 24); x.globalAlpha = 1; }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  const fs = size || Math.min(h / (lines.length + 0.6), 120);
  lines.forEach((l, i) => { x.font = `${weight} ${fs * (l.small ? 0.62 : 1)}px ${font}`; const t = l.text || l; x.fillText(t, w / 2, h * (i + 1) / (lines.length + 1), w - 60); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function plaque(g, lines, w, h, x, y, z, ry, opts) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), landmarkMaterial({ map: textTex(lines, opts), roughness: .9 }));
  m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
}

/* the bronze door of the Biblioteca: 22 figures of the Americas in relief, two leaves of eleven panels */
function bronzeDoorTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, '#8a6a3a'); gr.addColorStop(.5, '#5e4424'); gr.addColorStop(1, '#7a5a30'); x.fillStyle = gr; x.fillRect(0, 0, 256, 512);
  for (let leaf = 0; leaf < 2; leaf++) for (let r = 0; r < 11; r++) {
    const px = 14 + leaf * 120, py = 14 + r * 44;
    x.fillStyle = '#4a341a'; x.fillRect(px, py, 108, 40); x.fillStyle = '#9a7a44'; x.fillRect(px + 3, py + 3, 102, 34);
    // a standing figure in relief
    x.fillStyle = '#5a4020'; x.beginPath(); x.arc(px + 54, py + 11, 5, 0, 7); x.fill(); x.fillRect(px + 47, py + 16, 14, 18); x.fillRect(px + 44 + (r % 3), py + 18, 4, 12); x.fillRect(px + 60 - (r % 2), py + 18, 4, 12);
    x.fillStyle = '#c8a868'; x.fillRect(px + 49, py + 17, 3, 15);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* a church in the Michoacán manner: whitewashed nave, a cantera facade and portal, bell tower(s), a tiled dome */
function church(o) {
  const g = new THREE.Group(), L = o.length, W = o.width, H = o.height;
  const wall = M(o.wall || WHITE), stone = M(o.stone || CANTERA), dark = M(0x2a211c), dome = M(o.domeColor || 0xc8a24a, { roughness: .5, metalness: .1 });
  box(g, L, H, W, L / 2, 0, 0, wall);                                   // nave runs +x from the facade at x = 0
  box(g, L + .3, .6, W + .3, L / 2, H, 0, stone);                        // cornice
  box(g, 1.2, H + 2.5, W + 1, -.3, 0, 0, stone);                         // facade slab
  box(g, 1.3, H * .12, W * .5, -.4, H + 2.5, 0, stone);                  // espadaña crest
  // portal: an arched door with stone jambs
  box(g, .5, H * .55, W * .34, -.9, 0, 0, stone);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(W * .2, H * .38), o.doorMat || M(0x3a2414)); door.position.set(-1.16, H * .19, 0); door.rotation.y = -Math.PI / 2; g.add(door);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(W * .1, W * .1, .1, 16, 1, false, 0, Math.PI), dark); arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.set(-1.17, H * .38, 0); g.add(arch);
  // choir window
  const win = new THREE.Mesh(new THREE.CircleGeometry(W * .07, 16), dark); win.position.set(-.96, H * .72, 0); win.rotation.y = -Math.PI / 2; g.add(win);
  // side windows
  for (let k = 1; k < 5; k++) for (const s of [-1, 1]) { const w2 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), dark); w2.position.set(L * k / 5, H * .62, s * (W / 2 + .02)); w2.rotation.y = s > 0 ? 0 : Math.PI; g.add(w2); }
  // buttresses
  for (let k = 0; k <= 5; k++) for (const s of [-1, 1]) box(g, 1, H * .9, .8, L * k / 5, 0, s * (W / 2 + .4), wall);
  // bell towers
  const towers = o.towers === 2 ? [-1, 1] : o.towers === 1 ? [o.towerSide || -1] : [];
  for (const s of towers) {
    const tx = 1.5, tz = s * (W / 2 + 1.2), TW = o.towerW || 5.2;
    box(g, TW, H + 2, TW, tx, 0, tz, stone);
    for (let tier = 0; tier < 2; tier++) {
      const y = H + 2 + tier * 5.2, s2 = TW * (1 - tier * .18);
      box(g, s2, 4.4, s2, tx, y, tz, tier ? wall : stone);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const op = new THREE.Mesh(new THREE.PlaneGeometry(s2 * .4, 2.6), dark); op.position.set(tx + dx * (s2 / 2 + .02), y + 1.9, tz + dz * (s2 / 2 + .02)); op.rotation.y = dx ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : (dz > 0 ? 0 : Math.PI); g.add(op); }
      box(g, s2 + .5, .4, s2 + .5, tx, y + 4.4, tz, stone);
      // a bell
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, .9, 12, 1, true), M(BRONZE, { metalness: .6, roughness: .4, side: THREE.DoubleSide })); bell.position.set(tx, y + 1.8, tz); g.add(bell);
    }
    const cup = new THREE.Mesh(new THREE.SphereGeometry(TW * .34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), dome); cup.position.set(tx, H + 12.8, tz); g.add(cup);
    cyl(g, .05, .05, 2.2, tx, H + 12.8 + TW * .34, tz, M(IRON)); box(g, .9, .08, .08, tx, H + 14.3 + TW * .34, tz, M(IRON));
  }
  // the dome over the crossing, on a drum
  if (o.dome) {
    const dx = L * .72; cyl(g, W * .32, W * .34, 3.2, dx, H, 0, wall, 20);
    const d = new THREE.Mesh(new THREE.SphereGeometry(W * .33, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dome); d.position.set(dx, H + 3.2, 0); g.add(d);
    cyl(g, .9, 1.1, 2.2, dx, H + 3.2 + W * .31, 0, wall, 10);
    cyl(g, .05, .05, 2, dx, H + 5.4 + W * .31, 0, M(IRON)); box(g, .9, .08, .08, dx, H + 6.6 + W * .31, 0, M(IRON));
  }
  g.userData.dims = { L, W, H };
  return g;
}

/* the kiosco: an octagonal bandstand on a raised base, iron columns and a crowned roof */
function kiosco() {
  const g = new THREE.Group(), R = 5.2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + .3, R + .5, 1.3, 8), M(CANTERA)); base.position.y = .65; g.add(base);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .1, 8), M(0xb8a898)); floor.position.y = 1.35; g.add(floor);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8, x = Math.cos(a) * (R - .3), z = Math.sin(a) * (R - .3);
    cyl(g, .09, .11, 4, x, 1.35, z, M(0x2e4a3a, { metalness: .5, roughness: .5 }), 8);
    // railings between the columns, except the stair side
    if (i !== 0) { const b = i / 8 * Math.PI * 2 + Math.PI / 8 + Math.PI / 8, rr = new THREE.Mesh(new THREE.BoxGeometry(.05, .9, 2 * (R - .3) * Math.sin(Math.PI / 8)), M(0x2e4a3a, { metalness: .5 })); rr.position.set(Math.cos(b) * (R - .35), 1.8, Math.sin(b) * (R - .35)); rr.rotation.y = -b; g.add(rr); }
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(R + .9, 2.2, 8, 1, true), M(0x3d6a52, { side: THREE.DoubleSide, metalness: .3, roughness: .5 })); roof.position.y = 6.45; roof.rotation.y = Math.PI / 8; g.add(roof);
  const fr = new THREE.Mesh(new THREE.CylinderGeometry(R + .9, R + .9, .35, 8, 1, true), M(0xe8e2d4, { side: THREE.DoubleSide })); fr.position.y = 5.35; fr.rotation.y = Math.PI / 8; g.add(fr);
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(.6, .7, 1.1, 8), M(0xe8e2d4)); lan.position.y = 8; g.add(lan);
  const top = new THREE.Mesh(new THREE.ConeGeometry(.8, 1, 8), M(0x3d6a52, { metalness: .3 })); top.position.y = 9.05; g.add(top);
  // steps on the east side
  for (let s = 0; s < 4; s++) box(g, 1.1, .33 * (s + 1), 2.4, R + 1.4 - s * .35, 0, 0, M(CANTERA));
  return g;
}

function bench(g, x, z, ry, y) {
  const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = ry;
  box(b, 1.8, .06, .45, 0, .42, 0, M(0x2e4a3a, { metalness: .5 })); box(b, 1.8, .45, .05, 0, .48, -.2, M(0x2e4a3a, { metalness: .5 }));
  for (const s of [-.8, .8]) box(b, .05, .42, .4, s, 0, 0, M(0x1a1a1a));
  g.add(b);
}
function lantern(g, x, z, y, glow) {
  cyl(g, .06, .09, 3.4, x, y, z, M(0x1a1a1a, { metalness: .6 }), 8);
  const l = new THREE.Mesh(new THREE.CylinderGeometry(.22, .16, .5, 6), glow); l.position.set(x, y + 3.6, z); g.add(l);
  const c = new THREE.Mesh(new THREE.ConeGeometry(.3, .25, 6), M(0x1a1a1a)); c.position.set(x, y + 3.98, z); g.add(c);
}

/** The whole set. Returns a group with userData: { update(t), spots: {id: [x, y, z]}, glows: [materials] } */
export function makeLandmarks(city) {
  const root = new THREE.Group(), spots = {}, glow = new THREE.MeshBasicMaterial({ color: 0xfff0c8 });
  const P = id => PLACES[id], H = (x, z) => city.heightAt(x, z);
  const col = city.colliders;
  const place = (g, x, z, ry = 0, dy = 0) => { g.position.set(x, H(x, z) + dy, z); g.rotation.y = ry; root.add(g); return g; };

  /* ---- the Jardín (Jardín Colón) ---- */
  {
    const { x, z } = P('jardin'), y = H(x, z), g = new THREE.Group();
    box(g, 74, .25, 62, 0, -.1, 0, M(0xb8aa98));                                  // stone paving
    for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {                // four gardens between the paths
      const p = new THREE.Mesh(new THREE.BoxGeometry(24, .5, 18), M(0x3e6a2a)); p.position.set(qx * 19, .25, qz * 16); g.add(p);
      box(g, 24.4, .55, .35, qx * 19, 0, qz * 16 - 9, M(CANTERA)); box(g, 24.4, .55, .35, qx * 19, 0, qz * 16 + 9, M(CANTERA));
      for (let k = 0; k < 3; k++) bench(g, qx * (8 + k * 6), qz * 6.2, qz > 0 ? Math.PI : 0, .1);
      for (let k = 0; k < 4; k++) { const tx = qx * (10 + (k % 2) * 16), tz = qz * (10 + Math.floor(k / 2) * 10); lantern(g, tx, tz, .1, glow); }
    }
    g.add(kiosco());
    place(g, x, z);
    col.addSolid(x, z, 11, 11, 0, y - 1, y + 1.4, 'kiosco');     // the bandstand floor is walkable
    for (let st = 0; st < 4; st++) col.addSolid(x + 5.2 + 1.4 - st * .35, z, 1.1, 2.4, 0, y - 1, y + .33 * (st + 1), 'step');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; col.addCircle(x + Math.cos(a) * 4.9, z + Math.sin(a) * 4.9, .12, y + 1.3, y + 5.4, 'kiosco'); }
    for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) col.addSolid(x + qx * 19, z + qz * 16, 24, 18, 0, y - 1, y + .5, 'garden');
    spots.kiosco = [x, y + 1.4, z];
  }
  /* ---- the Plaza Aguadora and its fountain: a woman carrying water ---- */
  {
    const { x, z } = P('plazaSur'), y = H(x, z), g = new THREE.Group();
    box(g, 58, .22, 64, 0, -.1, 0, M(0xc0b2a0));
    cyl(g, 4.2, 4.4, .7, 0, 0, 0, M(CANTERA), 24);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, .1, 24), M(0x3a6a78, { roughness: .1, metalness: .2 })); water.position.y = .55; g.add(water);
    cyl(g, .9, 1.1, 1.6, 0, .6, 0, M(CANTERA), 12);
    const statue = makePerson({ skin: BRONZE, hair: BRONZE, top: BRONZE, bottom: BRONZE, dress: true, shoes: BRONZE, height: 1.1, hairStyle: 'bun' });
    statue.traverse(o => { if (o.isMesh) o.material = M(0x6a5236, { metalness: .6, roughness: .45 }); });
    statue.position.y = 2.2; g.add(statue);
    const pot = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), M(0x6a5236, { metalness: .6, roughness: .45 })); pot.position.set(.3, 4.1, 0); pot.scale.y = 1.2; g.add(pot);
    for (let k = 0; k < 6; k++) bench(g, Math.cos(k) * 12, Math.sin(k) * 12, -k + Math.PI / 2, 0);
    for (const [lx, lz] of [[-20, -20], [20, -20], [-20, 20], [20, 20], [0, -26], [0, 26]]) lantern(g, lx, lz, 0, glow);
    place(g, x, z); col.addCircle(x, z, 4.4, y - 1, y + 3.5, 'fountain');
    spots.aguadora = [x, y, z];
  }
  /* ---- the Parroquia de San Francisco, facing west onto its atrio ---- */
  {
    const { x, z } = P('parroquia'), fx = x - 26, y = H(fx, z);
    const c = church({ length: 54, width: 16, height: 16, towers: 1, towerSide: -1, dome: true, domeColor: 0xd8b04a, towerW: 5.6 });
    place(c, fx, z, 0);
    col.addBox(fx + 27, z, 55, 18, 0, y - 2, y + 17, 'landmark'); col.addBox(fx + 1.5, z - 9.2, 5.8, 5.8, 0, y - 2, y + 32, 'landmark');
    // the atrio: a low wall with a gate, a stone cross
    const at = new THREE.Group();
    for (const s of [-1, 1]) box(at, 22, 1.6, .5, -11, 0, s * 13, M(WHITE));
    box(at, .5, 1.6, 9, -22, 0, -8.5, M(WHITE)); box(at, .5, 1.6, 9, -22, 0, 8.5, M(WHITE));
    box(at, .8, 3.4, .8, -22, 0, -4, M(CANTERA)); box(at, .8, 3.4, .8, -22, 0, 4, M(CANTERA));
    box(at, .4, 3.6, .4, -11, 0, 0, M(CANTERA)); box(at, 1.8, .35, .4, -11, 2.5, 0, M(CANTERA));
    place(at, fx, z);
    for (const s of [-1, 1]) col.addBox(fx - 11, z + s * 13, 22, .6, 0, y - 1, y + 1.6, 'wall');
    col.addBox(fx - 22, z - 8.5, .6, 9, 0, y - 1, y + 1.6, 'wall'); col.addBox(fx - 22, z + 8.5, .6, 9, 0, y - 1, y + 1.6, 'wall');
    spots.parroquiaDoor = [fx - 3, y, z]; spots.atrioCross = [fx - 11, y, z + 1.2];
  }
  /* ---- the Biblioteca Gabino Ortiz: a 19th-century neo-Gothic sanctuary turned library, Orozco's murals inside ---- */
  {
    const { x, z } = P('biblioteca'), y = H(x, z), g = new THREE.Group();
    const L = 30, W = 12, Hh = 12, wall = M(0xd8cfc2), stone = M(0xb09888), dark = M(0x241c18);
    box(g, W, Hh, L, 0, 0, 0, wall);                                     // nave runs north-south; the facade faces south onto the street
    box(g, W + .4, .5, L + .4, 0, Hh, 0, stone);
    const roofG = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, L, 3, 1), M(0x7a6a5e)); roofG.rotation.x = Math.PI / 2; roofG.rotation.y = Math.PI / 2; roofG.scale.set(1, 1, .45); roofG.position.set(0, Hh + 1.2, 0); g.add(roofG);
    // the Gothic front: pointed gable, pinnacles, a lancet window and the bronze door
    box(g, W + 1.2, Hh + 3, 1, 0, 0, L / 2 + .3, stone);
    const gable = new THREE.Mesh(new THREE.ConeGeometry(W * .62, 5, 4, 1), stone); gable.rotation.y = Math.PI / 4; gable.scale.set(1, 1, .12); gable.position.set(0, Hh + 5, L / 2 + .3); g.add(gable);
    for (const s of [-1, 1]) { cyl(g, .45, .5, Hh + 6, s * (W / 2 + .3), 0, L / 2 + .3, stone, 8); const pin = new THREE.Mesh(new THREE.ConeGeometry(.55, 3.2, 8), stone); pin.position.set(s * (W / 2 + .3), Hh + 7.6, L / 2 + .3); g.add(pin); }
    const lancet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2), dark); lancet.position.set(0, Hh * .72, L / 2 + .82); g.add(lancet);
    const lt = new THREE.Mesh(new THREE.ConeGeometry(.8, 1.2, 3), dark); lt.scale.z = .02; lt.position.set(0, Hh * .72 + 2.6, L / 2 + .82); g.add(lt);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), landmarkMaterial({ map: bronzeDoorTex(), metalness: .7, roughness: .38 })); door.position.set(0, 2.6, L / 2 + .83); g.add(door);
    const dArch = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.6, 3), stone); dArch.scale.z = .15; dArch.position.set(0, 6, L / 2 + .9); g.add(dArch);
    for (let k = -2; k <= 2; k++) for (const s of [-1, 1]) { const w2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 4.6), dark); w2.position.set(s * (W / 2 + .02), Hh * .55, k * 5.4); w2.rotation.y = s * Math.PI / 2; g.add(w2); }
    plaque(g, ['BIBLIOTECA PÚBLICA', { text: 'LIC. GABINO ORTIZ', small: true }], 4.4, 1.1, 0, 7.4, L / 2 + .84, 0, { bg: '#b8a090', fg: '#2a1e18' });
    // the front faces west, onto the street (the nave runs east)
    place(g, x, z, -Math.PI / 2); col.addBox(x, z, L + 1.5, W + 1, 0, y - 2, y + Hh + 2, 'landmark');
    spots.bronzeDoor = [x - L / 2 - 2.4, y, z];
  }
  /* ---- the Casa de Lázaro Cárdenas ---- */
  {
    const { x, z } = P('casaLC'), y = H(x, z), g = new THREE.Group();   // the door faces west, onto the street
    box(g, 26, 5.2, 18, 0, 0, 0, M(WHITE)); box(g, 26.1, 1.1, 18.1, 0, 0, 0, M(OXBLOOD));
    box(g, 26.6, .5, 18.6, 0, 5.2, 0, M(TILE));
    for (let k = -2; k <= 2; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), M(0x3a2414)); w.position.set(k * 4.5, 2.6, -9.02); w.rotation.y = Math.PI; g.add(w); }
    const d = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.4), M(0x4a2c16)); d.position.set(0, 1.7, -9.03); d.rotation.y = Math.PI; g.add(d);
    plaque(g, ['CASA DE LÁZARO CÁRDENAS', { text: 'Nació en Jiquilpan el 21 de mayo de 1895', small: true }], 3.6, 1, 3.4, 3.8, -9.04, Math.PI, { bg: '#c8b09a' });
    place(g, x, z, Math.PI / 2); col.addBox(x, z, 18, 26, 0, y - 2, y + 5.7, 'roof');
    spots.casaLCDoor = [x - 11, y, z];
  }
  /* ---- the Presidencia Municipal: two storeys over a portal of arches, facing the Plaza Aguadora ---- */
  {
    const { x, z } = P('presidencia'), y = H(x, z), g = new THREE.Group(), L = 40;
    box(g, L, 8.6, 14, 0, 0, 4, M(0xf0e6d2)); box(g, L + .4, .6, 14.4, 0, 8.6, 4, M(CANTERA));
    box(g, L, .5, 4, 0, 4.2, -5, M(CANTERA)); box(g, L, 4.4, .3, 0, 4.4, -3.2, M(0xf0e6d2));
    for (let k = 0; k <= 10; k++) cyl(g, .32, .36, 4.2, -L / 2 + k * 4, 0, -6.6, M(CANTERA), 10);
    for (let k = 0; k < 10; k++) { const a = new THREE.Mesh(new THREE.TorusGeometry(1.8, .28, 6, 12, Math.PI), M(CANTERA)); a.position.set(-L / 2 + 2 + k * 4, 3.9, -6.6); g.add(a); }
    box(g, L, .6, 4, 0, 4.6, -5, M(CANTERA));
    for (let k = 0; k < 9; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.4), M(0x2a2018)); w.position.set(-L / 2 + 4 + k * 4, 6.4, -3.04); w.rotation.y = Math.PI; g.add(w); }
    plaque(g, ['PRESIDENCIA MUNICIPAL', { text: 'Jiquilpan de Juárez, Michoacán', small: true }], 8, 1.4, 0, 8.1, -3.05, Math.PI, { bg: '#d8c8b0' });
    place(g, x, z); col.addBox(x, z + 4, L, 14, 0, y - 2, y + 9.2, 'roof');
    for (let k = 0; k <= 10; k++) col.addCircle(x - L / 2 + k * 4, z - 6.6, .36, y - 1, y + 4.2, 'column');
    spots.presidencia = [x, y, z - 9];
  }
  /* ---- the Estadio 18 de Marzo and its portada ---- */
  {
    const s = P('estadio'), y = H(s.x, s.z), g = new THREE.Group();
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(68, .15, 100), landmarkMaterial({ map: pitchTex(), roughness: .95 })); pitch.position.y = .05; g.add(pitch);
    for (const sz of [-1, 1]) { const goal = new THREE.Group(); box(goal, 7.3, .12, .12, 0, 2.44, 0, M(0xf4f4f4)); for (const sx of [-1, 1]) box(goal, .12, 2.44, .12, sx * 3.65, 0, 0, M(0xf4f4f4)); goal.position.set(0, 0, sz * 50); g.add(goal); }
    // the perimeter wall and the stands (gradas), a roofed grandstand on the west
    for (const [w, d, px, pz] of [[84, .4, 0, -60], [84, .4, 0, 60], [.4, 120, -42, 0], [.4, 120, 42, 0]]) box(g, w, 3, d, px, 0, pz, M(0xe6ded0));
    for (let r = 0; r < 7; r++) { box(g, 3, .5 * (r + 1), 80, -40 + r * 1.3 - 3, 0, 0, M(0xb0aaa0)); box(g, 3, .5 * (r + 1), 60, 40 - r * 1.3 + 3, 0, 0, M(0xb0aaa0)); }
    box(g, 12, .3, 60, -44, 8.5, 0, M(0x9aa0a4, { metalness: .5 })); for (let k = -3; k <= 3; k++) cyl(g, .12, .12, 8.5, -49, 0, k * 9, M(0x8a8e90), 8);
    for (const [lx, lz] of [[-40, -58], [40, -58], [-40, 58], [40, 58]]) { cyl(g, .25, .35, 22, lx, 0, lz, M(0x8a8e90), 8); box(g, 4, 2.2, .5, lx, 22, lz, M(0x3a3a3a)); }
    place(g, s.x, s.z);
    for (const [w, d, px, pz] of [[84, 1, 0, -60], [84, 1, 0, 60], [1, 120, -42, 0], [1, 120, 42, 0]]) if (pz !== -60) col.addBox(s.x + px, s.z + pz, w, d, 0, y - 1, y + 3, 'wall');
    col.addBox(s.x - 25, s.z - 60, 34, 1, 0, y - 1, y + 3, 'wall'); col.addBox(s.x + 25, s.z - 60, 34, 1, 0, y - 1, y + 3, 'wall');
    // the portada: two pylons, an arch and a frieze with the name; Cárdenas' words on a plaque beside the gate
    const p = P('portada'), py = H(p.x, p.z), pg = new THREE.Group(), st = M(0xd8c4a8), st2 = M(0xb89c80);
    for (const sx of [-1, 1]) { box(pg, 3.2, 9.5, 3.2, sx * 6.2, 0, 0, st); box(pg, 3.8, .7, 3.8, sx * 6.2, 9.5, 0, st2); box(pg, 3.6, 1.2, 3.6, sx * 6.2, 0, 0, st2); const ball = new THREE.Mesh(new THREE.SphereGeometry(.9, 14, 10), st2); ball.position.set(sx * 6.2, 11, 0); pg.add(ball); }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(4.6, .75, 8, 24, Math.PI), st); arch.position.set(0, 5.4, 0); pg.add(arch);
    box(pg, 15.6, 2.6, 2.2, 0, 7.4, 0, st);
    plaque(pg, ['ESTADIO 18 DE MARZO'], 13, 1.9, 0, 8.7, 1.12, 0, { bg: '#d8c4a8', fg: '#5a2a1a', border: false, size: 150, h: 220 });
    plaque(pg, ['ESTADIO 18 DE MARZO'], 13, 1.9, 0, 8.7, -1.12, Math.PI, { bg: '#d8c4a8', fg: '#5a2a1a', border: false, size: 150, h: 220 });
    const quote = plaque(pg, [{ text: '“LOS RECURSOS NATURALES DEL PAÍS', small: true }, { text: 'DEBEN SERVIR PARA SU PROPIA PROSPERIDAD.', small: true }, { text: 'ENTREGARLOS A INTERESES EXTRAÑOS', small: true }, { text: 'ES TRAICIONAR LA PATRIA.”', small: true }, { text: '— GRAL. LÁZARO CÁRDENAS', small: true }], 3, 2.2, -6.2, 4.4, -1.62, Math.PI, { w: 900, h: 660, bg: '#8a6a44', fg: '#f2e2c0', size: 96 });
    quote.material.metalness = .5; quote.material.roughness = .45;
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.6), landmarkMaterial({ map: gateTex(), alphaTest: .5, side: THREE.DoubleSide, metalness: .5, roughness: .5 })); gate.position.set(0, 1.8, -.4); pg.add(gate);
    place(pg, p.x, p.z, 0);
    for (const sx of [-1, 1]) col.addBox(p.x + sx * 6.2, p.z, 3.4, 3.4, 0, py - 1, py + 10, 'landmark');
    spots.portadaQuote = [p.x - 6.2, py, p.z - 3.2]; spots.portadaStone = [p.x + 6.2, py, p.z - 2.6];
  }
  /* ---- the Plaza de la Feria: a round plaza of rings ---- */
  {
    const { x, z } = P('feria'), g = new THREE.Group();
    for (let r = 0; r < 4; r++) { const ring = new THREE.Mesh(new THREE.RingGeometry(8 + r * 9, 9.6 + r * 9, 48), M(r % 2 ? 0xc0b09a : 0xa89a88)); ring.rotation.x = -Math.PI / 2; ring.position.y = .09; g.add(ring); }
    const c = new THREE.Mesh(new THREE.CircleGeometry(8, 32), M(0x3e6a2a)); c.rotation.x = -Math.PI / 2; c.position.y = .1; g.add(c);
    place(g, x, z);
  }
  /* ---- the Monumento al General Lázaro Cárdenas ---- */
  {
    const { x, z } = P('monumento'), y = H(x, z), g = new THREE.Group();
    box(g, 9, .5, 9, 0, 0, 0, M(0xb8a898)); box(g, 3.4, 4.2, 3.4, 0, .5, 0, M(CANTERA)); box(g, 4, .5, 4, 0, 4.7, 0, M(CANTERA_D));
    const fig = makePerson({ height: 1.25, build: 1.1, hairStyle: 'short', coat: true, hat: 'none' }); fig.traverse(o => { if (o.isMesh) o.material = M(0x5a4a32, { metalness: .65, roughness: .42 }); });
    fig.scale.setScalar(2); fig.position.y = 5.2; g.add(fig);
    for (const ry of [0, Math.PI]) plaque(g, ['GRAL. LÁZARO CÁRDENAS DEL RÍO', { text: '1895 – 1970', small: true }], 3, .9, 0, 2.6, ry ? -1.72 : 1.72, ry, { bg: '#b89c88' });
    place(g, x, z); col.addBox(x, z, 3.6, 3.6, 0, y - 1, y + 9, 'landmark');
    spots.monumento = [x, y, z + 3.2];
  }
  /* ---- the churches of the barrios ---- */
  {
    const gp = P('guadalupe'), g1 = church({ length: 40, width: 14, height: 15, towers: 2, dome: true, domeColor: 0x3a6aa0, towerW: 4.6 });
    place(g1, gp.x, gp.z - 20, -Math.PI / 2); const y1 = H(gp.x, gp.z);   // facing north onto Calle Constitución
    col.addBox(gp.x, gp.z, 17, 42, 0, y1 - 2, y1 + 16, 'landmark');
    const sc = P('cayetano'), g2 = church({ length: 32, width: 11, height: 12, towers: 1, towerSide: 1, dome: false, domeColor: 0xc88a3a, towerW: 4 });
    place(g2, sc.x - 16, sc.z, 0); const y2 = H(sc.x, sc.z);   // facing west
    col.addBox(sc.x, sc.z, 34, 14, 0, y2 - 2, y2 + 13, 'landmark'); col.addBox(sc.x - 14.5, sc.z + 6.7, 4.4, 4.4, 0, y2 - 2, y2 + 24, 'landmark');
    const sa = P('santaAnita'), g3 = church({ length: 18, width: 8, height: 8, towers: 0, dome: false });
    place(g3, sa.x - 9, sa.z, 0); const y3 = H(sa.x, sa.z);
    col.addBox(sa.x, sa.z, 19, 9, 0, y3 - 2, y3 + 9, 'landmark');
    spots.guadalupeDoor = [gp.x, y1, gp.z - 22]; spots.cayetanoDoor = [sc.x - 18, y2, sc.z];
  }
  /* ---- the Plaza de Toros Alberto Balderas ---- */
  {
    const { x, z } = P('toros'), y = H(x, z), g = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(32, 32, 9, 48, 1, true), M(WHITE, { side: THREE.DoubleSide })); wall.position.y = 4.5; g.add(wall);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(32.05, 32.05, 1.4, 48, 1, true), M(OXBLOOD)); band.position.y = .7; g.add(band);
    for (let r = 0; r < 8; r++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(31 - r * 1.2, 31 - r * 1.2, .9 * (8 - r), 48, 1, true), M(0xb8b0a4, { side: THREE.DoubleSide })); t.position.y = .45 * (8 - r); g.add(t); }
    const sand = new THREE.Mesh(new THREE.CircleGeometry(21, 48), M(0xc8a070)); sand.rotation.x = -Math.PI / 2; sand.position.y = .06; g.add(sand);
    const barrera = new THREE.Mesh(new THREE.CylinderGeometry(21.2, 21.2, 1.4, 48, 1, true), M(OXBLOOD, { side: THREE.DoubleSide })); barrera.position.y = .7; g.add(barrera);
    box(g, 8, 11, 3, 0, 0, -32, M(WHITE));
    plaque(g, ['PLAZA DE TOROS', { text: 'ALBERTO BALDERAS', small: false }], 7, 2, 0, 8.6, -33.55, Math.PI, { bg: '#e8ddc8', fg: '#7a1e14' });
    const arch = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5), M(0x2a1e18)); arch.position.set(0, 2.5, -33.54); arch.rotation.y = Math.PI; g.add(arch);
    place(g, x, z);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < .12) continue; col.addBox(x + Math.cos(a) * 32, z + Math.sin(a) * 32, 8.6, 1, a + Math.PI / 2, y - 1, y + 9, 'wall'); }
    spots.toros = [x, y, z - 36];
  }
  /* ---- the museum (the UNAM research centre and the Museo Vida y Obra de Lázaro Cárdenas) ---- */
  {
    const { x, z } = P('museo'), y = H(x, z), g = new THREE.Group();
    box(g, 44, 7, 22, 0, 0, 0, M(0xd8d2c4)); box(g, 44.4, 1, 22.4, 0, 7, 0, M(0xa8a098));
    for (let k = -4; k <= 4; k++) box(g, .8, 7, .8, k * 5, 0, -11.3, M(0xa8a098));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(40, 4.5), M(0x2a3438, { metalness: .4, roughness: .1 })); glass.position.set(0, 2.6, -11.02); glass.rotation.y = Math.PI; g.add(glass);
    plaque(g, ['MUSEO VIDA Y OBRA DE LÁZARO CÁRDENAS', { text: 'UNAM · Jiquilpan', small: true }], 12, 1.4, 0, 6.2, -11.35, Math.PI, { bg: '#e8e2d4', fg: '#20304a', border: false });
    place(g, x, z); col.addBox(x, z, 44, 22, 0, y - 2, y + 8, 'roof');
    spots.museoDoor = [x, y, z - 13.5];
  }
  /* ---- the Bosque's gate ---- */
  {
    const b = P('bosque'), gx = b.x - 60, gz = b.z - 150, g = new THREE.Group();
    for (const s of [-1, 1]) box(g, 1.6, 5, 1.6, s * 5, 0, 0, M(CANTERA));
    box(g, 12, 1.4, 1.2, 0, 5, 0, M(CANTERA));
    plaque(g, ['PARQUE JUÁREZ'], 8, 1.1, 0, 5.7, .62, 0, { bg: '#c0a292', border: false });
    place(g, gx, gz);
    for (const s of [-1, 1]) col.addBox(gx + s * 5, gz, 1.6, 1.6, 0, H(gx, gz) - 1, H(gx, gz) + 6, 'landmark');
  }
  /* ---- the summit of the Cerro de San Francisco: a white cross and a relay mast ---- */
  {
    const { x, z } = P('cumbre'), y = H(x, z), g = new THREE.Group();
    box(g, .9, 14, .9, 0, 0, 0, M(0xf2f0ea)); box(g, 7, .9, .9, 0, 9.5, 0, M(0xf2f0ea)); box(g, 3, 1, 3, 0, 0, 0, M(0x8a7a6a));
    const mast = new THREE.Group(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; cyl(mast, .06, .06, 30, Math.cos(a) * .6, 0, Math.sin(a) * .6, M(0xc84030), 4); } mast.position.set(18, 0, 6); g.add(mast);
    const blink = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3020 })); blink.position.set(18, 30.4, 6); g.add(blink); root.userData.blink = blink;
    place(g, x, z); col.addBox(x, z, 1, 1, 0, y - 1, y + 14, 'landmark');
    spots.cumbre = [x, y, z + 3];
  }
  /* ---- the story's own places: Rosa's garage, Doña Petra's house, the indigo cave ---- */
  {
    const t = P('taller'), y = H(t.x, t.z), g = new THREE.Group();
    box(g, 14, 5.5, 12, 0, 0, 0, M(0xd8d0c0)); box(g, 14.4, .3, 12.4, 0, 5.5, 0, M(0x8a8e90, { metalness: .5 }));
    const bay = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.2), M(0x141414)); bay.position.set(0, 2.1, -6.02); bay.rotation.y = Math.PI; g.add(bay);
    plaque(g, ['TALLER EL PISTÓN', { text: 'Mecánica · Hojalatería · Pintura', small: true }], 9, 1.4, 0, 4.8, -6.05, Math.PI, { bg: '#f0c830', fg: '#1a1a1a', border: false, font: 'Inter, Arial, sans-serif', weight: 800 });
    for (let k = 0; k < 5; k++) { const tire = new THREE.Mesh(new THREE.TorusGeometry(.34, .14, 8, 16), M(0x151515)); tire.rotation.x = Math.PI / 2; tire.position.set(6.6, .16 + k * .28, -7); g.add(tire); }
    place(g, t.x, t.z, t.ry || 0); col.addBox(t.x, t.z, 14, 12, t.ry ? -t.ry : 0, y - 2, y + 5.8, 'roof');
    spots.taller = [t.x - Math.sin(t.ry || 0) * 9, y, t.z - Math.cos(t.ry || 0) * 9];
    const pe = P('petra'), py = H(pe.x, pe.z), h2 = new THREE.Group();
    box(h2, 7, 3, 5, 0, 0, 0, M(0xa8805c)); const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 8, 3), M(TILE)); roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 2; roof.scale.set(1, 1, .5); roof.position.y = 3.6; h2.add(roof);
    const hd = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2), M(0x3a2414)); hd.position.set(0, 1, -2.52); hd.rotation.y = Math.PI; h2.add(hd);
    for (let k = 0; k < 14; k++) { const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 0), M(0x3a6a5a)); pl.position.set(-4 + (k % 7) * 1.3, .35, -4.5 - Math.floor(k / 7) * 1.2); h2.add(pl); }
    for (let k = 0; k < 4; k++) { const pot = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8), M(0x9a5a34)); pot.position.set(3.8, .3, -1 + k * .8); h2.add(pot); }
    place(h2, pe.x, pe.z, .4); col.addBox(pe.x, pe.z, 7, 5, .4, py - 2, py + 3.5, 'roof');
    spots.petra = [pe.x - 1, py, pe.z - 4];
    const cv = P('cueva'), cy = H(cv.x, cv.z), c2 = new THREE.Group();
    for (let k = 0; k < 9; k++) { const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + (k % 3), 0), M(k % 4 === 0 ? 0x3a4a78 : 0x6a625a, { roughness: 1 })); rock.position.set(Math.cos(k) * 6, 1 + (k % 3), Math.sin(k * 1.7) * 4 + 4); rock.rotation.set(k, k * 2, 0); c2.add(rock); }
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16, 0, Math.PI), M(0x050505)); mouth.position.set(0, 0, 1.6); mouth.rotation.y = Math.PI; c2.add(mouth);
    const arch2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, .9, 6, 12, Math.PI), M(0x5a524a, { roughness: 1 })); arch2.position.set(0, 0, 1.8); c2.add(arch2);
    const spring = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), M(0x2a5a78, { roughness: .1, metalness: .3 })); spring.rotation.x = -Math.PI / 2; spring.position.set(3.2, .08, -1.5); c2.add(spring);
    place(c2, cv.x, cv.z);
    spots.cueva = [cv.x, cy, cv.z - 1.5];
  }
  root.userData.spots = spots;
  root.userData.update = (t, night) => { glow.color.setScalar(.6 + night * 2.6); if (root.userData.blink) root.userData.blink.visible = Math.sin(t * 3) > 0; };
  return root;
}

function pitchTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d');
  for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#4f8a34' : '#468030'; x.fillRect(0, i * 32, 256, 32); }
  x.strokeStyle = '#f0f0e8'; x.lineWidth = 3; x.strokeRect(8, 8, 240, 368); x.beginPath(); x.moveTo(8, 192); x.lineTo(248, 192); x.stroke();
  x.beginPath(); x.arc(128, 192, 34, 0, 7); x.stroke(); x.strokeRect(68, 8, 120, 60); x.strokeRect(68, 316, 120, 60);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function gateTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#1a2a22'; for (let i = 0; i < 256; i += 12) x.fillRect(i, 10, 4, 118); x.fillRect(0, 10, 256, 6); x.fillRect(0, 64, 256, 5);
  for (let i = 6; i < 256; i += 24) { x.beginPath(); x.moveTo(i, 10); x.lineTo(i + 6, 0); x.lineTo(i + 12, 10); x.fill(); }
  const t = new THREE.CanvasTexture(c); return t;
}
