// People of Jiquilpan: proportioned bodies (hips, knees, elbows, shoulders), hands with four fingers and a thumb,
// real shoes with soles, and faces: eyes with irises and lids, brows, a nose, lips, ears, mustaches and beards,
// cheekbones and jaws that differ from person to person. While someone talks, their face moves: brows lift and
// knit, the mouth opens and closes, eyes blink. Each moving part is one merged mesh with vertex colours, so a
// person costs about a dozen draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { landmarkMaterial } from './shaders.js';

const MAT = landmarkMaterial({ vertexColors: true, roughness: 0.78 });
const GHOST = landmarkMaterial({ vertexColors: true, roughness: 0.6, transparent: true, opacity: 0.82, emissive: 0x3a5a66, emissiveIntensity: 0.35 });
const tmpC = new THREE.Color();
function paint(g, color) { const n = g.attributes.position.count, a = new Float32Array(n * 3); tmpC.set(color); for (let i = 0; i < n; i++) a.set([tmpC.r, tmpC.g, tmpC.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
function clean(g) { if (g.index) g = g.toNonIndexed(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g; }
const parts = list => mergeGeometries(list.filter(Boolean).map(([g, c]) => clean(paint(g, c))));
const cap = (r, len, x = 0, y = 0, z = 0, seg = 12) => new THREE.CapsuleGeometry(r, len, 5, seg).translate(x, y, z);
const sph = (r, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h).scale(sx, sy, sz).translate(x, y, z);
const cyl = (a, b, h, x = 0, y = 0, z = 0, s = 14) => new THREE.CylinderGeometry(a, b, h, s).translate(x, y, z);
const bx = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function rng(seed) { let a = (seed | 0) ^ 0x5bd1e995; return () => { a = Math.imul(a ^ (a >>> 15), 2246822507); a = Math.imul(a ^ (a >>> 13), 3266489909); a ^= a >>> 16; return (a >>> 0) / 4294967296; }; }
const shade = (c, k) => { tmpC.set(c); tmpC.multiplyScalar(k); return tmpC.getHex(); };
const mixc = (a, b, t) => { const A = new THREE.Color(a), B = new THREE.Color(b); return A.lerp(B, t).getHex(); };

/* a hand: palm, four fingers in a soft curl, a thumb; along -y from the wrist */
function hand(skin, side) {
  const g = [[sph(0.045, 0, -0.05, 0, 1.1, 1.25, 0.55), skin]];
  for (let f = 0; f < 4; f++) { const x = (f - 1.5) * 0.019, len = [0.05, 0.058, 0.055, 0.044][f]; const fg = cap(0.0095, len, x, -0.115 - len / 2, 0.006, 6); fg.rotateX(0.25); g.push([fg, skin]); }
  const th = cap(0.012, 0.04, 0, 0, 0, 6); th.rotateZ(side * 0.7); th.translate(side * 0.043, -0.06, 0.012); g.push([th, skin]);
  return g;
}
/* a shoe: rounded toe, a darker sole, along +z */
function shoe(color, kind) {
  const g = [[cap(0.052, 0.13, 0, 0, 0, 10).rotateX(Math.PI / 2).scale(1, 0.72, 1).translate(0, 0.045, 0.045), color], [bx(0.11, 0.025, 0.25, 0, 0.012, 0.045), kind === 'sneaker' ? 0xf2f2ee : 0x2a2018]];
  if (kind === 'boot') g.push([cyl(0.06, 0.055, 0.16, 0, 0.13, -0.02, 10), color]);
  if (kind === 'huarache') { g[0][1] = 0x8a5a30; g.push([bx(0.115, 0.012, 0.24, 0, 0.03, 0.045), 0x6a4020]); }
  return g;
}

/* spec: { skin, hair, hairStyle, top, bottom, shoes, hat, hatColor, coat, height, build, beard, mustache, glasses, accessory, accColor,
   dress, belly, sash, sleeves, seed, age, fem, kit, mask, ghost, face, beardColor } */
/** the Rinos de Jiquilpan badge: a charging rhino in white, for the purple jersey */
let _rhino = null;
function rhinoTex() {
  if (_rhino) return _rhino;
  const cv = document.createElement('canvas'); cv.width = 160; cv.height = 104; const c = cv.getContext('2d');
  c.fillStyle = '#f4f0ff'; c.beginPath(); c.ellipse(78, 56, 44, 26, 0, 0, Math.PI * 2); c.fill();           // body
  c.beginPath(); c.moveTo(112, 44); c.quadraticCurveTo(150, 46, 152, 66); c.lineTo(122, 74); c.closePath(); c.fill();   // head
  c.beginPath(); c.moveTo(140, 52); c.lineTo(156, 22); c.lineTo(148, 56); c.closePath(); c.fill();          // horn
  c.beginPath(); c.moveTo(126, 46); c.lineTo(132, 34); c.lineTo(134, 48); c.closePath(); c.fill();          // small horn
  c.beginPath(); c.moveTo(110, 38); c.lineTo(112, 26); c.lineTo(118, 40); c.closePath(); c.fill();          // ear
  for (const x of [46, 62, 92, 106]) c.fillRect(x, 70, 11, 26);                                              // legs
  c.fillStyle = '#6a2a9a'; c.beginPath(); c.arc(134, 54, 2.6, 0, 7); c.fill();                              // eye
  _rhino = new THREE.CanvasTexture(cv); _rhino.colorSpace = THREE.SRGBColorSpace; return _rhino;
}
export function makePerson(spec = {}) {
  const s = Object.assign({ skin: 0xc99a78, hair: 0x2a1d16, hairStyle: 'short', top: 0x5a6a7a, bottom: 0x3a3d44, shoes: 0x2a2420, hat: 'none', coat: false, height: 1, build: 1, dress: false }, spec);
  let h0 = 7; if (s.seed == null) { const str = JSON.stringify(spec); for (let i = 0; i < str.length; i++) h0 = Math.imul(h0 ^ str.charCodeAt(i), 16777619); }
  const r = rng(s.seed != null ? s.seed : h0);
  // the face of this one person
  const F = {
    jaw: 0.86 + r() * 0.2, cheek: 0.95 + r() * 0.12, faceLen: 1.02 + r() * 0.12, nose: 0.85 + r() * 0.5, noseW: 0.85 + r() * 0.55, eyeGap: 0.038 + r() * 0.012,
    brow: 0.6 + r() * 0.8, lips: 0.8 + r() * 0.5, ears: 0.85 + r() * 0.35, iris: [0x3a2414, 0x2a1a10, 0x4a3018, 0x5a4a2a][Math.floor(r() * 4)], lids: r() * 0.25
  };
  if (s.face) Object.assign(F, s.face);   // a known person's features: a wide nose, a long face
  const fem = s.fem != null ? s.fem : (s.dress || s.hairStyle === 'long' || s.hairStyle === 'bun' || s.hairStyle === 'braid') && !s.beard;
  const mustache = s.mustache != null ? s.mustache : !fem && !s.beard && r() < 0.45;
  const skin = s.skin, skinD = shade(skin, 0.82), lipC = mixc(shade(skin, 0.7), 0x8a2a2a, fem ? 0.55 : 0.3);
  const top = s.top, sleeveC = s.coat ? (s.coat === true ? 0x3b3a3a : s.coat) : top, longSleeve = s.sleeves ? s.sleeves === 'long' : !!s.coat || (s.seed != null ? r() < 0.5 : true);
  const shoeKind = s.shoes === 0xe8e8e8 || s.shoes === 0xf2f2ee ? 'sneaker' : s.shoes === 0x8a5a30 ? 'huarache' : s.shoes === 0x5a3a20 ? 'boot' : 'shoe';
  const W = (fem ? 0.92 : 1) * (s.build || 1), belly = s.belly || 0;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.scale.set(s.build || 1, s.height || 1, s.build || 1);
  const mat = s.ghost ? GHOST : MAT, M = g => new THREE.Mesh(g, mat);
  // legs: hip pivot → thigh, knee pivot → shin and shoe
  const legs = [], knees = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side * 0.095 * W, 0.93, 0); body.add(hip);
    const legC = s.dress ? skin : s.bottom;
    hip.add(M(parts([[cap(0.068 * W + 0.006, 0.34, 0, -0.22, 0), legC]])));
    const knee = new THREE.Group(); knee.position.y = -0.45; hip.add(knee);
    knee.add(M(parts([[cap(0.052 * W + 0.004, 0.33, 0, -0.2, 0), legC], ...shoe(s.shoes, shoeKind).map(([g, c]) => [g.translate(0, -0.47, 0.02), c])])));
    legs.push(hip); knees.push(knee);
  }
  // torso: pelvis, waist, chest (and belly), collar; skirts, coats, aprons
  const torso = new THREE.Group(); torso.position.y = 0.93; body.add(torso);
  const tl = [
    [sph(0.15, 0, 0.02, 0, W * 1.08, 0.75, 0.82), s.dress ? s.bottom : s.bottom],
    [cap(0.13, 0.22, 0, 0.22, 0, 14).scale(W * (fem ? 1.0 : 1.1), 1, 0.74), top],
    [sph(0.155, 0, 0.42, 0, W * (fem ? 1.05 : 1.2), 0.72, 0.72), top],
    [cyl(0.05, 0.058, 0.07, 0, 0.56, 0, 10), skin]
  ];
  if (fem) tl.push([sph(0.06, -0.06, 0.39, 0.075, 1, 0.9, 0.9), top], [sph(0.06, 0.06, 0.39, 0.075, 1, 0.9, 0.9), top]);
  if (belly) tl.push([sph(0.16 + belly * 0.05, 0, 0.17, 0.06 + belly * 0.05, 1.05 * W, 0.95, 0.85), top]);
  if (s.dress) tl.push([cyl(0.17 * W, 0.33 * W, 0.62, 0, -0.27, 0, 18), s.bottom]);
  if (s.coat) tl.push([cyl(0.2 * W, 0.26 * W, 0.78, 0, 0.12, 0, 16).scale(1, 1, 0.78), s.coat === true ? 0x3b3a3a : s.coat]);
  if (s.accessory === 'apron') tl.push([bx(0.3, 0.55, 0.015, 0, 0.12, 0.13 + belly * 0.08), 0xefe8da]);
  if (s.accessory === 'collar') tl.push([bx(0.05, 0.035, 0.01, 0, 0.53, 0.115), 0xffffff]);
  if (s.accessory === 'scarf') tl.push([cyl(0.1, 0.12, 0.08, 0, 0.53, 0, 12), s.accColor || 0xa33a2e]);
  if (s.accessory === 'bag') tl.push([bx(0.24, 0.2, 0.08, -0.24 * W, 0.05, 0.02), 0x6b4a30], [bx(0.02, 0.5, 0.02, -0.1, 0.33, 0.1).rotateZ(-0.5), 0x5a3a20]);
  if (s.accessory === 'rebozo' || s.accessory === 'sarape') tl.push([cyl(0.19 * W, 0.26 * W, 0.34, 0, 0.4, 0, 14).scale(1, 1, 0.82), s.accColor || 0x26346e], s.accessory === 'rebozo' ? [bx(0.1, 0.5, 0.02, 0.1, 0.05, 0.15), s.accColor || 0x26346e] : null);
  if (s.accessory === 'necklace' || s.accessory === 'amulet') tl.push([new THREE.TorusGeometry(0.075, 0.008, 6, 18).rotateX(1.3).translate(0, 0.52, 0.04), s.accColor || 0xd8d8e0]);
  if (s.accessory === 'belt') tl.push([cyl(0.155 * W, 0.155 * W, 0.05, 0, 0.0, 0, 16).scale(1, 1, 0.8), s.accColor || 0x6a4a2a]);
  if (s.sash) tl.push([bx(0.08, 0.6, 0.3 + belly * 0.1, 0, 0.27, 0.02).rotateZ(0.55), s.sash]);
  if (s.kit) tl.push([bx(0.06, 0.1, 0.01, 0, 0.42, 0.12), s.kit.logo || 0xffffff], [bx(0.22, 0.03, 0.005, 0, 0.3, 0.125), s.kit.stripe || 0xffffff]);
  torso.add(M(parts(tl)));
  if (s.kit && s.kit.rhino) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.11), new THREE.MeshStandardMaterial({ map: rhinoTex(), transparent: true, roughness: 0.7 })); d.position.set(0, 0.37, 0.128 + belly * 0.07); torso.add(d); }
  // arms: shoulder pivot → upper arm, elbow pivot → forearm and hand
  const arms = [], elbows = [];
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(side * (fem ? 0.19 : 0.215) * W, 0.47, 0); torso.add(sh);
    sh.add(M(parts([[sph(0.05 * W, 0, -0.015, 0, 1, 0.9, 0.95), sleeveC], [cap(0.046 * W + 0.004, 0.22, 0, -0.15, 0), sleeveC]])));
    const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
    const fore = longSleeve || s.coat ? sleeveC : skin;
    el.add(M(parts([[cap(0.038 * W + 0.004, 0.2, 0, -0.12, 0), fore], [cyl(0.034, 0.03, 0.04, 0, -0.24, 0, 8), skin], ...hand(skin, side).map(([g, c]) => [g.translate(0, -0.25, 0), c])])));
    arms.push(sh); elbows.push(el);
  }
  // the head: skull and jaw, ears, nose, cheeks, hair, beard; brows, lids and mouth move separately
  const neck = new THREE.Group(); neck.position.y = 0.6; torso.add(neck);
  const headG = new THREE.SphereGeometry(0.115, 24, 18), hp = headG.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
    const lo = Math.max(0, -y / 0.115);   // the jaw narrows toward the chin
    x *= (1 - lo * (1 - F.jaw) * 1.3) * F.cheek * (fem ? 0.95 : 1); z *= 1 - lo * 0.12; y *= F.faceLen;
    if (z > 0.06 && Math.abs(x) < 0.06 && y < 0.02 && y > -0.11) z += 0.008 * (1 - Math.abs(x) / 0.06);   // a little chin and mouth relief
    if (y > 0.01 && y < 0.05 && z > 0.07) z -= 0.006;   // eye sockets under the brow
    hp.setXYZ(i, x, y, z);
  }
  headG.computeVertexNormals();
  const hl = [[headG.translate(0, 0.16, 0.005), skin]];
  for (const side of [-1, 1]) hl.push([sph(0.024 * F.ears, side * 0.109 * F.cheek, 0.155, -0.005, 0.45, 1, 0.8, 10, 8), skinD]);
  // nose: bridge and tip, its own width
  hl.push([cap(0.012 * F.noseW, 0.035 * F.nose, 0, 0.155, 0.112, 8).rotateX(0.32), skin], [sph(0.017 * F.noseW, 0, 0.128, 0.122, 1.25, 0.85, 1, 10, 8), skinD]);
  // eyes: white, iris, pupil (they do not move; the lids do)
  for (const side of [-1, 1]) { const ex = side * F.eyeGap; hl.push([sph(0.019, ex, 0.168, 0.094, 1.3, 0.82, 0.6, 14, 10), 0xf4f0e8], [sph(0.0105, ex, 0.168, 0.104, 1, 1, 0.5, 12, 8), F.iris], [sph(0.005, ex, 0.168, 0.109, 1, 1, 0.4, 8, 6), 0x050404], [sph(0.0018, ex + 0.003, 0.172, 0.111, 1, 1, 0.4, 6, 4), 0xffffff]); }
  // hair
  const hs = s.hairStyle, hc = s.hair;
  if (hs !== 'bald') {
    const capG = new THREE.SphereGeometry(0.123, 22, 12, 0, Math.PI * 2, 0, Math.PI * (hs === 'short' || hs === 'curly' ? 0.5 : 0.56)); capG.scale(F.cheek * 1.02, F.faceLen, 1.04); hl.push([capG.translate(0, 0.175, -0.008), hc]);
    if (hs === 'long') hl.push([cap(0.1, 0.2, 0, 0.08, -0.06, 12).scale(1.1, 1, 0.6), hc]);
    if (hs === 'bun') hl.push([sph(0.055, 0, 0.27, -0.09), hc]);
    if (hs === 'braid') hl.push([cap(0.03, 0.3, 0, 0.0, -0.12, 8), hc]);
    if (hs === 'afro' || hs === 'curly') for (let k = 0; k < (hs === 'afro' ? 28 : 18); k++) { const a = r() * Math.PI * 2, b = r() * 1.2; hl.push([sph(0.03 + r() * 0.012, Math.cos(a) * Math.sin(b) * 0.12 * F.cheek, 0.2 + Math.cos(b) * 0.09, Math.sin(a) * Math.sin(b) * 0.12 - 0.01, 1, 1, 1, 8, 6), hc]); }
  } else hl.push([new THREE.SphereGeometry(0.118, 18, 8, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.2).scale(F.cheek, F.faceLen, 1).translate(0, 0.165, -0.01), s.hair]);
  if (s.beard) { const bg = new THREE.SphereGeometry(0.11, 16, 10, -Math.PI * 0.35, Math.PI * 0.7 + Math.PI, Math.PI * 0.55, Math.PI * 0.45); bg.rotateY(Math.PI); bg.scale(F.cheek * F.jaw * 1.05, F.faceLen * 1.05, 1.02); hl.push([bg.translate(0, 0.16, 0.012), s.beardColor || hc]); }
  if (mustache || s.beard) hl.push([cap(0.008, 0.04, 0, 0, 0, 6).rotateZ(Math.PI / 2).translate(0, 0.112, 0.118), s.beardColor || hc]);
  if (s.glasses) for (const side of [-1, 1]) hl.push([new THREE.TorusGeometry(0.02, 0.003, 5, 14).translate(side * F.eyeGap, 0.168, 0.117), 0x222222]);
  if (s.glasses) hl.push([bx(0.02, 0.003, 0.003, 0, 0.17, 0.117), 0x222222]);
  // hats
  const hatC = s.hatColor || 0x2b2622;
  if (s.hat === 'wide' || s.hat === 'fedora') hl.push([cyl(s.hat === 'wide' ? 0.27 : 0.2, s.hat === 'wide' ? 0.27 : 0.2, 0.012, 0, 0.27, 0, 24), hatC], [cyl(0.105, 0.125, 0.13, 0, 0.335, 0, 20), hatC], [cyl(0.126, 0.126, 0.02, 0, 0.285, 0, 20), shade(hatC, 0.55)]);
  if (s.hat === 'panama') hl.push([cyl(0.2, 0.2, 0.01, 0, 0.27, 0, 24), 0xeee6cc], [cyl(0.1, 0.12, 0.11, 0, 0.325, 0, 20), 0xeee6cc], [cyl(0.122, 0.122, 0.025, 0, 0.29, 0, 20), 0x2a2a2a]);
  if (s.hat === 'cap' || s.hat === 'beanie') hl.push([new THREE.SphereGeometry(0.128, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(F.cheek, 1, 1.03).translate(0, 0.19, -0.005), s.hatColor || 0x2a3a5a]);
  if (s.hat === 'cap') hl.push([bx(0.15, 0.012, 0.11, 0, 0.2, 0.15), s.hatColor || 0x2a3a5a]);
  if (s.hat === 'helmet') hl.push([new THREE.SphereGeometry(0.14, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(1, 0.9, 1.25).translate(0, 0.2, -0.01), s.hatColor || 0x1a1a1a], [bx(0.16, 0.035, 0.03, 0, 0.235, 0.14), shade(s.hatColor || 0x1a1a1a, 0.6)]);
  if (s.hat === 'veil') hl.push([cyl(0.135, 0.22, 0.45, 0, 0.12, -0.02, 18), 0x1a1a24], [bx(0.2, 0.03, 0.02, 0, 0.235, 0.11), 0xf2f0ea]);
  // the Danza de los Negritos: a black mask with white painted features, a crown of red flowers, a white scarf
  if (s.mask === 'negrito') {
    hl.push([sph(0.12, 0, 0.165, 0.012, F.cheek * 1.02, F.faceLen * 1.02, 1.04, 20, 14), 0x141210]);
    for (const side of [-1, 1]) hl.push([bx(0.035, 0.01, 0.005, side * 0.04, 0.172, 0.118), 0xf4f0e8], [bx(0.03, 0.006, 0.005, side * 0.04, 0.155, 0.12), 0xf4f0e8]);
    hl.push([bx(0.05, 0.008, 0.005, 0, 0.115, 0.122), 0xf4f0e8]);
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; hl.push([new THREE.ConeGeometry(0.035, 0.1, 6).rotateX(-Math.PI / 2 + 0.5).rotateY(-a).translate(Math.sin(a) * 0.1, 0.3 + Math.cos(k * 2.1) * 0.02, Math.cos(a) * 0.1), k % 3 ? 0xd01828 : 0xa01020]); }
    hl.push([sph(0.13, 0, 0.29, 0, 1, 0.45, 1, 14, 8), 0xe8e0d0]);
  }
  const head = M(parts(hl)); neck.add(head);
  // moving features: brows, upper lids, the mouth
  const browM = M(parts([-1, 1].map(side => [bx(0.038, 0.007 * F.brow + 0.005, 0.01, side * F.eyeGap, 0, 0).rotateZ(side * -0.1), s.mask === 'negrito' ? 0xf4f0e8 : s.age > 60 || hc === 0xb8b8b8 || hc === 0xd8d4cc ? 0x9a9690 : shade(hc, 0.75)]))); browM.position.set(0, 0.192, 0.111); neck.add(browM);
  const lidM = M(parts([-1, 1].map(side => [new THREE.SphereGeometry(0.0198, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(1.32, 0.9, 0.7).translate(side * F.eyeGap, 0, 0), skinD]))); lidM.position.set(0, 0.168, 0.095); neck.add(lidM);
  const mouthM = M(parts([[cap(0.008 * F.lips, 0.03, 0, 0.006, 0, 8).rotateZ(Math.PI / 2), lipC], [cap(0.0088 * F.lips, 0.026, 0, -0.007, 0, 8).rotateZ(Math.PI / 2), lipC], [bx(0.026, 0.006, 0.004, 0, 0, -0.002), 0x2a0e0a]])); mouthM.position.set(0, 0.095, 0.117); neck.add(mouthM);
  lidM.scale.y = 0.15 + F.lids;
  let phase = r() * 10, blink = 2 + r() * 3, expr = 'neutral', exprT = 0;
  root.userData = {
    spec: s, talking: false, attacking: 0, down: 0, face: F,
    setExpression(e) { expr = e; exprT = 0; },
    animate(dt, speed, t) {
      const ud = root.userData;
      if (ud.down > 0) {   // hurt: on the ground
        body.rotation.x = -Math.PI / 2 * Math.min(1, ud.down); body.position.y = 0.15 * Math.min(1, ud.down);
        arms[0].rotation.z = -1.2; arms[1].rotation.z = 1.0; legs[0].rotation.x = 0.2; legs[1].rotation.x = -0.4; knees[1].rotation.x = 0.6;
        lidM.scale.y = 1; return;
      }
      body.rotation.x = 0;
      phase += dt * (speed > 0.1 ? 1.9 + speed * 0.9 : 1);
      const walk = Math.min(1, speed / 1.5), sw = Math.sin(phase * 2.2) * 0.5 * walk, run = Math.max(0, Math.min(1, (speed - 2.5) / 3));
      legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
      knees[0].rotation.x = Math.max(0, -Math.sin(phase * 2.2 + 0.9)) * 0.9 * walk + run * 0.4; knees[1].rotation.x = Math.max(0, Math.sin(phase * 2.2 + 0.9)) * 0.9 * walk + run * 0.4;
      arms[0].rotation.x = -sw * 0.75; arms[1].rotation.x = sw * 0.75; arms[0].rotation.z = -0.06; arms[1].rotation.z = 0.06;
      elbows[0].rotation.x = -0.2 - walk * 0.25 - run * 0.9; elbows[1].rotation.x = -0.2 - walk * 0.25 - run * 0.9;
      body.position.y = Math.abs(Math.cos(phase * 2.2)) * 0.028 * walk + Math.sin(t * 1.3 + phase) * 0.004;
      torso.rotation.y = sw * 0.12; torso.rotation.x = run * 0.12;
      const talk = ud.talking;
      neck.rotation.x = talk ? Math.sin(t * 2.3) * 0.05 : Math.sin(t * 0.6 + phase) * 0.03;
      neck.rotation.y = talk ? Math.sin(t * 1.1) * 0.1 : Math.sin(t * 0.3 + phase) * 0.15;
      if (talk) { arms[1].rotation.x = -0.45 + Math.sin(t * 2.6) * 0.25; arms[1].rotation.z = 0.25; elbows[1].rotation.x = -1.0 + Math.sin(t * 3.1) * 0.3; arms[0].rotation.x = -0.1 + Math.sin(t * 1.7 + 1) * 0.12; elbows[0].rotation.x = -0.5; }
      if (ud.attacking) { arms[1].rotation.x = -1.8 + ud.attacking * 2.4; }
      if (ud.carry) { arms[0].rotation.x = arms[1].rotation.x = -1.2; elbows[0].rotation.x = elbows[1].rotation.x = -0.6; arms[0].rotation.z = -0.3; arms[1].rotation.z = 0.3; }
      // the face: blink, speak, and an expression that fades back to rest
      blink -= dt; if (blink < 0) { blink = 2 + Math.random() * 4; } lidM.scale.y = blink < 0.12 ? 1 : 0.15 + F.lids;
      exprT += dt; const e = exprT < 6 ? expr : 'neutral';
      const browLift = e === 'surprised' ? 0.012 : e === 'happy' ? 0.004 : e === 'sad' ? 0.003 : e === 'angry' ? -0.006 : 0, browTilt = e === 'angry' ? 0.25 : e === 'sad' ? -0.25 : 0;
      browM.position.y = 0.19 + browLift; browM.rotation.z = 0; browM.children; browM.scale.x = 1; browM.rotation.x = browTilt * 0.4;
      const open = talk ? (Math.max(0, Math.sin(t * 11) * Math.sin(t * 3.7)) * 0.9 + 0.1) : e === 'surprised' ? 0.8 : 0;
      mouthM.scale.set(e === 'happy' ? 1.25 : e === 'sad' ? 0.85 : 1, 1 + open * 1.6, 1);
      mouthM.rotation.z = 0; mouthM.position.y = 0.095 - open * 0.003 + (e === 'happy' ? 0.002 : e === 'sad' ? -0.003 : 0);
    }
  };
  root.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return root;
}
