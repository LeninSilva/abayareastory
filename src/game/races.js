// Races: Rosa's car races along the real roads, and jetpack courses through rings in the air.
import * as THREE from 'three';
import { PLACES } from '../geo.js';

/* Chain every segment of a named road into one line, then drop checkpoints along it every `step` metres. */
function routeByName(city, re, from, step, maxLen) {
  const test = typeof re === 'function' ? re : s => re.test(s.name);
  const segs = city.streets.filter(s => test(s) && s.kind === 0).map(s => s.pts.slice());
  if (!segs.length) return null;
  let line = [], cur = from;
  while (segs.length) {
    let bi = -1, bd = Infinity, flip = false;
    segs.forEach((s, i) => { const a = Math.hypot(s[0][0] - cur[0], s[0][1] - cur[1]), b = Math.hypot(s[s.length - 1][0] - cur[0], s[s.length - 1][1] - cur[1]); if (a < bd) { bd = a; bi = i; flip = false; } if (b < bd) { bd = b; bi = i; flip = true; } });
    if (bd > 260 && line.length) break;   // small gaps in the traced highway are fine; the car can cross them
    const s = segs.splice(bi, 1)[0]; if (flip) s.reverse();
    line = line.concat(s); cur = s[s.length - 1];
  }
  const out = []; let acc = step;
  for (let i = 1; i < line.length && (!maxLen || out.length * step < maxLen); i++) {
    const [ax, az] = line[i - 1], [bx, bz] = line[i], L = Math.hypot(bx - ax, bz - az);
    let t = 0; while (acc <= L - t) { t += acc; acc = step; const u = t / L; out.push([ax + (bx - ax) * u, az + (bz - az) * u]); }
    acc -= L - t;
  }
  return out;
}

export function makeRaces(city, spots) {
  const P = id => [PLACES[id].x, PLACES[id].z];
  const H = (x, z) => city.heightAt(x, z);
  const races = [];
  // 1. the centro circuit: plaza to stadium and back, through the old streets
  races.push({ id: 'centro', name: 'Circuito del Centro', mode: 'car', giver: 'rosa', desc: 'Jardín, Parroquia, Casa de Cárdenas, the stadium gate, the Feria and back to the Jardín.',
    pts: [P('jardin'), [-60, -110], P('biblioteca'), [120, -40], P('casaLC'), [60, 150], P('feria'), P('portada'), [-150, 200], P('presidencia'), P('jardin')].map(([x, z]) => [x, z]), times: [70, 90, 120] });
  // 2. the highway toward Sahuayo, north
  const north = routeByName(city, s => s.width >= 14 && s.pts.every(([x, z]) => z < -150 && Math.abs(x) < 1500), [0, -200], 220, 4400);
  if (north && north.length > 4) races.push({ id: 'sahuayo', name: 'Sprint a Sahuayo', mode: 'car', giver: 'rosa', desc: 'A flat-out sprint up the highway toward Sahuayo.', pts: north, times: [Math.round(north.length * 220 / 32), Math.round(north.length * 220 / 26), Math.round(north.length * 220 / 20)] });
  // 3. the highway toward Morelia, east
  const east = routeByName(city, /morelia/i, [300, 350], 220, 4400);
  if (east && east.length > 4) races.push({ id: 'morelia', name: 'Rumbo a Morelia', mode: 'car', giver: 'rosa', desc: 'East out of town past the bullring, toward Morelia.', pts: east, times: [Math.round(east.length * 220 / 32), Math.round(east.length * 220 / 26), Math.round(east.length * 220 / 20)] });
  // 3b. west, toward Guadalajara
  const west = routeByName(city, /guadalajara/i, [-300, 100], 220, 4400);
  if (west && west.length > 4) races.push({ id: 'guadalajara', name: 'Sprint a Guadalajara', mode: 'car', giver: 'rosa', desc: 'A sprint west along the highway toward Guadalajara.', pts: west, times: [Math.round(west.length * 220 / 30), Math.round(west.length * 220 / 24), Math.round(west.length * 220 / 18)] });
  // 4. jetpack: the towers of the town (rings at the height of each bell tower)
  const tw = (id, dy) => { const s = spots[id] || [PLACES[id].x, H(PLACES[id].x, PLACES[id].z), PLACES[id].z]; return [s[0], s[2], s[1] + dy]; };
  races.push({ id: 'torres', name: 'Las Torres', mode: 'jet', giver: 'rosa', desc: 'Through rings at the bell towers, the kiosco, the portada and the monument.',
    pts: [[-178, -52, 30], tw('parroquiaDoor', 34), tw('bronzeDoor', 22), tw('monumento', 18), tw('cayetanoDoor', 28), tw('portadaQuote', 14), tw('guadalupeDoor', 34), [-178, -52, 14]], times: [60, 80, 110] });
  // 5. jetpack: up the cerro to the cross and down again
  const c = spots.cumbre || [PLACES.cumbre.x, H(PLACES.cumbre.x, PLACES.cumbre.z), PLACES.cumbre.z];
  races.push({ id: 'cerro', name: 'Anillos del Cerro', mode: 'jet', giver: 'rosa', desc: 'From the Bosque up the Cerro de San Francisco, round the summit cross, and back down to the stadium.',
    pts: [[222, 760], [380, 1400], [700, 2250], [1200, 3400], [1560, 4520], [c[0], c[2], c[1] + 40], [900, 3000], [100, 1200], P('portada')].map(p => p.length === 3 ? p : [p[0], p[1], H(p[0], p[1]) + 45]), times: [85, 115, 160] });
  // car checkpoints sit on the nearest roadway, at road height
  const roads = []; for (const st of city.streets) if (st.kind === 0) for (const p of st.pts) roads.push(p);
  const snap = ([x, z]) => { let b = null, bd = Infinity; for (const p of roads) { const d = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (d < bd) { bd = d; b = p; } } return b ? [b[0], b[1]] : [x, z]; };
  for (const r of races) r.pts = r.pts.map(p => { if (p.length === 3) return p; const q = r.mode === 'car' ? snap(p) : p; return [q[0], q[1], H(q[0], q[1]) + 2.5]; });
  return races;
}

