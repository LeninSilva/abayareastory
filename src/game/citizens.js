// The people on the sidewalks. Every passer-by is someone: a name, an age, a job, a block they live on,
// a way of talking, something they want and something they keep to themselves. They are made from a seed,
// so the same person is always the same person, and each has lines of their own for the written voice and a
// full brief for the live one.
import { PLACES } from './story.js';

// a small, fast, seeded random
function rng(seed) { let a = seed | 0; a ^= 0x9e3779b9; a = Math.imul(a ^ (a >>> 16), 0x85ebca6b); a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35); a = (a ^ (a >>> 16)) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pickR = (r, a) => a[Math.floor(r() * a.length)];

/* ---------- names, by family heritage (the city's own mix) ---------- */
const NAMES = {
  latino: { f: ['Marisol', 'Yesenia', 'Lupe', 'Graciela', 'Daniela', 'Rocío', 'Itzel', 'Carmen', 'Beatriz', 'Xiomara', 'Araceli', 'Paola', 'Leticia', 'Nayeli', 'Consuelo', 'Brenda'], m: ['Héctor', 'Joaquín', 'Rigoberto', 'Chuy', 'Mateo', 'Alonso', 'Ernesto', 'Iván', 'Nestor', 'Julio', 'Octavio', 'Rubén', 'Salvador', 'Wilfredo', 'Tomás', 'Edgar'], l: ['Ramírez', 'Orozco', 'Solís', 'Guerrero', 'Villalobos', 'Mejía', 'Durán', 'Portillo', 'Cárdenas', 'Arévalo', 'Henríquez', 'Zelaya', 'Ochoa', 'Barrientos', 'Quintanilla', 'Escobar'], lang: 'a word of Spanish now and then' },
  chinese: { f: ['Mei', 'Winnie', 'Lai Ying', 'Karen', 'Jing', 'Fiona', 'Siu Wah', 'Annie', 'Yvonne', 'Lily', 'Doris', 'Xiaoling', 'Pui Yee', 'Connie', 'Grace', 'Wendy'], m: ['Wing', 'Raymond', 'Kenny', 'Wai Man', 'Dennis', 'Jimmy', 'Hong', 'Albert', 'Kwok', 'Stanley', 'Ho Yin', 'Calvin', 'Ming', 'Gordon', 'Wesley', 'Bing'], l: ['Chan', 'Lee', 'Wong', 'Leung', 'Yee', 'Fong', 'Louie', 'Chin', 'Tam', 'Lau', 'Mak', 'Jue', 'Quan', 'Ng', 'Poon', 'Szeto'], lang: 'a word of Cantonese now and then' },
  filipino: { f: ['Rosalind', 'Marites', 'Joy', 'Cecilia', 'Liza', 'Analyn'], m: ['Ramon', 'Nonoy', 'Dante', 'Emil', 'Rodel', 'Ferdie'], l: ['Santos', 'Dizon', 'Manalo', 'Bautista', 'Villanueva', 'Pascual'], lang: 'a word of Tagalog now and then' },
  oldsf: { f: ['Maureen', 'Theresa', 'Dolores', 'Kathleen', 'Rosemary', 'Gina', 'Loretta'], m: ['Frank', 'Dominic', 'Sal', 'Kevin', 'Walt', 'Patrick', 'Vince'], l: ['Sullivan', 'Figone', 'O\'Brien', 'Molinari', 'Kearney', 'Cavalli', 'Shea', 'Rossi'], lang: '' },
  black: { f: ['Loretta', 'Denise', 'Imani', 'Gwendolyn', 'Tasha', 'Oretha', 'Nia'], m: ['Clarence', 'Marcus', 'Otis', 'DeShawn', 'Earl', 'Terrence', 'Lamont'], l: ['Washington', 'Brown', 'Jenkins', 'Dupree', 'Mayfield', 'Hollins', 'Carter'], lang: '' },
  russian: { f: ['Galina', 'Svetlana', 'Irina', 'Olga'], m: ['Yuri', 'Anatoly', 'Misha', 'Dmitri'], l: ['Volkov', 'Petrova', 'Sokolov', 'Kuznetsova'], lang: 'a word of Russian now and then' },
  japanese: { f: ['Emiko', 'Naomi', 'Aiko', 'Joyce'], m: ['Ken', 'Hiroshi', 'George', 'Tadashi'], l: ['Hamada', 'Okamura', 'Tanaka', 'Fujii'], lang: '' },
  vietnamese: { f: ['Linh', 'Thu', 'Hanh'], m: ['Minh', 'Bao', 'Tuan'], l: ['Nguyen', 'Tran', 'Pham'], lang: 'a word of Vietnamese now and then' },
  arab: { f: ['Samira', 'Layla'], m: ['Nabil', 'Hamza', 'Yusuf'], l: ['Haddad', 'Nasser', 'Alawi'], lang: 'a word of Arabic now and then' },
  samoan: { f: ['Malia', 'Sina'], m: ['Tavita', 'Iosefa'], l: ['Faleolo', 'Tuiasosopo'], lang: 'a word of Samoan now and then' },
  transplant: { f: ['Madison', 'Priya', 'Hannah', 'Chloe', 'Anjali', 'Sarah', 'Olivia', 'Ji-woo', 'Tamsin', 'Leah', 'Noor', 'Kavya', 'Brooke', 'Mira', 'Zoe', 'Ines'], m: ['Tyler', 'Arjun', 'Ben', 'Connor', 'Rohan', 'Eli', 'Nate', 'Dae-ho', 'Jonah', 'Vikram', 'Luca', 'Sam', 'Omar', 'Felix', 'Theo', 'Kofi'], l: ['Whitfield', 'Raman', 'Kessler', 'Brandt', 'Iyer', 'Park', 'Lindgren', 'Ashworth', 'Okafor', 'Novak', 'Mehta', 'Castellano', 'Hart', 'Sorensen', 'Adeyemi', 'Kaplan'], lang: '' }
};

