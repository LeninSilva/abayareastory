// Shared uniforms and GLSL: physically based sun and sky light, two shadow cascades with soft Poisson filtering,
// GGX specular with sky reflections, procedural surface relief, and fog integrated through the air.
import * as THREE from 'three';

export const U = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0.4, 0.5, -0.3).normalize() },
  uSunColor: { value: new THREE.Color(1.0, 0.86, 0.66) },
  uSkyTop: { value: new THREE.Color(0.28, 0.42, 0.66) },
  uSkyHorizon: { value: new THREE.Color(0.95, 0.78, 0.6) },
  uAmbient: { value: new THREE.Color(0.42, 0.44, 0.52) },
  uGroundBounce: { value: new THREE.Color(0.3, 0.26, 0.2) },
  uFogColor: { value: new THREE.Color(0.8, 0.74, 0.68) },
  uFogDensity: { value: 0.00032 },
  uFogHeight: { value: 40.0 },
  uNight: { value: 0.0 },
  uCamPos: { value: new THREE.Vector3() },
  uFogBank: { value: 0.35 },
  // sun shadows: a sharp cascade close to you and a wide one out to the horizon
  uShadowMap: { value: null },
  uShadowMat: { value: new THREE.Matrix4() },
  uShadowOn: { value: 0 },
  uShadowTexel: { value: 1 / 2048 },
  uShadowBias: { value: 0.0003 },
  uShadowMap2: { value: null },
  uShadowMat2: { value: new THREE.Matrix4() },
  uShadowOn2: { value: 0 },
  uShadowTexel2: { value: 1 / 2048 },
  uShadowBias2: { value: 0.0003 },
  uDetail: { value: 1 }     // 0 on light quality: no relief, no specular
};

const SHADOW_GLSL = /* glsl */`
uniform sampler2D uShadowMap; uniform mat4 uShadowMat; uniform float uShadowOn, uShadowTexel, uShadowBias;
uniform sampler2D uShadowMap2; uniform mat4 uShadowMat2; uniform float uShadowOn2, uShadowTexel2, uShadowBias2;
// 12-tap Poisson disc, rotated per pixel so the filter becomes soft grain instead of banding
const vec2 PD[12] = vec2[12](vec2(-.326,-.406), vec2(-.840,-.074), vec2(-.696,.457), vec2(-.203,.621), vec2(.962,-.195), vec2(.473,-.480),
  vec2(.519,.767), vec2(.185,-.893), vec2(.507,.064), vec2(.896,.412), vec2(-.322,-.933), vec2(-.792,-.598));
float cascade(sampler2D map, mat4 m, float texel, float bias, vec3 w, float spread, int taps, out float inside){
  vec4 p = m * vec4(w, 1.); vec3 c = p.xyz / p.w * .5 + .5;
  vec2 e = abs(c.xy - .5) * 2.; inside = 1. - smoothstep(.82, .97, max(e.x, e.y));
  if (c.x <= 0. || c.x >= 1. || c.y <= 0. || c.y >= 1. || c.z >= 1.) { inside = 0.; return 1.; }
  float a = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) * 6.2832, cs = cos(a), sn = sin(a);
  float s = 0.;
  for (int i = 0; i < 12; i++) { if (i >= taps) break; vec2 o = PD[i]; o = vec2(o.x * cs - o.y * sn, o.x * sn + o.y * cs) * texel * spread; s += step(c.z - bias, texture2D(map, c.xy + o).r); }
  return s / float(taps);
}
float shadowRaw(vec3 w, float bias0){
  float in1 = 0., in2 = 0., s1 = 1., s2 = 1.;
  if (uShadowOn > .5) s1 = cascade(uShadowMap, uShadowMat, uShadowTexel, uShadowBias * bias0, w, 2.2, 12, in1);
  if (uShadowOn2 > .5 && in1 < .999) s2 = cascade(uShadowMap2, uShadowMat2, uShadowTexel2, uShadowBias2 * bias0, w, 1.6, 6, in2);
  float far = mix(1., s2, in2);
  return mix(far, s1, in1);
}`;

