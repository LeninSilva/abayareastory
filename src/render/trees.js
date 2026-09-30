// Street trees (the city's real inventory) and park forests, streamed around the player.
import * as THREE from 'three';
import { landmarkMaterial } from './shaders.js';

function colored(geo, color) { const c = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
function lumpy(geo, amt, seed) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + amt * (Math.sin(x * 3.1 + seed) * Math.sin(y * 2.7 + seed * 2) + Math.sin(z * 4.3 - seed)) * 0.5; p.setXYZ(i, x * k, y * k, z * k); } geo.computeVertexNormals(); return geo; }
function merge(parts) {
  parts = parts.map(g => g.index ? g.toNonIndexed() : g);
  let n = 0; for (const g of parts) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = []; let o = 0;
  for (const g0 of parts) { const g = g0.index ? g0.toNonIndexed() : g0; const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); for (let i = 0; i < c; i++) idx.push(o + i); o += c; }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.setIndex(idx); return out;
}
function trunk(h, r) { const g = new THREE.CylinderGeometry(r * 0.7, r, h, 6); g.translate(0, h / 2, 0); return colored(g, 0x5b4331); }

function broadleaf() {
  const parts = [trunk(3.2, 0.22)];
  for (const [x, y, z, r] of [[0, 4.4, 0, 2.2], [1.1, 3.9, 0.4, 1.5], [-1, 4, -0.5, 1.6], [0.2, 5.4, -0.3, 1.4]]) { const g = lumpy(new THREE.IcosahedronGeometry(r, 1), 0.22, x * 3 + z); g.translate(x, y, z); parts.push(colored(g, 0x4f7a33)); }
  return merge(parts);
}
function conifer() {   // Monterey cypress / pine: dark, layered, a little windswept
  const parts = [trunk(2.5, 0.28)];
  for (let i = 0; i < 4; i++) { const g = lumpy(new THREE.SphereGeometry(2.6 - i * 0.45, 8, 5), 0.18, i); g.scale(1.25, 0.45, 1.05); g.translate(0.5 * i * 0.3, 3 + i * 1.35, 0); parts.push(colored(g, 0x2f5530)); }
  return merge(parts);
}
function eucalyptus() {
  const parts = [trunk(9, 0.3)];
  for (const [x, y, z, r] of [[0, 9.5, 0, 2.1], [0.8, 8, 0.6, 1.6], [-0.7, 11, -0.3, 1.5], [0.2, 12.5, 0.2, 1.2]]) { const g = lumpy(new THREE.IcosahedronGeometry(r, 1), 0.25, x + y); g.scale(1, 1.3, 1); g.translate(x, y, z); parts.push(colored(g, 0x6d8a60)); }
  return merge(parts);
}
function palm() {
  const t = new THREE.CylinderGeometry(0.28, 0.4, 8, 6); t.translate(0, 4, 0); const parts = [colored(t, 0x7a6450)];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.PlaneGeometry(0.9, 4.2, 1, 3); g.translate(0, 2.1, 0);
    const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setZ(k, -y * y * 0.09); }
    g.rotateX(-1.0); g.rotateY(i / 9 * Math.PI * 2); g.translate(0, 8, 0); g.computeVertexNormals(); parts.push(colored(g, 0x5d7f3a));
  }
  return merge(parts);
}

