# Bug-fix report

Found by driving the built game in a real browser (see `button-audit.md`), then fixed in the source and re-tested. "Regression test" means a test in `tests/` that fails on the original code (`f94d73f`) and passes now; where no unit test is possible (it needs a real browser) the browser audit row that proves it is named instead.

Environment limits that apply to everything below: software WebGL (no GPU), emulated touch and gamepad, no physical devices. See `button-audit.md`.

## Fixed

### BUG-01 The Settings menu opened from the title screen was invisible
- **Reproduce:** Title screen → *Settings*. Nothing appears; *Back to the town* cannot be clicked; pressing *Begin* starts the game with the menu still open over it.
- **Root cause:** `#menu` had `z-index: 35`; the title screen (`.screen`) has `40`, so the menu opened underneath it.
- **Fix:** `#menu { z-index: 45 }` (still below the story card at 60).
- **Regression test:** `tests/css.test.mjs` › *the menu opened from the title screen stacks above the title…* (fails on `f94d73f`: `#menu (35) must be above .screen/#title (40)`).
- **Retest:** Suite A › Title › *Settings*, *Back to the town*, *Escape*: pass.

### BUG-02 Escape did nothing in the title-screen Settings menu
- **Reproduce:** Title → *Settings* → Escape.
- **Root cause:** the menu's own Escape handler only fires when focus is inside the menu, and focus stayed on the title button; the game's key loop (which also handles Escape) does not run before a game starts.
- **Fix:** opening the menu moves focus to the current tab; before a game starts, a global handler closes the menu on Escape.
- **Retest:** Suite A › Title › *Escape*: pass. (Browser-only; no unit test.)

### BUG-03 Escape inside the menu closed it and immediately reopened it
- **Reproduce:** open the menu with a click, click a tab (focus is now inside the menu), press Escape: the menu is still open one frame later.
- **Root cause:** one key press was handled twice: the menu's own handler closed it, then the game loop saw the queued "menu" action and opened it again.
- **Fix:** the menu, dialogue and side-panel handlers stop propagation (the dialogue and global handlers run in the capture phase), so only one handler acts.
- **Retest:** Suite A › Menu › *Escape*: pass. Suite B › Dialogue › *Escape / back* and *Leave*: pass (conversation ends, input restored, no menu pops up). The dialogue case follows the same pattern in the code; I did not reproduce the symptom there before the fix.

### BUG-04 Tab was swallowed everywhere, so keyboard-only players could not move between controls
- **Reproduce:** open any menu, shop, dialogue or minigame and press Tab: nothing moves (the game treated it as "toggle menu").
- **Root cause:** the global key handler called `preventDefault()` on every Tab.
- **Fix:** when a menu, panel, dialogue, card, title or minigame is open, Tab is left to the browser. With nothing open, Tab still opens the menu.
- **Regression test:** `tests/input.test.mjs` › *Tab is left to the browser while a menu, panel, dialogue, card or the title is open* (fails on the original handler).
- **Retest:** Suite B › Dialogue › *Tab key inside the dialogue*: pass.

### BUG-05 Escape did not close shop, land, barber or builder panels
- **Reproduce:** open any shop panel, press Escape: it stays open (only the ✕ closed it).
- **Root cause:** no Escape handling for `#side`; input is paused while a panel is open, so the game loop never saw it either.
- **Fix:** Escape handler on the panel plus a global fallback.
- **Retest:** Suite A › Side panel › *Escape*; Suite E › Builder › *Escape / ✕*: pass.

### BUG-06 One tap on an on-screen button fired its action twice
- **Reproduce (emulated touch):** tap the camera button once: the event log shows `pointerdown → PRESS camera → pointerup → lostpointercapture → PRESS camera`, so the view toggles twice and appears unchanged.
- **Root cause:** the assistive-technology `click` handler (added by the prepared update) pressed the action again for the click that follows a tap or an Enter key.
- **Fix:** a click only counts if no pointer or key activation of that button happened in the last 800 ms.
- **Regression test:** `tests/input.test.mjs` › *one tap or key press on an on-screen button fires its action once, even when a click follows* (fails without the fix); a screen-reader click with no pointer event still works.
- **Retest:** Suite C › *camera (📷)*, *case*, *map*: pass. I did not establish whether real phones deliver a `detail: 0` click after a tap; the emulated tap did, and the fix is safe either way.

### BUG-07 On a phone the menu's way back was off-screen
- **Reproduce (390×844):** open the menu: only *Map, Mystery, Journal* are visible; *Settings* and *Back to the town* sit at x = 842 and 977 in a scrolling strip with no hint (screenshot `phone_menu.png` in the verification run).
- **Fix:** below 760 px the close button is a pinned ✕ in the corner (the tab strip leaves room for it), and the current tab is scrolled into view.
- **Regression test:** `tests/css.test.mjs` › *on small screens the menu's close button is pinned…*.
- **Retest:** Suite C › *menu button and tabs by tap*: pass (tab switch, strip swipe, ✕ on screen, tap closes).

### BUG-08 Minigames could trap the player
- **Reproduce:** (a) open any minigame and press Escape: 7 of the 8 did not close (only games that register their own key handler did); (b) Tab could not reach *Leave*; (c) on a 450 px-high screen the lotería's *Leave* button sat at y = −122, above the top of the screen, unreachable by touch or mouse.
- **Root causes:** (a) Escape was only wired inside `key()`; (b) as BUG-04; (c) `.mini` used `justify-content: center` with `overflow-y: auto`, which clips the top of an overflowing column.
- **Fix:** `MiniGames.open()` installs a capture-phase Escape handler for every game and removes it on close; Tab allowed; `.mini` is top-aligned with auto margins and a sticky header.
- **Regression tests:** `tests/minigames.test.mjs` (fails without the fix), `tests/css.test.mjs` › *a minigame taller than the screen keeps its Leave button reachable…*.
- **Retest:** Suite E › each of the 8 minigames: *Leave and Escape both close it*: pass.

