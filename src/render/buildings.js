// Instanced buildings with a procedural facade shader styled per district.
// Floors are counted from the street, so shops, doors and garages meet the sidewalk; every window has a room
// behind it (interior mapping: a box drawn in the shader, with walls, floor, ceiling, curtains and lamps);
// walls carry clapboard, brick, stucco or cut stone up close; glass reflects the sky with a proper fresnel.
import * as THREE from 'three';
import { U, GLSL_COMMON } from './shaders.js';
import { STYLES, TOWERS } from '../geo.js';

const TOWER_ID = 30, STONE_TOWER_ID = 31;
export const BASE_DROP = 4;   // every box starts this far below its ground height, to seat it on a slope

const VERT = /* glsl */`
attribute vec4 aStyle;          // style id, seed (0..1), houses, unused
attribute vec4 aExtra;          // house index offset, height offset of this box within its building, building height, kind (0 building, 1 bay)
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vSc; varying vec4 vStyle; varying vec4 vX; varying vec3 vT;
void main(){
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  // neighbours whose walls coincide would z-fight: inset each building by a few centimetres to decimetres
  vec3 p = position; if (aExtra.w < .5) p.xz *= 1. - .012 * (.3 + aStyle.y);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.);
  vW = w.xyz; vL = position; vLN = normal; vSc = sc; vStyle = aStyle; vX = aExtra;
  mat3 m = mat3(modelMatrix * instanceMatrix);
  vN = normalize(m * (normal / sc));
  vT = normalize(m * (abs(normal.z) > .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.)));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = GLSL_COMMON + /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vSc; varying vec4 vStyle; varying vec4 vX; varying vec3 vT;
vec3 pal(float style, float r){
  // palettes per district (hand-picked from the streets themselves)
  if (style == 1. || style == 2.) { // Victorians and Edwardians: painted
    vec3 c[8]; c[0]=vec3(.78,.62,.70); c[1]=vec3(.55,.70,.76); c[2]=vec3(.88,.80,.55); c[3]=vec3(.60,.72,.55); c[4]=vec3(.85,.66,.52); c[5]=vec3(.64,.60,.80); c[6]=vec3(.90,.86,.78); c[7]=vec3(.42,.52,.66);
    return c[int(r * 7.99)];
  }
  if (style == 5. || style == 3. || style == 6. || style == 7.) { // stucco: the Sunset, the Marina, the Excelsior
    vec3 c[6]; c[0]=vec3(.92,.88,.80); c[1]=vec3(.88,.80,.74); c[2]=vec3(.78,.84,.84); c[3]=vec3(.90,.84,.68); c[4]=vec3(.83,.78,.86); c[5]=vec3(.80,.86,.76);
    return c[int(r * 5.99)];
  }
  if (style == 10.) return mix(vec3(.62,.30,.24), vec3(.86,.80,.68), step(.55, r));          // Chinatown brick and cream
  if (style == 11.) { vec3 c[5]; c[0]=vec3(.86,.45,.35); c[1]=vec3(.95,.78,.45); c[2]=vec3(.45,.62,.72); c[3]=vec3(.88,.86,.78); c[4]=vec3(.60,.72,.50); return c[int(r*4.99)]; } // the Mission
  if (style == 12. || style == 15.) return mix(mix(vec3(.55,.30,.24), vec3(.68,.64,.58), step(.5, r)), vec3(.44,.52,.56), step(.8, r)); // warehouses
  if (style == 4.) return mix(vec3(.93,.90,.84), vec3(.84,.80,.72), r);                        // mansions
  if (style == 17.) return vec3(.94,.92,.88);                                                   // Presidio barracks
  if (style == 16.) return mix(vec3(.90,.86,.76), vec3(.80,.76,.66), r);
  if (style == ${TOWER_ID}.) return mix(vec3(.46,.56,.64), vec3(.36,.46,.56), r);             // glass
  return mix(mix(vec3(.80,.76,.68), vec3(.66,.64,.62), r), vec3(.74,.70,.62), step(.7, r));    // stone downtown
}
// the room behind a window: a box 3.6 m deep, drawn by tracing the view ray inside it
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
void main(){
  float style = floor(vStyle.x + .5);
  // varyings wobble by a few ulps across a triangle; a hash would turn that into speckle, so snap the seed to its byte
  float seed = floor(vStyle.y * 255. + .5) / 255.;
  bool bay = vX.w > .5;
  float houses = bay ? 1. : max(1., min(vStyle.z, floor(vSc.x / 5.5)));   // no house narrower than a San Francisco lot
  float hOff = floor(vX.x + .5);
  vec3 ln = vLN; vec3 n = normalize(vN);
  float up = vL.y * vSc.y + vX.y;
  float upS = up - ${BASE_DROP}.;                  // metres above the street
  float fullH = vX.z > 0. ? vX.z : vSc.y;
  vec3 V = normalize(vW - uCamPos); float dcam = length(vW - uCamPos);
  vec3 col;
  bool roof = ln.y > .5;
  bool front = abs(ln.z) > .5;                     // faces toward and away from the street
  float along = front ? (vL.x + .5) * vSc.x : (vL.z + .5) * vSc.z;
  float faceW = front ? vSc.x : vSc.z;
  float hIdx = (front ? floor((vL.x + .5) * houses) : 0.) + hOff;
  float r = hash12(vec2(seed * 97.1 + hIdx * 13.7, style));
  vec3 base = pal(style, r);
  if (roof) {
    // tar and gravel, flashing at the parapet, vents; tile on the Mediterranean houses; solar on some Sunset roofs
    // roofs differ: pale membrane, white, old tar, tan gravel
    float rt = hash12(vec2(seed * 13.1 + hOff, style + 5.));
    vec3 rc = rt < .35 ? vec3(.66,.66,.64) : rt < .55 ? vec3(.82,.82,.80) : rt < .8 ? vec3(.30,.30,.31) : vec3(.55,.50,.43);
    col = rc * (.88 + .2 * vnoise(vW.xz * .4)) * (.94 + .12 * vnoise(vW.xz * 6.));
    if (style == 3. || style == 17. || style == 4.) col = mix(col, vec3(.62,.34,.26) * (.9 + .2 * step(.5, fract(vW.x * 3.))), .7);
    vec2 lp = vec2((vL.x + .5) * vSc.x, (vL.z + .5) * vSc.z);
    if ((style == 5. || style == 7.) && r > .7) { vec2 sp = abs(lp - vSc.xz * vec2(.5, .6)); float pv = step(sp.x, vSc.x * .3) * step(sp.y, 2.2); col = mix(col, vec3(.10,.13,.22) + .06 * step(.9, fract(lp.x / 1.) ) , pv); }
    float edge = min(min(vL.x + .5, .5 - vL.x) * vSc.x, min(vL.z + .5, .5 - vL.z) * vSc.z);
    col = mix(base * .8, col, smoothstep(.3, .9, edge));                                        // parapet
    if (bay) col = base * .9;
  } else if (upS < 0. && !bay) {
    // the foundation, where the street falls away on a hill: board-formed concrete
    col = mix(vec3(.50,.49,.46), vec3(.60,.58,.54), vnoise(vec2(along * .7, up * 3.))) * (1. - .06 * step(.9, fract(up / .3)));
    col *= .75 + .25 * smoothstep(-3., 0., upS);
    vec3 lit = lightItS(col, n, .8, shadowAt(vW, n));
    gl_FragColor = vec4(fogIt(lit, vW), 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  } else {
    bool glass = style == ${TOWER_ID}.;
    bool office = style >= 12. && style != 16. && style != 17. && style != 15. || glass || style == 8.;
    bool commercial = style == 9. || style == 10. || style == 11. || style == 13. || style == 14. || style == 12.;
    float fh = (style >= 12. && style != 16. && style != 17.) || style >= 30. ? 3.9 : 3.15;
    if (style == 14. || style == 13.) fh = 3.8;
    float fl = floor(upS / fh), fy = fract(upS / fh);
    float houseW = faceW / (front ? houses : max(1., floor(faceW / 7.)));
    float hx = fract(along / houseW);
    float hId = floor(along / houseW) + hOff;
    float cols = max(2., floor(houseW / (style == 14. || style == 31. ? 1.9 : 2.5)));
    float cellW = houseW / cols;
    float cx = fract(hx * cols);
    float wInX = style == 14. || style == 31. ? .16 : .24, wTop = style <= 2. ? .86 : .8, wBot = .26;
    // a window with a frame: w = glass, fr = frame ring
    float win = step(wInX, cx) * step(cx, 1. - wInX) * step(wBot, fy) * step(fy, wTop);
    float fr = step(wInX - .06, cx) * step(cx, 1. - wInX + .06) * step(wBot - .06, fy) * step(fy, wTop + .05) * (1. - win);
    float sill = step(wInX - .08, cx) * step(cx, 1. - wInX + .08) * step(wBot - .07, fy) * step(fy, wBot - .02);
    // fade fine detail where it would shimmer (far away or at grazing angles)
    float graz = 1. - abs(dot(n, -V));
    float detail = 1. - smoothstep(18., 55., dcam * (1. + 6. * graz * graz) / max(cellW, 1.));
    float fine = 1. - smoothstep(10., 38., dcam * (1. + 4. * graz * graz));   // for textures a few centimetres across
    win *= detail; fr *= detail; sill *= detail;
    bool shopfront = commercial && fl < 1. && !bay;
    bool groundHouse = !commercial && fl < 1. && !bay && !glass;
    vec2 wuv = vec2((cx - wInX) / (1. - 2. * wInX), (fy - wBot) / (wTop - wBot));
    vec2 wsize = vec2(cellW * (1. - 2. * wInX), fh * (wTop - wBot));
    if (shopfront) { win = step(.05, cx) * step(cx, .95) * step(.04, fy) * step(fy, .7); fr = 0.; sill = 0.; wuv = vec2((cx - .05) / .9, (fy - .04) / .66); wsize = vec2(cellW * .9, fh * .66); }
    if (glass) { float g = fract(along / 1.55); win = step(.05, g) * step(.12, fy); fr = 0.; sill = 0.; wuv = vec2(g, fy); wsize = vec2(1.55, fh); }
    // wall: the painted colour, weathered with broad soft noise
    col = base * (.9 + .2 * fbm(vW.xz * .07 + vW.y * .05));
    float r2 = hash12(vec2(hId + seed * 51., style));
    if (style <= 2.) col = pal(style, r2);
    // surfaces up close: clapboard on the wooden houses, brick, stucco, cut stone
    if (style <= 2. || style == 4. && r > .6) col *= 1. - .16 * fine * smoothstep(.72, 1., fract(upS / .17));
    else if (style == 10. || (style == 12. || style == 15.) && r < .5 || style == 9. && r > .6 || style == 11. && r2 > .8) {
      float row = floor(upS / .077), bx = fract(along / .215 + .5 * mod(row, 2.));
      float mortar = max(step(.86, fract(upS / .077)), step(.92, bx));
      col *= mix(1., .86 + .28 * hash12(vec2(floor(along / .215 + .5 * mod(row, 2.)), row)), fine);
      col = mix(col, vec3(.74,.72,.66), mortar * fine * .8);
    }
    else if (style == 13. || style == 14. || style == 31. || style == 4.) {
      float j = max(step(.94, fract(upS / .62)), step(.97, fract(along / 1.24 + .5 * mod(floor(upS / .62), 2.))));
      col *= 1. - .14 * j * fine;
    }
    else col *= 1. + (vnoise(vec2(along, upS) * 9.) - .5) * .1 * fine;         // stucco
    // string course between floors (stone and brick downtown), quoins at the corners
    if (style >= 12. || style == 9. || style == 10.) col *= 1. - .14 * (1. - step(.05, fy));
    if (style == 10.) { float bal = step(.12, fy) * step(fy, .2) * step(1., fl); col = mix(col, r > .5 ? vec3(.62,.16,.12) : vec3(.18,.42,.30), bal * .9); }
    if (style == 13. || style == 14. || style == 31.) { float pil = 1. - step(.08, min(cx, 1. - cx)); col = mix(col, col * 1.12 + .03, pil * (1. - win)); }
    // Victorian and Edwardian trim: cream casings, a painted accent on the frames, bays that step forward
    vec3 trimC = style <= 2. ? mix(vec3(.96,.93,.86), pal(style, fract(r2 + .37)), .35) : style == 11. ? vec3(.95,.9,.8) : col * 1.25 + .06;
    col = mix(col, trimC, clamp(fr + sill, 0., 1.));
    if (style <= 2. && front && !bay) { float bayM = step(.12, hx) * step(hx, .58) * step(1., fl); col *= mix(1., 1.1, bayM); col = mix(col, trimC, (1. - step(.035, abs(hx - .12))) * bayM + (1. - step(.035, abs(hx - .58))) * bayM); }
    // cornice: a strong band at the top, with a shadow line under it
    float top = fullH - up;
    if (bay) top = vSc.y * (1. - vL.y) - .05;
    col = mix(col, trimC * .95, 1. - smoothstep(.25, .6, top));
    col *= 1. - .25 * (smoothstep(.55, .7, top) - smoothstep(.7, 1.1, top));
    // shops: a sign band over the window, with lettering; awnings on the painted streets
    float signBand = 0.;
    if (shopfront) {
      signBand = step(.76, fy) * step(fy, .95);
      vec3 signC = mix(mix(vec3(.12,.14,.18), vec3(.55,.12,.1), step(.5, r2)), vec3(.1,.3,.25), step(.8, r2));
      // a line of lettering: words of glyph-like strokes, centred on the shop
      float gx = along / .2, gi = floor(gx), gf = fract(gx), ty = (fy - .815) / .075;
      float word = step(.18, hash12(vec2(floor(gi / 5.), hId * 3. + 1.))) * step(.12, fract(gi / 5.) );
      float glyph = step(.18, gf) * step(gf, .82) * step(0., ty) * step(ty, 1.);
      float hole = step(.4, gf) * step(gf, .6) * step(.25, ty) * step(ty, .75) * step(.4, hash12(vec2(gi, hId)));
      float letters = word * glyph * (1. - hole) * step(.12, hx) * step(hx, .88);
      col = mix(col, mix(signC, vec3(.95,.9,.75), letters * fine), signBand);
      float aw = step(.72, fy) * step(fy, .76);
      col = mix(col, col * .5, aw);
    }
    // soft occlusion: at the ground and in the corners
    float edgeD = min(along, faceW - along);
    float ao = mix(.62, 1., smoothstep(0., 3., upS + (bay ? 3. : 0.))) * mix(.8, 1., smoothstep(0., 1.2, edgeD));
    float sh = shadowAt(vW, n);
    vec3 lit = lightItS(col, n, ao, sh);
    // lights come on at dusk: some rooms, most shops
    float litW = step(.7, hash12(vec2(floor(along / cellW) + seed * 31., fl + hIdx * 7.))) * smoothstep(.2, .7, uNight) * (.55 + .45 * hash12(vec2(fl, seed)));
    if (shopfront) litW = step(.25, r2) * (.45 + .5 * smoothstep(.15, .6, uNight));   // shops are lit by day too
    float roomId = floor(along / cellW) * 7.31 + fl * 13.7 + seed * 101.;
    // glass: fresnel between the sky and the room inside
    vec3 R = reflect(V, n);
    vec3 refl = R.y > 0. ? mix(uSkyHorizon, uSkyTop, clamp(R.y * 1.6, 0., 1.)) : mix(uFogColor * .6, uGroundBounce, clamp(-R.y * 3., 0., 1.));
    refl *= 1. - uNight * .75;
    float F = .05 + .95 * pow(1. - clamp(dot(-V, n), 0., 1.), 5.);
    if (glass) F = mix(.35, 1., F);
    if (shopfront) F *= .45;                 // shop glass: you see in more than you see the sky
    vec3 inside = room(wuv, wsize, V, vT, n, roomId, litW, office || shopfront, shopfront, 1. - smoothstep(8., 26., dcam));
    // curtains and blinds, drawn at the glass
    float cur = 0.;
    if (!office && !shopfront) { float cw = .12 + .2 * hash12(vec2(roomId, 1.)); cur = step(wuv.x, cw) + step(1. - cw, wuv.x); }
    else if (!shopfront) { float bl = hash12(vec2(roomId, 2.)); cur = step(1. - bl * .6, wuv.y) * (.7 + .3 * step(.5, fract(wuv.y * wsize.y / .06))); }
    vec3 curC = (office ? vec3(.78,.78,.74) : mix(vec3(.85,.80,.70), vec3(.55,.25,.2), step(.7, hash12(vec2(roomId, 5.))))) * (day3(n) + vec3(1., .75, .5) * litW * .9);
    inside = mix(inside, curC, clamp(cur, 0., 1.) * (glass ? 0. : 1.));
    // the recess: the window sits back in the wall, so its top and sides fall into shadow
    float recess = (1. - .45 * smoothstep(.85, 1., wuv.y)) * (1. - .25 * smoothstep(.9, 1., abs(wuv.x - .5) * 2.));
    vec3 wc = mix(inside * recess, refl, F) + vec3(1., .8, .6) * pow(max(dot(R, uSunDir), 0.), 300.) * 3. * sh * (1. - uNight);
    if (groundHouse) {
      // ground floor of a house: a garage and a front door with steps
      float garage = step(.12, hx) * step(hx, .55) * step(fy, .72);
      float door = step(.66, hx) * step(hx, .8) * step(fy, .8);
      vec3 gC = mix(vec3(.74,.72,.68), pal(style, fract(r2 + .6)) * .9, step(.5, r2)) * (1. - .12 * fine * step(.85, fract(fy * 7.)));
      if (style == 1. || style == 2. || style == 5. || style == 6. || style == 7. || style == 3.) lit = mix(lit, lightItS(gC, n, ao, sh), garage);
      vec3 dC = mix(vec3(.22,.14,.10), vec3(.35,.12,.12), step(.6, r)) ;
      lit = mix(lit, lightItS(dC, n, ao * .8, sh) + vec3(1., .75, .45) * .4 * step(.62, fy) * uNight, door);
      lit = mix(lit, lit * .6, step(.64, hx) * step(hx, .82) * step(.8, fy) * step(fy, .84));   // the hood over the door
      win = 0.;
    }
    lit = mix(lit, wc, win);
    lit = mix(lit, mix(lit, mix(vec3(.09,.11,.14) * (1. - uNight * .6) + vec3(1., .72, .4) * litW * 1.2, refl, .4), .3), (1. - detail) * step(.5, fl + float(glass)));
    // shop signs glow a little at night
    if (shopfront) lit += vec3(1., .85, .6) * signBand * uNight * .25 * step(.5, r2);
    // separation between houses in a row
    lit *= 1. - .22 * (1. - smoothstep(.0, .012, min(hx, 1. - hx))) * step(1.5, houses);
    gl_FragColor = vec4(fogIt(lit, vW), 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  }
  vec3 lit = lightItS(col, n, 1., shadowAt(vW, n));
  gl_FragColor = vec4(fogIt(lit, vW), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`.replace('void main(){\n  float style', `vec3 day3(vec3 n){ return (uAmbient * .5 + uSunColor * .15) * (1. - uNight) + .02; }
void main(){
  float style`);

