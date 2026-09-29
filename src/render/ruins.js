// The Stair temples: stepped platforms of an older people, buried in the tops of the hills,
// and the chambers beneath Twin Peaks. (Fiction. The real first peoples of this shore, the Ohlone,
// left shellmounds along the bay; see the Field Notes.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { U, GLSL_COMMON } from './shaders.js';
import { toXZ } from '../geo.js';

// id, name, lat, lon, tiers, base width (m)
export const SITES = [
  { id: 'twinpeaks', name: 'The Tide Stair (Twin Peaks)', lat: 37.75455, lon: -122.44770, tiers: 7, base: 46, glyph: 'Door' },
  { id: 'davidson', name: 'Stair of the Cross (Mount Davidson)', lat: 37.73870, lon: -122.45520, tiers: 5, base: 34, glyph: 'Ash' },
  { id: 'mtsutro', name: 'Forest Stair (Mount Sutro)', lat: 37.75820, lon: -122.45770, tiers: 5, base: 32, glyph: 'Fog' },
  { id: 'lonemtn', name: 'Stair of the Unmoved (Lone Mountain)', lat: 37.77880, lon: -122.45180, tiers: 4, base: 28, glyph: 'Name' },
  { id: 'telegraph', name: 'Signal Stair (Telegraph Hill)', lat: 37.80225, lon: -122.40470, tiers: 3, base: 20, glyph: 'Ferry' },
  { id: 'bernal', name: 'Stair of Salt (Bernal Heights)', lat: 37.74330, lon: -122.41460, tiers: 5, base: 30, glyph: 'Salt' },
  { id: 'corona', name: 'Red Rock Stair (Corona Heights)', lat: 37.76500, lon: -122.43850, tiers: 3, base: 20, glyph: 'Shell' },
  { id: 'buenavista', name: 'Stair of Roots (Buena Vista)', lat: 37.76800, lon: -122.44130, tiers: 4, base: 24, glyph: 'Mother' },
  { id: 'tankhill', name: 'Little Stair (Tank Hill)', lat: 37.75975, lon: -122.44780, tiers: 3, base: 18, glyph: 'Stair' },
  { id: 'grandview', name: 'Stair of the West Wind (Grandview)', lat: 37.75640, lon: -122.47190, tiers: 4, base: 22, glyph: 'Bell' },
  { id: 'strawberry', name: 'Island Stair (Strawberry Hill)', lat: 37.76860, lon: -122.47500, tiers: 4, base: 26, glyph: 'Tide' },
  { id: 'seastair', name: 'The Sea Stair (Lands End)', lat: 37.78700, lon: -122.50600, tiers: 3, base: 24, glyph: 'Return', sea: true }
];

