// People, the Hollows, and the player's own hands. Stylised figures with a sculpted, storybook silhouette.
import * as THREE from 'three';
import { landmarkMaterial } from './shaders.js';

const matCache = new Map();
function mat(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  if (!matCache.has(key)) matCache.set(key, landmarkMaterial(Object.assign({ color, roughness: 0.85 }, extra || {})));
  return matCache.get(key);
}
function mesh(geo, m, x = 0, y = 0, z = 0) { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); return me; }
const G = {
  capsule: (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10),
  sphere: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d)
};

/* the people themselves live in human.js */
export { makePerson } from './human.js';

/* The Hollows: the dead who have forgotten their names. Smoke with eyes. */
const hollowMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uTime: { value: 0 }, uHurt: { value: 0 } },
  vertexShader: /* glsl */`uniform float uTime; varying vec3 vP; varying vec3 vN; void main(){ vec3 p = position; p.x += sin(p.y * 3. + uTime * 2.) * .08 * (1. - p.y / 2.4); p.z += cos(p.y * 2.6 + uTime * 1.7) * .08; vP = p; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
  fragmentShader: /* glsl */`uniform float uTime, uHurt; varying vec3 vP; varying vec3 vN;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){ float rim = 1. - abs(vN.z); float s = n(vec2(atan(vP.z, vP.x) * 3., vP.y * 4. - uTime * 1.5)) * .6 + n(vec2(vP.x * 9., vP.y * 7. - uTime * 2.3)) * .4;
    float a = smoothstep(.0, .35, vP.y) * (.55 + .45 * s) * (1. - smoothstep(1.6, 2.4, vP.y) * .3);
    vec3 col = mix(vec3(.05,.06,.09), vec3(.35,.55,.62), rim * .8) + vec3(1.,.4,.3) * uHurt;
    gl_FragColor = vec4(col, a * (.55 + rim * .4)); }`
});
export function makeHollow() {
  const g = new THREE.Group();
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.55, 2.2, 16, 8, true).translate(0, 1.1, 0), hollowMat.clone());
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10).translate(0, 2.15, 0), shroud.material);
  g.add(shroud, hood);
  for (const side of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbff6ff })); e.position.set(side * 0.08, 2.17, 0.24); g.add(e); }
  g.userData.mat = shroud.material;
  g.userData.animate = (t, hurt) => { shroud.material.uniforms.uTime.value = t; shroud.material.uniforms.uHurt.value = hurt; };
  return g;
}

/* ---------------- first-person hands and weapons ---------------- */
export const WEAPONS = {
  stick: { name: 'Walking Stick', dmg: 8, speed: 1.0, reach: 2.2, spirit: 0.6, desc: 'Madrone, worn smooth by someone else\'s hand. It was leaning in the hotel doorway, waiting.' },
  grip: { name: 'Cable Car Grip Lever', dmg: 14, speed: 0.8, reach: 2.4, spirit: 0.7, desc: 'Iron and oak from the Powell line. It has held the moving cable under the street for a hundred years.' },
  canesword: { name: 'Cane-Sword', dmg: 12, speed: 1.35, reach: 2.3, spirit: 0.8, desc: 'A Barbary Coast gentleman\'s cane with a secret in it. Quick, and a little vain.' },
  hook: { name: 'Longshore Hook', dmg: 16, speed: 0.9, reach: 2.0, spirit: 0.9, desc: 'A cargo hook from the waterfront, from the days when the whole Embarcadero moved on men\'s backs.' },
  clapper: { name: 'Mission Bell Clapper', dmg: 18, speed: 0.7, reach: 2.2, spirit: 1.4, desc: 'The tongue of a bell that rang over the Mission in 1906. The Hollows remember the sound.' },
  stairblade: { name: 'Stair-Stone Blade', dmg: 24, speed: 1.1, reach: 2.5, spirit: 2.0, desc: 'Cut from the lowest stair. It hums when the tide turns.' }
};
const pmat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));
function weaponModel(id) {
  const g = new THREE.Group();
  const wood = pmat(0x6b4a2e), iron = pmat(0x3d3f42, { metalness: 0.7, roughness: 0.45 }), brass = pmat(0xb58a3c, { metalness: 0.8, roughness: 0.35 });
  if (id === 'stick') { g.add(mesh(G.cyl(0.018, 0.022, 1.1, 8), wood, 0, 0.35, 0)); g.add(mesh(G.sphere(0.03), wood, 0, 0.9, 0)); }
  if (id === 'grip') { g.add(mesh(G.cyl(0.02, 0.02, 0.35, 8), wood, 0, 0, 0)); g.add(mesh(G.box(0.05, 0.75, 0.03), iron, 0, 0.5, 0)); g.add(mesh(G.box(0.12, 0.08, 0.05), iron, 0.03, 0.88, 0)); }
  if (id === 'canesword') { g.add(mesh(G.cyl(0.02, 0.02, 0.14, 8), pmat(0x1a1a1a), 0, 0, 0)); g.add(mesh(G.sphere(0.028), brass, 0, 0.08, 0)); g.add(mesh(G.box(0.022, 0.85, 0.006), pmat(0xdfe3e6, { metalness: 0.9, roughness: 0.2 }), 0, 0.52, 0)); }
  if (id === 'hook') { g.add(mesh(G.cyl(0.025, 0.025, 0.2, 8), wood, 0, 0, 0).rotateZ(Math.PI / 2)); g.add(mesh(G.cyl(0.012, 0.012, 0.3, 6), iron, 0, 0.15, 0)); const h = mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 16, Math.PI * 1.3), iron, 0.1, 0.32, 0); h.rotation.z = -0.4; g.add(h); }
  if (id === 'clapper') { g.add(mesh(G.cyl(0.018, 0.018, 0.25, 8), wood, 0, 0, 0)); g.add(mesh(G.cyl(0.015, 0.03, 0.55, 8), iron, 0, 0.4, 0)); g.add(mesh(G.sphere(0.075), iron, 0, 0.7, 0)); }
  if (id === 'stairblade') { g.add(mesh(G.cyl(0.02, 0.02, 0.18, 8), pmat(0x3a3530), 0, 0, 0)); const b = mesh(G.box(0.07, 0.8, 0.02), pmat(0xbdb6a6, { emissive: 0x2fbfae, emissiveIntensity: 0.6 }), 0, 0.5, 0); g.add(b); }
  return g;
}
export function makeHands() {
  const root = new THREE.Group();
  const plain = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));
  const sleeve = plain(0x4a4038), skin = plain(0xc9a07e, { emissive: 0x000000 });
  const arm = (side) => {
    const a = new THREE.Group();
    const fore = mesh(G.capsule(0.032, 0.3), sleeve, 0, 0, 0.12); fore.rotation.x = Math.PI / 2; a.add(fore);
    const cuff = mesh(G.cyl(0.036, 0.036, 0.03, 10), plain(0xd8cfc0), 0, 0, -0.07); cuff.rotation.x = Math.PI / 2; a.add(cuff);
    const hand = mesh(G.sphere(0.036, 12, 10), skin, 0, 0, -0.12); hand.scale.set(0.9, 0.75, 1.25); a.add(hand);
    a.position.set(side * 0.2, -0.24, -0.34); return a;
  };
  const left = arm(-1), right = arm(1); root.add(left, right);
  const holder = new THREE.Group(); holder.position.set(0, 0.01, -0.12); right.add(holder);
  let weapon = null, weaponId = null;
  const bars = new THREE.Group();
  bars.add(mesh(G.cyl(0.012, 0.012, 0.7, 8), pmat(0x2a2a2a, { metalness: 0.6 }), 0, 0, 0).rotateZ(Math.PI / 2));
  bars.add(mesh(G.cyl(0.018, 0.018, 0.12, 8), pmat(0x151515), -0.3, 0, 0).rotateZ(Math.PI / 2));
  bars.add(mesh(G.cyl(0.018, 0.018, 0.12, 8), pmat(0x151515), 0.3, 0, 0).rotateZ(Math.PI / 2));
  bars.add(mesh(G.cyl(0.02, 0.02, 0.4, 8), pmat(0x7a2a24), 0, -0.2, -0.1));
  bars.position.set(0, -0.36, -0.55); bars.visible = false; root.add(bars);
  const aura = new THREE.PointLight(0xffd080, 0, 1.5, 2); aura.position.set(0, -0.2, -0.45); root.add(aura);
  root.userData = {
    setWeapon(id) { if (weaponId === id) return; weaponId = id; if (weapon) holder.remove(weapon); weapon = null; if (!id) return; weapon = weaponModel(id); weapon.rotation.x = -1.05; weapon.rotation.z = 0.25; weapon.scale.setScalar(id === 'stick' || id === 'grip' ? 0.5 : 0.62); holder.add(weapon); },
    // state: { t, swing (0..1 or -1), block, cast, moving, speed, bike, light (-1..1), reduced }
    update(st) {
      const bob = st.reduced ? 0 : Math.sin(st.t * (st.speed > 5 ? 11 : 8)) * 0.012 * Math.min(1, st.speed / 3);
      bars.visible = !!st.bike;
      if (st.bike) { left.position.set(-0.3, -0.33, -0.5); right.position.set(0.3, -0.33, -0.5); holder.visible = false; left.rotation.set(0, 0, 0); right.rotation.set(0, 0, 0); return; }
      holder.visible = true;
      left.position.set(-0.21, -0.27 + bob, -0.5); right.position.set(0.2, -0.25 - bob, -0.5);
      left.rotation.set(0.35, 0.3, 0); right.rotation.set(0.3, -0.2, 0);
      if (st.swing >= 0) { const p = st.swing, e = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7; right.rotation.set(-0.2 - Math.sin(p * Math.PI) * 1.2, -0.1 + (0.5 - p) * 1.6, -0.3 * e); right.position.x = 0.24 - p * 0.3; right.position.y = -0.2 + e * 0.1; }
      if (st.block) { right.rotation.set(0.1, 0, 1.2); right.position.set(0.1, -0.12, -0.38); left.position.set(-0.12, -0.18, -0.4); }
      if (st.cast > 0) { const c = Math.sin(st.cast * Math.PI); left.position.set(-0.12, -0.14 + c * 0.05, -0.45 - c * 0.12); left.rotation.set(-c * 0.6, 0, 0); }
      const L = st.light || 0;
      const col = L >= 0 ? new THREE.Color(1.0, 0.8, 0.45) : new THREE.Color(0.6, 0.35, 1.0);
      skin.emissive.copy(col).multiplyScalar(Math.abs(L) * 0.25 + (st.cast > 0 ? 0.6 : 0));
      aura.color.copy(col); aura.intensity = Math.abs(L) * 0.6 + (st.cast > 0 ? 3 : 0);
    }
  };
  return root;
}
