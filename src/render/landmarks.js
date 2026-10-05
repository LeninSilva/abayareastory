// Jiquilpan's landmarks, built by hand at their real positions (from OpenStreetMap/Overture):
// the Jardín and its kiosco, the Plaza Aguadora, the Parroquia de San Francisco, the Biblioteca Gabino Ortiz
// (the old Guadalupe sanctuary, with its bronze door of 22 figures), the Casa de Lázaro Cárdenas, the Presidencia,
// the Estadio 18 de Marzo and its portada with Cárdenas' words, the Plaza de la Feria, the Monumento, the
// Santuario de Guadalupe, San Cayetano, Santa Anita, the Plaza de Toros, the museum, the Bosque's gate,
// the summit of the Cerro de San Francisco, and the places of this story (Rosa's garage, Doña Petra's house,
// the indigo cave). Where the real building's exact form isn't known, the model follows the town's own idiom.
import * as THREE from 'three';
import { landmarkMaterial } from './shaders.js';
import { PLACES, CERRO_ROAD, BACK_ROAD } from '../geo.js';
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
/* a curved baroque gable (the mixtilinear crest of Michoacán facades), extruded to face -x */
function gable(W, Hc, depth, m) {
  const s = new THREE.Shape(), h = W / 2;
  s.moveTo(-h, 0); s.lineTo(-h, Hc * .25);
  s.quadraticCurveTo(-h * .78, Hc * .25, -h * .7, Hc * .45); s.quadraticCurveTo(-h * .55, Hc * .62, -h * .35, Hc * .6);
  s.quadraticCurveTo(-h * .25, Hc * .58, -h * .2, Hc * .8); s.quadraticCurveTo(-h * .12, Hc, 0, Hc);
  s.quadraticCurveTo(h * .12, Hc, h * .2, Hc * .8); s.quadraticCurveTo(h * .25, Hc * .58, h * .35, Hc * .6);
  s.quadraticCurveTo(h * .55, Hc * .62, h * .7, Hc * .45); s.quadraticCurveTo(h * .78, Hc * .25, h, Hc * .25); s.lineTo(h, 0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 }); geo.translate(0, 0, -depth / 2); geo.rotateY(Math.PI / 2);
  return new THREE.Mesh(geo, m);
}
function church(o) {
  const g = new THREE.Group(), L = o.length, W = o.width, H = o.height;
  const wall = M(o.wall || WHITE), stone = M(o.stone || CANTERA), dark = M(0x2a211c), dome = M(o.domeColor || 0xc8a24a, { roughness: .5, metalness: .1 });
  const trim = o.trim ? M(o.trim) : stone, tower = o.towerStone ? M(o.towerStone) : stone;
  box(g, L, H, W, L / 2, 0, 0, wall);                                   // nave runs +x from the facade at x = 0
  box(g, L + .3, .6, W + .3, L / 2, H, 0, o.trim ? trim : stone);        // cornice
  box(g, 1.2, H + 2.5, W + 1, -.3, 0, 0, o.facade ? M(o.facade) : stone);  // facade slab
  if (o.curved) {
    const gb = gable(W + 1, H * .42, 1.2, o.facade ? M(o.facade) : stone); gb.position.set(-.3, H + 2.5, 0); g.add(gb);
    const rim = gable(W + 1.5, H * .42 + .35, .9, trim); rim.position.set(-.05, H + 2.35, 0); g.add(rim);
    box(g, 1.4, .45, W + 1.4, -.3, H + 2.3, 0, trim);
  } else box(g, 1.3, H * .12, W * .5, -.4, H + 2.5, 0, stone);          // espadaña crest
  if (o.quoins) for (const sz of [-1, 1]) for (let k = 0; k * .9 < H + 2.2; k++) box(g, 1.25, .5, k % 2 ? .9 : 1.5, -.32, k * .9, sz * (W / 2 + .2 - (k % 2 ? .45 : .75) + .5), trim);
  if (o.trim) for (let k = 1; k < 5; k++) for (const sz of [-1, 1]) box(g, .7, H, .35, L * k / 5, 0, sz * (W / 2 + .1), trim);   // pilasters along the nave
  if (o.clock) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.05, 24), M(0xf4f0e6)); face.position.set(-.94, H * .86, -W * .3); face.rotation.y = -Math.PI / 2; g.add(face);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, .13, 6, 24), trim); ring.position.set(-.95, H * .86, -W * .3); ring.rotation.y = -Math.PI / 2; g.add(ring);
    const hand = (len, a) => { const h2 = new THREE.Mesh(new THREE.BoxGeometry(.05, len, .07), dark); h2.position.set(-.97, H * .86 + Math.cos(a) * len / 2, -W * .3 + Math.sin(a) * len / 2); h2.rotation.x = -a; g.add(h2); };
    hand(.6, .5); hand(.85, 2.1);
  }
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
    box(g, TW, H + 2, TW, tx, 0, tz, o.towerStone ? tower : stone);
    for (let tier = 0; tier < (o.tiers || 2); tier++) {
      const y = H + 2 + tier * 5.2, s2 = TW * (1 - tier * .16);
      box(g, s2, 4.4, s2, tx, y, tz, o.towerStone ? tower : tier ? wall : stone);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const op = new THREE.Mesh(new THREE.PlaneGeometry(s2 * .4, 2.6), dark); op.position.set(tx + dx * (s2 / 2 + .02), y + 1.9, tz + dz * (s2 / 2 + .02)); op.rotation.y = dx ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : (dz > 0 ? 0 : Math.PI); g.add(op); }
      box(g, s2 + .5, .4, s2 + .5, tx, y + 4.4, tz, o.towerStone ? M(0x4e2a22) : stone);
      if (o.towerStone) for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const pin = new THREE.Mesh(new THREE.ConeGeometry(.28, 1.1, 6), tower); pin.position.set(tx + dx * s2 / 2, y + 5.3, tz + dz * s2 / 2); g.add(pin); }
      // a bell
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, .9, 12, 1, true), M(BRONZE, { metalness: .6, roughness: .4, side: THREE.DoubleSide })); bell.position.set(tx, y + 1.8, tz); g.add(bell);
    }
    const ty = H + 2 + (o.tiers || 2) * 5.2 + .4;
    const cup = new THREE.Mesh(new THREE.SphereGeometry(TW * .34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), o.towerStone ? tower : dome); cup.position.set(tx, ty, tz); g.add(cup);
    if (o.towerStone) cyl(g, .45, .55, 1.2, tx, ty + TW * .3, tz, tower, 8);
    cyl(g, .05, .05, 2.2, tx, ty + TW * .34 + (o.towerStone ? 1 : 0), tz, M(IRON)); box(g, .9, .08, .08, tx, ty + 1.5 + TW * .34 + (o.towerStone ? 1 : 0), tz, M(IRON));
  }
  // the dome over the crossing, on a drum
  if (o.dome) {
    const dx = L * .72; cyl(g, W * .32, W * .34, 3.2, dx, H, 0, wall, 20);
    const d = new THREE.Mesh(new THREE.SphereGeometry(W * .33, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), dome); d.position.set(dx, H + 3.2, 0); g.add(d);
    if (o.trim) {   // ribs down the dome, pilasters on the drum, windows between
      for (let k = 0; k < 8; k++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(W * .335, .12, 5, 16, Math.PI / 2), trim); rib.position.set(dx, H + 3.2, 0); rib.rotation.y = k * Math.PI / 4; g.add(rib); }
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; box(g, .45, 3.2, .45, dx + Math.cos(a) * W * .335, H, Math.sin(a) * W * .335, trim); const w = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.5), dark); const b = a + Math.PI / 8; w.position.set(dx + Math.cos(b) * (W * .345), H + 1.6, Math.sin(b) * (W * .345)); w.rotation.y = -b + Math.PI / 2; g.add(w); }
    }
    cyl(g, .9, 1.1, 2.2, dx, H + 3.2 + W * .31, 0, wall, 10);
    cyl(g, .05, .05, 2, dx, H + 5.4 + W * .31, 0, M(IRON)); box(g, .9, .08, .08, dx, H + 6.6 + W * .31, 0, M(IRON));
  }
  g.userData.dims = { L, W, H };
  return g;
}

/* iron lace for railings, fences and bench backs */
let LACE = null;
function laceTex() {
  if (LACE) return LACE;
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(2, 2, 124, 60);
  for (let i = 0; i < 4; i++) { const cx = 16 + i * 32; x.beginPath(); x.ellipse(cx, 32, 10, 20, 0, 0, 7); x.stroke(); x.beginPath(); x.arc(cx, 32, 4, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx + 16, 4); x.lineTo(cx + 16, 60); x.stroke(); }
  LACE = new THREE.CanvasTexture(c); LACE.wrapS = THREE.RepeatWrapping; return LACE;
}
function laceMat(rep = 1) { const t = laceTex().clone(); t.needsUpdate = true; t.repeat.set(rep, 1); return landmarkMaterial({ color: 0x1a1a1c, map: t, alphaTest: .5, side: THREE.DoubleSide, metalness: .5, roughness: .5 }); }

/* the kiosco of the Jardín: an octagonal bandstand on a white base with chocolate panels and oval niches,
   black iron columns and lace railings, a dark roof with a golden underside, stairs with an iron rail */
