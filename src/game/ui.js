// Everything on the glass: HUD, compass, minimap, speedometer, race clock, the case file, goals and achievements,
// field notes, settings, conversations, examinations and story cards. Every button is a real <button>.
import { CHARACTERS } from './story.js';
import { CLUES, CHAPTERS } from './quests.js';
import { NOTES, ACHIEVEMENTS, PAGES } from './lore.js';
import { PLACES } from '../geo.js';
import { parseTags } from './dialogue.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const LANDMARK_IDS = ['jardin', 'parroquia', 'biblioteca', 'presidencia', 'plazaSur', 'casaLC', 'portada', 'estadio', 'feria', 'bosque', 'museo', 'monumento', 'guadalupe', 'cayetano', 'santaAnita', 'toros', 'cumbre'];

export class UI {
  constructor(game) {
    this.g = game; this.tab = 'map'; this.mapView = null; this.subT = 0; this.promptTarget = null;
    this._menuWiring(); this._dialogueWiring(); this._mapWiring();
    $('btn-pause').addEventListener('click', () => this.openMenu('map'));
    $('stuck').addEventListener('click', () => { this.g.player.rescue(); this.toast('You find your footing on the street.', 'good'); });
    $('card-next').addEventListener('click', () => this._cardNext());
    $('card').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._cardNext(); } });
  }
  /* ---------------- HUD ---------------- */
  showHUD(on) { $('hud').hidden = !on; $('touch').hidden = !on || !this.g.touchUI(); }
  toast(text, kind = '') {
    const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = text; $('toasts').appendChild(el);
    setTimeout(() => el.remove(), kind === 'quest' || kind === 'ach' ? 6000 : 4200);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  }
  achievement(a) {
    const el = document.createElement('div'); el.className = 'ach-pop'; el.innerHTML = `<small>LOGRO · ACHIEVEMENT</small><b>${esc(a.name)}</b><span>${esc(a.desc)}</span>`;
    $('hud').appendChild(el); setTimeout(() => el.classList.add('out'), 4200); setTimeout(() => el.remove(), 5000);
  }
  subtitle(who, text, secs = 7) { const s = $('subtitle'); s.innerHTML = `<small>${esc(who)}</small>${esc(text)}`; s.hidden = false; this.subT = secs; }
  prompt(target) {
    this.promptTarget = target;
    const p = $('prompt'), tb = $('tb-interact');
    if (!target) { p.hidden = true; tb.classList.remove('ready'); tb.textContent = 'E'; return; }
    p.hidden = false; p.innerHTML = `<kbd>E</kbd>${esc(target.label)}`;
    tb.classList.add('ready'); tb.textContent = target.icon || 'E';
  }
  speedo(info) {
    const el = $('jetinfo'); if (!info) { if (!el.hidden) el.hidden = true; return; }
    this._spT = (this._spT || 0) + 1; if (!el.hidden && this._spT % 5) return;
    el.hidden = false; el.textContent = info;
  }
  raceInfo(text) { const el = $('raceinfo'); if (!text) { el.hidden = true; return; } el.hidden = false; el.textContent = text; }
  update(dt) {
    const g = this.g, st = g.state, p = g.player;
    if (this.subT > 0) { this.subT -= dt; if (this.subT <= 0) $('subtitle').hidden = true; }
    $('place-name').textContent = g.placeName();
    const h = st.hour, hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    $('clock').textContent = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'} · ${['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday'][(st.day - 1) % 7]}`;
    const obj = g.objective();
    $('objective').innerHTML = obj ? `<b>${esc(obj.title.toUpperCase())}</b><br>${esc(obj.text)}${obj.dist != null ? ` <span style="opacity:.7">· ${fmtDist(obj.dist)}</span>` : ''}` : '';
    $('stuck').hidden = !(p.stuckTime > 2.5) || !!g.vehicles.driving;
    this._compass(); this._minimap();
  }
  _compass() {
    const g = this.g, p = g.player, strip = $('compass-strip'), W = $('compass').clientWidth, fov = Math.PI * 0.9;
    const items = [['N', 0, 'card'], ['NE', Math.PI / 4, ''], ['E', Math.PI / 2, 'card'], ['SE', Math.PI * 0.75, ''], ['S', Math.PI, 'card'], ['SW', Math.PI * 1.25, ''], ['W', Math.PI * 1.5, 'card'], ['NW', Math.PI * 1.75, '']];
    const wp = g.waypoint(); if (wp) items.push(['◆', Math.atan2(wp.x - p.x, -(wp.z - p.z)), 'wp']);
    const heading = -g.viewYaw();
    let html = '';
    for (const [lab, b, cls] of items) { let d = b - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) > fov / 2) continue; html += `<span class="${cls}" style="left:${(d / fov) * W}px">${lab}</span>`; }
    strip.innerHTML = html;
  }
  _minimap() {
    const g = this.g, p = g.player, cv = $('minimap'), c = cv.getContext('2d'), S = cv.width;
    const speed = g.vehicles.driving ? Math.abs(g.vehicles.driving.speed) : p.jet ? p.speed : 0, R = 220 + Math.min(900, speed * 12);
    c.save(); c.clearRect(0, 0, S, S);
    c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); c.clip();
    c.fillStyle = 'rgba(40,60,34,0.9)'; c.fillRect(0, 0, S, S);
    c.translate(S / 2, S / 2); c.rotate(g.viewYaw()); const k = (S / 2) / R;
    const img = g.mapImage(), mb = g.mapBox;
    if (img) { c.save(); c.scale(k, k); c.drawImage(img, mb.x0 - p.x, mb.z0 - p.z, mb.x1 - mb.x0, mb.z1 - mb.z0); c.restore(); }
    const dot = (x, z, col, r = 4) => { let X = (x - p.x) * k, Y = (z - p.z) * k; const d = Math.hypot(X, Y), m = S / 2 - 8; if (d > m) { X *= m / d; Y *= m / d; } c.fillStyle = col; c.beginPath(); c.arc(X, Y, r, 0, Math.PI * 2); c.fill(); };
    for (const n of g.npcs) if (n.visible && !n.def.ambient && Math.hypot(n.x - p.x, n.z - p.z) < R * 1.5) dot(n.x, n.z, g.npcHasQuest(n.id) ? '#ffcf5a' : '#e8e0cc', 3.5);
    if (g.chaser) dot(g.chaser.x, g.chaser.z, '#ff4a3a', 5);
    const wp = g.waypoint(); if (wp) dot(wp.x, wp.z, '#ffcf5a', 5);
    c.restore();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(S / 2, S / 2 - 8); c.lineTo(S / 2 + 6, S / 2 + 6); c.lineTo(S / 2, S / 2 + 2); c.lineTo(S / 2 - 6, S / 2 + 6); c.closePath(); c.fill();
  }
  /* ---------------- story cards ---------------- */
  card(lines, done, dark) {
    this.cardQ = lines.filter(Boolean).slice(); this.cardDone = done; $('card').classList.toggle('dark', !!dark);
    $('card').classList.add('show'); this.g.pauseInput(true); this._cardNext(true);
  }
  _cardNext(first) {
    if (!first && !this.cardQ) return;
    if (!this.cardQ.length) { $('card').classList.remove('show'); const d = this.cardDone; this.cardQ = null; this.cardDone = null; this.g.pauseInput(false); d && d(); return; }
    $('card-text').innerHTML = this.cardQ.shift(); $('card-next').focus({ preventScroll: true }); this.g.audio.ui();
  }
  get cardOpen() { return !!this.cardQ; }
  /* ---------------- dialogue ---------------- */
  _dialogueWiring() {
    $('dlg-close').addEventListener('click', () => this.g.endTalk());
    $('dlg-form').addEventListener('submit', e => { e.preventDefault(); const v = $('dlg-input').value.trim(); if (v) { $('dlg-input').value = ''; this.g.say(v); } });
    $('dlg-stop').addEventListener('click', () => this.g.stopTalk());
    $('dlg-input').addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); this.g.endTalk(); } e.stopPropagation(); });
  }
  openDialogue(npc, inspect) {
    const c = npc.def; $('dialogue').hidden = false; $('dlg-name').textContent = c.name; $('dlg-title').textContent = c.title;
    const col = '#' + ((c.look && c.look.top) || 0x555555).toString(16).padStart(6, '0');
    $('dlg-face').style.background = `radial-gradient(circle at 40% 35%, ${col}, #1a1a22)`; $('dlg-face').textContent = c.name.replace(/^(Tía|Don|Doña|Lic\.|Padre|Maestra|Comandante|The)\s+/, '').charAt(0);
    $('dlg-log').innerHTML = ''; $('dlg-form').hidden = !!inspect;
    $('dlg-mode').textContent = inspect ? 'Choose an answer' : this.g.voices.modeLabel() + ' · type anything, in English or Spanish, or choose a line';
    if (!inspect && !this.g.touchUI()) setTimeout(() => $('dlg-input').focus({ preventScroll: true }), 50);
  }
  closeDialogue() { $('dialogue').hidden = true; $('dlg-input').blur(); $('dlg-form').hidden = false; }
  logLine(kind, text) { const p = document.createElement('p'); p.className = 'say ' + kind; p.textContent = text; $('dlg-log').appendChild(p); $('dlg-log').scrollTop = 1e6; return p; }
  setLine(el, text) { el.textContent = parseTags(text.replace(/\[\[[^\]]*$/, '')).text; $('dlg-log').scrollTop = 1e6; }
  busy(on) { $('dlg-send').hidden = on; $('dlg-stop').hidden = !on; $('dlg-input').disabled = on; if (!on && !this.g.touchUI()) $('dlg-input').focus({ preventScroll: true }); }
  chips(list) {
    const box = $('dlg-chips'); box.innerHTML = '';
    for (const ch of list) {
      const b = document.createElement('button'); b.type = 'button';
      b.textContent = ch.label + (ch.locked && ch.lockedText ? ` · ${ch.lockedText}` : '');
      if (ch.quest) b.classList.add('quest'); if (ch.locked) { b.classList.add('locked'); b.setAttribute('aria-disabled', 'true'); }
      b.addEventListener('click', () => ch.onClick()); box.appendChild(b);
    }
  }
  /* ---------------- menu ---------------- */
  _menuWiring() {
    for (const b of document.querySelectorAll('#tabs button[data-tab]')) b.addEventListener('click', () => this.showTab(b.dataset.tab));
    $('menu-close').addEventListener('click', () => this.closeMenu());
    $('btn-save').addEventListener('click', () => { if (this.g.started) { this.g.save(); this.toast('Saved.', 'good'); } });
    $('btn-rescue').addEventListener('click', () => { if (!this.g.started) return; this.closeMenu(); this.g.rescue(); this.toast('You find your footing on the street.', 'good'); });
    $('btn-quit').addEventListener('click', () => { this.closeMenu(); this.g.toTitle(); });
    $('menu').addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); this.closeMenu(); } });
  }
  get menuOpen() { return !$('menu').hidden; }
  openMenu(tab) { this.g.pauseInput(true); $('menu').hidden = false; document.exitPointerLock && document.exitPointerLock(); $('btn-save').disabled = $('btn-rescue').disabled = !this.g.started; this.showTab(tab || this.tab); }
  closeMenu() { $('menu').hidden = true; this.g.pauseInput(false); if (!this.g.started) $('btn-new').focus(); }
  showTab(t) {
    if (!this.g.started && t !== 'settings' && t !== 'notes') t = 'settings';
    this.tab = t;
    for (const b of document.querySelectorAll('#tabs button[data-tab]')) { b.classList.toggle('on', b.dataset.tab === t); b.disabled = !this.g.started && !['settings', 'notes'].includes(b.dataset.tab); }
    for (const d of document.querySelectorAll('#panel > div')) d.classList.toggle('on', d.dataset.panel === t);
    const el = document.querySelector(`#panel > div[data-panel=${t}]`);
    if (t === 'map') this.drawMap(true);
    else if (t === 'case') el.innerHTML = this._case();
    else if (t === 'goals') el.innerHTML = this._goals();
    else if (t === 'notes') el.innerHTML = this._notes();
    else if (t === 'settings') el.innerHTML = this._settings();
    this._wirePanel(el);
  }
  _wirePanel(el) {
    for (const b of el.querySelectorAll('[data-do]')) b.addEventListener('click', () => {
      const [cmd, arg] = b.dataset.do.split(':'), g = this.g;
      if (cmd === 'set') { const [k, v] = arg.split('='); g.setSetting(k, v); }
      if (cmd === 'forgetkey') g.setSetting('apiKey', '');
      if (cmd === 'race') { this.closeMenu(); g.startRace(arg); return; }
      this.showTab(this.tab);
    });
    for (const inp of el.querySelectorAll('[data-setting]')) inp.addEventListener('change', () => this.g.setSetting(inp.dataset.setting, inp.type === 'checkbox' ? inp.checked : inp.value));
    const key = el.querySelector('#api-key'); if (key) key.addEventListener('keydown', e => e.stopPropagation());
  }
  _case() {
    const g = this.g, s = g.state; let h = '<div class="sect"><h2>The case of Aurelio Valdovinos</h2>';
    CHAPTERS.forEach((c, i) => {
      if (i > s.ch && !s.ending) return;
      const done = i < s.ch || s.ending, cur = i === s.ch && !s.ending;
      h += `<div class="quest main ${done ? 'done' : ''}"><h3>${esc(c.title)}${done ? ' — solved' : ''}</h3>`;
      c.steps.forEach((st, k) => { if (done || k < s.st) h += `<p>✓ ${esc(st.text)}</p>`; else if (cur && k === s.st) h += `<p style="color:var(--ink)">→ ${esc(st.text)}</p>`; });
      h += '</div>';
    });
    if (s.ending) h += `<p><b>Ending:</b> ${esc(g.endingTitle())}</p>`;
    h += '<h2>Clues</h2>';
    if (!s.clues.length) h += '<p style="color:var(--ink-dim)">Nothing yet.</p>';
    for (const id of s.clues) { const c = CLUES[id]; if (c) h += `<div class="note"><h3>${esc(c.name)}</h3><p>${esc(c.text)}</p></div>`; }
    h += '<h2>People</h2><div class="grid">';
    for (const [id, c] of Object.entries(CHARACTERS)) { if (c.hidden && !s.met.includes(id)) continue; if (!s.met.includes(id)) continue; h += `<div class="item"><h4>${esc(c.name)}</h4><p>${esc(c.title)}</p></div>`; }
    if (!s.met.length) h += '<p style="color:var(--ink-dim)">No one yet.</p>';
    return h + '</div></div>';
  }
  _goals() {
    const g = this.g, s = g.state; let h = '<div class="sect"><h2>Races</h2><p style="color:var(--ink-dim)">Rosa set these up. Start one from here, or ask her at the taller. Beat the gold time on every one.</p><div class="grid">';
    for (const r of g.races) { const best = s.races[r.id]; const medal = best == null ? '' : best <= r.times[0] ? '🥇' : best <= r.times[1] ? '🥈' : best <= r.times[2] ? '🥉' : ''; h += `<div class="item"><h4>${r.mode === 'jet' ? '🚀' : '🚗'} ${esc(r.name)} ${medal}</h4><p>${esc(r.desc)}</p><p>Gold ${fmtT(r.times[0])} · Silver ${fmtT(r.times[1])} · Bronze ${fmtT(r.times[2])}${best != null ? ` · Your best ${fmtT(best)}` : ''}</p>${g.story.chapter() && s.ch < 2 ? '<small>Unlocks after you meet Rosa.</small>' : `<button data-do="race:${r.id}">Start</button>`}</div>`; }
    h += '</div>';
    const pages = s.pages.length, visited = LANDMARK_IDS.filter(id => s.visited.includes(id)).length;
    h += `<h2>Small things</h2><p>Aurelio's lost pages: <b>${pages}</b> of ${PAGES.length} · Landmarks visited: <b>${visited}</b> of ${LANDMARK_IDS.length} · People met on the street: <b>${s.talked}</b> · Driven: <b>${(s.odo / 1000).toFixed(1)} km</b> · Flown: <b>${(s.flown / 1000).toFixed(1)} km</b></p>`;
    if (pages) h += PAGES.filter(p => s.pages.includes(p.id)).map(p => `<div class="note"><h3>${esc(p.title)}</h3><p><i>${esc(p.text)}</i></p></div>`).join('');
    const got = Object.keys(s.ach).length, all = Object.keys(ACHIEVEMENTS).length;
    h += `<h2>Achievements · ${got} of ${all}</h2><div class="grid">`;
    for (const [id, a] of Object.entries(ACHIEVEMENTS)) h += `<div class="item ach ${s.ach[id] ? 'on' : ''}"><h4>${s.ach[id] ? '★' : '☆'} ${esc(a.name)}</h4><p>${esc(a.desc)}</p></div>`;
    return h + '</div></div>';
  }
  _notes() { return '<div class="sect"><h2>Field Notes</h2>' + NOTES.map(n => `<div class="note"><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`).join('') + '<p style="color:var(--ink-dim)">Map data © OpenStreetMap contributors and Overture Maps Foundation (ODbL). Elevation: open terrain tiles (SRTM and national models).</p></div>'; }
  _settings() {
    const s = this.g.settings, seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-do="set:${k}=${v}" class="${String(s[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const range = (k, min, max, step) => `<input type="range" data-setting="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}">`;
    const v = this.g.voices;
    return `<div class="sect"><h2>Settings</h2>
    <h3>Seeing</h3>
    <div class="setting"><label>Picture quality</label>${seg('quality', [['low', 'Light'], ['medium', 'Balanced'], ['high', 'Beautiful']])}<small>Lighter quality draws less of the distance and runs better on phones. Takes effect when you restart.</small></div>
    <div class="setting"><label>Text size</label>${seg('text', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'Largest']])}</div>
    <div class="setting"><label>High contrast panels</label>${seg('contrast', [['normal', 'Off'], ['high', 'On']])}</div>
    <div class="setting"><label>Reduce motion</label>${seg('reduced', [['false', 'Off'], ['true', 'On']])}<small>No head bob, no camera shake, no speed stretch.</small></div>
    <div class="setting"><label>Time passes</label>${seg('timeScale', [['0', 'Never'], ['0.5', 'Slowly'], ['1', 'Normally'], ['3', 'Quickly']])}</div>
    <h3>Moving</h3>
    <div class="setting"><label>Look sensitivity</label>${range('sensitivity', 0.3, 2.5, 0.1)}</div>
    <div class="setting"><label>Invert up/down look</label>${seg('invertY', [['false', 'Off'], ['true', 'On']])}</div>
    <div class="setting"><label>On-screen controls</label>${seg('touch', [['auto', 'Automatic'], ['on', 'Always'], ['off', 'Never']])}</div>
    <div class="setting"><label>Chases and timers</label>${seg('chase', [['normal', 'Normal'], ['easy', 'Forgiving']])}<small>Forgiving gives you more time and a slower pursuer.</small></div>
    <h3>Sound</h3>
    <div class="setting"><label>Master</label>${range('master', 0, 1, 0.05)}</div>
    <div class="setting"><label>Music</label>${range('music', 0, 1, 0.05)}</div>
    <div class="setting"><label>Effects</label>${range('fx', 0, 1, 0.05)}</div>
    <h3>Voices</h3>
    <p style="color:var(--ink-dim)">Now: <b>${esc(v.modeLabel())}</b>. Everyone has their own written lines. With a live voice, people answer anything you say, in English or Spanish, in their own manner.</p>
    <div class="setting"><label>Voice</label>${seg('voice', [['auto', 'Best available'], ['offline', 'Written only'], ['key', 'My API key']])}</div>
    <div class="setting"><label for="api-key">Anthropic API key</label><input id="api-key" type="password" data-setting="apiKey" placeholder="sk-ant-…" value="${s.apiKey ? '••••••••' : ''}" autocomplete="off"><small>Optional, for the installed app. Stored only on this device and sent only to Anthropic, with Claude's server-side fallback turned on. ${s.apiKey ? '<button data-do="forgetkey">Forget key</button>' : ''} ${v.lastError ? 'Last error: ' + esc(v.lastError) : ''}</small></div>
    <h3>Controls</h3>
    <p style="color:var(--ink-dim)">On foot: WASD to walk · mouse to look (click to capture) · Shift run · Space jump · E talk, examine, get in a car · G jetpack · M map · C case file · Esc menu · U unstuck.<br>Flying: Space up · Z or Ctrl down · W flies where you look · hold Shift to boost (up to about 570 km/h) · G to land.<br>Driving: W/S throttle and brake · A/D steer · Space handbrake · Shift a little more power · H horn · E get out · the mouse swings the camera.<br>Touch: left thumb moves (push to the edge to run or boost), right thumb looks; buttons on the right.</p>
    </div>`;
  }
  /* ---------------- the map ---------------- */
  _mapWiring() {
    const cv = $('map'); let drag = null, pinch = null; const pts = new Map();
    const view = () => this.mapView || (this.mapView = { x: this.g.player?.x || 0, z: this.g.player?.z || 0, s: 0.25 });
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, moved: 0 }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: view().s }; } });
    cv.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]); const v = view();
      if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; v.s = clamp(pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, 0.02, 3); drag.moved = 99; this.drawMap(); return; }
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      v.x -= dx / v.s; v.z -= dy / v.s; this.drawMap();
    });
    const up = e => { const was = drag; pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 0) { drag = null; if (was && was.moved < 8) this._mapClick(e); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { pts.clear(); drag = null; pinch = null; });
    cv.addEventListener('wheel', e => { e.preventDefault(); const v = view(); v.s = clamp(v.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), 0.02, 3); this.drawMap(); }, { passive: false });
    $('map-in').addEventListener('click', () => { view().s = clamp(view().s * 1.4, 0.02, 3); this.drawMap(); });
    $('map-out').addEventListener('click', () => { view().s = clamp(view().s / 1.4, 0.02, 3); this.drawMap(); });
    $('map-me').addEventListener('click', () => { const v = view(); v.x = this.g.player.x; v.z = this.g.player.z; this.drawMap(); });
    $('map-clear').addEventListener('click', () => { this.g.state.customWP = null; this.drawMap(); this.toast('Marker cleared.'); });
    addEventListener('resize', () => { if (this.menuOpen && this.tab === 'map') this.drawMap(); });
  }
  _mapMarks() {
    const g = this.g, s = g.state, marks = [];
    for (const id of LANDMARK_IDS) { const p = PLACES[id], seen = s.visited.includes(id); marks.push({ x: p.x, z: p.z, kind: 'place', id, label: p.name, open: seen, color: seen ? '#8fe3d4' : '#c8c0b0' }); }
    for (const n of g.npcs) if (n.visible && !n.def.ambient && !n.def.hidden) marks.push({ x: n.x, z: n.z, kind: 'npc', label: n.def.name + ', ' + n.def.title, color: g.npcHasQuest(n.id) ? '#ffcf5a' : '#e8e0cc', npc: n });
    return marks;
  }
  drawMap(center) {
    const g = this.g; if (!g.started) return;
    const cv = $('map'), r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.mapView || center) this.mapView = { x: g.player.x, z: g.player.z, s: this.mapView ? this.mapView.s : 0.25 };
    const v = this.mapView, W = r.width, H = r.height, X = x => (x - v.x) * v.s + W / 2, Y = z => (z - v.z) * v.s + H / 2;
    c.fillStyle = '#2e4428'; c.fillRect(0, 0, W, H);
    const img = g.mapImage(), mb = g.mapBox; if (img) c.drawImage(img, X(mb.x0), Y(mb.z0), (mb.x1 - mb.x0) * v.s, (mb.z1 - mb.z0) * v.s);
    if (v.s > 0.8) { c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = '11px Inter, sans-serif'; const seen = new Set(); for (const st of g.city.streets) { if (!st.name || seen.has(st.name)) continue; const m = st.pts[Math.floor(st.pts.length / 2)], x = X(m[0]), y = Y(m[1]); if (x > 0 && y > 0 && x < W && y < H) { seen.add(st.name); c.fillText(st.name, x + 3, y - 3); } } }
    this._marks = this._mapMarks();
    for (const m of this._marks) {
      const x = X(m.x), y = Y(m.z); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      c.fillStyle = m.color; c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath();
      if (m.kind === 'place') c.rect(x - 5, y - 5, 10, 10); else c.arc(x, y, 5, 0, Math.PI * 2);
      c.fill(); c.stroke();
      if (v.s > 0.18 || m.kind === 'place') { c.fillStyle = '#fff'; c.font = '600 11px Inter, sans-serif'; c.fillText(m.label.split(/[,(]/)[0], x + 8, y + 4); }
    }
    const wp = g.waypoint(); if (wp) { const x = X(wp.x), y = Y(wp.z); c.strokeStyle = '#ffcf5a'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.stroke(); }
    const px = X(g.player.x), py = Y(g.player.z); c.save(); c.translate(px, py); c.rotate(-g.viewYaw()); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 8); c.lineTo(0, 3); c.lineTo(-8, 8); c.closePath(); c.fill(); c.stroke(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = '12px Inter, sans-serif'; c.fillText('Tap a square for a landmark · tap anywhere to set a marker · drag to move · pinch or ＋/－ to zoom', 10, 18);
  }
  _mapClick(e) {
    const g = this.g, cv = $('map'), r = cv.getBoundingClientRect(), v = this.mapView, mx = e.clientX - r.left, my = e.clientY - r.top;
    const wx = (mx - r.width / 2) / v.s + v.x, wz = (my - r.height / 2) / v.s + v.z;
    let hit = null, bd = 16;
    for (const m of this._marks || []) { const d = Math.hypot((m.x - v.x) * v.s + r.width / 2 - mx, (m.z - v.z) * v.s + r.height / 2 - my); if (d < bd) { bd = d; hit = m; } }
    const info = $('map-info');
    if (hit) {
      info.innerHTML = `<h3>${esc(hit.label)}</h3><p>${hit.kind === 'place' ? (hit.open ? 'You have been here. You can go back quickly.' : 'Visit once to be able to travel here quickly.') : g.npcHasQuest(hit.npc.id) ? 'They have something for you.' : ''}</p>`;
      const row = document.createElement('div'); row.className = 'row'; row.style.justifyContent = 'flex-start';
      if (hit.kind === 'place' && hit.open && g.canTravel()) { const b = document.createElement('button'); b.className = 'primary'; b.textContent = 'Travel here'; b.onclick = () => { info.classList.remove('on'); this.closeMenu(); g.travelTo(hit.id); }; row.appendChild(b); }
      const m = document.createElement('button'); m.textContent = 'Set marker'; m.onclick = () => { g.state.customWP = { x: hit.x, z: hit.z }; info.classList.remove('on'); this.drawMap(); }; row.appendChild(m);
      const x = document.createElement('button'); x.textContent = 'Close'; x.onclick = () => info.classList.remove('on'); row.appendChild(x);
      info.appendChild(row); info.classList.add('on');
    } else { g.state.customWP = { x: wx, z: wz }; info.classList.remove('on'); this.drawMap(); this.toast('Marker set. Follow the gold diamond on your compass.'); }
  }
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function fmtDist(m) { return m > 950 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 10) * 10 + ' m'; }
export function fmtT(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t % 1) * 10); return `${m}:${String(s).padStart(2, '0')}.${cs}`; }