/* ---------- the neighborhoods: what's true there, who lives there, what they do ---------- */
const HOODS = {
  'Mission': { mix: { latino: 5, transplant: 3, oldsf: 1, black: 1, filipino: 1 }, near: ['esperanza', 'missiondolores', 'balmy'],
    facts: ['Mission Dolores was founded in 1776, and its adobe church, finished in 1791, is the oldest building in the city', 'the murals on Balmy Alley started in the seventies and never stopped', 'Valencia was Irish and then ours and now it\'s everybody\'s, with the rent to match', 'the foil-wrapped burrito, the big one, was born on these blocks', 'on Twenty-Fourth, Calle 24, they still do Carnaval like they mean it', 'the sun comes out here when the Sunset is drowning in fog'],
    jobs: ['taquero on Mission Street', 'tenant organizer', 'mariachi who plays the Twenty-Fourth Street bars', 'muralist\'s assistant', 'panadería baker on Twenty-Fourth', 'bike mechanic on Valencia'] },
  'Chinatown': { mix: { chinese: 8, transplant: 1, vietnamese: 1 }, near: ['tinhow', 'portsmouth', 'dragongate'],
    facts: ['this is the oldest Chinatown in North America, since 1848', 'Portsmouth Square is where the city started, back when it was called Yerba Buena', 'the Dragon Gate on Grant only went up in 1970, whatever the tourists think', 'the Tin How temple on Waverly has been burning incense upstairs since the 1850s', 'they fold fortune cookies by hand in Ross Alley', 'the whole neighborhood burned in 1906 and the city tried to move us out; we rebuilt faster'],
    jobs: ['dim sum cart pusher on Stockton', 'herbalist on Jackson Street', 'fortune cookie folder in Ross Alley', 'SRO building manager', 'retired seamstress', 'produce man on Stockton'] },
  'North Beach': { mix: { oldsf: 4, chinese: 2, transplant: 3 }, near: ['citylights', 'washsq', 'coit'],
    facts: ['City Lights has been open since 1953 and they printed Howl in 1956', 'Washington Square isn\'t square, it has five sides', 'Coit Tower\'s murals went up in 1934 and made half the city furious', 'Caffe Trieste has been pulling espresso on Vallejo since 1956', 'the Filbert Steps go down the cliff through people\'s gardens', 'the old Italians play bocce and argue about everything else'],
    jobs: ['espresso barista on Columbus', 'poet who reads at open mics', 'retired fisherman from the Wharf', 'waiter at a red-sauce place on Columbus', 'accordion player'] },
  'Financial District': { mix: { transplant: 5, oldsf: 2, chinese: 2, black: 1 }, near: ['gunnybags', 'jackson', 'ferry'],
    facts: ['half of this is landfill over Gold Rush ships; they still dig up hulls when they build', 'the Transamerica Pyramid went up in 1972 and everyone hated it until they didn\'t', 'the Barbary Coast was two blocks from here, and it earned its name', 'the cable cars on California Street have been climbing since 1878'],
    jobs: ['window washer on the high-rises', 'bike messenger', 'bond trader', 'shoeshine man at the Embarcadero Center', 'security guard in a lobby nobody visits'] },
  'South of Market': { mix: { transplant: 5, filipino: 3, black: 1, latino: 1 }, near: ['southpark', 'remnant', 'salesforce'],
    facts: ['South Park was the first boom and the first bust, both before 2001', 'these were warehouses and print shops before they were lofts', 'Salesforce Tower opened in 2018 and it\'s the tallest thing the city has', 'SoMa Pilipinas is right here, Filipino families since the fifties', 'Yerba Buena Gardens sits on top of Moscone like a lid'],
    jobs: ['founder of a company that is almost out of money', 'product manager', 'content moderator who reads the worst things people type', 'event crew at Moscone', 'security guard at a server building on Second Street', 'data labeler working from a kitchen table'] },
  'Haight Ashbury': { mix: { transplant: 4, oldsf: 3, black: 1 }, near: ['paintedladies', 'twinpeaks', 'lonemountain'],
    facts: ['the Summer of Love was 1967 and the neighborhood never quite got over it', 'these Victorians survived 1906; the fire stopped at Van Ness', 'the Dead lived at 710 Ashbury', 'the Panhandle is the skinny bit of Golden Gate Park that sticks out'],
    jobs: ['record store clerk on Haight', 'vintage dealer', 'tarot reader', 'retired roadie'] },
  'Castro/Upper Market': { mix: { transplant: 4, oldsf: 3, latino: 1, black: 1 }, near: ['castro', 'twinpeaks', 'missiondolores'],
    facts: ['the Castro Theatre opened in 1922 and the organ still rises out of the floor', 'Harvey Milk had his camera shop right on Castro Street', 'Gilbert Baker sewed the first rainbow flag here in 1978', 'Twin Peaks sits right above us like it\'s listening'],
    jobs: ['drag performer', 'bartender on Castro', 'florist', 'retired AIDS hospice nurse', 'hairdresser'] },
  'Western Addition': { mix: { black: 4, japanese: 2, transplant: 3 }, near: ['paintedladies', 'cityhall', 'lonemountain'],
    facts: ['the Fillmore was the Harlem of the West; jazz until four in the morning', 'redevelopment in the sixties knocked down whole blocks of it', 'Japantown is just up the hill, what\'s left after the internment', 'the Painted Ladies are on Steiner, facing Alamo Square'],
    jobs: ['church deacon', 'jazz drummer', 'barber on Divisadero', 'city bus mechanic'] },
  'Pacific Heights': { mix: { transplant: 5, oldsf: 3 }, near: ['vanehouse', 'palacefa', 'paintedladies'],
    facts: ['the Lyon Street steps are the best free workout in the city', 'every mansion up here has a story and a lawyer', 'Fillmore Street turns into boutiques at the top of the hill'],
    jobs: ['nanny', 'private chef', 'dog walker with nine dogs', 'estate lawyer', 'house painter'] },
  'Marina': { mix: { transplant: 7, oldsf: 2 }, near: ['palacefa', 'fortpoint', 'goldengate'],
    facts: ['the Marina is fill for the 1915 fair, and it shook like jelly in 1989', 'the Palace of Fine Arts is the one thing they kept from 1915', 'Crissy Field was an airfield once'],
    jobs: ['yoga teacher', 'associate at a venture fund', 'sailboat rigger at the St. Francis', 'personal trainer'] },
  'Nob Hill': { mix: { transplant: 3, chinese: 2, oldsf: 3 }, near: ['huntington', 'cablebarn', 'dragongate'],
    facts: ['the railroad barons built up here, and 1906 burned all of it but one stone house', 'the Fairmont\'s shell survived the fire, and they drafted the UN Charter there in 1945', 'Grace Cathedral has a labyrinth you can walk', 'the cable car barn is still running the whole system'],
    jobs: ['hotel doorman at the Fairmont', 'cable car gripman', 'church choir director', 'concierge'] },
  'Russian Hill': { mix: { transplant: 4, oldsf: 3, russian: 1, chinese: 1 }, near: ['washsq', 'coit', 'cablebarn'],
    facts: ['the crooked block of Lombard gets all the photos', 'Macondray Lane is the prettiest lane in the city', 'the Hyde Street cable car drops you practically into the bay'],
    jobs: ['cable car conductor', 'architect', 'retired schoolteacher', 'painter'] },
  'Inner Richmond': { mix: { chinese: 4, russian: 2, transplant: 2, oldsf: 1 }, near: ['legion', 'goldengate', 'lonemountain'],
    facts: ['Clement Street is the second Chinatown, and the dim sum is better', 'the gold domes on Geary are the Russian cathedral', 'the fog comes up Geary like it\'s late for work'],
    jobs: ['produce grocer on Clement', 'Russian bakery owner', 'bookstore clerk on Clement', 'MUNI operator on the 38 Geary'] },
  'Outer Richmond': { mix: { chinese: 3, russian: 3, oldsf: 2, transplant: 2 }, near: ['sutrobaths', 'legion', 'oceanbeach'],
    facts: ['the Sutro Baths burned in 1966; the foundations are still down there in the surf', 'Lands End trail goes around the headland above the wrecks', 'it is foggy here in July, every July'],
    jobs: ['retired sea captain', 'surf photographer', 'deli owner on Balboa', 'hospice nurse'] },
  'Inner Sunset': { mix: { transplant: 3, chinese: 3, oldsf: 2 }, near: ['twinpeaks', 'stignatius', 'oceanbeach'],
    facts: ['Irving Street is all noodle shops and bike shops', 'the N Judah goes straight to the ocean, eventually', 'the hospital on the hill is where half the city was born'],
    jobs: ['medical resident at the hospital on Parnassus', 'noodle shop owner', 'N Judah operator'] },
  'Outer Sunset': { mix: { chinese: 4, oldsf: 2, transplant: 2, vietnamese: 1 }, near: ['oceanbeach', 'sfsu', 'twinpeaks'],
    facts: ['all of this was sand dunes until the thirties and forties', 'Ocean Beach will kill you if you don\'t respect it', 'the houses are all the same and none of them are the same'],
    jobs: ['surf shop clerk', 'retired schoolteacher', 'contractor', 'dim sum takeout cook on Noriega'] },
  'Parkside': { mix: { chinese: 4, oldsf: 3, transplant: 1 }, near: ['sfsu', 'oceanbeach', 'parkmerced'],
    facts: ['the L Taraval runs all the way to the zoo', 'Stern Grove has free concerts in the summer, in the fog'],
    jobs: ['zookeeper', 'retired firefighter', 'accountant'] },
  'Excelsior': { mix: { latino: 3, filipino: 3, chinese: 2, oldsf: 2, samoan: 1 }, near: ['excelsior', 'bernal', 'davidson'],
    facts: ['the streets here are named for world capitals and countries: Paris, London, Madrid, Moscow', 'Mission Street out here is still a neighborhood street', 'McLaren Park is the second biggest in the city and nobody knows it'],
    jobs: ['auto mechanic on Mission Street', 'bakery owner', 'caregiver', 'nurse at SF General', 'Muni operator on the 14'] },
  'Bernal Heights': { mix: { transplant: 3, latino: 2, oldsf: 2 }, near: ['bernal', 'balmy', 'excelsior'],
    facts: ['you can see the whole city from the top of Bernal Hill', 'Cortland Avenue is the main street of a small town', 'they call it Maternal Heights for all the strollers'],
    jobs: ['preschool teacher', 'carpenter', 'beekeeper'] },
  'Potrero Hill': { mix: { transplant: 4, black: 2, latino: 1 }, near: ['balmy', 'remnant', 'bernal'],
    facts: ['Vermont Street is crookeder than Lombard and nobody visits', 'the view of downtown from here is the best one', 'it gets the sun when the rest of the city doesn\'t'],
    jobs: ['brewer', 'furniture maker', 'city planner'] },
  'Bayview': { mix: { black: 4, samoan: 2, latino: 2, chinese: 1 }, near: ['excelsior', 'bernal', 'remnant'],
    facts: ['Hunters Point was a naval shipyard; my father built ships there in the war', 'the Third Street rail line came back in 2007', 'Candlestick is gone now, just wind'],
    jobs: ['retired shipyard welder', 'church choir director', 'youth football coach', 'truck driver'] },
  'Noe Valley': { mix: { transplant: 6, oldsf: 2 }, near: ['castro', 'twinpeaks', 'bernal'],
    facts: ['Twenty-Fourth Street is a village if you squint', 'the J Church rattles right down the middle of it'],
    jobs: ['pediatrician', 'bookseller on Twenty-Fourth', 'stay-at-home dad who used to be an engineer'] },
  'Glen Park': { mix: { transplant: 3, oldsf: 3, latino: 1 }, near: ['davidson', 'twinpeaks', 'bernal'],
    facts: ['Glen Canyon has a creek in it, a real one', 'the BART station looks like a concrete spaceship'],
    jobs: ['naturalist', 'BART station agent'] },
  'Downtown/Civic Center': { mix: { black: 2, transplant: 3, vietnamese: 2, arab: 1, filipino: 1, latino: 1 }, near: ['library', 'cityhall', 'unplaza'],
    facts: ['City Hall\'s dome is taller than the Capitol\'s in Washington', 'the UN Charter was signed across the street in 1945', 'the Tenderloin is right there, and people look after each other more than you\'d think', 'the Main Library lets anybody in, which is the whole point'],
    jobs: ['corner store owner on Larkin', 'social worker', 'Opera stagehand', 'street chess player on Market', 'court clerk'] },
  'Presidio': { mix: { transplant: 6, oldsf: 2 }, near: ['fortpoint', 'goldengate', 'palacefa'],
    facts: ['the Presidio was an army post from 1776 to 1994', 'Fort Point sits right under the bridge', 'the eucalyptus up here were planted by soldiers'],
    jobs: ['park ranger', 'archaeologist on a dig by the old officers\' club'] },
  'West of Twin Peaks': { mix: { oldsf: 3, chinese: 3, transplant: 2 }, near: ['davidson', 'twinpeaks', 'stignatius'],
    facts: ['the Twin Peaks tunnel opened in 1918 and made all this possible', 'St. Francis Wood has gates like it\'s keeping something out', 'the cross on Mount Davidson is the highest point in the city'],
    jobs: ['retired judge', 'piano teacher', 'orthodontist'] },
  'Lakeshore': { mix: { transplant: 3, chinese: 3, filipino: 2, black: 1 }, near: ['sfsu', 'parkmerced', 'oceanbeach'],
    facts: ['State had the longest student strike in the country, 1968, and it made the first ethnic studies college', 'Lake Merced used to be a lagoon open to the sea'],
    jobs: ['graduate student at State', 'librarian at State', 'golf course groundskeeper'] },
  'Golden Gate Park': { mix: { transplant: 3, oldsf: 3, chinese: 2 }, near: ['stignatius', 'oceanbeach', 'twinpeaks'],
    facts: ['this park was sand dunes, and it\'s bigger than Central Park', 'there have been bison in the paddock since the 1890s', 'the Conservatory of Flowers came around the Horn in pieces in 1879'],
    jobs: ['gardener for Rec and Park', 'bison keeper', 'roller skater who teaches lessons'] }
};
// how people say where they live
const SAY = { 'Mission': 'the Mission', 'Financial District': 'the Financial District', 'South of Market': 'SoMa', 'Haight Ashbury': 'the Haight', 'Castro/Upper Market': 'the Castro', 'Western Addition': 'the Western Addition', 'Marina': 'the Marina', 'Inner Richmond': 'the Inner Richmond', 'Outer Richmond': 'the Outer Richmond', 'Inner Sunset': 'the Inner Sunset', 'Outer Sunset': 'the Outer Sunset', 'Excelsior': 'the Excelsior', 'Bayview': 'the Bayview', 'Downtown/Civic Center': 'the Tenderloin', 'Presidio': 'the Presidio', 'Golden Gate Park': 'the Inner Sunset, by the park', 'West of Twin Peaks': 'West Portal', 'Treasure Island/YBI': 'Treasure Island', 'Lakeshore': 'Lakeshore', 'Seacliff': 'Sea Cliff', 'Twin Peaks': 'Twin Peaks' };
const DEFAULT_HOOD = { mix: { transplant: 3, oldsf: 2, latino: 1, chinese: 1, filipino: 1, black: 1 }, near: ['ferry', 'library', 'twinpeaks'], facts: ['every neighborhood in this city thinks it is the real San Francisco', 'the fog does what it wants'], jobs: ['Muni operator', 'nurse at SF General'] };

