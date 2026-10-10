// One input model for keyboard + mouse, touch and gamepad. Game code asks: move vector, look delta,
// held(action), pressed(action) (true once per press).
const PAD_OVERLAYS = '#menu:not([hidden]), #side:not([hidden]), #dialogue:not([hidden]), .screen.show, .mini';
const KEYMAP = {
  KeyE: 'interact', Enter: 'interact', KeyF: 'ability', KeyQ: 'cycle', Space: 'jump', ShiftLeft: 'sprint', ShiftRight: 'sprint',
  KeyB: 'bike', KeyM: 'map', Escape: 'menu', Tab: 'menu', KeyJ: 'case', KeyI: 'case', KeyC: 'case', KeyH: 'horn', KeyR: 'block', KeyX: 'attack',
  Digit1: 'weapon1', Digit2: 'weapon2', Digit3: 'weapon3', Digit4: 'weapon4', Digit5: 'weapon5', Digit6: 'weapon6', KeyV: 'camera', KeyP: 'people', KeyO: 'char', KeyG: 'jet', KeyZ: 'descend', ControlLeft: 'descend', ControlRight: 'descend'
};
const MOVEKEYS = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };

export class Input {
  constructor(canvas, touchLayer) {
    this.canvas = canvas; this.enabled = true;
    this.keys = new Set(); this.held_ = new Set(); this.pressQ = new Set();
    this.look = { dx: 0, dy: 0 }; this.touchMove = { x: 0, y: 0 }; this.padMove = { x: 0, y: 0 };
    this.sensitivity = 1; this.invertY = false; this.locked = false; this.touchMode = matchMedia('(pointer: coarse)').matches;
    this.onUnlock = null; this.lastPad = [];
    const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
    addEventListener('keydown', e => {
      if (typing(e) || (e.target?.tagName === 'BUTTON' && (e.code === 'Enter' || e.code === 'Space'))) return;
      // With a menu, panel, dialogue, card or the title open, Tab is for moving between controls: leave it to the browser.
      if (e.code === 'Tab' && document.querySelector('#menu:not([hidden]), #side:not([hidden]), #dialogue:not([hidden]), .screen.show, .mini')) return;
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code); const a = KEYMAP[e.code]; if (a) this.press(a);
    });
    addEventListener('keyup', e => { this.keys.delete(e.code); const a = KEYMAP[e.code]; if (a && ![...this.keys].some(k => KEYMAP[k] === a)) this.release(a); });
    addEventListener('blur', () => { this.releaseAll(); });
    // mouse: pointer lock where allowed; drag-to-look everywhere
    let dragging = false;
    canvas.addEventListener('mousedown', e => {
      if (!this.enabled) return;
      if (!this.locked && canvas.requestPointerLock && !this.touchMode) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
      if (e.button === 0) this.press('attack');
      if (e.button === 2) this.press('block');
      dragging = !this.locked;
    });
    addEventListener('mouseup', e => { if (e.button === 0) { this.release('attack'); dragging = false; } if (e.button === 2) this.release('block'); });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('mousemove', e => {
      if (!this.enabled) return;
      if (this.locked || dragging) { this.look.dx += e.movementX * 0.0022; this.look.dy += e.movementY * 0.0022; }
    });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked; this.locked = document.pointerLockElement === canvas;
      if (was && !this.locked && this.onUnlock) this.onUnlock();
    });
    // touch: left half is a floating stick, right half drags the view
    if (touchLayer) this._touch(touchLayer);
  }
  _touch(el) {
    const stick = { id: null, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 };
    const knob = document.getElementById('stick-knob'), base = document.getElementById('stick-base');
    el.addEventListener('pointerdown', e => {
      if (!this.enabled || e.pointerType === 'mouse') return;
      this.touchMode = true; document.body.classList.add('touch');
      el.setPointerCapture?.(e.pointerId);
      if (e.clientX < innerWidth * 0.45 && stick.id === null) {
        stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY;
        if (base) { base.style.display = 'block'; base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px'; }
      } else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
      e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId === stick.id) {
        let dx = (e.clientX - stick.ox) / 55, dy = (e.clientY - stick.oy) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
        this.touchMove.x = dx; this.touchMove.y = -dy;
        if (knob) knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
        this.held_[Math.hypot(dx, dy) > 0.97 ? 'add' : 'delete']('sprintTouch');
      } else if (e.pointerId === look.id) {
        this.look.dx += (e.clientX - look.x) * 0.0048; this.look.dy += (e.clientY - look.y) * 0.0048; look.x = e.clientX; look.y = e.clientY;
      }
    });
    const end = e => {
      if (e.pointerId === stick.id) { stick.id = null; this.touchMove.x = this.touchMove.y = 0; this.held_.delete('sprintTouch'); if (knob) knob.style.transform = ''; if (base) base.style.display = 'none'; }
      if (e.pointerId === look.id) look.id = null;
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
  }
  /** Wire an on-screen button: data-action on the element. Works with touch, mouse and pen. */
  bindButton(btn) {
    const a = btn.dataset.action;
    // One physical tap or key press can also arrive as a click; only a click with no recent pointer/key activation counts.
    let last = -1e9; const stamp = () => { last = performance.now(); };
    btn.addEventListener('pointerdown', e => { stamp(); e.preventDefault(); e.stopPropagation(); btn.setPointerCapture?.(e.pointerId); btn.classList.add('down'); this.press(a); });
    const up = e => { btn.classList.remove('down'); this.release(a); };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', e => e.preventDefault());
    // Assistive technology activates buttons with a click, without pointer events.
    btn.addEventListener('click', e => { if (e.detail === 0 && performance.now() - last > 800) { this.press(a); this.release(a); } });
    // keyboard users can focus and press on-screen buttons too
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); stamp(); this.press(a); setTimeout(() => this.release(a), 120); } });
  }
  press(a) { if (!this.held_.has(a)) this.pressQ.add(a); this.held_.add(a); }
  release(a) { this.held_.delete(a); }
  held(a) { return this.enabled && (this.held_.has(a) || (a === 'sprint' && this.held_.has('sprintTouch'))); }
  pressed(a) { if (this.pressQ.has(a)) { this.pressQ.delete(a); return this.enabled || a === 'menu' || a === 'map'; } return false; }
  /** peek without consuming */
  peek(a) { return this.pressQ.has(a); }
  endFrame() { this.pressQ.clear(); this.look.dx = this.look.dy = 0; }
  releaseAll() { this.held_.clear(); this.keys.clear(); this.pressQ.clear(); this.touchMove.x = this.touchMove.y = 0; this.padMove.x = this.padMove.y = 0; this.look.dx = this.look.dy = 0; }
  move() {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = 0, y = 0;
    for (const k of this.keys) { const m = MOVEKEYS[k]; if (m) { x += m[0]; y += m[1]; } }
    x += this.touchMove.x + this.padMove.x; y += this.touchMove.y + this.padMove.y;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }
  lookDelta() {
    const k = this.enabled ? this.sensitivity : 0;
    return { dx: this.look.dx * k, dy: this.look.dy * k * (this.invertY ? -1 : 1) };
  }
  pollGamepad(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && [...pads].find(q => q && q.connected);
    this.padMove.x = this.padMove.y = 0;
    if (!p) { for (const a of this.padHeld || []) this.release(a); this.padHeld = new Set(); this.lastPad = []; return; }
    // A menu, dialogue, shop panel, story card or minigame is open: the controller drives that instead of the world.
    const overlay = typeof document !== 'undefined' && document.querySelector ? document.querySelector(PAD_OVERLAYS) : null;
    if (overlay) { this.padNav(p, overlay, dt); this.padHold = new Set(p.buttons.map((b, i) => b && b.pressed ? i : -1).filter(i => i >= 0)); return; }
    this.navPrev = null;
    // buttons already down when the overlay closed (B, Start...) are not read by the world until they are released; new presses count at once
    if (this.padHold && this.padHold.size) for (const i of [...this.padHold]) if (!(p.buttons[i] && p.buttons[i].pressed)) this.padHold.delete(i);
    const dz = v => Math.abs(v) < 0.15 ? 0 : v;
    this.padMove.x = dz(p.axes[0]); this.padMove.y = -dz(p.axes[1]);
    this.look.dx += dz(p.axes[2] || 0) * dt * 2.6; this.look.dy += dz(p.axes[3] || 0) * dt * 2.2;
    const map = ['interact', 'block', 'attack', 'ability', 'cycle', 'attack', 'block', 'attack', 'map', 'menu', 'sprint', 'bike', 'heal', 'jet', 'weaponPrev', 'weaponNext'];
    // Several physical buttons map to one action. Aggregate before releasing it.
    const active = new Set();
    p.buttons.forEach((b, i) => { if (map[i] && b.pressed && !(this.padHold && this.padHold.has(i))) active.add(map[i]); });
    for (const a of active) if (!(this.padHeld || new Set()).has(a)) this.press(a);
    for (const a of this.padHeld || []) if (!active.has(a)) this.release(a);
    this.padHeld = active;
  }
  /** Controller navigation of overlays: D-pad or left stick move focus (left/right adjust a focused slider), A activates,
   *  B or Start goes back (Escape), the bumpers switch menu tabs. A button already held when the overlay opened is ignored until released. */
  padNav(p, overlay, dt) {
    for (const a of this.padHeld || []) this.release(a); this.padHeld = new Set(); this.padMove.x = this.padMove.y = 0;
    const b = i => !!(p.buttons[i] && p.buttons[i].pressed), ax = (p.axes && p.axes[0]) || 0, ay = (p.axes && p.axes[1]) || 0;
    const now = { up: b(12) || ay < -0.6, down: b(13) || ay > 0.6, left: b(14) || ax < -0.6, right: b(15) || ax > 0.6, a: b(0), back: b(1) || b(9), lb: b(4), rb: b(5) };
    if (!this.navPrev) { this.navPrev = now; this.navRep = 0.4; return; }
    const was = this.navPrev, edge = k => now[k] && !was[k]; this.navPrev = now;
    const dir = ['up', 'down', 'left', 'right'].find(k => now[k]); this.navRep = dir ? this.navRep - dt : 0.4;
    const step = k => edge(k) || (now[k] && this.navRep <= 0 && (this.navRep = 0.18, true));
    const items = [...overlay.querySelectorAll('button, a[href], input, select, textarea')].filter(e => !e.disabled && e.getAttribute('aria-disabled') !== 'true' && (!e.getClientRects || e.getClientRects().length > 0));
    const cur = document.activeElement, i = items.indexOf(cur), focus = e => { if (e) { e.focus && e.focus(); e.scrollIntoView && e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } };
    if (i < 0 && (dir || edge('a'))) { focus(items[0]); if (!edge('a')) return; }
    const slider = cur && cur.tagName === 'INPUT' && cur.type === 'range';
    if (slider && (step('left') || step('right'))) { const st = +cur.step || 1, d = (now.right ? 1 : -1) * st; cur.value = String(Math.min(+cur.max, Math.max(+cur.min, +cur.value + d))); cur.dispatchEvent(new Event('input', { bubbles: true })); cur.dispatchEvent(new Event('change', { bubbles: true })); return; }
    if (!slider || now.up || now.down) {
      if (step('down') || step('right')) focus(items[(i + 1) % items.length]); else if (step('up') || step('left')) focus(items[(i - 1 + items.length) % items.length]);
    }
    if (edge('a') && cur && overlay.contains(cur) && items.includes(cur)) cur.click();
    // Escape goes to the focused control if it is inside the overlay, otherwise to the overlay itself, so its own handler always sees it
    if (edge('back')) (cur && overlay.contains(cur) ? cur : overlay).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
    if ((edge('lb') || edge('rb')) && overlay.id === 'menu') {
      const tabs = [...document.querySelectorAll('#tabs button[data-tab]')].filter(t => !t.disabled), at = tabs.findIndex(t => t.classList.contains('on'));
      if (tabs.length) { const t = tabs[(at + (edge('rb') ? 1 : -1) + tabs.length) % tabs.length]; t.click(); focus(t); }
    }
  }
}
