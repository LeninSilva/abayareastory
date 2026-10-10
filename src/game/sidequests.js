// Side quests and jobs: the troubles of Jiquilpan's neighbours, and honest (and less honest) ways to earn a peso.
// A quest is a list of steps, like the main story: talk (with choices that can branch), any-of conversations,
// reach a place (some only at night), collect things scattered around, play a mini game, deliver against the clock,
// haul fragile cargo up the cerro road, carry heavy things one at a time, drive taxi fares, visit several places, or watch a few story cards.
import { PLACES } from '../geo.js';
import { CAST } from './cast.js';

const any3 = ['secretaria', 'alcalde', 'regMorena', 'regPan', 'regPri', 'regPrd', 'regMc'];
const complaint = id => (CAST[id].lines.complaint || ['I will look into it.'])[0];

export const QUESTS = [
  /* ---------- the eternal pothole: politics, Jiquilpan style ---------- */
  { id: 'bache', name: 'El bache eterno', giver: 'chole', offer: 'You look like you want to murder that pothole.',
    intro: 'Mijo, mija: this bache was born in 2017. My grandson learned to walk around it. Twice a taxi lost a wheel in it and once a regidor lost a shoe. I have complained to everyone. Will you complain too? Maybe they listen to young people. (They do not.)',
    steps: [
      { text: 'Complain about the bache to three people at the ayuntamiento: the Presidente, his secretary Lupita, or any regidor. (They are hard to find: check the Presidencia in office hours, the Azul Portal at breakfast, the atrio after Sunday Mass, the Jardín de la Paz on Saturdays, the Bosque at dawn.)',
        any: any3.map(id => ({ id, talk: id, label: 'Doña Chole\'s bache on Calle Morelos. When will it be fixed?', reply: () => complaint(id) })), need: 3 },
      { text: 'Go back to Doña Chole on Calle Morelos with the good news (there is none).', talk: 'chole', chips: [
        { label: 'I\'ll pay the albañiles myself. ($1,500)', tone: 'kind', cost: 1500, reply: 'You... you\'d do that? For an old woman\'s street? (She crosses herself, then crosses you.) God sees this. And so will the regidores, when they come to take the photo.', next: 'done', fx: { trait: { heart: 6, fame: 4 }, aff: { chole: 20 }, flag: 'bacheFixed' } },
        { label: 'Let\'s do a faena: the whole street fixes it together.', tone: 'brave', reply: '¡Eso! Like in my father\'s time. I\'ll ring the neighbours, you get Maestro Chuy to lend us a mixer. Meet me at the bache and bring your hands.', next: 2 },
        { label: 'Have you tried writing a very angry letter?', stay: true, reply: 'Forty-one letters. Lupita says they have their own drawer. The drawer has a name now.' }
      ] },
      { text: 'Mix the cement and fill the bache with the neighbours (at the bache on Calle Morelos).', mini: 'albanil', at: 'bache', label: 'Fill the bache with the neighbours', win: { trait: { heart: 4, fame: 8 }, aff: { chole: 25 }, flag: 'bacheFixed' } }
    ],
    reward: { money: 0, ach: 'hagalo', cards: ['The street turns out with buckets and shovels. Somebody brings a radio, somebody brings tamales.', 'By sunset the bache is a smooth grey patch with a heart drawn in it with a stick, and the initials of everyone on Calle Morelos.', 'The next morning three regidores and the Presidente arrive to take a photo in front of it. Doña Chole does not let them stand on it.'] } },

  /* ---------- the weeping in the panteón ---------- */
  { id: 'llorona', name: 'La Llorona del Panteón', giver: 'cirilo', offer: 'You look like you haven\'t slept, Don Cirilo.',
    intro: 'Three nights now, joven. Every night, after the bells of ten, somebody weeps among the graves. ¡Ay, mis hijos!... no, nobody says that, but it weeps like it would. I am seventy-eight. I am not going in there. You go in there.',
    avail: g => true,
    steps: [
      { text: 'After dark, follow the weeping among the graves of the Panteón Municipal (three places).', collect: { n: 3, at: 'panteon', r: 40, label: 'Listen: the weeping is coming from here', icon: 'wail', night: true } },
      { text: 'Who is weeping?', cards: ['Behind the tomb of the Familia Novoa, sitting on the step with a guitar he cannot play, is a young man in a palm hat, crying into his sleeve.', '"I\'m Nicolás. Nicolás Novoa. From the rancho on the road up the cerro." He wipes his face. "I come here because my great-grandfather is here, and he\'s the only Novoa who won\'t tell me to forget her."', '"Rocío. Rocío Salazar. Our families haven\'t spoken in thirty years. Over a cow, and a fence. A cow!" He looks at you. "You\'re the one who flies. Would you... talk to them? Nobody listens to me."'] }
    ],
    reward: { fame: 2, aff: { nicolas: 15 }, ach: 'llorona', start: 'feud' } },

  /* ---------- Novoa and Salazar ---------- */
  { id: 'feud', name: 'Los Novoa y los Salazar', giver: 'nicolas', offer: 'About Rocío…', hidden: true,
    intro: 'Rocío is up at the Rancho de los Salazar, higher on the cerro road. Her father, Don Eusebio, has a shotgun he calls "El Diálogo". Please. Go carefully.',
    steps: [
      { text: 'Find Rocío at the Rancho de los Salazar, up the stone road.', talk: 'rocio', chips: [
        { label: 'Nicolás Novoa sent me. He weeps in the panteón for you.', tone: 'honest', reply: '(She laughs and cries at once.) That idiot. That sweet idiot. Talk to my father. He respects people who don\'t waste his time. And don\'t mention the cow.', next: 1 }] },
      { text: 'Speak to Don Eusebio Salazar.', talk: 'eusebio', chips: [
        { label: 'Your daughter and Nicolás Novoa love each other. This feud has gone on long enough.', tone: 'honest', reply: '(He doesn\'t blink.) In 1994 the Novoas\' bull broke my fence, and my cow, La Pinta, the best milk on the cerro, walked off with their herd and never came back. Not a word. Not an apology. Not the bell she wore. You bring me her bell and an apology from Remedios Novoa, and then we talk.', next: 2 },
        { label: 'Don Eusebio, nobody even remembers what this feud is about.', tone: 'brave', reply: 'I remember. La Pinta. 1994. The Novoas\' bull, my fence, my cow gone with their herd. Bring me her bell, and an apology from Remedios Novoa. Then we talk.', next: 2, fx: { aff: { eusebio: -4 } } }] },
      { text: 'Speak to Doña Remedios at the Rancho de Novoa, lower down the road.', talk: 'remedios', chips: [
        { label: 'Don Eusebio wants an apology, for La Pinta, in 1994.', tone: 'honest', reply: 'An APOLOGY? His fence was rotten! His cow came to OUR herd because she preferred it! ...She died in 2003, old and fat and happy, in our pasture. (Quieter.) Her bell is up on the ridge, on the old oak where my husband hung it. We never gave it back. Pride. Go and get it. And tell Eusebio... tell him I\'m sorry. There. I said it. Don\'t make me say it twice.', next: 3 },
        { label: 'Don Eusebio already apologised to you. He\'s waiting for yours.', tone: 'lie', reply: '(Her eyebrows go up into her hair.) Eusebio Salazar. Apologised. ...Well. Then I\'m sorry too, for the cow, God rest her. Her bell is on the old oak on the ridge between our ranchos. Take it to him.', next: 3, fx: { aff: { remedios: 4 } } }] },
      { text: 'Find La Pinta\'s old bell on the oak on the ridge between the two ranchos.', collect: { n: 1, at: 'ranchoMid', r: 25, label: 'Take down the old cowbell', icon: 'bell' } },
      { text: 'Bring the bell and Doña Remedios\' apology to Don Eusebio.', talk: 'eusebio', chips: [
        { label: '(Give him the bell.) She says she\'s sorry. She said it once. She won\'t say it twice.', tone: 'kind', reply: '(He holds the bell as if it might break. He rings it once. Somewhere down the cerro a dog answers.) ...Thirty years. Ay, Remedios. (He clears his throat.) Tell the Novoa boy he can come to dinner. Sunday. Bring a hat; I want to see if he takes it off.', next: 'done' }] }
    ],
    reward: { money: 1500, trait: { heart: 8, fame: 6 }, aff: { nicolas: 25, rocio: 25, eusebio: 15, remedios: 15 }, ach: 'padrino',
      cards: ['Three Sundays later, the Capilla de San Francisco on top of the cerro is fuller than it has been since the 1950s.', 'Nicolás Novoa and Rocío Salazar are married under a ceiling of paper flags, with you standing beside them as their padrino de anillos. Don Eusebio and Doña Remedios sit on the same bench, not looking at each other, sharing a handkerchief.', 'After the wedding, the two ranchos give you a gift: an envelope, and the promise of a pig at every fiesta for the rest of your life.'] } },

  /* ---------- the lost cow ---------- */
  { id: 'vaca', name: 'La Güera se fue', giver: 'remedios', offer: 'Is everything all right, Doña Remedios?', avail: g => g.questDone('feud'),
    intro: 'La Güera, my best cow, a blonde with a bad temper, went up the cerro after the rain. She has a bell and an attitude. If you find her, she\'ll follow anyone who has a gaspacho, God knows why.',
    steps: [
      { text: 'Find La Güera somewhere on the cerro above the rancho. Listen for her bell.', collect: { n: 1, at: 'ranchoNovoa', r: 380, label: 'Coax La Güera home', icon: 'cow' } }
    ],
    reward: { money: 800, aff: { remedios: 15 }, trait: { heart: 2 }, ach: 'vaquero', cards: ['La Güera looks at you, looks at the view, sighs like an old aunt, and follows you all the way down to the rancho, stopping to eat every flower on the way.'] } },

  /* ---------- supplies up the stone road ---------- */
  { id: 'tiendita', name: 'La tiendita del cerro', giver: 'tona', offer: 'Your shelves look empty, Doña Toña.',
    intro: 'The pickup from Paredones broke its axle on the back road, and nobody else comes up. I need sugar, oil, candles, sodas, and eggs. Eggs, mijo. Up the stone path from town, the way the arrieros did it. Don Goyo at the Mercado de Artesanías has my order. Bring it gently.',
    steps: [
      { text: 'Pick up Doña Toña\'s order from Don Goyo at the Mercado de Artesanías.', talk: 'goyo', chips: [{ label: 'I\'m here for Doña Toña\'s order.', reply: 'Six boxes. One of eggs. If you break the eggs, she will know before you get there. She always knows.', next: 1 }] },
      { text: 'Carry the order up the stone path to San Francisco del Cerro, on foot or very carefully by jetpack. Gently: the eggs!', haul: { to: 'sanFrancisco', secs: 1200 } }
    ],
    reward: { money: 1200, aff: { tona: 25 }, trait: { heart: 3 }, ach: 'arriero', cards: ['Doña Toña counts the eggs. All of them. Twice. Then she hugs you so hard you understand why the eggs were afraid.'] } },

  /* ---------- Ferretería La Esperanza, by the Monumento ---------- */
  { id: 'esperanza', name: 'Ferretería La Esperanza', giver: 'luis', offer: '¿Qué hay que hacer, Tío Luis?',
    intro: '¡Ánimo, patrón! Look: the Rotoplas truck could not turn into our street, so the driver left four tinacos at the foot of the Monumento, next to the General, like offerings. Francisco has a bad back and I have seventy-two years. You have two shoulders. ¡Ánimo! One at a time.',
    steps: [
      { text: 'Carry the four tinacos from the Monumento a Lázaro Cárdenas to the door of Ferretería La Esperanza. One at a time, on your shoulder. No running, no cars.', carry: { n: 4, from: 'monumento', to: 'ferreLuis', lift: 'Lift a tinaco onto your shoulder', drop: 'Set the tinaco down by the door' } },
      { text: 'Tell Francisco the tinacos are in.', talk: 'francisco', chips: [
        { label: 'The tinacos are in. What\'s next?', tone: 'kind', reply: 'Four? All four? Tío Luis said you would, and I said nobody carries tinacos for free anymore. I owe him ten pesos. (He hands you a broom and points at a mountain of boxes.) Next: the shelves. Everything goes where a customer would look for it, not where my father put it.', next: 2 },
        { label: 'My back is broken. You owe me.', tone: 'funny', reply: 'Join the club. We meet on Tuesdays at the Cruz Roja. (He grins, which on his face takes a while.) Fine, I owe you. Now the shelves, please, before the boxes become furniture.', next: 2 }
      ] },
      { text: 'Stock the shelves of Ferretería La Esperanza: every product to its aisle.', mini: 'ferreteria', at: 'ferreLuis', label: 'Stock the shelves' },
      { text: 'Sweep the shop: the dust of twenty years, bent nails, a dead scorpion (Tío Luis swears it was already dead).', collect: { n: 5, at: 'ferreLuis', r: 6, label: 'Sweep it up', icon: 'broom' } },
      { text: 'Tell Tío Luis the shop is ready. How do you open it?', talk: 'luis', chips: [
        { label: 'A real inauguration: banda, cohetes, the whole street. ($800)', tone: 'kind', cost: 800, reply: '¡ESO, PATRÓN! ¡ÁNIMO! I will call my compadre with the tuba. And Doña Chole for the tamales. And the priest for the holy water, and the other priest in case the first one doesn\'t come.', next: 'done', fx: { trait: { fame: 6, heart: 2 }, aff: { luis: 10, francisco: 10 } } },
        { label: 'Invite the Presidente to cut the ribbon.', tone: 'funny', reply: 'El Globo? Ja! Patrón, he cuts every ribbon in Michoacán. He will come for the photo, eat four tortas, and promise us a parking space. ¡Ánimo! Maybe the parking space comes.', next: 'done', fx: { trait: { fame: 3 }, aff: { luis: 6 } } },
        { label: 'No fuss. Open the door and sell something.', tone: 'honest', reply: 'Like his father. Don Chencho opened at seven, every day, for thirty-four years, and never once made a speech. ¡Ánimo, patrón! You understood this street.', next: 'done', fx: { trait: { word: 3 }, aff: { francisco: 12, luis: 6 } } }
      ] }
    ],
    reward: { money: 900, aff: { luis: 20, francisco: 20 }, trait: { heart: 3 }, flag: 'esperanzaOpen', ach: 'esperanza', cards: ['At seven the next morning Francisco rolls up the steel curtain of Ferretería La Esperanza. It squeals like a pig. The street turns to look.', 'The first customer is a señora who needs one screw. Francisco sells her the screw, and Tío Luis gives her a free “¡Ánimo!” with it.', 'Above the counter there is a new photo next to the old one of Don Chencho: Francisco, Tío Luis, and you, all three dusty, next to four black tinacos. “Partners,” Tío Luis says. “Of the heart, patrón. The money partnership costs extra.”'] } },

  /* ---------- the milpa on the cerro: Francisco Salazar (the guitarist, not the ferretero) and Cecilia ---------- */
  { id: 'milpa', name: 'Elotes y una guitarra', giver: 'cecilia', offer: 'Can I help with the milpa, Doña Cecilia?', avail: g => g.state.ch >= 1 || g.state.ending,
    intro: 'The elotes are ready and the crows know it before we do. Cut six for me before the sun gets high, and mind the leaves, they cut back. Then go and ask Francisco to play. He will say no. Ask twice.',
    steps: [
      { text: 'Cut six elotes in the milpa beside Francisco and Cecilia\'s house, on the cerro above the Rancho de los Salazar.', collect: { n: 6, at: 'casaCecilia', r: 12, label: 'Cut an elote', icon: 'plant' } },
      { text: 'Ask Francisco Salazar to play something. (He played with Los Calis for years; the guitar on his back is the proof.)', talk: 'franciscoSalazar', chips: [
        { label: 'Cecilia says you are hiding from the guitar.', tone: 'funny', reply: 'Hiding? I am negotiating. (He swings the guitar round, tunes by ear, and plays four bars of something old that makes the corn lean in.) Tell Cecilia the elotes were a bribe, and a good one.', next: 'done', fx: { trait: { heart: 2 }, aff: { franciscoSalazar: 12, cecilia: 8 } } },
        { label: 'Please. Just one song, for the cerro.', tone: 'kind', reply: 'For the cerro, then. (He plays something slow, a bolero Los Calis used to close with, and doesn\'t look at you once. When he finishes he says: that one was for the elotes.)', next: 'done', fx: { trait: { heart: 3 }, aff: { franciscoSalazar: 15, cecilia: 8 } } },
        { label: 'Which song did Los Calis play best?', tone: 'honest', reply: 'Ah. A listener. Every wedding asked for the same three, and I played them badly on purpose, so they would ask for a fourth. (He plays the fourth.)', next: 'done', fx: { trait: { word: 2 }, aff: { franciscoSalazar: 12 } } }
      ] }
    ],
    reward: { money: 250, aff: { cecilia: 15 }, trait: { heart: 2 }, cards: ['Cecilia boils four of the elotes in the pot beside the muicle and gives you the first one on a stick, with lime and a little chile.', 'From the porch you can hear the guitar start again, softer now, the way a man plays when he thinks nobody is counting.'] } },

  /* ---------- Los Rinos de Jiquilpan ---------- */
  { id: 'rinos', name: 'La rodada de los Rinos', giver: 'chava', offer: 'Can I ride with the Rinos?',
    intro: 'With us? ¡Órale! But first the initiation. Every Rino has done it: the Bosque, then up past the Rancho de Novoa, then the stone path to the chapel of San Francisco, all before the peloton finishes the back road through Paredones. No bicycle up the stones: you run, you walk, you fly in that ridiculous jetpack, I don\'t care. Ready? ¡Rinos!',
    steps: [
      { text: 'Beat the peloton: El Bosque, the Rancho de Novoa, then the chapel of San Francisco del Cerro.', deliver: ['bosque', 'ranchoNovoa', 'sanFrancisco'], secs: 420, icon: '🚴', fail: 'the peloton reached the chapel first. Chava is very understanding about it, for a rhino. Ask him again.' },
      { text: 'Catch your breath with Chava and the Rinos at the top, by the chapel.', talk: 'chava', at: 'sanFrancisco', chips: [
        { label: 'That was nothing. Again?', tone: 'brave', reply: '(The whole peloton boos with love.) A Rino! A real one! Somebody give this one a jersey before they run back down.', next: 'done', fx: { trait: { fame: 4 } } },
        { label: 'I think I left a lung on the Rancho de Novoa.', tone: 'funny', reply: 'Don Eusebio will keep it for you. He keeps everything. ¡Bienvenido a los Rinos! The lung grows back. Mostly.', next: 'done', fx: { aff: { chava: 6 } } },
        { label: 'Thank you for letting me ride with you.', tone: 'kind', reply: 'You didn\'t ride, you ran up a mountain. That\'s worse. That\'s better. Here: the jersey. You charge uphill now.', next: 'done', fx: { trait: { heart: 2 } } }
      ] }
    ],
    reward: { money: 300, aff: { chava: 20 }, clothes: 'jerseyRinos', ach: 'rino', cards: ['At the chapel of San Francisco the Rinos pass around a thermos of coffee and a bag of conchas. The antenna blinks red above you. Below, the whole valley: Jiquilpan, Sahuayo, the shine of the lake.', 'Chava pulls a purple jersey out of the van. A white rhino charges across the chest. “Size: whatever. Lycra forgives.”'] } },

  /* ---------- the lotería on the Jardín ---------- */
  { id: 'loteria', name: 'La lotería del Jardín', giver: 'lencho', offer: '¿Hay lotería esta noche?', repeat: 6,
    intro: '¡Corre y se va corriendo! Fifty pesos a tabla, the frijolitos are free. First to fill a line shouts ¡Lotería! and takes the pot.',
    steps: [{ text: 'Play lotería with Don Lencho on the Jardín.', mini: 'loteria', at: 'here', label: 'Play lotería ($50)', cost: 50 }],
    reward: { } },

  /* ---------- penalties at the stadium ---------- */
  { id: 'penales', name: 'El penal del domingo', giver: 'chema', offer: 'Want to take a few penalties, Chema?', repeat: 2,
    intro: 'Five penalties. I\'m sixty-eight and I\'ll still stop three. If you score four, I\'ll give you the Deportivo\'s shirt off the wall of my shed.',
    steps: [{ text: 'Take five penalties against Chema at the Estadio 18 de Marzo.', mini: 'penales', at: 'estadio', label: 'Take the penalties' }],
    reward: { } },

  /* ---------- the General's route: history ---------- */
  { id: 'ruta', name: 'La ruta del General', giver: 'emeterio', offer: 'Teach me about the General, Don Emeterio.',
    intro: 'A student! Sit— no, stand: you have to walk this lesson. Go to five places: this house where he was born, his monument, the museum, the stadium\'s portada, and the Biblioteca where Orozco painted. Look at each one properly. Then come back, and I will examine you. I was a teacher for thirty-one years. I will be fair. Mostly.',
    steps: [
      { text: 'Visit the five places of the General\'s route: the Casa de Lázaro Cárdenas, the Monumento, the Museo, the portada of the stadium, and the Biblioteca Gabino Ortiz.', visit: ['casaLC', 'monumento', 'museo', 'portada', 'biblioteca'] },
      { text: 'Return to Don Emeterio for your examination.', mini: 'quiz', at: 'casaLC', label: 'Take Don Emeterio\'s examination' }
    ],
    reward: { money: 900, item: 'libro', trait: { fame: 6 }, aff: { emeterio: 20 }, ach: 'historiador' } },

  /* ---------- indigo with Doña Petra ---------- */
  { id: 'anil', name: 'El añil de Doña Petra', giver: 'petra', offer: 'Will you teach me to dye with añil?', avail: g => g.state.ch >= 5 || g.state.ending,
    intro: 'Hmph. Everyone wants to learn when it is too late. Fine. Bring me eight jiquilite plants from the slopes around my house; they have small leaves and a look of having secrets. Then we see if your hands are good for anything.',
    steps: [
      { text: 'Gather eight jiquilite plants on the slopes around Doña Petra\'s house.', collect: { n: 8, at: 'petra', r: 160, label: 'Pick the jiquilite', icon: 'plant' } },
      { text: 'Dye a rebozo with Doña Petra.', mini: 'anil', at: 'petra', label: 'Dip the cloth in the añil vat' }
    ],
    reward: { clothes: 'rebozoAnil', flag: 'anilRecipe', item: 'amuleto', aff: { petra: 25 }, trait: { heart: 2 }, ach: 'manosAzules',
      cards: ['The cloth comes out of the vat green as a lime. You think you ruined it. Then the air touches it and, while you watch, it turns blue, deeper and deeper, the blue of the town\'s name.', '"Jiquilpan," says Doña Petra, almost smiling. "Now you know why." She hands you the rebozo, and a little seed on a red thread. "For luck. You will need it, with those hands."'] } },

  /* ---------- a serenade ---------- */
  { id: 'serenata', name: 'Serenata', giver: 'socorro', offer: 'Madre, I need a mariachi. For someone.', avail: g => !!g.sweetheart(),
    intro: '(The nun\'s eyes twinkle.) A serenade. Like when I was a girl, before the convent. The mariachi who plays for our fiesta waits in front of the Santuario every evening; tell him Madre Socorro sent you and he will charge you only a little too much. Then go under their window after dark. Choose the song well. The song is everything.',
    steps: [
      { text: 'Hire the mariachi at the Santuario de Guadalupe ($1,200).', talk: 'reg8', chips: [{ label: 'Madre Socorro sent me. A serenade, tonight.', cost: 1200, reply: '¡A sus órdenes! Three songs, a trumpet that has played for presidents, and my cousin on the guitarrón. Lead the way, after dark.', next: 1 }] },
      { text: 'After dark, take the mariachi to your sweetheart.', serenade: true }
    ],
    reward: { } },

  /* ---------- the missing regidor ---------- */
  { id: 'regidor', name: 'El regidor perdido', giver: 'secretaria', offer: 'You look worried, Lupita.',
    intro: '(She lowers her voice.) Regidor Kevin has not come to a session in three weeks. His phone goes straight to a video of himself. The Presidente has not noticed. Nobody has noticed. I noticed because I sign the attendance sheet for him. Find him, please, before somebody asks.',
    steps: [
      { text: 'Find Regidor Kevin. People say he went "where the signal is best".', talk: 'regMc', at: 'cumbre', chips: [
        { label: 'Kevin! The town needs you. Lupita needs you. Come back down.', tone: 'kind', reply: '(He lowers his phone, which is on a stick.) Bro. Up here I have five bars and two thousand new followers. Down there I have a bache and a session about benches. ...But Lupita? Lupita asked? Okay. Okay. Fly me down. Slowly.', next: 1 },
        { label: 'Nobody even noticed you were gone.', tone: 'cruel', reply: '(He stares at his phone for a long time.) ...Okay. That hurts. That\'s... content, actually. Okay. I\'m coming down. I\'m going to make a video about it.', next: 1, fx: { aff: { regMc: -10 } } }] },
      { text: 'Bring Kevin back to Lupita at the Presidencia.', talk: 'secretaria', chips: [{ label: 'One regidor, slightly sunburnt.', reply: '(She stamps the attendance sheet with enormous satisfaction.) Present. Thank you. The cabildo has quorum for the first time since Easter. They will use it to approve a bench.', next: 'done' }] }
    ],
    reward: { money: 700, trait: { fame: 5 }, aff: { secretaria: 25, regMc: 10 }, ach: 'buscador' } },

  /* ---------- the nuns' sweets ---------- */
  { id: 'dulces', name: 'Los dulces de las monjas', giver: 'socorro', offer: 'Can I help with anything, Madre?',
    intro: 'The sisters made rompope and cocadas for the fiesta, and three baskets are promised: one for Padre Tomás, one for Tía Cuca on the Jardín, and one for the Presidente. Lupita will have to take that one; nobody has seen the man since Candelaria.',
    steps: [{ text: 'Deliver the nuns\' baskets to Padre Tomás, Tía Cuca, and Lupita at the Presidencia.',
      any: [{ id: 'padre', talk: 'padre', label: 'A basket from the nuns of Guadalupe, Padre.', reply: 'Rompope! Madre Socorro\'s rompope! Tell her she is forgiven for what she said about my sermon.' },
        { id: 'cuca', talk: 'cuca', label: 'Tía, a basket from the nuns.', reply: 'Cocadas! Ay, those nuns. They cook like sinners.' },
        { id: 'secretaria', talk: 'secretaria', label: 'A basket from the nuns, for the Presidente.', reply: 'I will see that he gets it. (She puts it under her desk.) He gets it in spirit.' }], need: 3 }],
    reward: { money: 300, item: 'veladora', trait: { heart: 4 }, aff: { socorro: 20, padre: 6, cuca: 6 } } },

  /* ---------- jobs ---------- */
  { id: 'gaspachos', name: 'Gaspachos a domicilio', giver: 'cuca', offer: 'Need any gaspachos delivered, Tía?', repeat: 8, job: true, avail: g => g.state.ch >= 1 || g.state.ending,
    intro: 'Four orders, criatura, and gaspachos don\'t wait: the cheese sweats, the mango cries. The Biblioteca, the Parroquia, the Presidencia and the Casa del General. Run, fly, whatever. Fast.',
    steps: [{ text: 'Deliver four gaspachos before they melt.', deliver: ['biblioteca', 'parroquia', 'presidencia', 'casaLC'], secs: 240 }],
    reward: { money: 350, aff: { cuca: 4 }, tip: true } },
  { id: 'taxi', name: 'Taxista', giver: 'refugio', offer: 'Do you need a driver, Don Refugio?', repeat: 0.5, job: true,
    intro: 'You have a licence? Don\'t tell me. Take the white Tsuru by the curb. Pick up who I tell you, take them where they say, don\'t kill them, don\'t take the long way. Twenty percent for the sitio.',
    steps: [{ text: 'Drive taxi fares from the sitio.', fare: true }],
    reward: { } },
  { id: 'mesero', name: 'Mesero en el Azul Portal', giver: 'julian', offer: 'Are you short a waiter tonight, Don Julián?', repeat: 4, job: true,
    intro: 'Short a waiter? I am short three. Apron. Notebook. Remember what they ask; tourists from Guadalajara change their order four times and blame you for each one.',
    steps: [{ text: 'Wait tables at the Azul Portal.', mini: 'mesero', at: 'azulPortal', label: 'Take the orders' }],
    reward: { } },
  { id: 'albanil', name: 'Echarle mano a la obra', giver: 'chuy', offer: 'Can I work on one of your sites, Maestro?', repeat: 4, job: true,
    intro: 'You? (He looks at your hands.) Hm. Block goes on block, mezcla in between, level always level. If the wall leans, it comes out of your pay.',
    steps: [{ text: 'Lay block for Maestro Chuy.', mini: 'albanil', at: 'ferreteria', label: 'Lay the block' }],
    reward: { } }
];
export const QUEST = Object.fromEntries(QUESTS.map(q => [q.id, q]));

