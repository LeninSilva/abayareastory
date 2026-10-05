// The life-sim half of the game, mixed into Game: the new cast and their timetables, shops, land and the house
// you build, businesses, the taxi job, the third-person and shop cameras, weddings, sleeping at home, and the
// achievements that follow from all of it.
import * as THREE from 'three';
import { PLACES, barrio } from '../geo.js';
import { CAST, STORY_TEMPER, STORY_LIKES } from './cast.js';
import { CHARACTERS, EXTRAS } from './story.js';
import { SHOPS, CLOTHES, ITEMS, LOTS, BUSINESSES, HOUSE_PARTS } from './shops.js';
import { TONES } from './talk.js';
import { QUEST } from './sidequests.js';
import { makeCitizen } from './citizens.js';
import { makePerson } from '../render/people.js';
import { buildHouse, LOT_W, LOT_D } from '../render/house.js';
import { makeCow } from '../render/landmarks.js';
import { CarKit, KIND } from '../render/detail.js';
import { StreetLife } from './street.js';
import { ROUTES } from '../render/traffic.js';

const REGIDORES = ['regMorena', 'regPan', 'regPri', 'regPrd', 'regMc'];
// the story's people join the relationship system: a temperament, what they like, and they are not for romance
for (const [id, c] of Object.entries(CHARACTERS)) { c.temper = STORY_TEMPER[id] || 'warm'; c.likes = STORY_LIKES[id] || ['pan']; c.cast = 'story'; c.noRomance = true; c.adult = true; }
const TAXI_STOPS = ['jardin', 'parroquia', 'biblioteca', 'presidencia', 'casaLC', 'portada', 'museo', 'monumento', 'guadalupe', 'cayetano', 'toros', 'jardinPaz', 'panteon', 'casita', 'mercado', 'cremeria', 'taller'];

