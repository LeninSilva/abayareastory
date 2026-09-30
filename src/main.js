// AÑIL: a mystery in Jiquilpan de Juárez, Michoacán. The game: world, story, driving, flying, people, rendering.
import * as THREE from 'three';
import { loadCity } from './data.js';
import { U } from './render/shaders.js';
import { makeSky, setTimeOfDay } from './render/sky.js';
import { makeTerrain, makeStreets, makeStreams } from './render/ground.js';
import { SunShadows } from './render/shadows.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { makeBuildings } from './render/buildings.js';
import { makeTrees } from './render/trees.js';
import { makeGrass } from './render/grass.js';
import { makeDetail, CarKit } from './render/detail.js';
import { Traffic } from './render/traffic.js';
import { makeLandmarks } from './render/landmarks.js';
import { makePerson, makeHands } from './render/people.js';
import { PLACES, barrio } from './geo.js';
import { Input } from './game/input.js';
import { Player } from './game/player.js';
import { CHARACTERS, EXTRAS } from './game/story.js';
import { Story, CHAPTERS, CLUES, ENDINGS } from './game/quests.js';
import { PAGES, ACHIEVEMENTS } from './game/lore.js';
import { Voices, parseTags } from './game/dialogue.js';
import { Audio } from './game/audio.js';
import { UI, LANDMARK_IDS, fmtT } from './game/ui.js';
import { makeCitizen, REGULARS } from './game/citizens.js';
import { Vehicles } from './game/vehicle.js';
import { makeRaces, RaceRun } from './game/races.js';

const SAVE_KEY = 'anil-save-v1', SET_KEY = 'anil-settings-v1';
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
const $ = id => document.getElementById(id);
const mobile = matchMedia('(pointer: coarse)').matches;
const DEFAULT_SETTINGS = { quality: mobile ? 'low' : 'medium', text: 'm', contrast: 'normal', reduced: false, timeScale: '1', sensitivity: 1, invertY: false, touch: 'auto', chase: 'normal', master: 0.8, music: 0.5, fx: 0.8, voice: 'auto', apiKey: '' };