function kiosco() {
  // per the photographs: a base of white panels in red-orange frames with oval openings, black iron lace,
  // a slate roof with a scalloped valance edged in orange, globe lamps, white stairs with red risers
  const g = new THREE.Group(), R = 5.2, RED = 0xd0502c, WHT = 0xf2efe6;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + .3, R + .45, 1.6, 8), M(RED)); base.position.y = .8; base.rotation.y = Math.PI / 8; g.add(base);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * (R + .4), z = Math.sin(a) * (R + .4);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.15, 2.6), M(WHT)); panel.position.set(x, .82, z); panel.rotation.y = -a; g.add(panel);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.3, .06, 6, 20), M(RED)); ring.scale.y = 1.55; ring.position.set(Math.cos(a) * (R + .45), .82, Math.sin(a) * (R + .45)); ring.rotation.y = -a + Math.PI / 2; g.add(ring);
    if (i % 2) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(.7, .45), M(0x1a1a1a, { metalness: .4 })); pl.position.set(Math.cos(a) * (R + .44), .9, Math.sin(a) * (R + .44)); pl.rotation.y = -a + Math.PI / 2; pl.position.y = 1.05; pl.position.x += Math.cos(a + Math.PI / 2) * .8; pl.position.z += Math.sin(a + Math.PI / 2) * .8; g.add(pl); }
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(R + .5, R + .5, .14, 8), M(RED)); cap.position.y = 1.6; cap.rotation.y = Math.PI / 8; g.add(cap);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .1, 8), M(0xb8a898)); floor.position.y = 1.68; floor.rotation.y = Math.PI / 8; g.add(floor);
  const lace = laceMat(2), globe = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8, x = Math.cos(a) * (R - .3), z = Math.sin(a) * (R - .3);
    cyl(g, .08, .1, 4, x, 1.65, z, M(0x1a1a1c, { metalness: .5, roughness: .5 }), 10);
    cyl(g, .12, .12, .35, x, 3.3, z, M(0xb8963a, { metalness: .6, roughness: .4 }), 10);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 10), globe); gl.position.set(Math.cos(a) * (R + .1), 5.1, Math.sin(a) * (R + .1)); g.add(gl);
    const b = a + Math.PI / 8, len = 2 * (R - .3) * Math.sin(Math.PI / 8);
    if (i !== 0) { const rr = new THREE.Mesh(new THREE.PlaneGeometry(len, .95), lace); rr.position.set(Math.cos(b) * (R - .35), 2.15, Math.sin(b) * (R - .35)); rr.rotation.y = -b + Math.PI / 2; g.add(rr); }
    const br = new THREE.Mesh(new THREE.PlaneGeometry(len, .9), lace); br.position.set(Math.cos(b) * (R - .35), 5.15, Math.sin(b) * (R - .35)); br.rotation.y = -b + Math.PI / 2; g.add(br);
  }
  root_glow_register(globe);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(R + .9, 2.2, 8, 1, true), M(0x4a525a, { metalness: .35, roughness: .5 })); roof.position.y = 6.75; roof.rotation.y = Math.PI / 8; g.add(roof);
  const under = new THREE.Mesh(new THREE.ConeGeometry(R + .85, 2.15, 8, 1, true), M(0xb86a34, { side: THREE.BackSide })); under.position.y = 6.72; under.rotation.y = Math.PI / 8; g.add(under);
  // the scalloped valance: a band of half-discs, orange-edged
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 4, cx = Math.cos(a) * (R + .85), cz = Math.sin(a) * (R + .85), side = 2 * (R + .9) * Math.sin(Math.PI / 8);
    const band = new THREE.Mesh(new THREE.PlaneGeometry(side, .35), M(0x4a525a, { side: THREE.DoubleSide })); band.position.set(cx, 5.62, cz); band.rotation.y = -a + Math.PI / 2; g.add(band);
    for (let k = 0; k < 6; k++) { const sc = new THREE.Mesh(new THREE.CircleGeometry(side / 12, 10, Math.PI, Math.PI), M(0xd06a2a, { side: THREE.DoubleSide })); const t = (k + .5) / 6 - .5; sc.position.set(cx + Math.cos(a + Math.PI / 2) * t * side, 5.45, cz + Math.sin(a + Math.PI / 2) * t * side); sc.rotation.y = -a + Math.PI / 2; g.add(sc); } }
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(.6, .7, 1.1, 8), M(0x4a525a)); lan.position.y = 8.3; g.add(lan);
  const top = new THREE.Mesh(new THREE.ConeGeometry(.8, 1, 8), M(0x4a525a, { metalness: .3 })); top.position.y = 9.35; g.add(top);
  cyl(g, .05, .03, .8, 0, 9.8, 0, M(0x8a8a8a, { metalness: .6 }), 6);
  // stairs on the east side: white treads, red risers, an iron rail each side, red end posts with an oval
  for (let s = 0; s < 5; s++) { box(g, 1.1, .33 * (s + 1), 2.6, R + 1.8 - s * .4, 0, 0, M(s % 2 ? RED : 0xe8e2d6)); }
  for (const sz of [-1, 1]) { const rl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .9), lace); rl.position.set(R + 1, 1.5, sz * 1.35); rl.rotation.z = -.36; g.add(rl); box(g, .55, 1.9, .55, R + 2.5, 0, sz * 1.5, M(RED)); const ov = new THREE.Mesh(new THREE.CircleGeometry(.14, 12), M(WHT)); ov.scale.y = 1.8; ov.position.set(R + 2.78, 1.05, sz * 1.5); ov.rotation.y = Math.PI / 2; g.add(ov); box(g, .66, .12, .66, R + 2.5, 1.9, sz * 1.5, M(RED)); }
  return g;
}
let KGLOBES = [];
function root_glow_register(m) { KGLOBES.push(m); }

/* a wrought-iron bench, black, with a lace back and scrolled arms */
function bench(g, x, z, ry, y) {
  const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = ry;
  const ir = M(0x161618, { metalness: .5, roughness: .45 });
  for (let k = 0; k < 4; k++) box(b, 1.9, .04, .08, 0, .44, -.16 + k * .1, ir);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .5), laceMat(2)); back.position.set(0, .78, -.22); back.rotation.x = -.15; b.add(back);
  for (const s of [-.92, .92]) { box(b, .06, .44, .44, s, 0, 0, ir); const arm = new THREE.Mesh(new THREE.TorusGeometry(.11, .02, 6, 12, Math.PI), ir); arm.position.set(s, .55, .02); arm.rotation.y = Math.PI / 2; b.add(arm); }
  g.add(b);
}
/* a low iron fence of little arches around a lawn */
function fence(g, w, d, x, z, h = .45) {
  const m = laceMat(1);
  for (const [len, px, pz, ry] of [[w, x, z - d / 2, 0], [w, x, z + d / 2, 0], [d, x - w / 2, z, Math.PI / 2], [d, x + w / 2, z, Math.PI / 2]]) {
    const t = laceTex().clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(len / 1.2)), 1);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(len, h), landmarkMaterial({ color: 0x1a1a1c, map: t, alphaTest: .5, side: THREE.DoubleSide, metalness: .5 })); f.position.set(px, h / 2 + .12, pz); f.rotation.y = ry; g.add(f);
  }
}
/* a lawn quadrant: from the cross paths (half-width pw) out to the edges (ex, ez), its inner corner cut round a ring of radius rr */
function lawnShape(qx, qz, pw, ex, ez, rr) {
  const sh = new THREE.Shape(), X = v => v * qx, Z = v => v * qz;
  const a0 = Math.asin(Math.min(1, pw / rr)), pts = [];
  pts.push([pw, Math.sqrt(rr * rr - pw * pw)]);
  pts.push([pw, ez]); pts.push([ex, ez]); pts.push([ex, pw]); pts.push([Math.sqrt(rr * rr - pw * pw), pw]);
  for (let k = 1; k < 12; k++) { const a = a0 + (Math.PI / 2 - 2 * a0) * k / 12; pts.push([rr * Math.cos(a), rr * Math.sin(a)]); }
  pts.forEach(([u, v], i) => i ? sh.lineTo(X(u), Z(v)) : sh.moveTo(X(u), Z(v)));
  sh.closePath(); return sh;
}
/* a seto: a trimmed hedge, boxy with soft edges */
function hedge(g, x, z, w, d, h) {
  const geo = new THREE.BoxGeometry(w, h, d, Math.max(2, Math.round(w)), 3, Math.max(2, Math.round(d))), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), n = Math.sin(vx * 3.1 + vz * 2.3) * .05 + Math.sin(vx * 7 + vy * 5) * .03; p.setXYZ(i, vx * (1 + n * .3), vy + (vy > 0 ? n : 0), vz * (1 + n * .3)); }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M(0x2f5a24, { roughness: 1 })); m.position.set(x, h / 2 + .1, z); g.add(m); return m;
}
/* a tabachín (flamboyán): a wide umbrella of flame-red flowers */
function tabachin(g, x, z, y) {
  const t = new THREE.Group(); t.position.set(x, y, z);
  cyl(t, .16, .26, 3.2, 0, 0, 0, M(0x6a5a48), 7);
  for (const [cx, cy, cz, r] of [[0, 4.1, 0, 2.6], [1.8, 3.8, .6, 1.7], [-1.7, 3.9, -.7, 1.8], [.4, 4.6, 1.4, 1.5]]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(0xd8482a, { roughness: .9 })); c.position.set(cx, cy, cz); c.scale.y = .55; t.add(c); }
  g.add(t); return t;
}
let PAVE = null;
function pavingTex() {
  if (PAVE) return PAVE;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = 170 + Math.random() * 30; x.fillStyle = `rgb(${v},${v - 6},${v - 14})`; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
  PAVE = new THREE.CanvasTexture(c); PAVE.wrapS = PAVE.wrapT = THREE.RepeatWrapping; PAVE.repeat.set(24, 20); PAVE.colorSpace = THREE.SRGBColorSpace; return PAVE;
}
/* a laurel with its trunk whitewashed to the knee, as in every jardín of Michoacán */
function laurel(g, x, z, y, s = 1) {
  const t = new THREE.Group(); t.position.set(x, y, z); t.scale.setScalar(s);
  cyl(t, .22, .3, 1.3, 0, 0, 0, M(0xf2efe6), 8); cyl(t, .18, .22, 2.4, 0, 1.3, 0, M(0x5b4331), 8);
  for (const [cx, cy, cz, r] of [[0, 4.4, 0, 2.3], [1.2, 3.9, .5, 1.6], [-1.1, 4, -.6, 1.7], [.2, 5.4, -.3, 1.4]]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(0x3c6a2c, { roughness: .9 })); c.position.set(cx, cy, cz); c.scale.y = .8; t.add(c); }
  g.add(t); return t;
}

