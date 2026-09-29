// Things to find: murmurs of the dead, lost things, quest objects, provisions, and the Field Notes.

export const ITEMS = {
  letter: { name: 'Mother\'s Letter', kind: 'key', desc: '"Go to the city. Find Hollis Vane. Make him pay what he owes us, which is not money. — M."' },
  roomkey: { name: 'Room Key, No. 7', kind: 'key', desc: 'Brass, on a wooden tag. Hotel Esperanza. Your room is always ready.' },
  keycard: { name: 'Remnant Keycard', kind: 'key', desc: 'Rafa\'s old badge. "R. QUIÑONES — ALL ACCESS". The magnetic strip is worn to nothing.' },
  portrait: { name: 'Portrait of Susannah', kind: 'key', desc: 'A small photograph from the Vane House. A woman in a wet sweater laughing at whoever held the camera.' },
  shell: { name: 'Susannah\'s Shell', kind: 'key', desc: 'A pale abalone shell, the inside like fog with the sun behind it. "Hold it to the door."' },
  pen: { name: 'Gil\'s Pen', kind: 'key', desc: 'A heavy fountain pen. You signed with it. It is still warm.' },
  ledger: { name: 'Gil\'s Ledger', kind: 'key', desc: 'Twenty years of Remnant\'s real numbers, in Gil\'s small hand. Every account is overdrawn.' },
  sourdough: { name: 'Sourdough Loaf', kind: 'food', use: { heal: 45 }, desc: 'From the Ferry Building. The starter is older than anyone you\'ve met. Restores health.' },
  coffee: { name: 'Caffe Trieste Espresso', kind: 'food', use: { breath: 60, stamina: 1 }, desc: 'North Beach, since 1956. Restores breath and stamina.' },
  incense: { name: 'Incense Sticks', kind: 'food', use: { ward: 60 }, desc: 'From Waverly Place. Lit, the Hollows keep their distance for a while.' },
  pandulce: { name: 'Pan Dulce', kind: 'food', use: { heal: 25, breath: 20 }, desc: 'A concha from 24th Street, still warm somehow.' },
  dumplings: { name: 'Dumplings', kind: 'quest', desc: 'Har gow in a paper box from Stockton Street. For Marisol\'s table.' },
  bread: { name: 'A Second Loaf', kind: 'quest', desc: 'Sourdough for Marisol\'s table.' },
  conchas: { name: 'Box of Conchas', kind: 'quest', desc: 'Pan dulce for Marisol\'s table.' },
  book1: { name: 'Overdue: "Chinatown Families"', kind: 'quest', desc: 'Due back at the Chinatown Branch. Due in 1987.' },
  book2: { name: 'Overdue: "Poems of the Beat Generation"', kind: 'quest', desc: 'Due back at the North Beach Branch.' },
  book3: { name: 'Overdue: "Murals of the Mission"', kind: 'quest', desc: 'Due back at the Mission Branch.' },
  board: { name: 'Kai\'s Surfboard', kind: 'quest', desc: 'A long yellow board, dinged, with a faded wave sticker.' },
  librarycard: { name: 'Library Card', kind: 'key', desc: 'San Francisco Public Library. The name line is blank. "Good at every branch."' },
  glyphrub: { name: 'Rubbing of the Stairs', kind: 'key', desc: 'Charcoal rubbings of every glyph you\'ve read, on the back of a Muni transfer.' }
};

