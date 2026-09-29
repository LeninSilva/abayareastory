// Terrain, bay water, streets and the distant hills.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';
import { DISTRICT_STYLE, PARKS, toXZ } from '../geo.js';

const FINISH = /* glsl */`
  #include <tonemapping_fragment>
  #include <colorspace_fragment>`;

/* ---- land cover: parks, streets-and-yards, sand ---- */
function coverTexture(city) {
  const N = city.landN, C = (2 * city.half) / N, data = new Uint8Array(N * N * 4);
  const parks = PARKS.map(p => { const [x, z] = toXZ(p.lat, p.lon); return { x, z, r: p.r, lake: p.lake }; });
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = -city.half + (i + 0.5) * C, z = -city.half + (j + 0.5) * C, k = (j * N + i) * 4;
    const v = city.land[j * N + i];
    if (!v) continue;
    const d = v === 255 ? 'Alcatraz' : city.districts[v - 1];
    let park = DISTRICT_STYLE[d] === 'park' || d === 'Presidio' ? 1 : 0;
    for (const p of parks) if ((x - p.x) ** 2 + (z - p.z) ** 2 < p.r * p.r) { park = 1; break; }
    // sand along the ocean and bay beaches: low ground next to water
    let nearWater = false;
    for (let dj = -2; dj <= 2 && !nearWater; dj++) for (let di = -2; di <= 2; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < N && jj < N && !city.land[jj * N + ii]) { nearWater = true; break; } }
    const h = city.heightAt(x, z);
    const sand = nearWater && h < 8 && (x < -5200 || d === 'Presidio' || d === 'Marina') ? 1 : (x < -5600 && h < 14 ? 1 : 0);
    data[k] = park * 255; data[k + 1] = park ? 0 : 255; data[k + 2] = sand * 255; data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}
function depthTexture(city) {
  const N = city.demN, data = new Uint8Array(N * N);
  for (let k = 0; k < N * N; k++) { const h = city.dem[k]; data[k] = h > 0.5 ? 0 : Math.min(255, Math.round(8 + (-h) / 12 * 247)); }
  const t = new THREE.DataTexture(data, N, N, THREE.RedFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}

export function makeTerrain(city, quality) {
  const group = new THREE.Group();
  const N = city.demN, C = (2 * city.half) / N, step = quality === 'low' ? 2 : 1;
  const cover = coverTexture(city);
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uCover: { value: cover }, uHalf: { value: city.half } }, U),
    vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
