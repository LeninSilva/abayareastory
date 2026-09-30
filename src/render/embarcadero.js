// The Embarcadero, from Oracle Park to Pier 39: the boulevard with the F-line streetcars and Canary Island
// palms in its median, the promenade on the seawall with its railing and lamps, the numbered pier bulkheads,
// Pier 7 and Pier 14 reaching out over the bay, Rincon Park with Cupid's Span, and the plaza fountain.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { U, GLSL_COMMON, landmarkMaterial } from './shaders.js';
import { WF, XS, PIERS, FERRY, RINCON, wfPoint } from '../waterfront.js';
import { toXZ } from '../geo.js';

const Y = XS.deckY;
// the cross streets (distance along the line) where crosswalks cross the boulevard
export const CROSSINGS = [40, 330, 560, 820, 1020, 1190, 1330, 1535, 1640, 1830, 1990, 2185, 2330, 2520, 2720, 2900, 3120, 3340, 3560, 3800, 4040];

const DECK_FRAG = GLSL_COMMON + /* glsl */`
uniform float uCross[21];
varying vec3 vW; varying vec3 vN; varying vec3 vI;   // x: offset s (m), y: distance t (m), z: kind
float PX;   // metres per pixel, roughly, at this fragment
// an anti-aliased painted line: widened to at least a pixel far away, and faded by the same amount
float line(float x, float c, float w){ float we = max(w, PX); return (1. - smoothstep(we * .5, we * .5 + PX, abs(x - c))) * (w / we); }
void main(){
  float s = vI.x, t = vI.y, kind = floor(vI.z + .5);
  PX = length(uCamPos - vW) * .0022;
  vec3 n = normalize(vN);
  float nz = vnoise(vW.xz * 1.1), big = fbm(vW.xz * .12);
  vec3 col;
  if (kind == 0.) {            // asphalt with the boulevard's markings
    col = mix(vec3(.16,.165,.18), vec3(.23,.23,.24), nz * .5 + big * .5);
    col *= 1. - .07 * smoothstep(.6, .9, fbm(vW.xz * .35 + 5.));
    float as = abs(s);
    float dash = step(.5, fract(t / 10.));
    col = mix(col, vec3(.85,.85,.8), (line(as, 11., .13) + line(as, 16., .13)) * dash * .8);
    col = mix(col, vec3(.85,.85,.8), line(as, 6.35, .12) * .8);
    // green bike lanes against the curbs, edged in white
    float bike = step(19.1, as) * step(as, 20.9);
    col = mix(col, vec3(.25,.52,.33) * (.85 + .15 * nz), bike * .9);
    col = mix(col, vec3(.88,.88,.84), line(as, 19.0, .15) * .85);
    // crosswalks at the cross streets
    float cw = 0.;
    for (int i = 0; i < 21; i++) cw = max(cw, 1. - smoothstep(2.4, 2.6, abs(t - uCross[i])));
    col = mix(col, vec3(.9,.9,.86), cw * mix(step(.45, fract(as / 1.3)), .55, smoothstep(.02, .08, PX)) * .92);
  } else if (kind == 1.) {     // the median trackway: concrete, two tracks of rails and the palm planters
    col = mix(vec3(.55,.54,.51), vec3(.62,.60,.56), nz * .5 + big * .5);
    float r1 = line(s, -2.0 - .72, .09) + line(s, -2.0 + .72, .09) + line(s, 2.0 - .72, .09) + line(s, 2.0 + .72, .09);
    float groove = line(s, -2.0 - .66, .05) + line(s, -2.0 + .66, .05) + line(s, 2.0 - .66, .05) + line(s, 2.0 + .66, .05);
    col = mix(col, vec3(.63,.62,.62), clamp(r1, 0., 1.)); col = mix(col, vec3(.2,.2,.2), clamp(groove, 0., 1.) * .8);
    col *= 1. - .08 * step(.96, fract(t / 4.));
    float planter = step(4.1, abs(s));
    col = mix(col, mix(vec3(.30,.26,.20), vec3(.38,.46,.25), smoothstep(.4, .7, fbm(vW.xz * .8))), planter);
  } else if (kind == 2.) {     // sidewalk and promenade: scored concrete, red brick bands, a granite edge on the seawall
    col = mix(vec3(.66,.64,.60), vec3(.74,.72,.67), nz * .55 + big * .45);
    vec2 g = vec2(s / 3., t / 3.);
    float score = max(step(.97, fract(g.x)), step(.97, fract(g.y)));
    col *= 1. - .1 * score;
    float band = step(.9, fract(t / 24.));
    col = mix(col, vec3(.55,.28,.22) * (.85 + .3 * nz), band * step(21.3, s));
    col = mix(col, vec3(.78,.77,.74), step(37.2, s));
    col = mix(col, vec3(.25,.52,.33), step(21.6, s) * step(s, 24.6) * .85);     // the two-way cycle track
    col = mix(col, vec3(.9), line(s, 23.1, .1) * step(.5, fract(t / 6.)) * step(21., s));
    col *= 1. - .06 * smoothstep(.7, 1., fbm(vW.xz * .6));
  } else if (kind == 3.) {     // Rincon Park lawn
    col = mix(vec3(.17,.31,.11), vec3(.27,.42,.15), nz * .4 + big * .6);
  } else if (kind == 4.) {     // the Ferry Building plaza: granite pavers
    vec2 g = vec2(s / 1.2, t / 2.4);
    col = mix(vec3(.62,.60,.57), vec3(.70,.67,.62), hash12(floor(g)) * .6 + nz * .4);
    col *= 1. - .18 * max(step(.94, fract(g.x)), step(.95, fract(g.y)));
  } else if (kind == 5.) {     // curb faces and the seawall
    col = mix(vec3(.62,.61,.58), vec3(.52,.51,.48), big);
    float wet = smoothstep(.6, -.4, vW.y);
    col = mix(col, vec3(.22,.26,.22), wet);
    col = mix(col, vec3(.18,.24,.20), smoothstep(1.1, .2, vW.y) * .6 * step(vW.y, 1.1));
  } else {                     // pier decks
    col = mix(vec3(.52,.50,.46), vec3(.60,.57,.52), nz * .5 + big * .5);
    col *= 1. - .1 * step(.94, fract(t / 2.));
  }
  vec3 lit = lightItS(col, n, 1., shadowAt(vW, n));
  gl_FragColor = vec4(fogIt(lit, vW), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function deckMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uCross: { value: CROSSINGS.slice(0, 21).concat(Array(Math.max(0, 21 - CROSSINGS.length)).fill(-999)) } }, U),
    vertexShader: /* glsl */`attribute vec3 aI; varying vec3 vW; varying vec3 vN; varying vec3 vI;
      void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normal; vI = aI; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: DECK_FRAG, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2
  });
}

