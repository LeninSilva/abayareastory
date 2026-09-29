/* Open Your Eyes — cel-shaded vector art.
 * Every shape is a canvas path: flat base colour, one hard-edged shadow band, an ink outline.
 * The palette is the city at 5:12 a.m. in fog: muted, cool, with a few warm accents. */
(function () {
  'use strict';
  const T = 32;
  const INK = '#1d1b27';
  const P = {
    asphalt: '#3c4350', asphaltD: '#333946', lane: '#d8cf9e', curb: '#8d8a84',
    walk: '#aca79c', walkD: '#98938a', grass: '#66815f', grassD: '#58724f', grassL: '#7a946f',
    path: '#b3a585', sand: '#cbbd98', plank: '#86705a', plankD: '#6c5947',
    water: '#2a4d5c', waterL: '#34606f', foam: '#dfe8e6', pool: '#4e8a8c',
    cyp: '#35523f', cypD: '#263d2f', cypL: '#46684f', palm: '#5d7a4c', trunk: '#6b4a34',
    rock: '#8a877f', cliff: '#9a8466', cliffD: '#76634b', cliffL: '#b39c7b',
    wall: '#8f8779', wallD: '#6f685d', paper: '#5b3b48', paperD: '#4a2f3b', carpet: '#5e2733', carpetD: '#4d1f2a',
    orange: '#c0452f', orangeD: '#8e2f20', steel: '#b9bec4', lampGlow: '255,226,160',
    fog: '#e8ecee', gold: '#c9a54a', white: '#f1ede4', red: '#b8412f'
  };
  const ROOFS = ['#7d7a86', '#8a7c70', '#6f7e84', '#7f8876', '#8b7f8c', '#75707a'];
  const VICS = ['#c9a9b7', '#a8c0c7', '#d6c79c', '#b2c4a1', '#c7ac9a', '#b7b0cf', '#d2b7a1'];

  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  // Fill with `fill` (or the current fillStyle).
  function ell(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) ctx.fillStyle = fill; ctx.fill(); }
  function rrPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); rrPath(ctx, x, y, w, h, r); }
  /* Cel shape: base fill, optional hard shadow (clipped), optional highlight, ink outline. */
  function cel(ctx, build, base, o) {
    o = o || {};
    ctx.beginPath(); build(ctx); ctx.fillStyle = base; ctx.fill();
    if (o.shadow || o.hi) {
      ctx.save(); ctx.beginPath(); build(ctx); ctx.clip();
      if (o.shadow) { ctx.beginPath(); o.shadow(ctx); ctx.fillStyle = o.shadowColor || shade(base, -0.22); ctx.fill(); }
      if (o.hi) { ctx.beginPath(); o.hi(ctx); ctx.fillStyle = o.hiColor || shade(base, 0.2); ctx.fill(); }
      ctx.restore();
    }
    if (o.lw !== 0) { ctx.beginPath(); build(ctx); ctx.lineWidth = o.lw || 1.4; ctx.strokeStyle = o.ink || INK; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  const circle = (x, y, r) => c => c.arc(x, y, r, 0, Math.PI * 2);
  const oval = (x, y, rx, ry) => c => c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  const rect = (x, y, w, h) => c => c.rect(x, y, w, h);
  const rounded = (x, y, w, h, r) => c => rrPath(c, x, y, w, h, r);
  const poly = pts => c => { c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); };
  function line(ctx, x1, y1, x2, y2, col, w) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col || INK; ctx.lineWidth = w || 1.2; ctx.stroke(); }

  /* ---------------- ground ---------------- */
  const STREET = 'et=';
  const BUILT = 'BVDX';
  function asphalt(ctx, x, y, get) {
    ctx.fillStyle = P.asphalt; ctx.fillRect(x, y, T, T);
    const horiz = STREET.includes(get(-1, 0)) || STREET.includes(get(1, 0));
    const vert = STREET.includes(get(0, -1)) || STREET.includes(get(0, 1));
    ctx.fillStyle = P.curb;
    if (!STREET.includes(get(0, -1))) ctx.fillRect(x, y, T, 2);
    if (!STREET.includes(get(0, 1))) ctx.fillRect(x, y + T - 2, T, 2);
    if (!STREET.includes(get(-1, 0))) ctx.fillRect(x, y, 2, T);
    if (!STREET.includes(get(1, 0))) ctx.fillRect(x + T - 2, y, 2, T);
    return { horiz, vert };
  }
  function drawStreet(ctx, x, y, get) {
    const o = asphalt(ctx, x, y, get);
    ctx.fillStyle = P.lane;
    if (o.horiz && !o.vert) { ctx.fillRect(x + 4, y + 15, 10, 2); ctx.fillRect(x + 20, y + 15, 10, 2); }
    else if (o.vert && !o.horiz) { ctx.fillRect(x + 15, y + 4, 2, 10); ctx.fillRect(x + 15, y + 20, 2, 10); }
  }
  function drawTracks(ctx, x, y, get) {
    const o = asphalt(ctx, x, y, get);
    const vert = o.vert && !o.horiz;
    ctx.fillStyle = P.asphaltD;
    for (let i = 0; i < 4; i++) vert ? ctx.fillRect(x + 7, y + 2 + i * 8, 18, 3) : ctx.fillRect(x + 2 + i * 8, y + 7, 3, 18);
    ctx.fillStyle = P.steel;
    if (vert) { ctx.fillRect(x + 9, y, 2, T); ctx.fillRect(x + 21, y, 2, T); ctx.fillStyle = INK; ctx.fillRect(x + 15.5, y, 1, T); }
    else { ctx.fillRect(x, y + 9, T, 2); ctx.fillRect(x, y + 21, T, 2); ctx.fillStyle = INK; ctx.fillRect(x, y + 15.5, T, 1); }
  }
  function drawCrosswalk(ctx, x, y, get) {
    const o = asphalt(ctx, x, y, get);
    ctx.fillStyle = '#d9d6cc';
    for (let i = 0; i < 4; i++) (o.horiz ? ctx.fillRect(x + 3 + i * 8, y + 4, 4, 24) : ctx.fillRect(x + 4, y + 3 + i * 8, 24, 4));
  }
  function drawWalk(ctx, x, y, get, tx, ty) {
    ctx.fillStyle = P.walk; ctx.fillRect(x, y, T, T);
    ctx.fillStyle = P.walkD; ctx.fillRect(x, y + 15.5, T, 1); ctx.fillRect(x + 15.5, y, 1, T);
    if (hash(tx, ty, 4) < 0.12) { ctx.fillStyle = 'rgba(40,40,50,.14)'; ell(ctx, x + 8 + hash(tx, ty, 5) * 16, y + 8 + hash(tx, ty, 6) * 16, 3, 2); }
    if (STREET.includes(get(0, 1))) { ctx.fillStyle = P.curb; ctx.fillRect(x, y + T - 3, T, 3); }
  }
  function drawGrass(ctx, x, y, tx, ty, g) {
    ctx.fillStyle = g; ctx.fillRect(x, y, T, T);
    const d = shade(g, -0.14);
    for (let i = 0; i < 3; i++) {
      const hx = x + 5 + hash(tx, ty, i) * 22, hy = y + 7 + hash(ty, tx, i + 7) * 20;
      ctx.strokeStyle = d; ctx.lineWidth = 1.3; ctx.beginPath();
      ctx.moveTo(hx - 2, hy + 3); ctx.lineTo(hx - 1, hy); ctx.moveTo(hx + 1, hy + 3); ctx.lineTo(hx + 2, hy - 1); ctx.stroke();
    }
  }
  function drawFlowers(ctx, x, y, tx, ty, g) {
    drawGrass(ctx, x, y, tx, ty, g);
    const cols = ['#d9894a', '#9c86c9', '#e8e2d2'];
    for (let i = 0; i < 4; i++) { const fx = x + 5 + hash(tx, ty, i + 20) * 22, fy = y + 5 + hash(tx, ty, i + 40) * 22; ell(ctx, fx, fy, 2.2, 2.2, cols[i % 3]); ctx.lineWidth = 0.7; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  function drawWater(ctx, x, y, get, surf) {
    ctx.fillStyle = surf ? P.waterL : P.water; ctx.fillRect(x, y, T, T);
    const land = c => c && 'WwOq'.indexOf(c) < 0;
    ctx.fillStyle = P.foam;
    if (land(get(0, -1))) ctx.fillRect(x, y, T, 3);
    if (land(get(0, 1))) ctx.fillRect(x, y + T - 3, T, 3);
    if (land(get(-1, 0))) ctx.fillRect(x, y, 3, T);
    if (land(get(1, 0))) ctx.fillRect(x + T - 3, y, 3, T);
  }

  /* ---------------- solids ---------------- */
  function drawCypress(ctx, x, y, tx, ty) {
    const cx = x + 16, lean = (hash(tx, ty, 9) - 0.5) * 5;
    ell(ctx, cx + 3, y + 27, 12, 4, 'rgba(10,15,25,.25)');
    cel(ctx, rect(cx - 2, y + 16, 4, 12), P.trunk, { lw: 1.1 });
    cel(ctx, c => { c.ellipse(cx + lean, y + 13, 14, 8, 0, 0, Math.PI * 2); }, P.cyp, { shadow: c => c.rect(cx - 20, y + 14, 40, 10), shadowColor: P.cypD });
    cel(ctx, oval(cx - 3 + lean, y + 7, 9, 5), P.cypL, { lw: 1.1 });
  }
  function drawPalm(ctx, x, y, tx, ty) {
    const cx = x + 16;
    ell(ctx, cx + 4, y + 28, 9, 3, 'rgba(10,15,25,.25)');
    cel(ctx, poly([cx - 2, y + 29, cx + 2, y + 29, cx + 3, y + 10, cx - 1, y + 10]), P.trunk, { lw: 1 });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + hash(tx, ty, 1);
      const ex = cx + Math.cos(a) * 14, ey = y + 9 + Math.sin(a) * 8;
      cel(ctx, c => { c.moveTo(cx, y + 9); c.quadraticCurveTo((cx + ex) / 2 + Math.sin(a) * 4, (y + 9 + ey) / 2 - 5, ex, ey); c.quadraticCurveTo((cx + ex) / 2, (y + 9 + ey) / 2 + 1, cx, y + 9); }, i % 2 ? P.palm : shade(P.palm, -0.15), { lw: 1 });
    }
    ell(ctx, cx, y + 9, 2.5, 2.5, '#4d3a2a');
  }
  function drawRock(ctx, x, y) {
    ell(ctx, x + 17, y + 27, 12, 3.5, 'rgba(10,15,25,.2)');
    cel(ctx, poly([x + 5, y + 26, x + 4, y + 15, x + 11, y + 8, x + 23, y + 9, x + 28, y + 17, x + 26, y + 26]), P.rock, { shadow: c => c.rect(x, y + 19, 32, 12) });
  }
  function drawCliff(ctx, x, y, get) {
    ctx.fillStyle = P.cliff; ctx.fillRect(x, y, T, T);
    ctx.fillStyle = P.cliffD; ctx.fillRect(x, y + 20, T, 12);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x + 10, y + 18); ctx.lineTo(x + 20, y + 21); ctx.lineTo(x + T, y + 19); ctx.stroke();
    if (get(0, -1) !== '^') { ctx.fillStyle = P.cliffL; ctx.fillRect(x, y, T, 5); line(ctx, x, y + 5, x + T, y + 5, INK, 1); }
    if (get(0, 1) !== '^') line(ctx, x, y + T - 0.5, x + T, y + T - 0.5, INK, 1.4);
    if (get(-1, 0) !== '^') line(ctx, x + 0.5, y, x + 0.5, y + T, INK, 1.2);
    if (get(1, 0) !== '^') line(ctx, x + T - 0.5, y, x + T - 0.5, y + T, INK, 1.2);
  }
  function drawBush(ctx, x, y, tx, ty) {
    ell(ctx, x + 17, y + 27, 14, 4, 'rgba(10,15,25,.2)');
    cel(ctx, c => { c.moveTo(x + 3, y + 25); c.bezierCurveTo(x, y + 12, x + 10, y + 3, x + 16, y + 7); c.bezierCurveTo(x + 22, y + 2, x + 33, y + 10, x + 29, y + 25); c.closePath(); }, P.cyp, { shadow: c => c.rect(x, y + 17, 32, 12), shadowColor: P.cypD, hi: c => c.ellipse(x + 11, y + 11, 5, 3, 0, 0, Math.PI * 2), hiColor: P.cypL });
    if (hash(tx, ty, 3) < 0.4) { ell(ctx, x + 20, y + 13, 1.8, 1.8, '#d9894a'); ell(ctx, x + 10, y + 18, 1.6, 1.6, '#e8e2d2'); }
  }
  function roofColor(tx, ty, list) { return list[Math.floor(hash(Math.floor(tx / 2), ty, 11) * list.length)]; }
  function isBuilt(c) { return c && BUILT.indexOf(c) >= 0; }
  function drawBuilding(ctx, x, y, tx, ty, get, ch, scr) {
    const vic = ch === 'V' || (ch === 'D' && scr.doorStyle === 'V');
    const col = vic ? roofColor(tx, ty, VICS) : roofColor(tx, ty, ROOFS);
    const front = !isBuilt(get(0, 1));
    const top = !isBuilt(get(0, -1));
    if (!front) {
      // roof
      ctx.fillStyle = shade(col, -0.18); ctx.fillRect(x, y, T, T);
      ctx.fillStyle = shade(col, -0.08); ctx.fillRect(x + 3, y + 3, T - 6, T - 6);
      if (hash(tx, ty, 2) < 0.3) { cel(ctx, rect(x + 9, y + 9, 10, 8), '#9a9ea4', { lw: 1 }); }
      if (top) line(ctx, x, y + 0.5, x + T, y + 0.5, INK, 1.4);
      if (!isBuilt(get(-1, 0))) line(ctx, x + 0.5, y, x + 0.5, y + T, INK, 1.4);
      if (!isBuilt(get(1, 0))) line(ctx, x + T - 0.5, y, x + T - 0.5, y + T, INK, 1.4);
      return;
    }
    // facade row
    ctx.fillStyle = shade(col, -0.18); ctx.fillRect(x, y, T, 8);
    ctx.fillStyle = col; ctx.fillRect(x, y + 8, T, T - 8);
    ctx.fillStyle = shade(col, -0.25); ctx.fillRect(x + 22, y + 8, 10, T - 8);
    line(ctx, x, y + 8, x + T, y + 8, INK, 1.2);
    if (vic) {
      // bay window and cornice
      ctx.fillStyle = shade(col, 0.25); ctx.fillRect(x, y + 8, T, 3);
      if (ch !== 'D') {
        cel(ctx, poly([x + 7, y + 13, x + 25, y + 13, x + 27, y + 26, x + 5, y + 26]), shade(col, 0.12), { lw: 1.1 });
        cel(ctx, rect(x + 10, y + 16, 5, 8), '#39495a', { lw: 0.9 }); cel(ctx, rect(x + 17, y + 16, 5, 8), '#39495a', { lw: 0.9 });
      }
    } else if (ch !== 'D') {
      for (let i = 0; i < 2; i++) cel(ctx, rect(x + 5 + i * 12, y + 13, 8, 10), hash(tx + i, ty, 5) < 0.2 ? '#e8cf8a' : '#3d4b5b', { lw: 0.9 });
    }
    if (ch === 'D') {
      cel(ctx, c => { c.moveTo(x + 9, y + T); c.lineTo(x + 9, y + 17); c.arc(x + 16, y + 17, 7, Math.PI, 0); c.lineTo(x + 23, y + T); c.closePath(); }, '#3a2a2c', { lw: 1.2 });
      ell(ctx, x + 20, y + 25, 1.1, 1.1, P.gold);
      cel(ctx, rect(x + 8, y + T - 3, 16, 3), P.walkD, { lw: 0.8 });
    }
    line(ctx, x, y + T - 0.5, x + T, y + T - 0.5, INK, 1.4);
    if (!isBuilt(get(-1, 0))) line(ctx, x + 0.5, y, x + 0.5, y + T, INK, 1.4);
    if (!isBuilt(get(1, 0))) line(ctx, x + T - 0.5, y, x + T - 0.5, y + T, INK, 1.4);
    if (top) line(ctx, x, y + 0.5, x + T, y + 0.5, INK, 1.4);
  }
  function drawLampPost(ctx, x, y) {
    ell(ctx, x + 18, y + 28, 6, 2, 'rgba(10,15,25,.25)');
    cel(ctx, rect(x + 14.5, y + 8, 3, 20), '#2f3a42', { lw: 1 });
    cel(ctx, rect(x + 11, y + 26, 10, 3), '#2f3a42', { lw: 1 });
  }
  function drawBench(ctx, x, y) {
    cel(ctx, rounded(x + 3, y + 12, 26, 9, 2), '#7a5b41', { shadow: c => c.rect(x, y + 17, 32, 6), lw: 1.2 });
    ctx.fillStyle = INK; ctx.fillRect(x + 6, y + 21, 2, 5); ctx.fillRect(x + 24, y + 21, 2, 5);
  }
  function drawSofa(ctx, x, y, col) {
    cel(ctx, rounded(x + 1, y + 6, 30, 22, 6), col, { shadow: c => c.rect(x, y + 18, 32, 12), lw: 1.5 });
    cel(ctx, rounded(x + 4, y + 12, 24, 10, 4), shade(col, 0.15), { lw: 1 });
  }
  function drawStoneWall(ctx, x, y, scr) {
    if (scr.interior) {
      ctx.fillStyle = P.paper; ctx.fillRect(x, y, T, T);
      ctx.strokeStyle = P.paperD; ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(x + 8 + i * 16, y + 4); ctx.quadraticCurveTo(x + 13 + i * 16, y + 16, x + 8 + i * 16, y + 28); ctx.stroke(); }
      ctx.fillStyle = '#3b2530'; ctx.fillRect(x, y + T - 6, T, 6);
      return;
    }
    ctx.fillStyle = P.wall; ctx.fillRect(x, y, T, T);
    ctx.fillStyle = P.wallD;
    for (let r = 0; r < 4; r++) { ctx.fillRect(x, y + r * 8 + 7, T, 1); for (let c = 0; c < 3; c++) ctx.fillRect(x + c * 12 + (r % 2) * 6, y + r * 8, 1, 8); }
    ctx.fillStyle = shade(P.wall, 0.15); ctx.fillRect(x, y, T, 3);
  }
  function drawSteel(ctx, x, y) {
    ctx.fillStyle = P.water; ctx.fillRect(x, y, T, T);
    cel(ctx, rect(x + 10, y - 1, 12, T + 2), P.orange, { shadow: c => c.rect(x + 17, y - 2, 6, T + 4), lw: 1.2 });
  }
  function drawCarpet(ctx, x, y, tx, ty) {
    ctx.fillStyle = P.carpet; ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = P.carpetD; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 16, y + 4); ctx.lineTo(x + 28, y + 16); ctx.lineTo(x + 16, y + 28); ctx.lineTo(x + 4, y + 16); ctx.closePath(); ctx.stroke();
    ell(ctx, x + 16, y + 16, 2, 2, '#8a3a44');
  }
  function drawPlate(ctx, x, y) {
    ctx.fillStyle = P.walk; ctx.fillRect(x, y, T, T);
    cel(ctx, circle(x + 16, y + 16, 11), '#6c6f75', { lw: 1.4 });
    cel(ctx, circle(x + 16, y + 16, 6), '#595c62', { lw: 1 });
    ctx.fillStyle = P.orange; ctx.fillRect(x + 14, y + 4, 4, 5); ctx.fillRect(x + 14, y + 23, 4, 5);
  }

  function drawTileStatic(ctx, ch, tx, ty, get, scr) {
    const x = tx * T, y = ty * T, g = scr.grass || P.grass;
    const ground = () => (scr.ground === 'walk' ? drawWalk(ctx, x, y, get, tx, ty) : drawGrass(ctx, x, y, tx, ty, g));
    switch (ch) {
      case '.': drawGrass(ctx, x, y, tx, ty, g); break;
      case ',': drawFlowers(ctx, x, y, tx, ty, g); break;
      case 'e': drawStreet(ctx, x, y, get); break;
      case 't': drawTracks(ctx, x, y, get); break;
      case '=': drawCrosswalk(ctx, x, y, get); break;
      case 'k': drawWalk(ctx, x, y, get, tx, ty); break;
      case 'p': ctx.fillStyle = P.path; ctx.fillRect(x, y, T, T); for (let i = 0; i < 6; i++) ell(ctx, x + hash(tx, ty, i) * 30 + 1, y + hash(ty, tx, i) * 30 + 1, 1.2, 1, '#9d8f71'); break;
      case 's': ctx.fillStyle = P.sand; ctx.fillRect(x, y, T, T); for (let i = 0; i < 4; i++) ell(ctx, x + hash(tx, ty, i) * 30 + 1, y + hash(ty, tx, i) * 30 + 1, 1, 1, '#b3a57f'); break;
      case 'd': ctx.fillStyle = P.plank; ctx.fillRect(x, y, T, T); ctx.fillStyle = P.plankD; for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 8 + 7, T, 1); break;
      case 'r': drawCarpet(ctx, x, y, tx, ty); break;
      case 'x': drawPlate(ctx, x, y); break;
      case 'W': drawWater(ctx, x, y, get, false); break;
      case 'w': drawWater(ctx, x, y, get, true); break;
      case 'q': ctx.fillStyle = '#9c978a'; ctx.fillRect(x, y, T, T); cel(ctx, rect(x + 3, y + 3, T - 6, T - 6), '#5e6466', { lw: 1 }); break;
      case 'T': ground(); drawCypress(ctx, x, y, tx, ty); break;
      case 'P': ground(); drawPalm(ctx, x, y, tx, ty); break;
      case 'o': ground(); drawRock(ctx, x, y); break;
      case '^': drawCliff(ctx, x, y, get); break;
      case 'h': ground(); drawBush(ctx, x, y, tx, ty); break;
      case 'B': case 'V': case 'D': drawBuilding(ctx, x, y, tx, ty, get, ch, scr); break;
      case 'L': drawWalk(ctx, x, y, get, tx, ty); drawLampPost(ctx, x, y); break;
      case 'n': if (scr.interior) { drawCarpet(ctx, x, y, tx, ty); drawSofa(ctx, x, y, (scr.sofas && scr.sofas[tx + ',' + ty]) || '#6b2a3a'); } else { ground(); drawBench(ctx, x, y); } break;
      case '#': drawStoneWall(ctx, x, y, scr); break;
      case '~': ctx.fillStyle = '#c9d0d3'; ctx.fillRect(x, y, T, T); break;
      case 'O': drawSteel(ctx, x, y); break;
      case 'X': if (scr.interior) drawStoneWall(ctx, x, y, scr); else if (scr.xGround === 'grass') drawGrass(ctx, x, y, tx, ty, g); else drawWalk(ctx, x, y, get, tx, ty); break;
      default: ground();
    }
  }
  function drawTileAnim(ctx, ch, tx, ty, t) {
    const x = tx * T, y = ty * T;
    if (ch === 'W' || ch === 'w' || ch === 'O') {
      ctx.strokeStyle = ch === 'w' ? 'rgba(223,232,230,.55)' : 'rgba(170,205,212,.35)'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 2; i++) {
        const ph = (t * 0.5 + hash(tx, ty, i) * 6) % 1, wx = x + 4 + ((hash(tx, ty, i + 5) * 20 + t * 5) % 20), wy = y + 9 + i * 13;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 3.5, wy - 3, wx + 7, wy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (ch === 'L') {
      const a = 0.45 + Math.sin(t * 2 + x) * 0.1;
      const g = ctx.createRadialGradient(x + 16, y + 7, 1, x + 16, y + 7, 18);
      g.addColorStop(0, `rgba(${P.lampGlow},${a})`); g.addColorStop(1, `rgba(${P.lampGlow},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - 4, y - 12, T + 8, T);
      cel(ctx, poly([x + 11, y + 4, x + 21, y + 4, x + 19, y + 10, x + 13, y + 10]), '#f3dfa8', { lw: 1.1 });
    } else if (ch === '~') {
      for (let i = 0; i < 3; i++) ell(ctx, x + 16 + Math.sin(t * 0.7 + tx + i * 2) * 8, y + 16 + Math.cos(t * 0.5 + ty + i) * 7, 16 - i * 3, 13 - i * 2, `rgba(240,244,246,${0.45 + i * 0.15})`);
    }
  }

  /* ---------------- landmarks ---------------- */
  function clockFace(ctx, cx, cy, r) {
    cel(ctx, circle(cx, cy, r), '#f1ede1', { lw: 1.3 });
    // 5:12 — hour hand just past five, minute hand at the twelve-minute mark
    const hA = ((5 + 12 / 60) / 12) * Math.PI * 2 - Math.PI / 2, mA = (12 / 60) * Math.PI * 2 - Math.PI / 2;
    line(ctx, cx, cy, cx + Math.cos(hA) * r * 0.5, cy + Math.sin(hA) * r * 0.5, INK, 1.6);
    line(ctx, cx, cy, cx + Math.cos(mA) * r * 0.8, cy + Math.sin(mA) * r * 0.8, INK, 1.1);
  }
  function catenary(ctx, x1, y1, x2, y2, sag) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2); ctx.stroke(); }
  function windows(ctx, x, y, cols, rows, dx, dy, w, h, lit) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { ctx.fillStyle = hash(c, r, lit || 1) < 0.15 ? '#e8cf8a' : '#3a4758'; ctx.fillRect(x + c * dx, y + r * dy, w, h); }
  }
  const LM = {
    palaceHotel(ctx, x, y, w, h) {
      const L = x + 2, R = x + w * T - 2, B = y + h * T;
      cel(ctx, rect(L, y - 10, R - L, B - y + 10), '#c7b89c', { shadow: c => c.rect(L, B - 14, R - L, 14), lw: 1.6 });
      windows(ctx, L + 8, y - 2, 12, 3, (R - L - 16) / 12, 16, 8, 10, 3);
      cel(ctx, rect(L - 2, y - 14, R - L + 4, 6), '#a89878', { lw: 1.4 });
      // glass dome of the Garden Court
      cel(ctx, c => { c.ellipse(x + w * T / 2, y - 14, 30, 16, 0, Math.PI, 0); c.closePath(); }, '#a9c3c6', { shadow: c => c.rect(x + w * T / 2, y - 32, 40, 20), lw: 1.4 });
      ctx.strokeStyle = 'rgba(29,27,39,.5)'; ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + w * T / 2 + i * 11, y - 14); ctx.quadraticCurveTo(x + w * T / 2 + i * 6, y - 27, x + w * T / 2, y - 30); ctx.stroke(); }
      // awning over the door (door tile at x+3)
      const dx = x + 3 * T;
      cel(ctx, poly([dx - 10, B - 20, dx + T + 10, B - 20, dx + T + 6, B - 12, dx - 6, B - 12]), '#6b2a33', { lw: 1.3 });
      cel(ctx, c => { c.moveTo(dx + 8, B); c.lineTo(dx + 8, B - 10); c.lineTo(dx + 24, B - 10); c.lineTo(dx + 24, B); c.closePath(); }, '#2d2227', { lw: 1.3 });
      ctx.fillStyle = P.gold; ctx.font = '700 7px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('THE PALACE', x + w * T / 2, B - 24);
    },
    transamerica(ctx, x, y, w, h) {
      const cx = x + w * T / 2, B = y + h * T;
      cel(ctx, poly([cx, y - 70, cx + 26, B, cx - 26, B]), '#e3e0d6', { shadow: poly([cx, y - 70, cx + 26, B, cx + 4, B]), lw: 1.5 });
      cel(ctx, poly([cx - 13, y + 8, cx - 22, y + 26, cx - 17, y + 26]), '#e3e0d6', { lw: 1 });
      cel(ctx, poly([cx + 13, y + 8, cx + 22, y + 26, cx + 17, y + 26]), '#cfcbc0', { lw: 1 });
      ctx.fillStyle = 'rgba(58,71,88,.6)'; for (let i = 0; i < 12; i++) { const yy = y - 58 + i * 11, hw = (yy - (y - 70)) / (B - y + 70) * 26 - 4; if (hw > 2) ctx.fillRect(cx - hw, yy, hw * 2, 1.5); }
    },
    salesforce(ctx, x, y, w, h, t) {
      const cx = x + w * T / 2, B = y + h * T;
      cel(ctx, c => { c.moveTo(cx - 22, B); c.lineTo(cx - 20, y - 100); c.quadraticCurveTo(cx, y - 122, cx + 20, y - 100); c.lineTo(cx + 22, B); c.closePath(); }, '#9aa6ae', { shadow: c => c.rect(cx + 4, y - 130, 30, 300), lw: 1.5 });
      ctx.strokeStyle = 'rgba(29,27,39,.25)'; ctx.lineWidth = 1; for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.moveTo(cx - 21, y - 96 + i * 9); ctx.lineTo(cx + 21, y - 96 + i * 9); ctx.stroke(); }
      const a = 0.25 + Math.sin(t * 0.8) * 0.15; ctx.fillStyle = `rgba(200,230,240,${a})`; ctx.fillRect(cx - 19, y - 106, 38, 12);
    },
    ferry(ctx, x, y, w, h) {
      const L = x + 1, R = x + w * T - 1, B = y + h * T, cx = x + w * T / 2;
      cel(ctx, rect(L, y + 14, R - L, B - y - 14), '#ddd2ba', { shadow: c => c.rect(L, B - 12, R - L, 12), lw: 1.5 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) cel(ctx, c2 => rrPath(c2, L + 7 + c * 22, y + 24 + r * 28, 11, 17, 5.5), '#4d6571', { lw: 1 });
      cel(ctx, rect(cx - 12, y - 46, 24, 62), '#e5dcc6', { shadow: c => c.rect(cx + 3, y - 50, 12, 70), lw: 1.5 });
      cel(ctx, rect(cx - 14, y - 52, 28, 7), '#c8b996', { lw: 1.3 });
      cel(ctx, rect(cx - 9, y - 66, 18, 14), '#e5dcc6', { lw: 1.3 });
      cel(ctx, poly([cx - 8, y - 66, cx, y - 80, cx + 8, y - 66]), '#b5a07a', { lw: 1.3 });
      clockFace(ctx, cx, y - 28, 8);
    },
    coit(ctx, x, y, w, h) {
      const cx = x + w * T / 2, B = y + h * T - 4;
      ell(ctx, cx + 6, B, 20, 5, 'rgba(10,15,25,.3)');
      cel(ctx, rect(cx - 11, B - 82, 22, 82), '#ddd5c4', { shadow: c => c.rect(cx + 3, B - 90, 12, 100), lw: 1.5 });
      ctx.fillStyle = 'rgba(29,27,39,.2)'; for (let i = 0; i < 4; i++) ctx.fillRect(cx - 8 + i * 5, B - 80, 1.2, 78);
      cel(ctx, rect(cx - 13, B - 88, 26, 7), '#c3b9a4', { lw: 1.3 });
      for (let i = 0; i < 4; i++) cel(ctx, rect(cx - 9 + i * 5, B - 80, 3, 9), '#2f3a46', { lw: 0.8 });
    },
    ggBridge(ctx, x, y, w, h) {
      const lx = x + 16, rx = x + w * T - 16, top = y - 34;
      ctx.strokeStyle = P.orangeD; ctx.lineWidth = 2.2;
      catenary(ctx, lx, top + 6, lx - 70, y + 70, -24); catenary(ctx, rx, top + 6, rx + 70, y + 70, -24);
      for (const cx of [lx, rx]) {
        cel(ctx, rect(cx - 7, top, 14, h * T + 34), P.orange, { shadow: c => c.rect(cx + 1, top - 2, 8, h * T + 40), lw: 1.5 });
        ctx.fillStyle = P.orangeD; for (let i = 0; i < 4; i++) ctx.fillRect(cx - 7, top + 12 + i * 22, 14, 2.5);
      }
      for (let i = 0; i < 3; i++) cel(ctx, rect(lx + 7, top + 8 + i * 30, rx - lx - 14, 6), P.orange, { lw: 1.2 });
    },
    palaceFA(ctx, x, y, w, h) {
      const cx = x + w * T / 2, B = y + h * T - 4;
      ell(ctx, cx + 6, B + 2, 46, 7, 'rgba(10,15,25,.25)');
      cel(ctx, rect(cx - 38, B - 22, 76, 20), '#c4a98f', { lw: 1.4 });
      for (let i = 0; i < 8; i++) cel(ctx, rect(cx - 36 + i * 10, B - 58, 5, 38), '#dcc6a9', { lw: 0.9 });
      cel(ctx, rect(cx - 40, B - 63, 80, 6), '#b3947a', { lw: 1.3 });
      cel(ctx, c => { c.arc(cx, B - 63, 30, Math.PI, 0); c.closePath(); }, '#c79c7c', { shadow: c => c.rect(cx + 6, B - 100, 30, 40), lw: 1.5 });
      ctx.strokeStyle = 'rgba(29,27,39,.45)'; ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 10, B - 63); ctx.quadraticCurveTo(cx + i * 5, B - 82, cx, B - 93); ctx.stroke(); }
    },
    sutroBaths(ctx, x, y, w, h, t, st) {
      const L = x, R = x + w * T, B = y + h * T;
      cel(ctx, rect(L, y, R - L, B - y), '#a19d91', { lw: 1.5 });
      const n = 5, pw = (R - L - 12) / n;
      for (let i = 0; i < n; i++) {
        const open = st && st.valves ? st.valves[i] : false;
        cel(ctx, rect(L + 6 + i * pw + 1, y + 6, pw - 3, B - y - 12), open ? P.pool : '#595f61', { lw: 1 });
        if (open) { ctx.strokeStyle = 'rgba(223,232,230,.5)'; ctx.lineWidth = 1; ctx.beginPath(); const wy = y + 14 + Math.sin(t * 2 + i) * 2; ctx.moveTo(L + 9 + i * pw, wy); ctx.lineTo(L + 3 + (i + 1) * pw - 6, wy); ctx.stroke(); }
      }
      ctx.fillStyle = '#7f7b70'; for (let i = 0; i <= n; i++) ctx.fillRect(L + 5 + i * pw - 1, y - 6, 3, 8);
    },
    conservatory(ctx, x, y, w, h) {
      const L = x + 4, R = x + w * T - 4, B = y + h * T - 3, cx = x + w * T / 2;
      cel(ctx, rect(L, B - 34, R - L, 34), '#eeebe2', { shadow: c => c.rect(L, B - 10, R - L, 10), lw: 1.5 });
      ctx.fillStyle = '#b9d0cc'; for (let i = 0; i < 12; i++) ctx.fillRect(L + 4 + i * ((R - L - 8) / 12), B - 30, (R - L - 8) / 12 - 3, 18);
      cel(ctx, c => { c.arc(cx, B - 34, 26, Math.PI, 0); c.closePath(); }, '#e7e4da', { shadow: c => c.rect(cx + 6, B - 64, 30, 40), lw: 1.5 });
      cel(ctx, rect(cx - 5, B - 70, 10, 10), '#eeebe2', { lw: 1.2 });
    },
    academy(ctx, x, y, w, h) {
      const L = x + 2, R = x + w * T - 2, B = y + h * T - 3;
      cel(ctx, rect(L, B - 40, R - L, 40), '#cfd3d4', { shadow: c => c.rect(L, B - 12, R - L, 12), lw: 1.5 });
      // living roof: seven green hills
      for (let i = 0; i < 4; i++) cel(ctx, c => { c.ellipse(L + 12 + i * ((R - L - 24) / 3), B - 40, 14, 10, 0, Math.PI, 0); c.closePath(); }, i % 2 ? P.grass : P.grassL, { lw: 1.2 });
      ctx.fillStyle = '#3d4b5b'; ctx.fillRect(L + 8, B - 26, R - L - 16, 10);
    },
    windmill(ctx, x, y, w, h, t) {
      const cx = x + w * T / 2, B = y + h * T - 2;
      cel(ctx, poly([cx - 17, B, cx - 10, B - 46, cx + 10, B - 46, cx + 17, B]), '#8f7560', { shadow: c => c.rect(cx + 3, B - 50, 20, 60), lw: 1.5 });
      cel(ctx, c => { c.arc(cx, B - 46, 11, Math.PI, 0); c.closePath(); }, '#5a4334', { lw: 1.3 });
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.translate(cx, B - 48); ctx.rotate(t * 0.25 + i * Math.PI / 2);
        cel(ctx, rect(3, -4, 32, 8), '#dcd4c2', { lw: 1.1 });
        ctx.restore();
      }
      cel(ctx, circle(cx, B - 48, 3), '#3a2a20', { lw: 1 });
    },
    mission(ctx, x, y, w, h) {
      const L = x + 6, R = x + w * T - 6, B = y + h * T - 2, cx = x + w * T / 2;
      cel(ctx, rect(L, B - 46, R - L, 46), '#eee6d4', { shadow: c => c.rect(R - 14, B - 50, 20, 60), lw: 1.5 });
      cel(ctx, poly([L - 4, B - 46, cx, B - 62, R + 4, B - 46]), '#a9543c', { lw: 1.4 });
      for (let i = 0; i < 4; i++) cel(ctx, rect(L + 6 + i * ((R - L - 16) / 3), B - 44, 6, 44), '#e3dac5', { lw: 0.9 });
      cel(ctx, rect(cx - 16, B - 70, 32, 10), '#e6ddc8', { lw: 1.2 });
      for (let i = 0; i < 3; i++) cel(ctx, circle(cx - 10 + i * 10, B - 65, 2.6), '#b08a3a', { lw: 0.8 });
      cel(ctx, c => rrPath(c, cx - 7, B - 22, 14, 22, 6), '#4a2f25', { lw: 1.2 });
    },
    castro(ctx, x, y, w, h) {
      const L = x + 2, R = x + w * T - 2, B = y + h * T;
      cel(ctx, rect(L, y - 6, R - L, B - y + 6), '#d7c2a0', { shadow: c => c.rect(R - 20, y - 10, 30, 100), lw: 1.5 });
      cel(ctx, rect(x + w * T / 2 - 8, y - 36, 16, 34), '#b4402f', { lw: 1.3 });
      ctx.fillStyle = '#f3e6c2'; ctx.font = '700 8px Georgia, serif'; ctx.textAlign = 'center';
      'CASTRO'.split('').forEach((ch, i) => ctx.fillText(ch, x + w * T / 2, y - 28 + i * 5.2));
      cel(ctx, rect(L + 6, B - 26, R - L - 12, 8), '#2c2a33', { lw: 1.2 });
      ctx.fillStyle = '#f4d98a'; ctx.font = '700 6px system-ui, sans-serif'; ctx.fillText('NOW SHOWING: 5:12', x + w * T / 2, B - 20);
      cel(ctx, rect(x + w * T / 2 - 9, B - 16, 18, 16), '#3a2a2c', { lw: 1.2 });
    },
    sfGeneral(ctx, x, y, w, h) {
      const L = x + 2, R = x + w * T - 2, B = y + h * T;
      cel(ctx, rect(L, y - 8, R - L, B - y + 8), '#9e5a45', { shadow: c => c.rect(L, B - 14, R - L, 14), lw: 1.6 });
      windows(ctx, L + 8, y + 2, 9, 4, (R - L - 16) / 9, 20, 9, 12, 7);
      cel(ctx, rect(L - 2, y - 12, R - L + 4, 6), '#e2d6c2', { lw: 1.3 });
      const dx = x + 3 * T;
      cel(ctx, rect(dx + 4, B - 22, 24, 22), '#e2d6c2', { lw: 1.3 });
      cel(ctx, rect(dx + 9, B - 18, 14, 18), '#2d2227', { lw: 1.2 });
      ctx.fillStyle = '#f4efe3'; ctx.font = '700 6px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GENERAL HOSPITAL', x + w * T / 2, y - 7);
    },
    oracle(ctx, x, y, w, h) {
      const L = x, R = x + w * T, B = y + h * T;
      cel(ctx, rect(L, y - 8, R - L, B - y + 8), '#8f4a36', { shadow: c => c.rect(L, B - 14, R - L, 14), lw: 1.6 });
      for (let i = 0; i < 6; i++) cel(ctx, c => { c.moveTo(L + 6 + i * 19, B - 14); c.lineTo(L + 6 + i * 19, B - 34); c.arc(L + 13 + i * 19, B - 34, 7, Math.PI, 0); c.lineTo(L + 20 + i * 19, B - 14); c.closePath(); }, '#2e3238', { lw: 1 });
      cel(ctx, rect(R - 22, y - 44, 10, 38), '#c8c2b6', { lw: 1.3 });
      ctx.fillStyle = '#e39a3a'; ctx.fillRect(L + 4, y - 4, R - L - 8, 4);
    },
    candlestick(ctx, x, y, w, h, t) {
      const cx = x + w * T / 2, cy = y + h * T / 2;
      ctx.globalAlpha = 0.5 + Math.sin(t * 0.8) * 0.12;
      cel(ctx, oval(cx, cy, w * T / 2 + 4, h * T / 2 + 4), '#c7cbd0', { lw: 1.6 });
      cel(ctx, oval(cx, cy, w * T / 2 - 12, h * T / 2 - 10), '#6f8a64', { lw: 1.2 });
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 10, cy - h * T / 2 + 12); ctx.lineTo(cx + i * 10, cy + h * T / 2 - 12); ctx.stroke(); }
      ctx.globalAlpha = 1;
    },
    sutroTower(ctx, x, y, w, h) {
      const cx = x + w * T / 2, B = y + h * T;
      ctx.lineCap = 'round';
      for (const [dx, col] of [[-26, '#c24a3a'], [26, '#c24a3a'], [0, '#e6e1d8']]) { ctx.strokeStyle = INK; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(cx + dx, B); ctx.lineTo(cx + dx * 0.25, y - 110); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); }
      for (let i = 0; i < 4; i++) { const yy = y - 20 - i * 26, sp = 22 - i * 4; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - sp, yy); ctx.lineTo(cx + sp, yy); ctx.stroke(); ctx.strokeStyle = '#e6e1d8'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.lineCap = 'butt';
    },
    shack(ctx, x, y, w, h) {
      const L = x + 3, R = x + w * T - 3, B = y + h * T - 2, cx = (L + R) / 2;
      cel(ctx, rect(L, B - 30, R - L, 30), '#6f7f63', { shadow: c => c.rect(cx + 8, B - 34, 30, 40), lw: 1.5 });
      cel(ctx, poly([L - 4, B - 30, cx, B - 48, R + 4, B - 30]), '#5c4a3c', { lw: 1.4 });
      cel(ctx, rect(cx - 5, B - 18, 10, 18), '#3a2a2c', { lw: 1.1 });
      cel(ctx, rect(L + 4, B - 24, 9, 8), '#e8cf8a', { lw: 1 });
    },
    battery(ctx, x, y, w, h) {
      const L = x + 2, R = x + w * T - 2, B = y + h * T - 2;
      cel(ctx, c => { c.moveTo(L, B); c.lineTo(L + 6, B - 30); c.lineTo(R - 6, B - 30); c.lineTo(R, B); c.closePath(); }, '#8b8d84', { shadow: c => c.rect(L, B - 12, R - L, 12), lw: 1.5 });
      cel(ctx, rect(L + 14, B - 24, R - L - 28, 10), '#2c2f33', { lw: 1.2 });
      ctx.fillStyle = 'rgba(90,120,70,.8)'; for (let i = 0; i < 5; i++) ell(ctx, L + 6 + i * 12, B - 30, 6, 3.5);
    },
    lotta(ctx, x, y, w, h) {
      const cx = x + 16, B = y + 30;
      ell(ctx, cx + 4, B, 12, 4, 'rgba(10,15,25,.3)');
      cel(ctx, rect(cx - 9, B - 12, 18, 12), '#6d6f4f', { lw: 1.3 });
      cel(ctx, rect(cx - 4, B - 40, 8, 28), '#7c7e5a', { shadow: c => c.rect(cx, B - 42, 6, 32), lw: 1.3 });
      cel(ctx, circle(cx, B - 44, 6), '#8c8e66', { lw: 1.2 });
      clockFace(ctx, cx, B - 24, 3.5);
    },
    dewey(ctx, x, y) {
      const cx = x + 16, B = y + 30;
      ell(ctx, cx + 4, B, 12, 4, 'rgba(10,15,25,.3)');
      cel(ctx, rect(cx - 10, B - 10, 20, 10), '#b9b3a6', { lw: 1.3 });
      cel(ctx, rect(cx - 4, B - 70, 8, 62), '#d6d0c2', { shadow: c => c.rect(cx + 1, B - 72, 6, 70), lw: 1.3 });
      cel(ctx, poly([cx - 7, B - 76, cx + 7, B - 76, cx + 3, B - 88, cx - 3, B - 88]), P.gold, { lw: 1.1 });
    },
    alcatraz(ctx, x, y, w, h) {
      const cx = x + w * T / 2, cy = y + h * T / 2 + 4;
      cel(ctx, oval(cx, cy + 4, 42, 11), '#6a6a58', { lw: 1.4 });
      cel(ctx, rect(cx - 22, cy - 10, 30, 12), '#cfc8b8', { lw: 1.2 });
      cel(ctx, rect(cx + 14, cy - 24, 5, 24), '#e2dccd', { lw: 1.1 });
    },
    mantel(ctx, x, y, w, h) {
      const L = x, R = x + w * T, B = y + h * T;
      cel(ctx, rect(L + 4, y + 2, R - L - 8, B - y - 2), '#4a2f3b', { lw: 1.4 });
      const cx = (L + R) / 2;
      cel(ctx, rect(cx - 40, y + 12, 80, B - y - 12), '#d9d1c1', { shadow: c => c.rect(cx - 40, B - 8, 80, 8), lw: 1.5 });
      cel(ctx, rect(cx - 24, y + 20, 48, B - y - 20), '#231a1e', { lw: 1.3 });
      cel(ctx, rect(cx - 46, y + 8, 92, 6), '#c9bfa9', { lw: 1.3 });
      // the bronze on the mantelpiece
      cel(ctx, c => { c.moveTo(cx - 6, y + 8); c.lineTo(cx - 4, y - 8); c.quadraticCurveTo(cx, y - 18, cx + 4, y - 8); c.lineTo(cx + 6, y + 8); c.closePath(); }, '#8a6a3a', { shadow: c => c.rect(cx, y - 20, 10, 30), lw: 1.3 });
      cel(ctx, circle(cx, y - 16, 3.5), '#8a6a3a', { lw: 1.1 });
      // no mirrors, no windows: two empty frames
      for (const fx of [L + 24, R - 44]) cel(ctx, rect(fx, y + 10, 20, 16), '#3b2530', { ink: '#c9a54a', lw: 1.6 });
    },
    sixGallery(ctx, x, y, w, h) {
      const cx = x + w * T / 2;
      cel(ctx, rect(cx - 30, y + h * T - 30, 60, 11), '#efe6cf', { lw: 1.3 });
      ctx.fillStyle = INK; ctx.font = '700 7px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('SIX GALLERY', cx, y + h * T - 22);
    },
    cityLights(ctx, x, y, w, h) {
      const cx = x + w * T / 2;
      cel(ctx, rect(cx - 30, y + h * T - 30, 60, 11), '#2d2a2e', { lw: 1.3 });
      ctx.fillStyle = '#f0d27c'; ctx.font = '700 7px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('CITY LIGHTS', cx, y + h * T - 22);
    },
    club(ctx, x, y, w, h) {
      const cx = x + w * T / 2;
      cel(ctx, rect(cx - 20, y + h * T - 30, 40, 10), '#1f1d2a', { lw: 1.2 });
      ctx.fillStyle = '#d06aa8'; ctx.font = '700 7px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('FOLSOM', cx, y + h * T - 22.5);
    },
    home(ctx, x, y, w, h) {
      const cx = x + w * T / 2;
      cel(ctx, rect(cx - 7, y + h * T - 30, 14, 9), '#efe6cf', { lw: 1.1 });
      ctx.fillStyle = INK; ctx.font = '700 7px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('1512', cx, y + h * T - 23.5);
    },
    ashbury(ctx, x, y, w, h) {
      const cx = x + w * T / 2;
      cel(ctx, rect(cx - 9, y + h * T - 30, 18, 9), '#e9d7a9', { lw: 1.1 });
      ctx.fillStyle = INK; ctx.font = '700 7px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('710', cx, y + h * T - 23.5);
    },
    crateYard(ctx, x, y, w, h) {
      const L = x, R = x + w * T, B = y + h * T;
      ctx.strokeStyle = '#d1b659'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeRect(L + 3, y + 3, R - L - 6, B - y - 6); ctx.setLineDash([]);
    }
  };
  const ANIMATED = { salesforce: 1, windmill: 1, sutroBaths: 1, candlestick: 1 };
  function drawLandmark(ctx, lm, t, st) { const fn = LM[lm.type]; if (fn) fn(ctx, lm.x * T, lm.y * T, lm.w || 1, lm.h || 1, t || 0, st); }

  /* ---------------- sprites (top-down) ---------------- */
  function drawHat(ctx, look, dir, hy) {
    const hc = look.hatColor || '#2b2a30';
    switch (look.hat) {
      case 'top': cel(ctx, rect(-8, hy - 7, 16, 3), hc, { lw: 1 }); cel(ctx, rect(-5, hy - 19, 10, 13), hc, { lw: 1 }); break;
      case 'fedora': cel(ctx, oval(0, hy - 5, 10, 3), hc, { lw: 1 }); cel(ctx, rounded(-5.5, hy - 12, 11, 7, 3), hc, { lw: 1 }); break;
      case 'bowler': cel(ctx, oval(0, hy - 5, 9, 2.5), hc, { lw: 1 }); cel(ctx, c => { c.arc(0, hy - 6, 6, Math.PI, 0); c.closePath(); }, hc, { lw: 1 }); break;
      case 'cap': cel(ctx, c => { c.arc(0, hy - 4, 7.3, Math.PI, 0); c.closePath(); }, hc, { lw: 1 }); if (dir !== 'up') cel(ctx, rect(dir === 'left' ? -10 : dir === 'right' ? 3 : -5, hy - 5, dir === 'down' ? 10 : 7, 2.5), shade(hc, -0.2), { lw: 0.8 }); break;
      case 'navy': cel(ctx, oval(0, hy - 6, 7.5, 3.4), '#f1eee6', { lw: 1 }); break;
      case 'hard': cel(ctx, c => { c.arc(0, hy - 4, 7.8, Math.PI, 0); c.closePath(); }, '#d8a63a', { lw: 1 }); break;
      case 'fire': cel(ctx, c => { c.arc(0, hy - 4, 8, Math.PI, 0); c.closePath(); }, '#2b2a30', { lw: 1 }); cel(ctx, rect(-9, hy - 4, 18, 2.5), '#2b2a30', { lw: 0.8 }); break;
      case 'beret': cel(ctx, oval(1, hy - 6, 7.5, 3.5), hc, { lw: 1 }); break;
      case 'campaign': cel(ctx, oval(0, hy - 5, 11, 3), hc, { lw: 1 }); cel(ctx, poly([-5, hy - 5, 0, hy - 14, 5, hy - 5]), hc, { lw: 1 }); break;
      case 'flat': cel(ctx, oval(0, hy - 5, 11, 3), hc, { lw: 1 }); cel(ctx, rect(-5, hy - 10, 10, 5), hc, { lw: 1 }); break;
      case 'nurse': cel(ctx, rect(-5, hy - 10, 10, 5), '#f1eee6', { lw: 1 }); ctx.fillStyle = '#b8412f'; ctx.fillRect(-1, hy - 9.5, 2, 4); break;
      case 'military': cel(ctx, oval(0, hy - 6, 8.5, 3.2), hc, { lw: 1 }); cel(ctx, rect(-6, hy - 6, 12, 3), shade(hc, -0.2), { lw: 0.8 }); break;
      case 'headband': ctx.fillStyle = hc; ctx.fillRect(-7.2, hy - 4, 14.4, 2.4); break;
      case 'bonnet': cel(ctx, c => { c.arc(0, hy - 2, 9, Math.PI, 0); c.closePath(); }, hc, { lw: 1 }); break;
      case 'pillbox': cel(ctx, rect(-4.5, hy - 11, 9, 5), hc, { lw: 1 }); ctx.fillStyle = '#d8b44a'; ctx.fillRect(-4.5, hy - 7.5, 9, 1.2); break;
    }
  }
  function drawPerson(ctx, x, y, look, dir, phase, o) {
    o = o || {};
    if (look.kind === 'dog') return drawDog(ctx, x, y, look, dir, phase, o.t || 0);
    if (look.kind === 'bear') return drawBear(ctx, x, y, dir, o.t || 0);
    if (look.kind === 'gator') return drawGator(ctx, x, y, dir, o.t || 0);
    if (look.kind === 'voice') {   // a sign or plaque
      ell(ctx, x + 3, y + 14, 8, 2.5, 'rgba(10,15,25,.3)');
      cel(ctx, rect(x - 1.5, y - 2, 3, 16), '#4a3a2e', { lw: 1 });
      cel(ctx, rounded(x - 11, y - 14, 22, 13, 2), '#d8cfb8', { lw: 1.3 });
      ctx.fillStyle = INK; for (let i = 0; i < 3; i++) ctx.fillRect(x - 7, y - 11 + i * 3.4, 14 - i * 3, 1.2);
      return;
    }
    ctx.save(); ctx.translate(x, y);
    if (look.ghost !== false && !o.solid) ctx.globalAlpha = 0.9 + Math.sin((o.t || 0) * 2 + x) * 0.06;
    ell(ctx, 1, 14, 9, 3, 'rgba(10,15,25,.3)');
    const step = Math.sin(phase * Math.PI * 2) * 2.6;
    const legs = look.legs || shade(look.coat || '#555', -0.3);
    if (look.coatStyle === 'dress' || look.coatStyle === 'robe') {
      cel(ctx, poly([-7, -5, 7, -5, 9.5, 13, -9.5, 13]), look.coat, { shadow: c => c.rect(2, -8, 12, 24), lw: 1.2 });
    } else {
      cel(ctx, rect(-5, 3, 4, 10 + (step > 0 ? -1 : 0)), legs, { lw: 1 });
      cel(ctx, rect(1, 3, 4, 10 + (step < 0 ? -1 : 0)), legs, { lw: 1 });
      cel(ctx, poly([-7, -6, 7, -6, 8, 5, -8, 5]), look.coat, { shadow: c => c.rect(2, -8, 10, 16), lw: 1.2 });
    }
    if (dir !== 'up' && look.shirt) { ctx.fillStyle = look.shirt; ctx.fillRect(-2, -6, 4, 5); }
    const sw = Math.sin(phase * Math.PI * 2) * 2;
    if (dir === 'left' || dir === 'right') cel(ctx, oval(sw * 0.6, -1, 2.6, 5), shade(look.coat, -0.1), { lw: 1 });
    else { cel(ctx, oval(-9, -1 + sw * 0.4, 2.4, 5), shade(look.coat, -0.1), { lw: 1 }); cel(ctx, oval(9, -1 - sw * 0.4, 2.4, 5), shade(look.coat, -0.1), { lw: 1 }); }
    const hy = -13;
    cel(ctx, circle(0, hy, 7), look.skin, { shadow: c => c.rect(2, hy - 8, 8, 16), lw: 1.2 });
    // hair
    const hs = look.hairStyle || 'short';
    if (hs !== 'bald') {
      ctx.fillStyle = look.hair;
      if (dir === 'up') { ell(ctx, 0, hy - 0.5, 7.2, 7.2); }
      else {
        ctx.beginPath(); ctx.ellipse(0, hy - 2.5, 7.4, 5, 0, Math.PI, 0); ctx.fill();
        if (hs === 'long' || hs === 'curly' || hs === 'afro' || hs === 'wild') { ell(ctx, -6.5, hy + 1, 2.6, hs === 'long' ? 7 : 4.5); ell(ctx, 6.5, hy + 1, 2.6, hs === 'long' ? 7 : 4.5); }
        if (hs === 'afro' || hs === 'wild' || hs === 'curly') ell(ctx, 0, hy - 5, hs === 'afro' ? 9 : 8, 5);
      }
      if (hs === 'bun') ell(ctx, 0, hy - 8, 3.4, 3);
    }
    if (dir === 'down') {
      ell(ctx, -2.6, hy + 0.8, 1, 1.3, INK); ell(ctx, 2.6, hy + 0.8, 1, 1.3, INK);
      if (look.beard === 'full' || look.beard === 'walrus' || look.beard === 'mutton') { ctx.fillStyle = look.beardColor || look.hair; ctx.beginPath(); ctx.ellipse(0, hy + 4, look.beard === 'walrus' ? 4.5 : 6, look.beard === 'walrus' ? 1.8 : 4, 0, 0, Math.PI); ctx.fill(); }
      if (look.glasses) { ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(-2.6, hy + 0.8, 2, 0, 6.3); ctx.moveTo(4.6, hy + 0.8); ctx.arc(2.6, hy + 0.8, 2, 0, 6.3); ctx.stroke(); }
    } else if (dir !== 'up') ell(ctx, dir === 'left' ? -3.8 : 3.8, hy + 0.8, 1, 1.3, INK);
    ctx.beginPath(); ctx.arc(0, hy, 7, 0, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    if (look.mask && dir !== 'up') cel(ctx, rect(dir === 'right' ? -2 : -5, hy + 1.5, dir === 'down' ? 10 : 7, 4.5), '#f1eee6', { lw: 0.9 });
    if (look.hat) drawHat(ctx, look, dir, hy);
    ctx.restore();
  }
  function drawDog(ctx, x, y, look, dir, phase, t) {
    ctx.save(); ctx.translate(x, y + 4);
    const f = dir === 'left' ? -1 : 1, bob = Math.sin(phase * Math.PI * 2) * 1.5;
    ell(ctx, 0, 9, 10, 3, 'rgba(10,15,25,.3)');
    for (const lx of [-6, -2, 3, 7]) cel(ctx, rect(lx, 2, 2.4, 7 + (lx % 2 ? bob : -bob) * 0.4), shade(look.coat, -0.2), { lw: 0.8 });
    cel(ctx, oval(0, 0, 9, 5), look.coat, { shadow: c => c.rect(-10, 1, 20, 6), lw: 1.2 });
    cel(ctx, oval(8 * f, -4 + bob * 0.3, 4.5, 4), look.coat, { lw: 1.1 });
    cel(ctx, poly([6 * f, -7, 8 * f, -11, 9.5 * f, -6.5]), shade(look.coat, -0.25), { lw: 0.9 });
    ell(ctx, 11.5 * f, -3.6, 1.1, 1.1, INK); ell(ctx, 8.6 * f, -5, 0.8, 0.8, INK);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8 * f, -2); ctx.quadraticCurveTo(-12 * f, -6 + Math.sin(t * 12) * 2, -13 * f, -8); ctx.stroke();
    ctx.restore();
  }
  function drawBear(ctx, x, y, dir, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1.35, 1.35);
    const f = dir === 'left' ? -1 : 1;
    ell(ctx, 0, 10, 13, 3.5, 'rgba(10,15,25,.3)');
    cel(ctx, oval(-1, 1, 12, 8), '#7a5638', { shadow: c => c.rect(-14, 3, 28, 8), lw: 1.3 });
    cel(ctx, oval(10 * f, -3 + Math.sin(t) * 0.5, 6, 5.5), '#7a5638', { lw: 1.2 });
    cel(ctx, circle(7 * f, -8, 2), '#6a4a30', { lw: 0.9 }); cel(ctx, circle(13 * f, -8, 2), '#6a4a30', { lw: 0.9 });
    cel(ctx, oval(14.5 * f, -2, 2.5, 2), '#c9a57e', { lw: 0.9 }); ell(ctx, 16 * f, -2.4, 0.9, 0.9, INK); ell(ctx, 10.5 * f, -4.6, 0.9, 0.9, INK);
    ctx.restore();
  }
  function drawGator(ctx, x, y, dir, t) {
    ctx.save(); ctx.translate(x, y + 4);
    const f = dir === 'left' ? -1 : 1;
    ell(ctx, 0, 6, 16, 3, 'rgba(10,15,25,.3)');
    cel(ctx, c => { c.moveTo(-16 * f, 0); c.quadraticCurveTo(-4 * f, -7, 10 * f, -3); c.lineTo(19 * f, -1); c.lineTo(19 * f, 2); c.lineTo(10 * f, 3); c.quadraticCurveTo(-4 * f, 6, -16 * f, 0); c.closePath(); }, '#efe9dc', { shadow: c => c.rect(-20, 1, 40, 6), lw: 1.3 });
    ell(ctx, 11 * f, -2.5, 1.2, 1.2, '#e2708a');
    for (const lx of [-6, 5]) { cel(ctx, rect(lx - 1, 2, 3, 4), '#e4ddcf', { lw: 0.8 }); }
    ctx.restore();
  }
  function drawObject(ctx, o, t, st) {
    const x = o.x, y = o.y;
    switch (o.kind) {
      case 'block':
        ell(ctx, x + 2, y + 13, 12, 3.5, 'rgba(10,15,25,.3)');
        cel(ctx, rounded(x - 12, y - 10, 24, 22, 5), o.onPlate ? '#b98a3a' : '#7c5a3c', { shadow: c => c.rect(x, y - 14, 16, 30), lw: 1.6 });
        ctx.fillStyle = INK; ctx.fillRect(x - 12, y - 3, 24, 1.5); ctx.fillRect(x - 12, y + 5, 24, 1.5);
        break;
      case 'valve': {
        cel(ctx, rect(x - 3, y - 4, 6, 16), '#5b5f64', { lw: 1.1 });
        ctx.save(); ctx.translate(x, y - 6); ctx.rotate(o.on ? 0.8 : 0);
        cel(ctx, circle(0, 0, 8), o.on ? '#3f8a8c' : '#8e3a2e', { lw: 1.4 });
        ctx.fillStyle = INK; ctx.fillRect(-8, -1, 16, 2); ctx.fillRect(-1, -8, 2, 16);
        ctx.restore();
        break;
      }
      case 'lantern': {
        const cols = { red: '#c7402f', gold: '#d8a63a', jade: '#4f9a78', white: '#ece6d6' };
        line(ctx, x, y - 30, x, y - 16, INK, 1.2);
        if (o.lit) { const g = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 22); g.addColorStop(0, 'rgba(255,220,150,.6)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(x - 24, y - 30, 48, 48); }
        cel(ctx, oval(x, y - 6, 8, 10), o.lit ? cols[o.color] : shade(cols[o.color], -0.45), { shadow: c => c.rect(x + 2, y - 18, 10, 24), lw: 1.3 });
        cel(ctx, rect(x - 4, y - 17, 8, 3), '#2b2a30', { lw: 0.8 }); cel(ctx, rect(x - 4, y + 3, 8, 3), '#2b2a30', { lw: 0.8 });
        break;
      }
      case 'crate':
        ell(ctx, x + 2, y + 13, 12, 3.5, 'rgba(10,15,25,.3)');
        cel(ctx, rect(x - 12, y - 10, 24, 22), o.paint ? '#6c7a5c' : '#5d6450', { shadow: c => c.rect(x + 1, y - 12, 14, 26), lw: 1.5 });
        ctx.fillStyle = '#e9e1c8'; ctx.font = '700 9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(o.label, x, y + 5);
        if (o.paint) { ctx.fillStyle = 'rgba(233,225,200,.55)'; ctx.fillRect(x - 10, y - 8, 7, 3); }
        break;
      case 'drifter': {
        ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 0.55 + Math.sin(t * 3 + o.seed) * 0.12;
        cel(ctx, c => { c.moveTo(-9, 12); for (let i = 0; i <= 4; i++) c.lineTo(-9 + i * 4.5, 12 + (i % 2 ? 3 : 0) + Math.sin(t * 5 + i) * 1.2); c.lineTo(9, -6); c.quadraticCurveTo(9, -18, 0, -18); c.quadraticCurveTo(-9, -18, -9, -6); c.closePath(); }, '#d9dfe3', { lw: 1.2, ink: '#6f7c86' });
        ell(ctx, -3, -8, 1.6, 2.3, '#3a4550'); ell(ctx, 3, -8, 1.6, 2.3, '#3a4550');
        ctx.restore();
        break;
      }
    }
  }

  /* ---------------- scenes (title / cinema) ---------------- */
  function drawScene(ctx, w, h, t, mode) {
    const skies = {
      title: ['#1b2433', '#34445a', '#8a93a0', '#c9b8a4'],
      dark: ['#07090d', '#0b0f15', '#10151c', '#141a22'],
      dawn: ['#27344a', '#56697f', '#a9adb0', '#d9c6a8'],
      white: ['#e9eef0', '#f3f5f5', '#f7f8f8', '#ffffff']
    };
    const sk = skies[mode] || skies.title;
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    g.addColorStop(0, sk[0]); g.addColorStop(0.45, sk[1]); g.addColorStop(0.8, sk[2]); g.addColorStop(1, sk[3]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (mode === 'white') {
      // a hospital ceiling: acoustic tiles, one stained the shape of Lake Merced
      const s = Math.max(w, h) / 7;
      ctx.strokeStyle = 'rgba(120,135,145,.28)'; ctx.lineWidth = Math.max(1, s * 0.02);
      for (let x = (w / 2) % s; x < w; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h * 0.72); ctx.stroke(); }
      for (let y = s * 0.3; y < h * 0.72; y += s * 0.8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(190,170,130,.22)'; ell(ctx, w * 0.62, s * 1.2, s * 0.32, s * 0.2); ell(ctx, w * 0.62 + s * 0.2, s * 1.28, s * 0.16, s * 0.12);
      return;
    }
    const hz = h * 0.66, u = Math.min(w, h) / 400;
    // skyline silhouette: Transamerica, Salesforce, Coit, rows of towers, cel-flat
    const sky = mode === 'dark' ? '#0e1319' : '#26303c', sky2 = mode === 'dark' ? '#0b0f14' : '#1d252f';
    ctx.lineWidth = Math.max(1, 1.4 * u); ctx.strokeStyle = INK;
    const bldg = (bx, bw, bh, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.rect(bx, hz - bh, bw, bh); ctx.fill(); ctx.stroke(); };
    for (let i = 0; i < 24; i++) bldg(w * 0.3 + i * w * 0.028, w * 0.026, (30 + hash(i, 1, 3) * 70) * u, sky2);
    ctx.fillStyle = sky; ctx.beginPath(); ctx.moveTo(w * 0.62, hz - 175 * u); ctx.lineTo(w * 0.62 + 18 * u, hz); ctx.lineTo(w * 0.62 - 18 * u, hz); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.78 - 16 * u, hz); ctx.lineTo(w * 0.78 - 15 * u, hz - 200 * u); ctx.quadraticCurveTo(w * 0.78, hz - 214 * u, w * 0.78 + 15 * u, hz - 200 * u); ctx.lineTo(w * 0.78 + 16 * u, hz); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 12; i++) bldg(w * 0.46 + i * w * 0.04, w * 0.034, (50 + hash(i, 7, 3) * 90) * u, sky);
    // bridge to the left, towers fading into fog
    const bc = mode === 'dark' ? '#3a1a15' : '#9a3b2a';
    ctx.strokeStyle = bc; ctx.lineWidth = Math.max(1, 2 * u);
    const t1 = w * 0.05, t2 = w * 0.3, top = hz - 150 * u;
    ctx.beginPath(); ctx.moveTo(t1, top); ctx.quadraticCurveTo((t1 + t2) / 2, hz - 10 * u, t2, top); ctx.stroke();
    ctx.fillStyle = bc; for (const tx of [t1, t2]) { ctx.fillRect(tx - 5 * u, top, 10 * u, 160 * u); }
    ctx.fillRect(0, hz - 14 * u, w * 0.36, 5 * u);
    // bay
    ctx.fillStyle = mode === 'dark' ? '#0a0e13' : '#1f2b36'; ctx.fillRect(0, hz, w, h - hz);
    ctx.strokeStyle = mode === 'dark' ? 'rgba(120,140,160,.12)' : 'rgba(220,210,190,.25)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 12; i++) { const yy = hz + 8 + i * i * 2.2 * u; ctx.beginPath(); ctx.moveTo(w * 0.1 + Math.sin(t + i) * 10, yy); ctx.lineTo(w * 0.9, yy); ctx.stroke(); }
    // fog bank rolling in
    for (let i = 0; i < 10; i++) {
      const fx = ((i * 0.15 + t * 0.01) % 1.4 - 0.2) * w, fy = hz - 20 * u - (i % 4) * 22 * u;
      ctx.globalAlpha = mode === 'dark' ? 0.06 : 0.16 + (i % 3) * 0.05; ell(ctx, fx, fy, w * 0.22, 20 * u, '#eef1f2');
    }
    ctx.globalAlpha = 1;
  }

  window.OYE_ART = { T, P, INK, hash, shade, ell, rr, rrPath, cel, circle, oval, rect, rounded, poly, line, clockFace, drawTileStatic, drawTileAnim, drawLandmark, ANIMATED, drawPerson, drawObject, drawScene };
})();
