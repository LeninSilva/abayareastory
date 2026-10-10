# Button and control audit

Every control reachable in the built game (`public/`, served over HTTP) was exercised by a script that drives a real Chromium (Playwright). This file is generated from the raw results (`docs/audit-results/*.json`); nothing here was filled in by hand.

## Environment, and what it can and cannot prove

| | |
|---|---|
| Browser | Chromium 1194 (headless) via Playwright, desktop viewport 800×450 (menus, HUD, dialogue) and a phone viewport 390×844 (touch) |
| WebGL | **Software** (SwiftShader). The machine has no GPU, so frame rates here say nothing about real devices. |
| Logic runs | For the control audit the draw call was stubbed (`game.render`) so the game loop runs at full speed and keys, holds and timers behave as on a real device. Visual checks (screenshots) use the real renderer. |
| Touch | **Emulated** touch events (Chrome DevTools protocol: touchStart/Move/End/Cancel, multi-finger). No physical phone or tablet was available. |
| Gamepad | **Emulated** controller (`navigator.getGamepads` replaced). **No physical gamepad was available.** |
| Not testable here | Pointer lock enter/exit (headless Chromium has no real pointer lock), real iOS Safari or Android Chrome, audible audio, real-GPU performance, a physical keyboard layout other than US. |

## Summary

| Suite | What | Pass | Fail | Blocked |
|---|---|---:|---:|---:|
| A | Title, intro, HUD, keyboard, menu, map, settings, tabs (mouse + keyboard) | 84 | 0 | 1 |
| B | Dialogue, the new cerro quest, shops, barber, land, vehicles, jetpack, camera, stuck recovery, time skip | 68 | 0 | 0 |
| C | Touch (emulated phone, 390×844) | 20 | 0 | 0 |
| D | Gamepad (emulated controller) | 31 | 0 | 0 |
| E | Land, builder, businesses, races, minigames | 22 | 0 | 0 |
| F | Save compatibility and corrupt saves | 11 | 0 | 0 |
| G | Service worker: install, offline, update path | 5 | 0 | 0 |
| H | Lifecycle: duplicate listeners, resize, title during a conversation, tab hidden | 6 | 0 | 0 |
| | **Total** | **247** | **0** | **1** |

### Blocked or not applicable

- **Journal › Track / Race buttons**: no side quest is active yet, so no Track buttons exist at the start of a new game

### Failing

None in the final run.

### Not covered by this audit (so not claimed)

- Outcomes of playing each minigame to its end (only that each opens, every button responds, and Leave/Escape close it) and finishing a race (only that each starts).
- Every gift, date, proposal and wedding path with every character (the first screens and both sub-menus for two characters, one story and one cast, are covered).
- Only the first six buttons of each shop panel are clicked; selling does not exist in this game.
- Audio: sliders set and store the volume; no sound output was heard.
- Pointer-lock re-entry after leaving a menu, and real-device touch ergonomics.

