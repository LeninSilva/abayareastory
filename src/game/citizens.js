// The people on the streets of Jiquilpan. Every passer-by is someone: a name, an age, a job, a barrio, a way of
// talking, something they want and something they keep to themselves, and an opinion about Friday's vote on the
// springs. Made from a seed, so the same person is always the same person.
import { PLACES } from './story.js';

function rng(seed) { let a = seed | 0; a ^= 0x9e3779b9; a = Math.imul(a ^ (a >>> 16), 0x85ebca6b); a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35); a = (a ^ (a >>> 16)) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pickR = (r, a) => a[Math.floor(r() * a.length)];

const FIRST_F = ['María Guadalupe', 'Rocío', 'Leticia', 'Juana', 'Verónica', 'Yesenia', 'Araceli', 'Martha', 'Rosa Elena', 'Itzel', 'Karla', 'Guillermina', 'Esperanza', 'Brenda', 'Maricela', 'Ana Laura', 'Consuelo', 'Nayeli', 'Irma', 'Socorro', 'Fernanda', 'Lupita', 'Dolores', 'Xóchitl'];
const FIRST_M = ['José Luis', 'Juan Manuel', 'Ramiro', 'Jesús', 'Salvador', 'Rigoberto', 'Efraín', 'Octavio', 'J. Refugio', 'Rodolfo', 'Alfonso', 'Martín', 'Eduardo', 'Nicolás', 'Tomás', 'Isidro', 'Gerardo', 'Arturo', 'Benjamín', 'Cuauhtémoc', 'Brandon', 'Kevin', 'Emiliano', 'Heriberto'];
const LAST = ['Ochoa', 'Mendoza', 'Villaseñor', 'Zepeda', 'Sánchez', 'Barragán', 'Cárdenas', 'Magaña', 'Valencia', 'Godínez', 'Arteaga', 'Contreras', 'Pulido', 'Chávez', 'Gálvez', 'Del Río', 'Oregel', 'Aguilar', 'Ceja', 'Morfín', 'Anaya', 'Partida', 'Zamora', 'Bravo', 'Novoa', 'Larios', 'Cervantes', 'Verduzco'];

