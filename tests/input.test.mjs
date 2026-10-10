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