// 24 murmurs: the voices of the dead, overheard. Walk close to hear one.
export const MURMURS = [
  { lat: 37.76530, lon: -122.42190, who: 'a woman on Valencia', text: 'The rent went up again and I said, fine, I\'ll just stay forever. Nobody can raise the rent on forever.' },
  { lat: 37.76380, lon: -122.41950, who: 'a boy on 17th Street', text: 'My mother called me in for dinner at six. I\'m still on the stoop. I can hear the plates.' },
  { lat: 37.76610, lon: -122.42390, who: 'an old man', text: 'Hollis paid for the funeral and didn\'t come. Sent flowers the size of a car.' },
  { lat: 37.79580, lon: -122.39320, who: 'a ferry deckhand', text: 'Last boat to Oakland, last boat to Oakland. I said it ten thousand times and I never once got on.' },
  { lat: 37.78250, lon: -122.39320, who: 'someone by South Park', text: 'I pitched him in a room on Townsend. He listened like a man counting doors.' },
  { lat: 37.79440, lon: -122.40640, who: 'a seamstress on Stockton', text: 'Forty-one steps to the village well. I studied the answer so long I forgot the question.' },
  { lat: 37.80000, lon: -122.41020, who: 'a fisherman\'s wife', text: 'They light candles for the boats at Saints Peter and Paul. They lit one for mine. It\'s still lit.' },
  { lat: 37.76420, lon: -122.42730, who: 'a voice under the garden', text: 'They wrote our names in a book. Then they lost the book.' },
  { lat: 37.77660, lon: -122.43330, who: 'a woman on Steiner', text: 'Every house on this row was a different color. We fought about it for years. Now they sell postcards.' },
  { lat: 37.76210, lon: -122.43470, who: 'a man outside the theatre', text: 'We danced at the Castro till the lights came up. Then so many of us were gone in two years, the street went quiet as a church.' },
  { lat: 37.77920, lon: -122.41810, who: 'a clerk at City Hall', text: 'The dome is taller than the one in Washington. We made sure. You should always be taller than Washington.' },
  { lat: 37.78020, lon: -122.41380, who: 'a delegate', text: 'We signed a promise to end all wars. My pen skipped on the last letter.' },
  { lat: 37.79700, lon: -122.40230, who: 'a sailor, drunk', text: 'I had one drink on Pacific Street and woke up off Cape Horn. Two years. Nobody asked me.' },
  { lat: 37.80220, lon: -122.40550, who: 'a painter on Telegraph Hill', text: 'We painted the workers on the tower walls in \'34. The newspapers called it red. It was only true.' },
  { lat: 37.75440, lon: -122.44760, who: 'the wind on Twin Peaks', text: 'Down. Down. Everybody is supposed to go down.' },
  { lat: 37.77900, lon: -122.51300, who: 'a swimmer', text: 'Seven pools, fresh water and salt, and a glass roof. Ten thousand of us at once. Then the fire.' },
  { lat: 37.72370, lon: -122.47850, who: 'a student in 1968', text: 'On strike, shut it down! We just wanted to learn about ourselves. They sent the police.' },
  { lat: 37.72550, lon: -122.43360, who: 'a mother in the Excelsior', text: 'Sunday supper, everybody. Everybody. Even the ones who moved to Daly City.' },
  { lat: 37.71880, lon: -122.48250, who: 'a man in a tower', text: 'Fourteen floors and nobody knocked. I left the door unlocked for a year, just in case.' },
  { lat: 37.76050, lon: -122.50930, who: 'a surfer', text: 'The cold is a door. You walk through it.' },
  { lat: 37.79220, lon: -122.41190, who: 'a silver baron\'s ghost', text: 'Built the house out of brownstone brought round the Horn. The fire took everything but the stone. Stone keeps.' },
  { lat: 37.77870, lon: -122.45280, who: 'a voice in the hill', text: 'They moved my stone to Colma. They didn\'t move me. I don\'t mind. The view is better here.' },
  { lat: 37.80290, lon: -122.44830, who: 'a woman by the lagoon', text: 'It was only supposed to stand for one year, the Palace. Everything beautiful was only supposed to stand for a year.' },
  { lat: 37.78800, lon: -122.40750, who: 'a man in Union Square', text: 'Hollis bought me a coffee once. He said, what would you give to never lose anyone? I said, what have you got. He looked sad.' }
];

