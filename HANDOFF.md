# AÑIL: handoff to another assistant

Paste section 1 into ChatGPT first, then attach the repo zip or link and your photos. Paste sections 2 to 6 as needed. Section 7 has ready-made image prompts.

---

## 1. First message to paste

> You are continuing work on **AÑIL**, a browser game built with three.js. It is a first-person mystery and life sim set in the real town of **Jiquilpan de Juárez, Michoacán, México**. The code is at https://github.com/LeninSilva/abayareastory on branch `ccr-1083fbdc-shiu1z`. I am attaching photos of the real town. Match them for architecture, plants, people and colour.
>
> Rules:
> - Keep everything in plain ES modules under `src/`. `npm run build` bundles the game into one `index.html`.
> - Keep the closed dialogue system. Players choose numbered options and never type.
> - Every button must work by mouse, keyboard (1–9, Esc) and touch, and must never trap the player.
> - Keep the design minimal, readable and rich in detail.
> - After every change, run the game and check the browser console for errors.
>
> Read `HANDOFF.md` (this file) for the architecture, what is done, and what is left. Then start on the **Still to do** list in section 5, top to bottom.

---

## 2. Commands

```bash
# get the code
git clone https://github.com/LeninSilva/abayareastory.git
cd abayareastory
git checkout ccr-1083fbdc-shiu1z
npm install

# build: writes index.html, sw.js and public/
npm run build
# fast, unminified build for debugging
DEV=1 npm run build

# run locally, then open http://localhost:8080
python3 -m http.server 8080

# optional: rebuild map and elevation data from raw/ (needs Python, numpy, Overture data)
npm run data

# save work
git add -A
git commit -m "describe the change"
git push -u origin ccr-1083fbdc-shiu1z
```

**In-game keys:**

| Key | Action |
|---|---|
| WASD | Move |
| Mouse | Look |
| E | Interact / talk |
| F | Enter or leave a car |
| J | Jetpack |
| M | Menu and map |
| P | People / relationships |
| O | Character |
| V | Camera (1st / 3rd person) |
| 1–9 | Dialogue choices |
| Esc | Back |

The published version is at https://claude.ai/artifact/AU7AEZParCFrNWUkNE4K6K.

---

## 3. Architecture map

**Coordinates:**
- x is east and z is south. Negative z is north.
- The origin is the Jardín / Parroquia area.
- LAT0 is 19.9905 and LON0 is -102.7175.

| File | What it does |
|---|---|
| `src/main.js` | Game class: boot, intro, state, saving, the player, walkers, the dialogue flow, interactables, the main loop |
| `src/geo.js` | Real places (`PLACES`), neighbourhoods (`barrio()`), the cerro footpath and the back road to Paredones |
| `src/data.js` | Loads `data/jiquilpan.json`: streets (kinds 0 road, 1 footway, 2 steps, 3 track, 4 pedestrian), buildings trimmed off streets, trees, `nearestStreet()`, `storefront()` |
| `src/render/landmarks.js` | Parroquia, Santuario, kiosco, Jardín, Aguadora fountain, stadium portada, Bosque, Jardín de la Paz, panteón, Casita de Piedra, San Francisco hamlet, ranchos, shops, taxi stands |
| `src/render/detail.js` | Car shapes (`PROFILES`, `CarKit`): Tsuru, Renault SUV, combi, Italika moto, taxi, Tacoma, March, Vocho, EV, Porsche, bicycle. Also parked cars and colonial lamps |
| `src/render/traffic.js` | Lanes, one-way streets, combi routes (Verde, Roja, Amarilla), cycling teams (Rinos, Mamazonas, Apenitas) |
| `src/render/human.js` | `makePerson(spec)`: jointed person with fingers, shoes, seeded local face, expressions (`setExpression`), the Negrito mask |
| `src/render/house.js` | Player-built houses by style and part |
| `src/render/sky.js` | Sky, sun, stars, clouds |
| `src/render/ground.js` | Terrain and street surfaces (laja flagstone, rocky) |
| `src/game/street.js` | Stray dogs, bumping, run-overs (chalk outline, Cruz Roja), car smoke, Danza de los Negritos with La Güerita |
| `src/game/vehicle.js` | Driving, car sizes, damage |
| `src/game/life.js` | Money, traits (heart / word / fame), relationships, items, clothes, lots, businesses |
| `src/game/lifegame.js` | Mixin that wires life systems into the game: shops, builder, taxi job, wedding, sleep |
| `src/game/talk.js` | Closed dialogue: tones (kind, cruel, honest, lie, brave, romance, funny), compliments, gifts, dates, proposals |
| `src/game/cast.js` | Named townspeople with schedules: the fat mayor "El Globo", regidores of Morena / PAN / PRI / PRD / MC, shopkeepers, quest givers, `TOWN_JOKES` |
| `src/game/sidequests.js` | Side quests and jobs |
| `src/game/minigames.js` | Mini games: lotería, penales, quiz, albañil, añil dye, mesero, serenata |
| `src/game/quests.js` | The main mystery |
| `src/game/lore.js` | Achievements |
| `src/game/ui.js` | All UI: toasts, dialogue chips, side panels, menu tabs, map |
| `src/style.css` | The design system |
| `src/index.template.html` | Page shell |