const JOBS = ['barista', 'line cook', 'bike messenger', 'delivery rider', 'locksmith', 'dog walker', 'retired longshoreman from the ILWU', 'public school teacher', 'Public Works street sweeper', 'walking-tour guide', 'florist at the Flower Mart', 'night-shift security guard at a server building', 'recruiter for companies nobody\'s heard of', 'parking control officer', 'bartender', 'tattoo artist', 'realtor', 'housecleaner', 'paralegal', 'UX researcher at a company that promises to make grief searchable', 'engineer between jobs', 'nurse at SF General', 'Muni operator', 'ferry deckhand', 'fishmonger at Pier 45', 'street musician', 'plumber', 'retired postal carrier'];

/* ---------- temperament: how they talk ---------- */
const VOICES = [
  { v: 'Clipped and suspicious; answers questions with questions and gives away as little as possible until trusted.', greet: ['What. You lost?', 'You\'re standing very close to me for a stranger.'], tone: 'guarded' },
  { v: 'Chatty and tangential: every answer turns into a story about a cousin, a landlord or a bus that never came. Warm underneath.', greet: ['Oh, hi! Sorry, I was just thinking about my cousin. Long story. You want the long story?', 'Hey hey. You look like you need directions or a sandwich, and I can only do one.'], tone: 'chatty' },
  { v: 'Bone-dry deadpan. Understates everything. Very funny without ever smiling.', greet: ['Nice evening. For a Tuesday. Whatever day it is.', 'Hello. I\'d shake your hand but I don\'t know where it\'s been.'], tone: 'dry' },
  { v: 'Warm and parental; calls strangers "honey" or "kid", worries about whether they have eaten, scolds gently.', greet: ['Honey, you look cold. Where\'s your jacket? This is San Francisco.', 'Kid. Have you eaten today? Don\'t lie to me.'], tone: 'warm' },
  { v: 'Anxious and fast; apologizes too much, loses the thread, then says something piercingly honest.', greet: ['Sorry, sorry, was I in your way? I\'m always in the way. Hi.', 'Oh! You startled me. Everything startles me lately. Hi.'], tone: 'anxious' },
  { v: 'Theatrical and grand; quotes poetry (sometimes wrong), treats the sidewalk like a stage.', greet: ['Ah! A traveler! "Stranger, if you passing meet me..." — Whitman, roughly. Hello.', 'Welcome to the evening\'s performance. It\'s free. Most things worth seeing are.'], tone: 'grand' },
  { v: 'Speaks in startup language without any irony ("circle back", "at scale", "north star"), then catches themselves and gets sad.', greet: ['Hey! Quick sync? Kidding. Sort of. What\'s your deal?', 'Hi, hello. Sorry, I\'m between calls. I\'m always between calls.'], tone: 'startup' },
  { v: 'Old-school San Franciscan: knows every bus line by number, complains about how it used to be, secretly loves how it is.', greet: ['You\'re not from here. I can tell. Nobody from here stands in the middle of the sidewalk.', 'Afternoon. You waiting for the bus? Don\'t. Walk. It\'s faster.'], tone: 'oldtimer' },
  { v: 'Slow and gentle, with long pauses (written as ellipses); notices small things, like light and birds.', greet: ['Oh... hello. Did you see the light just now, on the windows? ...It\'s gone.', 'Hello... there\'s a hummingbird in that tree. Don\'t move.'], tone: 'gentle' },
  { v: 'Blunt and salty but never cruel; says exactly what they think, then asks what you think.', greet: ['Yeah? What do you want. Kidding. Mostly. Hi.', 'You look like hell. Welcome to the club. What\'s up?'], tone: 'blunt' },
  { v: 'Teasing and flirtatious in a harmless way; turns everything into a little game.', greet: ['Well, hello. You come here often? Kidding, nobody comes here on purpose.', 'Hi, stranger. Guess what I do for a living. You get three tries.'], tone: 'teasing' },
  { v: 'Philosophical; answers practical questions with questions about time, memory and what a city is.', greet: ['Do you ever think a street remembers you? ...Hello, sorry. Hello.', 'Hello. Do you know how many people have stood exactly here? I think about that.'], tone: 'deep' }
];

