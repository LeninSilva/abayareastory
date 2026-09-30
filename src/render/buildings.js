// Jiquilpan's houses and shops, as instanced boxes with a procedural facade shader.
// Floors count from the street: shops, zaguanes, garages and cortinas meet the banqueta. Behind every window
// is a room drawn in depth. Styles: the whitewashed centro with a red guardapolvo and cantera trim; the painted
// barrio houses with iron window bars; obra negra (bare block and brick, still being built); shops with steel
// roll-up cortinas and painted signs; bodegas; schools.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';

export const BASE_DROP = 4;   // every box starts this far below its ground height, to seat it on a slope

const VERT = /* glsl */`
attribute vec4 aStyle;          // style id, seed (0..1), houses, floors
attribute vec4 aExtra;          // house index offset, height offset of this box within its building, building height, kind (0 building, 1 part)
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vSc; varying vec4 vStyle; varying vec4 vX; varying vec3 vT;
void main(){
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vec3 p = position; if (aExtra.w < .5) p.xz *= 1. - .01 * (.3 + aStyle.y);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.);
  vW = w.xyz; vL = position; vLN = normal; vSc = sc; vStyle = aStyle; vX = aExtra;
  mat3 m = mat3(modelMatrix * instanceMatrix);
  vN = normalize(m * (normal / sc));
  vT = normalize(m * (abs(normal.z) > .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.)));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = GLSL_COMMON + /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vSc; varying vec4 vStyle; varying vec4 vX; varying vec3 vT;
// wall colours: the painted town
vec3 paint(float r){
  vec3 c[12]; c[0]=vec3(.93,.62,.55); c[1]=vec3(.60,.80,.46); c[2]=vec3(.36,.72,.74); c[3]=vec3(.96,.80,.36); c[4]=vec3(.66,.52,.78);
  c[5]=vec3(.54,.72,.90); c[6]=vec3(.95,.60,.72); c[7]=vec3(.94,.92,.86); c[8]=vec3(.90,.52,.30); c[9]=vec3(.82,.30,.30); c[10]=vec3(.42,.62,.44); c[11]=vec3(.97,.94,.80);
  return c[int(r * 11.99)];
}
vec3 wallColor(float style, float r){
  if (style == 40.) return mix(vec3(.95,.93,.87), vec3(.93,.84,.62), step(.72, r));          // whitewash, some ochre
  if (style == 41. || style == 43.) return paint(r);
  if (style == 42.) return mix(vec3(.58,.57,.55), vec3(.66,.36,.26), step(.55, r));          // grey block or red brick
  if (style == 44.) return mix(vec3(.80,.76,.68), vec3(.66,.68,.66), r);
  return mix(vec3(.93,.88,.74), vec3(.90,.90,.86), r);                                        // schools
}
vec3 bandColor(float style, float r){
  if (style == 40.) return mix(vec3(.55,.16,.12), vec3(.36,.18,.12), step(.8, r));            // guardapolvo: oxblood, or dark umber
  if (style == 45.) return mix(vec3(.25,.42,.30), vec3(.60,.36,.16), step(.5, r));
  return paint(fract(r + .41)) * .8;
}
vec3 room(vec2 uv, vec2 size, vec3 V, vec3 T, vec3 N, float id, float lit, bool office, bool shop, float nearF){
  vec3 d = vec3(dot(V, T), V.y, -dot(V, N)); d.z = max(d.z, .02);
  vec3 p = vec3((uv.x - .5) * size.x, (uv.y - .5) * size.y, 0.);
  vec3 hw = vec3(size.x * .5 + .7, size.y * .5 + .45, office ? 5. : 3.6);
  float tx = ((d.x > 0. ? hw.x : -hw.x) - p.x) / (abs(d.x) < 1e-4 ? 1e-4 : d.x);
  float ty = ((d.y > 0. ? hw.y : -hw.y) - p.y) / (abs(d.y) < 1e-4 ? 1e-4 : d.y);
  float tz = hw.z / d.z;
  float t = min(min(tx, ty), tz);
  vec3 h = p + d * t;
  float r1 = hash12(vec2(id, 3.1)), r2 = hash12(vec2(id, 7.7));
  vec3 wall = office ? mix(vec3(.72,.72,.70), vec3(.62,.66,.70), r1) : mix(mix(vec3(.80,.74,.62), vec3(.62,.70,.66), r1), vec3(.78,.56,.50), step(.8, r2));
  vec3 c; float px = (r2 - .5) * size.x * .7;
  if (t == tz) {                                   // back wall: a picture, a shelf, a doorway
    c = wall * .85;
    c = mix(c, office ? vec3(.3,.32,.35) : mix(vec3(.25,.18,.14), vec3(.6,.3,.2), r1), step(abs(h.x - px), .35 + r1 * .25) * step(abs(h.y - .15), .28));
    c *= 1. - .5 * step(abs(h.x + px * .8), .45) * step(h.y, .6);    // a dark doorway
  } else if (t == ty) {
    c = d.y < 0. ? (office ? vec3(.32,.33,.36) : mix(vec3(.36,.24,.16), vec3(.52,.40,.28), r2)) * (.85 + .15 * step(.5, fract(h.x * 1.6))) : wall * 1.12;
    if (d.y < 0. && !office) c = mix(c, mix(vec3(.5,.2,.18), vec3(.25,.3,.45), r1), step(length(h.xz - vec2(px * .3, hw.z * .5)), 1.1) * .8);   // a rug
  } else c = wall * .72;
  // a shop: shelves of goods on the walls, a counter, a hanging lamp
  if (shop) {
    // shelves along the walls: a dark line every 45 cm, and blocks of goods in muted colours
    float sy = fract((h.y + hw.y) / .45), side = step(t, min(ty, tz) + 1e-3) + step(tz - 1e-3, t);
    float band = step(h.y, hw.y - .55) * step(-hw.y + .35, h.y) * min(side, 1.);
    vec2 cell = floor(vec2((h.x + h.z) / .5, (h.y + hw.y) / .45));
    vec3 gC = mix(vec3(.62,.36,.28), vec3(.34,.46,.56), hash12(cell + id)) * mix(.8, 1.1, hash12(cell.yx + id));
    c = mix(c, mix(c * .6, gC, .6), band * step(.35, hash12(cell * 1.7 + id)) * step(.18, sy) * nearF);
    c *= 1. - .35 * band * (1. - step(.08, sy)) * nearF;
    c = mix(c, vec3(.35,.24,.16), step(t, tz - 1e-3) * step(h.y, -hw.y + 1.) * step(1.2, h.z) * step(h.z, 2.2));   // the counter
  }
  // furniture silhouettes low on the side walls, and desks in offices
  if (office && !shop) c *= 1. - .45 * step(h.y, -hw.y + .75) * step(.8, h.z) * step(h.z, hw.z - .5);
  else c *= 1. - .35 * step(t, min(ty, tz) - .01) * step(h.y, -hw.y + .9) * step(1., h.z);
  c *= 1. - .45 * clamp(h.z / hw.z, 0., 1.);     // light falls off into the room
  // daylight from the window; a lamp at night
  vec3 day = (uAmbient * .55 + uSunColor * .12) * (1. - uNight);
  vec3 lamp = vec3(1., .74, .46) * lit * (1.2 + .6 * smoothstep(-hw.y, hw.y, h.y));
  if (office) lamp = vec3(.95,.92,.86) * lit * .75;
  return c * (day + lamp + .015);
}

vec3 day3(){ return (uAmbient * .5 + uSunColor * .15) * (1. - uNight) + .02; }
void main(){
  float style = floor(vStyle.x + .5);
  float seed = floor(vStyle.y * 255. + .5) / 255.;
  bool part = vX.w > .5;
  float houses = part ? 1. : max(1., min(vStyle.z, floor(vSc.x / 5.))), hOff = floor(vX.x + .5);
  vec3 ln = vLN, n = normalize(vN);
  float up = vL.y * vSc.y + vX.y, upS = up - ${BASE_DROP}.;
  float fullH = vX.z > 0. ? vX.z : vSc.y;
  vec3 V = normalize(vW - uCamPos); float dcam = length(vW - uCamPos);
  bool roof = ln.y > .5, front = abs(ln.z) > .5;
  float along = front ? (vL.x + .5) * vSc.x : (vL.z + .5) * vSc.z, faceW = front ? vSc.x : vSc.z;
  float hIdx = (front ? floor((vL.x + .5) * houses) : 0.) + hOff;
  float r = hash12(vec2(seed * 97.1 + hIdx * 13.7, style)), r2 = hash12(vec2(hIdx + seed * 51., style + 3.));
  vec3 base = wallColor(style, r);
  vec3 col;
  if (roof) {
    // azoteas: red or white waterproofing paint over concrete, tile in the centro, sheet metal on bodegas
    float rt = hash12(vec2(seed * 13.1 + hOff, style + 5.));
    vec3 rc = rt < .35 ? vec3(.62,.30,.20) : rt < .55 ? vec3(.82,.80,.76) : rt < .8 ? vec3(.56,.55,.52) : vec3(.40,.38,.36);
    vec2 lp = vec2((vL.x + .5) * vSc.x, (vL.z + .5) * vSc.z);
    if (style == 40. && r > .45) rc = vec3(.62,.30,.20) * (.85 + .25 * step(.5, fract(lp.x / .32))) * (.9 + .1 * step(.5, fract(lp.y / .45)));   // clay tile
    if (style == 44.) rc = vec3(.62,.64,.64) * (.85 + .2 * step(.5, fract(lp.x / .9)));   // lámina
    col = rc * (.88 + .2 * vnoise(vW.xz * .4)) * (.94 + .12 * vnoise(vW.xz * 6.));
    float edge = min(min(lp.x, vSc.x - lp.x), min(lp.y, vSc.z - lp.y));
    col = mix(base * .85, col, smoothstep(.15, .35, edge));                                   // pretil
    vec3 lit = lightItS(col, n, 1., shadowAt(vW, n));
    gl_FragColor = vec4(fogIt(lit, vW), 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  }
  if (upS < 0. && !part) {
    // where the street falls away: rough stone foundation
    col = mix(vec3(.46,.43,.40), vec3(.58,.54,.48), vnoise(vec2(along * 2., up * 3.)));
    col *= .75 + .25 * smoothstep(-3., 0., upS);
    gl_FragColor = vec4(fogIt(lightItS(col, n, .8, shadowAt(vW, n)), vW), 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  }
  float fh = style == 40. || style == 45. ? 3.4 : style == 44. ? 5. : 3.;
  float fl = floor(upS / fh), fy = fract(upS / fh);
  float houseW = faceW / (front ? houses : max(1., floor(faceW / 7.)));
  float hx = fract(along / houseW), hId = floor(along / houseW) + hOff;
  float graz = 1. - abs(dot(n, -V));
  float fine = 1. - smoothstep(10., 36., dcam * (1. + 4. * graz * graz));
  // windows: tall and narrow in the centro, wider in the barrios; fewer on the sides
  float cols = style == 40. ? max(1., floor(houseW / 3.4)) : style == 45. ? max(2., floor(houseW / 2.6)) : max(1., floor(houseW / 3.8));
  if (!front) cols = max(0., floor(houseW / 6.) - 1.);
  float cellW = houseW / max(cols, 1.), cx = fract(hx * max(cols, 1.));
  float wIn = style == 40. ? .3 : style == 45. ? .12 : .22, wBot = style == 40. ? .18 : .3, wTop = style == 40. ? .82 : .76;
  float win = step(wIn, cx) * step(cx, 1. - wIn) * step(wBot, fy) * step(fy, wTop) * step(.5, cols);
  float frame = step(wIn - .05, cx) * step(cx, 1. - wIn + .05) * step(wBot - .05, fy) * step(fy, wTop + .06) * (1. - win) * step(.5, cols);
  float detail = 1. - smoothstep(20., 60., dcam * (1. + 5. * graz * graz) / max(cellW, 1.));
  win *= detail; frame *= detail;
  bool ground = fl < 1. && !part;
  bool shop = ground && (style == 43. || (style == 40. && r2 > .45));
  vec2 wuv = vec2((cx - wIn) / (1. - 2. * wIn), (fy - wBot) / (wTop - wBot));
  vec2 wsize = vec2(cellW * (1. - 2. * wIn), fh * (wTop - wBot));
  // the wall itself
  col = base * (.92 + .16 * fbm(vW.xz * .1 + vW.y * .07));
  if (style == 42.) {
    // obra negra: block or brick coursing, concrete castillos (posts) and a trabe (beam) at each slab
    bool brick = r > .55; float ch = brick ? .075 : .2, cw = brick ? .24 : .4;
    float row = floor(upS / ch), bx = fract(along / cw + .5 * mod(row, 2.));
    float joint = max(step(.88, fract(upS / ch)), step(.94, bx));
    col *= mix(1., .85 + .3 * hash12(vec2(floor(along / cw + .5 * mod(row, 2.)), row)), fine);
    col = mix(col, vec3(.55,.54,.52), joint * fine * .8);
    float post = 1. - step(.25, min(mod(along, 3.2), 3.2 - mod(along, 3.2)));
    col = mix(col, vec3(.60,.60,.58), max(post, 1. - step(.25, fy) + step(.93, fy)) * .9);
  } else col *= 1. + (vnoise(vec2(along, upS) * 7.) - .5) * .08 * fine;   // plaster
  // stains below the roof drains and at the foot of the walls
  col *= 1. - .12 * smoothstep(.6, 1., vnoise(vec2(along * .7, 3.))) * smoothstep(1.5, 0., fullH - up);
  // the guardapolvo: a painted band at the foot of the wall (the centro's red, a darker shade in the barrios)
  float bandH = style == 40. ? 1.1 : style == 45. ? 1.2 : .9;
  if (style != 42. && style != 44. && (style == 40. || style == 45. || r2 > .45)) col = mix(col, bandColor(style, r2), step(upS, bandH) * (1. - step(upS, -.1)));
  // cantera: pinkish stone around doors and windows, pilasters and cornice in the centro
  vec3 cantera = vec3(.74,.62,.56);
  if (style == 40.) {
    col = mix(col, cantera, frame);
    float pil = 1. - step(.035, min(hx, 1. - hx));
    col = mix(col, cantera * .95, pil * (1. - win));
  } else col = mix(col, mix(vec3(.9,.88,.84), base * 1.15, .3), frame * .8);
  // the top: a moulded cornice in the centro, a plain pretil elsewhere
  float top = fullH - up;
  if (part) top = vSc.y * (1. - vL.y);
  col = mix(col, style == 40. ? cantera : base * .9, (1. - smoothstep(.2, .55, top)));
  col *= 1. - .22 * (smoothstep(.5, .6, top) - smoothstep(.6, .9, top)) * step(39.5, style) * step(style, 40.5);
  // painted signs over the shops (rotulado), in the colours of the soda companies and the pharmacies
  float sign = 0.;
  if (shop) {
    sign = step(.74, fy) * step(fy, .96) * step(.06, hx) * step(hx, .94);
    vec3 sc = paint(fract(r2 * 7.3));
    float gx = along / .22, gi = floor(gx), gf = fract(gx), ty = (fy - .8) / .12;
    float word = step(.2, hash12(vec2(floor(gi / 5.), hId * 3. + 1.))) * step(.15, fract(gi / 5.));
    float glyph = step(.2, gf) * step(gf, .8) * step(0., ty) * step(ty, 1.) * (1. - step(.4, gf) * step(gf, .6) * step(.3, ty) * step(ty, .7) * step(.45, hash12(vec2(gi, hId))));
    col = mix(col, mix(sc, vec3(.98,.96,.9) * step(.5, r2) + vec3(.12) * step(r2, .5), word * glyph * fine * step(.15, hx) * step(hx, .85)), sign);
  }
  float edgeD = min(along, faceW - along);
  float ao = mix(.65, 1., smoothstep(0., 2.5, upS + (part ? 3. : 0.))) * mix(.82, 1., smoothstep(0., 1., edgeD));
  float sh = shadowAt(vW, n);
  vec3 lit = lightItS(col, n, ao, sh);
  // windows: the room inside, glass reflecting the sky; lights come on after dark
  float litW = step(.62, hash12(vec2(floor(along / cellW) + seed * 31., fl + hIdx * 7.))) * smoothstep(.2, .7, uNight) * (.55 + .45 * hash12(vec2(fl, seed)));
  float roomId = floor(along / cellW) * 7.31 + fl * 13.7 + seed * 101.;
  vec3 R = reflect(V, n);
  vec3 refl = R.y > 0. ? mix(uSkyHorizon, uSkyTop, clamp(R.y * 1.6, 0., 1.)) : mix(uFogColor * .6, uGroundBounce, clamp(-R.y * 3., 0., 1.));
  refl *= 1. - uNight * .75;
  float F = .05 + .95 * pow(1. - clamp(dot(-V, n), 0., 1.), 5.);
  vec3 inside = room(wuv, wsize, V, vT, n, roomId, litW, style == 45., false, 1.);
  // cortinas (curtains) or wooden shutters half-open in the centro
  float cw = .15 + .2 * hash12(vec2(roomId, 1.));
  float cur = step(wuv.x, cw) + step(1. - cw, wuv.x);
  vec3 curC = mix(vec3(.9,.86,.78), paint(hash12(vec2(roomId, 5.))) * .8, step(.6, hash12(vec2(roomId, 6.)))) * (day3() + vec3(1., .75, .5) * litW);
  inside = mix(inside, curC, clamp(cur, 0., 1.) * step(style, 44.));
  vec3 wc = mix(inside, refl, F) + vec3(1., .8, .6) * pow(max(dot(R, uSunDir), 0.), 300.) * 3. * sh * (1. - uNight);
  // herrería: iron bars over the windows in the barrios, a little balcony rail upstairs in the centro
  float bars = 0.;
  if (style == 41. || style == 43. || (style == 40. && fl < 1.)) {
    bars = max(step(.82, fract(wuv.x * wsize.x / .13)), max(step(wuv.y, .03), step(.97, wuv.y)));
    bars = max(bars, step(abs(wuv.y - .5), .02));
  }
  if (style == 40. && fl >= 1.) bars = step(wuv.y, .32) * max(step(.8, fract(wuv.x * wsize.x / .11)), step(.28, wuv.y));
  wc = mix(wc, lightItS(vec3(.08,.08,.09), n, 1., sh), bars * fine * step(.5, win));
  if (style == 42. && r2 > .6) wc = mix(vec3(.06,.05,.05), refl * .2, .2);   // an opening still waiting for its window
  if (ground) {
    // the ground floor: zaguán doors, garages, cortinas
    float door = step(.62, hx) * step(hx, .82) * step(fy, style == 40. ? .8 : .72);
    float garage = step(.08, hx) * step(hx, .52) * step(fy, .74) * step(.35, r2);
    vec3 wood = mix(vec3(.30,.18,.10), vec3(.42,.26,.14), vnoise(vec2(along * 8., upS * .5)));
    vec3 steel = mix(vec3(.52,.54,.56), paint(fract(r2 * 3.)) * .8, step(.6, r2)) * (1. - .22 * step(.5, fract(upS / .09)) * fine);
    if (shop) {
      // the shop front: a cortina rolled up (open, the shop inside) or down (closed, ribbed steel)
      float openShop = step(.25, hash12(vec2(hId, 9.))) * (1. - smoothstep(.72, .8, uNight) * step(.5, hash12(vec2(hId, 4.))));
      float bay = step(.06, hx) * step(hx, .94) * step(fy, .72);
      vec2 suv = vec2((hx - .06) / .88, fy / .72);
      vec3 shopIn = room(suv, vec2(houseW * .88, fh * .72), V, vT, n, hId * 3.1 + seed, .45 + .5 * uNight, true, true, 1. - smoothstep(8., 26., dcam));
      vec3 closed = lightItS(steel, n, ao, sh);
      lit = mix(lit, mix(closed, shopIn, openShop), bay);
      lit = mix(lit, lit * .55, step(.72, fy) * step(fy, .74) * step(.06, hx) * step(hx, .94));   // the cortina's box
      lit += vec3(1., .85, .6) * sign * uNight * .3 * step(.5, r2);
    } else {
      if (style != 40.) lit = mix(lit, lightItS(steel, n, ao, sh), garage);
      lit = mix(lit, lightItS(style == 40. ? wood : mix(wood, steel * .6, step(.5, r)), n, ao * .8, sh) + vec3(1., .75, .45) * .35 * step(.66, fy) * uNight, door);
      if (style == 40.) lit = mix(lit, lightItS(cantera, n, ao, sh), step(.59, hx) * step(hx, .85) * step(fy, .86) * (1. - door));   // stone door frame
      win *= 1. - step(.08, hx) * step(hx, .85) * step(.35, r2) * step(style, 41.5);
      win *= 1. - door;
    }
  }
  lit = mix(lit, wc, win * (shop ? 0. : 1.));
  lit = mix(lit, mix(lit, mix(vec3(.08,.10,.12), vec3(1., .72, .42) * 1.1, litW), .35), (1. - detail) * step(.5, fl) * step(.5, cols));
  // separations between neighbouring houses
  lit *= 1. - .2 * (1. - smoothstep(.0, .01, min(hx, 1. - hx))) * step(1.5, houses);
  gl_FragColor = vec4(fogIt(lit, vW), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

let MAT = null;
export function buildingMaterial() { return MAT || (MAT = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG })); }
const GEO = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
/** items: [{x, y, z, w, h, d, ang, style, seed (0..1), houses, floors, hOff, yOff, fullH, kind}] → one InstancedMesh */
export function boxInstances(items) {
  const N = Math.max(1, items.length), mesh = new THREE.InstancedMesh(GEO.clone(), buildingMaterial(), N);
  mesh.count = items.length;
  const st = new Float32Array(N * 4), ex = new Float32Array(N * 4);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), s = new THREE.Vector3();
  let maxH = 0;
  items.forEach((b, i) => {
    q.setFromAxisAngle(yAxis, -b.ang); v.set(b.x, b.y, b.z); s.set(b.w, b.h, b.d);
    m4.compose(v, q, s); mesh.setMatrixAt(i, m4);
    st.set([b.style, b.seed, b.houses, b.floors || 1], i * 4);
    ex.set([b.hOff || 0, b.yOff || 0, b.fullH || 0, b.kind || 0], i * 4);
    maxH = Math.max(maxH, b.h);
  });
  mesh.geometry.setAttribute('aStyle', new THREE.InstancedBufferAttribute(st, 4));
  mesh.geometry.setAttribute('aExtra', new THREE.InstancedBufferAttribute(ex, 4));
  mesh.instanceMatrix.needsUpdate = true;
  if (items.length) mesh.computeBoundingSphere();
  mesh.userData.maxH = maxH;
  return mesh;
}

export function makeBuildings(city, quality) {
  const group = new THREE.Group();
  const CH = 400, buckets = new Map();
  const put = (x, z, item) => { const k = Math.floor((x + 12000) / CH) * 1000 + Math.floor((z + 12000) / CH); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(item); };
  for (const b of city.buildings) put(b.x, b.z, { x: b.x, y: b.y - BASE_DROP, z: b.z, w: b.w, d: b.d, h: b.h + BASE_DROP, ang: b.ang, style: b.styleId, seed: b.seed / 255, houses: b.houses, floors: b.floors });
  for (const items of buckets.values()) group.add(boxInstances(items));
  group.userData.update = cam => {
    const far = (quality === 'low' ? 1600 : quality === 'medium' ? 2600 : 4000) * (1 + Math.min(2, Math.max(0, cam.position.y - 120) / 250));
    for (const m of group.children) { const bs = m.boundingSphere; if (!bs) continue; m.visible = bs.center.distanceTo(cam.position) - bs.radius < far; }
  };
  return group;
}