let MAT = null;
/** The one facade material, shared with the close-up detail (bays are drawn by the same shader). */
export function buildingMaterial() {
  return MAT || (MAT = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG }));
}
const GEO = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
/** items: [{x, y, z, w, h, d, ang, style, seed (0..1), houses, hOff, yOff, fullH, kind}] → one InstancedMesh */
export function boxInstances(items) {
  const mesh = new THREE.InstancedMesh(GEO.clone(), buildingMaterial(), Math.max(1, items.length));
  mesh.count = items.length;
  const st = new Float32Array(Math.max(1, items.length) * 4), ex = new Float32Array(Math.max(1, items.length) * 4);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), s = new THREE.Vector3();
  let maxH = 0;
  items.forEach((b, i) => {
    // three.js yaw is counter-clockwise looking down; our angle is measured from +x toward +z
    q.setFromAxisAngle(yAxis, -b.ang); v.set(b.x, b.y, b.z); s.set(b.w, b.h, b.d);
    m4.compose(v, q, s); mesh.setMatrixAt(i, m4);
    st.set([b.style, b.seed, b.houses, 0], i * 4);
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
  const CH = 800, buckets = new Map();
  const put = (x, z, item) => { const k = Math.floor((x + city.half) / CH) * 1000 + Math.floor((z + city.half) / CH); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(item); };
  for (const b of city.buildings) put(b.x, b.z, { x: b.x, y: b.y - BASE_DROP, z: b.z, w: b.w, d: b.d, h: b.h + BASE_DROP, ang: b.ang, style: b.styleId, seed: b.seed / 255, houses: b.houses });
  // named towers: a shaft and a setback crown
  for (const t of TOWERS) {
    if (t.round) continue;
    const y = city.heightAt(t.x, t.z), glass = t.h > 140 && !/Russ|Shell|Mark Hopkins|Fairmont|Hallidie/.test(t.name);
    const st = glass ? TOWER_ID : STONE_TOWER_ID, H = t.h + BASE_DROP;
    put(t.x, t.z, { x: t.x, y: y - BASE_DROP, z: t.z, w: t.w, d: t.d, h: t.h * 0.86 + BASE_DROP, ang: 0, style: st, seed: (t.h % 7) / 7, houses: 1, fullH: H });
    put(t.x, t.z, { x: t.x, y: y + t.h * 0.86, z: t.z, w: t.w * 0.72, d: t.d * 0.72, h: t.h * 0.14, ang: 0, style: st, seed: 0.3, houses: 1, yOff: t.h * 0.86 + BASE_DROP, fullH: H });
    city.colliders.addBox(t.x, t.z, t.w, t.d, 0, y - 2, y + t.h, 'tower');
  }
  for (const items of buckets.values()) group.add(boxInstances(items));
  group.userData.update = cam => {
    // from the air you see further: the draw distance grows with height
    const far = (quality === 'low' ? 2200 : quality === 'medium' ? 3400 : 5200) * (1 + Math.min(2, Math.max(0, cam.position.y - 120) / 250));
    for (const m of group.children) {
      const bs = m.boundingSphere; if (!bs) continue;
      const d = bs.center.distanceTo(cam.position) - bs.radius;
      m.visible = d < (m.userData.maxH > 60 ? 14000 : far);
    }
  };
  return group;
}
