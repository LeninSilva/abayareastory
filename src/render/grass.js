// Grass: clumps of curved blades on the lawns, parks, fields and hillsides around you, swaying in the wind,
// darker at the root, lit and shadowed like everything else, and fading out into the terrain at the edge.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';
import { CLEAR } from '../geo.js';

function clumpGeometry() {
  // six blades per clump, each a bent strip of four segments; aBlade: x = height along the blade (0..1), y = random
  const pos = [], nor = [], bl = [], idx = []; let base = 0;
  for (let b = 0; b < 6; b++) {
    const a = b / 6 * Math.PI * 2 + b * 0.7, r = 0.12 + (b % 3) * 0.06, w = 0.045, h = 0.45 + (b % 4) * 0.12, bend = 0.12 + (b % 2) * 0.1;
    const ox = Math.cos(a) * r, oz = Math.sin(a) * r, tx = -Math.sin(a), tz = Math.cos(a);
    for (let s = 0; s <= 4; s++) {
      const t = s / 4, ww = w * (1 - t * 0.85), y = h * t, off = bend * t * t;
      for (const side of [-1, 1]) {
        pos.push(ox + tx * ww * side + Math.cos(a) * off, y, oz + tz * ww * side + Math.sin(a) * off);
        nor.push(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4); bl.push(t, (b * 0.37) % 1);
      }
      if (s < 4) { const k = base + s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    base += 10;
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aBlade', new THREE.Float32BufferAttribute(bl, 2)); g.setIndex(idx);
  return g;
}

export function makeGrass(city, quality) {
  const RADIUS = quality === 'cinematic' ? 75 : quality === 'high' ? 55 : 38, STEP = quality === 'cinematic' ? 0.7 : 0.85;
  const CAP = Math.ceil(Math.PI * RADIUS * RADIUS / (STEP * STEP) * 0.8);
  const geo = clumpGeometry();
  const inst = new Float32Array(CAP * 4);                 // x, y, z, scale+colour seed
  const attr = new THREE.InstancedBufferAttribute(inst, 4); attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aInst', attr); geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uRadius: { value: RADIUS } }, U), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aBlade; attribute vec4 aInst; uniform float uTime, uRadius; uniform vec3 uCamPos;
      varying vec3 vW; varying vec2 vB; varying float vSeed; varying float vFade;
      void main(){
        float sc = floor(aInst.w), seed = fract(aInst.w);
        vec3 p = position * vec3(1., .7 + sc * .15, 1.);
        float ang = seed * 6.283; p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
        // wind: a slow gust field sweeping across, plus a quick flutter
        vec3 w = aInst.xyz + p;
        float gust = sin(w.x * .08 + uTime * 1.3) * cos(w.z * .06 + uTime * .9) * .5 + .5;
        float sway = aBlade.x * aBlade.x * (.18 + .25 * gust);
        w.x += sway * cos(uTime * 1.7 + aInst.x * .3) ; w.z += sway * sin(uTime * 1.3 + aInst.z * .3) * .6;
        float d = distance(aInst.xz, uCamPos.xz); vFade = 1. - smoothstep(uRadius * .6, uRadius, d);
        w.y -= (1. - vFade) * .6;   // sink into the ground at the edge instead of popping
        vW = w; vB = aBlade; vSeed = seed;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vW; varying vec2 vB; varying float vSeed; varying float vFade;
      void main(){
        if (vFade < .02) discard;
        vec3 tip = mix(vec3(.46,.58,.22), vec3(.66,.64,.30), step(.72, vSeed));      // some blades gone to seed, gold
        vec3 root = vec3(.14,.22,.08);
        vec3 col = mix(root, tip, smoothstep(0., .9, vB.x)) * (.85 + .3 * vSeed);
        vec3 n = normalize(vec3(0., 1., 0.) + (uSunDir * .3));
        float sh = shadowAt(vW, vec3(0., 1., 0.));
        vec3 lit = lightItS(col, n, mix(.45, 1., vB.x), sh);
        // light through the blades when you look toward the sun
        vec3 V = normalize(vW - uCamPos);
        lit += uSunColor * col * pow(max(dot(V, uSunDir), 0.), 4.) * .9 * sh * vB.x * (1. - uNight);
        gl_FragColor = vec4(fogIt(lit, vW), 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  const clear = CLEAR.map(([x, z, hw, hd]) => ({ x, z, hw, hd }));
  const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // chunks of 16 m, computed once and kept
  const CH = 16, cache = new Map(), hits = [];
  function chunk(ci, cj) {
    const key = ci * 100000 + cj; let c = cache.get(key); if (c) return c;
    const out = [];
    for (let j = 0; j < CH / STEP; j++) for (let i = 0; i < CH / STEP; i++) {
      const gi = ci * CH / STEP + i, gj = cj * CH / STEP + j, r1 = hash(gi, gj), r2 = hash(gj, gi + 7);
      const x = gi * STEP + r1 * STEP, z = gj * STEP + r2 * STEP;
      const cv = city.coverAt(x, z);
      // lawns, parks, pitches, fields, scrub and open country; a little in the town's yards
      const dens = cv === 6 || cv === 7 || cv === 8 ? 1 : cv === 0 || cv === 4 ? 0.85 : cv === 3 ? 0.6 : cv === 2 ? 0.35 : cv === 1 ? 0.12 : 0;
      if (hash(gi + 3, gj + 11) > dens) continue;
      if (city.streetsAt(x, z, hits).length) continue;
      if (clear.some(q => Math.abs(x - q.x) < q.hw && Math.abs(z - q.z) < q.hd)) continue;
      let inside = false; city.colliders.query(x, z, 0.3, it => { if (!inside && it.type === 'box' && it.tag === 'building') { const dx = x - it.x, dz = z - it.z, lx = dx * it.c + dz * it.s, lz = -dx * it.s + dz * it.c; if (Math.abs(lx) < it.hw + .3 && Math.abs(lz) < it.hd + .3) inside = true; } }); if (inside) continue;
      out.push(x, city.heightAt(x, z) - 0.02, z, Math.floor(1 + hash(gi + 5, gj) * 3) + hash(gi, gj + 9) * 0.999);
    }
    c = new Float32Array(out); cache.set(key, c); if (cache.size > 900) cache.delete(cache.keys().next().value);
    return c;
  }
  let lx = 1e9, lz = 1e9;
  mesh.userData.update = (px, pz, agl) => {
    mesh.visible = agl < 40; if (!mesh.visible) return;
    if (Math.hypot(px - lx, pz - lz) < 6) return; lx = px; lz = pz;
    let n = 0; const r = Math.ceil(RADIUS / CH), ci = Math.floor(px / CH), cj = Math.floor(pz / CH);
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const cx = (ci + di + 0.5) * CH, cz = (cj + dj + 0.5) * CH; if (Math.hypot(cx - px, cz - pz) > RADIUS + CH) continue;
      const c = chunk(ci + di, cj + dj);
      for (let k = 0; k < c.length && n < CAP; k += 4) { if ((c[k] - px) ** 2 + (c[k + 2] - pz) ** 2 > RADIUS * RADIUS) continue; inst.set(c.subarray(k, k + 4), n * 4); n++; }
    }
    geo.instanceCount = n; attr.needsUpdate = true;
  };
  return mesh;
}
