// Traffic: cars, taxis and Italika scooters on the real streets around you, and, very rarely, a pickup grinding up
// the stone road to San Francisco del Cerro. Narrow centro streets are one-way (as they are in Jiquilpan); wider ones
// have a lane each way, on the right, clear of the parked cars. At the end of a street a car takes a connecting
// street. Every car keeps its distance from every other car, from you, and from your car; nobody drives through
// anybody, and when two cars stand nose to nose they sort it out like neighbours: one backs off and leaves.
import { CarKit, KIND } from './detail.js';

const SW = 1.6;
const COLORS = [0xe8e8e6, 0x1a1a1c, 0x9aa0a6, 0x5a6068, 0x23324a, 0x7a1c1c, 0xe8e8e6, 0x2d4a3a, 0xd8c030, 0x3a6a8a, 0xc8b89a];
const MOTO = [0xc02820, 0x1a1a1c, 0x2850a0, 0xe8e8e6, 0x3a3a40, 0xd86a1a];
const TAXI = 0xf2f0ea;
const hashS = st => { const p = st.pts[0]; const h = Math.sin(p[0] * 12.9898 + p[1] * 78.233 + st.pts.length * 3.7) * 43758.5453; return h - Math.floor(h); };

/** Lanes for a street: { oneWay, dir (if one way), o(dir) offset along the street's left normal, half } */
export function lanesOf(st) {
  if (st._lanes) return st._lanes;
  const half = st.kind === 0 ? st.width / 2 - SW : st.width / 2;
  let L;
  if (st.kind !== 0) L = { oneWay: false, o: d => -d * Math.min(1.4, half * 0.45), half };                 // the cerro road: keep right
  else if (half >= 5) { const k = (half - 2.1) / 2; L = { oneWay: false, o: d => -d * k, half }; }         // parked both sides, a lane each way
  else if (half >= 3.3 && st.width >= 12) L = { oneWay: false, o: d => -1.05 - d * (half - 1.05) / 2, half };
  else L = { oneWay: true, dir: hashS(st) < 0.5 ? 1 : -1, o: () => (half >= 2.8 ? -Math.min(1.0, half - 1.9) : 0), half }; // one-way, away from the parked side
  return (st._lanes = L);
}