// laurel de la India, the plaza tree: a dense, clipped dome of dark leaves on a thick grey trunk
function laurel() {
  const parts = [colored(new THREE.CylinderGeometry(0.28, 0.42, 2.6, 7).translate(0, 1.3, 0), 0x6e6a60)];
  const g = lumpy(new THREE.IcosahedronGeometry(3.1, 2), 0.08, 1.7); g.scale(1.15, 0.8, 1.15); g.translate(0, 4.4, 0); parts.push(colored(g, 0x2f5a26));
  return merge(parts);
}
// jacaranda: a thin crown, lilac
function jacaranda() {
  const parts = [trunk(3.4, 0.2)];
  for (const [x, y, z, r] of [[0, 5, 0, 2.2], [1.4, 4.6, 0.5, 1.6], [-1.3, 4.7, -0.6, 1.7], [0.3, 6.1, -0.2, 1.3]]) { const g = lumpy(new THREE.IcosahedronGeometry(r, 1), 0.3, x * 5 + z); g.scale(1.1, 0.75, 1.1); g.translate(x, y, z); parts.push(colored(g, 0x8a74c8)); }
  return merge(parts);
}
// huizache and scrub on the dry slopes
function scrub() {
  const parts = [trunk(0.9, 0.12)];
  for (const [x, y, z, r] of [[0, 1.5, 0, 1.3], [0.7, 1.2, 0.3, 0.9], [-0.6, 1.3, -0.4, 0.9]]) { const g = lumpy(new THREE.IcosahedronGeometry(r, 1), 0.3, x + 3 * z); g.scale(1.3, 0.7, 1.3); g.translate(x, y, z); parts.push(colored(g, 0x5a6a2e)); }
  return merge(parts);
}

export function makeTrees(city, quality) {
  // 0 laurel, 1 palm, 2 pine and oak on the hills, 3 ahuehuete and eucalyptus in the Bosque, 4 jacaranda, 5 scrub
  const types = [laurel(), palm(), conifer(), eucalyptus(), jacaranda(), scrub()];
  const mat = landmarkMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide });
  const cap = quality === 'low' ? 2500 : quality === 'medium' ? 5000 : 9000;
  const radius = quality === 'low' ? 320 : quality === 'medium' ? 480 : 700;
  const white = new THREE.Color(1, 1, 1);
  const meshes = types.map(g => { const m = new THREE.InstancedMesh(g, mat, cap); m.setColorAt(0, white); m.count = 0; m.frustumCulled = false; return m; });
  const group = new THREE.Group(); meshes.forEach(m => group.add(m));
  // bucket trees on a 100 m grid
  const T = city.trees, CELL = 100, grid = new Map();
  for (let k = 0; k < T.length / 4; k++) { const key = Math.floor((T[k * 4] + city.half) / CELL) * 1000 + Math.floor((T[k * 4 + 1] + city.half) / CELL); let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(k); }
  // trunks are solid
  for (let k = 0; k < T.length / 4; k++) { const x = T[k * 4], z = T[k * 4 + 1], y = city.heightAt(x, z); const ty = T[k * 4 + 2]; if (ty !== 5) city.colliders.addCircle(x, z, ty === 0 ? 0.42 : ty === 1 ? 0.35 : 0.3, y - 1, y + 5, 'tree'); }
  let lastX = 1e9, lastZ = 1e9;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  group.userData.update = (x, z, force) => {
    if (!force && Math.hypot(x - lastX, z - lastZ) < 30) return;
    lastX = x; lastZ = z;
    const counts = types.map(() => 0), r = Math.ceil(radius / CELL), ci = Math.floor((x + city.half) / CELL), cj = Math.floor((z + city.half) / CELL);
    const near = [];
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const a = grid.get((ci + di) * 1000 + cj + dj); if (a) for (const k of a) { const d = (T[k * 4] - x) ** 2 + (T[k * 4 + 1] - z) ** 2; if (d < radius * radius) near.push([d, k]); } }
    near.sort((a, b) => a[0] - b[0]);
    for (const [, k] of near) {
      const type = T[k * 4 + 2]; if (counts[type] >= cap) continue;
      const tx = T[k * 4], tz = T[k * 4 + 1], sc = T[k * 4 + 3], y = city.heightAt(tx, tz);
      q.setFromAxisAngle(up, (k * 2.399) % 6.283); v.set(tx, y - 0.2, tz); s.setScalar(sc);
      m4.compose(v, q, s); meshes[type].setMatrixAt(counts[type], m4);
      const h = ((k * 0.618) % 1);
      meshes[type].setColorAt(counts[type], col.setRGB(0.85 + h * 0.3, 0.9 + ((k * 0.37) % 1) * 0.2, 0.8 + h * 0.2));
      counts[type]++;
    }
    meshes.forEach((m, i) => { m.count = counts[i]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  };
  return group;
}