const HOODS = {
  'Centro': { jobs: ['nevero with a cart on the Jardín', 'waiter at a restaurant under the portales', 'shoe-shiner by the Presidencia', 'clerk at the pharmacy on the plaza', 'hotel receptionist', 'sacristan\'s helper at the Parroquia', 'lottery-ticket seller'],
    facts: ['the Jardín fills up Sunday nights when the band plays on the kiosco', 'the Parroquia de San Francisco is from the seventeen-hundreds', 'Orozco painted the Biblioteca in 1940', 'the General was born a few blocks from here, in 1895', 'the town became a Pueblo Mágico in 2012'] },
  'Barrio de San Cayetano': { jobs: ['tortillera at the corner tortillería', 'albañil (bricklayer)', 'owner of a tiendita (corner shop)', 'bicycle repairman', 'retired schoolteacher'],
    facts: ['San Cayetano has its own fiesta in August, with fireworks on a castillo', 'the streets up here are still empedrado, and your ankles know it', 'everybody on this block has a cousin in Chicago'] },
  'Barrio de Guadalupe': { jobs: ['mariachi who plays the Guadalupe fiesta', 'florist', 'taxi driver', 'seamstress'],
    facts: ['on the twelfth of December the whole barrio walks to the Santuario before dawn', 'the old Guadalupe sanctuary became the library; the Virgin moved house over here', 'the mañanitas at five in the morning are the loudest thing in town'] },
  'El Bosque': { jobs: ['football coach for the kids\' league', 'groundskeeper at the Parque Juárez', 'student at the CBTis', 'vendor of elotes by the stadium'],
    facts: ['under the old trees of the Parque Juárez it is always cooler', 'the Estadio 18 de Marzo is named for the day the General took back the oil', 'the Deportivo plays on Sundays and loses with dignity'] },
  'Salida a Morelia': { jobs: ['trucker who drives the highway to Morelia', 'mechanic', 'gas station attendant', 'tractor driver'],
    facts: ['the highway east goes to Zamora and on to Morelia', 'the bullring out here is named for Alberto Balderas', 'the feria fills this side of town with lights'] },
  'Rumbo a Sahuayo': { jobs: ['huarache maker who sells in Sahuayo', 'jornalero in the berry fields', 'construction worker', 'combi (minibus) driver'],
    facts: ['Sahuayo and Jiquilpan grew into each other like two trees', 'Lake Chapala is just over there, past the fields', 'the combis to Sahuayo leave every ten minutes, more or less, mostly less'] },
  'Cerro de San Francisco': { jobs: ['goatherd', 'charcoal maker', 'hiker from Guadalajara', 'man who repairs the relay mast on the summit'],
    facts: ['from the cross on the summit you can see Lake Chapala on a clear day', 'the springs up here feed half the wells in town', 'the rains came late this year and then all at once'] },
  'La Paz': { jobs: ['cheesemaker at the cremería', 'taquero by the Jardín de la Paz', 'retired nurse who walks the jardín every morning', 'kindergarten teacher', 'mechanic\'s wife who runs a papelería'],
    facts: ['the Jardín de la Paz is the quiet one; the big jardín is for showing off, this one is for sitting', 'the cremería has the best cotija this side of the sierra', 'Avenida Fajardo carries everyone north out of town toward the Santuario and the panteón'] },
  'El Panteón': { jobs: ['gravestone carver', 'flower seller by the panteón gate', 'gravedigger', 'woman who keeps her husband\'s grave spotless'],
    facts: ['on the Día de Muertos the whole panteón glows with candles and cempasúchil all night', 'Don Cirilo has watched the panteón for thirty years and swears it is quieter than the Jardín', 'the oldest graves have names nobody in town carries anymore'] },
  'San Francisco del Cerro': { jobs: ['goatherd', 'woman who sells sodas at the tiendita', 'man who looks after the capilla', 'antenna technician'],
    facts: ['up here there are seven houses, two stores, one chapel and one antenna; everyone knows which is which', 'one or two cars a day come up the stone road; you can hear them coming for ten minutes', 'from the capilla you can see the whole Ciénega and, on a clear day, Lake Chapala'] },
  'Poniente': { jobs: ['carpenter', 'baker at a panadería', 'nurse at the ISSSTE clinic', 'music teacher'], facts: ['the pan dulce on this side of town is better, and I will fight you', 'the river channel runs through here; they call its banks the malecón'] },
  'Oriente': { jobs: ['vet', 'butcher at the mercado', 'mototaxi driver', 'agronomist'], facts: ['the mercado sells everything, including things you didn\'t know you needed', 'Rosa\'s taller on this side fixes anything with an engine'] }
};
const JOBS = ['returned bracero who worked twenty years in California', 'avocado picker', 'secretary at the Presidencia', 'student at the UNAM centre', 'dentist', 'banda musician (tuba)', 'retired PEMEX worker', 'Oxxo cashier', 'woman who sells tamales at dawn', 'carnitas cook', 'barber', 'tailor'];

