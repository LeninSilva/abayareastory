// First-person walker: terrain, bridge decks, stairs and solids; collision that always resolves;
// and more than one way out if anything ever holds you.
import { deckHeight } from '../render/landmarks.js';

const R = 0.34, EYE = 1.62, STEP = 0.65, GRAV = 18;

export class Player {
  constructor(city) {
    this.city = city;
    this.x = 0; this.z = 0; this.y = 0; this.vy = 0; this.yaw = 0; this.pitch = 0;
    this.onGround = true; this.bike = false; this.speed = 0; this.interior = null;   // interior: bounds object when below ground
    this.stamina = 1; this.stuckTime = 0; this.lastSafe = null; this.distance = 0; this.moved = 0;
    this.headT = 0; this.landKick = 0; this.bumped = 0;
    this.jet = false; this.jetLanding = false; this.thrust = 0; this.vx = 0; this.vz = 0;   // the jetpack
  }
  /** Lowest a flier may go at (x,z): the ground, a roof, a deck; over the bay, a metre above the water. */
  flyFloor(x, z, y) {
    const { f } = this.floorAt(x, z, y);
    const water = !this.city.isLand(x, z) && this.city.heightAt(x, z) < 0.8 && !(this.city.colliders.floorAt(x, z, y, STEP).floor > -Infinity);
    return water ? Math.max(f, 1.2) : f;
  }
  /** Can the jetpack set you down here? (somewhere a walker could stand, not the bay) */
  canLand(x, z) { const f = this.floorAt(x, z, this.y).f; return this.canStand(x, z, f) !== null && this.isFree(x, z, f); }
  // the floor under (x,z) for feet at y: terrain (unless inside), bridge decks and solids
  floorAt(x, z, y, roofs = true) {   // roofs: land on a building's roof from above (never when placing someone)
    let f = this.interior ? -Infinity : this.city.heightAt(x, z);
    if (!this.interior) { const d = deckHeight(x, z); if (d > -Infinity && (Math.abs(d - y) < 3 || f < 0.5)) f = Math.max(f, d); }
    const s = this.city.colliders.floorAt(x, z, y, STEP, roofs && !this.interior);
    if (s.floor > f) f = s.floor;
    return { f, wall: s.wall };
  }
  // can a walker stand at (x,z) coming from feet height y? (not in the bay, not into a wall, not up a cliff face)
  canStand(x, z, y) {
    const { f, wall } = this.floorAt(x, z, y);
    if (wall) return null;
    if (f === -Infinity) return null;
    if (!this.interior) {
      const land = this.city.isLand(x, z) || this.city.heightAt(x, z) > 0.8;
      const deck = deckHeight(x, z) > -Infinity && Math.abs(deckHeight(x, z) - y) < 3;
      const solid = this.city.colliders.floorAt(x, z, y, STEP).floor > -Infinity;
      if (!land && !deck && !solid) return null;
      if (Math.abs(x) > this.city.half - 60 || Math.abs(z) > this.city.half - 60) return null;
    }
    if (f > y + STEP) return null;
    return f;
  }
  teleport(x, z, y) {
    this.x = x; this.z = z; this.vy = 0;
    this.y = y !== undefined ? y : this.floorAt(x, z, 9999, false).f;
    if (!isFinite(this.y)) this.y = this.city.heightAt(x, z);
    this.onGround = true; this.stuckTime = 0;
    this.unstick();
  }
  isFree(x, z, y) { return !this.city.colliders.blocked(x, z, R, y + 0.1, y + 1.75) && this.canStand(x, z, y) !== null; }
  /** Spiral outward to the nearest free standing spot. Returns true if moved. */
  unstick(maxR = 40) {
    if (this.isFree(this.x, this.z, this.y)) return false;
    for (let r = 0.5; r <= maxR; r += 0.5) {
      const n = Math.max(8, Math.round(r * 6));
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, x = this.x + Math.cos(a) * r, z = this.z + Math.sin(a) * r;
        const { f } = this.floorAt(x, z, this.y + 50, false);
        const y = isFinite(f) ? f : this.y;
        if (this.isFree(x, z, y)) { this.x = x; this.z = z; this.y = y; this.vy = 0; return true; }
      }
    }
    if (this.lastSafe) { [this.x, this.y, this.z] = this.lastSafe; return true; }
    return false;
  }
  /** Nearest point on a real street, for the 'take me to the street' rescue. */
  nearestStreet() {
    let best = null, bd = Infinity;
    for (const s of this.city.streets) for (const [x, z] of s.pts) { const d = (x - this.x) ** 2 + (z - this.z) ** 2; if (d < bd) { bd = d; best = [x, z]; } }
    return best;
  }
  rescue() {
    if (this.interior) { this.onRescueInterior && this.onRescueInterior(); return; }
    const p = this.nearestStreet(); if (!p) return;
    this.teleport(p[0], p[1]);
  }
  update(dt, input, opts = {}) {
    const look = input.lookDelta();
    this.yaw -= look.dx; this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - look.dy));
    if (this.jet) return this._fly(dt, input);
    const m = input.move();
    const want = Math.hypot(m.x, m.y);
    const sprint = input.held('sprint') && this.stamina > 0.05 && !this.bike;
    let max = this.bike ? 13 : sprint ? 7.2 : 4.3;
    if (opts.blocking) max *= 0.45;
    if (opts.slow) max *= opts.slow;
    // stamina
    if (sprint && want > 0.1) this.stamina = Math.max(0, this.stamina - dt * 0.12); else this.stamina = Math.min(1, this.stamina + dt * 0.2);
    // desired horizontal velocity in world space (forward is -z at yaw 0)
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const tvx = (fx * m.y + rx * m.x) * max, tvz = (fz * m.y + rz * m.x) * max;
    const acc = this.onGround ? (this.bike ? 5 : 12) : 2;
    this.vx = (this.vx || 0) + (tvx - (this.vx || 0)) * Math.min(1, acc * dt);
    this.vz = (this.vz || 0) + (tvz - (this.vz || 0)) * Math.min(1, acc * dt);
    // jump and gravity
    if (input.pressed('jump') && this.onGround && !this.bike) { this.vy = 5.6; this.onGround = false; }
    this.vy -= GRAV * dt;
    // move in small steps so nothing is ever tunnelled through
    const sx = this.x, sz = this.z;
    const dist = Math.hypot(this.vx, this.vz) * dt, n = Math.max(1, Math.ceil(dist / 0.3));
    for (let i = 0; i < n; i++) this._step(this.vx * dt / n, this.vz * dt / n);
    // vertical
    const y0 = this.y; this.y += this.vy * dt;
    const { f } = this.floorAt(this.x, this.z, Math.max(y0, this.y));
    if (this.y <= f + 0.02 || (this.onGround && this.y - f < 0.45 && this.vy <= 0)) {
      if (!this.onGround && this.vy < -7) this.landKick = Math.min(1, -this.vy / 16);
      this.y = f; this.vy = 0; this.onGround = true;
    } else this.onGround = false;
    if (!isFinite(this.y) || this.y < -2000) { this.y = f; if (!isFinite(this.y)) this.rescue(); }
    // stepped off a roof: the jetpack catches you before the street does
    if (!this.onGround && !this.interior && this.vy < -13 && this.y - f > 6) { this.jet = true; this.jetLanding = true; this.bike = false; this.onCaught && this.onCaught(); }
    // final safety: never end a frame inside anything
    const [px, pz] = this.city.colliders.resolve(this.x, this.z, R, this.y + 0.1, this.y + 1.75);
    if (this.canStand(px, pz, this.y) !== null) { this.x = px; this.z = pz; }
    this.unstick(6);
    const moved = Math.hypot(this.x - sx, this.z - sz);
    this.speed = moved / Math.max(dt, 1e-4); this.distance += moved;
    // stuck watch: pressing to move but not moving for a while
    if (want > 0.5 && moved < max * dt * 0.08) this.stuckTime += dt; else this.stuckTime = Math.max(0, this.stuckTime - dt * 2);
    if (this.onGround && this.isFree(this.x, this.z, this.y)) this.lastSafe = [this.x, this.y, this.z];
    this.headT += dt * (this.speed > 0.3 ? this.speed * 1.6 : 0);
    this.landKick = Math.max(0, this.landKick - dt * 3);
  }
  /* The jetpack: hover, climb (Space), descend (Z or Ctrl), boost (Shift). Moving forward flies where you look.
     Buildings still stop you from the side; their roofs are somewhere to land. */
  _fly(dt, input) {
    const m = input.move(), boost = input.held('sprint'), up = input.held('jump'), down = input.held('descend');
    const H = boost ? 72 : 24, V = boost ? 34 : 14;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const floor0 = this.flyFloor(this.x, this.z, this.y), agl = this.y - floor0;
    let tvx = (fx * m.y * cp + rx * m.x) * H, tvz = (fz * m.y * cp + rz * m.x) * H;
    let tvy = (m.y > 0 ? m.y * sp * H * 0.8 : 0) + (up ? V : 0) - (down ? V * (agl > 60 ? 2 : 1) : 0);
    if (this.jetLanding) { tvy = -Math.min(40, 5 + agl * 0.6); if (up) this.jetLanding = false; }
    const acc = boost ? 1.6 : 2.4;
    this.vx += (tvx - this.vx) * Math.min(1, acc * dt); this.vz += (tvz - this.vz) * Math.min(1, acc * dt);
    this.vy += (tvy - this.vy) * Math.min(1, 3 * dt);
    this.thrust = Math.min(1, 0.35 + Math.hypot(this.vx, this.vz) / 80 + Math.max(0, this.vy) / 30 + (boost ? 0.3 : 0));
    const sx = this.x, sz = this.z;
    const dist = Math.hypot(this.vx, this.vz) * dt, n = Math.max(1, Math.ceil(dist / 0.5));
    for (let i = 0; i < n; i++) this._flyStep(this.vx * dt / n, this.vz * dt / n);
    const y0 = this.y; this.y = Math.min(1600, this.y + this.vy * dt);
    { const [cx, cz] = this.city.colliders.resolve(this.x, this.z, R, this.y + 0.1, this.y + 1.75); this.x = cx; this.z = cz; }   // never come down inside anything
    const f = this.flyFloor(this.x, this.z, Math.max(y0, this.y));
    if (this.y <= f) {
      if (this.vy < -12) this.landKick = Math.min(1, -this.vy / 30);
      this.y = f; this.vy = Math.max(0, this.vy);
      this.onGround = true;
      if (this.jetLanding) {
        if (this.canLand(this.x, this.z)) { this.jet = false; this.jetLanding = false; this.vx *= 0.3; this.vz *= 0.3; this.onLanded && this.onLanded(true); }
        else { this.jetLanding = false; this.onLanded && this.onLanded(false); }   // the bay, or no room: stay aloft and say so
      }
    } else this.onGround = false;
    if (!isFinite(this.y)) { this.jet = false; this.rescue(); }
    const moved = Math.hypot(this.x - sx, this.z - sz);
    this.speed = moved / Math.max(dt, 1e-4); this.distance += moved; this.stuckTime = 0;
    this.stamina = Math.min(1, this.stamina + dt * 0.2);
    if (this.onGround && this.canLand(this.x, this.z)) this.lastSafe = [this.x, this.y, this.z];
  }
  _flyStep(dx, dz) {
    const lim = this.city.half - 80;
    const tryMove = (nx, nz) => {
      if (Math.abs(nx) > lim || Math.abs(nz) > lim) return false;
      const [cx, cz] = this.city.colliders.resolve(nx, nz, R, this.y + 0.1, this.y + 1.75);
      const f = this.flyFloor(cx, cz, this.y);
      if (f > this.y + 6) return false;              // a cliff or a wall of stone: go up and over
      if (f > this.y) this.y = f;                    // skim up over rising ground
      this.x = cx; this.z = cz; return true;
    };
    if (tryMove(this.x + dx, this.z + dz)) return;
    if (Math.abs(dx) > 1e-5 && tryMove(this.x + dx, this.z)) { this.vz *= 0.5; return; }
    if (Math.abs(dz) > 1e-5 && tryMove(this.x, this.z + dz)) { this.vx *= 0.5; return; }
    this.vx *= 0.2; this.vz *= 0.2; this.bumped = 0.2;
  }
  /** Toggle the jetpack. In the air, switching off means: come down and land somewhere safe. */
  toggleJet() {
    if (!this.jet) { this.jet = true; this.jetLanding = false; this.bike = false; this.vy = Math.max(this.vy, 6); this.onGround = false; return 'on'; }
    if (this.onGround && this.canLand(this.x, this.z)) { this.jet = false; this.jetLanding = false; return 'off'; }
    this.jetLanding = true; return 'landing';
  }
  _step(dx, dz) {
    const tryMove = (nx, nz) => {
      const [cx, cz] = this.city.colliders.resolve(nx, nz, R, this.y + 0.1, this.y + 1.75);
      const f = this.canStand(cx, cz, this.y);
      if (f === null) return false;
      this.x = cx; this.z = cz;
      if (this.onGround && f > this.y && f - this.y <= STEP) this.y = f;   // step up
      return true;
    };
    if (tryMove(this.x + dx, this.z + dz)) return;
    // slide along whatever stopped us
    if (Math.abs(dx) > 1e-5 && tryMove(this.x + dx, this.z)) { this.vz *= 0.5; return; }
    if (Math.abs(dz) > 1e-5 && tryMove(this.x, this.z + dz)) { this.vx *= 0.5; return; }
    this.vx *= 0.3; this.vz *= 0.3; this.bumped = 0.2;
  }
  eye(reduced) {
    const bob = reduced || this.bike || this.jet ? 0 : Math.sin(this.headT * 1.1) * 0.035 * Math.min(1, this.speed / 4);
    return this.y + (this.bike ? 1.55 : EYE) + bob - this.landKick * 0.12;
  }
}