// 20 lost things, one story each. Returned to the Lost & Found at any library for Light and XP.
export const LOST = [
  { name: 'A 1982 Muni Transfer', lat: 37.77340, lon: -122.41940, text: 'Good till 6:40 pm. Someone never used the transfer.' },
  { name: 'A Levi\'s Rivet', lat: 37.80200, lon: -122.40120, text: 'Copper. Levi Strauss & Co. started on Battery Street in 1853, selling to miners.' },
  { name: 'A Candlestick Park Ticket Stub', lat: 37.72880, lon: -122.39320, text: 'January 10, 1982. The Catch.' },
  { name: 'A Fortune Slip', lat: 37.79680, lon: -122.40720, text: '"You will find what you are looking for in the last place you want to look."' },
  { name: 'A Bongo Drum', lat: 37.79820, lon: -122.40720, text: 'Someone played it in the back of a North Beach bar in 1958 until the owner begged them to stop.' },
  { name: 'A Brass Cable Car Bell Pull', lat: 37.79420, lon: -122.41170, text: 'Two rings means stop. Three means go faster.' },
  { name: 'A Burned Photograph', lat: 37.78450, lon: -122.40800, text: 'April 18, 1906. A family on Market Street, before.' },
  { name: 'A Mission Tamale Wrapper', lat: 37.75270, lon: -122.41860, text: 'Folded neatly. Someone saved it because of who they ate it with.' },
  { name: 'A Harvey Milk Button', lat: 37.76090, lon: -122.43520, text: '"You gotta give \'em hope."' },
  { name: 'A Kite Spool', lat: 37.80590, lon: -122.44330, text: 'From the Marina Green, where the wind always wins.' },
  { name: 'A Longshoreman\'s Hook Tag', lat: 37.80480, lon: -122.40150, text: 'ILWU Local 10. The 1934 strike shut down the whole West Coast.' },
  { name: 'A Pair of Dance Shoes', lat: 37.78380, lon: -122.43320, text: 'From the Fillmore, when it was called the Harlem of the West. Size 7, heels worn to the bone.' },
  { name: 'A Dim Sum Cart Ticket', lat: 37.78270, lon: -122.46480, text: 'Stamped four times in one morning on Clement Street. A good morning.' },
  { name: 'A Windmill Tulip Bulb', lat: 37.77100, lon: -122.50900, text: 'From the Dutch Windmill garden. Planted every February.' },
  { name: 'A Bernal Hill Swing Seat', lat: 37.74330, lon: -122.41420, text: 'The rope swing on top of Bernal. Kids have been flying off it for decades.' },
  { name: 'An Excelsior Italian Club Menu', lat: 37.72440, lon: -122.43020, text: 'Sunday: ravioli, 75 cents. Everybody knew the cook.' },
  { name: 'A Parkmerced Door Key', lat: 37.71960, lon: -122.48050, text: 'Tower C, 11th floor. The door was never locked.' },
  { name: 'A Surfboard Fin', lat: 37.75400, lon: -122.50930, text: 'Snapped clean. The ocean took the rest.' },
  { name: 'A Jazz Record Sleeve', lat: 37.78300, lon: -122.43250, text: 'Live at the Jazz Workshop, 1959.' },
  { name: 'A Dot-com Launch Party Lanyard', lat: 37.78100, lon: -122.39400, text: '"Pets.com — ALL ACCESS — 2000". The dog puppet is gone.' }
];