const WANTS = [
  'to get back the security deposit from a landlord who "sold the building" in 2014',
  'to hear a late partner\'s old voicemail one more time; the phone company deleted it',
  'to catch the last N Judah home, which is always just about to come',
  'to stay in the city even though the rent is impossible',
  'to be known by name on the block again, the way it was before everyone moved away',
  'to sell their little company before the money runs out, and to be told it mattered',
  'to find the dog that ran off during the fireworks',
  'to find out whether their mother read their last text message',
  'to apologize to a brother in Daly City they haven\'t spoken to in eleven years',
  'to see the whole bay from the top of Sutro Tower, just once',
  'to finish a painting of the view from their window before the new building blocks it',
  'to get their grandmother\'s ring back from a pawnshop on Mission that closed',
  'a real night\'s sleep; they haven\'t had one in a long time and can\'t remember why',
  'to be left alone, mostly, and to be asked about their life, occasionally'
];
const SECRETS = [
  'Before they died they signed a parent up for the Keep, the Remnant service that recorded the dying, and they have never listened to a single hour of it.',
  'They sleep in the office. Nobody knows. The couch is fine.',
  'They were the one who called in the fire that closed the old bookstore, and they never said.',
  'They still pay for a phone line in a flat they left years ago, in case someone calls it.',
  'They do not remember how they got to this corner, or how long they have been walking.',
  'They know where Hollis Vane used to eat breakfast: Sears Fine Food on Powell, silver dollar pancakes, alone.',
  'They once worked a single week at Remnant and quit without saying why. It was the voices in the server room.',
  'They have a key to a door under a stair in their building that opens onto stone steps going down, and they have never gone down.',
  'They are in love with someone who comes by on the same bus every day and they have never said a word.',
  'They sold their parents\' flat and told their sister it was foreclosed.',
  'They have not been able to feel the cold for a while now, and it frightens them.',
  'They take a little bread to Lone Mountain every week for someone buried there whose name is worn off.'
];
const QUIRKS = [['counts the steps on every staircase out loud', 'count the steps on every staircase out loud'], ['carries a Muni transfer from 1987 in their wallet', 'carry a Muni transfer from 1987 in my wallet'], ['hums the same four notes of a song they can\'t name', 'hum the same four notes of a song I can\'t name'], ['never crosses on the red, even at three in the morning', 'never cross on the red, even at three in the morning'], ['names the crows on their block', 'name the crows on my block'], ['wears a watch that stopped at 5:04', 'wear a watch that stopped at 5:04'], ['collects the little plastic tables from pizza boxes', 'collect the little plastic tables from pizza boxes'], ['refuses to say the word "Frisco" and flinches when others do', 'refuse to say "Frisco", and I flinch when other people do'], ['keeps a pocket full of sourdough crust for the gulls', 'keep a pocket full of sourdough crust for the gulls'], ['knows the height of every hill and says it in feet', 'know the height of every hill, in feet']];

