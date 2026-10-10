import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {JSDOM} from 'jsdom';import {UI} from '../src/game/ui.js';
test('menu settings, notes, resume, save, rescue and quit buttons dispatch',()=>{
 const dom=new JSDOM(readFileSync('src/index.template.html','utf8'));globalThis.document=dom.window.document;globalThis.addEventListener=()=>{};
 const calls=[];const g={started:false,settings:{},pauseInput:x=>calls.push(['pause',x]),setSetting:(k,v)=>calls.push(['setting',k,v]),save:()=>calls.push(['save']),rescue:()=>calls.push(['rescue']),toTitle:()=>calls.push(['title'])};
 const ui=new UI(g);ui.toast=()=>{};ui.openMenu('settings');assert(ui.menuOpen);
 const settings=[...document.querySelectorAll('[data-do^="set:"]')];assert(settings.length>10);for(const b of settings)b.click();assert.equal(calls.filter(c=>c[0]==='setting').length,settings.length);
 document.querySelector('[data-tab="notes"]').click();assert.equal(ui.tab,'notes');document.querySelector('#menu-close').click();assert(!ui.menuOpen);
 g.started=true;ui.openMenu('settings');document.querySelector('#btn-save').click();document.querySelector('#btn-rescue').click();assert(!ui.menuOpen);ui.openMenu('settings');document.querySelector('#btn-quit').click();for(const c of ['save','rescue','title'])assert(calls.some(x=>x[0]===c));
});
test('dialogue choices invoke actions and card continue closes',()=>{const dom=new JSDOM(readFileSync('src/index.template.html','utf8'));globalThis.document=dom.window.document;globalThis.addEventListener=()=>{};const g={touchUI:()=>true,pauseInput:()=>{},audio:{ui:()=>{}},endTalk:()=>{}};const ui=new UI(g);let n=0;ui.chips([{label:'Talk',onClick:()=>n++},{label:'Leave',onClick:()=>n++}]);for(const b of document.querySelectorAll('#dlg-chips button'))b.click();assert.equal(n,2);ui.card(['First','Second']);document.querySelector('#card-next').click();document.querySelector('#card-next').click();assert(!ui.cardOpen);});
