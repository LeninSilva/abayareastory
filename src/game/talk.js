// Conversation as a closed set of choices, the way the old role-playing games did it: you pick what to say from
// a list, every line has a tone, and tones shape who you become (heart: compassion or cruelty; word: honesty or
// deceit) and how each person feels about you. Gifts, jokes, compliments, flirting, insults and boasts are
// expressions; each temperament takes them differently. The replies are all written by hand.
import { ITEMS } from './shops.js';
import { TOWN_JOKES, PARTIES } from './cast.js';
import { ROMANCE } from './life.js';

export const TONES = {
  kind: { label: 'Compassionate', icon: '♥', trait: ['heart', 2] },
  cruel: { label: 'Cruel', icon: '✖', trait: ['heart', -3] },
  honest: { label: 'Honest', icon: '◎', trait: ['word', 2] },
  lie: { label: 'A lie', icon: '◌', trait: ['word', -3] },
  brave: { label: 'Bold', icon: '▲', trait: ['fame', 2] },
  romance: { label: 'Romantic', icon: '❀', trait: null },
  funny: { label: 'Joke', icon: '☺', trait: null }
};

const PLAYER_JOKES = [
  '¿Qué le dijo un techo a otro techo? “Techo de menos.”',
  '¿Cuál es el café más peligroso del mundo? El ex-presso.',
  '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!',
  'Doctor, I think I\'m a tortilla. “Ah, so that\'s why you\'re always on the comal.”',
  'In Jiquilpan we don\'t have traffic jams. We have long conversations between engines.',
  'My grandfather built a jetpack. My grandmother built a better excuse never to ride it.',
  'The Deportivo brought a ladder to the stadium. They heard the other team played at a higher level.',
  '¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas.',
  'What do you call a mariachi who lost his trumpet? Just a guy in a very nice suit.',
  'The bache on Calle Morelos applied to be a Pueblo Mágico. It\'s older than the regidores.'
];

