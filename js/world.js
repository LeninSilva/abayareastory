/* Yelamu: Open Your Eyes — world data: cast, screens, dialogue.
 * Map legend (11 x 13 tiles per screen):
 *  .  grass        ,  wildflowers    p  cobble path   s  sand      d  deck
 *  b  bridge deck  W  deep water     w  surf          P  pond      k  tide pool
 *  T  cypress      R  redwood        o  boulder       ^  cliff     # stone wall
 *  H  living house D  door           F  flower hedge  h  hedge     L  crystal lamp
 *  G  checkpoint   O  orange steel   X  landmark      c  crystal   Y  crystal switch
 *  Z  fog seal     V  stairway
 */
(function () {
  'use strict';

  const CAST = {
    me:      { name: 'Tolowin', skin: '#a8714a', hair: '#1c1512', hairStyle: 'tied', top: '#2f6f6a', bottom: '#5b4631', accent: '#e9d8a6' },
    nima:    { name: 'NIMA', kind: 'machine', top: '#e8e4da', accent: '#7fd6cf' },
    arm:     { name: 'The ARM', kind: 'voice' },
    sys:     { name: '', kind: 'voice' },
    emil:    { name: 'Dr. Emil Sutro', skin: '#d6b08c', hair: '#9a9a9a', hairStyle: 'short', top: '#eef0ea', bottom: '#3d5b4f', accent: '#4f8f6f' },
    adela:   { name: 'Warden Adela Sutro', skin: '#c99a73', hair: '#2a1d18', hairStyle: 'bun', top: '#243c6b', bottom: '#1b2a4a', accent: '#d8b44a' },
    maren:   { name: 'Maren Sutro', skin: '#c8926a', hair: '#5a2a1a', hairStyle: 'curls', top: '#8fae8b', bottom: '#56704f', accent: '#f08a2c' },
    eunseo:  { name: 'Grandmother Eun-seo', skin: '#dcb892', hair: '#e6e3dc', hairStyle: 'bun', top: '#3c3f7a', bottom: '#2b2d5a', accent: '#a9b8ff' },
    siwe:    { name: 'Keeper Siwe Awashi', skin: '#9c6a45', hair: '#15100d', hairStyle: 'braid', top: '#6b4a33', bottom: '#3e2c20', accent: '#7fd0c8' },
    tawi:    { name: 'Elder Tawi', skin: '#946443', hair: '#c9c4bc', hairStyle: 'braid', top: '#8a7a4e', bottom: '#5f5236', accent: '#c0472f' },
    teacher: { name: 'Magister Pilar Ocampo', skin: '#b98260', hair: '#3a2a22', hairStyle: 'short', top: '#7a4f7a', bottom: '#3f2d45', accent: '#f2d27a' },
    dario:   { name: 'Dario', skin: '#e0b894', hair: '#6a4a2a', hairStyle: 'short', top: '#d9823b', bottom: '#4a4a5a', accent: '#fff' },
    ife:     { name: 'Ifé', skin: '#6b4430', hair: '#120c0a', hairStyle: 'curls', top: '#3f8fb0', bottom: '#2c3c4c', accent: '#fff' },
    norton:  { name: 'The Norton', skin: '#e2c7a8', hair: '#6d5a48', hairStyle: 'beard', top: '#26386b', bottom: '#1c2748', accent: '#e0b84a', hat: true, ghost: true },
    guard:   { name: 'Port Warden', skin: '#b07d58', hair: '#231a15', hairStyle: 'short', top: '#1f5f63', bottom: '#183c40', accent: '#7fd0c8', cap: true },
    bram:    { name: 'Bram, a visitor', skin: '#e4bc9c', hair: '#b07a3a', hairStyle: 'short', top: '#6d5a3a', bottom: '#44382a', accent: '#9a3b2b', pack: true },
    lupe:    { name: 'Archivist Lupe Ferrer', skin: '#c08a64', hair: '#4a3a30', hairStyle: 'bun', top: '#8b5a3c', bottom: '#5a3a28', accent: '#e8d2a0' },
    luis:    { name: 'Gripman Luis', skin: '#a8754f', hair: '#2b2b2b', hairStyle: 'short', top: '#7a2a2a', bottom: '#2a2a3a', accent: '#d8b44a', cap: true },
    seventeen:{ name: 'Clerk Seventeen', kind: 'android', skin: '#e9d4bf', hair: '#dcdcdc', hairStyle: 'short', top: '#5e6f7f', bottom: '#3c4854', accent: '#7fd6cf' },
    kekoa:   { name: 'Kekoa, net-mender', skin: '#8f5f3f', hair: '#2a2a2a', hairStyle: 'short', top: '#3f6f8f', bottom: '#5a4a3a', accent: '#f0e6c8' },
    hollis:  { name: 'Hollis, bison keeper', skin: '#6f4a33', hair: '#9b9b9b', hairStyle: 'short', top: '#6f7f3f', bottom: '#4a4a2a', accent: '#c9a04a', cap: true },
    poppy:   { name: 'Poppy', skin: '#d9a47c', hair: '#8a3a1a', hairStyle: 'tied', top: '#f08a2c', bottom: '#5a4a8a', accent: '#fff', small: true },
    bison:   { name: 'Bison', kind: 'bison' },
    ossie:   { name: 'Ossie, harp tender', skin: '#c49a7c', hair: '#d8d0c0', hairStyle: 'short', top: '#4f6f5f', bottom: '#3a4a3a', accent: '#e0e0a0' },
    tamsin:  { name: 'Warden Tamsin', skin: '#8e6040', hair: '#1a1a1a', hairStyle: 'bun', top: '#1f5f63', bottom: '#183c40', accent: '#d8b44a', cap: true },
    sign:    { name: 'Sign', kind: 'sign' }
  };

  const f = (g, k) => !!g.save.flags[k];
  const shards = g => g.save.shards.length;

  /* ---------------- Memory shards ---------------- */
  const MEMORIES = {
    1: { title: 'The Aura', place: 'Lands End', lines: [
      'Burning oranges. It always began with burning oranges — a smell no one else could smell — and a warm tide rising from my stomach into my throat. Then the room became a room I had already lived in.',
      'Dr. Imelda Castro held the angiogram up to the window. "A tangle," she said. "Arteries emptying straight into veins, with no capillaries between them. Left temporal lobe: the temporal pole and the front of the middle and inferior temporal gyri. Six point four centimeters."',
      '"Spetzler–Martin grade three. Size over six centimeters scores three. It spares your language cortex and the visual fibers of Meyer\'s loop, so zero for eloquence. It drains into surface veins, not deep ones, so zero there. Three in all."',
      '"Surgery is possible. The risk is not small." I asked about the other option. She did not like the other option.'
    ]},
    2: { title: "Grandmother's Lens", place: 'Glen Canyon', lines: [
      'Grandmother Awashi\'s hands smelled of creek water and stone dust. She set a clear crystal from Tuyshtak on my school slate, and every letter doubled.',
      '"Light is two travelers," she said. "This stone makes them take different roads." My teacher called it birefringence. Grandmother called it listening.',
      'She tilted a polished lens toward the sun until a dry tule stem began to smoke. "Our ancestors made fire this way. Your grandchildren will make suns."'
    ]},
    3: { title: 'The Consent', place: 'The Presidio', lines: [
      'The Long Sleep Registry smelled of cypress and cold steel. I signed with my left hand shaking. The seizures had grown to three a week.',
      'The protocol: my blood replaced, slowly, with a cryoprotectant solution so concentrated that the water in my cells could never become ice. Cooled until I was glass. Stored in liquid nitrogen at minus one hundred ninety-six degrees.',
      '"Vitrifying you is the easy part," the technician said. "Rewarming you without cracking the glass — nobody knows how to do that yet." I told her I would wait for somebody who did.'
    ]},
    4: { title: 'The Last Sunset', place: 'Bernal Heights', lines: [
      'Ahwa and I climbed Bernal Hill the night before. My little sister: sixteen, fierce, and furious with me for leaving.',
      'The fog poured through the Golden Gate like milk through a door. "Promise you\'ll come back," she said. I said I would try to come back to her grandchildren.',
      '"Then I\'ll tell them to wait for you," she said. Twenty-eight generations later, one of them still was.'
    ]},
    5: { title: 'The Name', place: 'Mount Davidson shellmound', lines: [
      'I was seven. The shellmound was warm from the afternoon, and the old ones were singing the tide songs.',
      'My grandmother drew a line of red ochre across my wrist. "Tolowin. It is not an old word. I made it for you. It means the one who waits for the tide to turn."',
      '"Everyone waits for something," she said. "Waiting well is a kind of work."'
    ]}
  };

  /* ---------------- Screens ---------------- */
  const S = {};

  S['0,0'] = {
    name: 'Lands End', sub: 'Sutro Baths ruins', grass: '#56804a', mood: 'fog',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWYWWW',
      'WWWWWWWWWWW',
      'WWwwwwwwwww',
      'WWwss^^.^TT',
      'WWwsZ.....p',
      'WWw^^.,.T.p',
      'WWwXXX...pp',
      'WWwXXX.T...',
      'WWw^.....T.',
      'WWww^..,..T',
      'WWWw^T..T.T',
      'WWWw^.pp.TT'
    ],
    landmarks: [{ type: 'sutroBaths', x: 3, y: 7, w: 3, h: 2 }],
    enemies: [['wisp', 2], ['fog', 1]],
    shard: { id: 1, x: 3, y: 4 },
    npcs: [
      { id: 'sign', x: 8, y: 9, talk: () => [['sign', 'LANDS END. Sutro Baths ruin, 1896–1966 in the old reckoning; kept as a tide garden. A fog seal was set on the shelf below the cliff long ago. Its crystal key stands in the surf to the north.']] }
    ]
  };

  S['1,0'] = {
    name: 'The Presidio', sub: 'Golden Gate Port of Entry', grass: '#4e7a45', mood: 'fog',
    map: [
      'WWWObbbOWWW',
      'WWWObbbOWWW',
      'wwwOGGGOwww',
      'sss.ppp.sss',
      'TT..ppp..TT',
      'T...ppp...T',
      'ppppppppppp',
      '..,.ppp.,..',
      'TT..ppp..TT',
      'RT.......TR',
      'T..R.,.R..T',
      'RT..ppp..TR',
      'RRT.ppp.TRR'
    ],
    landmarks: [{ type: 'ggTower', x: 3, y: 0, w: 5, h: 3 }],
    enemies: g => f(g, 'bossDone') ? [] : [['crawler', 3], ['wisp', 1]],
    shard: { id: 3, x: 5, y: 10, whenClear: true },
    npcs: [
      { id: 'guard', x: 8, y: 3, talk: g => [
        ['guard', 'Golden Gate Port of Entry. Outbound travel needs a Warden\'s exit seal. Your tide-band says provisional resident, so: no seal, no crossing.'],
        ['guard', 'Inbound visitors surrender the papers of their home state, take a health scan, and state their purpose. Tourists get thirty days. Workers for the ARM can stay.'],
        ['guard', 'The span is the same steel your century knew, repainted in International Orange every year. Walkers, bicycles, horses and sail-carts. Never an engine.'],
        ...(f(g, 'bossDone') ? [] : [['guard', 'Careful in the grove. Old Iron crawlers wander down from the Registry ruins. Steam relics, from before the Compact banned engines that move.']])
      ]},
      { id: 'maren', x: 7, y: 4, when: g => f(g, 'bossDone'), talk: g => [
        ['maren', 'Look. The fog is coming in under the deck. In a minute the towers will be floating.'],
        ['maren', 'My mother signed your residency this morning. "Listener." She said the word like it tasted strange. Then she almost smiled.'],
        ['me', 'A year ago I could not remember my own name.'],
        ['maren', 'And now?'],
        ['me', 'Now I know it, and I know yours. That is a good start for a year.'],
        ['maren', 'Walk me home the long way, Tolowin. Past the windmill. There is no hurry anymore.']
      ]},
      { id: 'emil', x: 3, y: 7, when: g => f(g, 'bossDone'), talk: () => [
        ['emil', 'I came to see the fog, not to chaperone. Mostly.'],
        ['emil', 'Seven hundred thirty-two years in glass and one year of growing back. Whatever the ARM saw in you, I see it too now.']
      ]}
    ]
  };

  S['2,0'] = {
    name: 'The Marina', sub: 'Palace of Fine Arts', grass: '#5d8c4d', mood: 'sun',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWWWWW',
      'wwwwwwwwwww',
      'sssssssssss',
      '...........',
      '..PPP..XXX.',
      '..PPP..XXX.',
      '...P...XXX.',
      ',,.....ppp.',
      'TT.ppppp..T',
      'T..p.....,T',
      '...p..T....',
      'T..ppp...TT'
    ],
    landmarks: [{ type: 'palace', x: 7, y: 5, w: 3, h: 3 }],
    enemies: [['wisp', 2]],
    npcs: [
      { id: 'maren', x: 5, y: 7, when: g => f(g, 'metMother') && !f(g, 'summitOpen'), talk: g => {
        const n = shards(g);
        const lines = [
          ['maren', 'You found me. My mother would call this place "unmeasured." I call it my lunch hour.'],
          ['maren', 'The Palace was built in 1915 for a fair, out of plaster meant to crumble in a year. The city kept rebuilding it anyway. Some things you keep because you love them, not because they pass an audit.']
        ];
        if (n < 5) lines.push(['maren', `You have ${n} of your memories back. Find the rest. Not for my parents. For you.`]);
        if (!f(g, 'marenPoem')) {
          lines.push({ who: 'maren', ask: 'Can I ask you something strange? When you look at me, do you remember anything?', options: ['Nothing. That is what scares me.', 'Your face feels like a word I almost know.'],
            then: (g, i) => { g.save.flags.marenPoem = true; return i === 0
              ? [['maren', 'Good. Then whatever you feel is new. Nobody grew it for you. Not even the ARM.']]
              : [['maren', '…You cannot say things like that on a Tuesday, Tolowin. Go. Find your memories before I say something my mother would have to sign.']]; } });
        }
        return lines;
      }},
      { id: 'sign', x: 2, y: 8, talk: () => [['sign', 'PALACE OF FINE ARTS. Rebuilt 1965 and 2402. Lagoon habitat for the western pond turtle. Please do not feed the swans the Compact.']] }
    ]
  };

  S['3,0'] = {
    name: 'North Beach', sub: 'Coit Spire and Telegraph Hill', grass: '#5a8a4b', mood: 'sun',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWWWWW',
      'wwwwwwwwwww',
      'sssss..ssss',
      '..HH..^^^..',
      '..HD.^XX^..',
      '....^^XX^..',
      'ppppp.pp.pp',
      '..HH..p..HH',
      '..HD..p..DH',
      '.,...ppp...',
      'TT...p...TT',
      'T...ppp...T'
    ],
    landmarks: [{ type: 'alcatraz', x: 6, y: 0, w: 3, h: 2 }, { type: 'coit', x: 6, y: 5, w: 2, h: 2 }],
    enemies: [['wisp', 1]],
    npcs: [
      { id: 'luis', x: 4, y: 9, talk: () => [
        ['luis', 'Hold the rail! Ah, you are on foot. Pity. The cable cars never stopped running, you know.'],
        ['luis', 'Andrew Hallidie ran the first line in 1873 with a steam engine turning the cable in a powerhouse. Steam that stays in one place, pulling a rope: the Compact allowed that.'],
        ['luis', 'Since 2034 the powerhouses run on Lantern current. Same grip, same bell. My great-great-great-grandmother rang it the same way.']
      ]},
      { id: 'sign', x: 9, y: 7, talk: () => [['sign', 'COIT SPIRE on Telegraph Hill. The old concrete tower now carries a Tuyshtak crystal crown that stores the day\'s light. Across the water: Alcatraz, a seabird sanctuary since 1972 in every reckoning that matters.']] }
    ]
  };

  S['4,0'] = {
    name: 'The Embarcadero', sub: 'Ferry Building Port of Entry', grass: '#5a8a4b', mood: 'sun',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWWWWW',
      'wwwwwwwwWWW',
      'ssssss.wwWW',
      'pppppp.XXXw',
      'pppppp.XXXw',
      'ppppppLXXXw',
      'pppppp.XXXw',
      'pppppppbbbb',
      '..L...pwwWW',
      '.....ppwWWW',
      'TT...pwwWWW',
      'T...ppwWWWW'
    ],
    landmarks: [{ type: 'ferry', x: 7, y: 4, w: 3, h: 4 }],
    enemies: [],
    npcs: [
      { id: 'guard', x: 6, y: 5, talk: () => [
        ['guard', 'Ferry Building Port of Entry. Sail-ferries from Sausalito, the Delta Republic and the Cascadian Leagues dock here twice a day.'],
        ['guard', 'Visitors: home papers in the tray, then the scan. We keep your papers until you leave. You wear the tide-band while you are here. It counts your days.'],
        ['guard', 'Please queue behind the pelicans. They have seniority.']
      ]},
      { id: 'bram', x: 3, y: 9, talk: () => [
        ['bram', 'First time in the Free City? Me too. Came down from the Cascadian Leagues on a sail-ferry. Nine days.'],
        ['bram', 'Back home we burn wood, wait for letters, and argue about the harvest. Here the lamps never flicker and nobody pays for anything. There is no money at all. I tried to tip a fruit seller and she looked at me like I had offered her a tooth.'],
        ['bram', 'They say the rest of us are uncivilized. Maybe. But the ARM is not allowed to leave this peninsula, so what are we supposed to do? Grow our own?']
      ]}
    ]
  };

  S['0,1'] = {
    name: 'Sutro Heights', sub: 'The Sutro house above the Cliff House', grass: '#56834a', mood: 'dusk',
    map: [
      'WWWw..ppp.T',
      'WWWw......T',
      'WWw^.hhhhh.',
      'WWw^.hXXXh.',
      'WWw^.hXXXh.',
      'WWw^..,p,..',
      'WWws.pppppp',
      'WWws..,.,..',
      'WWws.F.F.F.',
      'WWws.......',
      'WWwsT..T..T',
      'WWws..ppp..',
      'WWws..ppp..'
    ],
    landmarks: [{ type: 'sutroHouse', x: 6, y: 3, w: 3, h: 2 }],
    enemies: [],
    npcs: [
      { id: 'adela', x: 5, y: 5, when: g => f(g, 'metMaren'), talk: g => {
        if (f(g, 'bossDone')) return [
          ['adela', 'The Compact asks us to measure what a thing costs the living, and what it returns. I measured you wrong, Tolowin.'],
          ['adela', 'My mother reminded me that she was once the stranger at the door. I did not enjoy being reminded. She was right anyway.'],
          ['adela', 'Dinner is at seven. We do not wait.']
        ];
        if (!f(g, 'metMother')) return [
          ['adela', 'You are standing on Sutro land, revived man.'],
          ['adela', 'I am Adela Sutro, Warden of the Compact of Living Measure. I sign the entries at the Bay Bridge. I know exactly what it costs to let someone in.'],
          ['maren', 'Mother—'],
          ['adela', 'You were a guest of the future, Tolowin. Guests do not court the host\'s daughter.'],
          ['adela', 'Your residency is provisional. You are not ARM-born and not ARM-bound. You remember nothing, not even whether you are kind.'],
          ['adela', 'Go back to Parnassus. My husband woke you. Let him decide what you are for.'],
          { do: g => { g.save.flags.metMother = true; } }
        ];
        return [['adela', 'You are still here. The fog has better manners than you.']];
      }},
      { id: 'maren', x: 9, y: 5, when: g => f(g, 'metMaren') && !f(g, 'metMother'), talk: () => [
        ['maren', 'You came. I wanted to show you the Farallon lights, thirty miles out. On clear nights you can see the lighthouse keepers\' lanterns.'],
        ['maren', 'But my mother is on the terrace. She has seen you. Be polite. Be very polite.']
      ]},
      { id: 'maren', x: 9, y: 5, when: g => f(g, 'metMother') && !f(g, 'metFather'), talk: () => [
        ['maren', 'I am sorry. She guards borders for a living and forgets to stop at the door.'],
        ['maren', 'My father, Emil, was your revival physician. He is gentler. Mostly. Go and see him at Parnassus.']
      ]}
    ]
  };

  S['1,1'] = {
    name: 'Golden Gate Park', sub: 'Murphy Windmill and the bison paddock', grass: '#4f8645', mood: 'sun',
    map: [
      'TRT.ppp.TRT',
      'R........TR',
      'T.XX..FFFF.',
      '..XX..F..F.',
      '......F..F.',
      '.,....FFFF.',
      'ppppppppppp',
      '..,....,...',
      'T..PPP...RT',
      'R..PPP....T',
      'T.........R',
      'RT..ppp..TR',
      'RRT.ppp.TRR'
    ],
    landmarks: [{ type: 'windmill', x: 2, y: 2, w: 2, h: 2 }],
    enemies: [['wisp', 2]],
    npcs: [
      { id: 'bison', x: 7, y: 4, talk: () => [['sys', 'The bison regards you with enormous, unhurried patience. It has seen stranger things than you. Probably.']] },
      { id: 'hollis', x: 5, y: 4, talk: () => [
        ['hollis', 'The paddock has held bison since 1891. These are that herd\'s great-great-many-times grandcalves.'],
        ['hollis', 'The windmill there pumps groundwater for the whole west end of the park. In your time it was decorative, I hear. Now it is decorative and it works.']
      ]},
      { id: 'poppy', x: 1, y: 7, talk: () => [
        ['poppy', 'You are the frozen man! Were you cold? Did you dream? Did you have a car?'],
        ['me', 'What is a car?'],
        ['poppy', 'I do not know either! Magister Ocampo says it was a room with wheels that burned old plants. Nobody ever built one here.']
      ]}
    ]
  };

  S['2,1'] = {
    name: 'Conservatory of Flowers', sub: 'Academy of the Living Logos', grass: '#548c49', mood: 'sun',
    map: [
      'T..F.p.F..T',
      '..,.....,..',
      '.F.XXXXX.F.',
      '.F.XXXXX.F.',
      '...XXXXX...',
      '.....p.....',
      'ppppppppppp',
      '.F..,.,..F.',
      '.F.L...L.F.',
      '....ddd....',
      ',...ddd...,',
      'T...ppp...T',
      'TT..ppp..TT'
    ],
    landmarks: [{ type: 'conservatory', x: 3, y: 2, w: 5, h: 3 }],
    enemies: [],
    npcs: [
      { id: 'teacher', x: 5, y: 8, dir: 'down', talk: g => {
        if (!f(g, 'woke')) return [];
        if (!f(g, 'classDone')) return [
          ['teacher', 'Ah, our long sleeper. Sit, sit. Today\'s lesson: the Logos of Living Things.'],
          ['teacher', 'An axolotl loses a leg. Within days a blastema forms, a bud of cells that remember where they belong, and the leg grows back. Bone, muscle, nerve, skin.'],
          ['teacher', 'The ARM learned to read that memory, molecule by molecule, and to speak it to human cells.'],
          ['teacher', 'That is how it regrew the part of your left temporal lobe that once held a tangle of vessels. Class, this is Tolowin. He is what healing looks like.'],
          ['teacher', 'Maren, share your slate with him, please.'],
          { do: g => { g.save.flags.classDone = true; } }
        ];
        return [
          ['teacher', 'Shannon taught us that information is surprise, measured in bits. Landauer taught us that forgetting a single bit must shed a little heat.'],
          ['teacher', 'So forgetting is never free, Tolowin. Nor is remembering. Be patient with yourself.']
        ];
      }},
      { id: 'maren', x: 6, y: 9, when: g => !f(g, 'metMother'), talk: g => {
        if (!f(g, 'classDone')) return [['maren', 'Shh. Magister Ocampo is about to start. Talk to her first.']];
        if (f(g, 'metMaren')) return [['maren', 'Sutro Heights, at dusk. West, past the windmill, where the cliffs meet the ocean.']];
        return [
          ['maren', 'You are the one from 2026. Sorry. Everyone has been whispering about you all week. I am Maren.'],
          ['me', '(Her face. I have never seen it before, and it still feels like a word on the tip of my tongue.)'],
          { who: 'maren', ask: 'What was it like? The world before the Lantern?', options: ['I don\'t remember. Tell me about yours.', 'Loud, I think. Full of waiting.'],
            then: (g, i) => i === 0
              ? [['maren', 'Mine? Quiet. Measured. Everything needs a permit, even a wind turbine\'s shadow on a meadow. Sometimes I want something nobody has audited.']]
              : [['maren', 'Waiting. My grandmother says that about her own childhood. She would like you. My parents, less so.']] },
          ['maren', 'Meet me at Sutro Heights at dusk. My family\'s house is on the cliffs, west past the windmill. I will show you the Farallon lights.'],
          { do: g => { g.save.flags.metMaren = true; } }
        ];
      }},
      { id: 'dario', x: 4, y: 9, dir: 'up', talk: () => [['dario', 'Did you really have money? Little metal disks you traded for bread? What if you ran out of disks? Did you just... not eat?']] },
      { id: 'ife', x: 4, y: 10, dir: 'up', talk: () => [['ife', 'The ARM says order always costs energy. Shannon says information is surprise. Magister says love is both. I think Magister is showing off.']] }
    ]
  };

  S['3,1'] = {
    name: 'Civic Center', sub: 'Norton Hall, seat of the ARM', grass: '#58884a', mood: 'sun',
    map: [
      'HH..ppp..HH',
      'HD..ppp..DH',
      '...hhhhh...',
      '..hXXXXXh..',
      '..hXXXXXh..',
      '..hXXXXXh..',
      'ppppp.ppppp',
      '..,.ppp.,..',
      '.L.......L.',
      'HH.......HH',
      'HD..,.,..DH',
      '....ppp....',
      'T...ppp...T'
    ],
    landmarks: [{ type: 'cityHall', x: 3, y: 3, w: 5, h: 3 }],
    enemies: [],
    npcs: [
      { id: 'norton', x: 5, y: 8, talk: g => {
        const lines = [
          ['norton', 'NORTON THE FIRST, by grace of the ARM Emperor of these United— ahem. Welcomer of Yelamu. The office is ceremonial. The hat is not.'],
          ['norton', 'In 1872 the original Norton decreed that a bridge be built from Oakland to Yerba Buena Island. They laughed. They built it. The city kept his name for the office of welcome.'],
          ['norton', 'I am an avatar of the ARM wearing his coat. The citizens find it reassuring. The ARM finds it... instructive.'],
          ['norton', 'The Free City keeps three ports of entry: the Golden Gate, the Bay Bridge and the Ferry Building. Visitors surrender their home papers and wear a tide-band. Residency is for those who work with the ARM or within it.']
        ];
        if (shards(g) >= 3 && !f(g, 'heartNorton')) lines.push(
          ['norton', 'Three memories returned! By imperial decree, a vessel for your heart.'],
          { do: g => { g.save.flags.heartNorton = true; g.addHeart(); } },
          ['sys', 'You received a HEART VESSEL. Your maximum hearts increased.']
        );
        return lines;
      }},
      { id: 'seventeen', x: 8, y: 7, talk: () => [
        ['seventeen', 'Good afternoon. I am Clerk Seventeen: ceramic, collagen, and a little copper. I was grown in 2701.'],
        ['seventeen', 'Humans ask me if I dream. I ask them the same question. They become nervous.'],
        ['seventeen', 'The engineers can read every weight inside the ARM and still cannot say exactly why it chooses what it chooses. What they can say is that, so far, it has always chosen us.']
      ]}
    ]
  };

  S['4,1'] = {
    name: 'Rincon Point', sub: 'Bay Bridge Port of Entry', grass: '#57874a', mood: 'sun',
    map: [
      '...ppp.wWWW',
      '....p..wWWW',
      'HH..p..sWWW',
      'HD..p..swWW',
      '....p..OOOO',
      'pppppppGbbb',
      'pppppppGbbb',
      'pppppppGbbb',
      '....p..OOOO',
      'HH..p..swWW',
      'HD..p..swWW',
      '....p..sWWW',
      '...ppp.wWWW'
    ],
    landmarks: [{ type: 'bayBridge', x: 7, y: 3, w: 4, h: 7 }],
    enemies: [],
    npcs: [
      { id: 'guard', x: 6, y: 4, talk: () => [
        ['guard', 'Bay Bridge Port of Entry. Warden Adela Sutro signs the entries here. Yes, that Sutro.'],
        ['guard', 'Across the water: Yerba Buena Island, then the East Bay, and in the hills beyond them Tuyshtak, the mountain the settlers called Diablo. The crystal quarries there are worked under Compact permit.'],
        ['guard', 'Past the quarries, the Outlands. They have villages, harvests, fevers. We send them medicine in sealed crates. The ARM itself may not cross this bridge. Article Nine.']
      ]}
    ]
  };

  S['0,2'] = {
    name: 'Ocean Beach', sub: 'The long Pacific shore', grass: '#6a9152', mood: 'fog',
    map: [
      'WWws..pp...',
      'WWws.......',
      'WWwss..,...',
      'WWwss...T..',
      'WWwsss.....',
      'WWwsss.....',
      'WWwsssppppp',
      'WWwsss.....',
      'WWwsss..,..',
      'WWwss...T..',
      'WWwss......',
      'WWwss.ppp..',
      'WWwss.ppp..'
    ],
    landmarks: [],
    enemies: [['wisp', 2]],
    npcs: [
      { id: 'kekoa', x: 3, y: 8, talk: () => [
        ['kekoa', 'Salmon are back at the old counts, the ones in the Mission archive from before the gold rush.'],
        ['kekoa', 'In 1901 the Compact gave the rivers standing to sue. A river won its first case in 1903. Against a mill.'],
        ['kekoa', 'Mind the Static. It drifts in with the fog lately. Sour little things. Your staff will sort them out.']
      ]}
    ]
  };

  S['1,2'] = {
    name: 'Parnassus', sub: 'The Garden Ward of the ARM', grass: '#5a8e4c', mood: 'sun',
    map: [
      'RT..ppp..TR',
      'T..........',
      '..XXXXXXX..',
      '..XXXXXXX..',
      '..XXXXXXX..',
      '..L.ppp.L..',
      'ppppppppppp',
      '.F,F.p.F,F.',
      '.FFF.p.FFF.',
      '.....p.....',
      'T,.......,T',
      'RT..ppp..TR',
      'RRT.ppp.TRR'
    ],
    landmarks: [{ type: 'medCenter', x: 2, y: 2, w: 7, h: 3 }],
    enemies: [],
    onEnter: g => f(g, 'woke') ? null : 'nima',
    npcs: [
      { id: 'nima', x: 4, y: 7, dir: 'up', talk: g => {
        if (!f(g, 'woke')) return [
          ['arm', '…Tolowin. Your heart rate says you can hear me.'],
          ['nima', 'Do not hurry. Your left temporal lobe is one year old. It is still learning where it keeps things.'],
          ['nima', 'Open your eyes. Slowly. There: fog, sky, a eucalyptus— no. A cypress. We removed the last eucalyptus in 2311.'],
          ['me', 'Where… What year is it?'],
          ['nima', 'The year 2759. You were vitrified in 2026 and rewarmed in 2758, seven hundred thirty-two years later. You have spent the past year growing back.'],
          ['nima', 'I am NIMA, a caretaker of the ARM, the Artificial Reasoning Machine. This is the Parnassus Garden Ward in the Free City of Yelamu–San Francisco.'],
          ['me', 'I do not remember anything. Only my name.'],
          ['nima', 'That is expected. Much of memory lives in the connections we had to rebuild. The ARM detects echoes of yours, crystallized in places your mind loved. They may come back.'],
          { do: g => { g.save.flags.woke = true; g.save.items.staff = true; g.save.items.band = true; } },
          ['sys', 'You received the TIDE BAND, your residency record, and a LUMEN STAFF tipped with Tuyshtak quartz.'],
          ['nima', 'The staff scatters Static: small pockets of disorder that drift through the city. We do not fully understand them. Press A (or Z / Space) to swing.'],
          ['nima', 'Your re-integration class meets at the Conservatory of Flowers, north through the park. Go and learn the world again.']
        ];
        if (f(g, 'bossDone')) return [['nima', 'Your vitals are excellent. Your temporal lobe reports… contentment? I will log it as contentment.'], { do: g => g.heal() }];
        return [
          ['nima', 'Let me check you. Pulse steady. Cortex well perfused. There, I have restored your strength.'],
          { do: g => g.heal() },
          ['nima', 'Current guidance: ' + g.objective()]
        ];
      }},
      { id: 'emil', x: 7, y: 9, when: g => f(g, 'metMother'), talk: g => {
        if (!f(g, 'metFather')) return [
          ['emil', 'So. You have met my wife. And my daughter, I hear.'],
          ['emil', 'I led your rewarming. Iron-oxide nanoparticles through every vessel, then a radio-frequency field so you warmed evenly, from the inside, all at once. Seven hundred thirty-two years in glass and not a single fracture.'],
          ['emil', 'The tangle in your left temporal lobe, the ARM fixed at the root: a single KRAS mutation in the cells lining those vessels. We corrected it, and the vessels relearned how to become capillaries.'],
          ['emil', 'As a patient, I am proud of you. As a son-in-law, I have no data.'],
          ['emil', 'Here is my proposal. Recover your memories. The ARM counts five echoes. Know who you were before you ask anyone to decide who you are.'],
          ['emil', 'And one more thing. Static is thickening around the Resonance Mast on Twin Peaks, and the ARM cannot compress it. The wardens will not open the summit to anyone with fewer than five echoes attuned.'],
          ['emil', 'See Keeper Siwe at the Lens Works in Hunters Point, in the southeast. She can fit your staff with a prism. She asked about you, actually. Strange woman. Brilliant.'],
          { do: g => { g.save.flags.metFather = true; } }
        ];
        if (f(g, 'bossDone')) return [['emil', 'The ARM filed your occupation as "Listener." I do not know what it means. I suspect the ARM only half knows. Welcome, Tolowin. Officially.']];
        return [['emil', `Five echoes, Tolowin. You have ${shards(g)}. Try the places a young man would have loved: the cliffs, the canyons, the hills, the old groves.`]];
      }}
    ]
  };

  S['2,2'] = {
    name: 'Twin Peaks', sub: 'Road to the Resonance Mast', grass: '#a09a57', mood: 'gold',
    map: [
      '^^..ppp..^^',
      '^..,ppp^^^^',
      '^.^^.p.^V^^',
      '^.^^.p.^G^^',
      '....ppppp..',
      ',....p.....',
      'ppppppppppp',
      '..^^.p.^^..',
      '.^^^.p.^^^.',
      '.^^..p..^^.',
      '..,..p..,..',
      'T...ppp...T',
      'TT..ppp..TT'
    ],
    landmarks: [],
    enemies: g => f(g, 'bossDone') ? [['wisp', 1]] : [['wisp', 3]],
    gate: g => f(g, 'summitOpen'),
    warps: [{ x: 8, y: 2, to: 'summit', tx: 5, ty: 11, dir: 'up' }],
    npcs: [
      { id: 'tamsin', x: 9, y: 4, talk: g => {
        if (f(g, 'bossDone')) return [['tamsin', 'Listen. The Mast is ringing clean again. You can hear it in your teeth.']];
        if (f(g, 'summitOpen')) return [['tamsin', 'The gate is open. Up the stairs. I will be here.']];
        if (shards(g) < 5) return [
          ['tamsin', 'The summit is sealed. The Static up there is thick enough to taste.'],
          ['tamsin', `Dr. Sutro sent word: five memory echoes attuned, or no one goes up. You carry ${shards(g)}.`]
        ];
        return [
          ['tamsin', 'Your echoes are singing. All five. I have never heard a person resonate like that.'],
          ['tamsin', 'Go on up. The ARM says the Static at the Mast will not compress. Maybe it needs something that is not the ARM.'],
          { do: g => { g.save.flags.summitOpen = true; g.refreshScreen(); } },
          ['sys', 'The summit gate swings open.']
        ];
      }},
      { id: 'maren', x: 7, y: 5, when: g => f(g, 'summitOpen') && !f(g, 'bossDone'), talk: () => [
        ['maren', 'I came to see you off. My mother does not know. My father does, which is worse, because he packed you a lunch.'],
        ['maren', 'Come back down, Tolowin. You have done enough waiting for one lifetime.']
      ]}
    ]
  };

  S['3,2'] = {
    name: 'The Mission', sub: 'Mission Dolores Archive', grass: '#5d8f4b', mood: 'sun',
    map: [
      'HH..ppp..HH',
      'HD..ppp..DH',
      '...........',
      '.T.XXXX.T..',
      '...XXXX....',
      '....pp.....',
      'ppppppppppp',
      '.,.......,.',
      '.T.hhhhh.T.',
      '...h,,,h...',
      '...h,,,h...',
      'T...ppp...T',
      '....ppp....'
    ],
    landmarks: [{ type: 'mission', x: 3, y: 3, w: 4, h: 2 }],
    enemies: [['wisp', 1]],
    npcs: [
      { id: 'lupe', x: 7, y: 5, talk: () => [
        ['lupe', 'Welcome to the Archive. The Mission holds the original Compact of Living Measure, ratified in 1852 by the Yelamu council and the settlers who needed their water.'],
        ['lupe', 'Article Four is the Ladder of Measures. Every new power climbs it rung by rung. It must show that it takes no more from land, water and air than it returns.'],
        ['lupe', 'Steam: allowed for pumps and mills, refused for locomotion at the Tuolumne hearing of 1861. Coal: refused in 1868, for the lungs of children. Rail: cable and electric only, from 1873.'],
        ['lupe', 'The combustion carriage was refused in 1896 and at every petition since. So no, you never saw an automobile. Nobody here ever did.'],
        ['lupe', 'Article Nine came much later: "No mind shall be larger than its reason, nor travel farther than its care." That is why the ARM stays on this peninsula.']
      ]},
      { id: 'sign', x: 4, y: 7, talk: () => [['sign', 'MISSION DOLORES, founded 1776. Adobe walls four feet thick. Beneath the garden rest thousands of Ohlone people who built them. Their names are read aloud here every June.']] }
    ]
  };

  S['4,2'] = {
    name: 'Mission Creek', sub: 'Tide gardens and houseboats', grass: '#5b8c4c', mood: 'sun',
    map: [
      '...ppp.wWWW',
      '..,.p..wWWW',
      '....p..swWW',
      'PPPPbPPPwWW',
      'PPPPbPPPPWW',
      '....p..swWW',
      'pppppp.sswW',
      '....p..sswW',
      '.HH.p..ssWW',
      '.HD.p...sWW',
      '....p.,.sWW',
      'T..ppp..sWW',
      '...ppp..wWW'
    ],
    landmarks: [],
    enemies: [['crawler', 2]],
    npcs: [
      { id: 'sign', x: 6, y: 5, talk: () => [['sign', 'MISSION CREEK TIDE GARDENS. Eelgrass beds restored 2140. Houseboat moorings by lottery. Old Iron crawlers sighted near the creek: report to the Wardens.']] }
    ]
  };

  S['0,3'] = {
    name: 'Lake Merced', sub: 'Tule reeds by the southern Greenwall', grass: '#5a8b4d', mood: 'fog',
    map: [
      'WWws..ppp..',
      'WWws.......',
      'WWws.PPPP..',
      'WWws.PPPPP.',
      'WWws.PPPPP.',
      'WWws..PPP..',
      'WWws..,.ppp',
      'WWws.......',
      'WWws..T..T.',
      'WWws.......',
      'WWws..T....',
      'WWw########',
      'WWw###GG###'
    ],
    landmarks: [{ type: 'tuleBoat', x: 6, y: 3, w: 2, h: 1 }, { type: 'greenwall', x: 3, y: 11, w: 8, h: 2 }],
    enemies: [['wisp', 1]],
    npcs: [
      { id: 'eunseo', x: 9, y: 5, talk: g => {
        if (f(g, 'heartEunseo')) return [
          ['eunseo', 'The old ones built those boats from tule, bundled bulrush. They still float. So do old ideas, if you tie them tight enough.']
        ];
        return [
          ['eunseo', 'You must be the young man Maren talks about while pretending she is not talking about anyone.'],
          ['eunseo', 'I am her grandmother. Adela\'s mother. I was grown, not born. One of the first Elemental-born, in 2689.'],
          ['eunseo', 'Carbon, hydrogen, oxygen, nitrogen, calcium, phosphorus, a little sulfur, a whisper of iron. The ARM wrote a genome no one had ever carried, and a glass womb carried it for nine months.'],
          ['eunseo', 'I had no parents. No cousins. No one to tell me I had my mother\'s hands. So I made a family the old way: I fell in love with someone who was born.'],
          ['eunseo', 'Adela forgets that her own mother was once the stranger at the door. Here. It was the first gift anyone ever gave me.'],
          { do: g => { g.save.flags.heartEunseo = true; g.addHeart(); } },
          ['sys', 'You received a HEART VESSEL. Your maximum hearts increased.']
        ];
      }},
      { id: 'sign', x: 8, y: 10, talk: () => [['sign', 'SOUTHERN GREENWALL. Border of the Free City. No crossing without a Warden\'s seal. Beyond: the Outlands of San Mateo.']] }
    ]
  };

  S['1,3'] = {
    name: 'Mount Davidson', sub: 'The redwood grove and shellmound', grass: '#46723f', mood: 'fog',
    map: [
      'RRT.ppp.TRR',
      'R.........R',
      'T..RR.RR..T',
      'R.R.....R.R',
      '..R.XXX.R..',
      '....XXX....',
      'ppppppppppp',
      '..R.....R..',
      'T..R.,.R..T',
      'R.........R',
      'RT.......TR',
      '###########',
      '###########'
    ],
    landmarks: [{ type: 'shellmound', x: 4, y: 4, w: 3, h: 2 }, { type: 'greenwall', x: 0, y: 11, w: 11, h: 2 }],
    enemies: [['fog', 2]],
    npcs: [
      { id: 'tawi', x: 7, y: 5, talk: g => {
        const lines = [
          ['tawi', 'Sit with me at the shellmound. Five thousand years of oyster shells, one family\'s meals at a time. A mound like this is a library.'],
          ['tawi', 'When the Compact was written, our people insisted on one line above all: measure a thing by what it costs the living. They measured the steam engine against the creek it would foul.'],
          ['tawi', 'They measured the automobile against the air. It never passed.']
        ];
        if (!g.hasShard(5)) lines.push(
          ['tawi', 'You carry your name but not its meaning. Hold out your staff.'],
          { do: g => g.collectShard(5) }
        );
        else lines.push(['tawi', 'Waiting well is a kind of work, Tolowin. You have done more of it than anyone alive.']);
        return lines;
      }}
    ]
  };

  S['2,3'] = {
    name: 'Glen Canyon', sub: 'Islais Creek', grass: '#5b874a', mood: 'sun',
    map: [
      '^^..ppp..^^',
      '^...ppp...^',
      '^.o..p..o.^',
      '^.....PP..^',
      '^.o..PP..o^',
      '...PP......',
      'pppbbpppppp',
      '..PP...o...',
      '^PP..o....^',
      '^P........^',
      '^..o..,.o.^',
      '^^^^^^^^^^^',
      '^^^^^^^^^^^'
    ],
    landmarks: [],
    enemies: [['crawler', 2], ['wisp', 2], ['fog', 1]],
    shard: { id: 2, x: 8, y: 9, whenClear: true },
    npcs: []
  };

  S['3,3'] = {
    name: 'Bernal Heights', sub: 'The Wind Harp', grass: '#8f9a55', mood: 'gold',
    map: [
      '....ppp....',
      '.,..p...,..',
      '.^^^p^^^^..',
      '.^,,p,,,^..',
      '.^,XXX,,^..',
      '.^,XXX,,^..',
      'pp,,,,,,ppp',
      '.^,,,,,,^..',
      '.^^^^^^^^..',
      '...........',
      '.T..,..T...',
      '###########',
      '###########'
    ],
    landmarks: [{ type: 'windHarp', x: 3, y: 4, w: 3, h: 2 }, { type: 'greenwall', x: 0, y: 11, w: 11, h: 2 }],
    enemies: [['wisp', 3]],
    shard: { id: 4, x: 7, y: 4 },
    npcs: [
      { id: 'ossie', x: 9, y: 3, talk: () => [
        ['ossie', 'The Wind Harp tunes itself to the fog. Forty strings, each a different length of Tuyshtak fiber.'],
        ['ossie', 'When the Static rolls in, the harp goes sour. Lately it has been sour every night, and loudest toward Twin Peaks.']
      ]}
    ]
  };

  S['4,3'] = {
    name: 'Hunters Point', sub: 'The Lens Works of the Awashi', grass: '#5a874a', mood: 'sun',
    map: [
      '...ppp..sWW',
      '.......swWW',
      '.XXXX..swWW',
      '.XXXX..swWW',
      '.XXXX...sWW',
      '...p....sWW',
      'pppppppbbbb',
      '..c..c..sWW',
      '.c..L..c.WW',
      '....,....WW',
      'T.......wWW',
      '###########',
      '###########'
    ],
    landmarks: [{ type: 'lensWorks', x: 1, y: 2, w: 4, h: 3 }, { type: 'greenwall', x: 0, y: 11, w: 11, h: 2 }],
    enemies: [],
    npcs: [
      { id: 'siwe', x: 5, y: 5, talk: g => {
        if (!f(g, 'hasPrism')) return [
          ['siwe', 'Tolowin Awashi. I have waited my whole life to say your name to your face.'],
          ['me', 'Awashi?'],
          ['siwe', 'Your sister Ahwa was my ancestor, twenty-eight generations back. Your grandmother was the lens-grinder Awashi. Our family has kept the Lens Works since before the Compact.'],
          ['siwe', 'Across the bay, on the flanks of Tuyshtak, the old ones found clear quartz. First they burned tule with it: sunlight gathered to a point.'],
          ['siwe', 'Then they noticed some crystals split light in two. Then that quartz makes a voltage when you squeeze it. Much later, that the right crystal can double the frequency of a laser: red light in, ultraviolet out.'],
          ['siwe', 'Frequency-converting crystals are what let the Lantern focus light hard enough to fuse hydrogen. Everything this city runs on passed through a lens first.'],
          { do: g => { g.save.flags.hasPrism = true; g.save.items.prism = true; } },
          ['sys', 'You received the TUYSHTAK PRISM. Press B (or X) to fire a beam of focused light.'],
          ['siwe', 'The beam crosses water and wakes sleeping crystal switches. There is an old fog seal at Lands End with its key standing in the surf. Go carefully, cousin.']
        ];
        if (g.hasShard(4)) return [
          ['siwe', 'You remembered Ahwa. I can see it on you.'],
          ['siwe', 'She lived to ninety-one. She kept a lamp in the window of the Lens Works every night of her life, and told her grandchildren to keep it lit for a man who was sleeping. We still do.']
        ];
        return [
          ['siwe', 'The Lantern at the south end of the Works holds a fuel pellet smaller than a peppercorn. One hundred ninety-two beams, each one tripled in frequency by a crystal, all arriving within a billionth of a second.'],
          ['siwe', 'The ARM says the next step is not more light. It is understanding the field beneath mass itself. The Higgs field. I understand one word in three when it explains.']
        ];
      }}
    ]
  };

  S.summit = {
    name: 'The Resonance Mast', sub: 'Summit of Twin Peaks', grass: '#8f8a52', mood: 'storm', noMap: true, mapAs: '2,2',
    map: [
      '^^^^^^^^^^^',
      '^^..XXX..^^',
      '^...XXX...^',
      '^.........^',
      '^.........^',
      '^.........^',
      '^.........^',
      '^.........^',
      '^.........^',
      '^.........^',
      '^.........^',
      '^....p....^',
      '^^^^^V^^^^^'
    ],
    landmarks: [{ type: 'mast', x: 4, y: 1, w: 3, h: 2 }],
    enemies: g => f(g, 'bossDone') ? [] : [['boss', 1]],
    warps: [{ x: 5, y: 12, to: '2,2', tx: 8, ty: 4, dir: 'down', when: g => f(g, 'bossDone') }],
    npcs: []
  };

  const BOSS_END = [
    ['arm', 'Static coherence collapsing. Entropy at the Mast returning to baseline.'],
    ['me', 'It was only noise. It needed someone to listen until it turned into a word.'],
    ['arm', 'Noted, Tolowin. We could not compress it because we kept trying to predict it. You named it instead.'],
    ['arm', 'The ARM has updated your residency. Occupation: Listener.']
  ];

  const ENDING = [
    { art: 'dawn', text: 'The Resonance Mast rang clear across the peninsula, and every crystal lamp in the Free City brightened by a fraction no one but the ARM could measure.' },
    { art: 'bridge', who: 'adela', text: 'The next morning, at the Bay Bridge: "The Compact asks us to measure what a thing costs the living and what it returns. I measured you wrong."' },
    { art: 'bridge', who: 'emil', text: '"Your residency is confirmed. The ARM lists you as a Listener. I have no idea what that means. I suspect the ARM only half knows."' },
    { art: 'sunset', who: 'maren', text: '"So. The Farallon lights. I did promise."' },
    { art: 'sunset', text: 'Year 2759. One year of waking. The tide turns.' }
  ];

  window.YELAMU_WORLD = { CAST, SCREENS: S, MEMORIES, BOSS_END, ENDING, GRID_W: 5, GRID_H: 4, START: { screen: '1,2', x: 5, y: 6 } };
})();
