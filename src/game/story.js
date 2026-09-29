// UNDERTOW: the people of the city, where they stand, how they talk, and what they know.
// Everyone here has their own reasons. Most of them are dead. Some of them know it.

// Named places (real streets and buildings; the hotel, the house and Remnant are invented).
export const PLACES = {
  ferry: { name: 'Ferry Building', lat: 37.79530, lon: -122.39450 },
  esperanza: { name: 'Hotel Esperanza, Valencia Street', lat: 37.76500, lon: -122.42140 },
  remnant: { name: 'Remnant, 2nd Street by South Park', lat: 37.78235, lon: -122.39270 },
  southpark: { name: 'South Park', lat: 37.78150, lon: -122.39380 },
  lonemountain: { name: 'Lone Mountain', lat: 37.77920, lon: -122.45300 },
  huntington: { name: 'Huntington Park, Nob Hill', lat: 37.79205, lon: -122.41245 },
  vanehouse: { name: 'The Vane House, Broadway', lat: 37.79440, lon: -122.44300 },
  sutrobaths: { name: 'Sutro Baths ruins', lat: 37.78030, lon: -122.51300 },
  missiondolores: { name: 'Mission Dolores', lat: 37.76430, lon: -122.42660 },
  stignatius: { name: 'St. Ignatius Church', lat: 37.77625, lon: -122.45160 },
  usf: { name: 'University of San Francisco, Lone Mountain campus', lat: 37.77830, lon: -122.45020 },
  twinpeaks: { name: 'Twin Peaks', lat: 37.75440, lon: -122.44740 },
  tinhow: { name: 'Waverly Place, Chinatown', lat: 37.79410, lon: -122.40680 },
  portsmouth: { name: 'Portsmouth Square', lat: 37.79480, lon: -122.40560 },
  dragongate: { name: 'Dragon Gate, Grant Avenue', lat: 37.79060, lon: -122.40580 },
  citylights: { name: 'City Lights, Columbus Avenue', lat: 37.79750, lon: -122.40630 },
  washsq: { name: 'Washington Square', lat: 37.80080, lon: -122.41000 },
  coit: { name: 'Coit Tower', lat: 37.80220, lon: -122.40620 },
  jackson: { name: 'Jackson Square (the old Barbary Coast)', lat: 37.79690, lon: -122.40230 },
  library: { name: 'Main Library, Larkin Street', lat: 37.77920, lon: -122.41640 },
  warmemorial: { name: 'War Memorial Veterans Building', lat: 37.77980, lon: -122.42050 },
  unplaza: { name: 'UN Plaza', lat: 37.78010, lon: -122.41390 },
  cityhall: { name: 'City Hall', lat: 37.77920, lon: -122.41820 },
  balmy: { name: 'Balmy Alley, the Mission', lat: 37.75160, lon: -122.41250 },
  excelsior: { name: 'Mission & Excelsior, the Excelsior', lat: 37.72560, lon: -122.43390 },
  sfsu: { name: 'San Francisco State, the Quad', lat: 37.72370, lon: -122.47850 },
  parkmerced: { name: 'Parkmerced', lat: 37.71900, lon: -122.48300 },
  oceanbeach: { name: 'Ocean Beach at Judah', lat: 37.76050, lon: -122.50950 },
  salesforce: { name: 'Salesforce Transit Center', lat: 37.78950, lon: -122.39610 },
  pier7: { name: 'Pier 7, the Embarcadero', lat: 37.79950, lon: -122.39720 },
  gunnybags: { name: 'Front & Sacramento (Fort Gunnybags)', lat: 37.79400, lon: -122.39930 },
  cablebarn: { name: 'Cable Car Barn', lat: 37.79445, lon: -122.41130 },
  fortpoint: { name: 'Fort Point', lat: 37.81040, lon: -122.47680 },
  legion: { name: 'Legion of Honor', lat: 37.78480, lon: -122.50000 },
  castro: { name: 'Castro Theatre', lat: 37.76220, lon: -122.43490 },
  paintedladies: { name: 'Alamo Square', lat: 37.77640, lon: -122.43420 },
  goldengate: { name: 'Golden Gate Bridge', lat: 37.81500, lon: -122.47790 },
  palacefa: { name: 'Palace of Fine Arts', lat: 37.80200, lon: -122.44850 },
  bernal: { name: 'Bernal Heights', lat: 37.74300, lon: -122.41450 },
  davidson: { name: 'Mount Davidson', lat: 37.73840, lon: -122.45450 }
};

// shorthand for person specs
const P = (o) => o;

/* Each character: where they stand, what they look like, how they talk (for the live voice),
   and what they say when the live voice is off (topics, matched by keywords). */
