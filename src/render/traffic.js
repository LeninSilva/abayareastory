// Traffic: cars, taxis and Italika scooters on the real streets around you, and, very rarely, a pickup grinding up
// the stone road to San Francisco del Cerro. Narrow centro streets are one-way (as they are in Jiquilpan); wider ones
// have a lane each way, on the right, clear of the parked cars. At the end of a street a car takes a connecting
// street. Every car keeps its distance from every other car, from you, and from your car; nobody drives through
// anybody, and when two cars stand nose to nose they sort it out like neighbours: one backs off and leaves.
import { CarKit, KIND } from './detail.js';
import { PLACES } from '../geo.js';

const SW = 1.6;
const COLORS = [0xe8e8e6, 0x1a1a1c, 0x9aa0a6, 0x5a6068, 0x23324a, 0x7a1c1c, 0xe8e8e6, 0x2d4a3a, 0xd8c030, 0x3a6a8a, 0xc8b89a];
const MOTO = [0xc02820, 0x1a1a1c, 0x2850a0, 0xe8e8e6, 0x3a3a40, 0xd86a1a];
const TAXI = 0xf2f0ea;
/* the combis: each colour has its route through town, stopping at the stops */
export const ROUTES = [
  { name: 'Ruta Verde', color: 0x2e9a4a, css: '#2e9a4a', stops: ['jardin', 'guadalupe', 'panteon', 'jardinPaz'] },
  { name: 'Ruta Roja', color: 0xc8282a, css: '#c8282a', stops: ['jardin', 'estadio', 'bosque', 'toros'] },
  { name: 'Ruta Amarilla', color: 0xe8c020, css: '#e8c020', stops: ['jardin', 'cayetano', 'monumento', 'museo'] }
];
/* the cycling clubs of the Ciénega */
export const TEAMS = [
  { name: 'Los Rinos de Jiquilpan', color: 0x6a2a9a, w: 3 }, { name: 'Las Mamazonas de Zamora', color: 0xe0408a, w: 2 }, { name: 'Los Apenitas', color: 0xb8d030, w: 2 }
];
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
    this.cars = []; this.t = 0; this.cerroT = 30 + Math.random() * 60; this.id = 0; this.bikeT = 20;
    this.kit = new CarKit(renderer, this.max + 24); this.group = this.kit.group;
    this.combis = null;
  }
  /** the three combis, always somewhere on their routes */
  _initCombis() {
    this.combis = ROUTES.map((R, i) => {
      const P = PLACES[R.stops[1]], s = this.city.nearestStreet(P.x, P.z, 200, [0]); if (!s) return null;
      const st = s.st, L = lanesOf(st), dir = L.oneWay ? L.dir : 1, k = Math.max(0, st.pts.findIndex(p => Math.hypot(p[0] - s.x, p[1] - s.z) < 60));
      const c = this._add({ st, i: Math.min(k, st.pts.length - 2), u: 0.5, dir, kind: KIND.van, color: R.color, cruise: 8.5, combi: R, stop: 2, wait: 0, stopT: 0 });
      return c;
    }).filter(Boolean);
  }
  /** a pelotón: a team riding together, or one person on their way somewhere */
  _spawnBikes(px, pz) {
    const sts = this.near(px, pz, 260).filter(s => s.kind === 0 && s.pts.length > 1 && s.width >= 9);
    if (!sts.length) return; const st = sts[Math.floor(Math.random() * sts.length)], i = Math.floor(Math.random() * (st.pts.length - 1));
    const [ax, az] = st.pts[i]; const d0 = Math.hypot(ax - px, az - pz); if (d0 < 80 || d0 > 250) return;
    const L = lanesOf(st), dir = L.oneWay ? L.dir : Math.random() < 0.5 ? 1 : -1;
    const team = Math.random() < 0.65 ? TEAMS[Math.floor(Math.random() * TEAMS.length)] : null, n = team ? 3 + Math.floor(Math.random() * 4) : 1;
    for (let k = 0; k < n; k++) this._add({ st, i, u: dir > 0 ? 0 : 1, dir, kind: KIND.bike, color: team ? team.color : [0x2a6ab8, 0xe8e2d4, 0x1a1a1a, 0xc02820][Math.floor(Math.random() * 4)], cruise: team ? 9.5 : 6 + Math.random() * 2, bike: true, team, lag: k * 2.4, side: (k % 2) * 0.55 });
  }
  _pickKind() { const r = Math.random(); return r < 0.11 ? KIND.taxi : r < 0.23 ? KIND.rider : r < 0.43 ? KIND.sedan : r < 0.58 ? KIND.hatch : r < 0.68 ? KIND.suv : r < 0.85 ? KIND.pickup : r < 0.92 ? KIND.vocho : r < 0.96 ? KIND.van : r < 0.985 ? KIND.sedan : r < 0.995 ? KIND.ev : KIND.porsche; }
  _spawn(px, pz) {
    const sts = this.near(px, pz, 220).filter(s => s.kind === 0 && s.width / 2 - SW >= 2.4 && s.pts.length > 1);
    if (!sts.length) return;
    const st = sts[Math.floor(Math.random() * sts.length)], i = Math.floor(Math.random() * (st.pts.length - 1));
    const [ax, az] = st.pts[i], d0 = Math.hypot(ax - px, az - pz);
    if (d0 < 70 || d0 > 230) return;
    const L = lanesOf(st), dir = L.oneWay ? L.dir : Math.random() < 0.5 ? 1 : -1;
    if (this.cars.some(c => Math.hypot(c.x - ax, c.z - az) < 14)) return;
    const kind = this._pickKind(), moto = kind === KIND.rider;
    this._add({ st, i, u: dir > 0 ? 0 : 1, dir, kind, color: kind === KIND.taxi ? TAXI : moto ? MOTO[Math.floor(Math.random() * MOTO.length)] : kind === KIND.porsche ? [0xc01818, 0xb8bcc0, 0x101010][Math.floor(Math.random() * 3)] : kind === KIND.vocho ? [0x2a6ab8, 0xd8c030, 0xe8e8e2, 0xc04020, 0x5a8a4a][Math.floor(Math.random() * 5)] : COLORS[Math.floor(Math.random() * COLORS.length)],
      cruise: moto ? 9 + Math.random() * 4 : 7.5 + Math.random() * 4.5 });
  }
  _add(o) { const c = Object.assign({ id: ++this.id, v: 4, x: o.st.pts[o.i][0], z: o.st.pts[o.i][1], y: 0, ang: null, wait: 0 }, o); this.cars.push(c); this._place(c, 0); return c; }
  /** the stone road: a pickup now and then, in no hurry */
  _cerro(dt, px, pz) {
    const road = this.city.backRoad; if (!road) return;   // the stone path up from town is for feet and hooves; cars come up the back way
    this.cerroT -= dt; if (this.cerroT > 0) return; this.cerroT = 70 + Math.random() * 110;
    if (this.cars.some(c => c.st === road)) return;
    // only when you are somewhere near the road, and never right in front of you
    let bi = -1, bd = 1e9; road.pts.forEach(([x, z], k) => { const d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; bi = k; } });
    if (bd > 700) return;
    const up = Math.random() < 0.5, i = Math.max(0, Math.min(road.pts.length - 2, bi + (up ? 18 : -18)));
    if (Math.hypot(road.pts[i][0] - px, road.pts[i][1] - pz) < 90) return;
    this._add({ st: road, i, u: up ? 0 : 1, dir: up ? 1 : -1, kind: Math.random() < 0.7 ? KIND.pickup : KIND.suv, color: [0x9a3020, 0xd8d0c0, 0x2a4a6a, 0x5a5048][Math.floor(Math.random() * 4)], cruise: 5 + Math.random() * 2.5, cerro: true });
  }
  /** at the end of a street, carry on along another that meets it there */
  _next(c) {
    const pts = c.st.pts, end = c.dir > 0 ? pts[pts.length - 1] : pts[0];
    const opts = [];
    for (const s of this.near(end[0], end[1], 30)) {
      if (s === c.st || s.kind !== c.st.kind || (s.kind === 0 && s.width / 2 - SW < 2.4 && !c.bike)) continue;
      const L = lanesOf(s), a = s.pts[0], b = s.pts[s.pts.length - 1];
      if (Math.hypot(a[0] - end[0], a[1] - end[1]) < 3 && (!L.oneWay || L.dir > 0)) opts.push([s, 1]);
      if (Math.hypot(b[0] - end[0], b[1] - end[1]) < 3 && (!L.oneWay || L.dir < 0)) opts.push([s, -1]);
    }
    if (!opts.length) return false;
    let [s, d] = opts[Math.floor(Math.random() * opts.length)];
    if (c.combi) {   // the combi driver knows the way: the street whose far end is nearest the next stop (mostly)
      const P = PLACES[c.combi.stops[c.stop]], far = ([q, dd]) => { const e = dd > 0 ? q.pts[q.pts.length - 1] : q.pts[0]; return Math.hypot(e[0] - P.x, e[1] - P.z) + (q === c.prev ? 400 : 0) + Math.random() * 30; };
      opts.sort((a, b) => far(a) - far(b)); [s, d] = opts[0];
    }
    c.prev = c.st;
    c.st = s; c.dir = d; c.i = d > 0 ? 0 : s.pts.length - 2; c.u = d > 0 ? 0 : 1; return true;
  }
  _place(c, dt) {
    const pts = c.st.pts, a = pts[c.i], b = pts[c.i + 1];
    const Lb = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / Lb, uz = (b[1] - a[1]) / Lb;
    const LL = lanesOf(c.st); let o = LL.o(c.dir);
    if (c.bike) o = Math.max(-LL.half + 0.6, Math.min(LL.half - 0.6, o - c.dir * (0.9 + (c.side || 0))));
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
    if (!this.combis) this._initCombis();
    this.bikeT -= dt; if (this.bikeT < 0) { this.bikeT = 25 + Math.random() * 35; if (this.cars.filter(c => c.bike).length < 8) this._spawnBikes(px, pz); }
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
        look(o.x, o.z, c.bike ? (o.bike ? 3 : 5) : c.kind === KIND.rider ? 4.5 : o.bike ? 5 : 6.8, o);
        // at a crossing, the one who came later waits
        const d = Math.hypot(o.x - c.x, o.z - c.z);
        if (d < 9 && o.id < c.id) { const dot = (o.x - c.x) * c.fx + (o.z - c.z) * c.fz; if (dot > 0 && Math.abs(c.fx * o.fx + c.fz * o.fz) < 0.5) { want = Math.min(want, 0); blocker = o; } }
      }
      if (c.cerro) want = Math.min(want, c.cruise);
      if (c.lag > 0) { c.lag -= dt; want = 0; }   // riders set off one after another
      if (c.combi) {   // at a stop: wait, call out, go on to the next
        const P = PLACES[c.combi.stops[c.stop]];
        if (c.stopT > 0) { c.stopT -= dt; want = 0; if (c.stopT <= 0) c.stop = (c.stop + 1) % c.combi.stops.length; }
        else if (Math.hypot(P.x - c.x, P.z - c.z) < 45) c.stopT = 9;
      }
      c.v += (want - c.v) * Math.min(1, dt * (want < c.v ? 5 : 1.2));
      if (c.v < 0.3 && blocker && blocker !== 'you') c.wait += dt; else c.wait = Math.max(0, c.wait - dt * 2);
      // nose to nose for a while: the later one gives up and leaves (out of sight if it can)
      if (c.wait > 7 && !c.combi && (Math.hypot(c.x - px, c.z - pz) > 45 || c.wait > 16)) { c.gone = true; continue; }
      if (c.combi && c.wait > 10) { c.dir *= -1; c.wait = 0; }
      const pts = c.st.pts, a = pts[c.i], b = pts[c.i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      c.u += c.v * dt / L * c.dir;
      if (c.u > 1 || c.u < 0) {
        const rem = c.u > 1 ? c.u - 1 : -c.u;
        c.i += c.dir;
        if (c.i < 0 || c.i >= pts.length - 1) {
          if (!this._next(c)) { if ((lanesOf(c.st).oneWay || c.cerro) && !c.combi) { c.gone = true; continue; } c.dir *= -1; c.i = Math.max(0, Math.min(pts.length - 2, c.i)); c.u = c.dir > 0 ? 0 : 1; }
        } else c.u = c.dir > 0 ? rem : 1 - rem;
      }
      this._place(c, dt);
      this.kit.add(c.x, c.y, c.z, c.ang, c.pitch, c.kind, c.color);
      if (!c.combi && Math.hypot(c.x - px, c.z - pz) > (c.cerro ? 900 : 280)) c.gone = true;
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
