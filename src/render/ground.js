// Terrain, bay water, streets and the distant hills.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';
import { DISTRICT_STYLE, PARKS, toXZ } from '../geo.js';

// street lamps and frontage paving (shared with the close-up street furniture in detail.js)
export const LAMP_SP = 32, LAMP_PH = 8, LAMP_MINW = 12, LAMP_REACH = 1.2, FRONTAGE = 3.5;
const SIDEWALK = 3.2;
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
  vec3 yards = mix(vec3(.36,.34,.30), vec3(.22,.33,.16), smoothstep(.3, .65, fbm(vW.xz * .09)) * .8);
  yards = mix(yards, vec3(.46,.44,.40), smoothstep(.55, .8, vnoise(vW.xz * .25)) * .5);   // paved yards and driveways
  vec3 col = mix(yards, grass, cov.r);
  col = mix(col, mix(vec3(.84,.77,.60), vec3(.76,.68,.52), nz2), cov.b);
  float slope = 1. - n.y;
  col = mix(col, mix(vec3(.46,.40,.33), vec3(.56,.50,.42), nz), smoothstep(.28, .5, slope));
  if (vW.y < .6) col = mix(col, vec3(.40,.37,.30), smoothstep(.6, -.5, vW.y));
  float ao = .85 + .15 * nz;
  vec3 lit = lightItS(col, n, ao, shadowAt(vW, n));
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
// a sum of travelling waves (analytic slopes), fading the small ones with distance so the bay never shimmers
vec2 waves(vec2 p, float dist){
  vec2 g = vec2(0.);
  float t = uTime;
  // the long swell comes in through the Gate from the west; chop runs with the afternoon wind
  vec4 W[7];
  W[0] = vec4(normalize(vec2(-1., .25)), 38., .22);
  W[1] = vec4(normalize(vec2(-.8, -.5)), 21., .14);
  W[2] = vec4(normalize(vec2(-.3, 1.)), 11., .07);
  W[3] = vec4(normalize(vec2(.9, .4)), 6.3, .04);
  W[4] = vec4(normalize(vec2(-.6, .8)), 3.7, .022);
  W[5] = vec4(normalize(vec2(.2, -1.)), 2.1, .012);
  W[6] = vec4(normalize(vec2(-1., -.1)), 1.2, .006);
  for (int i = 0; i < 7; i++) {
    float L = W[i].z, k = 6.2832 / L, w = sqrt(9.81 * k);
    float fade = 1. - smoothstep(L * 25., L * 90., dist);
    float ph = dot(W[i].xy, p) * k - w * t * .6;
    g += W[i].xy * (W[i].w * k * cos(ph)) * fade;
  }
  // wind ripples
  float r = smoothstep(260., 40., dist);
  g += (vec2(vnoise(p * .9 + t * .35), vnoise(p * .9 - t * .3 + 7.)) - .5) * .35 * r;
  return g;
}
void main(){
  vec2 uv = (vW.xz + uHalf) / (2. * uHalf);
  float inside = step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
  float dep = mix(1., texture2D(uDepth, uv).r, inside);
  vec3 toCam = uCamPos - vW; float dist = length(toCam); vec3 v = toCam / dist;
  vec2 g = waves(vW.xz, dist);
  vec3 n = normalize(vec3(-g.x, 1., -g.y));
  // Schlick fresnel for water (F0 = 0.02)
  float cosv = max(dot(n, v), 0.);
  float F = .02 + .98 * pow(1. - cosv, 5.);
  // what the water reflects: the painted sky, the marine layer on the horizon, the sun
  vec3 r = reflect(-v, n); r.y = abs(r.y);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(r.y, 0., 1.), .5));
  sky = mix(sky, uFogColor, exp(-r.y * 9.) * .75);
  float sd = max(dot(r, uSunDir), 0.);
  vec3 sun = uSunColor * (pow(sd, 1400.) * 40. + pow(sd, 120.) * 1.4 + pow(sd, 12.) * .12) * (1. - uNight * .85);
  // the body of the bay: green-grey in the shallows, deep slate further out, lit from above
  vec3 shallow = vec3(.11, .23, .21), deep = vec3(.035, .085, .105);
  vec3 body = mix(shallow, deep, smoothstep(.02, .5, dep));
  body *= uAmbient * 1.1 + uSunColor * max(uSunDir.y, 0.) * .45 * (1. - uNight);
  // light through the crests of the swell
  body += vec3(.05, .12, .1) * clamp(g.x * 2. + g.y, 0., 1.) * (1. - uNight) * (1. - F);
  vec3 col = mix(body, sky, F) + sun;
  // city lights on the water at night, broken up by the chop
  col += vec3(1., .72, .42) * uNight * .05 * smoothstep(.55, .95, vnoise(vec2(vW.x * .06, vW.z * .9) + g * 3.)) * smoothstep(1500., 200., dist);
  // surf where the bottom comes up to meet the shore
  float shore = smoothstep(.1, .01, dep) * inside;
  float lines = sin(dep * 90. - uTime * 1.3 + fbm(vW.xz * .08) * 6.);
  float foam = shore * smoothstep(.55, .95, lines * .5 + .5) * (.6 + .4 * fbm(vW.xz * .3 + uTime * .1));
  col = mix(col, vec3(.9, .93, .92) * (uAmbient + uSunColor * .6), clamp(foam, 0., 1.) * .75);
  gl_FragColor = vec4(fogIt(col, vW), 1.);` + FINISH + '\n}'
  });
  const g = new THREE.PlaneGeometry(60000, 60000, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.y = 0.0; m.frustumCulled = false; m.renderOrder = -1;
  return m;
}

/* Streets: asphalt between curbs, raised sidewalks with a curb face, crosswalks where streets meet.
   Where two streets cross, only one paves the intersection and the sidewalks stop at the corner. */
export function makeStreets(city, skip) {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: U, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
    vertexShader: /* glsl */`attribute vec4 aInfo; varying vec3 vW; varying vec4 vInfo; varying vec3 vN;
    void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vInfo = aInfo; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
