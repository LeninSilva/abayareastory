// The sleep / time-skip lets the clock run on to the target hour. Simulate it frame by frame (the game caps dt at
// 0.05 s) and check the sky never jumps: the key light turns only a little per frame, the night factor changes
// gradually, midnight wraps once, and the skip ends exactly on the target.
import test from 'node:test';
import assert from 'node:assert/strict';
const { setTimeOfDay, skyChange } = await import('../src/render/sky.js');
const { U } = await import('../src/render/shaders.js');
const { warpStep } = await import('../src/game/warp.js');

function run(start, target, fps) {
  const dt = Math.min(0.05, 1 / fps); let hour = start, day = 1, frames = 0, secs = 0, worst = { sweep: 0, night: 0, col: 0 };
  setTimeOfDay(hour, 0.2); let prev = { dir: U.uSunDir.value.clone(), night: U.uNight.value, sun: U.uSunColor.value.clone() };
  for (;;) {
    const left = ((target - hour) % 24 + 24) % 24, step = warpStep(hour, left, dt); frames++; secs += 1 / fps;
    const arrive = step >= left; if (arrive) hour = target; else { hour += step; if (hour >= 24) { hour -= 24; day++; } }
    setTimeOfDay(hour, 0.2);
    const sweep = Math.acos(Math.min(1, prev.dir.dot(U.uSunDir.value))), night = Math.abs(prev.night - U.uNight.value), col = Math.max(Math.abs(prev.sun.r - U.uSunColor.value.r), Math.abs(prev.sun.g - U.uSunColor.value.g), Math.abs(prev.sun.b - U.uSunColor.value.b));
    worst = { sweep: Math.max(worst.sweep, sweep), night: Math.max(worst.night, night), col: Math.max(worst.col, col) };
    prev = { dir: U.uSunDir.value.clone(), night: U.uNight.value, sun: U.uSunColor.value.clone() };
    if (arrive) break; assert.ok(frames < 5000, 'warp must finish');
  }
  return { hour, day, frames, secs, worst };
}

for (const fps of [60, 30, 15]) test(`sleeping from 22:00 to 07:00 at ${fps} fps is continuous, wraps midnight once and lands on 7:00`, () => {
  const r = run(22, 7, fps);
  assert.equal(r.hour, 7); assert.equal(r.day, 2, 'exactly one midnight crossed');
  assert.ok(r.worst.sweep < 0.06, `key light turned ${r.worst.sweep.toFixed(3)} rad in one frame`);
  assert.ok(r.worst.night < 0.045, `night factor changed ${r.worst.night.toFixed(3)} in one frame`);
  assert.ok(r.worst.col < 0.045, `sun colour changed ${r.worst.col.toFixed(3)} in one frame`);
  assert.ok(r.secs < 9, `the skip took ${r.secs.toFixed(1)} s`);
});

test('a short evening skip (17:00 to 21:00) and a skip starting after midnight (2:00 to 7:00) also stay continuous', () => {
  for (const [a, b, d] of [[17, 21, 1], [2, 7, 1], [19.5, 21, 1]]) { const r = run(a, b, 60); assert.equal(r.hour, b); assert.equal(r.day, d); assert.ok(r.worst.sweep < 0.06 && r.worst.night < 0.045 && r.worst.col < 0.045, `${a}->${b}: ${JSON.stringify(r.worst)}`); }
});

test('skyChange is zero for equal hours and symmetric', () => { assert.ok(skyChange(12, 12) < 1e-6); assert.ok(Math.abs(skyChange(5, 6) - skyChange(6, 5)) < 1e-9); });