/** Ring checkpoints drawn in the world. */
export class RaceRun {
  constructor(scene, race) {
    this.race = race; this.i = 0; this.t = 0; this.scene = scene; this.done = false;
    this.group = new THREE.Group(); scene.add(this.group);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffc83a, transparent: true, opacity: 0.8, fog: false, depthWrite: false });
    this.rings = race.pts.map((p, k) => {
      const R = race.mode === 'jet' ? 9 : 6.5, m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.45, 8, 32), mat.clone());
      const n = race.pts[Math.min(race.pts.length - 1, k + 1)], pr = race.pts[Math.max(0, k - 1)];
      m.position.set(p[0], p[2], p[1]); m.lookAt(n[0] + (p[0] - pr[0]) * 0.01, p[2], n[1] + (p[1] - pr[1]) * 0.01);
      if (k === race.pts.length - 1) m.material.color.set(0x7fffd4);
      this.group.add(m); return m;
    });
    this.R = race.mode === 'jet' ? 11 : 9;
  }
  update(dt, x, y, z) {
    if (this.done) return null;
    this.t += dt;
    this.rings.forEach((r, k) => { r.visible = k >= this.i && k < this.i + 3; r.material.opacity = k === this.i ? 0.95 : 0.35; r.rotation.z += dt * 0.5; });
    const p = this.race.pts[this.i];
    const d = Math.hypot(p[0] - x, p[1] - z), dy = Math.abs(p[2] - y - 1);
    if (d < this.R && (this.race.mode === 'car' || dy < this.R)) { this.i++; if (this.i >= this.race.pts.length) { this.done = true; return 'finish'; } return 'gate'; }
    return null;
  }
  next() { return this.race.pts[this.i]; }
  dispose() { this.scene.remove(this.group); }
}