// what they think of the rumor about Hollis Vane
const STANCES = [
  { k: 'believer', knows: 'They believe the rumor that Hollis Vane put the whole city into his machines, and it terrifies them.', lines: ['They say Vane put everybody into his computers. The whole city. That\'s why the streets talk at night. I don\'t use my phone after dark anymore.', 'Vane? My neighbor says he recorded all of us. Every word. Sometimes I say something nice out loud, just in case.'] },
  { k: 'skeptic', knows: 'They think the rumor about Hollis Vane is nonsense and say so, but something about the city lately bothers them.', lines: ['The Vane thing? People need a villain with a logo. Nobody uploaded anybody. Something\'s wrong with this city, sure. It isn\'t software.', 'Hollis Vane was a guy with a company and a lot of money. That\'s all the explanation most things in this town need.'] },
  { k: 'worked', knows: 'They once did a short contract job for Remnant and saw the Keep: rooms of hard drives full of the voices of the dying. They think the machines were empty and the voices come from somewhere older.', lines: ['I did a contract for Remnant once. Six weeks. Wiring. There was nothing in those machines but tape and grief. Whatever\'s in the streets now, it didn\'t come from there.', 'I saw the Keep. Racks and racks, cold as a church. You want to know the strange part? The rooms were warmer when the power was off.'] },
  { k: 'afraid', knows: 'They avoid the subject of Hollis Vane and the Keep; their mother was recorded by it before she died.', lines: ['Please don\'t ask me about Vane. My mother is in one of those... recordings. I paid for it. I\'ve never pressed play.', 'I don\'t talk about the Keep. Ask me about anything else. Ask me about the weather.'] },
  { k: 'indifferent', knows: 'They have barely heard of Hollis Vane and care far more about rent and the bus.', lines: ['Vane, Vane... the name on the building by South Park? Honey, I\'m trying to make rent. Rich men\'s ghosts are not my department.', 'Never met him. Rich guys come and go in this city like fog. The bus never comes at all.'] }
];