export class Traffic {
  constructor(city, renderer, quality, nearStreets) {
    this.city = city; this.near = nearStreets;
    this.max = quality === 'low' ? 5 : quality === 'medium' ? 11 : quality === 'high' ? 18 : 26;
    this.kit = new CarKit(renderer, this.max + 4); this.group = this.kit.group;
    this.cars = []; this.t = 0; this.cerroT = 30 + Math.random() * 60; this.id = 0;
  }
  _pickKind() { const r = Math.random(); return r < 0.13 ? KIND.taxi : r < 0.27 ? KIND.rider : r < 0.62 ? KIND.sedan : r < 0.84 ? KIND.suv : r < 0.94 ? KIND.pickup : KIND.van; }
  _spawn(px, pz) {
    const sts = this.near(px, pz, 220).filter(s => s.kind === 0 && s.width / 2 - SW >= 2.4 && s.pts.length > 1);
    if (!sts.length) return;
    const st = sts[Math.floor(Math.random() * sts.length)], i = Math.floor(Math.random() * (st.pts.length - 1));
    const [ax, az] = st.pts[i], d0 = Math.hypot(ax - px, az - pz);
    if (d0 < 70 || d0 > 230) return;
    const L = lanesOf(st), dir = L.oneWay ? L.dir : Math.random() < 0.5 ? 1 : -1;
    if (this.cars.some(c => Math.hypot(c.x - ax, c.z - az) < 14)) return;
    const kind = this._pickKind(), moto = kind === KIND.rider;
    this._add({ st, i, u: dir > 0 ? 0 : 1, dir, kind, color: kind === KIND.taxi ? TAXI : moto ? MOTO[Math.floor(Math.random() * MOTO.length)] : COLORS[Math.floor(Math.random() * COLORS.length)],
      cruise: moto ? 9 + Math.random() * 4 : 7.5 + Math.random() * 4.5 });
  }
  _add(o) { const c = Object.assign({ id: ++this.id, v: 4, x: o.st.pts[o.i][0], z: o.st.pts[o.i][1], y: 0, ang: null, wait: 0 }, o); this.cars.push(c); this._place(c, 0); return c; }
  /** the stone road: a pickup now and then, in no hurry */
  _cerro(dt, px, pz) {
    const road = this.city.cerroRoad; if (!road) return;
    this.cerroT -= dt; if (this.cerroT > 0) return; this.cerroT = 70 + Math.random() * 110;
    if (this.cars.some(c => c.st === road)) return;
    // only when you are somewhere near the road, and never right in front of you
    let bi = -1, bd = 1e9; road.pts.forEach(([x, z], k) => { const d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; bi = k; } });
    if (bd > 700) return;
    const up = Math.random() < 0.5, i = Math.max(0, Math.min(road.pts.length - 2, bi + (up ? -18 : 18)));
    if (Math.hypot(road.pts[i][0] - px, road.pts[i][1] - pz) < 90) return;
    this._add({ st: road, i, u: up ? 0 : 1, dir: up ? 1 : -1, kind: Math.random() < 0.7 ? KIND.pickup : KIND.suv, color: [0x9a3020, 0xd8d0c0, 0x2a4a6a, 0x5a5048][Math.floor(Math.random() * 4)], cruise: 5 + Math.random() * 2.5, cerro: true });
  }
  /** at the end of a street, carry on along another that meets it there */
  _next(c) {
    const pts = c.st.pts, end = c.dir > 0 ? pts[pts.length - 1] : pts[0];
    const opts = [];
    for (const s of this.near(end[0], end[1], 30)) {
      if (s === c.st || s.kind !== c.st.kind || (s.kind === 0 && s.width / 2 - SW < 2.4)) continue;
      const L = lanesOf(s), a = s.pts[0], b = s.pts[s.pts.length - 1];
      if (Math.hypot(a[0] - end[0], a[1] - end[1]) < 3 && (!L.oneWay || L.dir > 0)) opts.push([s, 1]);
      if (Math.hypot(b[0] - end[0], b[1] - end[1]) < 3 && (!L.oneWay || L.dir < 0)) opts.push([s, -1]);
    }
    if (!opts.length) return false;
    const [s, d] = opts[Math.floor(Math.random() * opts.length)];
    c.st = s; c.dir = d; c.i = d > 0 ? 0 : s.pts.length - 2; c.u = d > 0 ? 0 : 1; return true;
  }
  _place(c, dt) {
    const pts = c.st.pts, a = pts[c.i], b = pts[c.i + 1];
    const Lb = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / Lb, uz = (b[1] - a[1]) / Lb;
    const o = lanesOf(c.st).o(c.dir);
    const x = a[0] + (b[0] - a[0]) * c.u + uz * o, z = a[1] + (b[1] - a[1]) * c.u - ux * o;
    const fx = ux * c.dir, fz = uz * c.dir, D = c.kind === KIND.rider ? 0.6 : 2;
    const y0 = this.city.heightAt(x - fx * D, z - fz * D), y1 = this.city.heightAt(x + fx * D, z + fz * D);
    const tgt = Math.atan2(fz, fx); if (c.ang === null) c.ang = tgt; let da = tgt - c.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); c.ang += dt ? da * Math.min(1, dt * 5) : da;
    c.x = x; c.z = z; c.y = (y0 + y1) / 2 + 0.12; c.pitch = Math.atan2(y1 - y0, D * 2); c.fx = Math.cos(c.ang); c.fz = Math.sin(c.ang);
  }
  update(dt, player, night) {
    const px = player.x, pz = player.z;
    this.t -= dt;
    if (this.cars.length < this.max && this.t < 0) { this.t = 0.4; this._spawn(px, pz); }
    this._cerro(dt, px, pz);
    const pOnFoot = !(player.jet && player.y - this.city.heightAt(px, pz) > 3);
    this.kit.begin();
    for (const c of this.cars) {
      // what is in front of me: cars, you, your car
      let want = c.cruise, blocker = null;
      const look = (x, z, gap, who) => {
        const dx = x - c.x, dz = z - c.z, f = dx * c.fx + dz * c.fz, l = Math.abs(-dx * c.fz + dz * c.fx);
        if (f > 0 && f < 18 && l < 2.1) { const w = Math.max(0, (f - gap) * 1.1); if (w < want) { want = w; blocker = who; } }
        if (f > -1 && Math.hypot(dx, dz) < gap * 0.75 && l < 3) { want = 0; blocker = who; }   // too close, whatever the angle: stop
      };
      if (pOnFoot) look(px, pz, 5.5, 'you');
      for (const o of this.cars) if (o !== c) {
        look(o.x, o.z, c.kind === KIND.rider ? 4.5 : 6.8, o);
        // at a crossing, the one who came later waits
        const d = Math.hypot(o.x - c.x, o.z - c.z);
        if (d < 9 && o.id < c.id) { const dot = (o.x - c.x) * c.fx + (o.z - c.z) * c.fz; if (dot > 0 && Math.abs(c.fx * o.fx + c.fz * o.fz) < 0.5) { want = Math.min(want, 0); blocker = o; } }
      }
      if (c.cerro) want = Math.min(want, c.cruise);
      c.v += (want - c.v) * Math.min(1, dt * (want < c.v ? 5 : 1.2));
      if (c.v < 0.3 && blocker && blocker !== 'you') c.wait += dt; else c.wait = Math.max(0, c.wait - dt * 2);
      // nose to nose for a while: the later one gives up and leaves (out of sight if it can)
      if (c.wait > 7 && (Math.hypot(c.x - px, c.z - pz) > 45 || c.wait > 16)) { c.gone = true; continue; }
      const pts = c.st.pts, a = pts[c.i], b = pts[c.i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      c.u += c.v * dt / L * c.dir;
      if (c.u > 1 || c.u < 0) {
        const rem = c.u > 1 ? c.u - 1 : -c.u;
        c.i += c.dir;
        if (c.i < 0 || c.i >= pts.length - 1) {
          if (!this._next(c)) { if (lanesOf(c.st).oneWay || c.cerro) { c.gone = true; continue; } c.dir *= -1; c.i = Math.max(0, Math.min(pts.length - 2, c.i)); c.u = c.dir > 0 ? 0 : 1; }
        } else c.u = c.dir > 0 ? rem : 1 - rem;
      }
      this._place(c, dt);
      this.kit.add(c.x, c.y, c.z, c.ang, c.pitch, c.kind, c.color);
      if (Math.hypot(c.x - px, c.z - pz) > (c.cerro ? 900 : 280)) c.gone = true;
    }
    this.cars = this.cars.filter(c => !c.gone);
    this.kit.commit(); this.kit.night(night);
    // never let a moving car stand inside you: push the walker out of any car body
    if (!player.jet || player.onGround) for (const c of this.cars) {
      const K = this.kit.kinds[c.kind], dx = player.x - c.x, dz = player.z - c.z, ca = Math.cos(c.ang), sa = Math.sin(c.ang);
      const lx = dx * ca + dz * sa, lz = -dx * sa + dz * ca, hx = K.L / 2 + 0.35, hz = K.W / 2 + 0.35;
      if (Math.abs(lx) < hx && Math.abs(lz) < hz && Math.abs(player.y - c.y) < 2) {
        const ox = hx - Math.abs(lx), oz = hz - Math.abs(lz);
        let nlx = lx, nlz = lz; if (oz < ox) nlz = Math.sign(lz || 1) * hz; else nlx = Math.sign(lx || 1) * hx;
        const nx = c.x + nlx * ca - nlz * sa, nz = c.z + nlx * sa + nlz * ca;
        if (player.canStand(nx, nz, player.y) !== null) { player.x = nx; player.z = nz; }
      }
    }
  }
  clear() { this.cars = []; this.kit.begin(); this.kit.commit(); }
}
