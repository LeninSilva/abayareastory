// Street life: the stray dogs of the centro (in packs and alone, drinking at the fountains, fed at the mercado),
// accidents (a car that hits someone: the fall, the crowd that gathers slowly, the Cruz Roja, the chalk outline),
// a damaged car's smoke, and the Danza de los Negritos with La Güerita on the Jardín.
import * as THREE from 'three';
import { PLACES } from '../geo.js';
import { makePerson } from '../render/people.js';
import { landmarkMaterial } from '../render/shaders.js';
import { CarKit, KIND } from '../render/detail.js';

/* ---------- a dog, built like a dog: chest, belly, haunches, four jointed legs, a head with snout and ears, a tail ---------- */
const DOGMAT = new Map();
const dm = c => { if (!DOGMAT.has(c)) DOGMAT.set(c, landmarkMaterial({ color: c, roughness: 0.95 })); return DOGMAT.get(c); };
export function makeDog(seed) {
  let a = seed * 9301 + 49297; const r = () => (a = (a * 9301 + 49297) % 233280) / 233280;
  const coat = [0x8a5a30, 0x2a2420, 0xc8a070, 0x5a4030, 0xe8e0d0, 0x6a4a2a, 0xb08050][Math.floor(r() * 7)], spot = r() < 0.4 ? [0xe8e0d0, 0x2a2420][Math.floor(r() * 2)] : coat;
  const s = 0.75 + r() * 0.45, g = new THREE.Group(), body = new THREE.Group(); g.add(body); body.scale.setScalar(s);
  const mesh = (geo, c, x, y, z) => { const m = new THREE.Mesh(geo, dm(c)); m.position.set(x, y, z); return m; };
  const torso = mesh(new THREE.CapsuleGeometry(0.13, 0.42, 5, 12).rotateZ(Math.PI / 2), coat, 0, 0.5, 0); torso.scale.set(1, 1, 0.85); body.add(torso);
  body.add(mesh(new THREE.SphereGeometry(0.14, 12, 10), spot, 0.18, 0.53, 0));
  const neck = new THREE.Group(); neck.position.set(0.3, 0.58, 0); body.add(neck);
  neck.add(mesh(new THREE.CapsuleGeometry(0.07, 0.12, 4, 8).rotateZ(-0.9), coat, 0.06, 0.06, 0));
  const head = new THREE.Group(); head.position.set(0.14, 0.14, 0); neck.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), coat, 0, 0, 0), mesh(new THREE.CapsuleGeometry(0.045, 0.1, 4, 8).rotateZ(Math.PI / 2), spot, 0.12, -0.03, 0), mesh(new THREE.SphereGeometry(0.022, 8, 6), 0x101010, 0.19, -0.02, 0));
  for (const sd of [-1, 1]) { const ear = mesh(new THREE.ConeGeometry(0.04, 0.09, 6), shadeHex(coat, 0.8), -0.01, 0.08, sd * 0.06); ear.rotation.x = sd * 0.4; ear.rotation.z = r() < 0.5 ? 0.6 : 0.1; head.add(ear); head.add(mesh(new THREE.SphereGeometry(0.014, 6, 5), 0x0a0806, 0.075, 0.025, sd * 0.045)); }
  const legs = [];
  for (const [x, z] of [[0.22, 0.08], [0.22, -0.08], [-0.2, 0.08], [-0.2, -0.08]]) { const L = new THREE.Group(); L.position.set(x, 0.45, z); L.add(mesh(new THREE.CapsuleGeometry(0.035, 0.32, 4, 8), coat, 0, -0.2, 0)); body.add(L); legs.push(L); }
  const tail = new THREE.Group(); tail.position.set(-0.3, 0.55, 0); tail.add(mesh(new THREE.CapsuleGeometry(0.025, 0.22, 4, 6).rotateZ(-0.9), coat, -0.08, 0.06, 0)); body.add(tail);
  let ph = r() * 10;
  g.userData.animate = (dt, speed, t, drink) => {
    ph += dt * (2 + speed * 2.6); const w = Math.min(1, speed / 1.2);
    legs[0].rotation.z = Math.sin(ph) * 0.6 * w; legs[3].rotation.z = Math.sin(ph) * 0.6 * w; legs[1].rotation.z = -Math.sin(ph) * 0.6 * w; legs[2].rotation.z = -Math.sin(ph) * 0.6 * w;
    tail.rotation.x = Math.sin(t * (speed > 0.1 ? 12 : 5)) * 0.5; tail.rotation.z = 0.3;
    neck.rotation.z = drink ? -0.9 : Math.sin(t * 0.7 + ph) * 0.08; body.position.y = Math.abs(Math.sin(ph)) * 0.02 * w;
  };
  return g;
}
function shadeHex(c, k) { const col = new THREE.Color(c); col.multiplyScalar(k); return col.getHex(); }