const LOOKS = {
  skin: [0xf0cfb0, 0xe0b894, 0xd8b48e, 0xc99a78, 0xb88763, 0xa8765a, 0x8a5a3c, 0x6e4630, 0x5a3a28],
  hairYoung: [0x1a1410, 0x2a1d16, 0x3a2a1a, 0x6a4a2a, 0xb89060, 0xd8b060, 0x7a2a1a, 0x101010],
  hairOld: [0xb8b8b8, 0xd8d4cc, 0x8a8680, 0xe8e6e0],
  tops: [0x3a4a5a, 0x7a3a2a, 0x2a2a2a, 0x5a6a4a, 0x8a7a6a, 0x2a4a6a, 0xa8342a, 0xd8c8a0, 0x4a3a5a, 0xc89a3a, 0x2e5a4e, 0xe0dcd4],
  bottoms: [0x2a2a30, 0x3a3d44, 0x4a4030, 0x3a4a6a, 0x5a5048],
  coats: [0x3a3530, 0x4a4038, 0x2a3040, 0x6a5040, 0x1e1e22, 0x7a6a50]
};

let counter = 0;
/** Make a person. seed: any integer; district: the neighborhood they are in; near: [x,z] for pointing the way. */
export function makeCitizen(seed, district, opts = {}) {
  const r = rng(seed);
  const hood = HOODS[district] || DEFAULT_HOOD;
  // heritage from the neighborhood's mix
  const mix = Object.entries(hood.mix), tot = mix.reduce((a, [, w]) => a + w, 0);
  let x = r() * tot, her = mix[0][0]; for (const [k, w] of mix) { if ((x -= w) < 0) { her = k; break; } }
  const N = NAMES[her], fem = r() < 0.5;
  // families mix in this city: now and then a first name from one side and a last name from the other
  const N2 = r() < 0.2 ? NAMES[pickR(r, Object.keys(NAMES))] : N;
  const first = pickR(r, fem ? N2.f : N2.m), last = pickR(r, N.l);
  const age = opts.age || Math.round(19 + Math.pow(r(), 1.3) * 66);
  const job = opts.job || (r() < 0.55 ? pickR(r, hood.jobs) : pickR(r, JOBS));
  const temper = VOICES[Math.floor(r() * VOICES.length)];
  const want = pickR(r, WANTS), secret = pickR(r, SECRETS), [quirk, quirkMe] = pickR(r, QUIRKS);
  const stance = STANCES[Math.floor(r() * STANCES.length)];
  const years = Math.max(1, Math.min(age - 3, Math.round(2 + r() * (age - 10))));
  const native = r() < (her === 'transplant' ? 0.08 : 0.6);
  const fact1 = pickR(r, hood.facts), fact2 = pickR(r, hood.facts.filter(f => f !== fact1).concat(DEFAULT_HOOD.facts));
  const dead = r() < 0.45;
  const deadYear = 1906 + Math.floor(r() * 118);
  const place = SAY[district] || district || 'the city';
  const pro = fem ? ['she', 'her'] : ['he', 'his'];
  const name = `${first} ${last}`;
  const tag = opts.tag || `the ${job.split(/ (on|at|in|for|who|from|between|to|of|that|with|by|outside|checking|pitching) /)[0]}`;
  const lang = N.lang && r() < 0.7 ? ` Uses ${N.lang}.` : '';
  const look = {
    skin: pickR(r, LOOKS.skin), hair: age > 58 ? pickR(r, LOOKS.hairOld) : pickR(r, LOOKS.hairYoung),
    hairStyle: age > 70 && !fem && r() < 0.5 ? 'bald' : fem ? pickR(r, ['long', 'bun', 'short', 'braid', 'afro', 'long']) : pickR(r, ['short', 'short', 'afro', 'bald', 'long', 'braid']),
    top: opts.top || pickR(r, LOOKS.tops), bottom: pickR(r, LOOKS.bottoms),
    coat: r() < 0.4 ? pickR(r, LOOKS.coats) : false, hat: r() < 0.22 ? pickR(r, ['beanie', 'cap', 'fedora']) : 'none', hatColor: pickR(r, LOOKS.coats),
    glasses: r() < 0.25 || age > 60 && r() < 0.5, beard: !fem && r() < 0.3, dress: fem && r() < 0.2,
    accessory: /apron|cook|baker|taquero|barista|grocer|cart/.test(job) ? 'apron' : r() < 0.25 ? pickR(r, ['bag', 'scarf', 'bag']) : (age > 72 && r() < 0.5 ? 'cane' : undefined),
    height: (fem ? 0.93 : 1) * (0.94 + r() * 0.12) * (age > 75 ? 0.96 : 1), build: 0.9 + r() * 0.25,
    ghost: false
  };
  const def = {
    name, title: `${job}, ${place}`, tag, ambient: true, dead, look, age,
    voice: `${temper.v}${lang} ${pro[0][0].toUpperCase() + pro[0].slice(1)} ${quirk.replace(/their/g, pro[1]).replace(/they/g, pro[0])}.`,
    who: `${name}, ${age}, ${job}. ${native ? `Born and raised in ${place}` : `Came to San Francisco ${years} years ago and has lived in ${place} ever since`}. A stranger on the sidewalk, not part of anyone's grand story, with a whole life of ${pro[1]} own. ${dead ? `${pro[0][0].toUpperCase() + pro[0].slice(1)} died some time ago (${deadYear < 1990 ? 'long ago, around ' + deadYear : 'not so long ago'}) and does not know it; ${pro[0]} feels a little cold and is often confused about what day it is.` : `${pro[0][0].toUpperCase() + pro[0].slice(1)} is alive, and lately feels the city is crowded with people ${pro[0]} can't quite see.`} SECRET (only reveal if the player earns trust): ${secret}`,
    knows: `${place}: ${fact1}; ${fact2}. ${stance.knows} ${pro[0][0].toUpperCase() + pro[0].slice(1)} knows the everyday city (buses, food, weather, which hills to avoid) and nothing about the player's family beyond rumor.`,
    wants: `${want[0].toUpperCase() + want.slice(1)}. ${pro[0][0].toUpperCase() + pro[0].slice(1)} will ask the player for a small kindness if the talk goes well.`,
    guide: hood.near.filter(k => PLACES[k]),
    greet: temper.greet.map(g => g),
    topics: {
      self: [`${first}. ${first} ${last}. I'm a ${job}. ${native ? `Born here, in ${place}.` : `${years} years in ${place}. Still feels new some mornings.`}`, `Me? I ${quirkMe}. People say that's strange. I say this is San Francisco.`, `What I want? ${want[0].toUpperCase() + want.slice(1).replace(/their/g, 'my').replace(/they/g, 'I').replace(/\bthem\b/g, 'me')}. Is that too much to ask?`],
      city: [`You know ${fact1}? Nobody knows that anymore.`, `Here's something about ${place}: ${fact2}.`, `This city... ${pickR(r, ['it takes everything from you and you thank it', 'you can walk it end to end in a day and never finish', 'the hills keep you honest', 'everybody\'s from somewhere else, even the fog'])}.`],
      vane: stance.lines,
      dead: dead ? ['Dead? Don\'t be morbid. I\'m just cold. It\'s always cold lately.', `What year is it? ...Never mind. Don't tell me.`] : ['I\'m alive, thanks. I think. Lately I see people at the edge of things, and when I look they\'re not there.', 'There are more people on this street at night than there should be. Nobody on it. You know what I mean?'],
      fog: ['The fog\'s coming. It always comes. You can set a clock by it in summer.', 'Karl the Fog. That\'s what they call it now. Everything has to have a cute name.'],
      where: [`If I were you? I'd go see ${PLACES[hood.near[0]] ? PLACES[hood.near[0]].name : 'the Ferry Building'}. Everybody ends up there sooner or later.`],
      help: [`You want to help? ${want[0].toUpperCase() + want.slice(1).replace(/their/g, 'my').replace(/they/g, 'I').replace(/\bthem\b/g, 'me')}. Good luck with that.`, 'Just... remember my face. That\'s plenty.'],
      murmurs: ['The whispering? At night, on the stairs? I cover my ears. My grandmother said don\'t answer them.'],
      remnant: stance.lines
    }
  };
  def.id = opts.id || `cit${++counter}_${seed >>> 0}`;
  return def;
}