## Suite A: Title, intro, HUD, keyboard, menu, map, settings, tabs (mouse + keyboard)

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Title | Continue | visual | hidden when there is no saved game | hidden=true | ✅ pass |
| Title | grandson | mouse click | exactly this option is pressed (aria-pressed) and the others are not | m:true f:false x:false | ✅ pass |
| Title | granddaughter | mouse click | exactly this option is pressed (aria-pressed) and the others are not | m:false f:true x:false | ✅ pass |
| Title | grandchild | mouse click | exactly this option is pressed (aria-pressed) and the others are not | m:false f:false x:true | ✅ pass |
| Title | Your name | keyboard typing | accepts text, limited to 24 characters | length 24 | ✅ pass |
| Title | Gender buttons | keyboard (focus + Space) | Space presses the focused option without starting the game | {"f":"true","started":false} | ✅ pass |
| Title | About | mouse click | opens a card about the game titled Las luces del Cerro; Continue closes it | open=true closedAfter=true text=LAS LUCES DEL CERRO A mystery  | ✅ pass |
| Title | Settings | mouse click | opens the menu on the Settings tab; only Settings and Notes tabs are enabled before a game starts | {"menu":true,"tab":"settings","dis":["map","case","journal","people","you","property"]} | ✅ pass |
| Title | Back to the town (menu-close) | mouse click | closes the menu and shows the title again | menu=false title=true | ✅ pass |
| Title | Escape | keyboard | closes the title settings menu | menu=false | ✅ pass |
| Title | Begin | mouse click | starts a new game named Zoe and shows the first intro card | started=true name=Zoe card=true | ✅ pass |
| Intro card | Continue | mouse click | advances exactly one card | 0 -> 1 | ✅ pass |
| Intro card | Continue | keyboard Enter | advances exactly one card (no double activation) | 1 -> 2 | ✅ pass |
| Intro card | Continue | keyboard Space | advances exactly one card | 2 -> 3 | ✅ pass |
| Intro card | Continue (last) | mouse click | the story card closes and gameplay input is restored | cardsLeft=false inputEnabled=true clicks=2 | ✅ pass |
| HUD | Menu (pause) | mouse click | opens the menu | menu=true tab=map | ✅ pass |
| Menu | Escape | keyboard | closes the menu | menu=false | ✅ pass |
| Keyboard | M | keyboard | opens the map tab | menu=true tab=map | ✅ pass |
| Keyboard | J | keyboard | opens the case tab | menu=true tab=case | ✅ pass |
| Keyboard | P | keyboard | opens the people tab | menu=true tab=people | ✅ pass |
| Keyboard | O | keyboard | opens the you tab | menu=true tab=you | ✅ pass |
| Keyboard | Tab | keyboard | opens the menu (and does not move browser focus away) | menu=true | ✅ pass |
| Keyboard | V | keyboard | toggles first/third person | first -> third -> first | ✅ pass |
| Keyboard | G (jetpack) before it is unlocked | keyboard | explains that the player has no jetpack yet and does not take off | {"jet":false,"toast":"Third person (V to go back).First person.You don't have a jetpack. Yet. (Tía Cuca is on the Jardín.)"} | ✅ pass |
| Keyboard | WASD / arrows | keyboard (held) | moves the player while held; stops when released | moved 12.92 m, drift after release 0.00 m | ✅ pass |
| Keyboard | Held key + window blur | keyboard + focus loss | losing focus releases held movement (no runaway walking) | moved after blur 0.00 m | ✅ pass |
| Menu | Map tab | mouse click | shows that tab and marks it current | {"tab":"map","cur":"map","shown":"map"} | ✅ pass |
| Menu | Mystery tab | mouse click | shows that tab and marks it current | {"tab":"case","cur":"case","shown":"case"} | ✅ pass |
| Menu | Journal tab | mouse click | shows that tab and marks it current | {"tab":"journal","cur":"journal","shown":"journal"} | ✅ pass |
| Menu | People tab | mouse click | shows that tab and marks it current | {"tab":"people","cur":"people","shown":"people"} | ✅ pass |
| Menu | You tab | mouse click | shows that tab and marks it current | {"tab":"you","cur":"you","shown":"you"} | ✅ pass |
| Menu | Property tab | mouse click | shows that tab and marks it current | {"tab":"property","cur":"property","shown":"property"} | ✅ pass |
| Menu | Notes tab | mouse click | shows that tab and marks it current | {"tab":"notes","cur":"notes","shown":"notes"} | ✅ pass |
| Menu | Settings tab | mouse click | shows that tab and marks it current | {"tab":"settings","cur":"settings","shown":"settings"} | ✅ pass |
| Menu | Tab buttons | keyboard (arrow focus + Enter) | a focused tab activates with Enter | tab=journal | ✅ pass |
| Menu | Save | mouse click | writes the saved game and confirms | {"saved":true,"toast":"Saved."} | ✅ pass |
| Menu | I'm stuck: take me to the nearest street | mouse click | moves the player to a street position and closes/updates the menu | moved 67 m, menu=false | ✅ pass |
| Map | Zoom in (＋) | mouse click | increases map scale | 0.250 -> 0.350 | ✅ pass |
| Map | Zoom out (－) | mouse click | decreases map scale | 0.350 -> 0.250 | ✅ pass |
| Map | Center on me | mouse click | centres the view on the player | distance 0.0 m | ✅ pass |
| Map | Map canvas | mouse click on empty ground | sets a marker (compass waypoint) and says so | waypoint={"x":-1269.4750518798828,"z":1020.6702270507812} | ✅ pass |
| Map | Clear marker | mouse click | removes the marker | waypoint=null | ✅ pass |
| Map | Landmark marker | mouse click on a landmark | opens an info card with Set marker and Close | Jardín Colón (the main square) {"on":true,"btns":["Travel here","Set marker","Close"]} | ✅ pass |
| Map info | Set marker | mouse click | sets the waypoint on that landmark and closes the card | {"on":false,"wp":{"x":-178,"z":-52}} | ✅ pass |
| Map info | Close | mouse click | closes the info card | infoOpen=false | ✅ pass |
| Map | Escape / M | keyboard | M closes the map tab | menu=false | ✅ pass |
| Settings | Light [quality=low] | mouse click | applies the setting, marks the button on, and stores it | {"val":"low","on":true,"stored":"low"} | ✅ pass |
| Settings | Balanced [quality=medium] | mouse click | applies the setting, marks the button on, and stores it | {"val":"medium","on":true,"stored":"medium"} | ✅ pass |
| Settings | Beautiful [quality=high] | mouse click | applies the setting, marks the button on, and stores it | {"val":"high","on":true,"stored":"high"} | ✅ pass |
| Settings | Cinematic [quality=cinematic] | mouse click | applies the setting, marks the button on, and stores it | {"val":"cinematic","on":true,"stored":"cinematic"} | ✅ pass |
| Settings | Small [text=s] | mouse click | applies the setting, marks the button on, and stores it | {"val":"s","on":true,"stored":"s"} data-text=s | ✅ pass |
| Settings | Medium [text=m] | mouse click | applies the setting, marks the button on, and stores it | {"val":"m","on":true,"stored":"m"} data-text=m | ✅ pass |
| Settings | Large [text=l] | mouse click | applies the setting, marks the button on, and stores it | {"val":"l","on":true,"stored":"l"} data-text=l | ✅ pass |
| Settings | Largest [text=xl] | mouse click | applies the setting, marks the button on, and stores it | {"val":"xl","on":true,"stored":"xl"} data-text=xl | ✅ pass |
| Settings | Off [contrast=normal] | mouse click | applies the setting, marks the button on, and stores it | {"val":"normal","on":true,"stored":"normal"} data-contrast=normal | ✅ pass |
| Settings | On [contrast=high] | mouse click | applies the setting, marks the button on, and stores it | {"val":"high","on":true,"stored":"high"} data-contrast=high | ✅ pass |
| Settings | Off [reduced=false] | mouse click | applies the setting, marks the button on, and stores it | {"val":"false","on":true,"stored":"false"} reduced=false | ✅ pass |
| Settings | On [reduced=true] | mouse click | applies the setting, marks the button on, and stores it | {"val":"true","on":true,"stored":"true"} reduced=true | ✅ pass |
| Settings | Never [timeScale=0] | mouse click | applies the setting, marks the button on, and stores it | {"val":"0","on":true,"stored":"0"} | ✅ pass |
| Settings | Slowly [timeScale=0.5] | mouse click | applies the setting, marks the button on, and stores it | {"val":"0.5","on":true,"stored":"0.5"} | ✅ pass |
| Settings | Normally [timeScale=1] | mouse click | applies the setting, marks the button on, and stores it | {"val":"1","on":true,"stored":"1"} | ✅ pass |
| Settings | Quickly [timeScale=3] | mouse click | applies the setting, marks the button on, and stores it | {"val":"3","on":true,"stored":"3"} | ✅ pass |
| Settings | Off [invertY=false] | mouse click | applies the setting, marks the button on, and stores it | {"val":"false","on":true,"stored":"false"} | ✅ pass |
| Settings | On [invertY=true] | mouse click | applies the setting, marks the button on, and stores it | {"val":"true","on":true,"stored":"true"} | ✅ pass |
| Settings | Automatic [touch=auto] | mouse click | applies the setting, marks the button on, and stores it | {"val":"auto","on":true,"stored":"auto"} | ✅ pass |
| Settings | Always [touch=on] | mouse click | applies the setting, marks the button on, and stores it | {"val":"on","on":true,"stored":"on"} | ✅ pass |
| Settings | Never [touch=off] | mouse click | applies the setting, marks the button on, and stores it | {"val":"off","on":true,"stored":"off"} | ✅ pass |
| Settings | Normal [chase=normal] | mouse click | applies the setting, marks the button on, and stores it | {"val":"normal","on":true,"stored":"normal"} | ✅ pass |
| Settings | Forgiving [chase=easy] | mouse click | applies the setting, marks the button on, and stores it | {"val":"easy","on":true,"stored":"easy"} | ✅ pass |
| Settings | sensitivity slider | mouse/keyboard input | changing the slider updates and stores the value | set 0.9 -> 0.9 (range 0.3..2.5) | ✅ pass |
| Settings | master slider | mouse/keyboard input | changing the slider updates and stores the value | set 0.25 -> 0.25 (range 0..1) | ✅ pass |
| Settings | music slider | mouse/keyboard input | changing the slider updates and stores the value | set 0.25 -> 0.25 (range 0..1) | ✅ pass |
| Settings | fx slider | mouse/keyboard input | changing the slider updates and stores the value | set 0.25 -> 0.25 (range 0..1) | ✅ pass |
| You | See yourself 👁 | mouse click | closes the menu and switches to third person | menu=false view=third | ✅ pass |
| You | Wearing/Wear (outfit) | mouse click | toggles the outfit piece or confirms it is on without error | label "Wearing" outfit unchanged <br><sub>no exception</sub> | ✅ pass |
| Property | See land for sale | mouse click | closes the menu and opens the land side panel | {"menu":false,"panel":true,"title":"Land for sale"} | ✅ pass |
| Side panel | Close (✕) | mouse click | closes the panel and restores input | {"panel":false,"en":true} | ✅ pass |
| Property | See businesses for sale | mouse click | opens the businesses side panel | {"panel":true,"title":"Businesses"} | ✅ pass |
| Side panel | Escape | keyboard | closes the side panel | panelOpen=false | ✅ pass |
| Mystery | tab content | visual | shows the case chapters and objective | The case of Aurelio ValdovinosPrologue: The Last Call→ Find Tía Cuca at her gaspachos cart on the Jardín.CluesNothing ye | ✅ pass |
| Journal | Track / Race buttons | mouse click | every Track toggles the tracked quest | no side quest is active yet, so no Track buttons exist at the start of a new game | ⛔ blocked |
| Menu | Title screen | mouse click | saves, returns to the title and shows Continue | {"started":false,"title":true,"cont":true} | ✅ pass |
| Title | Continue | mouse click | resumes the saved game with the same name and hour | name=Zoe hour=18.25 | ✅ pass |
| Title | Begin with a saved game | mouse click + dialog | asks to confirm; Cancel keeps the save, OK starts over | dismissed->started=false; accepted->name=Nuevo; dialogs=2 | ✅ pass |
| Console | JavaScript errors during the whole run | n/a | none | none | ✅ pass |

