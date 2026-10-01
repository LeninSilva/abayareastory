// New faces of Jiquilpan: the Presidente Municipal and the cabildo's regidores (one of every colour, all equally
// hard to find), the shopkeepers, and the neighbours whose troubles become your side quests. All invented.
// Each has a temperament (how they take a joke, a compliment, an insult), what they like as a gift, a place and
// a timetable (some are almost never out).

const P = o => o;
// party colours: Morena (guinda), PAN (blue), PRI (green, white, red), PRD (yellow), Movimiento Ciudadano (orange)
export const PARTIES = {
  morena: { name: 'Morena', color: 0x8a1c2a, css: '#8a1c2a' },
  pan: { name: 'PAN', color: 0x1c4aa0, css: '#1c4aa0' },
  pri: { name: 'PRI', color: 0x2a7a3a, css: '#2a7a3a' },
  prd: { name: 'PRD', color: 0xf2c500, css: '#e8b800' },
  mc: { name: 'Movimiento Ciudadano', color: 0xf07a1a, css: '#f07a1a' }
};
const hh = (d, h, k) => { const x = Math.sin(d * 127.1 + Math.floor(h) * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); };
const dow = day => (day - 1) % 7;   // 0 = Tuesday (the story starts on a Tuesday) … 3 = Friday, 5 = Sunday