/* an arcade of portales: white arches with a red trim and a red guardapolvo, along +x, facing -z */
function arcade(g, len, x0, z, wallC = 0xefe9dc, trimC = 0x8a2a1e, h = 4.2, depth = 3.2) {
  const n = Math.max(2, Math.round(len / 3.6)), sp = len / n, W = M(wallC), T = M(trimC);
  for (let k = 0; k <= n; k++) { box(g, .7, h, .7, x0 - len / 2 + k * sp, 0, z - depth, W); box(g, .74, .9, .74, x0 - len / 2 + k * sp, 0, z - depth, T); }
  for (let k = 0; k < n; k++) { const a = new THREE.Mesh(new THREE.TorusGeometry(sp / 2 - .35, .2, 6, 14, Math.PI), T); a.position.set(x0 - len / 2 + (k + .5) * sp, h - sp / 2 + .35, z - depth - .36); g.add(a); }
  box(g, len + .7, 1.2, .8, x0, h - .2, z - depth, W); box(g, len + .7, .35, depth + .8, x0, h + 1, z - depth / 2, W); box(g, len + .7, .2, .85, x0, h + .3, z - depth, T);
}
let STONE = null;
function stoneTex() {
  if (STONE) return STONE;
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#3e3a36'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { const cx = Math.random() * 256, cy = Math.random() * 256, r = 10 + Math.random() * 18; const v = 70 + Math.random() * 50; x.fillStyle = `rgb(${v},${v - 6},${v - 12})`; x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + Math.random() * .5; x.lineTo(cx + Math.cos(a) * r * (0.7 + Math.random() * .4), cy + Math.sin(a) * r * (0.7 + Math.random() * .4)); } x.fill(); }
  STONE = new THREE.CanvasTexture(c); STONE.wrapS = STONE.wrapT = THREE.RepeatWrapping; STONE.colorSpace = THREE.SRGBColorSpace; return STONE;
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

  /* ---- the Jardín (Jardín Colón): a ring walk round the kiosco, paths that open out from it, lawns with curved
         inner corners behind low iron fences (walk across them if you like), trimmed setos, laureles with white
         trunks, flame trees, a little round fountain ---- */
  {
    const { x, z } = P('jardin'), y = H(x, z), g = new THREE.Group(), hs = [];
    const pav = new THREE.Mesh(new THREE.BoxGeometry(74, .25, 62), landmarkMaterial({ map: pavingTex(), roughness: .8 })); pav.position.y = .025; g.add(pav);
    for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      // a lawn: the quadrant between the cross paths, its inner corner cut in a curve round the kiosco's ring walk
      const lawn = lawnShape(qx, qz, 3.2, 35, 29, 13.5), lg = new THREE.ExtrudeGeometry(lawn, { depth: .14, bevelEnabled: false, curveSegments: 18 }); lg.rotateX(Math.PI / 2); lg.translate(0, .29, 0);
      g.add(new THREE.Mesh(lg, M(0x4a7a2e, { roughness: .95 })));
      fence(g, 30, .1, qx * 19, qz * 29.4); fence(g, .1, 24, qx * 34.6, qz * 16.8);
      // setos: trimmed hedges along the outer edges, with gaps for the walks
      for (const [hx, hz, hw, hd] of [[qx * 12, qz * 28.2, 14, 1.4], [qx * 28, qz * 28.2, 10, 1.4], [qx * 33.6, qz * 9, 1.4, 9], [qx * 33.6, qz * 22, 1.4, 9]]) { hedge(g, hx, hz, hw, hd, 1.5); hs.push([hx, hz, hw, hd]); }
      for (let k = 0; k < 3; k++) bench(g, qx * (8 + k * 7), qz * 2.6, qz > 0 ? Math.PI : 0, .1);
      lantern(g, qx * 16, qz * 15, .3, glow); lantern(g, qx * 30, qz * 4, .1, glow);
      laurel(g, qx * 22, qz * 21, .3, 1.05); laurel(g, qx * 9, qz * 20, .3, .9);
      if (qx > 0) tabachin(g, qx * 28, qz * 14, .3); else laurel(g, qx * 28, qz * 14, .3, 1.1);
      // a bed of geraniums and roses: a low mound of leaves with small blossoms scattered over the top
      { const cx = qx * 16.8, cz = qz * 9.45, bed = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x2e5a26, { roughness: 1 })); bed.scale.set(3.4, .42, .75); bed.position.set(cx, .12, cz); g.add(bed);
        const n = 70, bl = new THREE.InstancedMesh(new THREE.SphereGeometry(.065, 6, 4), M(0xffffff, { roughness: .8 }), n), m4 = new THREE.Matrix4(), col = new THREE.Color(), pal = [0xc8202a, 0xe84a5a, 0xf0c030, 0xf4f0ea, 0xd04a8a];
        for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * .92, u = Math.cos(a) * r, v = Math.sin(a) * r, y = .12 + .42 * Math.sqrt(Math.max(0, 1 - r * r)) + .02;
          m4.makeTranslation(cx + u * 3.4, y, cz + v * .75); bl.setMatrixAt(k, m4); bl.setColorAt(k, col.set(pal[(k * 7 + (qx > 0 ? 1 : 0) + (qz > 0 ? 2 : 0)) % pal.length])); }
        g.add(bl); }
    }
    // a little round fountain on the west walk
    cyl(g, 1.8, 1.9, .55, -24, .1, 0, M(0xd8d0c4), 20); const fw = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .08, 20), M(0x3a6a78, { roughness: .08, metalness: .25 })); fw.position.set(-24, .6, 0); g.add(fw); cyl(g, .18, .25, 1.2, -24, .6, 0, M(0xd8d0c4), 10);
    g.add(kiosco());
    place(g, x, z);
    col.addSolid(x, z, 11, 11, 0, y - 1, y + 1.7, 'kiosco');     // the bandstand floor is walkable
    for (let st = 0; st < 5; st++) col.addSolid(x + 5.2 + 1.8 - st * .4, z, 1.1, 2.6, 0, y - 1, y + .33 * (st + 1), 'step');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; col.addCircle(x + Math.cos(a) * 4.9, z + Math.sin(a) * 4.9, .12, y + 1.6, y + 5.7, 'kiosco'); }
    col.addCircle(x - 24, z, 1.9, y - 1, y + .65, 'fountain');
    for (const [hx, hz, hw, hd] of hs) col.addBox(x + hx, z + hz, hw, hd, 0, y - 1, y + 1.6, 'hedge');
    root.userData.hedges = (root.userData.hedges || 0) + 1;
    spots.kiosco = [x, y + 1.7, z];
  }
  /* ---- the Plaza Aguadora: terracotta paving, the fountain of the water-carrier under her little temple,
         a great tree hung with paper lanterns ---- */
  {
    const { x, z } = P('plazaSur'), y = H(x, z), g = new THREE.Group(), OR = 0xc8703a, OR2 = 0xd88a52;
    box(g, 34, .22, 30, 0, -.1, 0, M(0xa8583e));
    for (let k = 0; k < 3; k++) cyl(g, 5.6 - k * .5, 5.7 - k * .5, .22, 0, k * .22, 0, M(k % 2 ? OR2 : OR), 28);   // three round steps
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, .8, 28, 1, true), M(OR, { side: THREE.DoubleSide })); rim.position.y = .66 + .4; g.add(rim);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(4.3, .18, 6, 28), M(OR2)); lip.rotation.x = Math.PI / 2; lip.position.y = 1.46; g.add(lip);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, .1, 28), M(0x3a6a78, { roughness: .08, metalness: .25 })); water.position.y = 1.2; g.add(water);
    // the temple: a square base, four columns, arches, a little dome
    box(g, 2.6, 1.6, 2.6, 0, .66, 0, M(OR)); box(g, 3, .25, 3, 0, 2.26, 0, M(OR2));
    for (const [cx, cz] of [[-1.15, -1.15], [1.15, -1.15], [-1.15, 1.15], [1.15, 1.15]]) cyl(g, .16, .19, 2.6, cx, 2.5, cz, M(OR2), 10);
    for (const ry of [0, Math.PI / 2]) for (const sg of [-1, 1]) { const ar = new THREE.Mesh(new THREE.TorusGeometry(1.0, .16, 6, 14, Math.PI), M(OR)); ar.position.set(ry ? sg * 1.15 : 0, 4.6, ry ? 0 : sg * 1.15); ar.rotation.y = ry; g.add(ar); }
    box(g, 2.9, .5, 2.9, 0, 5.4, 0, M(OR2));
    const dm = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(OR)); dm.position.y = 5.9; g.add(dm);
    cyl(g, .25, .3, .6, 0, 7.05, 0, M(OR2), 8);
    const statue = makePerson({ skin: BRONZE, hair: BRONZE, top: BRONZE, bottom: BRONZE, dress: true, shoes: BRONZE, height: .95, hairStyle: 'bun' });
    statue.traverse(o => { if (o.isMesh) o.material = M(0x5a4630, { metalness: .6, roughness: .45 }); });
    statue.position.y = 2.5; g.add(statue);
    const pot = new THREE.Mesh(new THREE.SphereGeometry(.26, 12, 10), M(0x5a4630, { metalness: .6, roughness: .45 })); pot.position.set(.28, 4.15, 0); pot.scale.y = 1.2; g.add(pot);
    // the great tree with its paper lanterns, and the benches around
    const tr = laurel(g, -9, 8, 0, 1.5); tr.scale.set(1.6, 1.45, 1.6);
    const lantMat = new THREE.MeshBasicMaterial({ color: 0xffa048 }); root.userData.paperLanterns = lantMat;
    for (let k = 0; k < 16; k++) { const a = k * 2.4, r = 1.5 + (k % 4) * .8; const l = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8), lantMat); l.position.set(-9 + Math.cos(a) * r * 1.6, 4.4 + (k % 3) * .6, 8 + Math.sin(a) * r * 1.6); g.add(l); }
    for (let k = 0; k < 6; k++) bench(g, Math.cos(k + .5) * 9, Math.sin(k + .5) * 9, -(k + .5) + Math.PI / 2, 0);
    for (const [lx, lz] of [[-14, -12], [14, -12], [14, 12], [0, -13]]) lantern(g, lx, lz, 0, glow);
    place(g, x, z); col.addCircle(x, z, 4.5, y - 1, y + 3.5, 'fountain'); col.addCircle(x - 9 * 1, z + 8, .5, y - 1, y + 4, 'tree');
    spots.aguadora = [x, y, z];
  }
  /* ---- the Parroquia de San Francisco, facing west onto its atrio ---- */
  {
    const { x, z } = P('parroquia'), fx = x - 26, y = H(fx, z);
    // ochre walls, almagre (red-orange) quoins and pilasters, a curved gable, a clock, and a tower of dark cantera
    const c = church({ length: 54, width: 16, height: 16, towers: 1, towerSide: -1, dome: true, domeColor: 0xd8b04a, towerW: 5.6, wall: 0xeac46a, facade: 0xecc86c, trim: 0xc4501e, towerStone: 0x6e3c30, curved: true, quoins: true, clock: true, tiers: 3, doorMat: M(0x4a2c18) });
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
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(68, .15, 100), landmarkMaterial({ map: pitchTex(), roughness: .97 })); pitch.position.y = .05; g.add(pitch);
    for (const sz of [-1, 1]) { const goal = new THREE.Group(); box(goal, 7.3, .12, .12, 0, 2.44, 0, M(0xf4f4f4)); for (const sx of [-1, 1]) box(goal, .12, 2.44, .12, sx * 3.65, 0, 0, M(0xf4f4f4)); goal.position.set(0, 0, sz * 50); g.add(goal); }
    // the green basketball court beside the field, with its two hoops
    const court = new THREE.Mesh(new THREE.BoxGeometry(15, .16, 26), landmarkMaterial({ map: courtTex(), roughness: .7 })); court.position.set(26, .1, -36); g.add(court);
    for (const sz of [-1, 1]) { cyl(g, .08, .08, 3.4, 26, 0, -36 + sz * 13.6, M(0xe8e8e8), 6); box(g, 1.8, 1.05, .06, 26, 3.0, -36 + sz * 13.1, M(0xf4f4f4)); const rim2 = new THREE.Mesh(new THREE.TorusGeometry(.23, .02, 6, 14), M(0xd86a1a)); rim2.rotation.x = Math.PI / 2; rim2.position.set(26, 3.05, -36 + sz * 12.75); g.add(rim2); }
    // the perimeter wall
    for (const [w, d, px, pz] of [[84, .4, 0, -60], [84, .4, 0, 60], [.4, 120, -42, 0], [.4, 120, 42, 0]]) box(g, w, 3, d, px, 0, pz, M(0xe6ded0));
    // west: the roofed grandstand, white concrete steps under corrugated roofing on red columns with diagonal braces
    for (let r = 0; r < 8; r++) box(g, 1.1, .45 * (r + 1), 76, -36.5 - r * 1.1, 0, 0, M(r % 2 ? 0xe8e4dc : 0xdcd6cc));
    const RED = M(0x8a2a24, { metalness: .3, roughness: .6 });
    for (let k = -4; k <= 4; k++) { cyl(g, .16, .16, 8.6, -36.2, 0, k * 9, RED, 8); cyl(g, .16, .16, 10.5, -45.2, 0, k * 9, RED, 8); const br = new THREE.Mesh(new THREE.BoxGeometry(.16, 5.6, .16), RED); br.position.set(-38.8, 6.6, k * 9); br.rotation.z = -1.0; g.add(br); }
    const roofS = new THREE.Mesh(new THREE.BoxGeometry(11, .12, 80), landmarkMaterial({ map: corrTex(), color: 0x8a9298, metalness: .55, roughness: .45 })); roofS.position.set(-40.6, 9.6, 0); roofS.rotation.z = -.17; g.add(roofS);
    const sign = plaque(g, ['ESTADIO 18 DE MARZO'], 18, 1.9, -35.4, 10.7, 0, -Math.PI / 2, { bg: '#f4f2ec', fg: '#9a1e18', border: false, size: 150, h: 200, w: 1400, weight: 700 });
    box(g, .2, 2.2, 19, -35.55, 9.6, 0, M(0xf4f2ec));
    box(g, 4.5, 3.2, 5.4, -35.6, 0, 0, M(0xf2efe8)); const tun = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.4), M(0x1a1612)); tun.position.set(-33.33, 1.2, 0); tun.rotation.y = Math.PI / 2; g.add(tun);
    // chain-link fence on red posts, and a red curb, between the stands and the field
    const chain = landmarkMaterial({ map: chainTex(), alphaTest: .4, side: THREE.DoubleSide, color: 0xb8bcc0, metalness: .5 });
    const cf = new THREE.Mesh(new THREE.PlaneGeometry(76, 1.6), chain); cf.material.map.repeat.set(76, 2); cf.position.set(-35.2, .8, 0); cf.rotation.y = Math.PI / 2; g.add(cf);
    for (let k = -8; k <= 8; k++) cyl(g, .05, .05, 1.7, -35.2, 0, k * 4.6, RED, 6);
    box(g, .4, .25, 76, -35, 0, 0, RED);
    // east: open stands painted green and white
    for (let r = 0; r < 7; r++) box(g, 1.1, .45 * (r + 1), 56, 35.5 + r * 1.1, 0, 0, M(r % 2 ? 0x2e8a4a : 0xf0f0ea));
    for (let k = -3; k <= 3; k++) cyl(g, .1, .1, 5, 43.5, 3.2, k * 9, M(0xf0f0ea), 6);
    box(g, 9, .12, 60, 39.5, 8.2, 0, M(0xd8dcde, { metalness: .5 }));
    // floodlights at the corners
    for (const [lx, lz] of [[-40, -58], [40, -58], [-40, 58], [40, 58]]) { cyl(g, .25, .35, 22, lx, 0, lz, M(0xd8dcd8), 8); box(g, 4, 2.2, .5, lx, 22, lz, M(0x3a3a3a)); }
    place(g, s.x, s.z);
    for (const [w, d, px, pz] of [[84, 1, 0, -60], [84, 1, 0, 60], [1, 120, -42, 0], [1, 120, 42, 0]]) if (pz !== -60) col.addBox(s.x + px, s.z + pz, w, d, 0, y - 1, y + 3, 'wall');
    col.addBox(s.x - 25, s.z - 60, 34, 1, 0, y - 1, y + 3, 'wall'); col.addBox(s.x + 25, s.z - 60, 34, 1, 0, y - 1, y + 3, 'wall');
    // the portada: a whitewashed wall with pink cantera pilasters and finials, a scalloped cantera parapet,
    // a tall central arch lettered 18 DE MARZO, a bronze eagle on top, and the General's words painted in script
    const p = P('portada'), py = H(p.x, p.z), pg = new THREE.Group(), CA = M(0xb8806a), CA2 = M(0x9a6452), WH = M(0xf2efe8);
    const pil = (x, h, w = 1.3) => { box(pg, w, h, 1.5, x, 0, 0, CA); box(pg, w + .3, .35, 1.7, x, h, 0, CA2); box(pg, w + .2, .6, 1.6, x, 0, 0, CA2);
      const urn = new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 8), CA); urn.scale.y = 1.25; urn.position.set(x, h + .8, 0); pg.add(urn); const tip = new THREE.Mesh(new THREE.ConeGeometry(.2, .6, 8), CA2); tip.position.set(x, h + 1.45, 0); pg.add(tip); };
    // wall panels (with a gap for the arch)
    box(pg, 8.4, 6.2, .9, -7.8, 0, 0, WH); box(pg, 8.4, 6.2, .9, 7.8, 0, 0, WH);
    box(pg, 2.6, 8.3, .9, -3.8, 0, 0, WH); box(pg, 2.6, 8.3, .9, 3.8, 0, 0, WH); box(pg, 5, 1.7, .9, 0, 6.6, 0, WH);
    for (const sx of [-1, 1]) {
      const cr = gable(8.4, 2.2, .9, WH); cr.rotation.y = -Math.PI / 2; cr.position.set(sx * 7.8, 6.2, 0); pg.add(cr);
      const rim = gable(8.6, 2.45, .7, CA); rim.rotation.y = -Math.PI / 2; rim.position.set(sx * 7.8, 6.05, .12); pg.add(rim);
      pil(sx * 2.6, 9.6, 1.4); pil(sx * 5.1, 7.4); pil(sx * 12.1, 6.6, 1.5);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), M(0x5a3a26)); win.position.set(sx * 8, 1.4, -.47); win.rotation.y = Math.PI; pg.add(win);
    }
    const crest = gable(5.2, 2.6, .9, WH); crest.rotation.y = -Math.PI / 2; crest.position.set(0, 8.3, 0); pg.add(crest);
    const crestRim = gable(5.5, 2.9, .7, CA); crestRim.rotation.y = -Math.PI / 2; crestRim.position.set(0, 8.15, .12); pg.add(crestRim);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.3, .55, 8, 24, Math.PI), CA); arch.position.set(0, 5.1, 0); pg.add(arch);
    for (const sx of [-1, 1]) box(pg, 1.1, 5.1, 1.2, sx * 2.3, 0, 0, CA);
    box(pg, .8, 1, 1.3, 0, 7.1, 0, CA2);
    plaque(pg, ['18 DE MARZO'], 4, .7, 0, 6.15, -.62, Math.PI, { bg: '#b8806a', fg: '#4a2014', border: false, size: 150, h: 200, w: 1100 });
    // the eagle
    const eg = new THREE.Group(), BZ = M(0x8a6a3a, { metalness: .65, roughness: .4 });
    box(eg, .9, .5, .9, 0, 0, 0, CA2);
    const body = new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 10), BZ); body.scale.set(.8, 1.3, .7); body.position.y = 1.05; eg.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), BZ); head.position.set(0, 1.75, -.12); eg.add(head);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, .5, .1), BZ); w.position.set(sx * .95, 1.5, 0); w.rotation.z = sx * .6; eg.add(w); const f = new THREE.Mesh(new THREE.BoxGeometry(.9, .35, .08), BZ); f.position.set(sx * 1.6, 2.15, 0); f.rotation.z = sx * .9; eg.add(f); }
    eg.position.y = 10.6; pg.add(eg);
    // the General's words, painted in black script on the white panels
    const script = { bg: '#f2efe8', fg: '#1a1612', border: false, font: 'Cormorant Garamond, Georgia, serif', weight: 600, w: 1024, h: 420, size: 74 };
    const quote = plaque(pg, ['Los recursos naturales del', 'país deben servir para su', 'propia prosperidad'], 6, 2.5, -7.8, 4, -.47, Math.PI, script);
    plaque(pg, ['Entregarlos a intereses', 'extraños es traicionar', 'la patria'], 6, 2.5, 7.8, 4, -.47, Math.PI, script);
    quote.material.roughness = .9;
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6), landmarkMaterial({ map: gateTex(), alphaTest: .5, side: THREE.DoubleSide, metalness: .5, roughness: .5 })); gate.position.set(0, 1.8, .2); pg.add(gate);
    place(pg, p.x, p.z, 0);
    for (const [cx, w] of [[-7.8, 8.4], [7.8, 8.4], [-3.4, 1.8], [3.4, 1.8], [-12.1, 1.5], [12.1, 1.5]]) col.addBox(p.x + cx, p.z, w, 1.6, 0, py - 1, py + 9, 'landmark');
    spots.portadaQuote = [p.x - 7.8, py, p.z - 2.4]; spots.portadaStone = [p.x + 2.6, py, p.z - 1.6];
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
    // the glorieta around it: laja paving, a ring of lawn with a clipped seto, laureles with white trunks, iron benches
    const pt = pavingTex().clone(); pt.needsUpdate = true; pt.repeat.set(6, 6);
    const pav = new THREE.Mesh(new THREE.CircleGeometry(13, 48), landmarkMaterial({ map: pt, roughness: .85 })); pav.rotation.x = -Math.PI / 2; pav.position.y = .06; pav.receiveShadow = true; g.add(pav);
    const lawn = new THREE.Mesh(new THREE.RingGeometry(13, 21, 48), M(0x4a7a30, { roughness: 1 })); lawn.rotation.x = -Math.PI / 2; lawn.position.y = .08; lawn.receiveShadow = true; g.add(lawn);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2 + Math.PI / 8, ca = Math.cos(a), sa = Math.sin(a);
      const hg = hedge(g, ca * 13.6, sa * 13.6, 3.8, .7, .7); hg.rotation.y = -a + Math.PI / 2;
      laurel(g, Math.cos(a + Math.PI / 8) * 17.5, Math.sin(a + Math.PI / 8) * 17.5, 0, .8 + (k % 3) * .1);
      if (k % 2 === 0) bench(g, Math.cos(a + Math.PI / 8) * 11.5, Math.sin(a + Math.PI / 8) * 11.5, -a - Math.PI / 8 - Math.PI / 2, .06);
    }
    place(g, x, z); col.addBox(x, z, 3.6, 3.6, 0, y - 1, y + 9, 'landmark');
    spots.monumento = [x, y, z + 3.2];
  }
  /* ---- the churches of the barrios ---- */
  {
    // the Santuario de Guadalupe: red brick, a tall brick tower, and a great salmon-pink dome with its lantern
    const gp = P('guadalupe'), g1 = church({ length: 40, width: 14, height: 15, towers: 1, towerSide: -1, dome: true, domeColor: 0xe0907e, towerW: 5, wall: 0xa8563c, facade: 0xb05c40, trim: 0x8a4430, towerStone: 0x9a4a34, tiers: 3, curved: true });
    g1.traverse(o => { if (o.isMesh && o.geometry.type === 'SphereGeometry' && o.position.y > 15 && o.position.y < 25) o.scale.set(1.25, 1.35, 1.25); });
    place(g1, gp.x, gp.z - 20, -Math.PI / 2); const y1 = H(gp.x, gp.z);   // facing north onto Calle Constitución
    col.addBox(gp.x, gp.z, 17, 42, 0, y1 - 2, y1 + 16, 'landmark');
    const sc = P('cayetano'), g2 = church({ length: 32, width: 11, height: 12, towers: 1, towerSide: 1, dome: false, domeColor: 0xc88a3a, towerW: 4 });
    place(g2, sc.x - 16, sc.z, 0); const y2 = H(sc.x, sc.z);   // facing west
    col.addBox(sc.x, sc.z, 34, 14, 0, y2 - 2, y2 + 13, 'landmark'); col.addBox(sc.x - 14.5, sc.z + 6.7, 4.4, 4.4, 0, y2 - 2, y2 + 24, 'landmark');
    const sa = P('santaAnita'), g3 = church({ length: 18, width: 8, height: 8, towers: 0, dome: false });
    place(g3, sa.x - 9, sa.z, 0); const y3 = H(sa.x, sa.z);
    col.addBox(sa.x, sa.z, 19, 9, 0, y3 - 2, y3 + 9, 'landmark');
    spots.guadalupeDoor = [gp.x, y1, gp.z - 22]; spots.cayetanoDoor = [sc.x - 18, y2, sc.z];
    // the nuns' convent beside the Santuario: two storeys around a cloister, an arcade on the ground floor
    { const cg = new THREE.Group(); box(cg, 22, 7.2, 14, 0, 0, 0, M(0xefe6d6)); box(cg, 22.2, .9, 14.2, 0, 0, 0, M(0x8a2a1e)); box(cg, 22.6, .4, 14.6, 0, 7.2, 0, M(TILE));
      arcade(cg, 18, 0, -7.4, 0xefe6d6, 0x8a2a1e);
      for (let k = 0; k < 6; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.5), M(0x2a2018)); w.position.set(-8 + k * 3.2, 5.2, -7.03); w.rotation.y = Math.PI; cg.add(w); }
      plaque(cg, ['CONVENTO', { text: 'Hermanas del Santuario de Guadalupe', small: true }], 5, 1, 0, 6.3, -7.05, Math.PI, { bg: '#e8dcc8' });
      place(cg, gp.x + 22, gp.z - 4, 0); col.addBox(gp.x + 22, gp.z - 4, 22, 14, 0, y1 - 2, y1 + 7.6, 'roof'); }
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
  /* ---- the Bosque's gate: a wall of dark volcanic stone with two arches and a scalloped top ---- */
  {
    const b = P('bosque'), gx = b.x - 60, gz = b.z - 150, g = new THREE.Group(), ST = landmarkMaterial({ map: stoneTex(), roughness: .95 }), RIM = M(0x3a3632);
    box(g, 2.4, 4.6, 1.4, 0, 0, 0, ST); for (const sx of [-1, 1]) { box(g, 3.6, 4.6, 1.4, sx * 5.6, 0, 0, ST); box(g, 1.2, 2.6, 1.6, sx * 1.6, 0, 0, RIM); box(g, 1.2, 2.6, 1.6, sx * 3.6, 0, 0, RIM); }
    box(g, 14.8, 1.4, 1.4, 0, 4.6, 0, ST);
    for (const sx of [-1, 1]) { const ar = new THREE.Mesh(new THREE.TorusGeometry(1.25, .32, 6, 16, Math.PI), RIM); ar.position.set(sx * 2.6, 2.7, -.72); g.add(ar); }
    const crest = gable(14.8, 2.6, 1.3, ST); crest.rotation.y = -Math.PI / 2; crest.position.set(0, 6, 0); g.add(crest);
    const crestR = gable(15.1, 2.85, 1.0, RIM); crestR.rotation.y = -Math.PI / 2; crestR.position.set(0, 5.9, .2); g.add(crestR);
    const peep = new THREE.Mesh(new THREE.PlaneGeometry(.6, .9), M(0xdfe8ee)); peep.position.set(0, 7.2, -.71); peep.rotation.y = Math.PI; g.add(peep);
    place(g, gx, gz);
    for (const sx of [-1, 0, 1]) col.addBox(gx + sx * 5.2, gz, sx ? 4.2 : 2.4, 1.6, 0, H(gx, gz) - 1, H(gx, gz) + 7, 'landmark');
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
    box(h2, 7, 3, 5, 0, 0, 0, M(0xa8805c)); const roof = prism(6, 1.8, 8, M(TILE)); roof.rotation.y = Math.PI / 2; roof.position.y = 3; h2.add(roof);
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
  root.userData.taxiKit = [];
  extras(city, root, spots, glow, place, H);
  root.userData.spots = spots;
  root.userData.update = (t, night) => { const u = root.userData; glow.color.setScalar(.6 + night * 2.6); if (u.blink) u.blink.visible = Math.sin(t * 3) > 0; if (u.blink2) u.blink2.visible = Math.sin(t * 2.2 + 1) > 0; if (u.paperLanterns) u.paperLanterns.color.setRGB(1, .63, .28).multiplyScalar(.7 + night * 2.2); if (u.warmLights) u.warmLights.color.setRGB(1, .85, .63).multiplyScalar(.6 + night * 2.8); for (const m of KGLOBES) m.color.setRGB(1, .96, .88).multiplyScalar(.75 + night * 2.4); };
  return root;
}

