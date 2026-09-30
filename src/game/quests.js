// The story, as quests: stages that finish by talking, going somewhere, finding things, or fighting.
import { CHARACTERS } from './story.js';

// Characters who appear in the Room beneath the hill
CHARACTERS.susannah_room = Object.assign({}, CHARACTERS.susannah, { place: 'room', greet: ['He kept my voice. Now he keeps the rest of me. Sit, it\'s your chair; it\'s everybody\'s chair.'], look: Object.assign({}, CHARACTERS.susannah.look) });
CHARACTERS.gil_room = Object.assign({}, CHARACTERS.gil, { place: 'room', greet: ['I told you not to come in here. Nobody listens to the COO.'] });

const Q = {};
/* ---------------- the main story ---------------- */
Q.m1 = { title: 'The Last Ferry', main: true, next: 'm2', stages: [
  { text: 'Find someone at the Ferry Building who knows the city.', talk: 'bautista', chips: [
    { label: 'I\'m looking for Hollis Vane.', reply: 'Hollis? Ha. You and every process server in California. ...Wait. Let me look at you. Híjole. You\'ve got his jaw. Okay, primo, listen: go to the Hotel Esperanza on Valencia. Edie runs it. She knew everybody back then. Tell her Bautista sent you and she\'ll give you the good towels.', fx: { xp: 20 } },
    { label: 'Can you take me to the Hotel Esperanza?', reply: 'Can I? Hold on to something. And don\'t look at the meter, there is no meter.', fx: { xp: 20, travel: 'esperanza' } }
  ] }
] };
Q.m2 = { title: 'Hotel Esperanza', main: true, next: 'm3', stages: [
  { text: 'Find the Hotel Esperanza on Valencia Street, in the Mission.', talk: 'edie', chips: [
    { label: 'My mother sent me. Marisela.', reply: 'I know, corazón. She wrote me. Last week, I think; letters take their time here. Here\'s your key, number seven, top of the stairs. And take the stick by the door; the streets aren\'t kind at night.', fx: { give: ['roomkey'], weapon: 'stick', flag: 'hotel', xp: 30 } }
  ] },
  { text: 'Ask Edie about Hollis Vane.', talk: 'edie', chips: [
    { label: 'Where is my father?', reply: 'Hollis started a company in a flat by South Park in \'99, him and a sweet boy named Rafa. Remnant, they called it. They kept the voices of the dying, so their families could go on talking to them. People say worse now. People say he took the whole city in with him. Go see Rafa; he still goes to the old office on Second Street.', fx: { xp: 20 } }
  ] }
] };
Q.m3 = { title: 'Remnant', main: true, next: 'm4', stages: [
  { text: 'Find Rafa at Remnant\'s old office on 2nd Street, by South Park.', talk: 'rafa', chips: [
    { label: 'What was Remnant?', reply: 'We recorded people who were dying. Four hundred hours each. Letters, voicemail, how they laughed. Families paid to hear them after. The servers went dark three years ago, and here\'s the thing nobody wants to hear: there was never anybody inside them. Whatever you\'re hearing on these streets at night, it\'s not us. Take my badge. It doesn\'t open anything anymore, but maybe you\'ll find a door that remembers it.', fx: { give: ['keycard'], xp: 40 } }
  ] },
  { text: 'Listen for the murmurs of the dead (3). Walk close to the pale lights in the streets.', murmurs: 3 },
  { text: 'Return to the Hotel Esperanza and rest.', talk: 'edie', chips: [
    { label: 'I need to lie down.', reply: 'Of course you do. Go on up. Don\'t listen too hard to the walls, corazón. They\'ll take your breath.', fx: { sleep: true, xp: 50 } }
  ] }
] };
Q.m4 = { title: 'Lone Mountain', main: true, next: 'm5', stages: [
  { text: 'Wake.', talk: 'dot', chips: [
    { label: 'Where am I?', advance: false, reply: 'Lone Mountain, sweetheart. Used to be Laurel Hill Cemetery. They moved the stones to Colma. They didn\'t move me. And now they didn\'t move you either.' },
    { label: 'Am I... dead?', reply: 'The murmurs took your breath at the Esperanza. It happens to people who listen. Don\'t fuss; it\'s why you can hear me so good. Edie\'s been dead since \'89, the pedicab boy since the fog took him. And your father too, kiddo. Four years. Nobody found him, because he\'s not where he should be. Now get up. There\'s smoke-people on this hill and they don\'t like the new ones.', fx: { flag: 'dead', xp: 60 } }
  ] },
  { text: 'Drive off the Hollows gathering on Lone Mountain (3).', hollows: { place: 'lonemountain', n: 3 } },
  { text: 'Speak with Dot again.', talk: 'dot', chips: [
    { label: 'They\'re gone. Who do I ask about my father?', reply: 'Gil Sedgwick. He sits in Huntington Park up on Nob Hill every day like he\'s waiting for a board meeting. He was your father\'s right hand. Anything Hollis did, Gil did the paperwork.', fx: { xp: 40 } }
  ] }
] };
Q.m5 = { title: 'Nob Hill', main: true, next: 'm6', stages: [
  { text: 'Find Gil Sedgwick in Huntington Park, on Nob Hill.', talk: 'gil', chips: [
    { label: 'Where is my father?', advance: false, reply: 'Direct. He\'d have liked that, briefly. Before I answer, I have a small document. It says you renounce any claim to the Vane estate. Sign it and I\'ll tell you everything.' },
    { label: 'Give me the paper. I\'ll sign.', reply: 'Wonderful. You\'re more reasonable than he ever was. He went under Twin Peaks, into a vault he built for a dead woman\'s voice, and he has not come out. Ask Dahlia at the house on Broadway about the woman. Keep the pen, it\'s yours; the estate is not.', fx: { light: -1, give: ['pen'], xp: 40, flag: 'signed' } },
    { label: 'I won\'t sign anything.', reply: 'Then I will tell you nothing, and you\'ll find out anyway, and it will cost you more. ...Oh, fine. Go to the house on Broadway. Ask Dahlia about Susannah Reyes. And never, ever go into the room under the hill.', fx: { light: 1, xp: 40 } }
  ] }
] };
Q.m6 = { title: 'The Vane House', main: true, next: 'm7', stages: [
  { text: 'Go to the Vane House on Broadway, in Pacific Heights.', talk: 'dahlia', chips: [
    { label: 'Tell me about Susannah Reyes.', reply: 'Miss Reyes was a poet from the Outer Sunset. She swam at Ocean Beach every morning. One morning in 2009 the water kept her. Mr. Vane had recorded every word she ever said, and after, he sat in a cold room with her voice and would not eat. Then he had the room built again, under the hill. Take her picture. She\'s at the Baths, by the Cliff House. She never did like this house.', fx: { give: ['portrait'], xp: 40 } }
  ] },
  { text: 'Find Susannah at the ruins of the Sutro Baths.', talk: 'susannah', chips: [
    { label: 'Hollis loved you.', advance: false, reply: 'He loved me the way you love a view: from a window, with the glass shut.', fx: { light: -0 } },
    { label: 'Where is he, Susannah?', reply: 'Under the twin hills. The stairs go down further than the water; at the bottom there\'s a door, and he has put a stone in its throat. None of us can go down. Take my shell. When you find the door, hold it up. The door will know the sea has sent you.', fx: { give: ['shell'], xp: 60 } }
  ] }
] };
Q.m7 = { title: 'The Ones Before', main: true, next: 'm8', stages: [
  { text: 'Speak with Ruth Encinas in the garden at Mission Dolores.', talk: 'ruth', chips: [
    { label: 'What are the stone stairs in the hills?', reply: 'Not ours, first of all. People want everything old here to be ours or to be nobody\'s. My grandmother called the stair-builders the ones before, and said to leave them be. That\'s respect. Here: you read a stair by putting your hand flat on the stone at the top and being quiet. Read three. Then go to the twin hills. And learn to be still; it will help you with the smoke-people.', fx: { ability: 'hush', xp: 60 } }
  ] },
  { text: 'Read the glyphs at the top of three stair temples in the hills (3).', glyphs: 3 },
  { text: 'Climb the Tide Stair on Twin Peaks.', talk: 'stairkeeper', chips: [
    { label: 'Who are you?', advance: false, reply: 'The last one who kept the stair. When the sea was far, we built a harbor. When the sea came, a stair. When the sea came again, another. The dead walk down. The boat waits. That is all it is.' },
    { label: 'How do I open the door?', reply: 'The door is under you. It opens for salt. You have salt. Beyond it a man has put a grey stone in the throat of the stair, and he sits behind it with two others. Take this blade. It was cut from the lowest step. Cut nothing living.', fx: { weapon: 'stairblade', xp: 80 } }
  ] },
  { text: 'Hold the shell to the round door at the summit of the Tide Stair.', door: 'tidedoor' }
] };
Q.m8 = { title: 'The Tide Door', main: true, next: 'after', stages: [
  { text: 'Go down the stair to the Tide Door.', reach: 'tidehall' },
  { text: 'Drive off the Hollows at the Tide Door (4).', hollows: { place: 'tidehall', n: 4 } },
  { text: 'Open the steel hatch in the grey stone.', door: 'hatch' },
  { text: 'Speak with your father.', talk: 'hollis', chips: [
    { label: 'Mother sent me.', advance: false, reply: 'Marisela. She laughed at me, the whole summer of \'98. Nobody else ever did. I didn\'t write because I didn\'t know how to write to someone who wasn\'t impressed.' },
    { label: 'Why don\'t any of you leave? The door is open.', advance: false, reply: 'Because if I get up, she walks out and never looks back. Because if Gil gets up, nobody will remember what he was worth. Because if she gets up, she has to forgive me first. So we sit. It\'s very civilized.' },
    { label: 'Open the Tide Door, Father. Let them all go down.', need: { light: 2 }, needText: 'needs Light 2: he would have to believe you', reply: 'You sound like her. Like both of them. ...All right. All right. Help me up. My knees have been in this chair for four years.', fx: { ending: 'light' } },
    { label: 'Get out of the chair. It\'s mine now.', reply: 'You would keep all of them? The whole city, murmuring, forever, for you? ...Yes. Yes, you\'re mine. Sit. It\'s warm.', fx: { ending: 'shade' } },
    { label: 'Stay, then. I\'m going home.', reply: 'Home. There\'s a ferry at the end of every night. Your brother knows the way. Tell him... no. Tell him nothing. Tell him I knew.', fx: { ending: 'ferry' } }
  ] }
] };
Q.after = { title: 'The City After', main: true, stages: [
  { text: 'Walk the city. The quests you left unfinished are still waiting.', never: true }
] };

