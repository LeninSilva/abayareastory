// AÑIL: a mystery in Jiquilpan de Juárez, Michoacán.
// The town, its landmarks and its history are real. Every character, the Manantiales company, the 1938 water title,
// Cuco's box and the Cueva del Añil are invented.

export { PLACES } from '../geo.js';

export const BRIEF = `AÑIL is a first-person mystery game set in present-day Jiquilpan de Juárez, Michoacán, Mexico: a Pueblo Mágico of about 35,000 people at 1,560 m in the Ciénega de Chapala, birthplace of President Lázaro Cárdenas (born 21 May 1895), whose Biblioteca Gabino Ortiz (a 19th-century former sanctuary) holds murals José Clemente Orozco painted in 1940. The Estadio 18 de Marzo is named for 18 March 1938, the day Cárdenas nationalized Mexico's oil; its portada carries his words: "Los recursos naturales del país deben servir para su propia prosperidad. Entregarlos a intereses extraños es traicionar la patria." The Cerro de San Francisco rises south of town.
THE STORY (invented): The player's grandfather, Don Aurelio Valdovinos, a retired PEMEX engineer and volunteer at the Biblioteca, vanished on the Cerro de San Francisco after calling the player to say "I found what Cuco hid." Cuco (Refugio Valdovinos, Aurelio's father) was a boy who mixed plaster for Orozco in 1940. A company, Manantiales del Cerro S.A., wants the town council (the cabildo) to grant it the springs on the cerro to bottle the water, while wells in town run low. Aurelio believed Cuco hid the town's 1938 title to the Ojo del Añil spring. The player follows the clues: the bronze door of the library, the parish archive, the stadium's portada, three witnesses, the museum, and the indigo cave on the cerro.`;

// shorthand for person specs
const P = o => o;

