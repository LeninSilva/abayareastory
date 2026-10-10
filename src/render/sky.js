// Painted sky dome with sun, drifting clouds and stars; and the time-of-day that drives all lighting.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';

export function makeSky() {
  const geo = new THREE.SphereGeometry(20000, 48, 24);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
varying vec3 vDir;
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
// cloud density at a point on the cloud deck
float cloudD(vec2 p){ vec2 w = vec2(uTime * .9, uTime * .35); float c = fbm(p * .00042 + w * .0004) * .7 + fbm(p * .0016 - w * .0007) * .35 + vnoise(p * .006) * .08; return smoothstep(.52, .82, c); }
void main(){
  vec3 d = normalize(vDir);
  float h = max(d.y, -0.2);
  // atmosphere: the zenith colour, a bright band at the horizon (more air to look through), Rayleigh-ish blue away from the sun
  float mu = dot(d, uSunDir), day = 1. - uNight;
  vec3 col = mix(uSkyHorizon, uSkyTop, pow(clamp(h, 0., 1.), 0.45));
  col = mix(col, uSkyHorizon * 1.15, exp(-max(h, 0.) * 9.) * .45);
  col *= 1. + .12 * (1. + mu * mu) * day;
  // the sun: a hard disc, a Mie halo, a wide glow
  float sd = max(mu, 0.);
  col += uSunColor * (smoothstep(.99985, .99995, sd) * 30. + pow(sd, 700.) * 4. + pow(sd, 22.) * .45 + pow(sd, 4.) * .14) * day;
  // clouds: a deck 2.5 km up, marched through its thickness, lit toward the sun, silver at the edges
  float cover = 0.;
  if (d.y > .015) {
    float t0 = (2500. - uCamPos.y) / d.y, dens = 0., light = 0.;
    for (int i = 0; i < 4; i++) {
      vec3 p = uCamPos + d * (t0 + float(i) * 120. / d.y);
      float c = cloudD(p.xz); if (c <= 0.) continue;
      float toward = cloudD(p.xz + uSunDir.xz / max(uSunDir.y, .15) * 220.);   // how much cloud lies between here and the sun
      light += c * (1. - dens) * exp(-toward * 2.2);
      dens += c * (1. - dens) * .55;
    }
    dens = clamp(dens * smoothstep(.015, .2, d.y), 0., 1.);
    float silver = pow(sd, 8.) * 2.;
    vec3 lit = mix(uFogColor * .85, uSunColor * (1.25 + silver), clamp(light / max(dens, .05) * .9, 0., 1.)) * day + uSkyTop * .25;
    vec3 shade = mix(uSkyTop * .55 + uFogColor * .35, uSkyHorizon * .7, .3);
    vec3 cc = mix(shade, lit, clamp(light * 1.6, 0., 1.));
    cc = mix(cc, uFogColor, clamp(t0 / 60000., 0., .85));      // far clouds melt into the haze
    col = mix(col, cc * (uNight > .5 ? .15 : 1.), dens * (1. - uNight * .7));
    cover = dens;
  }
  if (uNight > .01) {
    float clear = (1. - cover) * smoothstep(-.02, .25, d.y);
    // the Milky Way: a soft band across a tilted great circle, with dark dust lanes
    vec3 gp = normalize(vec3(.35, .62, -.7));
    float band = exp(-pow(dot(d, gp) * 5.5, 2.));
    float neb = fbm(d.xz / (abs(d.y) + .6) * 9. + d.y * 3.);
    float lanes = smoothstep(.35, .75, fbm(d.xz / (abs(d.y) + .6) * 22. + 7.));
    col += vec3(.55, .58, .78) * band * (.35 + neb * .9) * (1. - lanes * .55) * .14 * uNight * clear;
    // stars: a point in each cell of the sky, of every magnitude, warm and cool, twinkling more near the horizon
    vec3 sd3 = d * 210.; vec3 cell = floor(sd3);
    float hsh = h31(cell);
    vec3 pos = cell + .3 + .4 * vec3(h31(cell + 11.3), h31(cell + 27.1), h31(cell + 41.7));
    float mag = pow(hsh, 24.) * 4. + step(.993, hsh) * .22 + band * step(.96, hsh) * .18;
    float tw = .75 + .25 * sin(uTime * (4. + hsh * 6.) + hsh * 60.) * (1. - smoothstep(.1, .5, d.y) * .7);
    vec3 sc = mag * tw * smoothstep(.3, 0., length(sd3 - pos)) * mix(vec3(1., .82, .65), vec3(.75, .85, 1.), h31(cell + 5.5));
    col += sc * 1.6 * uNight * clear;
    // the moon, opposite where the sun went down
    float md = max(dot(d, uSunDir), 0.);
    col += vec3(.95, .93, .86) * (smoothstep(.99965, .9998, md) * 3. + pow(md, 300.) * .25) * uNight * (1. - cover * .7);
    // the glow of the town on low cloud and haze: orange over Jiquilpan, a little everywhere at the horizon
    vec2 toTown = -uCamPos.xz; float dt = length(toTown); vec2 tdir = toTown / max(dt, 1.);
    float facing = dt < 300. ? 1. : pow(max(dot(normalize(d.xz + 1e-4), tdir), 0.), 3.);
    float glow = exp(-max(d.y, 0.) * 11.) * (.25 + .75 * facing) * (1. / (1. + dt / 4000.));
    col += vec3(1., .55, .25) * glow * .22 * uNight * (1. + cover * 1.5);
  }
  col = mix(col, uFogColor, smoothstep(.1, -.03, d.y) * .8);
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -10;
  return m;
}

/* Time of day, in hours. Keyframed palettes so every hour has a deliberate colour script. */
const KEYS = [
  // hour, sunColor, skyTop, horizon, fog, ambient, night
  [0.0,  0x4a5a8a, 0x05070f, 0x1b2335, 0x1d2536, 0x2a3350, 1.0],
  [5.2,  0x6a6a9a, 0x0d1224, 0x2c3048, 0x333a52, 0x333a55, 0.85],
  [6.3,  0xffa36b, 0x3a4f80, 0xf2b08a, 0xd6a894, 0x6a6480, 0.25],
  [8.0,  0xffe0b0, 0x3f6db8, 0xe6cfb4, 0xc9c2bc, 0x7c8298, 0.0],
  [12.0, 0xfff1dc, 0x3a72c8, 0xc6d6e4, 0xbcc8d4, 0x8a92a4, 0.0],
  [16.5, 0xffd7a0, 0x3d69b0, 0xeec9a0, 0xd4bea8, 0x857f90, 0.0],
  [18.6, 0xff9a5a, 0x35477e, 0xf6a36e, 0xd99a7c, 0x6c5e78, 0.1],
  [19.6, 0xd5608a, 0x1d2550, 0x7b4a6e, 0x5a4a66, 0x4a4466, 0.55],
  [20.6, 0x4a5a8a, 0x080b18, 0x232a44, 0x262c40, 0x2c3452, 0.95],
  [24.0, 0x4a5a8a, 0x05070f, 0x1b2335, 0x1d2536, 0x2a3350, 1.0]
];
const c1 = new THREE.Color(), c2 = new THREE.Color(), dSun = new THREE.Vector3(), dMoon = new THREE.Vector3();
// rises in the east, sets in the west, passes a little to the south
const keyDir = (elev, az, out) => { const c = Math.cos(Math.asin(elev)); return out.set(-Math.sin(az) * c, elev, Math.cos(az) * 0.35 * c).normalize(); };
// the keyframe pair around an hour, with the smoothed fraction between them
function frame(hour) {
  let a = KEYS[0], b = KEYS[1];
  for (let i = 0; i < KEYS.length - 1; i++) if (hour >= KEYS[i][0] && hour <= KEYS[i + 1][0]) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  const t = (hour - a[0]) / Math.max(0.001, b[0] - a[0]);
  return { a, b, s: t * t * (3 - 2 * t) };
}
// The sun crosses from east to west; at night the key light is the moon. The two are blended by how dark it is
// (never switched), so dusk, blue hour, night, predawn and dawn move the light and its shadows continuously,
// including across midnight. Returns the blend weight (0 sun .. 1 moon).
function keyLight(hour, night, out) {
  const day = (hour - 6) / 12, el = Math.sin(Math.PI * day), az = Math.PI * (day - 0.5), w = Math.min(1, Math.max(0, (night - 0.2) / 0.7));
  keyDir(Math.max(0.06, el * 0.95), az, dSun); keyDir(0.55, az + Math.PI, dMoon);
  out.copy(dSun).lerp(dMoon, w).normalize(); return w;
}
/** The whole sky state for an hour as plain values (no uniforms touched): colours, night factor, key light direction. */
export function skySample(hour, o = {}) {
  hour = ((hour % 24) + 24) % 24;
  const { a, b, s } = frame(hour);
  const col = (i, k) => (o[k] || (o[k] = new THREE.Color())).copy(c1.setHex(a[i])).lerp(c2.setHex(b[i]), s);
  col(1, 'sun'); col(2, 'top'); col(3, 'hor'); col(4, 'fog'); col(5, 'amb');
  o.night = a[6] + (b[6] - a[6]) * s;
  o.w = keyLight(hour, o.night, o.dir || (o.dir = new THREE.Vector3()));
  o.sun.multiplyScalar(1 - 0.45 * o.w);
  return o;
}
const sA = {}, sB = {};
export const LIMITS = { sweep: 0.05, colour: 0.04, night: 0.04 };
/** How much the sky changes between two hours, as a multiple of what we allow in one frame (1 = at the limit):
 *  key light turn, the largest colour channel change, and the night factor. Used to pace the sleep/time-skip. */
export function skyChange(h0, h1) {
  skySample(h0, sA); skySample(h1, sB);
  let col = 0; for (const k of ['sun', 'top', 'hor', 'fog', 'amb']) col = Math.max(col, Math.abs(sA[k].r - sB[k].r), Math.abs(sA[k].g - sB[k].g), Math.abs(sA[k].b - sB[k].b));
  return Math.max(Math.acos(Math.min(1, sA.dir.dot(sB.dir))) / LIMITS.sweep, col / LIMITS.colour, Math.abs(sA.night - sB.night) / LIMITS.night);
}
export function setTimeOfDay(hour, fogBank) {
  const o = skySample(hour, sT);
  U.uSunColor.value.copy(o.sun); U.uSkyTop.value.copy(o.top); U.uSkyHorizon.value.copy(o.hor); U.uFogColor.value.copy(o.fog); U.uAmbient.value.copy(o.amb);
  U.uNight.value = o.night; U.uSunDir.value.copy(o.dir);
  U.uGroundBounce.value.copy(U.uAmbient.value).multiplyScalar(0.55).lerp(new THREE.Color(0.35, 0.28, 0.2), 0.4);
  U.uFogBank.value = fogBank;
  U.uFogDensity.value = 0.00008 + fogBank * 0.00026 + o.night * 0.00004;
}
const sT = {};