## Suite B: Dialogue, the new cerro quest, shops, barber, land, vehicles, jetpack, camera, stuck recovery, time skip

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Dialogue | start a conversation | game call (E near a person) | shows the dialogue box with the person, a greeting and numbered answer buttons; gameplay input pauses | name=Tía Cuca chips=7 lines=1 inputEnabled=false | ✅ pass |
| Dialogue | numbered answers 1-9 | keyboard Digit1 | pressing 1 picks the first answer and the conversation continues | lines 1 -> 3, talk=true, panel=undefined; first chip: 1Tía, sit down. Let me sell the gaspacho | ✅ pass |
| Dialogue | Escape / back | keyboard | Escape leaves the conversation and gives control back | talk=false shown=false inputEnabled=true | ✅ pass |
| Dialogue | Leave (✕) | mouse click | ends the conversation | talk=false shown=false | ✅ pass |
| Dialogue | Tab key inside the dialogue | keyboard | Tab moves focus between answers instead of opening the menu | focus "1Tía, what happened " -> "2He called me. He said he"; menuOpen=false | ✅ pass |
| Dialogue (Tía Cuca) | answer 1: Tía, what happened to my grandfather? | mouse click | does something sensible (a reply, a menu, a shop, or leaves) with no error | lines 1->3 talk=true panel=undefined card=false | ✅ pass |
| Dialogue (Tía Cuca) | answer 2: He called me. He said he found what Cuco hid | mouse click | does something sensible (a reply, a menu, a shop, or leaves) with no error | lines 1->3 talk=true panel=undefined card=false | ✅ pass |
| Dialogue (Tía Cuca) | answer 3: A gaspacho, Tía. ($40) | mouse click | does something sensible (a reply, a menu, a shop, or leaves) with no error | lines 1->2 talk=true panel=undefined card=false | ✅ pass |
| Dialogue (Tía Cuca) | answer 4: Ask about… | mouse click | does something sensible (a reply, a menu, a shop, or leaves) with no error | lines 1->1 talk=true panel=undefined card=false | ✅ pass |
| Dialogue (Tía Cuca) | answer 5: Say something… | mouse click | does something sensible (a reply, a menu, a shop, or leaves) with no error | lines 1->1 talk=true panel=undefined card=false | ✅ pass |
| Dialogue (Tía Cuca) | answer 6: Goodbye. | mouse click | does something sensible (a reply, a menu, a shop, or leaves) with no error | lines 1->1 talk=false panel=undefined card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 1: Tell me about yourself. | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 2: What's this part of town like? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 3: What do people say about the ayuntamiento? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 4: What do you think about the water vote? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 5: What do you know about my grandfather? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 6: Is there any work around here? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 7: What kinds of things do you like?They don't know | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->2 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Ask about… | 8: ← Back | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->1 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Say something… | 1: Pay them a compliment.♥ Compassionate | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Say something… | 2: Tell a joke.☺ Joke | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Say something… | 3: Give them a gift… | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->1 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Say something… | 4: Tell them a tall tale about yourself.◌ A lie | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Say something… | 5: Insult them.✖ Cruel | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (cuca) › Say something… | 6: ← Back | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->1 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Ask about… | 1: Tell me about yourself. | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Ask about… | 2: What's this part of town like? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Ask about… | 3: What do people say about the ayuntamiento? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Ask about… | 4: Is there any work around here? | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Ask about… | 5: What kinds of things do you like?They don't know | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->2 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Ask about… | 6: ← Back | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->1 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Say something… | 1: Pay them a compliment.♥ Compassionate | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Say something… | 2: Tell a joke.☺ Joke | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Say something… | 3: Give them a gift… | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->1 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Say something… | 4: Flirt a little.❀ Romantic | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Say something… | 5: Tell them a tall tale about yourself.◌ A lie | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Say something… | 6: Insult them.✖ Cruel | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->3 talk=true card=false | ✅ pass |
| Dialogue (franciscoSalazar) › Say something… | 7: ← Back | mouse click | responds with a reply, an explanation of why it is locked, or goes back, with no error | lines 1->1 talk=true card=false | ✅ pass |
| Francisco Salazar | is a different person from the ferretero | game data | two cast ids with different names (francisco = El Ferretero, franciscoSalazar = guitarist) | ["Francisco “El Ferretero”","Francisco Salazar"] | ✅ pass |
| Francisco Salazar | talk | game call | greets and offers answers | name=Francisco Salazar chips=3 | ✅ pass |
| Cecilia | offer is hidden before chapter 1 | game data | the milpa quest is not offered in the prologue | available at ch0 = null | ✅ pass |
| Cecilia | offer: Can I help with the milpa? | mouse click | offers the side quest and asks to accept | 1I'll help.♥ Compassionate \| 2Not now. | ✅ pass |
| Cecilia | I'll help. | mouse click | starts the quest "Elotes y una guitarra" with six elotes to cut | {"name":"Elotes y una guitarra","n":6} | ✅ pass |
| Quest Elotes y una guitarra | cut six elotes | keyboard E at each corn ear | each press cuts one; after six the next step (ask Francisco) begins | cut=0, step=1 | ✅ pass |
| Quest Elotes y una guitarra | ask Francisco to play | mouse click | the answer ends the quest, pays $250 and the player can leave | done=true money 2000 -> 2250 | ✅ pass |
| Muicle prop | Look at the muicle | keyboard E | shows a card naming it muicle / micle (Justicia spicigera) with no health claims | E🔍Look at the muicle \| Muicle Also called micle (Justicia spicigera). The sign by the hearth says so, with the La | ✅ pass |
| Shop: boutique | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=9 clicked=5 moneyChanged=4 closed=true | ✅ pass |
| Shop: sombreros | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=1 clicked=1 moneyChanged=0 closed=true | ✅ pass |
| Shop: casita | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=0 clicked=0 moneyChanged=0 closed=true | ✅ pass |
| Shop: mercado | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=2 clicked=2 moneyChanged=2 closed=true | ✅ pass |
| Shop: floreria | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=1 clicked=1 moneyChanged=1 closed=true | ✅ pass |
| Shop: cremeria | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=0 clicked=0 moneyChanged=0 closed=true | ✅ pass |
| Shop: peluqueria | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=0 clicked=0 moneyChanged=0 closed=true | ✅ pass |
| Shop: notaria | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=0 clicked=0 moneyChanged=0 closed=true | ✅ pass |
| Shop: ferreLuis | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=0 clicked=0 moneyChanged=0 closed=true | ✅ pass |
| Shop: ferreteria | open / buttons / close | game call + mouse clicks | opens a panel; every enabled Buy/Wear button changes money or clothing without error; ✕ closes it | opened=true buttons=0 clicked=0 moneyChanged=0 closed=true | ✅ pass |
| Barber | open, change look, pay and stand up | mouse clicks | each option changes the look; Pay closes the chair | controls=22 lookChanged=true paid+closed=true | ✅ pass |
| Land for sale | panel buttons | mouse clicks | lists lots; unaffordable purchases are refused clearly | buttons=10 Buy · $26,000[disabled] \| Show on map \| Buy · $18,000[disabled] \| Show on map \| toast: You need $120. You have $25. <br><sub>money 25</sub> | ✅ pass |
| Businesses for sale | panel buttons | mouse clicks | lists businesses with Buy buttons | buttons=5 Buy · $6,000[disabled] \| Buy · $15,000[disabled] \| Buy · $21,000[disabled] | ✅ pass |
| Vehicle | Get in the car | keyboard E | the nearest car is entered (driving state) | prompt "E🚗Get in the car" driving=true | ✅ pass |
| Vehicle | accelerate (W) and horn (H) | keyboard held | the car moves forward; horn does not error | moved 23.8 m | ✅ pass |
| Vehicle | steer (A/D) and handbrake (Space) | keyboard | steering changes heading; Space slows the car | heading changed -2.51 rad, speed after handbrake 0.0 | ✅ pass |
| Vehicle | Get out of the car | keyboard E (or F) | leaves the car and walking resumes | driving=false | ✅ pass |
| Camera | V and the 📷 touch button | keyboard | toggles first/third person | first -> third | ✅ pass |
| Jetpack | G, Space (up) and Z (down) | keyboard | G takes off, Space climbs, Z descends, G lands | jet on=true, y 105.0 -> 130.3 -> 111.6, landed=true | ✅ pass |
| Stuck recovery | I'm stuck button + U key | mouse click / keyboard | the floating button appears when the player is stuck and puts them back on a street; U does the same | button visible=true; button moved 70 m; hidden again=true; U moved 20 m | ✅ pass |
| Time skip | warpTo(7) from 22:00 (what sleeping does) | game call, sampled every frame | hour passes midnight once, ends on 7:00, input locked meanwhile and restored after, no frame turns the light more than 0.1 rad or changes night by more than 0.1 | {"frames":116,"maxSweep":0.05,"maxNight":0.027,"wraps":1,"lockedDuring":true,"arrive":{"h":7,"d":6,"en":true}} <br><sub>software-rendered WebGL (SwiftShader): frame count is low, so per-frame steps are larger than on a real GPU</sub> | ✅ pass |
| Console | JavaScript errors during the run | n/a | none | none | ✅ pass |