export const TEMPERS = ['warm', 'suspicious', 'dry', 'parental', 'pious', 'teen', 'elder', 'political', 'shy'];
const VOICES = [
  { v: 'Chatty and warm; every answer becomes a story about a compadre or a cousin in Chicago.', greet: ['¡Buenas! You\'re Aurelio\'s grandchild, no? The whole town knows. Small town, big mouths.', '¡Quiúbole! You look lost. Everybody\'s lost on the empedrado the first day.'] },
  { v: 'Suspicious and clipped; answers with questions until trusted; hates gossip and gossips anyway.', greet: ['¿Y usted? Who are you asking for?', 'Mm. Another one asking questions.'] },
  { v: 'Dry, deadpan, very funny without smiling.', greet: ['Buenas tardes. Hot, eh? It\'s always hot. Except when it rains. Then it\'s wet.', 'Hello. I\'m not selling anything. That\'s rare here.'] },
  { v: 'Motherly or fatherly; asks if the player has eaten; scolds gently; calls them mijo or mija.', greet: ['Mijo, mija, have you eaten? You look like you haven\'t eaten since Guadalajara.', 'Ay, pobrecito, the grandchild. Come here, let me look at you.'] },
  { v: 'Pious and gentle; mentions the saints and the Virgin; worries for everyone.', greet: ['Buenas, que Dios le bendiga. I\'m praying for your grandfather every night.', 'Buenas. The Virgin sees everything, even up the cerro.'] },
  { v: 'A teenager: fast, slangy, glued to their phone, secretly sweet.', greet: ['Wey, are you the one from Guadalajara? Is it true you have a jetpack?', 'Hey. Can I take a selfie with you? For my cousin. She doesn\'t believe me.'] },
  { v: 'An old man of few words and many proverbs (dichos).', greet: ['El que busca, encuentra. Good afternoon.', 'Buenas. Slow roads get to the same place.'] },
  { v: 'Political and fiery about the water vote; argues with everyone; sincere.', greet: ['Are you for the Manantiales people or against them? Choose, because Friday we vote.', 'Buenas. Have you signed the petition? About the springs? No? Here.'] },
  { v: 'Shy and polite; speaks softly, notices small details (birds, light, smells).', greet: ['Oh, buenas. Sorry. The jacarandas are dropping everywhere, did you notice?', 'Buenas... the bells will ring soon. I like to count them.'] }
];
const WANTS = ['for their son in Chicago to come home for the feria', 'enough water in the well to wash on Mondays', 'to open a little restaurant on the Jardín', 'the Deportivo to win one game this year', 'to finish the second floor of the house (the rebar has been waiting six years)', 'to retire to a house with a view of the cerro', 'to find out who keeps stealing the geraniums from their doorstep', 'for the cabildo to vote no on Friday', 'a good job that isn\'t in the berry fields', 'to learn English properly, for the grandchildren in Texas'];
const SECRETS = ['They signed Barragán\'s petition for the company because he promised their nephew a job, and they are ashamed.', 'They saw a black pickup on the trail road the night Aurelio vanished and told no one.', 'They sell the pan dulce from the bakery across town and say it\'s their own.', 'They have never been to the top of the cerro, though they tell everyone they have.', 'They are saving money in a tin to go north, and have not told their wife.', 'They know the Comandante\'s patrol truck was a "gift" from the company.', 'They were in love with Aurelio in 1965. He never knew.'];
const STANCES = [
  { k: 'against', lines: ['Give our springs to a bottling company? Over my dead body. My grandmother drank from the Ojo del Añil.', 'The General said it on the portada: the resources are ours. Read it. Then vote no.'] },
  { k: 'for', lines: ['Two hundred jobs, joven. My son works in the berries for nothing. I\'d rather he put water in bottles here than lettuce in boxes in Oregon.', 'The springs run into the ground and nobody uses them. At least the company would pay.'] },
  { k: 'unsure', lines: ['I don\'t know. Jobs are good. Water is good. I want both. Nobody offers both.', 'Ask me Friday. By Friday somebody will have convinced me of something.'] },
  { k: 'scared', lines: ['I don\'t talk about the vote. The lawyer\'s driver has a black pickup and a long memory.', 'Shh. Not here. Too many ears around the Jardín.'] }
];
const LOOKS = { skin: [0xe0b894, 0xd8b48e, 0xc99a78, 0xb88763, 0xa8765a, 0x8a5a3c, 0x6e4630], hairYoung: [0x1a1410, 0x2a1d16, 0x3a2a1a, 0x101010, 0x4a3020], hairOld: [0xb8b8b8, 0xd8d4cc, 0x8a8680], tops: [0xe8e2d4, 0x2a4a6a, 0xc02820, 0x2e7a3a, 0xf0c830, 0x6a2f4a, 0x1e2a44, 0xd86a2a, 0x8ab8d8, 0xffffff, 0x3a3a3a], bottoms: [0x2a3a5a, 0x2a2a30, 0x4a4030, 0x3a4a6a], coats: [0x4a3a2a, 0x2a3040, 0x6a5040] };