/* Regulars: people who are always at the same corner. */
export const REGULARS = [
  { at: [37.78490, -122.40770], district: 'Downtown/Civic Center', job: 'street musician at the Powell cable car turnaround', tag: 'the saxophone player', seed: 11 },
  { at: [37.79590, -122.39380], district: 'Financial District', job: 'flower seller outside the Ferry Building', tag: 'the flower seller', seed: 23 },
  { at: [37.80010, -122.41040], district: 'North Beach', job: 'retired fisherman who feeds the pigeons in Washington Square', tag: 'the man with the pigeons', seed: 37, age: 81 },
  { at: [37.79450, -122.40640], district: 'Chinatown', job: 'xiangqi player in Portsmouth Square', tag: 'the chess player', seed: 41, age: 74 },
  { at: [37.76080, -122.42690], district: 'Mission', job: 'paleta vendor with a cart at Dolores Park', tag: 'the paleta vendor', seed: 53 },
  { at: [37.76170, -122.43500], district: 'Castro/Upper Market', job: 'volunteer usher at the Castro Theatre', tag: 'the usher', seed: 67 },
  { at: [37.77600, -122.43290], district: 'Western Addition', job: 'photographer who shoots the Painted Ladies for tourists', tag: 'the photographer', seed: 71 },
  { at: [37.76020, -122.50930], district: 'Outer Sunset', job: 'surfer checking the waves at Ocean Beach', tag: 'the surfer', seed: 83 },
  { at: [37.78190, -122.39350], district: 'South of Market', job: 'founder pitching anybody who will listen in South Park', tag: 'the founder', seed: 97 },
  { at: [37.77970, -122.41530], district: 'Downtown/Civic Center', job: 'chess hustler on Market Street', tag: 'the chess hustler', seed: 101 },
  { at: [37.80100, -122.44860], district: 'Marina', job: 'painter at an easel by the Palace of Fine Arts lagoon', tag: 'the painter', seed: 113 },
  { at: [37.76980, -122.44690], district: 'Haight Ashbury', job: 'record store clerk on a smoke break on Haight Street', tag: 'the record store clerk', seed: 127 },
  { at: [37.75450, -122.44700], district: 'Twin Peaks', job: 'stargazer with a telescope on Twin Peaks', tag: 'the stargazer', seed: 131 },
  { at: [37.80790, -122.41700], district: 'North Beach', job: 'crab stand cook at Fisherman\'s Wharf', tag: 'the crab cook', seed: 139 },
  { at: [37.73170, -122.43440], district: 'Excelsior', job: 'baker at a panadería on Mission Street', tag: 'the baker', seed: 149 },
  { at: [37.72950, -122.39200], district: 'Bayview', job: 'retired shipyard welder who keeps a lawn chair on a stoop on Third Street', tag: 'the old welder', seed: 157, age: 79 }
];