/* geometry builder: horizontal bands and vertical faces following the line */
class Builder {
  constructor() { this.pos = []; this.nor = []; this.info = []; this.idx = []; }
  // a flat band between offsets s0..s1, from t0 to t1, at height y, kind k
  band(t0, t1, s0, s1, y, k, step = 8) {
    const n = Math.max(1, Math.ceil((t1 - t0) / step));
    let prev = -1;
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n, base = this.pos.length / 3;
      for (const s of [s0, s1]) { const [x, z] = wfPoint(t, s); this.pos.push(x, y, z); this.nor.push(0, 1, 0); this.info.push(s, t, k); }
      if (prev >= 0) this.idx.push(prev, prev + 1, base, prev + 1, base + 1, base);
      prev = base;
    }
  }
  // a vertical face at offset s from y0 up to y1, facing bayward (+1) or inland (-1)
  face(t0, t1, s, y0, y1, dir, k, step = 8) {
    const n = Math.max(1, Math.ceil((t1 - t0) / step));
    let prev = -1;
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n, base = this.pos.length / 3;
      const [x, z] = wfPoint(t, s), [x2, z2] = wfPoint(t, s + dir), nx = x2 - x, nz = z2 - z;
      this.pos.push(x, y0, z, x, y1, z); this.nor.push(nx, 0, nz, nx, 0, nz); this.info.push(s, t, k, s, t, k);
      if (prev >= 0) { if (dir > 0) this.idx.push(prev, base, prev + 1, prev + 1, base, base + 1); else this.idx.push(prev, prev + 1, base, prev + 1, base + 1, base); }
      prev = base;
    }
  }
  mesh(mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aI', new THREE.Float32BufferAttribute(this.info, 3));
    g.setIndex(this.idx); g.computeBoundingSphere();
    return new THREE.Mesh(g, mat);
  }
}
// the band builder's winding goes from s0 to s1 in the local frame; make sure faces point up
function fixWinding(b) {
  const p = b.pos, idx = b.idx;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, c = idx[i + 1] * 3, d = idx[i + 2] * 3;
    const ux = p[c] - p[a], uz = p[c + 2] - p[a + 2], vx = p[d] - p[a], vz = p[d + 2] - p[a + 2];
    const uy = p[c + 1] - p[a + 1], vy = p[d + 1] - p[a + 1];
    const ny = uz * vx - ux * vz;
    if (Math.abs(uy) < 1e-4 && Math.abs(vy) < 1e-4 && ny < 0) { const tmp = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tmp; }
  }
}

