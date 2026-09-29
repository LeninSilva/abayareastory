# Yelamu: Open Your Eyes

A Zelda-style, top-down adventure set in an alternate San Francisco, installable on Android as a web app.

**2026.** In a San Francisco that never built a car, a young Ohlone man named Tolowin carries a grade III arteriovenous malformation in his left temporal lobe. He chooses the Long Sleep: vitrification at −196 °C.

**2758.** 732 years later, the city is a sovereign city-state on the tip of the peninsula, the Free City of Yelamu–San Francisco. It runs on laser fusion born from an Ohlone crystal-lens tradition, alongside the ARM (Artificial Reasoning Machine). The ARM rewarms him, corrects the KRAS mutation behind his malformation, and spends a year regrowing his brain the way an axolotl regrows a limb.

**2759.** A machine tells him to open his eyes. He remembers nothing but his name. The game is his first year awake: re-integration class at the Conservatory of Flowers, a classmate named Maren whose face stays with him, her parents who want him gone, five lost memories scattered across the city, and Static gathering at the Resonance Mast on Twin Peaks.

## Play

- **Touch:** drag the round pad to walk, **A** to talk or swing the Lumen Staff, **B** to fire the prism beam (once you have it), **Menu** for the journal, map, memories and Codex.
- **Keyboard:** arrow keys walk, **A** (or Z / Space) = A, **B** (or X) = B, M / Esc = menu.
- Progress saves automatically on the device.

## Install on an Android phone

The app has to be served over HTTPS to be installable. This repo includes a GitHub Pages workflow:

1. In the GitHub repo, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main` (or run the *Deploy to GitHub Pages* workflow by hand). The site appears at `https://<user>.github.io/abayareastory/`.
3. Open that URL in Chrome on your phone, tap **⋮ → Install app** (or **Add to Home screen**), or use the **Install on this phone** button on the title screen.

It opens full-screen from the home-screen icon and keeps working offline (a service worker caches the game).

To run locally: `npx http-server .` and open `http://localhost:8080`.

## The Codex

Everything the story rests on is written up inside the game (**Menu → Codex**, or **Read the Codex** on the title screen). Each section is tagged **Real** (documented science and history) or **Story** (this world's invention):

- The city-state, its ports of entry (Golden Gate, Bay Bridge, Ferry Building), passports and residency, life without money
- The Compact of Living Measure and its Ladder of Measures (steam → coal → rail → automobile → towers → grid → fission → thinking machines)
- The crystal-lens lineage: burning lenses, birefringence, piezoelectricity, the ruby laser, second-harmonic generation in quartz, and laser fusion ignition at the National Ignition Facility (2022)
- The Higgs field, and where the story's speculation begins
- The ARM, Shannon entropy and Landauer's principle
- Tolowin's diagnosis: Spetzler–Martin grade III (S3 E0 V0), a 6.4 cm nidus in the left anterior temporal lobe, with feeders, drainage and symptoms
- Vitrification and nanowarming
- The cure: KRAS in brain AVMs, axolotl regeneration, partial reprogramming
- The Elemental-born: synthetic genomes and artificial wombs
- Landmarks, people, a timeline, and a note on the Ohlone

## About the names

The Ramaytush Ohlone are the original people of the San Francisco Peninsula, and Yelamu is the name of the group whose villages stood here. The character names Tolowin, Awashi, Ahwa, Siwe and Tawi are invented for this fiction and are not Ohlone words. If the project grows, the right next step is to work with Ramaytush Ohlone community members on language, names and imagery.

## Project layout

```
index.html              app shell
css/style.css           layout and UI
js/art.js               all vector art (tiles, landmarks, characters, scenes), drawn with canvas paths
js/world.js             maps, cast, dialogue, memories, ending
js/lore.js              the Codex
js/game.js              engine: movement, combat, dialogue, menus, save, audio
sw.js, manifest.webmanifest, icons/   installable web app (PWA)
```
