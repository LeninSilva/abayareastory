/* Open Your Eyes — engine */
(function () {
  'use strict';
  const A = window.OYE_ART, BUST = window.OYE_BUST, WD = window.OYE_WORLD, NOTES = window.OYE_NOTES;
  const CAST = WD.CAST, SCREENS = WD.SCREENS;
  const T = 32, COLS = 11, ROWS = 13, W = COLS * T, H = ROWS * T;
  const SOLID = 'WwqTPo^hBVDLn#~OX';
  const SOLID_OBJ = { block: 1, valve: 1, lantern: 1, crate: 1 };
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const PBOX = { hw: 9, top: -2, bot: 12 };          // player collision box around the body centre
  const SPEED = 104;
  const SAVE_KEY = 'oye-save-v1';
  const $ = s => document.querySelector(s);

  /* ---------------- save ---------------- */
  function newSave() {
    return { v: 1, flags: {}, minutes: [], met: {}, visited: {}, screen: WD.START.screen, px: WD.START.x, py: WD.START.y, sound: true, valetQuip: 0, done: false };
  }
  let save = newSave();
  function store() {
    if (cur && mode !== 'title') { const t = safeTile(); save.px = t[0]; save.py = t[1]; }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage unavailable */ }
  }
  function loadStored() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) return s; } catch (e) { /* ignore */ } return null; }

  /* ---------------- API for world scripts ---------------- */
  const g = {
    get save() { return save; },
    get objects() { return cur ? cur.objs : []; },
    minuteCount: () => save.minutes.length,
    giveMinute,
    say: (lines, cb) => say(lines, cb),
    sfx: n => Sfx.play(n),
    resetObjects() { buildObjects(); },
    reloadObjects() { buildObjects(); },
    refreshNpcs() { refreshNpcs(); },
    goRoom() { fadeTo(() => loadScreen('room', WD.ROOM_START.x, WD.ROOM_START.y, 'up')); },
    ending() { setTimeout(() => cinema(WD.ENDING, finishGame), 200); }
  };
  function hintList() { return WD.hints(g); }
  function objective() { return hintList()[0] || ''; }

  function giveMinute(n) {
    if (save.minutes.indexOf(n) >= 0) return;
    save.minutes.push(n); save.minutes.sort((a, b) => a - b); store();
    Sfx.play('minute'); flash();
    const m = WD.MINUTES[n];
    const lines = [['sys', `A minute comes back to me: ${m.title} a.m.`], ['me', m.text]];
    if (save.minutes.length === 6) lines.push(['me', 'Six minutes. I remember all of it now. The red coat under the awning. The valet said to come back to the Palace.']);
    say(lines);
    hud();
  }

  /* ---------------- audio ---------------- */
  const Sfx = {
    ac: null, out: null, noteT: 0, hornT: 12, beepT: 0,
    init() {
      if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); this.out = this.ac.createGain(); this.out.gain.value = 0.55; this.out.connect(this.ac.destination); } catch (e) { this.ac = null; }
    },
    tone(f, d, type, vol, slide, when) {
      if (!this.ac || !save.sound) return;
      const t0 = this.ac.currentTime + (when || 0), o = this.ac.createOscillator(), gn = this.ac.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + d);
      gn.gain.setValueAtTime(0.0001, t0); gn.gain.linearRampToValueAtTime(vol || 0.06, t0 + Math.min(0.03, d / 3)); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(gn); gn.connect(this.out); o.start(t0); o.stop(t0 + d + 0.05);
    },
    noise(d, vol, freq) {
      if (!this.ac || !save.sound) return;
      const n = Math.floor(this.ac.sampleRate * d), buf = this.ac.createBuffer(1, n, this.ac.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
      const s = this.ac.createBufferSource(), gn = this.ac.createGain(), fl = this.ac.createBiquadFilter();
      fl.type = 'bandpass'; fl.frequency.value = freq || 900; s.buffer = buf; gn.gain.value = vol || 0.06;
      s.connect(fl); fl.connect(gn); gn.connect(this.out); s.start();
    },
    play(name) {
      const pent = [392, 440, 523, 587, 659, 784];
      switch (name) {
        case 'blip': this.tone(520, 0.035, 'triangle', 0.02); break;
        case 'push': this.noise(0.18, 0.08, 300); break;
        case 'valve': this.noise(0.3, 0.07, 1400); this.tone(180, 0.2, 'triangle', 0.05, 120); break;
        case 'chime0': case 'chime1': case 'chime2': case 'chime3': this.tone(pent[+name.slice(-1) + 1] * 2, 0.9, 'sine', 0.06); break;
        case 'fail': this.tone(300, 0.35, 'triangle', 0.05, 180); break;
        case 'catch': this.tone(660, 0.08, 'square', 0.03); this.tone(880, 0.1, 'square', 0.03, null, 0.08); break;
        case 'minute': [523, 659, 784, 1047, 784, 1319].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.05, null, i * 0.12)); break;
        case 'drift': this.noise(0.8, 0.07, 500); this.tone(220, 0.8, 'sine', 0.04, 110); break;
        case 'door': this.tone(140, 0.25, 'triangle', 0.06, 90); break;
        case 'menu': this.tone(880, 0.05, 'triangle', 0.025); break;
        case 'hint': this.tone(660, 0.25, 'sine', 0.03, 990); break;
      }
    },
    ambient(dt, mood) {
      if (!this.ac || !save.sound) return;
      this.noteT -= dt; this.hornT -= dt; this.beepT -= dt;
      if (this.noteT <= 0) {
        this.noteT = 1.4 + Math.random() * 1.8;
        const sc = mood === 'room' ? [220, 262, 294, 330] : mood === 'park' ? [294, 330, 392, 440, 494] : [262, 294, 311, 392, 415];
        this.tone(sc[Math.floor(Math.random() * sc.length)] * (Math.random() < 0.3 ? 2 : 1), 2.6, 'sine', 0.018);
      }
      if ((mood === 'sea' || mood === 'fog') && this.hornT <= 0) { this.hornT = 22 + Math.random() * 10; this.tone(98, 2.2, 'sawtooth', 0.025); this.tone(82, 2.4, 'sawtooth', 0.02, null, 2.3); }
      if ((mood === 'hospital' || mood === 'room') && this.beepT <= 0) { this.beepT = 1.05; this.tone(988, 0.09, 'sine', mood === 'room' ? 0.03 : 0.02); pulse = 1; }
    }
  };
  let pulse = 0;

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
    sizeEncounter(); sizeCinema();
  }

  /* ---------------- screens ---------------- */
  let cur = null;
  const gridPos = key => { const m = /^(\d),(\d)$/.exec(key); return m ? [+m[1], +m[2]] : null; };
  function neighbor(key, dx, dy) { const p = gridPos(key); if (!p) return null; const k = (p[0] + dx) + ',' + (p[1] + dy); return SCREENS[k] ? k : null; }

  // px/py are tile coordinates, or pixel coordinates when `pixels` is true
  function loadScreen(key, px, py, dir, pixels) {
    const def = SCREENS[key];
    const map = def.map.map(r => r.split(''));
    const carve = (x, y) => { if (SOLID.indexOf(map[y][x]) >= 0) map[y][x] = def.ground === 'walk' ? 'k' : 'p'; };
    if (neighbor(key, -1, 0)) for (let y = 5; y <= 7; y++) carve(0, y);
    if (neighbor(key, 1, 0)) for (let y = 5; y <= 7; y++) carve(COLS - 1, y);
    if (neighbor(key, 0, -1)) for (let x = 4; x <= 6; x++) carve(x, 0);
    if (neighbor(key, 0, 1)) for (let x = 4; x <= 6; x++) carve(x, ROWS - 1);
    cur = { key, def, map, npcs: [], objs: [], drifters: [], fx: [], anim: [], t: 0, entry: null, driftCool: 0 };
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ('WwOL~'.indexOf(map[y][x]) >= 0) cur.anim.push([x, y, map[y][x]]);
    save.screen = key; save.visited[def.mapAs || key] = true;
    if (pixels) { player.x = px; player.y = py; } else { player.x = px * T + 16; player.y = py * T + 16; }
    if (dir) player.dir = dir;
    buildObjects();
    refreshNpcs();
    cur.drifters = (def.drifters || []).map((d, i) => ({ kind: 'drifter', x0: d.x * T + 16, y0: d.y * T + 16, x: d.x * T + 16, y: d.y * T + 16, axis: d.axis, range: d.range * T, s: 1, seed: i * 2.3 }));
    unstick();
    cur.entry = { x: player.x, y: player.y };
    layer = buildLayer(cur);
    showBanner(def.name, def.sub);
    hud();
  }
  function buildObjects() {
    if (!cur) return;
    const list = cur.def.objects ? cur.def.objects(g) : [];
    cur.objs = list.map(o => Object.assign({}, o, { x: o.tx * T + 16, y: o.ty * T + 16, dir: 'down', phase: 0, t: Math.random() * 3 }));
    for (const o of cur.objs) if (o.kind === 'block') o.onPlate = cur.map[o.ty][o.tx] === 'x';
  }
  function refreshNpcs() {
    if (!cur) return;
    const old = cur.npcs;
    cur.npcs = (cur.def.npcs || []).filter(n => !n.when || n.when(g)).map(n => {
      const prev = old.find(o => o.def === n);
      if (prev) return prev;
      const npc = { def: n, id: n.id, look: CAST[n.id], x: n.x * T + 16, y: n.y * T + 16, dir: n.dir || 'down', t: Math.random() * 5, passable: false };
      // Never materialise inside the player: let them walk out first.
      if (overlapsBox(player.x, player.y, PBOX, npc.x, npc.y)) npc.passable = true;
      return npc;
    });
  }
  const overlapsBox = (x, y, b, ox, oy) => Math.abs(ox - x) < b.hw + 10 && y + b.bot > oy - 2 && y + b.top < oy + 12;

  /* ---------------- collision ---------------- */
  function tileAt(tx, ty) { tx = Math.max(0, Math.min(COLS - 1, tx)); ty = Math.max(0, Math.min(ROWS - 1, ty)); return cur.map[ty][tx]; }
  const tileSolid = (tx, ty) => SOLID.indexOf(tileAt(tx, ty)) >= 0;
  function solidAt(x, y, b, ignore) {
    const x0 = Math.floor((x - b.hw) / T), x1 = Math.floor((x + b.hw - 0.01) / T), y0 = Math.floor((y + b.top) / T), y1 = Math.floor((y + b.bot - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileSolid(tx, ty)) return { tile: true };
    for (const o of cur.objs) if (SOLID_OBJ[o.kind] && o !== ignore && Math.abs(o.x - x) < b.hw + 11 && y + b.bot > o.y - 9 && y + b.top < o.y + 11) return { obj: o };
    for (const n of cur.npcs) if (!n.passable && n !== ignore && overlapsBox(x, y, b, n.x, n.y)) return { npc: n };
    return null;
  }
  const pBlocked = (x, y) => solidAt(x, y, PBOX);
  // Free the player if anything ever overlaps them (the old "stuck in the bushes" bug).
  function unstick() {
    if (!pBlocked(player.x, player.y)) return;
    for (let r = 4; r <= 128; r += 4) for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, nx = player.x + Math.cos(a) * r, ny = player.y + Math.sin(a) * r;
      if (nx < 10 || nx > W - 10 || ny < 4 || ny > H - 14) continue;
      if (!pBlocked(nx, ny)) { player.x = nx; player.y = ny; return; }
    }
  }
  function safeTile() {
    const tx = Math.max(0, Math.min(COLS - 1, Math.floor(player.x / T))), ty = Math.max(0, Math.min(ROWS - 1, Math.floor((player.y + 4) / T)));
    return [tx, ty];
  }

  function buildLayer(scr) {
    const c = document.createElement('canvas'); c.width = Math.round(W * scalePx); c.height = Math.round(H * scalePx);
    const x = c.getContext('2d'); x.setTransform(scalePx, 0, 0, scalePx, 0, 0);
    const m = scr.map;
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
      const get = (dx, dy) => { const yy = ty + dy, xx = tx + dx; return (m[yy] && m[yy][xx]) || m[ty][tx]; };
      A.drawTileStatic(x, m[ty][tx], tx, ty, get, scr.def);
    }
    for (const lm of scr.def.landmarks || []) if (!A.ANIMATED[lm.type]) A.drawLandmark(x, lm, 0);
    return c;
  }

  /* ---------------- player ---------------- */
  const player = { x: 0, y: 0, dir: 'down', phase: 0, moving: false, pushT: 0 };

  /* ---------------- input ---------------- */
  const keys = { up: 0, down: 0, left: 0, right: 0 };
  const touchDir = { x: 0, y: 0 };
  let pressA = false, pressB = false;
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const A_KEYS = ['KeyA', 'KeyZ', 'Space', 'KeyJ'], B_KEYS = ['KeyB', 'KeyX', 'KeyK'];
  window.addEventListener('keydown', e => {
    if (e.repeat && !KEYMAP[e.code]) return;
    Sfx.init();
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = 1; if (dlg.open && dlg.choices && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) moveChoice(e.code); if (mode !== 'title' && mode !== 'menu') e.preventDefault(); }
    if (A_KEYS.indexOf(e.code) >= 0) { pressA = true; e.preventDefault(); }
    if (B_KEYS.indexOf(e.code) >= 0) { pressB = true; e.preventDefault(); }
    if (e.code === 'Enter') { if (dlg.open || mode === 'cinema') pressA = true; else if (mode === 'play') toggleMenu(); e.preventDefault(); }
    if (e.code === 'KeyM' || e.code === 'Escape') { if (mode === 'play' || mode === 'menu') toggleMenu(); }
  });
  window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = 0; });
  window.addEventListener('blur', () => { keys.up = keys.down = keys.left = keys.right = 0; touchDir.x = touchDir.y = 0; });

  function bindTouch() {
    const pad = $('#dpad'), knob = $('#dpad-knob');
    let pid = null;
    const setFrom = ev => {
      const r = pad.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = ev.clientX - cx, dy = ev.clientY - cy; const d = Math.hypot(dx, dy), max = r.width * 0.34;
      if (d < r.width * 0.1) { touchDir.x = touchDir.y = 0; } else { touchDir.x = dx / d; touchDir.y = dy / d; }
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
    const tapAdvance = () => { Sfx.init(); if ((dlg.open && !dlg.choices) || mode === 'cinema') pressA = true; };
    $('#stage').addEventListener('pointerdown', tapAdvance);
    $('#cinema').addEventListener('pointerdown', e => { e.preventDefault(); tapAdvance(); });
  }

  /* ---------------- dialogue & first-person encounters ---------------- */
  const dlg = { open: false, queue: [], line: null, shown: 0, choices: null, sel: 0, onDone: null, subject: null };
  const ectx = $('#enc').getContext('2d');
  const VOICES = { me: 1, sys: 1, narrator: 1, sign: 1 };
  function say(lines, onDone, subject) {
    if (dlg.open) { dlg.queue.unshift(...lines); if (onDone) { const prev = dlg.onDone; dlg.onDone = () => { prev && prev(); onDone(); }; } return; }
    dlg.open = true; dlg.queue = lines.slice(); dlg.onDone = onDone || null; dlg.subject = subject || null; mode = 'dialog';
    $('#dialog').hidden = false; nextLine(); sizeEncounter();
  }
  function nextLine() {
    dlg.choices = null; $('#choices').innerHTML = '';
    while (dlg.queue.length && dlg.queue[0] && dlg.queue[0].do) { const a = dlg.queue.shift(); a.do(g); if (!dlg.open) return; }
    if (!dlg.queue.length) return closeDialog();
    const l = dlg.queue.shift();
    dlg.line = Array.isArray(l) ? { who: l[0], text: l[1] } : { who: l.who, text: l.ask, ask: l };
    dlg.shown = 0;
    const who = dlg.line.who;
    if (!VOICES[who] && CAST[who]) { dlg.subject = who; save.met[who] = true; }
    const look = CAST[who] || CAST.sys;
    $('#speaker').textContent = VOICES[who] ? '' : look.name;
    const d = $('#dialog');
    d.classList.toggle('thought', who === 'me');
    d.classList.toggle('narr', who === 'narrator');
    d.classList.toggle('desc', who === 'sys' || who === 'sign');
    d.classList.toggle('compact', !dlg.subject);
  }
  function closeDialog() {
    dlg.open = false; $('#dialog').hidden = true; if (mode === 'dialog') mode = 'play';
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
    const n = dlg.choices.length; dlg.sel = (dlg.sel + (code === 'ArrowUp' ? n - 1 : 1)) % n;
    [...$('#choices').children].forEach((c, i) => c.classList.toggle('sel', i === dlg.sel)); Sfx.play('menu');
  }
  function pick(i) { const a = dlg.line.ask; const more = a.then(g, i) || []; dlg.queue.unshift(...more); Sfx.play('menu'); nextLine(); }
  function updateDialog(dt) {
    const full = dlg.line.text;
    if (dlg.shown < full.length) {
      const before = Math.floor(dlg.shown); dlg.shown = Math.min(full.length, dlg.shown + dt * 55);
      if (Math.floor(dlg.shown) !== before && before % 3 === 0 && full[before] !== ' ' && dlg.line.who !== 'narrator') Sfx.play('blip');
      if (dlg.shown >= full.length && dlg.line.ask) showChoices();
    }
    $('#dtext').textContent = full.slice(0, Math.floor(dlg.shown));
    $('#dnext').style.visibility = dlg.shown >= full.length && !dlg.choices ? 'visible' : 'hidden';
    if (pressA) {
      if (dlg.shown < full.length) { dlg.shown = full.length; $('#dtext').textContent = full; if (dlg.line.ask) showChoices(); }
      else if (dlg.choices) pick(dlg.sel);
      else nextLine();
    }
  }
  function sizeEncounter() {
    const c = $('#enc'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (w && h && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; }
  }
  function renderEncounter() {
    if (!dlg.open || !dlg.subject || !cur) return;
    const c = $('#enc'); sizeEncounter();
    const who = dlg.line ? dlg.line.who : null;
    BUST.drawEncounter(ectx, c.width, c.height, CAST[dlg.subject], cur.def.bg, cur.t, who === 'me');
  }

  /* ---------------- update ---------------- */
  let mode = 'title';
  let hintIdx = 0;
  function update(dt) {
    if (!cur) return;
    cur.t += dt; pulse = Math.max(0, pulse - dt * 2.5);
    Sfx.ambient(dt, cur.def.mood);
    if (mode === 'dialog') { updateDialog(dt); pressA = pressB = false; return; }
    if (mode === 'trans') { updateTrans(dt); return; }
    if (mode === 'cinema') { updateCinema(dt); pressA = pressB = false; return; }
    if (mode !== 'play') { pressA = pressB = false; return; }

    let vx = keys.right - keys.left + touchDir.x, vy = keys.down - keys.up + touchDir.y;
    const mag = Math.hypot(vx, vy); if (mag > 1) { vx /= mag; vy /= mag; }
    player.moving = mag > 0.2;
    if (player.moving) {
      if (Math.abs(vx) > Math.abs(vy) + 0.12) player.dir = vx < 0 ? 'left' : 'right';
      else if (Math.abs(vy) > Math.abs(vx) + 0.12) player.dir = vy < 0 ? 'up' : 'down';
      player.phase = (player.phase + dt * 3.4) % 1;
      const sp = SPEED * dt;
      const bx = tryMove(vx * sp, 0, vy), by = tryMove(0, vy * sp, vx);
      handlePush(dt, bx || by);
    } else { player.phase = 0; player.pushT = 0; }
    for (const n of cur.npcs) if (n.passable && !overlapsBox(player.x, player.y, PBOX, n.x, n.y)) n.passable = false;
    unstick();

    if (edgeExit()) return;

    if (pressA) interact();
    if (pressB) { const h = hintList(); Sfx.play('hint'); say([['me', h[hintIdx++ % h.length]]]); }
    pressA = pressB = false;

    updateObjects(dt);
    updateDrifters(dt);
    for (const n of cur.npcs) n.t += dt;
  }
  // Move along one axis. Returns what blocked the move, if anything.
  function tryMove(dx, dy, other) {
    if (!dx && !dy) return null;
    const nx = player.x + dx, ny = player.y + dy;
    const hit = pBlocked(nx, ny);
    if (!hit) { player.x = nx; player.y = ny; return null; }
    // corner assist: slip around the edge of a tile or person when mostly clear
    if (Math.abs(other || 0) < 0.35 && !hit.obj) {
      for (let o = 1; o <= 12; o++) for (const s of [1, -1]) {
        const ox = dy ? s * o : 0, oy = dx ? s * o : 0;
        if (!pBlocked(nx + ox, ny + oy) && !pBlocked(player.x + ox, player.y + oy)) {
          const step = Math.min(Math.abs(dx || dy), 1.8) * s;
          if (dx) { if (!pBlocked(player.x, player.y + step)) player.y += step; } else if (!pBlocked(player.x + step, player.y)) player.x += step;
          return hit;
        }
      }
    }
    return hit;
  }
  function handlePush(dt, hit) {
    const o = hit && hit.obj;
    if (!o || o.kind !== 'block' || o.anim) { player.pushT = 0; return; }
    const [dx, dy] = DIRS[player.dir];
    const facing = dx ? (Math.sign(o.x - player.x) === dx && Math.abs(player.y - o.y) <= 12) : (Math.sign(o.y - player.y) === dy && Math.abs(player.x - o.x) <= 12);
    if (!facing) { player.pushT = 0; return; }
    player.pushT += dt;
    if (player.pushT < 0.2) return;
    player.pushT = 0;
    const tx = o.tx + dx, ty = o.ty + dy;
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || tileSolid(tx, ty)) return;
    const cx = tx * T + 16, cy = ty * T + 16;
    if (cur.objs.some(p => p !== o && SOLID_OBJ[p.kind] && p.tx === tx && p.ty === ty)) return;
    if (cur.npcs.some(n => Math.abs(n.x - cx) < 20 && Math.abs(n.y - cy) < 20)) return;
    o.anim = { fx: o.x, fy: o.y, t: 0 }; o.tx = tx; o.ty = ty; Sfx.play('push');
  }
  function edgeExit() {
    const exits = [[player.x < 0, -1, 0], [player.x > W, 1, 0], [player.y < -2, 0, -1], [player.y > H - 10, 0, 1]];
    for (const [hit, dx, dy] of exits) if (hit) { const nk = neighbor(cur.key, dx, dy); if (nk) { startTrans(nk, dx, dy); return true; } }
    if (!neighbor(cur.key, -1, 0)) player.x = Math.max(10, player.x);
    if (!neighbor(cur.key, 1, 0)) player.x = Math.min(W - 10, player.x);
    if (!neighbor(cur.key, 0, -1)) player.y = Math.max(4, player.y);
    if (!neighbor(cur.key, 0, 1)) player.y = Math.min(H - 14, player.y);
    return false;
  }
  function interact() {
    const [dx, dy] = DIRS[player.dir];
    const fx = player.x + dx * 22, fy = player.y + 4 + dy * 22;
    let best = null, bd = 1e9;
    for (const n of cur.npcs) { const d = Math.hypot(n.x - fx, n.y + 4 - fy); if (d < (n.def.reach || 22) && d < bd) { best = { npc: n }; bd = d; } }
    for (const o of cur.objs) if (SOLID_OBJ[o.kind] && o.kind !== 'block') { const d = Math.hypot(o.x - fx, o.y - fy); if (d < 22 && d < bd) { best = { obj: o }; bd = d; } }
    if (!best) for (const n of cur.npcs) { const d = Math.hypot(n.x - player.x, n.y - player.y); if (d < 30 && d < bd) { best = { npc: n }; bd = d; } }
    if (best && best.npc) return talkTo(best.npc);
    if (best && best.obj) { if (cur.def.onObject) cur.def.onObject(g, best.obj); return; }
    const tx = Math.floor(fx / T), ty = Math.floor(fy / T);
    if (tileAt(tx, ty) === 'D') {
      Sfx.play('door');
      const h = cur.def.doors && cur.def.doors[tx + ',' + ty];
      say(h ? h(g) : [['sys', 'Locked. Through the glass: an empty room, and a clock at 5:12.']]);
    }
  }
  function talkTo(n) {
    const lines = n.def.talk ? n.def.talk(g) : [];
    if (!lines || !lines.length) return;
    const look = n.look || {};
    if (look.kind !== 'voice') {
      const dx = player.x - n.x, dy = player.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    }
    save.met[n.id] = true;
    say(lines, null, look.kind === 'voice' ? null : n.id);
  }

  /* ---------------- objects: blocks, dogs, drifters ---------------- */
  function updateObjects(dt) {
    for (const o of cur.objs.slice()) {
      o.t += dt;
      if (o.anim) {
        o.anim.t += dt / 0.14;
        const k = Math.min(1, o.anim.t), tx = o.tx * T + 16, ty = o.ty * T + 16;
        o.x = o.anim.fx + (tx - o.anim.fx) * k; o.y = o.anim.fy + (ty - o.anim.fy) * k;
        if (k >= 1) { o.anim = null; o.onPlate = cur.map[o.ty][o.tx] === 'x'; if (cur.def.onPush) cur.def.onPush(g); }
      }
      if (o.kind === 'dog') updateDog(o, dt);
      if (mode !== 'play') return;
    }
  }
  function dogFree(tx, ty, self) {
    const r = cur.def.dogRegion;
    if (r && (tx < r.x0 || tx > r.x1 || ty < r.y0 || ty > r.y1)) return false;
    if (tileSolid(tx, ty)) return false;
    if (cur.objs.some(o => o !== self && o.kind === 'dog' && o.tx === tx && o.ty === ty)) return false;
    return !cur.npcs.some(n => Math.floor(n.x / T) === tx && Math.floor(n.y / T) === ty);
  }
  function updateDog(o, dt) {
    const pd = Math.hypot(player.x - o.x, player.y - o.y);
    if (pd < 22) { cur.objs = cur.objs.filter(x => x !== o); save.met[o.id] = true; Sfx.play('catch'); if (cur.def.onCatch) cur.def.onCatch(g, o); return; }
    const scared = pd < 96;
    const tx = o.tx * T + 16, ty = o.ty * T + 16;
    if (Math.hypot(tx - o.x, ty - o.y) < 1.5) {
      o.x = tx; o.y = ty;
      o.wait = (o.wait || 0) - dt;
      if (scared || o.wait <= 0) {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => dogFree(o.tx + dx, o.ty + dy, o));
        let choice = null;
        if (opts.length && scared) {
          // flee to the neighbouring tile farthest from me; with nowhere better to go, the dog is cornered
          let best = -1; for (const [dx, dy] of opts) { const d = Math.hypot((o.tx + dx) * T + 16 - player.x, (o.ty + dy) * T + 16 - player.y); if (d > best) { best = d; choice = [dx, dy]; } }
          if (best < pd - 4) choice = null;
        } else if (opts.length) choice = opts[Math.floor(Math.random() * opts.length)];
        if (choice) { o.tx += choice[0]; o.ty += choice[1]; if (choice[0]) o.dir = choice[0] < 0 ? 'left' : 'right'; }
        o.wait = scared ? 0 : 0.8 + Math.random() * 1.5;
      }
    } else {
      const sp = (scared ? 84 : 36) * dt, d = Math.hypot(tx - o.x, ty - o.y);
      o.x += (tx - o.x) / d * Math.min(sp, d); o.y += (ty - o.y) / d * Math.min(sp, d);
      o.phase = (o.phase + dt * 5) % 1;
    }
  }
  function updateDrifters(dt) {
    cur.driftCool = Math.max(0, cur.driftCool - dt);
    for (const d of cur.drifters) {
      if (d.axis === 'h') { d.x += d.s * 26 * dt; if (Math.abs(d.x - d.x0) > d.range) d.s = -d.s; }
      else { d.y += d.s * 26 * dt; if (Math.abs(d.y - d.y0) > d.range) d.s = -d.s; }
      if (cur.driftCool <= 0 && Math.hypot(player.x - d.x, player.y - d.y) < 16) {
        cur.driftCool = 2.5; Sfx.play('drift');
        const first = !save.flags.driftedOnce; save.flags.driftedOnce = true;
        fadeTo(() => { player.x = cur.entry.x; player.y = cur.entry.y; unstick(); }, first ? [['sys', 'The grey figure passes through me. For a second I forget why I came here, and then I\'m back where I walked in.']] : null);
        return;
      }
    }
  }

  /* ---------------- transitions ---------------- */
  let trans = null;
  function startTrans(nk, dx, dy) {
    prevLayer = layer;
    const fromX = player.x, fromY = player.y;
    let nx = player.x, ny = player.y;
    if (dx === -1) nx = W - 12; if (dx === 1) nx = 12; if (dy === -1) ny = H - 16; if (dy === 1) ny = 6;
    loadScreen(nk, nx, ny, null, true);
    trans = { dx, dy, t: 0, dur: 0.45, fromX, fromY, toX: player.x, toY: player.y };
    mode = 'trans'; store();
  }
  function updateTrans(dt) { trans.t += dt; if (trans.t >= trans.dur) { trans = null; prevLayer = null; mode = 'play'; autoEnter(); } }
  // Fade out, run fn, fade in; then optionally say something.
  function fadeTo(fn, after) {
    const f = $('#fade'); f.classList.add('on'); mode = 'fading';
    setTimeout(() => { fn(); f.classList.remove('on'); mode = 'play'; store(); if (after) say(after); else autoEnter(); }, 380);
  }
  function autoEnter() {
    if (mode !== 'play') return;
    const oe = cur.def.onEnter && cur.def.onEnter(g);
    if (oe) { const n = cur.npcs.find(n => n.id === oe); if (n) talkTo(n); }
  }
  function flash() { const f = $('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

  /* ---------------- render ---------------- */
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0c1117'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!cur || !layer) return;
    if (mode === 'trans' && trans) {
      const p = easeInOut(Math.min(1, trans.t / trans.dur));
      const ox = trans.dx * W, oy = trans.dy * H;
      if (prevLayer) ctx.drawImage(prevLayer, -ox * p * scalePx, -oy * p * scalePx);
      ctx.drawImage(layer, ox * (1 - p) * scalePx, oy * (1 - p) * scalePx);
      ctx.setTransform(scalePx, 0, 0, scalePx, 0, 0);
      const px = trans.toX + ox * (1 - p), py = trans.toY + oy * (1 - p);   // entry point, in new-screen space
      const sx = trans.fromX - ox * p, sy = trans.fromY - oy * p;             // exit point, in old-screen space
      drawPlayer(sx + (px - sx) * p, sy + (py - sy) * p);
      atmosphere();
      return;
    }
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(scalePx, 0, 0, scalePx, 0, 0);
    const t = cur.t;
    for (const [x, y, ch] of cur.anim) A.drawTileAnim(ctx, ch, x, y, t);
    const st = { valves: cur.objs.filter(o => o.kind === 'valve').map(o => o.on) };
    for (const lm of cur.def.landmarks || []) if (A.ANIMATED[lm.type]) A.drawLandmark(ctx, lm, t, st);
    const ents = [];
    for (const n of cur.npcs) ents.push({ y: n.y, draw: () => A.drawPerson(ctx, n.x, n.y, n.look, n.dir, 0, { t: n.t }) });
    for (const o of cur.objs) ents.push({ y: o.y, draw: () => o.kind === 'dog' ? A.drawPerson(ctx, o.x, o.y, CAST[o.id], o.dir, o.phase, { t: o.t }) : A.drawObject(ctx, o, t) });
    for (const d of cur.drifters) ents.push({ y: d.y, draw: () => A.drawObject(ctx, d, t) });
    ents.push({ y: player.y, draw: () => drawPlayer(player.x, player.y) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    atmosphere();
  }
  function atmosphere() {
    const t = cur.t, mood = cur.def.mood;
    // drifting fog bands: the plane is always a little out of focus
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = mood === 'fog' ? 0.1 : 0.055; A.ell(ctx, ((t * 7 + i * 120) % (W + 200)) - 100, 40 + i * 110, 130, 30, '#eef1f2'); }
    ctx.globalAlpha = 1;
    if (mood === 'room') { ctx.fillStyle = 'rgba(40,10,20,.18)'; ctx.fillRect(0, 0, W, H); }
    if (pulse > 0 && (mood === 'hospital' || mood === 'room')) { ctx.fillStyle = `rgba(255,255,255,${pulse * 0.06})`; ctx.fillRect(0, 0, W, H); }
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(8,12,18,0)'); v.addColorStop(1, 'rgba(8,12,18,.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function drawPlayer(x, y) { A.drawPerson(ctx, x, y, CAST.me, player.dir, player.moving ? player.phase : 0, { solid: true, t: cur.t }); }
  const easeInOut = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

  /* ---------------- HUD ---------------- */
  function hud() {
    const pips = $('#pips'); pips.innerHTML = '';
    for (let n = 7; n <= 12; n++) { const s = document.createElement('span'); s.className = 'pip' + (save.minutes.indexOf(n) >= 0 ? ' on' : ''); s.title = '5:' + String(n).padStart(2, '0'); pips.appendChild(s); }
    $('#place').textContent = cur ? cur.def.name : '';
    $('#objective').textContent = objective();
  }
  let bannerTimer = 0;
  function showBanner(name, sub) {
    const b = $('#banner'); $('#banner-name').textContent = name; $('#banner-sub').textContent = sub || '';
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('show'), 2200);
  }

  /* ---------------- cinema (prologue / ending) ---------------- */
  const cin = { items: [], i: 0, shown: 0, t: 0, onDone: null };
  const cctx = $('#cinema-canvas').getContext('2d');
  function sizeCinema() { const c = $('#cinema-canvas'), dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.round(c.clientWidth * dpr) || 10; c.height = Math.round(c.clientHeight * dpr) || 10; }
  function cinema(items, onDone) {
    cin.items = items; cin.i = 0; cin.onDone = onDone; mode = 'cinema';
    $('#cinema').hidden = false; sizeCinema(); setCinemaLine();
  }
  function setCinemaLine() { const it = cin.items[cin.i]; cin.shown = 0; $('#cinema').classList.toggle('narr', !!it.narr); $('#cinema').classList.toggle('white', it.art === 'white'); }
  function updateCinema(dt) {
    cin.t += dt;
    const full = cin.items[cin.i].text;
    cin.shown = Math.min(full.length, cin.shown + dt * 42);
    $('#cin-text').textContent = full.slice(0, Math.floor(cin.shown));
    if (pressA) {
      if (cin.shown < full.length) cin.shown = full.length;
      else if (++cin.i >= cin.items.length) { $('#cinema').hidden = true; mode = 'play'; const cb = cin.onDone; cin.onDone = null; cb && cb(); }
      else setCinemaLine();
    }
  }
  function renderCinema() {
    if (mode !== 'cinema') return;
    const c = $('#cinema-canvas');
    cctx.setTransform(1, 0, 0, 1, 0, 0);
    A.drawScene(cctx, c.width, c.height, cin.t, cin.items[cin.i].art);
  }
  function finishGame() {
    save.done = true; save.screen = WD.START.screen; save.px = WD.START.x; save.py = WD.START.y + 1;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
    mode = 'title'; cur = null;
    document.body.classList.remove('playing'); $('#title').hidden = false;
    $('#title-end').hidden = false; $('#btn-continue').hidden = false; $('#continue-note').textContent = 'Walk the city again';
  }

  /* ---------------- menu ---------------- */
  let menuTab = 'journal', noteOpen = null;
  function toggleMenu() {
    const m = $('#menu');
    if (mode === 'menu') { m.hidden = true; mode = 'play'; Sfx.play('menu'); return; }
    mode = 'menu'; m.hidden = false; Sfx.play('menu'); renderMenu();
  }
  function renderMenu() {
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === menuTab ? 'true' : 'false'));
    const body = $('#menu-body'); body.innerHTML = '';
    body.appendChild({ journal: journalView, map: mapView, minutes: minutesView, notes: notesView }[menuTab]());
    body.scrollTop = 0;
  }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function journalView() {
    const v = el('div', 'journal');
    v.appendChild(el('p', 'eyebrow', 'What I should do'));
    const hs = hintList();
    v.appendChild(el('p', 'objective-big', esc(hs[0] || '')));
    if (hs.length > 1) { const ul = el('ul', 'todo'); hs.slice(1).forEach(h => ul.appendChild(el('li', '', esc(h)))); v.appendChild(ul); }
    v.appendChild(el('p', 'eyebrow', 'Controls'));
    v.appendChild(el('p', 'small', 'Touch: drag the pad to walk. A talks, uses and opens. Walk into a keg to push it. B is a thought: a hint about what to try. Keyboard: arrow keys, A (or Z / Space), B (or X), M for this menu.'));
    const row = el('div', 'row');
    const snd = el('button', 'pill', save.sound ? 'Sound: on' : 'Sound: off'); snd.id = 'opt-sound';
    snd.onclick = () => { save.sound = !save.sound; store(); snd.textContent = save.sound ? 'Sound: on' : 'Sound: off'; };
    row.appendChild(snd);
    const inst = el('button', 'pill', 'Install app'); inst.id = 'opt-install'; inst.onclick = doInstall; row.appendChild(inst);
    const reset = el('button', 'pill danger', 'Start over'); reset.id = 'opt-reset';
    reset.onclick = () => { if (reset.dataset.armed) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } location.reload(); } else { reset.dataset.armed = '1'; reset.textContent = 'Tap again to erase your progress'; } };
    row.appendChild(reset);
    v.appendChild(row);
    return v;
  }
  function mapView() {
    const v = el('div', 'mapview');
    v.appendChild(el('p', 'small', 'The peninsula, north at the top: the Golden Gate and the bay above, the Pacific and the fog to the west.'));
    const grid = el('div', 'mapgrid');
    const here = cur.def.mapAs || cur.key;
    const where = { 7: '3,1', 8: '3,0', 9: '2,0', 10: '0,0', 11: '1,0', 12: '4,3' };
    for (let r = 0; r < WD.GRID_H; r++) for (let c = 0; c < WD.GRID_W; c++) {
      const k = c + ',' + r, s = SCREENS[k], seen = save.visited[k];
      const cell = el('div', 'cell' + (seen ? ' seen' : '') + (k === here ? ' here' : ''));
      cell.appendChild(el('span', 'nm', seen ? esc(s.name) : '· · ·'));
      for (const n in where) if (where[n] === k && save.minutes.indexOf(+n) >= 0) cell.appendChild(el('span', 'gem', ''));
      if (k === here) cell.appendChild(el('span', 'you', 'Me'));
      grid.appendChild(cell);
    }
    v.appendChild(grid);
    return v;
  }
  function minutesView() {
    const v = el('div', 'memories');
    v.appendChild(el('p', 'small', 'The six minutes before 5:12, in order. Each one was being held by someone in the city.'));
    for (let n = 7; n <= 12; n++) {
      const m = WD.MINUTES[n], got = save.minutes.indexOf(n) >= 0;
      const card = el('article', 'memory' + (got ? '' : ' locked'));
      card.appendChild(el('h3', '', got ? esc(m.title) + ' a.m.' : '5:— a.m.'));
      card.appendChild(el('p', 'eyebrow', got ? 'Returned by ' + esc(m.place) : 'Still missing'));
      if (got) card.appendChild(el('p', '', esc(m.text)));
      v.appendChild(card);
    }
    return v;
  }
  function notesView() {
    const v = el('div', 'codex');
    const open = NOTES.filter(n => n.always || save.met[n.id]);
    if (!noteOpen) {
      v.appendChild(el('p', 'small', `The real history behind the people I meet. ${open.length} of ${NOTES.length} notes. A note appears when I first talk to someone.`));
      const list = el('div', 'codex-list');
      for (const n of NOTES) {
        const unlocked = n.always || save.met[n.id];
        const b = el('button', 'codex-item' + (unlocked ? '' : ' locked')); b.id = 'note-' + n.id;
        b.innerHTML = unlocked ? `<span class="ci-kind">${esc(n.kind)}</span><span class="ci-title">${esc(n.title)}</span>` : '<span class="ci-kind">Not yet met</span><span class="ci-title">· · ·</span>';
        if (unlocked) b.onclick = () => { noteOpen = n.id; renderMenu(); }; else b.disabled = true;
        list.appendChild(b);
      }
      v.appendChild(list); return v;
    }
    const n = NOTES.find(x => x.id === noteOpen);
    const back = el('button', 'pill', '← All notes'); back.id = 'note-back'; back.onclick = () => { noteOpen = null; renderMenu(); };
    v.appendChild(back);
    v.appendChild(el('p', 'eyebrow note-kind', esc(n.kind)));
    v.appendChild(el('h2', 'codex-title', esc(n.title)));
    n.text.forEach(p => v.appendChild(el('p', 'note-p', esc(p))));
    return v;
  }

  /* ---------------- install ---------------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
  function doInstall() {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; }); return; }
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
    if (save.screen === 'room' && save.done) save.screen = WD.START.screen;
    $('#title').hidden = true; document.body.classList.add('playing');
    resize();
    mode = 'play';
    loadScreen(save.screen, save.px, save.py, 'down');
    if (fresh) cinema(WD.PROLOGUE, () => autoEnter());
    else autoEnter();
  }

  /* ---------------- loop ---------------- */
  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    renderTitle(dt);
    if (mode !== 'title') { update(dt); render(); renderEncounter(); renderCinema(); }
    requestAnimationFrame(frame);
  }

  function init() {
    const stored = loadStored();
    if (stored) {
      save = Object.assign(newSave(), stored);
      $('#btn-continue').hidden = false;
      $('#continue-note').textContent = save.done ? 'Walk the city again' : `${save.minutes.length} of 6 minutes · ${SCREENS[save.screen] ? SCREENS[save.screen].name : ''}`;
      if (save.done) $('#title-end').hidden = false;
    }
    $('#btn-new').onclick = () => begin(true);
    $('#btn-continue').onclick = () => begin(false);
    $('#btn-title-install').onclick = doInstall;
    $('#install-help-close').onclick = () => { $('#install-help').hidden = true; };
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { menuTab = b.dataset.tab; noteOpen = null; Sfx.play('menu'); renderMenu(); });
    $('#menu-close').onclick = () => toggleMenu();
    bindTouch();
    window.addEventListener('resize', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    requestAnimationFrame(frame);
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache unavailable here */ });
    window.__oye = { get save() { return save; }, get cur() { return cur; }, get mode() { return mode; }, player, loadScreen, say, g };
  }
  init();
})();