## Suite C: Touch (emulated phone, 390×844)

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Touch UI | touch controls visible on a phone | visual | the stick area and action buttons are shown (body.touch) | {"body":true,"btns":["interact","jump","sprint","jet","camera","case","map"]} | ✅ pass |
| Touch UI | jet-only and car-only buttons | visual | Fly down and Horn are hidden on foot | descend:hidden horn:hidden | ✅ pass |
| Touch button | interact | tap | fires the "interact" action | actions: interact,interact | ✅ pass |
| Touch button | jump | tap | fires the "jump" action | actions: jump | ✅ pass |
| Touch button | sprint | tap | fires the "sprint" action | actions: sprint | ✅ pass |
| Touch button | jet | tap | fires the "jet" action | actions: jet | ✅ pass |
| Touch button | camera | tap | fires the "camera" action | actions: camera | ✅ pass |
| Touch button | camera (📷) | tap | toggles first/third person | third -> first | ✅ pass |
| Touch button | case (Mystery) | tap | opens the Mystery tab; Back to the town closes it | {"m":true,"t":"case"} closed=true | ✅ pass |
| Touch button | map | tap | opens the Map tab | {"m":true,"t":"map"} | ✅ pass |
| Touch | floating stick (drag on the left) | touch drag | moves the player while the finger is down and stops when released | stick 0.00,1.00 moved 11.1 m; after release stick 0,0 drift 0.00 m | ✅ pass |
| Touch | look (drag on the right) | touch drag | turning the view by dragging | yaw 1.82 -> 2.36 | ✅ pass |
| Touch | stick + button at the same time | two fingers | holding the stick and tapping Jump both work | actions jump stick 0.00,0.91 | ✅ pass |
| Touch | pointer cancel (system gesture) | touchCancel | cancelling a drag stops movement | stick after cancel 0,0 | ✅ pass |
| Touch | app loses focus while moving | touch drag + blur | movement is released | stick after blur 0,0 | ✅ pass |
| Touch | drag while a menu is open | touch drag | does not start a stick or move the player under the menu | stick 0,0 moved 0.00 m | ✅ pass |
| Touch | menu button and tabs by tap | tap | the ☰ button opens the menu; tapping a tab switches to it | open=true tab=journal strip scrolled 140->365 closeOnScreen=true closedByTap=true | ✅ pass |
| Touch | dialogue answers by tap | tap | tapping an answer continues the conversation | lines 1 -> 3 | ✅ pass |
| Touch | tap targets are at least 40 px | layout | all touch buttons are big enough to hit | smallest [["btn-pause",46],["jet",46],["camera",46]] | ✅ pass |
| Console | JavaScript errors during the touch run | n/a | none | none | ✅ pass |