/* ---------- props ---------- */
function canaryPalm() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.42, 0.55, 11, 10, 8); trunk.translate(0, 5.5, 0);
  // the trunk of a Canary Island date palm: thick, patterned with old leaf bases
  const tp = trunk.attributes.position, tc = new Float32Array(tp.count * 3);
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), a = Math.atan2(tp.getZ(i), tp.getX(i)); const d = (Math.sin(y * 6 + a * 3) * Math.sin(y * 6 - a * 3)) * .5 + .5; const c = new THREE.Color(0x6e5a44).lerp(new THREE.Color(0x8c7556), d); tc.set([c.r, c.g, c.b], i * 3); }
  trunk.setAttribute('color', new THREE.BufferAttribute(tc, 3)); parts.push(trunk);
  const knob = new THREE.SphereGeometry(0.9, 10, 8); knob.scale(1, 0.8, 1); knob.translate(0, 11.2, 0); paint(knob, 0x5e5236); parts.push(knob);
  for (let i = 0; i < 26; i++) {
    const ring = i < 13 ? 0 : 1, a = (i / 13) * Math.PI * 2 + ring * 0.24;
    const len = ring ? 5.2 : 6.2, droop = ring ? 0.35 : 0.8;
    const g = new THREE.PlaneGeometry(1.0, len, 1, 6); g.translate(0, len / 2, 0);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const y = p.getY(k), f = y / len; p.setZ(k, -f * f * len * droop); p.setX(k, p.getX(k) * (1 - f * 0.8)); }
    g.rotateX(-(ring ? 0.35 : 0.95)); g.rotateY(a); g.translate(0, 11.4, 0); g.computeVertexNormals();
    paint(g, ring ? 0x5f8a3c : 0x4d7431); parts.push(g);
  }
  return mergeGeometries(parts.map(g => g.index ? g.toNonIndexed() : g));
}
function paint(g, hex) { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }

function streetcar(livery) {
  // a PCC car: 15 m long, rounded ends, two-tone paint, a band of windows, trolley pole up to the wire
  const g = new THREE.Group();
  const body = landmarkMaterial({ color: livery[0], roughness: 0.45, metalness: 0.1 }), band = landmarkMaterial({ color: livery[1], roughness: 0.45 });
  const glass = landmarkMaterial({ color: 0x1b2630, roughness: 0.15, metalness: 0.4 }), dark = landmarkMaterial({ color: 0x222222, roughness: 0.8 });
  const L = 13.5, W = 2.6;
  const mid = new THREE.Mesh(new THREE.BoxGeometry(L, 1.3, W), body); mid.position.y = 1.35; g.add(mid);
  const up = new THREE.Mesh(new THREE.BoxGeometry(L, 1.2, W - 0.05), band); up.position.y = 2.6; g.add(up);
  const win = new THREE.Mesh(new THREE.BoxGeometry(L - 0.6, 0.85, W + 0.02), glass); win.position.y = 2.55; g.add(win);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, L, 16, 1, false, 0, Math.PI), band); roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.scale.set(1, 1, 0.3); roof.position.y = 3.2; g.add(roof);
  for (const e of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, 2.5, 16, 1, false, e > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), body); cap.position.set(e * L / 2, 1.95, 0); g.add(cap);
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(W / 2 + 0.01, W / 2 + 0.01, 0.8, 16, 1, true, e > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), glass); cw.position.set(e * L / 2, 2.55, 0); g.add(cw);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff2c0 })); light.position.set(e * (L / 2 + W / 2 - 0.05), 1.3, 0); g.add(light);
  }
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(L - 1, 0.5, W - 0.3), dark); skirt.position.y = 0.45; g.add(skirt);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.2, 5), dark); pole.position.set(-2.5, 4.9, 0); pole.rotation.z = -1.05; g.add(pole);
  return g;
}