/* ---------------- side quests ---------------- */
const accept = (label, reply) => ({ label, reply, fx: { xp: 10 } });
Q.incense = { title: 'Incense for the Hungry', giver: 'fong', stages: [
  { text: 'Talk to Grandma Fong on Waverly Place.', talk: 'fong', chips: [accept('What do the hungry ghosts need?', 'Incense, three places: the Tin How temple door right here, Portsmouth Square, and under the Dragon Gate on Grant. Light it and say something nice. Not too nice. They get suspicious.')] },
  { text: 'Light incense at three places in Chinatown (3).', collect: 'incense', n: 3 },
  { text: 'Return to Grandma Fong.', talk: 'fong', chips: [{ label: 'It\'s done. They\'re quiet.', reply: 'Good! Now they eat, now they sleep. Take some sticks for yourself. And eat something, aiya.', fx: { give: ['incense', 'incense', 'incense'], stat: 'will', xp: 80, light: 1 } }] }
] };
Q.pages = { title: 'Pages in the Wind', giver: 'nico', stages: [
  { text: 'Talk to Nico Carlotti on Columbus Avenue.', talk: 'nico', chips: [accept('I can look for your poem.', 'Five pages, man. The wind took them up the hill. Washington Square, the steps to Coit, the alleys. Go, go.')] },
  { text: 'Find the five pages of Nico\'s poem in North Beach (5).', collect: 'pages', n: 5 },
  { text: 'Bring the pages to Nico.', talk: 'nico', chips: [{ label: 'Here\'s your poem.', reply: '"The fog came in like a mother checking on the sleeping city / and every window said not yet, not yet / and the bay said I can wait, I am very good at waiting." ...Yeah. Yeah. It\'s done. Thank you, friend.', fx: { stat: 'skill', xp: 80, light: 1 } }] }
] };
Q.barbary = { title: 'Barbary Coast Rules', giver: 'jimmy', stages: [
  { text: 'Talk to Jimmy Doyle on the old Barbary Coast.', talk: 'jimmy', chips: [accept('I\'ll take your duel.', 'Ha! Stand off a few paces, and may the better blackguard win.')] },
  { text: 'Win the duel against Jimmy Doyle.', duel: 'jimmy' },
  { text: 'Talk to Jimmy Doyle.', talk: 'jimmy', chips: [{ label: 'Good fight.', reply: 'Good fight, says the one standing. Take the cane, it\'s earned. Mind the button on the handle.', fx: { weapon: 'canesword', xp: 100, stat: 'strength' } }] }
] };
Q.overdue = { title: 'Overdue', giver: 'oyelaran', stages: [
  { text: 'Talk to Mr. Oyelaran at the Main Library.', talk: 'oyelaran', chips: [{ label: 'Can I help?', reply: 'Three books, badly overdue. Chinatown, North Beach, the Mission. The return slots are by the doors. And remember: the libraries are safe. Rest in any branch you\'ve visited, and travel between them.', fx: { give: ['book1', 'book2', 'book3'], xp: 10 } }] },
  { text: 'Return the books to the Chinatown, North Beach and Mission branches (3).', collect: 'books', n: 3 },
  { text: 'Report to Mr. Oyelaran.', talk: 'oyelaran', chips: [{ label: 'All returned.', reply: 'Splendid. No fines, then, for anyone. Here: a card. Your name isn\'t on it yet. That\'s your job.', fx: { give: ['librarycard'], xp: 90, light: 1, stat: 'will' } }] }
] };
Q.charter = { title: 'Signatures', giver: 'lindqvist', stages: [
  { text: 'Talk to Delegate Lindqvist at the Veterans Building.', talk: 'lindqvist', chips: [accept('What did you lose?', 'Three pen nibs, from three signatures. On the plaza, by City Hall, near the library steps.')] },
  { text: 'Find three pen nibs around Civic Center (3).', collect: 'nibs', n: 3 },
  { text: 'Return to Delegate Lindqvist.', talk: 'lindqvist', chips: [{ label: 'Your signatures.', reply: 'Complete! Fifty nations and one young man\'s nib. It was worth it. It is still worth it. Thank you.', fx: { xp: 80, light: 1, stat: 'will' } }] }
] };
Q.pigments = { title: 'The Last Panel', giver: 'chuy', stages: [
  { text: 'Talk to Chuy Morales on Balmy Alley.', talk: 'chuy', chips: [accept('What do you need, carnal?', 'Three colors. Cochineal red from the Mission Dolores garden, ochre from the top of Bernal, and fog blue from Ocean Beach.')] },
  { text: 'Gather red, ochre and fog blue (3).', collect: 'pigments', n: 3 },
  { text: 'Bring the pigments to Chuy.', talk: 'chuy', chips: [{ label: 'Here are your colors.', reply: 'Look at that blue! Okay. The last panel is the ones who stayed. Take this, I pulled it out of the old bell from the church in \'06. The smoke-people hate it.', fx: { weapon: 'clapper', xp: 100, light: 1 } }] }
] };
Q.supper = { title: 'Sunday Supper', giver: 'marisol', stages: [
  { text: 'Talk to Marisol Tan in the Excelsior.', talk: 'marisol', chips: [accept('What\'s for supper?', 'Sourdough from the Ferry Building, dumplings from Stockton Street, pan dulce from 24th. Go, anak, the table\'s set.')] },
  { text: 'Bring bread, dumplings and pan dulce (3).', collect: 'groceries', n: 3 },
  { text: 'Bring supper to Marisol.', talk: 'marisol', chips: [{ label: 'Supper\'s here.', reply: 'Everybody sit! Everybody! ...Look at that. The whole block. Take some for the road. Take more. Hay nako, take it.', fx: { take: ['bread', 'dumplings', 'conchas'], give: ['sourdough', 'sourdough', 'sourdough', 'pandulce', 'pandulce'], xp: 90, light: 1 } }] }
] };
Q.exam = { title: 'Oral Exam', giver: 'okonkwo', stages: [
  { text: 'Talk to Professor Okonkwo at San Francisco State.', talk: 'okonkwo', chips: [accept('I\'m ready for the exam.', 'Excellent! Three questions. Take your time. You have, in a sense, all of it.')] },
  { text: 'Answer Professor Okonkwo\'s questions.', talk: 'okonkwo', quiz: [
    { q: 'First: in what year did the great earthquake and fire destroy most of the city?', options: ['1849', '1906', '1989'], answer: 1 },
    { q: 'Second: what lies buried beneath the Financial District?', options: ['Gold Rush ships', 'A Spanish fort', 'The first cable car'], answer: 0 },
    { q: 'Third: what did the 1968 strike on this campus create?', options: ['The first College of Ethnic Studies', 'The Golden Gate Bridge', 'The public library system'], answer: 0 }
  ], done: { reply: 'Full marks! Now let me show you something: the Hollows are made of forgetting. Remember hard, all at once, and it burns them. Like this.', fx: { ability: 'flare', stat: 'skill', xp: 100 } } }
] };
Q.towers = { title: 'The Tower Hollows', giver: 'tessa', stages: [
  { text: 'Talk to Tessa Kwan at Parkmerced.', talk: 'tessa', chips: [accept('I\'ll deal with the smoke things.', 'Cool. Cool cool cool. Four of them. Around the towers.')] },
  { text: 'Drive off the Hollows around Parkmerced (4).', hollows: { place: 'parkmerced', n: 4 } },
  { text: 'Tell Tessa.', talk: 'tessa', chips: [{ label: 'They\'re gone.', reply: 'Oh. Okay. That\'s... thanks. That\'s actually really nice. Nobody ever came up here for them. You did.', fx: { stat: 'strength', xp: 100, light: 1 } }] }
] };
Q.board = { title: 'The Board', giver: 'kai', stages: [
  { text: 'Talk to Kai Nakamura at Ocean Beach.', talk: 'kai', chips: [accept('I\'ll find your board.', 'Under the bridge, by Fort Point. The currents drop everything there.')] },
  { text: 'Find Kai\'s surfboard at Fort Point.', collect: 'board', n: 1 },
  { text: 'Return the board to Kai.', talk: 'kai', chips: [{ label: 'Here\'s your board.', reply: 'My board! Okay, okay, here\'s the trick. Don\'t fight the water. Drop your shoulder and let it carry you. Try it.', fx: { take: ['board'], ability: 'step', xp: 90 } }] }
] };
Q.unmoved = { title: 'The Unmoved', giver: 'anselm', stages: [
  { text: 'Talk to Brother Anselm on the Lone Mountain campus.', talk: 'anselm', chips: [accept('Where are the stones?', 'Lone Mountain, the Legion of Honor, the Mission Dolores yard, the Presidio. Say the name aloud. That is all.')] },
  { text: 'Find the four unmoved stones and say their names (4).', collect: 'stones', n: 4 },
  { text: 'Return to Brother Anselm.', talk: 'anselm', chips: [{ label: 'I said their names.', reply: 'Then they were heard. That is most of what anyone wants. Go with God, or with the fog, whichever you prefer.', fx: { light: 2, stat: 'will', xp: 100 } }] }
] };
Q.demoday = { title: 'Demo Day', giver: 'wren', stages: [
  { text: 'Talk to Wren Holloway in South Park.', talk: 'wren', chips: [
    { label: 'I\'ll invest.', reply: 'Oh my god. Oh my god! Okay. Okay. Term sheet by Friday. Brock will want to meet you, he\'s at the Transit Center. He does this... sparring thing. It\'s a culture thing.', fx: { light: -1, xp: 20 } },
    { label: 'Wren. You can stop now.', reply: '...Stop? You can\'t stop. If you stop it all... Okay. Okay. Can you tell Brock? He\'s at the Transit Center. He won\'t listen, he\'ll want to fight. He always wants to fight.', fx: { light: 1, xp: 20 } }
  ] },
  { text: 'Face Brock Tallis at the Salesforce Transit Center.', duel: 'brock' },
  { text: 'Return to Wren.', talk: 'wren', chips: [{ label: 'Brock\'s done.', reply: 'He\'s... done? Huh. It\'s so quiet. I think I\'m going to sit on this bench for a while and just look at the grass. Take these, I had like a hundred cold brews.', fx: { give: ['coffee', 'coffee', 'coffee'], xp: 100 } }] }
] };
Q.bells = { title: 'Ships\' Bells', giver: 'pike', stages: [
  { text: 'Talk to Captain Pike at Pier 7.', talk: 'pike', chips: [accept('I\'ll find the bells.', 'The Niantic at Clay and Sansome. The General Harrison at Battery and Clay. The Rome down by Folsom. Ring each once.')] },
  { text: 'Ring the bells of the three buried ships (3).', collect: 'bells', n: 3 },
  { text: 'Return to Captain Pike.', talk: 'pike', chips: [{ label: 'The bells have rung.', reply: 'I heard them. Every one. The crews can stand down. Take this hook; a longshoreman left it on the pier in \'34 and never came back for it. It pulls weight.', fx: { weapon: 'hook', xp: 100, light: 1 } }] }
] };
Q.vigilance = { title: 'Fort Gunnybags', giver: 'crane', stages: [
  { text: 'Answer Silas Crane on Front Street.', talk: 'crane', chips: [accept('I\'ll defend myself.', 'Then have at you.')] },
  { text: 'Defeat Silas Crane.', duel: 'crane' },
  { text: 'Speak to Silas Crane.', talk: 'crane', chips: [{ label: 'The city doesn\'t need you anymore.', reply: 'It never did. It only needed someone to blame. ...Go.', fx: { stat: 'strength', xp: 100 } }] }
] };
export const QUESTS = Q;
export const MAIN_ORDER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'after'];

