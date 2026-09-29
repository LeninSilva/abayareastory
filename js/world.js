/* Open Your Eyes — the world: cast, maps, dialogue, puzzles, memories.
 *
 * Map legend (11 x 13 tiles per screen)
 *  walkable: . grass  , flowers  e street  t cable-car/streetcar tracks  = crosswalk  k sidewalk
 *            p gravel path  s sand  d planks  r carpet  x pressure mark
 *  solid:    W water  w surf  q empty pool  T cypress  P palm  o boulder  ^ cliff  h bush
 *            B building  V Victorian  D door  L streetlamp  n bench/sofa  # wall  ~ fog wall
 *            O bridge steel  X landmark footprint
 *
 * Dialogue lines: ['who', 'text'] · { do: g => ... } · { who, ask, options, then: (g, i) => lines }
 * 'me' lines are my own thoughts (first person). 'narrator' is the voice that opens and closes the story.
 */
(function () {
  'use strict';

  const CAST = {
    me:        { name: 'Me', skin: '#b98a66', hair: '#23201e', hairStyle: 'short', coat: '#d6a03a', coatStyle: 'tshirt', legs: '#2a2f3a', ghost: false },
    narrator:  { name: '', kind: 'voice' },
    sys:       { name: '', kind: 'voice' },
    valet:     { name: 'The Valet', skin: '#d9b99b', hair: '#2a2220', hairStyle: 'side', coat: '#7a2a32', coatStyle: 'uniform', accent: '#d8b44a', shirt: '#efe8d8', hat: 'pillbox', hatColor: '#7a2a32', smile: 0.2 },
    nana:      { name: 'Nana', skin: '#c89a78', hair: '#dcd7cf', hairStyle: 'bun', coat: '#6b4a6e', coatStyle: 'dress', shirt: '#e8dfd0', glasses: 'round', necklace: '#ece6d8', smile: 0.18 },
    norton:    { name: 'Emperor Norton', skin: '#dcbc9c', hair: '#5a4a3c', hairStyle: 'short', beard: 'full', coat: '#2d3a66', coatStyle: 'uniform', epaulets: true, accent: '#d8b44a', shirt: '#e9e2d0', hat: 'top', hatColor: '#26252b', hatBand: '#3a5a8a' },
    bummer:    { name: 'Bummer', kind: 'dog', coat: '#2e2a29' },
    lazarus:   { name: 'Lazarus', kind: 'dog', coat: '#b08a5a' },
    twain:     { name: 'Mark Twain', skin: '#e2c2a2', hair: '#ebe7df', hairStyle: 'wild', beard: 'walrus', beardColor: '#ebe7df', coat: '#e9e7df', coatStyle: 'suit', tie: '#2b2a30', shirt: '#f6f3ec' },
    felt:      { name: 'The Man in the Garage', skin: '#d9b99b', hair: '#b8b4ac', hairStyle: 'side', coat: '#3a3d44', coatStyle: 'suit', tie: '#5a2a2a', hat: 'fedora', hatColor: '#34363c', frown: true, smile: -0.05 },
    ralston:   { name: 'William Ralston', skin: '#dcbc9c', hair: '#6a5040', hairStyle: 'receding', beard: 'mustache', coat: '#2b2a30', coatStyle: 'suit', tie: '#2b2a30' },
    levi:      { name: 'Levi Strauss', skin: '#dcbc9c', hair: '#4a4040', hairStyle: 'receding', beard: 'full', beardColor: '#7a7470', coat: '#394a6a', coatStyle: 'suit', tie: '#2b2a30' },
    fireman:   { name: 'A Fireman, 1906', skin: '#d6b08c', hair: '#4a3a30', hairStyle: 'short', beard: 'mustache', coat: '#2b3040', coatStyle: 'coat', hat: 'fire' },
    lee:       { name: 'Mrs. Lee', skin: '#e0c09c', hair: '#1c1a1a', hairStyle: 'bun', coat: '#3a5a6a', coatStyle: 'dress', shirt: '#e6dcc8' },
    giannini:  { name: 'A. P. Giannini', skin: '#dcbc9c', hair: '#2a2622', hairStyle: 'side', beard: 'mustache', coat: '#3a3a42', coatStyle: 'suit', tie: '#6b2a33' },
    dimaggio:  { name: 'Joe DiMaggio', skin: '#d6b08c', hair: '#2a2622', hairStyle: 'side', coat: '#e8e2d2', coatStyle: 'uniform', accent: '#2d3a5a', hat: 'cap', hatColor: '#2d3a5a' },
    ferl:      { name: 'Lawrence Ferlinghetti', skin: '#e4c6a8', hair: '#d9d4cc', hairStyle: 'receding', beard: 'full', beardColor: '#cfcac2', coat: '#6a5a4a', coatStyle: 'sweater' },
    opp:       { name: 'J. Robert Oppenheimer', skin: '#e2c4a4', hair: '#6a5a4a', hairStyle: 'short', coat: '#6f6a60', coatStyle: 'suit', tie: '#2b2a30', hat: 'fedora', hatColor: '#8a8474', frown: true, smile: 0 },
    brannan:   { name: 'Sam Brannan', skin: '#e2c4a4', hair: '#6a4a30', hairStyle: 'short', beard: 'full', coat: '#4a3a2c', coatStyle: 'coat', hat: 'bowler', hatColor: '#2b2a30', smile: 0.22 },
    ginsberg:  { name: 'Allen Ginsberg', skin: '#e4c6a8', hair: '#2a2622', hairStyle: 'curly', glasses: 'square', coat: '#3a3d44', coatStyle: 'suit', tie: '#5a4a3a' },
    kerouac:   { name: 'Jack Kerouac', skin: '#d8b08a', hair: '#1f1c1a', hairStyle: 'side', coat: '#8a3a2e', coatStyle: 'coat', shirt: '#e8e0d0', smile: 0.14 },
    soldier:   { name: 'A Soldier at Fort Mason', skin: '#c99a73', hair: '#3a2e26', hairStyle: 'short', coat: '#6b6a45', coatStyle: 'uniform', accent: '#b8a060', hat: 'military', hatColor: '#6b6a45' },
    sutro:     { name: 'Adolph Sutro', skin: '#e2c4a4', hair: '#ebe7df', hairStyle: 'receding', beard: 'mutton', beardColor: '#ebe7df', coat: '#2b2a30', coatStyle: 'suit', tie: '#2b2a30' },
    ussf:      { name: 'A Sailor of the USS San Francisco', skin: '#b07d58', hair: '#1f1a18', hairStyle: 'short', coat: '#23304a', coatStyle: 'uniform', accent: '#e8e2d2', hat: 'navy' },
    iron:      { name: 'An Ironworker', skin: '#d6b08c', hair: '#5a4030', hairStyle: 'short', beard: 'mustache', coat: '#7a6a52', coatStyle: 'overalls', accent: '#3c5a7a', hat: 'hard' },
    buffalo:   { name: 'A Trooper of the Ninth Cavalry', skin: '#6b4430', hair: '#1a1616', hairStyle: 'short', beard: 'mustache', coat: '#34466a', coatStyle: 'uniform', accent: '#d8b44a', hat: 'campaign', hatColor: '#8a7a58' },
    soldado:   { name: 'A Soldado de Cuera, 1776', skin: '#c49270', hair: '#2a2220', hairStyle: 'short', beard: 'mustache', coat: '#9a7a52', coatStyle: 'coat', shirt: '#e8dcc4', hat: 'flat', hatColor: '#2b2a30' },
    bridges:   { name: 'Harry Bridges', skin: '#e2c4a4', hair: '#3a3030', hairStyle: 'side', coat: '#3a3d44', coatStyle: 'coat', hat: 'cap', hatColor: '#3a3d44', frown: true },
    niantic:   { name: 'A Sailor off the Niantic', skin: '#d6a888', hair: '#8a5a30', hairStyle: 'short', beard: 'full', coat: '#2f3a4a', coatStyle: 'coat', hat: 'flat', hatColor: '#2b2a30' },
    hearst:    { name: 'William Randolph Hearst', skin: '#e2c4a4', hair: '#6a5a4a', hairStyle: 'side', coat: '#3a3d44', coatStyle: 'suit', tie: '#6b2a33' },
    monarch:   { name: 'Monarch', kind: 'bear' },
    claude:    { name: 'Claude', kind: 'gator' },
    digger:    { name: 'A Digger, 1967', skin: '#e4c6a8', hair: '#b8843a', hairStyle: 'long', hat: 'headband', hatColor: '#d06a3a', coat: '#7a8a4a', coatStyle: 'tshirt', print: '#e8b44a', smile: 0.2 },
    robin:     { name: 'Robin Williams', skin: '#e2c4a4', hair: '#4a3a30', hairStyle: 'short', coat: '#4a5a6a', coatStyle: 'sweater', smile: 0.24 },
    pleasant:  { name: 'Mary Ellen Pleasant', skin: '#7a5238', hair: '#1a1616', hairStyle: 'bun', coat: '#2b2a30', coatStyle: 'dress', shirt: '#e6dcc8', necklace: '#d8b44a', hat: 'bonnet', hatColor: '#2b2a30' },
    jazz:      { name: 'A Musician from the Fillmore', skin: '#5a3a28', hair: '#1a1616', hairStyle: 'short', beard: 'goatee', coat: '#6b2a33', coatStyle: 'suit', tie: '#2b2a30', hat: 'fedora', hatColor: '#2b2a30', smile: 0.16 },
    jerry:     { name: 'Jerry Garcia', skin: '#e4c6a8', hair: '#3a3030', hairStyle: 'afro', beard: 'full', coat: '#3a3d44', coatStyle: 'tshirt', smile: 0.16 },
    milk:      { name: 'Harvey Milk', skin: '#e2c4a4', hair: '#3a3030', hairStyle: 'side', coat: '#4a4f5a', coatStyle: 'suit', tie: '#6b2a33', smile: 0.24 },
    tomas:     { name: 'Tomás', skin: '#c49270', hair: '#2a2220', hairStyle: 'short', beard: 'mustache', coat: '#7a5a8a', coatStyle: 'sweater' },
    elder:     { name: 'An Elder of the Yelamu', skin: '#8a5a3c', hair: '#cfcac2', hairStyle: 'long', coat: '#8a7a4e', coatStyle: 'shawl', accent: '#a8603a', necklace: '#ece6d8' },
    settler:   { name: 'A Settler from Sonora', skin: '#c49270', hair: '#2a2220', hairStyle: 'braid', coat: '#7a3a2a', coatStyle: 'shawl', accent: '#3a4a6a' },
    mays:      { name: 'Willie Mays', skin: '#5a3a28', hair: '#1a1616', hairStyle: 'short', coat: '#ece6d6', coatStyle: 'uniform', accent: '#e39a3a', hat: 'cap', hatColor: '#2b2a30', smile: 0.28 },
    gunner:    { name: 'A Coast Artilleryman', skin: '#d6b08c', hair: '#6a4a30', hairStyle: 'short', coat: '#6b6a45', coatStyle: 'uniform', accent: '#b8a060', hat: 'military', hatColor: '#6b6a45' },
    gene:      { name: 'Gene Roddenberry', skin: '#e2c4a4', hair: '#8a7a6a', hairStyle: 'side', coat: '#3a3d44', coatStyle: 'suit', tie: '#2d3a5a', smile: 0.12 },
    refugee:   { name: 'A Refugee of 1906', skin: '#e4c6a8', hair: '#6a4a30', hairStyle: 'bun', coat: '#5a5a4a', coatStyle: 'shawl', accent: '#8a6a4a' },
    nurse:     { name: 'A Nurse, 1918', skin: '#e2c4a4', hair: '#5a3a28', hairStyle: 'bun', coat: '#e8e4dc', coatStyle: 'dress', hat: 'nurse', mask: true },
    indy:      { name: 'A Sailor of the Indianapolis', skin: '#d6b08c', hair: '#6a4a30', hairStyle: 'short', coat: '#23304a', coatStyle: 'uniform', accent: '#e8e2d2', hat: 'navy' },
    welder:    { name: 'Odessa, a Shipyard Welder', skin: '#6b4430', hair: '#1a1616', hairStyle: 'bun', coat: '#7a6a52', coatStyle: 'overalls', accent: '#3c5a7a', hat: 'headband', hatColor: '#b8412f' },
    spy:       { name: 'Grigory Kheifets', skin: '#e2c4a4', hair: '#2a2622', hairStyle: 'side', beard: 'mustache', coat: '#4a4a44', coatStyle: 'suit', tie: '#6b2a33', hat: 'fedora', hatColor: '#3a3a36', smile: 0.1 },
    clark:     { name: 'Dwight Clark', skin: '#e2c4a4', hair: '#6a4a30', hairStyle: 'short', coat: '#a8302a', coatStyle: 'uniform', accent: '#d8b44a', smile: 0.22 },
    walsh:     { name: 'Bill Walsh', skin: '#e4c6a8', hair: '#ebe7df', hairStyle: 'side', coat: '#a8302a', coatStyle: 'sweater' },
    sign:      { name: '', kind: 'voice' }
  };

  const f = (g, k) => !!g.save.flags[k];

  /* ---------------- the six minutes (memories) ---------------- */
  const MINUTES = {
    7:  { title: '5:07', place: 'Emperor Norton, Union Square', text: 'I pull the club\'s rolling door down on Folsom and snap the padlock. My ears are still ringing from the last set. I text Mom: heading home. She\'s asleep. She\'ll see it at six.' },
    8:  { title: '5:08', place: 'Mrs. Lee, Portsmouth Square', text: 'Market Street is empty except for the streetcar wires humming overhead and a man hosing the sidewalk outside a donut shop. The fog is down to the second floor of every building. I don\'t clip my helmet. It\'s four blocks. It\'s always four blocks.' },
    9:  { title: '5:09', place: 'The poets, Six Gallery', text: 'One song in my headphones, on repeat: the one Nana used to hum over her crosswords in the Excelsior. I think, I should visit her grave this weekend. I have thought that every weekend since she died.' },
    10: { title: '5:10', place: 'Adolph Sutro, Lands End', text: 'Passing the Palace Hotel. A doorman in a long red coat is standing under the awning. He looks right at me and laughs, like I just told him a joke.' },
    11: { title: '5:11', place: 'The ironworker, Golden Gate', text: 'Red light at New Montgomery. Nobody\'s coming. Nobody is ever coming at five in the morning. I stand on the pedals and go.' },
    12: { title: '5:12', place: 'The canisters, Hunters Point', text: 'Headlights from the left, too big and too close: a delivery truck, running late like me. Then no sound at all. Then every sound at once. Then fog.' }
  };

  /* ---------------- encounter backdrops by district ---------------- */
  const BG = {
    fin:    { sky: '#3a4556', low: '#a3a6a5', far: '#4b5563', ground: '#5d6168', seed: 1 },
    north:  { sky: '#394a5e', low: '#b0aca0', far: '#57606c', ground: '#6a6e70', seed: 2 },
    coast:  { sky: '#415466', low: '#c3c6c2', far: '#5f6d6a', ground: '#8a8577', seed: 3 },
    park:   { sky: '#3d5058', low: '#b5b9a6', far: '#4d6552', ground: '#5c7355', seed: 4 },
    hood:   { sky: '#3e4658', low: '#b6aaa0', far: '#7a6a7a', ground: '#6d6a6e', seed: 5 },
    south:  { sky: '#3a4454', low: '#aaa497', far: '#555c64', ground: '#65666a', seed: 6 },
    room:   { sky: '#2b1a22', low: '#4a2f3b', far: '#3b2530', ground: '#5e2733', seed: 7 }
  };

  const S = {};

  /* ============ Row 0: the north waterfront ============ */
  S['0,0'] = {
    name: 'Lands End', sub: 'Sutro Baths', bg: BG.coast, mood: 'sea', grass: '#62795c',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWWWWW',
      'WWwwwwwwwww',
      'WwXXXXX^^^^',
      'wsXXXXX^TT.',
      'wsdddddkkkk',
      'ws.....k.T.',
      'ws..,..kkkk',
      'ws^^..,k.T.',
      'wsT..TTk...',
      'wsT..T.k.T.',
      'wsT....kT..',
      'wsTT.kkk.TT'
    ],
    landmarks: [{ type: 'sutroBaths', x: 2, y: 3, w: 5, h: 2 }],
    drifters: [{ x: 4, y: 10, axis: 'h', range: 2 }],
    objects: g => [0, 1, 2, 3, 4].map(i => ({ kind: 'valve', id: 'v' + i, i, tx: 2 + i, ty: 6, on: f(g, 'solvedValves') ? true : [false, false, true, false, false][i] })),
    npcs: [
      { id: 'sutro', x: 8, y: 6, talk: g => {
        if (f(g, 'solvedValves')) return [['sutro', 'Listen to that. The tide, coming in on schedule. The only thing in this city that still keeps its appointments.']];
        return [
          ['sutro', 'Adolph Sutro. Engineer, mayor, and the man who drained the Comstock mines with a tunnel four miles long. Welcome to my baths.'],
          ['sutro', 'Seven pools, fresh and salt, filled by the tide. Ten thousand swimmers at a time. They burned in 1966, but the ruins are still very good company.'],
          ['sutro', 'Here, in the fog, my valves have gone contrary. Five of them, linked by one pipe. Turn one and its neighbors turn with it. Open all five and the pools will fill.'],
          { do: g => { g.save.flags.valvesAsked = true; } }
        ];
      }},
      { id: 'ussf', x: 8, y: 10, talk: () => [
        ['ussf', 'USS San Francisco. November 1942, off Guadalcanal. We took forty-five hits in one night. The admiral died on the bridge. So did the captain.'],
        ['ussf', 'They cut the shot-up bridge wings off the ship and set them here at Lands End, pointing out to sea. I come and look at the holes.'],
        ['ussf', 'You keep checking your wrist. Lost your watch? Plenty of things wash up at Hunters Point.']
      ]}
    ],
    onObject(g, o) {
      if (o.kind !== 'valve' || f(g, 'solvedValves')) return;
      const vs = g.objects.filter(v => v.kind === 'valve');
      for (const v of vs) if (Math.abs(v.i - o.i) <= 1) v.on = !v.on;
      g.sfx('valve');
      if (vs.every(v => v.on)) {
        g.save.flags.solvedValves = true;
        g.say([['sys', 'Water roars up out of the old pipes. All five pools fill at once, green and cold.'], ['sutro', 'Bravo! You have an engineer\'s hands. Here. This was lodged in my intake grate.'], { do: g => g.giveMinute(10) }]);
      }
    }
  };

  S['1,0'] = {
    name: 'The Presidio', sub: 'Golden Gate Bridge', bg: BG.coast, mood: 'sea', grass: '#5b7556',
    map: [
      'WWW~~~~~WWW',
      'WWWOeeeOWWW',
      'wwwOeeeOwww',
      's..kkkkk..s',
      '..#######..',
      '..#x...x#..',
      'kk#.....#kk',
      '..#.....#..',
      'T.#.....#.T',
      'T.###.###.T',
      'T.........T',
      'TT..kkk..TT',
      'TTT.kkk.TTT'
    ],
    landmarks: [{ type: 'ggBridge', x: 3, y: 0, w: 5, h: 3 }],
    objects: g => {
      if (f(g, 'solvedNet')) return [{ kind: 'block', tx: 3, ty: 5 }, { kind: 'block', tx: 7, ty: 5 }];
      return [{ kind: 'block', tx: 4, ty: 7 }, { kind: 'block', tx: 6, ty: 7 }];
    },
    npcs: [
      { id: 'iron', x: 9, y: 5, talk: g => {
        if (f(g, 'solvedNet')) return [['iron', 'Holds like a church. Nobody falls through tonight.']];
        if (f(g, 'netAsked')) return [
          { who: 'iron', ask: 'Need me to reset those kegs?', options: ['Yes, reset them.', 'No, I\'ve got it.'],
            then: (g, i) => i === 0 ? [{ do: g => g.resetObjects() }, ['iron', 'There. Push \'em sideways first, then up into the corners.']] : [['iron', 'Take your time. The bridge isn\'t going anywhere. Neither are we.']] }
        ];
        return [
          ['iron', 'They hung a safety net under the deck while we built her. First time anybody ever did that. Nineteen of us fell into it and lived. We called ourselves the Halfway to Hell Club.'],
          ['iron', 'February 17th, 1937, a scaffold broke loose and tore straight through the net. Ten men. I was one of the ten.'],
          ['iron', 'Now the net\'s got two holes in it. See the orange marks in the corners of the yard? Push those rivet kegs onto the marks and it\'ll hold again.'],
          ['iron', 'Walk into a keg to push it. If you jam one in a corner, come ask me and I\'ll reset them.'],
          { do: g => { g.save.flags.netAsked = true; } }
        ];
      }},
      { id: 'buffalo', x: 2, y: 11, talk: () => [
        ['buffalo', 'Ninth Cavalry. The Army posted Black troopers here at the Presidio around 1900. Summers, they sent us to Yosemite and Sequoia to guard the parks.'],
        ['buffalo', 'Before there were park rangers, there was us. Captain Charles Young ran Sequoia in 1903 and built the road into the Giant Forest in a single summer.']
      ]},
      { id: 'soldado', x: 8, y: 11, talk: () => [
        ['soldado', 'Soldado de cuera, of the Presidio of San Francisco. We raised it in September of 1776, under Lieutenant José Joaquín Moraga.'],
        ['soldado', 'We walked up from Sonora with Captain Anza\'s families, more than a thousand miles. New Spain sent us to the edge of the map. The map kept going.']
      ]}
    ],
    onPush(g) {
      if (f(g, 'solvedNet')) return;
      const blocks = g.objects.filter(o => o.kind === 'block');
      if (blocks.every(b => b.onPlate)) {
        g.save.flags.solvedNet = true;
        g.say([['sys', 'Both kegs settle onto the marks. Somewhere under the deck, rope creaks and pulls tight.'], ['iron', 'Would you look at that. Here, this fell out of your pocket when you came across.'], { do: g => g.giveMinute(11) }]);
      }
    }
  };

  S['2,0'] = {
    name: 'The Marina', sub: 'Six Gallery, Fillmore Street', bg: BG.north, mood: 'sea', grass: '#62805a',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWWWWW',
      'wwwwwwwwwww',
      'sssssssssss',
      '...........',
      '..XXX......',
      '..XXX......',
      '..XXX..,...',
      'kkkkkkkkkkk',
      'BBBBk.e.BBB',
      'BBBDk.e.BBB',
      'kkkkk.ekkkk',
      '....kkek...'
    ],
    landmarks: [{ type: 'palaceFA', x: 2, y: 5, w: 3, h: 3 }, { type: 'sixGallery', x: 0, y: 9, w: 4, h: 2 }],
    npcs: [
      { id: 'ginsberg', x: 4, y: 9, dir: 'down', talk: g => {
        if (f(g, 'solvedPoem')) return [['ginsberg', 'Tonight I read a long poem about the best people I know going under. It gets my publisher arrested. You should hear the room. The room is the poem.']];
        const pick = (q, options, answer, next) => ({ who: 'ginsberg', ask: q, options, then: (g, i) => { if (options[i] !== answer) g.save.flags.poemMiss = true; return next; } });
        return [
          ['ginsberg', 'Allen. It\'s October 7th, 1955. It\'s always October 7th, 1955 in there. I\'m about to read a poem that gets my publisher arrested, and Jack is passing jugs of wine around.'],
          ['ginsberg', 'But the last poem of the night is missing its words and the room is waiting. Help me finish it? Listen for the rhymes.'],
          { do: g => { g.save.flags.poemMiss = false; } },
          pick('"Under the bridge the tide keeps ____,"', ['still', 'time', 'quiet'], 'time', []),
          pick('"and the cable cars keep up their ____;"', ['noise', 'pace', 'climb'], 'climb', []),
          pick('"the neon on Broadway whispers ____"', ['stay', 'go', 'nothing'], 'stay', []),
          ['ginsberg', '"...to the ones the morning carries away." Read it back.'],
          { do: g => {
            if (g.save.flags.poemMiss) g.say([['ginsberg', 'No. The line doesn\'t breathe. You can hear where it trips. Talk to me again and we\'ll take it from the top.']]);
            else g.say([
              ['narrator', 'Under the bridge the tide keeps time, / and the cable cars keep up their climb; / the neon on Broadway whispers stay / to the ones the morning carries away.'],
              ['kerouac', 'Go! Go! Go!'],
              ['ginsberg', 'That\'s it. That\'s the one. Somebody in the back was holding this for you.'],
              { do: g => { g.save.flags.solvedPoem = true; g.giveMinute(9); } }
            ]);
          } }
        ];
      }},
      { id: 'kerouac', x: 5, y: 10, talk: () => [
        ['kerouac', 'Jack. I\'m not reading tonight, man, I\'m listening. I went around collecting dimes for the wine.'],
        ['kerouac', 'I wrote the whole night down later and called it The Dharma Bums. Changed everybody\'s names. Didn\'t help.']
      ]},
      { id: 'soldier', x: 9, y: 4, talk: () => [
        ['soldier', 'Fort Mason, the Port of Embarkation. More than a million and a half of us shipped out from these piers for the Pacific.'],
        ['soldier', 'Guys used to say "Golden Gate in \'48." Home by \'48. Some of us made it. Some of us are still waiting on the pier.']
      ]}
    ]
  };

  S['3,0'] = {
    name: 'North Beach', sub: 'Chinatown · Telegraph Hill', bg: BG.north, mood: 'town', grass: '#62805a',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWWWWW',
      'wwwwwwwwwww',
      'ss^^^^^^sss',
      '..^^XX^^...',
      '...^XX^....',
      'kkk.....kkk',
      'eeteeeeteee',
      'kkkkkkkkkkk',
      'BBk.....kBB',
      'BDk.....kDB',
      'BBk.....kBB',
      'BBkkkkkkkBB'
    ],
    landmarks: [{ type: 'alcatraz', x: 6, y: 0, w: 3, h: 2 }, { type: 'coit', x: 4, y: 4, w: 2, h: 2 }, { type: 'cityLights', x: 9, y: 9, w: 2, h: 2 }],
    objects: g => [['red', 3, 9], ['jade', 7, 9], ['white', 3, 11], ['gold', 7, 11]].map(([color, tx, ty]) => ({ kind: 'lantern', color, tx, ty, lit: f(g, 'solvedLanterns') })),
    npcs: [
      { id: 'lee', x: 5, y: 9, talk: g => {
        if (f(g, 'solvedLanterns')) return [['lee', 'My grandson became a lawyer on Grant Avenue. I tell no one. I am telling you. Now go.']];
        return [
          ['lee', 'You are lost. I know the look. I wore it on the ship from Hong Kong, and for three weeks on Angel Island, waiting for them to decide if I could come ashore.'],
          ['lee', 'My family is from Taishan, in Guangdong. Most of the first Chinese in this city were from those four counties by the Pearl River. We say Toisan.'],
          ['lee', 'These lanterns go dark if they are lit in the wrong order. The order was carved into a wall at Angel Island, like the poems the others carved. Listen:'],
          ['lee', '"First, the color of good fortune. Then the color of the harvest moon. Then the color of the mountains of home. Last, the color we wear for the dead."'],
          { do: g => { g.save.flags.lanternsAsked = true; } }
        ];
      }},
      { id: 'brannan', x: 5, y: 11, talk: () => [
        ['brannan', 'Sam Brannan! In May of 1848 I walked into this very square holding up a bottle of gold dust and shouting, "Gold! Gold from the American River!"'],
        ['brannan', 'I had already bought every shovel and pan for a hundred miles. I became California\'s first millionaire. I died broke. The gold rush was very fair that way.']
      ]},
      { id: 'giannini', x: 1, y: 6, talk: () => [
        ['giannini', 'A. P. Giannini. I opened the Bank of Italy right here in North Beach in 1904, for the fishermen and fruit peddlers the big banks wouldn\'t look at.'],
        ['giannini', 'When the fire came in 1906, I loaded our gold into a produce wagon, covered it with crates of oranges, and drove it out of the city. A week later I was lending money from a plank laid across two barrels on the wharf.'],
        ['giannini', 'That bank became the Bank of America. I\'m still proudest of the plank.']
      ]},
      { id: 'dimaggio', x: 9, y: 6, talk: () => [
        ['dimaggio', 'Joe. My father fished out of the Wharf. He wanted me on the boat. I got seasick, so I played ball on the North Beach playground.'],
        ['dimaggio', 'With the San Francisco Seals, in 1933, I hit in sixty-one straight games. With the Yankees, fifty-six. Everybody remembers the fifty-six.'],
        ['dimaggio', 'You look like a guy who lost count of something.']
      ]},
      { id: 'ferl', x: 8, y: 8, talk: () => [
        ['ferl', 'Lawrence Ferlinghetti. We opened City Lights in 1953, the first all-paperback bookstore in the country. Books for the price of a sandwich.'],
        ['ferl', 'In 1956 we published a little book of poems by Allen Ginsberg and the police arrested me for it. The judge ruled it wasn\'t obscene. Best review we ever got.'],
        ['ferl', 'I stuck around until 2021. A hundred and one. If you\'re looking for Allen and Jack, they\'re at the Six Gallery on Fillmore, in 1955. They\'re always at the Six Gallery.']
      ]},
      { id: 'opp', x: 8, y: 4, talk: () => [
        ['opp', 'From Telegraph Hill you can see across the bay to the hills above Berkeley, where Ernest Lawrence built his cyclotrons. I taught physics over there before the war.'],
        ['opp', 'A friend of mine lived on this hill. I used to climb these steps to see her. I don\'t talk about what came after.'],
        ['opp', 'In July of 1945, pieces of what we built were loaded onto a ship at Hunters Point. Ask the sailor there about the canisters. And watch the man in the good suit.']
      ]}
    ],
    onObject(g, o) {
      if (o.kind !== 'lantern' || f(g, 'solvedLanterns') || o.lit) return;
      const order = ['red', 'gold', 'jade', 'white'];
      const lit = g.objects.filter(l => l.kind === 'lantern' && l.lit).length;
      if (o.color === order[lit]) {
        o.lit = true; g.sfx('chime' + lit);
        if (lit === 3) { g.save.flags.solvedLanterns = true; g.say([['lee', 'Yes. Just like that. My husband would be pleased. He was never pleased.'], ['lee', 'This was tucked inside the white one. It is yours, I think.'], { do: g => g.giveMinute(8) }]); }
      } else {
        g.objects.forEach(l => { if (l.kind === 'lantern') l.lit = false; }); g.sfx('fail');
        g.say([['sys', 'The lanterns gutter out together. Somewhere behind me, a woman sighs.']]);
      }
    }
  };

  S['4,0'] = {
    name: 'The Embarcadero', sub: 'Ferry Building', bg: BG.north, mood: 'sea', ground: 'walk',
    map: [
      'WWWWWWWWWWW',
      'WWWWWWWWWWW',
      'wwwwwwwwWWW',
      'kkkkkkk.wWW',
      'kkkkkkk.XXX',
      'eeeeeek.XXX',
      'eeeeeekLXXX',
      'eeeeeek.XXX',
      'kkPkkkkdddd',
      'BBk.Pkkwwww',
      'BBk..kwWWWW',
      'BDk.kkwWWWW',
      'BBkkkkwWWWW'
    ],
    landmarks: [{ type: 'ferry', x: 8, y: 4, w: 3, h: 4 }],
    npcs: [
      { id: 'bridges', x: 3, y: 9, talk: () => [
        ['bridges', 'Harry Bridges, longshoreman. In 1934 we shut down every port on the West Coast. On July 5th, Bloody Thursday, police shot two men dead right up the street.'],
        ['bridges', 'Every year after, the whole waterfront stopped work on July 5th, to remember. That\'s what a union is. People remembering together.']
      ]},
      { id: 'niantic', x: 3, y: 10, talk: () => [
        ['niantic', 'I came in on the Niantic in 1849. Nobody sailed her home. The whole crew ran off to the gold fields and left her in the mud.'],
        ['niantic', 'They hauled her up the beach and made her a warehouse, then a hotel. Then they filled in the shoreline past her. There are dozens of ships like her under the Financial District. You rode over mine this morning.']
      ]},
      { id: 'sign', x: 7, y: 5, talk: () => [['sys', 'The Ferry Building clock reads 5:12. The second hand trembles, as if it would very much like to move.']] }
    ]
  };

  /* ============ Row 1 ============ */
  S['0,1'] = {
    name: 'Golden Gate Park', sub: 'The west end · Murphy Windmill', bg: BG.park, mood: 'park', grass: '#5f7a58',
    map: [
      'ws..kkk..TT',
      'ws.......T.',
      'ws.XX..hhhh',
      'ws.XX..h..h',
      'ws.....h..h',
      'ws.....hhhh',
      'wskkkkkkkkk',
      'ws.........',
      'ws.T..,..T.',
      'ws...TT....',
      'ws.T.....T.',
      'ws..kkk...T',
      'ws..kkk..TT'
    ],
    landmarks: [{ type: 'windmill', x: 3, y: 2, w: 2, h: 2 }],
    npcs: [
      { id: 'monarch', x: 8, y: 4, reach: 44, talk: () => [
        ['sys', 'Monarch regards me through the hedge. Captured in 1889 for a newspaper, he lived the rest of his life in cages in this city, one of the last grizzlies in California.'],
        ['sys', 'He doesn\'t look angry. He looks like he\'s waiting for a train.']
      ]},
      { id: 'hearst', x: 6, y: 4, talk: () => [
        ['hearst', 'William Randolph Hearst. I was born in this city. My father gave me the Examiner in 1887 because I asked him for it.'],
        ['hearst', 'In 1889 I sent a reporter into the mountains to catch a grizzly for the paper. It took him months. We named the bear Monarch and put him on display for the whole city.'],
        ['hearst', 'The state still flies him on its flag. Everyone thinks it\'s a symbol. It\'s a portrait.']
      ]}
    ]
  };

  S['1,1'] = {
    name: 'Golden Gate Park', sub: 'Conservatory · Academy of Sciences', bg: BG.park, mood: 'park', grass: '#5f7a58',
    map: [
      'TT..kkk..TT',
      'T.........T',
      '.XXXXX.XXX.',
      '.XXXXX.XXX.',
      '..,.,..XXX.',
      '...p...p...',
      'ppppppppppp',
      '.,..hh..,..',
      'T...hh....T',
      '..T.....T..',
      'T..,...,..T',
      'TT..ppp..TT',
      'TTT.ppp.TTT'
    ],
    landmarks: [{ type: 'conservatory', x: 1, y: 2, w: 5, h: 2 }, { type: 'academy', x: 7, y: 2, w: 3, h: 3 }],
    npcs: [
      { id: 'claude', x: 8, y: 5, talk: () => [
        ['sys', 'An albino alligator, white as the fog, blinks at me. A little plaque: CLAUDE, California Academy of Sciences, 2008–2020.'],
        ['me', 'Hi, Claude.'],
        ['sys', 'Claude does not move. Claude never moved much. The school groups loved him anyway.']
      ]},
      { id: 'digger', x: 2, y: 8, talk: () => [
        ['digger', 'Free food in the Panhandle, four o\'clock, every day! We\'re the Diggers. We don\'t sell anything. It\'s 1967, man, it\'s always 1967 over here.'],
        ['digger', 'Everybody came that summer. A hundred thousand kids with flowers and nowhere to sleep. By October we held a funeral for the hippie, right in the park. As a joke. Mostly.']
      ]}
    ]
  };

  S['2,1'] = {
    name: 'Alamo Square', sub: 'Pacific Heights · the Fillmore', bg: BG.hood, mood: 'town', ground: 'walk', doorStyle: 'V', grass: '#62805a',
    map: [
      'VVVkkekkVVV',
      'VVVkkekkVVV',
      'VVDkkekkDVV',
      'kkkkkekkkkk',
      'eeeeeeeeeee',
      'kkkkkkkkkkk',
      '..,..,..,..',
      '.T.......T.',
      '...p.p.p...',
      'kkkkkkkkkkk',
      'VVVVkekVVVV',
      'VVVVkekVVVV',
      'kkkkkekkkkk'
    ],
    landmarks: [],
    npcs: [
      { id: 'robin', x: 1, y: 3, talk: () => [
        ['robin', '(He\'s leaning on the railing of a yellow Victorian, grinning like he already knows the punchline.) Oh, you\'re new. I can always tell. New people look at the fog like it owes them money.'],
        ['robin', 'People still leave notes on the steps of this house. Flowers, drawings, little thank-yous, for a movie where I wore a rubber face and a cardigan. Is that the most San Francisco thing you ever heard, or what?'],
        ['robin', 'Do me a favor. When you get home, and you will, be ridiculous for somebody. Make somebody laugh who didn\'t plan on it. That\'s the whole job.']
      ]},
      { id: 'pleasant', x: 8, y: 7, talk: () => [
        ['pleasant', 'Mary Ellen Pleasant. I came in 1852 with money in my pocket and made a great deal more. Boardinghouses, restaurants, investments. I spent plenty of it getting people out of slavery.'],
        ['pleasant', 'When a streetcar conductor put me off his car for being Black, I sued the company. I won in the lower court and the high court took it back. I sued anyway. That was the point.'],
        ['pleasant', 'I planted eucalyptus trees at Octavia and Bush. Some of them are still standing. So am I, in a manner of speaking.']
      ]},
      { id: 'jazz', x: 5, y: 9, talk: () => [
        ['jazz', 'The Fillmore, 1952. They called it the Harlem of the West. Folks came up from Texas and Louisiana to build ships at Hunters Point during the war, and they brought the music with them.'],
        ['jazz', 'Jimbo\'s Bop City stayed open till dawn and everybody sat in. Then the city tore half the neighborhood down and called it renewal.']
      ]}
    ],
    doors: { '2,2': () => [['sys', 'A yellow Victorian at Steiner and Broadway. Taped to the door: a child\'s drawing of a woman in a cardigan, and the words THANK YOU.']] }
  };

  S['3,1'] = {
    name: 'Union Square', sub: 'The Dewey Monument', bg: BG.fin, mood: 'town', ground: 'walk',
    map: [
      'BBkkkkkkkBB',
      'BBk.....kBB',
      'BBk.....kDB',
      'kkk.....kkk',
      'eeettteeeee',
      'kkkkkkkkkkk',
      'kkkkkkkkkkk',
      'k..P...P..k',
      'k....X....k',
      'k..P...P..k',
      'k.........k',
      'kkkkkkkkkkk',
      'BBkkkkkkkBB'
    ],
    landmarks: [{ type: 'dewey', x: 5, y: 8, w: 1, h: 1 }],
    objects: g => {
      if (!f(g, 'nortonAsked') || f(g, 'solvedDogs')) return [];
      const out = [];
      if (!f(g, 'caughtBummer')) out.push({ kind: 'dog', id: 'bummer', tx: 2, ty: 10 });
      if (!f(g, 'caughtLazarus')) out.push({ kind: 'dog', id: 'lazarus', tx: 8, ty: 7 });
      return out;
    },
    dogRegion: { x0: 1, y0: 6, x1: 9, y1: 10 },
    npcs: [
      { id: 'norton', x: 5, y: 2, talk: g => {
        if (f(g, 'solvedDogs')) return [['norton', 'Go on. An Emperor has many duties and very few appointments.']];
        if (f(g, 'nortonAsked')) {
          if (f(g, 'caughtBummer') && f(g, 'caughtLazarus')) return S['3,1'].dogsDone;
          return [['norton', 'The dogs, citizen! They are in the square. Corner them. They are quicker than you in the open, but not against a wall.']];
        }
        return [
          ['norton', 'Halt! You stand before Norton the First, Emperor of these United States and Protector of Mexico. You may bow. Most don\'t. I have made my peace with it.'],
          ['me', 'Emperor Norton. The one with the bridge.'],
          ['norton', 'I decreed a bridge across the bay in 1872. They laughed. Then they built two. A man need not be sane to be right. Only early.'],
          ['norton', 'Now, a matter of state. Bummer and Lazarus are loose in the square again. The newspapers always called them my dogs. They were nobody\'s dogs. They belonged to the whole city, which is the best way to belong.'],
          ['norton', 'Catch them both. In return, the Imperial Treasury will restore to you something you have misplaced.'],
          { do: g => { g.save.flags.nortonAsked = true; g.reloadObjects(); } }
        ];
      }},
      { id: 'twain', x: 3, y: 3, talk: g => {
        const l = [
          ['twain', 'Samuel Clemens. You\'ll know me by the other name. I reported for the Morning Call in \'64 until they fired me for having opinions in a newspaper.'],
          ['twain', 'Before you ask: I never said the coldest winter I ever spent was a summer in San Francisco. Somebody else said it and handed it to me. I get credit for a great deal of weather.'],
          ['twain', 'I wrote Bummer\'s obituary, too. The best-attended funeral in town that year was for a dog. That told me everything I needed to know about this city, and I approved.']
        ];
        if (f(g, 'nortonAsked') && !f(g, 'solvedDogs')) l.push(['twain', 'Those two? Don\'t chase them where they can run. Chase them where they can\'t.']);
        return l;
      }},
      { id: 'felt', x: 9, y: 3, talk: g => {
        const l = [
          ['felt', 'Keep your voice down. This is the Union Square Garage, 1942. They say it was the first underground parking garage in the world. Good place to talk. Nobody listens in a garage.'],
          ['me', 'Who are you?'],
          ['felt', 'For thirty years they called me by the title of a movie. I told two reporters to follow the money. I was the Associate Director of the FBI, and I kept it to myself until I was ninety-one.']
        ];
        if (!f(g, 'solvedCrates')) l.push(['felt', 'You\'re interested in the canisters at Hunters Point. Here\'s what I know: the Soviet fellow painted his decoy. Find the fresh paint, then look somewhere else.']);
        l.push(['felt', 'Follow the paint. Follow the money. It\'s usually the same road.']);
        return l;
      }}
    ],
    dogsDone: [
      ['norton', 'Splendid! Lazarus left us in 1863 and Bummer in 1865, and the whole city mourned them in the papers.'],
      ['norton', 'Hold out your hand. By Imperial decree: one minute, returned to its rightful owner.'],
      { do: g => { g.save.flags.solvedDogs = true; g.giveMinute(7); } },
      ['norton', 'And one more decree, free of charge: whoever calls this city "Frisco" shall be fined twenty-five dollars. I may or may not have actually said that. History is generous with fines.']
    ],
    onCatch(g, dog) {
      g.save.flags[dog.id === 'bummer' ? 'caughtBummer' : 'caughtLazarus'] = true;
      const both = f(g, 'caughtBummer') && f(g, 'caughtLazarus');
      g.say([['sys', dog.id === 'bummer' ? 'I kneel. Bummer lets me scratch his ears, then trots off to sit at the Emperor\'s boots.' : 'Lazarus stops, sighs, and leans against my leg, as if he\'d been waiting for someone to ask.']].concat(both ? [['norton', 'Both of them! Come here, citizen.']] : []));
    }
  };

  S['4,1'] = {
    name: 'Market Street', sub: 'The Palace Hotel', bg: BG.fin, mood: 'town', ground: 'walk',
    map: [
      'BBkkkkkkXXB',
      'XXXXXXXkXXB',
      'XXXXXXXkXXB',
      'XXXDXXXkkkk',
      'kkkkkkkkkkk',
      'eeeeeeeeeee',
      'ttttttttttt',
      'eeeee=eeeee',
      'kkkkk=kkkkk',
      'BBk.....kBB',
      'BBk..X..kBB',
      'BDk.....kDB',
      'BBkkkkkkkBB'
    ],
    landmarks: [{ type: 'palaceHotel', x: 0, y: 1, w: 7, h: 3 }, { type: 'transamerica', x: 8, y: 0, w: 2, h: 3 }, { type: 'lotta', x: 5, y: 10, w: 1, h: 1 }],
    onEnter: g => f(g, 'metValet') ? null : 'valet',
    npcs: [
      { id: 'valet', x: 5, y: 4, dir: 'left', talk: g => {
        if (!f(g, 'metValet')) return [
          ['valet', 'Ah! There you are. (He laughs, as if I\'ve told him a joke.) Welcome to the Palace. Your room is ready.'],
          ['me', 'My room? I didn\'t book a room. I was just riding home.'],
          ['valet', 'Everybody was just riding home. Or walking home. Or asleep. It\'s a very popular hotel.'],
          ['me', 'What time is it?'],
          ['valet', 'Twelve minutes past five. (He checks his watch without looking at it.) It\'s always twelve past five here. It saves a great deal of arguing.'],
          ['me', 'This is Market Street. That\'s the Palace Hotel. But everything\'s wrong. The Palace burned in 1906.'],
          ['valet', 'And was rebuilt in 1909, and here it stands. The whole city is here, sir. All of it, all at once. Every year that anyone ever loved.'],
          ['me', 'I need to get home. I live in the Outer Sunset. 1512 Judah.'],
          ['valet', '(Laughing again.) Then by all means, go home. West, past the park, all the way to the fog. The streetcars aren\'t running, but you have excellent legs. Your room will wait. Rooms here are very patient.'],
          { do: g => { g.save.flags.metValet = true; } }
        ];
        if (g.minuteCount() >= 6) return [['valet', 'The door\'s open. (He isn\'t laughing now.) It always was, you know. Most guests prefer the hallway.']];
        if (f(g, 'triedHome')) return [['valet', 'Six minutes, sir. Five-oh-seven through five-twelve. You have ' + g.minuteCount() + '. Everyone out there is holding something that belongs to you. Help them, and they\'ll hand it back.']];
        const quips = [
          'Home is west. The fog is west. Occasionally they are the same thing.',
          'Don\'t mind the clocks. They\'re all very loyal.',
          'You\'d be amazed how many guests arrive without luggage. Nearly all of them, in fact.'
        ];
        return [['valet', quips[g.save.valetQuip++ % quips.length]]];
      }},
      { id: 'ralston', x: 1, y: 4, talk: () => [
        ['ralston', 'William Ralston, Bank of California. I built this hotel: seven hundred and fifty-five rooms, hydraulic elevators they called rising rooms, and a court you could drive a coach-and-four into.'],
        ['ralston', 'My bank failed in August of 1875. The next afternoon I went for my usual swim off North Beach and didn\'t come back. The Palace opened two months later without me.'],
        ['ralston', 'Don\'t let the valet hurry you. He\'s been at that door since before I bought the doorknobs.']
      ]},
      { id: 'levi', x: 9, y: 4, talk: () => [
        ['levi', 'Levi Strauss, dry goods, Battery Street. I came in 1853 to sell canvas and thread to the miners.'],
        ['levi', 'A tailor from Reno named Jacob Davis put copper rivets on the pocket corners so they wouldn\'t tear. We patented it together in 1873. Half the city is wearing our idea, including you.'],
        ['me', 'I\'m wearing the jeans I was wearing. There\'s a tear in the knee that wasn\'t there this morning.']
      ]},
      { id: 'fireman', x: 4, y: 10, talk: () => [
        ['fireman', 'Lotta\'s Fountain. After the earthquake, this is where people came to find each other. They posted names on it. Found, and missing.'],
        ['fireman', 'The shaking lasted less than a minute. The fire burned three days. The water mains broke, so we dynamited whole blocks to stop it.'],
        ['fireman', 'Every April 18th, at twelve minutes past five in the morning, the survivors met here. Then their children. Then theirs. They still do.'],
        ['me', 'Five-twelve. That\'s the time on every clock here.'],
        ['fireman', '(He looks at me for a long moment.) Is it.']
      ]}
    ],
    doors: {
      '3,3': g => {
        if (g.minuteCount() >= 6) return [
          ['valet', 'Right this way. (The laughter is gone from his voice.) Second Empire furniture. Three sofas. A bronze on the mantel. No mirrors, no windows. Guests always ask about the windows.'],
          { do: g => g.goRoom() }
        ];
        return [['sys', 'The Palace door is heavy and cold. Through the glass: a long hallway, a bell ringing somewhere far down it. It doesn\'t open for me. Not yet.']];
      },
      '1,11': () => [['sys', 'A shuttered shop. In the window, a row of clocks, every one of them at 5:12.']],
      '9,11': () => [['sys', 'Locked. My reflection in the glass is a half-second late.']]
    }
  };

  /* ============ Row 2 ============ */
  S['0,2'] = {
    name: 'The Outer Sunset', sub: 'Judah Street', bg: BG.coast, mood: 'fog', ground: 'walk', doorStyle: 'V', grass: '#62805a',
    map: [
      '~s..kkk..VV',
      '~s..kek..VV',
      '~s..kek..DV',
      '~s.kkekkkkk',
      '~seeeeeeeee',
      '~sttttttttt',
      '~seeeeeeeee',
      '~skkkkkkkkk',
      '~sVVVDVVVVV',
      '~sVVVVVVVVV',
      '~skkkkkkkkk',
      '~seeeeeeeee',
      '~skkkkkkkkk'
    ],
    landmarks: [{ type: 'home', x: 5, y: 8, w: 1, h: 1 }],
    npcs: [
      { id: 'valet', x: 6, y: 7, dir: 'left', when: g => f(g, 'triedHome') && g.minuteCount() < 6, talk: g => [['valet', 'Lovely neighborhood. Very foggy. You have ' + g.minuteCount() + ' of your six minutes. The rest are out there, being held for you.']] }
    ],
    doors: {
      '5,8': g => {
        if (f(g, 'triedHome')) return [['sys', 'My door. Behind it, fog, all the way down. Not yet.']];
        return [
          ['me', '1512 Judah. My building. Same stupid mint-green paint.'],
          ['me', 'My key goes in. It turns. The door opens onto fog. Just fog, all the way down, like the building is a painting of a building.'],
          { do: g => { g.save.flags.triedHome = true; g.refreshNpcs(); } },
          ['valet', '(He\'s sitting on my front steps, somehow, lighting a cigarette that never gets any shorter.) Told you. Lovely neighborhood.'],
          ['me', 'How did you get here before me?'],
          ['valet', 'I\'m always a little ahead of the guests. Listen. You can\'t walk home from here. You have to remember your way. You\'ve misplaced some minutes: six, by my count. Five-oh-seven through five-twelve.'],
          ['valet', 'People out there are holding them. They don\'t know they\'re holding them. Help them with whatever they\'re stuck on and they\'ll hand back what\'s yours. Then come and see me at the Palace.']
        ];
      },
      '9,2': () => [['sys', 'Mrs. Okafor\'s door. She waters her succulents at six every morning. The succulents are here. She isn\'t.']]
    }
  };

  S['1,2'] = {
    name: 'Haight-Ashbury', sub: '710 Ashbury Street', bg: BG.hood, mood: 'town', ground: 'walk', doorStyle: 'V', grass: '#62805a',
    map: [
      'TT..ppp..TT',
      'T.........T',
      'kkkkkkkkkkk',
      'VVVVkekVVVV',
      'VVDVkekVDVV',
      'kkkkkekkkkk',
      'eeeeeeeeeee',
      'kkkkkekkkkk',
      'VVVVkekVVVV',
      'VDVVkekVVDV',
      'kkkkkekkkkk',
      '....kek....',
      '..T.kek.T..'
    ],
    landmarks: [{ type: 'ashbury', x: 8, y: 4, w: 1, h: 1 }],
    npcs: [
      { id: 'jerry', x: 7, y: 5, talk: () => [
        ['jerry', 'Jerry. I was born in this city. Grew up in the Excelsior, mostly, at my grandma\'s.'],
        ['me', 'My Nana lived in the Excelsior.'],
        ['jerry', 'Yeah? Then you know. We lived here at 710 Ashbury for a couple of years, the whole band. Wildest house on the street, and the street was pretty wild.'],
        ['jerry', 'You look like you\'re trying to get back to a song you heard once. Keep humming it. It comes back.']
      ]}
    ],
    doors: { '8,4': () => [['sys', '710 Ashbury. Somebody inside is tuning a guitar, and has been tuning it for a very long time.']] }
  };

  S['2,2'] = {
    name: 'The Castro', sub: 'Castro and Market', bg: BG.hood, mood: 'town', ground: 'walk', doorStyle: 'V', grass: '#62805a',
    map: [
      'VVVkkekkVVV',
      'VVDkkekkDVV',
      'kkkkkekkkkk',
      'XXXXkekVVVV',
      'XXXXkekVDVV',
      'kkkkkekkkkk',
      'eeeee=eeeee',
      'kkkkkekkkkk',
      'VVVVkekVVVV',
      'VVDVkekVVDV',
      'kkkkkekkkkk',
      '..,.kek.,..',
      'T...kek...T'
    ],
    landmarks: [{ type: 'castro', x: 0, y: 3, w: 4, h: 2 }],
    npcs: [
      { id: 'milk', x: 7, y: 5, talk: () => [
        ['milk', 'Harvey Milk. I ran a camera shop right there, 575 Castro. In 1977 this neighborhood elected me to the Board of Supervisors, the first openly gay man elected to public office in California.'],
        ['milk', 'Eleven months later a man walked into City Hall and shot the mayor and me. That\'s how it ended. It isn\'t what I was about.'],
        ['milk', 'What I was about is: you gotta give \'em hope. You look like you could use some. Take it. It\'s free, like the best things on Castro Street.']
      ]},
      { id: 'tomas', x: 2, y: 11, talk: () => [
        ['tomas', '(He\'s sewing a panel of fabric exactly the size of a grave: three feet by six.) The NAMES Project. It started here in 1987. Every panel is somebody\'s name.'],
        ['tomas', 'When they first laid the quilt out on the Mall in Washington, it covered more ground than a football field. It\'s so much bigger now.'],
        ['me', 'Whose name are you sewing?'],
        ['tomas', 'My own. My sister started it for me. I\'m just finishing the lettering. Time\'s about all there is, here.']
      ]}
    ],
    doors: { '8,4': () => [['sys', '575 Castro. A camera shop. In the window, a hand-lettered sign: COME IN. WE\'RE OPEN.']] }
  };

  S['3,2'] = {
    name: 'The Mission', sub: 'Mission Dolores', bg: BG.south, mood: 'town', ground: 'walk', xGround: 'grass', grass: '#62805a',
    map: [
      'BBkkkkkkkBB',
      'BDk.....kBB',
      'kkk.XXX.kkk',
      'kkk.XXX.kkk',
      'kkkk.p.kkkk',
      'eeeeeeeeeee',
      'kPkPkkkPkPk',
      'eeeeeeeeeee',
      'kkkkkkkkkkk',
      '..,..T..,..',
      '.T...,...T.',
      '...p.p.p...',
      '...ppppp...'
    ],
    landmarks: [{ type: 'mission', x: 4, y: 2, w: 3, h: 2 }],
    npcs: [
      { id: 'elder', x: 3, y: 3, talk: () => [
        ['elder', 'Before the Mission, before the Presidio, this creek fed the village of Chutchui. We are the Ramaytush Ohlone. This place was Yelamu.'],
        ['elder', 'Thousands of our people are buried under that garden. The adobe walls you admire, our hands made them.'],
        ['elder', 'Everyone you meet here thinks this city began with them. It is a very old habit. Tell them we are still here. Not only on this side. Out there, in your time, too.']
      ]},
      { id: 'settler', x: 7, y: 3, talk: () => [
        ['settler', 'I walked from Sonora with Captain Anza in 1775. Two hundred and forty of us. On the very first night a woman gave birth to a son, and she died by morning.'],
        ['settler', 'We were New Spain\'s farthest reach. When we got here the padres dedicated the Mission to Saint Francis. My daughter said the fog smelled like the sea turning into bread.']
      ]}
    ],
    doors: { '1,1': () => [['sys', 'A taquería, shutters down. Painted on them: a Virgin of Guadalupe with a Giants cap.']] }
  };

  S['4,2'] = {
    name: 'South of Market', sub: 'Folsom Street · Oracle Park', bg: BG.south, mood: 'town', ground: 'walk',
    map: [
      'BBkkkkkkXXB',
      'BDkkkkkkXXB',
      'kkkkkkkkkkk',
      'eeeeeeeeeee',
      'kkkkkkkkkkk',
      'kkkkkkk.www',
      'eeeeeee.ddW',
      'kkkkkkk.wWW',
      'BBk...XXXXW',
      'BBk...XXXXW',
      'BDk...XXXXW',
      'kkkk..kkkwW',
      'BBkkkkkkwWW'
    ],
    landmarks: [{ type: 'salesforce', x: 8, y: 0, w: 2, h: 2 }, { type: 'club', x: 0, y: 0, w: 2, h: 2 }, { type: 'oracle', x: 6, y: 8, w: 4, h: 3 }],
    npcs: [
      { id: 'mays', x: 4, y: 10, talk: () => [
        ['mays', 'Say hey! Willie Mays. The Giants came west in 1958 and brought me with them. Seals Stadium first, then that windy old Candlestick.'],
        ['mays', 'You know the address of this ballpark? 24 Willie Mays Plaza. Twenty-four, like my number. They thought of everything.'],
        ['mays', 'Candlestick wind would take a fly ball and drop it in another county. I caught \'em anyway. You gotta keep your eye on the thing, even when the wind is lying to you.']
      ]}
    ],
    doors: {
      '1,1': () => [['me', 'The club on Folsom. My club. I pulled the rolling door down and locked it at 5:07. The padlock is still warm.']],
      '1,10': () => [['sys', 'A loading dock. Someone has chalked on the door: THE FIRST FIFTEEN MINUTES ARE SCRIPTED.']]
    }
  };

  /* ============ Row 3 ============ */
  S['0,3'] = {
    name: 'Fort Funston', sub: 'Lake Merced · Battery Davis', bg: BG.coast, mood: 'fog', grass: '#6a7a58',
    map: [
      '~skkkkkk...',
      '~s.........',
      '~s..WWWW...',
      '~s.WWWWWW..',
      '~s.WWWWW...',
      '~s..WWW....',
      '~s.......kk',
      '~s^^.......',
      '~sXX...T...',
      '~sXX.......',
      '~s...T..T..',
      '~##########',
      '~##########'
    ],
    landmarks: [{ type: 'battery', x: 2, y: 8, w: 2, h: 2 }],
    drifters: [{ x: 6, y: 9, axis: 'h', range: 3 }, { x: 8, y: 2, axis: 'v', range: 3 }],
    npcs: [
      { id: 'gunner', x: 4, y: 9, talk: () => [
        ['gunner', 'Battery Davis. Two sixteen-inch guns, built to throw a shell twenty-five miles out to sea. We waited the whole war for an enemy fleet that never came.'],
        ['gunner', 'Now it\'s hang gliders and dogs off the leash. Honestly? That\'s the victory.'],
        ['gunner', 'Mind the grey ones drifting around out here. They don\'t mean any harm. They just forgot where they were going, and they\'ll make you forget where you were.']
      ]}
    ]
  };

  S['1,3'] = {
    name: 'Twin Peaks', sub: 'Sutro Tower', bg: BG.park, mood: 'fog', grass: '#7f7f58',
    map: [
      '^^..kek..^^',
      '^...kek...^',
      '^^..eee..^^',
      '^,..kkk..,^',
      '^^.......^^',
      '..,.....,..',
      'kkkkkkkkkkk',
      '...,...,...',
      '^^.XXX..^^^',
      '^^.XXX..^^^',
      '^.......,.^',
      '###########',
      '###########'
    ],
    landmarks: [{ type: 'sutroTower', x: 3, y: 8, w: 3, h: 2 }],
    npcs: [
      { id: 'gene', x: 7, y: 4, talk: () => [
        ['gene', 'Gene Roddenberry. I put Starfleet headquarters in San Francisco, a few centuries from now, right down there by the bridge. It seemed like the kind of city that would still be standing.'],
        ['gene', 'We made an episode once about a mirror universe: the same people, the same ship, everything a little bit wrong. You\'re in one of those. Not a mirror. More like a memory with the lights left on.'],
        ['gene', 'The way out of a place like this is never really a door. It\'s a decision. The door just waits for you to make it.']
      ]}
    ]
  };

  S['2,3'] = {
    name: 'Bernal Heights', sub: 'The earthquake cottages', bg: BG.park, mood: 'fog', grass: '#7a7f58',
    map: [
      '^^..kek..^^',
      '^...kek...^',
      '^.XX.k.XX.^',
      '^.XX.k.XX.^',
      '^...kkk...^',
      '..,......,.',
      'kkkkkkkkkkk',
      '.........,.',
      '^^..,.,..^^',
      '^^^.....^^^',
      '^^^^.,.^^^^',
      '###########',
      '###########'
    ],
    landmarks: [{ type: 'shack', x: 2, y: 2, w: 2, h: 2 }, { type: 'shack', x: 7, y: 2, w: 2, h: 2 }],
    drifters: [{ x: 5, y: 8, axis: 'h', range: 2 }],
    npcs: [
      { id: 'refugee', x: 4, y: 3, talk: () => [
        ['refugee', 'After the fire the city built little cottages for us in the parks, painted park-bench green. Thousands of them. You paid two dollars a month toward owning one.'],
        ['refugee', 'When the camps closed we hauled them off with horses and set them down wherever we could. There are still some here on Bernal Hill, with people living in them.'],
        ['refugee', 'The Excelsior\'s just over that hill. You\'ve got people there? Then you\'ll get home. People with people get home.']
      ]}
    ]
  };

  S['3,3'] = {
    name: 'Potrero Avenue', sub: 'San Francisco General Hospital', bg: BG.south, mood: 'hospital', ground: 'walk',
    map: [
      '....ppp....',
      'kkkkkkkkkkk',
      'eeeeeeeeeee',
      'kkkkkkkkkkk',
      '.XXXXXXX.kk',
      '.XXXXXXX.kk',
      '.XXXXXXX...',
      '.XXXDXXX.k.',
      'kkkkkkkkkkk',
      'eeeeeeeeeee',
      'kkkkkkkkkkk',
      '###########',
      '###########'
    ],
    landmarks: [{ type: 'sfGeneral', x: 1, y: 4, w: 7, h: 4 }],
    npcs: [
      { id: 'nurse', x: 9, y: 6, talk: () => [
        ['nurse', '(Her face is covered by a gauze mask.) Influenza, 1918. The city ordered everyone to wear masks in public. Some did. Some went to jail. Some joined the Anti-Mask League.'],
        ['nurse', 'I worked in this hospital. I still do, it seems. Can you hear that? That beeping? It\'s been going all morning. Steady. Somebody in there is very stubborn.'],
        ['me', 'I can hear it.'],
        ['nurse', 'Good. Keep listening. It\'s for you, love.']
      ]}
    ],
    doors: { '4,7': () => [['sys', 'A monitor beeps behind the door. Steady. Stubborn. The handle won\'t turn from this side.']] }
  };

  S['4,3'] = {
    name: 'Hunters Point', sub: 'The shipyard · Candlestick', bg: BG.south, mood: 'sea', ground: 'walk', xGround: 'grass',
    map: [
      'BBkkkkkkwWW',
      'BBk.....wWW',
      'kkk.....dWW',
      'kk.......dW',
      'kk....dddWW',
      'kkkkkkkkwWW',
      'eeeeeeeeeWW',
      'kkkkkkkkwWW',
      '..XXXXX..WW',
      '..XXXXX..WW',
      '..XXXXX...W',
      '#########WW',
      '#########WW'
    ],
    landmarks: [{ type: 'crateYard', x: 3, y: 2, w: 5, h: 3 }, { type: 'candlestick', x: 2, y: 8, w: 5, h: 3 }],
    drifters: [{ x: 8, y: 9, axis: 'v', range: 1 }],
    objects: g => [[1, 4, false], [2, 5, true], [3, 6, false]].map(([n, tx, paint]) => ({ kind: 'crate', n, label: String(n), tx, ty: 3, paint })),
    npcs: [
      { id: 'indy', x: 2, y: 2, talk: g => [
        ['indy', 'USS Indianapolis. On July 16th, 1945, the day of the Trinity test, we loaded a big crate and a lead canister right here at Hunters Point. Nobody told us what was in them. Marines guarded them day and night.'],
        ['indy', 'We delivered them to Tinian. Four days after that, a submarine sank us. Of about twelve hundred men, three hundred and sixteen came home.'],
        ...(f(g, 'solvedCrates') ? [] : [['indy', 'One thing I remember for sure: the real canister was never the one at the end of the row by the water. We kept it back from the edge. Regulations.']])
      ]},
      { id: 'welder', x: 3, y: 1, talk: g => [
        ['welder', 'Odessa. I came from Louisiana in 1943 to weld ships. Hunters Point hired thousands of us from the South. We built a whole neighborhood up that hill.'],
        ...(f(g, 'solvedCrates') ? [['welder', 'You found what you came for. Good. Now go on home before the whistle.']] : [['welder', 'I saw the man in the good suit with a paint can last night. Canister number two is still tacky. You can smell it from here.']])
      ]},
      { id: 'spy', x: 7, y: 1, talk: g => f(g, 'solvedCrates')
        ? [['spy', 'You chose well. History rarely does. Do svidaniya.']]
        : [
          ['spy', 'Grigory Kheifets. A diplomat at the Soviet consulate on Green Street. Officially. Unofficially, I was very interested in what the professors at Berkeley were building.'],
          ['spy', 'Three canisters. One holds what everyone is so worried about. The other two hold only lead and the smell of oranges. Choose. It is only history.']
        ] },
      { id: 'clark', x: 7, y: 9, talk: () => [
        ['clark', 'Dwight Clark. January 10th, 1982, the NFC Championship, right here at Candlestick. Fifty-eight seconds left. Third down. Joe rolled right and threw it high.'],
        ['clark', 'Everybody thought he was throwing it away. I jumped. They call it The Catch. I can still feel my fingertips on it.'],
        ['clark', 'Sometimes the pass that looks like it\'s sailing out of bounds is the one meant for you.']
      ]},
      { id: 'walsh', x: 1, y: 9, talk: () => [
        ['walsh', 'Bill Walsh. I coached here. We scripted the first fifteen plays of every game, so we knew what we were doing before the wind told us otherwise.'],
        ['walsh', 'You want a plan? Script your first fifteen minutes back home. Then improvise.']
      ]}
    ],
    onObject(g, o) {
      if (o.kind !== 'crate' || f(g, 'solvedCrates')) return;
      g.say([{ who: 'sys', ask: `Open canister ${o.n}?`, options: ['Open it.', 'Leave it.'], then: (g, i) => {
        if (i) return [];
        if (o.n === 1) return [['sys', 'Inside, packed in grey felt, is nothing that could hurt anyone: a cheap black wristwatch, stopped at 5:12. My watch.'], ['spy', '(Softly.) Of course. It was always going to be something small.'], { do: g => { g.save.flags.solvedCrates = true; g.giveMinute(12); } }];
        return [['sys', 'Lead lining, empty, and the smell of oranges.'], ['spy', '(He laughs quietly.) No. Think about who told you what.']];
      } }]);
    }
  };

  /* ============ The room ============ */
  S.room = {
    name: 'A Room at the Palace', sub: 'Second Empire furniture', bg: BG.room, mood: 'room', interior: true, noMap: true, mapAs: '4,1',
    map: [
      '###########',
      '#XXXXXXXXX#',
      '#rrrrrrrrr#',
      '#rrrrrrrrr#',
      '#rnnrrrnnr#',
      '#rrrrrrrrr#',
      '#rrrrrrrrr#',
      '#rrrrrrrrr#',
      '#rrrnnnrrr#',
      '#rrrrrrrrr#',
      '#rrrrrrrrr#',
      '#rrrrrrrrr#',
      '#####D#####'
    ],
    sofas: { '2,4': '#3b4f7a', '3,4': '#3b4f7a', '7,4': '#3f6a4f', '8,4': '#3f6a4f', '4,8': '#6b2a3a', '5,8': '#6b2a3a', '6,8': '#6b2a3a' },
    landmarks: [{ type: 'mantel', x: 1, y: 1, w: 9, h: 1 }],
    onEnter: g => f(g, 'metNana') ? null : 'nana',
    npcs: [
      { id: 'nana', x: 3, y: 5, talk: g => {
        if (f(g, 'metNana')) return [['nana', 'Go on, sweetheart. The door.']];
        return [
          ['nana', 'There\'s my baby. Come here, let me look at you. You never wear your helmet.'],
          ['me', 'Nana? You died. Two years ago. I was going to visit this weekend. I keep saying that.'],
          ['nana', 'I know, sweetheart. I heard you every weekend. It was very sweet and very lazy.'],
          ['nana', 'Some French fellow wrote a play about a room like this. Three people, no way out, and "hell is other people." He never met your aunties.'],
          ['nana', 'Here\'s the truth. Hell isn\'t other people. Other people are how you get home. The dogs, the poets, the lady with the lanterns. You helped them, and they handed you back your minutes.'],
          ['me', 'The door is open.'],
          ['nana', 'It always was. The valet will tell you nobody ever leaves. He says that to everybody. He\'s never once tried the handle himself.'],
          ['valet', '(Quietly, from the corner.) It\'s a very comfortable sofa.'],
          ['nana', 'Your mother is sitting in a plastic chair at San Francisco General and she hasn\'t eaten since four. Go let her yell at you about the helmet.'],
          { do: g => { g.save.flags.metNana = true; } }
        ];
      }},
      { id: 'valet', x: 8, y: 10, dir: 'left', talk: g => [['valet', f(g, 'metNana') ? 'I\'d show you out, but I\'ve never been out. You\'ll manage.' : 'Your grandmother has been waiting. She\'s very patient. Not as patient as the rooms.']] }
    ],
    doors: {
      '5,12': g => {
        if (!f(g, 'metNana')) return [['sys', 'The door stands open onto white light. Behind me, someone clears her throat.']];
        return [{ who: 'sys', ask: 'The door stands open. Beyond it: white light, and a steady beeping.', options: ['Walk through the door.', 'Sit down and stay a while.'],
          then: (g, i) => i === 0
            ? [{ do: g => g.ending() }]
            : [['nana', '(She pats the sofa beside her.) All right. For a minute.'], ['narrator', 'Across town, a heart monitor skips a beat, then finds its rhythm again.'], ['nana', 'That was a minute. Go on now.']] }];
      }
    }
  };

  const PROLOGUE = [
    { art: 'dark', narr: true, text: 'There is a San Francisco you have never visited. It shares every street with the one you know, every hill and every fog and every name. But in this city it is always twelve minutes past five in the morning, and nobody who lives here is entirely alive.' },
    { art: 'dark', narr: true, text: 'Tonight it has a visitor. He doesn\'t know it yet. He is riding his bicycle down Market Street, and the light at New Montgomery has just turned red.' },
    { art: 'title', text: 'I remember the fog. I remember the streetcar wires humming. Then I remember nothing. Then I\'m standing on the sidewalk in front of the Palace Hotel, and a man in a red coat is laughing at me.' }
  ];
  const ENDING = [
    { art: 'white', text: 'White. Then a ceiling: acoustic tiles, one of them stained in the shape of Lake Merced.' },
    { art: 'white', text: '"There you are. Welcome back. Can you open your eyes for me? You were gone for four minutes, and then you weren\'t."' },
    { art: 'white', text: 'San Francisco General. My mother asleep in a plastic chair with her coat on inside out. On the wall, a clock: 5:13. Moving.' },
    { art: 'dawn', text: 'Outside, the fog is lifting off Potrero Hill the way it does, all at once, like somebody remembered they left it on.' },
    { art: 'dark', narr: true, text: 'Consider one ordinary morning in one ordinary city, where every clock stopped at twelve past five, and a young man found his way home by listening to the dead.' },
    { art: 'dark', narr: true, text: 'You will not find that San Francisco on any map. But the next time the fog comes in, and the streetlights hum, and a stranger laughs as though you\'ve told a joke, you might check the time.' }
  ];

  // First-person hints for the B button, in the order the story tends to unfold.
  function hints(g) {
    const fl = g.save.flags, out = [];
    if (!fl.metValet) return ['The man in the red coat is waiting. I should talk to him.'];
    if (!fl.triedHome) out.push('Home. 1512 Judah, in the Outer Sunset. West, past the park, all the way to the fog.');
    if (!fl.solvedDogs) out.push(fl.nortonAsked ? 'Bummer and Lazarus are faster than me in the open. I should herd them into a corner of Union Square.' : 'Someone in Union Square is shouting decrees. East of the park, north of Market.');
    if (!fl.solvedLanterns) out.push(fl.lanternsAsked ? 'Mrs. Lee\'s lanterns: good fortune, the harvest moon, the mountains of home, then mourning. Red, gold, jade, white.' : 'There are paper lanterns in Portsmouth Square, in North Beach. Someone is tending them.');
    if (!fl.solvedPoem) out.push('The poets at the Six Gallery, out in the Marina, need their last lines. The words should rhyme: time, climb, stay, away.');
    if (!fl.solvedValves) out.push(fl.valvesAsked ? 'Sutro\'s valves: each one turns its neighbors too. The middle one is already open. Maybe work from the second and the fourth.' : 'The old Sutro Baths at Lands End. Someone is fussing with the plumbing.');
    if (!fl.solvedNet) out.push(fl.netAsked ? 'The rivet kegs at the Golden Gate: push each one sideways into the column of its mark first, then push it up.' : 'An ironworker at the foot of the Golden Gate Bridge looks like he\'s missing something.');
    if (!fl.solvedCrates) out.push('The canisters at Hunters Point. The sailor, the welder, and the man in the Union Square garage each know one thing.');
    if (g.minuteCount() >= 6) return ['All six minutes. The Palace Hotel. The door is open.'];
    return out;
  }

  window.OYE_WORLD = { CAST, SCREENS: S, MINUTES, PROLOGUE, ENDING, hints, GRID_W: 5, GRID_H: 4, START: { screen: '4,1', x: 4, y: 4 }, ROOM_START: { x: 5, y: 11 } };
})();