/* how each temperament answers: [compliment ok, compliment again, joke laughs, joke flat, flirt yes, flirt no, insult, brag believed, brag mocked, gift love, gift fine, gift dislike, likes intro, work] */
const R = {
  warm: {
    compliment: ['¡Ay, gracias! You\'re going to make me blush, and I don\'t blush easily.', 'Qué lindo. Say that to my husband, he never notices.'],
    again: ['You said that already, mi vida. I liked it the first time.'],
    laugh: ['¡Jajaja! Ay, no. That\'s terrible. Tell me another one.', 'Ha! I\'m stealing that for Sunday dinner.'],
    flat: ['Mm. I\'ll laugh later, when I understand it.'],
    flirtYes: ['(A big, surprised smile.) Well! Look at you. Keep talking.', 'Ay. Nobody has said that to me since the feria of \'09. Again?'],
    flirtNo: ['Ay, mijo, mija, you\'re sweet, but no. Let\'s be friends, it lasts longer.'],
    insult: ['(The smile goes out like a candle.) Okay. I see. Have a good day, then.', 'That was ugly. My grandmother would have hit you with the chancla.'],
    bragYes: ['¡No! Really? Wait until I tell my comadre.'],
    bragNo: ['Sure, and I\'m the Virgin of Guadalupe. Ha!'],
    giftLove: ['¡Ay, no! For me? You shouldn\'t have. (She absolutely thinks you should have.)', '¡Qué detalle! Come here, give me a hug.'],
    giftOk: ['Gracias, how kind of you.'], giftBad: ['Ah... thank you. I\'ll... give it to my cousin.'],
    likes: 'You want to know what I like? Easy: ', work: 'Work? Everyone needs a hand somewhere. '
  },
  suspicious: {
    compliment: ['Hm. What do you want?', '...Thank you. I suppose.'], again: ['Twice? Now I know you want something.'],
    laugh: ['(A snort she tries to hide.) Fine. That one was good.'], flat: ['I don\'t laugh for strangers.', '...Is that a joke from Guadalajara?'],
    flirtYes: ['(Long look.) You\'re bold. I don\'t hate it.'], flirtNo: ['No. And don\'t try again.'],
    insult: ['Say that again and you\'ll be picking your teeth off the empedrado.', 'I knew it. People from the city are all the same.'],
    bragYes: ['...Maybe. Maybe not.'], bragNo: ['And I flew to the moon on a chicken. Go away.'],
    giftLove: ['(She turns it over in her hands.) ...How did you know? Thank you. Really.'], giftOk: ['Fine. Thank you.'], giftBad: ['I don\'t want this. Take it back.'],
    likes: 'Why do you want to know? ...Fine. ', work: 'I don\'t hand out jobs to people I don\'t know. But I hear '
  },
  dry: {
    compliment: ['Thank you. I\'ll put it with the others. It\'s a small collection.', 'Noted.'], again: ['Repeated compliments lose value. Like the peso.'],
    laugh: ['(Deadpan.) That is the funniest thing I have heard this week. It\'s Tuesday.', 'Hm. Ha. Yes. Good.'], flat: ['I see what you did there. I wish I hadn\'t.'],
    flirtYes: ['That was almost charming. Try again tomorrow and we\'ll see about the other half.'], flirtNo: ['That was an attempt. I acknowledge the attempt.'],
    insult: ['How original. I\'ve been insulted better by the Comandante\'s dog.', 'Mm. Go practise that on the bache.'],
    bragYes: ['Impressive. I\'m impressed. Look at my face.'], bragNo: ['And the bache was filled last Tuesday. We all believe things.'],
    giftLove: ['...Oh. That\'s actually exactly right. Thank you. Don\'t tell anyone I smiled.'], giftOk: ['A gift. How unexpected and pleasant.'], giftBad: ['I can see this cost money. That\'s the nicest thing about it.'],
    likes: 'What I like. Let me think. ', work: 'Work, the great equaliser. '
  },
  parental: {
    compliment: ['Ay, criatura, thank you. Have you eaten?', 'You have good manners. Somebody raised you right.'], again: ['Yes, yes, you said. Now eat something.'],
    laugh: ['¡Jajaja! Ay, you\'re terrible. Just like my son.'], flat: ['That one needs more salt, mijo.'],
    flirtYes: ['(Laughing, swatting at you.) ¡Ay, no! At my age! ...Well. Maybe a coffee.'], flirtNo: ['¡Ay, criatura! I\'m old enough to be your mother. Go find someone your age.'],
    insult: ['Is that how they taught you to talk? Shame on you.', 'I\'m going to pretend I didn\'t hear that, for your grandmother\'s sake.'],
    bragYes: ['¡Qué orgullo! Your grandfather must be so proud.'], bragNo: ['Mijo. I\'ve changed your kind of diapers. Don\'t lie to me.'],
    giftLove: ['¡Ay, pero qué hermoso! You didn\'t have to! Come, I\'ll make you a plate.'], giftOk: ['Thank you, mijo, mija. You\'re a good kid.'], giftBad: ['Ay... that\'s... thank you, I suppose. Don\'t waste your money on me.'],
    likes: 'What do I like? Visitors who eat. And ', work: 'You need work? Good, idle hands are the devil\'s comal. '
  },
  pious: {
    compliment: ['God bless you. Truly.', 'You\'re kind. The Virgin sees kindness.'], again: ['Vanity is a sin, joven. Mine, if I keep listening.'],
    laugh: ['(A gentle smile.) That is a clean joke. I approve.'], flat: ['Hm. I don\'t think the saints would laugh at that one.'],
    flirtYes: ['(Flustered.) Oh... I... we should take things slowly. With respect. And a chaperone.'], flirtNo: ['Joven, please. Not here. Not like that.'],
    insult: ['I will pray for you. Hard.', 'Forgive them, Lord. Mostly this one.'],
    bragYes: ['God gives gifts to everyone. You seem to have received several.'], bragNo: ['Thou shalt not bear false witness, joven. Not even to impress me.'],
    giftLove: ['Oh! This is a blessing. Thank you. I\'ll light a candle for you.'], giftOk: ['Thank you. God will repay you.'], giftBad: ['I can\'t accept that. Not this. Please.'],
    likes: 'Simple things please the Lord, and me. ', work: 'Honest work is a prayer with the hands. '
  },
  teen: {
    compliment: ['Ay, ¿neta? Thanks, wey.', 'Okay, okay, you can be in my video.'], again: ['Bro, you\'re repeating yourself.'],
    laugh: ['¡JAJAJA! No manches, I\'m posting that.', 'Okay that one was actually good. Cringe, but good.'], flat: ['...That\'s a boomer joke.', 'Wey. No.'],
    flirtYes: ['(Grinning at their phone, then at you.) Okay, okay. Follow me back first.'], flirtNo: ['Ew, no. I mean. No, thank you. Respectfully.'],
    insult: ['Wow. Okay. Blocked.', 'Bro, the whole town is going to know you said that. I have eleven followers.'],
    bragYes: ['NO WAY. Can you show me? Can I film it?'], bragNo: ['Sure, and I\'m the son of Peso Pluma. Cap.'],
    giftLove: ['NO WAY. For me? This is so fire, thank you!'], giftOk: ['Oh, cool. Gracias.'], giftBad: ['Uh. That\'s for old people.'],
    likes: 'Honestly? ', work: 'Work? Like, a job? '
  },
  elder: {
    compliment: ['Hm. At my age a compliment is a vitamin. Thank you.', 'El que es buen gallo dondequiera canta. Thank you.'], again: ['Once is courtesy. Twice is a campaign.'],
    laugh: ['(A slow chuckle that turns into a cough.) Ha. Ha. Good one. Again, but slower.'], flat: ['Hm. In my day jokes had an ending.'],
    flirtYes: ['(He straightens his hat.) Well, well. The cerro still has fire under it.'], flirtNo: ['Ha! Thank you. I\'ll remember it fondly. But no.'],
    insult: ['Respect your elders, joven. They\'ll be your only witnesses one day.', 'Cría cuervos y te sacarán los ojos.'],
    bragYes: ['Hm. Maybe. The young do things now.'], bragNo: ['Más sabe el diablo por viejo que por diablo. You\'re lying.'],
    giftLove: ['(Eyes wet.) My wife used to bring me this. Thank you.'], giftOk: ['A gift is a gift. Thank you.'], giftBad: ['Hm. Keep it for someone who needs it.'],
    likes: 'An old man likes old things. ', work: 'Work? I have worked since I was seven. '
  },
  political: {
    compliment: ['Thank you, thank you. Remember that in three years.', 'You have good judgement. Clearly.'], again: ['I appreciate your continued support.'],
    laugh: ['(A practised laugh, two seconds long.) Very good! Very good. Excellent.'], flat: ['Ha. Let\'s move on.'],
    flirtYes: ['(Adjusting a collar.) Well. Perhaps a coffee, off the record.'], flirtNo: ['I am a public servant. My heart belongs to the people. All of them. Collectively.'],
    insult: ['I will remember that. I remember everything.', 'Ah, the opposition. Welcome.'],
    bragYes: ['Impressive! We should take a photo together.'], bragNo: ['That sounds like one of my speeches. I know a speech when I hear one.'],
    giftLove: ['How generous! Let\'s take a photo with it. For the record.'], giftOk: ['Thank you, I\'ll put it in my office.'], giftBad: ['I can\'t accept gifts. Ethics. (He eyes it.) Not this one, anyway.'],
    likes: 'Off the record? ', work: 'Opportunities! There are always opportunities. '
  },
  shy: {
    compliment: ['Oh! Um. Thank you. Nobody... thank you.', '(Quietly delighted.) That\'s kind.'], again: ['(Pink.) You said that already...'],
    laugh: ['(Laughing behind a hand.) Sorry. That was funny.'], flat: ['(Polite smile.) Oh. Yes.'],
    flirtYes: ['(Very quietly.) ...I hoped you would say something like that.'], flirtNo: ['Oh, I... no. Sorry. I\'m sorry.'],
    insult: ['(Steps back.) I... okay.', '(Says nothing. Their eyes say plenty.)'],
    bragYes: ['Really? That\'s amazing.'], bragNo: ['(A small, doubtful smile.)'],
    giftLove: ['(Hands over mouth.) How did you know? Thank you, thank you.'], giftOk: ['Oh, thank you, that\'s lovely.'], giftBad: ['(Holding it carefully, a little lost.) Thank you...'],
    likes: '(Softly.) ', work: 'I don\'t know much, but '
  }
};
const pick = a => a[Math.floor(Math.random() * a.length)];

