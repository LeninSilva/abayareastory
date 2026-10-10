// The key light (sun by day, moon by night), the sky colours and the night factor must move continuously
// through dusk, blue hour, night, predawn and dawn, including across midnight. Before the sun/moon blend, the
// light direction flipped by almost 180 degrees in one frame when the night factor crossed 0.6.
import test from 'node:test';
import assert from 'node:assert/strict';
const { setTimeOfDay } = await import('../src/render/sky.js');
const { U } = await import('../src/render/shaders.js');

const snap = h => {
  setTimeOfDay(h, 0.2);
  return { dir: U.uSunDir.value.clone(), sun: U.uSunColor.value.clone(), top: U.uSkyTop.value.clone(), hor: U.uSkyHorizon.value.clone(), fog: U.uFogColor.value.clone(), amb: U.uAmbient.value.clone(), night: U.uNight.value, dens: U.uFogDensity.value };
};
const dc = (a, b) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

test('sun and moon direction, colours and night factor never jump (one-minute steps over 24 h, wrapping midnight)', () => {
  let prev = snap(0), worst = { ang: 0, col: 0, night: 0, at: 0 };
  for (let m = 1; m <= 24 * 60 + 5; m++) {
    const h = m / 60, cur = snap(h);
    const ang = Math.acos(Math.min(1, prev.dir.dot(cur.dir)));
    const col = Math.max(dc(prev.sun, cur.sun), dc(prev.top, cur.top), dc(prev.hor, cur.hor), dc(prev.fog, cur.fog), dc(prev.amb, cur.amb));
    const night = Math.abs(prev.night - cur.night);
    if (ang > worst.ang) worst.ang = ang; if (col > worst.col) worst.col = col; if (night > worst.night) worst.night = night;
    assert.ok(ang < 0.13, `light direction jumped ${ang.toFixed(3)} rad at ${h.toFixed(3)} h`);
    assert.ok(col < 0.03, `a sky or light colour jumped ${col.toFixed(3)} at ${h.toFixed(3)} h`);
    assert.ok(night < 0.02, `night factor jumped ${night.toFixed(3)} at ${h.toFixed(3)} h`);
    prev = cur;
  }
});

test('hours outside 0 to 24 wrap to the same sky', () => {
  for (const [a, b] of [[-0.5, 23.5], [24.25, 0.25], [48 + 19.9, 19.9], [-24 + 6.1, 6.1]]) {
    const x = snap(a), y = snap(b);
    assert.ok(x.dir.distanceTo(y.dir) < 1e-6 && Math.abs(x.night - y.night) < 1e-9 && dc(x.sun, y.sun) < 1e-9, `${a} and ${b}`);
  }
});

test('the key light stays above the horizon at every hour (so shadows and sun colour never flip off)', () => {
  for (let m = 0; m < 24 * 60; m += 5) assert.ok(snap(m / 60).dir.y > 0.04, `sun/moon below the horizon at ${m / 60} h`);
});
