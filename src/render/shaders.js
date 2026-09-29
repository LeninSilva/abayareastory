// Shared uniforms and GLSL for the painterly look: warm key light, coloured ambient, height fog.
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
  uFogBank: { value: 0.35 }
};

export const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uSunDir, uSunColor, uSkyTop, uSkyHorizon, uAmbient, uGroundBounce, uFogColor, uCamPos;
uniform float uFogDensity, uFogHeight, uNight, uFogBank;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for(int i=0;i<4;i++){ s += a*vnoise(p); p *= 2.03; a *= .5; } return s; }
// soft wrapped lambert + hemispheric ambient: the storybook key/fill
vec3 lightIt(vec3 albedo, vec3 n, float ao){
  float ndl = dot(n, uSunDir);
  float wrap = clamp((ndl + 0.25) / 1.25, 0., 1.);
  vec3 key = uSunColor * wrap * (1. - uNight * 0.85);
  float up = n.y * .5 + .5;
  vec3 amb = mix(uGroundBounce, uAmbient, up);
  return albedo * (key * 1.05 + amb * ao);
}
// distance fog, thicker near the water (the marine layer), coloured by the sky toward the sun
vec3 fogIt(vec3 col, vec3 wpos){
  vec3 d = wpos - uCamPos; float dist = length(d);
  float hf = exp(-max(wpos.y, 0.) / uFogHeight);
  float f = 1. - exp(-pow(dist * uFogDensity * (1. + hf * (1.5 + uFogBank * 3.)), 1.35));
  float sunward = pow(max(dot(normalize(d), uSunDir), 0.), 6.);
  vec3 fc = mix(uFogColor, uSunColor * 1.05, sunward * .45 * (1. - uNight));
  return mix(col, fc, clamp(f, 0., 1.));
}
`;

/** A MeshStandardMaterial that also receives our height fog (for hand-modelled landmarks and props). */
export function landmarkMaterial(opts) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.82, metalness: 0.0 }, opts));
  m.onBeforeCompile = sh => {
    sh.uniforms.uCamPos = U.uCamPos; sh.uniforms.uFogColor = U.uFogColor; sh.uniforms.uFogDensity = U.uFogDensity;
    sh.uniforms.uFogHeight = U.uFogHeight; sh.uniforms.uSunDir = U.uSunDir; sh.uniforms.uSunColor = U.uSunColor; sh.uniforms.uNight = U.uNight; sh.uniforms.uFogBank = U.uFogBank;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#ifdef USE_INSTANCING\nvWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos; uniform vec3 uCamPos, uFogColor, uSunDir, uSunColor; uniform float uFogDensity, uFogHeight, uNight, uFogBank;
vec3 fogIt(vec3 col, vec3 wpos){ vec3 d = wpos - uCamPos; float dist = length(d); float hf = exp(-max(wpos.y, 0.) / uFogHeight);
 float f = 1. - exp(-pow(dist * uFogDensity * (1. + hf * (1.5 + uFogBank * 3.)), 1.35)); float sunward = pow(max(dot(normalize(d), uSunDir), 0.), 6.);
 vec3 fc = mix(uFogColor, uSunColor * 1.05, sunward * .45 * (1. - uNight)); return mix(col, fc, clamp(f, 0., 1.)); }`)
      .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = fogIt(gl_FragColor.rgb, vWPos);\n#include <tonemapping_fragment>')
      .replace('#include <fog_fragment>', '');
  };
  return m;
}