**Patterns to follow:**
- Geometry is merged and vertex-coloured. Cars are instanced through `CarKit`.
- Colliders use `addBox`, `addCircle`, `resolve` and `blocked`.
- New townspeople go in `CAST` with a `look` spec for `makePerson`.
- New quests go in `QUESTS` (step types: talk, reach, collect, mini, deliver, haul, visit…).

---

## 4. Everything I asked for (my original requests)

### Request A

**Places**
- Put the places where they really are:
  - Jardín de la Paz between Lázaro Cárdenas and Fajardo, toward the Cremería, on the north side.
  - The Santuario (the nuns') and the panteón with its neighbourhood, on the northwest side.
  - Rancho de Novoa and Rancho de los Salazar on the way up to San Francisco.
  - San Francisco on top of the cerro, with the antenna, a chapel and a couple of stores. A rocky road with rare cars.
  - Taxi stands on Calle Abasolo and on Fajardo.
  - The Casita de Piedra near El Bosque.
- Get the architecture and look right from my photos.

**Traffic and people**
- Cars must never drive through other cars.
- Narrow streets, some with parking and parked Italika motos.
- People must never get stuck in bushes.

**Politics**
- A really fat mayor around the ayuntamiento who rarely comes out.
- Regidores from Morena, PAN, PRI, PRD and Movimiento Ciudadano (the "naranja"). They are rarely seen, listen but do nothing, and the town jokes about them.

**Dialogue and character**
- No typed questions. Use a closed choice system like Fable or KOTOR that shapes who your character becomes.
- Relationships like Fable, with a screen showing everyone you've met.

**Life sim**
- Save money and buy a house or empty lot.
- Hire albañiles to build the house part by part, with a small house-architecture engine.
- Buy or start businesses.
- Change your look and clothing in stores.

**UI and content**
- Fix the intro text overlapping.
- The look should be appealing, simple and minimal, but rich in detail and intuitive.
- Rich history and culture, intriguing side quests, mini games.

### Request B

**Town fixes**
- Buildings bleed onto streets (for example the "vegetable" shop next to work). Fix them.
- Let people walk through grass and plazas, with walkways that merge beautifully, true to the photos.

**Accidents and street behaviour**
- Cars can run people over. They get hurt and a chalk outline appears. People react after a while.
- Characters bump into each other.

**Vehicles**
- Cars take damage and look realistic, not geometric.
- Use models common in Mexico:
  - Many Nissans (Tsuru, Versa, March) and Toyotas, and Renaults.
  - Old Toyota Tacoma trucks.
  - Rare Japanese electric cars and a very rare Porsche.
  - Green, red and yellow combis, each on its own route.

**People**
- Hands with fingers, shoes and real anatomy.
- Faces that show expression in dialogue.
- Distinguishable faces typical of the region.

**Rendering**
- Less polygonal, with Unreal-like quality.
- A realistic night sky and stars, a realistic skyline, and light pollution over the town.
- A more exciting, simple and minimal title.

**Street life**
- Stray dogs in packs or alone around the plaza and mercado. They drink from the fountain and get scraps, bones, cuts of meat or trays of water at the mercado.
- Cyclists, some in normal clothes and some in kit with helmets. They ride from Zamora to San Pedro Caro and around. The teams are:
  - Los Rinos de Jiquilpan, in a tight purple jersey with a rhino logo.
  - Las Mamazonas from Zamora.
  - Los Apenitas.

**The cerro**
- The way up the Cerro de San Francisco is one stone footpath, not a road, with no cars.
- Cars exist only in San Francisco itself, which connects by a back road through Paredones and Abadiano.
- A radio / electrical station on top near the chapel.
- Rancheros on the way growing corn.
- Horses, wild cows and horses.
- Cactus, nopales and magueys growing randomly.

**Unique characters**
- **Tío Luis**:
  - Older, with grey hair, a white beard and a Panama hat.
  - Says "¡Ánimo!" and calls you "patrón".
  - Hangs out with a ferretero near the Monumento a Lázaro Cárdenas. Together they are getting the ferretería running again: moving tinacos, moving products, cleaning the shop.
- **Francisco, "El Ferretero"**: late 40s or early 50s, skinny, with a dark greying beard, curly hair and a wide nose.

**Dance and culture**
- La Danza de los Negritos and La Güerita: masked dancers as in my photos.

**General**
- Keep finding and fixing bugs.
- Use best practice in game design, graphics and architecture to match the pictures.

### What my photos show

| Subject | Details |
|---|---|
| Kiosco | Red-orange frames on white panels, black iron lacework, a dark roof with a scalloped valance and orange trim, globe lamps, stairs with red risers |
| Jardín | Trimmed hedges, tabachines (red flame trees), iron benches, tree trunks painted white |
| Parroquia | Yellow dome with red ribs, brown stone tower |
| Streets | Portales with hanging lanterns |
| People | Men with mustaches and caps |
| Negritos | Black mask with white painted features, red flower headdress, white scarf with a flower, fringed suede coat, little bull figure; La Güerita is the masked woman dancer |

---

## 5. Status

### Done (committed)

**Places and architecture**
- Real places, roads and neighbourhoods.
- Parroquia, Santuario, kiosco, Jardín, portada and Bosque.
- Buildings trimmed off streets; walkable lawns.

**Traffic and vehicles**
- Traffic without overlaps, lanes and one-way streets.
- Parked cars and Italikas, taxi stands.
- Twelve Mexican car models with damage and smoke.
- Combi routes you can ride.
- Cycling teams in pelotons.

**Politics and people**
- The mayor, the regidores and the town jokes.
- Realistic jointed people with fingers, shoes, local faces and dialogue expressions.

**Dialogue and relationships**
- Closed tone-based dialogue that shapes heart / word / fame.
- Relationships, romance and marriage.

**Life sim and content**
- Money, jobs, lots, the house builder, businesses, clothes and the barber.
- Side quests, mini games and achievements.

**Street life**
- Stray dogs.
- Bumping and run-overs with the chalk outline and Cruz Roja.
- The Negritos and La Güerita dance (Sundays 17:00–20:30, Wednesdays 18:00–19:30).

**The cerro**
- The cerro path is foot-only; the back road runs via Paredones.

### Also done since the first handoff

**Characters and quests**
- **Tío Luis and Francisco** are at Ferretería La Esperanza by the Monumento. Their quest: carry four tinacos, stock the shelves (mini game), sweep, and reopen. Afterwards you can buy into the shop as a partner.
- **Chava "El Rino"**, the Rinos captain, wears the purple rhino jersey. His quest is a race up to San Francisco, and the reward is the jersey.

**Places**
- A glorieta around the Monumento.
- **The cerro:** nopales, magueys and órganos; milpas and horses at the ranchos; wild herds; and the CFE substation beside the antenna.

**Look and feel**
- Night sky with stars, the Milky Way, a moon, and an orange glow over the town.
- New title screen: ink-bleed wordmark, skyline, and a tagline.
- Jardín flower beds replace the old blobs.

### Still to do

1. **Cars.** Parked cars still look boxy. Give `CarKit` / `PROFILES` in `src/render/detail.js` rounder bodies, separate wheel arches, and window frames.
2. **Combi signs.** Route signs on the combi windshields (image prompt 8).
3. **Carrying in third person.** Show the tinaco in third person too; right now it only appears in first person.
4. **A man floating near the San Francisco chapel.** An NPC there is placed in the air; check `findSpot` for the cast near the summit.
5. **Ground near the Monumento.** It is bare dirt; consider sidewalks or grass along those streets.
6. **Textures.** Use your image-generation results as textures: laja, the masks, the jersey logo, and shop signs.
7. **Finish.** Update `README.md`, then commit and push.

---

## 6. How to give the AI pictures

The AI cannot see the game running. To share what you see:
- Take screenshots of the game and attach them next to the matching real photo.
- Say what is wrong, for example: "the kiosco roof should be darker and scalloped like this photo."

---

## 7. Image prompts (for ChatGPT image generation)

These give you textures and concept art.
- Save results as PNG in `data/img/`.
- Load them in code with `new THREE.TextureLoader().load('data/img/<name>.png')`.
- Ask ChatGPT to wire them in.

1. **Title art**: Minimal title card for a video game called "AÑIL". Deep indigo ink bleeding into handmade cotton paper, a faint silhouette of a colonial Mexican church dome with red ribs and a stone bell tower at dusk, lots of empty space, elegant serif wordmark "AÑIL", no other text, 16:9.
2. **Laja street texture**: Seamless tileable top-down texture of reddish-brown laja flagstone paving from a small town in Michoacán, irregular slabs with grey mortar joints, slight wear, even daylight, no shadows, 1024×1024.
3. **Cobblestone (empedrado) texture**: Seamless tileable top-down texture of rounded river-stone cobbles set in dirt, Mexican mountain footpath, even light, 1024×1024.
4. **Colonial wall texture**: Seamless texture of a lime-plastered colonial wall painted white with an almagre red baseboard band at the bottom, subtle cracks and patina, front view, 1024×1024.
5. **Negrito mask**: Front view of a traditional Danza de los Negritos mask from Michoacán: glossy black carved wood, white painted eyebrows, mustache and lips, on a plain neutral background, flat even lighting, 1024×1024.
6. **La Güerita mask**: Front view of a pale pink-white carved wooden female dance mask with rosy cheeks and red lips, Michoacán folk style, plain background, 1024×1024.
7. **Rinos de Jiquilpan logo**: Minimal flat vector logo of a charging rhinoceros in white on deep purple (#6a2a9a), circular badge, text "RINOS · JIQUILPAN", suitable for a cycling jersey, transparent background.
8. **Combi route signs**: Three hand-painted windshield signs for Mexican combis, one each in green, red and yellow, reading "RUTA VERDE · CENTRO · MERCADO", "RUTA ROJA · SANTUARIO · PANTEÓN" and "RUTA AMARILLA · ESTADIO · BOSQUE", rotulista hand-lettering style, 1024×256 each.
9. **Storefront signs**: Hand-painted rotulista shop signs on plaster: "FERRETERÍA DON FRANCISCO", "CREMERÍA", "TORTILLERÍA", "PAPELERÍA", "FARMACIA". Bright colours, slightly faded, front view, 1024×256 each.
10. **Character concept, Tío Luis**: Concept art front and side view of an older Mexican man from Michoacán, grey hair, full white beard, white Panama hat, guayabera shirt, kind smile, friendly hardware-store helper, neutral background, realistic proportions.
11. **Character concept, Francisco el Ferretero**: Concept art front and side view of a skinny Mexican man around 50, dark beard going grey, curly dark hair, wide nose, work apron over a plaid shirt, hardware store owner, neutral background, realistic proportions.
12. **Night sky reference**: Night sky over a small Mexican mountain town, Milky Way faint above, orange light-pollution glow low on the horizon, silhouette of a hill with a red-blinking antenna, 16:9.
13. **Skybox, day**: Equirectangular 360° panorama of the sky over the Jiquilpan valley in Michoacán, scattered cumulus clouds, green hills on the horizon, no ground objects, 4096×2048.
