// Driving: get into any parked car (or one stopped in traffic), arcade physics that follow the hills and the
// cobbles, collisions that bounce you off walls and other cars, a chase camera, and the engine's voice.
import * as THREE from 'three';
import { CarKit } from '../render/detail.js';

const DIMS = [{ L: 4.5, W: 1.8, wb: 2.7 }, { L: 4.7, W: 1.9, wb: 2.9 }, { L: 5.1, W: 1.95, wb: 3.3 }];

export class Vehicles {
  constructor(city, renderer) {
    this.city = city; this.kit = new CarKit(renderer, 12); this.group = this.kit.group;
    this.cars = [];        // cars the player has driven (they stay where you leave them)
    this.driving = null; this.camYaw = 0; this.camT = 0; this.odometer = 0; this.air = 0; this.maxAir = 0;
  }
  add(o) { const c = Object.assign({ speed: 0, steer: 0, vy: 0, pitch: 0, roll: 0, onGround: true }, o); this.cars.push(c); return c; }
  nearest(x, z, r) { let best = null, bd = r * r; for (const c of this.cars) { const d = (c.x - x) ** 2 + (c.z - z) ** 2; if (d < bd && c !== this.driving) { bd = d; best = c; } } return best; }
  enter(car, player) {
    this.driving = car; car.speed = car.speed || 0; this.camYaw = 0;
    player.bike = false; player.jet = false; player.jetLanding = false; player.driving = car;
  }
  exit(player) {
    const c = this.driving; if (!c) return;
    const lx = Math.sin(c.ang), lz = -Math.cos(c.ang);   // the driver's side (left of the car's forward)
    for (const d of [2.1, 2.8, -2.1, -2.8, 3.6]) {
      const x = c.x + lx * d, z = c.z + lz * d, y = this.city.heightAt(x, z);
      if (player.isFree(x, z, y)) { player.teleport(x, z, y); break; }
    }
    player.driving = null; player.yaw = -c.ang - Math.PI / 2; c.speed = 0; this.driving = null;
  }
  /* input: move() x = steer, y = throttle; held('jump') = handbrake */
  update(dt, input, traffic, audio) {
    const c = this.driving;
    if (c) {
      const m = input.move(), D = DIMS[c.kind], hand = input.held('jump');
      const fwd = m.y, maxF = input.held('sprint') ? 46 : 36, maxR = 9;
      // throttle, brakes, drag
      if (fwd > 0.05) c.speed += (c.speed < -0.5 ? 16 : 7.5 * (1 - Math.max(0, c.speed) / maxF)) * fwd * dt;
      else if (fwd < -0.05) c.speed -= (c.speed > 0.5 ? 16 : 5 * (1 - Math.max(0, -c.speed) / maxR)) * -fwd * dt;
      else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), (1.2 + Math.abs(c.speed) * 0.04) * dt * 3);
      if (hand) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 10 * dt);
      c.speed = Math.max(-maxR, Math.min(maxF, c.speed));
      // steering: less lock at speed; the handbrake lets the tail come round
      const lock = 0.6 / (1 + Math.abs(c.speed) / 18);
      c.steer += (m.x * lock - c.steer) * Math.min(1, dt * 6);
      if (c.onGround) c.ang += c.speed * Math.tan(c.steer) / D.wb * dt * (hand ? 1.7 : 1);
      // move in small steps and bounce off whatever we hit
      const vx = Math.cos(c.ang) * c.speed, vz = Math.sin(c.ang) * c.speed;
      const n = Math.max(1, Math.ceil(Math.abs(c.speed) * dt / 0.4));
      let hit = 0;
      for (let i = 0; i < n; i++) {
        let x = c.x + vx * dt / n, z = c.z + vz * dt / n;
        const [rx, rz] = this._resolve(c, x, z, D);
        if (Math.abs(rx - x) + Math.abs(rz - z) > 1e-3) hit = Math.max(hit, Math.abs(c.speed));
        const lim = this.city.walkHalf - 80; x = Math.max(-lim, Math.min(lim, rx)); z = Math.max(-lim, Math.min(lim, rz));
        c.x = x; c.z = z;
      }
      // other cars
      if (traffic) for (const o of traffic.cars) {
        const d = Math.hypot(o.x - c.x, o.z - c.z);
        if (d < 3.4) { const k = (3.4 - d) / (d || 1); c.x -= (o.x - c.x) * k * 0.6; c.z -= (o.z - c.z) * k * 0.6; o.v = 0; hit = Math.max(hit, Math.abs(c.speed)); }
      }
      for (const o of this.cars) if (o !== c) { const d = Math.hypot(o.x - c.x, o.z - c.z); if (d < 3.4) { const k = (3.4 - d) / (d || 1); c.x -= (o.x - c.x) * k * 0.5; c.z -= (o.z - c.z) * k * 0.5; o.x += (o.x - c.x) * k * 0.3; o.z += (o.z - c.z) * k * 0.3; hit = Math.max(hit, Math.abs(c.speed)); } }
      if (hit > 2) { c.speed *= -0.25; this.bump = Math.min(1, hit / 25); audio && audio.crash(Math.min(1, hit / 30)); }
      else if (hit) c.speed *= 0.6;
      // the ground: follow it, or fly off a crest
      const gF = this.city.heightAt(c.x + Math.cos(c.ang) * D.wb / 2, c.z + Math.sin(c.ang) * D.wb / 2);
      const gB = this.city.heightAt(c.x - Math.cos(c.ang) * D.wb / 2, c.z - Math.sin(c.ang) * D.wb / 2);
      const g = (gF + gB) / 2 + 0.1;
      if (c.onGround) {
        const want = g, slopeV = (want - c.y) / Math.max(dt, 1e-3);
        if (want < c.y - 0.35 && Math.abs(c.speed) > 12) { c.onGround = false; c.vy = Math.min(c.lastVy || 0, 2); this.air = 0; }
        else { c.lastVy = slopeV; c.y = want; c.vy = 0; }
      }
      if (!c.onGround) {
        c.vy -= 18 * dt; c.y += c.vy * dt; this.air += dt;
        if (c.y <= g) { c.y = g; c.onGround = true; this.maxAir = Math.max(this.maxAir, this.air); if (c.vy < -6) { this.bump = Math.min(1, -c.vy / 20); audio && audio.crash(0.4); } c.vy = 0; }
      }
      const tp = Math.atan2(gF - gB, D.wb); c.pitch += (c.onGround ? tp - c.pitch : -0.2 * dt) * Math.min(1, dt * 8);
      this.odometer += Math.abs(c.speed) * dt;
      audio && audio.engine(Math.min(1, Math.abs(c.speed) / 40), fwd > 0.05 ? 1 : 0.3);
    } else audio && audio.engine(0, 0);
    this.bump = Math.max(0, (this.bump || 0) - dt * 2);
    // draw them
    this.kit.begin();
    for (const o of this.cars) this.kit.add(o.x, o.y, o.z, o.ang, o.pitch || 0, o.kind, o.color);
    this.kit.commit();
  }
  _resolve(c, x, z, D) {
    // three circles down the length of the car against the town's walls, poles, trees and parked cars
    const cs = Math.cos(c.ang), sn = Math.sin(c.ang), off = D.L / 2 - D.W / 2;
    for (let pass = 0; pass < 2; pass++) for (const t of [-off, 0, off]) {
      const px = x + cs * t, pz = z + sn * t;
      const [rx, rz] = this.city.colliders.resolve(px, pz, D.W / 2, c.y + 0.3, c.y + 1.4);
      x += rx - px; z += rz - pz;
    }
    return [x, z];
  }
  /* the chase camera: behind and above, looking a little ahead; the mouse swings it round, then it settles */
  camera(cam, input, dt) {
    const c = this.driving; if (!c) return;
    const l = input.lookDelta(); this.camYaw -= l.dx; this.camYaw *= Math.pow(0.25, dt * (Math.abs(l.dx) > 0 ? 0 : 1));
    const heading = c.ang + (c.speed < -1 ? Math.PI : 0), a = heading + Math.PI + this.camYaw;
    let dist = 6.8 + Math.min(4, Math.abs(c.speed) / 10); const h = 2.5;
    // don't put the camera inside a wall: pull it in toward the car until the view is clear
    for (let k = 1; k <= 10; k++) { const d = dist * k / 10, px = c.x + Math.cos(a) * d, pz = c.z + Math.sin(a) * d; if (this.city.colliders.blocked(px, pz, 0.4, c.y + h - 1, c.y + h + 0.5)) { dist = Math.max(2.2, d - 0.8); break; } }
    const tx = c.x + Math.cos(a) * dist, tz = c.z + Math.sin(a) * dist;
    const ty = Math.max(this.city.heightAt(tx, tz) + 1.2, c.y + h);
    if (!this._cam) this._cam = new THREE.Vector3(tx, ty, tz);
    this._cam.lerp(new THREE.Vector3(tx, ty, tz), Math.min(1, dt * 6));
    cam.position.copy(this._cam);
    const bump = (this.bump || 0) * 0.15;
    cam.lookAt(c.x + Math.cos(heading) * 4, c.y + 1.3 + (Math.random() - 0.5) * bump, c.z + Math.sin(heading) * 4);
  }
}