## Suite D: Gamepad (emulated controller)

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Gamepad | left stick | axes | moves the player; releasing the stick stops | moved 8.4 m, drift 0.00 m | ✅ pass |
| Gamepad | right stick | axes | turns the view | yaw 1.82 -> -2.12 | ✅ pass |
| Gamepad | button 0 | button press | fires "interact" once on press and releases on release | +interact -interact | ✅ pass |
| Gamepad | button 1 | button press | fires "block" once on press and releases on release | +block -block | ✅ pass |
| Gamepad | button 2 | button press | fires "attack" once on press and releases on release | +attack -attack | ✅ pass |
| Gamepad | button 3 | button press | fires "ability" once on press and releases on release | +ability -ability | ✅ pass |
| Gamepad | button 4 | button press | fires "cycle" once on press and releases on release | +cycle -cycle | ✅ pass |
| Gamepad | button 5 | button press | fires "attack" once on press and releases on release | +attack -attack | ✅ pass |
| Gamepad | button 6 | button press | fires "block" once on press and releases on release | +block -block | ✅ pass |
| Gamepad | button 7 | button press | fires "attack" once on press and releases on release | +attack -attack | ✅ pass |
| Gamepad | button 8 | button press | fires "map" once on press and releases on release | +map -map | ✅ pass |
| Gamepad | button 9 | button press | fires "menu" once on press and releases on release | +menu -menu | ✅ pass |
| Gamepad | button 10 | button press | fires "sprint" once on press and releases on release | +sprint -sprint | ✅ pass |
| Gamepad | button 11 | button press | fires "bike" once on press and releases on release | +bike -bike | ✅ pass |
| Gamepad | button 12 | button press | fires "heal" once on press and releases on release | +heal -heal | ✅ pass |
| Gamepad | button 13 | button press | fires "jet" once on press and releases on release | +jet -jet | ✅ pass |
| Gamepad | button 14 | button press | fires "weaponPrev" once on press and releases on release | +weaponPrev -weaponPrev | ✅ pass |
| Gamepad | button 15 | button press | fires "weaponNext" once on press and releases on release | +weaponNext -weaponNext | ✅ pass |
| Gamepad | Start (button 9) / Select (8) | button press | Start opens the menu; Select opens the map | [{"m":true,"t":"map"},{"m":true,"t":"map"}] | ✅ pass |
| Gamepad | several buttons, one action (2, 5, 7 = attack) | two buttons held | the action stays held until the last of them is released | held after releasing one: true; after releasing both: false | ✅ pass |
| Gamepad | disconnect while a button is held | device removed | held actions are released (no stuck sprint) | held true -> after disconnect false | ✅ pass |
| Gamepad | reconnect after disconnect | device added again | works again without reloading | +interact -interact +interact | ✅ pass |
| Gamepad: menu | D-pad / left stick | D-pad down, up and stick down | moves keyboard focus through the menu controls | Back to the town -> Light -> Back to the town -> (stick down) Light | ✅ pass |
| Gamepad: menu | A button | press | activates the focused control (a Settings option) | text size m -> l | ✅ pass |
| Gamepad: menu | LB / RB bumpers | press | switch to the previous / next menu tab | case -> journal -> case | ✅ pass |
| Gamepad: menu | B button and Start | press | B goes back (closes the menu); Start closes it too | menu open after B=false, after Start=false | ✅ pass |
| Gamepad: menu | held button when the menu opens | A held while pressing Start | the held A is ignored until released, and no gameplay action fires under the menu | actions while open: none; menu still open=true | ✅ pass |
| Gamepad: dialogue | D-pad + A, then B | press | choose an answer with the D-pad and A; B leaves the conversation | focus 1Tía, sit down. Let me sell th; log lines 1 -> 3; conversation open after B=false | ✅ pass |
| Gamepad: shop panel | D-pad + A, then B | press | move to a button, activate it; B closes the panel | focused "$320"; panel open after B=false | ✅ pass |
| Gamepad: minigame | D-pad + A / B | press | A presses the focused button; B leaves | focused "La Rana"; minigame open after B=false | ✅ pass |
| Console | JavaScript errors during the gamepad run | n/a | none | none | ✅ pass |

