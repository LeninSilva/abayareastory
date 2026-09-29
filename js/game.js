/* Yelamu: Open Your Eyes — engine */
(function () {
  'use strict';
  const A = window.YELAMU_ART, WD = window.YELAMU_WORLD, CODEX = window.YELAMU_CODEX;
  const CAST = WD.CAST, SCREENS = WD.SCREENS;
  const T = 32, COLS = 11, ROWS = 13, W = COLS * T, H = ROWS * T;
  const SOLID = 'WwTRo^#HDFhLGOXPcYZk';
  const BEAM_BLOCK = 'TRo^#HDFhLGOXcYZ';
  const FLY_BLOCK = 'TRo^#HDFhLGOXcYZ';
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const SAVE_KEY = 'yelamu-save-v1';
  const $ = s => document.querySelector(s);

  /* ---------------- save ---------------- */
  function newSave() {
    return { v: 1, flags: {}, shards: [], items: {}, maxHp: 6, hp: 6, screen: WD.START.screen, px: WD.START.x, py: WD.START.y, visited: {}, switches: {}, sound: true };
  }
  let save = newSave();
  function store() {
    if (cur && mode !== 'title') { save.px = Math.max(0, Math.min(COLS - 1, Math.floor(player.x / T))); save.py = Math.max(0, Math.min(ROWS - 1, Math.floor((player.y + 4) / T))); }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage unavailable */ } }
  function loadStored() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) return s; } catch (e) { /* ignore */ } return null; }

  /* ---------------- game API for world scripts ---------------- */
  const g = {
    get save() { return save; },
    objective,
    heal() { save.hp = save.maxHp; hud(); },
    addHeart() { save.maxHp = Math.min(20, save.maxHp + 2); save.hp = save.maxHp; Sfx.play('heart'); hud(); },
    hasShard: id => save.shards.indexOf(id) >= 0,
    collectShard,
    refreshScreen() { refreshNpcs(); }
  };

  function objective() {
    const f = save.flags, n = save.shards.length;
    if (!f.woke) return 'Open your eyes.';
    if (!f.metMaren) return 'Attend your re-integration class at the Conservatory of Flowers, north of Parnassus.';
    if (!f.metMother) return 'Meet Maren at Sutro Heights, on the western cliffs.';
    if (!f.metFather) return 'Return to the Parnassus Garden Ward. Dr. Emil Sutro wants to see you.';
    if (!f.hasPrism) return 'Visit Keeper Siwe at the Lens Works in Hunters Point, far southeast.';
    if (n < 5) return `Recover your Memory Shards (${n} of 5): Lands End, the Presidio, Glen Canyon, Bernal Heights, and the Mount Davidson shellmound.`;
    if (!f.summitOpen) return 'Five echoes attuned. Speak with Warden Tamsin on Twin Peaks.';
    if (!f.bossDone) return 'Climb to the Resonance Mast and quiet the Static.';
    return 'The year is yours. Maren is waiting at the Golden Gate.';
  }

  /* ---------------- audio ---------------- */
  const Sfx = {
    ac: null, master: null, musicT: 0, beat: 0,
    init() {
      if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ac.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ac.destination); } catch (e) { this.ac = null; }
    },
    tone(f, d, type, vol, slide, when) {
      if (!this.ac || !save.sound) return;
      const t0 = this.ac.currentTime + (when || 0), o = this.ac.createOscillator(), gn = this.ac.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
      gn.gain.setValueAtTime(vol || 0.08, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(gn); gn.connect(this.master); o.start(t0); o.stop(t0 + d + 0.02);
    },
    noise(d, vol, hp) {
      if (!this.ac || !save.sound) return;
      const n = Math.floor(this.ac.sampleRate * d), buf = this.ac.createBuffer(1, n, this.ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = this.ac.createBufferSource(), gn = this.ac.createGain(), fl = this.ac.createBiquadFilter();
      fl.type = 'highpass'; fl.frequency.value = hp || 800; s.buffer = buf; gn.gain.value = vol || 0.08;
      s.connect(fl); fl.connect(gn); gn.connect(this.master); s.start();
    },
    play(name) {
      switch (name) {
        case 'blip': this.tone(660, 0.03, 'square', 0.025); break;
        case 'swing': this.noise(0.12, 0.07, 1800); break;
        case 'beam': this.tone(1200, 0.18, 'sawtooth', 0.04, 2400); break;
        case 'hit': this.tone(220, 0.1, 'square', 0.08, 90); break;
        case 'hurt': this.tone(180, 0.25, 'sawtooth', 0.09, 60); break;
        case 'kill': this.noise(0.25, 0.08, 500); this.tone(520, 0.2, 'triangle', 0.06, 1040); break;
        case 'pickup': this.tone(880, 0.08, 'triangle', 0.07); this.tone(1320, 0.12, 'triangle', 0.07, null, 0.07); break;
        case 'heart': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.07, null, i * 0.09)); break;
        case 'shard': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.35, 'sine', 0.08, null, i * 0.11)); break;
        case 'switch': this.tone(740, 0.4, 'sine', 0.08, 1480); break;
        case 'gate': this.tone(196, 0.5, 'triangle', 0.08, 392); break;
        case 'menu': this.tone(990, 0.05, 'square', 0.03); break;
        case 'boss': this.tone(110, 0.6, 'sawtooth', 0.08, 55); break;
      }
    },
    music(dt, mood) {
      if (!this.ac || !save.sound) return;
      this.musicT -= dt; if (this.musicT > 0) return;
      const tempo = mood === 'storm' ? 0.28 : 0.46; this.musicT += tempo; this.beat++;
      const scales = { sun: [392, 440, 523, 587, 659, 784], fog: [349, 392, 466, 523, 587, 698], dusk: [330, 392, 440, 494, 587, 659], gold: [440, 494, 554, 659, 740, 880], storm: [220, 233, 277, 311, 330, 370] };
      const sc = scales[mood] || scales.sun;
      if (this.beat % 8 === 0) this.tone(sc[0] / 2, tempo * 6, 'triangle', 0.035);
      if (Math.random() < 0.55) this.tone(sc[Math.floor(Math.random() * sc.length)], tempo * 1.6, mood === 'storm' ? 'sawtooth' : 'sine', 0.022);
    }
  };

  /* ---------------- canvas ---------------- */
  const canvas = $('#game'), ctx = canvas.getContext('2d');
  let scalePx = 1, layer = null, prevLayer = null;
  function resize() {
    const st = $('#stage'); const aw = st.clientWidth - 16, ah = st.clientHeight - 8;
    const k = Math.max(0.5, Math.min(aw / W, ah / H));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = Math.floor(W * k) + 'px'; canvas.style.height = Math.floor(H * k) + 'px';
    scalePx = k * dpr; canvas.width = Math.round(W * scalePx); canvas.height = Math.round(H * scalePx);
    if (cur) layer = buildLayer(cur);
    sizeCinema();
  }

  /* ---------------- screen ---------------- */
  let cur = null;
  function gridPos(key) { const m = /^(\d),(\d)$/.exec(key); return m ? [+m[1], +m[2]] : null; }
  function neighbor(key, dx, dy) { const p = gridPos(key); if (!p) return null; const k = (p[0] + dx) + ',' + (p[1] + dy); return SCREENS[k] ? k : null; }

  // px/py are tile coordinates, or pixel coordinates when `pixels` is true
  function loadScreen(key, px, py, dir, pixels) {
    const def = SCREENS[key];
    const map = def.map.map(r => r.split(''));
    const carve = (x, y) => { if (SOLID.indexOf(map[y][x]) >= 0) map[y][x] = 'p'; };
    if (neighbor(key, -1, 0)) for (let y = 5; y <= 7; y++) carve(0, y);
    if (neighbor(key, 1, 0)) for (let y = 5; y <= 7; y++) carve(COLS - 1, y);
    if (neighbor(key, 0, -1)) for (let x = 4; x <= 6; x++) carve(x, 0);
    if (neighbor(key, 0, 1)) for (let x = 4; x <= 6; x++) carve(x, ROWS - 1);
    cur = { key, def, map, npcs: [], enemies: [], items: [], shots: [], fx: [], anim: [], t: 0, clearSpawned: false };
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ('WwOYLcGZ'.indexOf(map[y][x]) >= 0) cur.anim.push([x, y, map[y][x]]);
    save.screen = key; save.visited[def.mapAs || key] = true;
    if (pixels) { player.x = px; player.y = py; } else { player.x = px * T + 16; player.y = py * T + 16; }
    if (dir) player.dir = dir;
    refreshNpcs();
    spawnEnemies();
    if (def.shard && !g.hasShard(def.shard.id) && !def.shard.whenClear) cur.items.push({ kind: 'shard', id: def.shard.id, x: def.shard.x * T + 16, y: def.shard.y * T + 16 });
    layer = buildLayer(cur);
    showBanner(def.name, def.sub);
    hud();
  }
  function refreshNpcs() {
    if (!cur) return;
    const old = cur.npcs;
    cur.npcs = (cur.def.npcs || []).filter(n => !n.when || n.when(g)).map(n => {
      const prev = old.find(o => o.def === n);
      return prev || { def: n, id: n.id, look: CAST[n.id], x: n.x * T + 16, y: n.y * T + 16, dir: n.dir || 'down', t: Math.random() * 5 };
    });
    cur.gateOpen = cur.def.gate ? cur.def.gate(g) : false;
  }
  function spawnEnemies() {
    let list = cur.def.enemies; if (typeof list === 'function') list = list(g); list = list || [];
    for (const [type, n] of list) for (let i = 0; i < n; i++) {
      if (type === 'boss') { cur.enemies.push(makeEnemy('boss', 5 * T + 16, 5 * T + 16)); continue; }
      for (let tries = 0; tries < 80; tries++) {
        const tx = 1 + Math.floor(Math.random() * (COLS - 2)), ty = 1 + Math.floor(Math.random() * (ROWS - 2));
        const x = tx * T + 16, y = ty * T + 16;
        if (Math.hypot(x - player.x, y - player.y) < 120) continue;
        if (tileSolidAt(tx, ty, type === 'crawler' ? 'walk' : 'fly')) continue;
        if (SOLID.indexOf(cur.map[ty][tx]) >= 0) continue;
        if (cur.npcs.some(n => Math.abs(n.x - x) < 30 && Math.abs(n.y - y) < 30)) continue;
        cur.enemies.push(makeEnemy(type, x, y)); break;
      }
    }
  }
  function makeEnemy(type, x, y) {
    const hp = { wisp: 1, crawler: 3, fog: 2, boss: 16 }[type];
    return { type, x, y, hp, dx: 0, dy: 1, t: Math.random() * 2, flash: 0, seed: Math.floor(Math.random() * 1000), visible: true, charging: false, state: 'move', open: false, tx: x, ty: y };
  }

  function tileAt(tx, ty) {
    tx = Math.max(0, Math.min(COLS - 1, tx)); ty = Math.max(0, Math.min(ROWS - 1, ty));
    return cur.map[ty][tx];
  }
  function tileSolidAt(tx, ty, kind) {
    const ch = tileAt(tx, ty);
    if (ch === 'G') return !cur.gateOpen;
    if (ch === 'Z') return !save.switches[cur.key];
    if (ch === 'V') return cur.key === 'summit' && !save.flags.bossDone;
    if (kind === 'fly') return FLY_BLOCK.indexOf(ch) >= 0;
    if (kind === 'beam') return BEAM_BLOCK.indexOf(ch) >= 0;
    return SOLID.indexOf(ch) >= 0;
  }
  function boxBlocked(x, y, kind, hw, top, bot, ignoreNpc) {
    const x0 = Math.floor((x - hw) / T), x1 = Math.floor((x + hw - 0.01) / T), y0 = Math.floor((y + top) / T), y1 = Math.floor((y + bot - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileSolidAt(tx, ty, kind)) return true;
    if (!ignoreNpc) for (const n of cur.npcs) if (Math.abs(n.x - x) < hw + 10 && y + bot > n.y - 2 && y + top < n.y + 13) return true;
    return false;
  }
  const pBlocked = (x, y) => boxBlocked(x, y, 'walk', 10, -2, 13, false);

  function buildLayer(scr) {
    const c = document.createElement('canvas'); c.width = Math.round(W * scalePx); c.height = Math.round(H * scalePx);
    const x = c.getContext('2d'); x.setTransform(scalePx, 0, 0, scalePx, 0, 0);
    const m = scr.map;
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
      const get = (dx, dy) => { const yy = ty + dy, xx = tx + dx; return (m[yy] && m[yy][xx]) || m[ty][tx]; };
      A.drawTileStatic(x, m[ty][tx], tx, ty, get, scr.def);
    }
    for (const lm of scr.def.landmarks || []) if (!A.ANIMATED_LANDMARKS[lm.type]) A.drawLandmark(x, lm, 0);
    return c;
  }

  /* ---------------- player ---------------- */
  const player = { x: 0, y: 0, dir: 'down', phase: 0, moving: false, swing: 0, swingCd: 0, swingId: 0, beamCd: 0, inv: 0, kx: 0, ky: 0, kt: 0 };

  /* ---------------- input ---------------- */
  const keys = { up: 0, down: 0, left: 0, right: 0 };
  const touchDir = { x: 0, y: 0 };
  let pressA = false, pressB = false;
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const A_KEYS = ['KeyA', 'KeyZ', 'Space', 'KeyJ'], B_KEYS = ['KeyB', 'KeyX', 'KeyK'];
  window.addEventListener('keydown', e => {
    if (e.repeat && !KEYMAP[e.code]) return;
    Sfx.init();
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = 1; if (dlg.open && dlg.choices) moveChoice(e.code); if (mode === 'play' || mode === 'dialog') e.preventDefault(); }
    if (A_KEYS.indexOf(e.code) >= 0) { pressA = true; e.preventDefault(); }
    if (e.code === 'Enter') { if (dlg.open || mode === 'cinema' || mode === 'dead') pressA = true; else if (mode === 'play') toggleMenu(); e.preventDefault(); }
    if (B_KEYS.indexOf(e.code) >= 0) { pressB = true; e.preventDefault(); }
    if (e.code === 'KeyM' || e.code === 'Escape') { if (mode === 'play' || mode === 'menu') toggleMenu(); }
  });
  window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = 0; });

  function bindTouch() {
    const pad = $('#dpad'), knob = $('#dpad-knob');
    let pid = null;
    const setFrom = ev => {
      const r = pad.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = ev.clientX - cx, dy = ev.clientY - cy; const d = Math.hypot(dx, dy), max = r.width * 0.34;
      if (d < r.width * 0.12) { touchDir.x = touchDir.y = 0; } else { touchDir.x = dx / d; touchDir.y = dy / d; }
      const k = Math.min(1, max / (d || 1)); knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    };
    pad.addEventListener('pointerdown', e => { Sfx.init(); pid = e.pointerId; pad.setPointerCapture(pid); setFrom(e); e.preventDefault(); });
    pad.addEventListener('pointermove', e => { if (e.pointerId === pid) setFrom(e); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; touchDir.x = touchDir.y = 0; knob.style.transform = ''; };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    const btn = (id, fn) => { const b = $(id); b.addEventListener('pointerdown', e => { Sfx.init(); e.preventDefault(); b.classList.add('down'); fn(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('down'))); };
    btn('#btn-a', () => { pressA = true; });
    btn('#btn-b', () => { pressB = true; });
    $('#btn-menu').addEventListener('click', () => { Sfx.init(); if (mode === 'play' || mode === 'menu') toggleMenu(); });
    const tapAdvance = () => { Sfx.init(); if ((dlg.open && !dlg.choices) || mode === 'cinema' || mode === 'dead') pressA = true; };
    $('#stage').addEventListener('pointerdown', tapAdvance);
    $('#cinema').addEventListener('pointerdown', e => { e.preventDefault(); tapAdvance(); });
  }

  /* ---------------- dialog ---------------- */
  const dlg = { open: false, queue: [], line: null, shown: 0, choices: null, sel: 0, onDone: null };
  const pctx = $('#portrait').getContext('2d');
  function say(lines, onDone) {
    if (dlg.open) { dlg.queue.unshift(...lines); if (onDone) { const prev = dlg.onDone; dlg.onDone = () => { prev && prev(); onDone(); }; } return; }
    dlg.open = true; dlg.queue = lines.slice(); dlg.onDone = onDone || null; mode = 'dialog';
    $('#dialog').hidden = false; nextLine();
  }
  function nextLine() {
    dlg.choices = null; $('#choices').innerHTML = '';
    while (dlg.queue.length && dlg.queue[0] && dlg.queue[0].do) { const a = dlg.queue.shift(); a.do(g); }
    if (!dlg.queue.length) return closeDialog();
    const l = dlg.queue.shift();
    dlg.line = Array.isArray(l) ? { who: l[0], text: l[1] } : { who: l.who, text: l.ask, ask: l };
    dlg.shown = 0;
    const look = CAST[dlg.line.who] || CAST.sys;
    $('#speaker').textContent = look.name || '';
    $('#dialog').classList.toggle('voice', look.kind === 'voice' && dlg.line.who !== 'arm');
    $('#dialog').classList.toggle('thought', dlg.line.who === 'me' && dlg.line.text.charAt(0) === '(');
  }
  function closeDialog() {
    dlg.open = false; $('#dialog').hidden = true; mode = 'play';
    refreshNpcs(); hud(); store();
    const cb = dlg.onDone; dlg.onDone = null; if (cb) cb();
  }
  function showChoices() {
    const a = dlg.line.ask; dlg.choices = a.options; dlg.sel = 0;
    const box = $('#choices'); box.innerHTML = '';
    a.options.forEach((o, i) => {
      const b = document.createElement('button'); b.className = 'choice'; b.id = 'choice-' + i; b.textContent = o;
      b.addEventListener('click', e => { e.stopPropagation(); pick(i); });
      b.addEventListener('pointerdown', e => e.stopPropagation());
      box.appendChild(b);
    });
    box.children[0].classList.add('sel');
  }
  function moveChoice(code) {
    const n = dlg.choices.length; if (code === 'ArrowUp') dlg.sel = (dlg.sel + n - 1) % n; if (code === 'ArrowDown') dlg.sel = (dlg.sel + 1) % n;
    [...$('#choices').children].forEach((c, i) => c.classList.toggle('sel', i === dlg.sel)); Sfx.play('menu');
  }
  function pick(i) { const a = dlg.line.ask; const more = a.then(g, i) || []; dlg.queue.unshift(...more); Sfx.play('menu'); nextLine(); }
  function updateDialog(dt) {
    const full = dlg.line.text;
    if (dlg.shown < full.length) {
      const before = Math.floor(dlg.shown); dlg.shown = Math.min(full.length, dlg.shown + dt * 52);
      if (Math.floor(dlg.shown) !== before && before % 3 === 0 && full[before] !== ' ') Sfx.play('blip');
      if (dlg.shown >= full.length && dlg.line.ask) showChoices();
    }
    $('#dtext').textContent = full.slice(0, Math.floor(dlg.shown));
    $('#dnext').style.visibility = dlg.shown >= full.length && !dlg.choices ? 'visible' : 'hidden';
    if (pressA) {
      if (dlg.shown < full.length) { dlg.shown = full.length; $('#dtext').textContent = full; if (dlg.line.ask) showChoices(); }
      else if (dlg.choices) pick(dlg.sel);
      else nextLine();
    }
    const look = CAST[dlg.line.who];
    A.drawPortrait(pctx, 144, look, cur ? cur.t : 0);
  }

  /* ---------------- shards ---------------- */
  function collectShard(id) {
    if (g.hasShard(id)) return;
    save.shards.push(id); store(); Sfx.play('shard');
    const m = WD.MEMORIES[id];
    burst(player.x, player.y - 10, 26, '#ffc8ec');
    const lines = [['sys', `MEMORY SHARD ${save.shards.length} of 5: "${m.title}"`], ...m.lines.map(t => ['me', t])];
    if (save.shards.length === 5) lines.push(['sys', 'All five echoes are attuned. Somewhere above the city, the Resonance Mast answers.']);
    say(lines);
  }

  /* ---------------- combat helpers ---------------- */
  function burst(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = 30 + Math.random() * 90; cur.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.4, col }); } }
  function hurtPlayer(dmg, sx, sy) {
    if (player.inv > 0 || mode !== 'play') return;
    save.hp -= dmg; player.inv = 1.1; Sfx.play('hurt');
    const d = Math.hypot(player.x - sx, player.y - sy) || 1; player.kx = (player.x - sx) / d * 200; player.ky = (player.y - sy) / d * 200; player.kt = 0.16;
    hud();
    if (save.hp <= 0) { save.hp = 0; die(); }
  }
  function damageEnemy(e, dmg, fromX, fromY) {
    if (e.flash > 0) return false;
    if (e.type === 'fog' && !e.visible) return false;
    if (e.type === 'boss' && !e.open) { burst(e.x, e.y, 6, '#9df2e8'); Sfx.play('menu'); return false; }
    e.hp -= dmg; e.flash = e.type === 'boss' ? 0.5 : 0.3; Sfx.play('hit');
    if (e.type !== 'boss') {
      const d = Math.hypot(e.x - fromX, e.y - fromY) || 1, kx = (e.x - fromX) / d * 18, ky = (e.y - fromY) / d * 18;
      if (!boxBlocked(e.x + kx, e.y + ky, e.type === 'crawler' ? 'walk' : 'fly', 9, -6, 10, true)) { e.x += kx; e.y += ky; }
    }
    if (e.hp <= 0) killEnemy(e);
    return true;
  }
  function killEnemy(e) {
    e.dead = true; Sfx.play('kill'); burst(e.x, e.y, e.type === 'boss' ? 60 : 14, e.type === 'crawler' ? '#c98a5a' : '#dff');
    if (e.type !== 'boss' && Math.random() < 0.3) cur.items.push({ kind: 'heart', x: e.x, y: e.y, t: 8 });
    if (e.type === 'boss') {
      save.flags.bossDone = true; store();
      cur.shots.length = 0;
      setTimeout(() => say(WD.BOSS_END.slice(), () => cinema(WD.ENDING, () => { save.flags.ending = true; save.hp = save.maxHp; loadScreen('1,0', 5, 6, 'up'); store(); })), 700);
    }
  }

  /* ---------------- update ---------------- */
  let mode = 'title';
  function update(dt) {
    if (!cur) return;
    cur.t += dt;
    if (mode === 'dialog') { updateDialog(dt); pressA = pressB = false; return; }
    if (mode === 'trans') { updateTrans(dt); return; }
    if (mode === 'cinema') { updateCinema(dt); pressA = pressB = false; return; }
    if (mode === 'dead') { if (pressA) respawn(); pressA = pressB = false; return; }
    if (mode !== 'play') { pressA = pressB = false; return; }
    Sfx.music(dt, cur.def.mood);

    // input vector
    let vx = keys.right - keys.left + touchDir.x, vy = keys.down - keys.up + touchDir.y;
    const mag = Math.hypot(vx, vy); if (mag > 1) { vx /= mag; vy /= mag; }
    player.moving = mag > 0.2 && player.swing <= 0;
    if (mag > 0.2) {
      if (Math.abs(vx) > Math.abs(vy) + 0.1) player.dir = vx < 0 ? 'left' : 'right';
      else if (Math.abs(vy) > Math.abs(vx) + 0.1) player.dir = vy < 0 ? 'up' : 'down';
    }
    player.inv = Math.max(0, player.inv - dt); player.swingCd -= dt; player.beamCd -= dt;
    if (player.kt > 0) { player.kt -= dt; tryMove(player.kx * dt, 0); tryMove(0, player.ky * dt); }
    else if (player.moving) {
      const sp = 100 * dt; player.phase = (player.phase + dt * 3.2) % 1;
      tryMove(vx * sp, 0, vy); tryMove(0, vy * sp, vx);
    } else player.phase = 0;
    if (player.swing > 0) player.swing -= dt;

    // edges
    const e = edgeExit(); if (e) return;
    // warps
    const ptx = Math.floor(player.x / T), pty = Math.floor((player.y + 6) / T);
    for (const w of cur.def.warps || []) if (w.x === ptx && w.y === pty && (!w.when || w.when(g))) { Sfx.play('gate'); fadeTo(() => loadScreen(w.to, w.tx, w.ty, w.dir)); return; }

    // actions
    if (pressA) { if (!tryTalk() && save.items.staff) swing(); }
    if (pressB && save.items.prism && player.beamCd <= 0) fireBeam();
    pressA = pressB = false;

    // staff hits
    if (player.swing > 0.08) {
      const [dx, dy] = DIRS[player.dir]; const hx = player.x + dx * 20, hy = player.y + 2 + dy * 20;
      for (const en of cur.enemies) if (!en.dead && en.hitBy !== player.swingId && Math.hypot(en.x - hx, en.y - hy) < (en.type === 'boss' ? 34 : 20)) { en.hitBy = player.swingId; damageEnemy(en, 1, player.x, player.y); }
      const tx = Math.floor(hx / T), ty = Math.floor(hy / T);
      if (tileAt(tx, ty) === 'Y') lightSwitch();
    }

    updateEnemies(dt);
    updateShots(dt);
    updateItems(dt);
    for (const f of cur.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; f.life -= dt; }
    cur.fx = cur.fx.filter(f => f.life > 0);
    cur.enemies = cur.enemies.filter(en => !en.dead);

    if (cur.def.shard && cur.def.shard.whenClear && !cur.clearSpawned && !g.hasShard(cur.def.shard.id) && cur.enemies.length === 0) {
      cur.clearSpawned = true; const s = cur.def.shard; cur.items.push({ kind: 'shard', id: s.id, x: s.x * T + 16, y: s.y * T + 16 }); Sfx.play('switch'); burst(s.x * T + 16, s.y * T + 16, 20, '#ffc8ec');
    }
    for (const n of cur.npcs) n.t += dt;
  }
  function tryMove(dx, dy, other) {
    if (!dx && !dy) return;
    const nx = player.x + dx, ny = player.y + dy;
    if (!pBlocked(nx, ny)) { player.x = nx; player.y = ny; return; }
    // corner assist: slide around tile corners when mostly clear
    if (Math.abs(other || 0) > 0.3) return;
    for (let o = 1; o <= 12; o++) for (const s of [1, -1]) {
      const ox = dy ? s * o : 0, oy = dx ? s * o : 0;
      if (!pBlocked(nx + ox, ny + oy) && !pBlocked(player.x + ox, player.y + oy)) {
        const step = Math.min(Math.abs(dx || dy), 1.6) * s;
        if (dx) { if (!pBlocked(player.x, player.y + step)) player.y += step; } else if (!pBlocked(player.x + step, player.y)) player.x += step;
        return;
      }
    }
  }
  function edgeExit() {
    const exits = [[player.x < 0, -1, 0], [player.x > W, 1, 0], [player.y < -2, 0, -1], [player.y > H - 10, 0, 1]];
    for (const [hit, dx, dy] of exits) if (hit) { const nk = neighbor(cur.key, dx, dy); if (nk) { startTrans(nk, dx, dy); return true; } }
    // hold the player inside edges that lead nowhere
    if (!neighbor(cur.key, -1, 0)) player.x = Math.max(10, player.x);
    if (!neighbor(cur.key, 1, 0)) player.x = Math.min(W - 10, player.x);
    if (!neighbor(cur.key, 0, -1)) player.y = Math.max(2, player.y);
    if (!neighbor(cur.key, 0, 1)) player.y = Math.min(H - 14, player.y);
    return false;
  }

  /* ---------------- transitions ---------------- */
  let trans = null;
  function startTrans(nk, dx, dy) {
    prevLayer = layer;
    const fromX = player.x, fromY = player.y;
    let nx = player.x, ny = player.y;
    if (dx === -1) nx = W - 12; if (dx === 1) nx = 12; if (dy === -1) ny = H - 16; if (dy === 1) ny = 6;
    loadScreen(nk, nx, ny, null, true);
    trans = { dx, dy, t: 0, dur: 0.5, fromX, fromY, toX: nx, toY: ny };
    mode = 'trans'; store();
  }
  function updateTrans(dt) {
    trans.t += dt; if (trans.t >= trans.dur) { trans = null; prevLayer = null; mode = 'play'; autoEnter(); }
  }
  function fadeTo(fn) {
    const f = $('#fade'); f.classList.add('on'); mode = 'fading';
    setTimeout(() => { fn(); f.classList.remove('on'); mode = 'play'; autoEnter(); store(); }, 380);
  }
  function autoEnter() {
    const oe = cur.def.onEnter && cur.def.onEnter(g);
    if (oe) { const n = cur.npcs.find(n => n.id === oe); if (n) talkTo(n); }
  }

  /* ---------------- actions ---------------- */
  function tryTalk() {
    const [dx, dy] = DIRS[player.dir]; const fx = player.x + dx * 22, fy = player.y + 4 + dy * 22;
    let best = null, bd = 1e9;
    for (const n of cur.npcs) {
      const reach = n.id === 'bison' ? 30 : 20;
      const d = Math.hypot(n.x - fx, n.y + 4 - fy) - (n.id === 'bison' ? 22 : 0);
      if (d < reach && d < bd) { best = n; bd = d; }
    }
    if (!best) for (const n of cur.npcs) { const d = Math.hypot(n.x - player.x, n.y - player.y); if (d < 30 && d < bd) { best = n; bd = d; } }
    if (!best) return false;
    talkTo(best); return true;
  }
  function talkTo(n) {
    const lines = n.def.talk ? n.def.talk(g) : [];
    if (!lines || !lines.length) return;
    if (n.look && !n.look.kind || (n.look && n.look.kind === 'machine') || (n.look && n.look.kind === 'android')) {
      const dx = player.x - n.x, dy = player.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    say(lines);
  }
  function swing() {
    if (player.swingCd > 0) return;
    player.swing = 0.24; player.swingCd = 0.32; player.swingId++; Sfx.play('swing');
  }
  function fireBeam() {
    const [dx, dy] = DIRS[player.dir];
    cur.shots.push({ own: 'p', x: player.x + dx * 14, y: player.y + 2 + dy * 14, vx: dx * 330, vy: dy * 330, life: 1.6 });
    player.beamCd = 0.42; Sfx.play('beam');
  }
  function lightSwitch() {
    if (save.switches[cur.key]) return;
    save.switches[cur.key] = true; store(); Sfx.play('switch');
    for (const [x, y, ch] of cur.anim) if (ch === 'Y' || ch === 'Z') burst(x * T + 16, y * T + 16, 16, ch === 'Y' ? '#9df2e8' : '#ffffff');
    setTimeout(() => say([['sys', 'The crystal key rings. Somewhere below the cliff, a fog seal thins and lifts.']]), 300);
  }

  /* ---------------- enemies ---------------- */
  function updateEnemies(dt) {
    for (const e of cur.enemies) {
      e.t += dt; e.flash = Math.max(0, e.flash - dt);
      const pdx = player.x - e.x, pdy = player.y - e.y, pd = Math.hypot(pdx, pdy) || 1;
      if (e.type === 'wisp') {
        if (e.t > e.next || !e.next) { e.next = e.t + 0.8 + Math.random() * 1.6; const a = Math.random() < 0.35 ? Math.atan2(pdy, pdx) : Math.random() * 6.283; e.dx = Math.cos(a); e.dy = Math.sin(a); }
        moveEnemy(e, e.dx * 38 * dt, e.dy * 38 * dt, 'fly');
      } else if (e.type === 'crawler') {
        if (e.state === 'charge') {
          if (!moveEnemy(e, e.dx * 140 * dt, e.dy * 140 * dt, 'walk') || e.t > e.until) { e.state = 'rest'; e.until = e.t + 0.8; e.charging = false; }
        } else if (e.state === 'rest') { if (e.t > e.until) e.state = 'move'; }
        else {
          if (e.t > (e.next || 0)) { e.next = e.t + 1 + Math.random() * 1.5; const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)]; e.dx = d[0]; e.dy = d[1]; }
          if (!moveEnemy(e, e.dx * 32 * dt, e.dy * 32 * dt, 'walk')) e.next = 0;
          if (pd < 170 && (Math.abs(pdx) < 12 || Math.abs(pdy) < 12)) { e.state = 'charge'; e.charging = true; e.until = e.t + 1.3; if (Math.abs(pdx) < 12) { e.dx = 0; e.dy = Math.sign(pdy); } else { e.dx = Math.sign(pdx); e.dy = 0; } }
        }
      } else if (e.type === 'fog') {
        const cyc = (e.t + e.seed) % 4.2; e.visible = cyc < 2.6;
        const sp = e.visible ? 24 : 44;
        moveEnemy(e, pdx / pd * sp * dt, pdy / pd * sp * dt, 'fly');
      } else if (e.type === 'boss') updateBoss(e, dt, pdx, pdy, pd);
      const touchR = e.type === 'boss' ? 30 : 16;
      if (!(e.type === 'fog' && !e.visible) && Math.hypot(pdx, pdy + 4) < touchR) hurtPlayer(e.type === 'boss' ? 2 : 1, e.x, e.y);
    }
  }
  function moveEnemy(e, dx, dy, kind) {
    let ok = true;
    if (!boxBlocked(e.x + dx, e.y, kind, 9, -6, 10, false) && e.x + dx > 12 && e.x + dx < W - 12) e.x += dx; else { ok = false; if (e.type === 'wisp') e.dx = -e.dx; }
    if (!boxBlocked(e.x, e.y + dy, kind, 9, -6, 10, false) && e.y + dy > 12 && e.y + dy < H - 16) e.y += dy; else { ok = false; if (e.type === 'wisp') e.dy = -e.dy; }
    return ok;
  }
  function updateBoss(e, dt, pdx, pdy, pd) {
    const rage = e.hp <= 8;
    if (e.state === 'move') {
      if (!e.until) { e.until = e.t + 1.6; e.tx = 2.5 * T + Math.random() * 6 * T; e.ty = 3 * T + Math.random() * 5 * T; }
      e.x += (e.tx - e.x) * Math.min(1, dt * 2.2); e.y += (e.ty - e.y) * Math.min(1, dt * 2.2);
      if (e.t > e.until) { e.state = 'wind'; e.until = e.t + (rage ? 0.45 : 0.7); Sfx.play('boss'); }
    } else if (e.state === 'wind') {
      if (e.t > e.until) {
        const n = rage ? 14 : 10, off = Math.random();
        for (let i = 0; i < n; i++) { const a = (i + off) / n * Math.PI * 2; cur.shots.push({ own: 'b', x: e.x, y: e.y, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, life: 5 }); }
        if (rage) cur.shots.push({ own: 'b', x: e.x, y: e.y, vx: pdx / pd * 140, vy: pdy / pd * 140, life: 5 });
        e.state = 'open'; e.open = true; e.until = e.t + (rage ? 1.5 : 1.9);
      }
    } else if (e.state === 'open') {
      if (e.t > e.until) { e.open = false; e.state = 'move'; e.until = 0; }
    }
  }
  function updateShots(dt) {
    for (const s of cur.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (s.x < -10 || s.x > W + 10 || s.y < -10 || s.y > H + 10) { s.life = 0; continue; }
      if (s.own === 'p') {
        const tx = Math.floor(s.x / T), ty = Math.floor(s.y / T);
        if (tileSolidAt(tx, ty, 'beam')) { if (tileAt(tx, ty) === 'Y') lightSwitch(); s.life = 0; burst(s.x, s.y, 5, '#bff7ef'); continue; }
        for (const e of cur.enemies) if (!e.dead && Math.hypot(e.x - s.x, e.y - s.y) < (e.type === 'boss' ? 26 : 14)) { damageEnemy(e, 1, s.x - s.vx * 0.05, s.y - s.vy * 0.05); s.life = 0; break; }
        if (s.life > 0 && Math.random() < 0.6) cur.fx.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.18, col: '#bff7ef' });
      } else if (Math.hypot(player.x - s.x, player.y - s.y) < 12) { hurtPlayer(2, s.x - s.vx, s.y - s.vy); s.life = 0; }
    }
    cur.shots = cur.shots.filter(s => s.life > 0);
  }
  function updateItems(dt) {
    for (const it of cur.items) {
      if (it.kind === 'heart') { it.t -= dt; if (it.t <= 0) it.gone = true; }
      if (Math.hypot(player.x - it.x, player.y - it.y) < 18) {
        it.gone = true;
        if (it.kind === 'heart') { save.hp = Math.min(save.maxHp, save.hp + 2); Sfx.play('pickup'); hud(); }
        if (it.kind === 'shard') collectShard(it.id);
      }
    }
    cur.items = cur.items.filter(i => !i.gone);
  }

  /* ---------------- death ---------------- */
  function die() {
    mode = 'dead'; $('#dead').hidden = false; Sfx.play('hurt');
  }
  function respawn() {
    $('#dead').hidden = true; save.hp = save.maxHp; mode = 'play';
    fadeTo(() => loadScreen(WD.START.screen, WD.START.x, WD.START.y + 1, 'down'));
    setTimeout(() => say([['nima', 'Welcome back. You were brought in unconscious. The ARM does not lose patients twice. Please make that easy for us.']]), 500);
  }

  /* ---------------- render ---------------- */
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b141b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!cur || !layer) return;
    if (mode === 'trans' && trans) {
      const p = easeInOut(Math.min(1, trans.t / trans.dur));
      const ox = trans.dx * W, oy = trans.dy * H;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (prevLayer) ctx.drawImage(prevLayer, -ox * p * scalePx, -oy * p * scalePx);
      ctx.drawImage(layer, ox * (1 - p) * scalePx, oy * (1 - p) * scalePx);
      ctx.setTransform(scalePx, 0, 0, scalePx, 0, 0);
      const px = trans.toX + ox * (1 - p), py = trans.toY + oy * (1 - p);   // entry point, in new-screen space
      const sx = trans.fromX - ox * p, sy = trans.fromY - oy * p;             // exit point, in old-screen space
      drawPlayer(sx + (px - sx) * p, sy + (py - sy) * p, true);
      return;
    }
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(scalePx, 0, 0, scalePx, 0, 0);
    const t = cur.t;
    const st = { lit: !!save.switches[cur.key], gateOpen: cur.gateOpen };
    for (const [x, y, ch] of cur.anim) A.drawTileAnim(ctx, ch, x, y, t, st);
    for (const lm of cur.def.landmarks || []) if (A.ANIMATED_LANDMARKS[lm.type]) A.drawLandmark(ctx, lm, t);
    for (const it of cur.items) {
      if (it.kind === 'shard') A.drawShard(ctx, it.x, it.y, t);
      else if (!(it.t < 2 && Math.floor(t * 8) % 2)) A.drawHeart(ctx, it.x, it.y + Math.sin(t * 4) * 2, 1.6, '#e0453a', '#fff');
    }
    const ents = [];
    for (const n of cur.npcs) ents.push({ y: n.y, draw: () => A.drawPerson(ctx, n.x, n.y, n.look, n.dir, 0, { t: n.t }) });
    for (const e of cur.enemies) ents.push({ y: e.y + (e.type === 'boss' ? 40 : 0), draw: () => A.drawEnemy(ctx, e, t) });
    ents.push({ y: player.y, draw: () => drawPlayer(player.x, player.y, false) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    for (const s of cur.shots) {
      if (s.own === 'p') {
        ctx.strokeStyle = 'rgba(191,247,239,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03); ctx.lineTo(s.x, s.y); ctx.stroke();
        A.ell(ctx, s.x, s.y, 3, 3, '#ffffff');
      } else {
        A.ell(ctx, s.x, s.y, 6, 6, '#0d1116'); A.ell(ctx, s.x, s.y, 2.5, 2.5, Math.floor(t * 20) % 2 ? '#ff5a8a' : '#9df2e8');
      }
    }
    for (const f of cur.fx) { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2.5)); ctx.fillStyle = f.col; ctx.fillRect(f.x - 1.5, f.y - 1.5, 3, 3); }
    ctx.globalAlpha = 1;
    // atmosphere
    const mood = cur.def.mood;
    if (mood === 'fog') { for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.07; A.ell(ctx, ((t * 8 + i * 110) % (W + 160)) - 80, 60 + i * 100, 110, 34, '#ffffff'); } ctx.globalAlpha = 1; }
    if (mood === 'dusk') { ctx.fillStyle = 'rgba(255,120,80,.10)'; ctx.fillRect(0, 0, W, H); }
    if (mood === 'gold') { ctx.fillStyle = 'rgba(255,200,90,.06)'; ctx.fillRect(0, 0, W, H); }
    if (mood === 'storm') { ctx.fillStyle = `rgba(20,10,40,${0.18 + Math.sin(t * 2) * 0.05})`; ctx.fillRect(0, 0, W, H); }
    // boss hp
    const boss = cur.enemies.find(e => e.type === 'boss');
    if (boss) {
      ctx.fillStyle = 'rgba(0,0,0,.5)'; A.rr(ctx, 60, H - 22, W - 120, 10, 5); ctx.fill();
      ctx.fillStyle = '#ff6aa0'; A.rr(ctx, 62, H - 20, (W - 124) * Math.max(0, boss.hp) / 16, 6, 3); ctx.fill();
      ctx.fillStyle = '#f4efe6'; ctx.font = '600 9px "Atkinson Hyperlegible", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('THE UNWRITTEN', W / 2, H - 26);
    }
  }
  function drawPlayer(x, y, noStaff) {
    if (player.inv > 0 && Math.floor(player.inv * 20) % 2 && mode === 'play') return;
    const sw = player.swing > 0 ? 1 - player.swing / 0.24 : null;
    A.drawPerson(ctx, x, y, CAST.me, player.dir, player.moving ? player.phase : 0, { staff: save.items.staff && !noStaff, swing: sw });
  }
  const easeInOut = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

  /* ---------------- HUD ---------------- */
  const hctx = $('#hearts').getContext('2d');
  function hud() {
    const c = $('#hearts'), n = save.maxHp / 2, dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = n * 20 + 4, chh = 20; c.style.width = cw + 'px'; c.style.height = chh + 'px'; c.width = cw * dpr; c.height = chh * dpr;
    hctx.setTransform(dpr, 0, 0, dpr, 0, 0); hctx.clearRect(0, 0, cw, chh);
    for (let i = 0; i < n; i++) {
      const v = save.hp - i * 2, x = 11 + i * 20, y = 11;
      A.drawHeart(hctx, x, y, 1.6, '#2a3640', null);
      if (v >= 2) A.drawHeart(hctx, x, y, 1.6, '#e0453a', null);
      else if (v === 1) { hctx.save(); hctx.beginPath(); hctx.rect(x - 12, 0, 12, 20); hctx.clip(); A.drawHeart(hctx, x, y, 1.6, '#e0453a', null); hctx.restore(); }
      A.drawHeart(hctx, x, y, 1.6, null, '#f4efe6');
    }
    const sh = $('#shards'); sh.innerHTML = '';
    for (let i = 1; i <= 5; i++) { const s = document.createElement('span'); s.className = 'shard' + (save.shards.length >= i ? ' on' : ''); sh.appendChild(s); }
    $('#place').textContent = cur ? cur.def.name : '';
    $('#objective').textContent = objective();
    $('#btn-b').classList.toggle('locked', !save.items.prism);
  }
  let bannerTimer = 0;
  function showBanner(name, sub) {
    const b = $('#banner'); $('#banner-name').textContent = name; $('#banner-sub').textContent = sub || '';
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('show'), 2400);
  }

  /* ---------------- cinema (intro / ending) ---------------- */
  const cin = { items: [], i: 0, shown: 0, t: 0, onDone: null };
  const cctx = $('#cinema-canvas').getContext('2d');
  function sizeCinema() {
    const c = $('#cinema-canvas'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(c.clientWidth * dpr) || 10; c.height = Math.round(c.clientHeight * dpr) || 10;
  }
  function cinema(items, onDone) {
    cin.items = items; cin.i = 0; cin.shown = 0; cin.onDone = onDone; mode = 'cinema';
    $('#cinema').hidden = false; sizeCinema(); setCinemaLine();
  }
  function setCinemaLine() {
    const it = cin.items[cin.i]; cin.shown = 0;
    $('#cin-who').textContent = it.who ? CAST[it.who].name : '';
  }
  function updateCinema(dt) {
    cin.t += dt;
    const it = cin.items[cin.i], full = it.text;
    cin.shown = Math.min(full.length, cin.shown + dt * 40);
    $('#cin-text').textContent = full.slice(0, Math.floor(cin.shown));
    if (pressA) {
      if (cin.shown < full.length) cin.shown = full.length;
      else if (++cin.i >= cin.items.length) { $('#cinema').hidden = true; mode = 'play'; const cb = cin.onDone; cin.onDone = null; cb && cb(); }
      else setCinemaLine();
    }
  }
  function renderCinema() {
    if (mode !== 'cinema') return;
    const c = $('#cinema-canvas'), it = cin.items[cin.i];
    cctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!it.art) { cctx.fillStyle = '#070b10'; cctx.fillRect(0, 0, c.width, c.height); for (let i = 0; i < 70; i++) { cctx.globalAlpha = 0.2 + 0.4 * Math.abs(Math.sin(cin.t * 0.7 + i)); cctx.fillStyle = '#cfe'; cctx.fillRect(A.hash(i, 3, 9) * c.width, A.hash(i, 5, 9) * c.height, 1.5, 1.5); } cctx.globalAlpha = 1; }
    else A.drawScene(cctx, c.width, c.height, cin.t, it.art);
  }
  const INTRO = [
    { text: '2026. The Free City of Yelamu–San Francisco. A city that never built a car.' },
    { text: 'A young Ohlone man carries a tangle of blood vessels in his left temporal lobe: a grade III arteriovenous malformation, 6.4 centimeters across.' },
    { text: 'He chooses the Long Sleep. His body is turned to glass at minus one hundred ninety-six degrees.' },
    { text: 'Seven hundred thirty-two years pass. The city learns to warm glass without breaking it, to rewrite one letter of a gene, and to ask an axolotl how it remembers its own shape.' },
    { text: '2758. He is rewarmed and cured. For a year, his brain grows back.' },
    { art: 'dawn', text: '2759. A machine speaks his name.' }
  ];

  /* ---------------- menu ---------------- */
  let menuTab = 'journal';
  function toggleMenu() {
    const m = $('#menu');
    if (mode === 'menu') { m.hidden = true; mode = 'play'; Sfx.play('menu'); return; }
    mode = 'menu'; m.hidden = false; Sfx.play('menu'); renderMenu();
  }
  function renderMenu() {
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === menuTab ? 'true' : 'false'));
    const body = $('#menu-body'); body.innerHTML = '';
    if (menuTab === 'journal') body.appendChild(journalView());
    if (menuTab === 'map') body.appendChild(mapView());
    if (menuTab === 'memories') body.appendChild(memoryView());
    if (menuTab === 'codex') body.appendChild(codexView(renderMenu));
    body.scrollTop = 0;
  }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function journalView() {
    const v = el('div', 'journal');
    v.appendChild(el('p', 'eyebrow', 'Current guidance'));
    v.appendChild(el('p', 'objective-big', esc(objective())));
    const stats = el('dl', 'stats');
    const items = [['Hearts', `${save.hp / 2} of ${save.maxHp / 2}`], ['Memory shards', `${save.shards.length} of 5`], ['Lumen Staff', save.items.staff ? 'Carried (A)' : 'Not yet'], ['Tuyshtak Prism', save.items.prism ? 'Fitted (B)' : 'Not yet'], ['Tide Band', save.items.band ? 'Provisional resident' : 'Not yet']];
    for (const [k, val] of items) { stats.appendChild(el('dt', '', esc(k))); stats.appendChild(el('dd', '', esc(val))); }
    v.appendChild(stats);
    v.appendChild(el('p', 'eyebrow', 'Controls'));
    v.appendChild(el('p', 'small', 'Touch: drag the pad to walk, A to talk or swing, B to fire the prism beam. Keyboard: arrow keys to walk, A (or Z / Space) for A, B (or X) for B, M or Esc for this menu.'));
    const row = el('div', 'row');
    const snd = el('button', 'pill', save.sound ? 'Sound: on' : 'Sound: off'); snd.id = 'opt-sound';
    snd.onclick = () => { save.sound = !save.sound; store(); snd.textContent = save.sound ? 'Sound: on' : 'Sound: off'; };
    row.appendChild(snd);
    const inst = el('button', 'pill', 'Install app'); inst.id = 'opt-install'; inst.onclick = doInstall; row.appendChild(inst);
    const reset = el('button', 'pill danger', 'Start over'); reset.id = 'opt-reset';
    reset.onclick = () => { if (reset.dataset.armed) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } location.reload(); } else { reset.dataset.armed = '1'; reset.textContent = 'Tap again to erase your save'; } };
    row.appendChild(reset);
    v.appendChild(row);
    return v;
  }
  function mapView() {
    const v = el('div', 'mapview');
    v.appendChild(el('p', 'small', 'The Free City on its peninsula. Pacific to the west, the Golden Gate to the north, the Bay to the east, the Southern Greenwall below.'));
    const grid = el('div', 'mapgrid');
    const here = cur.def.mapAs || cur.key;
    const shardAt = { '0,0': 1, '2,3': 2, '1,0': 3, '3,3': 4, '1,3': 5 };
    for (let r = 0; r < WD.GRID_H; r++) for (let c = 0; c < WD.GRID_W; c++) {
      const k = c + ',' + r, s = SCREENS[k], seen = save.visited[k];
      const cell = el('div', 'cell' + (seen ? ' seen' : '') + (k === here ? ' here' : ''));
      cell.appendChild(el('span', 'nm', seen ? esc(s.name) : '· · ·'));
      if (shardAt[k] && g.hasShard(shardAt[k])) cell.appendChild(el('span', 'gem', ''));
      if (k === here) cell.appendChild(el('span', 'you', 'You'));
      grid.appendChild(cell);
    }
    v.appendChild(grid);
    return v;
  }
  function memoryView() {
    const v = el('div', 'memories');
    for (let i = 1; i <= 5; i++) {
      const m = WD.MEMORIES[i], got = g.hasShard(i);
      const card = el('article', 'memory' + (got ? '' : ' locked'));
      card.appendChild(el('h3', '', got ? esc(m.title) : 'Unrecovered echo'));
      card.appendChild(el('p', 'eyebrow', got ? esc(m.place) : 'Somewhere in the city'));
      if (got) m.lines.forEach(l => card.appendChild(el('p', '', esc(l))));
      v.appendChild(card);
    }
    return v;
  }
  let codexOpen = null;
  function codexView(rerender) {
    const v = el('div', 'codex');
    if (!codexOpen) {
      v.appendChild(el('p', 'small', 'The story bible. Sections marked Real are documented science and history. Sections marked Story are this world\'s inventions.'));
      const list = el('div', 'codex-list');
      for (const c of CODEX) {
        const b = el('button', 'codex-item'); b.id = 'codex-' + c.id;
        b.innerHTML = `<span class="ci-title">${esc(c.title)}</span><span class="ci-kick">${esc(c.kicker)}</span>`;
        b.onclick = () => { codexOpen = c.id; rerender(); };
        list.appendChild(b);
      }
      v.appendChild(list); return v;
    }
    const c = CODEX.find(x => x.id === codexOpen);
    const back = el('button', 'pill', '← All entries'); back.id = 'codex-back'; back.onclick = () => { codexOpen = null; rerender(); };
    v.appendChild(back);
    v.appendChild(el('h2', 'codex-title', esc(c.title)));
    v.appendChild(el('p', 'eyebrow', esc(c.kicker)));
    for (const s of c.sections) {
      const sec = el('section', 'cx ' + s.kind);
      const tag = s.kind === 'real' ? 'Real' : s.kind === 'world' ? 'Story' : '';
      sec.appendChild(el('h3', '', (tag ? `<span class="tag">${tag}</span>` : '') + esc(s.h)));
      if (s.table) {
        const wrap = el('div', 'tablewrap'), tb = el('table');
        s.table.forEach((row, i) => { const tr = el('tr'); row.forEach(cell => tr.appendChild(el(i ? 'td' : 'th', '', esc(cell)))); tb.appendChild(tr); });
        wrap.appendChild(tb); sec.appendChild(wrap);
      }
      (s.p || []).forEach(p => sec.appendChild(el('p', '', esc(p))));
      if (s.list) { const dl = el('dl', 'cxlist'); s.list.forEach(([k, d]) => { dl.appendChild(el('dt', '', esc(k))); dl.appendChild(el('dd', '', esc(d))); }); sec.appendChild(dl); }
      v.appendChild(sec);
    }
    return v;
  }

  /* ---------------- install ---------------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; document.body.classList.add('can-install'); });
  function doInstall() {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; document.body.classList.remove('can-install'); }); return; }
    $('#install-help').hidden = false;
  }

  /* ---------------- title ---------------- */
  const tctx = $('#title-canvas').getContext('2d');
  let titleT = 0;
  function renderTitle(dt) {
    if (mode !== 'title') return;
    titleT += dt;
    const c = $('#title-canvas'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    A.drawScene(tctx, w, h, titleT, 'title');
  }
  function begin(fresh) {
    Sfx.init();
    if (fresh) { const snd = save.sound; save = newSave(); save.sound = snd; }
    $('#title').hidden = true;
    document.body.classList.add('playing');
    resize();
    mode = 'play';
    loadScreen(save.screen, save.px, save.py, 'down');
    if (fresh || !save.flags.woke) {
      if (save.screen === WD.START.screen) { player.x = WD.START.x * T + 16; player.y = WD.START.y * T + 16; }
      cinema(INTRO, () => autoEnter());
    }
  }

  /* ---------------- loop ---------------- */
  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    renderTitle(dt);
    if (mode !== 'title') { update(dt); render(); renderCinema(); }
    requestAnimationFrame(frame);
  }

  function init() {
    const stored = loadStored();
    if (stored) { save = Object.assign(newSave(), stored); $('#btn-continue').hidden = false; $('#continue-note').textContent = `${save.shards.length} of 5 memories · ${SCREENS[save.screen] ? SCREENS[save.screen].name : ''}`; }
    $('#btn-new').onclick = () => begin(true);
    $('#btn-continue').onclick = () => begin(false);
    const renderTitleCodex = () => { const b = $('#title-codex-body'); b.innerHTML = ''; b.appendChild(codexView(renderTitleCodex)); b.scrollTop = 0; };
    $('#btn-title-codex').onclick = () => { $('#title-codex').hidden = false; codexOpen = null; renderTitleCodex(); };
    $('#title-codex-close').onclick = () => { $('#title-codex').hidden = true; };
    $('#btn-title-install').onclick = doInstall;
    $('#install-help-close').onclick = () => { $('#install-help').hidden = true; };
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { menuTab = b.dataset.tab; codexOpen = null; Sfx.play('menu'); renderMenu(); });
    $('#menu-close').onclick = () => toggleMenu();
    bindTouch();
    window.addEventListener('resize', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    requestAnimationFrame(frame);
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache unavailable here */ });
    window.__yelamu = { get save() { return save; }, get cur() { return cur; }, get mode() { return mode; }, player, loadScreen, say };
  }
  init();
})();