function pitchTex() {
  // the field of the 18 de Marzo is mostly earth now, with tufts of grass and lime lines that fade
  const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d');
  x.fillStyle = '#9a7a5a'; x.fillRect(0, 0, 256, 384);
  for (let i = 0; i < 2600; i++) { const g = Math.random(); x.fillStyle = g < .35 ? `rgba(110,130,60,${.25 + Math.random() * .4})` : `rgba(${g < .7 ? '80,60,40' : '170,150,120'},${Math.random() * .25})`; x.fillRect(Math.random() * 256, Math.random() * 384, 2 + Math.random() * 7, 2 + Math.random() * 7); }
  x.globalAlpha = .55; x.strokeStyle = '#f0f0e8'; x.lineWidth = 3; x.strokeRect(8, 8, 240, 368); x.beginPath(); x.moveTo(8, 192); x.lineTo(248, 192); x.stroke();
  x.beginPath(); x.arc(128, 192, 34, 0, 7); x.stroke(); x.strokeRect(68, 8, 120, 60); x.strokeRect(68, 316, 120, 60);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function courtTex() {
  const c = document.createElement('canvas'); c.width = 160; c.height = 280; const x = c.getContext('2d');
  x.fillStyle = '#1e7a5a'; x.fillRect(0, 0, 160, 280); x.strokeStyle = '#f0f0e8'; x.lineWidth = 3; x.strokeRect(8, 8, 144, 264);
  x.beginPath(); x.moveTo(8, 140); x.lineTo(152, 140); x.stroke(); x.fillStyle = '#f0f0e8'; x.beginPath(); x.arc(80, 140, 16, 0, 7); x.fill();
  for (const y of [8, 272]) { x.strokeRect(56, y === 8 ? 8 : 214, 48, 58); x.beginPath(); x.arc(80, y === 8 ? 66 : 214, 50, y === 8 ? 0 : Math.PI, y === 8 ? Math.PI : 2 * Math.PI); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function corrTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d');
  for (let i = 0; i < 64; i++) { const v = 150 + Math.sin(i / 64 * Math.PI * 16) * 50; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(0, i, 64, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 30); return t;
}
function chainTex() {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32; const x = c.getContext('2d');
  x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 16); x.lineTo(16, 0); x.lineTo(32, 16); x.lineTo(16, 32); x.closePath(); x.stroke();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function gateTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#1a2a22'; for (let i = 0; i < 256; i += 12) x.fillRect(i, 10, 4, 118); x.fillRect(0, 10, 256, 6); x.fillRect(0, 64, 256, 5);
  for (let i = 6; i < 256; i += 24) { x.beginPath(); x.moveTo(i, 10); x.lineTo(i + 6, 0); x.lineTo(i + 12, 10); x.fill(); }
  const t = new THREE.CanvasTexture(c); return t;
}

/* a gable roof: a triangular prism w wide, h high, L long (along z), sitting on y = 0 */
function prism(w, h, L, m) {
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); geo.translate(0, 0, -L / 2); return new THREE.Mesh(geo, m);
}
/* a cow, for the ranchos (and for the one that runs away) */
export function makeCow(color = 0xe8dcc0, spots = 0x3a2a1a) {
  const g = new THREE.Group(), body = M(color), dark = M(spots);
  box(g, 1.7, .8, .7, 0, .75, 0, body); box(g, .5, .45, .4, 1.0, 1.15, 0, body); box(g, .2, .2, .36, 1.3, 1.08, 0, M(0xd8a8a0));
  for (const [x, z] of [[.6, .22], [.6, -.22], [-.6, .22], [-.6, -.22]]) box(g, .14, .75, .14, x, 0, z, body);
  box(g, .5, .45, .72, -.2, .9, 0, dark); box(g, .35, .3, .72, .45, 1.05, .0, dark);
  for (const sz of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(.05, .25, 6), M(0xe8e0c8)); h.position.set(1.0, 1.45, sz * .16); h.rotation.x = sz * .5; g.add(h); }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .7, 5), body); tail.position.set(-.88, .9, 0); tail.rotation.z = .3; g.add(tail);
  return g;
}

