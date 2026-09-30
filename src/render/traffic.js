// Traffic: cars driving the real streets around you, in the right-hand lane, stopping for you and for each other.
import { CarKit } from './detail.js';

const SW = 1.6;
const COLORS = [0xe8e8e6, 0x1a1a1c, 0x9aa0a6, 0x5a6068, 0x23324a, 0x7a1c1c, 0xe8e8e6, 0x2d4a3a, 0xd8c030, 0x3a6a8a];

export class Traffic {
  constructor(city, renderer, quality, nearStreets) {
    this.city = city; this.near = nearStreets;
    this.max = quality === 'low' ? 4 : quality === 'medium' ? 10 : 18;
    this.kit = new CarKit(renderer, this.max + 2); this.group = this.kit.group;
    this.cars = []; this.t = 0;
  }
  _spawn(px, pz) {
    const sts = this.near(px, pz, 220).filter(s => s.kind === 0 && s.width / 2 - SW >= 2.6 && s.pts.length > 1);
    if (!sts.length) return;
    const st = sts[Math.floor(Math.random() * sts.length)], i = Math.floor(Math.random() * (st.pts.length - 1));
    const [ax, az] = st.pts[i], d0 = Math.hypot(ax - px, az - pz);
    if (d0 < 70 || d0 > 230) return;
    const roadHalf = st.width / 2 - SW, parking = roadHalf >= 5;
    const kind = Math.random() < 0.55 ? 0 : Math.random() < 0.8 ? 1 : 2;
    this.cars.push({ st, i, u: Math.random(), dir: Math.random() < 0.5 ? 1 : -1, lane: roadHalf < 4.2 ? 0 : Math.max(1.5, roadHalf - (parking ? 3.2 : 1.7)), v: 6, cruise: 8 + Math.random() * 5, kind, color: COLORS[Math.floor(Math.random() * COLORS.length)], x: ax, z: az, ang: null });
  }
  update(dt, player, night) {
    const px = player.x, pz = player.z;
    this.t -= dt;
    if (this.cars.length < this.max && this.t < 0) { this.t = 0.4; this._spawn(px, pz); }
    this.kit.begin();
    for (const c of this.cars) {
      const pts = c.st.pts;
      let a = pts[c.i], b = pts[c.i + 1];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L * c.dir, tz = (b[1] - a[1]) / L * c.dir;
      // look ahead: you, or another car, in my lane
      let want = c.cruise;
      const ahead = (x, z) => { const dx = x - c.x, dz = z - c.z, f = dx * tx + dz * tz, l = Math.abs(-dx * tz + dz * tx); return f > 0 && f < 14 && l < 2 ? f : Infinity; };
      const fp = player.jet && player.y - this.city.heightAt(px, pz) > 3 ? Infinity : ahead(px, pz);
      if (fp < 14) want = Math.min(want, Math.max(0, (fp - 5.5) * 1.2));
      for (const o of this.cars) if (o !== c) { const f = ahead(o.x, o.z); if (f < 14) want = Math.min(want, Math.max(0, (f - 7) * 1.2)); }
      c.v += (want - c.v) * Math.min(1, dt * (want < c.v ? 4 : 1.2));
      c.u += c.v * dt / L * c.dir;
      if (c.u > 1 || c.u < 0) {
        c.i += c.dir;
        if (c.i < 0 || c.i >= pts.length - 1) { c.dir *= -1; c.i = Math.max(0, Math.min(pts.length - 2, c.i)); c.u = c.dir > 0 ? 0 : 1; }   // the end of the street: turn around
        else c.u = c.dir > 0 ? 0 : 1;
        a = pts[c.i]; b = pts[c.i + 1];
      }
      const Lb = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / Lb, uz = (b[1] - a[1]) / Lb;
      const o = c.lane * c.dir;   // the right-hand lane for the way we're going
      const x = a[0] + (b[0] - a[0]) * c.u + uz * o, z = a[1] + (b[1] - a[1]) * c.u - ux * o;
      const fx = ux * c.dir, fz = uz * c.dir;
      const y0 = this.city.heightAt(x - fx * 2, z - fz * 2), y1 = this.city.heightAt(x + fx * 2, z + fz * 2);
      const tgt = Math.atan2(fz, fx); if (c.ang === null) c.ang = tgt; let da = tgt - c.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); c.ang += da * Math.min(1, dt * 6);
      c.x = x; c.z = z; c.y = (y0 + y1) / 2 + 0.12;
      this.kit.add(x, c.y, z, c.ang, Math.atan2(y1 - y0, 4), c.kind, c.color);
      if (Math.hypot(x - px, z - pz) > 280) c.gone = true;
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
