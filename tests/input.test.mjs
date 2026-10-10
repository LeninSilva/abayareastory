import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/game/input.js';
const target=()=>({listeners:{},addEventListener(n,f){this.listeners[n]=f;}});
globalThis.addEventListener=()=>{};globalThis.matchMedia=()=>({matches:false});globalThis.document={...target(),getElementById:()=>null};
let pads=[];Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>pads},configurable:true});
function input(){return new Input(target(),null);}
test('disconnect releases gamepad buttons',()=>{const i=input();pads=[{connected:true,axes:[0,0,0,0],buttons:[{pressed:true}]}];i.pollGamepad(.016);assert(i.held('interact'));pads=[];i.pollGamepad(.016);assert(!i.held('interact'));});
test('shared gamepad actions remain held until all mapped buttons release',()=>{const i=input();const buttons=Array.from({length:8},()=>({pressed:false}));buttons[2].pressed=true;buttons[5].pressed=true;pads=[{connected:true,axes:[0,0,0,0],buttons}];i.pollGamepad(.016);buttons[2].pressed=false;i.pollGamepad(.016);assert(i.held('attack'));buttons[5].pressed=false;i.pollGamepad(.016);assert(!i.held('attack'));});
test('releaseAll clears queued presses, movement and look',()=>{const i=input();i.press('jump');i.look.dx=1;i.padMove.x=1;i.releaseAll();assert(!i.pressed('jump'));assert.deepEqual(i.move(),{x:0,y:0});assert.equal(i.look.dx,0);});
test('assistive click activates on-screen action',()=>{const i=input(),b=target();b.dataset={action:'jet'};i.bindButton(b);b.listeners.click({detail:0});assert(i.pressed('jet'));assert(!i.held('jet'));});
test('time palettes accept wrapped hours without invalid colours',async()=>{const {setTimeOfDay}=await import('../src/render/sky.js');const {U}=await import('../src/render/shaders.js');for(const hour of [-1,0,24,49]){setTimeOfDay(hour,.1);assert(Number.isFinite(U.uSunColor.value.r));assert(U.uNight.value>=0&&U.uNight.value<=1);}});
test('regional vista has lake, statue and day/night light switching',async()=>{const {makeRegionalVista}=await import('../src/render/vista.js');const {U}=await import('../src/render/shaders.js');const v=makeRegionalVista({heightAt:()=>50});assert(v.getObjectByName('Lago de Chapala'));assert(v.getObjectByName('Cristo Rey de Sahuayo'));U.uNight.value=0;v.userData.update();assert.equal(v.children.at(-1).visible,false);U.uNight.value=1;v.userData.update();assert.equal(v.children.at(-1).visible,true);});