export const CHARACTERS = {
  cuca: {
    name: 'Tía Cuca', title: 'gaspachos and nieves, on the Jardín', place: 'jardin', offset: [14, -26],
    look: P({ skin: 0xb88763, hair: 0xb8b0a8, hairStyle: 'bun', top: 0xd84a6a, bottom: 0x2a2a30, dress: true, accessory: 'apron', height: 0.93, build: 1.1 }),
    voice: 'Warm, bossy, quick, funny; a street vendor who has seen everything from the same corner of the Jardín for forty years. Calls the player "mijo" or "mija" and "criatura". Feeds people when she is worried. Uses plenty of Spanish words (ándale, ay Dios, fíjate).',
    who: 'Refugio "Cuca" Valdovinos, 71, Aurelio\'s younger sister. Sells gaspachos (fruit cups with lime, chile and cheese) and nieves from a cart on the Jardín. Named after their father, Cuco.',
    knows: 'Family history: their father Cuco mixed plaster for Orozco in 1940 and never talked about it. Aurelio was obsessed lately, going to the library, the parish, the stadium. Everyone in town is arguing about the cabildo vote on Friday to give the cerro\'s springs to Manantiales del Cerro. Rosa\'s garage, the Comandante, the priest.',
    wants: 'Her brother home. For the player to eat something. She is frightened and hides it by scolding.',
    guide: ['casaAurelio', 'presidencia', 'taller'],
    greet: ['¡Ay, criatura! You came. Look at you, all bones. Sit, sit, have a gaspacho, then we talk.', 'There you are. Any news? No? Then eat. Worry works better on a full stomach.'],
    topics: {
      self: ['Me? Forty years on this corner, mijo. I sold nieves to your grandfather\'s whole bus of engineers in \'79. Ask me who married who and I\'ll tell you who regretted it.'],
      vane: ['Your abuelo was talking about our father every day this month. Cuco this, Cuco that. Cuco mixed Orozco\'s plaster when he was a boy, you know. Never said a word about it at dinner in sixty years.'],
      where: ['Go to his house first, in San Cayetano. Here, the key. Then the Presidencia. The Comandante will tell you nothing, but make him say it to your face.'],
      water: ['The Manantiales people want the springs on the cerro. They say jobs. My well is already half mud. You tell me.'],
      city: ['This is the Jardín. The kiosco, the laureles, the Parroquia there with its bells. Sunday nights the band plays and the old men pretend not to dance.']
    }
  },
  luna: {
    name: 'Comandante Rigoberto Luna', title: 'municipal police, the Presidencia', place: 'presidencia', offset: [6, -8],
    look: P({ skin: 0xa8765a, hair: 0x1a1410, top: 0x1e2a44, bottom: 0x1e2a44, hat: 'cap', hatColor: 0x1e2a44, build: 1.15, beard: true }),
    voice: 'Heavy, tired, evasive; speaks in official phrases ("the investigation is closed", "procedures") and changes the subject to football. Not cruel, but afraid of losing his job. Calls the player "joven".',
    who: 'Rigoberto Luna, 54, municipal police commander. Closed Aurelio\'s case in two days. Barragán is a friend of the mayor and has been "helping" the police with a new patrol truck.',
    knows: 'That the case is "closed": Aurelio went up the cerro alone and fell. He knows more than he says: a black pickup was seen on the trail road that night. The cabildo votes Friday at the Presidencia.',
    wants: 'Quiet until the vote passes. Secretly, to be braver than he is.',
    guide: ['casaAurelio', 'estadio', 'taller'],
    greet: ['Joven. I\'m sorry about your grandfather. The investigation is closed. There is nothing more to do but pray.', 'You again. What now?'],
    topics: {
      self: ['Twenty-six years in uniform. I have pulled drunks out of the malecón and cows off the highway. This town is quiet. I want it to stay quiet.'],
      vane: ['Don Aurelio was a good man and an old one. The cerro is steep. That\'s all.'],
      water: ['The Manantiales thing is for the cabildo, not the police. Friday. Everybody will shout, then they will vote.'],
      city: ['Did you see the stadium? The Deportivo plays Sundays. Terrible team. I never miss a game.']
    }
  },
  rosa: {
    name: 'Rosa Valdovinos', title: 'mechanic, Taller El Pistón', place: 'taller', offset: [3, -12],
    look: P({ skin: 0xc99a78, hair: 0x2a1d16, hairStyle: 'braid', top: 0x2a4a6a, bottom: 0x2a4a6a, accessory: 'bag', build: 1.0 }),
    voice: 'Fast, cheeky, practical, loves engines and hates injustice. Mixes Spanish and English, teases the player about city life in Guadalajara. Says "¡Órale!" and "no manches".',
    who: 'Rosa Valdovinos, 27, the player\'s cousin (Tía Cuca\'s granddaughter). Runs the Taller El Pistón on the east side of town, fixes everything, races her old sedan on the Sahuayo road at night.',
    knows: 'Aurelio came by twice to borrow a chisel and a tape measure; he was measuring the stadium\'s portada. Güero Mendoza drives a black pickup for Lic. Barragán. Cars, roads, shortcuts.',
    wants: 'To help, and to beat the player in a race.',
    guide: ['estadio', 'portada', 'biblioteca'],
    greet: ['¡Primo! ¡Prima! Look at you, the city kid. You need wheels? I have wheels.', '¡Órale! Back already. What broke?'],
    topics: {
      self: ['I fix what the dealership in Sahuayo says can\'t be fixed. Then I race it. Only on Tuesdays. And Fridays.'],
      vane: ['Abuelo was measuring the portada of the stadium with my tape. Twice. He said, "The General\'s words are hollow, Rosita." I thought he was being poetic.'],
      water: ['Güero Mendoza drives for Barragán, the Manantiales lawyer. Black pickup, no plates. He tried to buy my shop last month. I said no with a wrench.'],
      city: ['Take the Carretera toward Sahuayo if you want to feel the car breathe. In the centro, go slow: empedrado eats tires.']
    }
  },
  ines: {
    name: 'Maestra Inés Zepeda', title: 'historian, UNAM research centre', place: 'biblioteca', offset: [0, 18],
    look: P({ skin: 0xd8b48e, hair: 0x3a2a1a, hairStyle: 'long', top: 0x6a2f4a, bottom: 0x2a2a30, glasses: true, accessory: 'scarf', height: 0.97 }),
    voice: 'Precise, passionate, a little grand; lectures without meaning to; uses dates and names; warm when she talks about art. Guarded when anyone mentions the notebook.',
    who: 'Inés Zepeda, 46, historian at the UNAM\'s research centre in Jiquilpan (the Museo Vida y Obra de Lázaro Cárdenas). Expert on Orozco\'s 1940 murals in the Biblioteca Gabino Ortiz. SECRET: she took Aurelio\'s notebook from his house the day he vanished, to keep it from Barragán; then Barragán offered to fund a new museum wing in exchange for the title if she found it. She is ashamed and torn.',
    knows: 'Orozco painted the Biblioteca\'s murals in 1940-1942, including the "Alegoría de México"; the bronze door has 22 figures of the Americas; a boy called Cuco mixed plaster for Orozco. The parish archive keeps books from the 1940s. Cárdenas\' 1938 agrarian and oil decisions.',
    wants: 'To save history, and to be the one who saves it. If the player is kind to her when they find out, she will testify for the town; if they humiliate her, she will not.',
    guide: ['parroquia', 'museo', 'casaLC'],
    greet: ['You must be Aurelio\'s grandchild. You have his impatience; I can see it from here. I\'m Inés. I\'m so sorry.', 'Back to the murals? Orozco rewards people who look twice.'],
    topics: {
      self: ['I have spent eleven years with these walls. Orozco painted them between 1940 and 1942, in an old church the town had turned into a library. People think murals are loud. These whisper.'],
      vane: ['Your grandfather came every morning. He counted things: steps, figures on the door, the ribs of the vault. He said his father had left him a riddle.'],
      water: ['Barragán has been generous to the museum. That is all I will say about Barragán.'],
      city: ['Cárdenas was born here in 1895. Everything in this town is a conversation with him, even the stadium.']
    }
  },
  padre: {
    name: 'Padre Tomás Ávalos', title: 'priest, Parroquia de San Francisco', place: 'parroquia', offset: [-34, 4],
    look: P({ skin: 0xc99a78, hair: 0x6a6a6a, hairStyle: 'short', top: 0x141414, bottom: 0x141414, accessory: 'collar', glasses: true, build: 0.95 }),
    voice: 'Gentle, dry, bookish, a little evasive; quotes scripture and bad football statistics; honest when pressed. Calls the player "hijo" or "hija".',
    who: 'Tomás Ávalos, 63, parish priest of San Francisco. Keeps the parish archive of baptisms and marriages going back to the 1700s. Once sold a few old documents to pay for the roof and still regrets it.',
    knows: 'The archive\'s books; that a woman from the university asked for the 1940 book last week; the bells; the families of the town; Cuco Valdovinos was baptized here in 1926.',
    wants: 'To do right without making enemies before the vote. To be forgiven for the roof.',
    guide: ['biblioteca', 'portada', 'guadalupe'],
    greet: ['Hijo, hija, peace be with you. Your grandfather rang my bell more than the sacristan does.', 'Back again? The archive does not bite. Mostly.'],
    topics: {
      self: ['I keep the books and the bells. The bells are easier. They only ask to be rung.'],
      vane: ['Aurelio asked to see the book of 1940. So did the maestra from the university. Twice in one month, for a book nobody has opened since my predecessor.'],
      water: ['Water is life; the Gospel is clear on that. The cabildo is less clear on anything.'],
      city: ['The Parroquia is eighteenth-century. The tower has lost two bells and one sacristan to lightning. We kept the tower.']
    }
  },
  chema: {
    name: 'Chema Ochoa', title: 'groundskeeper, Estadio 18 de Marzo', place: 'portada', offset: [4, 8],
    look: P({ skin: 0x8a5a3c, hair: 0x2a2a2a, hairStyle: 'short', top: 0x2e7a3a, bottom: 0x3a3d44, hat: 'cap', hatColor: 0xffffff, build: 1.1 }),
    voice: 'Slow, proud, full of football stories; an old goalkeeper who remembers every save; suspicious of lawyers; loyal as a dog.',
    who: 'José María "Chema" Ochoa, 68, groundskeeper of the Estadio 18 de Marzo for 40 years, once goalkeeper for the town team. Aurelio\'s best friend since school.',
    knows: 'The portada\'s stones; that in the old days the townspeople helped build things with their hands; that Aurelio came with a chisel two weeks ago and tapped every stone in the right pylon until one rang hollow; he promised to keep quiet.',
    wants: 'Aurelio to walk through that gate again. To stop Barragán, whom he calls "el licenciado de zapatos brillantes".',
    guide: ['portada', 'museo', 'sendero'],
    greet: ['Aurelio\'s kid. Same nose. You play? No? Nobody plays anymore.', 'The grass doesn\'t cut itself, but I\'ll stop for you.'],
    topics: {
      self: ['Forty years with this grass. I stopped a penalty from a Chivas reserve in \'81. Ask anyone. Well, ask anyone old.'],
      vane: ['Aurelio and I were in school together. He was the smart one. I was the one who could catch.'],
      water: ['Barragán came to watch a game once. Wore white shoes to a football match. That tells you everything.'],
      city: ['Read the words on the portada. The General said them about oil. Now it\'s water. Same words work.']
    }
  },
  emeterio: {
    name: 'Don Emeterio', title: 'guide, Casa de Lázaro Cárdenas', place: 'casaLC', offset: [0, -14],
    look: P({ skin: 0xa8765a, hair: 0xd8d4cc, hairStyle: 'short', top: 0xe8e2d4, bottom: 0x4a4030, hat: 'wide', hatColor: 0xd8c8a0, accessory: 'cane', height: 0.94 }),
    voice: 'Courtly, slow, a storyteller who loves Cárdenas and the 1930s; tells history like gossip; sprinkles dates; never hurried.',
    who: 'Emeterio Sandoval, 84, retired schoolteacher, volunteer guide at the Casa de Lázaro Cárdenas. His father received ejido land in the 1930s.',
    knows: 'Real history: Cárdenas was born in Jiquilpan in 1895, president 1934-1940, redistributed land to ejidos, expropriated oil on 18 March 1938. (Invented:) A register of the town\'s 1938 grants was kept in Jiquilpan; the page for the Ojo del Añil spring was found cut out years ago.',
    wants: 'Someone to listen all the way to the end of a story.',
    guide: ['museo', 'monumento', 'portada'],
    greet: ['Welcome to the house of the General\'s town. Sit. History is better sitting down.', 'Ah, the young detective. Where were we? 1938.'],
    topics: {
      self: ['I taught history at the secundaria for thirty-one years. Now history teaches me. Mostly patience.'],
      vane: ['Aurelio sat where you are sitting, a month ago, and asked me about 1938 and water. I told him about the cut page.'],
      water: ['In the thirties the springs of the cerro fed the town and the fields. The General believed such things belong to the people who drink from them.'],
      city: ['The General was born here in 1895. The stadium, the library, the streets: this town has been answering him for a century.']
    }
  },
  petra: {
    name: 'Doña Petra Morfín', title: 'curandera, on the trail up the cerro', place: 'petra', offset: [0, -6],
    look: P({ skin: 0x8a5a3c, hair: 0xb8b8b8, hairStyle: 'braid', top: 0x2a3a78, bottom: 0x3a2a4a, dress: true, accessory: 'scarf', height: 0.9 }),
    voice: 'Terse, dry, knowing, speaks in sayings and questions; grows añil (indigo) and herbs; distrusts everyone from town; secretly kind.',
    who: 'Petra Morfín, 77, curandera (herbal healer) who lives alone on the trail up the Cerro de San Francisco and dyes cloth with indigo from the old recipe. SECRET: Aurelio is alive, hurt, hiding in the Cueva del Añil, and she has been bringing him food and splinting his leg. She will not tell the player until they carry Cuco\'s key.',
    knows: 'The cerro, its springs and the Ojo del Añil; the old indigo works; the name Jiquilpan means place of the jiquilite, the indigo plant; that a black pickup drives the trail road at night.',
    wants: 'To protect Aurelio and the spring. To be left alone.',
    guide: ['cueva', 'cumbre', 'sendero'],
    greet: ['Hmm. Another one from town. What do you want from an old woman and her plants?', 'You again. The cerro doesn\'t like people who come up twice without a reason.'],
    topics: {
      self: ['I heal what the clinic sends home. I dye cloth blue the old way, with jiquilite. That is where this town got its name, you know. Place of the indigo.'],
      vane: ['Aurelio? Many people walk this trail. Few walk it well.'],
      water: ['The spring above us is older than the town and will outlast the lawyer. If he lets it.'],
      city: ['Town is down there. I am up here. We are both happy with this arrangement.']
    }
  },
  barragan: {
    name: 'Lic. Octavio Barragán', title: 'lawyer, Manantiales del Cerro S.A.', place: 'toros', offset: [6, -4],
    look: P({ skin: 0xd8b48e, hair: 0x1a1410, hairStyle: 'short', top: 0xe8e8e8, bottom: 0x2a2a30, coat: 0x2a3040, glasses: false, build: 1.05 }),
    voice: 'Smooth, friendly, relentless; speaks like a salesman at a wedding; says "mi estimado" and "let\'s be practical"; never threatens directly; always offers.',
    who: 'Octavio Barragán, 49, lawyer and representative of Manantiales del Cerro S.A., a bottling company that wants the cabildo to grant it the cerro\'s springs. Güero Mendoza drives for him and does what he is not asked to do in writing.',
    knows: 'The cabildo votes Friday; the company\'s claim rests on the town having "no title" to the Ojo del Añil. He suspects a 1938 title exists and will pay to make it disappear. He believes Inés will deliver it to him for the museum wing.',
    wants: 'The vote. The title, bought or buried. To look reasonable while getting both.',
    guide: ['presidencia', 'museo'],
    greet: ['Mi estimado. I heard you were in town. Let me say first: my condolences. Let me say second: let\'s be practical.', 'Ah, the grandchild. Have you considered my offer?'],
    topics: {
      self: ['I am a man who brings jobs, joven. Two hundred of them. Bottles, trucks, a clinic. You have been to the clinic? It needs a roof.'],
      vane: ['Your grandfather was a romantic. Romantics are wonderful company and terrible at contracts.'],
      water: ['The springs run into the ground and are wasted. We would put them in bottles and pay the town. Where is the crime?'],
      city: ['Lovely town. Terrible roads. We would fix the roads.']
    }
  },
  aurelio: {
    name: 'Don Aurelio Valdovinos', title: 'your grandfather, in the Cueva del Añil', place: 'cueva', offset: [0, -3], hidden: true,
    look: P({ skin: 0xc99a78, hair: 0xe8e6e0, hairStyle: 'short', top: 0x6a5040, bottom: 0x3a3d44, glasses: true, beard: true, accessory: 'cane', height: 0.95 }),
    voice: 'Wry, tender, stubborn; an engineer who speaks in measurements and jokes; calls the player "mijo" or "mija"; proud of them and hiding his pain.',
    who: 'Aurelio Valdovinos, 79, retired PEMEX engineer, volunteer at the Biblioteca Gabino Ortiz, tinkerer (he built the jetpack in his garage). Son of Cuco. Güero Mendoza ran him off the trail road; he broke his leg and hid in the cave with Doña Petra\'s help.',
    knows: 'Everything the player has found: the door, the archive, the portada, the key, the cave. The box holds the 1938 title granting the Ojo del Añil spring to the town.',
    wants: 'The town to keep its water. To say he is sorry for scaring everyone. To see his grandchild fly the jetpack properly.',
    guide: ['presidencia'],
    greet: ['¡Mijo! ¡Mija! Look at you, you found me. Petra said you had my father\'s key. Come, come; mind the leg.'],
    topics: {
      self: ['Forty years making oil come out of the ground for the country. Now I want water to stay in it for the town. That\'s a nice symmetry, no?'],
      vane: ['My father was eleven when he mixed Orozco\'s plaster. He said the maestro never spoke, only painted, and once handed him a coin with paint on it.'],
      water: ['The title is in the box. Take it down. Friday, the cabildo. Read it out loud, where everyone can hear.']
    }
  },
  guero: {
    name: 'Güero Mendoza', title: 'Barragán\'s driver', place: 'toros', offset: [-8, 4], hidden: true,
    look: P({ skin: 0xd8b48e, hair: 0xd8b060, hairStyle: 'short', top: 0x1a1a1a, bottom: 0x2a2a30, hat: 'cap', hatColor: 0x1a1a1a, build: 1.25 }),
    voice: 'Blunt, mocking, few words.', who: 'Barragán\'s driver and fixer.', knows: 'He ran Aurelio off the road.', wants: 'The key and the box.',
    greet: ['Get lost.'], topics: {}
  }
};

/* Words the written voice listens for. */
export const TOPIC_WORDS = {
  vane: ['abuelo', 'grandfather', 'grandpa', 'aurelio', 'cuco', 'family', 'familia'],
  water: ['water', 'agua', 'spring', 'manantial', 'manantiales', 'vote', 'cabildo', 'barragán', 'barragan', 'company', 'well', 'pozo', 'güero', 'guero'],
  self: ['who are you', 'yourself', 'your name', 'about you', 'your life', 'quién eres', 'tu nombre'],
  where: ['where', 'go', 'next', 'dónde', 'donde', 'find', 'lost', 'way'],
  city: ['town', 'pueblo', 'jiquilpan', 'history', 'historia', 'street', 'here', 'cárdenas', 'cardenas', 'orozco', 'stadium', 'estadio', 'church', 'iglesia']
};
export const GENERIC = {
  default: ['Mm. Ask me something I know.', 'I\'d tell you if I knew, joven.', 'That\'s a question for the Virgin, not for me.', 'Hmm. Walk with me a minute and ask again.'],
  where: ['The map in your pocket knows more than I do. The gold diamond, no?']
};

// the people on the sidewalks, made as you meet them (see citizens.js); the voices look here too
export const EXTRAS = {};
