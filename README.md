# Open Your Eyes

A top-down adventure told in the first person, set in a San Francisco that is almost the one you know. It's installable on Android as a web app.

It's twelve minutes past five in the morning. I was riding my bike home down Market Street when the light at New Montgomery turned red. Now I'm on the sidewalk in front of the Palace Hotel, and a valet in a red coat is laughing at me like I told him a joke. Every clock in the city says 5:12. The streets are right, but the people on them are wrong: Emperor Norton, Mark Twain, the poets of the Six Gallery, the men who built the Golden Gate. None of them are entirely alive.

I just want to get home.

The story borrows its shape from two sources. Jean-Paul Sartre's *No Exit* supplies the valet, the room with no mirrors, and "hell is other people." *The Outer Limits* supplies the narrator's voice at the beginning and the end. Both are homages, written fresh.

## How it plays

- You explore the city top-down. When you talk to someone, the view switches to first person: the person you're speaking to, large, in front of you. My own thoughts appear in italics.
- There are six missing minutes, 5:07 through 5:12. Six ghosts are holding them without knowing it. Help each one and a minute of that morning comes back. Six puzzles:
  - **Union Square:** herd Emperor Norton's dogs, Bummer and Lazarus, into a corner.
  - **Portsmouth Square:** light Mrs. Lee's lanterns in the order of a poem carved at Angel Island.
  - **The Six Gallery:** help Allen Ginsberg finish the last poem of the night.
  - **Sutro Baths:** turn Adolph Sutro's linked valves until every pool fills.
  - **The Golden Gate:** push the rivet kegs to mend the Halfway to Hell Club's net.
  - **Hunters Point:** work out which canister is the real one, using clues from a sailor, a welder and Deep Throat.
- Around 40 real San Franciscans, composites and animals share the city with them, among them Robin Williams, Harvey Milk, Willie Mays, Mary Ellen Pleasant, Monarch the grizzly and Claude the albino alligator.
- **B** is a thought. It gives a first-person hint about what to try next, so you're never stuck.
- **Field Notes** in the menu hold the real history behind everyone you meet. Each note is labelled as a real person, a real animal, a composite, or invented for the story.

### Controls

- **Touch:** drag the pad to walk; **A** talks, uses and opens; **B** thinks (a hint); **Menu** opens the journal, map, minutes and Field Notes. Walk into a keg to push it.
- **Keyboard:** arrow keys; **A** / Z / Space; **B** / X; **M** or Esc for the menu.

Progress saves automatically.

## Install on an Android phone

The app has to be served over HTTPS to be installable. This repo includes a GitHub Pages workflow:

1. In the GitHub repo, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main` (or run the *Deploy to GitHub Pages* workflow by hand). The site appears at `https://<user>.github.io/abayareastory/`.
3. Open that URL in Chrome on your phone and tap **⋮ → Install app**, or use **Install on this phone** on the title screen.

It opens full-screen from the home-screen icon and keeps working offline.

To run it locally: `npx http-server .`, then open `http://localhost:8080`.

## A note on real people

Real historical people appear as ghosts. Their lines are imagined, but the facts they tell come from the historical record, and the Field Notes give the history plainly. The Ohlone elder is written as a composite, with care; the Ramaytush Ohlone are a living people, and the Association of Ramaytush Ohlone works on their behalf today.

## Project layout

```
index.html              app shell
css/style.css           layout and UI
js/art.js               cel-shaded vector art: tiles, landmarks, sprites, title and ending scenes
js/bust.js              first-person encounter portraits
js/world.js             cast, maps, dialogue, puzzles, the six minutes, prologue and ending
js/notes.js             Field Notes (real history)
js/game.js              engine: movement and collision, puzzles, dialogue, menus, save, audio
sw.js, manifest.webmanifest, icons/   installable web app (PWA)
```