function bulkheadTexture(num) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d');
  c.fillStyle = '#e4dccb'; c.fillRect(0, 0, 512, 256);
  // rusticated base, pilasters, the great arched opening, a cornice and the number
  c.fillStyle = '#d4cab6'; for (let y = 180; y < 256; y += 12) c.fillRect(0, y, 512, 2);
  c.fillStyle = '#cfc4ae'; for (const x of [40, 120, 392, 472]) c.fillRect(x - 8, 40, 16, 216);
  c.fillStyle = '#2b3036'; c.beginPath(); c.moveTo(176, 256); c.lineTo(176, 120); c.arc(256, 120, 80, Math.PI, 0); c.lineTo(336, 256); c.closePath(); c.fill();
  c.strokeStyle = '#b8ab92'; c.lineWidth = 10; c.beginPath(); c.arc(256, 120, 86, Math.PI, 0); c.stroke();
  c.fillStyle = '#3b4650'; for (const x of [60, 140, 352, 432]) { c.fillRect(x, 100, 36, 60); c.fillRect(x, 190, 36, 50); }
  c.fillStyle = '#c9bca2'; c.fillRect(0, 22, 512, 16); c.fillRect(0, 0, 512, 8);
  c.fillStyle = '#5a4a36'; c.font = 'bold 30px Georgia, serif'; c.textAlign = 'center'; c.fillText('PIER ' + num, 256, 76);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function cupidsSpan() {
  // Claes Oldenburg and Coosje van Bruggen, 2002: a sixty-foot bow and arrow, the bow buried in the lawn
  const g = new THREE.Group();
  const bowMat = landmarkMaterial({ color: 0xc88e3a, roughness: 0.55 }), white = landmarkMaterial({ color: 0xece6da, roughness: 0.5 }), red = landmarkMaterial({ color: 0xb43a2e, roughness: 0.6 });
  const R = 12, a0 = -0.35, a1 = Math.PI + 0.35;
  const pts = []; for (let i = 0; i <= 48; i++) { const a = a0 + (a1 - a0) * i / 48; pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * 0.9 - 4, 0)); }
  const bow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.75, 10), bowMat); g.add(bow);
  const tipL = pts[0], tipR = pts[pts.length - 1];
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, tipL.distanceTo(tipR), 6), white);
  string.position.copy(tipL).add(tipR).multiplyScalar(0.5); string.rotation.z = Math.PI / 2; g.add(string);
  // the arrow: shaft down through the bow into the ground, feathers high in the air
  const shaftLen = 21, shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, shaftLen, 10), white);
  const arrow = new THREE.Group(); arrow.add(shaft);
  for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 1.6), red); f.position.set(0, shaftLen / 2 - 1.8, 0); f.geometry.translate(0, 0, 0.9); f.rotation.y = i * Math.PI * 2 / 3; arrow.add(f); }
  arrow.position.set(-1, 4.5, 0.4); arrow.rotation.z = -0.62; g.add(arrow);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function vaillancourtFountain() {
  // Armand Vaillancourt's 1971 fountain: tumbled square concrete tubes, water pouring through them
  const g = new THREE.Group(), conc = landmarkMaterial({ color: 0x9c968a, roughness: 0.95 });
  const tubes = [[0, 6, 0, 14, 0, 0], [5, 9, 3, 12, 0.6, 0.3], [-4, 8, -3, 10, -0.5, 0.8], [2, 13, -2, 9, 0.2, -0.6], [-6, 4, 5, 11, 1.2, 0], [7, 5, -5, 9, 0, 1.3], [0, 11, 6, 8, 0.9, 0.2], [-3, 15, 1, 7, 0, -0.9]];
  for (const [x, y, z, len, rx, rz] of tubes) { const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, len, 2.6), conc); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m); }
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 0.8, 32), conc); pool.position.y = -0.3; g.add(pool);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(21, 21, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x3a6a70, roughness: 0.1, metalness: 0.3 })); water.position.y = 0.15; g.add(water);
  // falling water: soft white sheets
  const sheet = new THREE.MeshBasicMaterial({ color: 0xdfeff0, transparent: true, opacity: 0.45, depthWrite: false });
  for (const [x, y, z] of [[5, 9, 3], [0, 6, 0], [-4, 8, -3]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2, y), sheet); w.position.set(x + 1.4, y / 2, z); w.rotation.y = 0.4; g.add(w); }
  return g;
}

function hyattRegency() {
  // John Portman's Hyatt Regency (1973): a stepped, sloping wall of balconies over the Embarcadero
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(70, 0); shape.lineTo(70, 60); shape.lineTo(46, 60); shape.lineTo(0, 16); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 55, bevelEnabled: false }); geo.translate(-35, 0, -27.5);
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d');
  c.fillStyle = '#cfc6b6'; c.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 8) { c.fillStyle = '#566068'; c.fillRect(0, y + 2, 64, 3); }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(0.05, 0.08); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(geo, landmarkMaterial({ map: tex, roughness: 0.8 }));
  return m;
}

