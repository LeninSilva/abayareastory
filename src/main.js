// UNDERTOW: boot, world, and the loop.
import * as THREE from 'three';
import { loadCity } from './data.js';
import { U } from './render/shaders.js';
import { makeSky, setTimeOfDay } from './render/sky.js';
import { makeTerrain, makeWater, makeStreets, makeBackdrop } from './render/ground.js';
import { makeBuildings } from './render/buildings.js';
import { makeTrees } from './render/trees.js';
import { makeLandmarks, makeBridges } from './render/landmarks.js';
import { makeRuins, makeUnderworld, glyphTexture } from './render/ruins.js';
import { makePerson, makeHands, WEAPONS } from './render/people.js';
import { toXZ, LIBRARIES, LANDMARKS, DISTRICT_STYLE, STYLES } from './geo.js';
import { Input } from './game/input.js';
import { Player } from './game/player.js';
import { CHARACTERS, PLACES } from './game/story.js';
import { QUESTS, QuestBook, MAIN_ORDER } from './game/quests.js';
import { ITEMS, MURMURS, LOST, PICKUP_SETS, PROVISIONS } from './game/lore.js';
import { Voices, parseTags } from './game/dialogue.js';
import { Combat, ABILITIES } from './game/combat.js';
import { Audio } from './game/audio.js';
import { UI } from './game/ui.js';

const SAVE_KEY = 'undertow-save-v1', SET_KEY = 'undertow-settings-v1';
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }, del(k) { try { localStorage.removeItem(k); } catch (_) {} } };
const $ = id => document.getElementById(id);
const mobile = matchMedia('(pointer: coarse)').matches;

const DEFAULT_SETTINGS = { quality: mobile ? 'low' : 'medium', text: 'm', contrast: 'normal', reduced: false, timeScale: '1', sensitivity: 1, invertY: false, touch: 'auto', hollows: 'normal', damage: '1', master: 0.8, music: 0.5, fx: 0.8, voice: 'auto', apiKey: '' };
const WEAPON_ORDER = ['stick', 'grip', 'canesword', 'hook', 'clapper', 'stairblade'];

