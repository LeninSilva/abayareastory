# Verification report

What was run, what passed, what failed and was fixed, and what could not be checked. Nothing here is claimed without a row in `button-audit.md`, a test in `tests/`, or a file in `docs/screenshots/`.

## 1. Commands (from the lockfile)

```
npm ci            # installs from package-lock.json
npm test          # node --test tests/*.mjs : 27 tests, 27 pass, 0 fail
npm run build     # index.html 1260 KB (script 1215 KB, 387 KB gzipped), sw.js, public/
```

Unit and regression tests (`tests/`):

| File | Tests | Covers |
|---|---:|---|
| `sky.test.mjs` | 3 | sun/moon direction, colours and night factor never jump over 24 h (one-minute steps, wrapping midnight); out-of-range hours wrap; the key light never goes below the horizon |
| `warp.test.mjs` | 3 | the sleep time-skip at 60/30/15 fps stays within per-frame limits, crosses midnight once, lands exactly on 7:00 (about 3 s at 60 fps); two other ranges; `skyChange` symmetry |
| `input.test.mjs` | 9 | gamepad disconnect and shared mappings; releaseAll; assistive click; wrapped hours; Tab left to the browser when an overlay is open; one tap = one action; controller navigation of menus |
| `css.test.mjs` | 4 | menu above the title; phone close button pinned; minigame Leave reachable; small stacking rules |
| `minigames.test.mjs` | 1 | Escape ends a minigame without its own key handler |
| `deploy.test.mjs` | 3 | `vercel.json` copies what `npm run build` publishes; every service-worker precache file exists; the title artwork is built and cached |
| `ui.test.mjs` | 2 | menu buttons and dialogue/card buttons dispatch (from the prepared update) |

Each regression test was run against the original code or stylesheet it guards and **failed there**, then passes now: sky (a 2.5 rad light jump), Tab, one-tap-one-action, controller menu navigation, minigame Escape, the three CSS rules (menu stacking, phone close button, minigame Leave) and the Vercel copy list. `warp.test.mjs` guards a module that did not exist before the update. See `bugfix-report.md`.

## 2. Browser audit (real Chromium, built `public/` served over HTTP)

247 checks, 247 pass, 0 fail, 1 blocked. Full tables and the raw JSON: `button-audit.md`, `audit-results/`.

| Suite | Checks | Result |
|---|---:|---|
| A. Title, intro, HUD, keyboard shortcuts, every menu tab and footer button, map, every setting | 85 | 84 pass, 1 blocked (no side quest exists at game start, so no *Track* button) |
| B. Dialogue (all first-screen answers and both sub-menus for two characters), the new cerro quest end to end, muicle, every shop, barber, land, vehicles, jetpack, camera, stuck recovery, observed sleep time-skip | 68 | pass |
| C. Touch, emulated phone | 20 | pass |
| D. Gamepad, emulated controller (walking, every button, disconnect/reconnect, menu/dialogue/shop/minigame navigation) | 31 | pass |
| E. Land, builder, businesses, races, all 8 minigames | 22 | pass |
| F. Save made by the original build continues; 5 kinds of corrupt save | 11 | pass |
| G. Service worker: install, offline reload, update path, save survives the update | 5 | pass |
| H. Lifecycle: no duplicate listeners after title cycles, resize/rotate, title during a conversation, tab hidden | 6 | pass |

Suites C and H were rerun after the last CSS change (the 480 px HUD layout); the other suites ran on the build just before it, which differs from the final one only inside that media query (nothing else in the code changed between them).

**Not claimed:** every control was exercised, but not every outcome of every one (see "Not covered" in `button-audit.md`): minigame play to the end, finishing a race, every gift/date/proposal path with every character, audible audio, pointer-lock re-entry.

## 3. Passed, failed, blocked

**Passed:** everything in sections 1 and 2 on the final build.