export const LifeGame = {
  /* ---------------- world setup ---------------- */
  worldExtras() {
    const R = this.renderer, city = this.city;
    // taxis waiting at the sitios
    this.taxiDecor = new CarKit(R, 10); this.surface.add(this.taxiDecor.group);
    this.taxiSpots = this.landmarks.userData.taxiKit || [];
    // lots for sale, found on the real ground near where the list says
    this.lots = LOTS.map(L => Object.assign({}, L, this.findLot(L.x, L.z)));
    this.houseGroup = new THREE.Group(); this.surface.add(this.houseGroup);
    // markers: things to pick up, people with something for you
    const tex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
    const badge = (ch, bg) => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = bg; c.beginPath(); c.arc(32, 32, 28, 0, 7); c.fill(); c.fillStyle = '#10131c'; c.font = '800 40px Inter, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 32, 35); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
    this.badgeTex = { quest: badge('!', '#7fe0cf'), story: badge('!', '#ffcf5a'), shop: badge('$', '#f2efe8'), turn: badge('?', '#7fe0cf') };
    this.pickGroup = new THREE.Group(); this.surface.add(this.pickGroup);
    this.pickPool = []; this.pickTex = tex; this.cow = null;
    this.badges = []; this.badgeGroup = new THREE.Group(); this.surface.add(this.badgeGroup);
    this.crew = [makePerson({ skin: 0x8a5a3c, top: 0x9a9690, bottom: 0x4a4030, hat: 'cap', hatColor: 0xd8a020 }), makePerson({ skin: 0xa8765a, top: 0xe8e2d4, bottom: 0x2a3a5a, hat: 'wide', hatColor: 0xd8c8a0 })];
    for (const c of this.crew) { c.visible = false; this.scene.add(c); }
    this.detail.userData.reserve(this.taxiSpots.map(t => [t[0], t[2]]).concat(this.lots.map(l => [l.x, l.z])));
    this.street = new StreetLife(this);
    // Ferretería La Esperanza: four black tinacos left at the foot of the Monumento, to be carried to the shop door
    {
      const prof = [[0, 0], [0.5, 0], [0.56, 0.06], [0.56, 1.02], [0.5, 1.14], [0.3, 1.24], [0.2, 1.26], [0.2, 1.34], [0, 1.34]].map(([r, y]) => new THREE.Vector2(r, y));
      const tg = new THREE.LatheGeometry(prof, 28), tm = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.5 });
      const tin = () => { const m = new THREE.Mesh(tg, tm); m.castShadow = true; return m; };
      const M = PLACES.monumento, F = PLACES.ferreLuis, f = city.storefront(F.x, F.z);
      this.tinacos = { from: [], to: [], hand: tin() };
      for (let k = 0; k < 4; k++) { const x = M.x + 6.2 + (k % 2) * 1.25, z = M.z - 1.4 + Math.floor(k / 2) * 1.3, m = tin(); m.position.set(x, city.heightAt(x, z), z); this.surface.add(m); this.tinacos.from.push(m); }
      const tx = Math.cos(f.ang), tz = -Math.sin(f.ang);   // along the shop front
      for (let k = 0; k < 4; k++) { const x = f.sx + tx * (2.2 + k * 1.2), z = f.sz + tz * (2.2 + k * 1.2), m = tin(); m.position.set(x, city.heightAt(x, z), z); m.visible = false; this.surface.add(m); this.tinacos.to.push(m); }
      const h = this.tinacos.hand; h.scale.setScalar(0.42); h.castShadow = false; h.visible = false; this.scene.add(h);
    }
    this.vehicles.onWreck = () => this.ui.toast('The engine coughs, bangs and dies. This car is finished: find another.', 'warn');
  },
  /** a flat, empty 16 x 20 m piece of land beside a street near (x, z), facing the street */
  findLot(x0, z0) {
    const city = this.city; let best = null, bs = 1e9;
    for (let r = 0; r <= 140; r += 8) for (let a = 0; a < Math.PI * 2; a += r ? 8 / r : 7) {
      const x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r, s = city.nearestStreet(x, z, 40, [0, 3]); if (!s) continue;
      const dist = s.half + LOT_D / 2 + 0.5, cx = s.x + s.nx * dist, cz = s.z + s.nz * dist, ang = Math.atan2(s.nx, s.nz);
      const cs = Math.cos(ang), sn = Math.sin(ang); let ok = true, hmin = 1e9, hmax = -1e9;
      for (let i = -2; i <= 2 && ok; i++) for (let j = -2; j <= 2 && ok; j++) {
        const lx = i * LOT_W / 4.4, lz = j * LOT_D / 4.4, wx = cx + lx * cs + lz * sn, wz = cz - lx * sn + lz * cs, h = city.heightAt(wx, wz);
        hmin = Math.min(hmin, h); hmax = Math.max(hmax, h);
        if (city.colliders.blocked(wx, wz, 1.4, h + 0.4, h + 2) || city.streetsAt(wx, wz, this._hits || (this._hits = [])).length) ok = false;
      }
      if (!ok || hmax - hmin > 3.5) continue;
      const score = r + (hmax - hmin) * 6; if (score < bs) { bs = score; best = { x: cx, z: cz, ang, y: hmin }; }
      if (bs < 20) break;
    }
    return best || { x: x0, z: z0, ang: 0, y: city.heightAt(x0, z0) };
  },
  refreshLots() {
    if (!this.lots) return;
    for (const L of this.lots) {
      if (L.mesh) { this.houseGroup.remove(L.mesh); L.mesh.traverse(o => o.geometry && o.geometry.dispose()); }
      for (const c of L.colls || []) this.city.colliders.remove(c);
      const lot = this.state.life.props[L.id] || { owned: false, parts: [], queue: [] }, building = lot.queue && lot.queue[0] ? lot.queue[0].part : null;
      const { group, colliders } = buildHouse({ style: lot.style || 'colonial', color: lot.color || 0, parts: lot.parts || [], building, owned: !!lot.owned, name: lot.name, owner: this.state.name, forSale: L.name, shopName: lot.shopName });
      group.position.set(L.x, L.y, L.z); group.rotation.y = L.ang; this.houseGroup.add(group); L.mesh = group;
      const cs = Math.cos(L.ang), sn = Math.sin(L.ang);
      L.colls = colliders.map(([lx, lz, w, d, y0, y1]) => this.city.colliders.addBox(L.x + lx * cs + lz * sn, L.z - lx * sn + lz * cs, w, d, -L.ang, L.y + y0 - 0.5, L.y + y1, 'roof'));
    }
  },
  lotWorld(L, lx, lz) { const cs = Math.cos(L.ang), sn = Math.sin(L.ang); return [L.x + lx * cs + lz * sn, L.z - lx * sn + lz * cs]; },
  onPropertyChanged() { this.refreshLots(); this.save(); if (this.ui.menuOpen && this.ui.tab === 'property') this.ui.showTab('property'); if (this.ui.builderOpen) this.ui.builderRefresh(); },
  onBizChanged() { const own = Object.values(this.state.life.biz).filter(b => b.owned).length; if (own >= 3) this.unlock('empresario'); this.save(); if (this.ui.menuOpen) this.ui.showTab(this.ui.tab); },
  onQuestDone(id) { if (id === 'bache' && this.landmarks.userData.setBache) this.landmarks.userData.setBache(true); this.refreshNPCs(); },

  /* ---------------- who's who ---------------- */
  npcDef(id) { return CAST[id] ? this.castDef(id) : CHARACTERS[id] || EXTRAS[id] || null; },
  npcName(id) { const d = this.npcDef(id) || (this.state.life.rel[id] && this.state.life.rel[id].name && { name: this.state.life.rel[id].name }); return d ? d.name : 'Someone'; },
  npcPos(id) {
    const n = this.npcs.find(q => q.id === id); if (n) return { x: n.x, z: n.z };
    const c = CAST[id]; if (c) { const p = PLACES[c.at]; if (p) return { x: p.x + c.offset[0], z: p.z + c.offset[1] }; }
    const d = CHARACTERS[id]; if (d) { const p = PLACES[d.place]; return { x: p.x, z: p.z }; }
    const r = this.state.life.rel[id]; if (r && r.home) return { x: r.home[0], z: r.home[1] };
    return null;
  },
  castDef(id) {
    const c = CAST[id]; if (!c) return null;
    if (!c._def) c._def = Object.assign({ cast: id, topics: {}, greet: ['Buenas.'] }, c, { id });
    return c._def;
  },
  near(placeId, r) { const p = PLACES[placeId], q = this.player; return p && Math.hypot(p.x - q.x, p.z - q.z) < r; },
  isNight() { const h = this.state.hour; return h < 6 || h >= 19.5; },
  sweetheart() { let best = null, bl = 0; for (const [id, r] of Object.entries(this.state.life.rel)) if (r.romance > bl) { bl = r.romance; best = id; } return best; },
  questDone(id) { const q = this.state.life.side[id]; return !!(q && q.count); },
  onRocky() { const s = this.city.nearestStreet(this.player.x, this.player.z, 8, [3]); return !!(s && s.st.rocky); },
  applyTone(t) { const T = TONES[t]; if (T && T.trait) this.life.trait(T.trait[0], T.trait[1]); },

  /** the cast: placed by timetable; shopkeepers in their doorways; friends at home */
  placeCast() {
    const sp = this.spots;
    for (const [id, c] of Object.entries(CAST)) {
      const def = this.castDef(id);
      let x, z;
      if (c.shop && sp['shop_' + c.shop]) { const s = sp['shop_' + c.shop]; x = s[0]; z = s[2]; }
      else if (c.at === 'bache' && sp.bache) { x = sp.bache[0]; z = sp.bache[2]; }
      else { const p = PLACES[c.at]; x = p.x + c.offset[0]; z = p.z + c.offset[1]; }
      const [fx, fy, fz] = this.findSpot(x, z);
      const mesh = makePerson(c.look); mesh.position.set(fx, fy, fz); this.scene.add(mesh);
      this.npcs.push({ id, def, mesh, x: fx, y: fy, z: fz, hx: fx, hz: fz, facing: 0, visible: true, cast: true });
    }
    // the people you've grown close to stay where you met them
    for (const [id, r] of Object.entries(this.state.life.rel)) {
      if (r.seed == null || !(r.a >= 30 || r.romance >= 1)) continue;
      const def = makeCitizen(r.seed, r.district, { id }); EXTRAS[id] = def;
      let home = r.home; const sp2 = this.state.life.spouse === id && this.homePos(); if (sp2) home = sp2;
      const [x, y, z] = this.findSpot(home[0], home[1]);
      const mesh = makePerson(def.look); mesh.position.set(x, y, z); this.scene.add(mesh);
      this.npcs.push({ id, def, mesh, x, y, z, hx: x, hz: z, facing: 0, visible: true, friend: true });
    }
  },
  homePos() { const h = this.life.anyHome(); if (!h) return null; const L = this.lots.find(l => l.id === h[0]); if (!L) return null; const [x, z] = this.lotWorld(L, 2, -10.5); return [x, z]; },
  castShown(n) {
    const c = CAST[n.id]; if (!c) return true; const s = this.state, h = s.hour, d = s.day;
    if (n.id === 'regMc') { const q = s.life.side.regidor; if (q && q.st === 0) return true; }
    if (n.id === 'chava') { const q = s.life.side.rinos; if (q && q.st >= 0 && !q.done) return true; }
    if (n.id === 'alcalde' && s.ch === 7 && !s.ending) return true;
    if (n.id === 'chole' && this.questDone('bache')) return h > 7 && h < 21;
    return !c.schedule || c.schedule(d, h);
  },
  castPlace(n) {
    // Chava waits for you at the chapel at the top of the cerro
    if (n.id === 'chava') { const q = this.state.life.side.rinos, up = q && q.st >= 0 && !q.done; if (up && !n.atTop) { const p = PLACES.sanFrancisco; const [x, y, z] = this.findSpot(p.x + 6, p.z - 4); n.x = x; n.y = y; n.z = z; n.atTop = true; } else if (!up && n.atTop) { n.x = n.hx; n.z = n.hz; n.y = this.city.heightAt(n.hx, n.hz); n.atTop = false; } }
    // Kevin goes where the signal is best during his disappearance
    if (n.id === 'regMc') { const q = this.state.life.side.regidor; if (q && q.st === 0 && !n.atCumbre) { const p = PLACES.cumbre; const [x, y, z] = this.findSpot(p.x - 10, p.z + 8); n.x = x; n.y = y; n.z = z; n.atCumbre = true; } else if (!(q && q.st === 0) && n.atCumbre) { n.x = n.hx; n.z = n.hz; n.y = this.city.heightAt(n.hx, n.hz); n.atCumbre = false; } }
  },

  /* ---------------- services: what a person can do for you ---------------- */
  services(npc) {
    const out = [], d = npc.def, id = npc.id, L = this.life;
    if (d.shop && SHOPS[d.shop]) {
      const S = SHOPS[d.shop];
      if (S.sells === 'land') { out.push({ label: 'Show me the land for sale.', run: () => { this.endTalk(); this.ui.openLand(); } }); out.push({ label: 'What businesses are for sale?', run: () => { this.endTalk(); this.ui.openBiz(); } }); }
      else if (S.sells === 'builders') { out.push({ label: L.anyHome() || Object.values(this.state.life.props).some(p => p.owned) ? 'I want to build on my land.' : 'I want to build a house. (You need land first: Bienes Raíces, by the Jardín.)', locked: !Object.values(this.state.life.props).some(p => p.owned), lockedText: 'Buy a lot first: Lic. Partida at Bienes Raíces, by the Jardín.', run: () => { this.endTalk(); const own = Object.entries(this.state.life.props).find(([, p]) => p.owned); this.openBuilder(own[0]); } }); }
      else if (S.sells === 'looks') out.push({ label: 'A haircut, please.', run: () => { this.endTalk(); this.ui.openBarber(); } });
      else out.push({ label: 'Let me see what you sell.', run: () => { this.endTalk(); this.openShop(d.shop); } });
    }
    if (id === 'cuca') out.push({ label: 'A gaspacho, Tía. ($40)', run: () => { if (L.spend(40, 'Gaspacho')) { L.add('gaspacho'); this.ui.logLine('npc', 'Mango, jícama, cotija, chile, lime. Eat it here or give it to someone you like.'); } this.renderChips(); } });
    if (id === 'amparo' || id === 'tona' || (id === 'francisco' && this.state.life.esperanzaOpen)) {
      const bizId = id === 'amparo' ? 'cremeriaBiz' : id === 'tona' ? 'tiendita' : id === 'francisco' ? 'esperanza' : null, B = BUSINESSES.find(b => b.id === bizId);
      if (B && !(this.state.life.biz[bizId] || {}).owned) out.push({ label: `I'd like to invest in ${B.name}. ($${B.price.toLocaleString('en-US')})`, locked: !L.afford(B.price), lockedText: `You need $${B.price.toLocaleString('en-US')}.`, run: () => { if (L.buyBiz(bizId)) { this.ui.logLine('npc', '¡Trato hecho! Partners. Don\'t change anything.'); this.unlock('empresario', () => Object.values(this.state.life.biz).filter(b => b.owned).length >= 3); } this.renderChips(); } });
    }
    if (id === 'alcalde') this.unlock('avistamiento');
    if (REGIDORES.includes(id)) { const met = this.state.life.regidoresMet || (this.state.life.regidoresMet = []); if (!met.includes(id)) { met.push(id); if (met.length >= 5) this.unlock('regidores'); } }
    if (this.state.life.spouse === id) out.push({ label: 'Let\'s go home.', run: () => { this.endTalk(); const h = this.homePos(); if (h) { const [x, y, z] = this.findSpot(h[0], h[1]); this.player.teleport(x, z, y); this.ui.toast('Home.', 'good'); } } });
    return out;
  },
  openShop(id) { this.prevView = this.view === 'third' ? 'third' : 'first'; this.ui.openShop(id); this.view = 'shop'; this.dressPlayer(); },
  closeShopView() { if (this.view === 'shop' || this.view === 'build') this.view = this.prevView || 'first'; this.buildSpin = null; },
  buyItem(id) { const I = ITEMS[id]; if (!I) return; if (this.life.spend(I.price, I.name.split(' (')[0])) { this.life.add(id); if (id === 'cachito') this.lottery(); } },
  lottery() {
    const luck = this.life.luck(), r = Math.random() * 100;
    if (r < 2 + luck * 0.15) { this.life.earn(20000, '¡El cachito ganó! The big prize'); this.unlock('loteriaWin'); }
    else if (r < 14 + luck * 0.4) this.life.earn(300, 'a small lottery prize (reintegro y algo más)');
    else this.ui.toast('The cachito wins nothing. Don Goyo shrugs: “Next week.”');
    this.life.take('cachito');
  },
  buyClothes(id) { if (this.life.buyClothes(id)) { this.audio.chime(); this.checkStyle(); } },
  wear(id) { this.life.wear(id); this.checkStyle(); },
  checkStyle() { if (this.life.style() >= 25) this.unlock('elegante'); this.save(); },
  dressPlayer() {
    if (!this.scene) return;
    if (this.avatar) this.scene.remove(this.avatar);
    this.avatar = makePerson(this.life.appearance()); this.avatar.visible = false; this.scene.add(this.avatar);
  },
  openBuilder(lotId) { this.prevView = this.view === 'third' ? 'third' : 'first'; this.view = 'build'; this.buildLot = this.lots.find(l => l.id === lotId); this.buildYaw = this.buildLot ? this.buildLot.ang + 0.6 : 0; this.ui.openBuilder(lotId); },

  /* ---------------- mini games ---------------- */
  async minigame(id, questId, extra) {
    const s = this.state, opts = { luck: this.life.luck(), style: this.life.style() };
    if (id === 'serenata') { const d = this.npcDef(extra); opts.temper = d && d.temper; opts.name = d && d.name; }
    const r = await this.mini.play(id, opts);
    if (r.quit && id !== 'serenata') { this.ui.toast('You leave the game.'); return; }
    if (id === 'loteria' && r.win) this.unlock('loteriaWin');
    if (id === 'penales' && r.win) { this.unlock('goleador'); if (!this.life.own('deportivo')) { this.life.s.owned.push('deportivo'); this.ui.toast('New clothes: Camiseta del Deportivo Jiquilpan (wear it from You → Wardrobe).', 'good'); } this.life.affinity('chema', 6); }
    if (id === 'serenata' && r.win) { const sw = extra, rel = this.life.rel(sw); this.ui.toast(`${this.npcName(sw)} is charmed.`, 'love'); if (rel.romance < 1) rel.romance = 1; }
    this.side.event('mini', { id: questId, win: !!r.win, money: r.money || 0 });
    this.save();
  },

  /* ---------------- the taxi job ---------------- */
  taxiStart() {
    const sp = this.spots.sitioAbasolo || [PLACES.sitioAbasolo.x, 0, PLACES.sitioAbasolo.z], t = this.taxiSpots[0];
    let car = this.vehicles.cars.find(c => c.taxi);
    if (!car) { const [x, , z] = t || sp; car = this.vehicles.add({ x, z, y: this.city.heightAt(x, z) + 0.12, ang: t ? t[3] : 0, kind: KIND.taxi, color: 0xf2f0ea }); car.taxi = true; }
    this.taxi = { car, fares: 0, earned: 0, idle: 0 }; this.taxiNext();
    this.ui.toast('Get in the white taxi at the sitio (E). The fare is on your compass.', 'quest');
  },
  taxiNext() {
    const t = this.taxi, p = this.player, pick = TAXI_STOPS[Math.floor(Math.random() * TAXI_STOPS.length)];
    let to = pick; while (to === pick) to = TAXI_STOPS[Math.floor(Math.random() * TAXI_STOPS.length)];
    const P1 = PLACES[pick], f = this.city.storefront(P1.x, P1.z);
    t.pick = { x: f.sx, z: f.sz, name: P1.name.split(' (')[0] }; t.to = null; t.toId = to; t.onboard = false; t.bumps = 0;
    const def = makeCitizen((Math.random() * 2 ** 31) | 0, barrio(f.sx, f.sz)); if (t.pax) this.scene.remove(t.pax);
    t.pax = makePerson(def.look); t.paxDef = def; const [x, y, z] = this.findSpot(f.sx, f.sz); t.pax.position.set(x, y, z); this.scene.add(t.pax);
  },
  _taxi(dt) {
    const t = this.taxi; if (!t) return; const p = this.player, car = this.vehicles.driving;
    const Q = QUEST.taxi, q = this.state.life.side.taxi;
    if (!q || q.st < 0) { if (t.pax) this.scene.remove(t.pax); this.taxi = null; this.ui.raceInfo(null); return; }
    if (t.pax) t.pax.userData.animate(dt, 0, this.t);
    if (car !== t.car) { t.idle += dt; if (t.idle > 1 && Math.hypot(t.car.x - p.x, t.car.z - p.z) > 60) { this.taxiEnd(); return; } }
    else t.idle = 0;
    if (car === t.car && this.vehicles.bump > 0.05) { t.bumps += this.vehicles.bump; this.vehicles.bump = 0; }
    if (!t.onboard) {
      const d = Math.hypot(t.pick.x - p.x, t.pick.z - p.z);
      this.ui.raceInfo(`🚕 Fare ${t.fares + 1}: pick up at ${t.pick.name} · ${d > 950 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'}`);
      if (car === t.car && d < 9 && Math.abs(car.speed) < 2) {
        t.onboard = true; t.pax.visible = false; const P2 = PLACES[t.toId], f = this.city.storefront(P2.x, P2.z); t.to = { x: f.sx, z: f.sz, name: P2.name.split(' (')[0] }; t.t = 0; t.dist = Math.hypot(t.to.x - p.x, t.to.z - p.z);
        this.ui.subtitle(t.paxDef.name, ['Buenas. To ' + t.to.name + ', please.', 'A ' + t.to.name + ', joven. Y no se vaya por la Fajardo, que está imposible.', t.to.name + '. I\'m late. I\'m always late.'][Math.floor(Math.random() * 3)], 4);
      }
    } else {
      t.t += dt; const d = Math.hypot(t.to.x - p.x, t.to.z - p.z);
      this.ui.raceInfo(`🚕 To ${t.to.name} · ${d > 950 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'} · ${Math.round(t.t)} s${t.bumps > 0.3 ? ' · the passenger is clutching the seat' : ''}`);
      if (car === t.car && d < 10 && Math.abs(car.speed) < 2) {
        const fair = 45 + t.dist * 0.09, fast = Math.max(0, 1.4 - t.t / Math.max(20, t.dist / 8)), pay = Math.round((fair * (1 + fast * 0.5) - t.bumps * 30) * 0.8 + this.life.style());
        t.fares++; t.earned += Math.max(20, pay); this.life.earn(Math.max(20, pay), 'taxi fare (80% yours)'); this.state.life.stats.fares++;
        if (this.state.life.stats.fares >= 10) this.unlock('taxista');
        const [x, y, z] = this.findSpot(t.to.x, t.to.z); t.pax.position.set(x, y, z); t.pax.visible = true;
        this.ui.subtitle(t.paxDef.name, t.bumps > 0.6 ? 'Ay, Dios. Here. Don\'t come back for me.' : ['Gracias, joven. Keep the change.', '¡Rapidísimo! Like the jetpack kid.', 'Thank you. Say hi to Don Refugio.'][Math.floor(Math.random() * 3)], 4);
        setTimeout(() => { if (this.taxi === t) { this.scene.remove(t.pax); this.taxiNext(); } }, 2500);
        t.onboard = 'done';
      }
    }
  },
  taxiEnd() {
    const t = this.taxi; if (!t) return; if (t.pax) this.scene.remove(t.pax); this.taxi = null; this.ui.raceInfo(null);
    const Q = QUEST.taxi; this.ui.toast(`Shift over: ${t.fares} fares, $${t.earned.toLocaleString('en-US')}.`, 'good'); this.side.finish(Q);
  },

  /* ---------------- love and home ---------------- */
  wedding(id) {
    const d = this.npcDef(id), s = this.state;
    this.ui.card([`The next Saturday, the bells of San Francisco ring for you.`,
      `${d.name} comes up the aisle of the Parroquia under the eyes of half the town: Tía Cuca crying into her apron, Rosa filming, Padre Tomás pretending not to rush.`,
      `Outside, a banda plays on the atrio, someone throws rice, and the mariachi from the Santuario turns up uninvited and plays anyway.`,
      `<em>¡QUE VIVAN LOS NOVIOS!</em>\n${d.name} moves into your house. The town has a new couple to talk about.`], () => {
      const r = this.life.rel(id); r.romance = 4; s.life.spouse = id; this.life.affinity(id, 15); this.life.trait('fame', 8); this.unlock('boda');
      this.placeNPCs(); this.save();
    });
  },
  sleep(lotId) {
    const s = this.state; if (s.hour >= 7 && s.hour < 18) { this.ui.toast('It\'s the middle of the day. You lie down for a nap; the neighbours\' radio says no.'); return; }
    this.ui.card(['You sleep in your own house in Jiquilpan. The church bells, a rooster, a motorbike, the bells again.', s.life.spouse ? `${this.npcName(s.life.spouse)} has already made coffee.` : 'Morning comes in through the window, gold on the wall.'], () => {
      if (s.hour >= 7) s.day++; s.hour = 7; this.life.tick(); this.save(); this.ui.toast('Saved. Good morning.', 'good');
    });
  },

  /* ---------------- achievements that follow from who you are ---------------- */
  traitAchievements() { const s = this.state.life; if (s.heart >= 80) this.unlock('justo'); if (s.word <= -60) this.unlock('picaro'); if (s.fame >= 80) this.unlock('famoso'); },
  relAchievements() { const n = Object.values(this.state.life.rel).filter(r => r.a >= 75).length; if (n >= 5) this.unlock('compadres'); },
  checkWealth() { if (this.state.life.money >= 100000) this.unlock('rico'); },

  /* ---------------- per frame ---------------- */
  lifeUpdate(dt) {
    const s = this.state, p = this.player;
    this.lifeT = (this.lifeT || 0) + dt;
    if (this.lifeT > 1) { this.lifeT = 0; this.life.tick(); for (const n of this.npcs) if (n.cast || CAST[n.id]) { const v = this.castShown(n); if (v !== n.visible) { n.visible = v; n.mesh.visible = v; if (v && n.id === 'alcalde' && Math.hypot(n.x - p.x, n.z - p.z) < 200) this.ui.toast('The Presidente Municipal has come out of the Presidencia! (This does not happen often.)', 'quest'); } this.castPlace(n); } }
    this.side.update(dt); this._taxi(dt); this.street.update(dt);
    if (this.tinacos) {
      const q = s.life.side.esperanza, T = this.tinacos, active = q && q.st === 0 && !q.done, after = q && (q.done || q.st > 0) || s.life.esperanzaOpen;
      const got = active ? q.got.length : after ? 4 : 0, hold = active && q.data && q.data.holding ? 1 : 0;
      T.from.forEach((m, k) => { m.visible = k < 4 - got - hold; }); T.to.forEach((m, k) => { m.visible = k < got; });
      T.hand.visible = !!hold && this.view === 'first' && !this.vehicles.driving;
      if (this.avatar) this.avatar.userData.carry = !!hold;
    }
    // the taxis at the sitios
    this.taxiDecor.begin(); for (const [x, y, z, a, k, col] of this.taxiSpots) if (!this.taxi || Math.hypot(this.taxi.car.x - x, this.taxi.car.z - z) > 3) this.taxiDecor.add(x, y, z, a, 0, k ?? KIND.taxi, col ?? 0xf2f0ea); this.taxiDecor.commit(); this.taxiDecor.night(this.uNight());
    // pick-ups and the cow
    const picks = this.side.pickups(); let k = 0;
    for (const pk of picks) {
      if (pk.icon === 'cow') { if (!this.cow) { this.cow = makeCow(0xf0d890, 0x8a6a3a); this.scene.add(this.cow); } this.cow.visible = true; this.cow.position.set(pk.x, pk.y, pk.z); this.cow.rotation.y = Math.sin(this.t * 0.3) * 0.6; continue; }
      let sp = this.pickPool[k]; if (!sp) { sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.pickTex, color: 0x7fe0cf, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(1.4); this.pickGroup.add(sp); this.pickPool[k] = sp; }
      sp.visible = Math.hypot(pk.x - p.x, pk.z - p.z) < 260; sp.position.set(pk.x, pk.y + 1 + Math.sin(this.t * 2.4 + k) * 0.18, pk.z); sp.material.color.setHex(pk.icon === 'wail' ? 0xb8c8ff : 0x7fe0cf); k++;
    }
    for (; k < this.pickPool.length; k++) this.pickPool[k].visible = false;
    if (this.cow && !picks.some(q => q.icon === 'cow')) this.cow.visible = false;
    // badges over heads: who has something for you
    let b = 0;
    for (const n of this.npcs) {
      if (!n.visible || !n.mesh.visible) continue; const d = Math.hypot(n.x - p.x, n.z - p.z); if (d > 70 || d < 4) continue;
      const story = this.npcHasQuest(n.id), side = !story && this.side.chipsFor(n).some(c => !c.locked), shop = !story && !side && n.def.shop;
      if (!story && !side && !shop) continue;
      let sp = this.badges[b]; if (!sp) { sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false })); sp.scale.setScalar(0.55); this.badgeGroup.add(sp); this.badges[b] = sp; }
      sp.material.map = story ? this.badgeTex.story : side ? this.badgeTex.quest : this.badgeTex.shop; sp.material.opacity = shop ? 0.6 : 1; sp.visible = true;
      sp.position.set(n.x, n.y + 2.35 + Math.sin(this.t * 2 + b) * 0.06, n.z); b++;
    }
    for (; b < this.badges.length; b++) this.badges[b].visible = false;
    // the albañiles at work
    const work = this.lots && this.lots.find(L => { const lot = s.life.props[L.id]; return lot && lot.queue && lot.queue.length; });
    this.crew.forEach((c, i) => { c.visible = !!work && Math.hypot(work.x - p.x, work.z - p.z) < 200; if (c.visible) { const [x, z] = this.lotWorld(work, i ? 4 : -5, -6 + i * 3); c.position.set(x, work.y + 0.25, z); c.rotation.y = work.ang + Math.PI + Math.sin(this.t * 0.7 + i) * 0.8; c.userData.talking = true; c.userData.animate(0.016, Math.sin(this.t * 1.3 + i) > 0.6 ? 1 : 0, this.t); } });
  },
  lifeInteractables(out, near) {
    const s = this.state, p = this.player;
    // a combi waiting at its stop: get on
    if (!this.vehicles.driving && !p.jet) for (const c of this.traffic.combis || []) if (c.stopT > 1 && near(c.x, c.z, 7)) {
      const next = c.combi.stops[(c.stop + 1) % c.combi.stops.length], P = PLACES[next];
      out.push({ x: c.x, z: c.z, label: `Ride the ${c.combi.name} to ${P.name.split(' (')[0]} ($10)`, icon: '🚐', run: () => { if (!this.life.spend(10, c.combi.name)) return; this.ui.toast('“¡Súbale, súbale, hay lugar!”', 'good'); this.travelTo(next); this.state.hour = Math.min(23.9, this.state.hour + 0.15); } });
    }
    for (const it of this.side.interactables()) out.push(it);
    if (this.lots) for (const L of this.lots) {
      const [sx, sz] = this.lotWorld(L, 0, -LOT_D / 2 + 1.5); if (!near(sx, sz, 5) && !near(L.x, L.z, 9)) continue;
      const lot = s.life.props[L.id];
      if (!lot || !lot.owned) out.push({ x: sx, z: sz, label: `“SE VENDE”: ${L.name} · $${L.price.toLocaleString('en-US')}`, icon: '🏷️', run: () => this.ui.openLand(L.id) });
      else {
        out.push({ x: sx, z: sz, label: lot.parts.length ? 'Your house: plan more with Maestro Chuy' : 'Your land: plan the house', icon: '📐', run: () => this.openBuilder(L.id) });
        if (lot.parts.includes('sala') && near(L.x, L.z, 9)) out.push({ x: L.x, z: L.z, label: 'Sleep until morning (and save)', icon: '🛏️', run: () => this.sleep(L.id) });
      }
    }
  },
  /* ---------------- cameras ---------------- */
  cameraOverride(cam, dt) {
    const p = this.player, v = this.view;
    if (this.avatar) this.avatar.visible = false;
    if (v === 'build' && this.buildLot) {
      const L = this.buildLot; this.buildYaw += dt * 0.12 * (this.buildSpin == null ? 1 : this.buildSpin);
      const r = 30, cx = L.x + Math.sin(this.buildYaw) * r, cz = L.z + Math.cos(this.buildYaw) * r, cy = Math.max(L.y + 14, this.city.heightAt(cx, cz) + 4);
      cam.position.set(cx, cy, cz); cam.lookAt(L.x, L.y + 2.5, L.z); return true;
    }
    if (this.vehicles.driving || !this.avatar) return false;
    if (v === 'shop' || v === 'third') {
      const A = this.avatar; A.visible = true; A.position.set(p.x, p.y, p.z);
      if (v === 'shop') {
        const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
        A.rotation.y = Math.atan2(fx, fz) + Math.sin(this.t * 0.6) * 0.45;
        cam.position.set(p.x + fx * 3.3, p.y + 1.45, p.z + fz * 3.3); cam.lookAt(p.x + fz * 0.85, p.y + 0.95, p.z - fx * 0.85); A.userData.animate(dt, 0, this.t); return true;
      }
      const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), eye = p.y + 1.7;
      A.rotation.y = Math.atan2(fx, fz); A.userData.animate(dt, p.onGround && !p.jet ? p.speed : 0, this.t);
      let back = 3.6; for (; back > 0.8; back -= 0.3) { const x = p.x - fx * back, z = p.z - fz * back; if (!this.city.colliders.blocked(x, z, 0.25, eye - 0.4, eye + 0.6)) break; }
      cam.position.set(p.x - fx * back, eye + 0.45 - p.pitch * 1.2, p.z - fz * back); cam.rotation.set(p.pitch * 0.8 - 0.12, p.yaw, 0); return true;
    }
    return false;
  }
};
