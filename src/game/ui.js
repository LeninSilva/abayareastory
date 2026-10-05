// Everything on the glass: HUD, compass, minimap, story cards, conversations (a closed set of choices), the menu
// (map, the mystery, the journal, people, you, property, notes, settings), shops, land, the barber and the house
// builder. Every control is a real <button>, reachable by keyboard, touch and screen reader.
import { CHARACTERS } from './story.js';
import { CLUES, CHAPTERS } from './quests.js';
import { NOTES, ACHIEVEMENTS, PAGES } from './lore.js';
import { PLACES } from '../geo.js';
import { REL_LEVELS, ROMANCE_EN, fmt } from './life.js';
import { TONES } from './talk.js';
import { QUESTS } from './sidequests.js';
import { CAST, PARTIES } from './cast.js';
import { SHOPS, CLOTHES, ITEMS, LOTS, BUSINESSES, HOUSE_STYLES, HOUSE_PARTS, PART_ORDER } from './shops.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
export const LANDMARK_IDS = ['jardin', 'parroquia', 'biblioteca', 'presidencia', 'plazaSur', 'casaLC', 'portada', 'estadio', 'feria', 'bosque', 'museo', 'monumento', 'guadalupe', 'cayetano', 'santaAnita', 'toros', 'cumbre', 'jardinPaz', 'panteon', 'casita', 'sanFrancisco', 'azulPortal'];
const TABS = [['map', 'Map', '🗺'], ['case', 'Mystery', '🔎'], ['journal', 'Journal', '📜'], ['people', 'People', '👥'], ['you', 'You', '🙂'], ['property', 'Property', '🏠'], ['notes', 'Notes', '📖'], ['settings', 'Settings', '⚙']];

