// Everything on the glass: HUD, compass, minimap, the map, the journal, things, you, field notes,
// settings, conversations and story cards. Every button is a real <button> and works with touch,
// mouse and keyboard.
import { QUESTS } from './quests.js';
import { CHARACTERS } from './story.js';
import { ITEMS, NOTES, LOST, MURMURS } from './lore.js';
import { WEAPONS } from '../render/people.js';
import { ABILITIES } from './combat.js';
import { LIBRARIES } from '../geo.js';
import { parseTags } from './dialogue.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
    setTimeout(() => el.remove(), kind === 'quest' ? 6000 : 4200);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  }
  float(text) { const el = document.createElement('div'); el.className = 'float'; el.textContent = text; $('hud').appendChild(el); setTimeout(() => el.remove(), 1700); }
  subtitle(who, text, secs = 7) { const s = $('subtitle'); s.innerHTML = `<small>${esc(who)}</small>${esc(text)}`; s.hidden = false; this.subT = secs; }
  prompt(target) {
    this.promptTarget = target;
    const p = $('prompt'), tb = $('tb-interact');
    if (!target) { p.hidden = true; tb.classList.remove('ready'); tb.textContent = 'E'; return; }
    p.hidden = false; p.innerHTML = `<kbd>${this.g.touchUI() ? 'E' : 'E'}</kbd>${esc(target.label)}`;
    tb.classList.add('ready'); tb.textContent = target.icon || 'E';
  }
  jetInfo(j) {
    const el = $('jetinfo'); if (!j) { if (!el.hidden) el.hidden = true; return; }
    this._jetT = (this._jetT || 0) + 1; if (!el.hidden && this._jetT % 6) return;
    el.hidden = false;
    el.textContent = `${j.landing ? 'LANDING · ' : ''}ALT ${Math.round(j.agl)} m · ${Math.round(j.speed * 3.6)} km/h`;
  }
  update(dt) {
    const g = this.g, st = g.state, p = g.player;
    if (this.subT > 0) { this.subT -= dt; if (this.subT <= 0) $('subtitle').hidden = true; }
    $('hp-bar').style.width = (100 * st.hp / g.maxHP()) + '%';
    $('br-bar').style.width = (100 * st.breath / g.maxBreath()) + '%';
    $('st-bar').style.width = (100 * p.stamina) + '%';
    const ab = st.ability ? ABILITIES[st.ability].name : 'no ability';
    $('lvl').textContent = `Level ${st.level} · ${st.weapons.length ? (WEAPONS[st.weapon] || WEAPONS.stick).name : 'empty-handed'} · ${ab}${st.points ? ' · ' + st.points + ' point' + (st.points > 1 ? 's' : '') + ' to spend' : ''}`;
    $('place-name').textContent = g.placeName();
    const h = st.hour, hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    $('clock').textContent = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'} · Day ${st.day}`;
    const obj = g.objective();
    $('objective').innerHTML = obj ? `<b>${esc(obj.quest.toUpperCase())}</b><br>${esc(obj.text)}${obj.dist != null ? ` <span style="opacity:.7">· ${fmtDist(obj.dist)}</span>` : ''}` : '';
    const foe = g.combat.duel;
    if (foe) { $('foe').hidden = false; $('foe-name').textContent = foe.npc.def.name; $('foe-bar').style.width = Math.max(0, 100 * foe.hp / foe.max) + '%'; } else $('foe').hidden = true;
    $('stuck').hidden = !(p.stuckTime > 2.5);
    this._compass(); this._minimap();
  }
  _compass() {
    const g = this.g, p = g.player, strip = $('compass-strip'), W = $('compass').clientWidth, fov = Math.PI * 0.9;
    const items = [['N', 0, 'card'], ['NE', Math.PI / 4, ''], ['E', Math.PI / 2, 'card'], ['SE', Math.PI * 0.75, ''], ['S', Math.PI, 'card'], ['SW', Math.PI * 1.25, ''], ['W', Math.PI * 1.5, 'card'], ['NW', Math.PI * 1.75, '']];
    const wp = g.waypoint(); if (wp) items.push(['◆', Math.atan2(wp.x - p.x, -(wp.z - p.z)), 'wp']);
    // heading: yaw 0 looks toward -z (north); compass bearing increases clockwise
    const heading = -p.yaw;
    let html = '';
    for (const [lab, b, cls] of items) {
      let d = b - heading; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) > fov / 2) continue;
      html += `<span class="${cls}" style="left:${(d / fov) * W}px">${lab}</span>`;
    }
    strip.innerHTML = html;
  }
  _minimap() {
    const g = this.g, p = g.player, cv = $('minimap'), c = cv.getContext('2d'), S = cv.width, R = 220; // metres radius
    c.save(); c.clearRect(0, 0, S, S);
    c.beginPath(); c.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); c.clip();
    c.fillStyle = 'rgba(26,40,60,0.85)'; c.fillRect(0, 0, S, S);
    c.translate(S / 2, S / 2); c.rotate(p.yaw); const k = (S / 2) / R;
    // land
    if (!p.interior) {
      const img = g.mapImage();
      if (img) { const s = img.width / (2 * g.city.half); c.save(); c.scale(k / s, k / s); c.drawImage(img, -(p.x + g.city.half) * s, -(p.z + g.city.half) * s); c.restore(); }
      c.strokeStyle = 'rgba(255,250,235,0.55)'; c.lineWidth = 2;
      for (const st of g.nearStreets(p.x, p.z, R * 1.5)) { c.beginPath(); st.pts.forEach(([x, z], i) => { const X = (x - p.x) * k, Y = (z - p.z) * k; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); }
    }
    // markers
    const dot = (x, z, col, r = 4) => { let X = (x - p.x) * k, Y = (z - p.z) * k; const d = Math.hypot(X, Y), m = S / 2 - 8; if (d > m) { X *= m / d; Y *= m / d; } c.fillStyle = col; c.beginPath(); c.arc(X, Y, r, 0, Math.PI * 2); c.fill(); };
    for (const n of g.npcs) if (n.visible && Math.hypot(n.x - p.x, n.z - p.z) < R) dot(n.x, n.z, n.hostile ? '#e06050' : g.npcHasQuest(n.id) ? '#e2b865' : '#cfc7b0', 3.5);
    for (const e of g.combat.enemies) dot(e.x, e.z, '#7fd8e8', 3);
    const wp = g.waypoint(); if (wp) dot(wp.x, wp.z, '#ffd27a', 5);
    c.restore();
    // player arrow (always up)
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(S / 2, S / 2 - 8); c.lineTo(S / 2 + 6, S / 2 + 6); c.lineTo(S / 2, S / 2 + 2); c.lineTo(S / 2 - 6, S / 2 + 6); c.closePath(); c.fill();
  }

  /* ---------------- story cards ---------------- */
  card(lines, done, dark) {
    this.cardQ = lines.slice(); this.cardDone = done; $('card').classList.toggle('dark', !!dark);
    $('card').classList.add('show'); this.g.pauseInput(true); this._cardNext(true);
  }
  _cardNext(first) {
    if (!first && !this.cardQ) return;
    if (!this.cardQ.length) {
      $('card').classList.remove('show'); const d = this.cardDone; this.cardQ = null; this.cardDone = null;
      this.g.pauseInput(false); d && d(); return;
    }
    $('card-text').innerHTML = this.cardQ.shift(); $('card-next').focus({ preventScroll: true });
    this.g.audio.ui();
  }
  get cardOpen() { return !!this.cardQ; }

  /* ---------------- dialogue ---------------- */
  _dialogueWiring() {
    $('dlg-close').addEventListener('click', () => this.g.endTalk());
    $('dlg-form').addEventListener('submit', e => { e.preventDefault(); const v = $('dlg-input').value.trim(); if (v) { $('dlg-input').value = ''; this.g.say(v); } });
    $('dlg-stop').addEventListener('click', () => this.g.stopTalk());
    $('dlg-input').addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); this.g.endTalk(); } e.stopPropagation(); });
  }
  openDialogue(npc) {
    const c = npc.def; $('dialogue').hidden = false; $('dlg-name').textContent = c.name; $('dlg-title').textContent = c.title;
    const col = '#' + (c.look.top || 0x555555).toString(16).padStart(6, '0');
    $('dlg-face').style.background = `radial-gradient(circle at 40% 35%, ${col}, #1a1a22)`; $('dlg-face').textContent = c.name.replace(/^(Mrs?\.|Prof\.|Capt\.|Brother|Delegate|Grandma|The)\s+/, '').charAt(0);
    $('dlg-log').innerHTML = ''; $('dlg-mode').textContent = this.g.voices.modeLabel() + ' · type anything, or choose a line';
    if (!this.g.touchUI()) setTimeout(() => $('dlg-input').focus({ preventScroll: true }), 50);
  }
  closeDialogue() { $('dialogue').hidden = true; $('dlg-input').blur(); }
  logLine(kind, text) {
    const p = document.createElement('p'); p.className = 'say ' + kind; p.textContent = text; $('dlg-log').appendChild(p); $('dlg-log').scrollTop = 1e6; return p;
  }
  setLine(el, text) { el.textContent = parseTags(text.replace(/\[\[[^\]]*$/, '')).text; $('dlg-log').scrollTop = 1e6; }
  busy(on) { $('dlg-send').hidden = on; $('dlg-stop').hidden = !on; $('dlg-input').disabled = on; if (!on && !this.g.touchUI()) $('dlg-input').focus({ preventScroll: true }); }
  chips(list) {
    const box = $('dlg-chips'); box.innerHTML = '';
    for (const ch of list) {
      const b = document.createElement('button'); b.type = 'button';
      b.textContent = ch.label + (ch.locked && ch.lockedText ? ` · ${ch.lockedText}` : '');
      if (ch.quest) b.classList.add('quest'); if (ch.locked) { b.classList.add('locked'); b.setAttribute('aria-disabled', 'true'); }
      b.addEventListener('click', () => ch.onClick());
      box.appendChild(b);
    }
  }

  /* ---------------- menu ---------------- */
  _menuWiring() {
    for (const b of document.querySelectorAll('#tabs button[data-tab]')) b.addEventListener('click', () => this.showTab(b.dataset.tab));
    $('menu-close').addEventListener('click', () => this.closeMenu());
    $('btn-save').addEventListener('click', () => { if (this.g.started) { this.g.save(); this.toast('Saved.', 'good'); } });
    $('btn-rescue').addEventListener('click', () => { if (!this.g.started) return; this.closeMenu(); this.g.player.rescue(); this.toast('You find your footing on the street.', 'good'); });
    $('btn-quit').addEventListener('click', () => { this.closeMenu(); this.g.toTitle(); });
    $('menu').addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); this.closeMenu(); } });
  }
  get menuOpen() { return !$('menu').hidden; }
  openMenu(tab) {
    this.g.pauseInput(true); $('menu').hidden = false; document.exitPointerLock && document.exitPointerLock();
    $('btn-save').disabled = $('btn-rescue').disabled = !this.g.started;
    this.showTab(tab || this.tab);
  }
  closeMenu() { $('menu').hidden = true; this.g.pauseInput(false); if (!this.g.started) $('btn-new').focus(); }
  showTab(t) {
    if (!this.g.started && t !== 'settings' && t !== 'notes') t = 'settings';
    this.tab = t;
    for (const b of document.querySelectorAll('#tabs button[data-tab]')) { b.classList.toggle('on', b.dataset.tab === t); b.disabled = !this.g.started && !['settings', 'notes'].includes(b.dataset.tab); }
    for (const d of document.querySelectorAll('#panel > div')) d.classList.toggle('on', d.dataset.panel === t);
    const el = document.querySelector(`#panel > div[data-panel=${t}]`);
    if (t === 'map') { this.drawMap(true); }
    else if (t === 'journal') el.innerHTML = this._journal();
    else if (t === 'inventory') el.innerHTML = this._inventory();
    else if (t === 'character') el.innerHTML = this._character();
    else if (t === 'notes') el.innerHTML = this._notes();
    else if (t === 'settings') el.innerHTML = this._settings();
    this._wirePanel(el);
  }
  _wirePanel(el) {
    for (const b of el.querySelectorAll('[data-do]')) b.addEventListener('click', () => {
      const [cmd, arg] = b.dataset.do.split(':');
      const g = this.g;
      if (cmd === 'use') g.useItem(arg);
      if (cmd === 'wield') g.wield(arg);
      if (cmd === 'ability') { g.state.ability = arg; }
      if (cmd === 'stat') g.spendPoint(arg);
      if (cmd === 'track') { g.state.track = arg; g.state.customWP = null; this.toast('Tracking: ' + QUESTS[arg].title, 'quest'); }
      if (cmd === 'set') { const [k, v] = arg.split('='); g.setSetting(k, v); }
      if (cmd === 'forgetkey') g.setSetting('apiKey', '');
      this.showTab(this.tab);
    });
    for (const inp of el.querySelectorAll('[data-setting]')) inp.addEventListener('change', () => this.g.setSetting(inp.dataset.setting, inp.type === 'checkbox' ? inp.checked : inp.value));
    const key = el.querySelector('#api-key'); if (key) key.addEventListener('keydown', e => e.stopPropagation());
  }
  _journal() {
    const g = this.g, qs = g.state.quests; let h = '<div class="sect"><h2>Journal</h2>';
    const ids = Object.keys(qs).sort((a, b) => (qs[a].done - qs[b].done) || ((QUESTS[b].main ? 1 : 0) - (QUESTS[a].main ? 1 : 0)));
    for (const id of ids) {
      const q = qs[id], d = QUESTS[id], st = d.stages[Math.min(q.stage, d.stages.length - 1)];
      const past = d.stages.slice(0, q.stage).map(s => `<p>✓ ${esc(s.text)}</p>`).join('');
      h += `<div class="quest ${d.main ? 'main' : ''} ${q.done ? 'done' : ''}"><h3>${d.main ? '◆ ' : ''}${esc(d.title)}${q.done ? ' — done' : ''}</h3>${past}${q.done ? '' : `<p style="color:var(--ink)">→ ${esc(st.text)}</p>`}${q.done ? '' : `<button data-do="track:${id}">${g.state.track === id ? 'Tracking' : 'Track this'}</button>`}</div>`;
    }
    const offers = Object.entries(QUESTS).filter(([id, d]) => !qs[id] && d.giver).map(([id, d]) => `<li>${esc(CHARACTERS[d.giver].name)}, ${esc(CHARACTERS[d.giver].title)}</li>`);
    h += `<h2>People who might need you</h2><p style="color:var(--ink-dim)">They are marked with gold on the map and minimap.</p><ul>${offers.join('') || '<li>No one else, for now.</li>'}</ul>`;
    const s = g.state;
    h += `<h2>The city's small things</h2><p>Murmurs heard: <b>${s.murmurs.filter(Boolean).length}</b> of ${MURMURS.length} · Stair glyphs read: <b>${s.glyphs.length}</b> of 12 · Lost things found: <b>${s.lost.filter(Boolean).length}</b> of ${LOST.length} (returned: ${s.lostReturned})</p>`;
    const heard = s.murmurs.map((v, i) => v ? MURMURS[i] : null).filter(Boolean);
    if (heard.length) h += '<h3>What the dead said</h3>' + heard.map(m => `<p><i>“${esc(m.text)}”</i> <span style="color:var(--ink-dim)">— ${esc(m.who)}</span></p>`).join('');
    return h + '</div>';
  }
  _inventory() {
    const g = this.g, s = g.state; let h = '<div class="sect"><h2>Weapons</h2><div class="grid">';
    for (const w of s.weapons) { const d = WEAPONS[w]; h += `<div class="item ${s.weapon === w ? 'on' : ''}"><h4>${esc(d.name)}</h4><p>${esc(d.desc)}</p><p>Damage ${d.dmg} · Speed ${d.speed} · Against spirits ×${d.spirit}</p>${s.weapon === w ? '<b>In hand</b>' : `<button data-do="wield:${w}">Take in hand</button>`}</div>`; }
    h += '</div><h2>Abilities</h2><div class="grid">';
    if (!s.abilities.length) h += '<p style="color:var(--ink-dim)">None yet. Some people in the city can teach you.</p>';
    for (const a of s.abilities) { const d = ABILITIES[a]; h += `<div class="item ${s.ability === a ? 'on' : ''}"><h4>${esc(d.name)}</h4><p>${esc(d.desc)} Costs ${d.cost} breath.</p>${s.ability === a ? '<b>Ready (F / ✦)</b>' : `<button data-do="ability:${a}">Ready it</button>`}</div>`; }
    h += '</div><h2>Things you carry</h2><div class="grid">';
    const inv = Object.entries(s.inv).filter(([, n]) => n > 0);
    if (!inv.length) h += '<p style="color:var(--ink-dim)">Nothing yet.</p>';
    for (const [id, n] of inv) { const d = ITEMS[id]; if (!d) continue; h += `<div class="item"><h4>${esc(d.name)}${n > 1 ? ' ×' + n : ''}</h4><p>${esc(d.desc)}</p>${d.use ? `<button data-do="use:${id}">Use</button>` : ''}</div>`; }
    const lost = s.lost.map((v, i) => v === 1 ? LOST[i] : null).filter(Boolean);
    if (lost.length) { h += '</div><h3>Lost things (return them at any library)</h3><div class="grid">'; for (const l of lost) h += `<div class="item"><h4>${esc(l.name)}</h4><p>${esc(l.text)}</p></div>`; }
    return h + '</div></div>';
  }
  _character() {
    const g = this.g, s = g.state, pip = (n) => Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    const L = Math.max(-5, Math.min(5, s.light));
    let h = `<div class="sect"><h2>${esc(s.name)}</h2><p>Level ${s.level} · ${s.xp} / ${g.xpNext()} toward the next · ${g.flags.dead ? 'One of the walking dead.' : 'Still breathing. You think.'}</p>`;
    h += `<h3>Heart</h3><div class="morality"><i style="left:${50 + L * 10}%"></i></div><p style="color:var(--ink-dim)">${L >= 2 ? 'Your hands glow warm. People trust you.' : L <= -2 ? 'Your hands smoke violet. People lower their eyes.' : 'You have not decided who you are here.'}</p>`;
    h += `<h3>Growth</h3>${s.points ? `<p>You have <b>${s.points}</b> point${s.points > 1 ? 's' : ''} to spend.</p>` : ''}`;
    for (const [k, lab, d] of [['strength', 'Strength', 'Heavier blows, more health.'], ['skill', 'Skill', 'Wider, surer strikes; duelists parry less.'], ['will', 'Will', 'More breath; stronger Hush and Flare.']]) h += `<div class="stat"><b>${lab}</b><span class="pips">${pip(s.stats[k])}</span>${s.points && s.stats[k] < 10 ? `<button data-do="stat:${k}">+</button>` : ''}</div><p style="color:var(--ink-dim);margin:0 0 6px">${d}</p>`;
    h += `<h3>Walked</h3><p>${(g.player.distance / 1000).toFixed(1)} km of San Francisco. Libraries opened: ${s.libs.length} of ${LIBRARIES.length}.</p>`;
    return h + '</div>';
  }
  _notes() { return '<div class="sect"><h2>Field Notes</h2>' + NOTES.map(n => `<div class="note"><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`).join('') + '</div>'; }
  _settings() {
    const s = this.g.settings, seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-do="set:${k}=${v}" class="${String(s[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const range = (k, min, max, step) => `<input type="range" data-setting="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}">`;
    const v = this.g.voices;
    return `<div class="sect"><h2>Settings</h2>
    <h3>Seeing</h3>
    <div class="setting"><label>Picture quality</label>${seg('quality', [['low', 'Light'], ['medium', 'Balanced'], ['high', 'Beautiful']])}<small>Lighter quality draws less of the distance and runs better on phones.</small></div>
    <div class="setting"><label>Text size</label>${seg('text', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'Largest']])}</div>
    <div class="setting"><label>High contrast panels</label>${seg('contrast', [['normal', 'Off'], ['high', 'On']])}</div>
    <div class="setting"><label>Reduce motion</label>${seg('reduced', [['false', 'Off'], ['true', 'On']])}<small>No head bob, no screen shake, no flashes.</small></div>
    <div class="setting"><label>Time passes</label>${seg('timeScale', [['0', 'Never'], ['0.5', 'Slowly'], ['1', 'Normally'], ['3', 'Quickly']])}</div>
    <h3>Moving</h3>
    <div class="setting"><label>Look sensitivity</label>${range('sensitivity', 0.3, 2.5, 0.1)}</div>
    <div class="setting"><label>Invert up/down look</label>${seg('invertY', [['false', 'Off'], ['true', 'On']])}</div>
    <div class="setting"><label>On-screen controls</label>${seg('touch', [['auto', 'Automatic'], ['on', 'Always'], ['off', 'Never']])}</div>
    <h3>Fighting</h3>
    <div class="setting"><label>Hollows in the streets</label>${seg('hollows', [['off', 'None'], ['gentle', 'Few'], ['normal', 'Normal']])}<small>Story fights still happen; this only changes the wandering ones at night.</small></div>
    <div class="setting"><label>Damage you take</label>${seg('damage', [['0.4', 'Story'], ['1', 'Normal'], ['1.5', 'Hard']])}</div>
    <h3>Sound</h3>
    <div class="setting"><label>Master</label>${range('master', 0, 1, 0.05)}</div>
    <div class="setting"><label>Music</label>${range('music', 0, 1, 0.05)}</div>
    <div class="setting"><label>Effects</label>${range('fx', 0, 1, 0.05)}</div>
    <h3>Voices</h3>
    <p style="color:var(--ink-dim)">Now: <b>${esc(v.modeLabel())}</b>. Everyone always has their own written voice. When a live voice is available, people can answer anything you say in their own manner.</p>
    <div class="setting"><label>Voice</label>${seg('voice', [['auto', 'Best available'], ['offline', 'Written only'], ['key', 'My API key']])}</div>
    <div class="setting"><label for="api-key">Anthropic API key</label><input id="api-key" type="password" data-setting="apiKey" placeholder="sk-ant-…" value="${s.apiKey ? '••••••••' : ''}" autocomplete="off"><small>Optional, for the installed app. Stored only on this device and sent only to Anthropic. Requests use Claude with the server-side fallback turned on, so if a reply is declined it is retried on a fallback model. ${s.apiKey ? '<button data-do="forgetkey">Forget key</button>' : ''} ${v.lastError ? 'Last error: ' + esc(v.lastError) : ''}</small></div>
    <h3>Controls</h3>
    <p style="color:var(--ink-dim)">Keyboard: WASD or arrows to walk · mouse to look (click to capture) · Shift sprint · Space jump · E talk / use · left click strike · right click or R block · F ability · Q change ability · 1–6 weapons · H eat · B bicycle · M map · J journal · I things · C you · Esc or Tab menu · U step free if stuck.<br>Touch: left thumb walks (push to the edge to run), right thumb looks; buttons on the right.<br>Gamepad: sticks move and look · A talk · X or RT strike · B or LT block · Y ability · LB change ability · Back map · Start menu · L3 sprint · R3 bicycle · D-pad up eat.</p>
    </div>`;
  }

  /* ---------------- the map ---------------- */
  _mapWiring() {
    const cv = $('map'); let drag = null, pinch = null; const pts = new Map();
    const view = () => this.mapView || (this.mapView = { x: this.g.player?.x || 0, z: this.g.player?.z || 0, s: 0.12 });
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, moved: 0 }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: view().s }; } });
    cv.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]); const v = view();
      if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; v.s = clamp(pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, 0.03, 2); drag.moved = 99; this.drawMap(); return; }
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      v.x -= dx / v.s; v.z -= dy / v.s; this.drawMap();
    });
    const up = e => { const was = drag; pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 0) { drag = null; if (was && was.moved < 8) this._mapClick(e); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { pts.clear(); drag = null; pinch = null; });
    cv.addEventListener('wheel', e => { e.preventDefault(); const v = view(); v.s = clamp(v.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), 0.03, 2); this.drawMap(); }, { passive: false });
    $('map-in').addEventListener('click', () => { view().s = clamp(view().s * 1.4, 0.03, 2); this.drawMap(); });
    $('map-out').addEventListener('click', () => { view().s = clamp(view().s / 1.4, 0.03, 2); this.drawMap(); });
    $('map-me').addEventListener('click', () => { const v = view(); v.x = this.g.player.x; v.z = this.g.player.z; this.drawMap(); });
    $('map-clear').addEventListener('click', () => { this.g.state.customWP = null; this.drawMap(); this.toast('Marker cleared.'); });
    addEventListener('resize', () => { if (this.menuOpen && this.tab === 'map') this.drawMap(); });
  }
  _mapMarks() {
    const g = this.g, marks = [];
    for (const l of LIBRARIES) { const open = g.state.libs.includes(l.id); marks.push({ x: l.x, z: l.z, kind: 'lib', label: l.name, open, id: l.id, color: open ? '#8fe3d4' : '#6a7a80' }); }
    for (const n of g.npcs) if (n.visible && !n.inRoom && !n.def.ambient) marks.push({ x: n.x, z: n.z, kind: 'npc', label: n.def.name + ', ' + n.def.title, color: g.npcHasQuest(n.id) ? '#e2b865' : '#cfc7b0', npc: n });
    for (const s of g.ruins.userData.sites) if (g.state.glyphs.includes(s.id) || g.state.seenSites.includes(s.id)) marks.push({ x: s.x, z: s.z, kind: 'site', label: s.name, color: g.state.glyphs.includes(s.id) ? '#8fe3d4' : '#b0a890' });
    for (const f of g.fastTravelSpots()) marks.push(f);
    return marks;
  }
  drawMap(center) {
    const g = this.g; if (!g.started) return;
    const cv = $('map'), r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.mapView || center) this.mapView = { x: g.player.x, z: g.player.z, s: this.mapView ? this.mapView.s : 0.12 };
    const v = this.mapView, W = r.width, H = r.height;
    const X = x => (x - v.x) * v.s + W / 2, Y = z => (z - v.z) * v.s + H / 2;
    c.fillStyle = '#243a55'; c.fillRect(0, 0, W, H);
    const img = g.mapImage(); if (img) { const s = img.width / (2 * g.city.half); c.imageSmoothingEnabled = true; c.drawImage(img, X(-g.city.half), Y(-g.city.half), 2 * g.city.half * v.s, 2 * g.city.half * v.s); }
    // streets
    c.strokeStyle = 'rgba(255,248,230,0.5)'; c.lineWidth = Math.max(0.6, v.s * 10);
    if (v.s > 0.05) for (const st of g.city.streets) { const p0 = st.pts[0]; if (Math.abs(X(p0[0]) - W / 2) > W + 2000 * v.s || Math.abs(Y(p0[1]) - H / 2) > H + 2000 * v.s) continue; c.beginPath(); st.pts.forEach(([x, z], i) => i ? c.lineTo(X(x), Y(z)) : c.moveTo(X(x), Y(z))); c.stroke(); }
    // street names when close
    if (v.s > 0.5) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = '11px Inter, sans-serif'; for (const st of g.city.streets) { const m = st.pts[Math.floor(st.pts.length / 2)]; const x = X(m[0]), y = Y(m[1]); if (x > 0 && y > 0 && x < W && y < H) c.fillText(st.name, x + 3, y - 3); } }
    this._marks = this._mapMarks();
    for (const m of this._marks) {
      const x = X(m.x), y = Y(m.z); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      c.fillStyle = m.color; c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath();
      if (m.kind === 'lib' || m.kind === 'travel') { c.rect(x - 6, y - 6, 12, 12); } else if (m.kind === 'site') { c.moveTo(x, y - 8); c.lineTo(x + 7, y + 5); c.lineTo(x - 7, y + 5); c.closePath(); } else c.arc(x, y, 5, 0, Math.PI * 2);
      c.fill(); c.stroke();
      if (v.s > 0.25 || m.kind === 'travel') { c.fillStyle = '#fff'; c.font = '600 11px Inter, sans-serif'; c.fillText(m.label.split(',')[0], x + 9, y + 4); }
    }
    const wp = g.waypoint(); if (wp) { const x = X(wp.x), y = Y(wp.z); c.strokeStyle = '#ffd27a'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); }
    // player
    const px = X(g.player.x), py = Y(g.player.z); c.save(); c.translate(px, py); c.rotate(-g.player.yaw); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 8); c.lineTo(0, 3); c.lineTo(-8, 8); c.closePath(); c.fill(); c.stroke(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '12px Inter, sans-serif'; c.fillText('Tap a square to travel · tap anywhere to set a marker · drag to move · pinch or ＋/－ to zoom', 10, 18);
  }
  _mapClick(e) {
    const g = this.g, cv = $('map'), r = cv.getBoundingClientRect(), v = this.mapView, mx = e.clientX - r.left, my = e.clientY - r.top;
    const wx = (mx - r.width / 2) / v.s + v.x, wz = (my - r.height / 2) / v.s + v.z;
    let hit = null, bd = 16;
    for (const m of this._marks || []) { const d = Math.hypot((m.x - v.x) * v.s + r.width / 2 - mx, (m.z - v.z) * v.s + r.height / 2 - my); if (d < bd) { bd = d; hit = m; } }
    const info = $('map-info');
    if (hit) {
      const canGo = (hit.kind === 'lib' && hit.open) || hit.kind === 'travel';
      info.innerHTML = `<h3>${esc(hit.label)}</h3><p>${hit.kind === 'lib' ? (hit.open ? 'A safe place. Rest here, and travel between libraries you have opened.' : 'Visit this library once to open it for travel.') : hit.kind === 'npc' ? (g.npcHasQuest(hit.npc.id) ? 'They have something for you.' : '') : hit.kind === 'travel' ? 'You can go here quickly.' : ''}</p>`;
      const row = document.createElement('div'); row.className = 'row'; row.style.justifyContent = 'flex-start';
      if (canGo && !g.combat.duel && !g.player.interior) { const b = document.createElement('button'); b.className = 'primary'; b.textContent = 'Travel here'; b.onclick = () => { info.classList.remove('on'); this.closeMenu(); g.travelTo(hit.x, hit.z, hit.label); }; row.appendChild(b); }
      const m = document.createElement('button'); m.textContent = 'Set marker'; m.onclick = () => { g.state.customWP = { x: hit.x, z: hit.z }; info.classList.remove('on'); this.drawMap(); }; row.appendChild(m);
      const x = document.createElement('button'); x.textContent = 'Close'; x.onclick = () => info.classList.remove('on'); row.appendChild(x);
      info.appendChild(row); info.classList.add('on');
    } else { g.state.customWP = { x: wx, z: wz }; info.classList.remove('on'); this.drawMap(); this.toast('Marker set. Follow the gold diamond on your compass.'); }
  }
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmtDist(m) { return m > 950 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 10) * 10 + ' m'; }
