// Instanced buildings with a procedural facade shader styled per district.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';
import { STYLES, TOWERS } from '../geo.js';

// style id → [floor height, window density, commercial ground floor, glass tower, bay windows]
const S = STYLES;
const TOWER_ID = 30, STONE_TOWER_ID = 31;

const VERT = /* glsl */`
attribute vec4 aStyle;          // style id, seed (0..1), houses, unused
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vSc; varying vec4 vStyle;
void main(){
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
  vW = w.xyz; vL = position; vLN = normal; vSc = sc; vStyle = aStyle;
  vN = normalize(mat3(modelMatrix * instanceMatrix) * (normal / sc));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = GLSL_COMMON + /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vSc; varying vec4 vStyle;
vec3 pal(float style, float r){
  // palettes per district (hand-picked from the streets themselves)
  if (style == 1. || style == 2.) { // Victorians and Edwardians: painted
    vec3 c[8]; c[0]=vec3(.78,.62,.70); c[1]=vec3(.55,.70,.76); c[2]=vec3(.88,.80,.55); c[3]=vec3(.60,.72,.55); c[4]=vec3(.85,.66,.52); c[5]=vec3(.64,.60,.80); c[6]=vec3(.90,.86,.78); c[7]=vec3(.42,.52,.66);
    return c[int(r * 7.99)];
  }
  if (style == 5. || style == 3. || style == 6. || style == 7.) { // stucco: the Sunset, the Marina, the Excelsior
    vec3 c[6]; c[0]=vec3(.92,.88,.80); c[1]=vec3(.88,.80,.74); c[2]=vec3(.78,.84,.84); c[3]=vec3(.90,.84,.68); c[4]=vec3(.83,.78,.86); c[5]=vec3(.80,.86,.76);
    return c[int(r * 5.99)];
  }
  if (style == 10.) return mix(vec3(.62,.30,.24), vec3(.86,.80,.68), step(.55, r));          // Chinatown brick and cream
  if (style == 11.) { vec3 c[5]; c[0]=vec3(.86,.45,.35); c[1]=vec3(.95,.78,.45); c[2]=vec3(.45,.62,.72); c[3]=vec3(.88,.86,.78); c[4]=vec3(.60,.72,.50); return c[int(r*4.99)]; } // the Mission
  if (style == 12. || style == 15.) return mix(mix(vec3(.55,.30,.24), vec3(.68,.64,.58), step(.5, r)), vec3(.44,.52,.56), step(.8, r)); // warehouses
  if (style == 4.) return mix(vec3(.93,.90,.84), vec3(.84,.80,.72), r);                        // mansions
  if (style == 17.) return vec3(.94,.92,.88);                                                   // Presidio barracks
  if (style == 16.) return mix(vec3(.90,.86,.76), vec3(.80,.76,.66), r);
  if (style == ${TOWER_ID}.) return mix(vec3(.46,.56,.64), vec3(.36,.46,.56), r);             // glass
  return mix(mix(vec3(.80,.76,.68), vec3(.66,.64,.62), r), vec3(.74,.70,.62), step(.7, r));    // stone downtown
}
void main(){
  float style = floor(vStyle.x + .5), seed = vStyle.y, houses = max(1., vStyle.z);
  vec3 ln = vLN; vec3 n = normalize(vN);
  float up = vL.y * vSc.y;
  vec3 col;
  bool roof = ln.y > .5;
  bool front = abs(ln.z) > .5;                   // faces toward and away from the street
  float along = front ? (vL.x + .5) * vSc.x : (vL.z + .5) * vSc.z;
  float faceW = front ? vSc.x : vSc.z;
  float hIdx = front ? floor((vL.x + .5) * houses) : 0.;
  float r = hash12(vec2(seed * 97.1 + hIdx * 13.7, style));
  vec3 base = pal(style, r);
  if (roof) {
    col = mix(vec3(.36,.34,.33), vec3(.46,.43,.40), vnoise(vW.xz * .4));
    if (style == 3. || style == 17. || style == 4.) col = mix(col, vec3(.62,.34,.26), .6);    // tile roofs
    float edge = min(min(vL.x + .5, .5 - vL.x) * vSc.x, min(vL.z + .5, .5 - vL.z) * vSc.z);
    col = mix(base * .8, col, smoothstep(.3, .9, edge));                                        // parapet
  } else {
    bool glass = style == ${TOWER_ID}.;
    float fh = (style >= 12. && style != 16. && style != 17.) || style == 30. || style == 31. ? 3.9 : 3.15;
    if (style == 14. || style == 13.) fh = 3.8;
    float fl = floor(up / fh), fy = fract(up / fh);
    float houseW = faceW / (front ? houses : max(1., floor(faceW / 7.)));
    float hx = fract(along / houseW);
    float cols = max(2., floor(houseW / 2.4));
    float cx = fract(hx * cols);
    float win = step(.22, cx) * step(cx, .78) * step(.28, fy) * step(fy, .82);
    bool shopfront = (style == 9. || style == 10. || style == 11. || style == 13. || style == 14.) && fl < 1.;
    if (shopfront) win = step(.08, cx) * step(cx, .92) * step(.12, fy) * step(fy, .86);
    if (glass) win = step(.06, fract(along / 1.6)) * step(.1, fy);
    col = base;
    // Victorian trim: floor lines, window casings, a cornice
    if (style <= 2.) {
      float trim = (1. - step(.06, fy)) + (1. - step(.94, fy)) * 0. + step(.16, cx) * step(cx, .84) * step(.2, fy) * step(fy, .9) * (1. - win);
      col = mix(col, vec3(.95,.93,.88), clamp(trim, 0., 1.) * .8);
      // bay window: the middle bays read a little lighter, as if stepping out toward the street
      if (front && hx > .15 && hx < .6) col *= 1.08;
    }
    float top = vSc.y - up;
    col = mix(col, col * 1.18 + .05, (1. - smoothstep(.3, .9, top)));                            // cornice
    if (fl > .5 || shopfront) {
      vec3 glassC = mix(vec3(.16,.22,.30), mix(uSkyHorizon, uSkyTop, .5) * .55, .45);
      float lit = step(.62, hash12(vec2(floor(along / (houseW / cols)) + seed * 31., fl + hIdx * 7.))) * uNight;
      glassC = mix(glassC, vec3(1.,.78,.45) * 1.4, lit);
      col = mix(col, glassC, win);
    } else if (!shopfront) {
      // ground floor of a house: a door and a garage in the Sunset, stoops elsewhere
      float door = step(.72, hx) * step(hx, .86) * step(fy, .78);
      col = mix(col, col * .45, door);
      if (style == 5. || style == 6. || style == 7.) col = mix(col, vec3(.72,.70,.66), step(.12, hx) * step(hx, .55) * step(fy, .72));
    }
    // separation between houses in a row
    col *= 1. - .18 * (1. - smoothstep(.0, .015, min(hx, 1. - hx))) * step(1.5, houses);
    col *= mix(.72, 1., smoothstep(0., 2.5, up));                                                  // ground contact
  }
  vec3 lit = lightIt(col, n, 1.);
  // windows glow on their own at night
  gl_FragColor = vec4(fogIt(lit, vW), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function makeBuildings(city, quality) {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG });
  const CH = 800, buckets = new Map();
  const put = (x, z, item) => { const k = Math.floor((x + city.half) / CH) * 1000 + Math.floor((z + city.half) / CH); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(item); };
  for (const b of city.buildings) put(b.x, b.z, { x: b.x, y: b.y - 4, z: b.z, w: b.w, d: b.d, h: b.h + 4, ang: b.ang, style: b.styleId, seed: b.seed / 255, houses: b.houses });
  // named towers: a shaft and a setback crown
  for (const t of TOWERS) {
    if (t.round) continue;
    const y = city.heightAt(t.x, t.z), glass = t.h > 140 && !/Russ|Shell|Mark Hopkins|Fairmont|Hallidie/.test(t.name);
    const st = glass ? TOWER_ID : STONE_TOWER_ID;
    put(t.x, t.z, { x: t.x, y: y - 4, z: t.z, w: t.w, d: t.d, h: t.h * 0.86 + 4, ang: 0, style: st, seed: (t.h % 7) / 7, houses: 1 });
    put(t.x, t.z, { x: t.x, y: y + t.h * 0.86, z: t.z, w: t.w * 0.72, d: t.d * 0.72, h: t.h * 0.14, ang: 0, style: st, seed: 0.3, houses: 1 });
    city.colliders.addBox(t.x, t.z, t.w, t.d, 0, y - 2, y + t.h, 'tower');
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (const items of buckets.values()) {
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    const st = new Float32Array(items.length * 4);
    let maxH = 0;
    items.forEach((b, i) => {
      // three.js yaw is counter-clockwise looking down; our angle is measured from +x toward +z
      q.setFromAxisAngle(yAxis, -b.ang); v.set(b.x, b.y, b.z); s.set(b.w, b.h, b.d);
      m4.compose(v, q, s); mesh.setMatrixAt(i, m4);
      st.set([b.style, b.seed, b.houses, 0], i * 4); maxH = Math.max(maxH, b.h);
    });
    mesh.geometry = geo.clone();
    mesh.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(st, 4));
    mesh.computeBoundingSphere();
    mesh.userData.maxH = maxH;
    group.add(mesh);
  }
  group.userData.update = cam => {
    const far = quality === 'low' ? 2200 : quality === 'medium' ? 3400 : 5200;
    for (const m of group.children) {
      const bs = m.boundingSphere; if (!bs) continue;
      const d = bs.center.distanceTo(cam.position) - bs.radius;
      m.visible = d < (m.userData.maxH > 60 ? 14000 : far);
    }
  };
  return group;
}
