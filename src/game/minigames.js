// Mini games, drawn over the town: lotería on the Jardín, penalties against Chema, Don Emeterio's history
// examination, laying block for Maestro Chuy, dyeing cloth with Doña Petra's añil, waiting tables at the Azul Portal,
// and a serenade. Each one is plain buttons: mouse, touch, keyboard (Enter/Space) and screen readers all work.
// play(id, opts) resolves { win, money, score }.

const $ = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* the lotería: the cards and their callers' verses */
const CARDS = [
  ['El Gallo', '🐓', 'El que le cantó a San Pedro no le volverá a cantar'], ['El Diablito', '😈', 'Pórtate bien, cuatito, si no te lleva el coloradito'],
  ['La Dama', '👒', 'Puliendo el paso, por toda la calle real'], ['El Catrín', '🎩', 'Don Ferruco en la alameda, su bastón quería tirar'],
  ['El Paraguas', '☂️', 'Para el sol y para el agua'], ['La Sirena', '🧜', 'Con los cantos de sirena no te vayas a marear'],
  ['La Escalera', '🪜', 'Súbeme paso a pasito, no quieras pegar brinquitos'], ['La Botella', '🍾', 'La herramienta del borracho'],
  ['El Barril', '🛢️', 'Tanto bebió el albañil, que quedó como barril'], ['El Árbol', '🌳', 'El que a buen árbol se arrima, buena sombra le cobija'],
  ['El Melón', '🍈', 'Me lo das o me lo quitas'], ['El Valiente', '🗡️', 'Por qué le corres cobarde, trayendo tan buen puñal'],
  ['El Gorrito', '🧢', 'Ponle su gorrito al nene, no se nos vaya a resfriar'], ['La Muerte', '💀', 'La muerte siriquisiaca'],
  ['La Pera', '🍐', 'El que espera, desespera'], ['La Bandera', '🇲🇽', 'Verde, blanco y colorado, la bandera del soldado'],
  ['El Bandolón', '🪕', 'Tocando su bandolón, está el mariachi Simón'], ['El Violoncello', '🎻', 'Creciendo se fue hasta el cielo, y como no fue violín, tuvo que ser violoncello'],
  ['La Garza', '🦩', 'Al otro lado del río tengo mi banco de arena'], ['El Pájaro', '🐦', 'Tú me traes a puros brincos, como pájaro en la rama'],
  ['La Mano', '✋', 'La mano de un criminal'], ['La Bota', '👢', 'Una bota igual que la otra'],
  ['La Luna', '🌙', 'El farol de los enamorados'], ['El Cotorro', '🦜', 'Cotorro cotorro saca la pata, y empiézame a platicar'],
  ['El Corazón', '❤️', 'No me extrañes corazón, que regreso en el camión'], ['La Sandía', '🍉', 'La barriga que Juan tenía, era empacho de sandía'],
  ['El Tambor', '🥁', 'No te arrugues, cuero viejo, que te quiero pa\' tambor'], ['El Camarón', '🦐', 'Camarón que se duerme, se lo lleva la corriente'],
  ['Las Jaras', '🏹', 'Las jaras del indio Adán, donde pegan, dan'], ['El Músico', '🎺', 'El músico trompas de hule, ya no me quiere tocar'],
  ['La Araña', '🕷️', 'Atarántamela a palos, no me la dejes llegar'], ['El Soldado', '💂', 'Uno, dos y tres, el soldado p\'al cuartel'],
  ['La Estrella', '⭐', 'La guía de los marineros'], ['El Cazo', '🍲', 'El caso que te hago es poco'],
  ['El Mundo', '🌎', 'Este mundo es una bola, y nosotros un bolón'], ['El Nopal', '🌵', 'Al nopal lo van a ver nomás cuando tiene tunas'],
  ['El Alacrán', '🦂', 'El que con la cola pica, le dan una paliza'], ['La Rosa', '🌹', 'Rosita, Rosaura, ven que te quiero ahora'],
  ['La Calavera', '☠️', 'Al pasar por el panteón, me encontré un calaverón'], ['La Campana', '🔔', 'Tú con la campana y yo con tu hermana'],
  ['El Cantarito', '🏺', 'Tanto va el cántaro al agua, que se quiebra y te moja las enaguas'], ['El Venado', '🦌', 'Saltando va buscando, pero no ve nada'],
  ['El Sol', '☀️', 'La cobija de los pobres'], ['La Corona', '👑', 'El sombrero de los reyes'], ['La Chalupa', '🛶', 'Rema y rema va Lupita, sentada en su chalupita'],
  ['El Pino', '🌲', 'Fresco y oloroso, en todo tiempo hermoso'], ['El Pescado', '🐟', 'El que por la boca muere, aunque mudo fuere'],
  ['La Palma', '🌴', 'Palmero, sube a la palma y bájame un coco real'], ['La Maceta', '🪴', 'El que nace pa\' maceta, no sale del corredor'],
  ['El Arpa', '🎼', 'Arpa vieja de mi suegra, ya no sirves pa\' tocar'], ['La Rana', '🐸', 'Al ver a la verde rana, qué susto se llevó tu hermana']
];
/* Don Emeterio's examination: real history of Jiquilpan and the General */
const QUIZ = [
  ['In what year was Lázaro Cárdenas born in Jiquilpan?', ['1895', '1910', '1934', '1870'], 0],
  ['On what date did Cárdenas announce the oil expropriation, the day the stadium is named for?', ['18 March 1938', '16 September 1810', '20 November 1910', '5 May 1862'], 0],
  ['Who painted the murals of the Biblioteca Gabino Ortiz, in 1940?', ['José Clemente Orozco', 'Diego Rivera', 'David Alfaro Siqueiros', 'Frida Kahlo'], 0],
  ['The Biblioteca Gabino Ortiz is in a building that was first…', ['a sanctuary of the Virgin of Guadalupe', 'a railway station', 'a cotton mill', 'a jail'], 0],
  ['What does the name Jiquilpan come from?', ['the place of the jiquilite, the plant that gives añil (indigo)', 'the place of the eagles', 'the place of the hot springs', 'the place of the corn'], 0],
  ['Which other President of Mexico was born in Jiquilpan, in 1780?', ['Anastasio Bustamante', 'Benito Juárez', 'Porfirio Díaz', 'Guadalupe Victoria'], 0],
  ['In which years was Lázaro Cárdenas President of Mexico?', ['1934–1940', '1920–1924', '1946–1952', '1958–1964'], 0],
  ['The oil expropriation of 1938 created which company?', ['PEMEX', 'CFE', 'Telmex', 'Ferrocarriles Nacionales'], 0],
  ['Jiquilpan was named a Pueblo Mágico in…', ['2012', '1995', '2001', '2020'], 0],
  ['Jiquilpan sits in which region, beside its twin town Sahuayo?', ['the Ciénega de Chapala', 'the Tierra Caliente', 'the Meseta Purépecha', 'the coast of Michoacán'], 0],
  ['Besides the oil, Cárdenas is remembered for a vast…', ['land reform, granting land to ejidos', 'railway privatisation', 'monarchy', 'gold rush'], 0],
  ['Lake Chapala, which you can glimpse from the cerro on clear days, is…', ['the largest lake in Mexico', 'a salt lake', 'an artificial reservoir from 1990', 'in Oaxaca'], 0]
];
const MENU = [['Enchiladas placeras', '🌮'], ['Corundas', '🫔'], ['Uchepos', '🌽'], ['Carnitas', '🥩'], ['Pozole', '🍲'], ['Agua de jamaica', '🍹'], ['Café de olla', '☕'], ['Gaspacho', '🥭'], ['Churipo', '🥘'], ['Nieve de pasta', '🍨'], ['Atole', '🥛'], ['Pan dulce', '🥐']];
const SONGS = { warm: 'Cielito lindo', shy: 'Sabor a mí', elder: 'Amor eterno', teen: 'Si nos dejan', political: 'El rey', pious: 'Las mañanitas', dry: 'Bésame mucho', parental: 'Amorcito corazón', suspicious: 'Sabes una cosa' };