const VERT = /* glsl */`varying vec3 vW; varying vec3 vN; varying vec3 vL; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vL = position; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG = GLSL_COMMON + /* glsl */`
uniform float uAwake; uniform vec3 uGlow;
varying vec3 vW; varying vec3 vN; varying vec3 vL;
void main(){
  vec3 n = normalize(vN);
  float nz = fbm(vW.xz * .35 + vW.y * .2), nz2 = vnoise(vW.xz * 2.1 + vW.y * 1.7);
  vec3 stone = mix(vec3(.66,.62,.54), vec3(.52,.50,.46), nz);
  stone = mix(stone, vec3(.74,.70,.62), smoothstep(.6, .9, nz2) * .4);
  // courses and joints
  float course = fract(vW.y / .62);
  vec2 hz = abs(n.x) > abs(n.z) ? vW.zy : vW.xy;
  float joint = fract(hz.x / 1.3 + floor(vW.y / .62) * .5);
  float lines = (1. - smoothstep(.0, .06, course)) + (1. - smoothstep(.0, .03, joint)) * step(.3, 1. - abs(n.y));
  stone *= 1. - .22 * clamp(lines, 0., 1.);
  // moss and lichen on what faces the sky and the fog
  float moss = smoothstep(.45, .9, n.y) * smoothstep(.35, .75, nz + nz2 * .3) + smoothstep(.55, .95, fbm(vW.xz * 1.3)) * .35;
  stone = mix(stone, mix(vec3(.30,.40,.20), vec3(.46,.52,.28), nz2), clamp(moss, 0., .85) * (1. - uAwake * .5));
  // the carved band near the top of every riser: a stepped wave, the stair-and-tide motif
  float band = 0.;
  if (abs(n.y) < .3) {
    float yy = fract(vW.y / 1.8);
    float along = hz.x * .9;
    float wave = step(fract(along), .5) * .5 + floor(fract(along * .5) * 4.) / 8.;
    band = step(.55, yy) * step(yy, .8) * step(abs(fract(yy * 4.) - wave), .18);
  }
  vec3 col = lightIt(stone, n, .9);
  col = mix(col, col * .6, band * (1. - uAwake));
  col += uGlow * band * uAwake * (1.2 + .4 * sin(uTime * 1.7 + vW.y));
  gl_FragColor = vec4(fogIt(col, vW), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function stoneMaterial() {
  return new THREE.ShaderMaterial({ uniforms: Object.assign({ uAwake: { value: 0 }, uGlow: { value: new THREE.Color(0.35, 0.95, 0.85) } }, U), vertexShader: VERT, fragmentShader: FRAG });
}

// A box in world space, rotated about y by ang (our convention: local +x -> (cos, sin) in x,z)
function boxGeo(w, h, d, x, y, z, ang) {
  const g = new THREE.BoxGeometry(w, h, d); g.rotateY(-ang); g.translate(x, y, z); return g;
}

export function makeRuins(city) {
  const group = new THREE.Group(), sites = [];
  for (const s of SITES) {
    const [cx, cz] = toXZ(s.lat, s.lon);
    // stair faces downhill
    const gx = city.heightAt(cx + 20, cz) - city.heightAt(cx - 20, cz), gz = city.heightAt(cx, cz + 20) - city.heightAt(cx, cz - 20);
    let fx = -gx, fz = -gz; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
    if (s.sea) { fx = -1; fz = 0.2; const l = Math.hypot(fx, fz); fx /= l; fz /= l; }
    const ang = Math.atan2(fz, fx);           // local +x faces downhill (toward the stair)
    const c = Math.cos(ang), sn = Math.sin(ang);
    const W = (lx, lz) => [cx + lx * c - lz * sn, cz + lx * sn + lz * c];
    // the base sits at the foot of the stair face, half buried on the uphill side
    const [fx0, fz0] = W(s.base / 2 + 2, 0);
    let y0 = city.heightAt(fx0, fz0) - 0.3;
    if (s.sea) y0 = Math.max(y0, 1.5);
    const TH = 1.8, inset = s.base / 2 / (s.tiers + 1.2);
    const geos = [], mat = stoneMaterial();
    for (let k = 0; k < s.tiers; k++) {
      const w = s.base - 2 * k * inset, top = y0 + (k + 1) * TH, bottom = y0 - 14;
      geos.push(boxGeo(w, top - bottom, w, cx, (top + bottom) / 2, cz, ang));
      city.colliders.addSolid(cx, cz, w, w, ang, bottom, top, 'ruin');
    }
    // the stair: rises one tier per inset, so it is always at or above the terrace it crosses
    const stepRise = 0.3, stepRun = inset * stepRise / TH, SW = Math.min(6, s.base * 0.18);
    const nSteps = Math.round((s.tiers + 1) * TH / stepRise);
    for (let i = 0; i < nSteps; i++) {
      const top = y0 + (i + 1) * stepRise, dist = s.base / 2 + inset - (i + 0.5) * stepRun;   // from centre, along +x
      if (dist < -0.1) break;
      const [sx, sz] = W(dist, 0);
      geos.push(boxGeo(stepRun + 0.02, top - (y0 - 4), SW, sx, (top + y0 - 4) / 2, sz, ang));
      city.colliders.addSolid(sx, sz, stepRun + 0.02, SW, ang, y0 - 4, top, 'ruin');
    }
    // flanking balustrades
    for (const side of [-1, 1]) {
      const L = s.base / 2 + inset, [bx, bz] = W(L / 2, side * (SW / 2 + 0.35));
      const g = new THREE.BoxGeometry(L * 1.08, 0.7, 0.7); g.rotateZ(Math.atan2((s.tiers) * TH, L)); g.rotateY(-ang); g.translate(bx, y0 + s.tiers * TH / 2 + 0.3, bz); geos.push(g);
    }
    // summit shrine: a low stele carrying the glyph, and for the Tide Stair a round stone door
    const topY = y0 + s.tiers * TH, [sx, sz] = W(-inset * 0.3, 0);
    geos.push(boxGeo(0.7, 2.4, 1.8, sx, topY + 1.2, sz, ang));
    geos.push(boxGeo(1.1, 0.35, 2.3, sx, topY + 2.5, sz, ang));
    city.colliders.addBox(sx, sz, 0.8, 1.9, ang, topY - 1, topY + 2.6, 'stele');
    const geo = mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g));
    const mesh = new THREE.Mesh(geo, mat); group.add(mesh);
    // glyph disc on the stele face (emissive once read)
    const glyphMat = new THREE.MeshBasicMaterial({ map: glyphTexture(s.glyph), transparent: true, color: 0x6a6258, fog: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), glyphMat);
    const [gx0, gz0] = W(-inset * 0.3 + 0.37, 0);
    disc.position.set(gx0, topY + 1.35, gz0); disc.rotation.y = -ang + Math.PI / 2; group.add(disc);
    const site = { ...s, x: cx, z: cz, y: topY, ang, mat, glyphMat, stele: [gx0 + c * 1.2, gz0 + sn * 1.2], foot: W(s.base / 2 + inset + 2.5, 0), awake: false };
    if (s.id === 'twinpeaks') {
      const [dx, dz] = W(-inset * 1.4, 0);
      const door = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.5, 32), stoneMaterial());
      door.rotation.z = Math.PI / 2; door.rotation.y = -ang; door.position.set(dx, topY + 1.7, dz); group.add(door);
      const frame = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.28, 8, 32), mat); frame.rotation.y = -ang + Math.PI / 2; frame.position.copy(door.position); group.add(frame);
      site.door = { x: dx + c * 0.8, z: dz + sn * 0.8, mesh: door };
    }
    if (s.sea) {
      // the old harbour: a breakwater of pillars walking out under the surf
      for (let i = 0; i < 9; i++) {
        const [px, pz] = W(s.base / 2 + 30 + i * 22, (i % 2 ? 1 : -1) * 9);
        const h = 9 - i * 0.6, p = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, h + 8, 10), mat);
        p.position.set(px, h / 2 - 5, pz); group.add(p);
      }
    }
    sites.push(site);
  }
  group.userData.sites = sites;
  group.userData.setAwake = (id, on) => { const s = sites.find(q => q.id === id); if (!s) return; s.awake = on; s.mat.uniforms.uAwake.value = on ? 1 : 0; s.glyphMat.color.set(on ? 0x9ff3e6 : 0x6a6258); };
  return group;
}