class Game {
  constructor() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, store.get(SET_KEY) || {});
    this.canvas = $('view');
    this.audio = new Audio();
    this.input = new Input(this.canvas, $('touch-layer'));
    for (const b of document.querySelectorAll('#tbtns [data-action]')) this.input.bindButton(b);
    this.voices = new Voices(this.settings);
    this.ui = new UI(this);
    this.started = false; this.paused = false; this.t = 0; this.talk = null; this.walkers = []; this.npcs = [];
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
    $('btn-new').addEventListener('click', () => { if (store.get(SAVE_KEY) && !confirm('Begin a new game? Your saved game will be replaced.')) return; this.begin(null); });
    $('btn-continue').addEventListener('click', () => this.begin(store.get(SAVE_KEY)));
    $('btn-title-settings').addEventListener('click', () => this.ui.openMenu('settings'));
    $('btn-about').addEventListener('click', () => this.ui.card([
      '<em>AÑIL</em>\nA mystery in Jiquilpan de Juárez, Michoacán: the real town, its streets, houses, churches, plazas and mountains, built from open map and elevation data.',
      'Your grandfather found what his father hid in 1940. Then he vanished on the Cerro de San Francisco. Follow the clues. Talk to anyone. Drive any car. Fly.',
      'The town, its landmarks and its history are real. Every character, the company, the 1938 title and the cave are invented.'
    ]));
  }
  setSetting(k, v) {
    if (k === 'apiKey' && v === '••••••••') return;
    if (['reduced', 'invertY'].includes(k)) v = v === true || v === 'true';
    if (['sensitivity', 'master', 'music', 'fx'].includes(k)) v = +v;
    const qualityChanged = k === 'quality' && v !== this.settings.quality;
    this.settings[k] = v; store.set(SET_KEY, this.settings); this.applySettings();
    if (qualityChanged && this.started) this.ui.toast('Picture quality changes fully the next time the town loads.', 'good');
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
  qualityPR() { const d = devicePixelRatio || 1, q = this.settings.quality; return q === 'cinematic' ? Math.max(1.25, Math.min(d, 2)) : Math.min(d, q === 'high' ? 2 : q === 'medium' ? 1.35 : 1); }

  /* ---------------- starting ---------------- */
  async begin(save) {
    this.audio.start();
    $('title').classList.remove('show'); $('loading').classList.add('show');
    try { if (!this.city) await this.buildWorld(); }
    catch (e) { console.error(e); $('load-text').textContent = 'The town would not load: ' + e.message + '. Check your connection and reload.'; return; }
    $('loading').classList.remove('show');
    this.newState(save);
    this.started = true; document.body.classList.toggle('touch', this.touchUI()); this.ui.showHUD(true);
    this.placeNPCs();
    const p = this.player;
    if (save && save.pos) {
      p.teleport(save.pos[0], save.pos[2], save.pos[1]); p.yaw = save.yaw || 0;
      this.ui.toast('Bienvenido de nuevo, ' + this.state.name + '.', 'good');
    } else {
      const j = PLACES.jardin; p.teleport(j.x + 26, j.z - 8); p.yaw = Math.PI / 2 + 0.25;   // on the Jardín, looking at the kiosco and the Parroquia's tower
      this.ui.card([
        'Three nights ago your grandfather called you from Jiquilpan. You had not heard his voice in a year.',
        '"<em>Encontré lo que escondió Cuco.</em> I found what Cuco hid. Come before the cabildo votes on Friday." Then the line went dead.',
        'The next morning the police said Don Aurelio Valdovinos had gone walking on the Cerro de San Francisco and not come back. After three days they stopped looking.',
        'You take the bus from Guadalajara, along the lake. It leaves you on the Jardín at dusk, under the bells of San Francisco.'
      ], () => { this.tutorial(); this.unlock('bienvenido'); });
    }
    { const st = this.story.step(); if (st && (st.escape || st.timed)) this.stepStarted(st); }
    this.lastT = performance.now(); if (!this.looping) { this.looping = true; requestAnimationFrame(t => this.frame(t)); }
  }
  tutorial() {
    const touch = this.touchUI();
    this.ui.toast(touch ? 'Left thumb to walk, right thumb to look.' : 'WASD to walk. Click the view to look with the mouse.', 'good');
    setTimeout(() => this.ui.toast(touch ? 'The big button talks, examines and gets you into cars.' : 'E talks, examines, and gets you into any car. C opens the case file.', 'good'), 4500);
    setTimeout(() => this.ui.toast('Follow the gold diamond on the compass. Tía Cuca is at her cart on the Jardín.', 'good'), 9000);
  }
  newState(save) {
    const name = ($('name-input').value || '').trim() || (save && save.name) || 'Ana';
    const s = save || { name, hour: 18.25, day: 1, ch: 0, st: 0, any: [], used: [], clues: [], flags: {}, met: [], ach: {}, pages: [], visited: [], talked: 0, odo: 0, flown: 0, races: {}, customWP: null, ending: null, pos: null, cars: [], jetpack: false };
    this.state = s;
    this.story = new Story({
      state: () => this.state,
      fx: fx => this.applyFx(fx),
      changed: () => { this.save(); this.refreshNPCs(); },
      stepStart: st => { this.ui.toast(st.text, 'quest'); this.stepStarted(st); },
      chapterStart: c => { this.ui.toast(c.title, 'quest'); this.audio.chime(); this.stepStarted(this.story.step()); },
      chapterDone: c => this.ui.toast('Solved: ' + c.title, 'good'),
      inspect: (ins, done) => this.inspect(ins, done),
      ending: id => { this.pendingEnding = id; }
    });
    const p = this.player; p.jet = false; p.driving = null; p.bike = false;
    this.vehicles.cars = []; this.vehicles.driving = null;
    for (const c of s.cars || []) this.vehicles.add({ x: c.x, z: c.z, y: this.city.heightAt(c.x, c.z) + 0.1, ang: c.ang, kind: c.kind, color: c.color });
    if (this.race) { this.race.dispose(); this.race = null; }
    this.chaser = null; this.timer = null;
  }
  save() {
    if (!this.started) return; const s = this.state, p = this.player, c = this.vehicles.driving;
    s.pos = c ? [c.x + 2.5 * Math.sin(c.ang), c.y, c.z - 2.5 * Math.cos(c.ang)] : p.jet && p.lastSafe ? p.lastSafe.slice() : [p.x, p.y, p.z]; s.yaw = p.yaw;
    s.cars = this.vehicles.cars.map(v => ({ x: v.x, z: v.z, ang: v.ang, kind: v.kind, color: v.color }));
    store.set(SAVE_KEY, s);
  }
  toTitle() { this.save(); this.started = false; this.endTalk(); this.ui.showHUD(false); $('btn-continue').hidden = !store.get(SAVE_KEY); $('title').classList.add('show'); document.exitPointerLock && document.exitPointerLock(); }

  /* ---------------- the world ---------------- */
  async buildWorld() {
    const set = (t, f) => { $('load-text').textContent = t; $('load-bar').style.width = (f * 100) + '%'; };
    const tick = () => new Promise(r => setTimeout(r, 0));
    set('Unfolding the town…', 0.02);
    const city = this.city = await loadCity(f => set('Unfolding the town…', f * 0.4));
    const q = this.settings.quality;
    const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: q !== 'low', powerPreference: 'high-performance' });
    R.toneMapping = THREE.AgXToneMapping; R.toneMappingExposure = 1.05; R.outputColorSpace = THREE.SRGBColorSpace; R.autoClear = false;   // AgX: filmic, with soft highlight roll-off
    this.maxPR = this.qualityPR(); this.pr = this.maxPR; R.setPixelRatio(this.pr);
    const scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.2, 60000); this.camera.rotation.order = 'YXZ';
    this.handsScene = new THREE.Scene(); this.handsCam = new THREE.PerspectiveCamera(60, 1, 0.01, 10);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.2); this.hemi = new THREE.HemisphereLight(0xbcd0ff, 0x6a5a48, 1.1); scene.add(this.sun, this.sun.target, this.hemi);
    this.hsun = new THREE.DirectionalLight(0xffffff, 2); this.hhemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); this.handsScene.add(this.hsun, this.hhemi);
    this.onResize(); addEventListener('resize', () => this.onResize());
    set('Raising the Cerro de San Francisco…', 0.45); await tick();
    this.surface = new THREE.Group(); scene.add(this.surface);
    this.sky = makeSky(); scene.add(this.sky);
    this.terrain = makeTerrain(city, q); this.surface.add(this.terrain);
    this.streams = makeStreams(city); this.surface.add(this.streams);
    set('Laying the empedrado…', 0.55); await tick();
    this.streets = makeStreets(city); this.surface.add(this.streets);
    set('Whitewashing the houses…', 0.65); await tick();
    this.buildings = makeBuildings(city, q); this.surface.add(this.buildings);
    set('Planting the laureles and the jacarandas…', 0.74); await tick();
    this.trees = makeTrees(city, q); this.surface.add(this.trees);
    if (q !== 'low') { this.grass = makeGrass(city, q); this.surface.add(this.grass); }
    U.uDetail.value = q === 'low' ? 0 : 1;
    set('Ringing the bells of San Francisco…', 0.82); await tick();
    this.landmarks = makeLandmarks(city); this.surface.add(this.landmarks); this.spots = this.landmarks.userData.spots;
    set('Parking the cars…', 0.9); await tick();
    this.detail = makeDetail(city, R, q); this.surface.add(this.detail);
    this.traffic = new Traffic(city, R, q, (x, z, r) => this.nearStreets(x, z, r)); this.surface.add(this.traffic.group);
    this.vehicles = new Vehicles(city, R); this.surface.add(this.vehicles.group);
    this.chaseKit = new CarKit(R, 1); this.surface.add(this.chaseKit.group);
    this.player = new Player(city);
    this.player.onLanded = ok => this.ui.toast(ok ? 'Down. (G or 🚀 to fly again.)' : 'No room to land here: find a street, a field or a flat roof.', ok ? undefined : 'warn');
    this.player.onCaught = () => { this.ui.toast('The mochila catches you. Hold Space to climb, or let it set you down.'); this.audio.jetStart(); };
    this.hands = makeHands(); this.handsScene.add(this.hands);
    this._streetIndex(); this._markers();
    this.races = makeRaces(city, this.spots);
    this._post(q);
    this._envSetup();
    set('Waking the town…', 1); await tick();
    try { R.compile(scene, this.camera); } catch (_) {}
  }
  _post(q) {
    const R = this.renderer; if (q === 'low') return;
    const size = new THREE.Vector2(); R.getDrawingBufferSize(size);
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: q === 'high' ? 4 : 2 });
    const c = this.composer = new EffectComposer(R, rt);
    c.addPass(new RenderPass(this.scene, this.camera));
    const ao = this.ao = new GTAOPass(this.scene, this.camera, size.x, size.y);
    const hq = q === 'high' || q === 'cinematic';
    ao.updateGtaoMaterial({ radius: 1.3, distanceExponent: 1.6, thickness: 2.5, scale: 1.0, samples: hq ? 16 : 8, distanceFallOff: 1, screenSpaceRadius: false });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: hq ? 16 : 8 });
    ao.blendIntensity = 0.7;
    if (!hq) { const setS = ao.setSize.bind(ao); ao.setSize = (w, h) => setS(Math.ceil(w / 2), Math.ceil(h / 2)); ao.setSize(size.x, size.y); }
    { const hide = [], ov = ao.overrideVisibility.bind(ao), rv = ao.restoreVisibility.bind(ao);
      ao.overrideVisibility = () => { ov(); hide.length = 0; for (const o of [this.sky, this.markerGroup, this.beacon, this.raceGroup(), this.grass, ...this.npcs.map(n => n.mesh), ...this.walkers.map(w => w.mesh)]) if (o && o.visible) { o.visible = false; hide.push(o); } };
      ao.restoreVisibility = () => { for (const o of hide) o.visible = true; rv(); }; }
    c.addPass(ao);
    // sun shafts: march from each pixel toward the sun across the depth buffer, gathering open sky
    this.shafts = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, tDepth: { value: ao.depthTexture }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uVis: { value: 0 }, uCol: { value: new THREE.Color() }, uStrength: { value: q === 'cinematic' ? 0.55 : 0.4 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform vec2 uSun; uniform float uVis, uStrength; uniform vec3 uCol; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
          if (uVis > .001) {
            vec2 d = (uSun - vUv) / 40.; vec2 p = vUv + d * fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453); float acc = 0., w = 1.;
            for (int i = 0; i < 40; i++) { p += d; if (p.x < 0. || p.y < 0. || p.x > 1. || p.y > 1.) break; float sky = step(.99995, texture2D(tDepth, p).r); acc += sky * w * smoothstep(.75, 0., distance(p, uSun)); w *= .965; }
            c += uCol * acc / 40. * uStrength * uVis * smoothstep(1.1, .2, distance(vUv, uSun));
          }
          gl_FragColor = vec4(c, 1.); }`
    });
    c.addPass(this.shafts);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.3, 0.6, 1.0); c.addPass(this.bloom);
    c.addPass(new OutputPass());
    c.addPass(new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: U.uTime, uSpeed: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uSpeed; varying vec2 vUv;
        void main(){ vec2 d = vUv - .5;
          // speed: a little radial smear at the edges when you're flying or driving fast
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          if (uSpeed > .01) { vec3 acc = c; for (int i = 1; i < 6; i++) acc += texture2D(tDiffuse, vUv - d * float(i) * .012 * uSpeed * dot(d, d) * 4.).rgb; c = mix(c, acc / 6., smoothstep(.05, .3, length(d))); }
          // a lens: faint colour fringing toward the corners
          float ca = dot(d, d) * .011; c.r = mix(c.r, texture2D(tDiffuse, vUv - d * ca).r, .6); c.b = mix(c.b, texture2D(tDiffuse, vUv + d * ca).b, .6);
          // the grade: a gentle S-curve and some saturation back after the filmic curve, warm highlights, cool shadows
          float l = dot(c, vec3(.2126,.7152,.0722));
          c = mix(vec3(l), c, 1.14);
          c = clamp((c - .5) * 1.07 + .5, 0., 1.);
          c = mix(c, c * vec3(1.04, 1.0, .94), smoothstep(.45, .9, l));
          c = mix(c, c * vec3(.94, .98, 1.07), smoothstep(.45, .05, l));
          c *= 1. - dot(d, d) * .55;
          c += (fract(sin(dot(vUv * 1000. + uTime, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .016;   // film grain
          gl_FragColor = vec4(c, 1.); }`
    }));
    this.grade = c.passes[c.passes.length - 1];
    const cin = q === 'cinematic';
    this.shadows = new SunShadows(R, cin ? 4096 : q === 'high' ? 2048 : 1536, cin ? 75 : q === 'high' ? 65 : 55, 0);
    this.shadowsFar = new SunShadows(R, cin ? 4096 : q === 'high' ? 2048 : 1024, cin ? 900 : q === 'high' ? 700 : 480, 1);
  }
  /* image-based light: the live sky, pre-filtered, lights and reflects in every physically based surface */
  _envSetup() {
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envScene = new THREE.Scene(); this.envSky = makeSky(); this.envSky.scale.setScalar(0.001); this.envScene.add(this.envSky);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5a5a48 })); ground.position.y = -4; this.envScene.add(ground); this.envGround = ground;
    this.envT = -1;
  }
  _envUpdate() {
    if (!this.pmrem || (this.envT >= 0 && this.t - this.envT < 2.5)) return; this.envT = this.t;
    this.envGround.material.color.copy(U.uGroundBounce.value).multiplyScalar(1.3);
    const old = this.envRT; this.envRT = this.pmrem.fromScene(this.envScene, 0.02, 0.1, 100);
    this.scene.environment = this.envRT.texture; if (old) old.dispose();
  }
  onResize() {
    const w = innerWidth, h = innerHeight; if (!this.renderer) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.composer) { this.composer.setPixelRatio(this.pr); this.composer.setSize(w, h); }
    this.handsCam.aspect = w / h; this.handsCam.updateProjectionMatrix();
  }
  _streetIndex() {
    const C = 250, idx = this.streetIdx = new Map();
    this.city.streets.forEach((s, i) => { const seen = new Set(); for (const [x, z] of s.pts) { const k = Math.floor(x / C) * 10000 + Math.floor(z / C); if (seen.has(k)) continue; seen.add(k); let a = idx.get(k); if (!a) idx.set(k, a = []); a.push(i); } });
  }
  nearStreets(x, z, r) {
    const C = 250, out = new Set(), n = Math.ceil(r / C), ci = Math.floor(x / C), cj = Math.floor(z / C);
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) { const a = this.streetIdx.get((ci + i) * 10000 + cj + j); if (a) for (const s of a) out.add(s); }
    return [...out].map(i => this.city.streets[i]);
  }
  /* the map: land cover, streets and every house, drawn once */
  get mapBox() { const t = this.city.demTown; return { x0: t.x0, x1: t.x1, z0: t.z0, z1: t.z1 }; }
  mapImage() {
    if (this._mapImg) return this._mapImg;
    const city = this.city, b = this.mapBox, N = 1600, sx = N / (b.x1 - b.x0), sz = N / (b.z1 - b.z0);
    const cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
    const cm = city.coverM, pal = [[112, 128, 76], [196, 186, 168], [52, 84, 44], [104, 116, 66], [150, 150, 86], [156, 110, 80], [110, 138, 70], [82, 128, 64], [96, 150, 80], [60, 96, 120], [190, 180, 160], [170, 164, 140]];
    const img = c.createImageData(cm.n, cm.n);
    for (let k = 0; k < cm.n * cm.n; k++) { const v = city.cover[k], col = pal[v] || pal[0]; img.data.set([col[0], col[1], col[2], 255], k * 4); }
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = cm.n; tmp.getContext('2d').putImageData(img, 0, 0);
    c.imageSmoothingEnabled = true; c.drawImage(tmp, (cm.x0 - b.x0) * sx, (cm.z0 - b.z0) * sz, (cm.x1 - cm.x0) * sx, (cm.z1 - cm.z0) * sz);
    // hillshade from the terrain
    const T = city.demTown, n = T.n; const hs = c.createImageData(n, n);
    for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) { const d = T.d, k = j * n + i, gx = d[k + 1] - d[k - 1], gz = d[k + n] - d[k - n], v = Math.max(0, Math.min(1, 0.5 + (gx - gz) * 0.04)); hs.data.set([v < .5 ? 0 : 255, v < .5 ? 0 : 255, v < .5 ? 0 : 255, Math.abs(v - .5) * 150], k * 4); }
    const tmp2 = document.createElement('canvas'); tmp2.width = tmp2.height = n; tmp2.getContext('2d').putImageData(hs, 0, 0); c.drawImage(tmp2, 0, 0, N, N);
    for (const s of this.city.streets) {
      c.strokeStyle = s.kind === 0 ? (s.width >= 12.5 ? '#f4e2a8' : '#efe8da') : '#d8c8a8'; c.lineWidth = Math.max(0.8, s.width * sx * 0.9); c.lineCap = 'round';
      c.beginPath(); s.pts.forEach(([x, z], i) => { const X = (x - b.x0) * sx, Y = (z - b.z0) * sz; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke();
    }
    c.fillStyle = 'rgba(176,104,84,0.9)';
    for (const q of city.buildings) { c.save(); c.translate((q.x - b.x0) * sx, (q.z - b.z0) * sz); c.rotate(q.ang); c.fillRect(-q.w / 2 * sx, -q.d / 2 * sz, q.w * sx, q.d * sz); c.restore(); }
    c.strokeStyle = '#4a8ab8'; c.lineWidth = 2; for (const s of city.streams) { c.beginPath(); s.pts.forEach(([x, z], i) => { const X = (x - b.x0) * sx, Y = (z - b.z0) * sz; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); }
    return (this._mapImg = cv);
  }
  /* markers: Aurelio's lost pages, what to examine next, and the beacon */
  _markers() {
    const tex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
    this.markerGroup = new THREE.Group(); this.surface.add(this.markerGroup);
    const sprite = (color, size) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(size); this.markerGroup.add(sp); return sp; };
    this.pageMarks = PAGES.map(pg => { const [x, y, z] = this.findSpot(pg.x, pg.z); pg.x = x; pg.z = z; pg.y = y; const sp = sprite(0x7f9cff, 1.1); sp.position.set(x, y + 1.1, z); return { pg, sp }; });
    this.inspectMark = sprite(0xffcf5a, 1.6);
    const bm = new THREE.MeshBasicMaterial({ color: 0xffcf5a, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
    this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 500, 12, 1, true).translate(0, 250, 0), bm); this.scene.add(this.beacon);
  }
  raceGroup() { return this.race ? this.race.group : null; }

  /* ---------------- people ---------------- */
  findSpot(x, z, y) { const t = new Player(this.city); t.teleport(x, z, y); return [t.x, t.y, t.z]; }
  placeNPCs() {
    for (const n of this.npcs) this.scene.remove(n.mesh);
    this.npcs = [];
    const s = this.state;
    for (const [id, def] of Object.entries(CHARACTERS)) {
      if (id === 'guero') continue;
      const home = id === 'aurelio' && s.ending ? PLACES.jardin : PLACES[def.place];
      const off = id === 'aurelio' && s.ending ? [-10, 14] : def.offset || [0, 0];
      const [x, y, z] = this.findSpot(home.x + off[0], home.z + off[1]);
      const mesh = makePerson(def.look); mesh.position.set(x, y, z); this.scene.add(mesh);
      this.npcs.push({ id, def, mesh, x, y, z, hx: x, hz: z, facing: 0, visible: true, hostile: false });
    }
    REGULARS.forEach((q, i) => {
      const def = makeCitizen(q.seed, q.district, { id: 'reg' + i, job: q.job, tag: q.tag, age: q.age }); EXTRAS[def.id] = def;
      const pl = PLACES[q.at], [x, y, z] = this.findSpot(pl.x + q.dx, pl.z + q.dz);
      const mesh = makePerson(def.look); mesh.position.set(x, y, z); this.scene.add(mesh);
      this.npcs.push({ id: def.id, def, mesh, x, y, z, hx: x, hz: z, facing: q.seed % 7, visible: true, hostile: false, regular: true });
    });
    this.refreshNPCs();
    const spots = this.npcs.map(n => [n.x, n.z]).concat(PAGES.map(p => [p.x, p.z]), Object.values(PLACES).map(p => [p.x, p.z]), Object.values(this.spots).map(p => [p[0], p[2]]));
    this.detail.userData.reserve(spots);
  }
  npcShown(id) { const s = this.state; if (id === 'aurelio') return !!s.flags.aurelioFound; return true; }
  refreshNPCs() { for (const n of this.npcs) { n.visible = this.npcShown(n.id); n.mesh.visible = n.visible; } }
  npcHasQuest(id) { return this.story.chipsFor(id).some(c => !c.locked); }

  /* ---------------- the story's hooks ---------------- */
  applyFx(fx) {
    const s = this.state;
    for (const c of fx.clues || []) if (!s.clues.includes(c)) { s.clues.push(c); this.ui.toast('Clue: ' + CLUES[c].name, 'quest'); this.audio.chime(); }
    if (fx.flag) s.flags[fx.flag] = true;
    if (fx.jetpack) s.jetpack = true;
    if (fx.ach) this.unlock(fx.ach);
    if (fx.reveal) { s.flags.aurelioFound = true; this.refreshNPCs(); }
    if (fx.car === 'rosa') { const t = this.spots.taller, a = 0; const c = this.vehicles.add({ x: t[0] + 5, z: t[2] - 4, y: this.city.heightAt(t[0] + 5, t[2] - 4) + 0.1, ang: a, kind: 0, color: 0x2e6a3a }); c.rosa = true; }
    if (fx.card) this.pending = () => this.ui.card(fx.card, fx.chase ? () => this.startChase() : null);
    else if (fx.chase) this.pending = () => this.startChase();
  }
  stepStarted(st) {
    if (!st) return;
    if (st.escape && !this.chaser) this.startChase();
    if (st.timed) { const easy = this.settings.chase === 'easy'; this.timer = { left: st.timed.secs * (easy ? 1.5 : 1), to: st.timed.to }; this.ui.toast('Fly! Hold Shift to boost. The Presidencia is on the compass.', 'warn'); }
  }
  inspect(ins, done) {
    const run = () => {
      if (!ins.puzzle) { done(); return; }
      const pz = ins.puzzle, npc = { id: 'puzzle', def: { name: ins.label.replace(/^(Examine|Read|Open|Tap|Push open|Search|Step into) (the )?/, ''), title: 'Look closely', look: { top: 0x7a5a32 } }, mesh: null };
      this.talk = { npc, history: [], puzzle: true }; this.pauseInput(true); document.exitPointerLock && document.exitPointerLock();
      this.ui.openDialogue(npc, true); this.ui.logLine('npc', pz.q);
      const chips = pz.options.map((o, i) => ({ label: o, quest: true, onClick: () => {
        this.ui.logLine('me', o);
        if (i === pz.answer) { this.ui.logLine('npc', pz.right); this.ui.chips([{ label: 'Continue', quest: true, onClick: () => { this.endTalk(); done(); } }]); this.audio.chime(); }
        else this.ui.logLine('sys', pz.wrong);
      } }));
      this.ui.chips(chips);
    };
    if (ins.cards && ins.cards.length) this.ui.card(ins.cards, run); else run();
  }
  unlock(id) {
    const s = this.state; if (!s || s.ach[id] || !ACHIEVEMENTS[id]) return;
    s.ach[id] = Date.now(); this.ui.achievement(ACHIEVEMENTS[id]); this.audio.chime(); this.save();
  }
  endingTitle() { const e = ENDINGS[this.state.ending]; return e ? e.title : ''; }
  finishEnding(id) {
    const s = this.state, e = ENDINGS[id]; s.ending = id; this.unlock(e.ach);
    const cards = e.cards.slice();
    if (id === 'pueblo') cards[1] = s.flags.inesAlly ? 'Maestra Inés steps out of the crowd, takes the paper in both hands, and says, loud enough for the back of the plaza: "This seal is genuine. I have spent my life with 1938. This is the town\'s." The company\'s lawyer stops smiling. The cabildo votes eleven to none: the springs of the cerro belong to Jiquilpan.' : 'Barragán calls it a forgery. Nobody in the plaza can swear otherwise; the maestra is not there. The cabildo postpones the vote, and a judge in Morelia will take a year to agree with you. But the water stays in the ground, and the whole town knows why.';
    this.ui.card(cards, () => { this.placeNPCs(); this.save(); this.ui.toast('The mystery is solved. Races, lost pages and achievements are waiting in Goals.', 'good'); });
  }
  startChase() {
    const p = this.player, st = this.story.step(); if (!st || !st.escape || this.chaser) return;
    const a = Math.random() * Math.PI * 2, x = p.x + Math.cos(a) * 45, z = p.z + Math.sin(a) * 45;
    this.chaser = { x, z, y: this.city.heightAt(x, z) + 0.1, ang: a + Math.PI, v: 0, grab: 0, caught: 0 };
    this.ui.toast('Güero is after you! Get to Rosa\'s garage: drive, run, or fly.', 'warn'); this.audio.hornCar();
  }
  _chase(dt) {
    const c = this.chaser, p = this.player; if (!c) return;
    const easy = this.settings.chase === 'easy', max = easy ? 15 : 21;
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), want = Math.atan2(dz, dx);
    let da = want - c.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); c.ang += Math.max(-2.2 * dt, Math.min(2.2 * dt, da));
    c.v += ((d > 8 ? max : 4) - c.v) * Math.min(1, dt * 1.5);
    let nx = c.x + Math.cos(c.ang) * c.v * dt, nz = c.z + Math.sin(c.ang) * c.v * dt;
    for (const t of [-1.6, 0, 1.6]) { const px = nx + Math.cos(c.ang) * t, pz = nz + Math.sin(c.ang) * t, [rx, rz] = this.city.colliders.resolve(px, pz, 1.1, c.y + 0.3, c.y + 1.6); nx += rx - px; nz += rz - pz; }
    c.x = nx; c.z = nz; c.y = this.city.heightAt(c.x, c.z) + 0.1;
    const ground = p.y - this.city.heightAt(p.x, p.z) < 3;
    if (d < 4.5 && ground) { c.grab += dt; if (c.grab > (easy ? 2.2 : 1.3)) { c.grab = 0; c.caught++; c.x -= Math.cos(c.ang) * 50; c.z -= Math.sin(c.ang) * 50; c.v = 0; this.ui.toast(c.caught > 1 ? 'He grabs your collar and you tear free again! Keep going!' : 'His hand closes on your sleeve. You twist free! Run!', 'warn'); this.audio.crash(0.5); } }
    else c.grab = Math.max(0, c.grab - dt);
    this.chaseKit.begin(); this.chaseKit.add(c.x, c.y, c.z, c.ang, 0, 1, 0x101012); this.chaseKit.commit(); this.chaseKit.night(this.uNight());
    const t = PLACES.taller; if (Math.hypot(p.x - t.x, p.z - t.z) < t.r + 4) { this.chaser = null; this.chaseKit.begin(); this.chaseKit.commit(); this.story.event('escaped'); if (this.pending) { const f = this.pending; this.pending = null; f(); } }
  }
  _timer(dt) {
    const tm = this.timer, p = this.player; if (!tm || this.talk) return;
    tm.left -= dt;
    const to = PLACES[tm.to], d = Math.hypot(p.x - to.x, p.z - to.z);
    this.ui.raceInfo(`⏱ ${fmtT(Math.max(0, tm.left))} · ${d > 950 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'} to the Presidencia`);
    if (d < to.r + 10) { this.timer = null; this.ui.raceInfo(null); this.story.event('arrived'); if (this.pending) { const f = this.pending; this.pending = null; f(); } return; }
    if (tm.left <= 0) { tm.left = (this.story.step().timed.secs) * (this.settings.chase === 'easy' ? 1.5 : 1); this.ui.toast('The pickup\'s headlights are right behind you! Faster: hold Shift and fly straight.', 'warn'); }
  }
  /* ---------------- races ---------------- */
  startRace(id) {
    const r = this.races.find(q => q.id === id); if (!r) return;
    if (this.chaser || this.timer) { this.ui.toast('Not now: you\'re in the middle of something.', 'warn'); return; }
    if (this.race) this.race.dispose();
    const p = this.player, s0 = r.pts[0], s1 = r.pts[1];
    if (this.vehicles.driving) this.vehicles.exit(p);
    const a = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]), bx = s0[0] - Math.cos(a) * 20, bz = s0[1] - Math.sin(a) * 20;
    if (r.mode === 'car') { const [x, y, z] = this.findSpot(bx, bz); const c = this.vehicles.add({ x, z, y: this.city.heightAt(x, z) + 0.1, ang: a, kind: 0, color: 0xd8a020 }); this.vehicles.enter(c, p); }
    else { const [x, y, z] = this.findSpot(bx, bz); p.teleport(x, z, y); p.yaw = -a - Math.PI / 2; if (this.state.jetpack) { p.jet = true; p.y += 15; } }
    this.race = new RaceRun(this.scene, r); this.raceCount = 3;
    this.ui.toast(`${r.name}: gold ${fmtT(r.times[0])}. Go through the gold rings.`, 'quest');
  }
  _race(dt) {
    const R = this.race; if (!R) return;
    if (this.raceCount > 0) { this.raceCount -= dt; this.ui.raceInfo(this.raceCount > 0 ? `${Math.ceil(this.raceCount)}…` : '¡Vámonos!'); if (this.raceCount <= 0) this.audio.bell(); return; }
    const p = this.player, c = this.vehicles.driving, x = c ? c.x : p.x, y = c ? c.y + 1 : p.y + 1, z = c ? c.z : p.z;
    const ev = R.update(dt, x, y, z);
    if (ev === 'gate') this.audio.ui();
    this.ui.raceInfo(`${R.race.name} · ${fmtT(R.t)} · ring ${Math.min(R.i + 1, R.race.pts.length)} of ${R.race.pts.length}`);
    if (ev === 'finish') {
      const r = R.race, best = this.state.races[r.id], t = R.t, medal = t <= r.times[0] ? 'Gold 🥇' : t <= r.times[1] ? 'Silver 🥈' : t <= r.times[2] ? 'Bronze 🥉' : 'No medal';
      if (best == null || t < best) this.state.races[r.id] = t;
      this.ui.toast(`${r.name}: ${fmtT(t)} · ${medal}${best != null && t < best ? ' · new best!' : ''}`, 'quest'); this.audio.chime();
      if (this.races.every(q => this.state.races[q.id] != null && this.state.races[q.id] <= q.times[0])) this.unlock('carreras');
      setTimeout(() => this.ui.raceInfo(null), 3000); R.dispose(); this.race = null; this.save();
    }
  }
  /* ---------------- conversation ---------------- */
  startTalk(npc) {
    this.talk = { npc, history: [] }; if (npc.mesh) npc.mesh.userData.talking = true; this.pauseInput(true);
    document.exitPointerLock && document.exitPointerLock();
    const s = this.state; if (!npc.def.ambient && !s.met.includes(npc.id)) s.met.push(npc.id);
    this.ui.openDialogue(npc);
    const g = this.voices.greet(npc.id); this.ui.logLine('npc', g); this.talk.history.push({ role: 'npc', text: g });
    this.renderChips();
  }
  talkToWalker(w) {
    const q = w.mesh.position; EXTRAS[w.def.id] = w.def;
    const npc = { id: w.def.id, def: w.def, mesh: w.mesh, x: q.x, y: q.y, z: q.z, facing: w.mesh.rotation.y, visible: true, hostile: false, walker: w };
    w.talk = npc; this.startTalk(npc);
  }
  renderChips() {
    const t = this.talk; if (!t || t.puzzle) return;
    const chips = this.story.chipsFor(t.npc.id).map(c => ({ ...c, onClick: () => this.pickChip(c) }));
    const c = t.npc.def, extras = [];
    const ask = (label, q) => extras.push({ label, onClick: () => this.say(q, label) });
    if (t.npc.id === 'rosa' && this.state.ch >= 2 && !this.chaser && !this.timer) for (const r of this.races) extras.push({ label: `Race me: ${r.name} ${r.mode === 'jet' ? '🚀' : '🚗'}`, onClick: () => { this.endTalk(); this.startRace(r.id); } });
    if (!chips.length || chips.every(x => x.locked)) {
      ask('Tell me about yourself.', 'Tell me about yourself.');
      ask('What do you think about the water vote?', 'What do you think about the vote on the springs?');
      if (!c.ambient) ask('What do you know about my grandfather?', 'What do you know about my grandfather, Aurelio?');
      ask('Tell me about this part of town.', 'Tell me about this part of Jiquilpan.');
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
    this.audio.ui(); this.renderChips(); this.save();
    if (this.pendingEnding) { this.ui.chips([{ label: 'Continue', quest: true, onClick: () => { const e = this.pendingEnding; this.pendingEnding = null; this.endTalk(); this.finishEnding(e); } }]); }
  }
  async say(text, shown) {
    const t = this.talk; if (!t || t.busy || t.puzzle) return;
    this.ui.logLine('me', shown || text);
    const el = this.ui.logLine('npc', '…'); t.busy = true; this.ui.busy(true);
    t.ctl = new AbortController();
    let out = '';
    try { out = await this.voices.reply(t.npc.id, t.history, text, this.talkContext(), s => this.ui.setLine(el, s), t.ctl.signal); }
    catch (e) { out = (e && e.code === 'cancelled') || t.ctl.signal.aborted ? (el.textContent === '…' ? '…' : el.textContent) : this.voices.offline(t.npc.id, text, this.talkContext()); }
    if (this.talk !== t) return;
    const { text: clean, go } = parseTags(out || '…');
    this.ui.setLine(el, clean);
    t.history.push({ role: 'player', text }, { role: 'npc', text: clean });
    if (go) { const p = PLACES[go]; this.state.customWP = { x: p.x, z: p.z, label: p.name }; this.ui.logLine('sys', `Marked on your map: ${p.name}`); }
    t.busy = false; this.ui.busy(false);
  }
  stopTalk() { if (this.talk && this.talk.ctl) this.talk.ctl.abort(); }
  talkContext() {
    const s = this.state, ch = this.story.chapter(), st = this.story.step();
    const done = CHAPTERS.slice(0, s.ch).map(c => c.title);
    return { name: s.name, dead: false, clues: s.clues.map(c => CLUES[c].name).join('; '),
      progress: `Chapters solved: ${done.join(', ') || 'none'}. ${ch ? 'Now: ' + ch.title + (st ? ' — ' + st.text : '') : ''} ${s.flags.aurelioFound ? 'Aurelio has been found alive in the Cueva del Añil.' : 'Aurelio is still missing.'}${s.ending ? ' The story has ended (' + this.endingTitle() + ').' : ''}`,
      extra: s.flags.inesAlly ? 'Inés has confessed and promised to testify.' : s.flags.tempted ? 'The player listened to Barragán\'s price.' : '' };
  }
  endTalk() {
    const t = this.talk; if (!t) return;
    if (t.ctl) t.ctl.abort();
    if (t.npc.mesh) t.npc.mesh.userData.talking = false; this.talk = null; this.ui.closeDialogue(); this.pauseInput(false);
    if (t.npc.def && t.npc.def.ambient && !this.state.met.includes(t.npc.id)) { this.state.met.push(t.npc.id); this.state.talked++; if (this.state.talked >= 10) this.unlock('platica'); }
    if (t.npc.walker) t.npc.walker.talk = null;
    if (this.pendingEnding) { const e = this.pendingEnding; this.pendingEnding = null; this.finishEnding(e); return; }
    if (this.pending) { const p = this.pending; this.pending = null; p(); }
  }
  pauseInput(on) { this.paused = on; this.input.enabled = !on; if (on) this.input.releaseAll(); }

  /* ---------------- world queries ---------------- */
  uNight() { return U.uNight.value; }
  viewYaw() { const c = this.vehicles.driving; return c ? -c.ang - Math.PI / 2 + this.vehicles.camYaw : this.player.yaw; }
  placeName() {
    const p = this.player; let best = null, bd = Infinity;
    for (const id of LANDMARK_IDS.concat(['taller', 'petra', 'cueva', 'sendero'])) { const q = PLACES[id], d = Math.hypot(q.x - p.x, q.z - p.z); if (d < Math.max(40, q.r * 1.6) && d < bd) { bd = d; best = q.name.split(' (')[0]; } }
    return best || barrio(p.x, p.z);
  }
  targetPos() {
    const ref = this.story.targetRef(); if (!ref) return null;
    const npcAt = id => { const n = this.npcs.find(q => q.id === id); return n && n.visible ? { x: n.x, z: n.z } : { x: PLACES[CHARACTERS[id].place].x, z: PLACES[CHARACTERS[id].place].z }; };
    if (ref.npc) return npcAt(ref.npc);
    if (ref.place) return { x: PLACES[ref.place].x, z: PLACES[ref.place].z };
    if (ref.spot) { const s = this.spots[ref.spot]; return s ? { x: s[0], z: s[2] } : PLACES[ref.spot] ? { x: PLACES[ref.spot].x, z: PLACES[ref.spot].z } : null; }
    if (ref.npcs) { const p = this.player; let b = null, bd = Infinity; for (const id of ref.npcs) { const q = npcAt(id), d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; b = q; } } return b; }
    return null;
  }
  objective() {
    const s = this.state, st = this.story.step(), ch = this.story.chapter();
    if (!st) return s.ending ? { title: 'Free roam', text: 'Races, lost pages and achievements are in Goals (the menu).', dist: null } : null;
    const t = this.targetPos(), p = this.player;
    return { title: ch.title, text: st.text, target: t, dist: t ? Math.hypot(t.x - p.x, t.z - p.z) : null };
  }
  waypoint() { const s = this.state; if (this.race) { const n = this.race.next(); return n ? { x: n[0], z: n[1] } : null; } if (s.customWP) return s.customWP; const o = this.objective(); return o && o.target; }
  canTravel() { return !this.chaser && !this.timer && !this.race; }
  travelTo(id) { const p = PLACES[id]; if (this.vehicles.driving) this.vehicles.exit(this.player); this.player.jet = false; const [x, y, z] = this.findSpot(p.x + 4, p.z + 4); this.player.teleport(x, z, y); this.ui.toast('You arrive at ' + p.name + '.', 'good'); this.save(); }
  rescue() { if (this.vehicles.driving) this.vehicles.exit(this.player); this.player.jet = false; this.player.rescue(); }

  /* ---------------- interaction ---------------- */
  interactables() {
    const p = this.player, s = this.state, out = [], near = (x, z, r) => Math.hypot(x - p.x, z - p.z) < r;
    if (this.vehicles.driving) return { label: 'Get out of the car', icon: '🚪', run: () => { this.vehicles.exit(p); this.save(); } };
    for (const n of this.npcs) if (n.visible && near(n.x, n.z, 3.2) && Math.abs(n.y - p.y) < 3) out.push({ x: n.x, z: n.z, label: `Talk to ${n.def.ambient && !s.met.includes(n.id) ? n.def.tag : n.def.name}`, icon: '💬', minor: !!n.def.ambient, run: () => this.startTalk(n) });
    for (const w of this.walkers) { const q = w.mesh.position; if (w.def && near(q.x, q.z, 2.6) && Math.abs(q.y - p.y) < 3) out.push({ x: q.x, z: q.z, label: `Talk to ${s.met.includes(w.def.id) ? w.def.name : w.def.tag}`, icon: '💬', minor: true, run: () => this.talkToWalker(w) }); }
    const ins = this.story.inspectable();
    if (ins) { const sp = this.spots[ins.spot] || (PLACES[ins.spot] && [PLACES[ins.spot].x, 0, PLACES[ins.spot].z]); if (sp && near(sp[0], sp[2], ins.spot === 'cueva' ? 8 : 4.5)) out.push({ x: sp[0], z: sp[2], label: ins.label, icon: '🔍', run: ins.run }); }
    for (const m of this.pageMarks) if (!s.pages.includes(m.pg.id) && near(m.pg.x, m.pg.z, 2.8)) out.push({ x: m.pg.x, z: m.pg.z, label: 'Pick up a page of Aurelio\'s notebook', icon: '📄', run: () => this.takePage(m.pg) });
    if (!p.jet) {
      const own = this.vehicles.nearest(p.x, p.z, 3.4); if (own) out.push({ x: own.x, z: own.z, label: own.rosa ? 'Drive Rosa\'s green sedan' : 'Get in the car', icon: '🚗', minor: true, run: () => this.vehicles.enter(own, p) });
      const parked = this.detail.userData.nearestCar(p.x, p.z, 3.4);
      if (parked) out.push({ x: parked.x, z: parked.z, label: 'Get in the parked car', icon: '🚗', minor: true, run: () => { this.detail.userData.take(parked.key); const c = this.vehicles.add({ x: parked.x, y: parked.y, z: parked.z, ang: parked.ang, kind: parked.kind, color: parked.color, pitch: parked.pitch }); this.vehicles.enter(c, p); } });
      for (const t of this.traffic.cars) if (near(t.x, t.z, 3.6) && t.v < 3) { out.push({ x: t.x, z: t.z, label: 'Take this car ("¡Oiga!")', icon: '🚗', minor: true, run: () => { this.traffic.cars.splice(this.traffic.cars.indexOf(t), 1); const c = this.vehicles.add({ x: t.x, y: t.y, z: t.z, ang: t.ang, kind: t.kind, color: t.color }); this.vehicles.enter(c, p); this.ui.subtitle('The driver', '¡Oiga! ¡Mi carro! ...Bueno, bring it back with gas.', 4); } }); break; }
    }
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    out.forEach(o => { const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) || 1; o.score = d - (dx * fx + dz * fz) / d * 1.5 + (o.minor ? 2.5 : 0); });
    out.sort((a, b) => a.score - b.score);
    return out[0] || null;
  }
  takePage(pg) {
    const s = this.state; s.pages.push(pg.id);
    this.ui.card([`<em>${pg.title}</em>\nA page from Aurelio's notebook, blown into a corner.`, `<i>${pg.text}</i>`]);
    if (s.pages.length >= PAGES.length) this.unlock('cuaderno'); else this.ui.toast(`Aurelio's pages: ${s.pages.length} of ${PAGES.length}`, 'good');
    this.save();
  }

  /* ---------------- the loop ---------------- */
  _globalKeys(e) {
    if (!this.started) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.code === 'KeyU' && !this.paused) { this.rescue(); this.ui.toast('You find your footing on the street.', 'good'); }
  }
  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    const dt = Math.min(0.05, (now - this.lastT) / 1000); this.lastT = now;
    if (!this.started || !this.renderer) return;
    this.t += dt;
    try { this.update(dt); } catch (e) { console.error(e); }
    this.render(dt);
    this.input.endFrame(); this._perf(dt);
  }
  _perf(dt) {
    this.pfT = (this.pfT || 0) + dt; this.pfN = (this.pfN || 0) + 1;
    if (this.pfT > 2) { const fps = this.pfN / this.pfT; this.pfT = 0; this.pfN = 0; const old = this.pr;
      if (fps < 40) this.pr = Math.max(0.6, this.pr - 0.15); else if (fps > 56) this.pr = Math.min(this.maxPR, this.pr + 0.1);
      if (Math.abs(old - this.pr) > 0.01) { this.renderer.setPixelRatio(this.pr); this.onResize(); } }
  }
  update(dt) {
    const s = this.state, p = this.player, inp = this.input, V = this.vehicles;
    inp.pollGamepad(dt);
    if (inp.pressed('menu')) { if (this.talk) this.endTalk(); else if (this.ui.menuOpen) this.ui.closeMenu(); else if (!this.ui.cardOpen) this.ui.openMenu(); }
    if (inp.pressed('map') && !this.talk && !this.ui.cardOpen) { if (this.ui.menuOpen && this.ui.tab === 'map') this.ui.closeMenu(); else this.ui.openMenu('map'); }
    if (this.paused && !this.talk) { this.ui.update(0); return; }
    if (inp.pressed('case')) { this.ui.openMenu('case'); return; }
    // time
    const ts = +this.settings.timeScale, h0 = s.hour;
    if (!this.talk) { s.hour += dt * ts / 90; if (s.hour >= 24) { s.hour -= 24; s.day++; } }
    if (Math.floor(s.hour) !== Math.floor(h0) && s.hour >= 7 && s.hour < 22 && Math.hypot(p.x - PLACES.parroquia.x, p.z - PLACES.parroquia.z) < 1600) { const n = Math.floor(s.hour) % 12 || 12; this.audio.bells(Math.min(n, 6)); if (Math.floor(s.hour) === 12 && Math.hypot(p.x - PLACES.jardin.x, p.z - PLACES.jardin.z) < 60) this.unlock('campanas'); }
    if (s.hour > 2.9 && s.hour < 3.3) this.unlock('noctambulo');
    const h = s.hour, haze = h < 6 ? 0.3 : h < 10 ? 0.3 - (h - 6) * 0.05 : h < 17 ? 0.1 : h < 20 ? 0.1 + (h - 17) * 0.04 : 0.25;
    setTimeOfDay(h, haze); U.uTime.value = this.t;
    if (this.talk) {
      const n = this.talk.npc;
      if (n.mesh) { const want = Math.atan2(-(n.x - p.x), -(n.z - p.z)); let d = want - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d * Math.min(1, dt * 4); p.pitch *= 0.9; n.facing = Math.atan2(p.x - n.x, p.z - n.z); }
    } else {
      if (inp.pressed('jet')) {
        if (V.driving) this.ui.toast('Get out of the car first (E).');
        else if (!s.jetpack) this.ui.toast('You don\'t have a jetpack. Yet. (Tía Cuca is on the Jardín.)');
        else { const r = p.toggleJet(); if (r === 'on') { this.audio.jetStart(); this.unlock('vuelo'); this.ui.toast(this.touchUI() ? '⤒ climbs, ⤓ drops, ⚡ boosts. Fly where you look. 🚀 to land.' : 'Space climbs, Z drops, hold Shift to boost. Fly where you look. G to land.'); } else if (r === 'landing') this.ui.toast('Coming down to land…'); }
      }
      if (inp.pressed('horn') && V.driving) this.audio.hornCar();
      if (V.driving) {
        V.update(dt, inp, this.traffic, this.audio);
        const c = V.driving; p.x = c.x; p.z = c.z; p.y = c.y; p.speed = Math.abs(c.speed); p.onGround = true;
        this.unlock('volante'); s.odo += Math.abs(c.speed) * dt;
        if (s.odo > 10000) this.unlock('kilometros'); if (V.maxAir > 1.5) this.unlock('salto');
      } else {
        V.update(dt, inp, null, this.audio);
        const wasGround = p.onGround;
        p.update(dt, inp, {});
        if (p.jet) { s.flown += p.speed * dt; if (p.speed > 111) this.unlock('supersonico'); if (p.y - this.city.heightAt(p.x, p.z) > 1000) this.unlock('alto'); }
        if (!wasGround && p.onGround && p.y - this.city.heightAt(p.x, p.z) > 3.5) this.unlock('azotea');
      }
      const it = this.interactables(); this.ui.prompt(it);
      if (it && inp.pressed('interact')) it.run();
    }
    // the world reacts
    this._chase(dt); this._timer(dt); this._race(dt);
    this._npcs(dt); this._walkers(dt); this._places(); this._markersUpdate();
    // streaming
    const agl = p.y - Math.max(0, this.city.heightAt(p.x, p.z));
    this.detail.userData.update(p.x, p.z, agl, this.uNight()); this.traffic.update(dt, V.driving ? { x: p.x, z: p.z, y: p.y, jet: false, onGround: true, canStand: () => null } : p, this.uNight());
    this.trees.userData.update(p.x, p.z); this.buildings.userData.update(this.camera);
    if (this.grass) this.grass.userData.update(p.x, p.z, agl); this.landmarks.userData.update(this.t, this.uNight());
    // sound and speed readouts
    this.audio.update(dt, { t: this.t, sea: 0, height: Math.max(0, agl), fog: 0, night: this.uNight() > 0.5, under: false, noHorn: true });
    this.audio.jet(p.jet ? p.thrust : 0);
    const kmh = Math.round((V.driving ? Math.abs(V.driving.speed) : p.speed) * 3.6);
    this.ui.speedo(V.driving ? `${kmh} km/h` : p.jet ? `${p.jetLanding ? 'LANDING · ' : ''}ALT ${Math.round(agl)} m · ${kmh} km/h` : null);
    document.body.classList.toggle('jet', !!p.jet); document.body.classList.toggle('car', !!V.driving);
    if (p.speed > 0.5 && p.onGround && !p.jet && !V.driving) { this.stepT = (this.stepT || 0) + dt * p.speed; if (this.stepT > 1.4) { this.stepT = 0; this.audio.step('street'); } }
    this.saveT = (this.saveT || 0) + dt; if (this.saveT > 30) { this.saveT = 0; this.save(); }
    this.ui.update(dt);
  }
  _places() {
    const s = this.state, p = this.player; if (this.placeT && this.t - this.placeT < 0.5) return; this.placeT = this.t;
    for (const id of LANDMARK_IDS) { const q = PLACES[id]; if (!s.visited.includes(id) && Math.hypot(q.x - p.x, q.z - p.z) < q.r + 8) { s.visited.push(id); this.ui.toast('Postcard: ' + q.name, 'good'); if (LANDMARK_IDS.filter(k => s.visited.includes(k)).length >= 12) this.unlock('postales'); } }
    for (const [id, q] of Object.entries(PLACES)) if (Math.hypot(q.x - p.x, q.z - p.z) < q.r + 6) this.story.event('reach', id);
    if (Math.hypot(PLACES.cumbre.x - p.x, PLACES.cumbre.z - p.z) < 25 && (p.onGround || this.vehicles.driving)) this.unlock('cumbre');
    if (s.customWP && Math.hypot(s.customWP.x - p.x, s.customWP.z - p.z) < 14) { s.customWP = null; this.ui.toast('You have arrived.'); }
  }
  _npcs(dt) {
    const p = this.player;
    for (const n of this.npcs) {
      if (!n.visible) continue;
      const d = Math.hypot(n.x - p.x, n.z - p.z), vis = d < 260; n.mesh.visible = vis; if (!vis) continue;
      if (d < 10 && !this.talk) n.facing = Math.atan2(p.x - n.x, p.z - n.z);
      n.y = this.findFloor(n.x, n.z, n.y); n.mesh.position.set(n.x, n.y, n.z);
      let a = n.facing - n.mesh.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); n.mesh.rotation.y += a * Math.min(1, dt * 5);
      n.mesh.userData.animate(dt, 0, this.t);
    }
  }
  findFloor(x, z, y) { return this.player.floorAt.call({ city: this.city, interior: null }, x, z, y, false).f; }
  _walkers(dt) {
    const p = this.player, q = this.settings.quality, cap = q === 'low' ? 6 : q === 'medium' ? 12 : 16, want = Math.round(cap * (1 - this.uNight() * 0.5));
    this.walkT = (this.walkT || 0) - dt;
    if (this.walkers.length < want && this.walkT < 0 && p.y - this.city.heightAt(p.x, p.z) < 60) {
      this.walkT = 0.6;
      const sts = this.nearStreets(p.x, p.z, 150).filter(s => s.kind === 0 || s.kind === 4);
      if (sts.length) {
        const st = sts[Math.floor(Math.random() * sts.length)], i = Math.floor(Math.random() * (st.pts.length - 1));
        const [ax, az] = st.pts[i], d0 = Math.hypot(ax - p.x, az - p.z);
        if (d0 > 40 && d0 < 150) {
          const def = makeCitizen((Math.random() * 2 ** 31) | 0, barrio(ax, az)), mesh = makePerson(def.look); this.scene.add(mesh);
          this.walkers.push({ mesh, def, st, i, t: 0, dir: 1, side: Math.random() < 0.5 ? -1 : 1, speed: (1.0 + Math.random() * 0.5) * (def.age > 70 ? 0.7 : 1) });
        }
      }
    }
    for (const w of this.walkers) {
      const mp = w.mesh.position, dP = Math.hypot(mp.x - p.x, mp.z - p.z);
      if (w.talk || (dP < 2.4 && !p.jet && !this.vehicles.driving) || (w.paused && dP < 3.6 && !p.jet)) {
        w.paused = true; const wantA = w.talk ? w.talk.facing : Math.atan2(p.x - mp.x, p.z - mp.z);
        let a = wantA - w.mesh.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); w.mesh.rotation.y += a * Math.min(1, dt * 5); w.mesh.userData.animate(dt, 0, this.t); continue;
      }
      w.paused = false;
      // a car bearing down on them: step aside
      const pts = w.st.pts, a = pts[w.i], b = pts[w.i + w.dir] || a, L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      w.t += dt * w.speed / L;
      if (w.t >= 1) { w.t = 0; w.i += w.dir; if (w.i + w.dir < 0 || w.i + w.dir >= pts.length) { w.dir *= -1; w.side *= -1; } continue; }
      const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, off = w.st.kind === 0 ? w.st.width / 2 - 0.8 : 0.6;
      const x = a[0] + (b[0] - a[0]) * w.t - uz * off * w.side, z = a[1] + (b[1] - a[1]) * w.t + ux * off * w.side;
      mp.set(x, this.city.heightAt(x, z) + (w.st.kind === 0 ? 0.22 : 0.05), z); w.mesh.rotation.y = Math.atan2(ux, uz);
      w.mesh.userData.animate(dt, w.speed, this.t);
      if (dP > 200) w.gone = true;
    }
    for (const w of this.walkers) if (w.gone && !w.talk) this.scene.remove(w.mesh);
    this.walkers = this.walkers.filter(w => !w.gone || w.talk);
  }
  _markersUpdate() {
    const p = this.player, s = this.state;
    for (const m of this.pageMarks) { const d = Math.hypot(m.pg.x - p.x, m.pg.z - p.z), v = !s.pages.includes(m.pg.id) && d < 300; m.sp.visible = v; if (v) { m.sp.position.y = m.pg.y + 1.1 + Math.sin(this.t * 2 + m.pg.id) * 0.15; m.sp.material.opacity = 0.6 + 0.4 * Math.sin(this.t * 3 + m.pg.id); } }
    const ins = this.story.inspectable(), sp = ins && (this.spots[ins.spot] || (PLACES[ins.spot] && [PLACES[ins.spot].x, this.city.heightAt(PLACES[ins.spot].x, PLACES[ins.spot].z), PLACES[ins.spot].z]));
    this.inspectMark.visible = !!sp; if (sp) { this.inspectMark.position.set(sp[0], sp[1] + 1.6 + Math.sin(this.t * 2.5) * 0.2, sp[2]); }
    const wp = this.waypoint();
    this.beacon.visible = !!wp && !this.talk && Math.hypot(wp.x - p.x, wp.z - p.z) > 30;
    if (wp) { this.beacon.position.set(wp.x, this.city.heightAt(wp.x, wp.z), wp.z); this.beacon.material.opacity = 0.12 + 0.06 * Math.sin(this.t * 2); }
  }
  render(dt) {
    const p = this.player, cam = this.camera, R = this.renderer, V = this.vehicles;
    if (V.driving) V.camera(cam, this.input, dt);
    else {
      cam.position.set(p.x, p.eye(this.settings.reduced), p.z); cam.rotation.set(p.pitch, p.yaw, 0);
      if (p.jet && !this.settings.reduced) { const w = Math.min(1, Math.hypot(p.vx, p.vz) / 150) * 0.004; cam.rotation.x += (Math.random() - 0.5) * w; cam.rotation.z = (Math.random() - 0.5) * w; }
    }
    const spd = V.driving ? Math.abs(V.driving.speed) : p.jet ? Math.hypot(p.vx, p.vz) : 0;
    const fov = 68 + (this.settings.reduced ? 0 : Math.min(22, spd / (V.driving ? 3 : 7)));
    const agl = cam.position.y - Math.max(0, this.city.heightAt(cam.position.x, cam.position.z));
    const near = Math.max(0.2, Math.min(8, (agl - 3) * 0.03));
    if (Math.abs(cam.fov - fov) > 0.05 || Math.abs(cam.near - near) > 0.02) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.near = near; cam.updateProjectionMatrix(); }
    if (this.grade) this.grade.uniforms.uSpeed.value = this.settings.reduced ? 0 : Math.min(1, Math.max(0, spd - 25) / 90);
    U.uCamPos.value.copy(cam.position); this.sky.position.copy(cam.position);
    this.sun.position.copy(cam.position).addScaledVector(U.uSunDir.value, 500); this.sun.target.position.copy(cam.position);
    this.sun.color.copy(U.uSunColor.value); this.sun.intensity = 2.4 * (1 - U.uNight.value * 0.8);
    this.hemi.color.copy(U.uAmbient.value).multiplyScalar(this.scene.environment ? 0.9 : 2.3); this.hemi.groundColor.copy(U.uGroundBounce.value).multiplyScalar(this.scene.environment ? 0.8 : 2.0);
    this._envUpdate();
    this.hsun.color.copy(this.sun.color); this.hsun.intensity = this.sun.intensity; this.hsun.position.set(U.uSunDir.value.x, U.uSunDir.value.y, U.uSunDir.value.z);
    this.hhemi.color.copy(this.hemi.color); this.hhemi.groundColor.copy(this.hemi.groundColor);
    R.setClearColor(U.uFogColor.value, 1);
    if (this.shadows) {
      const fx = -Math.sin(this.viewYaw()), fz = -Math.cos(this.viewYaw()), c = this.shadowCenter || (this.shadowCenter = new THREE.Vector3());
      c.set(p.x + fx * this.shadows.R * 0.45, p.y, p.z + fz * this.shadows.R * 0.45);
      const hide = [this.sky, this.streets, this.streams, this.markerGroup, this.beacon, this.terrain, this.grass, this.raceGroup()].filter(Boolean);
      this.shadows.update(this.scene, c, U.uSunDir.value, hide);
      // the far cascade covers the view out to the hills; it can be a frame behind
      this.farFrame = (this.farFrame || 0) + 1;
      if (this.farFrame % 2 === 0) { const c2 = this.shadowCenter2 || (this.shadowCenter2 = new THREE.Vector3()); c2.set(p.x + fx * this.shadowsFar.R * 0.5, p.y, p.z + fz * this.shadowsFar.R * 0.5); this.shadowsFar.update(this.scene, c2, U.uSunDir.value, hide.concat(this.walkers.map(w => w.mesh), this.npcs.map(n => n.mesh))); }
    } else { U.uShadowOn.value = 0; U.uShadowOn2.value = 0; }
    // eye adaptation: brighter at night, a touch darker when you look into the sun
    const sd = U.uSunDir.value, fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), glare = Math.max(0, fwd.dot(sd)) ** 4 * (1 - U.uNight.value);
    const expo = 1.05 * (1 + U.uNight.value * 0.35) * (1 - glare * 0.22); R.toneMappingExposure += (expo - R.toneMappingExposure) * Math.min(1, dt * 1.5);
    if (this.shafts) {
      const sp = cam.position.clone().addScaledVector(sd, 5000).project(cam), vis = sp.z < 1 && fwd.dot(sd) > 0 ? Math.max(0, 1 - Math.max(Math.abs(sp.x), Math.abs(sp.y)) / 1.6) : 0;
      this.shafts.uniforms.uSun.value.set(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5); this.shafts.uniforms.uVis.value = vis * Math.min(1, sd.y * 6) * (1 - U.uNight.value);
      this.shafts.uniforms.uCol.value.copy(U.uSunColor.value);
    }
    if (this.composer) { this.bloom.strength = 0.24 + U.uNight.value * 0.5; this.composer.render(dt); }
    else { R.setRenderTarget(null); R.clear(); R.render(this.scene, cam); }
    this.hands.userData.setWeapon(null);
    this.hands.visible = false;   // empty-handed first person: nothing to hold up
    this.hands.userData.update({ t: this.t, swing: 0, block: false, cast: 0, speed: p.speed, bike: false, light: 0, reduced: this.settings.reduced });
    R.clearDepth(); R.render(this.handsScene, this.handsCam);
  }
}

const game = new Game();
window.__anil = window.__undertow = game; game.__THREE = THREE;   // for testing
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.claude) navigator.serviceWorker.register('sw.js').catch(() => {});