export class MiniGames {
  constructor(game) { this.g = game; this.root = null; }
  open(title, sub) {
    const r = this.root = $('section', 'mini'); r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', title);
    const head = $('header', 'mini-head', `<div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`);
    const x = $('button', 'mini-x', 'Leave'); x.type = 'button'; x.onclick = () => this.done({ win: false, quit: true }); head.appendChild(x);
    r.appendChild(head); this.body = $('div', 'mini-body'); r.appendChild(this.body);
    document.body.appendChild(r); this.g.pauseInput(true); document.exitPointerLock && document.exitPointerLock();
    // Escape always leaves, whether or not the game itself listens for keys (and keeps the game's own handlers from seeing it)
    this._esc = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.done({ win: false, quit: true }); } };
    addEventListener('keydown', this._esc, true);
    return new Promise(res => { this._res = res; });
  }
  done(result) {
    if (!this.root) return; this.root.remove(); this.root = null; this.alive = false;
    clearInterval(this._iv); cancelAnimationFrame(this._raf); removeEventListener('keydown', this._key); removeEventListener('keydown', this._esc, true);
    this.g.pauseInput(false); const r = this._res; this._res = null; r && r(result);
  }
  key(fn) { this._key = e => { if (e.key === 'Escape') { e.preventDefault(); this.done({ win: false, quit: true }); } else fn(e); }; addEventListener('keydown', this._key); }
  btn(label, cls, fn) { const b = $('button', cls || '', label); b.type = 'button'; b.onclick = fn; return b; }
  async play(id, opts = {}) {
    this.alive = true;
    const f = { loteria: this.loteria, penales: this.penales, quiz: this.quiz, albanil: this.albanil, anil: this.anil, mesero: this.mesero, serenata: this.serenata, ferreteria: this.ferreteria }[id];
    return f ? f.call(this, opts) : { win: false };
  }

  /* ---------------- lotería ---------------- */
  loteria(o) {
    const p = this.open('¡Lotería!', 'Don Lencho calls the cards. Mark them on your tabla. Fill a row, a column, a diagonal or the four corners, then shout ¡Lotería! before anyone else.');
    const deck = shuffle(CARDS.map((c, i) => i)), mine = shuffle(CARDS.map((c, i) => i)).slice(0, 16);
    const rivals = [0, 1, 2].map(() => ({ tab: shuffle(CARDS.map((c, i) => i)).slice(0, 16), marks: new Set() }));
    const called = [], marks = new Set(), luck = Math.min(0.35, (o.luck || 0) / 100);
    const wrap = $('div', 'lot'), caller = $('div', 'lot-caller', '<span class="lot-emoji">🎴</span><b>Revolviendo…</b><i>Don Lencho shuffles the deck</i>'), grid = $('div', 'lot-grid');
    const cells = mine.map((ci, k) => { const c = CARDS[ci], b = this.btn(`<span>${c[1]}</span><small>${c[0]}</small>`, 'lot-cell', () => { if (!called.includes(ci) || marks.has(k)) return; marks.add(k); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); check(); }); b.setAttribute('aria-label', c[0]); grid.appendChild(b); return b; });
    const shout = this.btn('¡Lotería!', 'primary lot-shout', () => { if (line(marks)) end(true); else { status.textContent = 'Not yet! Don Lencho wags a finger: “¡Ese no es lotería, joven!”'; } });
    const status = $('p', 'lot-status', 'Three neighbours are playing too.'), rivalsEl = $('div', 'lot-rivals');
    wrap.append(caller, grid, $('div', 'row', ''), status, rivalsEl); wrap.children[2].append(shout); this.body.appendChild(wrap);
    const L = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [0, 5, 10, 15], [3, 6, 9, 12], [0, 3, 12, 15]];
    const line = m => L.some(l => l.every(k => m.has(k)));
    const check = () => shout.classList.toggle('ready', line(marks));
    const names = ['Doña Rocío', 'the shoe-shiner', 'a boy from Sahuayo'];
    const end = win => { clearInterval(this._iv); status.innerHTML = win ? '<b>¡LOTERÍA!</b> The whole Jardín turns round. Don Lencho hands you the pot: <b>$200</b>.' : `<b>${names[end.who || 0]}</b> shouts ¡Lotería! first. Next time.`; shout.disabled = true; cells.forEach(c => c.disabled = true);
      const cont = this.btn('Continue', 'primary', () => this.done({ win, money: win ? 200 : 0 })); wrap.appendChild(cont); cont.focus(); };
    let t = 0;
    const tick = () => {
      if (!this.alive) return;
      let ci; const unmarked = mine.filter((c, k) => !called.includes(c));
      if (Math.random() < luck && unmarked.length) { ci = unmarked[0]; deck.splice(deck.indexOf(ci), 1); } else ci = deck.shift();
      if (ci == null) { end(false); return; }
      called.push(ci); const c = CARDS[ci];
      caller.innerHTML = `<span class="lot-emoji">${c[1]}</span><b>${c[0]}</b><i>“${c[2]}”</i>`;
      for (const r of rivals) { const k = r.tab.indexOf(ci); if (k >= 0 && Math.random() < 0.82) r.marks.add(k); }
      rivalsEl.textContent = rivals.map((r, i) => `${names[i]}: ${r.marks.size}`).join(' · ');
      const w = rivals.findIndex(r => line(r.marks) && Math.random() < 0.6); if (w >= 0 && ++t > 1) { end.who = w; end(false); }
    };
    setTimeout(tick, 900); this._iv = setInterval(tick, 3200);
    this.key(e => { if (e.key === 'l' || e.key === 'L') shout.click(); });
    return p;
  }

  /* ---------------- penalties ---------------- */
  penales() {
    const p = this.open('El penal del domingo', 'Five shots against Chema, sixty-eight and stubborn. Pick a corner, then stop the power bar in the green.');
    const wrap = $('div', 'pen'), goal = $('div', 'pen-goal'), keeper = $('div', 'pen-keeper', '🧤'), ball = $('div', 'pen-ball', '⚽');
    goal.append(keeper, ball);
    const zones = [['Top left', 0.14, 0.25], ['Top right', 0.86, 0.25], ['Bottom left', 0.14, 0.75], ['Bottom right', 0.86, 0.75], ['Low centre', 0.5, 0.78], ['High centre', 0.5, 0.25]];
    const zb = zones.map(([n, x, y], i) => { const b = this.btn(n, 'pen-zone', () => aim(i)); b.style.left = (x * 100) + '%'; b.style.top = (y * 100) + '%'; goal.appendChild(b); return b; });
    const bar = $('div', 'pen-bar', '<i></i><b></b>'), status = $('p', 'pen-status', 'Shot 1 of 5. Pick where to shoot.'), shoot = this.btn('Shoot!', 'primary', () => fire());
    shoot.disabled = true; wrap.append(goal, bar, $('div', 'row'), status); wrap.children[2].append(shoot); this.body.appendChild(wrap);
    let target = -1, power = 0, dir = 1, n = 0, goals = 0, busy = false;
    const anim = () => { if (!this.alive) return; if (target >= 0 && !busy) { power += dir * 0.022; if (power > 1 || power < 0) dir *= -1; bar.querySelector('i').style.width = (power * 100) + '%'; } this._raf = requestAnimationFrame(anim); }; anim();
    const aim = i => { if (busy) return; target = i; zb.forEach((b, k) => b.classList.toggle('on', k === i)); shoot.disabled = false; shoot.focus(); status.textContent = `Aiming ${zones[i][0].toLowerCase()}. Stop the bar in the green.`; };
    const fire = async () => {
      if (target < 0 || busy) return; busy = true; shoot.disabled = true;
      const good = power > 0.55 && power < 0.86, over = power >= 0.93 && target < 2 || power >= 0.97, weak = power < 0.3;
      const guess = Math.random() < 0.38 ? target : Math.floor(Math.random() * 6), corner = target < 4;
      const [, kx, ky] = zones[guess], [, bx, by] = zones[target];
      keeper.style.left = (kx * 100) + '%'; keeper.style.top = (ky * 100) + '%';
      ball.style.left = (bx * 100) + '%'; ball.style.top = (over ? -12 : by * 100) + '%'; ball.classList.add('fly');
      await sleep(650);
      let scored = !over && !(guess === target && !(good && corner && Math.random() < 0.35)) && !(weak && guess !== target && Math.random() < 0.5);
      if (scored) goals++;
      n++; status.innerHTML = (over ? 'Over the bar! Chema laughs.' : scored ? '<b>¡GOOOL!</b>' : weak ? 'Too soft. Chema scoops it up.' : '¡Atajada! Chema saves it.') + ` Goals: ${goals} of ${n}.`;
      await sleep(900); ball.classList.remove('fly'); ball.style.left = '50%'; ball.style.top = '112%'; keeper.style.left = '50%'; keeper.style.top = '55%';
      target = -1; zb.forEach(b => b.classList.remove('on'));
      if (n >= 5) { const win = goals >= 4; status.innerHTML = win ? `<b>${goals} of 5!</b> Chema takes off his cap. “The shirt is yours. Don\'t wash it, it\'s lucky.”` : `${goals} of 5. “Come back Sunday,” says Chema. “I\'ll be older and you\'ll be better.”`; const c = this.btn('Continue', 'primary', () => this.done({ win, score: goals })); wrap.appendChild(c); c.focus(); return; }
      busy = false; status.innerHTML += ` Shot ${n + 1} of 5: pick a corner.`;
    };
    this.key(e => { if (e.key === ' ' || e.key === 'Enter') { if (document.activeElement && document.activeElement.tagName === 'BUTTON') return; e.preventDefault(); fire(); } const k = '123456'.indexOf(e.key); if (k >= 0) aim(k); });
    return p;
  }

  /* ---------------- Don Emeterio's examination ---------------- */
  quiz() {
    const p = this.open('Don Emeterio\'s examination', 'Eight questions. Six right and you pass. “No cheating. I can see your eyes.”');
    const qs = shuffle(QUIZ.slice()).slice(0, 8); let i = 0, right = 0;
    const box = $('div', 'quiz'); this.body.appendChild(box);
    const show = () => {
      box.innerHTML = '';
      if (i >= qs.length) { const win = right >= 6; box.appendChild($('p', 'quiz-q', win ? `<b>${right} of 8.</b> Don Emeterio closes his eyes and nods slowly. “Ten out of ten. I round up for people who walk.”` : `<b>${right} of 8.</b> “Hm. Walk the route again, and look harder.”`)); const c = this.btn('Continue', 'primary', () => this.done({ win, score: right })); box.appendChild(c); c.focus(); return; }
      const [q, opts, a] = qs[i], order = shuffle(opts.map((t, k) => k));
      box.appendChild($('p', 'quiz-n', `Question ${i + 1} of ${qs.length}`)); box.appendChild($('p', 'quiz-q', q));
      const list = $('div', 'quiz-opts'); box.appendChild(list);
      order.forEach((k, n) => { const b = this.btn(`<kbd>${n + 1}</kbd> ${opts[k]}`, 'quiz-opt', () => {
        list.querySelectorAll('button').forEach(x => x.disabled = true);
        if (k === a) { right++; b.classList.add('ok'); } else { b.classList.add('bad'); list.children[order.indexOf(a)].classList.add('ok'); }
        setTimeout(() => { i++; show(); }, 1100);
      }); list.appendChild(b); });
      list.firstChild.focus();
    };
    show();
    this.key(e => { const k = '1234'.indexOf(e.key); if (k >= 0) { const b = box.querySelectorAll('.quiz-opt')[k]; b && !b.disabled && b.click(); } });
    return p;
  }

  /* ---------------- laying block ---------------- */
  albanil(o) {
    const p = this.open(o.title || 'Echarle mano a la obra', 'The block slides along the wall. Drop it (button, Space or tap) so it sits on the one below: what overhangs is cut off. Eight courses, level and true.');
    const wrap = $('div', 'alb'), wall = $('div', 'alb-wall'), status = $('p', 'alb-status', 'Course 1 of 8'), drop = this.btn('Drop the block', 'primary', () => place());
    wrap.append(wall, $('div', 'row'), status); wrap.children[1].append(drop); this.body.appendChild(wrap);
    const W = 100; let left = 25, width = 50, row = 0, x = 0, dir = 1, speed = 0.9, rows = [];
    const cur = $('div', 'alb-block cur'); wall.appendChild(cur);
    const draw = () => { cur.style.left = x + '%'; cur.style.width = width + '%'; cur.style.bottom = (row * 11) + '%'; };
    const anim = () => { if (!this.alive) return; x += dir * speed; if (x < 0 || x + width > W) { dir *= -1; x = Math.max(0, Math.min(W - width, x)); } draw(); this._raf = requestAnimationFrame(anim); }; anim();
    const place = () => {
      const l = Math.max(x, left), r = Math.min(x + width, left + width), w = r - l;
      if (w <= 0.5) { status.textContent = 'It falls off the wall! Maestro Chuy covers his eyes.'; return finish(); }
      const b = $('div', 'alb-block'); b.style.left = l + '%'; b.style.width = w + '%'; b.style.bottom = (row * 11) + '%'; wall.appendChild(b);
      rows.push(w); left = l; width = w; row++; speed += 0.12; x = dir > 0 ? 0 : W - width;
      status.textContent = w > 45 ? '¡Eso! Perfect.' : w > 30 ? 'Good. A bit of mezcla hides it.' : 'Hm. Maestro Chuy squints.';
      if (row >= 8) finish(); else status.textContent += ` Course ${row + 1} of 8.`;
    };
    const finish = () => {
      cancelAnimationFrame(this._raf); cur.remove(); drop.disabled = true;
      const score = rows.length, pay = Math.round(60 * score + rows.reduce((a, b) => a + b, 0) * 2), win = score >= 8;
      status.innerHTML += win ? ` <b>The wall stands.</b> Pay: $${pay}.` : ` ${score} courses. Pay: $${pay}.`;
      const c = this.btn('Continue', 'primary', () => this.done({ win, money: pay, score })); wrap.appendChild(c); c.focus();
    };
    this.key(e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!drop.disabled) place(); } });
    return p;
  }

  /* ---------------- añil ---------------- */
  anil() {
    const p = this.open('El añil', 'Dip the cloth when the marker is in the dark band, lift it to the air, and dip again. Six dips. Each good dip makes the blue deeper.');
    const wrap = $('div', 'anil'), cloth = $('div', 'anil-cloth'), track = $('div', 'anil-track', '<b></b><i></i>'), status = $('p', '', 'Dip 1 of 6'), dip = this.btn('Dip!', 'primary', () => go());
    wrap.append(cloth, track, $('div', 'row'), status); wrap.children[2].append(dip); this.body.appendChild(wrap);
    let t = 0, n = 0, good = 0, zone = 0.3 + Math.random() * 0.4;
    const band = track.querySelector('b'), mark = track.querySelector('i');
    const place = () => { band.style.left = (zone * 100 - 8) + '%'; }; place();
    const anim = () => { if (!this.alive) return; t += 0.012 + n * 0.0025; const v = (Math.sin(t * 3.1) + 1) / 2; mark.style.left = (v * 100) + '%'; mark.dataset.v = v; this._raf = requestAnimationFrame(anim); }; anim();
    const go = () => {
      if (n >= 6) return; const v = +mark.dataset.v, hit = Math.abs(v - zone) < 0.08;
      n++; if (hit) good++; const depth = good / 6;
      cloth.style.background = `linear-gradient(180deg, hsl(${130 - depth * 100}, ${40 + depth * 20}%, ${70 - depth * 48}%), hsl(${200 + depth * 30}, 60%, ${55 - depth * 40}%))`;
      status.textContent = (hit ? 'Good dip: the cloth drinks the añil.' : 'Too soon or too late: it comes up pale.') + ` ${n < 6 ? `Dip ${n + 1} of 6.` : ''}`;
      zone = 0.2 + Math.random() * 0.6; place();
      if (n >= 6) { const win = good >= 3; status.innerHTML += win ? ` <b>${good} good dips.</b> Doña Petra grunts. That is a compliment.` : ` ${good} good dips. “Again,” says Doña Petra. “The cloth is patient. Be like the cloth.”`; dip.disabled = true; const c = this.btn('Continue', 'primary', () => this.done({ win, score: good })); wrap.appendChild(c); c.focus(); }
    };
    this.key(e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(); } });
    return p;
  }

  /* ---------------- waiting tables ---------------- */
  mesero(o) {
    const p = this.open('Mesero en el Azul Portal', 'Four tables. Each one orders; remember it. Then pick what they asked for from the kitchen, in any order, and serve.');
    const wrap = $('div', 'mes'); this.body.appendChild(wrap);
    let table = 0, tips = 0, right = 0; const style = o.style || 0;
    const next = async () => {
      if (!this.alive) return;
      wrap.innerHTML = '';
      if (table >= 4) { const pay = 180 + tips; wrap.appendChild($('p', 'mes-q', `Four tables, <b>${right}</b> served right. Wage $180, tips $${tips}. Don Julián: “${right >= 3 ? 'You can come back. Wear the apron straighter.' : 'Tomorrow, write it down.'}”`)); const c = this.btn('Continue', 'primary', () => this.done({ win: right >= 3, money: pay })); wrap.appendChild(c); c.focus(); return; }
      const n = 2 + Math.min(3, table), order = shuffle(MENU.map((m, i) => i)).slice(0, n);
      const who = ['A couple from Guadalajara', 'Three regidores (on the town\'s account)', 'A family after Mass', 'Two cousins back from Chicago', 'The priest\'s nephew'][Math.floor(Math.random() * 5)];
      wrap.appendChild($('p', 'mes-q', `<b>Table ${table + 1}.</b> ${who} order:`));
      const ord = $('div', 'mes-order', order.map(i => `<span>${MENU[i][1]} ${MENU[i][0]}</span>`).join('')); wrap.appendChild(ord);
      const ready = this.btn('Got it, to the kitchen', 'primary', () => kitchen()); wrap.appendChild(ready); ready.focus();
      const timer = setTimeout(kitchen, 2600 + n * 900); let went = false;
      function kitchen() { if (went) return; went = true; clearTimeout(timer); go(); }
      const go = () => {
        wrap.innerHTML = ''; wrap.appendChild($('p', 'mes-q', `<b>Table ${table + 1}.</b> What did they order? (${n} things)`));
        const grid = $('div', 'mes-grid'), picked = new Set(); wrap.appendChild(grid);
        MENU.forEach(([name, em], i) => { const b = this.btn(`<span>${em}</span><small>${name}</small>`, 'mes-item', () => { if (picked.has(i)) { picked.delete(i); b.classList.remove('on'); } else if (picked.size < n) { picked.add(i); b.classList.add('on'); } serve.disabled = picked.size !== n; }); grid.appendChild(b); });
        const serve = this.btn('Serve', 'primary', () => { const ok = order.filter(i => picked.has(i)).length; if (ok === n) { right++; tips += Math.round(40 + Math.random() * 40 + style * 4); } else tips += ok * 5; table++; next(); }); serve.disabled = true; wrap.appendChild(serve);
      };
    };
    next();
    return p;
  }

  /* ---------------- stocking the ferretería ---------------- */
  ferreteria() {
    const p = this.open('Ferretería La Esperanza', 'Out of the box, onto the right shelf. Pick the aisle (or press 1–4) before Tío Luis finishes saying “¡Ánimo!”. Twelve things.');
    const AISLES = [['Plomería', '🚰'], ['Eléctrico', '💡'], ['Tornillería', '🔩'], ['Pintura', '🖌️']];
    const STOCK = [['Codo de PVC', 0], ['Llave de paso', 0], ['Flotador para tinaco', 0], ['Cinta teflón', 0], ['Rollo de cable calibre 12', 1], ['Foco ahorrador', 1], ['Apagador', 1], ['Clavija', 1],
      ['Taquetes y pijas', 2], ['Clavos de 2½"', 2], ['Tuercas y rondanas', 2], ['Bisagras', 2], ['Brocha de 3"', 3], ['Cubeta de pintura vinílica', 3], ['Thinner', 3], ['Rodillo', 3]];
    const order = shuffle(STOCK.slice()).slice(0, 12), wrap = $('div', 'ferre'), item = $('p', 'mes-q', ''), bar = $('div', 'ferre-bar', '<i></i>'), grid = $('div', 'mes-grid'), status = $('p', '', '');
    wrap.append(item, bar, grid, status); this.body.appendChild(wrap);
    let k = 0, right = 0, t0 = 0, limit = 5;
    const btns = AISLES.map(([name, em], i) => { const b = this.btn(`<span>${em}</span><small>${i + 1} · ${name}</small>`, 'mes-item', () => choose(i)); grid.appendChild(b); return b; });
    const show = () => { item.innerHTML = `<b>${k + 1} of 12.</b> ${order[k][0]}`; t0 = performance.now(); limit = Math.max(2.2, 5 - k * 0.22); };
    const tick = () => { if (!this.alive || k >= 12) return; const f = Math.min(1, (performance.now() - t0) / 1000 / limit); bar.firstChild.style.width = (100 - f * 100) + '%'; if (f >= 1) choose(-1); this._raf = requestAnimationFrame(tick); };
    const choose = i => {
      if (k >= 12) return; const ok = i === order[k][1]; if (ok) right++;
      status.textContent = ok ? ['¡Eso!', '¡Ánimo, patrón!', 'Francisco nods.', 'Right where a customer would look.'][k % 4] : i < 0 ? `Too slow: it goes on the floor. (${AISLES[order[k][1]][0]})` : `Not there: that goes in ${AISLES[order[k][1]][0]}.`;
      k++; if (k < 12) show(); else finish();
    };
    const finish = () => {
      cancelAnimationFrame(this._raf); btns.forEach(b => { b.disabled = true; }); const win = right >= 9;
      item.innerHTML = `<b>${right} of 12</b> on the right shelf. ${win ? 'Francisco walks the aisles twice and says nothing. From him, that is a parade.' : '“Again,” says Francisco. “A customer looking for a flotador in Pintura will go to Sahuayo.”'}`;
      const c = this.btn('Continue', 'primary', () => this.done({ win, score: right })); wrap.appendChild(c); c.focus();
    };
    this.key(e => { const n = +e.key; if (n >= 1 && n <= 4) { e.preventDefault(); choose(n - 1); } });
    show(); tick();
    return p;
  }

  /* ---------------- serenade ---------------- */
  serenata(o) {
    const temper = o.temper || 'warm', best = SONGS[temper];
    const p = this.open('Serenata', `Under ${o.name || 'their'} window, after dark. The mariachi tunes up. Choose the song: the right one for the right heart.`);
    const wrap = $('div', 'ser'); this.body.appendChild(wrap);
    const opts = shuffle([best, ...shuffle(Object.values(SONGS).filter(s => s !== best)).slice(0, 3)]);
    wrap.appendChild($('p', 'mes-q', '🎺 The trumpet waits for you. Which song?'));
    const list = $('div', 'quiz-opts'); wrap.appendChild(list);
    opts.forEach(s => list.appendChild(this.btn(s, 'quiz-opt', () => {
      list.querySelectorAll('button').forEach(b => b.disabled = true);
      const win = s === best || Math.random() < 0.25;
      wrap.appendChild($('p', 'mes-q', win ? `“${s}.” Halfway through the second verse, the window opens. A light. A face. A hand on the sill. When the song ends, the whole street applauds, including two dogs.` : `“${s}.” The window stays dark. After the third song a neighbour throws a slipper. Maybe another night, another song.`));
      const c = this.btn('Continue', 'primary', () => this.done({ win })); wrap.appendChild(c); c.focus();
    })));
    list.firstChild.focus();
    return p;
  }
}