/* A glyph drawn from simple strokes: steps, waves, a door, an eye; each glyph a different combination. */
const GLYPH_STROKES = {
  Tide: ['wave', 'wave2'], Stair: ['steps'], Salt: ['dots', 'wave'], Ferry: ['boat', 'wave'], Mother: ['ring', 'dot'], Fog: ['wave', 'wave2', 'wave3'],
  Shell: ['spiral'], Door: ['ring', 'steps'], Name: ['bar', 'dot'], Bell: ['bell'], Ash: ['cross', 'dots'], Return: ['steps', 'wave', 'ring']
};
const glyphCache = {};
export function glyphTexture(name) {
  if (glyphCache[name]) return glyphCache[name];
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.stroke();
  for (const s of GLYPH_STROKES[name] || ['ring']) {
    g.beginPath();
    if (s === 'wave' || s === 'wave2' || s === 'wave3') { const y = s === 'wave' ? 80 : s === 'wave2' ? 62 : 44; g.moveTo(24, y); for (let x = 24; x <= 104; x += 4) g.lineTo(x, y + Math.sin((x - 24) / 80 * Math.PI * 3) * 7); }
    else if (s === 'steps') { g.moveTo(28, 96); g.lineTo(28, 80); g.lineTo(48, 80); g.lineTo(48, 62); g.lineTo(68, 62); g.lineTo(68, 44); g.lineTo(90, 44); g.lineTo(90, 28); }
    else if (s === 'ring') { g.arc(64, 64, 22, 0, Math.PI * 2); }
    else if (s === 'dot') { g.arc(64, 64, 6, 0, Math.PI * 2); g.fill(); }
    else if (s === 'dots') { for (const [x, y] of [[44, 40], [64, 34], [84, 40]]) { g.moveTo(x + 5, y); g.arc(x, y, 5, 0, Math.PI * 2); } g.fill(); }
    else if (s === 'boat') { g.moveTo(34, 58); g.lineTo(94, 58); g.lineTo(82, 72); g.lineTo(46, 72); g.closePath(); g.moveTo(64, 58); g.lineTo(64, 28); g.lineTo(84, 50); }
    else if (s === 'spiral') { for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = 4 + a * 2.6; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } }
    else if (s === 'bar') { g.moveTo(40, 40); g.lineTo(88, 40); g.moveTo(40, 88); g.lineTo(88, 88); }
    else if (s === 'bell') { g.moveTo(44, 84); g.quadraticCurveTo(44, 34, 64, 32); g.quadraticCurveTo(84, 34, 84, 84); g.closePath(); g.moveTo(64, 84); g.arc(64, 90, 5, 0, Math.PI * 2); }
    else if (s === 'cross') { g.moveTo(64, 26); g.lineTo(64, 100); g.moveTo(44, 50); g.lineTo(84, 50); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; glyphCache[name] = t; return t;
}

/* ---------------- beneath Twin Peaks ----------------
   Interiors live far below the city, where nothing of the surface can be seen. The player walks on
   solids only while inside. */
export const UNDER = { x: 0, z: 0, y: -600 };

export function makeUnderworld(city) {
  const group = new THREE.Group();
  const [ox, oz] = toXZ(37.7530, -122.4470); const oy = UNDER.y;
  UNDER.x = ox; UNDER.z = oz;
  const stone = stoneMaterial(); stone.uniforms.uAwake.value = 1;
  const dark = new THREE.MeshBasicMaterial({ color: 0x06090c });
  const geos = [];
  const solid = (lx, lz, w, d, y0, top, visible = true) => { if (visible) geos.push(boxGeo(w, top - y0, d, ox + lx, (top + y0) / 2, oz + lz, 0)); city.colliders.addSolid(ox + lx, oz + lz, w, d, 0, y0, top, 'under'); };
  const wall = (lx, lz, w, d, y0, top) => { geos.push(boxGeo(w, top - y0, d, ox + lx, (top + y0) / 2, oz + lz, 0)); city.colliders.addBox(ox + lx, oz + lz, w, d, 0, y0, top, 'under'); };
  // 1. The landing (arrive here through the round door), then a long stair descending east
  solid(0, 0, 12, 12, oy - 2, oy);
  const STEPS = 60, rise = 0.25, run = 0.6, HW = 3.2;
  for (let i = 0; i < STEPS; i++) solid(6 + (i + 0.5) * run, 0, run + 0.01, HW * 2, oy - 40, oy - (i + 1) * rise);
  const L = 6 + STEPS * run, bottom = oy - STEPS * rise;
  // 2. The hall of the Tide Door at the bottom
  solid(L + 20, 0, 40, 30, bottom - 2, bottom);
  // walls, ceiling
  wall(-6.5, 0, 1, 14, oy - 2, oy + 8); wall(0, -6.5, 14, 1, oy - 2, oy + 8); wall(0, 6.5, 14, 1, oy - 2, oy + 8);
  for (let i = 0; i < STEPS; i += 6) { const x = 6 + (i + 3) * run, y = oy - (i + 3) * rise; wall(x, -HW - 0.5, run * 6 + 0.1, 1, y - 4, y + 8); wall(x, HW + 0.5, run * 6 + 0.1, 1, y - 4, y + 8); geos.push(boxGeo(run * 6 + 0.1, 1, HW * 2 + 2, ox + x, y + 6.5, oz, 0)); }
  wall(L + 20, -15.5, 40, 1, bottom - 2, bottom + 14); wall(L + 20, 15.5, 40, 1, bottom - 2, bottom + 14); wall(L - 0.5, -9, 1, 12, bottom - 2, bottom + 14); wall(L - 0.5, 9, 1, 12, bottom - 2, bottom + 14);
  geos.push(boxGeo(42, 1, 32, ox + L + 20, bottom + 14.5, oz, 0));
  geos.push(boxGeo(14, 1, 14, ox, oy + 8.5, oz, 0));
  // columns in the hall
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const x = L + 6 + i * 9, z = s * 9; geos.push(boxGeo(1.6, 14, 1.6, ox + x, bottom + 7, oz + z, 0)); city.colliders.addBox(ox + x, oz + z, 1.6, 1.6, 0, bottom - 2, bottom + 14, 'under'); }
  // the far wall is the Tide Door: a great round stone, stopped with a grey slab of new concrete and cable
  const doorX = L + 39.5;
  wall(doorX, 0, 1, 30, bottom - 2, bottom + 14);
  const tide = new THREE.Mesh(new THREE.CircleGeometry(6.5, 48), new THREE.MeshBasicMaterial({ color: 0x2a6f6a })); tide.position.set(ox + doorX - 0.55, bottom + 6.8, oz); tide.rotation.y = -Math.PI / 2; group.add(tide);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.5, 8, 48), stone); ring.position.copy(tide.position); ring.rotation.y = Math.PI / 2; group.add(ring);
  const plug = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 6.5), new THREE.MeshStandardMaterial({ color: 0x8d8f91, roughness: 0.95 })); plug.position.set(ox + doorX - 0.9, bottom + 5, oz); group.add(plug);
  // a steel hatch in the plug: the vault
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 1.4), new THREE.MeshStandardMaterial({ color: 0x4a5258, roughness: 0.4, metalness: 0.6 })); hatch.position.set(ox + doorX - 1.35, bottom + 1.3, oz); group.add(hatch);
  // 3. The Room: a vault made up like a drawing room, sealed against the door. Three chairs; no mirror; no window.
  const R = { x: L + 60, y: bottom };
  solid(R.x, 0, 12, 10, R.y - 2, R.y);
  wall(R.x - 6.5, 0, 1, 11, R.y - 2, R.y + 4.5); wall(R.x + 6.5, 0, 1, 11, R.y - 2, R.y + 4.5); wall(R.x, -5.5, 14, 1, R.y - 2, R.y + 4.5); wall(R.x, 5.5, 14, 1, R.y - 2, R.y + 4.5);
  const room = new THREE.Group(); group.add(room);
  const wallpaper = new THREE.MeshStandardMaterial({ color: 0x5a2f35, roughness: 0.9 }), trim = new THREE.MeshStandardMaterial({ color: 0xc9b58a, roughness: 0.5, metalness: 0.2 });
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(ox + x, y, oz + z); room.add(me); return me; };
  add(new THREE.BoxGeometry(12, 4.5, 0.2), wallpaper, R.x, R.y + 2.25, -4.9); add(new THREE.BoxGeometry(12, 4.5, 0.2), wallpaper, R.x, R.y + 2.25, 4.9);
  add(new THREE.BoxGeometry(0.2, 4.5, 10), wallpaper, R.x - 5.9, R.y + 2.25, 0); add(new THREE.BoxGeometry(0.2, 4.5, 10), wallpaper, R.x + 5.9, R.y + 2.25, 0);
  add(new THREE.BoxGeometry(12, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x3a2a24 }), R.x, R.y + 4.5, 0);
  add(new THREE.BoxGeometry(11.8, 0.05, 9.8), new THREE.MeshStandardMaterial({ color: 0x6b2a2a, roughness: 1 }), R.x, R.y + 0.03, 0);
  // the mantel with a heavy bronze ornament, and a lamp that cannot be turned off
  add(new THREE.BoxGeometry(0.8, 1.3, 2.6), trim, R.x + 5.4, R.y + 0.65, 0);
  add(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.8, roughness: 0.35 }), R.x + 5.3, R.y + 1.65, 0.4);
  const lamp = add(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), R.x, R.y + 4.1, 0);
  const light = new THREE.PointLight(0xffd9a0, 30, 16, 1.6); light.position.copy(lamp.position); room.add(light);
  const chairColors = [0x2e5a3a, 0x7a2430, 0x3a3f7a];
  const chairs = [[-2.4, -2.4], [2.4, -2.4], [0, 2.8]].map(([x, z], i) => {
    const m = new THREE.MeshStandardMaterial({ color: chairColors[i], roughness: 0.8 });
    const c = new THREE.Group(); c.position.set(ox + R.x + x, R.y, oz + z);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.1), m); seat.position.y = 0.45; c.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.25), m); back.position.set(0, 1.1, -0.45); c.add(back);
    c.lookAt(ox + R.x, R.y, oz); room.add(c);
    return c;
  });
  // the room's own door (in the west wall), which stands open onto the hall
  const rdoor = add(new THREE.BoxGeometry(0.15, 2.5, 1.2), new THREE.MeshStandardMaterial({ color: 0x3a2418 }), R.x - 5.8, R.y + 1.25, -0.9);
  rdoor.rotation.y = 1.1;
  // a dim light for the stair and the hall, cold as tide pools
  const hallLight = new THREE.PointLight(0x7fe0d0, 60, 70, 1.4); hallLight.position.set(ox + L + 22, bottom + 10, oz); group.add(hallLight);
  const stairLight = new THREE.PointLight(0x7fe0d0, 30, 40, 1.4); stairLight.position.set(ox + 20, oy - 4, oz); group.add(stairLight);
  group.add(new THREE.Mesh(mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)), stone));
  // positions the game needs
  group.userData = {
    landing: [ox, oy, oz], hall: [ox + L + 10, bottom, oz], tideDoor: [ox + doorX - 2, bottom, oz], roomEntry: [ox + R.x - 4, R.y, oz - 1],
    room: [ox + R.x, R.y, oz], chairs: chairs.map(c => [c.position.x, c.position.y, c.position.z]), tideMesh: tide, plug,
    bounds: { x0: ox - 8, x1: ox + R.x + 8, z0: oz - 17, z1: oz + 17, y0: oy - 60, y1: oy + 12 }
  };
  // hidden from the surface: only drawn while the player is below
  group.visible = false;
  return group;
}