uniform sampler2D uCover; uniform float uHalf; varying vec3 vW; varying vec3 vN;
void main(){
  vec3 n = normalize(vN); vec2 uv = (vW.xz + uHalf) / (2. * uHalf);
  vec4 cov = texture2D(uCover, uv);
  float nz = fbm(vW.xz * .045), nz2 = vnoise(vW.xz * .6);
  vec3 lush = mix(vec3(.24,.40,.17), vec3(.36,.50,.20), nz);
  vec3 golden = mix(vec3(.58,.54,.28), vec3(.47,.50,.25), nz2);
  vec3 grass = mix(lush, golden, smoothstep(60., 170., vW.y) * .7 + smoothstep(.6, .9, nz) * .25);
  // city ground: yards, gardens and paving between the houses
  vec3 yards = mix(vec3(.42,.40,.35), vec3(.30,.44,.22), smoothstep(.3, .65, fbm(vW.xz * .09)) * .85);
  vec3 col = mix(yards, grass, cov.r);
  col = mix(col, mix(vec3(.84,.77,.60), vec3(.76,.68,.52), nz2), cov.b);
  float slope = 1. - n.y;
  col = mix(col, mix(vec3(.46,.40,.33), vec3(.56,.50,.42), nz), smoothstep(.28, .5, slope));
  if (vW.y < .6) col = mix(col, vec3(.40,.37,.30), smoothstep(.6, -.5, vW.y));
  float ao = .85 + .15 * nz;
  vec3 lit = lightIt(col, n, ao);
  gl_FragColor = vec4(fogIt(lit, vW), 1.);` + FINISH + '\n}'
  });
  const CH = 30;                                // cells per chunk
  for (let cj = 0; cj < N; cj += CH) for (let ci = 0; ci < N; ci += CH) {
    const w = Math.min(CH, N - 1 - ci), h = Math.min(CH, N - 1 - cj);
    if (w <= 0 || h <= 0) continue;
    // skip chunks that are entirely deep water
    let any = false; for (let j = cj; j <= cj + h && !any; j++) for (let i = ci; i <= ci + w; i++) if (city.dem[j * N + i] > -6) { any = true; break; }
    if (!any) continue;
    const cols = Math.floor(w / step) + 1, rows = Math.floor(h / step) + 1;
    const pos = new Float32Array(cols * rows * 3), nor = new Float32Array(cols * rows * 3), idx = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = ci + c * step, j = cj + r * step, k = (r * cols + c) * 3;
      const x = -city.half + (i + 0.5) * C, z = -city.half + (j + 0.5) * C;
      pos[k] = x; pos[k + 1] = city.dem[j * N + i]; pos[k + 2] = z;
      const hl = city.dem[j * N + Math.max(0, i - 1)], hr = city.dem[j * N + Math.min(N - 1, i + 1)], hu = city.dem[Math.max(0, j - 1) * N + i], hd = city.dem[Math.min(N - 1, j + 1) * N + i];
      const nx = hl - hr, nz = hu - hd, ny = 2 * C, L = Math.hypot(nx, ny, nz);
      nor[k] = nx / L; nor[k + 1] = ny / L; nor[k + 2] = nz / L;
    }
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1; idx.push(a, d, b, b, d, e); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
    g.computeBoundingSphere();
    group.add(new THREE.Mesh(g, mat));
  }
  return group;
}

export function makeWater(city) {
  const depth = depthTexture(city);
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uDepth: { value: depth }, uHalf: { value: city.half } }, U),
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
uniform sampler2D uDepth; uniform float uHalf; varying vec3 vW;
void main(){
  vec2 uv = (vW.xz + uHalf) / (2. * uHalf);
  float inside = step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
  float dep = mix(1., texture2D(uDepth, uv).r, inside);
  vec2 p = vW.xz * .045;
  float w1 = fbm(p + vec2(uTime * .05, uTime * .03)), w2 = fbm(p * 2.3 - vec2(uTime * .07, -uTime * .02));
  vec3 n = normalize(vec3((w1 - .5) * .5 + (w2 - .5) * .3, 1., (w2 - .5) * .5));
  vec3 v = normalize(uCamPos - vW);
  float fres = pow(1. - max(dot(n, v), 0.), 4.);
  vec3 deep = mix(vec3(.05,.17,.24), vec3(.08,.12,.2), uNight);
  vec3 shallow = vec3(.17,.40,.40);
  vec3 col = mix(shallow, deep, smoothstep(.02, .45, dep));
  vec3 sky = mix(uSkyHorizon, uSkyTop, .35);
  col = mix(col, sky, fres * .75);
  vec3 h = normalize(uSunDir + v);
  col += uSunColor * pow(max(dot(n, h), 0.), 180.) * 2.2 * (1. - uNight * .7);
  // surf where the bottom rises to the shore
  float shore = smoothstep(.16, .02, dep) * inside;
  float foam = shore * smoothstep(.55, .75, fbm(vW.xz * .25 + vec2(uTime * .3, 0.)) + sin(dep * 60. - uTime * 1.6) * .25);
  col = mix(col, vec3(.92,.94,.9), clamp(foam, 0., 1.) * .8);
  gl_FragColor = vec4(fogIt(col, vW), 1.);` + FINISH + '\n}'
  });
  const g = new THREE.PlaneGeometry(60000, 60000, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.y = 0.0; m.frustumCulled = false; m.renderOrder = -1;
  return m;
}