export const GLSL_COMMON = /* glsl */`
uniform float uTime, uDetail;
uniform vec3 uSunDir, uSunColor, uSkyTop, uSkyHorizon, uAmbient, uGroundBounce, uFogColor, uCamPos;
uniform float uFogDensity, uFogHeight, uNight, uFogBank;
${SHADOW_GLSL}
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for(int i=0;i<4;i++){ s += a*vnoise(p); p *= 2.03; a *= .5; } return s; }
// sun shadow: normal-offset against acne, sharp cascade near, wide cascade far
float shadowAt(vec3 w, vec3 n){
  if (uShadowOn < .5 && uShadowOn2 < .5) return 1.;
  float ndl = clamp(dot(n, uSunDir), 0., 1.);
  if (dot(n, uSunDir) < -.2) return 0.;
  return shadowRaw(w + n * (.3 + .9 * (1. - ndl)), 1. + 3. * (1. - ndl));
}
// procedural relief: tilt the normal by the gradient of a noise field (only close to the camera)
vec3 bump(vec3 n, vec3 w, float freq, float amp){
  if (uDetail < .5 || amp <= 0.) return n;
  float fade = 1. - smoothstep(15., 60., length(w - uCamPos)); if (fade <= 0.) return n;
  vec3 t = normalize(abs(n.y) > .9 ? cross(n, vec3(1., 0., 0.)) : cross(n, vec3(0., 1., 0.))), b = cross(n, t);
  vec2 q = vec2(dot(w, t), dot(w, b)) * freq; float e = .35;
  float h0 = fbm(q), hx = fbm(q + vec2(e, 0.)), hy = fbm(q + vec2(0., e));
  return normalize(n - (t * (hx - h0) + b * (hy - h0)) / e * amp * fade);
}
// the sky, as seen in a reflection: horizon to zenith, the sun's glow, the ground below
vec3 skyRefl(vec3 r){
  vec3 c = r.y > 0. ? mix(uSkyHorizon, uSkyTop, pow(clamp(r.y, 0., 1.), .5)) : mix(uSkyHorizon * .6, uGroundBounce, clamp(-r.y * 4., 0., 1.));
  c += uSunColor * pow(max(dot(r, uSunDir), 0.), 64.) * 1.5 * (1. - uNight);
  return c * (1. - uNight * .8);
}
// GGX specular from the sun plus a fresnel reflection of the sky, for a surface of the given roughness
vec3 specIt(vec3 n, vec3 w, float rough, float sh, float f0){
  if (uDetail < .5) return vec3(0.);
  vec3 V = normalize(uCamPos - w), H = normalize(V + uSunDir);
  float ndl = max(dot(n, uSunDir), 0.), ndv = max(dot(n, V), 1e-3), ndh = max(dot(n, H), 0.), a = rough * rough, a2 = a * a;
  float d = ndh * ndh * (a2 - 1.) + 1., D = a2 / (3.14159 * d * d);
  float k = (rough + 1.) * (rough + 1.) / 8., G = ndv / (ndv * (1. - k) + k) * ndl / (ndl * (1. - k) + k);
  float F = f0 + (1. - f0) * pow(1. - max(dot(H, V), 0.), 5.);
  vec3 sun = uSunColor * D * G * F / max(4. * ndv * ndl, 1e-3) * ndl * sh * (1. - uNight * .9);
  float Fe = f0 + (1. - f0) * pow(1. - ndv, 5.) * (1. - rough);
  return min(sun, vec3(8.)) + skyRefl(reflect(-V, n)) * Fe * (1. - rough * .8) * .6;
}
// soft wrapped lambert + hemispheric ambient: the key/fill; sh = sun visibility
vec3 lightItS(vec3 albedo, vec3 n, float ao, float sh){
  float ndl = dot(n, uSunDir);
  float wrap = clamp((ndl + 0.15) / 1.15, 0., 1.);
  vec3 key = uSunColor * wrap * (1. - uNight * 0.85) * mix(.12, 1., sh);
  float up = n.y * .5 + .5;
  vec3 amb = mix(uGroundBounce, uAmbient, up);
  amb += uSkyTop * .1 * (1. - sh) * (1. - uNight);
  return albedo * (key * 1.1 + amb * ao);
}
vec3 lightIt(vec3 albedo, vec3 n, float ao){ return lightItS(albedo, n, ao, 1.); }
// the fog is integrated along the ray through two layers: a low haze over the valley, and a thinner one that thins
// with height; so from the air the town below is clear and the far mountains fade blue
float layerAvg(float y0, float y1, float H){ y0 = max(y0, 0.); y1 = max(y1, 0.); float dy = y1 - y0;
  return abs(dy) < 1. ? exp(-y0 / H) : H * (exp(-y0 / H) - exp(-y1 / H)) / dy; }
vec3 fogIt(vec3 col, vec3 wpos){
  vec3 d = wpos - uCamPos; float dist = length(d);
  float haze = layerAvg(uCamPos.y, wpos.y, 700.), marine = layerAvg(uCamPos.y, wpos.y, uFogHeight);
  float f = 1. - exp(-pow(dist * uFogDensity * (haze + marine * (1.5 + uFogBank * 3.)), 1.35));
  float sunward = pow(max(dot(normalize(d), uSunDir), 0.), 6.);
  vec3 fc = mix(uFogColor, uSunColor * 1.05, sunward * .55 * (1. - uNight));
  // aerial perspective: distance tints toward the sky's blue before it greys out
  col = mix(col, col * .7 + uSkyTop * .35, clamp(dist / 9000., 0., .5) * (1. - uNight));
  return mix(col, fc, clamp(f, 0., 1.));
}
`;

