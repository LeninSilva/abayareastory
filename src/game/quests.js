// AÑIL: the mystery, chapter by chapter, and the engine that runs it.
// A step is one thing to do: talk to someone (with gold choices), reach a place, examine something (sometimes a
// puzzle), find three witnesses in any order, escape a pursuer, or race a clock. Steps grant clues and flags.

export const CLUES = {
  key: { name: 'Aurelio\'s house key', text: 'Tía Cuca\'s spare, on a string with a blue bead.' },
  jetpack: { name: 'The mochila cohete', text: 'Aurelio built it in his garage from a PEMEX pressure regulator, two fire extinguishers and forty years of stubbornness. It flies. Fast.' },
  sketch: { name: 'A torn page: the bronze door', text: 'A sketch of the Biblioteca\'s bronze door in Aurelio\'s hand: "22 — cuéntalos al revés. El que levanta la mano." (22: count them backward. The one who raises his hand.)' },
  photo: { name: 'A photograph, 1938', text: 'The stadium\'s portada half-built. A boy of eleven or twelve on the scaffold, grinning, holding a chisel. On the back: "Cuco, 18/III/1938".' },
  card: { name: 'A business card', text: 'Lic. Octavio Barragán, Manantiales del Cerro S.A. Found by the forced door, printed on thick cream paper. A muddy tyre track beside it, too wide for a car.' },
  foja: { name: 'Scratched in bronze', text: 'Behind the raised hand of the eighteenth figure, counting backward: "ARCHIVO — LIBRO DE 1940 — FOJA 18".' },
  margin: { name: 'Cuco\'s note, 1940', text: 'In the margin of the parish book, in a boy\'s careful hand: "Lo que el General dejó al pueblo lo guardé donde sus palabras dicen que es del pueblo." (What the General left the town, I kept where his words say it belongs to the town.) A pressed indigo leaf between the pages.' },
  quote: { name: 'The General\'s words', text: '"Los recursos naturales del país deben servir para su propia prosperidad. Entregarlos a intereses extraños es traicionar la patria." Cast in bronze beside the stadium gate.' },
  ironkey: { name: 'An iron key: "C.V. 1940"', text: 'From the hollow stone in the right pylon of the portada. Heavy, hand-forged, for a box, not a door.' },
  map: { name: 'A map of the cerro', text: 'Drawn in indigo ink on waxed paper: the trail, the curandera\'s house, and higher, a spring marked "Ojo del Añil" beside a mouth in the rock.' },
  register: { name: 'The cut page', text: 'Don Emeterio: the 1938 register of the town\'s grants survives, but the page for the Ojo del Añil spring was cut out years ago. Whoever holds the original title holds the spring.' },
  petra: { name: 'The curandera\'s riddle', text: 'Doña Petra: "The cave opens only to those who carry Cuco\'s key." She knows more than she says.' },
  offer: { name: 'Barragán\'s offer', text: 'He offered money for the key and whatever it opens. He said Güero "gets carried away". He said the maestra had already promised him the title.' },
  notebook: { name: 'Aurelio\'s notebook', text: 'Found in Maestra Inés\'s office at the museum. Every clue you have followed, in his hand, and on the last page: "Petra sabe."' },
  title: { name: 'The 1938 title', text: 'In Cuco\'s tin box: "Título de dotación de las aguas del Ojo del Añil al pueblo de Jiquilpan", dated 18 March 1938, with seals and signatures. The town\'s water, in writing.' }
};