export function makeStreets(city) {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: U, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
    vertexShader: /* glsl */`attribute vec3 aInfo; varying vec3 vW; varying vec3 vInfo; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vInfo = aInfo; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
varying vec3 vW; varying vec3 vInfo;   // x: across 0..1, y: metres along, z: kind (0 sidewalk, 1 road) + width*0.01
void main(){
  float kind = floor(vInfo.z + .001), width = fract(vInfo.z + .001) * 100.;
  float a = vInfo.x, along = vInfo.y, nz = vnoise(vW.xz * 1.3);
  vec3 col;
  if (kind < .5) {
    col = mix(vec3(.66,.63,.58), vec3(.72,.69,.63), nz);
    float joint = step(.94, fract(along / 1.6)) + step(.97, fract(a * 4.));
    col *= 1. - .12 * min(joint, 1.);
  } else {
    col = mix(vec3(.19,.2,.23), vec3(.25,.25,.27), nz * .7 + fbm(vW.xz * .2) * .3);
    float edge = min(a, 1. - a) * width;
    col = mix(vec3(.55,.54,.5), col, smoothstep(.25, .45, edge));          // gutter
    if (width >= 23.) { float c = abs(a - .5) * width; col = mix(col, vec3(.86,.72,.25), (1. - smoothstep(.1, .2, abs(c - .2))) * .9); }
    else { float c = abs(a - .5) * width; col = mix(col, vec3(.85,.85,.8), (1. - smoothstep(.06, .12, c)) * step(.5, fract(along / 9.)) * .8); }
  }
  vec3 lit = lightIt(col, vec3(0.,1.,0.), 1.);
  gl_FragColor = vec4(fogIt(lit, vW), 1.);` + FINISH + '\n}'
  });
  // one geometry per 1.5 km chunk so off-screen streets are culled
  const CH = 1500, buckets = new Map();
  const bucket = (x, z) => { const k = Math.floor((x + city.half) / CH) * 100 + Math.floor((z + city.half) / CH); if (!buckets.has(k)) buckets.set(k, { pos: [], info: [], idx: [] }); return buckets.get(k); };
  function ribbon(B, pts, halfW, lift, kind, width) {
    const base = B.pos.length / 3; let along = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
      if (i) along += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      for (const s of [-1, 1]) {
        const x = p[0] - tz * halfW * s, z = p[1] + tx * halfW * s;
        B.pos.push(x, Math.max(city.heightAt(x, z), p[2]) + lift, z);
        B.info.push(s < 0 ? 0 : 1, along, kind + width * 0.01);
      }
      if (i) { const q = base + (i - 1) * 2; B.idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  for (const s of city.streets) {
    // resample to ~8 m so the ribbon follows the hills
    const pts = [];
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 8));
      for (let k = i === 1 ? 0 : 1; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n; pts.push([x, z, city.heightAt(x, z)]); }
    }
    if (pts.length < 2) continue;
    const B = bucket(pts[0][0], pts[0][1]);
    ribbon(B, pts, s.width / 2, 0.32, 0, s.width);
    ribbon(B, pts, s.width / 2 - 3.2, 0.4, 1, s.width - 6.4);
  }
  for (const B of buckets.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(B.info, 3));
    g.setIndex(B.idx); g.computeBoundingSphere();
    group.add(new THREE.Mesh(g, mat));
  }
  return group;
}

/* The hills beyond the city: Marin Headlands, Mount Tamalpais, Angel Island, the East Bay, San Bruno Mountain. */
export function makeBackdrop() {
  const hills = [
    { lat: 37.8440, lon: -122.5050, rx: 3200, rz: 1800, h: 300 },   // Marin Headlands
    { lat: 37.8560, lon: -122.4650, rx: 1600, rz: 1400, h: 250 },
    { lat: 37.9230, lon: -122.5970, rx: 5200, rz: 3400, h: 784 },   // Mount Tamalpais
    { lat: 37.8610, lon: -122.4320, rx: 1300, rz: 1200, h: 240 },   // Angel Island
    { lat: 37.8200, lon: -122.2300, rx: 4500, rz: 9000, h: 420 },   // Berkeley/Oakland hills
    { lat: 37.7700, lon: -122.1800, rx: 5000, rz: 7000, h: 480 },
    { lat: 37.6870, lon: -122.4320, rx: 3800, rz: 1600, h: 400 },   // San Bruno Mountain
    { lat: 37.8520, lon: -122.3700, rx: 900, rz: 500, h: 30 }       // the Berkeley shore
  ];
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`varying vec3 vW; varying vec3 vN;
void main(){ vec3 col = mix(vec3(.30,.36,.22), vec3(.55,.50,.30), smoothstep(80., 420., vW.y) * .6 + fbm(vW.xz * .002) * .3);
  gl_FragColor = vec4(fogIt(lightIt(col, normalize(vN), 1.), vW), 1.);` + FINISH + '\n}'
  });
  const group = new THREE.Group();
  for (const hh of hills) {
    const g = new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); const n = Math.sin(x * 7 + z * 5) * 0.06 + Math.sin(x * 13 - z * 11) * 0.03; p.setY(i, Math.pow(y, 1.6) * (1 + n)); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); const [x, z] = toXZ(hh.lat, hh.lon);
    m.position.set(x, -8, z); m.scale.set(hh.rx, hh.h, hh.rz);
    group.add(m);
  }
  return group;
}
