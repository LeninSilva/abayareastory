// Fighting: the Hollows (spirits made of forgetting) and the duelists (the dead who still want a fight).
import * as THREE from 'three';
import { makeHollow } from '../render/people.js';
import { WEAPONS } from '../render/people.js';

export const ABILITIES = {
  hush: { name: 'Hush', cost: 30, desc: 'Be still. Hollows near you freeze and forget you for a few seconds.' },
  flare: { name: 'Flare', cost: 40, desc: 'Remember hard, all at once. It burns the Hollows around you.' },
  step: { name: 'Undertow Step', cost: 15, desc: 'Drop your shoulder and let the city carry you forward.' }
};

export class Combat {
  constructor(game) {
    this.g = game; this.enemies = []; this.swingT = -1; this.cool = 0; this.castT = 0; this.hitDone = false; this.ambientT = 5;
    this.group = new THREE.Group(); game.scene.add(this.group); this.duel = null;
  }
  get weapon() { return WEAPONS[this.g.state.weapon] || WEAPONS.stick; }
  spawnHollow(x, z, opts = {}) {
    const m = makeHollow(), y = this.g.groundY(x, z);
    m.position.set(x, y, z); this.group.add(m);
    const lvl = this.g.state.level || 1;
    const e = { kind: 'hollow', mesh: m, x, z, y, hp: 26 + lvl * 6, max: 26 + lvl * 6, stun: 0, wind: 0, hurt: 0, quest: opts.quest || null, t: Math.random() * 10, ambient: !!opts.ambient, cool: 1 + Math.random() };
    this.enemies.push(e); return e;
  }
  startDuel(npc) {
    if (this.duel) return;
    const lvl = this.g.state.level || 1;
    this.duel = { npc, hp: 70 + lvl * 8, max: 70 + lvl * 8, wind: 0, cool: 1.5, stagger: 0, circle: 1 };
    npc.hostile = true; this.g.ui.toast(`${npc.def.name} draws on you. Block (right mouse / shield button) as they strike.`, 'warn');
    this.g.audio.bell();
  }
  endDuel(won) {
    const d = this.duel; if (!d) return; this.duel = null; d.npc.hostile = false; d.npc.mesh.userData.attacking = 0;
    if (won) { this.g.gainXP(60); this.g.quests.event('duel', d.npc.id); this.g.ui.toast(`${d.npc.def.name} yields.`, 'done'); }
  }
  clearQuestHollows(quest) { for (const e of this.enemies) if (e.quest === quest) e.dead = true; }
  // called each frame
  update(dt, t) {
    const g = this.g, p = g.player, st = g.state, inp = g.input;
    this.cool -= dt; this.castT = Math.max(0, this.castT - dt * 2);
    const blocking = inp.held('block') && !p.bike;
    this.blocking = blocking;
    // attack
    if (inp.pressed('attack') && this.cool <= 0 && !p.bike && g.canAct()) {
      this.swingT = 0; this.hitDone = false; this.cool = 0.6 / this.weapon.speed; g.audio.swing();
    }
    if (this.swingT >= 0) {
      this.swingT += dt * 2.4 * this.weapon.speed;
      if (!this.hitDone && this.swingT > 0.35) { this.hitDone = true; this._strike(); }
      if (this.swingT >= 1) this.swingT = -1;
    }
    // abilities
    if (inp.pressed('cycle')) g.cycleAbility();
    if (inp.pressed('ability') && g.canAct()) this.useAbility(st.ability);
    // enemies
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.t += dt; e.stun = Math.max(0, e.stun - dt); e.hurt = Math.max(0, e.hurt - dt * 3); e.cool -= dt;
      const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz);
      if (e.ambient && (d > 90 || (g.wardT > 0 && d < 12))) { e.dead = true; continue; }
      if (g.safeAt(p.x, p.z) || p.interior && !e.quest && e.ambient) { /* libraries are safe */ }
      else if (e.stun <= 0 && d < 34 && !(g.wardT > 0 && d < 10)) {
        if (d > 1.5) { const sp = (e.quest ? 2.4 : 2.0) * dt; e.x += dx / d * sp; e.z += dz / d * sp; }
        if (d < 2.0 && e.cool <= 0 && e.wind <= 0) { e.wind = 0.7; g.audio.hollow(); }
      }
      if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { e.cool = 1.6; if (d < 2.4 && e.stun <= 0) g.hurtPlayer(9 + (st.level || 1), blocking); } }
      e.y += (g.groundY(e.x, e.z) + 0.2 + Math.sin(e.t * 2) * 0.15 - e.y) * Math.min(1, dt * 4);
      e.mesh.position.set(e.x, e.y + (e.wind > 0 ? 0.3 : 0), e.z);
      e.mesh.rotation.y = Math.atan2(dx, dz);
      e.mesh.userData.animate(t, e.hurt);
      e.mesh.scale.setScalar(e.stun > 0 ? 0.85 : 1);
    }
    // cull the gone
    for (const e of this.enemies) if (e.dead && e.mesh.parent) { this.group.remove(e.mesh); }
    this.enemies = this.enemies.filter(e => !e.dead);
    // ambient Hollows at night and in thick fog, away from libraries
    this.ambientT -= dt;
    if (this.ambientT < 0) {
      this.ambientT = 6;
      const diff = g.settings.hollows;
      const cap = diff === 'off' ? 0 : diff === 'gentle' ? 1 : 3;
      const ambient = this.enemies.filter(e => e.ambient).length;
      if (!p.interior && g.flags.dead && (g.uNight() > 0.55 || g.fogBank > 0.75) && ambient < cap && !g.safeAt(p.x, p.z) && g.wardT <= 0 && !g.dialogueOpen) {
        const a = Math.random() * Math.PI * 2, r = 26 + Math.random() * 16, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
        if (g.city.isLand(x, z) && !g.safeAt(x, z)) this.spawnHollow(x, z, { ambient: true });
      }
    }
    // duel
    const du = this.duel;
    if (du) {
      const n = du.npc, dx = p.x - n.x, dz = p.z - n.z, d = Math.hypot(dx, dz) || 1;
      du.cool -= dt; du.stagger = Math.max(0, du.stagger - dt);
      if (d > 40) { this.g.ui.toast('You walked away from the duel.', 'warn'); du.npc.hostile = false; this.duel = null; return; }
      du.circle += dt * 0.6;
      const want = 2.4, sp = 2.6 * dt;
      if (du.stagger <= 0 && du.wind <= 0) {
        n.x += (dx / d) * (d - want) * Math.min(1, sp) + (-dz / d) * Math.sin(du.circle) * sp * 0.8;
        n.z += (dz / d) * (d - want) * Math.min(1, sp) + (dx / d) * Math.sin(du.circle) * sp * 0.8;
        const [rx, rz] = g.city.colliders.resolve(n.x, n.z, 0.35, n.y + 0.1, n.y + 1.7); n.x = rx; n.z = rz;
      }
      n.facing = Math.atan2(dx, dz);
      if (du.cool <= 0 && du.wind <= 0 && du.stagger <= 0 && d < 3.2) { du.wind = 0.55; }
      if (du.wind > 0) {
        du.wind -= dt; n.mesh.userData.attacking = 1 - du.wind / 0.55;
        if (du.wind <= 0) {
          n.mesh.userData.attacking = 0; du.cool = 1.1 + Math.random() * 0.8;
          if (d < 3.4) {
            if (blocking) { du.stagger = 1.2; g.audio.block(); g.ui.toast('Parried!', 'good'); }
            else g.hurtPlayer(11 + (st.level || 1) * 1.5, false);
          }
        }
      }
    }
  }
  _strike() {
    const g = this.g, p = g.player, w = this.weapon, st = g.state;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const base = w.dmg * (1 + (st.stats.strength || 0) * 0.12);
    let any = false;
    const inCone = (x, z, reach) => { const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz); return d < reach + 0.6 && (d < 0.8 || (dx * fx + dz * fz) / d > 0.55 - (st.stats.skill || 0) * 0.04); };
    for (const e of this.enemies) if (!e.dead && inCone(e.x, e.z, w.reach)) {
      const dmg = base * w.spirit * (e.stun > 0 ? 1.5 : 1);
      e.hp -= dmg; e.hurt = 1; any = true;
      const d = Math.hypot(e.x - p.x, e.z - p.z) || 1; e.x += (e.x - p.x) / d * 0.8; e.z += (e.z - p.z) / d * 0.8;
      if (e.hp <= 0) this._kill(e);
    }
    const du = this.duel;
    if (du && inCone(du.npc.x, du.npc.z, w.reach)) {
      const blocked = du.wind <= 0 && du.stagger <= 0 && Math.random() < 0.35 - (st.stats.skill || 0) * 0.04;
      if (blocked) { g.audio.block(); g.ui.float('blocked'); }
      else { du.hp -= base * (du.stagger > 0 ? 1.6 : 1); any = true; if (du.hp <= 0) this.endDuel(true); }
    }
    if (any) { g.audio.hit(); g.shake(0.25); }
  }
  _kill(e) {
    const g = this.g; e.dead = true; g.gainXP(15); g.audio.chime();
    g.ui.float('The Hollow remembers something, and is gone.');
    if (e.quest) { g.state.kills[e.quest] = (g.state.kills[e.quest] || 0) + 1; g.quests.check(); }
  }
  useAbility(id) {
    const g = this.g, st = g.state, p = g.player;
    if (!id || !st.abilities.includes(id)) { g.ui.toast('You have not learned an ability yet.', 'warn'); return; }
    const a = ABILITIES[id]; if (st.breath < a.cost) { g.ui.toast('Not enough breath.', 'warn'); return; }
    st.breath -= a.cost; this.castT = 1;
    const will = 1 + (st.stats.will || 0) * 0.15;
    if (id === 'hush') { for (const e of this.enemies) if (Math.hypot(e.x - p.x, e.z - p.z) < 10 * will) { e.stun = 3.5 * will; e.wind = 0; } if (this.duel) this.duel.stagger = 1.5; g.audio.chime(); }
    if (id === 'flare') { g.audio.flare(); g.flash(); for (const e of this.enemies) if (Math.hypot(e.x - p.x, e.z - p.z) < 8 * will) { e.hp -= 30 * will; e.hurt = 1; if (e.hp <= 0) this._kill(e); } }
    if (id === 'step') { const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw); for (let i = 0; i < 20; i++) p._step(fx * 0.3, fz * 0.3); g.audio.swing(); }
  }
}
