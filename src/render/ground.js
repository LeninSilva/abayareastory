// The ground of Jiquilpan: the valley and the mountains around it (three rings of detail), the streets
// (cobblestone in the centro, asphalt on the highways, poured concrete and dirt toward the edges), the
// river channel through town, and the fields and forests from the land-cover map.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';

export const LAMP_SP = 30, LAMP_PH = 7, LAMP_MINW = 8, LAMP_REACH = 0.8, FRONTAGE = 0;
const SW = 1.6;
const FINISH = /* glsl */`
  #include <tonemapping_fragment>
  #include <colorspace_fragment>`;

/* ---------------- terrain ---------------- */
function coverTexture(city) {
  const c = city.coverM, t = new THREE.DataTexture(city.cover, c.n, c.n, THREE.RedFormat);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
const TERRAIN_FRAG = GLSL_COMMON + /* glsl */`
uniform sampler2D uCover; uniform vec4 uCoverBox; varying vec3 vW; varying vec3 vN;
float coverAt(vec2 p){
  vec2 uv = (p - uCoverBox.xy) / (uCoverBox.zw - uCoverBox.xy);
  if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return -1.;
  return floor(texture2D(uCover, uv).r * 255. + .5);
}
void main(){
  vec3 n = normalize(vN);
  // dither the lookup a little so the edges of fields and woods are ragged, not pixel steps
  vec2 jit = (vec2(vnoise(vW.xz * .09), vnoise(vW.zx * .09 + 7.)) - .5) * 14.;
  float cv = coverAt(vW.xz + jit);
  float slope = 1. - n.y, nz = fbm(vW.xz * .02), nz2 = vnoise(vW.xz * .35), nz3 = vnoise(vW.xz * 1.7);
  float alt = vW.y;
  // late September: the rains have made the hills green; the valley floor is fields
  vec3 grass = mix(vec3(.34,.46,.18), vec3(.46,.52,.22), nz) * (.9 + .2 * nz2);
  vec3 forest = mix(vec3(.13,.24,.10), vec3(.20,.32,.13), nz2) * (.85 + .3 * nz3);
  vec3 shrub = mix(vec3(.33,.38,.18), vec3(.42,.40,.22), nz2);
  vec3 soil = mix(vec3(.50,.30,.19), vec3(.60,.42,.28), nz2);   // the red earth of Michoacán
  vec3 dirt = mix(vec3(.46,.40,.32), vec3(.56,.50,.40), nz2);
  vec3 crop = mix(vec3(.38,.52,.16), vec3(.58,.56,.24), step(.5, fract(floor(vW.x / 60. + nz * 3.) * .37 + floor(vW.z / 45.) * .61)));
  crop *= .9 + .12 * step(.5, fract((vW.x * .8 + vW.z * .6) / 1.2));   // furrows
  vec3 col;
  if (cv < -.5) {
    // beyond the town map: forest on the steep slopes and heights, fields on the flats
    float woods = smoothstep(.12, .3, slope) + smoothstep(250., 500., alt) * .7 + (nz - .5) * .6;
    col = mix(mix(crop, grass, smoothstep(40., 140., alt)), forest, clamp(woods, 0., 1.));
    col = mix(col, soil, smoothstep(.45, .7, slope) * .6);
  }
  else if (cv < .5) col = mix(grass, crop, smoothstep(.4, .6, nz));
  else if (cv < 1.5) col = mix(dirt, mix(vec3(.55,.52,.47), grass, .35), smoothstep(.3, .7, fbm(vW.xz * .12)));   // patios, lots, courtyards
  else if (cv < 2.5) col = forest;
  else if (cv < 3.5) col = mix(shrub, soil, smoothstep(.55, .8, nz3) * .5);
  else if (cv < 4.5) col = crop;
  else if (cv < 5.5) col = soil;
  else if (cv < 6.5) col = grass;
  else if (cv < 7.5) col = mix(vec3(.24,.40,.15), vec3(.32,.48,.18), nz2);        // parks
  else if (cv < 8.5) col = mix(vec3(.28,.50,.20), vec3(.34,.56,.24), step(.5, fract(vW.x / 6.)));   // pitches
  else if (cv < 9.5) col = vec3(.16,.24,.26);                                     // ponds
  else if (cv < 10.5) col = mix(vec3(.70,.66,.58), soil, nz2 * .5);               // quarry
  else col = mix(dirt, grass, .5);
  col = mix(col, soil * .9, smoothstep(.55, .8, slope));                          // bare cuts on the steepest ground
  n = bump(n, vW, .9, .45);
  float sh = shadowAt(vW, n);
  vec3 lit = lightItS(col, n, 1., sh) + specIt(n, vW, .92, sh, .03) * .5;
  gl_FragColor = vec4(fogIt(lit, vW), 1.);` + FINISH + '\n}';

function terrainPatch(city, x0, z0, x1, z1, step, hole, drop) {
  const nx = Math.max(2, Math.round((x1 - x0) / step) + 1), nz = Math.max(2, Math.round((z1 - z0) / step) + 1);
  const pos = new Float32Array(nx * nz * 3), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + (x1 - x0) * i / (nx - 1), z = z0 + (z1 - z0) * j / (nz - 1), k = (j * nx + i) * 3;
    pos[k] = x; pos[k + 1] = city.heightAt(x, z); pos[k + 2] = z;
  }
  const inHole = (x, z) => hole && x > hole[0] && x < hole[2] && z > hole[1] && z < hole[3];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    const cx = pos[a * 3] + step / 2, cz = pos[a * 3 + 2] + step / 2;
    if (inHole(cx - step, cz - step) && inHole(cx + step, cz + step)) continue;
    idx.push(a, c, b, b, c, d);
  }
  // where an outer ring overlaps the next one in, sink it so the finer ring always wins
  if (hole && drop) for (let k = 0; k < nx * nz; k++) { const x = pos[k * 3], z = pos[k * 3 + 2]; if (x > hole[0] - step && x < hole[2] + step && z > hole[1] - step && z < hole[3] + step) pos[k * 3 + 1] -= drop; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
export function makeTerrain(city, quality) {
  const group = new THREE.Group(), c = city.coverM;
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uCover: { value: coverTexture(city) }, uCoverBox: { value: new THREE.Vector4(c.x0, c.z0, c.x1, c.z1) } }, U),
    vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: TERRAIN_FRAG
  });
  const q = quality === 'low' ? 2 : 1;
  const T = city.demTown, M = city.demMid, R = city.demRegion;
  const townBox = [T.x0 + 40, T.z0 + 40, T.x1 - 40, T.z1 - 40], midBox = [M.x0 + 200, M.z0 + 200, M.x1 - 200, M.z1 - 200];
  // the town ring in tiles, so what's behind you isn't drawn
  const TILES = 6, tw = (T.x1 - T.x0) / TILES, td = (T.z1 - T.z0) / TILES;
  for (let j = 0; j < TILES; j++) for (let i = 0; i < TILES; i++) {
    const m = new THREE.Mesh(terrainPatch(city, T.x0 + i * tw, T.z0 + j * td, T.x0 + (i + 1) * tw, T.z0 + (j + 1) * td, 9 * q), mat); m.receiveShadow = true; group.add(m);
  }
  const mid = new THREE.Mesh(terrainPatch(city, M.x0, M.z0, M.x1, M.z1, 24 * q, townBox, 4), mat); group.add(mid);
  const reg = new THREE.Mesh(terrainPatch(city, R.x0, R.z0, R.x1, R.z1, 120 * q, midBox, 12), mat); group.add(reg);
  return group;
}