## Suite E: Land, builder, businesses, races, minigames

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Land for sale | Buy | mouse click | buys the lot: money drops by its price, the card shows Yours + Plan the house | owned=1 plan button=true money 5000000 -> 4974000 | ✅ pass |
| Land for sale | Show on the compass (📍) | mouse click | sets a compass marker on that lot | {"x":-37.66404860400894,"z":-596.0876848709131} | ✅ pass |
| Land for sale | Plan the house | mouse click | closes the card and opens the builder with a view of the lot | {"builder":true,"view":"build","title":"Your house"} | ✅ pass |
| Builder | Turn the view right ▶ | mouse click | rotates the build camera with no error | spin state null -> 3 <br><sub>no exception; camera effect is visual</sub> | ✅ pass |
| Builder | Turn the view left ◀ | mouse click | rotates the build camera with no error | spin state 3 -> -3 <br><sub>no exception; camera effect is visual</sub> | ✅ pass |
| Builder | Hold the view | mouse click | stops the rotation with no error | spin state -3 -> 0 <br><sub>no exception; camera effect is visual</sub> | ✅ pass |
| Builder | Style buttons | mouse click | every style changes the lot style and is marked on | colonial:true adobe:true piedra:true moderna:true nortena:true obra:true | ✅ pass |
| Builder | Colour swatches | mouse click | every swatch changes the wall colour | 2 swatches, applied: true,true | ✅ pass |
| Builder | Name over the door + Paint it | keyboard typing + click | the name is stored on the lot | name=Casa Luces | ✅ pass |
| Builder | Order a part | mouse click | ordering the first available part charges money and queues it | button "Hire · $1,375 · 3 h" queue=1 money 4974000 -> 4972625 | ✅ pass |
| Builder | Escape / ✕ | keyboard + click | closes the builder, leaves build view and gives control back | {"panel":false,"view":"first","en":true} | ✅ pass |
| Businesses | Buy / upgrade | mouse click | buying takes the price and the card shows the level; upgrading (if offered) costs more | owned=1 money 4972625 -> 4966625, upgrade charged=true | ✅ pass |
| Journal | Race buttons | mouse click | each race button closes the menu and starts the race (countdown, rings) | centro:true sahuayo:true morelia:true guadalajara:true torres:true cerro:true | ✅ pass |
| Minigame: loteria | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=17 clicked=8 Leave closes=true Escape closes=true | ✅ pass |
| Minigame: penales | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=7 clicked=7 Leave closes=true Escape closes=true | ✅ pass |
| Minigame: quiz | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=4 clicked=4 Leave closes=true Escape closes=true | ✅ pass |
| Minigame: albanil | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=1 clicked=1 Leave closes=true Escape closes=true | ✅ pass |
| Minigame: anil | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=1 clicked=1 Leave closes=true Escape closes=true | ✅ pass |
| Minigame: mesero | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=1 clicked=1 Leave closes=true Escape closes=true | ✅ pass |
| Minigame: serenata | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=4 clicked=1 Leave closes=true Escape closes=true | ✅ pass |
| Minigame: ferreteria | open, every button, Leave / Escape | game call + mouse clicks + keyboard | opens a dialog; its buttons respond without error; Leave and Escape both end it and restore input | buttons=4 clicked=4 Leave closes=true Escape closes=true | ✅ pass |
| Console | JavaScript errors during the property/minigame run | n/a | none | none | ✅ pass |

