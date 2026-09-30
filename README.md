# Añil

A first-person mystery set in Jiquilpan de Juárez, Michoacán. The town is the real one, built from open map and elevation data.

Three nights ago your grandfather, Don Aurelio Valdovinos, called you from Jiquilpan. He said, "Encontré lo que escondió Cuco": I found what Cuco hid. Then he vanished on the Cerro de San Francisco. The police have stopped looking. Friday the cabildo votes to give the springs on the cerro to a bottling company.

You can play it in a browser or install it on Android as an app: open the page in Chrome and choose **Add to Home screen**. It plays offline after the first visit.

## The town

- **Jiquilpan at full scale.**
  - 24,839 houses and buildings stand on their real footprints, with 3,005 real street segments under their real names (Calzada del Bosque, Calle 18 de Marzo, Calle Felícitas del Río and the rest), from [Overture Maps](https://overturemaps.org) (built from OpenStreetMap and other open data).
  - The terrain comes from open elevation data in three rings: every 9 m in town, every 24 m up to the Cerro de San Francisco's summit (about 2,470 m), and every 120 m across the valley and the mountains around it.
  - Land cover (fields, forest, scrub, parks, pitches) and the river channel through town come from the same map data.
- **The town's own look:**
  - The whitewashed centro, with a red guardapolvo along the foot of each wall, cantera around the doors and windows, iron balconies and clay-tile roofs.
  - The painted houses of the barrios, with iron window bars, black tinacos on every roof, rebar waiting for the next floor, and satellite dishes.
  - Obra negra, bare block and brick; shops with steel roll-up cortinas, painted signs and canvas awnings; schools and bodegas.
  - Every window has a room behind it, drawn in depth.
  - Cobblestone empedrado in the centro, poured concrete and dirt toward the edges, asphalt on the highways, yellow-and-black speed bumps.
  - Concrete utility poles with the wires strung between them, and lamps that light the street at night.
  - Laureles in the plazas, jacarandas in flower, oaks and pines on the hills.
- **Landmarks, hand-built at their real positions:**
  - The Jardín and its kiosco, and the Plaza Aguadora with its fountain.
  - The Parroquia de San Francisco and its atrio.
  - The Biblioteca Gabino Ortiz, a neo-Gothic former sanctuary with a bronze door of 22 figures, where Orozco painted his murals.
  - The Casa de Lázaro Cárdenas, the Presidencia Municipal with its portal of arches, and the Monumento al General.
  - The Estadio 18 de Marzo and its portada, which carries Cárdenas' words: "Los recursos naturales del país deben servir para su propia prosperidad. Entregarlos a intereses extraños es traicionar la patria."
  - The Plaza de la Feria, the Santuario de Guadalupe, San Cayetano, Santa Anita, the Plaza de Toros Alberto Balderas, the Museo Vida y Obra de Lázaro Cárdenas, the gate of the Parque Juárez, and the cross on the summit of the cerro.
  - Where a building's exact form isn't recorded (the portada, the kiosco, the bullring), it is modelled in the regional style.
- **Rendering:** sun shadows; ambient occlusion (medium and high quality); bloom; fog integrated through the air, so the valley stays clear from above; a sun that crosses from east to west a little to the south; a speed blur when you fly or drive fast.

## How it plays

- **Walk, drive, fly.**
  - Walk it in first person.
  - Get into **any car**: a parked one, one stopped in traffic ("¡Oiga!"), or Rosa's green sedan. Drive it with a chase camera, a handbrake, crashes and airtime.
  - Aurelio's homemade jetpack flies where you look. Boost winds up to nearly **600 km/h**. You can land on streets, fields and flat roofs, and it catches you if you step off one.
- **The mystery:** seven chapters and three endings.
  - Clues and a puzzle: count the figures on the bronze door.
  - The parish archive's book of 1940, the hollow words of the stadium's portada, and three witnesses.
  - A chase by a black pickup, a theft at the museum, the indigo cave on the cerro, and a race against the clock to the cabildo.
- **Talk to anyone, in your own words, in English or Spanish.**
  - Everyone in the story has their own voice, history, secrets and agenda.
  - Every passer-by is generated from their barrio: a name, a job, a temperament, something they want, something they hide, and a view on Friday's vote. Sixteen regulars always keep the same corner.
  - In the claude.ai app, characters answer live through your own Claude account, after you approve it. In the installed app, you can add your own Anthropic API key under Settings → Voices. Without either, everyone speaks from their own written lines.
- **Goals:**
  - Six races: a circuit of the centro, a run east toward Morelia and two sprints on the real highways toward Sahuayo and Guadalajara, and jetpack courses through rings at the bell towers and up the cerro, each with gold, silver and bronze times.
  - Twelve of Aurelio's lost notebook pages, each with a true piece of the town's history.
  - Postcards from seventeen landmarks, and 25 achievements.
- **Accessibility and comfort:**
  - Text size and high-contrast panels
  - Reduced motion
  - Forgiving chases and timers
  - Look sensitivity and inverted look
  - On-screen controls: automatic, always or never
  - Three quality presets
  - An "I'm stuck" button (U) that always gets you back to a street

## What's real and what isn't

The following are real, and the history in the Field Notes is accurate:

- Jiquilpan, its streets, buildings, landmarks and mountains.
- Lázaro Cárdenas, born here in 1895, who expropriated Mexico's oil on 18 March 1938.
- Orozco's 1940–42 murals in the Biblioteca Gabino Ortiz.
- The words on the portada.

The following are invented:

- Every character.
- The company, Manantiales del Cerro.
- The 1938 water title, Cuco's box, the hollow stone and the notes in the parish book.
- The Cueva del Añil.
- Aurelio's jetpack.

## Building

```sh
npm install
pip install requests pyarrow shapely numpy pillow
npm run data    # fetches Overture Maps features and elevation tiles into raw/, builds data/jiquilpan.bin + .json
npm run build   # bundles src/ into a single self-contained index.html and sw.js (and copies the site to public/)
```

Serve the folder with any static server. Vercel deploys it from `public/` (see `vercel.json`).

- `tools/overture.py`: reads only the Overture parquet row groups that cover the town, over HTTP range requests.
- `tools/terrain_tiles.py`: downloads and resamples elevation tiles.
- `tools/build-jiquilpan.py`: turns footprints into oriented buildings with styles and floors, streets into widths and surfaces, and land cover into a raster and trees.
- `src/geo.js`: projection, places, barrios.
- `src/data.js`: the town loader and collision.
- `src/render/`: sky, ground (terrain, streets, river), buildings, trees, landmarks, close-up detail and parked cars, traffic, people.
- `src/game/`:
  - input and player (walking and the jetpack), vehicles, audio and UI;
  - story (characters), quests (the chapters and the story engine), lore (pages, notes, achievements);
  - citizens, dialogue voices and races.

The earlier San Francisco game, Undertow, is in the git history.

## Data and credits

- Streets, buildings, places, land use, land cover and water: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors and the Overture Maps Foundation, under the ODbL
- Elevation: Terrarium tiles from the AWS Open Data terrain dataset (SRTM, national models)
- Rendering: three.js