export class QuestBook {
  constructor(state, hooks) {
    this.s = state; this.h = hooks;   // hooks: fx(fx, quest), notify(text, kind), counts()
    if (!state.quests) { state.quests = {}; this.start('m1', true); }
  }
  start(id, quiet) {
    if (this.s.quests[id]) return;
    this.s.quests[id] = { stage: 0, done: false, base: this.h.counts ? this.h.counts() : {} , quiz: 0 };
    if (!quiet) this.h.notify(`${QUESTS[id].main ? 'Story' : 'Quest'}: ${QUESTS[id].title}`, 'quest');
  }
  q(id) { return this.s.quests[id]; }
  stageOf(id) { const q = this.q(id); return q && !q.done ? QUESTS[id].stages[q.stage] : null; }
  active() { return Object.keys(this.s.quests).filter(id => !this.s.quests[id].done); }
  isStage(id, n) { const q = this.q(id); return !!q && !q.done && q.stage === n; }
  advance(id) {
    const q = this.q(id); if (!q || q.done) return;
    q.stage++; q.quiz = 0; q.base = this.h.counts ? this.h.counts() : {};
    if (q.stage >= QUESTS[id].stages.length) {
      q.done = true;
      this.h.notify(`Completed: ${QUESTS[id].title}`, 'done');
      if (QUESTS[id].next) this.start(QUESTS[id].next);
    } else this.h.notify(QUESTS[id].stages[q.stage].text, 'objective');
    this.h.changed && this.h.changed();
  }
  /** Chips to offer while talking to npc: quest actions first. */
  chipsFor(npc) {
    const out = [];
    for (const [id, def] of Object.entries(QUESTS)) {
      let st = this.stageOf(id);
      const q = this.q(id);
      if (!q && def.giver === npc && this.giverReady(id)) st = def.stages[0];   // an offer
      if (!st || st.talk !== npc) continue;
      if (st.quiz) {
        const k = q ? q.quiz : 0, item = st.quiz[k];
        item.options.forEach((opt, i) => out.push({ quest: id, label: opt, prompt: item.q, run: () => {
          if (i !== item.answer) return { reply: 'Not quite. Think about it again.', keep: true };
          if (k + 1 < st.quiz.length) { q.quiz = k + 1; return { reply: 'Correct. ' + st.quiz[k + 1].q, keep: true }; }
          this.h.fx(st.done.fx, id); this.advance(id); return { reply: st.done.reply };
        } }));
        continue;
      }
      for (const c of st.chips || []) {
        const locked = c.need && !this.meets(c.need);
        out.push({ quest: id, label: c.label, locked, lockedText: c.needText, run: () => {
          if (locked) return { reply: null, keep: true };
          if (!this.q(id)) this.start(id);
          if (c.fx) this.h.fx(c.fx, id);
          if (c.advance !== false) this.advance(id);
          return { reply: c.reply, keep: c.advance === false };
        } });
      }
    }
    return out;
  }
  giverReady(id) { return !this.s.quests[id]; }
  meets(need) { return (need.light === undefined || (this.s.light || 0) >= need.light); }
  // events from the world
  event(kind, arg) {
    for (const id of this.active()) {
      const st = this.stageOf(id); if (!st) continue;
      if (kind === 'reach' && st.reach === arg) this.advance(id);
      if (kind === 'door' && st.door === arg) this.advance(id);
      if (kind === 'duel' && st.duel === arg) this.advance(id);
    }
    this.check();
  }
  check() {
    const c = this.h.counts ? this.h.counts() : {};
    for (const id of this.active()) {
      const st = this.stageOf(id), q = this.q(id); if (!st) continue;
      if (st.collect && (c.sets[st.collect] || 0) >= st.n) this.advance(id);
      else if (st.murmurs && c.murmurs - (q.base.murmurs || 0) >= st.murmurs) this.advance(id);
      else if (st.glyphs && c.glyphs >= st.glyphs) this.advance(id);
      else if (st.hollows && (c.kills[id] || 0) >= st.hollows.n) this.advance(id);
    }
  }
}