export class Talk {
  constructor(game) { this.g = game; }
  temper(npc) { return npc.def.temper || 'warm'; }
  greet(npc) {
    const L = this.g.life, id = npc.id, d = npc.def, r = L.rel(id), lv = L.level(id);
    r.talks++;
    if (r.a <= -50) return pick(['You. What do you want now?', '(They look at you like a fly in the soup.)', 'I\'ve got nothing to say to you.']);
    if (r.romance >= 4) return pick(['¡Mi amor! You\'re home late. Or early. Either way, come here.', 'There you are. I made frijoles. Tell me everything.']);
    if (r.romance >= 2) return pick(['(A smile just for you.) Hola, tú.', 'There you are. I was hoping I\'d run into you.']);
    if (r.a >= 45 && r.talks > 1) return pick([`¡${this.g.state.name}! ¿Cómo estás? Sit, sit.`, `Ah, mi ${d.fem ? 'amiga' : 'amigo'}… no, you. ¿Qué cuentas?`, 'Look who it is! The famous one.']);
    const g = d.greet || (d.topics && d.greet) || ['Buenas.'];
    return pick(g);
  }
  /** the root menu */
  root(npc) {
    const g = this.g, d = npc.def, out = [];
    for (const c of g.story.chipsFor(npc.id)) out.push({ ...c, kind: 'story', tone: c.tone });
    for (const c of g.side.chipsFor(npc)) out.push({ ...c, kind: 'quest' });
    for (const c of g.services(npc)) out.push({ ...c, kind: 'shop' });
    out.push({ label: 'Ask about…', kind: 'menu', run: () => this.menu(npc, 'ask') });
    out.push({ label: 'Say something…', kind: 'menu', run: () => this.menu(npc, 'social') });
    out.push({ label: 'Goodbye.', kind: 'end', run: () => g.endTalk() });
    return out;
  }
  menu(npc, which) {
    const g = this.g, out = which === 'ask' ? this.asks(npc) : this.social(npc);
    out.push({ label: '← Back', kind: 'back', run: () => g.renderChips() });
    g.ui.chips(out.map(c => ({ ...c, onClick: () => { if (c.locked) { g.ui.logLine('sys', c.lockedText || 'Not now.'); return; } c.run(); } })));
  }
  asks(npc) {
    const d = npc.def, id = npc.id, L = this.g.life, out = [];
    const say = (label, line, extra) => out.push({ label, kind: 'topic', run: () => { this.g.ui.logLine('me', label); this.g.ui.logLine('npc', line()); if (extra) extra(); this.g.renderChips(); } });
    say('Tell me about yourself.', () => this.topic(npc, 'self'));
    say('What\'s this part of town like?', () => this.topic(npc, 'city'));
    say('What do people say about the ayuntamiento?', () => this.politics(npc));
    if (!d.cast || d.cast === 'story') say('What do you think about the water vote?', () => this.topic(npc, 'water'));
    if (d.ambient || d.cast === 'story') say('What do you know about my grandfather?', () => this.topic(npc, 'vane'));
    say('Is there any work around here?', () => this.work(npc));
    if (L.rel(id).a >= 20) say('What kinds of things do you like?', () => this.likes(npc), () => { const r = L.rel(id); if (!r.known.includes('likes')) r.known.push('likes'); });
    else out.push({ label: 'What kinds of things do you like?', kind: 'topic', locked: true, lockedText: 'They don\'t know you well enough to say. Be friends first.' });
    return out;
  }
  topic(npc, t) {
    const d = npc.def;
    if (d.lines && d.lines[t === 'city' ? 'town' : t]) return pick(d.lines[t === 'city' ? 'town' : t]);
    if (d.lines && t === 'self' && d.lines.self) return pick(d.lines.self);
    const lines = d.topics && (d.topics[t] || (t === 'city' && d.topics.city));
    if (lines && lines.length) return pick(lines);
    if (t === 'self') return `I'm ${d.name}. ${d.title ? d.title[0].toUpperCase() + d.title.slice(1) + '.' : ''} That's all there is, really.`;
    if (t === 'water') return pick(['The springs? Ask the cabildo. Good luck finding them.', 'Water is the only thing everyone in Jiquilpan agrees on: there isn\'t enough.']);
    if (t === 'vane') return pick(['Don Aurelio? A good man, always asking questions. Like you.', 'They say he went up the cerro. They say a lot of things.']);
    return pick(['It\'s a good town. Walk it slowly.', 'Everybody knows everybody. That\'s the best and the worst of it.']);
  }
  politics(npc) {
    const d = npc.def;
    if (d.party && PARTIES[d.party]) return pick(d.lines.complaint);
    if (d.cast === 'alcalde' || d.cast === 'secretaria') return pick(d.lines.town);
    return pick(TOWN_JOKES);
  }
  likes(npc) {
    const t = R[this.temper(npc)], likes = this.likesOf(npc).map(k => ITEMS[k] && ITEMS[k].name.split(' (')[0].toLowerCase()).filter(Boolean);
    return t.likes + (likes.length ? likes.slice(0, 3).join(', ') + '. ' + (likes.length > 1 ? 'Not necessarily in that order.' : '') : 'a quiet afternoon.');
  }
  work(npc) {
    const t = R[this.temper(npc)];
    return t.work + pick([
      'Don Refugio at the taxi stand on Calle Abasolo always needs drivers.',
      'Don Julián at the Azul Portal is short a waiter, as usual.',
      'Maestro Chuy at the materiales store takes anyone who can carry block.',
      'Tía Cuca on the Jardín pays for gaspachos delivered before they melt.',
      'They say there\'s land for sale; the licenciada at Bienes Raíces, by the Jardín, has the list.']);
  }
  likesOf(npc) {
    const d = npc.def; if (d.likes) return d.likes;
    // street people: from their job, age and temper
    const job = (d.title || '').toLowerCase(), out = [];
    if (/cook|tortill|carnitas|tamal|baker|butcher|cremer/.test(job)) out.push('queso');
    if (/teacher|student|historian|library/.test(job)) out.push('libro');
    if (/sacristan|candle|pious|church/.test(job) || d.temper === 'pious') out.push('veladora');
    if (/football|kid|student/.test(job) || (d.age && d.age < 16)) out.push('balon');
    if (d.temper === 'teen') out.push('gaspacho', 'alebrije');
    if (d.temper === 'elder' || (d.age && d.age > 60)) out.push('pan', 'ate');
    if (d.temper === 'shy' || d.temper === 'warm') out.push('flores');
    if (d.temper === 'dry' || d.temper === 'political') out.push('charanda');
    if (!out.length) out.push('pan', 'flores');
    return [...new Set(out)];
  }
  /* ---------------- expressions ---------------- */
  social(npc) {
    const g = this.g, L = g.life, id = npc.id, d = npc.def, r = L.rel(id), out = [], s = g.state;
    const adult = d.adult !== false && !(d.age && d.age < 18), romanceable = adult && !d.noRomance && d.romance !== false && d.cast !== 'story' && !d.party && d.cast !== 'alcalde';
    out.push({ label: 'Pay them a compliment.', tone: 'kind', kind: 'social', run: () => this.express(npc, 'compliment') });
    out.push({ label: 'Tell a joke.', tone: 'funny', kind: 'social', run: () => this.express(npc, 'joke') });
    const gifts = L.gifts();
    out.push({ label: gifts.length ? 'Give them a gift…' : 'Give them a gift… (you have nothing to give)', kind: 'social', locked: !gifts.length, lockedText: 'Buy flowers, pan dulce, gaspachos and other gifts in the shops around the Jardín.', run: () => this.giftMenu(npc) });
    if (romanceable) {
      const partner = Object.entries(s.life.rel).find(([k, x]) => k !== id && x.romance >= 2);
      if (r.romance === 0) out.push({ label: 'Flirt a little.', tone: 'romance', kind: 'social', run: () => this.express(npc, 'flirt', partner) });
      if (r.romance === 1) out.push({ label: `Ask them to be your ${d.fem ? 'novia' : 'novio'}.`, tone: 'romance', kind: 'social', locked: r.a < 55, lockedText: 'Not yet: get to know them better (Good friend or closer).', run: () => this.askOut(npc, partner) });
      if (r.romance === 2) out.push({ label: 'Propose marriage.', tone: 'romance', kind: 'social', locked: r.a < 80 || !L.has('anillo') || !L.homeWith('recamara'),
        lockedText: `You need: ${[r.a < 80 ? 'a deeper bond' : '', !L.has('anillo') ? 'a ring (the Casita de Piedra sells them)' : '', !L.homeWith('recamara') ? 'a house with a bedroom' : ''].filter(Boolean).join(', ')}.`, run: () => this.propose(npc) });
      if (r.romance === 2) out.push({ label: 'Take them out for dinner at the Azul Portal ($450).', tone: 'romance', kind: 'social', run: () => this.date(npc) });
    }
    out.push({ label: 'Tell them a tall tale about yourself.', tone: 'lie', kind: 'social', run: () => this.express(npc, 'brag') });
    out.push({ label: 'Insult them.', tone: 'cruel', kind: 'social', run: () => this.express(npc, 'insult') });
    return out;
  }
  face(npc, e) { if (npc.mesh && npc.mesh.userData.setExpression) npc.mesh.userData.setExpression(e); }
  express(npc, what, partner) {
    const g = this.g, L = g.life, id = npc.id, t = R[this.temper(npc)], r = L.rel(id), n = L.did(id, what), d = npc.def;
    const F = e => this.face(npc, e);
    const say = (me, them) => { g.ui.logLine('me', me); g.ui.logLine('npc', them); };
    if (what === 'compliment') {
      const line = pick(['You have a good face for this town.', 'You keep this corner looking better than the whole Presidencia.', 'Everybody says you\'re the one to ask about this town. They were right.', 'That colour suits you.']);
      if (n > 1) { say(line, pick(t.again)); L.affinity(id, -1); }
      else { say(line, pick(t.compliment)); F('happy'); L.affinity(id, r.a < 60 ? 6 : 3, true); L.trait('heart', 1, true); }
    }
    if (what === 'joke') {
      const j = pick(PLAYER_JOKES), funny = { warm: 0.75, teen: 0.55, dry: 0.65, parental: 0.7, elder: 0.55, shy: 0.6, pious: 0.45, suspicious: 0.35, political: 0.8 }[this.temper(npc)] || 0.5;
      g.life.s.stats.jokes++;
      if (n > 2) { say(j, 'Enough jokes for today, cómico. Come back tomorrow.'); }
      else if (Math.random() < funny + L.style() * 0.005) { say(j, pick(t.laugh)); F('happy'); L.affinity(id, 5, true); L.trait('fame', 1, true); g.unlock('comico', () => g.life.s.stats.jokes >= 10); }
      else { say(j, pick(t.flat)); L.affinity(id, -1); }
    }
    if (what === 'flirt') {
      const line = pick(['If I\'d known Jiquilpan had people like you, I\'d have come years ago.', 'Are you always this easy to talk to, or is it just me?', 'I was going to ask you for directions. Now I forget where I was going.']);
      if (n > 1) { say(line, 'Once a day is plenty, galán. Leave something for tomorrow.'); return this.g.renderChips(); }
      const chance = (r.a - 15) / 50 + L.style() * 0.012 + (L.s.fame / 300);
      if (r.a >= 25 && Math.random() < chance) {
        say(line, pick(t.flirtYes)); F('surprised'); r.romance = 1; L.affinity(id, 8, true); g.ui.toast(`${d.name}: ${ROMANCE[1]}`, 'love');
        if (partner) this.jealous(partner[0], id);
      } else { say(line, r.a < 25 ? 'Hm. We hardly know each other. Ask me something first.' : pick(t.flirtNo)); L.affinity(id, r.a < 25 ? -2 : -1); }
    }
    if (what === 'brag') {
      const line = pick(['I flew over the cerro faster than a jet. Twice. Before breakfast.', 'I once beat the whole Chivas reserve team at penalties. Alone.', 'The Presidente asked for my advice yesterday. I said no.', 'In Guadalajara they call me El Rayo. Or La Rayo. Something with lightning.']);
      const believed = Math.random() < 0.25 + L.s.fame / 200;
      say(line, believed ? pick(t.bragYes) : pick(t.bragNo)); F(believed ? 'surprised' : 'angry'); L.trait('word', -2, true); L.trait('fame', believed ? 2 : 0, true); L.affinity(id, believed ? 2 : -2);
    }
    if (what === 'insult') {
      const line = pick(['You look like the bache on Calle Morelos: deep and useless.', 'I\'ve met friendlier stray dogs.', 'Is your face always like that, or only on weekdays?', 'Nobody in this town would miss you.']);
      say(line, pick(t.insult)); F('angry'); L.affinity(id, -18, true); L.trait('heart', -4); L.trait('fame', 1, true); g.life.s.stats.insults++;
      if (r.romance >= 2) { r.romance = Math.max(0, r.romance - 1); g.ui.toast(`${d.name} is hurt. Romance cools.`, 'warn'); }
    }
    g.audio.ui(); g.save(); g.renderChips();
  }
  jealous(partnerId, newId) {
    const g = this.g, L = g.life; L.trait('word', -4);
    if (Math.random() < 0.5) { L.affinity(partnerId, -25); g.ui.toast(`Word travels fast in Jiquilpan. ${g.npcName(partnerId)} heard you were flirting with ${g.npcName(newId)}.`, 'warn'); }
  }
  giftMenu(npc) {
    const g = this.g, L = g.life, out = L.gifts().map(it => ({ label: `${it.name.split(' (')[0]} (you have ${it.n})`, kind: 'social', run: () => this.give(npc, it.id) }));
    out.push({ label: '← Back', kind: 'back', run: () => this.menu(npc, 'social') });
    g.ui.chips(out.map(c => ({ ...c, onClick: c.run })));
  }
  give(npc, item) {
    const g = this.g, L = g.life, id = npc.id, t = R[this.temper(npc)], I = ITEMS[item], likes = this.likesOf(npc);
    if (!L.take(item)) return;
    g.ui.logLine('me', `(You give them ${I.name.split(' (')[0].toLowerCase()}.)`);
    const tags = I.tags || [], dis = I.dislike || [], temper = this.temper(npc), kid = npc.def.age && npc.def.age < 18;
    let score = likes.includes(item) ? 2 : tags.includes(temper) ? 1 : 0;
    if (dis.includes(temper) || (kid && dis.includes('kid'))) score = -1;
    if (item === 'flores' && L.rel(id).romance >= 1) score = 2;
    const n = L.did(id, 'gift');
    if (n > 2) { g.ui.logLine('npc', 'You\'re very generous, but you\'re embarrassing me. Enough for today!'); L.affinity(id, 1); }
    else if (score >= 2) { g.ui.logLine('npc', pick(t.giftLove)); this.face(npc, 'happy'); L.affinity(id, 14, true); L.trait('heart', 1, true); }
    else if (score === 1) { g.ui.logLine('npc', pick(t.giftOk)); L.affinity(id, 7, true); }
    else if (score === 0) { g.ui.logLine('npc', pick(t.giftOk)); L.affinity(id, 3, true); }
    else { g.ui.logLine('npc', pick(t.giftBad)); this.face(npc, 'sad'); L.affinity(id, -5); }
    L.s.stats.gifts++; if (L.s.stats.gifts >= 10) g.unlock('detallista');
    g.side.event('gift', { npc: id, item }); g.audio.ui(); g.save(); g.renderChips();
  }
  askOut(npc, partner) {
    const g = this.g, L = g.life, id = npc.id, r = L.rel(id), d = npc.def;
    const flowers = L.has('flores'), serenata = (L.s.side.serenata || {}).done && (L.s.side.serenata || {}).who === id;
    g.ui.logLine('me', `¿Quieres ser mi ${d.fem ? 'novia' : 'novio'}?`);
    if (serenata || flowers || r.a >= 75) {
      if (flowers && !serenata) L.take('flores');
      g.ui.logLine('npc', pick(['(A long breath, then a grin.) ¡Sí! Yes. Took you long enough.', '(They take your hand.) Yes. But you\'re walking me round the kiosco on Sunday, in front of everyone.', 'Sí. Ay, my mother is going to ask a hundred questions.']));
      r.romance = 2; L.affinity(id, 10); g.ui.toast(`${d.name} and you: ${ROMANCE[2]}`, 'love'); g.unlock('novios');
      if (partner) { this.jealous(partner[0], id); L.rel(partner[0]).romance = 0; }
    } else g.ui.logLine('npc', 'Ay... ask me properly. With flowers at least. Or with mariachis, like the old days. (Madre Socorro at the Santuario knows a mariachi.)');
    g.save(); g.renderChips();
  }
  propose(npc) {
    const g = this.g, L = g.life, id = npc.id, d = npc.def;
    L.take('anillo'); g.ui.logLine('me', '(You go down on one knee, right there.) ¿Te quieres casar conmigo?');
    g.ui.logLine('npc', '(Hands over their mouth. Then laughing and crying.) ¡Sí! ¡Sí, sí! Oh, the whole town is going to come.');
    const r = L.rel(id); r.romance = 3;
    g.pendingWedding = id; g.save();
    g.ui.chips([{ label: 'To the Parroquia de San Francisco!', kind: 'story', onClick: () => { g.endTalk(); g.wedding(id); } }]);
  }
  date(npc) {
    const g = this.g, L = g.life, id = npc.id;
    if (!L.spend(450, 'Dinner for two at the Azul Portal')) return g.renderChips();
    const n = L.did(id, 'date');
    g.endTalk();
    g.ui.card([`You take ${npc.def.name} to the Azul Portal. Blue walls, white tablecloths, the arches lit up like a birthday cake.`,
      pick(['Enchiladas placeras, a jarra of agua de jamaica, the band warming up on the kiosco across the Jardín. You talk until the waiter starts stacking chairs.', 'Corundas and uchepos. A story about their grandmother that makes you laugh until the next table joins in.', 'They steal your last taco. You let them. That is how you know.']),
      'Walking back around the Jardín, they take your arm.'], () => { L.affinity(id, n > 1 ? 3 : 10); if (g.state.hour < 21) g.warpTo(21, () => g.save()); else g.save(); });
  }
}