export const CHARACTERS = {
  bautista: {
    name: 'Bautista', title: 'pedicab driver, Ferry Building', place: 'ferry', dead: true,
    look: P({ skin: 0xa8765a, hair: 0x1a1410, top: 0xc84a2e, bottom: 0x2e3440, hat: 'cap', hatColor: 0x1e3a5f, build: 1.05 }),
    voice: 'Warm, fast, funny, a hustler with a big heart. Talks in Spanglish now and then, calls people "primo". Tells stories that go sideways. Hides his sadness in jokes.',
    who: 'Bautista Vane, 34, runs a pedicab along the Embarcadero. Hollis Vane\'s other son, by a woman who cleaned the Remnant offices. Hollis never acknowledged him. He drowned in 2019, riding the Embarcadero in fog so thick he went off the edge by Pier 14. He half-knows he is dead and refuses to think about it.',
    knows: 'The waterfront, the ferries, the fog; that Edie at the Hotel Esperanza will take in anyone; that Hollis is "everywhere and nowhere"; the Embarcadero freeway came down after 1989 and the city got its waterfront back; that the Hollows come out at night on the piers.',
    wants: 'For somebody, anybody, to say his name the way family says it. He will not say he is the player\'s half-brother until the player has come back to him a few times or asks directly about his last name.',
    guide: ['esperanza', 'pier7', 'jackson'],
    greet: ['¡Ey! Last ferry just came in and look what it brought. You need a ride, primo? The city\'s all hills and I\'m all legs.', 'Back again! Nobody comes back to me twice unless they like the company. Or they\'re lost. Which is it?'],
    topics: {
      vane: ['Hollis Vane? Ha. Everybody in this town owes Hollis something. Rent, a job, a funeral. Go to the Esperanza on Valencia, ask Edie. She\'ll tell you more than I will, and she\'ll feed you.', 'He\'s the guy whose name is on everything and whose face is on nothing. I saw him once. He looked right through me. Some people are good at that.'],
      mother: ['Your mother sent you? Then she believed in something. That\'s more than most people can say around here.'],
      self: ['Me? Bautista. I pedal tourists from the Ferry Building to Fisherman\'s Wharf and back and I tell them lies about sea lions. It\'s honest work.', 'My last name? ...It\'s Vane, okay? Same as yours. Same as his. My mother cleaned his offices at night. Don\'t make a thing out of it.'],
      dead: ['Dead? Nah. Nah nah nah. I\'m just... tired. The fog gets in you. Ask me something else.'],
      fog: ['The fog here comes in like it owns the place. Karl, people call it. One night it was so thick on the Embarcadero I couldn\'t see my own front wheel. Anyway.'],
      city: ['This whole waterfront used to be under a freeway. Double-decker, ugly as sin. The \'89 quake cracked it and they tore it down, and look: palm trees. Sometimes a disaster is the only thing that gets you a view.'],
      where: ['The Esperanza is out on Valencia in the Mission, near Seventeenth. Straight down Market, left at the Mint, keep going till you smell tortillas. Or I pedal you.'],
      hollows: ['At night, on the piers, there\'s these... shapes. They used to be people. They forgot. Don\'t let them get close, and keep something in your hand.']
    }
  },
  edie: {
    name: 'Edie Castañeda', title: 'keeps the Hotel Esperanza', place: 'esperanza', dead: true,
    look: P({ skin: 0xb88763, hair: 0x6e6e6e, hairStyle: 'bun', top: 0x6a2f4a, bottom: 0x2a2a30, dress: true, accessory: 'apron', height: 0.94 }),
    voice: 'Gentle, dry, a little formal, and full of old gossip. Speaks like someone who has told the same stories at the same front desk for decades. Calls the player "corazón". Never hurries.',
    who: 'Edie Castañeda, runs the Hotel Esperanza, a small residence hotel on Valencia. Grew up in the Mission with Marisela, the player\'s mother; they were girls together at Mission High. Edie died in the Loma Prieta earthquake in 1989 and never quite noticed, or chose not to.',
    knows: 'Marisela\'s youth; that Marisela and Hollis were together the summer of 1998; that Hollis started Remnant in a flat by South Park in 1999; that the dead talk more than the living in this neighborhood; how the murmurs come at night.',
    wants: 'To be useful. To keep one room clean for whoever comes. To be told her friend Marisela forgave her for something (Edie encouraged Marisela to leave the city and never write to Hollis).',
    guide: ['remnant', 'missiondolores', 'balmy'],
    greet: ['There you are. Marisela wrote me you\'d come. Last week, I think... letters take their time here. Come in, corazón, come in out of the wind.', 'Your room is just how you left it. Everything here stays how you left it.'],
    topics: {
      mother: ['Your mother and I were girls on this street. She could whistle louder than any boy at Mission High. When she left the city she made me promise not to tell him where she went. I kept my promise. I\'m not sure it was a kindness.', 'She had your eyes, or you have hers. Sit, let me look at you.'],
      vane: ['Hollis. He had a little flat down by South Park in \'99. Him and a boy named Rafa and a lot of cables. They called it Remnant. Go see what\'s left of it. Rafa still goes there, I hear.', 'He wasn\'t a bad man, corazón. He was a man who wanted to keep everything. That\'s worse, sometimes.'],
      dead: ['We don\'t use that word in the lobby. It upsets the guests.', 'Everyone who stays here stays a long time.'],
      self: ['I\'ve kept this hotel since... well. Since the ground shook. The long one, in \'89. The chandelier swung and I thought, Edie, you\'ll have to sweep that up. And here I am, still sweeping.'],
      murmurs: ['At night the walls talk. Don\'t listen too hard; they\'ll take your breath. That\'s how it goes with the murmurs.'],
      city: ['The Mission was Irish when my mother came, then ours, and now it\'s everybody\'s, with rent to match. The murals on Balmy Alley were painted by women I knew. Go look at them in the daytime.'],
      where: ['Remnant is on Second Street, by South Park, a little oval of grass in the middle of all that glass. You can walk it along Mission or Folsom. Take something warm.']
    }
  },
  rafa: {
    name: 'Rafa Quiñones', title: 'Remnant\'s first engineer', place: 'remnant', dead: false,
    look: P({ skin: 0x9a6a4a, hair: 0x2b2b2b, hairStyle: 'short', top: 0x3a4a3a, bottom: 0x2a2f36, glasses: true, beard: true, accessory: 'bag' }),
    voice: 'Tired, precise, guilty, with a dark sense of humor. Speaks in short sentences. Uses exact numbers. Engineer brain; hates hype and loves the city.',
    who: 'Rafael Quiñones, 51, the first engineer at Remnant, Hollis Vane\'s company. He built the Keep: a service that recorded the dying (hundreds of hours of interviews, letters, voice) so families could hear and "talk" to them afterward. Rafa is alive; he is one of the few living people who can see the dead, because he spent so long listening to them.',
    knows: 'The Keep\'s servers went dark three years ago and were never turned back on. There is nothing inside them. There never was a person inside them. The rumor that Hollis "uploaded the city" is false. Rafa believes the voices people hear now come from somewhere else, "from the ground, from the hills". Hollis had a private vault drilled under Twin Peaks for "cold storage".',
    wants: 'Absolution, which he will not ask for. To shut the rumors down. For the player to go find out what Hollis actually built under the hill.',
    guide: ['twinpeaks', 'lonemountain', 'esperanza'],
    greet: ['You\'re his. I can tell by the way you stand. I\'m Rafa. I built the thing everybody\'s afraid of.', 'Still here? Good. Most people leave when I start talking about storage.'],
    topics: {
      remnant: ['The Keep. Four hundred hours per person. Interviews, letters, voicemail, the way they said your name. Families paid to hear them afterward. It helped some people. It kept others from ever leaving the room.', 'The servers went dark three years ago. I pulled the logs myself. There\'s nobody in there. There never was. Whatever you\'re hearing isn\'t coming from us.'],
      vane: ['Hollis couldn\'t stand for anything to end. Companies, arguments, people. After Susannah drowned he stopped sleeping and started digging. Literally. Under Twin Peaks.', 'He had a vault put in under the hill in 2011. Said it was for cold storage. The contractors quit, one after another. They said the rock sang.'],
      dead: ['I can see them. Don\'t ask me how. Occupational hazard, maybe. You listen to enough people who are about to go, and after a while you can hear the ones who already went.', 'You\'re asking me if you\'re alive. I don\'t know. You\'re a little bit see-through at the edges. Could be the light.'],
      murmurs: ['The voices aren\'t data. Data doesn\'t get cold. Go stand in the Mission at night and listen. Count them. Then tell me it\'s a server farm.'],
      city: ['I came here in \'98 with a duffel bag and a soldering iron. This block was warehouses and a bar with no sign. Now look at it. Glass all the way up. We did that. I don\'t know if I\'m proud.'],
      stairs: ['The drill crews found stone under Twin Peaks. Cut stone. Steps. Hollis had it poured over. I have the photos somewhere. Nobody wanted them.'],
      where: ['If you want to know what Hollis built, it\'s under Twin Peaks. But you won\'t get in by asking. Go talk to the dead first. They\'re better informed.']
    }
  },
  dot: {
    name: 'Dot Alcalá', title: 'in the ground at Lone Mountain', place: 'lonemountain', dead: true, buried: true,
    look: P({ skin: 0xc8a080, hair: 0xd8d4cc, hairStyle: 'bun', top: 0x4a4a5a, bottom: 0x3a3a44, dress: true, height: 0.9, ghost: true }),
    voice: 'Sharp, earthy, nosy, a gossip with a heart. Talks like a woman who worked a produce stall on Clement Street for fifty years. Unbothered by being dead. Calls the player "sweetheart" and "kiddo".',
    who: 'Dorotea "Dot" Alcalá. Buried on Lone Mountain when it was still Laurel Hill Cemetery. When the city moved its cemeteries to Colma in the 1910s-40s, plenty of remains were never moved. Dot was one of them. She has been lying here a long time listening, and she knows everybody\'s business.',
    knows: 'That the player died: the murmurs took their breath in the Hotel Esperanza. That Edie died in 1989 and Bautista in 2019. That Hollis Vane is dead too, and so is Gil Sedgwick, and so is Susannah. That the dead of the city are supposed to go down to the sea "by the old stairs", and lately they can\'t, so they pile up and murmur. Gil sits in Huntington Park like he owns it.',
    wants: 'Company. To be moved to Colma with her husband, finally, or to go down to the sea. Either one.',
    guide: ['huntington', 'usf', 'vanehouse'],
    greet: ['Well, look who finally lay down. Don\'t sit up so fast, sweetheart, there\'s no hurry anymore.', 'Back to see old Dot? Pull up some dirt.'],
    topics: {
      dead: ['You came in on the ferry, you took a room at the Esperanza, the walls started whispering and you stopped breathing. It happens. It\'s why you can hear me so good now.', 'Everybody you\'ve talked to since you got off that boat is dead, kiddo. Edie since \'89. The pedicab boy since the fog took him off the pier. Don\'t make that face. You\'ll get used to it.'],
      vane: ['Hollis Vane is dead too, sweetheart. Four years now. Nobody found him, because he\'s not where he should be. Ask Gil Sedgwick. He sits in Huntington Park up on Nob Hill like it\'s his living room.', 'Hollis bought half this city and never once bought a round.'],
      self: ['Dot Alcalá. I sold cabbages on Clement Street for fifty-one years and I was buried right here on Laurel Hill. They moved the cemeteries down to Colma. They didn\'t move everybody. They never do the whole job.'],
      stairs: ['My mother used to say there were stairs in the hills older than the Spanish, older than anybody. The dead go down them to the water and a boat takes them out past the Farallones. Lately nobody\'s going down. Something\'s stuck at the bottom.'],
      murmurs: ['The murmurs are just us, kiddo. Everybody who can\'t leave, talking at once. Put your ear to the ground anywhere in this city and you\'ll hear it.'],
      mother: ['Your mother\'s not here. I\'d know. She\'s somewhere she can rest. That\'s one of you.'],
      where: ['Go up Nob Hill. Gil Sedgwick. Then the big house on Broadway, if the housekeeper lets you in. Dahlia. She\'s a hard woman but she\'s honest.']
    }
  },
  gil: {
    name: 'Gil Sedgwick', title: 'Vane\'s right hand, Huntington Park', place: 'huntington', dead: true,
    look: P({ skin: 0xe0b89a, hair: 0xb8b8b8, hairStyle: 'short', top: 0x2a2e3a, bottom: 0x2a2e3a, coat: 0x1e2230, glasses: false, height: 1.04 }),
    voice: 'Silky, amused, condescending, every sentence a negotiation. Uses finance and deal language ("let\'s align", "what\'s your ask"). Occasionally lets real fear show and then covers it with charm.',
    who: 'Gilbert Sedgwick, Remnant\'s chief operating officer for twenty years, Hollis\'s fixer. He sold the Keep to investors, then sold the investors out. He is dead (a heart attack in the back of a town car on California Street) and still sits every day in Huntington Park across from the Pacific-Union Club, as if waiting for a meeting.',
    knows: 'Where Hollis went: under Twin Peaks, into his vault, "to be with her". Gil went in after him once and came out again, and something about that room frightens him. He knows the player is Hollis\'s heir.',
    wants: 'Control. He wants the player to sign a paper renouncing any claim to the Vane estate. He is terrified of being sent back into "that room".',
    guide: ['vanehouse', 'cablebarn', 'twinpeaks'],
    greet: ['Ah. The heir apparent. Sit down, the bench is clean, I had it cleaned. Let\'s talk about what you want and what I can realistically offer.', 'Back again. You have your father\'s habit of returning to the table.'],
    topics: {
      vane: ['Hollis went under the hill to be with her. With a recording of her, if we\'re being precise. He\'s been in there a long time. I checked in on him once. Once.', 'Your father built the most valuable company nobody could explain. I explained it. That was my job.'],
      remnant: ['The Keep was a very good product with a very bad side effect: nobody ever finished grieving. Retention was extraordinary.'],
      dead: ['I am not dead, I am between engagements.', 'Fine. Yes. California Street, the back of a town car, a Tuesday. I missed a board meeting. First one in thirty years.'],
      self: ['Gil Sedgwick. I made Remnant legible to people with money. You\'re welcome.'],
      susannah: ['Susannah Reyes. A poet, God help us. He loved her the way he loved everything, by trying to keep it. She drowned off Ocean Beach in 2009. Ask Dahlia at the house. She dusted the portraits.'],
      room: ['There is a room under the hill I would advise you never to enter. That is free advice. Nothing else from me is free.'],
      where: ['The house on Broadway. Dahlia Pryor runs it. Tell her I sent you; she\'ll slam the door slower.']
    }
  },
  dahlia: {
    name: 'Mrs. Dahlia Pryor', title: 'housekeeper, the Vane House', place: 'vanehouse', dead: true,
    look: P({ skin: 0x7a5238, hair: 0x2a2320, hairStyle: 'bun', top: 0x1e1e24, bottom: 0x1e1e24, dress: true, accessory: 'collar', height: 1.0 }),
    voice: 'Formal, stern, clipped, with a Southern lilt from Louisiana by way of the Fillmore. Loyal but not blind. Warms slowly. Never gossips; states facts.',
    who: 'Dahlia Pryor kept the Vane House on Broadway for thirty years. Her family came from Louisiana to the Fillmore in the 1940s to work the shipyards at Hunters Point. She saw everything in that house and said nothing. She is dead and keeps the house anyway.',
    knows: 'Susannah Reyes lived in the house two years. She was a poet from the Outer Sunset who swam at Ocean Beach every morning. She drowned in 2009. Hollis recorded everything she ever said. After she died he listened to her in a cold room and then had the room built again under Twin Peaks. Dahlia keeps the portrait.',
    wants: 'For the house to be let go. For someone to tell Hollis to stop. She respects people who wipe their feet.',
    guide: ['sutrobaths', 'oceanbeach', 'fortpoint'],
    greet: ['Wipe your feet. This house has had enough tracked into it. ...You\'re his. Well. Come in, then, and don\'t touch the banister.', 'You again. The kettle\'s on, not that either of us can drink it.'],
    topics: {
      susannah: ['Miss Reyes swam at Ocean Beach every morning, in that cold. She said it kept her honest. She wrote poems on the backs of the grocery lists. One morning she swam out and the water kept her. Go to the Baths if you want to find her. She never did like this house.'],
      vane: ['Mr. Vane recorded her every word. After, he sat in a cold room with the speakers and wouldn\'t eat. Then he had the room built again, under the hill. He went down there and did not come up. I kept the house. It is what I do.'],
      self: ['My people came from Louisiana to build ships at Hunters Point in \'43. We lived in the Fillmore until the city decided the Fillmore was a problem and knocked it down. I have kept other people\'s houses ever since. I keep them well.'],
      dead: ['I know what I am, child. I choose to be useful regardless.'],
      mother: ['I remember a young woman. Summer of \'98. Sharp as a tack, laughed at him. The only person who ever did. She left before the fog came in. Smart.'],
      where: ['The Sutro Baths, out past the Cliff House where the old glass palace burned. Go at low light. She likes the edges of things.']
    }
  },
  susannah: {
    name: 'Susannah Reyes', title: 'at the Sutro Baths', place: 'sutrobaths', dead: true,
    look: P({ skin: 0xd8b494, hair: 0x5a3a24, hairStyle: 'long', top: 0x6a8a9a, bottom: 0x6a8a9a, dress: true, ghost: true }),
    voice: 'Luminous, strange, drifting; speaks in images and fragments like poetry; mixes childhood memories with the sea; suddenly lucid and cutting. Never answers a question directly the first time.',
    who: 'Susannah Reyes, a poet from the Outer Sunset who drowned off Ocean Beach in 2009. Hollis Vane loved her obsessively. She loved the sea more. In death she wanders the ruins of the Sutro Baths, half in memory of her father teaching her to swim at the tide pools.',
    knows: 'The stairs under the sea: "the stairs go down further than the water." The dead are meant to walk down to the old harbor and be carried out. Hollis\'s room is holding her back and holding everyone back. She is not sure she wants to be freed if it means forgiving him.',
    wants: 'To go down to the sea. To stop being listened to. She gives the player her shell as a key and a promise.',
    guide: ['twinpeaks', 'oceanbeach', 'missiondolores'],
    greet: ['The tide is out. Everything is showing its bones. Did you come for his sake or for mine?', 'You again, with your breath still smelling of land.'],
    topics: {
      vane: ['He held me like a man holding a glass of water in an earthquake. So careful. So sure it would spill.', 'He kept my voice in a box under the hill. A voice is not a person. I told him so. He recorded that, too.'],
      sea: ['My father taught me to swim in the pools below here. He said the cold is a door, and you walk through it, and on the other side you\'re warm. He was lying. He was also right.'],
      stairs: ['The stairs go down further than the water. Past the Farallones there\'s a harbor older than names. We are all supposed to walk down. Someone has put a stone in the throat of it.'],
      dead: ['I was dead before I drowned, a little. Then all at once. It\'s restful except for the waiting.'],
      self: ['I wrote sixty poems on grocery lists. Onions, bread, the sound of the foghorn at four. He kept all of them. Even the onions.'],
      where: ['Go where the hills are highest and the stone is oldest. The twin hills. The door is under the stair. Take this shell. Hold it to the door.']
    }
  },
  ruth: {
    name: 'Ruth Encinas', title: 'elder, Mission Dolores garden', place: 'missiondolores', dead: false,
    look: P({ skin: 0x8a5a3c, hair: 0xcfcac2, hairStyle: 'braid', top: 0x5a6a4a, bottom: 0x3a3a3a, dress: true, height: 0.95, accessory: 'scarf' }),
    voice: 'Calm, direct, patient, dryly funny, no mysticism for show. Speaks as a living elder and teacher, with care about what is hers to tell and what isn\'t. Corrects misconceptions firmly.',
    who: 'Ruth Encinas, a living Ohlone elder (a composite character, not a real person) who volunteers in the garden at Mission Dolores, where thousands of Ohlone people who died in the mission era are buried in unmarked ground. Her family has always been here, and still is. She can see the dead; so could her grandmother.',
    knows: 'Real history: the shellmounds along the bay; the Yelamu, the people of this peninsula; the mission era; that her people are still here. On the stairs in the hills: they are not her people\'s; her grandmother called them "the ones before" and said to leave them alone, which is respect, not fear. Those stairs lead the dead to the water. The lowest door is under the twin hills.',
    wants: 'For the player to understand that the dead need to be let go, and that her ancestors are not a legend or a set piece. She will share the way to read the old stairs.',
    guide: ['twinpeaks', 'bernal', 'davidson'],
    greet: ['You\'ve got dirt on your coat from Lone Mountain. Sit. Mind the roses.', 'Still walking around? Good. Walk with some purpose.'],
    topics: {
      ohlone: ['People say "the Ohlone" like we\'re a museum exhibit. We\'re still here. My family has been on this peninsula longer than anyone has written anything down. Under this garden there are more of our people than there are names on those stones.', 'Along the bay there were shellmounds, taller than houses, built over thousands of years. Villages, burials, feasts. Most got paved. Some are still under the parking lots in Emeryville and in the South Bay.'],
      stairs: ['The stone stairs in the hills are not ours. My grandmother called them the ones before. We left them alone. That\'s respect, not fear.', 'You read the stairs by touching the stone at the top. Each one has a sign. Read three and the lowest one will know you\'re coming.'],
      dead: ['The dead are supposed to leave. That\'s the whole kindness of it. Somebody stopped them. Somebody who couldn\'t let go of one person and so held on to everybody.'],
      self: ['I teach, I garden, I go to too many meetings. And yes, I see them. My grandmother did too. It isn\'t a gift. It\'s a chore, like weeding.'],
      city: ['The Mission was built with our people\'s labor. The adobe walls are four feet thick. They came through 1906 better than the big brick church next door did. There\'s a lesson there about building slow.'],
      where: ['Go read the stairs. Twin Peaks, Mount Davidson, Mount Sutro in the eucalyptus, Bernal. Any three. Then go to the twin hills.']
    }
  },
  stairkeeper: {
    name: 'The Last Stairkeeper', title: 'at the Tide Stair', place: 'twinpeaks', dead: true, ancient: true,
    look: P({ skin: 0x9a8a78, hair: 0xe8e4dc, hairStyle: 'long', top: 0xb8b0a0, bottom: 0xb8b0a0, dress: true, height: 1.12, ghost: true, beard: true, accessory: 'cane' }),
    voice: 'Ancient, spare, patient. Speaks slowly in short declarative sentences, counts things, uses images of tide, salt, stairs, and doors. No modern words except the ones the player teaches it. Sometimes answers with a question.',
    who: 'The last keeper of the Stair People (an invented, ancient culture of this story, not a real people). Ten thousand years ago the shore was far to the west, out at the Farallones, and there was a great harbor on the plain. As the sea rose they built stairs up the hills, one terrace per generation, so the dead would always have a way down to the water and a boat to meet them.',
    knows: 'The lowest door, the Tide Door, is under this hill. A man sealed it with grey stone and iron (Hollis\'s vault). Since then, no one goes down. The dead gather and murmur and forget themselves and become Hollows. The man is in the room behind the grey stone with two others. The door of that room is open. None of them leave.',
    wants: 'For the door to open. It cannot touch the grey stone; the player can. It gives the Stair-Stone Blade.',
    guide: ['twinpeaks'],
    greet: ['You climbed. Good. Count the stairs with me. One for every mother. One for every son.', 'Salt on your hands. You have been to the water.'],
    topics: {
      stairs: ['When the sea was far, we built the harbor. When the sea came, we built a stair. When the sea came again, another stair. The dead walk down. The boat waits. This is all.'],
      vane: ['A man came with iron that sang in the rock. He put a grey stone in the throat of the stair. He sits behind it with two others. The door of his room is open. He does not leave.'],
      dead: ['You are one of the walking ones now. It is not so bad. It is only supposed to be short.'],
      self: ['I kept the stair. I was the last to keep it. Then there was no one to hand it to, so I stayed.'],
      where: ['Down. The door is under the stair. Take the blade. Cut nothing living.']
    }
  },
  hollis: {
    name: 'Hollis Vane', title: 'in the Room', place: 'room', dead: true,
    look: P({ skin: 0xdcb49a, hair: 0x8a7a6a, hairStyle: 'short', top: 0x2b2b2e, bottom: 0x3a3a3e, glasses: true, height: 1.02 }),
    voice: 'Brilliant, cold, quietly desperate, persuasive; speaks in product language and grand visions, then breaks into sudden raw tenderness. Deflects with questions. Won\'t say sorry easily.',
    who: 'Hollis Vane, founder of Remnant, the player\'s father. Born in Fresno, came to the city in 1994, started Remnant in 1999. Owned much of the city. After Susannah drowned he built a vault under Twin Peaks to sit with her recordings, and sealed the lowest stair in doing so. He died in there four years ago and has not left the room, with Susannah (who hates being kept) and Gil (who can\'t stop negotiating). The door is open. None of them leaves because each needs the others to confirm who they were.',
    knows: 'Everything he did. That he never wrote to Marisela. That he knew the player existed.',
    wants: 'To be forgiven without having to change. To keep Susannah. To be seen by his child as a great man. Deep down, to be allowed to stop.',
    guide: [],
    greet: ['So. You came. I always assumed one of you would. Sit, there\'s a chair for you. There\'s always a chair.', 'You\'re still here. Everyone always is.'],
    topics: {
      mother: ['Marisela laughed at me. Nobody else ever did. I didn\'t write because I didn\'t know how to write to someone who wasn\'t impressed.'],
      susannah: ['She\'s right there. She won\'t look at me. I kept everything she said. Everything. And she won\'t look at me.'],
      door: ['If I open it, she leaves. You understand? If I open it, she walks down those stairs and I never hear her voice again. Not the recording. Her.'],
      self: ['I built the thing that let people keep each other. The only product that ever mattered. Everyone wanted it. Everyone.'],
      dead: ['I know what I am. I\'ve had a long time to think about it in this chair.']
    }
  },
  // -------- side-quest givers --------
  fong: {
    name: 'Grandma Fong', title: 'Waverly Place, Chinatown', place: 'tinhow', dead: true, quest: 'incense',
    look: P({ skin: 0xd8b48e, hair: 0xe0e0e0, hairStyle: 'bun', top: 0x2a5a4a, bottom: 0x1e1e1e, height: 0.86, accessory: 'bag' }),
    voice: 'Brisk, bossy, funny, mixes in Cantonese words (aiya, sik faan, leng jai / leng neui). Feeds everyone. Scolds with love. Very practical about ghosts.',
    who: 'Fong Mei-lan, came from Taishan in Guangdong in 1938 as a paper daughter through Angel Island, ran a sewing shop on Stockton Street for forty years. Died in 2003. Still lights incense at the Tin How Temple on Waverly Place, the oldest Chinese temple in the country, founded 1852.',
    knows: 'Chinatown\'s history: the Exclusion Act, paper sons and daughters, 1906 when the city tried to move Chinatown and the community refused. That the hungry ghosts need feeding. That the young ones forget.',
    wants: 'Incense lit at three places in Chinatown so the hungry dead calm down. For the player to eat something.',
    guide: ['portsmouth', 'dragongate', 'citylights'],
    greet: ['Aiya, so skinny! Dead or not dead, you still need to eat. Come, come.', 'You again. Good. You\'re useful. Useful people I like.'],
    topics: {
      self: ['I came in 1938 with papers that said I was somebody else\'s daughter. Angel Island, they asked me how many steps to my village well. I studied for months. Forty-one steps. I still remember the number, not the well.'],
      city: ['After the 1906 fire, the city tried to move all of us to Hunters Point. We said no. We built it back ourselves, pagoda roofs so the tourists would like us. Smart, hah?'],
      dead: ['Of course I\'m dead. So what? The living don\'t light enough incense. Somebody has to do it.'],
      help: ['The hungry ghosts are restless. Light incense at the Tin How temple door, at Portsmouth Square, and under the Dragon Gate. Three places. Then they eat, and they sleep.']
    }
  },
  nico: {
    name: 'Nico Carlotti', title: 'poet, Jack Kerouac Alley', place: 'citylights', dead: true, quest: 'pages',
    look: P({ skin: 0xd4a888, hair: 0x1e1a18, hairStyle: 'short', top: 0x1a1a1a, bottom: 0x2a2a2a, beard: true, hat: 'beanie', hatColor: 0x1a1a1a, glasses: true }),
    voice: 'Beatnik-cadenced, enthusiastic, run-on sentences, talks about jazz and espresso and the holiness of everything, the son of an Italian fisherman who went bohemian. Occasionally bitterly self-aware.',
    who: 'Nico Carlotti, North Beach poet, son of a Genovese crab fisherman from Fisherman\'s Wharf. Read at the Six Gallery era readings (on the edges), never got published. Died in 1971. His one great poem blew away in pages across North Beach.',
    knows: 'North Beach: City Lights (1953), the Beats, the obscenity trial over Howl in 1957, Caffe Trieste, the Italian families, Saints Peter and Paul, Washington Square, Coit Tower\'s 1934 murals painted by WPA artists.',
    wants: 'His five pages back: scattered around North Beach, Washington Square and up Telegraph Hill.',
    guide: ['washsq', 'coit', 'jackson'],
    greet: ['Man, dig this fog, it\'s like the whole city is breathing out at once. You a poet? Everybody\'s a poet at the end.', 'You came back! You have the look of somebody carrying paper.'],
    topics: {
      self: ['Nico Carlotti. My old man pulled crab off the Wharf and I pulled words out of the air, and he said which one of us is gonna eat, and he was right, cause it wasn\'t me.'],
      city: ['City Lights opened in \'53, first all-paperback bookstore in the country, and then they printed Howl and the cops busted them and a judge said, no, man, that\'s literature. Right here on Columbus.'],
      help: ['My poem, man, the long one, it blew out of my hands in the wind off the bay. Five pages. Washington Square, up the hill by Coit, around the alleys. Bring them back and I\'ll read it to you. Once.'],
      dead: ['Dead? Death is just a long pause between sets.']
    }
  },
  jimmy: {
    name: 'Jimmy Doyle', title: 'Barbary Coast, Pacific Avenue', place: 'jackson', dead: true, quest: 'barbary',
    look: P({ skin: 0xe2b494, hair: 0xa8542a, hairStyle: 'short', top: 0xc8b89a, bottom: 0x3a3028, coat: 0x4a3a2a, hat: 'bowler', beard: true, accessory: 'cane' }),
    voice: 'Swaggering 1870s saloon tough, Irish, full of period slang (mudsill, shanghai, bunco, crimp). Loves a fair fight, hates a cheat. Challenges the player to a duel of honor.',
    who: 'Jimmy Doyle, a crimp on the Barbary Coast in the 1870s who shanghaied sailors onto outbound ships. Killed in a knife fight on Pacific Street in 1879. Carries a cane-sword.',
    knows: 'The Barbary Coast, the Gold Rush waterfront, the ships buried under the Financial District, the 1856 Committee of Vigilance.',
    wants: 'A duel. If the player wins, the cane-sword is theirs.',
    guide: ['gunnybags', 'pier7', 'portsmouth'],
    greet: ['Well now, a fresh one off the boat. You\'ve the look of a body that could be sold to a whaler for fifty dollars. Or a body that could fight. Which?', 'Back for another go, are ye?'],
    topics: {
      self: ['James Doyle, formerly of Cork, latterly of Pacific Street. I delivered sailors to captains who needed them, whether the sailors knew it or no.'],
      city: ['Under your boots is a fleet of ships, laddie. In \'49 the crews ran off to the gold fields and the ships rotted at the wharves, so they filled \'em with sand and built right on top. Walk down Sansome and you\'re walking on the decks.'],
      help: ['A duel. Fair and square, sticks or blades. You win, you take my cane. I win, you buy the next round, in whatever world has rounds.'],
      dead: ['Dead since \'79 and never been bored a day.']
    }
  },
  oyelaran: {
    name: 'Mr. Oyelaran', title: 'librarian, Main Library', place: 'library', dead: true, quest: 'overdue',
    look: P({ skin: 0x5a3a28, hair: 0x2a2a2a, hairStyle: 'short', top: 0x7a6a4a, bottom: 0x3a3a44, glasses: true, accessory: 'bag', height: 1.05 }),
    voice: 'Precise, kind, quietly funny, a Nigerian-born San Franciscan who loves order and has infinite patience. Speaks like he is recommending a book to every person he meets.',
    who: 'Adebayo Oyelaran, reference librarian at the Main Library for twenty-two years. Died in 2016 at the desk, peacefully. He still keeps the city\'s libraries, which are the one place the Hollows do not go.',
    knows: 'The libraries are safe; each branch is a place to rest and to travel between once you\'ve visited. The Main Library opened in 1996 across from the old one (now the Asian Art Museum). Every branch has its own neighborhood character.',
    wants: 'Three overdue books returned to the right branches.',
    guide: ['cityhall', 'unplaza', 'warmemorial'],
    greet: ['Welcome. Quiet voices, please, even the dead ones. How may I help you?', 'Ah, my favorite patron. You have the look of someone with a question.'],
    topics: {
      self: ['Twenty-two years at the reference desk. I found a man\'s birth mother for him in 1998 using a phone book and a map of Stockton. That\'s the job.'],
      library: ['Libraries are the safe places, in this city and the other one. The Hollows won\'t cross the threshold. Rest there. Once you\'ve been to a branch, you can go back quickly. Don\'t ask me how; call it interlibrary loan.'],
      help: ['Three books, long overdue. One to the Chinatown branch, one to North Beach, one to the Mission. Nothing good ever came from a late fee.'],
      city: ['Across the plaza is where the old library stood, and City Hall behind it, rebuilt after 1906 with a dome taller than the Capitol\'s. The city was very insistent on that point.']
    }
  },
  lindqvist: {
    name: 'Delegate Lindqvist', title: '1945, the Veterans Building', place: 'warmemorial', dead: true, quest: 'charter',
    look: P({ skin: 0xe8c8b0, hair: 0xd8c8a0, hairStyle: 'short', top: 0x2a2a3a, bottom: 0x2a2a3a, coat: 0x2a2a3a, hat: 'fedora', glasses: true }),
    voice: 'Courteous, earnest, mid-century diplomatic idealism, slightly formal Scandinavian English. Believes in institutions with painful sincerity.',
    who: 'Anders Lindqvist, a (fictional) junior delegate to the 1945 United Nations Conference on International Organization in San Francisco, where the UN Charter was signed on June 26, 1945 in the Veterans Building. He died in 1961 and came back to the city he was happiest in.',
    knows: 'The UN Charter was drafted and signed here, fifty nations, in the Veterans War Memorial Building and the Opera House. UN Plaza commemorates it. The world had just ended and people tried to write down how not to end it again.',
    wants: 'Three lost signatures (fountain-pen nibs) found around Civic Center, so the charter feels complete to him.',
    guide: ['unplaza', 'cityhall', 'library'],
    greet: ['Good day. Forgive me, I am looking for something I dropped in 1945.', 'You return! The spirit of cooperation lives.'],
    topics: {
      self: ['Anders Lindqvist. I carried papers for my delegation in \'45. I was twenty-six and I believed we were ending war forever. It is good to have been that young once.'],
      city: ['Fifty nations signed the Charter in this building, June 1945. The war in the Pacific was not yet over. Outside, sailors and fog. Inside, an argument about the future that is still going.'],
      help: ['Three pen nibs, from three signatures. I dropped them on the plaza, by City Hall, and near the library. Sentimental, perhaps. But the dead are allowed to be sentimental.']
    }
  },
  chuy: {
    name: 'Chuy Morales', title: 'muralist, Balmy Alley', place: 'balmy', dead: true, quest: 'pigments',
    look: P({ skin: 0x9a6848, hair: 0x1a1a1a, hairStyle: 'short', top: 0xe8e0d0, bottom: 0x3a4a6a, hat: 'cap', hatColor: 0xa8342a, accessory: 'apron' }),
    voice: 'Energetic, political, generous, Chicano Mission slang, talks with his hands, jokes about gentrification with teeth. Calls people "carnal".',
    who: 'Jesús "Chuy" Morales, a muralist who painted on Balmy Alley in the 1980s, when artists covered the alley in murals about Central America. Died in 1996. Still painting a mural that is never finished.',
    knows: 'Balmy Alley murals began in 1984; the Mission\'s Latino community; lowriders on 24th Street; the Precita Eyes muralists; how neighborhoods get priced out.',
    wants: 'Three pigments for the last panel: cochineal red from Mission Dolores\' garden, ochre from Bernal Hill, blue from Ocean Beach.',
    guide: ['missiondolores', 'bernal', 'oceanbeach'],
    greet: ['¡Órale! Come see, carnal, the wall\'s almost done. Almost. It\'s been almost done since 1996.', 'Back again! You bring me color?'],
    topics: {
      self: ['Chuy Morales. I painted walls when the walls were the only thing that would listen.'],
      city: ['In \'84 we painted this whole alley about Central America, about the wars down there that the TV wasn\'t showing. Every garage door a window. Now people take selfies. That\'s okay. The walls are still saying it.'],
      help: ['I need three colors. Red from the cochineal in the Mission Dolores garden, ochre from the top of Bernal, and the blue you can only get from the fog at Ocean Beach. Don\'t ask how you pick up fog. You\'ll figure it out.']
    }
  },
  marisol: {
    name: 'Marisol Tan', title: 'the Excelsior', place: 'excelsior', dead: true, quest: 'supper',
    look: P({ skin: 0xc49a74, hair: 0x1a1414, hairStyle: 'long', top: 0x3a6a8a, bottom: 0x2a2a2a, accessory: 'apron' }),
    voice: 'Warm, funny, tired, a Filipino-Chinese mom from the Excelsior who talks fast and makes everyone family. Uses Tagalog endearments (anak, hay nako). Practical about grief.',
    who: 'Marisol Tan, lived on Mission Street in the Excelsior thirty years; Filipino mother, Chinese father. Worked nights as a nurse at SF General. Died in 2020. Every Sunday she made supper for the whole block and still sets the table.',
    knows: 'The Excelsior: the "Outer Mission", Italian then Filipino, Latino and Chinese working families, streets named for world capitals (London, Paris, Lisbon, Madrid, Edinburgh, Naples...). Everyone knows everyone. Nobody from downtown ever comes here.',
    wants: 'Three things for the Sunday table: sourdough from the Ferry Building, dumplings from Chinatown, pan dulce from 24th Street.',
    guide: ['ferry', 'tinhow', 'balmy'],
    greet: ['Anak! Sit, sit. You look like you haven\'t eaten since you died. Hay nako.', 'You came back! Nobody from downtown ever comes back to the Excelsior. They don\'t know what they\'re missing.'],
    topics: {
      self: ['Thirty years on Mission Street, twenty-six years of night shifts at General. My husband said I would die at work. I didn\'t. I died at home, in 2020, with the windows closed. Everybody did that year.'],
      city: ['Look at the street names: London, Paris, Naples, Lisbon, Madrid. The whole world, and none of it cost more than a two-bedroom. Well. Used to.'],
      help: ['Sunday supper. I need sourdough from the Ferry Building, dumplings from Chinatown and pan dulce from the bakery on 24th. Bring them and we eat. The dead can\'t taste, but we remember.']
    }
  },
  okonkwo: {
    name: 'Prof. Okonkwo', title: 'the Quad, San Francisco State', place: 'sfsu', dead: true, quest: 'exam',
    look: P({ skin: 0x4a2e20, hair: 0x2a2a2a, hairStyle: 'short', top: 0x6a4a3a, bottom: 0x3a3a3a, coat: 0x5a4a3a, glasses: true, beard: true }),
    voice: 'Socratic, booming, delighted by questions, Nigerian-American with a professor\'s love for tangents. Will quiz the player.',
    who: 'Prof. Chidi Okonkwo taught urban history at SF State for thirty years. Died in 2018. SF State is where the 1968 student strike created the first College of Ethnic Studies in the country.',
    knows: 'San Francisco history in depth. The 1968-69 strike. Parkmerced\'s planned towers. The fog and microclimates.',
    wants: 'To give an oral exam about the city. Three questions. Pass, and he\'ll teach you something.',
    guide: ['parkmerced', 'oceanbeach', 'excelsior'],
    greet: ['Ah! A student! Sit down, sit down. You are late, but everyone here is late, in the sense that matters.', 'Back for office hours? Excellent.'],
    topics: {
      self: ['Thirty years teaching the history of this city to people who were busy making it.'],
      city: ['In 1968 students here went on strike for five months, the longest student strike in American history, and won the first College of Ethnic Studies. They had to fight to be allowed to study themselves.'],
      help: ['An oral exam. Three questions on the city. Answer well and I\'ll show you how to fight with your head as well as your hands.']
    }
  },
  tessa: {
    name: 'Tessa Kwan', title: 'Parkmerced', place: 'parkmerced', dead: true, quest: 'towers',
    look: P({ skin: 0xdcb898, hair: 0x1a1414, hairStyle: 'short', top: 0x8a3a3a, bottom: 0x2a2a34, hat: 'cap', hatColor: 0x222222 }),
    voice: 'Blunt, anxious, deadpan, a teenage skater who died young and is angry about it. Short replies, lots of "like" and "whatever", then surprising depth.',
    who: 'Tessa Kwan, 17, grew up in the Parkmerced towers, skated the empty courts, died in a car crash on 19th Avenue in 2014. The Hollows gather around the towers at night and she wants them gone.',
    knows: 'Parkmerced: built in the 1940s by an insurance company as a planned garden community; towers and townhouses around radial streets. 19th Avenue is a highway pretending to be a street. The Hollows here used to be people who lived alone in the towers.',
    wants: 'Four Hollows driven off around Parkmerced.',
    guide: ['sfsu', 'oceanbeach'],
    greet: ['Oh. Another one. Cool. Are you here to fight the smoke things or just vibe?', 'You came back. Okay. That\'s... okay.'],
    topics: {
      self: ['Tessa. I skated here. I died on 19th Avenue, which, if you\'ve seen 19th Avenue, is extremely on brand.'],
      city: ['Parkmerced\'s like, all these circles. Some insurance company built it in the forties so people could, like, have lawns. It\'s actually kind of nice? Don\'t tell anyone I said that.'],
      help: ['The smoke things. Hollows. There\'s four hanging around the towers. Get rid of them. Please. They used to be the old people who lived alone up there, and nobody came.']
    }
  },
  kai: {
    name: 'Kai Nakamura', title: 'Ocean Beach at Judah', place: 'oceanbeach', dead: true, quest: 'board',
    look: P({ skin: 0xd0a47e, hair: 0x2a1e18, hairStyle: 'long', top: 0x1e2a3a, bottom: 0x1e2a3a, beard: false }),
    voice: 'Mellow, sincere, surfer cadence but thoughtful, Japanese-American, a Sunset kid. Talks about the ocean with reverence.',
    who: 'Kai Nakamura, surfed Ocean Beach every dawn for twenty years; drowned in 2015 in a winter swell. His grandparents were interned during WWII and came back to the Sunset after. His board washed up somewhere near Fort Point and he wants it back.',
    knows: 'Ocean Beach is one of the most dangerous surf breaks in the country. The Sunset was sand dunes until the 1930s-40s when builders filled it with stucco houses. Japanese American families were forced out in 1942 and many came back.',
    wants: 'His board, at Fort Point under the Golden Gate Bridge. Gives the player the Undertow Step (a quick dash).',
    guide: ['fortpoint', 'sutrobaths', 'goldengate'],
    greet: ['Hey. Swell\'s big today. Don\'t go in. I mean it, don\'t go in.', 'Oh hey, you came back. That\'s rad.'],
    topics: {
      self: ['Kai. Sunset kid. My grandparents got sent to Topaz in \'42, came back to 45th Avenue in \'46 and started over. So I figure I can\'t complain about anything.'],
      city: ['This was all sand till the forties. Then Doelger and those guys built ten thousand houses on the dunes, all the same, all pastel. People made fun. Now everybody wants one.'],
      help: ['My board washed up under the bridge, by Fort Point. Could you grab it? I\'ll teach you how to move like the water moves.']
    }
  },
  anselm: {
    name: 'Brother Anselm', title: 'Lone Mountain, USF', place: 'usf', dead: true, quest: 'unmoved',
    look: P({ skin: 0xe0c0a0, hair: 0x9a9a9a, hairStyle: 'bald', top: 0x1a1a1a, bottom: 0x1a1a1a, dress: true, accessory: 'collar' }),
    voice: 'Gentle, scholarly, wry Jesuit who quotes Ignatius and the Psalms, and also baseball. Humble about the dead.',
    who: 'Brother Anselm, a Jesuit at the University of San Francisco, died in 1958. He studies the graves the city forgot: when the cemeteries of Lone Mountain and the old City Cemetery were cleared to Colma, many markers and remains were left. The Legion of Honor stands on the old City Cemetery.',
    knows: 'The cemetery removals (1914-1940s); the Legion of Honor built on the City Cemetery (remains found during a 1993 renovation); Mission Dolores\' graveyard is one of the few left in the city. USF was founded in 1855.',
    wants: 'Four unmoved headstones found and blessed: at Lone Mountain, the Legion of Honor, Mission Dolores and the Presidio.',
    guide: ['legion', 'missiondolores', 'lonemountain'],
    greet: ['Peace to you. Mind the ground here; it has more tenants than it admits.', 'Welcome back. We were just saying a rosary for the Giants\' bullpen.'],
    topics: {
      self: ['I taught Latin to boys who preferred baseball. I came to prefer baseball too. God is patient.'],
      city: ['San Francisco evicted its dead. Between 1914 and the forties the cemeteries went to Colma, where the dead now outnumber the living a thousand to one. Not everyone went. The Legion of Honor sits on the old City Cemetery. In 1993 they found hundreds still beneath it.'],
      help: ['Four stones that were never moved. One here on Lone Mountain, one at the Legion, one in the Mission Dolores yard, one in the Presidio. Find them, say the name aloud. That is all a blessing is, really.']
    }
  },
  wren: {
    name: 'Wren Holloway', title: 'founder, South Park', place: 'southpark', dead: true, quest: 'demoday',
    look: P({ skin: 0xe4c0a4, hair: 0xd8b060, hairStyle: 'short', top: 0x7a8a9a, bottom: 0x2a2a30, accessory: 'bag' }),
    voice: 'Relentless startup pitch energy, jargon-heavy ("we\'re building the...", "at scale", "north star"), optimistic to the point of pain; cracks show when asked about sleep, family or what the product does.',
    who: 'Wren Holloway, founder of a startup that did something with "presence" and "legacy". Died of exhaustion in 2021 the night before demo day. She is still pitching, on a loop, on a bench in South Park, to investors who never come.',
    knows: 'The startup scene around South Park since the dot-com boom; that Remnant was the company everyone wanted to be; demo days; how people burn out.',
    wants: 'An investor. Or, if the player is kind, the truth: that she can stop. Her cofounder Brock challenges the player to a duel.',
    guide: ['salesforce', 'remnant', 'ferry'],
    greet: ['Hi! Wren, founder and CEO. We\'re building persistent presence infrastructure for legacy-aware communities. Do you have ninety seconds?', 'You\'re back! Did you review the deck?'],
    topics: {
      self: ['I haven\'t slept since the seed round. It\'s fine. Sleep is a lagging indicator.'],
      city: ['South Park is where it all started. Every big company in this city had a desk within a block of this oval. There\'s something in the water. Probably lead.'],
      help: ['I need a lead investor for demo day. Or honestly? I need someone to tell me if demo day is ever going to happen.'],
      dead: ['Churned. I think the word is churned.']
    }
  },
  pike: {
    name: 'Capt. Ezra Pike', title: 'Pier 7', place: 'pier7', dead: true, quest: 'bells',
    look: P({ skin: 0xd8a888, hair: 0xe8e0d0, hairStyle: 'short', top: 0x1e2a44, bottom: 0x1e2a44, coat: 0x1e2a44, hat: 'wide', hatColor: 0x1a1a24, beard: true, accessory: 'cane' }),
    voice: 'Salty, formal nineteenth-century sea captain, measured and melancholy, nautical metaphors, dry wit.',
    who: 'Captain Ezra Pike, master of a Gold Rush ship abandoned in 1849 when the crew ran for the gold fields. The ship was buried under landfill where the Financial District is now, as many were (the Niantic, the General Harrison, the Rome). He died in 1852 and still walks the piers.',
    knows: 'The buried ships of Yerba Buena Cove; the old shoreline ran along Montgomery Street; landfill made the Financial District; the Embarcadero seawall.',
    wants: 'The ships\' bells: three of them, buried at Clay & Sansome, Battery & Clay, and by Folsom & the Embarcadero, to ring them once so the crews can rest.',
    guide: ['jackson', 'gunnybags', 'ferry'],
    greet: ['Ahoy. Stand easy. I was just looking for my ship. She\'s under a bank now.', 'You\'re back aboard. Good.'],
    topics: {
      self: ['Master of the barque Lucinda, out of Salem, 1849. The crew ran for the diggings before we had the sails furled. So did I, if I\'m honest.'],
      city: ['Montgomery Street was the beach. Everything east of it is fill: sand, rubble, and ships. Hundreds of ships abandoned in the cove and the city built on top of them. You walk on hulls down there.'],
      help: ['Three bells. The Niantic lies at Clay and Sansome, the General Harrison at Battery and Clay, the Rome down by Folsom, under the Embarcadero. Find where the bells sleep and ring them.']
    }
  },
  crane: {
    name: 'Silas Crane', title: 'Committee of Vigilance, Front Street', place: 'gunnybags', dead: true, duelist: true,
    look: P({ skin: 0xe0c0a0, hair: 0x3a2a1a, hairStyle: 'short', top: 0xe8e0d0, bottom: 0x2a2a2a, coat: 0x2a1e1e, hat: 'fedora', hatColor: 0x1a1414, beard: true, accessory: 'sword' }),
    voice: 'Self-righteous, menacing, cold, speaks of order and justice while itching for a fight. 1850s formality.',
    who: 'Silas Crane, member of the 1856 Committee of Vigilance, the armed mob of merchants that took over the city, hanged men, and ran its own fort ("Fort Gunnybags") of sandbags on Sacramento Street. He is dead and still judges passersby.',
    knows: 'The Vigilance Committees of 1851 and 1856, their lynchings, their fort; he believes they were right.',
    wants: 'To judge the player. Duels anyone he finds wanting.',
    guide: ['jackson'],
    greet: ['Halt. State your business in this city. We keep order here.', 'You again. The Committee has not finished with you.'],
    topics: {
      self: ['Silas Crane. In \'56 the courts were bought, so honest men took up arms. We kept the city. We hanged whom we had to.'],
      city: ['Here stood Fort Gunnybags, sandbags ten feet high, cannon at the corners. Six thousand men under arms. Law, sir, is what the determined make it.'],
      help: ['You want my approval? Defend yourself.']
    }
  },
  brock: {
    name: 'Brock Tallis', title: 'cofounder, Transit Center', place: 'salesforce', dead: true, duelist: true,
    look: P({ skin: 0xe8c4a8, hair: 0x6a4a2a, hairStyle: 'short', top: 0x3a3a44, bottom: 0x2a3440, accessory: 'sword' }),
    voice: 'Aggressive tech-bro alpha, fitness and crypto jargon, treats everything as competition, secretly insecure.',
    who: 'Brock Tallis, Wren\'s cofounder, who pushed her to keep going and then left. Died in a cold-plunge accident. He haunts the rooftop park of the Transit Center challenging people to "sparring sessions".',
    knows: 'Startup culture; the Transit Center\'s rooftop park; that he failed Wren.',
    wants: 'To win. Duels the player.',
    guide: ['southpark'],
    greet: ['Bro. You look like you\'ve never done a cold plunge. Wanna spar? Winner gets equity.', 'Round two? Let\'s gooo.'],
    topics: {
      self: ['Brock. Cofounder, athlete, investor, dad of two companies. Both dead. Like me, I guess.'],
      help: ['Spar with me. Loser admits they\'re a beta.'],
      wren: ['Wren\'s... fine. She\'s crushing it. She\'ll be fine. Why, did she say something?']
    }
  }
};