/* the places added after people who know Jiquilpan walked it with us */
function extras(city, root, spots, glow, place, H) {
  const col = city.colliders, P = id => PLACES[id];
  /* ---- the Azul Portal: a blue colonial house with an arcade on the Jardín, tables under blue umbrellas, lit at night ---- */
  {
    const { x, z } = P('azulPortal'), y = H(x, z), g = new THREE.Group(), BLUE = 0x2f64b0;
    box(g, 30, 8.4, 11, 0, 0, 5.5, M(BLUE)); box(g, 30.3, .5, 11.3, 0, 8.4, 5.5, M(0xf2efe8)); box(g, 30.1, .9, 11.1, 0, 0, 5.5, M(0x8a6a4a));
    arcade(g, 28, 0, 0, BLUE, 0xf2efe8, 4.4, 3.4);
    for (let k = 0; k < 7; k++) { const wx = -12 + k * 4; const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2), M(0x2a2018)); w.position.set(wx, 6.4, -.03); w.rotation.y = Math.PI; g.add(w);
      box(g, 1.6, .1, .6, wx, 5.3, -.3, M(0x1a1a1c)); const rl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .8), laceMat(1)); rl.position.set(wx, 5.75, -.6); g.add(rl);
      box(g, 1.6, .18, .1, wx, 7.5, -.05, M(0xf2efe8)); }
    plaque(g, ['AZUL PORTAL', { text: 'Restaurante · Café', small: true }], 6, 1.1, 0, 7.75, -.06, Math.PI, { bg: '#f2efe8', fg: '#1e3a78', border: false, weight: 700 });
    const warm = new THREE.MeshBasicMaterial({ color: 0xffd8a0 }); root.userData.warmLights = warm;
    for (let k = 0; k < 8; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), warm); l.position.set(-14 + k * 4, 3.9, -3.4); g.add(l); }
    for (let k = 0; k < 5; k++) { const tx = -11 + k * 5.5, tz = -6.4;
      cyl(g, .5, .5, .05, tx, .75, tz, M(0xf4f4f0), 14); cyl(g, .05, .05, .75, tx, 0, tz, M(0x2a2a2a), 6);
      for (const sx of [-1, 1]) box(g, .45, .45, .45, tx + sx * .8, 0, tz, M(0x2a2a2a));
      const um = new THREE.Mesh(new THREE.ConeGeometry(1.5, .6, 8), M(0x2a5aa8)); um.position.set(tx, 2.6, tz); g.add(um); cyl(g, .03, .03, 2.5, tx, 0, tz, M(0xdddddd), 6); }
    place(g, x, z, Math.PI / 2); col.addBox(x + 5.5, z, 11, 30, 0, y - 2, y + 9, 'roof');
    for (let k = 0; k <= 8; k++) col.addCircle(x - 3.4, z - 14 + k * 3.5, .4, y - 1, y + 4.4, 'column');
    spots.azulPortal = [x - 6, y, z];
  }
  /* ---- the Jardín de la Paz: paths in a cross, lawns with jacarandas, a fountain, and a dove on a pillar ---- */
  {
    const { x, z } = P('jardinPaz'), y = H(x, z), g = new THREE.Group();
    box(g, 66, .2, 54, 0, -.1, 0, M(0xc2b4a2));
    for (const [qx, qz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      box(g, 26, .16, 20, qx * 17, 0, qz * 14, M(0x4a7a2e)); fence(g, 25.5, 19.5, qx * 17, qz * 14);
      for (let k = 0; k < 3; k++) jacarandaT(g, qx * (10 + k * 7), qz * (9 + (k % 2) * 8), .4);
      for (let k = 0; k < 2; k++) bench(g, qx * (8 + k * 9), qz * 3.4, qz > 0 ? Math.PI : 0, .1);
      lantern(g, qx * 4, qz * 4, .1, glow); lantern(g, qx * 30, qz * 25, .1, glow);
    }
    cyl(g, 3, 3.2, .7, 0, 0, 0, M(0xb8a898), 20); const w = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, .1, 20), M(0x3a6a78, { roughness: .1, metalness: .2 })); w.position.y = .6; g.add(w);
    cyl(g, .4, .5, 2.4, 0, .6, 0, M(0xd8d0c4), 10);
    const dove = new THREE.Group(); { const b = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), M(0xf4f4f0)); b.scale.set(1.4, .8, .8); dove.add(b); for (const sz of [-1, 1]) { const wg = new THREE.Mesh(new THREE.BoxGeometry(.4, .04, .7), M(0xf4f4f0)); wg.position.set(0, .15, sz * .4); wg.rotation.x = sz * .5; dove.add(wg); } const hd = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), M(0xf4f4f0)); hd.position.set(.42, .18, 0); dove.add(hd); }
    dove.position.y = 3.2; g.add(dove);
    plaque(g, ['JARDÍN DE LA PAZ'], 4, .8, 0, 1.5, -.52, Math.PI, { bg: '#d8d0c4', border: false });
    // a bust in a shell-shaped niche on a whitewashed wall, two red columns, a bronze plaque
    { const n = new THREE.Group(), R2 = M(0xc0442a); box(n, 5, 4.5, .6, 0, 0, .4, M(0xf2efe8));
      for (const sx of [-1, 1]) { cyl(n, .3, .32, 3.4, sx * 1.7, .3, -.2, R2, 12); cyl(n, .4, .42, .3, sx * 1.7, 0, -.2, M(0xf2efe8), 12); }
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.7, 16, 8, 0, Math.PI, 0, Math.PI / 2), R2); shell.rotation.y = Math.PI / 2; shell.rotation.x = -Math.PI / 2; shell.rotation.set(-Math.PI / 2, 0, 0); shell.scale.set(1, .5, 1); shell.position.set(0, 3.7, .1); n.add(shell);
      box(n, 1.2, 1.5, .9, 0, 0, -.1, R2); const bust = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 10), M(0x6a6a5a, { metalness: .5 })); bust.position.set(0, 1.9, -.1); n.add(bust); box(n, .8, .35, .5, 0, 1.5, -.1, M(0x6a6a5a, { metalness: .5 }));
      cyl(n, 2.4, 2.4, .25, 0, 0, -.6, M(0xc0442a), 20); n.position.set(0, 0, -24); g.add(n); }
    place(g, x, z); col.addCircle(x, z, 3.2, y - 1, y + 2.6, 'fountain');
  }
  /* ---- storefronts for the shops: sign, awning, door ---- */
  const shopFront = (id, sign, color, kind) => {
    const pl = P(id), f = city.storefront(pl.x, pl.z), y = H(f.sx, f.sz), g = new THREE.Group();
    const aw = new THREE.Mesh(new THREE.BoxGeometry(5, .06, 1.6), M(color)); aw.position.set(0, 2.7, -.75); aw.rotation.x = .28; g.add(aw);
    plaque(g, [sign], 5.4, .7, 0, 3.4, -.08, Math.PI, { bg: '#f2efe8', fg: '#' + color.toString(16).padStart(6, '0'), border: false, weight: 800, font: 'Inter, Arial, sans-serif', w: 1400, h: 180, size: 110 });
    const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.4), M(0x2a2018)); d.position.set(0, 1.2, -.06); d.rotation.y = Math.PI; g.add(d);
    if (kind === 'hats') for (let k = 0; k < 3; k++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .03, 16), M([0xd8c8a0, 0x1e1c1a, 0x8a6a3a][k])); h.position.set(1.6, .9 + k * .5, -.3); g.add(h); cyl(g, .13, .15, .16, 1.6, .92 + k * .5, -.3, M([0xd8c8a0, 0x1e1c1a, 0x8a6a3a][k]), 10); }
    if (kind === 'flowers') for (let k = 0; k < 8; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.22, 0), M([0xd02040, 0xf0c030, 0x8a74c8, 0xf4f4f0][k % 4])); b.position.set(-1.8 + (k % 4) * .35, .7 + Math.floor(k / 4) * .3, -.45); g.add(b); }
    if (kind === 'clothes') for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.5, .7, .05), M([0xc02870, 0xbfd6e8, 0xf2ecdc][k])); m.position.set(1.4 + k * .1, 1.4, -.12 - k * .04); g.add(m); }
    if (kind === 'hardware') { for (let k = 0; k < 3; k++) cyl(g, .16, .14, .34, -1.9 + k * .4, .17, -.5, M([0xd8a020, 0xc02820, 0x2a5a8a][k]), 12); const hose = new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 8, 24), M(0x2e7a3a)); hose.position.set(1.7, 1.5, -.12); g.add(hose); box(g, .9, .06, .3, 1.6, 1.05, -.2, M(0x8a6a4a)); }
    if (kind === 'cheese') for (let k = 0; k < 4; k++) cyl(g, .28, .28, .22, -1.6 + k * .3, .9, -.35, M(0xf0e6c0), 12);
    g.position.set(f.x, y, f.z); g.rotation.y = f.ang; root.add(g);
    spots['shop_' + id] = [f.sx, H(f.sx, f.sz), f.sz];
  };
  shopFront('boutique', 'BOUTIQUE ROSA MEXICANO', 0xc02870, 'clothes'); shopFront('sombreros', 'SOMBRERERÍA LA TEXANA', 0x6a4a2a, 'hats');
  shopFront('peluqueria', 'PELUQUERÍA DON BETO', 0x2850a0); shopFront('mercado', 'MERCADO DE ARTESANÍAS', 0xb8801a, 'clothes');
  shopFront('floreria', 'FLORERÍA LAS JACARANDAS', 0x7a5ab8, 'flowers'); shopFront('cremeria', 'CREMERÍA · QUESOS Y CREMA', 0x2a6a3a, 'cheese');
  shopFront('notaria', 'BIENES RAÍCES · TERRENOS', 0x2d4a3a); shopFront('ferreteria', 'MATERIALES EL ALBAÑIL', 0xd86a1a);
  shopFront('ferreLuis', 'FERRETERÍA LA ESPERANZA', 0x2a5a8a, 'hardware');
  /* ---- the taxi stands: a sign, a bench, white taxis waiting at the curb ---- */
  const taxiKit = root.userData.taxiKit;
  for (const id of ['sitioAbasolo', 'sitioFajardo']) {
    const pl = P(id), f = city.storefront(pl.x, pl.z), st = f.street, y = H(f.sx, f.sz), g = new THREE.Group();
    cyl(g, .06, .06, 2.6, 0, 0, 0, M(0x2a2a2a), 6); plaque(g, ['SITIO DE TAXIS', { text: id === 'sitioAbasolo' ? 'ABASOLO' : 'FAJARDO', small: true }], 1.6, .8, 0, 2.4, -.05, Math.PI, { bg: '#f2c500', fg: '#1a1a1a', border: false, weight: 800, font: 'Inter, Arial, sans-serif' });
    bench(g, 1.6, .3, Math.PI, 0); g.position.set(f.sx, y, f.sz); g.rotation.y = f.ang; root.add(g);
    if (st && taxiKit) for (let k = 0; k < 3; k++) { const o = st.half - 1.6 - 1.05, cx = st.x + st.nx * o + st.tx * (k * 5.4 - 5.4), cz = st.z + st.nz * o + st.tz * (k * 5.4 - 5.4); taxiKit.push([cx, H(cx, cz) + .12, cz, Math.atan2(st.tz, st.tx)]); }
    spots[id] = [f.sx, y, f.sz];
  }
  /* ---- the bache of Calle Morelos ---- */
  {
    const pl = P('bache'), s = city.nearestStreet(pl.x, pl.z, 60), bx = s ? s.x : pl.x, bz = s ? s.z : pl.z, y = H(bx, bz);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.4, 18), M(0x1e1a16, { roughness: .95 })); hole.rotation.x = -Math.PI / 2; hole.scale.set(1.3, 1, 1); hole.position.set(bx, y + .1, bz);
    const water = new THREE.Mesh(new THREE.CircleGeometry(.9, 16), M(0x4a5a5a, { roughness: .05, metalness: .3 })); water.rotation.x = -Math.PI / 2; water.position.set(bx + .2, y + .11, bz);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(1.5, 18), M(0x8a8a86)); patch.rotation.x = -Math.PI / 2; patch.scale.set(1.3, 1, 1); patch.position.set(bx, y + .1, bz); patch.visible = false;
    root.add(hole, water, patch); root.userData.setBache = fixed => { hole.visible = water.visible = !fixed; patch.visible = !!fixed; };
    spots.bache = [bx + (s ? s.nx * (s.half - .8) : 2), y, bz + (s ? s.nz * (s.half - .8) : 0)];
  }
  /* ---- the Franciscan friar in the Parroquia's atrio, among pines ---- */
  {
    const pp = P('parroquia'), fx = pp.x - 26, y = H(fx - 15, pp.z + 7), g = new THREE.Group();
    box(g, 1.6, 2.2, 1.6, 0, 0, 0, M(CANTERA)); box(g, 1.9, .25, 1.9, 0, 2.2, 0, M(CANTERA_D));
    const fr = makePerson({ height: 1.15, build: 1.15, dress: true, hat: 'veil', top: 0, bottom: 0 }); fr.traverse(o => { if (o.isMesh) o.material = M(0x6a6658, { roughness: .8 }); }); fr.position.y = 2.45; fr.rotation.y = -Math.PI / 2; g.add(fr);
    box(g, 6, .3, 4, 0, 0, 0, M(0x4a7a2e));
    g.position.set(fx - 15, y, pp.z + 8); root.add(g); col.addBox(fx - 15, pp.z + 8, 1.7, 1.7, 0, y - 1, y + 4.5, 'landmark');
    for (const [px, pz] of [[fx - 18, pp.z - 8], [fx - 7, pp.z + 10], [fx - 19, pp.z + 10]]) { const t = new THREE.Group(); cyl(t, .25, .35, 3, 0, 0, 0, M(0x5b4331), 6); for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(2.6 - k * .5, 2.6, 9), M(0x2a4a2a)); c.position.y = 3 + k * 1.6; t.add(c); } t.position.set(px, H(px, pz), pz); root.add(t); col.addCircle(px, pz, .4, H(px, pz) - 1, H(px, pz) + 6, 'tree'); }
  }
  /* ---- the Panteón Municipal: white walls, an arched gate, rows of tombs, crosses and cypresses ---- */
  {
    const { x, z } = P('panteon'), y = H(x, z), g = new THREE.Group(), W2 = 92, D2 = 80;
    for (const [w, d, px, pz] of [[W2, .5, 0, D2 / 2], [.5, D2, -W2 / 2, 0], [.5, D2, W2 / 2, 0], [W2 / 2 - 3, .5, -W2 / 4 - 1.5, -D2 / 2], [W2 / 2 - 3, .5, W2 / 4 + 1.5, -D2 / 2]]) {
      box(g, w, 2.6, d, px, 0, pz, M(0xf2efe8)); box(g, w + .02, .7, d + .02, px, 0, pz, M(0x8a2a1e)); col.addBox(x + px, z + pz, w, d, 0, y - 2, y + 2.6, 'wall'); }
    for (const sx of [-1, 1]) box(g, 1.2, 5, 1.2, sx * 3.2, 0, -D2 / 2, M(0xf2efe8));
    const ga = new THREE.Mesh(new THREE.TorusGeometry(3.2, .5, 6, 16, Math.PI), M(0xf2efe8)); ga.position.set(0, 4.8, -D2 / 2); g.add(ga);
    plaque(g, ['PANTEÓN MUNICIPAL'], 5, .8, 0, 6.4, -D2 / 2 - .62, Math.PI, { bg: '#f2efe8', fg: '#3a2a22', border: false });
    const slab = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .5, 2.1), M(0xd8d2c8), 400), head = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1.1, .2), M(0xe8e4dc), 400), cross = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, 1.3, .12), M(0xf4f4f0), 400), arm = new THREE.InstancedMesh(new THREE.BoxGeometry(.7, .12, .12), M(0xf4f4f0), 400);
    const m4 = new THREE.Matrix4(), cc = new THREE.Color(); let n = 0;
    const tint = [0xd8d2c8, 0xe8c0c8, 0xb8cde0, 0xf0e0b0, 0xd0e0c8, 0xe8e4dc];
    for (let r = 0; r < 12; r++) for (let c = 0; c < 26; c++) {
      if (Math.abs(c - 12.5) < 1.5) continue; const tx = -W2 / 2 + 4 + c * 3.25, tz = -D2 / 2 + 7 + r * 5.6; if (n >= 400) break;
      const jit = Math.sin(r * 31 + c * 17) * .3;
      m4.makeTranslation(tx + jit, .25, tz); slab.setMatrixAt(n, m4); slab.setColorAt(n, cc.setHex(tint[(r * 7 + c * 3) % tint.length]));
      m4.makeTranslation(tx + jit, .9, tz + 1.0); head.setMatrixAt(n, m4);
      m4.makeTranslation(tx + jit, 2.0, tz + 1.0); cross.setMatrixAt(n, m4); m4.makeTranslation(tx + jit, 2.3, tz + 1.0); arm.setMatrixAt(n, m4); n++;
    }
    for (const im of [slab, head, cross, arm]) { im.count = n; g.add(im); }
    for (let k = 0; k < 5; k++) { const mx = -30 + k * 15, mz = 30; box(g, 3.4, 3.4, 3.4, mx, 0, mz, M(0xe8e4dc)); const dm = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M([0x8aa8c8, 0xd8b04a, 0xe8e4dc][k % 3])); dm.position.set(mx, 3.4, mz); g.add(dm); cyl(g, .05, .05, 1.2, mx, 4.8, mz, M(IRON)); col.addBox(x + mx, z + mz, 3.4, 3.4, 0, y - 1, y + 4, 'landmark'); }
    for (let k = 0; k < 14; k++) { const cx = -W2 / 2 + 3 + (k % 7) * 14.5, cz = k < 7 ? -D2 / 2 + 3 : D2 / 2 - 3; const t = new THREE.Mesh(new THREE.ConeGeometry(.9, 7, 8), M(0x22402a)); t.position.set(cx, 3.6, cz); g.add(t); }
    place(g, x, z); spots.panteon = [x, y, z - D2 / 2 - 3];
    root.userData.panteonY = y;
  }
  /* ---- the Casita de Piedra: a house of volcanic stone under a tile roof, a porch on wooden posts, stone steps ---- */
  {
    const pl = P('casita'), f = city.storefront(pl.x, pl.z), g = new THREE.Group(), ST = landmarkMaterial({ map: stoneTex(), roughness: .95 });
    const hx = f.x + Math.sin(f.ang) * 7, hz = f.z + Math.cos(f.ang) * 7, y = H(hx, hz);
    box(g, 11, 3.4, 8, 0, 0, 0, ST);
    const roof = prism(11, 2.6, 12, M(0x7a3a26)); roof.rotation.y = Math.PI / 2; roof.position.set(0, 3.4, -1.2); g.add(roof);
    for (let k = 0; k < 4; k++) cyl(g, .14, .16, 3, -4.5 + k * 3, 0, -5.4, M(0x5a3a22), 8);
    box(g, 11.4, .25, 2.6, 0, 0, -5.2, M(0x6a625a)); for (let k = 0; k < 3; k++) box(g, 3, .22, .7, 0, -.2 - k * .2, -6.8 - k * .7, M(0x5a524a));
    const d = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.3), M(0x3a2414)); d.position.set(0, 1.15, -4.02); d.rotation.y = Math.PI; g.add(d);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), M(0x2a2018)); w.position.set(sx * 3, 1.7, -4.02); w.rotation.y = Math.PI; g.add(w); }
    plaque(g, ['LA CASITA DE PIEDRA', { text: 'Artesanías · Rebozos · Añil', small: true }], 4, 1, 0, 3.05, -4.05, Math.PI, { bg: '#d8c8a8', fg: '#3a2a1a' });
    for (let k = 0; k < 8; k++) { const a = new THREE.Group(); for (let l = 0; l < 7; l++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(.12, 1.2, 4), M(0x5a7a4a)); lf.position.y = .5; lf.rotation.set(Math.cos(l) * .7, 0, Math.sin(l) * .7); a.add(lf); } a.position.set(-6 + (k % 4) * 4, 0, -8.6 - Math.floor(k / 4) * 1.6); g.add(a); }
    g.position.set(hx, y, hz); g.rotation.y = f.ang; root.add(g); col.addBox(hx, hz, 11, 8, -f.ang, y - 2, y + 4.4, 'roof');
    spots.casita = [hx - Math.sin(f.ang) * 7.5, y, hz - Math.cos(f.ang) * 7.5]; spots.shop_casita = spots.casita;
  }
  /* ---- San Francisco del Cerro: the chapel, the red-and-white antenna, two little stores, a few adobe houses ---- */
  {
    const road = CERRO_ROAD, N = road.length, at = (k, off) => { const a = road[Math.max(0, k - 1)], b = road[Math.min(N - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; return [road[k][0] + dz / L * off, road[k][1] - dx / L * off, Math.atan2(dz / L * -Math.sign(off), -dx / L * -Math.sign(off))]; };
    const face = (k, off) => { const [px, pz] = at(k, off), [rx, rz] = road[k]; return [px, pz, Math.atan2(rx - px, rz - pz) + Math.PI]; };
    // the chapel at the end of the road
    { const [cx, cz, ry] = face(N - 3, 14), y = H(cx, cz), g = new THREE.Group();
      box(g, 6.5, 5, 11, 0, 0, 0, M(0xf2efe8)); box(g, 6.8, .9, 11.3, 0, 0, 0, M(0x2a5aa8));
      const roof = prism(7.4, 2.4, 11.8, M(TILE)); roof.position.set(0, 5, 0); g.add(roof);
      box(g, 7, 7.8, .6, 0, 0, -5.6, M(0xf2efe8)); const esp = gable(5, 3, .6, M(0xf2efe8)); esp.rotation.y = -Math.PI / 2; esp.position.set(0, 7.8, -5.6); g.add(esp);
      for (const sx of [-1, 1]) { const op = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.4), M(0x1a1612)); op.position.set(sx * 1.1, 8.9, -5.92); op.rotation.y = Math.PI; g.add(op); const bell = new THREE.Mesh(new THREE.CylinderGeometry(.2, .35, .55, 10, 1, true), M(BRONZE, { metalness: .6, side: THREE.DoubleSide })); bell.position.set(sx * 1.1, 8.9, -5.6); g.add(bell); }
      cyl(g, .05, .05, 1.4, 0, 10.7, -5.6, M(IRON)); box(g, .7, .07, .07, 0, 11.6, -5.6, M(IRON));
      const d = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.8), M(0x5a3a22)); d.position.set(0, 1.4, -5.92); d.rotation.y = Math.PI; g.add(d);
      plaque(g, ['CAPILLA DE SAN FRANCISCO'], 4, .55, 0, 3.4, -5.93, Math.PI, { bg: '#f2efe8', border: false });
      g.position.set(cx, y, cz); g.rotation.y = ry; root.add(g); col.addBox(cx, cz, 7, 12, -ry, y - 2, y + 6, 'roof'); spots.capilla = [cx, y, cz]; }
    // the antenna on the summit: a red-and-white lattice tower with a blinking light
    { const [ax, az] = [P('cumbre').x + 22, P('cumbre').z + 14], y = H(ax, az), g = new THREE.Group();
      for (let seg = 0; seg < 8; seg++) { const c = seg % 2 ? 0xf2f2f0 : 0xc8301e; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, r = 1.6 - seg * .16; cyl(g, .07, .07, 5, Math.cos(a) * r, seg * 5, Math.sin(a) * r, M(c), 4); }
        for (let k = 0; k < 4; k++) { const br = new THREE.Mesh(new THREE.BoxGeometry(.05, 5.4, .05), M(c)); const a = k * Math.PI / 2, r = 1.6 - seg * .16; br.position.set(Math.cos(a) * r * .7, seg * 5 + 2.5, Math.sin(a) * r * .7); br.rotation.set(Math.sin(a) * .5, 0, Math.cos(a) * .5); g.add(br); } }
      for (let k = 0; k < 3; k++) { const dish = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .15, 14), M(0xe8e8e8)); dish.rotation.z = Math.PI / 2; dish.position.set(.9, 26 + k * 4, 0); dish.rotation.y = k * 2; g.add(dish); }
      const bl = new THREE.Mesh(new THREE.SphereGeometry(.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3020 })); bl.position.y = 40.5; g.add(bl); root.userData.blink2 = bl;
      box(g, 4, 2.6, 3, 5, 0, 0, M(0xd8d4cc));
      g.position.set(ax, y, az); root.add(g); col.addBox(ax, az, 3.4, 3.4, 0, y - 1, y + 40, 'landmark'); }
    // two little stores and the houses
    const stores = [['TIENDITA DOÑA TOÑA', 0x2e7a3a, 0xe8e4d4], ['ABARROTES EL MIRADOR', 0x2a5aa8, 0xf0d070]];
    stores.forEach(([name, c1, c2], i) => { const [hx, hz, ry] = face(N - 8 - i * 6, -12), y = H(hx, hz), g = new THREE.Group();
      box(g, 7, 3.2, 6, 0, 0, 0, M(c2)); box(g, 7.1, 1, 6.1, 0, 0, 0, M(c1)); box(g, 7.4, .2, 6.4, 0, 3.2, 0, M(0x8a8a86));
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), M(0x1a1612)); d.position.set(0, 1.1, -3.02); d.rotation.y = Math.PI; g.add(d);
      plaque(g, [name], 6, .7, 0, 2.7, -3.04, Math.PI, { bg: '#f2efe8', fg: '#' + c1.toString(16).padStart(6, '0'), border: false, weight: 800, font: 'Inter, Arial, sans-serif', w: 1400, h: 180, size: 100 });
      for (let k = 0; k < 4; k++) cyl(g, .25, .25, .5, -2.6 + k * .55, 0, -3.6, M(0x1a3a8a), 10);
      g.position.set(hx, y, hz); g.rotation.y = ry; root.add(g); col.addBox(hx, hz, 7, 6, -ry, y - 2, y + 3.4, 'roof');
      if (i === 0) spots.tiendita = [hx - Math.sin(ry) * 5, y, hz - Math.cos(ry) * 5];
      const px = hx - Math.sin(ry) * 6 + Math.cos(ry) * 5, pz = hz - Math.cos(ry) * 6 - Math.sin(ry) * 5; root.userData.taxiKit.push([px, H(px, pz) + .12, pz, ry, 5, [0x9a3020, 0xd8d0c0][i]]); });
    for (let k = 0; k < 6; k++) { const [hx, hz, ry] = face(N - 30 - k * 9, k % 2 ? 13 : -13), y = H(hx, hz), g = new THREE.Group();
      box(g, 7, 3, 5.5, 0, 0, 0, M([0xa8805c, 0xb8906a, 0xd8c8a8, 0x9a7050][k % 4])); const rf = prism(6.3, 1.8, 7.8, M(TILE)); rf.rotation.y = Math.PI / 2; rf.position.y = 3; g.add(rf);
      const d = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), M(0x3a2414)); d.position.set(0, 1, -2.77); d.rotation.y = Math.PI; g.add(d);
      g.position.set(hx, y, hz); g.rotation.y = ry; root.add(g); col.addBox(hx, hz, 7, 5.5, -ry, y - 2, y + 4, 'roof'); }
  }
  /* ---- the ranchos on the stone road: adobe house, corral, trough, cows, a sign over the gate ---- */
  for (const [id, sign] of [['ranchoNovoa', 'RANCHO DE NOVOA'], ['ranchoSalazar', 'RANCHO DE LOS SALAZAR']]) {
    const pl = P(id), s = city.nearestStreet(pl.x, pl.z, 200, [1]), ry = s ? Math.atan2(s.nx, s.nz) : 0, y = H(pl.x, pl.z), g = new THREE.Group();
    box(g, 13, 3.2, 7, 0, 0, 4, M(0xa8805c)); const rf = prism(8, 2.2, 13.8, M(TILE)); rf.rotation.y = Math.PI / 2; rf.position.set(0, 3.2, 4); g.add(rf);
    for (let k = 0; k < 5; k++) cyl(g, .12, .14, 2.9, -5.6 + k * 2.8, 0, .1, M(0x5a3a22), 6); box(g, 13.4, .14, 3.2, 0, 2.9, 1.6, M(0x7a4a2a));
    const d = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), M(0x3a2414)); d.position.set(0, 1.1, .48); d.rotation.y = Math.PI; g.add(d);
    // corral
    for (let k = 0; k <= 8; k++) for (const [cx, cz] of [[-16 + k * 2.5, -8], [-16 + k * 2.5, 8]]) cyl(g, .08, .1, 1.5, cx - 4, 0, cz - 6, M(0x6a4a2a), 5);
    for (const zz of [-14, 2]) for (const h of [.6, 1.2]) box(g, 20, .08, .06, -10, h, zz, M(0x7a5a3a));
    box(g, 2.4, .5, .7, -10, 0, -6, M(0x8a8a86));
    for (let k = 0; k < 3; k++) { const c = makeCow([0xe8dcc0, 0x5a3a24, 0x2a2420][k], [0x3a2a1a, 0xe8e0d0, 0xe8e0d0][k]); c.position.set(-16 + k * 4.5, 0, -9 + k * 2.5); c.rotation.y = k * 1.3; g.add(c); }
    for (let k = 0; k < 3; k++) cyl(g, .6, .6, 1, 7 + k * 1.3, 0, -4, M(0xd8b860), 10);
    // the gate with the rancho's name, on the road side
    for (const sx of [-1, 1]) cyl(g, .15, .15, 4, sx * 3, 0, -13, M(0x5a3a22), 6); box(g, 7, .3, .3, 0, 4, -13, M(0x5a3a22));
    plaque(g, [sign], 5.6, .7, 0, 3.4, -13.16, Math.PI, { bg: '#d8c8a0', fg: '#3a2414', border: false, weight: 700 });
    g.position.set(pl.x, y, pl.z); g.rotation.y = ry; root.add(g);
    const cs = Math.cos(ry), sn = Math.sin(ry), W = (lx, lz) => [pl.x + lx * cs + lz * sn, pl.z - lx * sn + lz * cs];
    { const [hx, hz] = W(0, 4); col.addBox(hx, hz, 13, 7, -ry, y - 2, y + 4, 'roof'); }
    spots[id] = [pl.x, y, pl.z];
    // a milpa beside the house: rows of corn, tasselled, with calabazas between
    { const n = 22 * 14, stalk = new THREE.InstancedMesh(cornGeo(), M(0x6a8a34, { roughness: .95 }), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(); let i = 0;
      const r = rng(id.length * 977);
      for (let a = 0; a < 22; a++) for (let b = 0; b < 14; b++) { const [wx, wz] = W(12 + a * 1.1 + r() * .3, -10 + b * 1.4 + r() * .3); const h = .8 + r() * .35;
        m4.compose(v.set(wx, H(wx, wz) - .05, wz), q.setFromEuler(e.set((r() - .5) * .12, r() * 6.28, (r() - .5) * .12)), sc.set(h, h, h)); stalk.setMatrixAt(i, m4); stalk.setColorAt(i, new THREE.Color().setHSL(.2 + r() * .05, .45, .32 + r() * .1)); i++; }
      stalk.castShadow = true; root.add(stalk); }
    // horses in the corral
    for (let k = 0; k < 2; k++) { const h = makeHorse([0x5a3a22, 0x2a1e18, 0xc8b8a0][(k + id.length) % 3]); h.position.set(-8 - k * 4, 0, -2 - k * 2); h.rotation.y = 2 + k; g.add(h); }
  }
  cerroLife(city, root, H);
}
/* the cerro: nopaleras, magueys and órganos among the rocks, wild cattle and horses grazing, and by the antenna a little CFE substation */
function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function cornGeo() {
  const parts = [new THREE.CylinderGeometry(.018, .028, 2.1, 5).translate(0, 1.05, 0)];
  for (let k = 0; k < 5; k++) { const l = new THREE.PlaneGeometry(.09, .75); l.translate(0, .37, 0); l.rotateZ(.9); l.rotateY(k * 2.4); l.translate(0, .45 + k * .3, 0); parts.push(l); }
  parts.push(new THREE.ConeGeometry(.05, .3, 4).translate(0, 2.2, 0));
  return mergeGeo(parts);
}
function mergeGeo(list) {
  const geos = list.map(g => (g.index ? g.toNonIndexed() : g)); let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { if (!g.attributes.normal) g.computeVertexNormals(); pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return out;
}
function nopalGeo() {
  const parts = [], r = rng(7);
  const pad = (x, y, z, s, ry, rz) => { const g = new THREE.SphereGeometry(.22, 10, 7); g.scale(s, s * 1.35, s * .22); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); parts.push(g); };
  pad(0, .3, 0, 1.1, 0, 0); pad(.18, .7, 0, .9, .3, -.5); pad(-.2, .68, .05, .85, -.4, .6); pad(.05, 1.05, .02, .8, 1.2, .1); pad(.38, 1.0, .05, .7, .2, -.9); pad(-.35, 1.0, -.05, .65, -.9, .8);
  for (let k = 0; k < 5; k++) parts.push(new THREE.SphereGeometry(.035, 6, 4).translate((r() - .5) * .7, 1.2 + r() * .2, (r() - .5) * .1));   // tunas
  return mergeGeo(parts);
}
function magueyGeo() {
  const parts = [];
  for (let k = 0; k < 16; k++) { const l = new THREE.ConeGeometry(.09, 1.3, 4); l.scale(1, 1, .35); l.translate(0, .65, 0); l.rotateZ(.45 + (k % 3) * .22); l.rotateY(k * 2.4); parts.push(l); }
  return mergeGeo(parts);
}
function organoGeo() {
  const parts = [], r = rng(11);
  for (let k = 0; k < 5; k++) { const h = 1.8 + r() * 1.6; parts.push(new THREE.CylinderGeometry(.11, .13, h, 8).translate((k - 2) * .24, h / 2, (r() - .5) * .2)); parts.push(new THREE.SphereGeometry(.11, 8, 5).translate((k - 2) * .24, h, 0)); }
  return mergeGeo(parts);
}
export function makeHorse(color = 0x5a3a22) {
  const g = new THREE.Group(), body = M(color), dark = M(0x1a1410);
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.36, 1.2, 6, 12), body); b.rotation.z = Math.PI / 2; b.position.y = 1.35; g.add(b);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .6, 4, 8), body); neck.position.set(.85, 1.8, 0); neck.rotation.z = -.7; g.add(neck);
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .42, 4, 8), body); head.position.set(1.18, 2.02, 0); head.rotation.z = -1.9; g.add(head);
  const mane = new THREE.Mesh(new THREE.BoxGeometry(.6, .12, .06), dark); mane.position.set(.78, 2.0, 0); mane.rotation.z = -.7; g.add(mane);
  for (const sz of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.04, .14, 4), body); e.position.set(1.06, 2.28, sz * .07); g.add(e); }
  for (const [x, z] of [[.55, .17], [.55, -.17], [-.55, .17], [-.55, -.17]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.055, .045, 1.15, 6), body); l.position.set(x, .58, z); g.add(l); const hf = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .1, 6), dark); hf.position.set(x, .05, z); g.add(hf); }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.09, .8, 6), dark); tail.position.set(-.95, 1.1, 0); tail.rotation.z = -.35; g.add(tail);
  return g;
}
function cerroLife(city, root, H) {
  const r = rng(2024), paths = [CERRO_ROAD, BACK_ROAD].filter(Boolean);
  const kinds = [[nopalGeo(), 0x5a7a3a, 700, 1.1], [magueyGeo(), 0x6a8a7a, 500, 1], [organoGeo(), 0x4e6a3a, 160, 1]];
  const pts = []; for (const p of paths) for (let k = 0; k < p.length; k += 1) pts.push(p[k]);
  const near = (x, z) => { for (let k = 0; k < pts.length; k += 2) { const dx = pts[k][0] - x, dz = pts[k][1] - z; if (dx * dx + dz * dz < 25) return true; } return false; };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  for (const [geo, color, n, s0] of kinds) {
    const im = new THREE.InstancedMesh(geo, M(0xffffff, { roughness: .9 }), n); let i = 0;
    for (let t = 0; t < n * 4 && i < n; t++) {
      const p = pts[Math.floor(r() * pts.length)], a = r() * 6.28, d = 6 + Math.pow(r(), 1.6) * 140, x = p[0] + Math.cos(a) * d, z = p[1] + Math.sin(a) * d;
      if (Math.hypot(x, z) < 1250 || near(x, z) || city.streetsAt(x, z, []).length) continue;   // the cerro, not the town
      const s = s0 * (.6 + r() * .8); m4.compose(v.set(x, H(x, z) - .05, z), q.setFromEuler(e.set(0, r() * 6.28, 0)), sc.set(s, s, s)); im.setMatrixAt(i, m4);
      im.setColorAt(i, c.set(color).offsetHSL((r() - .5) * .04, 0, (r() - .5) * .08)); i++;
    }
    im.count = i; im.castShadow = true; root.add(im);
  }
  // wild cattle and horses, grazing in little herds on the open slopes
  const herds = 9;
  for (let h = 0; h < herds; h++) {
    const p = pts[Math.floor(r() * pts.length)], a = r() * 6.28, d = 40 + r() * 120, hx = p[0] + Math.cos(a) * d, hz = p[1] + Math.sin(a) * d;
    if (Math.hypot(hx, hz) < 1250) continue;
    const horses = h % 3 === 0;
    for (let k = 0; k < 3 + Math.floor(r() * 4); k++) {
      const x = hx + (r() - .5) * 18, z = hz + (r() - .5) * 18;
      const an = horses ? makeHorse([0x5a3a22, 0x2a1e18, 0x8a5a3a, 0xc8b8a0][Math.floor(r() * 4)]) : makeCow([0x5a3a24, 0x2a2420, 0xb8743a, 0xe8dcc0][Math.floor(r() * 4)], [0xe8e0d0, 0x3a2a1a][Math.floor(r() * 2)]);
      an.position.set(x, H(x, z), z); an.rotation.y = r() * 6.28; an.traverse(o => { if (o.isMesh) o.castShadow = true; }); root.add(an);
    }
  }
  // the CFE substation beside the antenna: a fenced yard, transformers with their fins, insulator poles, a block house
  { const P0 = PLACES.cumbre, x0 = P0.x + 34, z0 = P0.z + 2, y = H(x0, z0), g = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 12), M(0x9a968e)); pad.position.y = .05; g.add(pad);
    for (let k = 0; k < 2; k++) { box(g, 2.2, 2.4, 1.6, -3 + k * 5, .2, -1, M(0x8a948a, { metalness: .4 })); for (let f = 0; f < 6; f++) box(g, .06, 1.8, 2, -4.2 + k * 5 + f * .45, .5, -1, M(0x7a847a, { metalness: .4 }));
      for (let b = 0; b < 3; b++) { cyl(g, .09, .12, .9, -3.6 + k * 5 + b * .6, 2.6, -1, M(0x6a3a2a), 8); } }
    for (const xx of [-6, 6]) { cyl(g, .18, .22, 9, xx, 0, 3, M(0xb8b4aa), 8); box(g, 3.2, .2, .2, xx, 8, 3, M(0x6a6a66)); for (const o of [-1.3, 0, 1.3]) cyl(g, .07, .1, .5, xx + o, 8.2, 3, M(0x6a3a2a), 6); }
    box(g, 4, 3, 3.4, 4.5, .2, 3.5, M(0xe8e2d4)); box(g, 4.2, .4, 3.6, 4.5, .2, 3.5, M(0x2e7a3a));
    plaque(g, ['CFE · SUBESTACIÓN SAN FRANCISCO', { text: 'PELIGRO · ALTA TENSIÓN', small: true }], 3.6, .8, 4.5, 2.2, 1.78, Math.PI, { bg: '#f2efe8', fg: '#2e7a3a', border: false, weight: 800, font: 'Inter, Arial, sans-serif' });
    // chain-link fence
    const fm = new THREE.MeshBasicMaterial({ color: 0x8a8a86, transparent: true, opacity: .35, side: THREE.DoubleSide });
    for (const [w, x, z, ry] of [[17, 0, -6.5, 0], [17, 0, 6.5, 0], [13, -8.5, 0, Math.PI / 2], [13, 8.5, 0, Math.PI / 2]]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.4), fm); f.position.set(x, 1.4, z); f.rotation.y = ry; g.add(f); }
    g.position.set(x0, y, z0); root.add(g); city.colliders.addBox(x0, z0, 17, 13, 0, y - 1, y + 3, 'landmark');
  }
}
/* a jacaranda in bloom */
function jacarandaT(g, x, z, y) {
  const t = new THREE.Group(); t.position.set(x, y, z);
  cyl(t, .16, .24, 3.4, 0, 0, 0, M(0x5b4331), 7);
  for (const [cx, cy, cz, r] of [[0, 4.6, 0, 2.0], [1.3, 4.2, .5, 1.5], [-1.2, 4.3, -.6, 1.6], [.3, 5.6, -.2, 1.2]]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(0x8a6ad0, { roughness: .9 })); c.position.set(cx, cy, cz); c.scale.y = .75; t.add(c); }
  g.add(t);
}