export const CAST = {
  /* ---------------- the ayuntamiento ---------------- */
  alcalde: {
    name: 'Don Pánfilo Garnica', title: 'Presidente Municipal (the town calls him “El Globo”)', at: 'presidencia', offset: [-4, -10], temper: 'political', party: 'none', adult: true, fem: false,
    look: P({ skin: 0xc99a78, hair: 0x2a2018, hairStyle: 'short', top: 0xf2f2f2, bottom: 0x22242c, coat: 0x2a2e3a, build: 1.65, belly: 1, height: 0.96, sash: 0x2a7a3a, glasses: true }),
    // almost never out: Fridays after the cabildo, and once in a blue moon for a torta
    schedule: (d, h) => (dow(d) === 3 && h >= 12 && h < 13.5) || (h >= 11 && h < 18 && hh(d, h, 1) < 0.05),
    likes: ['charanda', 'pan', 'queso'],
    greet: ['¡Mi gente! ¡Mi pueblo! Ah, you, the young one with the mochila. Tell me your problem; my door is always open. (It is not.)', 'Ah, my favourite citizen! Don\'t tell the others. Walk with me, I am going to inaugurate a bench.', 'Shh. I am not here. I am in a meeting. But for you, two minutes.'],
    lines: {
      self: ['Thirty-one years of public service, joven. Eleven as a regidor, six as síndico, three as presidente, and eleven more trying to remember the difference.', 'I was born on Calle Morelos. I will die on Calle Morelos. In between, I will have inaugurated every bench on Calle Morelos.'],
      town: ['Jiquilpan is the most beautiful town in Michoacán. Write that down. My chief of staff will check that you wrote it down.', 'Under my administration: eleven benches, two murals, one study about a new market. The market is coming. The study was excellent.'],
      water: ['The springs? A delicate matter. I have formed a commission to study the formation of a commission.', 'Water is life, joven. And elections are every three years. Both things are true.'],
      complaint: ['¡Claro que sí! Your complaint will be attended to with the urgency it deserves. Lupita! Write this down. Lupita? ... She will write it down.', 'The bache on Calle Morelos? Ah, the bache. A historic bache. We are studying it. It has studied us back.', 'I promise you: this year, yes. Next year, certainly. The year after, it will be a priority of priorities.']
    }
  },
  secretaria: {
    name: 'Lupita Ceja', title: 'secretary to the Presidente (the only one who knows where he is)', at: 'presidencia', offset: [8, -9], temper: 'dry', party: 'none', adult: true, fem: true,
    look: P({ skin: 0xd8b48e, hair: 0x3a2a1a, hairStyle: 'bun', top: 0x6a2f4a, bottom: 0x2a2a30, glasses: true, accessory: 'bag', height: 0.93 }),
    schedule: (d, h) => h >= 9 && h < 15 && dow(d) !== 5 && dow(d) !== 4,
    likes: ['flores', 'ate', 'libro'],
    greet: ['El señor presidente está en junta. ¿De parte de quién?', 'He is in a meeting. Yes, still. Since 2021. ¿Le tomo el recado?', 'Buenas. Before you ask: no, he is not in. Yes, his car is outside. It is always outside.'],
    lines: {
      self: ['I have typed every promise this ayuntamiento has made since 2009. I keep copies. I am the most dangerous woman in Jiquilpan.', 'Eighteen years at this desk. Three presidentes. One plant. The plant is the only one that grew.'],
      town: ['The regidores? Ha. You will see them at the cabildo, on Fridays, in the photos. Otherwise, look for them where there is food.', 'If you want something done in this town, ask your grandmother. If you want it filed, ask me.'],
      complaint: ['I will take your complaint. (She stamps it with tremendous force.) It will join the others. They keep each other company.', 'Bache, lights, dogs, water, the music from the feria. Which one? I have a drawer for each.']
    }
  },
  regMorena: {
    name: 'Regidora Maricruz Tinoco', title: 'regidora, Morena', at: 'azulPortal', offset: [-6, 4], temper: 'political', party: 'morena', adult: true, fem: true,
    look: P({ skin: 0xb88763, hair: 0x1a1410, hairStyle: 'long', top: 0x8a1c2a, bottom: 0x2a2a30, accessory: 'bag', height: 0.94 }),
    schedule: (d, h) => (dow(d) === 0 || dow(d) === 2) && h >= 9 && h < 10.5,
    likes: ['libro', 'pan', 'flores'],
    greet: ['¡Buenos días, compañero, compañera! The transformation of Jiquilpan does not stop. It is just having breakfast.', 'Ah, the people! I love the people. Sit, I am finishing my chilaquiles.'],
    lines: { self: ['I was a schoolteacher for twenty years. Now I am a regidora. The pay is better and the children are older.'],
      complaint: ['Your complaint is the voice of the people, and the voice of the people is sacred. I will raise it at the next session. Or the one after. Sessions are long.', 'That is a structural problem inherited from previous administrations. All of them. Even the ones before electricity.'] }
  },
  regPan: {
    name: 'Regidor Lic. Ernesto Villaseñor', title: 'regidor, PAN', at: 'parroquia', offset: [-40, -14], temper: 'pious', party: 'pan', adult: true, fem: false,
    look: P({ skin: 0xe0b894, hair: 0x4a3020, hairStyle: 'short', top: 0xbfd6e8, bottom: 0x22242c, coat: 0x1c4aa0, glasses: true }),
    schedule: (d, h) => dow(d) === 5 && h >= 12 && h < 13.5,
    likes: ['veladora', 'libro', 'queso'],
    greet: ['Buenas tardes, joven. With order, with method, and with God, everything has a solution. Eventually.', 'Ah. A constituent. After Mass, please. Oh, it is after Mass. Well.'],
    lines: { self: ['I am a notary by profession and a regidor by vocation. Or the other way round. My wife says neither.'],
      complaint: ['I have prepared an initiative regarding your complaint. It is forty pages long. It is excellent. It has not been read.', 'We must follow the procedure. I believe in procedure. Procedure is what we have instead of results.'] }
  },
  regPri: {
    name: 'Regidor Don Chuy Magaña', title: 'regidor, PRI (they call him “El Dinosaurio”, fondly)', at: 'presidencia', offset: [16, -12], temper: 'elder', party: 'pri', adult: true, fem: false,
    look: P({ skin: 0xa8765a, hair: 0xd8d4cc, hairStyle: 'short', top: 0xe8e2d4, bottom: 0x4a4030, hat: 'wide', hatColor: 0xd8c8a0, build: 1.2, belly: 0.5, accessory: 'cane' }),
    schedule: (d, h) => (dow(d) === 0 || dow(d) === 2) && h >= 17 && h < 19,
    likes: ['charanda', 'pan', 'ate'],
    greet: ['Siéntese, siéntese. You play dominoes? No? Then sit and watch me lose with experience.', 'Joven. In my day, things got done. Slowly, but they got done. Mostly to my cousins.'],
    lines: { self: ['I have been a regidor under six presidentes. I outlasted all of them. Dinosaurs are patient.'],
      complaint: ['Ah, the bache. I remember when it was a little bache, this big. We all have to grow.', 'Así se ha hecho siempre: you complain, I listen, the bache stays. It is a tradition. Traditions are important.'] }
  },
  regPrd: {
    name: 'Regidora Lupe Anaya', title: 'regidora, PRD', at: 'jardinPaz', offset: [12, -8], temper: 'warm', party: 'prd', adult: true, fem: true,
    look: P({ skin: 0xc99a78, hair: 0x8a8680, hairStyle: 'short', top: 0xf2c500, bottom: 0x2a3a5a, glasses: true, accessory: 'scarf', height: 0.92 }),
    schedule: (d, h) => dow(d) === 4 && h >= 10 && h < 12,
    likes: ['flores', 'pan', 'alebrije'],
    greet: ['¡Hola, mi vida! Come, sit with me. The Jardín de la Paz is the only place in this town where nobody argues. Except me.', 'The authentic left is here, on this bench, feeding the pigeons. The pigeons agree with me.'],
    lines: { self: ['I marched in \'88, in \'94, in \'06. Now I march to the bakery. Same shoes.'],
      complaint: ['I will denounce it! Publicly! At the next session, with a very long speech. Then we will vote. Then we will lose. Then I will write a letter.', 'I agree with you completely. That is the problem: everybody agrees with you. Nobody does anything. Including me, mi vida.'] }
  },
  regMc: {
    name: 'Regidor Kevin Oregel', title: 'regidor, Movimiento Ciudadano (the orange one)', at: 'bosque', offset: [-60, -100], temper: 'teen', party: 'mc', adult: true, fem: false,
    look: P({ skin: 0xd8b48e, hair: 0x1a1410, hairStyle: 'short', top: 0xf07a1a, bottom: 0x2a2a30, hat: 'cap', hatColor: 0xf07a1a }),
    schedule: (d, h) => h >= 7 && h < 8 && hh(d, 0, 9) < 0.5,
    likes: ['balon', 'alebrije', 'gaspacho'],
    greet: ['¡Qué onda! Wait, wait, say that again for the video. ¡Jiquilpan, buenos días! Okay, now you.', 'Jogging and politics, wey. Healthy body, healthy cabildo. Mostly body.'],
    lines: { self: ['I am the youngest regidor in the history of Jiquilpan. I have eleven thousand followers. Four of them vote here.'],
      complaint: ['Bro, I will make an app for that. You report the bache, you get points. The bache stays, but you get points.', 'I posted about it! Forty likes. That is basically a public works program.'] }
  },
  /* ---------------- shopkeepers ---------------- */
  maru: { name: 'Doña Maru', title: 'Boutique Rosa Mexicano', at: 'boutique', offset: [0, 0], shop: 'boutique', temper: 'warm', adult: true, fem: true, look: P({ skin: 0xc99a78, hair: 0x2a1d16, hairStyle: 'bun', top: 0xc02870, bottom: 0x2a2a30, dress: true, glasses: true }), likes: ['flores', 'ate'],
    greet: ['¡Pásele, pásele! Something for the jardín on Sunday? You can\'t walk around the kiosco looking like Guadalajara.', 'Ay, that shirt. No, no, come in. I can help.'] },
  fermin: { name: 'Don Fermín', title: 'Sombrerería La Texana', at: 'sombreros', offset: [0, 0], shop: 'sombreros', temper: 'elder', adult: true, fem: false, look: P({ skin: 0xa8765a, hair: 0xb8b8b8, hairStyle: 'short', top: 0xe8e2d4, bottom: 0x4a4030, hat: 'wide', hatColor: 0x1e1c1a, beard: true }), likes: ['charanda', 'pan'],
    greet: ['A hat says who you are before you open your mouth. Yours says nothing. Let\'s fix that.', 'Boots that fit you like your own feet. Better than your own feet.'] },
  lucha: { name: 'Doña Lucha', title: 'artisan, La Casita de Piedra', at: 'casita', offset: [0, -7], shop: 'casita', temper: 'shy', adult: true, fem: true, look: P({ skin: 0x8a5a3c, hair: 0x6a6a6a, hairStyle: 'braid', top: 0x2a3a78, bottom: 0x3a2a4a, dress: true, accessory: 'scarf' }), likes: ['libro', 'flores', 'alebrije'],
    greet: ['Bienvenido a la Casita de Piedra. Touch anything you like; it was made to be touched.', 'The stones of this house were carried down from the cerro. So were most of the people.'] },
  goyo: { name: 'Don Goyo', title: 'Mercado de Artesanías', at: 'mercado', offset: [0, 0], shop: 'mercado', temper: 'dry', adult: true, fem: false, look: P({ skin: 0xb88763, hair: 0x1a1410, hairStyle: 'short', top: 0xd86a2a, bottom: 0x2a2a30, accessory: 'apron' }), likes: ['charanda', 'queso'],
    greet: ['Huaraches, sarapes, alebrijes, charanda, lottery tickets, an amulet against the evil eye. Everything a person needs.', 'Buy something. Or don\'t. I\'m here either way.'] },
  itzel: { name: 'Itzel', title: 'Florería Las Jacarandas', at: 'floreria', offset: [0, 0], shop: 'floreria', temper: 'shy', adult: true, fem: true, look: P({ skin: 0xd8b48e, hair: 0x1a1410, hairStyle: 'long', top: 0x8a74c8, bottom: 0x2a2a30, accessory: 'apron' }), likes: ['alebrije', 'libro', 'gaspacho'],
    greet: ['Hola. Flowers for someone? You can tell me who. I won\'t tell anyone. (I will tell my mother.)', 'The jacarandas are free, but they don\'t keep. These do, for a week.'] },
  amparo: { name: 'Don Amparo', title: 'La Cremería', at: 'cremeria', offset: [0, 0], shop: 'cremeria', temper: 'parental', adult: true, fem: false, look: P({ skin: 0xc99a78, hair: 0x6a6a6a, hairStyle: 'short', top: 0xffffff, bottom: 0x2a3a5a, accessory: 'apron', build: 1.2, belly: 0.4 }), likes: ['charanda', 'pan'],
    greet: ['Prueba, prueba. Cotija from up the sierra. If you don\'t buy it, at least you ate.', 'Crema, queso, cajeta, and the latest news from the Jardín de la Paz. All fresh.'] },
  beto: { name: 'Don Beto', title: 'Peluquería Don Beto', at: 'peluqueria', offset: [0, 0], shop: 'peluqueria', temper: 'warm', adult: true, fem: false, look: P({ skin: 0xa8765a, hair: 0x101010, hairStyle: 'short', top: 0x2850a0, bottom: 0x22242c, beard: true }), likes: ['charanda', 'balon'],
    greet: ['Sit. Don\'t talk. No, talk: that is the whole business. A cut, a shave, the news.', 'Forty years cutting hair under that photo of the General. He never came in. His loss.'] },
  yolanda: { name: 'Lic. Yolanda Partida', title: 'Bienes Raíces Jiquilpan', at: 'notaria', offset: [0, 0], shop: 'notaria', temper: 'political', adult: true, fem: true, look: P({ skin: 0xe0b894, hair: 0x3a2a1a, hairStyle: 'bun', top: 0xe8e8e8, bottom: 0x22242c, coat: 0x2d4a3a, glasses: true }), likes: ['flores', 'queso'],
    greet: ['Land, joven. They are not making any more of it. Except on the cerro, where they make it steeper.', 'Buying, selling, or just looking? Looking is free. Deeds are not.'] },
  chuy: { name: 'Maestro Chuy', title: 'maestro de obras (master builder), Materiales El Albañil', at: 'ferreteria', offset: [0, 0], shop: 'ferreteria', temper: 'dry', adult: true, fem: false, look: P({ skin: 0x8a5a3c, hair: 0x2a2a2a, hairStyle: 'short', top: 0x9a9690, bottom: 0x4a4030, hat: 'cap', hatColor: 0xd8a020, build: 1.15, belly: 0.3 }), likes: ['charanda', 'pan', 'gaspacho'],
    greet: ['You have land? I have hands. Two chalanes, a mixer that works if you kick it, and forty years of not falling off anything.', 'Mezcla, block, varilla. Tell me what you dream and I\'ll tell you what it costs.'] },
  /* ---------------- neighbours with troubles (side quests) ---------------- */
  chole: { name: 'Doña Chole', title: 'neighbour on Calle Morelos, at war with a pothole', at: 'bache', offset: [4, 3], temper: 'parental', adult: true, fem: true, look: P({ skin: 0xb88763, hair: 0xb8b8b8, hairStyle: 'bun', top: 0x3a6a8a, bottom: 0x2a2a30, dress: true, accessory: 'apron', height: 0.9 }), likes: ['pan', 'flores', 'veladora'] },
  cirilo: { name: 'Don Cirilo', title: 'night watchman of the Panteón', at: 'panteon', offset: [-6, -50], temper: 'elder', adult: true, fem: false, look: P({ skin: 0x8a5a3c, hair: 0xd8d4cc, hairStyle: 'short', top: 0x3a3a3a, bottom: 0x2a2a30, coat: 0x4a3a2a, hat: 'wide', hatColor: 0x2b2622, accessory: 'cane' }), likes: ['charanda', 'pan', 'veladora'],
    schedule: (d, h) => h >= 19 || h < 6 },
  nicolas: { name: 'Nicolás Novoa', title: 'son of the Rancho de Novoa, heartbroken', at: 'ranchoNovoa', offset: [8, 6], temper: 'shy', adult: true, fem: false, look: P({ skin: 0xc99a78, hair: 0x2a1d16, hairStyle: 'short', top: 0xe8e2d4, bottom: 0x2a3a5a, hat: 'wide', hatColor: 0xd8c8a0, shoes: 0x5a3a20 }), likes: ['libro', 'gaspacho'] },
  remedios: { name: 'Doña Remedios Novoa', title: 'head of the Rancho de Novoa', at: 'ranchoNovoa', offset: [-6, -4], temper: 'suspicious', adult: true, fem: true, look: P({ skin: 0xa8765a, hair: 0x6a6a6a, hairStyle: 'braid', top: 0x5a2a3a, bottom: 0x2a2a30, dress: true, accessory: 'scarf' }), likes: ['flores', 'veladora', 'queso'] },
  rocio: { name: 'Rocío Salazar', title: 'daughter of the Rancho de los Salazar', at: 'ranchoSalazar', offset: [6, -6], temper: 'warm', adult: true, fem: true, look: P({ skin: 0xd8b48e, hair: 0x1a1410, hairStyle: 'braid', top: 0xc02820, bottom: 0x2a3a5a, dress: true }), likes: ['flores', 'alebrije'] },
  eusebio: { name: 'Don Eusebio Salazar', title: 'head of the Rancho de los Salazar', at: 'ranchoSalazar', offset: [-8, 2], temper: 'dry', adult: true, fem: false, look: P({ skin: 0x8a5a3c, hair: 0xb8b8b8, hairStyle: 'short', top: 0x4a3a2a, bottom: 0x2a2a30, hat: 'wide', hatColor: 0x1e1c1a, beard: true, shoes: 0x5a3a20, build: 1.1 }), likes: ['charanda', 'pan'] },
  tona: { name: 'Doña Toña', title: 'the tiendita at San Francisco del Cerro', at: 'sanFrancisco', offset: [10, 6], temper: 'parental', adult: true, fem: true, look: P({ skin: 0x8a5a3c, hair: 0xb8b8b8, hairStyle: 'braid', top: 0x2e7a3a, bottom: 0x2a2a30, dress: true, accessory: 'apron', height: 0.9 }), likes: ['pan', 'flores', 'queso'] },
  lencho: { name: 'Don Lencho “El Gritón”', title: 'caller of the lotería on the Jardín', at: 'jardin', offset: [-26, -14], temper: 'warm', adult: true, fem: false, look: P({ skin: 0xb88763, hair: 0x2a2a2a, hairStyle: 'short', top: 0xe8e2d4, bottom: 0x2a2a30, hat: 'wide', hatColor: 0xd8c8a0 }), likes: ['charanda', 'gaspacho'],
    schedule: (d, h) => h >= 17 && h < 23 },
  refugio: { name: 'Don Refugio', title: 'dispatcher, Sitio de taxis Abasolo', at: 'sitioAbasolo', offset: [2, 3], temper: 'dry', adult: true, fem: false, look: P({ skin: 0xa8765a, hair: 0x6a6a6a, hairStyle: 'short', top: 0xffffff, bottom: 0x22242c, hat: 'cap', hatColor: 0x1e1c1a, glasses: true }), likes: ['charanda', 'gaspacho'],
    schedule: (d, h) => h >= 6 && h < 23 },
  julian: { name: 'Don Julián', title: 'manager of the Azul Portal', at: 'azulPortal', offset: [-8, -6], temper: 'parental', adult: true, fem: false, look: P({ skin: 0xd8b48e, hair: 0x2a1d16, hairStyle: 'short', top: 0xffffff, bottom: 0x1e2230, coat: 0x1e2230 }), likes: ['flores', 'queso'],
    schedule: (d, h) => h >= 8 && h < 23 },
  socorro: { name: 'Madre Socorro', title: 'Mother Superior of the nuns at the Santuario de Guadalupe', at: 'guadalupe', offset: [-14, 6], temper: 'pious', adult: true, fem: true, look: P({ skin: 0xc99a78, hair: 0x101010, top: 0xe8e4dc, bottom: 0x1a1a24, dress: true, hat: 'veil', glasses: true, height: 0.9 }), likes: ['veladora', 'flores', 'libro'],
    schedule: (d, h) => h >= 7 && h < 20 }
};
/** the story's own characters, for the relationship system */
export const STORY_TEMPER = { cuca: 'parental', luna: 'dry', rosa: 'teen', ines: 'shy', padre: 'pious', chema: 'warm', emeterio: 'elder', petra: 'suspicious', barragan: 'political', aurelio: 'warm', guero: 'suspicious' };
export const STORY_LIKES = { cuca: ['flores', 'pan'], luna: ['pan', 'balon'], rosa: ['alebrije', 'gaspacho', 'balon'], ines: ['libro', 'flores'], padre: ['veladora', 'libro', 'ate'], chema: ['balon', 'charanda'], emeterio: ['libro', 'pan', 'ate'], petra: ['veladora', 'queso'], barragan: ['charanda'], aurelio: ['pan', 'libro', 'charanda'] };

/* what people say about the ayuntamiento: the town's running joke */
export const TOWN_JOKES = [
  '¿Sabe cuál es el animal más rápido de Jiquilpan? El presidente municipal, cuando le preguntas por el bache.',
  'The bache on Calle Morelos has a name now. We call it “El Regidor”: it never leaves and it never does anything.',
  'They promised us a new market. We have a new market: the old one, with a new banner.',
  'The regidores listen beautifully. My late uncle listened beautifully too. Also did nothing. God rest him.',
  'When Don Pánfilo comes out of the Presidencia, the pigeons go in to check the furniture is still there.',
  'Five parties, five regidores, one bache. The bache is the only one with a majority.',
  'Morena says it\'s the PAN\'s fault, the PAN says the PRI, the PRI says the PRD, the PRD says everyone, and the orange boy says “like and subscribe”.',
  'The cabildo meets on Fridays. You know it\'s Friday because the Presidencia\'s lights are on and the taquería across the street is empty.',
  'Don Pánfilo cut the ribbon on the new streetlight. Then they took the streetlight to Sahuayo for a second inauguration.',
  'If you want to see a regidor, stand by the Azul Portal with a plate of chilaquiles. They come to the smell.'
];