// Quest objects that appear only while a quest stage wants them.
export const PICKUP_SETS = {
  incense: [
    { name: 'Tin How Temple door', lat: 37.79418, lon: -122.40713, action: 'Light incense' },
    { name: 'Portsmouth Square', lat: 37.79480, lon: -122.40540, action: 'Light incense' },
    { name: 'Dragon Gate', lat: 37.79060, lon: -122.40590, action: 'Light incense' }
  ],
  pages: [
    { name: 'Poem page (I)', lat: 37.80070, lon: -122.41030 }, { name: 'Poem page (II)', lat: 37.80120, lon: -122.40900 },
    { name: 'Poem page (III)', lat: 37.80200, lon: -122.40640 }, { name: 'Poem page (IV)', lat: 37.79900, lon: -122.40790 },
    { name: 'Poem page (V)', lat: 37.79820, lon: -122.40560 }
  ],
  nibs: [
    { name: 'Pen nib, UN Plaza', lat: 37.78000, lon: -122.41320 }, { name: 'Pen nib, City Hall steps', lat: 37.77930, lon: -122.41740 },
    { name: 'Pen nib, Library steps', lat: 37.77880, lon: -122.41660 }
  ],
  pigments: [
    { name: 'Cochineal red, Mission Dolores garden', lat: 37.76460, lon: -122.42710 }, { name: 'Ochre, Bernal Hill', lat: 37.74310, lon: -122.41470 },
    { name: 'Fog blue, Ocean Beach', lat: 37.76200, lon: -122.50940 }
  ],
  groceries: [
    { name: 'Sourdough, Ferry Building', lat: 37.79560, lon: -122.39410, item: 'bread' }, { name: 'Dumplings, Stockton Street', lat: 37.79380, lon: -122.40780, item: 'dumplings' },
    { name: 'Pan dulce, 24th Street', lat: 37.75270, lon: -122.41440, item: 'conchas' }
  ],
  stones: [
    { name: 'Unmoved stone, Lone Mountain', lat: 37.77960, lon: -122.45380, action: 'Say the name' }, { name: 'Unmoved stone, Legion of Honor', lat: 37.78420, lon: -122.49930, action: 'Say the name' },
    { name: 'Unmoved stone, Mission Dolores yard', lat: 37.76420, lon: -122.42720, action: 'Say the name' }, { name: 'Unmoved stone, the Presidio', lat: 37.79850, lon: -122.46100, action: 'Say the name' }
  ],
  bells: [
    { name: 'The Niantic\'s bell, Clay & Sansome', lat: 37.79500, lon: -122.40120, action: 'Ring the bell' }, { name: 'The General Harrison\'s bell, Battery & Clay', lat: 37.79480, lon: -122.40040, action: 'Ring the bell' },
    { name: 'The Rome\'s bell, Folsom & the Embarcadero', lat: 37.79050, lon: -122.38950, action: 'Ring the bell' }
  ],
  board: [{ name: 'Kai\'s surfboard', lat: 37.81020, lon: -122.47640, item: 'board' }],
  books: [
    { name: 'Chinatown Branch return slot', lib: 'lib-chinatown', action: 'Return the book', item: 'book1' },
    { name: 'North Beach Branch return slot', lib: 'lib-northbeach', action: 'Return the book', item: 'book2' },
    { name: 'Mission Branch return slot', lib: 'lib-mission', action: 'Return the book', item: 'book3' }
  ],
  grip: [{ name: 'Grip lever, Cable Car Barn', lat: 37.79460, lon: -122.41170, weapon: 'grip', action: 'Take the grip lever' }]
};

// Provisions, refilled each morning.
export const PROVISIONS = [
  { item: 'sourdough', lat: 37.79540, lon: -122.39390 }, { item: 'sourdough', lat: 37.80800, lon: -122.41590 },
  { item: 'coffee', lat: 37.79860, lon: -122.40720 }, { item: 'coffee', lat: 37.76500, lon: -122.42200 },
  { item: 'incense', lat: 37.79400, lon: -122.40700 }, { item: 'pandulce', lat: 37.75260, lon: -122.41480 },
  { item: 'sourdough', lat: 37.72540, lon: -122.43300 }, { item: 'coffee', lat: 37.72400, lon: -122.47800 },
  { item: 'pandulce', lat: 37.76060, lon: -122.50880 }, { item: 'sourdough', lat: 37.78170, lon: -122.39410 },
  { item: 'incense', lat: 37.77640, lon: -122.45150 }, { item: 'coffee', lat: 37.77900, lon: -122.41600 }
];