/* ---------------- the river channel and the streams ---------------- */
export function makeStreams(city) {
  const pos = [], nor = [], info = [], idx = [];
  for (const s of city.streams) {
    const big = s.cls === 'river' || s.cls === 'canal', w = big ? 7 : 2.2, P = s.pts;
    if (P.length < 2) continue;
    let prev = -1;
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
      const base = pos.length / 3;
      for (const o of [-w / 2 - (big ? 1.2 : 0.4), -w / 2, w / 2, w / 2 + (big ? 1.2 : 0.4)]) {
        const x = P[i][0] + tz * o, z = P[i][1] - tx * o, edge = Math.abs(o) > w / 2 + 0.01;
        pos.push(x, city.heightAt(x, z) + (edge ? 0.25 : 0.08), z); nor.push(0, 1, 0); info.push(edge ? 1 : 0, big ? 1 : 0);
      }
      if (prev >= 0) for (let k = 0; k < 3; k++) idx.push(prev + k, base + k, prev + k + 1, prev + k + 1, base + k, base + k + 1);
      prev = base;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -8,
    vertexShader: 'attribute vec2 aInfo; varying vec3 vW; varying vec2 vI; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vI = aInfo; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: GLSL_COMMON + `varying vec3 vW; varying vec2 vI;
void main(){
  vec3 n = vec3(0., 1., 0.);
  vec3 col;
  if (vI.x > .5) col = mix(vec3(.62,.60,.56), vec3(.70,.68,.62), vnoise(vW.xz * 3.));          // the channel's concrete lip
  else {
    float w = vnoise(vW.xz * .8 + uTime * vec2(.3, .2)) * .5 + vnoise(vW.xz * 2.3 - uTime * .4) * .5;
    col = mix(vec3(.16,.22,.20), vec3(.26,.32,.28), w);
    vec3 V = normalize(vW - uCamPos); float F = pow(1. - abs(V.y), 4.);
    col = mix(col, mix(uSkyHorizon, uSkyTop, .4), F * .5);
  }
  if (vI.x < .5) n = normalize(vec3((vnoise(vW.xz * 1.3 + uTime * .6) - .5) * .25, 1., (vnoise(vW.zx * 1.3 - uTime * .5) - .5) * .25));
  gl_FragColor = vec4(fogIt(lightIt(col, n, 1.) + (vI.x < .5 ? specIt(n, vW, .07, shadowAt(vW, n), .02) : vec3(0.)), vW), 1.);` + FINISH + '\n}'
  });
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}

/* ---------------- streets ---------------- */
// surfaces: 0 asphalt, 1 cobblestone (empedrado), 2 dirt, 3 stone paving, 4 poured concrete, 5 laja (flagstone), 6 rocky mountain road
function surfaceOf(st, x, z) {
  const d = Math.hypot(x + 60, z + 20), h = Math.abs(Math.sin(st.pts.length * 12.9898 + st.pts[0][0] * 0.0137) * 43758.5453) % 1;
  if (st.rocky) return 6;
  if (st.kind === 4) return d < 750 ? 5 : 3;
  if (st.kind === 1 || st.kind === 3) return d < 700 ? 3 : 2;
  if (st.kind === 2) return 3;
  if (st.width >= 12.5) return 0;
  if (d < 750) return h < 0.55 ? 5 : h < 0.88 ? 1 : 4;
  if (d < 1700) return h < 0.35 ? 1 : h < 0.8 ? 4 : 0;
  return h < 0.45 ? 2 : h < 0.75 ? 4 : 1;
}
export function makeStreets(city, skip) {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: U, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
    vertexShader: /* glsl */`attribute vec4 aInfo; attribute float aSurf; varying vec3 vW; varying vec4 vInfo; varying vec3 vN; varying float vSurf;
    void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vInfo = aInfo; vN = normal; vSurf = aSurf; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
varying vec3 vW; varying vec4 vInfo; varying vec3 vN; varying float vSurf;   // x: across 0..1 on the road (metres from the centre on sidewalks), y: metres along, z: kind, w: width
vec2 hash22(vec2 p){ return vec2(hash12(p), hash12(p + 19.19)); }
// river stones set in mortar: distance to the nearest and second-nearest stone centre
vec3 cobble(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.; vec2 id = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = hash22(i + g) * .8 + .1, r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = i + g; } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(d2) - sqrt(d1), hash12(id), hash12(id + 3.7));
}
vec3 lampPools(float along, float off, float w){
  if (w < ${LAMP_MINW}. || uNight < .05) return vec3(0.);
  float k0 = floor((along - ${LAMP_PH}.) / ${LAMP_SP}.), acc = 0.;
  for (int i = 0; i < 3; i++) {
    float k = k0 + float(i) - 1.;
    float la = k * ${LAMP_SP}. + ${LAMP_PH}., side = mod(k, 2.) < .5 ? -1. : 1.;
    vec2 d = vec2(along - la, off - side * (w * .5 - ${SW} - ${LAMP_REACH}));
    acc += exp(-dot(d, d) / 45.) + .2 * exp(-dot(d, d) / 300.);
  }
  return vec3(1., .80, .55) * acc * 1.5 * uNight;
}
void main(){
  float kind = floor(vInfo.z + .25), a = vInfo.x, along = vInfo.y, w = floor(vInfo.w + .5), surf = floor(vSurf + .5);
  vec3 n = normalize(vN);
  float dcam = length(vW - uCamPos), fine = 1. - smoothstep(12., 45., dcam);
  float nz = vnoise(vW.xz * 1.3), big = fbm(vW.xz * .15);
  vec3 col;
  if (kind < .5) {                                   // banqueta: poured concrete, scuffed, with joints
    col = mix(vec3(.66,.64,.60), vec3(.74,.72,.67), nz * .6 + big * .4);
    col *= 1. - .10 * step(.95, abs(fract(along / 1.2) - .5) * 2.);
    col *= 1. - .08 * smoothstep(.65, 1., fbm(vW.xz * .7));
  } else if (kind < 1.5) {                           // the roadway
    float c = abs(a - .5) * (w - ${2 * SW});
    if (surf < .5) {                                 // asphalt
      col = mix(vec3(.19,.19,.20), vec3(.27,.27,.27), nz * .5 + big * .5);
      col *= 1. - .1 * smoothstep(.6, .9, fbm(vW.xz * .4 + 3.));
      if (w >= 12.) col = mix(col, vec3(.86,.72,.25), (1. - smoothstep(.06, .12, abs(c - .15))) * .85);   // the centre line
      col = mix(col, vec3(.85,.85,.8), (1. - smoothstep(.06, .12, abs(c - (w * .5 - ${SW} - .35)))) * .7);   // edge lines
    } else if (surf < 1.5) {                         // empedrado: river stones in grey mortar
      vec3 cb = cobble(vW.xz / .2);
      vec3 stone = mix(vec3(.42,.38,.34), vec3(.62,.58,.52), cb.y) * mix(.85, 1.1, cb.z);
      vec3 mortar = vec3(.36,.34,.31);
      col = mix(mix(mortar, stone, smoothstep(.02, .12, cb.x)), mix(vec3(.46,.43,.39), vec3(.52,.49,.44), nz), 1. - fine);
      // the smooth stone wheel-tracks down some centro streets
      col = mix(col, mix(vec3(.62,.58,.53), vec3(.70,.66,.60), nz), (1. - smoothstep(.35, .5, abs(abs(c) - 1.1))) * step(.5, fract(w * .37)) * .9);
    } else if (surf < 2.5) {                         // terracería: packed earth and gravel, ruts
      col = mix(vec3(.50,.40,.30), vec3(.60,.50,.38), nz * .6 + big * .4) * (.9 + .15 * vnoise(vW.xz * 9.) * fine);
      col *= 1. - .1 * (1. - smoothstep(.2, .6, abs(abs(c) - 1.)));
    } else if (surf > 4.5 && surf < 5.5) {           // laja: big irregular flagstones, rust and ochre, thin dark joints
      vec3 cb = cobble(vW.xz / .75);
      vec3 stone = mix(vec3(.55,.36,.28), vec3(.72,.52,.40), cb.y) * mix(.82, 1.12, cb.z);
      stone = mix(stone, vec3(.62,.56,.50), step(.78, cb.z) * .6);
      col = mix(mix(vec3(.24,.20,.18), stone, smoothstep(.015, .06, cb.x)), mix(vec3(.58,.42,.33), vec3(.64,.48,.38), nz), (1. - fine) * .8);
    } else if (surf > 5.5) {                         // the cerro road: loose rock and dust, stones pushed to the edges
      vec3 cb = cobble(vW.xz / .55);
      vec3 rock = mix(vec3(.40,.37,.34), vec3(.60,.56,.50), cb.y) * mix(.8, 1.1, cb.z);
      vec3 dust = mix(vec3(.54,.44,.33), vec3(.64,.54,.42), nz * .6 + big * .4);
      float rocks = smoothstep(.35, .75, cb.z + abs(c) / (w * .5 + .01) * .45) * smoothstep(.02, .1, cb.x);
      col = mix(dust, rock, rocks * fine + .35 * (1. - fine));
    } else if (surf < 3.5) {                         // stone paving (andadores, the malecón)
      vec2 q = vec2(along / .6, a * w / .4 + floor(along / .6) * .5);
      col = mix(vec3(.60,.52,.44), vec3(.70,.62,.52), hash12(floor(q))) ;
      col *= 1. - .25 * max(step(.93, fract(q.x)), step(.93, fract(q.y))) * fine;
    } else {                                         // poured concrete in slabs
      col = mix(vec3(.62,.61,.58), vec3(.70,.69,.66), nz * .5 + big * .5);
      col *= 1. - .2 * max(step(.985, fract(along / 3.)), step(.97, fract(a * 2.))) * fine;
      col *= 1. - .08 * smoothstep(.6, .9, fbm(vW.xz * .5));
    }
    // topes: speed bumps painted yellow and black, every so often on the side streets
    float tp = fract(along / 140. + w * .13), bump = step(.996, tp) * step(w, 12.) * step(5., w) * (1. - step(2.5, surf) * step(surf, 3.5));
    col = mix(col, mix(vec3(.9,.75,.15), vec3(.1), step(.5, fract(a * w / .8))), bump * .9);
    // tyre wear
    col *= 1. - .05 * smoothstep(.25, .0, abs(fract(a * w / 3.2) - .5));
  } else {                                            // curb face: concrete, painted yellow in stretches
    col = vec3(.70,.69,.66) * (.9 + .1 * nz);
    col = mix(col, vec3(.86,.70,.18), step(.72, fract(along / 37.)) * .9);
  }
  // relief and sheen: river stones polished by tyres, asphalt a little glossy, concrete matte
  float rough = .8;
  if (kind > .5 && kind < 1.5) {
    if (surf > .5 && surf < 1.5) { n = bump(n, vW, 5., .45); rough = .42; }
    else if (surf < .5) { n = bump(n, vW, 9., .1); rough = .62; }
    else if (surf < 2.5) { n = bump(n, vW, 3., .35); rough = .95; }
    else if (surf > 4.5 && surf < 5.5) { n = bump(n, vW, 2.2, .32); rough = .55; }
    else if (surf > 5.5) { n = bump(n, vW, 2.4, .7); rough = .92; }
    else n = bump(n, vW, 4., .12);
  } else n = bump(n, vW, 7., .06);
  float shS = shadowAt(vW, n);
  vec3 lit = lightItS(col, n, 1., shS) + specIt(n, vW, rough, shS, .04);
  float off = kind < .5 ? vInfo.x : (vInfo.x - .5) * (vInfo.w - ${2 * SW});
  if (kind < 1.5) lit += col * lampPools(along, off, w);
  gl_FragColor = vec4(fogIt(lit, vW), 1.);` + FINISH + '\n}'
  });
  const CH = 1000, buckets = new Map();
  const bucket = (x, z) => { const k = Math.floor((x + 12000) / CH) * 100 + Math.floor((z + 12000) / CH); if (!buckets.has(k)) buckets.set(k, { pos: [], nor: [], info: [], surf: [], idx: [] }); return buckets.get(k); };
  const ROAD = 0.08, WALK = 0.22, hits = [];
  function classify(si, x, z) {
    let inRoad = false, inWalk = false, yield_ = false;
    for (const h of city.streetsAt(x, z, hits)) {
      if (h.si === si) continue;
      const other = city.streets[h.si], a = Math.abs(h.d), roadHalf = other.kind === 0 ? h.half - SW : h.half;
      if (a < roadHalf) { inRoad = true; if (other.width > city.streets[si].width || (other.width === city.streets[si].width && h.si < si)) yield_ = true; }
      else inWalk = true;
    }
    return { inRoad, inWalk, yield_ };
  }
  for (let si = 0; si < city.streets.length; si++) {
    const s = city.streets[si], walkable = s.kind !== 0;
    const pts = []; let probe = null;
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 2));
      for (let k = i === 1 ? 0 : 1; k <= n; k++) {
        const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n, c = classify(si, x, z), sk = !!(skip && skip(x, z));
        const last = pts[pts.length - 1], key = (c.inRoad ? 1 : 0) + (c.inWalk ? 2 : 0) + (c.yield_ ? 4 : 0) + (sk ? 8 : 0);
        const cur = { x, z, y: city.heightAt(x, z), c, skip: sk, key };
        if (last && key !== last.key && probe && probe !== last) pts.push(probe);
        const far = !last || Math.hypot(x - last.x, z - last.z) >= 6 || k === n;
        if (far || key !== last.key) pts.push(cur);
        probe = cur;
      }
    }
    if (pts.length < 2) continue;
    for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const L = Math.hypot(b.x - a.x, b.z - a.z) || 1; pts[i].tx = (b.x - a.x) / L; pts[i].tz = (b.z - a.z) / L; }
    let along = 0; for (let i = 0; i < pts.length; i++) { if (i) along += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); pts[i].along = along; }
    const half = s.width / 2, roadHalf = walkable ? half : half - SW, surf = surfaceOf(s, pts[0].x, pts[0].z);
    const B = bucket(pts[0].x, pts[0].z);
    const strip = (o0, o1, lift, kind, keep, metric) => {
      let prev = -1;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], base = B.pos.length / 3;
        for (const [o, u] of [[o0, 0], [o1, 1]]) {
          const x = p.x + p.tz * o, z = p.z - p.tx * o;
          B.pos.push(x, Math.max(city.heightAt(x, z), p.y - 0.4) + lift, z); B.nor.push(0, 1, 0);
          B.info.push(metric ? o : u, p.along, kind, s.width); B.surf.push(surf);
        }
        if (prev >= 0 && keep(pts[i - 1]) && keep(p)) B.idx.push(prev, base, prev + 1, prev + 1, base, base + 1);
        prev = base;
      }
    };
    const curb = (o, keep) => {
      let prev = -1; const face = Math.sign(o);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], base = B.pos.length / 3, x = p.x + p.tz * o, z = p.z - p.tx * o, g = Math.max(city.heightAt(x, z), p.y - 0.4);
        const nx = -p.tz * face, nz = p.tx * face;
        B.pos.push(x, g + ROAD, z, x, g + WALK, z); B.nor.push(nx, 0, nz, nx, 0, nz); B.info.push(0, p.along, 2, 0, 1, p.along, 2, 0); B.surf.push(0, 0);
        if (prev >= 0 && keep(pts[i - 1]) && keep(p)) { if (face > 0) B.idx.push(prev, base, prev + 1, prev + 1, base, base + 1); else B.idx.push(prev, prev + 1, base, prev + 1, base + 1, base); }
        prev = base;
      }
    };
    const roadKeep = p => !p.skip && !p.c.yield_;
    const walkKeep = p => !p.skip && !p.c.inRoad;
    if (walkable) { strip(-half, half, walkable && s.kind === 4 ? WALK * 0.5 : ROAD, 1, roadKeep); continue; }
    strip(-roadHalf, roadHalf, ROAD, 1, roadKeep);
    strip(-half, -roadHalf, WALK, 0, walkKeep, true);
    strip(roadHalf, half, WALK, 0, walkKeep, true);
    curb(-roadHalf, walkKeep); curb(roadHalf, walkKeep);
  }
  for (const B of buckets.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(B.info, 4));
    g.setAttribute('aSurf', new THREE.Float32BufferAttribute(B.surf, 1));
    g.setIndex(B.idx); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; group.add(m);
  }
  return group;
}
