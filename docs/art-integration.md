# Art integration: what was integrated, what was not, and why

## Integrated

| Item | Where | Notes |
|---|---|---|
| Valley painting ("Jiquilpan Valley Beneath Cerro de San Francisco") | `assets/jiquilpan-vista.jpg` (489 KB) | Title-screen background under a dark gradient so the text stays readable (`src/style.css`). Published by `tools/bundle.mjs` to `public/assets/`, precached by the service worker, and copied by `vercel.json`. Verified offline (see `button-audit.md`, Suite G). |
| Regional vista in the 3D world | `src/render/vista.js` (from the prepared update) | Chapala shoreline plane with animated water, a stylised Cristo Rey de Sahuayo, and batched Sahuayo lights that switch on at night. Checked from the cerro summit, from the statue, and from the air by day and night (`docs/screenshots/`). It is a scenic approximation, as its own header says. |

## Not integrated (blocked)

The task named three archives and an `IMAGES` folder on Google Drive:

| File | Size | Status |
|---|---:|---|
| `Anil-game-update.zip` | 4.4 MB | **Downloaded and integrated** (see commit history). |
| `Anil-Jiquilpan-Claude-Art-Pack.zip` | 98 MB | **Blocked.** |
| `Anil-Jiquilpan-New-Images.zip` | 40 MB | **Blocked.** |
| `IMAGES/` (5 reference images, 2–3 MB each) | 13 MB | Listed; three were viewable in the conversation. Reference sheets are not runtime assets, so none were copied into the repository. |

**Why blocked:** the Google Drive connector available in this session refuses files over 10 MB ("File too large for download, over limit of 10 MB"), and the sandbox's network policy denies `drive.google.com` from the shell (HTTP 403 on the proxy's CONNECT). The 4.4 MB zip fit under the limit; the two art zips do not.

**Consequently these were not done**, and nothing in the repository claims otherwise:
- `assets/anil-art/` (runtime sprites, tiles, backgrounds, `asset-manifest.json`) and `assets/anil-photo/` (supplemental landmark, character and tea illustrations) do not exist.
- No portraits in dialogue or character screens, no illustrated cutscene frames, no sprite textures for grass, cobbles or streets from the pack, no painted grey aliens/UFO/bikes/chickens/pajarete props from the pack.
- The pack's sky-cycle helper and its tests were not available. The continuous dusk-to-dawn cycle was done from the game's own sky code instead (`src/render/sky.js`, `src/game/warp.js`, `tests/sky.test.mjs`, `tests/warp.test.mjs`).
- The checksum file (`CHECKSUMS.sha256`) and `CLAUDE_HANDOFF.json` / `asset-manifest.json` / `style-guide.json` / `integration-guide.md` could not be read.

**To unblock, any one of these is enough:**
1. Put the two archives' extracted folders in the repository (or any location the session can read), or
2. Split each zip into parts under 10 MB and re-share them, or
3. Allow `drive.google.com` and `*.googleusercontent.com` in the environment's network policy so the shell can fetch them with `curl`.

Then the work is: copy the runtime sprites/tiles to `assets/anil-art/`, record IDs/sizes/anchors from the manifest, load them lazily with a texture cache and error fallback, and use portraits in the dialogue box (`#dlg-face`).

## Characters and props that do not depend on the art pack

- **Francisco Salazar** (cast ID `franciscoSalazar`) is the guitarist who lives on the cerro with Cecilia, grows corn with her, and used to play with Los Calis. He is deliberately **not** merged with the hardware-store Francisco (`francisco`, "El Ferretero"). He wears a wide-brimmed hat, has a short dark beard, and carries a guitar on his back (new `guitar` accessory in `src/render/human.js`).
- **Cecilia** (`cecilia`): her appearance is a **provisional original concept** (bun, apron, plum skirt); the cast entry's title says so.
- Their house and milpa stand next to the Rancho de los Salazar (`casaCecilia` in `src/geo.js`), with corn rows, ears of corn drying on the porch, and the muicle.
- **Muicle** prop: a bed of leafy plants (green with a few purple-red ones) and a clay pot of red-purple tea on three stones, with a sign reading *MUICLE · micle · Justicia spicigera*. The card you get by looking at it names the plant and describes only what it looks like. It makes **no health claims**; the browser audit (Suite B › *Muicle prop*) checks the card text for the plant's names and for the absence of medical words.
- Side quest **"Elotes y una guitarra"** (giver: Cecilia, available from chapter 1): cut six elotes, then ask Francisco to play; pays $250.

## Stadium inscriptions

On the Portada del Estadio 18 de Marzo, seen from the street (facing south toward the portada), exactly:

- left panel: **"Los recursos naturales del país deben servir para su propia prosperidad."**
- right panel: **"Entregarlos a intereses extranjeros es traición a la patria."**
- arch: **"18 DE MARZO"**
- below the eagle, on the crest: **"1935"**; the eagle sits above it.

Accents and the spelling of *extranjeros* are as specified; the in-game plaque/quote text elsewhere (`src/game/quests.js`, `src/game/story.js`) was updated to match. The left wording follows the supplied photograph. See `docs/screenshots/stadium_*.jpg`.