/* ---------- the waterfront ---------- */
export function makeEmbarcadero(city) {
  const group = new THREE.Group(), L = WF.length;
  const mat = deckMaterial();
  // decks
  const b = new Builder();
  b.band(0, L, XS.landEdge, XS.landCurb, Y + 0.15, 2);                   // inland sidewalk
  b.band(0, L, XS.landCurb, XS.medianIn, Y, 0);                          // inland roadway
  b.band(0, L, XS.medianIn, XS.medianOut, Y + 0.18, 1);                  // median
  b.band(0, L, XS.medianOut, XS.bayCurb, Y, 0);                          // bayside roadway
  const inRincon = t => t > RINCON.t0 && t < RINCON.t1;
  b.band(0, RINCON.t0, XS.bayCurb, XS.seawall, Y + 0.15, 2);              // promenade
  b.band(RINCON.t0, RINCON.t1, XS.bayCurb, 25.5, Y + 0.15, 2);
  b.band(RINCON.t0, RINCON.t1, 25.5, 34.5, Y + 0.2, 3, 6);              // Rincon Park lawn
  b.band(RINCON.t0, RINCON.t1, 34.5, XS.seawall, Y + 0.15, 2);
  b.band(RINCON.t1, L, XS.bayCurb, XS.seawall, Y + 0.15, 2);
  b.band(FERRY.t - 102, FERRY.t + 102, XS.seawall, FERRY.s - 14, Y + 0.16, 4, 6);  // Ferry Building plaza
  // curbs
  b.face(0, L, XS.landCurb, Y, Y + 0.15, 1, 5); b.face(0, L, XS.medianIn, Y, Y + 0.18, -1, 5);
  b.face(0, L, XS.medianOut, Y, Y + 0.18, 1, 5); b.face(0, L, XS.bayCurb, Y, Y + 0.15, -1, 5);
  // the seawall: a vertical face down into the bay, broken where the Ferry plaza continues
  b.face(0, FERRY.t - 102, XS.seawall, -7, Y + 0.15, 1, 5); b.face(FERRY.t + 102, L, XS.seawall, -7, Y + 0.15, 1, 5);
  b.face(FERRY.t - 102, FERRY.t + 102, FERRY.s - 14, -7, Y + 0.16, 1, 5);
  // piers you can walk out on
  const walkPiers = PIERS.filter(p => p.kind === 'walk');
  for (const p of walkPiers) {
    // built as a strip along its own axis, from the seawall out into the bay
    const [sx, sz] = wfPoint(p.t, XS.seawall), [ex, ez] = wfPoint(p.t, XS.seawall + p.len);
    const dx = ex - sx, dz = ez - sz, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, px = -uz, pz = ux;
    const base = b.pos.length / 3, hw = p.w / 2;
    for (const [f, o] of [[0, -hw], [0, hw], [1, -hw], [1, hw]]) { b.pos.push(sx + dx * f + px * o, Y + 0.12, sz + dz * f + pz * o); b.nor.push(0, 1, 0); b.info.push(o, f * len, 6); }
    b.idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    for (const side of [-1, 1]) {   // pier edges
      const bb = b.pos.length / 3;
      for (const [f, y] of [[0, -3], [0, Y + 0.12], [1, -3], [1, Y + 0.12]]) { b.pos.push(sx + dx * f + px * hw * side, y, sz + dz * f + pz * hw * side); b.nor.push(px * side, 0, pz * side); b.info.push(0, f * len, 5); }
      b.idx.push(bb, bb + 2, bb + 1, bb + 1, bb + 2, bb + 3);
    }
    // walk on it
    city.colliders.addSolid(sx + dx / 2, sz + dz / 2, len + 2, p.w, Math.atan2(uz, ux), -9, Y + 0.15, 'pier');
    for (const side of [-1, 1]) city.colliders.addBox(sx + dx / 2 + px * (hw + 0.1) * side, sz + dz / 2 + pz * (hw + 0.1) * side, len, 0.25, Math.atan2(uz, ux), Y - 1, Y + 1.25, 'rail');
    city.colliders.addBox(ex + ux * 0.2, ez + uz * 0.2, 0.25, p.w + 0.4, Math.atan2(uz, ux), Y - 1, Y + 1.25, 'rail');
    p.axis = { sx, sz, ex, ez, ux, uz, px, pz, len };
  }
  fixWinding(b);
  const deck = b.mesh(mat); deck.frustumCulled = false; group.add(deck);

  // walk on the whole corridor (overlapping boxes so the bends have no gaps)
  for (let t = 0; t < L; t += 12) {
    const tm = Math.min(L, t + 6), [cx, cz, ang] = wfPoint(tm, (XS.landEdge + XS.seawall) / 2);
    city.colliders.addSolid(cx, cz, 20, XS.seawall - XS.landEdge + 0.4, ang, -9, Y + 0.15, 'embarcadero');
  }
  { const [cx, cz, ang] = wfPoint(FERRY.t, (XS.seawall + FERRY.s - 14) / 2); city.colliders.addSolid(cx, cz, 206, FERRY.s - 14 - XS.seawall + 1, ang, -9, Y + 0.16, 'plaza'); }
  // the railing on the seawall: black steel, with a gap at the plaza and at the walkable piers
  const railOpen = t => Math.abs(t - FERRY.t) < 102 || walkPiers.some(p => Math.abs(t - p.t) < p.w / 2 + 0.3) || PIERS.some(p => p.kind === 'shed' && Math.abs(t - p.t) < p.w / 2);
  const railPos = [], postPos = [];
  const addRail = (t0, t1, s) => {
    for (let t = t0; t < t1; t += 2) {
      if (railOpen(t + 1)) continue;
      const [x0, z0] = wfPoint(t, s), [x1, z1] = wfPoint(Math.min(t1, t + 2), s);
      for (const h of [0.35, 0.75, 1.1]) railPos.push(x0, Y + 0.15 + h, z0, x1, Y + 0.15 + h, z1);
      postPos.push([x0, z0]);
      const [cx, cz, ang] = wfPoint(t + 1, s);
      city.colliders.addBox(cx, cz, 2.1, 0.3, ang, Y - 1, Y + 1.3, 'rail');
    }
  };
  addRail(0, FERRY.t - 102, XS.seawall - 0.3); addRail(FERRY.t + 102, L, XS.seawall - 0.3);
  // plaza edge railing along the water in front of the Ferry Building ends
  for (const e of [-1, 1]) { const [cx, cz, ang] = wfPoint(FERRY.t + e * 102, (XS.seawall + FERRY.s - 14) / 2); city.colliders.addBox(cx, cz, 0.3, FERRY.s - 14 - XS.seawall, ang, Y - 1, Y + 1.3, 'rail'); }
  // across the two ends of the boulevard, so nobody walks off into the bay where the decks stop
  for (const t of [1.5, L - 1.5]) { const [cx, cz, ang] = wfPoint(t, (4 + XS.seawall) / 2); city.colliders.addBox(cx, cz, 0.3, XS.seawall - 4, ang, Y - 1, Y + 1.3, 'rail'); }
  for (const p of walkPiers) {
    const a = p.axis;
    for (let f = 0; f < a.len; f += 2) for (const side of [-1, 1]) {
      const x0 = a.sx + a.ux * f + a.px * p.w / 2 * side, z0 = a.sz + a.uz * f + a.pz * p.w / 2 * side;
      const x1 = x0 + a.ux * Math.min(2, a.len - f), z1 = z0 + a.uz * Math.min(2, a.len - f);
      for (const h of [0.35, 0.75, 1.1]) railPos.push(x0, Y + 0.15 + h, z0, x1, Y + 0.15 + h, z1);
      postPos.push([x0, z0]);
    }
  }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3));
  group.add(new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0x1d2224 })));
  const post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 1.15, 0.07).translate(0, Y + 0.15 + 0.575, 0), landmarkMaterial({ color: 0x1d2224, roughness: 0.5, metalness: 0.5 }), postPos.length);
  const m4 = new THREE.Matrix4();
  postPos.forEach(([x, z], i) => { m4.makeTranslation(x, 0, z); post.setMatrixAt(i, m4); });
  post.frustumCulled = false; group.add(post);

  // Canary Island palms down both sides of the median
  const palmPos = [];
  for (let t = 14; t < L - 10; t += 24) for (const s of [-4.9, 4.9]) {
    if (CROSSINGS.some(c => Math.abs(c - t) < 8)) continue;
    const [x, z] = wfPoint(t + (s > 0 ? 12 : 0), s); palmPos.push([x, z]);
  }
  const palms = new THREE.InstancedMesh(canaryPalm(), landmarkMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), palmPos.length);
  const q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3(), yA = new THREE.Vector3(0, 1, 0);
  palmPos.forEach(([x, z], i) => { q.setFromAxisAngle(yA, i * 2.1); const k = 0.9 + ((i * 0.37) % 1) * 0.3; sc.set(k, k, k); v.set(x, Y + 0.18, z); m4.compose(v, q, sc); palms.setMatrixAt(i, m4); city.colliders.addCircle(x, z, 0.6, Y - 1, Y + 12, 'palm'); });
  palms.frustumCulled = false; group.add(palms);

  // lamps: tall black posts with lanterns, along the promenade and the inland sidewalk
  const lampPos = [];
  for (let t = 10; t < L; t += 30) { if (!railOpen(t)) lampPos.push(wfPoint(t, XS.seawall - 1.6)); lampPos.push(wfPoint(t + 15, XS.landEdge + 1.4)); }
  for (const p of walkPiers) for (let f = 20; f < p.axis.len; f += 30) for (const side of [-1, 1]) lampPos.push([p.axis.sx + p.axis.ux * f + p.axis.px * (p.w / 2 - 0.5) * side, p.axis.sz + p.axis.uz * f + p.axis.pz * (p.w / 2 - 0.5) * side]);
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.13, 7, 8).translate(0, 3.5, 0);
  const armGeo = new THREE.BoxGeometry(0.9, 0.07, 0.07).translate(0.45, 7, 0);
  const lampGeo = mergeGeometries([poleGeo, armGeo].map(g => g.toNonIndexed()));
  const poles = new THREE.InstancedMesh(lampGeo, landmarkMaterial({ color: 0x1f2426, roughness: 0.5, metalness: 0.5 }), lampPos.length);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe4b0 });
  const heads = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.2, 0.55, 8).translate(0.85, 6.7, 0), glowMat, lampPos.length);
  lampPos.forEach(([x, z], i) => { m4.makeTranslation(x, Y + 0.15, z); poles.setMatrixAt(i, m4); heads.setMatrixAt(i, m4); city.colliders.addCircle(x, z, 0.2, Y - 1, Y + 7, 'lamp'); });
  poles.frustumCulled = heads.frustumCulled = false; group.add(poles, heads);

  // overhead wire for the streetcars, on poles in the median
  const wire = [], wpoles = [];
  for (let t = 0; t < L; t += 6) for (const s of [-2, 2]) { const [x0, z0] = wfPoint(t, s), [x1, z1] = wfPoint(Math.min(L, t + 6), s); wire.push(x0, Y + 5.9, z0, x1, Y + 5.9, z1); }
  for (let t = 20; t < L; t += 40) { const [x, z, ang] = wfPoint(t, 0); wpoles.push([x, z, ang]); const [a0x, a0z] = wfPoint(t, -2.4), [a1x, a1z] = wfPoint(t, 2.4); wire.push(a0x, Y + 6.1, a0z, a1x, Y + 6.1, a1z); city.colliders.addCircle(x, z, 0.18, Y - 1, Y + 7, 'pole'); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
  group.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x2a2a2a })));
  const wp = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 6.4, 6).translate(0, 3.2, 0), landmarkMaterial({ color: 0x3a3f42, metalness: 0.4 }), wpoles.length);
  wpoles.forEach(([x, z], i) => { m4.makeTranslation(x, Y + 0.18, z); wp.setMatrixAt(i, m4); });
  wp.frustumCulled = false; group.add(wp);

  // the piers: bulkhead buildings on the Embarcadero, long sheds behind them over the water
  const shedMat = landmarkMaterial({ color: 0xcfc8b8, roughness: 0.85 }), roofMat = landmarkMaterial({ color: 0x6f7a74, roughness: 0.6, metalness: 0.3 });
  for (const p of PIERS) {
    if (p.kind !== 'shed') continue;
    const [sx, sz] = wfPoint(p.t, XS.seawall), [ex, ez] = wfPoint(p.t, XS.seawall + p.len);
    const dx = ex - sx, dz = ez - sz, len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
    const pg = new THREE.Group(); pg.position.set(sx, 0, sz); pg.rotation.y = -ang; group.add(pg);
    const h = p.len > 100 ? 11 : 8;
    const shed = new THREE.Mesh(new THREE.BoxGeometry(len - 8, h, p.w), shedMat); shed.position.set(8 + (len - 8) / 2, Y + h / 2, 0); pg.add(shed);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(p.w * 0.62, p.w * 0.62, len - 8, 4, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 4), roofMat);
    roof.scale.set(1, 0.18, 1.12); roof.position.set(8 + (len - 8) / 2, Y + h, 0); pg.add(roof);
    const deckM = new THREE.Mesh(new THREE.BoxGeometry(len, 1.2, p.w + 2), landmarkMaterial({ color: 0x77726a })); deckM.position.set(len / 2, Y - 0.6, 0); pg.add(deckM);
    // the bulkhead: a classical front with the pier's number over the arch
    const tex = bulkheadTexture(p.n), fw = Math.min(p.w, 60);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(fw, 14), landmarkMaterial({ map: tex, roughness: 0.8 })); front.position.set(-0.05, Y + 7, 0); front.rotation.y = -Math.PI / 2; pg.add(front);
    const fb = new THREE.Mesh(new THREE.BoxGeometry(8, 14, fw), shedMat); fb.position.set(4, Y + 7, 0); pg.add(fb);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(9, 1, fw + 1), landmarkMaterial({ color: 0xc9bca2 })); cornice.position.set(4, Y + 14.3, 0); pg.add(cornice);
    const cx = sx + dx / 2, cz = sz + dz / 2;
    city.colliders.addBox(cx, cz, len, Math.max(fw, p.w), ang, -8, Y + 16, 'pier');
  }

  // Cupid's Span in Rincon Park
  { const [x, z, ang] = wfPoint((RINCON.t0 + RINCON.t1) / 2 + 10, 30); const c = cupidsSpan(); c.position.set(x, Y + 0.2, z); c.rotation.y = -ang + 0.6; group.add(c);   // set at an angle across the lawn, so you see the whole bow from the promenade
    city.colliders.addCircle(x, z, 2.2, Y - 1, Y + 20, 'sculpture'); }
  // the Vaillancourt Fountain at the foot of Embarcadero Plaza
  { const [x, z] = toXZ(37.79530, -122.39520); const f = vaillancourtFountain(); const y = city.heightAt(x, z); f.position.set(x, y, z); group.add(f); city.colliders.addCircle(x, z, 21, y - 1, y + 1.2, 'fountain'); city.colliders.addCircle(x, z, 9, y - 1, y + 18, 'fountain'); }
  // the Hyatt Regency
  { const [x, z] = toXZ(37.79430, -122.39590); const h = hyattRegency(); const y = city.heightAt(x, z); const a = wfPoint(FERRY.t - 60, 0)[2] - Math.PI / 2; h.position.set(x, y, z); h.rotation.y = -a; h.scale.set(0.85, 1, 0.8); group.add(h); city.colliders.addBox(x, z, 60, 44, a, y - 1, y + 60, 'hyatt'); }

  // the F-line: vintage streetcars in the liveries of the cities that sold them to Muni
  const liveries = [[0xe07b2a, 0xf1e6c8], [0x2f6b4a, 0xe8e2c8], [0xc8b04a, 0x7a2a22], [0x8a1f2a, 0xe8dcc0], [0x2d4b7a, 0xdad6c8]];
  const cars = liveries.map((l, i) => { const c = streetcar(l); group.add(c); return { g: c, t: (i / liveries.length) * L, dir: i % 2 ? -1 : 1, v: 7 + (i % 3) }; });
  // gulls wheeling over the water
  const gullMat = new THREE.MeshBasicMaterial({ color: 0xf2f2ee, side: THREE.DoubleSide });
  const gullGeo = new THREE.BufferGeometry(); gullGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.9, 0.15, 0, 0, 0, 0.1, 0, 0, -0.1, 0.9, 0.15, 0, 0, 0, 0.1, 0, 0, -0.1], 3));
  const gulls = Array.from({ length: 9 }, (_, i) => { const m = new THREE.Mesh(gullGeo, gullMat); group.add(m); return { m, t: (i / 9) * L, r: 18 + (i % 4) * 7, ph: i * 1.7, h: 9 + (i % 3) * 5 }; });

  group.userData.update = (time, dt, px, pz) => {
    for (const c of cars) {
      c.t += c.dir * c.v * dt; if (c.t > L - 20) { c.t = L - 20; c.dir = -1; } if (c.t < 20) { c.t = 20; c.dir = 1; }
      // stop briefly at each crossing, like the real line's platforms
      const near = CROSSINGS.find(k => Math.abs(k - c.t) < 3);
      if (near !== undefined && !c.wait) { c.wait = 6; c.lastStop = near; }
      if (c.wait) { c.t -= c.dir * c.v * dt; c.wait = Math.max(0, c.wait - dt); if (c.wait === 0) c.t += c.dir * 4; }
      const s = c.dir > 0 ? 2 : -2, [x, z, ang] = wfPoint(c.t, s);
      c.g.position.set(x, Y + 0.18, z); c.g.rotation.y = -ang + (c.dir > 0 ? 0 : Math.PI);
    }
    for (const g of gulls) {
      const a = time * 0.25 + g.ph, [cx, cz] = wfPoint(g.t + Math.sin(time * 0.02 + g.ph) * 60, XS.seawall + 25);
      g.m.position.set(cx + Math.cos(a) * g.r, Y + g.h + Math.sin(a * 2) * 1.5, cz + Math.sin(a) * g.r);
      g.m.rotation.y = -a; g.m.scale.y = 1 + Math.sin(time * 9 + g.ph) * 0.8;
    }
    glowMat.color.setRGB(1, 0.89, 0.7).multiplyScalar(0.45 + U.uNight.value * 2.6);
  };
  group.traverse(o => { if (o.isMesh) o.userData.caster = true; });
  deck.userData.caster = false;
  return group;
}