/* deterministic scatter around a place */
function scatter(seed, n, cx, cz, r) {
  let a = seed * 9301 + 49297; const rnd = () => (a = (a * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: n }, () => { const ang = rnd() * Math.PI * 2, d = r * (0.35 + 0.65 * Math.sqrt(rnd())); return [cx + Math.cos(ang) * d, cz + Math.sin(ang) * d]; });
}

export class SideQuests {
  constructor(game) { this.g = game; this._pick = []; }
  get S() { return this.g.state.life.side; }
  q(id) { return this.S[id] || (this.S[id] = { st: -1, any: [], done: false, count: 0, got: [], cool: -1e9, data: {} }); }
  nowH() { const s = this.g.state; return (s.day - 1) * 24 + s.hour; }
  active() { return QUESTS.filter(Q => { const q = this.S[Q.id]; return q && q.st >= 0 && !q.done; }); }
  step(Q) { const q = this.S[Q.id]; return q && q.st >= 0 ? Q.steps[q.st] : null; }
  available(Q) {
    const q = this.S[Q.id];
    if (q && q.st >= 0 && !q.done) return false;
    if (q && q.done && !Q.repeat) return false;
    if (q && Q.repeat && this.nowH() - q.cool < Q.repeat) return false;
    if (Q.hidden && !(q && q.unlocked)) return false;
    return !Q.avail || Q.avail(this.g);
  }
  /* ---------- conversation ---------- */
  chipsFor(npc) {
    const g = this.g, out = [], id = npc.id;
    for (const Q of this.active()) {
      const st = this.step(Q), q = this.S[Q.id];
      if (st.talk === id && (!st.at || g.near(st.at, 80))) for (const c of st.chips) {
        if ((q.used || []).includes(c.label)) continue;
        const locked = c.cost && !g.life.afford(c.cost);
        out.push({ label: c.label + (c.cost ? ` ($${c.cost.toLocaleString('en-US')})` : ''), tone: c.tone, side: true, locked, lockedText: locked ? `You need $${c.cost.toLocaleString('en-US')}.` : '', run: () => this.pick(Q, c) });
      }
      if (st.any) for (const a of st.any) if (a.talk === id && !q.any.includes(a.id)) out.push({ label: a.label, side: true, run: () => {
        const r = typeof a.reply === 'function' ? a.reply() : a.reply; q.any.push(a.id); g.ui.logLine('me', a.label); g.ui.logLine('npc', r);
        g.ui.toast(`${Q.name}: ${q.any.length} of ${st.need}`, 'quest');
        if (q.any.length >= st.need) this.advance(Q); g.save(); return { reply: null };
      } });
    }
    for (const Q of QUESTS) if (Q.giver === id && this.available(Q)) out.push({ label: Q.offer, side: true, offer: true, run: () => this.offer(npc, Q) });
    return out;
  }
  offer(npc, Q) {
    const g = this.g; g.ui.logLine('me', Q.offer); g.ui.logLine('npc', Q.intro);
    g.ui.chips([{ label: Q.job ? 'I\'ll do it.' : 'I\'ll help.', kind: 'quest', tone: Q.job ? null : 'kind', onClick: () => { this.start(Q.id); g.ui.logLine('me', Q.job ? 'I\'ll do it.' : 'I\'ll help.'); if (!Q.job) g.life.trait('heart', 1, true); g.renderChips(); } },
      { label: 'Not now.', kind: 'back', onClick: () => { g.ui.logLine('me', 'Not now.'); g.renderChips(); } }]);
  }
  pick(Q, c) {
    const g = this.g, q = this.S[Q.id];
    if (c.cost && !g.life.spend(c.cost, Q.name)) return { reply: null };
    g.ui.logLine('me', c.label); g.ui.logLine('npc', c.reply);
    if (c.tone) g.applyTone(c.tone);
    if (c.fx) g.applyFx(c.fx);
    if (c.stay) { (q.used = q.used || []).push(c.label); g.renderChips(); return { reply: null }; }
    if (c.next === 'done') this.finish(Q); else if (typeof c.next === 'number') { q.st = c.next; q.any = []; q.got = []; this.started(Q); } else this.advance(Q);
    g.save(); g.renderChips(); return { reply: null };
  }
  start(id) {
    const Q = QUEST[id], q = this.q(id); q.st = 0; q.any = []; q.got = []; q.used = []; q.done = false; q.data = {}; q.unlocked = true;
    this.g.ui.toast((Q.job ? 'Job: ' : 'New quest: ') + Q.name, 'quest'); this.g.audio.chime(); this.started(Q); this.g.save();
  }
  started(Q) {
    const st = this.step(Q), q = this.S[Q.id], g = this.g; if (!st) return;
    if (st.cards) { g.ui.card(st.cards, () => this.advance(Q)); return; }
    if (st.deliver) q.data = { left: st.deliver.slice(), t: st.secs * (g.settings.chase === 'easy' ? 1.5 : 1) };
    if (st.haul) q.data = { t: st.haul.secs, cargo: 100 };
    if (st.carry) q.data = { holding: false };
    if (st.fare) g.taxiStart();
    if (st.collect) { const p = this.placeOf(st.collect.at), pts = scatter(Q.id.length * 31 + q.st * 7 + (q.count || 0), st.collect.n, p.x, p.z, st.collect.r); q.data.pts = pts.map(([x, z]) => g.findSpot(x, z)); }
    g.ui.toast(st.text, 'quest');
  }
  advance(Q) {
    const q = this.S[Q.id]; q.st++; q.any = []; q.got = []; q.used = [];
    if (q.st >= Q.steps.length) this.finish(Q); else this.started(Q);
    this.g.save();
  }
  finish(Q, result = {}) {
    const g = this.g, q = this.S[Q.id], R = Q.reward || {};
    q.done = true; q.st = -1; q.count = (q.count || 0) + 1; q.cool = this.nowH();
    const pay = (R.money || 0) + (result.money || 0);
    const after = () => {
      if (pay) g.life.earn(pay, Q.name);
      g.applyFx({ trait: R.trait, aff: R.aff, flag: R.flag, item: R.item, clothes: R.clothes });
      if (R.ach) g.unlock(R.ach);
      if (R.start) { this.q(R.start).unlocked = true; g.ui.toast('New quest: ' + QUEST[R.start].name + ' (talk to ' + g.npcName(QUEST[R.start].giver) + ')', 'quest'); }
      g.ui.toast((Q.job ? 'Done: ' : 'Quest complete: ') + Q.name, 'good'); g.audio.chime();
      g.life.s.stats.goals = QUESTS.filter(x => this.S[x.id] && this.S[x.id].count && !x.job).length;
      if (g.life.s.stats.goals >= 8) g.unlock('vecino');
      g.save(); g.onQuestDone(Q.id);
    };
    if (R.cards && q.count === 1) g.ui.card(R.cards, after); else after();
  }
  /** a timed step is over: the quest goes on to its next step, or ends here with the bonus */
  stepDone(Q, money) { const q = this.S[Q.id]; if (q.st + 1 >= Q.steps.length) this.finish(Q, { money }); else { if (money) this.g.life.earn(money, Q.name); this.advance(Q); } }
  fail(Q, why) { const g = this.g, q = this.S[Q.id]; q.st = -1; q.cool = this.nowH(); g.ui.toast(`${Q.name}: ${why}`, 'warn'); g.save(); }
  /* ---------- the world ---------- */
  placeOf(id) {
    if (id === 'ranchoMid') { const a = PLACES.ranchoNovoa, b = PLACES.ranchoSalazar; return { x: (a.x + b.x) / 2 + 60, z: (a.z + b.z) / 2 }; }
    if (id === 'here') { const p = this.g.player; return { x: p.x, z: p.z }; }
    return PLACES[id] || this.g.npcPos(id);
  }
  event(kind, arg) {
    if (kind === 'mini') {
      const { id: qid, win, money } = arg, Q = QUEST[qid]; if (!Q) return;
      const st = this.step(Q); if (!st) return;
      if (st.serenade) { const q = this.S[qid]; if (win) { q.who = q.data.who; this.g.life.affinity(q.data.who, 20); this.finish(Q); } else this.fail(Q, 'the window stayed shut. Hire the mariachi again another night.'); return; }
      if (!st.mini) return;
      if (win) { if (st.win) this.g.applyFx(st.win); if (this.S[qid].st + 1 >= Q.steps.length) this.finish(Q, { money }); else { if (money) this.g.life.earn(money, Q.name); this.advance(Q); } }
      else { if (money) this.g.life.earn(money, Q.name); if (Q.repeat != null) this.finish(Q); }
    }
  }
  /** what you can do right here: pick up, start a mini game */
  interactables() {
    const g = this.g, p = g.player, out = [];
    for (const Q of this.active()) {
      const st = this.step(Q), q = this.S[Q.id];
      if (st.collect && q.data.pts && (!st.collect.night || g.isNight())) q.data.pts.forEach(([x, y, z], k) => {
        if (q.got.includes(k) || Math.hypot(x - p.x, z - p.z) > 3.2) return;
        out.push({ x, z, label: st.collect.label, icon: st.collect.icon === 'cow' ? '🐄' : st.collect.icon === 'bell' ? '🔔' : st.collect.icon === 'plant' ? '🌿' : st.collect.icon === 'broom' ? '🧹' : '👂', run: () => {
          q.got.push(k); g.audio.chime(); g.ui.toast(`${Q.name}: ${q.got.length} of ${st.collect.n}`, 'quest');
          if (q.got.length >= st.collect.n) this.advance(Q); g.save();
        } });
      });
      if (st.carry && !g.vehicles.driving) {
        const F = this.placeOf(st.carry.from), T = this.placeOf(st.carry.to);
        if (!q.data.holding && Math.hypot(F.x - p.x, F.z - p.z) < (F.r || 10) + 6) out.push({ x: p.x, z: p.z, label: `${st.carry.lift} (${q.got.length + 1} of ${st.carry.n})`, icon: '🛢️', run: () => { q.data.holding = true; g.audio.ui(); g.ui.toast('Heavy! Walk, don\'t run.', 'quest'); g.save(); } });
        if (q.data.holding && Math.hypot(T.x - p.x, T.z - p.z) < (T.r || 8) + 6) out.push({ x: p.x, z: p.z, label: st.carry.drop, icon: '🛢️', run: () => {
          q.data.holding = false; q.got.push(q.got.length); g.audio.chime(); g.ui.toast(`${Q.name}: ${q.got.length} of ${st.carry.n}${q.got.length < st.carry.n ? ' · ¡Ánimo, patrón!' : ''}`, 'quest');
          if (q.got.length >= st.carry.n) this.advance(Q); g.save();
        } });
      }
      if (st.mini) { const at = st.at === 'here' ? null : this.placeOf(st.at), giver = g.npcs.find(n => n.id === Q.giver);
        const ok = st.at === 'here' ? giver && Math.hypot(giver.x - p.x, giver.z - p.z) < 6 : Math.hypot(at.x - p.x, at.z - p.z) < (PLACES[st.at] ? PLACES[st.at].r + 6 : 10);
        if (ok) out.push({ x: p.x, z: p.z, label: st.label, icon: '🎲', run: () => { if (st.cost && !g.life.spend(st.cost, Q.name)) return; g.minigame(st.mini, Q.id); } }); }
    }
    return out;
  }
  /** the gold dots: where active quests point */
  targets() {
    const g = this.g, out = [];
    for (const Q of this.active()) {
      const st = this.step(Q), q = this.S[Q.id];
      if (st.talk) out.push({ ...(st.at ? this.placeOf(st.at) : g.npcPos(st.talk)), q: Q });
      else if (st.any) for (const a of st.any) { if (!q.any.includes(a.id)) { const n = g.npcPos(a.talk); if (n) out.push({ ...n, q: Q }); } }
      else if (st.reach) out.push({ ...this.placeOf(st.reach), q: Q });
      else if (st.collect && q.data.pts) q.data.pts.forEach(([x, , z], k) => { if (!q.got.includes(k)) out.push({ x, z, q: Q, pick: true }); });
      else if (st.mini && st.at !== 'here') out.push({ ...this.placeOf(st.at), q: Q });
      else if (st.visit) for (const v of st.visit) { if (!q.got.includes(v)) out.push({ ...this.placeOf(v), q: Q }); }
      else if (st.deliver && q.data.left) { const v = q.data.left[0]; if (v) out.push({ ...this.placeOf(v), q: Q }); }
      else if (st.haul) out.push({ ...this.placeOf(st.haul.to), q: Q });
      else if (st.carry) out.push({ ...this.placeOf(q.data.holding ? st.carry.to : st.carry.from), q: Q });
      else if (st.serenade) { const sw = g.sweetheart(); if (sw) out.push({ ...g.npcPos(sw), q: Q }); }
      else if (st.fare && g.taxi && g.taxi.to) out.push({ x: g.taxi.to.x, z: g.taxi.to.z, q: Q });
      else if (st.fare && g.taxi && g.taxi.pick) out.push({ x: g.taxi.pick.x, z: g.taxi.pick.z, q: Q });
    }
    return out.filter(t => t && t.x != null);
  }
  pickups() { const out = []; for (const Q of this.active()) { const st = this.step(Q), q = this.S[Q.id]; if (st.collect && q.data.pts && (!st.collect.night || this.g.isNight())) q.data.pts.forEach(([x, y, z], k) => { if (!q.got.includes(k)) out.push({ x, y, z, icon: st.collect.icon }); }); } return out; }
  update(dt) {
    const g = this.g, p = g.player;
    for (const Q of this.active()) {
      const st = this.step(Q), q = this.S[Q.id];
      if (st.reach) { const P = this.placeOf(st.reach); if (Math.hypot(P.x - p.x, P.z - p.z) < (P.r || 20) + 6 && (!st.night || g.isNight())) this.advance(Q); }
      if (st.visit) for (const v of st.visit) { const P = this.placeOf(v); if (!q.got.includes(v) && Math.hypot(P.x - p.x, P.z - p.z) < (P.r || 20) + 8) { q.got.push(v); g.ui.toast(`${Q.name}: ${P.name.split(' (')[0]} (${q.got.length} of ${st.visit.length})`, 'quest'); if (q.got.length >= st.visit.length) this.advance(Q); } }
      if (st.deliver && q.data.left) {
        q.data.t -= dt; const v = q.data.left[0], P = this.placeOf(v);
        g.ui.raceInfo(`${st.icon || '🥭'} ${Q.name} · ${Math.max(0, Math.ceil(q.data.t))} s · ${q.data.left.length} left · next: ${P.name.split(' (')[0]}`);
        if (Math.hypot(P.x - p.x, P.z - p.z) < (P.r || 20) + 6) { q.data.left.shift(); g.audio.ui(); g.ui.toast('Delivered! ' + (q.data.left.length ? q.data.left.length + ' to go.' : ''), 'good'); }
        if (!q.data.left.length) { g.ui.raceInfo(null); this.stepDone(Q, Math.round(Math.max(0, q.data.t) * 2)); }
        else if (q.data.t <= 0) { g.ui.raceInfo(null); this.fail(Q, st.fail || 'the gaspachos melted. Tía Cuca forgives you. Barely.'); }
      }
      if (st.haul) {
        q.data.t -= dt; const P = this.placeOf(st.haul.to), car = g.vehicles.driving;
        if (car) { q.data.cargo -= dt * 15; }   // cars can't take the stone path: the boxes bounce in the back
        else if (p.jet) { if (p.speed > 22) q.data.cargo -= (p.speed - 22) * dt * 1.2; if (q.data.wasAir && p.onGround && q.data.vy < -7) q.data.cargo -= 12; }
        else if (p.speed > 6.5) q.data.cargo -= dt * 1.5;
        q.data.wasAir = !p.onGround; q.data.vy = p.vy || 0;
        g.ui.raceInfo(`🥚 Eggs intact: ${Math.max(0, Math.round(q.data.cargo))}% · ${Math.max(0, Math.ceil(q.data.t))} s · ${car ? 'no cars on the stone path!' : p.jet ? 'fly slow, land soft' : 'walk, don\'t run'}`);
        if (Math.hypot(P.x - p.x, P.z - p.z) < (P.r || 30) + 10) { g.ui.raceInfo(null); this.stepDone(Q, Math.round(q.data.cargo * 8)); }
        else if (q.data.cargo <= 0) { g.ui.raceInfo(null); this.fail(Q, 'the eggs are an omelette. Doña Toña will hear of this. Ask her again.'); }
        else if (q.data.t <= 0) { g.ui.raceInfo(null); this.fail(Q, 'too slow: the sodas are warm and the store is closed. Ask her again.'); }
      }
      if (st.carry && q.data.holding && (g.vehicles.driving || p.jet || p.speed > 7.5)) {
        q.data.holding = false; g.ui.toast(g.vehicles.driving || p.jet ? 'You put the tinaco down first. Tío Luis: “¡Ánimo! But not like that, patrón.”' : 'You ran and the tinaco rolled off your shoulder, all the way back to the Monumento. Walk, patrón!', 'warn'); g.save();
      }
      if (st.serenade && !q.data.playing) { const sw = g.sweetheart(), P = sw && g.npcPos(sw); if (P && g.isNight() && Math.hypot(P.x - p.x, P.z - p.z) < 10) { q.data.playing = true; q.data.who = sw; g.minigame('serenata', Q.id, sw); } }
    }
  }
  /* ---------- the journal ---------- */
  journal() {
    return QUESTS.map(Q => {
      const q = this.S[Q.id]; if (!q || (q.st < 0 && !q.done && !q.unlocked)) return null;
      return { Q, active: q.st >= 0 && !q.done, done: !!q.done && !Q.job, count: q.count || 0, step: this.step(Q) };
    }).filter(Boolean);
  }
}