export class UI {
  constructor(game) {
    this.g = game; this.tab = 'map'; this.mapView = null; this.subT = 0; this.promptTarget = null;
    this._menuWiring(); this._dialogueWiring(); this._mapWiring();
    $('btn-pause').addEventListener('click', () => this.openMenu('map'));
    $('stuck').addEventListener('click', () => { this.g.player.rescue(); this.toast('You find your footing on the street.', 'good'); });
    $('card-next').addEventListener('click', () => this._cardNext());
    $('card').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._cardNext(); } });
    $('panel-x').addEventListener('click', () => this.closePanel());
  }
  /* ---------------- HUD ---------------- */
  showHUD(on) { $('hud').hidden = !on; $('touch').hidden = !on || !this.g.touchUI(); }
  toast(text, kind = '') {
    const box = $('toasts'), el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = text; box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, kind === 'quest' || kind === 'ach' || kind === 'love' ? 6500 : 4500);
    while (box.children.length > 4) box.firstChild.remove();
  }
  achievement(a) {
    const box = $('toasts'), el = document.createElement('div'); el.className = 'toast ach'; el.setAttribute('role', 'status');
    el.innerHTML = `<small>Logro · Achievement</small><b>${esc(a.name)}</b><span>${esc(a.desc)}</span>`; box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 6000);
    while (box.children.length > 4) box.firstChild.remove();
  }
  money(n, d) { const el = $('money'); el.textContent = '$' + fmt(n); if (d) { el.classList.remove('up', 'down'); void el.offsetWidth; el.classList.add(d > 0 ? 'up' : 'down'); } }
  traitPulse(k, d) {
    const names = { heart: d > 0 ? 'Compassion' : 'Cruelty', word: d > 0 ? 'Honesty' : 'Deceit', fame: 'Fame', luck: 'Luck' };
    const el = document.createElement('div'); el.className = 'pulse ' + k + (d > 0 ? ' pos' : ' neg'); el.textContent = `${names[k]} ${d > 0 ? '+' : '−'}${Math.abs(d)}`;
    $('pulses').appendChild(el); setTimeout(() => el.remove(), 2200);
  }
  relPulse(d) { const el = document.createElement('div'); el.className = 'pulse rel ' + (d > 0 ? 'pos' : 'neg'); el.textContent = d > 0 ? '♥ +' + d : '♥ −' + Math.abs(d); $('pulses').appendChild(el); setTimeout(() => el.remove(), 2000); }
  subtitle(who, text, secs = 7) { const s = $('subtitle'); s.innerHTML = `<small>${esc(who)}</small>${esc(text)}`; s.hidden = false; this.subT = secs; }
  prompt(target) {
    this.promptTarget = target;
    const p = $('prompt'), tb = $('tb-interact');
    if (!target) { p.hidden = true; tb.classList.remove('ready'); tb.textContent = 'E'; return; }
    p.hidden = false; p.innerHTML = `<kbd>E</kbd>${target.icon ? `<span class="pi">${target.icon}</span>` : ''}${esc(target.label)}`;
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
    const title = `${st.name} ${g.life.title()}`; if ($('ptitle').textContent !== title) $('ptitle').textContent = title;
    const obj = g.objective();
    const track = st.track && QUESTS.find(q => q.id === st.track), tq = track && g.side.step(track);
    const html = obj ? `<b>${esc(obj.title)}</b><span>${esc(obj.text)}${obj.dist != null ? ` <i>${fmtDist(obj.dist)}</i>` : ''}</span>${tq ? `<em>◆ ${esc(track.name)}: ${esc(tq.text)}</em>` : ''}` : '';
    if (this._obj !== html) { $('objective').innerHTML = html; this._obj = html; }
    $('stuck').hidden = !(p.stuckTime > 2.5) || !!g.vehicles.driving;
    this._compass(); this._minimap();
  }
  _compass() {
    const g = this.g, p = g.player, strip = $('compass-strip'), W = $('compass').clientWidth, fov = Math.PI * 0.9;
    const items = [['N', 0, 'card'], ['NE', Math.PI / 4, ''], ['E', Math.PI / 2, 'card'], ['SE', Math.PI * 0.75, ''], ['S', Math.PI, 'card'], ['SW', Math.PI * 1.25, ''], ['W', Math.PI * 1.5, 'card'], ['NW', Math.PI * 1.75, '']];
    const wp = g.waypoint(); if (wp) items.push(['◆', Math.atan2(wp.x - p.x, -(wp.z - p.z)), 'wp']);
    for (const t of g.side.targets().slice(0, 6)) if (!wp || Math.hypot(t.x - wp.x, t.z - wp.z) > 5) items.push(['●', Math.atan2(t.x - p.x, -(t.z - p.z)), 'q']);
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
    for (const n of g.npcs) if (n.visible && !n.def.ambient && Math.hypot(n.x - p.x, n.z - p.z) < R * 1.5) dot(n.x, n.z, g.npcHasQuest(n.id) ? '#ffcf5a' : n.cast && n.def.shop ? '#f2efe8' : '#c8d0dc', 3);
    for (const t of g.side.targets()) dot(t.x, t.z, '#7fe0cf', 3.5);
    if (g.chaser) dot(g.chaser.x, g.chaser.z, '#ff4a3a', 5);
    const wp = g.waypoint(); if (wp) dot(wp.x, wp.z, '#ffcf5a', 5);
    c.restore();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(S / 2, S / 2 - 8); c.lineTo(S / 2 + 6, S / 2 + 6); c.lineTo(S / 2, S / 2 + 2); c.lineTo(S / 2 - 6, S / 2 + 6); c.closePath(); c.fill();
  }
  /* ---------------- story cards ---------------- */
  card(lines, done, dark) {
    this.cardQ = lines.filter(Boolean).slice(); this.cardN = this.cardQ.length; this.cardDone = done; $('card').classList.toggle('dark', !!dark);
    $('card').classList.add('show'); this.g.pauseInput(true); this._cardNext(true);
  }
  _cardNext(first) {
    if (!first && !this.cardQ) return;
    if (!this.cardQ.length) { $('card').classList.remove('show'); const d = this.cardDone; this.cardQ = null; this.cardDone = null; this.g.pauseInput(false); d && d(); return; }
    const i = this.cardN - this.cardQ.length;
    $('card-text').innerHTML = this.cardQ.shift();
    $('card-dots').innerHTML = this.cardN > 1 ? Array.from({ length: this.cardN }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('') : '';
    $('card-next').textContent = this.cardQ.length ? 'Continue' : 'Begin';
    $('card-next').focus({ preventScroll: true }); this.g.audio.ui();
  }
  get cardOpen() { return !!this.cardQ; }
  /* ---------------- conversation ---------------- */
  _dialogueWiring() {
    $('dlg-close').addEventListener('click', () => this.g.endTalk());
    addEventListener('keydown', e => {
      if ($('dialogue').hidden || this.cardOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); this.g.endTalk(); return; }
      const n = parseInt(e.key, 10); if (n >= 1 && n <= 9) { const b = $('dlg-chips').querySelectorAll('button')[n - 1]; if (b) { e.preventDefault(); b.click(); } }
    });
  }
  openDialogue(npc, inspect) {
    const c = npc.def; $('dialogue').hidden = false; $('dlg-name').textContent = c.name; $('dlg-title').textContent = c.title || '';
    const col = hex((c.look && c.look.top) || 0x555555);
    $('dlg-face').style.background = `radial-gradient(circle at 40% 35%, ${col}, #1a1a22)`; $('dlg-face').textContent = c.name.replace(/^(Tía|Don|Doña|Lic\.|Padre|Maestra|Maestro|Madre|Comandante|Regidora?|The)\s+/, '').replace(/^(Lic\.)\s+/, '').charAt(0);
    $('dlg-log').innerHTML = ''; $('dlg-meta').innerHTML = '';
    $('dlg-help').textContent = inspect ? 'Choose an answer' : 'Choose what to say · keys 1–9 · tags show the tone of each line';
  }
  dialogueMeta(npc) {
    const L = this.g.life, id = npc.id, d = npc.def; if (npc.id === 'puzzle') return;
    const r = L.rel(id), lv = L.level(id), pct = (r.a + 100) / 2;
    const party = d.party && PARTIES[d.party] ? `<span class="party" style="--pc:${PARTIES[d.party].css}">${esc(PARTIES[d.party].name)}</span>` : '';
    $('dlg-meta').innerHTML = `<span class="lvl" style="--lc:${lv.color}">${esc(lv.en)}</span>${r.romance ? `<span class="rom">❀ ${esc(ROMANCE_EN[r.romance])}</span>` : ''}${party}<span class="meter" aria-label="How they feel about you: ${Math.round(r.a)}"><i style="width:${pct}%;background:${lv.color}"></i></span>`;
  }
  closeDialogue() { $('dialogue').hidden = true; }
  logLine(kind, text) { const p = document.createElement('p'); p.className = 'say ' + kind; p.textContent = text; $('dlg-log').appendChild(p); $('dlg-log').scrollTop = 1e6; return p; }
  chips(list) {
    const box = $('dlg-chips'); box.innerHTML = '';
    list.forEach((ch, i) => {
      const b = document.createElement('button'); b.type = 'button';
      const tone = ch.tone && TONES[ch.tone];
      b.innerHTML = `<kbd>${i + 1}</kbd><span class="t">${esc(ch.label)}${ch.locked && ch.lockedText ? `<small>${esc(ch.lockedText)}</small>` : ''}</span>${tone ? `<em class="tone ${ch.tone}">${tone.icon} ${esc(tone.label)}</em>` : ''}`;
      b.className = 'ch ' + (ch.kind || '') + (ch.side ? ' side' : '') + (ch.quest ? ' story' : '');
      if (ch.locked) { b.classList.add('locked'); b.setAttribute('aria-disabled', 'true'); }
      b.addEventListener('click', () => ch.onClick()); box.appendChild(b);
    });
    const first = box.querySelector('button'); if (first && !this.g.touchUI()) first.focus({ preventScroll: true });
  }
  /* ---------------- side panels: shops, land, barber, builder ---------------- */
  openPanel(title, sub, html, wire) {
    this.panelOpen = true; this.g.pauseInput(true); document.exitPointerLock && document.exitPointerLock();
    $('side').hidden = false; $('panel-title').textContent = title; $('panel-sub').innerHTML = sub || ''; $('panel-body').innerHTML = html;
    $('panel-money').textContent = '$' + fmt(this.g.state.life.money);
    this._panelWire = wire; wire && wire($('panel-body')); $('panel-x').focus({ preventScroll: true });
  }
  refreshPanel(title, sub, html) { $('panel-sub').innerHTML = sub || ''; $('panel-body').innerHTML = html; $('panel-money').textContent = '$' + fmt(this.g.state.life.money); this._panelWire && this._panelWire($('panel-body')); }
  closePanel() { if (!this.panelOpen) return; this.panelOpen = false; this.builderOpen = false; $('side').hidden = true; this.g.closeShopView(); this.g.pauseInput(false); }
  openShop(id) {
    const S = SHOPS[id], g = this.g, L = g.life;
    const render = () => {
      let h = '';
      const clothes = Object.entries(CLOTHES).filter(([, c]) => c.shop === id), items = Object.entries(ITEMS).filter(([, c]) => c.shop === id);
      if (clothes.length) { h += '<h3>Clothes</h3><div class="list">'; for (const [k, c] of clothes) { const own = L.own(k), on = Object.values(L.s.outfit).includes(k); h += `<div class="row-item"><span class="sw" style="background:${hex(c.color)}"></span><div><b>${esc(c.name)}</b><small>${c.slot} · style +${c.style}${c.luck ? ` · luck +${c.luck}` : ''}</small></div>${own ? `<button data-wear="${k}" class="${on ? 'on' : ''}">${on ? 'Wearing' : 'Wear'}</button>` : `<button data-buy="${k}" ${L.afford(c.price) ? '' : 'disabled'}>$${fmt(c.price)}</button>`}</div>`; } h += '</div>'; }
      if (items.length) { h += '<h3>To give, to keep</h3><div class="list">'; for (const [k, c] of items) h += `<div class="row-item"><span class="sw">${c.gift ? '🎁' : '🎟️'}</span><div><b>${esc(c.name)}</b><small>${c.gift ? 'a gift' : ''}${L.has(k) ? ` · you have ${L.s.items[k]}` : ''}</small></div><button data-item="${k}" ${L.afford(c.price) ? '' : 'disabled'}>$${fmt(c.price)}</button></div>`; h += '</div>'; }
      return h;
    };
    const wire = el => {
      for (const b of el.querySelectorAll('[data-buy]')) b.onclick = () => { g.buyClothes(b.dataset.buy); this.refreshPanel(S.name, sub(), render()); };
      for (const b of el.querySelectorAll('[data-wear]')) b.onclick = () => { g.wear(b.dataset.wear); this.refreshPanel(S.name, sub(), render()); };
      for (const b of el.querySelectorAll('[data-item]')) b.onclick = () => { g.buyItem(b.dataset.item); this.refreshPanel(S.name, sub(), render()); };
    };
    const sub = () => `${esc(S.keeper)} · Style ${L.style()} · Luck ${L.luck()}`;
    this.openPanel(S.name, sub(), render(), wire);
  }
  openBarber() {
    const g = this.g, L = g.life, lk = L.s.look;
    const opts = { hairStyle: [['short', 'Short'], ['long', 'Long'], ['bun', 'Bun'], ['braid', 'Braid'], ['afro', 'Curls'], ['bald', 'Shaved']], hair: [[0x1a1410, 'Black'], [0x3a2a1a, 'Dark brown'], [0x6a4a2a, 'Chestnut'], [0xb88a4a, 'Honey'], [0xb8b8b8, 'Silver'], [0x8a2a5a, 'Plum']], skin: [[0xe0b894, ''], [0xd8b48e, ''], [0xc99a78, ''], [0xb88763, ''], [0xa8765a, ''], [0x8a5a3c, ''], [0x6e4630, '']] };
    const render = () => `<h3>Hair</h3><div class="seg wrap">${opts.hairStyle.map(([v, l]) => `<button data-k="hairStyle" data-v="${v}" class="${lk.hairStyle === v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <h3>Colour</h3><div class="seg wrap">${opts.hair.map(([v, l]) => `<button data-k="hair" data-v="${v}" class="${lk.hair === v ? 'on' : ''}"><span class="sw" style="background:${hex(v)}"></span>${l}</button>`).join('')}</div>
      <h3>Skin</h3><div class="seg wrap">${opts.skin.map(([v]) => `<button data-k="skin" data-v="${v}" class="sw-btn ${lk.skin === v ? 'on' : ''}" aria-label="skin tone"><span class="sw" style="background:${hex(v)}"></span></button>`).join('')}</div>
      <h3>Extras</h3><div class="seg wrap"><button data-k="beard" class="${lk.beard ? 'on' : ''}">Beard</button><button data-k="glasses" class="${lk.glasses ? 'on' : ''}">Glasses</button></div>
      <p class="dim">Don Beto charges $120 a visit. Changes are free while you\'re in the chair.</p><button class="primary" data-pay>Pay $120 and stand up</button>`;
    const wire = el => {
      for (const b of el.querySelectorAll('[data-k]')) b.onclick = () => { const k = b.dataset.k; if (k === 'beard' || k === 'glasses') lk[k] = !lk[k]; else lk[k] = k === 'hairStyle' ? b.dataset.v : +b.dataset.v; g.dressPlayer(); this.refreshPanel('Peluquería Don Beto', '', render()); };
      el.querySelector('[data-pay]').onclick = () => { g.life.spend(120, 'a haircut'); g.save(); this.closePanel(); };
    };
    g.prevView = g.view === 'third' ? 'third' : 'first'; g.view = 'shop'; g.dressPlayer(); this.openPanel('Peluquería Don Beto', 'A cut, a shave and the news.', render(), wire);
  }
  openLand(focus) {
    const g = this.g, L = g.life;
    const render = () => '<div class="list">' + LOTS.map(l => { const own = L.ownsLot(l.id); return `<div class="card-item ${focus === l.id ? 'focus' : ''}"><div><b>${esc(l.name)}</b><p>${esc(l.desc)}</p></div><div class="row">${own ? '<span class="tag good">Yours</span><button data-plan="' + l.id + '">Plan the house</button>' : `<button data-buy="${l.id}" class="primary" ${L.afford(l.price) ? '' : 'disabled'}>Buy · $${fmt(l.price)}</button>`}<button data-mark="${l.id}">Show on map</button></div></div>`; }).join('') + '</div>';
    const wire = el => {
      for (const b of el.querySelectorAll('[data-buy]')) b.onclick = () => { if (L.buyLot(b.dataset.buy)) { g.audio.chime(); this.toast('The deed is yours. Talk to Maestro Chuy (Materiales El Albañil) or open Property to plan the house.', 'quest'); } this.refreshPanel('Land for sale', sub(), render()); };
      for (const b of el.querySelectorAll('[data-plan]')) b.onclick = () => { this.closePanel(); g.openBuilder(b.dataset.plan); };
      for (const b of el.querySelectorAll('[data-mark]')) b.onclick = () => { const l = g.lots.find(q => q.id === b.dataset.mark); g.state.customWP = { x: l.x, z: l.z }; this.toast('Marked on your compass.'); };
    };
    const sub = () => 'Lic. Yolanda Partida, Bienes Raíces Jiquilpan. “Land: they\'re not making any more of it.”';
    this.openPanel('Land for sale', sub(), render(), wire);
  }
  openBiz() {
    const g = this.g, L = g.life;
    const render = () => '<div class="list">' + BUSINESSES.map(b => { const o = L.s.biz[b.id]; const locked = b.needs && !L.s[b.needs]; return `<div class="card-item"><div><b>${esc(b.name)}</b><p>${esc(b.desc)}</p><small>${o && o.owned ? `Level ${o.level} · earned so far $${fmt(o.earned || 0)}` : `About $${fmt(b.income)} a day`}</small></div><div class="row">${o && o.owned ? (o.level < 3 ? `<button data-up="${b.id}">Upgrade: ${esc(b.upgrades[o.level - 1])} · $${fmt(Math.round(b.price * 0.7 * o.level))}</button>` : '<span class="tag good">Fully grown</span>') : locked ? `<span class="tag">${esc(b.needsText || 'Locked')}</span>` : `<button class="primary" data-buy="${b.id}" ${L.afford(b.price) ? '' : 'disabled'}>Buy · $${fmt(b.price)}</button>`}</div></div>`; }).join('') + '</div>';
    const wire = el => { for (const b of el.querySelectorAll('[data-buy]')) b.onclick = () => { L.buyBiz(b.dataset.buy); this.refreshPanel('Businesses', sub, render()); }; for (const b of el.querySelectorAll('[data-up]')) b.onclick = () => { L.upgradeBiz(b.dataset.up); this.refreshPanel('Businesses', sub, render()); }; };
    const sub = 'They pay into your pocket every morning at six. Fame brings customers.';
    this.openPanel('Businesses', sub, render(), wire);
  }
  openBuilder(lotId) {
    const g = this.g; this.builderLot = lotId; this.builderOpen = true;
    this.openPanel('Your house', '', this._builderHTML(), el => this._builderWire(el));
  }
  builderRefresh() { if (this.builderOpen) this.refreshPanel('Your house', '', this._builderHTML()); }
  _builderHTML() {
    const g = this.g, L = g.life, lot = L.lot(this.builderLot), Ldef = LOTS.find(l => l.id === this.builderLot), S = HOUSE_STYLES[lot.style], st = g.state, now = (st.day - 1) * 24 + st.hour;
    let h = `<p class="dim">${esc(Ldef.name)}. Maestro Chuy and his chalanes build one part at a time; you pay when you order. Choose the style first: it applies to everything.</p>`;
    h += `<div class="spin"><button data-spin="-1" aria-label="Turn the view left">◀</button><button data-spin="0">Hold the view</button><button data-spin="1" aria-label="Turn the view right">▶</button></div>`;
    h += '<h3>Style</h3><div class="styles">' + Object.entries(HOUSE_STYLES).map(([k, s]) => `<button data-style="${k}" class="${lot.style === k ? 'on' : ''}"><b>${esc(s.name)}</b><small>${esc(s.desc)}</small>${s.price !== 1 ? `<em>${s.price < 1 ? 'cheaper' : 'costlier'} × ${s.price}</em>` : ''}</button>`).join('') + '</div>';
    h += '<h3>Colour</h3><div class="seg wrap">' + S.walls.map((c, i) => `<button data-color="${i}" class="sw-btn ${(lot.color || 0) % S.walls.length === i ? 'on' : ''}" aria-label="wall colour ${i + 1}"><span class="sw" style="background:${hex(c)}"></span></button>`).join('') + '</div>';
    h += `<h3>Name over the door</h3><div class="row"><input id="house-name" maxlength="22" placeholder="Casa ${esc(st.name)}" value="${esc(lot.name || '')}"><button data-name>Paint it</button></div>`;
    h += '<h3>Parts</h3><div class="list">';
    for (const id of PART_ORDER) {
      const P = HOUSE_PARTS[id], built = lot.parts.includes(id), q = lot.queue.find(x => x.part === id), needs = P.needs.filter(n => !lot.parts.includes(n) && !lot.queue.some(x => x.part === n));
      const cost = Math.round(P.cost * S.price);
      const status = built ? '<span class="tag good">Built</span>' : q ? `<span class="tag">${q.start <= now ? 'Building' : 'Queued'} · ready in ${Math.max(0, q.done - now).toFixed(1)} h</span>` : needs.length ? `<span class="tag">Needs ${needs.map(n => HOUSE_PARTS[n].name.split(' (')[0].toLowerCase()).join(', ')}</span>` : `<button data-part="${id}" class="primary" ${L.afford(cost) ? '' : 'disabled'}>Hire · $${fmt(cost)} · ${P.hours} h</button>`;
      h += `<div class="row-item"><div><b>${esc(P.name)}</b><small>${esc(P.desc)}</small></div>${status}</div>`;
    }
    h += '</div>';
    if (lot.queue.length) h += `<p class="dim">The crew works while you do other things. Help them yourself (Maestro Chuy's job) to earn money while you wait.</p>`;
    return h;
  }
  _builderWire(el) {
    const g = this.g, L = g.life, lot = L.lot(this.builderLot);
    for (const b of el.querySelectorAll('[data-style]')) b.onclick = () => { lot.style = b.dataset.style; lot.color = 0; g.onPropertyChanged(this.builderLot); };
    for (const b of el.querySelectorAll('[data-color]')) b.onclick = () => { lot.color = +b.dataset.color; g.onPropertyChanged(this.builderLot); };
    for (const b of el.querySelectorAll('[data-part]')) b.onclick = () => { const P = HOUSE_PARTS[b.dataset.part], S = HOUSE_STYLES[lot.style]; if (L.order(this.builderLot, b.dataset.part, Math.round(P.cost * S.price))) g.audio.chime(); };
    for (const b of el.querySelectorAll('[data-spin]')) b.onclick = () => { g.buildSpin = +b.dataset.spin * 3; };
    const nm = el.querySelector('[data-name]'); if (nm) nm.onclick = () => { lot.name = el.querySelector('#house-name').value.trim(); g.onPropertyChanged(this.builderLot); };
    const inp = el.querySelector('#house-name'); if (inp) inp.addEventListener('keydown', e => e.stopPropagation());
  }
  /* ---------------- menu ---------------- */
  _menuWiring() {
    const nav = $('tabs');
    nav.innerHTML = TABS.map(([id, l, ic]) => `<button data-tab="${id}"><span aria-hidden="true">${ic}</span>${l}</button>`).join('') + '<button id="menu-close" class="close" aria-label="Back to the town">Resume ✕</button>';
    for (const b of nav.querySelectorAll('button[data-tab]')) b.addEventListener('click', () => this.showTab(b.dataset.tab));
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
    for (const b of document.querySelectorAll('#tabs button[data-tab]')) { b.classList.toggle('on', b.dataset.tab === t); b.disabled = !this.g.started && !['settings', 'notes'].includes(b.dataset.tab); b.setAttribute('aria-current', b.dataset.tab === t ? 'page' : 'false'); }
    for (const d of document.querySelectorAll('#panel > div')) d.classList.toggle('on', d.dataset.panel === t);
    const el = document.querySelector(`#panel > div[data-panel=${t}]`);
    if (t === 'map') this.drawMap(true);
    else el.innerHTML = { case: () => this._case(), journal: () => this._journal(), people: () => this._people(), you: () => this._you(), property: () => this._property(), notes: () => this._notes(), settings: () => this._settings() }[t]();
    this._wirePanel(el);
  }
  _wirePanel(el) {
    const g = this.g;
    for (const b of el.querySelectorAll('[data-do]')) b.addEventListener('click', () => {
      const [cmd, arg] = b.dataset.do.split(':');
      if (cmd === 'set') { const [k, v] = arg.split('='); g.setSetting(k, v); }
      if (cmd === 'race') { this.closeMenu(); g.startRace(arg); return; }
      if (cmd === 'track') { g.state.track = g.state.track === arg ? null : arg; g.state.customWP = null; }
      if (cmd === 'mark') { const p = g.npcPos(arg); if (p) { g.state.customWP = { x: p.x, z: p.z }; this.toast('Marked on your compass: ' + g.npcName(arg)); } }
      if (cmd === 'wear') g.wear(arg);
      if (cmd === 'view') { this.closeMenu(); g.view = 'third'; this.toast('Third person: press V (or 👁) to go back to first person.'); return; }
      if (cmd === 'land') { this.closeMenu(); this.openLand(); return; }
      if (cmd === 'biz') { this.closeMenu(); this.openBiz(); return; }
      if (cmd === 'build') { this.closeMenu(); g.openBuilder(arg); return; }
      if (cmd === 'home') { const L = g.lots.find(l => l.id === arg); if (L) { g.state.customWP = { x: L.x, z: L.z }; this.toast('Marked on your compass.'); } }
      this.showTab(this.tab);
    });
    for (const inp of el.querySelectorAll('[data-setting]')) inp.addEventListener('change', () => this.g.setSetting(inp.dataset.setting, inp.type === 'checkbox' ? inp.checked : inp.value));
  }
  _case() {
    const g = this.g, s = g.state; let h = '<div class="sect"><h2>The case of Aurelio Valdovinos</h2>';
    CHAPTERS.forEach((c, i) => {
      if (i > s.ch && !s.ending) return;
      const done = i < s.ch || s.ending, cur = i === s.ch && !s.ending;
      h += `<div class="quest main ${done ? 'done' : ''}"><h3>${esc(c.title)}${done ? ' — solved' : ''}</h3>`;
      c.steps.forEach((st, k) => { if (done || k < s.st) h += `<p>✓ ${esc(st.text)}</p>`; else if (cur && k === s.st) h += `<p class="now">→ ${esc(st.text)}</p>`; });
      h += '</div>';
    });
    if (s.ending) h += `<p><b>Ending:</b> ${esc(g.endingTitle())}</p>`;
    h += '<h2>Clues</h2>';
    if (!s.clues.length) h += '<p class="dim">Nothing yet.</p>';
    for (const id of s.clues) { const c = CLUES[id]; if (c) h += `<div class="note"><h3>${esc(c.name)}</h3><p>${esc(c.text)}</p></div>`; }
    return h + '</div>';
  }
  _journal() {
    const g = this.g, s = g.state; let h = '<div class="sect">';
    const J = g.side.journal(), act = J.filter(j => j.active), done = J.filter(j => j.done && !j.active);
    h += '<h2>Side quests and jobs</h2>';
    if (!act.length) h += '<p class="dim">Nothing in hand. People with a teal <b>!</b> over their heads need a hand; jobs are at the taxi stand on Calle Abasolo, the Azul Portal, Materiales El Albañil and Tía Cuca\'s cart.</p>';
    for (const j of act) h += `<div class="quest side"><h3>${esc(j.Q.name)}${j.Q.job ? ' <span class="tag">job</span>' : ''}</h3><p class="now">→ ${esc(j.step.text)}</p><button data-do="track:${j.Q.id}" class="${s.track === j.Q.id ? 'on' : ''}">${s.track === j.Q.id ? 'Tracking on the compass' : 'Track on the compass'}</button></div>`;
    const avail = QUESTS.filter(Q => g.side.available(Q) && (!Q.hidden)).map(Q => `<li><b>${esc(Q.name)}</b>: ask ${esc(g.npcName(Q.giver))}</li>`);
    if (avail.length) h += `<details><summary>Who might need you (${avail.length})</summary><ul class="avail">${avail.join('')}</ul></details>`;
    if (done.length) h += '<h3>Done</h3><ul class="done-list">' + done.map(j => `<li>✓ ${esc(j.Q.name)}${j.count > 1 ? ` ×${j.count}` : ''}</li>`).join('') + '</ul>';
    h += '<h2>Races</h2><p class="dim">Rosa set these up. Start one here, or ask her at the taller.</p><div class="grid">';
    for (const r of g.races) { const best = s.races[r.id]; const medal = best == null ? '' : best <= r.times[0] ? '🥇' : best <= r.times[1] ? '🥈' : best <= r.times[2] ? '🥉' : ''; h += `<div class="item"><h4>${r.mode === 'jet' ? '🚀' : '🚗'} ${esc(r.name)} ${medal}</h4><p>${esc(r.desc)}</p><p>Gold ${fmtT(r.times[0])} · Silver ${fmtT(r.times[1])} · Bronze ${fmtT(r.times[2])}${best != null ? ` · Your best ${fmtT(best)}` : ''}</p>${s.ch < 2 && !s.ending ? '<small>Unlocks after you meet Rosa.</small>' : `<button data-do="race:${r.id}">Start</button>`}</div>`; }
    h += '</div>';
    const pages = s.pages.length, visited = LANDMARK_IDS.filter(id => s.visited.includes(id)).length;
    h += `<h2>Small things</h2><p>Aurelio's lost pages: <b>${pages}</b> of ${PAGES.length} · Landmarks visited: <b>${visited}</b> of ${LANDMARK_IDS.length} · People met on the street: <b>${s.talked}</b> · Driven: <b>${(s.odo / 1000).toFixed(1)} km</b> · Flown: <b>${(s.flown / 1000).toFixed(1)} km</b></p>`;
    if (pages) h += PAGES.filter(p => s.pages.includes(p.id)).map(p => `<div class="note"><h3>${esc(p.title)}</h3><p><i>${esc(p.text)}</i></p></div>`).join('');
    const got = Object.keys(s.ach).length, all = Object.keys(ACHIEVEMENTS).length;
    h += `<h2>Achievements · ${got} of ${all}</h2><div class="grid ach-grid">`;
    for (const [id, a] of Object.entries(ACHIEVEMENTS)) h += `<div class="item ach ${s.ach[id] ? 'on' : ''}"><h4>${s.ach[id] ? '★' : '☆'} ${esc(a.name)}</h4><p>${esc(a.desc)}</p></div>`;
    return h + '</div></div>';
  }
  _people() {
    const g = this.g, L = g.life, rel = g.state.life.rel;
    const ids = Object.keys(rel).filter(id => g.npcDef(id) || rel[id].name).sort((a, b) => rel[b].a - rel[a].a);
    let h = `<div class="sect"><h2>People you know · ${ids.length}</h2><p class="dim">How they feel about you, what they like (once they trust you), and where to find them. Gifts, jokes, compliments, help and honesty all count; so do insults and lies.</p>`;
    if (!ids.length) h += '<p class="dim">Nobody yet. Talk to people: everyone on the street is someone.</p>';
    h += '<div class="people">';
    for (const id of ids) {
      const d = g.npcDef(id) || { name: rel[id].name, title: '', look: {} }, r = rel[id], lv = L.level(id), pct = (r.a + 100) / 2;
      const likes = r.known.includes('likes') ? g.talker.likesOf({ def: d }).map(k => ITEMS[k] ? ITEMS[k].name.split(' (')[0] : k).join(', ') : '?';
      const where = d.at ? (PLACES[d.at] || {}).name : d.place ? (PLACES[d.place] || {}).name : d.district || '';
      const party = d.party && PARTIES[d.party] ? `<span class="party" style="--pc:${PARTIES[d.party].css}">${esc(PARTIES[d.party].name)}</span>` : '';
      h += `<div class="person"><div class="avatar" style="background:radial-gradient(circle at 40% 35%, ${hex((d.look && d.look.top) || 0x555555)}, #1a1a22)">${esc((d.name || '?').replace(/^(Tía|Don|Doña|Lic\.|Padre|Maestra|Maestro|Madre|Comandante|Regidora?)\s+/, '').charAt(0))}</div>
        <div class="pinfo"><b>${esc(d.name)}</b><small>${esc(d.title || '')}</small>
        <div class="tags"><span class="lvl" style="--lc:${lv.color}">${esc(lv.en)}</span>${r.romance ? `<span class="rom">❀ ${esc(ROMANCE_EN[r.romance])}</span>` : ''}${party}${g.state.life.spouse === id ? '<span class="rom">💍 Spouse</span>' : ''}</div>
        <span class="meter"><i style="width:${pct}%;background:${lv.color}"></i></span>
        <small>Likes: ${esc(likes)}${where ? ' · Usually: ' + esc(String(where).split(' (')[0]) : ''}</small></div>
        <button data-do="mark:${id}" aria-label="Show ${esc(d.name)} on the compass">📍</button></div>`;
    }
    return h + '</div></div>';
  }
  _you() {
    const g = this.g, s = g.state, L = g.life, ls = s.life;
    const bar = (v, neg, pos, cls) => `<div class="axis ${cls}"><span>${neg}</span><div class="track"><i style="left:${(v + 100) / 2}%"></i></div><span>${pos}</span></div>`;
    let h = `<div class="sect"><div class="you-head"><div><h2>${esc(s.name)} ${esc(L.title())}</h2><p class="dim">“${esc(L.titleEn())}” — what Jiquilpan calls you, from what you have said and done.</p></div><button data-do="view">See yourself 👁</button></div>`;
    h += bar(ls.heart, 'Cruel', 'Compassionate', 'heart') + bar(ls.word, 'Deceitful', 'Honest', 'word');
    h += `<div class="stats"><div><b>$${fmt(ls.money)}</b><small>money</small></div><div><b>${Math.round(ls.fame)}</b><small>fame</small></div><div><b>${L.style()}</b><small>style</small></div><div><b>${L.luck()}</b><small>luck</small></div><div><b>${L.friends()}</b><small>friends</small></div></div>`;
    h += '<h3>Wardrobe</h3><div class="list">';
    for (const id of ls.owned) { const c = CLOTHES[id]; if (!c) continue; const on = ls.outfit[c.slot] === id; h += `<div class="row-item"><span class="sw" style="background:${hex(c.color)}"></span><div><b>${esc(c.name)}</b><small>${c.slot} · style +${c.style}${c.luck ? ` · luck +${c.luck}` : ''}</small></div><button data-do="wear:${id}" class="${on ? 'on' : ''}">${on ? 'Wearing' : 'Wear'}</button></div>`; }
    h += '</div><p class="dim">More clothes at the Boutique Rosa Mexicano and the Sombrerería La Texana on the Jardín, the Casita de Piedra and the Mercado de Artesanías. Haircuts at Don Beto\'s.</p>';
    const items = Object.entries(ls.items).filter(([, n]) => n > 0);
    h += '<h3>In your bag</h3>' + (items.length ? '<div class="list">' + items.map(([k, n]) => `<div class="row-item"><span class="sw">${ITEMS[k] && ITEMS[k].gift ? '🎁' : '🎟️'}</span><div><b>${esc(ITEMS[k] ? ITEMS[k].name : k)}</b><small>× ${n}${ITEMS[k] && ITEMS[k].gift ? ' · give it in a conversation: Say something… → Give them a gift' : ''}</small></div></div>`).join('') + '</div>' : '<p class="dim">Nothing. Flowers, pan dulce and gaspachos make good gifts.</p>');
    return h + '</div>';
  }
  _property() {
    const g = this.g, L = g.life, ls = g.state.life;
    let h = '<div class="sect"><h2>Your land and houses</h2>';
    const mine = LOTS.filter(l => L.ownsLot(l.id));
    if (!mine.length) h += '<p class="dim">You don\'t own any land yet. Lic. Partida at Bienes Raíces (by the Jardín) sells lots; you can also look at the “SE VENDE” signs.</p>';
    for (const l of mine) { const lot = ls.props[l.id]; h += `<div class="quest"><h3>${esc(lot.name || l.name)}</h3><p>${lot.parts.length} parts built${lot.queue.length ? `, ${lot.queue.length} on order` : ''} · style: ${esc(HOUSE_STYLES[lot.style].name)}</p><div class="row left"><button data-do="build:${l.id}" class="primary">Plan and build</button><button data-do="home:${l.id}">Show on compass</button></div></div>`; }
    h += '<div class="row left"><button data-do="land">See land for sale</button><button data-do="biz">See businesses for sale</button></div>';
    h += '<h2>Businesses</h2>';
    const biz = BUSINESSES.filter(b => ls.biz[b.id] && ls.biz[b.id].owned);
    if (!biz.length) h += '<p class="dim">None yet. A nieves cart on the Jardín costs $6,000 and pays every morning.</p>';
    for (const b of biz) { const o = ls.biz[b.id]; h += `<div class="item"><h4>${esc(b.name)} · level ${o.level}</h4><p>About $${fmt(Math.round(b.income * (1 + (o.level - 1) * 0.6)))} a day · earned $${fmt(o.earned || 0)}</p></div>`; }
    return h + '</div>';
  }
  _notes() { return '<div class="sect"><h2>Field Notes</h2>' + NOTES.map(n => `<div class="note"><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`).join('') + '<p class="dim">Map data © OpenStreetMap contributors and Overture Maps Foundation (ODbL). Elevation: open terrain tiles (SRTM and national models). Photographs of the town shared by people who know it guided the buildings.</p></div>'; }
  _settings() {
    const s = this.g.settings, seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-do="set:${k}=${v}" class="${String(s[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const range = (k, min, max, step) => `<input type="range" data-setting="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}" aria-label="${k}">`;
    return `<div class="sect"><h2>Settings</h2>
    <h3>Seeing</h3>
    <div class="setting"><label>Picture quality</label>${seg('quality', [['low', 'Light'], ['medium', 'Balanced'], ['high', 'Beautiful'], ['cinematic', 'Cinematic']])}<small>Lighter quality runs better on phones. Cinematic is for a strong graphics card. Takes effect the next time the town loads.</small></div>
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
    <h3>Controls</h3>
    <p class="dim">On foot: WASD walk · mouse look (click to capture) · Shift run · Space jump · E talk, examine, get in a car · V third person · G jetpack · M map · C mystery · P people · O you · Esc menu · U unstuck.<br>In a conversation: 1–9 choose a line, Esc leave.<br>Flying: Space up · Z or Ctrl down · W flies where you look · hold Shift to boost · G to land.<br>Driving: W/S throttle and brake · A/D steer · Space handbrake · H horn · E get out.<br>Touch: left thumb moves, right thumb looks; buttons on the right.</p>
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
    for (const [id, S] of Object.entries(SHOPS)) { const p = PLACES[S.place]; if (p) marks.push({ x: p.x, z: p.z, kind: 'shop', label: S.name, color: '#f2efe8' }); }
    for (const L of g.lots || []) marks.push({ x: L.x, z: L.z, kind: 'lot', label: g.life.ownsLot(L.id) ? 'Your land: ' + L.name : 'For sale: ' + L.name, color: g.life.ownsLot(L.id) ? '#a6e3a1' : '#f2d24a' });
    for (const t of g.side.targets()) marks.push({ x: t.x, z: t.z, kind: 'side', label: t.q.name, color: '#7fe0cf' });
    for (const n of g.npcs) if (n.visible && !n.def.ambient && !n.def.hidden && !n.def.shop) marks.push({ x: n.x, z: n.z, kind: 'npc', label: n.def.name + ', ' + n.def.title, color: g.npcHasQuest(n.id) ? '#ffcf5a' : '#e8e0cc', npc: n });
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
    if (g.city.cerroRoad) { c.strokeStyle = '#d8c8a8'; c.lineWidth = Math.max(1.5, 6 * v.s); c.beginPath(); g.city.cerroRoad.pts.forEach(([x, z], i) => i ? c.lineTo(X(x), Y(z)) : c.moveTo(X(x), Y(z))); c.stroke(); }
    if (v.s > 0.8) { c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = '11px Inter, sans-serif'; const seen = new Set(); for (const st of g.city.streets) { if (!st.name || seen.has(st.name)) continue; const m = st.pts[Math.floor(st.pts.length / 2)], x = X(m[0]), y = Y(m[1]); if (x > 0 && y > 0 && x < W && y < H) { seen.add(st.name); c.fillText(st.name, x + 3, y - 3); } } }
    this._marks = this._mapMarks();
    for (const m of this._marks) {
      const x = X(m.x), y = Y(m.z); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      if ((m.kind === 'shop' || m.kind === 'lot') && v.s < 0.35) continue;
      c.fillStyle = m.color; c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath();
      if (m.kind === 'place') c.rect(x - 5, y - 5, 10, 10); else if (m.kind === 'shop' || m.kind === 'lot') { c.moveTo(x, y - 6); c.lineTo(x + 6, y); c.lineTo(x, y + 6); c.lineTo(x - 6, y); c.closePath(); } else c.arc(x, y, 5, 0, Math.PI * 2);
      c.fill(); c.stroke();
      if (v.s > 0.18 || m.kind === 'place') { c.fillStyle = '#fff'; c.font = '600 11px Inter, sans-serif'; c.fillText(m.label.split(/[,(]/)[0], x + 8, y + 4); }
    }
    const wp = g.waypoint(); if (wp) { const x = X(wp.x), y = Y(wp.z); c.strokeStyle = '#ffcf5a'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.stroke(); }
    const px = X(g.player.x), py = Y(g.player.z); c.save(); c.translate(px, py); c.rotate(-g.viewYaw()); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 8); c.lineTo(0, 3); c.lineTo(-8, 8); c.closePath(); c.fill(); c.stroke(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = '12px Inter, sans-serif'; c.fillText('Squares: landmarks · diamonds: shops and land · teal: side quests · tap to mark · drag, pinch or ＋/－', 10, 18);
  }
  _mapClick(e) {
    const g = this.g, cv = $('map'), r = cv.getBoundingClientRect(), v = this.mapView, mx = e.clientX - r.left, my = e.clientY - r.top;
    const wx = (mx - r.width / 2) / v.s + v.x, wz = (my - r.height / 2) / v.s + v.z;
    let hit = null, bd = 16;
    for (const m of this._marks || []) { const d = Math.hypot((m.x - v.x) * v.s + r.width / 2 - mx, (m.z - v.z) * v.s + r.height / 2 - my); if (d < bd) { bd = d; hit = m; } }
    const info = $('map-info');
    if (hit) {
      info.innerHTML = `<h3>${esc(hit.label)}</h3><p>${hit.kind === 'place' ? (hit.open ? 'You have been here. You can go back quickly.' : 'Visit once to be able to travel here quickly.') : hit.npc && g.npcHasQuest(hit.npc.id) ? 'They have something for you.' : ''}</p>`;
      const row = document.createElement('div'); row.className = 'row left';
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