### BUG-09 The key light jumped from sun to moon in one frame
- **Reproduce:** step the clock minute by minute through dusk and dawn: when the night factor crossed 0.6 the sun/moon direction (and every shadow and the sun disc) turned by 2.5 rad (143°) in a single step, and sun colour dropped 45% at once. The fog bank also stepped at 20:00 and at midnight.
- **Root cause:** `setTimeOfDay` switched between two formulas at `night > 0.6`.
- **Fix:** the sun and moon directions are blended by the night factor (never switched); sun colour is scaled by the same weight; the fog bank is piecewise-linear and closed around midnight; hours are normalised to 0–24.
- **Regression tests:** `tests/sky.test.mjs` (one-minute steps over 24 h, including the wrap; fails on the original code with `light direction jumped 2.498 rad at 5.700 h`).
- **Retest:** Suite B › *Time skip*: sampled every frame in the browser.

### BUG-10 Sleeping (and a long date) jumped the clock
- **Reproduce:** sleep in your own house: the hour changed from the evening to 7:00 in one frame (lights, sky and shadows all popped). A dinner date set the hour to 21:00 the same way.
- **Fix:** `warpTo(hour)` runs the clock forward at four game hours per second, slowing wherever the sky (light direction, colours, night factor) would change by more than a per-frame limit; input is locked meanwhile and restored on arrival; bells and the "noctámbulo" achievement are not triggered while skipping.
- **Regression tests:** `tests/warp.test.mjs`: 22:00→07:00 at 60, 30 and 15 fps stays within the per-frame limits, crosses midnight once and lands exactly on 7:00 (about 3 s at 60 fps); two other ranges.
- **Retest:** Suite B › *Time skip*: pass.

### BUG-11 The Vercel build did not publish `assets/`
- **Reproduce:** the `vercel.json` build command copies `index.html sw.js manifest.webmanifest icons data` only. With `assets/` missing, the title artwork 404s and the service worker's `cache.addAll` rejects, so the app never installs for offline play.
- **Fix:** `assets` added to the copy list.
- **Regression test:** `tests/deploy.test.mjs` (every folder `tools/bundle.mjs` publishes is copied by `vercel.json`; every file the service worker precaches exists).

### BUG-12 Progress could be lost when the page was hidden or closed
- **Reproduce:** play for under 30 s after the last save, switch to another app (or close the tab): the position and anything done since the last save is gone. The game autosaves every 30 s and at milestones, but not on hide or close.
- **Fix:** `visibilitychange` (hidden) and `pagehide` call `save()`.
- **Retest:** Suite H › *tab hidden and shown again*: failed before (`saved while hidden=false`), passes now.

### BUG-13 (found in my own controller navigation) Start reopened the menu it had just closed
- **Reproduce:** with a controller, open the menu, press Start: it closes and, while Start is still held, the world reads Start as "open the menu" and opens it again.
- **Fix:** after an overlay closes, the controller ignores all buttons until every one has been released.
- **Regression test:** `tests/input.test.mjs` › the controller-menu test (fails without the fix). **Retest:** Suite D › *B button and Start*.

### BUG-14 On a phone the compass ran under the place card and the objective was cut off by the minimap
- **Reproduce (390×844, touch):** the compass strip overlapped the place card, and the objective line ("Prologue: The last call…") was truncated under the minimap (screenshot `touch_ui.jpg` before the fix: compass letters hidden, objective cut at "THE LAST CAL").
- **Fix:** at 480 px wide and below, the compass and the objective get their own rows under the place card (`src/style.css`).
- **Retest:** `docs/screenshots/touch_ui.jpg` (after); Suites C and H rerun at phone width: pass.

## Added (not bugs)

- **Controller navigation of menus, dialogues, shop panels, story cards and minigames** (D-pad or left stick moves focus, A activates, B or Start goes back, bumpers switch menu tabs, D-pad left/right adjusts a slider). Before this the controller only walked and acted in the world. Unit-tested in `tests/input.test.mjs`; also exercised by Suite D with an emulated controller (no physical device).
- **Francisco Salazar, Cecilia, the milpa house, the muicle prop and the "Elotes y una guitarra" side quest** (see `README.md`). The cast ID is `franciscoSalazar`, distinct from the hardware-store Francisco (`francisco`).
- **Exact stadium inscriptions** on the portada (see `README.md`).

## Looked for and not found

- **Floating or buried people.** The handoff suspected a man floating near the San Francisco chapel. All 58 named characters and regulars were placed at 07:00, 12:00, 18:00 and 22:00 and compared with the ground height at their position: none was more than 1 m off, including Doña Toña and the mast technician on the summit.
- **Duplicate listeners.** After four title/continue cycles one key press produced one action and one Save click produced one save and one toast (Suite H).
- **Broken URLs and script errors.** No console error or failed request in any suite except the Google Fonts request that this sandbox blocks.
- **Corrupt or truncated saves** (invalid JSON, `{}`, name only, an array, `life: null`): the page loads and the game can be started every time; a save made by the original build continues intact (Suite F).

## Observed, not fixed

- Standing 130 m south of the Santuario put the player on a flat striped surface filling the view ("ALT 0 m"): most likely a walkable rooftop. I did not investigate whether that is intended.
- The service worker is cache-first, so the first visit after a deploy shows the old version once; the new one installs in the background and is used from the next load. I did not change that behaviour (the update path is tested in `button-audit.md`, Suite G).
- Google Fonts requests fail inside this sandbox (TLS interception). That is the environment, not the game; the page falls back to system fonts.
