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
void main(){
  vec3 d = normalize(vDir);
  float h = max(d.y, -0.2);
  vec3 col = mix(uSkyHorizon, uSkyTop, pow(clamp(h, 0., 1.), 0.55));
  float sd = max(dot(d, uSunDir), 0.);
  col += uSunColor * (pow(sd, 900.) * 6. + pow(sd, 18.) * .35 + pow(sd, 3.) * .12) * (1. - uNight * .9);
  // painted clouds: two layers of fbm on a flattened dome
  vec2 cp = d.xz / (d.y + .18) * 1.6 + vec2(uTime * .004, uTime * .0015);
  float c = smoothstep(.48, .78, fbm(cp * 1.4) * .75 + fbm(cp * 4.1) * .35);
  vec3 cloudLit = mix(uFogColor * .95, uSunColor * 1.15, pow(sd, 2.) * .8 + .2);
  col = mix(col, cloudLit, c * smoothstep(0.02, .25, d.y) * (1. - uNight * .6) * .85);
  // stars at night
  if (uNight > .01) { vec2 sp = floor(d.xz / (d.y + .3) * 220.); float s = step(.9975, hash12(sp)); col += vec3(s) * uNight * smoothstep(.05, .4, d.y); }
  // the marine layer sits on the horizon
  col = mix(col, uFogColor, smoothstep(.12, -.02, d.y) * .85);
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
const c1 = new THREE.Color(), c2 = new THREE.Color();
export function setTimeOfDay(hour, fogBank) {
  let a = KEYS[0], b = KEYS[1];
  for (let i = 0; i < KEYS.length - 1; i++) if (hour >= KEYS[i][0] && hour <= KEYS[i + 1][0]) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  const t = (hour - a[0]) / Math.max(0.001, b[0] - a[0]), s = t * t * (3 - 2 * t);
  const mix = (i, u) => u.value.copy(c1.setHex(a[i])).lerp(c2.setHex(b[i]), s);
  mix(1, U.uSunColor); mix(2, U.uSkyTop); mix(3, U.uSkyHorizon); mix(4, U.uFogColor); mix(5, U.uAmbient);
  U.uNight.value = a[6] + (b[6] - a[6]) * s;
  U.uGroundBounce.value.copy(U.uAmbient.value).multiplyScalar(0.55).lerp(new THREE.Color(0.35, 0.28, 0.2), 0.4);
  // the sun (or the moon, at night) arcs over the bay; azimuth swings from east to west
  const day = (hour - 6) / 12, el = Math.sin(Math.PI * day), az = Math.PI * (day - 0.5);
  const night = U.uNight.value;
  const sunEl = night > 0.6 ? 0.55 : Math.max(0.06, el * 0.95);
  const sunAz = night > 0.6 ? az + Math.PI : az;
  U.uSunDir.value.set(Math.sin(sunAz) * Math.cos(Math.asin(sunEl)), sunEl, -Math.cos(sunAz) * 0.6 * Math.cos(Math.asin(sunEl))).normalize();
  if (night > 0.6) U.uSunColor.value.multiplyScalar(0.55);
  U.uFogBank.value = fogBank;
  U.uFogDensity.value = 0.00008 + fogBank * 0.00026 + night * 0.00004;
}