varying vec3 vW; varying vec4 vInfo; varying vec3 vN;   // x: across 0..1 on the road (metres from the centre on sidewalks), y: metres along, z: kind + crosswalk/2, w: street width
// the street lamps: one every ${LAMP_SP} m along each street, alternating sides; their light falls in pools
vec3 lampPools(float along, float off, float w){
  if (w < ${LAMP_MINW}. || uNight < .05) return vec3(0.);
  float k0 = floor((along - ${LAMP_PH}.) / ${LAMP_SP}.), acc = 0.;
  for (int i = 0; i < 3; i++) {
    float k = k0 + float(i) - 1.;
    float la = k * ${LAMP_SP}. + ${LAMP_PH}., side = mod(k, 2.) < .5 ? -1. : 1.;
    vec2 d = vec2(along - la, off - side * (w * .5 - ${SIDEWALK} - ${LAMP_REACH}));
    acc += exp(-dot(d, d) / 60.) + .25 * exp(-dot(d, d) / 400.);
  }
  return vec3(1., .78, .52) * acc * 1.6 * uNight;
}
void main(){
  float kind = floor(vInfo.z + .25), a = vInfo.x, along = vInfo.y;
  float cross = clamp((vInfo.z - kind) * 2., 0., 1.);
  float nz = vnoise(vW.xz * 1.3), big = fbm(vW.xz * .15);
  vec3 n = normalize(vN);
  vec3 col;
  if (kind < .5) {                                   // sidewalk: poured concrete in panels
    col = mix(vec3(.64,.62,.58), vec3(.72,.70,.65), nz * .6 + big * .4);
    float joint = (1. - smoothstep(.0, .04, abs(fract(along / 1.5) - .5) * 2. - .96)) ;
    col *= 1. - .10 * step(.965, abs(fract(along / 1.5) - .5) * 2.);
    col *= 1. - .06 * smoothstep(.7, 1., fbm(vW.xz * .7));   // weather stains
  } else if (kind < 1.5) {                           // asphalt
    float width = floor(vInfo.w + .5);
    col = mix(vec3(.17,.175,.19), vec3(.24,.24,.25), nz * .5 + big * .5);
    col *= 1. - .08 * smoothstep(.6, .9, fbm(vW.xz * .4 + 3.));  // patches
    float w = width;
    float c = abs(a - .5) * w;
    // lane lines: a double yellow on the big streets, a white dash on the rest
    if (w >= 22.) col = mix(col, vec3(.86,.70,.22), (1. - smoothstep(.08, .16, abs(c - .2))) * .85 * (1. - cross));
    else col = mix(col, vec3(.84,.84,.8), (1. - smoothstep(.05, .1, c)) * step(.55, fract(along / 9.)) * .75 * (1. - cross));
    // continental crosswalk bars
    float bars = step(.45, fract(a * w / 1.4));
    col = mix(col, vec3(.88,.88,.84), bars * smoothstep(.2, .6, cross) * .9);
    // tyre-worn darker lanes
    col *= 1. - .05 * smoothstep(.2, .0, abs(fract(a * w / 3.6) - .5));
  } else {                                            // curb face
    col = vec3(.70,.69,.66) * (.9 + .1 * nz);
  }
  vec3 lit = lightItS(col, n, 1., shadowAt(vW, n));
  float off = kind < .5 ? vInfo.x : (vInfo.x - .5) * (vInfo.w - ${2 * SIDEWALK});
  if (kind < 1.5) lit += col * lampPools(along, off, floor(vInfo.w + .5));
  gl_FragColor = vec4(fogIt(lit, vW), 1.);` + FINISH + '\n}'
  });
  const CH = 1500, buckets = new Map();
  const bucket = (x, z) => { const k = Math.floor((x + city.half) / CH) * 100 + Math.floor((z + city.half) / CH); if (!buckets.has(k)) buckets.set(k, { pos: [], nor: [], info: [], idx: [] }); return buckets.get(k); };
  const ROAD = 0.12, WALK = 0.3, SW = 3.2, hits = [];
  // for each sample: is it inside another street's roadway? inside another street's sidewalk band?
  function classify(si, x, z) {
    let inRoad = false, inWalk = false, yield_ = false;
    for (const h of city.streetsAt(x, z, hits)) {
      if (h.si === si) continue;
      const a = Math.abs(h.d), roadHalf = h.half - SW;
      if (a < roadHalf) { inRoad = true; const other = city.streets[h.si]; if (other.width > city.streets[si].width || (other.width === city.streets[si].width && h.si < si)) yield_ = true; }
      else inWalk = true;
    }
    return { inRoad, inWalk, yield_ };
  }
  for (let si = 0; si < city.streets.length; si++) {
    const s = city.streets[si];
    const pts = []; let probe = null;
    for (let i = 1; i < s.pts.length; i++) {
      // probe every 2 m, but only keep a point every 8 m, or wherever what's underfoot changes (a corner, a crosswalk)
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 2));
      for (let k = i === 1 ? 0 : 1; k <= n; k++) {
        const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n, c = classify(si, x, z), sk = !!(skip && skip(x, z));
        const last = pts[pts.length - 1], key = (c.inRoad ? 1 : 0) + (c.inWalk ? 2 : 0) + (c.yield_ ? 4 : 0) + (sk ? 8 : 0);
        const cur = { x, z, y: city.heightAt(x, z), c, skip: sk, key };
        if (last && key !== last.key && probe && probe !== last) pts.push(probe);   // end the old stretch exactly at the change
        const far = !last || Math.hypot(x - last.x, z - last.z) >= 8 || k === n;
        if (far || key !== last.key) pts.push(cur);
        probe = cur;
      }
    }
    if (pts.length < 2) continue;
    // tangents
    for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const L = Math.hypot(b.x - a.x, b.z - a.z) || 1; pts[i].tx = (b.x - a.x) / L; pts[i].tz = (b.z - a.z) / L; }
    let along = 0; for (let i = 0; i < pts.length; i++) { if (i) along += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); pts[i].along = along; }
    const half = s.width / 2, roadHalf = half - SW;
    const B = bucket(pts[0].x, pts[0].z);
    // one strip between offsets o0..o1 (metres from the centre line, + to the right) at a height, with a per-point keep test
    const strip = (o0, o1, lift, kind, keep, cw, metric) => {
      let prev = -1;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const base = B.pos.length / 3;
        for (const [o, u] of [[o0, 0], [o1, 1]]) {
          const x = p.x + p.tz * o, z = p.z - p.tx * o;
          B.pos.push(x, Math.max(city.heightAt(x, z), p.y - 0.5) + lift, z); B.nor.push(0, 1, 0);
          B.info.push(metric ? o : u, p.along, kind + (cw ? cw(p) : 0) * 0.5, s.width);
        }
        if (prev >= 0 && keep(pts[i - 1]) && keep(p)) B.idx.push(prev, base, prev + 1, prev + 1, base, base + 1);
        prev = base;
      }
    };
    // curb face: a vertical strip at offset o from road height up to sidewalk height, facing the road
    const curb = (o, keep) => {
      let prev = -1; const face = Math.sign(o);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], base = B.pos.length / 3, x = p.x + p.tz * o, z = p.z - p.tx * o, g = Math.max(city.heightAt(x, z), p.y - 0.5);
        const nx = -p.tz * face, nz = p.tx * face;
        B.pos.push(x, g + ROAD, z, x, g + WALK, z); B.nor.push(nx, 0, nz, nx, 0, nz); B.info.push(0, p.along, 2, 0, 1, p.along, 2, 0);
        if (prev >= 0 && keep(pts[i - 1]) && keep(p)) { if (face > 0) B.idx.push(prev, base, prev + 1, prev + 1, base, base + 1); else B.idx.push(prev, prev + 1, base, prev + 1, base + 1, base); }
        prev = base;
      }
    };
    const roadKeep = p => !p.skip && !p.c.yield_;
    const walkKeep = p => !p.skip && !p.c.inRoad;
    strip(-roadHalf, roadHalf, ROAD, 1, roadKeep, p => (p.c.inWalk && !p.c.inRoad ? 1 : 0));
    strip(-half, -roadHalf, WALK, 0, walkKeep, null, true);
    strip(roadHalf, half, WALK, 0, walkKeep, null, true);
    // frontage: paving from the back of the sidewalk to the building line, wherever there's room and no other street
    for (const side of [-1, 1]) {
      let prev = -1;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], base = B.pos.length / 3;
        let e = FRONTAGE; const ox = p.x + p.tz * side * (half + e), oz = p.z - p.tx * side * (half + e);
        if (city.streetsAt(ox, oz, hits).some(h => h.si !== si) || !city.isLand(ox, oz)) e = 0;
        for (const o of [side * half, side * (half + e)]) {
          const x = p.x + p.tz * o, z = p.z - p.tx * o;
          B.pos.push(x, Math.max(city.heightAt(x, z), p.y - 0.5) + WALK - 0.015, z); B.nor.push(0, 1, 0); B.info.push(o, p.along, 0, s.width);
        }
        if (prev >= 0 && walkKeep(pts[i - 1]) && walkKeep(p)) { if (side > 0) B.idx.push(prev, base, prev + 1, prev + 1, base, base + 1); else B.idx.push(prev, prev + 1, base, prev + 1, base + 1, base); }
        prev = base;
      }
    }
    curb(-roadHalf, walkKeep); curb(roadHalf, walkKeep);
  }
  for (const B of buckets.values()) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(B.info, 4));
    g.setIndex(B.idx); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; group.add(m);
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