// ids of the story places (PLACES in geo.js) or landmark spots (spots in landmarks.js)
export const CHAPTERS = [
  { id: 'llegada', title: 'Prologue: The Last Call', steps: [
    { text: 'Find Tía Cuca at her gaspachos cart on the Jardín.', talk: 'cuca', chips: [
      { label: 'Tía, sit down. Let me sell the gaspachos for a while; you\'ve been on your feet all day.', tone: 'kind', stay: true, fx: { aff: { cuca: 8 } }, reply: '(She looks at you for a long second, then sits on her little stool and lets you serve two schoolgirls and a priest.) Your grandfather used to do that. Exactly that. Ay, criatura. Give me a minute and I\'ll tell you everything.' },
      { label: 'Tía, what happened to my grandfather?', reply: 'Ay, criatura. The police say he walked up the cerro and fell. Three days they looked. Three! Then the Comandante said "procedures" and went to the football. I don\'t believe it. Aurelio walked that cerro since he was nine.', stay: true },
      { label: 'He called me. He said he found what Cuco hid.', reply: 'Cuco? Our father? Dios mío. Then it\'s true, what he was chasing. Here: his house key. And this... he left it in my kitchen with a note: "For the grandchild. Tell them to hold on tight." It\'s a mochila with two fire extinguishers on it. He built it. It flies, criatura. Don\'t tell the priest.', fx: { clues: ['key', 'jetpack'], jetpack: true, card: ['Tía Cuca hands you a heavy backpack of brass pipes and red cylinders, and a key on a string.', 'Press <b>G</b> (🚀 on touch) to fly with Aurelio\'s mochila cohete. Hold <b>Shift</b> to boost: it winds up to nearly 600 km/h. Press G again to land.', 'Walk up to any parked car and press <b>E</b> to drive it.'] } }
    ] }
  ] },
  { id: 'casa', title: 'Chapter One: The Forced Door', steps: [
    { text: 'Go to Aurelio\'s house in the Barrio de San Cayetano.', reach: 'casaAurelio' },
    { text: 'Look through Aurelio\'s study.', inspect: { spot: 'casaAurelio', label: 'Push open the forced door', cards: [
      'The lock has been levered out of the wood. Inside, every drawer is on the floor.',
      'His notebook is gone: the shelf where it lived is empty, with a clean rectangle in the dust.',
      'Under the desk, a torn page: a sketch of the Biblioteca\'s bronze door. "22: count them backward. The one who raises his hand."',
      'Pinned to the wall, a photograph from 1938: the stadium\'s portada, half-built, and a grinning boy with a chisel. On the back: "Cuco, 18/III/1938."',
      'By the door, a cream business card, "Lic. Octavio Barragán, Manantiales del Cerro S.A.", and a tyre track too wide for a car.'], fx: { clues: ['sketch', 'photo', 'card'] } } },
    { text: 'Report the break-in to Comandante Luna at the Presidencia.', talk: 'luna', chips: [
      { label: 'Do your job, Comandante, or I\'ll tell the whole Jardín you didn\'t.', tone: 'brave', stay: true, fx: { aff: { luna: -6 } }, reply: '(His jaw works.) Joven, I have done this job for twenty-six years. ...Fine. Fine. I\'m listening. Lower your voice.' },
      { label: 'Someone broke into my grandfather\'s house.', tone: 'honest', reply: 'Joven... thieves see an empty house, they go in. I\'ll send a patrol. The investigation into your grandfather is closed. The cerro is steep.', stay: true },
      { label: 'This was on the floor. Barragán\'s card.', need: 'card', tone: 'honest', reply: 'The licenciado visits many people. He wants to buy half the town. That\'s not a crime, joven. (He lowers his voice.) A black pickup was on the trail road that night. I never told you that. Friday is the cabildo. After Friday, maybe I remember more.' }
    ] },
    { text: 'Get wheels from your cousin Rosa at the Taller El Pistón, or fly there.', talk: 'rosa', chips: [
      { label: 'Rosa! I need your help.', reply: '¡Primo! ¡Prima! You look terrible. Abuelo came here twice to borrow my tape measure and a chisel. He was measuring the stadium\'s portada. He said, "The General\'s words are hollow, Rosita." Take the green sedan out front. Go slow on the empedrado. And Güero Mendoza, Barragán\'s driver, has a black pickup. If you see it, drive faster.', fx: { car: 'rosa', card: ['Rosa tosses you the keys to a battered green sedan.', 'Drive: <b>W/S</b> or the left stick to accelerate and brake, <b>A/D</b> to steer, <b>Space</b> for the handbrake, <b>Shift</b> for a little more. <b>E</b> gets you in and out.'] } }
    ] }
  ] },
  { id: 'puerta', title: 'Chapter Two: The Bronze Door', steps: [
    { text: 'Go to the Biblioteca Gabino Ortiz and examine its bronze door.', inspect: { spot: 'bronzeDoor', label: 'Examine the bronze door', cards: [
      'The door of the Biblioteca is wood sheathed in bronze: two leaves of panels, a figure of the Americas standing in each, worn bright where hands have pushed for eighty years.'],
      puzzle: { q: 'Aurelio\'s page says: "22: count them backward. The one who raises his hand." How many figures are on the door?', options: ['Twenty', 'Twenty-two', 'Twenty-four'], answer: 1,
        right: 'Twenty-two. Counting backward from the last, the eighteenth figure raises his hand. Behind it, in the shadow of the palm, someone has scratched: "ARCHIVO. LIBRO DE 1940. FOJA 18." The parish archive, the book of 1940, page 18.',
        wrong: 'You count again. The panels run in two leaves of eleven.' }, fx: { clues: ['foja'], ach: 'veintidos' } } },
    { text: 'Talk to Maestra Inés, who studies Orozco\'s murals in the library.', talk: 'ines', chips: [
      { label: 'You knew my grandfather?', reply: 'Every morning, for a month. He counted everything: the figures on the door, the ribs of the vault, the steps up to Orozco\'s scaffold. He said his father mixed the maestro\'s plaster in 1940. I believe it. Look at the corner of the "Alegoría": a child\'s handprint in the wet lime. Orozco left it.', stay: true },
      { label: 'The door says: the parish archive, the book of 1940.', need: 'foja', reply: 'Does it. (She is quiet a moment too long.) Padre Tomás keeps the books. He\'s particular. Tell him it\'s for your grandfather. And... if you find something, bring it to me. For the museum. For history. Promise me.' }
    ] }
  ] },
  { id: 'archivo', title: 'Chapter Three: The Book of 1940', steps: [
    { text: 'Ask Padre Tomás at the Parroquia de San Francisco for the parish book of 1940.', talk: 'padre', chips: [
      { label: 'Padre, I\'m with the university, like the maestra. I need the book of 1940.', tone: 'lie', fx: { aff: { padre: -5 } }, reply: '(He peers at you over his glasses.) The university sends very young researchers now. And very bad liars. ...Come on. Your grandfather would have lied better. The archive is behind the sacristy. Don\'t touch the candles.' },
      { label: 'Padre, I need to see the book of 1940. Page 18.', tone: 'honest', fx: { aff: { padre: 4 } }, reply: 'Page 18. Hijo, hija, you are the third person this month to ask for that page. Your grandfather. Then the maestra from the university, last week. Nobody opened that book for fifty years, and now it\'s the most popular book in Jiquilpan. Come. The archive is behind the sacristy. Don\'t touch the candles.' }
    ] },
    { text: 'Read page 18 of the book of 1940, in the archive behind the sacristy.', inspect: { spot: 'parroquiaDoor', label: 'Open the book of 1940 to page 18', cards: [
      'Baptisms, 1940, in the priest\'s spidery ink. Page 18 is ordinary: a Juana, a Rigoberto, twins named for saints.',
      'Then, in the margin, in pencil gone silver with age, a boy\'s careful hand:',
      '"Lo que el General dejó al pueblo, lo guardé donde sus palabras dicen que es del pueblo." (What the General left to the town, I kept where his words say it belongs to the town.) Signed: R.V., Cuco.',
      'Between the pages, a pressed leaf, stained deep blue. Añil. Indigo. Where do the General\'s words stand in stone? The stadium\'s portada.'], fx: { clues: ['margin'], ach: 'archivista' } } }
  ] },
  { id: 'portada', title: 'Chapter Four: The Hollow Words', steps: [
    { text: 'Go to the portada of the Estadio 18 de Marzo and read the General\'s words.', inspect: { spot: 'portadaQuote', label: 'Read the bronze plaque', cards: [
      '"LOS RECURSOS NATURALES DEL PAÍS DEBEN SERVIR PARA SU PROPIA PROSPERIDAD. ENTREGARLOS A INTERESES EXTRAÑOS ES TRAICIONAR LA PATRIA." — Gral. Lázaro Cárdenas.',
      'The natural resources of the country must serve its own prosperity. To hand them to foreign interests is to betray the homeland.',
      'The stadium is named for 18 March 1938, the day Cárdenas nationalized Mexico\'s oil. Cuco\'s photograph was taken that same day, on this scaffold.'], fx: { clues: ['quote'], ach: 'recursos' } } },
    { text: 'Ask Chema, the old groundskeeper, about the portada.', talk: 'chema', chips: [
      { label: 'Tell me what you know, old man, or I\'ll tell the town you let him go up there alone.', tone: 'cruel', fx: { aff: { chema: -15 } }, reply: '(The old goalkeeper flinches as if you\'d kicked a ball at his face.) ...He came with a chisel. Tapped the right pylon until a stone rang hollow, the one with the añil flower, low, inside. That\'s all. Go. You have his nose, not his heart.' },
      { label: 'My grandfather came here with a chisel, didn\'t he?', tone: 'kind', fx: { aff: { chema: 6 } }, reply: 'He did. Two weeks ago. He tapped every stone on the right pylon like a doctor listening to a chest, until one rang hollow. The stone with the añil flower carved on it, low, on the inside. He sat right there and cried a little. Then he said, "Not yet, Chema. Not until I know it\'s safe." I promised to say nothing. So I\'m saying nothing. Loudly.' }
    ] },
    { text: 'Find the hollow stone with the carved indigo flower, low on the right pylon.', inspect: { spot: 'portadaStone', label: 'Tap the stone with the indigo flower', cards: [
      'The stone rings hollow. It has been cut and reset with lime that crumbles under your thumb.',
      'Inside: an iron key, hand-forged, tagged "C.V. 1940", and a square of waxed paper. A map of the cerro in indigo ink: the trail, a house, and high up, a spring marked "Ojo del Añil" beside a mouth in the rock.',
      'Headlights sweep across the gate. A black pickup with no plates. A big blond man climbs out, already running. "¡Eso no es tuyo!"'], fx: { clues: ['ironkey', 'map'], chase: true } } },
    { text: 'Escape Güero\'s black pickup! Get to Rosa\'s garage.', escape: 'taller', fx: { ach: 'persecucion', card: ['You make it to the Taller El Pistón. Rosa hauls down the steel cortina behind you with a crash.', '"¡No manches! That was Güero. Okay. Now it\'s personal."'] } }
  ] },
  { id: 'testigos', title: 'Chapter Five: Three Witnesses', steps: [
    { text: 'Find three people who can explain the key and the spring: Don Emeterio at the Casa de Lázaro Cárdenas, Doña Petra up the cerro trail, and Barragán, who has asked to meet you at the Plaza de Toros.', any: [
      { id: 'emeterio', talk: 'emeterio', chips: [{ label: 'What happened in 1938 to the town\'s water?', reply: 'Ah. Sit. In 1938 the General\'s government gave this town the rights to the springs of the Cerro de San Francisco: the Ojo del Añil, above all. It was written in a register kept here, and a title given to the town. But the register\'s page for the Ojo was cut out, years ago, with a razor. Whoever holds the original title holds the spring, joven. Without it, the company says the water belongs to no one. And what belongs to no one is for sale.', fx: { clues: ['register'] } }] },
      { id: 'petra', talk: 'petra', chips: [{ label: 'Doña Petra, my grandfather was looking for a spring. The Ojo del Añil.', reply: '(She looks at your hands, not your face.) Jiquilpan means the place of the jiquilite, the plant that makes añil. My grandmothers dyed cloth blue in the water up there. The cave above the spring opens only for someone who carries Cuco\'s key. Do you carry it? Good. Then you still need a reason. Go and find your reason, then come up.', fx: { clues: ['petra'] } }] },
      { id: 'barragan', talk: 'barragan', chips: [
        { label: 'I won\'t sell anything to you.', tone: 'honest', reply: 'Mi estimado, I haven\'t offered anything yet. (He smiles.) Güero gets carried away, I apologize for him. Let\'s be practical: the maestra from the museum has already promised me whatever your grandfather was chasing, for a new wing. So you see, you are late. Enjoy the town.', fx: { clues: ['offer'], flag: 'refused' } },
        { label: 'How much would it be worth to you?', tone: 'lie', reply: '(He writes a number on the back of a card and slides it over. It has many zeros.) For the key, and whatever it opens. Before Friday. Güero will find you; don\'t trouble yourself. And between us, the maestra already promised me the same thing. First come, first paid.', fx: { clues: ['offer'], flag: 'tempted' } }
      ] }
    ], need: 3 },
    { text: 'Search Maestra Inés\'s office at the museum.', inspect: { spot: 'museoDoor', label: 'Search the maestra\'s office', cards: [
      'The museum\'s offices are behind the glass. The maestra\'s door is unlocked; her desk is buried in photographs of Orozco\'s scaffolds.',
      'In the bottom drawer, under a folder marked "PROYECTO: ALA NUEVA" (new wing), is a battered notebook you know at once. Your grandfather\'s.',
      'Every clue you have followed is in it, in his square engineer\'s hand. On the last page, underlined twice: "Petra sabe." Petra knows.'], fx: { clues: ['notebook'] } } },
    { text: 'Confront Maestra Inés. She is at the Biblioteca.', talk: 'ines', chips: [
      { label: 'You took his notebook. Why? You must have been afraid of something.', tone: 'kind', fx0: { aff: { ines: 10 } }, reply: '(Her face falls.) I went to his house the morning he vanished, to help. The door was already broken. I took the notebook so Barragán wouldn\'t. Then he came to me with his new wing, and I... I told myself history would be safe in a glass case. I was wrong. If you find the title, I will stand in front of the cabildo and swear to what it is. I know a real 1938 seal when I see one.', fx: { flag: 'inesAlly', ach: 'caraacara' } },
      { label: 'You\'re a thief, and you sold my grandfather to Barragán.', tone: 'cruel', reply: '(Her voice goes cold.) I kept his notebook safe while the police did nothing. Think what you like. Take it and go.', fx: { flag: 'inesHostile', ach: 'caraacara' } }
    ] }
  ] },
  { id: 'cerro', title: 'Chapter Six: The Indigo Cave', steps: [
    { text: 'Climb, drive or fly up the Cerro de San Francisco to the Ojo del Añil. Follow the map.', reach: 'cueva' },
    { text: 'Enter the cave with Cuco\'s key.', inspect: { spot: 'cueva', label: 'Step into the cave', cards: [
      'The rocks by the spring are stained a deep, impossible blue. Añil. The water is so clear it looks like air.',
      'Inside the cave, a lantern. A folding chair. A splinted leg. And your grandfather, thinner, bearded, grinning at you like you are the best thing he has ever built.',
      '"¡Mijo! ¡Mija! Petra said you had my father\'s key. Güero ran me off the trail road; I broke my leg and crawled up here. Petra has been feeding me beans and bad news." '], fx: { reveal: 'aurelio' } } },
    { text: 'Talk to your grandfather.', talk: 'aurelio', chips: [
      { label: 'Abuelo, everyone thinks you\'re dead!', reply: 'I know, I know. I\'m a terrible grandfather and a worse patient. But look. (He drags a tin box from behind the rocks, black with age, and holds out his hand for the key.) My father hid this in 1940, the year Orozco painted. He didn\'t trust the men who came after the General. Open it.', fx: { card: ['The key turns with a grinding sigh.', 'Inside, wrapped in oilcloth: a folded document with red wax seals. "Título de dotación de las aguas del Ojo del Añil al pueblo de Jiquilpan." Dated 18 March 1938.', 'Your grandfather laughs until he coughs. "The town\'s water. In writing. Now take it down to the cabildo before that lawyer finds a match."', 'Below, on the trail road, headlights. A black pickup, climbing fast.'], clues: ['title'], ach: 'anil' } }
    ] },
    { text: 'Fly the title down to the Presidencia before Güero catches you!', timed: { to: 'presidencia', secs: 200 }, fx: { ach: 'contrareloj' } }
  ] },
  { id: 'cabildo', title: 'Chapter Seven: The Open Council', steps: [
    { text: 'The cabildo has come out under the arches of the Presidencia. Decide what happens to the title.', talk: 'luna', chips: [
      { label: 'Read the title aloud, to the whole town.', ending: 'pueblo', tone: 'honest', fx: { trait: { heart: 10, fame: 15 } }, reply: 'Comandante Luna takes off his cap, looks at the seals, and for once in his life says it loudly: "Let the young one read." You read it under the arches. The plaza goes silent, then roars.' },
      { label: 'Give the box to the museum, where it will be safe.', ending: 'museo', reply: 'You hand the box to Maestra Inés. "It will be safe," she says. It will. In a glass case. The cabildo votes anyway.' },
      { label: 'Sell it to Barragán.', tone: 'cruel', fx: { trait: { heart: -15, word: -10 }, money: 60000 }, need: 'tempted', needText: 'you would have to have listened to his price', ending: 'trato', reply: 'Barragán counts out the envelope without looking up. "Practical," he says. "I like practical people."' }
    ] }
  ] }
];