**Failed during development and fixed** (each with a repro, root cause, fix and retest in `bugfix-report.md`): the title Settings menu hidden under the title; Escape in menus, panels, dialogue and minigames; Tab swallowed everywhere; one touch tap firing twice; the phone menu's way back off-screen; minigame Leave unreachable; the sun-to-moon light flip; the clock jumping when sleeping; the Vercel build omitting `assets/`; progress lost when the page is hidden; controller Start reopening the menu; the phone HUD overlap. Not reproduced: floating NPCs (58 people checked at four times of day).

**Blocked / not done:**

- The two Drive art packs (98 MB and 40 MB): the connector refuses files over 10 MB and the sandbox cannot reach `drive.google.com`. See `art-integration.md` for the exact consequences and the three ways to unblock. Nothing from those packs is integrated.
- Physical devices: **no physical phone, tablet or gamepad was available**; touch and gamepad results are from emulation.
- Real-GPU rendering and frame rate (see section 5).
- Pointer lock enter/exit, real iOS Safari / Android Chrome, audible audio.

## 4. Screenshots (`docs/screenshots/`, 800×450 unless noted; software-rendered)

| Subject | File |
|---|---|
| Title (desktop 1280×720; phone 390×844) | `title.jpg`, `title_phone.jpg` |
| Dawn 06:12, day 12:00, sunset 18:41, night 23:00 at the Jardín | `time_dawn.jpg`, `time_day.jpg`, `time_sunset.jpg`, `time_night.jpg` |
| Stadium portada: left panel, whole arch with the eagle, the date under the eagle | `stadium_left.jpg`, `stadium_arch_eagle.jpg`, `stadium_1935.jpg` |
| Biblioteca Gabino Ortiz | `library.jpg` |
| Streets with the Santuario's tower and dome behind | `street_sagrado_a.jpg`, `street_sagrado_b.jpg` |
| Francisco Salazar's house, milpa and muicle; Francisco close up; his dialogue | `cerro_house.jpg`, `francisco_salazar.jpg`, `francisco_dialogue.jpg` |
| Cristo Rey; aerial view toward the lake by day; Sahuayo's lights at night; summit views | `cristo_rey.jpg`, `aerial_lake_day.jpg`, `aerial_sahuayo_night.jpg`, `vista_summit_day.jpg`, `vista_summit_night.jpg` |
| Touch UI (phone) | `touch_ui.jpg` |
| Phone menu before and after the fix | `phone_menu_before.jpg`, `phone_menu_after.jpg` |

The aerial lake view shows a flat water surface in a low area at the horizon, not floating above the terrain; it is a scenic approximation (the file header of `src/render/vista.js` says so) and I could not check it against a real photograph.

## 5. Performance

Measured in headless Chromium on a machine with **no GPU** (software WebGL), so only sizes, CPU cost and per-frame draw load are meaningful; **frame rate is not**. I have no measurement from a real phone or desktop GPU.

| Measurement | Value |
|---|---|
| `index.html` | 1260 KB raw, 387 KB gzipped |
| `data/jiquilpan.bin` / `.json` | 6133 KB (3148 KB gzipped) / 91 KB |
| `assets/jiquilpan-vista.jpg` | 477 KB |
| Title screen visible | about 60–80 ms after load |
| *Begin* to playable (software WebGL, cold) | about 5.0 s |
| JS heap after start | about 288 MB |
| Update step (game logic, drawing stubbed), average | 1.9–2.2 ms per frame |
| Draw calls per frame (all passes, incl. two shadow cascades) | 4,538 (Jardín, day), 6,004 (Jardín, night), 3,060 (portada), 6,153 (cerro summit) |
| Triangles per frame | 9.1 M, 11.7 M, 9.2 M, 11.5 M |
| GPU objects | 3.4–3.9 k geometries, 60–81 textures, 82–85 shader programs |

That draw load is high for phones. It predates this update (the vista adds one plane, about eight meshes and one 80-instance mesh), and I did not change it. The game already lowers its pixel ratio when frames run slow; whether that is enough on a low-end phone is untested.

## 6. Deployment

See the end of `bugfix-report.md` and the repository's commit history for what was pushed. GitHub Pages deploys from `.github/workflows/pages.yml` on pushes to `ccr-1083fbdc-shiu1z`; `vercel.json` now copies `assets/`.