## Suite F: Save compatibility and corrupt saves

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Save compatibility | original build writes a save | game call | a save exists in localStorage | 918 bytes | ✅ pass |
| Save compatibility | Continue shows for an old save | visual | the Continue button is visible | hidden=false | ✅ pass |
| Save compatibility | Continue loads an old save | mouse click | same name, money, hour, chapter, clues, flags and position as when it was saved | {"name":"Veterana","money":4321,"hour":9.49,"ch":1,"clue":true,"flag":7,"met":["cuca"],"pos":[-164,-75],"posErr":0} | ✅ pass |
| Save compatibility | new characters and quest exist for an old save | game data | Francisco Salazar, Cecilia and the muicle spot exist; the Elotes quest is offered | {"fs":true,"ce":true,"mu":true,"avail":true,"state":null} | ✅ pass |
| Save compatibility | saving again keeps working | game call | the migrated save is written and readable | {"name":"Veterana","money":4321,"hasMilpa":false} | ✅ pass |
| Save compatibility | console errors while loading an old save | n/a | none | none | ✅ pass |
| Corrupt saves | corrupt JSON | page load, then Continue or Begin | the page loads; the game can still be started (no crash, no stuck title) | continue hidden; used Begin; errors:  | ✅ pass |
| Corrupt saves | empty object | page load, then Continue or Begin | the page loads; the game can still be started (no crash, no stuck title) | continue shown; used Continue; errors:  | ✅ pass |
| Corrupt saves | truncated: name only | page load, then Continue or Begin | the page loads; the game can still be started (no crash, no stuck title) | continue shown; used Continue; errors:  | ✅ pass |
| Corrupt saves | wrong type (array) | page load, then Continue or Begin | the page loads; the game can still be started (no crash, no stuck title) | continue shown; used Continue; errors:  | ✅ pass |
| Corrupt saves | null life | page load, then Continue or Begin | the page loads; the game can still be started (no crash, no stuck title) | continue shown; used Continue; errors:  | ✅ pass |