export const ENDINGS = {
  pueblo: { title: 'El agua es del pueblo', ach: 'pueblo', cards: [
    'You read the title under the arches of the Presidencia, and the plaza, which came to shout, listens.',
    null,   // filled in by whether the maestra stands with you
    'Güero Mendoza is arrested on the Sahuayo road with Aurelio\'s blood still on his bumper. Barragán catches the evening bus to Guadalajara.',
    'On Sunday the band plays on the kiosco. Your grandfather dances with Tía Cuca, on crutches, badly. Doña Petra comes down from the cerro for the first time in nine years and sits on a bench, very straight, in a blue rebozo.',
    '<em>EL AGUA ES DEL PUEBLO</em>\n\nJiquilpan is yours to wander. Race Rosa, find Aurelio\'s lost pages, fly the cerro at sunset.'] },
  museo: { title: 'The Glass Case', ach: 'museo', cards: [
    'The title goes into a glass case in the new wing of the museum, lit beautifully. The cabildo, without it in front of them, votes 6 to 5 for the company.',
    'Your grandfather does not speak to you for a week. Then he does, because he is your grandfather.',
    'People queue to see the title. The springs are pumped into bottles in Zamora. Every bottle has a picture of the cerro on the label.',
    '<em>THE GLASS CASE</em>\n\nHistory is safe. The water is not. You can keep exploring Jiquilpan.'] },
  trato: { title: 'The Deal', ach: 'trato', cards: [
    'The envelope is heavy. The title is lighter in Barragán\'s briefcase than it was in your hands.',
    'The cabildo votes for the company. Tía Cuca closes her cart for a week and will not say why.',
    'Your grandfather looks at you for a long time and says, "My father hid it for eighty years. You kept it for one afternoon."',
    '<em>THE DEAL</em>\n\nYou can still walk the town. It will remember.'] }
};

