// One input model for keyboard + mouse, touch and gamepad. Game code asks: move vector, look delta,
// held(action), pressed(action) (true once per press).
const KEYMAP = {
  KeyE: 'interact', Enter: 'interact', KeyF: 'ability', KeyQ: 'cycle', Space: 'jump', ShiftLeft: 'sprint', ShiftRight: 'sprint',
  KeyB: 'bike', KeyM: 'map', Escape: 'menu', Tab: 'menu', KeyJ: 'journal', KeyI: 'inventory', KeyC: 'character', KeyH: 'heal', KeyR: 'block', KeyX: 'attack',
  Digit1: 'weapon1', Digit2: 'weapon2', Digit3: 'weapon3', Digit4: 'weapon4', Digit5: 'weapon5', Digit6: 'weapon6', KeyV: 'camera'
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
      if (typing(e)) return;
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code); const a = KEYMAP[e.code]; if (a) this.press(a);
    });
    addEventListener('keyup', e => { this.keys.delete(e.code); const a = KEYMAP[e.code]; if (a) this.release(a); });
    addEventListener('blur', () => { this.keys.clear(); this.held_.clear(); this.touchMove.x = this.touchMove.y = 0; });
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
      if (e.pointerType === 'mouse') return;
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
    btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); btn.setPointerCapture?.(e.pointerId); btn.classList.add('down'); this.press(a); });
    const up = e => { btn.classList.remove('down'); this.release(a); };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', e => e.preventDefault());
    // keyboard users can focus and press on-screen buttons too
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); this.press(a); setTimeout(() => this.release(a), 120); } });
  }
  press(a) { if (!this.held_.has(a)) this.pressQ.add(a); this.held_.add(a); }
  release(a) { this.held_.delete(a); }
  held(a) { return this.enabled && (this.held_.has(a) || (a === 'sprint' && this.held_.has('sprintTouch'))); }
  pressed(a) { if (this.pressQ.has(a)) { this.pressQ.delete(a); return this.enabled || a === 'menu' || a === 'map'; } return false; }
  /** peek without consuming */
  peek(a) { return this.pressQ.has(a); }
  endFrame() { this.pressQ.clear(); this.look.dx = this.look.dy = 0; }
  releaseAll() { this.held_.clear(); this.keys.clear(); this.touchMove.x = this.touchMove.y = 0; }
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
    if (!p) return;
    const dz = v => Math.abs(v) < 0.15 ? 0 : v;
    this.padMove.x = dz(p.axes[0]); this.padMove.y = -dz(p.axes[1]);
    this.look.dx += dz(p.axes[2] || 0) * dt * 2.6; this.look.dy += dz(p.axes[3] || 0) * dt * 2.2;
    const map = ['interact', 'block', 'attack', 'ability', 'cycle', 'attack', 'block', 'attack', 'map', 'menu', 'sprint', 'bike', 'heal', 'bike', 'weaponPrev', 'weaponNext'];
    p.buttons.forEach((b, i) => {
      const a = map[i]; if (!a) return;
      const was = this.lastPad[i], now = b.pressed;
      if (now && !was) this.press(a); if (!now && was) this.release(a);
      this.lastPad[i] = now;
    });
  }
}