class Game {
  constructor() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, store.get(SET_KEY) || {});
    this.canvas = $('view');
    this.audio = new Audio();
    this.input = new Input(this.canvas, $('touch-layer'));
    for (const b of document.querySelectorAll('#tbtns [data-action]')) this.input.bindButton(b);
    this.voices = new Voices(this.settings);
    this.ui = new UI(this);
    this.started = false; this.paused = false; this.t = 0; this.shakeA = 0; this.fogBank = 0.4; this.wardT = 0; this.talk = null;
    this.applySettings();
    this.input.onUnlock = () => { if (this.started && !this.paused && !this.talk && !this.ui.cardOpen) this.ui.openMenu(); };
    this._titleWiring();
    addEventListener('keydown', e => this._globalKeys(e));
  }

  /* ---------------- title & settings ---------------- */
  _titleWiring() {
    const save = store.get(SAVE_KEY);
    $('btn-continue').hidden = !save;
    $('name-input').value = (save && save.name) || '';
    $('name-input').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('btn-new').click(); });
    $('btn-new').addEventListener('click', () => {
      if (store.get(SAVE_KEY) && !confirm('Begin a new story? Your saved story will be replaced.')) return;
      this.begin(null);
    });
    $('btn-continue').addEventListener('click', () => this.begin(store.get(SAVE_KEY)));
    $('btn-title-settings').addEventListener('click', () => this.ui.openMenu('settings'));
    $('btn-about').addEventListener('click', () => this.ui.card([
      '<em>UNDERTOW</em>\nA first-person story in San Francisco, the real one: its streets, hills, buildings and history, drawn from the city\'s own open data.',
      'You came to find your father. The city is full of people who never left it. Talk to anyone. Help whom you like. Fight what you must.',
      'The places and history in the Field Notes are real. The people, the hotel, the company, and the ancient stairs in the hills are invented.'
    ]));
  }
  setSetting(k, v) {
    if (k === 'apiKey' && v === '••••••••') return;
    if (['reduced', 'invertY'].includes(k)) v = v === true || v === 'true';
    if (['sensitivity', 'master', 'music', 'fx'].includes(k)) v = +v;
    const qualityChanged = k === 'quality' && v !== this.settings.quality;
    this.settings[k] = v; store.set(SET_KEY, this.settings); this.applySettings();
    if (qualityChanged && this.started) this.ui.toast('Picture quality changes fully the next time the city loads.', 'good');
  }
  applySettings() {
    const s = this.settings, root = document.documentElement;
    root.dataset.text = s.text; root.dataset.contrast = s.contrast; document.body.classList.toggle('reduced', !!s.reduced);
    this.input.sensitivity = +s.sensitivity; this.input.invertY = !!s.invertY;
    this.audio.vol = { master: +s.master, music: +s.music, fx: +s.fx }; this.audio.apply();
    document.body.classList.toggle('touch', this.touchUI());
    if (this.started) this.ui.showHUD(true);
    if (this.renderer) this.maxPR = this.qualityPR();
  }
  touchUI() { return this.settings.touch === 'on' || (this.settings.touch === 'auto' && (this.input.touchMode || mobile)); }
  qualityPR() { const d = devicePixelRatio || 1; return Math.min(d, this.settings.quality === 'high' ? 2 : this.settings.quality === 'medium' ? 1.35 : 1); }

  /* ---------------- starting ---------------- */
  async begin(save) {
    this.audio.start();
    $('title').classList.remove('show'); $('loading').classList.add('show');
    try { await this.buildWorld(); }
    catch (e) { console.error(e); $('load-text').textContent = 'The city would not load: ' + e.message + '. Check your connection and reload.'; return; }
    $('loading').classList.remove('show');
    this.newState(save);
    this.started = true; document.body.classList.toggle('touch', this.touchUI()); this.ui.showHUD(true);
    this.placeNPCs();
    if (save) {
      this.enterInterior(save.interior && this.flags.underOpen);
      this.player.teleport(save.pos[0], save.pos[2], save.pos[1]); this.player.yaw = save.yaw || 0;
      this.ui.toast('Welcome back, ' + this.state.name + '.', 'good');
    } else {
      const f = toXZ(37.79530, -122.39480);
      this.player.teleport(f[0], f[1]); this.player.yaw = Math.PI / 2 + 0.2;   // facing west, up Market Street
      this.ui.card([
        'Your mother, Marisela, died in Stockton in the spring, in a room that smelled of oranges.',
        'Near the end she held your wrist hard and said: <em>Go to the city. Find your father. Hollis Vane. Make him pay what he owes us, which is not money.</em>',
        'You had never seen him. You had seen his name on buildings, in the news, on the side of a glass tower. Everyone had.',
        'So you took the last ferry across the bay, and the fog came in to meet it.'
      ], () => this.tutorial());
    }
    this.lastT = performance.now(); if (!this.looping) { this.looping = true; requestAnimationFrame(t => this.frame(t)); }
  }
  tutorial() {
    const touch = this.touchUI();
    this.ui.toast(touch ? 'Left thumb to walk, right thumb to look.' : 'WASD to walk. Click the view to look around with the mouse.', 'good');
    setTimeout(() => this.ui.toast(touch ? 'Tap the gold button to talk when someone is near.' : 'Press E to talk to someone. Esc opens the menu and the map.', 'good'), 4500);
    setTimeout(() => this.ui.toast('Follow the gold diamond on the compass to your next step.', 'good'), 9000);
  }
  newState(save) {
    const name = ($('name-input').value || '').trim() || (save && save.name) || 'Ana';
    const s = save ? save : {
      name, hour: 18.4, day: 1, hp: 100, breath: 100, xp: 0, level: 1, points: 0, stats: { strength: 0, skill: 0, will: 0 }, light: 0,
      weapon: 'stick', weapons: [], abilities: [], ability: null, inv: { letter: 1, sourdough: 2 }, flags: {}, sets: {}, murmurs: MURMURS.map(() => 0), glyphs: [], seenSites: [],
      lost: LOST.map(() => 0), lostReturned: 0, libs: [], prov: {}, kills: {}, track: null, customWP: null, ending: null, pos: null
    };
    if (!save) s.weapons = []; // the walking stick comes from the hotel
    this.state = s; this.flags = s.flags;
    this.quests = new QuestBook(s, {
      fx: (fx, q) => this.applyFx(fx, q),
      notify: (text, kind) => { this.ui.toast(text, kind); if (kind === 'done') this.audio.chime(); },
      counts: () => ({ sets: Object.fromEntries(Object.entries(s.sets).map(([k, v]) => [k, v.filter(Boolean).length])), murmurs: s.murmurs.filter(Boolean).length, glyphs: s.glyphs.length, kills: s.kills }),
      changed: () => { this.save(); this.refreshNPCs(); }
    });
    for (const site of this.ruins.userData.sites) this.ruins.userData.setAwake(site.id, s.glyphs.includes(site.id) || s.ending === 'light');
    this.combat.enemies.forEach(e => e.dead = true);
    this.player.interior = null; this.player.bike = false; this.player.distance = s.walked || 0;
  }
  save() {
    if (!this.started) return; const s = this.state, p = this.player;
    s.pos = [p.x, p.y, p.z]; s.yaw = p.yaw; s.interior = !!p.interior; s.walked = p.distance;
    store.set(SAVE_KEY, s);
  }
  toTitle() {
    this.save(); this.started = false; this.endTalk(); this.ui.showHUD(false); $('btn-continue').hidden = !store.get(SAVE_KEY);
    $('title').classList.add('show'); document.exitPointerLock && document.exitPointerLock();
  }

  /* ---------------- the world ---------------- */
  async buildWorld() {
    if (this.city) return;
    const set = (t, f) => { $('load-text').textContent = t; if (f != null) $('load-bar').style.width = (f * 100) + '%'; };
    const tick = () => new Promise(r => setTimeout(r, 0));
    set('Unfolding the city…', 0);
    const city = this.city = await loadCity(f => set('Unfolding the city…', f * 0.5));
    const q = this.settings.quality;
    const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: q !== 'low', powerPreference: 'high-performance' });
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 0.8; R.outputColorSpace = THREE.SRGBColorSpace; R.autoClear = false;
    this.maxPR = this.qualityPR(); this.pr = this.maxPR; R.setPixelRatio(this.pr);
    const scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.2, 30000); this.camera.rotation.order = 'YXZ';
    this.handsScene = new THREE.Scene(); this.handsCam = new THREE.PerspectiveCamera(60, 1, 0.01, 10);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.2); this.hemi = new THREE.HemisphereLight(0xbcd0ff, 0x6a5a48, 1.1);
    scene.add(this.sun, this.sun.target, this.hemi);
    this.hsun = new THREE.DirectionalLight(0xffffff, 2); this.hhemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); this.handsScene.add(this.hsun, this.hhemi);
    this.onResize(); addEventListener('resize', () => this.onResize());
    set('Raising the hills…', 0.55); await tick();
    this.surface = new THREE.Group(); scene.add(this.surface);
    this.sky = makeSky(); scene.add(this.sky);
    this.surface.add(makeTerrain(city, q)); this.surface.add(makeWater(city)); this.surface.add(makeBackdrop());
    set('Laying the streets…', 0.62); await tick();
    this.surface.add(makeStreets(city));
    set('Building the houses…', 0.7); await tick();
    this.buildings = makeBuildings(city, q); this.surface.add(this.buildings);
    set('Planting the street trees…', 0.8); await tick();
    this.trees = makeTrees(city, q); this.surface.add(this.trees);
    set('Raising the landmarks and the bridges…', 0.86); await tick();
    this.landmarks = makeLandmarks(city); this.surface.add(this.landmarks);
    this.bridges = makeBridges(city); this.surface.add(this.bridges);
    set('Uncovering the old stairs…', 0.92); await tick();
    this.ruins = makeRuins(city); this.surface.add(this.ruins);
    this.under = makeUnderworld(city); scene.add(this.under);
    this.player = new Player(city);
    this.player.onRescueInterior = () => { const l = this.under.userData.landing; this.player.teleport(l[0] + 2, l[2], l[1]); };
    this.combat = new Combat(this);
    this.hands = makeHands(); this.handsScene.add(this.hands);
    this._streetIndex(); this._markers(); this.walkers = [];
    this.npcs = [];
    set('Waking the dead…', 1); await tick();
    // compile shaders up front so the first steps don't stutter
    try { R.compile(scene, this.camera); } catch (_) {}
  }
  onResize() {
    const w = innerWidth, h = innerHeight; if (!this.renderer) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.handsCam.aspect = w / h; this.handsCam.updateProjectionMatrix();
  }
  _streetIndex() {
    const C = 250, idx = this.streetIdx = new Map();
    this.city.streets.forEach((s, i) => { const seen = new Set(); for (const [x, z] of s.pts) { const k = Math.floor(x / C) * 10000 + Math.floor(z / C); if (seen.has(k)) continue; seen.add(k); let a = idx.get(k); if (!a) idx.set(k, a = []); a.push(i); } });
  }
  nearStreets(x, z, r) {
    const C = 250, out = new Set(), n = Math.ceil(r / C);
    const ci = Math.floor(x / C), cj = Math.floor(z / C);
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) { const a = this.streetIdx.get((ci + i) * 10000 + cj + j); if (a) for (const s of a) out.add(s); }
    return [...out].map(i => this.city.streets[i]);
  }
  mapImage() {
    if (this._mapImg) return this._mapImg;
    const city = this.city, N = city.landN, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const c = cv.getContext('2d'), img = c.createImageData(N, N);
    const pal = { park: [96, 138, 78], victorian: [196, 170, 160], edwardian: [190, 178, 160], marina: [214, 204, 186], mansion: [204, 196, 176], sunset: [216, 208, 190], cottage: [200, 184, 162], suburb: [196, 192, 176], apartment: [184, 176, 168], northbeach: [206, 186, 160], chinatown: [196, 150, 130], mission: [214, 176, 140], soma: [168, 160, 156], civic: [194, 190, 180], downtown: [170, 172, 178], industrial: [160, 150, 140], parkmerced: [200, 196, 176], presidio: [116, 146, 96] };
    for (let k = 0; k < N * N; k++) {
      const v = city.land[k]; let col;
      if (!v) { const x = k % N, z = Math.floor(k / N), h = city.heightAt(-city.half + (x + 0.5) * 2 * city.half / N, -city.half + (z + 0.5) * 2 * city.half / N); col = h < -12 ? [40, 66, 96] : [58, 92, 124]; }
      else if (v === 255) col = [150, 140, 120];
      else { const d = city.districts[v - 1]; col = pal[DISTRICT_STYLE[d] === 'park' ? 'park' : d === 'Presidio' ? 'presidio' : DISTRICT_STYLE[d]] || [190, 180, 164]; }
      img.data.set([col[0], col[1], col[2], 255], k * 4);
    }
    c.putImageData(img, 0, 0);
    this._mapImg = cv; return cv;
  }

  /* markers: murmurs, lost things, provisions, quest objects; and the waypoint beacon */
  _markers() {
    const tex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
    this.glowTex = tex; this.markerGroup = new THREE.Group(); this.surface.add(this.markerGroup);
    const mk = (lat, lon, color, size, kind, data) => {
      const [x0, z0] = toXZ(lat, lon), [x, y, z] = this.findSpot(x0, z0);   // always somewhere a person can stand
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      sp.scale.setScalar(size); sp.position.set(x, y + 1.3, z); this.markerGroup.add(sp);
      return Object.assign({ x, z, y, sprite: sp, kind }, data);
    };
    this.marks = [];
    MURMURS.forEach((m, i) => this.marks.push(mk(m.lat, m.lon, 0x9ff3e6, 1.4, 'murmur', { i })));
    LOST.forEach((m, i) => this.marks.push(mk(m.lat, m.lon, 0xffd9a0, 0.9, 'lost', { i })));
    PROVISIONS.forEach((m, i) => this.marks.push(mk(m.lat, m.lon, 0xffffff, 0.7, 'prov', { i, item: m.item })));
    for (const [set, list] of Object.entries(PICKUP_SETS)) list.forEach((m, i) => {
      let lat = m.lat, lon = m.lon; if (m.lib) { const l = LIBRARIES.find(q => q.id === m.lib); lat = l.lat; lon = l.lon; }
      this.marks.push(mk(lat, lon, set === 'grip' ? 0xffc080 : 0xffe28a, 1.1, 'pickup', { set, i, def: m }));
    });
    for (const l of LIBRARIES) { const [x, z] = toXZ(l.lat, l.lon); l.x = x; l.z = z; }
    // waypoint beacon: a column of light
    const bm = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
    this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 400, 12, 1, true).translate(0, 200, 0), bm); this.scene.add(this.beacon);
  }
  markVisible(m) {
    const s = this.state;
    if (m.kind === 'murmur') return !s.murmurs[m.i];
    if (m.kind === 'lost') return !s.lost[m.i];
    if (m.kind === 'prov') return (s.prov[m.i] || 0) < s.day;
    if (m.kind === 'pickup') {
      if (m.set === 'grip') return !s.weapons.includes('grip');
      const st = Object.keys(s.quests).map(id => this.quests.stageOf(id)).find(st => st && st.collect === m.set);
      return !!st && !(s.sets[m.set] || [])[m.i];
    }
    return true;
  }

  /* ---------------- people ---------------- */
  findSpot(x, z, y) { const t = new Player(this.city); t.interior = this.player.interior && y !== undefined ? this.player.interior : null; t.teleport(x, z, y); return [t.x, t.y, t.z]; }
  placeNPCs() {
    for (const n of this.npcs) this.scene.remove(n.mesh);
    this.npcs = [];
    const chairs = this.under.userData.chairs;
    const room = { hollis: 0, susannah_room: 1, gil_room: 2 };
    for (const [id, def] of Object.entries(CHARACTERS)) {
      let x, y, z, inRoom = false;
      if (def.place === 'room') { const c = chairs[room[id]]; x = c[0]; y = c[1]; z = c[2]; inRoom = true; }
      else { const p = PLACES[def.place]; const [px, pz] = toXZ(p.lat, p.lon); [x, y, z] = this.findSpot(px, pz); }
      const mesh = makePerson(def.look); mesh.position.set(x, y, z); this.scene.add(mesh);
      if (inRoom) { mesh.scale.setScalar(1); }
      this.npcs.push({ id, def, mesh, x, y, z, hx: x, hz: z, facing: 0, visible: true, inRoom, hostile: false });
    }
    this.refreshNPCs();
  }
  npcShown(id) {
    const s = this.state, f = this.flags;
    if (id === 'dot') return !!f.slept;
    if (id === 'stairkeeper') return s.glyphs.length >= 3 || !!(s.quests.m7 && (s.quests.m7.stage >= 2 || s.quests.m7.done));
    if (s.ending && ['hollis', 'susannah_room', 'gil_room'].includes(id)) return s.ending !== 'light' && s.ending !== 'ferry' ? id !== 'hollis' : s.ending === 'ferry';
    if (s.ending === 'light' && ['gil', 'susannah'].includes(id)) return false;
    return true;
  }
  refreshNPCs() { for (const n of this.npcs) { n.visible = this.npcShown(n.id); n.mesh.visible = n.visible; } }
  npcHasQuest(id) { return this.quests.chipsFor(id).some(c => !c.locked); }

  /* ---------------- interiors ---------------- */
  enterInterior(on) {
    this.player.interior = on ? this.under.userData.bounds : null;
    this.under.visible = !!on; this.surface.visible = !on; this.sky.visible = !on;
    for (const w of this.walkers) this.scene.remove(w.mesh); this.walkers = [];
  }
  goUnder() {
    this.enterInterior(true); const l = this.under.userData.landing;
    this.player.teleport(l[0] + 1, l[2], l[1]); this.player.yaw = -Math.PI / 2; this.player.bike = false;
    this.quests.check(); this.save();
  }
  goUp() {
    this.enterInterior(false); const d = this.ruins.userData.sites.find(s => s.id === 'twinpeaks');
    this.player.teleport(d.door.x + Math.cos(d.ang) * 2.5, d.door.z + Math.sin(d.ang) * 2.5); this.save();
  }

  /* ---------------- quests' effects ---------------- */
  applyFx(fx, quest) {
    const s = this.state;
    if (fx.xp) this.gainXP(fx.xp);
    if (fx.light) { s.light += fx.light; this.ui.toast(fx.light > 0 ? 'Your hands grow warmer.' : 'Something in you goes cold.', fx.light > 0 ? 'good' : 'warn'); }
    for (const it of fx.give || []) this.give(it);
    for (const it of fx.take || []) if (s.inv[it]) s.inv[it]--;
    if (fx.weapon) this.giveWeapon(fx.weapon);
    if (fx.ability && !s.abilities.includes(fx.ability)) { s.abilities.push(fx.ability); s.ability = fx.ability; this.ui.toast(`Learned: ${ABILITIES[fx.ability].name}. Press F (or ✦) to use it.`, 'quest'); }
    if (fx.stat) { s.stats[fx.stat] = Math.min(10, s.stats[fx.stat] + 1); this.ui.toast(`${fx.stat[0].toUpperCase() + fx.stat.slice(1)} grows.`, 'good'); }
    if (fx.flag) s.flags[fx.flag] = true;
    if (fx.travel) this.pending = () => { const p = PLACES[fx.travel], [x, z] = toXZ(p.lat, p.lon); this.endTalk(); this.travelTo(x, z, p.name, true); };
    if (fx.sleep) this.pending = () => { this.endTalk(); this.sleepScene(); };
    if (fx.ending) this.pending = () => { this.endTalk(); this.ending(fx.ending); };
  }
  give(id, n = 1) { const s = this.state; s.inv[id] = (s.inv[id] || 0) + n; this.ui.toast(`Received: ${ITEMS[id].name}`, 'good'); }
  giveWeapon(id) { const s = this.state; if (!s.weapons.includes(id)) s.weapons.push(id); s.weapon = id; this.ui.toast(`Weapon: ${WEAPONS[id].name}. Strike with left click (or ⚔).`, 'quest'); }
  wield(id) { if (this.state.weapons.includes(id)) { this.state.weapon = id; this.ui.toast(WEAPONS[id].name + ' in hand.'); } }
  useItem(id) {
    const s = this.state, d = ITEMS[id]; if (!d || !d.use || !s.inv[id]) return;
    s.inv[id]--; const u = d.use;
    if (u.heal) s.hp = Math.min(this.maxHP(), s.hp + u.heal);
    if (u.breath) s.breath = Math.min(this.maxBreath(), s.breath + u.breath);
    if (u.stamina) this.player.stamina = 1;
    if (u.ward) { this.wardT = u.ward; for (const e of this.combat.enemies) if (e.ambient) e.dead = true; }
    this.ui.toast(`${d.name}: ${u.heal ? 'you feel better' : u.ward ? 'the smoke keeps its distance' : 'you feel awake'}.`, 'good');
  }
  gainXP(n) {
    const s = this.state; s.xp += n;
    while (s.xp >= this.xpNext()) { s.xp -= this.xpNext(); s.level++; s.points++; s.hp = this.maxHP(); this.ui.toast(`Level ${s.level}. Spend your point under You in the menu.`, 'quest'); this.audio.chime(); }
  }
  xpNext() { return 80 + this.state.level * 60; }
  spendPoint(k) { const s = this.state; if (s.points > 0 && s.stats[k] < 10) { s.points--; s.stats[k]++; } }
  maxHP() { return 100 + this.state.stats.strength * 12; }
  maxBreath() { return 100 + this.state.stats.will * 15; }
  cycleAbility() { const a = this.state.abilities; if (!a.length) { this.ui.toast('No abilities yet.'); return; } this.state.ability = a[(a.indexOf(this.state.ability) + 1) % a.length]; this.ui.toast('Ready: ' + ABILITIES[this.state.ability].name); }
  hurtPlayer(n, blocked) {
    const s = this.state; if (blocked) { n *= 0.2; this.audio.block(); } else { this.audio.hurt(); this.shake(0.5); }
    s.hp -= n * (+this.settings.damage || 1);
    if (s.hp <= 0) this.fall();
  }
  fall() {
    const s = this.state; s.hp = this.maxHP();
    if (this.combat.duel) this.combat.endDuel(false);
    this.combat.enemies.forEach(e => { if (e.ambient) e.dead = true; });
    this.ui.card(['The fog closes over you, and for a while you are nowhere at all.', 'You come to somewhere quiet, with the smell of old paper.'], () => {
      const p = this.player;
      if (p.interior) { const l = this.under.userData.landing; p.teleport(l[0] + 1, l[2], l[1]); return; }
      const spots = this.restSpots(); let best = spots[0], bd = Infinity;
      for (const r of spots) { const d = Math.hypot(r.x - p.x, r.z - p.z); if (d < bd) { bd = d; best = r; } }
      p.teleport(best.x + 3, best.z + 3);
    }, true);
  }
  restSpots() {
    const out = this.state.libs.map(id => LIBRARIES.find(l => l.id === id));
    if (this.flags.hotel) { const [x, z] = toXZ(PLACES.esperanza.lat, PLACES.esperanza.lon); out.push({ x, z, name: 'Hotel Esperanza' }); }
    const [fx, fz] = toXZ(PLACES.ferry.lat, PLACES.ferry.lon); out.push({ x: fx, z: fz, name: 'Ferry Building' });
    return out;
  }
  fastTravelSpots() {
    const out = [];
    const [fx, fz] = toXZ(PLACES.ferry.lat, PLACES.ferry.lon); out.push({ x: fx, z: fz, kind: 'travel', label: 'Ferry Building', color: '#e2b865' });
    if (this.flags.hotel) { const [x, z] = toXZ(PLACES.esperanza.lat, PLACES.esperanza.lon); out.push({ x, z, kind: 'travel', label: 'Hotel Esperanza', color: '#e2b865' }); }
    return out;
  }
  travelTo(x, z, name, ride) {
    this.enterInterior(false);
    this.ui.card([ride ? 'Bautista stands on the pedals and the city tilts past: Market Street, the old Mint, the long flat run of Valencia, taquerias, bicycles, the smell of rain.' : `You go by the quiet ways to ${name}.`], () => { this.player.teleport(x + 2, z + 2); this.save(); });
  }
  sleepScene() {
    this.ui.card([
      'Room seven is small and clean. The bed is made the way your mother made beds.',
      'The walls begin to talk. Not loudly. A woman asking about the rent. A boy being called in for dinner. A man counting doors.',
      'You try not to listen. You listen. Each voice takes a little of your breath with it, the way the tide takes sand.',
      '<em>A little after three in the morning, you stop breathing.</em>',
      '…',
      'Someone is talking to you. The voice is coming up out of the ground.'
    ], () => {
      this.flags.slept = true; this.state.hour = 5.6; this.state.day++;
      const p = PLACES.lonemountain, [x, z] = toXZ(p.lat, p.lon); this.player.teleport(x + 3, z + 1);
      this.refreshNPCs(); this.save();
    }, true);
  }
  ending(kind) {
    const s = this.state; s.ending = kind; this.quests.advance('m8');
    const T = {
      light: ['Your father stands. It takes him a long time.', 'He lays his hand on the grey stone he poured, and the stone remembers it was only ever sand.', 'The Tide Door opens. The sound is every foghorn on the bay at once, and then it is only the sea.', 'Susannah goes first, without looking back, and then she looks back. Gil goes, still talking. Your father goes last, holding his hat.', 'Up in the city, all at once, the murmuring stops. On Valencia Street, Edie sets down her broom. On the Embarcadero, a pedicab rolls to a stop.', 'At the bottom of the stair, on a boat that is almost not there, a woman with your eyes is waiting. She is laughing at something.', '<em>THE TIDE DOOR</em>\n\nThe city is quiet now. Walk it as long as you like. The boat will wait.'],
      shade: ['You take his chair. It is warm, and it fits you, and that is the worst of it.', 'He stands, lighter, blinking, and does not leave either. None of them leave. Now there are four.', 'Up in the city the murmuring grows. It is starting to sound like your name.', '<em>THE ROOM</em>\n\nThe city is yours. It will murmur for you, always. Walk it, if you can bear to.'],
      ferry: ['You leave them there: three chairs, an open door, three people still explaining themselves to each other.', 'You climb all the stairs. The fog is in. On the Embarcadero a pedicab is waiting, and the man on it has your jaw.', 'He pedals you to the last ferry without asking anything, and on the way you tell him, and he laughs until he cries.', '<em>THE FERRY</em>\n\nThe door is still ajar. Someone else may close it. The city is still here for you to walk.']
    }[kind];
    if (kind === 'light') { s.light += 2; for (const site of this.ruins.userData.sites) this.ruins.userData.setAwake(site.id, true); this.combat.enemies.forEach(e => e.dead = true); }
    if (kind === 'shade') s.light -= 3;
    this.ui.card(T, () => {
      if (kind === 'ferry' || kind === 'light') { this.enterInterior(false); const [x, z] = toXZ(PLACES.ferry.lat, PLACES.ferry.lon); this.player.teleport(x + 2, z); }
      this.refreshNPCs(); this.save();
      this.ui.toast('The story has ended. The city and its unfinished stories are still yours to walk.', 'quest');
    }, true);
  }

  /* ---------------- conversation ---------------- */
  startTalk(npc) {
    this.talk = { npc, history: [] }; npc.mesh.userData.talking = true; this.pauseInput(true);
    document.exitPointerLock && document.exitPointerLock();
    this.player.bike = false;
    this.ui.openDialogue(npc);
    const g = this.voices.greet(npc.id); this.ui.logLine('npc', g); this.talk.history.push({ role: 'npc', text: g });
    this.renderChips();
  }
  renderChips() {
    const t = this.talk; if (!t) return;
    const chips = this.quests.chipsFor(t.npc.id).map(c => ({ ...c, onClick: () => this.pickChip(c) }));
    const c = t.npc.def, extras = [];
    const ask = (label, q) => extras.push({ label, onClick: () => this.say(q, label) });
    if (!chips.length || chips.every(x => x.locked)) {
      ask('Tell me about yourself.', 'Tell me about yourself.');
      if (c.topics.vane) ask('What do you know about Hollis Vane?', 'What do you know about Hollis Vane?');
      if (c.topics.city) ask('Tell me about this part of the city.', 'Tell me about this part of the city.');
      if (c.topics.help && !c.quest) ask('Do you need anything?', 'Do you need anything?');
      ask('Where should I go?', 'Where should I go next?');
    }
    extras.push({ label: 'Goodbye.', onClick: () => this.endTalk() });
    this.ui.chips([...chips, ...extras]);
  }
  pickChip(c) {
    if (c.locked) { this.ui.logLine('sys', c.lockedText || 'Not yet.'); return; }
    this.ui.logLine('me', c.label);
    const r = c.run();
    if (r.reply) { this.ui.logLine('npc', r.reply); this.talk.history.push({ role: 'player', text: c.label }, { role: 'npc', text: r.reply }); }
    this.audio.ui();
    this.renderChips();
    if (this.pending) { const p = this.pending; this.pending = null; setTimeout(() => { this.ui.logLine('sys', '…'); setTimeout(p, 1400); }, 200); }
    this.save();
  }
  async say(text, shown) {
    const t = this.talk; if (!t || t.busy) return;
    this.ui.logLine('me', shown || text);
    const el = this.ui.logLine('npc', '…'); t.busy = true; this.ui.busy(true);
    t.ctl = new AbortController();
    let out = '';
    try {
      out = await this.voices.reply(t.npc.id, t.history, text, this.talkContext(), s => this.ui.setLine(el, s), t.ctl.signal);
    } catch (e) { out = e && e.code === 'cancelled' || (t.ctl.signal.aborted) ? (el.textContent === '…' ? '…' : el.textContent) : this.voices.offline(t.npc.id, text, this.talkContext()); }
    if (this.talk !== t) return;
    const { text: clean, go } = parseTags(out || '…');
    this.ui.setLine(el, clean);
    t.history.push({ role: 'player', text }, { role: 'npc', text: clean });
    if (go) { const p = PLACES[go], [x, z] = toXZ(p.lat, p.lon); this.state.customWP = { x, z, label: p.name }; this.ui.logLine('sys', `Marked on your map: ${p.name}`); }
    t.busy = false; this.ui.busy(false);
  }
  stopTalk() { if (this.talk && this.talk.ctl) this.talk.ctl.abort(); }
  talkContext() {
    const s = this.state, main = MAIN_ORDER.find(id => s.quests[id] && !s.quests[id].done) || 'after';
    const st = this.quests.stageOf(main);
    const done = MAIN_ORDER.filter(id => s.quests[id] && s.quests[id].done).map(id => QUESTS[id].title);
    return { name: s.name, dead: !!s.flags.slept, light: s.light, progress: `Chapters finished: ${done.join(', ') || 'none'}. Current: ${QUESTS[main].title}${st ? ' — ' + st.text : ''}.${s.ending ? ' The story has ended (' + s.ending + ').' : ''}`, extra: this.flags.signed ? 'The player signed Gil Sedgwick\'s paper renouncing the estate.' : '' };
  }
  endTalk() {
    const t = this.talk; if (!t) return;
    if (t.ctl) t.ctl.abort();
    t.npc.mesh.userData.talking = false; this.talk = null; this.ui.closeDialogue(); this.pauseInput(false);
    if (this.pending) { const p = this.pending; this.pending = null; p(); }
  }
  pauseInput(on) { this.paused = on; this.input.enabled = !on; if (on) this.input.releaseAll(); }
  canAct() { return !this.paused && !this.talk; }

  /* ---------------- world queries ---------------- */
  uNight() { return U.uNight.value; }
  groundY(x, z) { if (this.player.interior) { const f = this.city.colliders.floorAt(x, z, this.player.y + 2, 4).floor; return isFinite(f) ? f : this.player.y; } return Math.max(this.city.heightAt(x, z), 0); }
  safeAt(x, z) { if (this.player.interior) return false; for (const id of this.state.libs.concat(['lib-main'])) { const l = LIBRARIES.find(q => q.id === id); if (Math.hypot(l.x - x, l.z - z) < 30) return true; } return false; }
  placeName() {
    const p = this.player; if (p.interior) return 'Beneath Twin Peaks';
    let best = null, bd = Infinity;
    for (const l of LANDMARKS) { const d = Math.hypot(l.x - p.x, l.z - p.z); if (d < Math.max(60, l.r * 1.3) && d < bd) { bd = d; best = l.name; } }
    return best || this.city.district(p.x, p.z) || 'San Francisco Bay';
  }
  // what the player should do next, and where
  objective() {
    const s = this.state, p = this.player;
    let id = s.track && s.quests[s.track] && !s.quests[s.track].done ? s.track : MAIN_ORDER.find(k => s.quests[k] && !s.quests[k].done);
    if (!id) return null;
    const st = this.quests.stageOf(id); if (!st) return null;
    const tgt = this.targetFor(id, st);
    return { quest: QUESTS[id].title, text: st.text, target: tgt, dist: tgt ? Math.hypot(tgt.x - p.x, tgt.z - p.z) : null };
  }
  targetFor(id, st) {
    const p = this.player, s = this.state, under = this.under.userData;
    const npcAt = nid => { const n = this.npcs.find(q => q.id === nid); return n && n.visible ? { x: n.x, z: n.z, under: n.inRoom } : null; };
    const place = pid => { if (pid === 'tidehall') return { x: under.hall[0], z: under.hall[2], under: true }; const q = PLACES[pid]; const [x, z] = toXZ(q.lat, q.lon); return { x, z }; };
    let t = null;
    if (st.talk) t = npcAt(st.talk) || (st.talk === 'hollis' ? { x: under.room[0], z: under.room[2], under: true } : null);
    else if (st.reach) t = place(st.reach);
    else if (st.hollows) t = place(st.hollows.place);
    else if (st.duel) t = npcAt(st.duel);
    else if (st.door === 'tidedoor') { const d = this.ruins.userData.sites.find(q => q.id === 'twinpeaks').door; t = { x: d.x, z: d.z }; }
    else if (st.door === 'hatch') t = { x: under.tideDoor[0], z: under.tideDoor[2], under: true };
    else if (st.collect || st.murmurs || st.glyphs) {
      let best = null, bd = Infinity;
      const cand = st.collect ? this.marks.filter(m => m.kind === 'pickup' && m.set === st.collect && this.markVisible(m)) : st.murmurs ? this.marks.filter(m => m.kind === 'murmur' && this.markVisible(m)) : this.ruins.userData.sites.filter(q => !s.glyphs.includes(q.id)).map(q => ({ x: q.stele[0], z: q.stele[1] }));
      for (const m of cand) { const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < bd) { bd = d; best = m; } }
      if (best) t = { x: best.x, z: best.z };
    }
    if (t && t.under && !p.interior) { const d = this.ruins.userData.sites.find(q => q.id === 'twinpeaks').door; t = { x: d.x, z: d.z }; }
    if (t && !t.under && p.interior) t = { x: under.landing[0], z: under.landing[2] };
    return t;
  }
  waypoint() { const s = this.state; if (s.customWP) return s.customWP; const o = this.objective(); return o && o.target; }

  /* ---------------- interaction ---------------- */
  interactables() {
    const p = this.player, s = this.state, out = [];
    const near = (x, z, r) => Math.hypot(x - p.x, z - p.z) < r;
    for (const n of this.npcs) if (n.visible && !n.hostile && near(n.x, n.z, 3.2) && Math.abs(n.y - p.y) < 3) out.push({ x: n.x, z: n.z, label: `Talk to ${n.def.name}`, icon: '💬', run: () => this.startTalk(n) });
    if (!p.interior) {
      for (const m of this.marks) {
        if (!near(m.x, m.z, 2.8) || !this.markVisible(m)) continue;
        if (m.kind === 'lost') out.push({ x: m.x, z: m.z, label: `Pick up: ${LOST[m.i].name}`, icon: '✋', run: () => { s.lost[m.i] = 1; this.ui.subtitle(LOST[m.i].name, LOST[m.i].text); this.audio.chime(); this.gainXP(10); this.ui.toast('Return lost things at any library.', 'good'); } });
        if (m.kind === 'prov') out.push({ x: m.x, z: m.z, label: `Take: ${ITEMS[m.item].name}`, icon: '✋', run: () => { s.prov[m.i] = s.day; this.give(m.item); } });
        if (m.kind === 'pickup') out.push({ x: m.x, z: m.z, label: m.def.action || `Pick up: ${m.def.name}`, icon: '✋', run: () => this.takePickup(m) });
      }
      for (const site of this.ruins.userData.sites) {
        if (near(site.stele[0], site.stele[1], 2.8) && Math.abs(site.y - p.y) < 3) out.push({ x: site.stele[0], z: site.stele[1], label: s.glyphs.includes(site.id) ? `The sign of ${site.glyph}` : 'Lay your hand on the stone', icon: '✋', run: () => this.readGlyph(site) });
        if (site.door && near(site.door.x, site.door.z, 3.2)) out.push({ x: site.door.x, z: site.door.z, label: this.flags.underOpen ? 'Go down through the round door' : 'Touch the round stone door', icon: '⬇', run: () => this.tideDoor() });
      }
      for (const l of LIBRARIES) if (near(l.x, l.z, 14)) out.push({ x: l.x, z: l.z, label: `Rest in the ${l.name}`, icon: '📖', run: () => this.rest(l) });
      if (this.flags.hotel) { const [hx, hz] = toXZ(PLACES.esperanza.lat, PLACES.esperanza.lon); if (near(hx, hz, 8)) out.push({ x: hx, z: hz, label: 'Rest in room seven', icon: '🛏', run: () => this.rest({ name: 'Hotel Esperanza', hotel: true }) }); }
    } else {
      const u = this.under.userData;
      if (near(u.landing[0], u.landing[2], 4)) out.push({ x: u.landing[0], z: u.landing[2], label: 'Climb back up to Twin Peaks', icon: '⬆', run: () => this.goUp() });
      if (near(u.tideDoor[0], u.tideDoor[2], 4)) out.push({ x: u.tideDoor[0], z: u.tideDoor[2], label: this.quests.stageOf('m8') && this.quests.stageOf('m8').door === 'hatch' ? 'Open the steel hatch' : s.quests.m8 && s.quests.m8.stage > 2 ? 'Go into the room' : 'A steel hatch, sealed', icon: '🚪', run: () => this.hatch() });
      if (near(u.roomEntry[0], u.roomEntry[2], 2.5)) out.push({ x: u.roomEntry[0], z: u.roomEntry[2], label: 'Leave the room', icon: '🚪', run: () => { const t = u.tideDoor; this.player.teleport(t[0] - 2, t[2], t[1]); } });
    }
    // closest first, preferring what you face
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    out.forEach(o => { const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) || 1; o.score = d - (dx * fx + dz * fz) / d * 1.5; });
    out.sort((a, b) => a.score - b.score);
    return out[0] || null;
  }
  takePickup(m) {
    const s = this.state, d = m.def;
    if (d.weapon) { this.giveWeapon(d.weapon); this.audio.chime(); return; }
    if (d.item && m.set === 'books') { if (!s.inv[d.item]) { this.ui.toast('You do not have that book.', 'warn'); return; } s.inv[d.item]--; }
    else if (d.item) this.give(d.item);
    (s.sets[m.set] = s.sets[m.set] || [])[m.i] = 1;
    if (m.set === 'bells') this.audio.bell(); else this.audio.chime();
    this.ui.float(d.name); this.quests.check(); this.save();
  }
  readGlyph(site) {
    const s = this.state;
    if (!s.seenSites.includes(site.id)) s.seenSites.push(site.id);
    if (s.glyphs.includes(site.id)) { this.ui.subtitle(site.name, `The sign of ${site.glyph}. The stone is warm.`); return; }
    if (!s.abilities.includes('hush') && !this.flags.stairsight) { this.ui.subtitle(site.name, 'The stone is carved with a sign you cannot read yet. Someone in the city must know how.'); return; }
    s.glyphs.push(site.id); this.ruins.userData.setAwake(site.id, true); this.audio.bell(); this.gainXP(40);
    const meaning = { Door: 'a door that opens downward', Ash: 'what the fire leaves', Fog: 'the grey that walks', Name: 'what is kept when the body is not', Ferry: 'the boat that takes and brings', Salt: 'what the sea leaves on you', Shell: 'a house that was a body', Mother: 'the first stair', Stair: 'one step for each generation', Bell: 'a sound that calls the drowned', Tide: 'the sea coming home', Return: 'the way back is down' }[site.glyph];
    this.ui.subtitle(`${site.name} · glyph ${s.glyphs.length} of 12`, `You lay your hand on the stone and the sign of ${site.glyph} lights under it: ${meaning}.`, 9);
    this.quests.check(); this.save();
  }
  tideDoor() {
    const st = this.quests.stageOf('m7');
    if (this.flags.underOpen) { this.goUnder(); return; }
    if (st && st.door === 'tidedoor') {
      this.ui.card(['You hold Susannah\'s shell to the round stone. Salt answers salt.', 'The stone turns like a key in a lock that has waited ten thousand years, and a cold breath comes up from below, smelling of kelp and wet rock.'], () => { this.flags.underOpen = true; this.quests.event('door', 'tidedoor'); this.goUnder(); });
    } else this.ui.subtitle('The round door', 'A round stone door, carved with steps and waves. It does not move. It is waiting for something from the sea.');
  }
  hatch() {
    const st = this.quests.stageOf('m8'), s = this.state, u = this.under.userData;
    if (st && st.door === 'hatch') { this.ui.card(['Rafa\'s old keycard does nothing. Your hand on the wheel does. It turns.', 'Behind the grey stone there is a room made up like a parlor: red walls, three chairs, a lamp that cannot be turned off. No mirror. No window.', 'Three people look up at you. The door behind you stays open.'], () => { this.quests.event('door', 'hatch'); this.player.teleport(u.roomEntry[0] + 1, u.roomEntry[2], u.roomEntry[1]); }); return; }
    if (s.quests.m8 && (s.quests.m8.stage > 2 || s.quests.m8.done)) { this.player.teleport(u.roomEntry[0] + 1, u.roomEntry[2], u.roomEntry[1]); return; }
    this.ui.subtitle('The grey stone', 'Poured concrete and cable, stopped into the mouth of the Tide Door. A steel hatch is set into it. The Hollows are thick here.');
  }
  rest(l) {
    const s = this.state;
    if (l.id && !s.libs.includes(l.id)) { s.libs.push(l.id); this.ui.toast(`${l.name} opened. You can travel here from the map.`, 'quest'); }
    s.hp = this.maxHP(); s.breath = this.maxBreath();
    const lost = s.lost.map((v, i) => v === 1 ? i : -1).filter(i => i >= 0);
    if (lost.length && !l.hotel) { lost.forEach(i => s.lost[i] = 2); s.lostReturned += lost.length; this.gainXP(25 * lost.length); s.light += lost.length >= 3 ? 1 : 0; this.ui.toast(`You leave ${lost.length} lost thing${lost.length > 1 ? 's' : ''} at the Lost & Found.`, 'good'); }
    this.save(); this.audio.chime();
    this.ui.toast('Rested and saved. Open the map to travel.', 'good');
    if (l.hotel) { s.hour = s.hour < 12 ? 19 : 7.5; if (s.hour === 7.5) s.day++; }
  }

  /* ---------------- per-frame ---------------- */
  _globalKeys(e) {
    if (!this.started) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.code === 'KeyU' && !this.paused) { this.player.rescue(); this.ui.toast('You find your footing on the street.', 'good'); }
  }
  shake(a) { if (!this.settings.reduced) this.shakeA = Math.max(this.shakeA, a); }
  flash() { if (this.settings.reduced) return; const f = $('flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 60); }
  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    const dt = Math.min(0.05, (now - this.lastT) / 1000); this.lastT = now;
    if (!this.started || !this.renderer) return;
    this.t += dt;
    try { this.update(dt); } catch (e) { console.error(e); }
    this.render(dt);
    this.input.endFrame();
    this._perf(dt);
  }
  _perf(dt) {
    this.pfT = (this.pfT || 0) + dt; this.pfN = (this.pfN || 0) + 1;
    if (this.pfT > 2) { const fps = this.pfN / this.pfT; this.pfT = 0; this.pfN = 0; const old = this.pr;
      if (fps < 40) this.pr = Math.max(0.6, this.pr - 0.15); else if (fps > 56) this.pr = Math.min(this.maxPR, this.pr + 0.1);
      if (Math.abs(old - this.pr) > 0.01) { this.renderer.setPixelRatio(this.pr); this.onResize(); } }
  }
  update(dt) {
    const g = this, s = this.state, p = this.player, inp = this.input;
    inp.pollGamepad(dt);
    // menus and panels
    if (inp.pressed('menu')) { if (this.talk) this.endTalk(); else if (this.ui.menuOpen) this.ui.closeMenu(); else if (!this.ui.cardOpen) this.ui.openMenu(); }
    if (inp.pressed('map') && !this.talk && !this.ui.cardOpen) { if (this.ui.menuOpen && this.ui.tab === 'map') this.ui.closeMenu(); else this.ui.openMenu('map'); }
    if (this.paused && !this.talk) { this.ui.update(0); return; }
    if (inp.pressed('journal')) { this.ui.openMenu('journal'); return; }
    if (inp.pressed('inventory')) { this.ui.openMenu('inventory'); return; }
    if (inp.pressed('character')) { this.ui.openMenu('character'); return; }
    // time and weather
    const ts = +this.settings.timeScale;
    if (!p.interior && !this.talk) { s.hour += dt * ts / 90; if (s.hour >= 24) { s.hour -= 24; s.day++; } }
    const h = s.hour, fogBase = h < 5 ? 0.55 : h < 10.5 ? 0.8 - (h - 5) * 0.08 : h < 16 ? 0.28 : h < 20 ? 0.3 + (h - 16) * 0.12 : 0.7;
    const west = Math.max(0, Math.min(1, (-p.x - 1000) / 5000));
    const target = Math.min(1, fogBase * (0.6 + west * 0.7) + (s.ending === 'shade' ? 0.3 : 0));
    this.fogBank += (target - this.fogBank) * Math.min(1, dt * 0.2);
    if (!p.interior) setTimeOfDay(h, this.fogBank); else this.underEnv();
    U.uTime.value = this.t;
    if (this.talk) {
      // keep facing the speaker, gently
      const n = this.talk.npc, want = Math.atan2(-(n.x - p.x), -(n.z - p.z));
      let d = want - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d * Math.min(1, dt * 4); p.pitch *= 0.9;
      n.facing = Math.atan2(p.x - n.x, p.z - n.z);
    } else {
      // actions
      if (inp.pressed('bike')) { if (p.interior || this.combat.duel) this.ui.toast('No room for a bicycle here.'); else { p.bike = !p.bike; this.ui.toast(p.bike ? 'On the bicycle. Press B (🚲) to get off.' : 'On foot.'); } }
      if (inp.pressed('heal')) { const f = ['sourdough', 'pandulce', 'coffee'].find(k => s.inv[k]); if (f) this.useItem(f); else this.ui.toast('Nothing to eat. The Ferry Building has bread.', 'warn'); }
      for (let i = 1; i <= 6; i++) if (inp.pressed('weapon' + i)) { const w = WEAPON_ORDER[i - 1]; if (s.weapons.includes(w)) this.wield(w); }
      if (inp.pressed('weaponNext') || inp.pressed('weaponPrev')) { const own = WEAPON_ORDER.filter(w => s.weapons.includes(w)); if (own.length) this.wield(own[(own.indexOf(s.weapon) + (inp.peek('weaponPrev') ? -1 : 1) + own.length) % own.length]); }
      p.update(dt, inp, { blocking: this.combat.blocking });
      const it = this.interactables(); this.ui.prompt(it);
      if (it && inp.pressed('interact')) it.run();
      this.combat.update(dt, this.t);
    }
    // regen
    s.breath = Math.min(this.maxBreath(), s.breath + dt * 4);
    if (!this.combat.duel && !this.combat.enemies.some(e => Math.hypot(e.x - p.x, e.z - p.z) < 12)) s.hp = Math.min(this.maxHP(), s.hp + dt * 1.5);
    this.wardT = Math.max(0, this.wardT - dt);
    // world reacts
    this._murmurs(); this._questSpawns(); this._duels(); this._npcs(dt); this._walkers(dt); this._markersUpdate();
    // arriving somewhere
    if (!p.interior && !this.talk) for (const id of this.quests.active()) { const st = this.quests.stageOf(id); if (st && st.reach && st.reach !== 'tidehall') { const q = PLACES[st.reach], [x, z] = toXZ(q.lat, q.lon); if (Math.hypot(x - p.x, z - p.z) < 25) this.quests.event('reach', st.reach); } }
    if (p.interior) { const hall = this.under.userData.hall; if (Math.hypot(hall[0] - p.x, hall[2] - p.z) < 18) this.quests.event('reach', 'tidehall'); }
    if (s.customWP && Math.hypot(s.customWP.x - p.x, s.customWP.z - p.z) < 12) { s.customWP = null; this.ui.toast('You have arrived.'); }
    // streaming
    if (!p.interior) { this.trees.userData.update(p.x, p.z); this.buildings.userData.update(this.camera); this.landmarks.userData.update(this.t); }
    // audio bed
    const sea = p.interior ? 0 : Math.max(0, 1 - this.distToWater() / 300);
    this.audio.update(dt, { t: this.t, sea, height: p.y, fog: this.fogBank, night: this.uNight() > 0.5, under: !!p.interior });
    if (p.speed > 0.5 && p.onGround && !p.bike) { this.stepT = (this.stepT || 0) + dt * p.speed; if (this.stepT > 1.4) { this.stepT = 0; this.audio.step(p.interior ? 'stone' : 'street'); } }
    // autosave
    this.saveT = (this.saveT || 0) + dt; if (this.saveT > 45) { this.saveT = 0; this.save(); }
    this.ui.update(dt);
  }
  distToWater() {
    if (this._wT && this.t - this._wT < 1) return this._wD; this._wT = this.t;
    const p = this.player; let d = 400;
    for (let a = 0; a < 8; a++) for (const r of [40, 120, 250]) { if (!this.city.isLand(p.x + Math.cos(a * 0.785) * r, p.z + Math.sin(a * 0.785) * r)) { d = Math.min(d, r); break; } }
    return (this._wD = d);
  }
  underEnv() {
    U.uSunDir.value.set(0.2, 0.9, 0.1).normalize(); U.uSunColor.value.setRGB(0.25, 0.4, 0.42); U.uAmbient.value.setRGB(0.22, 0.34, 0.36);
    U.uGroundBounce.value.setRGB(0.08, 0.1, 0.12); U.uFogColor.value.setRGB(0.03, 0.06, 0.08); U.uFogDensity.value = 0.02; U.uNight.value = 0.6; U.uFogBank.value = 0;
  }
  _murmurs() {
    const s = this.state, p = this.player; if (p.interior) return;
    for (const m of this.marks) if (m.kind === 'murmur' && !s.murmurs[m.i] && Math.hypot(m.x - p.x, m.z - p.z) < 9) {
      s.murmurs[m.i] = 1; const mm = MURMURS[m.i]; this.ui.subtitle(mm.who, `“${mm.text}”`, 8); this.audio.murmur(); this.gainXP(8); this.quests.check();
    }
  }
  _questSpawns() {
    const s = this.state, p = this.player;
    for (const id of this.quests.active()) {
      const st = this.quests.stageOf(id); if (!st || !st.hollows) continue;
      const tgt = this.targetFor(id, st); if (!tgt) continue;
      const inside = st.hollows.place === 'tidehall';
      if (inside !== !!p.interior) continue;
      if (Math.hypot(tgt.x - p.x, tgt.z - p.z) > 70) continue;
      const alive = this.combat.enemies.filter(e => e.quest === id).length, need = st.hollows.n - (s.kills[id] || 0) - alive;
      for (let k = 0; k < need; k++) {
        const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 10;
        let x = tgt.x + Math.cos(a) * r, z = tgt.z + Math.sin(a) * r;
        if (inside) { const b = this.under.userData.hall; x = b[0] + 4 + Math.random() * 20; z = b[2] + (Math.random() - 0.5) * 20; }
        this.combat.spawnHollow(x, z, { quest: id });
      }
    }
  }
  _duels() {
    if (this.combat.duel || this.talk) return; const p = this.player;
    for (const id of this.quests.active()) { const st = this.quests.stageOf(id); if (!st || !st.duel) continue; const n = this.npcs.find(q => q.id === st.duel); if (n && Math.hypot(n.x - p.x, n.z - p.z) < 9) this.combat.startDuel(n); }
  }
  _npcs(dt) {
    const p = this.player;
    for (const n of this.npcs) {
      if (!n.visible) continue;
      const d = Math.hypot(n.x - p.x, n.z - p.z), vis = n.inRoom ? !!p.interior : (!p.interior && d < 220);
      n.mesh.visible = vis; if (!vis) continue;
      if (!n.hostile && !n.inRoom && d > 12) { n.x += (n.hx - n.x) * dt * 0.5; n.z += (n.hz - n.z) * dt * 0.5; }
      if (!n.hostile && d < 10 && !this.talk) n.facing = Math.atan2(p.x - n.x, p.z - n.z);
      if (n.inRoom) n.facing = Math.atan2(this.under.userData.room[0] - n.x, this.under.userData.room[2] - n.z);
      n.y = n.inRoom ? n.y : (p.interior ? n.y : this.findFloor(n.x, n.z, n.y));
      n.mesh.position.set(n.x, n.y, n.z);
      let a = n.facing - n.mesh.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); n.mesh.rotation.y += a * Math.min(1, dt * 5);
      n.mesh.userData.animate(dt, n.hostile ? 1.2 : 0, this.t);
      if (n.inRoom) n.mesh.position.y = n.y + 0.02;
    }
  }
  findFloor(x, z, y) { return this.player.floorAt.call({ city: this.city, interior: null }, x, z, y).f; }
  _walkers(dt) {
    const p = this.player; if (p.interior) return;
    const cap = this.settings.quality === 'low' ? 6 : 12, want = Math.round(cap * (1 - this.uNight() * 0.6));
    this.walkT = (this.walkT || 0) - dt;
    if (this.walkers.length < want && this.walkT < 0) {
      this.walkT = 0.7;
      const sts = this.nearStreets(p.x, p.z, 150);
      if (sts.length) {
        const st = sts[Math.floor(Math.random() * sts.length)], i = Math.floor(Math.random() * (st.pts.length - 1));
        const [ax, az] = st.pts[i], [bx, bz] = st.pts[i + 1], d0 = Math.hypot(ax - p.x, az - p.z);
        if (d0 > 50 && d0 < 170) {
          const side = Math.random() < 0.5 ? -1 : 1, look = { skin: [0xe0b894, 0xc99a78, 0x8a5a3c, 0x5a3a28, 0xd8b48e, 0xa8765a][Math.floor(Math.random() * 6)], hair: [0x1a1410, 0x3a2a1a, 0x6a4a2a, 0xb8b8b8, 0xd8b060][Math.floor(Math.random() * 5)], hairStyle: ['short', 'long', 'bun', 'short', 'afro', 'bald'][Math.floor(Math.random() * 6)], top: [0x3a4a5a, 0x7a3a2a, 0x2a2a2a, 0x5a6a4a, 0x8a7a6a, 0x2a4a6a, 0xa8342a][Math.floor(Math.random() * 7)], bottom: [0x2a2a30, 0x3a3d44, 0x4a4030][Math.floor(Math.random() * 3)], hat: Math.random() < 0.2 ? 'beanie' : 'none', coat: Math.random() < 0.3 ? 0x3a3530 : false, ghost: Math.random() < 0.3 && this.flags.slept, height: 0.92 + Math.random() * 0.14 };
          const mesh = makePerson(look); this.scene.add(mesh);
          this.walkers.push({ mesh, st, i, t: 0, dir: 1, side, speed: 1.1 + Math.random() * 0.5 });
        }
      }
    }
    for (const w of this.walkers) {
      const pts = w.st.pts, a = pts[w.i], b = pts[w.i + w.dir] || a, L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      w.t += dt * w.speed / L;
      if (w.t >= 1) { w.t = 0; w.i += w.dir; if (w.i + w.dir < 0 || w.i + w.dir >= pts.length) { w.dir *= -1; w.side *= -1; } continue; }
      const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, off = w.st.width / 2 + 1.4;
      const x = a[0] + (b[0] - a[0]) * w.t - uz * off * w.side, z = a[1] + (b[1] - a[1]) * w.t + ux * off * w.side;
      w.mesh.position.set(x, this.city.heightAt(x, z), z); w.mesh.rotation.y = Math.atan2(ux, uz);
      w.mesh.userData.animate(dt, w.speed, this.t);
      if (Math.hypot(x - p.x, z - p.z) > 220) w.gone = true;
    }
    for (const w of this.walkers) if (w.gone) this.scene.remove(w.mesh);
    this.walkers = this.walkers.filter(w => !w.gone);
  }
  _markersUpdate() {
    const p = this.player;
    for (const m of this.marks) {
      const d = Math.hypot(m.x - p.x, m.z - p.z), v = this.markVisible(m) && d < 350;
      m.sprite.visible = v; if (!v) continue;
      m.sprite.position.y = m.y + 1.2 + Math.sin(this.t * 2 + m.x) * 0.15;
      m.sprite.material.opacity = Math.min(1, 0.45 + 30 / Math.max(d, 1)) * (m.kind === 'murmur' ? 0.6 + 0.4 * Math.sin(this.t * 3 + m.z) : 1);
    }
    const wp = this.waypoint();
    this.beacon.visible = !!wp && !this.talk && Math.hypot(wp.x - p.x, wp.z - p.z) > 25;
    if (wp) { const y = p.interior ? p.y - 10 : Math.max(0, this.city.heightAt(wp.x, wp.z)); this.beacon.position.set(wp.x, y, wp.z); this.beacon.material.opacity = 0.12 + 0.06 * Math.sin(this.t * 2); }
  }
  render(dt) {
    const p = this.player, cam = this.camera, s = this.state, R = this.renderer;
    const shake = this.shakeA * 0.03; this.shakeA = Math.max(0, this.shakeA - dt * 2);
    cam.position.set(p.x + (Math.random() - 0.5) * shake, p.eye(this.settings.reduced) + (Math.random() - 0.5) * shake, p.z);
    cam.rotation.set(p.pitch, p.yaw, 0);
    U.uCamPos.value.copy(cam.position);
    this.sky.position.copy(cam.position);
    // storybook lights follow the painted sky
    this.sun.position.copy(cam.position).addScaledVector(U.uSunDir.value, 500); this.sun.target.position.copy(cam.position);
    this.sun.color.copy(U.uSunColor.value); this.sun.intensity = 2.4 * (1 - U.uNight.value * 0.8);
    this.hemi.color.copy(U.uAmbient.value).multiplyScalar(1.6); this.hemi.groundColor.copy(U.uGroundBounce.value).multiplyScalar(1.6);
    this.hsun.color.copy(this.sun.color); this.hsun.intensity = this.sun.intensity; this.hsun.position.set(U.uSunDir.value.x, U.uSunDir.value.y, U.uSunDir.value.z);
    this.hhemi.color.copy(this.hemi.color); this.hhemi.groundColor.copy(this.hemi.groundColor);
    R.setClearColor(p.interior ? 0x05080a : U.uFogColor.value, 1);
    R.clear(); R.render(this.scene, cam);
    // hands: their own pass, never clipped by walls
    this.hands.userData.setWeapon(s.weapons.length ? s.weapon : null);
    this.hands.visible = this.started && !this.talk;
    this.hands.userData.update({ t: this.t, swing: this.combat.swingT, block: this.combat.blocking, cast: this.combat.castT, speed: p.speed, bike: p.bike, light: Math.max(-1, Math.min(1, s.light / 4)) * (this.flags.slept ? 1 : 0.3), reduced: this.settings.reduced });
    R.clearDepth(); R.render(this.handsScene, this.handsCam);
  }
}

const game = new Game();
window.__undertow = game;   // for testing
// installed app: work offline once visited
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.claude) navigator.serviceWorker.register('sw.js').catch(() => {});