/* The engine. h: hooks into the game (give clues, set flags, cards, chase, etc.). */
export class Story {
  constructor(h) { this.h = h; }
  get s() { return this.h.state(); }
  chapter() { return CHAPTERS[this.s.ch] || null; }
  step() { if (this.s.ending) return null; const c = this.chapter(); return c ? c.steps[this.s.st] || null : null; }
  done() { return !!this.s.ending; }
  has(clue) { return this.s.clues.includes(clue) || !!this.s.flags[clue]; }
  /* the gold choices this person offers for the current step */
  chipsFor(npc) {
    const st = this.step(); if (!st) return [];
    let chips = null;
    if (st.talk === npc) chips = st.chips;
    if (st.any) { const sub = st.any.find(a => a.talk === npc && !(this.s.any || []).includes(a.id)); if (sub) chips = sub.chips.map(c => Object.assign({ sub: sub.id }, c)); }
    if (!chips) return [];
    return chips.filter(c => !(this.s.used || []).includes(c.label)).map(c => {
      const locked = c.need && !this.has(c.need);
      return { quest: true, tone: c.tone, label: c.label, locked, lockedText: c.needText || (c.need ? 'you need to know more first' : ''), run: () => this.pick(c) };
    });
  }
  pick(c) {
    const s = this.s; if (c.need && !this.has(c.need)) return { reply: null };
    (s.used = s.used || []).push(c.label);
    // two ways to say the same thing: once one is chosen, its twin disappears too
    const st0 = this.step(); if (st0 && st0.chips && !c.stay) for (const o of st0.chips) if (o !== c && !o.stay && !o.ending) s.used.push(o.label);
    if (c.tone) this.h.tone(c.tone);
    if (c.fx) this.h.fx(c.fx); if (c.fx0) this.h.fx(c.fx0);
    if (c.ending) { this.h.ending(c.ending); return { reply: c.reply }; }
    if (c.sub) { (s.any = s.any || []).push(c.sub); const st = this.step(); if (s.any.length >= (st.need || st.any.length)) this.advance(); else this.h.changed(); return { reply: c.reply }; }
    if (!c.stay) this.advance(); else this.h.changed();
    return { reply: c.reply };
  }
  /* things to examine for the current step: [{spot, label, run}] */
  inspectable() {
    const st = this.step(); if (!st || !st.inspect) return null;
    return { spot: st.inspect.spot, label: st.inspect.label, run: () => this.h.inspect(st.inspect, () => { if (st.inspect.fx) this.h.fx(st.inspect.fx); this.advance(); }) };
  }
  event(kind, arg) {
    const st = this.step(); if (!st) return;
    if (kind === 'reach' && st.reach === arg) this.advance();
    if (kind === 'escaped' && st.escape) { if (st.fx) this.h.fx(st.fx); this.advance(); }
    if (kind === 'arrived' && st.timed) { if (st.fx) this.h.fx(st.fx); this.advance(); }
  }
  advance() {
    const s = this.s, c = this.chapter();
    s.st++;
    if (s.st >= c.steps.length) {
      s.ch++; s.st = 0; s.any = []; this.h.chapterDone(c);
      const n = this.chapter(); if (n) this.h.chapterStart(n);
    } else this.h.stepStart(this.step());
    this.h.changed();
  }
  /* where the current step points: {kind, id} */
  targetRef() {
    const st = this.step(); if (!st) return null;
    if (st.talk) return { npc: st.talk };
    if (st.reach) return { place: st.reach };
    if (st.inspect) return { spot: st.inspect.spot };
    if (st.escape) return { place: st.escape };
    if (st.timed) return { place: st.timed.to };
    if (st.any) { const left = st.any.filter(a => !(this.s.any || []).includes(a.id)); return left.length ? { npcs: left.map(a => a.talk) } : null; }
    return null;
  }
}