## Suite G: Service worker: install, offline, update path

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Service worker | first visit installs and caches the game | page load | a cache named anil-<version> holds the page, town data and valley artwork | {"keys":["anil-mv23r8jk"],"urls":["/","/index.html","/data/jiquilpan.json","/data/jiquilpan.bin","/manifest.webmanifest","/assets/jiquilpan-vista.jpg","/icons/icon-192.png","/icons/icon-512.png"]} | ✅ pass |
| Service worker | offline repeat visit | reload with the network off | the title screen loads from the cache, with its artwork | {"h1":"Las luces del Cerro","bg":true} | ✅ pass |
| Service worker | update path: new deploy replaces the old cache | reload twice after a rebuild | a new cache name appears, the old one is deleted, and the new worker controls the page | {"keys":["anil-mv24comi"],"active":true,"controlled":true} old=anil-mv23r8jk | ✅ pass |
| Service worker | a saved game survives the update | localStorage across deploys | the save written before the update is still there afterwards | name after update: Persist | ✅ pass |
| Service worker | console errors | n/a | none | none | ✅ pass |

## Suite H: Lifecycle: duplicate listeners, resize, title during a conversation, tab hidden

| Screen | Control | Input | Expected | Actual | Result |
|---|---|---|---|---|---|
| Lifecycle | one key press = one action after 4 title/continue cycles | keyboard V after returning to the title and continuing 3 times | the camera toggles exactly once per press (no duplicate listeners) | view first -> third; Input.press calls for one key press: 1 | ✅ pass |
| Lifecycle | one click on Save = one save and one toast after the same cycles | mouse click | a single click stores once and shows one confirmation | {"sets":1,"toasts":1} | ✅ pass |
| Lifecycle | returning to the title during a conversation | menu › Title screen with a dialogue open (via game call) | the conversation is closed, input restored after Continue, no dialogue box left on screen | {"talk":false,"dlg":false} inputEnabled=true | ✅ pass |
| Lifecycle | resize and rotate mid-game | viewport 800×450 → 390×844 → 844×390 | the canvas follows the window each time with no error | [[390,844,390,844],[844,390,844,390],[800,450,800,450]] | ✅ pass |
| Lifecycle | tab hidden and shown again | visibilitychange | the game saves when hidden and keeps running when shown | saved while hidden=true | ✅ pass |
| Console | JavaScript errors and failed requests during the lifecycle run | n/a | none | none (the only failed request was Google Fonts, blocked by this sandbox) | ✅ pass |