/* a chalk outline on the pavement */
let CHALK = null;
function chalkTex() {
  if (CHALK) return CHALK;
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.strokeStyle = 'rgba(245,245,240,0.92)'; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath();
  const P = [[30, 64], [40, 46], [62, 40], [80, 22], [92, 26], [86, 44], [120, 48], [150, 36], [176, 30], [200, 40], [214, 56], [214, 72], [200, 88], [176, 98], [150, 92], [120, 82], [86, 86], [92, 104], [80, 108], [62, 90], [40, 84]];
  P.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); x.stroke();
  x.beginPath(); x.arc(226, 64, 16, 0, 7); x.stroke();
  CHALK = new THREE.CanvasTexture(c); return CHALK;
}

export class StreetLife {
  constructor(game) {
    this.g = game; this.dogs = []; this.marks = []; this.hurt = []; this.smoke = []; this.dance = null; this.dogT = 0;
    const scene = game.scene; this.group = new THREE.Group(); scene.add(this.group);
    this.ambKit = new CarKit(game.renderer, 2); this.group.add(this.ambKit.group);
    const smTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
    for (let k = 0; k < 24; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smTex, color: 0x2a2a2a, transparent: true, depthWrite: false, opacity: 0 })); sp.visible = false; this.group.add(sp); this.smoke.push({ sp, life: 0 }); }
    // Doña Carmen's water tray and bones by the mercado
    const m = PLACES.mercado, sp = game.spots.shop_mercado || [m.x, game.city.heightAt(m.x, m.z), m.z];
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.08, 16), landmarkMaterial({ color: 0x8a8a90, metalness: 0.6, roughness: 0.3 })); tray.position.set(sp[0] + 2.2, sp[1] + 0.04, sp[2] + 0.6); this.group.add(tray);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.24, 14), landmarkMaterial({ color: 0x4a6a78, roughness: 0.05 })); water.rotation.x = -Math.PI / 2; water.position.set(tray.position.x, tray.position.y + 0.05, tray.position.z); this.group.add(water);
    this.trayPos = [tray.position.x, tray.position.z];
    this.carmen = makePerson({ skin: 0xa8765a, hair: 0x3a2a1a, hairStyle: 'braid', top: 0xc8402a, bottom: 0x2a2a30, dress: true, accessory: 'apron', height: 0.92, build: 1.1, belly: 0.4, seed: 4242, fem: true });
    this.carmen.position.set(sp[0] + 3.4, sp[1], sp[2] + 1.2); this.group.add(this.carmen); this.carmenT = 0;
  }
  /* ---------- dogs ---------- */
  _homes() { return ['jardin', 'plazaSur', 'mercado', 'jardinPaz', 'bosque', 'guadalupe', 'cayetano', 'parroquia'].map(id => PLACES[id]); }
  _spawnDogs() {
    const p = this.g.player, homes = this._homes().filter(h => Math.hypot(h.x - p.x, h.z - p.z) < 450);
    if (!homes.length || this.dogs.length >= 9) return;
    const h = homes[Math.floor(Math.random() * homes.length)], pack = Math.random() < 0.45, n = pack ? 2 + Math.floor(Math.random() * 3) : 1, seed = Math.floor(Math.random() * 1e6);
    const leader = { home: h, tx: h.x, tz: h.z, wait: 0 };
    for (let k = 0; k < n; k++) {
      const mesh = makeDog(seed + k * 77), [x, y, z] = this.g.findSpot(h.x + (Math.random() - 0.5) * 30, h.z + (Math.random() - 0.5) * 30);
      mesh.position.set(x, y, z); this.group.add(mesh);
      this.dogs.push({ mesh, x, z, ang: Math.random() * 6, speed: 0, lead: k === 0 ? null : leader, me: k === 0 ? leader : null, off: [(Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3], drink: 0 });
    }
  }
  _dogs(dt) {
    const g = this.g, p = g.player, C = g.city.colliders, t = g.t;
    this.dogT -= dt; if (this.dogT < 0) { this.dogT = 6; this._spawnDogs(); }
    const fountains = [PLACES.plazaSur, PLACES.jardinPaz, { x: PLACES.jardin.x - 24, z: PLACES.jardin.z }];
    for (const d of this.dogs) {
      const L = d.me || d.lead; let tx, tz, run = 0;
      if (d.me) {   // a leader picks the next thing to do: wander, the fountain, the mercado's tray
        if (Math.hypot(L.tx - d.x, L.tz - d.z) < 2.5) { L.wait -= dt; if (L.wait < 0) {
          const r = Math.random(), f = fountains[Math.floor(Math.random() * fountains.length)];
          if (r < 0.2) { L.tx = f.x + 2.6; L.tz = f.z; L.drinkAt = true; } else if (r < 0.35) { L.tx = this.trayPos[0] + 0.6; L.tz = this.trayPos[1]; L.drinkAt = true; }
          else { L.tx = L.home.x + (Math.random() - 0.5) * 70; L.tz = L.home.z + (Math.random() - 0.5) * 60; L.drinkAt = false; }
          L.wait = 3 + Math.random() * 8; } }
        tx = L.tx; tz = L.tz;
      } else { tx = L.lx + d.off[0]; tz = L.lz + d.off[1]; }
      // a car coming: get out of the way
      const car = g.vehicles.driving; if (car && Math.hypot(car.x - d.x, car.z - d.z) < 9 && Math.abs(car.speed) > 2) { tx = d.x + (d.x - car.x) * 2; tz = d.z + (d.z - car.z) * 2; run = 1; }
      const dx = tx - d.x, dz = tz - d.z, dist = Math.hypot(dx, dz);
      const want = dist > 1.2 ? (run ? 6 : dist > 15 ? 2.6 : 1.3) : 0; d.speed += (want - d.speed) * Math.min(1, dt * 3);
      if (dist > 0.1) { let da = Math.atan2(dz, dx) - d.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); d.ang += da * Math.min(1, dt * 4); }
      let nx = d.x + Math.cos(d.ang) * d.speed * dt, nz = d.z + Math.sin(d.ang) * d.speed * dt; const y = g.city.heightAt(nx, nz);
      [nx, nz] = C.resolve(nx, nz, 0.3, y + 0.1, y + 0.7); d.x = nx; d.z = nz;
      if (d.me) { L.lx = d.x; L.lz = d.z; }
      d.drink = !run && L.drinkAt && dist < 1.4 && d.speed < 0.3;
      d.mesh.position.set(d.x, g.findFloor(d.x, d.z, y + 0.5), d.z); d.mesh.rotation.y = -d.ang;
      d.mesh.userData.animate(dt, d.speed, t, d.drink);
      if (Math.hypot(d.x - p.x, d.z - p.z) > 520) d.gone = true;
    }
    for (const d of this.dogs) if (d.gone) this.group.remove(d.mesh);
    this.dogs = this.dogs.filter(d => !d.gone);
    // Doña Carmen tosses something to the dogs now and then
    this.carmenT -= dt; const cm = this.carmen.userData;
    if (this.carmenT < 0) { this.carmenT = 25 + Math.random() * 30; cm.attacking = 1; this.tossT = 1; for (const d of this.dogs) if (d.me && Math.hypot(d.x - this.trayPos[0], d.z - this.trayPos[1]) < 80) { d.me.tx = this.trayPos[0] + 1.4; d.me.tz = this.trayPos[1] + 1; d.me.wait = 6; d.me.drinkAt = true; } }
    if (this.tossT > 0) { this.tossT -= dt * 2; cm.attacking = Math.max(0, this.tossT); }
    this.carmen.rotation.y = -Math.PI / 2; cm.animate(dt, 0, t);
  }
  /* ---------- accidents ---------- */
  bump(dt) {
    const g = this.g, p = g.player, car = g.vehicles.driving;
    for (const w of g.walkers) {
      if (w.down || w.talk) continue; const m = w.mesh.position, dx = m.x - p.x, dz = m.z - p.z, d = Math.hypot(dx, dz);
      if (car) {
        const sp = Math.abs(car.speed); if (sp < 2.5) continue;
        const ca = Math.cos(car.ang), sa = Math.sin(car.ang), lx = (m.x - car.x) * ca + (m.z - car.z) * sa, lz = -(m.x - car.x) * sa + (m.z - car.z) * ca;
        const K = g.vehicles.kit.kinds[car.kind]; if (Math.abs(lx) < K.L / 2 + 0.3 && Math.abs(lz) < K.W / 2 + 0.3 && Math.abs(m.y - car.y) < 2) this.hit(w, car, sp);
      } else if (d < 0.65 && !p.jet) {   // shoulder to shoulder on the sidewalk
        const k = (0.65 - d) / (d || 1); m.x += dx * k; m.z += dz * k;
        if (p.speed > 4.5 && !w.bumped) { w.bumped = 4; w.mesh.userData.setExpression && w.mesh.userData.setExpression('angry'); g.ui.subtitle(w.def.name, ['¡Fíjese por dónde camina!', '¡Ay! ¡Con permiso, ¿no?!', '¡Oiga, joven!'][Math.floor(Math.random() * 3)], 2.5); g.life.trait('heart', -1, true); }
      }
      if (w.bumped > 0) w.bumped -= dt;
    }
  }
  hit(w, car, sp) {
    const g = this.g, severe = sp > 9;
    w.down = { t: 0, severe, vx: Math.cos(car.ang) * sp * 0.45, vz: Math.sin(car.ang) * sp * 0.45, gather: 3 + Math.random() * 5 };
    w.mesh.userData.setExpression && w.mesh.userData.setExpression('surprised');
    car.damage = Math.min(1, (car.damage || 0) + sp / 80); car.speed *= 0.6; g.vehicles.bump = Math.min(1, sp / 20);
    g.audio.crash(Math.min(1, sp / 25));
    g.life.trait('heart', severe ? -10 : -5); g.life.trait('fame', 2, true);
    g.ui.toast(severe ? `You hit ${w.def.name}. They don't get up.` : `You knock ${w.def.name} down!`, 'warn');
    this.hurt.push(w); w.stuck = true;
  }
  _hurt(dt) {
    const g = this.g;
    for (const w of this.hurt) {
      const D = w.down; D.t += dt; const m = w.mesh.position;
      w.mesh.userData.down = Math.min(1, D.t * 3);
      if (D.t < 1) { m.x += D.vx * dt; m.z += D.vz * dt; D.vx *= 0.9; D.vz *= 0.9; m.y = g.city.heightAt(m.x, m.z) + 0.05; }
      w.mesh.userData.animate(dt, 0, g.t);
      // the crowd notices, slowly
      if (D.t > D.gather && !D.gathered) { D.gathered = true; for (const o of g.walkers) if (o !== w && !o.down && Math.hypot(o.mesh.position.x - m.x, o.mesh.position.z - m.z) < 40) { o.gawk = { x: m.x, z: m.z, t: 25 + Math.random() * 15 }; o.mesh.userData.setExpression && o.mesh.userData.setExpression('surprised'); } }
      if (!D.severe && D.t > 4 && !D.up) { D.up = true; w.mesh.userData.down = 0; w.down = null; w.stuck = false; w.speed *= 0.5; w.mesh.userData.setExpression && w.mesh.userData.setExpression('angry'); g.ui.subtitle(w.def.name, ['¡¿Qué le pasa?! ¡Casi me mata!', '¡Ay, mi pierna! ¡Voy a llamar a la policía!', '¡Fíjese, animal!'][Math.floor(Math.random() * 3)], 4); w.limp = 30; continue; }
      if (D.severe && D.t > 6 && !D.chalk) { D.chalk = true; this.outline(m.x, m.z, w.mesh.rotation.y); }
      if (D.severe && D.t > 28 && !D.amb) { D.amb = this._ambulance(m.x, m.z); g.ui.toast('The Cruz Roja arrives, siren and all.', 'warn'); }
      if (D.severe && D.t > 40) { w.gone = true; w.talk = null; D.done = true; }
      if (D.amb) D.amb.t += dt;
    }
    this.hurt = this.hurt.filter(w => !(w.down && w.down.done) && w.down);
    // the ambulance, parked with its lights going
    this.ambKit.begin(); for (const w of this.hurt) { const A = w.down && w.down.amb; if (A) this.ambKit.add(A.x, A.y, A.z, A.ang, 0, KIND.van, 0xf4f4f2); } this.ambKit.commit(); this.ambKit.night(Math.sin(g.t * 9) > 0 ? 1 : 0.2);
    // chalk outlines fade after a few hours
    for (const k of this.marks) { k.t += dt; k.mesh.material.opacity = Math.max(0, 1 - k.t / 600); }
    for (const k of this.marks) if (k.t > 600) this.group.remove(k.mesh);
    this.marks = this.marks.filter(k => k.t <= 600);
  }
  _ambulance(x, z) { const s = this.g.city.nearestStreet(x, z, 60, [0]), ax = s ? s.x : x + 4, az = s ? s.z : z; return { x: ax, z: az, y: this.g.city.heightAt(ax, az) + 0.12, ang: s ? Math.atan2(s.tz, s.tx) : 0, t: 0 }; }
  outline(x, z, ang) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: chalkTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = ang; m.position.set(x, this.g.city.heightAt(x, z) + 0.06, z); this.group.add(m); this.marks.push({ mesh: m, t: 0 });
  }
  /* ---------- a damaged car smokes ---------- */
  _smoke(dt) {
    const car = this.g.vehicles.driving || this.g.vehicles.cars.find(c => (c.damage || 0) > 0.45 && Math.hypot(c.x - this.g.player.x, c.z - this.g.player.z) < 60);
    this.smT = (this.smT || 0) - dt;
    if (car && (car.damage || 0) > 0.4 && this.smT < 0) {
      this.smT = 0.25 - car.damage * 0.15; const s = this.smoke.find(q => q.life <= 0);
      if (s) { s.life = 2.5; s.sp.visible = true; s.sp.position.set(car.x + Math.cos(car.ang) * 1.6, car.y + 1.1, car.z + Math.sin(car.ang) * 1.6); s.sp.material.color.setHex(car.damage > 0.8 ? 0x1a1a1a : 0x6a6a6a); }
    }
    for (const s of this.smoke) if (s.life > 0) { s.life -= dt; s.sp.position.y += dt * 1.2; s.sp.position.x += dt * 0.3; const k = 1 - s.life / 2.5; s.sp.scale.setScalar(0.6 + k * 2.4); s.sp.material.opacity = (1 - k) * 0.55; if (s.life <= 0) s.sp.visible = false; }
  }
  /* ---------- the Danza de los Negritos, with La Güerita, on the Jardín ---------- */
  danceTime() { const s = this.g.state, dow = (s.day - 1) % 7; return (dow === 5 && s.hour >= 17 && s.hour < 20.5) || (dow === 1 && s.hour >= 18 && s.hour < 19.5) || !!this.forceDance; }
  _dance(dt) {
    const g = this.g, j = PLACES.jardin, on = this.danceTime() && Math.hypot(g.player.x - j.x, g.player.z - j.z) < 400;
    if (on && !this.dance) {
      const grp = new THREE.Group(); this.group.add(grp); const dancers = [];
      const coat = [0xb8602a, 0xa0522d, 0xc87a3a, 0x8a4a28];
      for (let k = 0; k < 10; k++) {
        const kid = k > 7, row = k % 2, col = Math.floor(k / 2);
        const mesh = makePerson({ mask: 'negrito', skin: 0x5a3a24, top: 0xf4f0e8, bottom: 0x2a3a5a, coat: coat[k % 4], accessory: 'scarf', accColor: 0xeaf2fa, shoes: 0x2a2018, hat: 'none', hairStyle: 'short', height: kid ? 0.7 : 1, seed: 900 + k });
        const toro = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.16, 4, 8).rotateZ(Math.PI / 2), dm(0x2a2420)); toro.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), dm(0x2a2420)); h.position.x = 0.13; toro.add(h); for (const s of [-1, 1]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.06, 5), dm(0xe8e0c8)); hn.position.set(0.15, 0.05, s * 0.03); toro.add(hn); } }
        toro.position.set(0.25, 2.2 * (kid ? 0.7 : 1), 0.1); if (k % 3 === 0) mesh.add(toro);
        mesh.position.set(-10 + col * 3.2, 0, -4 + row * 2.6); grp.add(mesh); dancers.push({ mesh, row, col, ph: k * 0.4 });
      }
      // La Güerita: in a bright skirt and rebozo, a pale mask, teasing the line and the crowd
      const guera = makePerson({ skin: 0xf0d8c0, hair: 0xd8b060, hairStyle: 'braid', top: 0xf0c8d8, bottom: 0xd02870, dress: true, accessory: 'rebozo', accColor: 0x3a6ad8, height: 1.02, seed: 977, fem: true });
      guera.position.set(-12, 0, -1.3); grp.add(guera); dancers.push({ mesh: guera, guera: true, ph: 0 });
      const y = g.city.heightAt(j.x - 20, j.z - 20); grp.position.set(j.x + 18, y + 0.15, j.z - 30); grp.rotation.y = Math.PI / 2;
      this.dance = { grp, dancers, t: 0 };
      g.ui.toast('¡La Danza de los Negritos! The dancers are coming down the Jardín, with La Güerita.', 'quest');
      g.unlock && g.unlock('danza');
    }
    if (!on && this.dance) { this.group.remove(this.dance.grp); this.dance = null; }
    if (!this.dance) return;
    const D = this.dance; D.t += dt;
    for (const d of D.dancers) {
      const m = d.mesh, u = m.userData, beat = D.t * 2.4 + d.ph;
      if (d.guera) { m.position.x = -12 + Math.sin(D.t * 0.25) * 9; m.position.z = -1.3 + Math.sin(D.t * 0.7) * 1.5; m.rotation.y = Math.sin(D.t * 0.5) * 1.4 + Math.PI / 2; u.talking = Math.sin(D.t * 0.3) > 0.6; u.animate(dt, 1.1, g.t); continue; }
      // the step: a stamp side to side, a turn on the count of four, the rattle (and the little bull) raised high
      m.position.y = Math.max(0, Math.sin(beat * Math.PI)) * 0.08; m.rotation.y = (d.row ? -1 : 1) * 0.6 + Math.sin(beat * 0.5) * 0.4 + (Math.floor(beat / 4) % 2 ? Math.PI : 0);
      u.attacking = (Math.sin(beat * Math.PI) + 1) * 0.4; u.animate(dt, 1.3, g.t);
    }
  }
  update(dt) { this._dogs(dt); this.bump(dt); this._hurt(dt); this._smoke(dt); this._dance(dt); }
}