test('Tab is left to the browser while a menu, panel, dialogue, card or the title is open', async () => {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><body><canvas id="view"></canvas><div id="touch-layer"></div><button id="stick-knob"></button><div id="stick-base"></div><section id="menu" hidden></section><section id="title" class="screen show"></section></body>', { pretendToBeVisual: true });
  const { window } = dom; global.window = window; global.document = window.document; global.addEventListener = window.addEventListener.bind(window); global.matchMedia = () => ({ matches: false }); global.innerWidth = 800;
  const { Input } = await import('../src/game/input.js');
  new Input(document.getElementById('view'), document.getElementById('touch-layer'));
  const press = () => { const e = new window.KeyboardEvent('keydown', { code: 'Tab', key: 'Tab', bubbles: true, cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; };
  assert.equal(press(), false, 'title open: Tab must reach the browser');
  document.getElementById('title').classList.remove('show');
  assert.equal(press(), true, 'nothing open: Tab opens the menu, not focus navigation');
  document.getElementById('menu').hidden = false;
  assert.equal(press(), false, 'menu open: Tab must reach the browser');
  document.getElementById('menu').hidden = true;
  const mini = document.createElement('section'); mini.className = 'mini'; document.body.appendChild(mini);
  assert.equal(press(), false, 'a minigame is open: Tab must reach the browser so Leave can be focused');
  mini.remove();
});

test('one tap or key press on an on-screen button fires its action once, even when a click follows', () => {
  const mk = () => { const i = input(), b = target(); b.dataset = { action: 'camera' }; b.classList = { add() {}, remove() {} }; i.__n = 0; const op = i.press.bind(i); i.press = a => { i.__n++; op(a); }; i.bindButton(b); return [i, b]; };
  const ev = { preventDefault() {}, stopPropagation() {}, pointerId: 1 };
  let [i, b] = mk(); b.listeners.pointerdown(ev); b.listeners.pointerup(ev); b.listeners.click({ detail: 0 });
  assert.equal(i.__n, 1, 'tap: pointer press plus the click that follows it');
  [i, b] = mk(); b.listeners.keydown({ key: 'Enter', preventDefault() {}, stopPropagation() {} }); b.listeners.click({ detail: 0 });
  assert.equal(i.__n, 1, 'keyboard Enter on the button plus its click');
  [i, b] = mk(); b.listeners.click({ detail: 0 });
  assert.equal(i.__n, 1, 'a screen reader click with no pointer event still activates it');
});

test('a controller can drive an open menu: D-pad moves focus, A activates, B goes back, bumpers switch tabs, sliders adjust, and a button held at open is ignored', async () => {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><body><section id="menu"><nav id="tabs"><button data-tab="map" class="on">Map</button><button data-tab="case">Case</button></nav><div id="panel"><button id="x1">One</button><input id="sl" type="range" min="0" max="1" step="0.1" value="0.5"></div></section></body>', { pretendToBeVisual: true });
  const w = dom.window; w.HTMLElement.prototype.getClientRects = function () { return [{}]; };
  Object.assign(globalThis, { document: w.document, KeyboardEvent: w.KeyboardEvent, Event: w.Event, addEventListener: () => {}, matchMedia: () => ({ matches: false }) });
  const i = new Input(target(), null), presses = []; const op = i.press.bind(i); i.press = a => { presses.push(a); op(a); };
  const pad = (btns = [], axes = [0, 0, 0, 0]) => { pads = [{ connected: true, axes, buttons: Array.from({ length: 16 }, (_, k) => ({ pressed: btns.includes(k) })) }]; i.pollGamepad(0.05); };
  const doc = w.document, $ = id => doc.getElementById(id), tabs = [...doc.querySelectorAll('#tabs button')];
  const clicks = { map: 0, case: 0, x1: 0 }; tabs.forEach(t => t.addEventListener('click', () => { clicks[t.dataset.tab]++; tabs.forEach(o => o.classList.toggle('on', o === t)); })); $('x1').addEventListener('click', () => clicks.x1++);
  let escapes = 0; doc.addEventListener('keydown', e => { if (e.key === 'Escape') escapes++; });
  pad([0]); pad([0]); assert.equal(clicks.x1 + clicks.map + clicks.case, 0, 'A held while the menu opened does nothing');
  pad([]); pad([13]); pad([]); assert.equal(doc.activeElement, tabs[0], 'first D-pad press focuses the first control');
  pad([13]); pad([]); assert.equal(doc.activeElement, tabs[1], 'D-pad down moves to the next control');
  pad([0]); pad([]); assert.equal(clicks.case, 1, 'A clicks the focused control');
  pad([12]); pad([]); assert.equal(doc.activeElement, tabs[0], 'D-pad up moves back');
  pad([5]); pad([]); assert.equal(clicks.map, 1, 'right bumper switches to the next tab (wrapping round from the last)');
  $('sl').focus(); pad([15]); pad([]); assert.equal(+$('sl').value, 0.6, 'D-pad right raises a focused slider');
  pad([1]); pad([]); assert.equal(escapes, 1, 'B sends Escape');
  doc.activeElement.blur(); pad([9]); pad([]); assert.equal(escapes, 2, 'Start sends Escape to the menu even when nothing inside it has focus');
  assert.deepEqual(presses, [], 'no gameplay action was fired while the menu was open');
  // Start closes an overlay; still holding it must not be read by the world as "open the menu" again
  $('menu').hidden = false; pad([]); pad([]); presses.length = 0;
  $('menu').addEventListener('keydown', e => { if (e.key === 'Escape') $('menu').hidden = true; });
  $('x1').focus(); pad([9]); assert.equal($('menu').hidden, true, 'Start closed the menu');
  pad([9]); pad([9]); assert.deepEqual(presses, [], 'Start is still held: the world must ignore it');
  pad([]); pad([0]); assert.deepEqual(presses, ['interact'], 'once everything is released the world responds again');
  // a fresh press right after an overlay closed (nothing was being held) works immediately
  presses.length = 0; pad([]); $('menu').hidden = false; pad([]); $('menu').hidden = true; pad([9]); assert.deepEqual(presses, ['menu'], 'a new Start press after a closed menu opens the menu again');
  pad([]);
  presses.length = 0; $('menu').hidden = true;
  // with nothing open the same buttons drive the game again
  doc.getElementById('menu').hidden = true; pad([]); pad([0]); assert.deepEqual(presses, ['interact'], 'A is the interact action in the world');
});