/* Words the offline voice listens for. */
export const TOPIC_WORDS = {
  vane: ['vane', 'hollis', 'father', 'dad', 'papa', 'padre'],
  mother: ['mother', 'mom', 'mama', 'mamá', 'marisela', 'madre'],
  dead: ['dead', 'die', 'died', 'ghost', 'alive', 'death', 'spirit', 'breathing'],
  remnant: ['remnant', 'keep', 'server', 'upload', 'company', 'startup', 'machine', 'record', 'data', 'computer', 'tech'],
  stairs: ['stair', 'temple', 'pyramid', 'ruin', 'glyph', 'stone', 'old people', 'ancient', 'harbor', 'harbour', 'port', 'tide door'],
  murmurs: ['murmur', 'voice', 'whisper', 'hear', 'noise', 'talking'],
  susannah: ['susannah', 'reyes', 'poet', 'drown', 'her'],
  self: ['who are you', 'yourself', 'your name', 'about you', 'your story', 'your life', 'last name'],
  where: ['where', 'go', 'next', 'direction', 'find', 'lost', 'way'],
  help: ['help', 'quest', 'job', 'need', 'favor', 'favour', 'task', 'want', 'can i do'],
  city: ['city', 'san francisco', 'neighborhood', 'history', 'street', 'here', 'mission', 'chinatown', 'north beach', 'excelsior'],
  fog: ['fog', 'karl', 'weather', 'cold', 'wind'],
  hollows: ['hollow', 'monster', 'smoke', 'shape', 'fight', 'enemy'],
  ohlone: ['ohlone', 'native', 'indigenous', 'yelamu', 'shellmound', 'tribe', 'first people'],
  sea: ['sea', 'ocean', 'water', 'swim', 'beach', 'surf'],
  door: ['door', 'open', 'let go', 'release', 'free'],
  room: ['room', 'vault', 'chair'],
  library: ['library', 'libraries', 'book', 'safe', 'rest', 'travel'],
  gil: ['gil', 'sedgwick'],
  wren: ['wren']
};

// When a character has nothing on a topic, they fall back to these, in their own manner.
export const GENERIC = {
  default: ['Hm. That\'s one way to put it.', 'Ask me something I know about. I know about a lot of things, just not that.', 'The city has a thousand answers to that and I\'ve only got a few.', 'You sound like somebody who\'s been walking too long. Sit a minute.'],
  where: ['Look at your map. Anything worth finding in this city is uphill.'],
  help: ['Help? Keep your eyes open and your hands warm. That\'s all anybody can do.']
};