/** A MeshStandardMaterial that also receives our fog and both shadow cascades (landmarks, props, cars, people). */
export function landmarkMaterial(opts) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.82, metalness: 0.0 }, opts));
  m.onBeforeCompile = sh => {
    for (const k of ['uCamPos', 'uFogColor', 'uFogDensity', 'uFogHeight', 'uSunDir', 'uSunColor', 'uNight', 'uFogBank', 'uSkyTop', 'uShadowMap', 'uShadowMat', 'uShadowOn', 'uShadowTexel', 'uShadowBias', 'uShadowMap2', 'uShadowMat2', 'uShadowOn2', 'uShadowTexel2', 'uShadowBias2']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#ifdef USE_INSTANCING\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos; uniform vec3 uCamPos, uFogColor, uSunDir, uSunColor, uSkyTop; uniform float uFogDensity, uFogHeight, uNight, uFogBank;
float layerAvg(float y0, float y1, float H){ y0 = max(y0, 0.); y1 = max(y1, 0.); float dy = y1 - y0; return abs(dy) < 1. ? exp(-y0 / H) : H * (exp(-y0 / H) - exp(-y1 / H)) / dy; }
vec3 fogIt(vec3 col, vec3 wpos){ vec3 d = wpos - uCamPos; float dist = length(d);
 float f = 1. - exp(-pow(dist * uFogDensity * (layerAvg(uCamPos.y, wpos.y, 700.) + layerAvg(uCamPos.y, wpos.y, uFogHeight) * (1.5 + uFogBank * 3.)), 1.35));
 float sunward = pow(max(dot(normalize(d), uSunDir), 0.), 6.);
 col = mix(col, col * .7 + uSkyTop * .35, clamp(dist / 9000., 0., .5) * (1. - uNight));
 vec3 fc = mix(uFogColor, uSunColor * 1.05, sunward * .55 * (1. - uNight)); return mix(col, fc, clamp(f, 0., 1.)); }
${SHADOW_GLSL}`)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ float shS = shadowRaw(vWPos, 2.5); reflectedLight.directDiffuse *= mix(.12, 1., shS); reflectedLight.directSpecular *= shS; }')
      .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = fogIt(gl_FragColor.rgb, vWPos);\n#include <tonemapping_fragment>')
      .replace('#include <fog_fragment>', '');
  };
  return m;
}