let counter = 0;
export function makeCitizen(seed, district, opts = {}) {
  const r = rng(seed);
  const hood = HOODS[district] || HOODS.Centro, fem = r() < 0.5;
  const first = pickR(r, fem ? FIRST_F : FIRST_M), last = pickR(r, LAST), last2 = pickR(r, LAST);
  const name = `${first} ${last}`;
  const age = opts.age || Math.round(15 + Math.pow(r(), 1.25) * 70);
  const job = opts.job || (r() < 0.6 ? pickR(r, hood.jobs) : pickR(r, JOBS));
  const vi = Math.floor(r() * VOICES.length), temper = VOICES[vi], want = pickR(r, WANTS), secret = pickR(r, SECRETS), stance = STANCES[Math.floor(r() * STANCES.length)];
  const fact1 = pickR(r, hood.facts), fact2 = pickR(r, hood.facts.filter(f => f !== fact1).concat(HOODS.Centro.facts));
  const place = district || 'Jiquilpan', pro = fem ? ['she', 'her'] : ['he', 'his'], Pro = pro[0][0].toUpperCase() + pro[0].slice(1);
  const tag = opts.tag || `the ${job.split(/ (on|at|in|for|who|from|by|with|to|of) | \(/)[0]}`;
  const look = {
    skin: pickR(r, LOOKS.skin), hair: age > 58 ? pickR(r, LOOKS.hairOld) : pickR(r, LOOKS.hairYoung),
    hairStyle: age > 68 && !fem && r() < 0.4 ? 'bald' : fem ? pickR(r, ['long', 'bun', 'braid', 'long', 'short']) : pickR(r, ['short', 'short', 'short', 'long']),
    top: pickR(r, LOOKS.tops), bottom: pickR(r, LOOKS.bottoms), coat: r() < 0.15 ? pickR(r, LOOKS.coats) : false,
    hat: !fem && r() < 0.3 ? pickR(r, ['wide', 'cap', 'wide']) : r() < 0.1 ? 'cap' : 'none', hatColor: pickR(r, [0xd8c8a0, 0xe8e2d4, 0x2a2a2a, 0x8a6a3a]),
    glasses: r() < 0.2, beard: !fem && r() < 0.25, dress: fem && r() < 0.35,
    accessory: /tortill|cook|baker|butcher|carnitas|tamales|nevero|elotes/.test(job) ? 'apron' : r() < 0.2 ? pickR(r, ['bag', 'scarf']) : age > 75 && r() < 0.4 ? 'cane' : undefined,
    height: (fem ? 0.92 : 0.98) * (0.94 + r() * 0.1) * (age > 72 ? 0.96 : 1), build: 0.92 + r() * 0.25
  };
  const def = {
    name, title: `${job}, ${place}`, tag, ambient: true, look, age, fem, adult: age >= 18, temper: TEMPERS[vi], seed, district,
    voice: temper.v,
    who: `${name} ${last2}, ${age}, ${job}. Lives in ${place}, Jiquilpan, ${r() < 0.7 ? 'born and raised here' : 'came back after years working in the United States'}. A stranger on the street with a whole life of ${pro[1]} own. SECRET (only if the player earns trust): ${secret}`,
    knows: `${place}: ${fact1}; ${fact2}. On Friday's cabildo vote to give the cerro's springs to Manantiales del Cerro: ${Pro} is ${stance.k === 'for' ? 'for it, for the jobs' : stance.k === 'against' ? 'against it, fiercely' : stance.k === 'scared' ? 'afraid to say, because of Barragán\'s driver' : 'undecided'}. Knows Aurelio Valdovinos vanished on the cerro, only by rumor.`,
    wants: `${want[0].toUpperCase() + want.slice(1)}.`,
    guide: [pickR(r, ['jardin', 'biblioteca', 'portada', 'bosque', 'casaLC'])],
    greet: temper.greet,
    topics: {
      self: [`${first}, para servirle. I\'m a ${job}. ${Pro === 'She' ? 'I' : 'I'}\'ve lived in ${place} all my life, or near enough.`, `What I want? ${want[0].toUpperCase() + want.slice(1).replace(/their/g, 'my').replace(/\bthey\b/g, 'I')}. Is that too much?`],
      city: [`You know ${fact1}? Now you do.`, `Here's one: ${fact2}.`],
      water: stance.lines,
      vane: ['Don Aurelio? A good man. Always asking questions. Like you.', 'They say he went up the cerro and fell. They say a lot of things.'],
      where: [`Go see ${PLACES[pickR(r, ['biblioteca', 'portada', 'jardin'])].name}. Everybody ends up there.`]
    }
  };
  def.id = opts.id || `cit${++counter}_${seed >>> 0}`;
  return def;
}

