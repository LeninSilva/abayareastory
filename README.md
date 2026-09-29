# Undertow

A first-person story set in the real San Francisco, where the dead have not left.

Your mother, Marisela, asked you on her deathbed to go to the city and find your father, Hollis Vane. He founded Remnant, the company that recorded the dying so their families could keep talking to them. People say he took the whole city in with him. The truth is older and stranger. It runs through the stepped stone temples buried in the tops of the hills, down to a harbor that the sea swallowed ten thousand years ago.

You can play it in a browser or install it on Android as an app: open the page in Chrome, then choose **Add to Home screen**. It plays offline after the first visit.

## The city

- **The whole city, at full scale.**
  - The terrain comes from the city's elevation contours.
  - The streets were traced from the positions of more than 60,000 street trees in the city's inventory.
  - The neighborhoods come from their real boundaries.
  - More than 57,000 buildings are generated along the real streets. Each is styled for its district: Victorian and Edwardian rows, Sunset stucco, Chinatown brick with balconies and awnings, Mission color, SoMa warehouses, downtown stone and glass.
- **Hand-modelled landmarks at their real positions:**
  - Downtown and the waterfront: the Ferry Building, the Transamerica Pyramid, Salesforce Tower, 555 California, the Flood Building, the Palace Hotel, Oracle Park.
  - Civic Center: City Hall, the Main Library, UN Plaza, the War Memorial and the Opera House.
  - Hills and parks: Coit Tower, Sutro Tower, the Painted Ladies, the Palace of Fine Arts, the Conservatory, the de Young, the Academy of Sciences.
  - Churches and campuses: Mission Dolores, St. Ignatius, Grace Cathedral, SF State, Parkmerced.
  - The edges of the city: the Cliff House and Sutro Baths, the Legion of Honor, Fort Point, Alcatraz.
  - Both bridges, which you can walk across.
  - The twelve branch libraries in the game, which are safe places, save points and fast-travel stops.
- **Time and weather.** Time passes from dawn to night. The fog is thicker in the west and in the mornings and evenings. A foghorn sounds from the Gate.

## How it plays

- **First person throughout.**
  - Keyboard and mouse: WASD to walk, the mouse to look, Shift to sprint, Space to jump, **E** to talk or use, left click to strike, right click or R to block, F for an ability, B for the bicycle, M for the map, Esc for the menu.
  - Touch: the left thumb walks and the right thumb looks, with buttons on the right.
  - Gamepads are supported.
- **Talk to anyone, in your own words.** Every character has their own voice, history, secrets and agenda, and can point you somewhere new. Gold chips move the story forward. You can type anything else.
  - In the claude.ai app, characters answer live through your own Claude account, after you approve it.
  - In the installed app, you can add your own Anthropic API key under Settings → Voices. Requests go straight from your device to Anthropic with Claude's server-side refusal fallback turned on: if a reply is declined, it is retried on a fallback model.
  - Without either, everyone speaks from their own written lines, chosen by what you ask about.
- **The main story** has eight chapters and three endings.
- **Fourteen side quests**, among them:
  - Incense for Chinatown's hungry ghosts
  - A Beat poet's pages blown across North Beach
  - A Barbary Coast duel
  - Overdue library books
  - The UN Charter delegate's pen nibs
  - Mural pigments for Balmy Alley
  - Sunday supper in the Excelsior
  - An oral exam at SF State
  - The Hollows around the Parkmerced towers
  - A surfer's lost board
  - Graves the city never moved
  - A founder stuck on demo day
  - The bells of the Gold Rush ships buried under the Financial District
  - A vigilante's challenge
- **Mini quests:**
  - 24 murmurs of the dead to overhear
  - 12 stair glyphs to read
  - 20 lost things to return to any library
- **Growth, Fable-style:**
  - Six weapons to find or earn, from a walking stick to a blade cut from the lowest stair.
  - Three abilities: Hush, Flare and Undertow Step.
  - XP and levels, with points for Strength, Skill and Will.
  - A Light and Shade heart that shows in your hands and decides which endings are open to you.
- **Nobody gets trapped.**
  - Collision always pushes you back out.
  - Anything you might be stuck in, you are moved out of.
  - If you stop moving while pressing forward, a button appears. **U**, or "I'm stuck" in the menu, takes you to the nearest real street.
  - Every marker is placed where a person can stand.
- **Accessibility:**
  - Text size and high-contrast panels
  - Reduced motion (no head bob, shake or flashes)
  - Look sensitivity and inverted look
  - Always, never or automatic on-screen controls
  - A "Story" damage setting and an option to turn off the wandering Hollows
  - Volume controls and three quality presets

## What's real and what isn't

The streets, neighborhoods, landmarks and history in the in-game Field Notes are real. The hotel, the Vane House, Remnant and every character are invented. So are the Stair People and their temples in the hills. They are not the Ohlone, whose shellmounds along the bay are real, and whose people are still here. One character, Ruth Encinas, is an Ohlone elder written as a composite. She is not based on any real person.

## Building

```sh
npm install
npm run data    # downloads the open data into raw/ and builds data/city.bin + data/city.json
npm run build   # bundles src/ into a single self-contained index.html and sw.js
```

Serve the folder with any static server. GitHub Pages deploys it from this branch (`.github/workflows/pages.yml`).

- `src/geo.js`: projection, district styles, landmarks, towers, parks, libraries
- `tools/build-data.mjs`: turns the raw data into the compact city file
- `src/render/`: sky, terrain, water, streets, buildings, trees, landmarks and bridges, ruins, people
- `src/game/`: input, player, combat, story, quests, lore, dialogue voices, audio, UI

## Data and credits

- Elevation contours: City and County of San Francisco, DataSF, via the kepler.gl sample datasets
- Street Tree List: San Francisco Public Works, DataSF, via the kepler.gl sample datasets
- Neighborhood boundaries: the Code for America click_that_hood project
- Rendering: three.js