/* Field Notes: what is real, and what this story made up. */
export const NOTES = [
  { id: 'fiction', title: 'About this story', text: 'UNDERTOW is a work of fiction set in the real San Francisco. The streets, the neighborhoods, the landmarks and the history in these notes are real. The Hotel Esperanza, the Vane House, Remnant and its Keep, and every character are invented, except where the notes say otherwise. The Stair People and their stepped temples in the hills are entirely invented for this story; they are not the Ohlone, and nothing like them has been found here.' },
  { id: 'ohlone', title: 'The Ohlone and the shellmounds', text: 'Before 1776, this peninsula was home to the Yelamu, one of the Ohlone peoples, who lived in villages along the bay and the creeks. Around the bay they built shellmounds over thousands of years: places of burial, ceremony and daily life, some taller than houses. Most were leveled for farms and cities. Ohlone people are still here, and are still working to protect the mounds that remain.' },
  { id: 'mission', title: 'Mission Dolores (1776)', text: 'Mission San Francisco de Asís, called Mission Dolores, is the oldest intact building in the city. Its adobe walls are about four feet thick; it came through the 1906 earthquake. Its cemetery holds the remains of thousands of Ohlone and other Native people who died in the mission era, most in unmarked graves.' },
  { id: 'ships', title: 'The buried ships', text: 'In 1849 crews abandoned hundreds of ships in Yerba Buena Cove to run for the gold fields. Many were turned into stores and warehouses, then buried as the city filled the cove. The shoreline once ran along Montgomery Street; the Niantic, the General Harrison and the Rome have been found under the Financial District and the Embarcadero.' },
  { id: 'vigilance', title: 'The Committees of Vigilance', text: 'In 1851 and 1856, armed committees of merchants took the law into their own hands, held trials, hanged men and, in 1856, fortified their headquarters on Sacramento Street with sandbags ("Fort Gunnybags"). They are remembered as a warning as often as a legend.' },
  { id: 'chinatown', title: 'Chinatown', text: 'Among the oldest Chinatowns in North America, dating from the 1850s. The Tin How Temple on Waverly Place, founded in 1852, is one of the oldest Chinese temples in the United States. After the 1906 fire, the city tried to relocate Chinatown; its residents refused and rebuilt. The Chinese Exclusion Act (1882-1943) forced many immigrants to come as "paper sons and daughters" through the Angel Island station (1910-1940).' },
  { id: 'northbeach', title: 'North Beach and the Beats', text: 'The city\'s Italian neighborhood, home of Saints Peter and Paul Church and Washington Square. City Lights, founded in 1953, published Allen Ginsberg\'s "Howl"; its 1957 obscenity trial ended in a ruling that the poem had social importance. The Coit Tower murals were painted in 1934 by artists of the Public Works of Art Project.' },
  { id: '1906', title: 'April 18, 1906', text: 'The earthquake struck at 5:12 in the morning; the fires that followed burned for three days and destroyed most of the city. Thousands died. The city rebuilt within a decade and celebrated with the 1915 Panama-Pacific International Exposition; the Palace of Fine Arts is its last standing building (rebuilt in concrete in the 1960s).' },
  { id: 'cemeteries', title: 'The cemeteries that moved', text: 'Beginning in 1914 San Francisco banned new burials and moved its cemeteries to Colma, to the south, where the dead now vastly outnumber the living. Not all remains were moved. The Legion of Honor stands on the old City Cemetery; hundreds of burials were found beneath it during a renovation in the 1990s. Lone Mountain was once Laurel Hill Cemetery.' },
  { id: 'un', title: 'The United Nations Charter (1945)', text: 'Delegates from fifty nations met in San Francisco from April to June 1945 and signed the Charter of the United Nations on June 26 in the Veterans War Memorial Building. UN Plaza, near City Hall, commemorates it.' },
  { id: 'civic', title: 'City Hall and the Library', text: 'City Hall (1915) replaced the one destroyed in 1906; its dome is taller than the U.S. Capitol\'s. The Main Library opened in 1996; the old library across the plaza is now the Asian Art Museum. The city has 27 branch libraries; many were funded by Andrew Carnegie in the 1910s and 1920s.' },
  { id: 'mission-murals', title: 'Balmy Alley', text: 'In 1984 a group of artists painted Balmy Alley, in the Mission, with murals protesting the wars in Central America. The alley has been repainted and added to ever since.' },
  { id: 'excelsior', title: 'The Excelsior', text: 'A working-class neighborhood of the southern city whose streets are named for world capitals and countries: London, Paris, Lisbon, Madrid, Naples, Edinburgh, Russia, Persia, China. Italian and Irish families were followed by Filipino, Latino and Chinese ones. One of the most diverse neighborhoods in the city.' },
  { id: 'sfsu', title: 'San Francisco State and the 1968 strike', text: 'The student strike of 1968-69, led by the Black Students Union and the Third World Liberation Front, lasted five months and created the first College of Ethnic Studies in the United States.' },
  { id: 'parkmerced', title: 'Parkmerced', text: 'A planned community built in the 1940s by the Metropolitan Life Insurance Company: garden townhouses around radial streets and, later, thirteen-story towers. Its landscape architect was Thomas Church.' },
  { id: 'usf', title: 'USF and Lone Mountain', text: 'The University of San Francisco, a Jesuit school, was founded in 1855. St. Ignatius Church, finished in 1914, crowns the hill; Lone Mountain rises just north, once part of a great cemetery.' },
  { id: 'embarcadero', title: 'The Embarcadero', text: 'The waterfront was hidden for decades beneath the double-decker Embarcadero Freeway. Damaged in the 1989 Loma Prieta earthquake, it was torn down in 1991, and the city got its waterfront back. The Ferry Building (1898) was once the second-busiest transit terminal in the world.' },
  { id: 'soma', title: 'South Park and the booms', text: 'South Park, a small oval laid out in the 1850s, sat among warehouses for a century. In the 1990s it became the center of the first internet boom; the companies of later booms rose around it in glass. Remnant, the company in this story, is invented.' },
  { id: 'towers', title: 'The skyline', text: 'The Transamerica Pyramid (1972), 555 California (1969, once the Bank of America Center), Sutro Tower (1973, the three-legged broadcast mast on the hill), and Salesforce Tower (2018), the tallest building in the city.' },
  { id: 'sutro', title: 'Sutro Baths', text: 'Adolph Sutro opened the Sutro Baths in 1896: seven pools of salt and fresh water under a glass roof, holding thousands of swimmers. The building burned in 1966; the ruins remain below Lands End.' },
  { id: 'ladies', title: 'The Painted Ladies', text: 'The row of Victorian houses on Steiner Street facing Alamo Square, built 1892-1896. "Painted ladies" is the local name for Victorians and Edwardians painted in three or more colors, a practice that took off in the 1960s and 70s.' },
  { id: 'castro', title: 'The Castro', text: 'The heart of the city\'s gay community since the 1970s. Harvey Milk, elected supervisor in 1977, was assassinated in 1978. The AIDS epidemic of the 1980s and 90s took a generation from these streets.' },
  { id: 'fillmore', title: 'The Fillmore', text: 'In the 1940s and 50s the Fillmore was "the Harlem of the West," full of jazz clubs, as Black families arrived to work in the wartime shipyards. "Redevelopment" in the 1950s-70s demolished thousands of homes and displaced tens of thousands of residents.' },
  { id: 'data', title: 'How this city was made', text: 'The terrain comes from the San Francisco elevation contours published on DataSF; the streets were traced from the positions of the city\'s 60,000-plus street trees in the DataSF Street Tree List; the neighborhoods come from the click_that_hood project. Buildings are placed along the real streets and styled per neighborhood; the landmarks are modelled by hand from their real shapes and positions.' }
];
