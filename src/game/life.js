// A life in Jiquilpan: money, who you are becoming (heart and word), who you know and how they feel about you,
// what you carry, what you wear, the land you own, the house you build and the businesses you run.
// Like the old fairy-tale role-playing games: every choice leaves a mark, and the town remembers.
import { CLOTHES, ITEMS, LOTS, BUSINESSES, HOUSE_PARTS } from './shops.js';

export const REL_LEVELS = [
  { min: -101, name: 'Enemigo', en: 'Enemy', color: '#e0705a' },
  { min: -50, name: 'Antipático', en: 'Cold', color: '#d89a6a' },
  { min: -15, name: 'Conocido', en: 'Acquaintance', color: '#b8c0cc' },
  { min: 15, name: 'Amigo', en: 'Friend', color: '#9fd8a0' },
  { min: 45, name: 'Buen amigo', en: 'Good friend', color: '#7fd0c8' },
  { min: 75, name: 'Compadre', en: 'Compadre', color: '#f2c86a' }
];
export const ROMANCE = ['', 'Le gustas', 'Novios', 'Comprometidos', 'Casados'];
export const ROMANCE_EN = ['', 'Sweet on you', 'Dating', 'Engaged', 'Married'];

export function lifeDefaults(gender = 'x') {
  return {
    gender, money: 2000, heart: 0, word: 0, fame: 0, luck: 0,
    rel: {}, items: {}, owned: ['camisaBlanca', 'mezclilla', 'tenis'],
    outfit: { hat: null, top: 'camisaBlanca', bottom: 'mezclilla', shoes: 'tenis', extra: null },
    look: { skin: 0xc99a78, hair: 0x2a1d16, hairStyle: gender === 'f' ? 'long' : 'short', beard: false, glasses: false },
    props: {}, biz: {}, side: {}, spouse: null, lastIncomeDay: 1,
    stats: { fares: 0, earned: 0, spent: 0, gifts: 0, jokes: 0, insults: 0, built: 0, lotteryWins: 0, goals: 0 }
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Life {
  constructor(game) { this.g = game; }
  get s() { return this.g.state.life; }
  /* ---------- money ---------- */
  afford(n) { return this.s.money >= n; }
  earn(n, why) { n = Math.round(n); if (!n) return; this.s.money += n; this.s.stats.earned += n; this.g.ui.money(this.s.money, +n); if (why) this.g.ui.toast(`+$${fmt(n)} · ${why}`, 'money'); this.g.checkWealth(); }
  spend(n, why) {
    n = Math.round(n);
    if (this.s.money < n) { this.g.ui.toast(`You need $${fmt(n)}. You have $${fmt(this.s.money)}.`, 'warn'); return false; }
    this.s.money -= n; this.s.stats.spent += n; this.g.ui.money(this.s.money, -n); if (why) this.g.ui.toast(`−$${fmt(n)} · ${why}`, 'money'); return true;
  }
  /* ---------- who you are becoming ---------- */
  trait(k, d, quiet) {
    if (!d) return; const s = this.s, before = this.title();
    s[k] = clamp((s[k] || 0) + d, k === 'fame' || k === 'luck' ? 0 : -100, 100);
    if (!quiet) this.g.ui.traitPulse(k, d);
    const after = this.title(); if (after !== before) this.g.ui.toast(`People have started calling you “${this.g.state.name} ${after}”.`, 'quest');
    this.g.traitAchievements();
  }
  /** "el Justo", "la Pícara"… from heart (compassion) and word (honesty), in the player's grammatical gender. */
  title() {
    const s = this.s, h = s.heart, w = s.word, G = s.gender;
    const a = (m, f, x) => G === 'f' ? f : G === 'm' ? m : x;
    const hi = 35;
    if (h >= hi && w >= hi) return a('el Justo', 'la Justa', 'de Buen Corazón');
    if (h >= hi && w <= -hi) return a('el Pícaro', 'la Pícara', 'el Alma Pícara');
    if (h <= -hi && w >= hi) return a('el Duro', 'la Dura', 'de Mano Dura');
    if (h <= -hi && w <= -hi) return a('el Coyote', 'la Coyota', 'el Coyote');
    if (h >= hi) return a('el Buenazo', 'la Buenaza', 'de Gran Corazón');
    if (h <= -hi) return a('el Bravo', 'la Brava', 'de Pocas Pulgas');
    if (w >= hi) return a('el de Palabra', 'la de Palabra', 'de Palabra');
    if (w <= -hi) return a('el Chapucero', 'la Chapucera', 'el Chapucero');
    if (s.fame >= 60) return a('el Famoso', 'la Famosa', 'de Fama');
    return a('el Forastero', 'la Forastera', 'de Guadalajara');
  }
  titleEn() {
    const t = this.title();
    return { 'el Justo': 'the Just', 'la Justa': 'the Just', 'de Buen Corazón': 'the Kind-Hearted', 'el Pícaro': 'the Rogue', 'la Pícara': 'the Rogue', 'el Alma Pícara': 'the Rogue',
      'el Duro': 'the Stern', 'la Dura': 'the Stern', 'de Mano Dura': 'the Stern', 'el Coyote': 'the Coyote', 'la Coyota': 'the Coyote', 'el Buenazo': 'the Good-Hearted', 'la Buenaza': 'the Good-Hearted',
      'de Gran Corazón': 'the Good-Hearted', 'el Bravo': 'the Fierce', 'la Brava': 'the Fierce', 'de Pocas Pulgas': 'the Short-Tempered', 'el de Palabra': 'of Their Word', 'la de Palabra': 'of Their Word', 'de Palabra': 'of Their Word',
      'el Chapucero': 'the Trickster', 'la Chapucera': 'the Trickster', 'el Famoso': 'the Famous', 'la Famosa': 'the Famous', 'de Fama': 'the Famous', 'el Forastero': 'the Stranger', 'la Forastera': 'the Stranger', 'de Guadalajara': 'from Guadalajara' }[t] || '';
  }
  /* ---------- relationships ---------- */
  rel(id) { const r = this.s.rel; return r[id] || (r[id] = { a: 0, romance: 0, gifts: 0, talks: 0, lastDay: 0, did: {}, known: [] }); }
  known(id) { return !!this.s.rel[id]; }
  affinity(id, d, why) {
    const r = this.rel(id), before = this.level(id).name;
    r.a = clamp(r.a + d, -100, 100);
    const after = this.level(id).name;
    if (after !== before) { const n = this.g.npcName(id); this.g.ui.toast(`${n}: ${before} → ${after}`, d > 0 ? 'good' : 'warn'); this.g.relAchievements(); }
    if (why) this.g.ui.relPulse(d);
    return r.a;
  }
  level(id) { const a = this.rel(id).a; let L = REL_LEVELS[0]; for (const l of REL_LEVELS) if (a >= l.min) L = l; return L; }
  /** today's count of an action with this person, to stop farming the same compliment */
  did(id, what) { const r = this.rel(id), day = this.g.state.day; if (r.lastDay !== day) { r.lastDay = day; r.did = {}; } r.did[what] = (r.did[what] || 0) + 1; return r.did[what]; }
  friends() { return Object.entries(this.s.rel).filter(([, r]) => r.a >= 15).length; }
  /* ---------- things ---------- */
  add(item, n = 1) { const it = this.s.items; it[item] = (it[item] || 0) + n; }
  has(item) { return (this.s.items[item] || 0) > 0; }
  take(item) { if (!this.has(item)) return false; this.s.items[item]--; if (!this.s.items[item]) delete this.s.items[item]; return true; }
  gifts() { return Object.entries(this.s.items).filter(([k, n]) => n > 0 && ITEMS[k] && ITEMS[k].gift).map(([k, n]) => ({ id: k, n, ...ITEMS[k] })); }
  /* ---------- clothes and looks ---------- */
  own(id) { return this.s.owned.includes(id); }
  buyClothes(id) { const c = CLOTHES[id]; if (!c || this.own(id)) return false; if (!this.spend(c.price, c.name)) return false; this.s.owned.push(id); this.wear(id); return true; }
  wear(id) { const c = CLOTHES[id]; if (!c) return; this.s.outfit[c.slot] = this.s.outfit[c.slot] === id && (c.slot === 'hat' || c.slot === 'extra') ? null : id; this.g.dressPlayer(); }
  style() { let n = 0; for (const id of Object.values(this.s.outfit)) if (id && CLOTHES[id]) n += CLOTHES[id].style; return n; }
  luck() { let n = this.s.luck; for (const id of Object.values(this.s.outfit)) if (id && CLOTHES[id] && CLOTHES[id].luck) n += CLOTHES[id].luck; if (this.has('amuleto')) n += 10; return n; }
  /** the spec makePerson() draws the player with */
  appearance() {
    const s = this.s, o = s.outfit, L = s.look, get = k => o[k] && CLOTHES[o[k]];
    const top = get('top'), bottom = get('bottom'), shoes = get('shoes'), hat = get('hat'), extra = get('extra');
    return {
      skin: L.skin, hair: L.hair, hairStyle: L.hairStyle, beard: L.beard, glasses: L.glasses,
      top: top ? top.color : 0xe8e2d4, bottom: bottom ? bottom.color : 0x2a3a5a, dress: !!(bottom && bottom.dress) || !!(top && top.dress),
      shoes: shoes ? shoes.color : 0x2a2420, hat: hat ? hat.hat : 'none', hatColor: hat ? hat.color : undefined,
      coat: top && top.coat ? top.coat : false, kit: top && top.kit ? top.kit : undefined, accessory: extra ? extra.accessory : undefined, accColor: extra ? extra.color : undefined,
      height: s.gender === 'f' ? 0.95 : 1, build: 1
    };
  }
  /* ---------- land, houses, businesses ---------- */
  ownsLot(id) { return !!(this.s.props[id] && this.s.props[id].owned); }
  lot(id) { return this.s.props[id] || (this.s.props[id] = { owned: false, style: 'colonial', color: 0, name: '', parts: [], queue: [] }); }
  anyHome() { return Object.entries(this.s.props).find(([, p]) => p.owned && p.parts.includes('sala')); }
  homeWith(part) { return Object.entries(this.s.props).find(([, p]) => p.owned && p.parts.includes(part)); }
  buyLot(id) { const L = LOTS.find(l => l.id === id); if (!L || this.ownsLot(id)) return false; if (!this.spend(L.price, 'Escrituras: ' + L.name)) return false; this.lot(id).owned = true; this.g.onPropertyChanged(id); return true; }
  /** hire the albañiles for a part: pay now, it goes up over the next hours */
  order(lotId, part, cost) {
    const P = HOUSE_PARTS[part], lot = this.lot(lotId); if (!P || lot.parts.includes(part) || lot.queue.some(q => q.part === part)) return false;
    if (!this.spend(cost || P.cost, 'Albañiles: ' + P.name.split(' (')[0])) return false;
    const st = this.g.state, now = (st.day - 1) * 24 + st.hour, last = lot.queue.length ? lot.queue[lot.queue.length - 1].done : now;
    lot.queue.push({ part, start: Math.max(now, last), done: Math.max(now, last) + P.hours });
    this.g.onPropertyChanged(lotId); return true;
  }
  /** called every game hour or so: finish what the albañiles finished */
  tick() {
    const st = this.g.state, now = (st.day - 1) * 24 + st.hour, s = this.s;
    for (const [id, lot] of Object.entries(s.props)) {
      let changed = false;
      while (lot.queue.length && lot.queue[0].done <= now) { const q = lot.queue.shift(); lot.parts.push(q.part); s.stats.built++; changed = true; this.g.ui.toast(`Maestro Chuy: “¡Ya quedó ${HOUSE_PARTS[q.part].name.toLowerCase()}!”`, 'good'); }
      if (changed) { this.g.onPropertyChanged(id); if (!lot.queue.length && lot.parts.length >= 6) this.g.unlock('casaPropia'); }
    }
    // the businesses pay at six in the morning
    if (st.day > s.lastIncomeDay && st.hour >= 6) {
      let total = 0; const days = Math.min(3, st.day - s.lastIncomeDay);
      for (const [id, b] of Object.entries(s.biz)) { const B = BUSINESSES.find(x => x.id === id); if (!B || !b.owned) continue; const inc = Math.round(B.income * (1 + (b.level - 1) * 0.6) * (1 + Math.max(0, s.fame) / 200) * (0.85 + Math.random() * 0.3) * days); b.earned = (b.earned || 0) + inc; total += inc; }
      for (const [, lot] of Object.entries(s.props)) if (lot.owned && lot.parts.includes('tienda')) total += 260 * days;
      s.lastIncomeDay = st.day;
      if (total > 0) this.earn(total, 'your businesses, overnight');
    }
  }
  buyBiz(id) { const B = BUSINESSES.find(b => b.id === id); if (!B || (this.s.biz[id] && this.s.biz[id].owned)) return false; if (!this.spend(B.price, B.name)) return false; this.s.biz[id] = { owned: true, level: 1, earned: 0 }; this.g.onBizChanged(id); return true; }
  upgradeBiz(id) { const B = BUSINESSES.find(b => b.id === id), b = this.s.biz[id]; if (!B || !b || b.level >= 3) return false; const cost = Math.round(B.price * 0.7 * b.level); if (!this.spend(cost, `${B.name}: ${B.upgrades[b.level - 1]}`)) return false; b.level++; this.g.onBizChanged(id); return true; }
}
export function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