/* Regulars: always at the same spot. */
export const REGULARS = [
  { at: 'jardin', dx: -20, dz: 20, district: 'Centro', job: 'shoe-shiner under the laureles of the Jardín', tag: 'the shoe-shiner', seed: 11, age: 66 },
  { at: 'jardin', dx: 22, dz: 18, district: 'Centro', job: 'balloon seller on the Jardín', tag: 'the balloon seller', seed: 23 },
  { at: 'plazaSur', dx: 10, dz: -12, district: 'Centro', job: 'retired teacher who feeds the pigeons at the Plaza Aguadora', tag: 'the man with the pigeons', seed: 37, age: 81 },
  { at: 'parroquia', dx: -48, dz: 10, district: 'Centro', job: 'woman who sells candles and holy cards at the atrio', tag: 'the candle seller', seed: 41, age: 72 },
  { at: 'biblioteca', dx: -8, dz: 22, district: 'Centro', job: 'student reading on the steps of the Biblioteca', tag: 'the student', seed: 53, age: 19 },
  { at: 'portada', dx: -10, dz: -6, district: 'El Bosque', job: 'elote vendor at the stadium gate', tag: 'the elote vendor', seed: 67 },
  { at: 'feria', dx: 0, dz: 20, district: 'El Bosque', job: 'kid practising penalty kicks by the Plaza de la Feria', tag: 'the kid with the ball', seed: 71, age: 12 },
  { at: 'monumento', dx: 8, dz: 6, district: 'Barrio de San Cayetano', job: 'old man who keeps the monument clean', tag: 'the old man with the broom', seed: 83, age: 79 },
  { at: 'guadalupe', dx: 12, dz: -30, district: 'Barrio de Guadalupe', job: 'mariachi trumpet player waiting for a job', tag: 'the mariachi', seed: 97 },
  { at: 'cayetano', dx: -12, dz: -24, district: 'Barrio de San Cayetano', job: 'woman selling tamales at dawn and atole all day', tag: 'the tamalera', seed: 101 },
  { at: 'bosque', dx: -70, dz: -130, district: 'El Bosque', job: 'couple arguing under the trees (only one of them talks)', tag: 'the arguing lover', seed: 113 },
  { at: 'toros', dx: -14, dz: -40, district: 'Salida a Morelia', job: 'old ring hand at the bullring', tag: 'the ring hand', seed: 127, age: 74 },
  { at: 'sendero', dx: 6, dz: 4, district: 'Cerro de San Francisco', job: 'goatherd who knows every path on the cerro', tag: 'the goatherd', seed: 131, age: 63 },
  { at: 'cumbre', dx: 14, dz: -6, district: 'Cerro de San Francisco', job: 'technician who repairs the relay mast on the summit', tag: 'the mast technician', seed: 139 },
  { at: 'taller', dx: 10, dz: -6, district: 'Oriente', job: 'Rosa\'s apprentice, covered in grease', tag: 'the apprentice', seed: 149, age: 17 },
  { at: 'presidencia', dx: -16, dz: -12, district: 'Centro', job: 'woman collecting signatures against the water concession', tag: 'the petitioner', seed: 157 }
];
