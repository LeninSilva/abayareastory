/* Yelamu: Open Your Eyes — vector art. Everything is drawn with canvas paths. */
(function () {
  'use strict';
  const T = 32;

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
  const P = {
    path: '#c8b48c', pathD: '#a89370', sand: '#e6d3a1', sandD: '#cfb883',
    water: '#1d5b78', waterD: '#164a63', surf: '#2e7f97', foam: '#eaf6f3', pond: '#2f7f86',
    cyp: '#2e573a', cypD: '#223f2b', cypL: '#40744b', red: '#27472f', redL: '#35613f', trunk: '#7b3c22',
    rock: '#8c8a80', rockD: '#6b695f', cliff: '#9c7f5b', cliffD: '#6f5639', cliffL: '#b89a70',
    wall: '#b5a893', wallD: '#8a7e69', house: '#eadbc0', houseD: '#cbb896', roof: '#5b8b49', roofD: '#436e36',
    door: '#6b3f26', hedge: '#3b6b38', hedgeD: '#2c5229', poppy: '#f28a26', lupine: '#8b6fd6', white: '#f3efe6',
    crystal: '#9df2e8', crystalD: '#4fb3ad', orange: '#c23a2b', orangeD: '#8f271d', steel: '#c9cdd1',
    plank: '#9d7a53', plankD: '#7a5c3c', deck: '#b0835a', gold: '#d9b44a', ink: '#0d1820'
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // Fills with `fill` when given, otherwise with the current fillStyle.
  function ell(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) ctx.fillStyle = fill; ctx.fill(); }

  /* ---------- ground ---------- */
  function grass(ctx, x, y, tx, ty, g) {
    ctx.fillStyle = g; ctx.fillRect(x, y, T, T);
    const d = shade(g, -0.12), l = shade(g, 0.14);
    for (let i = 0; i < 3; i++) {
      const hx = x + 4 + hash(tx, ty, i) * 24, hy = y + 6 + hash(ty, tx, i + 7) * 22;
      ctx.strokeStyle = i ? l : d; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(hx - 2, hy + 3); ctx.lineTo(hx - 1, hy - 1); ctx.moveTo(hx, hy + 3); ctx.lineTo(hx + 1, hy - 2); ctx.moveTo(hx + 2, hy + 3); ctx.lineTo(hx + 3, hy);
      ctx.stroke();
    }
  }
  function flowers(ctx, x, y, tx, ty, g) {
    grass(ctx, x, y, tx, ty, g);
    const cols = [P.poppy, P.lupine, P.white, P.poppy];
    for (let i = 0; i < 5; i++) {
      const fx = x + 4 + hash(tx, ty, i + 20) * 24, fy = y + 4 + hash(tx, ty, i + 40) * 24;
      ell(ctx, fx, fy, 2.2, 2.2, cols[i % 4]); ell(ctx, fx, fy, 0.9, 0.9, '#fbe38a');
    }
  }
  function path(ctx, x, y, tx, ty) {
    ctx.fillStyle = P.path; ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = P.pathD; ctx.lineWidth = 1;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const cx = x + 5 + c * 11 + (r % 2) * 4 + hash(tx * 3 + c, ty * 3 + r, 3) * 2, cy = y + 5 + r * 11;
      ctx.beginPath(); ctx.ellipse(cx, cy, 4.2, 3.4, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function sand(ctx, x, y, tx, ty) {
    ctx.fillStyle = P.sand; ctx.fillRect(x, y, T, T);
    for (let i = 0; i < 5; i++) ell(ctx, x + hash(tx, ty, i) * 30 + 1, y + hash(ty, tx, i + 3) * 30 + 1, 0.9, 0.9, P.sandD);
  }
  function planks(ctx, x, y, col, dark) {
    ctx.fillStyle = col; ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = dark; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + i * 8 + 0.5); ctx.lineTo(x + T, y + i * 8 + 0.5); ctx.stroke(); }
    for (let i = 0; i < 4; i++) { const px = x + ((i * 13 + 5) % 30); ctx.beginPath(); ctx.moveTo(px, y + i * 8); ctx.lineTo(px, y + i * 8 + 8); ctx.stroke(); }
  }
  function water(ctx, x, y, deep) {
    ctx.fillStyle = deep ? P.waterD : P.water; ctx.fillRect(x, y, T, T);
  }

  /* ---------- solids ---------- */
  function cypress(ctx, x, y, tx, ty) {
    const cx = x + 16, lean = (hash(tx, ty, 9) - 0.5) * 6;
    ell(ctx, cx + 2, y + 28, 12, 4, 'rgba(0,0,0,.22)');
    ctx.fillStyle = P.trunk; ctx.beginPath(); ctx.moveTo(cx - 2, y + 29); ctx.lineTo(cx + 2, y + 29); ctx.lineTo(cx + 2 + lean * 0.5, y + 14); ctx.lineTo(cx - 2 + lean * 0.5, y + 14); ctx.fill();
    ell(ctx, cx + lean, y + 13, 15, 8, P.cypD);
    ell(ctx, cx - 5 + lean, y + 9, 10, 6, P.cyp);
    ell(ctx, cx + 6 + lean, y + 8, 9, 5.5, P.cyp);
    ell(ctx, cx + lean, y + 4, 9, 4.5, P.cypL);
    ell(ctx, cx - 4 + lean, y + 6, 4, 2, shade(P.cypL, 0.15));
  }
  function redwood(ctx, x, y) {
    const cx = x + 16;
    ell(ctx, cx + 2, y + 29, 10, 3.5, 'rgba(0,0,0,.22)');
    ctx.fillStyle = P.trunk; ctx.fillRect(cx - 3, y + 20, 6, 10);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? P.redL : P.red;
      ctx.beginPath(); const w = 15 - i * 3, top = y - 2 + i * 1, base = y + 24 - i * 6;
      ctx.moveTo(cx, top + i * 4 - 4); ctx.lineTo(cx + w, base); ctx.lineTo(cx - w, base); ctx.closePath(); ctx.fill();
    }
  }
  function rock(ctx, x, y, tx, ty) {
    const cx = x + 16, cy = y + 18;
    ell(ctx, cx + 1, y + 27, 12, 3.5, 'rgba(0,0,0,.2)');
    ctx.fillStyle = P.rockD; ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 8); ctx.lineTo(cx - 13, cy - 2); ctx.lineTo(cx - 5, cy - 10); ctx.lineTo(cx + 7, cy - 9); ctx.lineTo(cx + 13, cy); ctx.lineTo(cx + 11, cy + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.rock; ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 2); ctx.lineTo(cx - 11, cy - 3); ctx.lineTo(cx - 4, cy - 9); ctx.lineTo(cx + 6, cy - 8); ctx.lineTo(cx + 9, cy - 1); ctx.closePath(); ctx.fill();
  }
  function cliff(ctx, x, y, get) {
    ctx.fillStyle = P.cliff; ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = P.cliffD; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 2, y + 9 + i * 9); ctx.quadraticCurveTo(x + 16, y + 6 + i * 9, x + 30, y + 10 + i * 9); ctx.stroke(); }
    if (get(0, -1) !== '^') { ctx.fillStyle = P.cliffL; ctx.fillRect(x, y, T, 4); }
    if (get(0, 1) !== '^') { ctx.fillStyle = P.cliffD; ctx.fillRect(x, y + T - 6, T, 6); }
    if (get(-1, 0) !== '^') { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, y, 3, T); }
    if (get(1, 0) !== '^') { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x + T - 3, y, 3, T); }
  }
  function stoneWall(ctx, x, y) {
    ctx.fillStyle = P.wall; ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = P.wallD; ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath(); ctx.moveTo(x, y + r * 8 + 0.5); ctx.lineTo(x + T, y + r * 8 + 0.5); ctx.stroke();
      for (let c = 0; c < 3; c++) { const px = x + c * 12 + (r % 2) * 6; ctx.beginPath(); ctx.moveTo(px + 0.5, y + r * 8); ctx.lineTo(px + 0.5, y + r * 8 + 8); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(80,120,60,.35)'; ctx.fillRect(x, y, T, 3);
  }
  function house(ctx, x, y, get, door) {
    ctx.fillStyle = P.house; ctx.fillRect(x, y, T, T);
    ctx.fillStyle = P.houseD; ctx.fillRect(x, y + T - 4, T, 4);
    if (get(0, -1) !== 'H' && get(0, -1) !== 'D') {
      ctx.fillStyle = P.roofD; ctx.fillRect(x - 1, y, T + 2, 10);
      ctx.fillStyle = P.roof; for (let i = 0; i < 4; i++) ell(ctx, x + 4 + i * 8, y + 4, 5, 4.5);
      ell(ctx, x + 8, y + 2, 2, 2, P.poppy); ell(ctx, x + 22, y + 3, 2, 2, P.white);
    }
    if (door) {
      ctx.fillStyle = P.door; ctx.beginPath(); ctx.moveTo(x + 9, y + T); ctx.lineTo(x + 9, y + 16); ctx.arc(x + 16, y + 16, 7, Math.PI, 0); ctx.lineTo(x + 23, y + T); ctx.fill();
      ell(ctx, x + 20, y + 23, 1.2, 1.2, P.gold);
    } else {
      ctx.fillStyle = '#6fa9b4'; rr(ctx, x + 9, y + 13, 14, 11, 5); ctx.fill();
      ctx.strokeStyle = P.houseD; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 16, y + 13); ctx.lineTo(x + 16, y + 24); ctx.stroke();
      ctx.fillStyle = P.hedge; ctx.fillRect(x + 8, y + 24, 16, 3);
    }
  }
  function hedge(ctx, x, y, tx, ty, fl) {
    ell(ctx, x + 16, y + 28, 15, 4, 'rgba(0,0,0,.18)');
    ctx.fillStyle = P.hedgeD; rr(ctx, x + 1, y + 6, 30, 22, 9); ctx.fill();
    ctx.fillStyle = P.hedge; rr(ctx, x + 2, y + 4, 28, 18, 8); ctx.fill();
    if (fl) for (let i = 0; i < 5; i++) ell(ctx, x + 6 + hash(tx, ty, i) * 20, y + 7 + hash(ty, tx, i) * 11, 2.3, 2.3, i % 2 ? P.poppy : P.lupine);
    else { ell(ctx, x + 10, y + 9, 5, 3, shade(P.hedge, 0.12)); ell(ctx, x + 21, y + 11, 4, 2.5, shade(P.hedge, 0.1)); }
  }
  function lampBase(ctx, x, y) {
    ell(ctx, x + 16, y + 28, 7, 2.5, 'rgba(0,0,0,.2)');
    ctx.fillStyle = '#3d4a4f'; ctx.fillRect(x + 14.5, y + 9, 3, 19);
    ctx.fillRect(x + 11, y + 26, 10, 3);
  }
  function lampGlow(ctx, x, y, t) {
    const a = 0.55 + Math.sin(t * 2 + x) * 0.15;
    const g = ctx.createRadialGradient(x + 16, y + 7, 1, x + 16, y + 7, 16);
    g.addColorStop(0, `rgba(170,255,240,${a})`); g.addColorStop(1, 'rgba(170,255,240,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y - 9, T, T);
    crystalShape(ctx, x + 16, y + 7, 4, 8, P.crystal);
  }
  function crystalShape(ctx, cx, cy, w, h, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx, cy - h); ctx.lineTo(cx + w, cy - h * 0.4); ctx.lineTo(cx + w, cy + h * 0.6); ctx.lineTo(cx, cy + h); ctx.lineTo(cx - w, cy + h * 0.6); ctx.lineTo(cx - w, cy - h * 0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(cx, cy - h); ctx.lineTo(cx - w, cy - h * 0.4); ctx.lineTo(cx - w * 0.2, cy); ctx.closePath(); ctx.fill();
  }
  function crystals(ctx, x, y, t, lit) {
    ell(ctx, x + 16, y + 27, 11, 3.5, 'rgba(0,0,0,.2)');
    const glow = lit === false ? 0.08 : 0.35 + Math.sin(t * 2.4 + x * 0.1) * 0.15;
    const g = ctx.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 20);
    g.addColorStop(0, `rgba(157,242,232,${glow})`); g.addColorStop(1, 'rgba(157,242,232,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 4, y - 4, T + 8, T + 8);
    const col = lit === false ? '#6f8d92' : P.crystal;
    crystalShape(ctx, x + 11, y + 18, 4, 9, lit === false ? '#5a7479' : P.crystalD);
    crystalShape(ctx, x + 18, y + 14, 5, 12, col);
    crystalShape(ctx, x + 24, y + 20, 3.5, 7, lit === false ? '#5a7479' : P.crystalD);
  }
  function gate(ctx, x, y, open, t) {
    ctx.fillStyle = '#2d4f52'; ctx.fillRect(x + 1, y + 3, 5, 27); ctx.fillRect(x + 26, y + 3, 5, 27);
    if (open) { ctx.fillStyle = 'rgba(217,180,74,.35)'; ctx.fillRect(x + 6, y + 26, 20, 3); return; }
    ctx.fillStyle = '#3a6f73'; ctx.fillRect(x, y + 11, T, 7);
    ctx.fillStyle = P.gold; for (let i = 0; i < 4; i++) ctx.fillRect(x + 3 + i * 8, y + 11, 4, 7);
    const a = 0.5 + Math.sin(t * 3) * 0.2; ctx.fillStyle = `rgba(157,242,232,${a})`; ctx.fillRect(x + 6, y + 21, 20, 2);
  }
  function steel(ctx, x, y) {
    ctx.fillStyle = P.orangeD; ctx.fillRect(x + 10, y, 12, T);
    ctx.fillStyle = P.orange; ctx.fillRect(x + 11, y, 9, T);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(x + 12, y, 2, T);
    ctx.fillStyle = P.orangeD; for (let i = 0; i < 4; i++) ctx.fillRect(x + 10, y + i * 8 + 3, 12, 1.5);
  }
  function stairs(ctx, x, y) {
    ctx.fillStyle = P.cliffD; ctx.fillRect(x, y, T, T);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? P.wall : P.path; ctx.fillRect(x + 3, y + 2 + i * 6, 26, 5); }
  }
  function tidepool(ctx, x, y) { sand(ctx, x, y, 0, 0); ell(ctx, x + 16, y + 16, 12, 9, P.pond); ell(ctx, x + 12, y + 14, 2, 2, P.poppy); ell(ctx, x + 20, y + 18, 2.5, 2.5, '#9b3f7a'); }

  function drawTileStatic(ctx, ch, tx, ty, get, scr, flags) {
    const x = tx * T, y = ty * T, g = scr.grass || '#5a8a4b';
    switch (ch) {
      case '.': case 'X': grass(ctx, x, y, tx, ty, g); break;
      case ',': flowers(ctx, x, y, tx, ty, g); break;
      case 'p': path(ctx, x, y, tx, ty); break;
      case 's': sand(ctx, x, y, tx, ty); break;
      case 'd': planks(ctx, x, y, P.deck, shade(P.deck, -0.2)); break;
      case 'b': planks(ctx, x, y, P.plank, P.plankD); break;
      case 'W': water(ctx, x, y, true); break;
      case 'w': water(ctx, x, y, false); break;
      case 'P': grass(ctx, x, y, tx, ty, g); ctx.fillStyle = P.pond; rr(ctx, x - (get(-1, 0) === 'P' ? 2 : -2), y - (get(0, -1) === 'P' ? 2 : -2), T + (get(-1, 0) === 'P' ? 2 : -2) + (get(1, 0) === 'P' ? 2 : -2), T + (get(0, -1) === 'P' ? 2 : -2) + (get(0, 1) === 'P' ? 2 : -2), 8); ctx.fill(); break;
      case 'k': tidepool(ctx, x, y); break;
      case 'T': grass(ctx, x, y, tx, ty, g); cypress(ctx, x, y, tx, ty); break;
      case 'R': grass(ctx, x, y, tx, ty, shade(g, -0.1)); redwood(ctx, x, y); break;
      case 'o': grass(ctx, x, y, tx, ty, g); rock(ctx, x, y, tx, ty); break;
      case '^': cliff(ctx, x, y, get); break;
      case '#': stoneWall(ctx, x, y); break;
      case 'H': house(ctx, x, y, get, false); break;
      case 'D': house(ctx, x, y, get, true); break;
      case 'F': grass(ctx, x, y, tx, ty, g); hedge(ctx, x, y, tx, ty, true); break;
      case 'h': grass(ctx, x, y, tx, ty, g); hedge(ctx, x, y, tx, ty, false); break;
      case 'L': path(ctx, x, y, tx, ty); lampBase(ctx, x, y); break;
      case 'c': grass(ctx, x, y, tx, ty, g); break;
      case 'Y': water(ctx, x, y, true); ctx.fillStyle = P.rockD; ell(ctx, x + 16, y + 22, 13, 7); ctx.fill(); break;
      case 'Z': sand(ctx, x, y, tx, ty); break;
      case 'G': path(ctx, x, y, tx, ty); break;
      case 'O': water(ctx, x, y, true); steel(ctx, x, y); break;
      case 'V': stairs(ctx, x, y); break;
      default: grass(ctx, x, y, tx, ty, g);
    }
    // shoreline foam on land edges next to water
    if (ch === 'w' || ch === 'W') {
      const land = c => c && 'Ww YO'.indexOf(c) < 0;
      ctx.fillStyle = 'rgba(234,246,243,.55)';
      if (land(get(0, -1))) ctx.fillRect(x, y, T, 3);
      if (land(get(0, 1))) ctx.fillRect(x, y + T - 3, T, 3);
      if (land(get(-1, 0))) ctx.fillRect(x, y, 3, T);
      if (land(get(1, 0))) ctx.fillRect(x + T - 3, y, 3, T);
    }
  }

  function drawTileAnim(ctx, ch, tx, ty, t, state) {
    const x = tx * T, y = ty * T;
    if (ch === 'W' || ch === 'w' || ch === 'O' || ch === 'Y') {
      ctx.strokeStyle = ch === 'w' ? 'rgba(234,246,243,.45)' : 'rgba(160,220,230,.28)'; ctx.lineWidth = 1.3;
      for (let i = 0; i < 2; i++) {
        const ph = (t * 0.6 + hash(tx, ty, i) * 6) % 1, wx = x + 4 + ((hash(tx, ty, i + 5) * 20 + t * 6) % 22), wy = y + 8 + i * 13;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 3, wy - 2.5, wx + 6, wy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (ch === 'Y') crystals(ctx, x, y - 6, t, state.lit);
    if (ch === 'L') lampGlow(ctx, x, y, t);
    if (ch === 'c') crystals(ctx, x, y, t, true);
    if (ch === 'G') gate(ctx, x, y, state.gateOpen, t);
    if (ch === 'Z' && !state.lit) {
      for (let i = 0; i < 4; i++) {
        const a = 0.35 + Math.sin(t * 1.5 + i) * 0.15;
        ell(ctx, x + 16 + Math.sin(t + i * 1.7) * 6, y + 16 + Math.cos(t * 1.3 + i) * 6, 13 - i, 11 - i, `rgba(236,240,244,${a})`);
      }
    }
  }

  /* ---------- landmarks ---------- */
  function catenary(ctx, x1, y1, x2, y2, sag) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2); ctx.stroke();
  }
  const LANDMARKS = {
    ggTower(ctx, x, y, w, h, t) {
      // tower legs sit on the orange rails; span runs off the top of the screen
      const lx = x + 16, rx = x + w * T - 16, top = y - 30;
      ctx.strokeStyle = P.orangeD; ctx.lineWidth = 2;
      catenary(ctx, lx, top + 6, lx - 60, y + 70, -20); catenary(ctx, rx, top + 6, rx + 60, y + 70, -20);
      for (const cx of [lx, rx]) {
        ctx.fillStyle = P.orangeD; ctx.fillRect(cx - 9, top, 18, h * T + 30);
        ctx.fillStyle = P.orange; ctx.fillRect(cx - 7, top, 13, h * T + 30);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(cx - 6, top, 3, h * T + 30);
        ctx.fillStyle = P.orangeD; for (let i = 0; i < 4; i++) ctx.fillRect(cx - 9, top + 12 + i * 22, 18, 3);
      }
      ctx.fillStyle = P.orange;
      for (let i = 0; i < 3; i++) { const by = top + 8 + i * 30; ctx.fillRect(lx + 6, by, rx - lx - 12, 6); ctx.fillStyle = P.orangeD; ctx.fillRect(lx + 6, by + 5, rx - lx - 12, 2); ctx.fillStyle = P.orange; }
      ctx.strokeStyle = 'rgba(143,39,29,.8)'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(lx + 14 + i * 20, top + 14); ctx.lineTo(lx + 14 + i * 20, top + 8); ctx.stroke(); }
      // deck arch shadows
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(lx + 6, y + h * T - 8, rx - lx - 12, 4);
    },
    sutroBaths(ctx, x, y, w, h) {
      ctx.fillStyle = '#a9a396'; rr(ctx, x + 2, y + 4, w * T - 4, h * T - 8, 4); ctx.fill();
      ctx.fillStyle = P.pond; rr(ctx, x + 8, y + 10, w * T / 2 - 12, h * T - 20, 3); ctx.fill();
      ctx.fillStyle = shade(P.pond, 0.1); rr(ctx, x + w * T / 2 + 2, y + 10, w * T / 2 - 12, h * T - 20, 3); ctx.fill();
      ctx.fillStyle = '#8b8577'; for (let i = 0; i < 6; i++) ctx.fillRect(x + 6 + i * 15, y + 2, 4, 8);
      ctx.fillStyle = 'rgba(80,130,70,.6)'; ell(ctx, x + 14, y + h * T - 8, 8, 3); ctx.fill(); ell(ctx, x + w * T - 20, y + 8, 7, 3); ctx.fill();
    },
    palace(ctx, x, y, w, h) {
      const cx = x + w * T / 2, base = y + h * T - 6;
      ell(ctx, cx, base, 44, 7, 'rgba(0,0,0,.2)');
      ctx.fillStyle = '#c9a98a'; rr(ctx, cx - 38, base - 22, 76, 20, 3); ctx.fill();
      ctx.fillStyle = '#e1c7a6'; for (let i = 0; i < 8; i++) ctx.fillRect(cx - 36 + i * 10, base - 58, 5, 40);
      ctx.fillStyle = '#b98f6b'; ctx.fillRect(cx - 40, base - 62, 80, 6);
      ctx.fillStyle = '#c99a77'; ctx.beginPath(); ctx.arc(cx, base - 62, 30, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#d9b18c'; ctx.beginPath(); ctx.arc(cx, base - 62, 24, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#a57a58'; ctx.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 9, base - 62); ctx.quadraticCurveTo(cx + i * 5, base - 80, cx, base - 91); ctx.stroke(); }
      ctx.fillStyle = '#e8d2b4'; ctx.fillRect(cx - 4, base - 96, 8, 6);
    },
    coit(ctx, x, y, w, h, t) {
      const cx = x + w * T / 2, base = y + h * T - 4;
      ell(ctx, cx, base, 22, 5, 'rgba(0,0,0,.25)');
      ctx.fillStyle = '#ddd4c2'; ctx.fillRect(cx - 12, base - 80, 24, 80);
      ctx.fillStyle = '#c6bca7'; for (let i = 0; i < 5; i++) ctx.fillRect(cx - 11 + i * 5, base - 80, 1.5, 80);
      ctx.fillStyle = '#bfb49e'; ctx.fillRect(cx - 14, base - 84, 28, 6);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#36424a'; ctx.fillRect(cx - 10 + i * 6, base - 76, 3, 8); }
      const a = 0.45 + Math.sin(t * 1.6) * 0.2;
      const g = ctx.createRadialGradient(cx, base - 92, 2, cx, base - 92, 34); g.addColorStop(0, `rgba(157,242,232,${a})`); g.addColorStop(1, 'rgba(157,242,232,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 36, base - 126, 72, 70);
      crystalShape(ctx, cx, base - 94, 9, 13, P.crystal);
    },
    alcatraz(ctx, x, y, w, h) {
      const cx = x + w * T / 2, cy = y + h * T / 2 + 4;
      ell(ctx, cx, cy + 6, 44, 12, P.cliffD); ell(ctx, cx, cy + 2, 40, 10, '#6f8f58');
      ctx.fillStyle = '#d8d0bf'; ctx.fillRect(cx - 20, cy - 8, 30, 10);
      ctx.fillStyle = '#a89f8b'; ctx.fillRect(cx - 20, cy - 2, 30, 2);
      ctx.fillStyle = '#e9e3d4'; ctx.fillRect(cx + 16, cy - 22, 5, 22); ctx.fillStyle = '#f7e89a'; ctx.fillRect(cx + 15, cy - 26, 7, 5);
      ctx.strokeStyle = '#f2efe6'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { const bx = cx - 30 + i * 22, by = cy - 22 - i * 4; ctx.beginPath(); ctx.moveTo(bx - 4, by); ctx.quadraticCurveTo(bx - 2, by - 3, bx, by); ctx.quadraticCurveTo(bx + 2, by - 3, bx + 4, by); ctx.stroke(); }
    },
    ferry(ctx, x, y, w, h) {
      const L = x + 2, R = x + w * T - 2, top = y + 20, bot = y + h * T - 2, cx = x + w * T / 2;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(L + 4, bot - 4, R - L, 6);
      ctx.fillStyle = '#e4d7be'; ctx.fillRect(L, top, R - L, bot - top);
      ctx.fillStyle = '#c9b999'; ctx.fillRect(L, top, R - L, 6);
      ctx.fillStyle = '#5c8a8e'; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { rr(ctx, L + 8 + c * 22, top + 16 + r * 28, 12, 18, 6); ctx.fill(); }
      ctx.fillStyle = '#e8dcc4'; ctx.fillRect(cx - 12, y - 42, 24, 64);
      ctx.fillStyle = '#cdbd9c'; ctx.fillRect(cx - 14, y - 46, 28, 6); ctx.fillRect(cx - 10, y - 60, 20, 14);
      ctx.fillStyle = '#b9a47e'; ctx.beginPath(); ctx.moveTo(cx - 8, y - 60); ctx.lineTo(cx, y - 74); ctx.lineTo(cx + 8, y - 60); ctx.fill();
      ell(ctx, cx, y - 26, 8, 8, '#f6f1e2'); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, y - 26, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, y - 26); ctx.lineTo(cx, y - 32); ctx.moveTo(cx, y - 26); ctx.lineTo(cx + 4, y - 24); ctx.stroke();
    },
    sutroHouse(ctx, x, y, w, h) {
      const L = x + 4, R = x + w * T - 4, bot = y + h * T - 2;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(L + 3, bot - 2, R - L, 5);
      ctx.fillStyle = '#e9e0cf'; ctx.fillRect(L, y - 4, R - L, bot - y + 4);
      ctx.fillStyle = '#4b6b8b'; ctx.beginPath(); ctx.moveTo(L - 6, y - 2); ctx.lineTo(x + w * T / 2, y - 34); ctx.lineTo(R + 6, y - 2); ctx.fill();
      ctx.fillStyle = '#e9e0cf'; ctx.fillRect(R - 22, y - 30, 18, 30); ctx.fillStyle = '#3d5775'; ctx.beginPath(); ctx.moveTo(R - 25, y - 30); ctx.lineTo(R - 13, y - 50); ctx.lineTo(R - 1, y - 30); ctx.fill();
      ctx.fillStyle = '#f5d98a'; for (let i = 0; i < 4; i++) { rr(ctx, L + 8 + i * 18, y + 6, 9, 13, 3); ctx.fill(); } rr(ctx, R - 17, y - 22, 8, 10, 3); ctx.fill();
      ctx.fillStyle = P.door; rr(ctx, x + w * T / 2 - 6, bot - 22, 12, 22, 5); ctx.fill();
    },
    windmill(ctx, x, y, w, h, t) {
      const cx = x + w * T / 2, base = y + h * T - 2;
      ell(ctx, cx, base, 22, 5, 'rgba(0,0,0,.22)');
      ctx.fillStyle = '#a0826a'; ctx.beginPath(); ctx.moveTo(cx - 18, base); ctx.lineTo(cx - 10, base - 48); ctx.lineTo(cx + 10, base - 48); ctx.lineTo(cx + 18, base); ctx.fill();
      ctx.fillStyle = '#8a6c56'; ctx.fillRect(cx - 18, base - 14, 36, 3);
      ctx.fillStyle = '#5a3f2e'; ctx.beginPath(); ctx.arc(cx, base - 48, 12, Math.PI, 0); ctx.fill();
      ctx.fillStyle = P.door; rr(ctx, cx - 4, base - 12, 8, 12, 3); ctx.fill();
      const hub = [cx, base - 50];
      for (let i = 0; i < 4; i++) {
        const a = t * 0.8 + i * Math.PI / 2;
        ctx.save(); ctx.translate(hub[0], hub[1]); ctx.rotate(a);
        ctx.fillStyle = '#e9e1d0'; ctx.fillRect(3, -4, 34, 8);
        ctx.strokeStyle = '#6b4e3a'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(6 + k * 7, -4); ctx.lineTo(6 + k * 7, 4); ctx.stroke(); }
        ctx.fillStyle = '#6b4e3a'; ctx.fillRect(0, -1, 38, 2);
        ctx.restore();
      }
      ell(ctx, hub[0], hub[1], 3, 3, '#3a2a20');
    },
    conservatory(ctx, x, y, w, h) {
      const L = x + 4, R = x + w * T - 4, bot = y + h * T - 4, cx = x + w * T / 2;
      ell(ctx, cx, bot + 1, (R - L) / 2 + 4, 6, 'rgba(0,0,0,.2)');
      ctx.fillStyle = '#f5f3ec'; ctx.fillRect(L, bot - 40, R - L, 40);
      ctx.fillStyle = '#cfe7e3'; for (let i = 0; i < 14; i++) ctx.fillRect(L + 3 + i * 11, bot - 36, 8, 30);
      ctx.fillStyle = '#f5f3ec'; ctx.beginPath(); ctx.moveTo(L - 2, bot - 40); ctx.quadraticCurveTo(L + 20, bot - 56, cx - 26, bot - 50); ctx.lineTo(cx + 26, bot - 50); ctx.quadraticCurveTo(R - 20, bot - 56, R + 2, bot - 40); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, bot - 50, 30, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#d4ece8'; ctx.beginPath(); ctx.arc(cx, bot - 50, 25, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#f5f3ec'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 10, bot - 50); ctx.quadraticCurveTo(cx + i * 6, bot - 68, cx, bot - 75); ctx.stroke(); }
      ctx.fillStyle = '#f5f3ec'; ctx.fillRect(cx - 6, bot - 84, 12, 10); ctx.beginPath(); ctx.arc(cx, bot - 84, 6, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(80,140,70,.8)'; for (let i = 0; i < 6; i++) ell(ctx, L + 12 + i * 26, bot - 6, 7, 5);
      ctx.fillStyle = P.poppy; for (let i = 0; i < 6; i++) ell(ctx, L + 14 + i * 26, bot - 9, 2, 2);
    },
    cityHall(ctx, x, y, w, h, t) {
      const L = x + 2, R = x + w * T - 2, bot = y + h * T - 2, cx = x + w * T / 2;
      ell(ctx, cx, bot + 1, (R - L) / 2 + 6, 6, 'rgba(0,0,0,.22)');
      ctx.fillStyle = '#e7e0d0'; ctx.fillRect(L, bot - 44, R - L, 44);
      ctx.fillStyle = '#cfc6b2'; for (let i = 0; i < 12; i++) ctx.fillRect(L + 6 + i * 12.5, bot - 40, 5, 34);
      ctx.fillStyle = '#d8cfbc'; ctx.beginPath(); ctx.moveTo(cx - 34, bot - 44); ctx.lineTo(cx, bot - 58); ctx.lineTo(cx + 34, bot - 44); ctx.fill();
      ctx.fillStyle = '#e7e0d0'; ctx.fillRect(cx - 22, bot - 76, 44, 20);
      ctx.fillStyle = '#cfc6b2'; for (let i = 0; i < 6; i++) ctx.fillRect(cx - 20 + i * 7.5, bot - 74, 3, 16);
      const gd = ctx.createLinearGradient(cx - 22, 0, cx + 22, 0); gd.addColorStop(0, '#9a7b2e'); gd.addColorStop(0.5, '#f0cf6a'); gd.addColorStop(1, '#9a7b2e');
      ctx.fillStyle = gd; ctx.beginPath(); ctx.arc(cx, bot - 76, 22, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e7e0d0'; ctx.fillRect(cx - 5, bot - 108, 10, 12);
      ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(cx, bot - 108, 5, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - 0.8, bot - 120, 1.6, 8);
      const a = 0.35 + Math.sin(t * 2) * 0.2; ctx.strokeStyle = `rgba(157,242,232,${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, bot - 122, 5, 0, Math.PI * 2); ctx.stroke();
    },
    bayBridge(ctx, x, y, w, h) {
      const L = x, R = x + w * T, midY = y + h * T / 2;
      ctx.strokeStyle = '#dfe3e6'; ctx.lineWidth = 2;
      const tx = L + 60;
      ctx.fillStyle = '#b8c0c6'; ctx.fillRect(tx - 6, midY - 70, 12, 140);
      ctx.fillStyle = '#dfe3e6'; ctx.fillRect(tx - 4, midY - 70, 5, 140);
      ctx.fillStyle = '#b8c0c6'; ctx.fillRect(tx - 14, midY - 58, 28, 5); ctx.fillRect(tx - 14, midY + 52, 28, 5);
      catenary(ctx, L - 10, midY - 30, tx, midY - 66, 30); catenary(ctx, tx, midY - 66, R + 30, midY - 30, 30);
      catenary(ctx, L - 10, midY + 30, tx, midY + 66, -30); catenary(ctx, tx, midY + 66, R + 30, midY + 30, -30);
      ctx.fillStyle = '#e6e1d5'; rr(ctx, L + 6, y + 8, 22, 18, 3); ctx.fill(); ctx.fillStyle = '#3a6f73'; ctx.fillRect(L + 4, y + 4, 26, 5);
    },
    medCenter(ctx, x, y, w, h, t) {
      const L = x + 4, R = x + w * T - 4, bot = y + h * T - 4, cx = x + w * T / 2;
      ell(ctx, cx, bot + 1, (R - L) / 2 + 4, 6, 'rgba(0,0,0,.2)');
      for (let i = 0; i < 3; i++) {
        const inset = i * 18, top = bot - 26 - i * 24;
        ctx.fillStyle = i % 2 ? '#e9e3d6' : '#f2eee4'; ctx.fillRect(L + inset, top, R - L - inset * 2, 26);
        ctx.fillStyle = '#7ab5b8'; for (let k = 0; k < (R - L - inset * 2 - 10) / 16; k++) { rr(ctx, L + inset + 6 + k * 16, top + 7, 10, 12, 4); ctx.fill(); }
        ctx.fillStyle = P.roof; for (let k = 0; k < (R - L - inset * 2) / 10; k++) ell(ctx, L + inset + 5 + k * 10, top, 6, 4);
        ctx.fillStyle = P.poppy; for (let k = 0; k < (R - L - inset * 2) / 30; k++) ell(ctx, L + inset + 12 + k * 30, top - 2, 1.8, 1.8);
      }
      const a = 0.55 + Math.sin(t * 1.4) * 0.25;
      ctx.strokeStyle = `rgba(127,214,207,${a})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, bot - 90, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, bot - 90, 5, 0, Math.PI * 2); ctx.stroke();
    },
    mission(ctx, x, y, w, h) {
      const L = x + 6, R = x + w * T - 6, bot = y + h * T - 2, cx = x + w * T / 2;
      ell(ctx, cx, bot + 1, (R - L) / 2 + 4, 5, 'rgba(0,0,0,.22)');
      ctx.fillStyle = '#f1eadb'; ctx.fillRect(L, bot - 50, R - L, 50);
      ctx.fillStyle = '#b5563a'; ctx.beginPath(); ctx.moveTo(L - 4, bot - 50); ctx.lineTo(cx, bot - 68); ctx.lineTo(R + 4, bot - 50); ctx.fill();
      ctx.fillStyle = '#e4dccb'; for (let i = 0; i < 4; i++) ctx.fillRect(L + 6 + i * ((R - L - 16) / 3), bot - 48, 6, 48);
      ctx.fillStyle = '#e8e0cc'; ctx.fillRect(cx - 18, bot - 74, 36, 10);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#3b2c22'; ctx.beginPath(); ctx.arc(cx - 11 + i * 11, bot - 66, 3.5, Math.PI, 0); ctx.fill(); ell(ctx, cx - 11 + i * 11, bot - 66, 2, 2, '#c6a042'); }
      ctx.fillStyle = P.door; rr(ctx, cx - 8, bot - 24, 16, 24, 7); ctx.fill();
    },
    mast(ctx, x, y, w, h, t) {
      const cx = x + w * T / 2, base = y + h * T + 6;
      ctx.strokeStyle = '#c24a3a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - 34, base); ctx.lineTo(cx - 6, base - 90); ctx.moveTo(cx + 34, base); ctx.lineTo(cx + 6, base - 90); ctx.moveTo(cx, base + 4); ctx.lineTo(cx, base - 96); ctx.stroke();
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const yy = base - 20 - i * 20, sp = 30 - i * 6.5; ctx.beginPath(); ctx.moveTo(cx - sp, yy); ctx.lineTo(cx + sp, yy); ctx.stroke(); }
      const a = 0.5 + Math.sin(t * 3) * 0.3;
      const g = ctx.createRadialGradient(cx, base - 64, 3, cx, base - 64, 40); g.addColorStop(0, `rgba(157,242,232,${a})`); g.addColorStop(1, 'rgba(157,242,232,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 44, base - 108, 88, 88);
      crystalShape(ctx, cx, base - 64, 8, 16, P.crystal);
    },
    tuleBoat(ctx, x, y, w, h, t) {
      const cx = x + w * T / 2, cy = y + 16 + Math.sin(t * 1.3) * 1.5;
      ctx.fillStyle = '#b89a55'; ctx.beginPath(); ctx.moveTo(cx - 26, cy - 4); ctx.quadraticCurveTo(cx, cy + 10, cx + 26, cy - 4); ctx.quadraticCurveTo(cx, cy + 2, cx - 26, cy - 4); ctx.fill();
      ctx.strokeStyle = '#8a7038'; ctx.lineWidth = 1; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 6, cy - 1); ctx.lineTo(cx + i * 6 + 1, cy + 4); ctx.stroke(); }
      ctx.strokeStyle = '#6d7f3a'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) { const rx = x - 18 + i * 5; ctx.beginPath(); ctx.moveTo(rx, y + 40); ctx.quadraticCurveTo(rx + 2, y + 24, rx + 1 + Math.sin(t + i) * 1.5, y + 14); ctx.stroke(); }
    },
    shellmound(ctx, x, y, w, h) {
      const cx = x + w * T / 2, base = y + h * T - 4;
      ctx.fillStyle = '#6f8a4f'; ctx.beginPath(); ctx.ellipse(cx, base, 46, 30, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e8e1d0'; ctx.beginPath(); ctx.ellipse(cx, base, 40, 22, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#c9bea6'; ctx.lineWidth = 1.2; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.ellipse(cx, base, 40 - i * 7, 22 - i * 4.5, 0, Math.PI, 0); ctx.stroke(); }
      ctx.fillStyle = '#6f8a4f'; ctx.beginPath(); ctx.ellipse(cx, base - 18, 14, 6, 0, Math.PI, 0); ctx.fill();
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; ell(ctx, cx + Math.cos(a) * 50, base + 4 + Math.sin(a) * -4 - 2, 4, 3, '#8a8a80'); }
    },
    windHarp(ctx, x, y, w, h, t) {
      const L = x + 8, R = x + w * T - 8, bot = y + h * T - 4;
      ctx.fillStyle = '#7b3c22'; ctx.fillRect(L, bot - 56, 5, 56); ctx.fillRect(R - 5, bot - 56, 5, 56);
      ctx.beginPath(); ctx.moveTo(L - 2, bot - 56); ctx.quadraticCurveTo((L + R) / 2, bot - 76, R + 2, bot - 56); ctx.lineTo(R + 2, bot - 50); ctx.quadraticCurveTo((L + R) / 2, bot - 70, L - 2, bot - 50); ctx.fill();
      ctx.strokeStyle = 'rgba(200,250,240,.85)'; ctx.lineWidth = 1;
      for (let i = 1; i < 12; i++) { const sx = L + 3 + i * (R - L - 6) / 12, vib = Math.sin(t * 9 + i) * 1.2; const top = bot - 58 - Math.sin((i / 12) * Math.PI) * 12; ctx.beginPath(); ctx.moveTo(sx, top); ctx.quadraticCurveTo(sx + vib, (top + bot) / 2, sx, bot - 4); ctx.stroke(); }
    },
    lensWorks(ctx, x, y, w, h, t) {
      const L = x + 2, R = x + w * T - 2, bot = y + h * T - 2, cx = x + w * T / 2;
      ell(ctx, cx, bot + 1, (R - L) / 2 + 4, 6, 'rgba(0,0,0,.22)');
      ctx.fillStyle = '#6f5a48'; ctx.fillRect(L, bot - 52, R - L, 52);
      ctx.fillStyle = '#8a715a'; for (let i = 0; i < 5; i++) ctx.fillRect(L + 4 + i * 24, bot - 50, 16, 46);
      ctx.fillStyle = '#e3d7c1'; ctx.beginPath(); ctx.arc(cx, bot - 52, 34, Math.PI, 0); ctx.fill();
      const a = 0.4 + Math.sin(t * 2.2) * 0.25;
      const g = ctx.createRadialGradient(cx, bot - 66, 3, cx, bot - 66, 30); g.addColorStop(0, `rgba(255,236,170,${a + 0.3})`); g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 34, bot - 100, 68, 70);
      ctx.strokeStyle = `rgba(157,242,232,${a})`; ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) { const ang = Math.PI + (i + 0.5) / 6 * Math.PI; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * 34, bot - 52 + Math.sin(ang) * 34); ctx.lineTo(cx, bot - 66); ctx.stroke(); }
      ell(ctx, cx, bot - 66, 5, 5, '#fff6d8');
      ctx.fillStyle = P.door; rr(ctx, cx - 7, bot - 22, 14, 22, 6); ctx.fill();
    },
    greenwall(ctx, x, y, w, h) {
      ctx.fillStyle = 'rgba(70,120,60,.55)';
      for (let i = 0; i < w * 3; i++) ell(ctx, x + 5 + i * 10.6, y + 2 + (i % 2) * 3, 7, 5);
      ctx.fillStyle = P.poppy; for (let i = 0; i < w; i++) ell(ctx, x + 10 + i * 32, y + 1, 1.8, 1.8);
    }
  };

  function drawLandmark(ctx, lm, t) {
    const fn = LANDMARKS[lm.type]; if (!fn) return;
    fn(ctx, lm.x * T, lm.y * T, lm.w, lm.h, t || 0);
  }
  const ANIMATED_LANDMARKS = { windmill: 1, coit: 1, cityHall: 1, medCenter: 1, mast: 1, tuleBoat: 1, windHarp: 1, lensWorks: 1 };

  /* ---------- people ---------- */
  function drawPerson(ctx, x, y, look, dir, phase, opts) {
    opts = opts || {};
    const s = look.small ? 0.82 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (look.ghost) ctx.globalAlpha = 0.82 + Math.sin((opts.t || 0) * 3) * 0.08;
    if (!opts.noShadow) ell(ctx, 0, 14, 9, 3, 'rgba(0,0,0,.25)');
    if (look.kind === 'machine') { drawMachine(ctx, look, dir, opts.t || 0); ctx.restore(); return; }
    if (look.kind === 'bison') { drawBison(ctx, dir, opts.t || 0); ctx.restore(); return; }
    if (look.kind === 'sign') { drawSign(ctx); ctx.restore(); return; }
    const step = Math.sin(phase * Math.PI * 2) * 3;
    // legs
    ctx.fillStyle = shade(look.bottom, -0.15);
    if (dir === 'left' || dir === 'right') { ctx.fillRect(-3 + step * 0.6, 3, 4, 10); ctx.fillStyle = look.bottom; ctx.fillRect(-1 - step * 0.6, 3, 4, 10); }
    else { ctx.fillRect(-5, 3, 4, 10 + (step > 0 ? -1 : 0)); ctx.fillStyle = look.bottom; ctx.fillRect(1, 3, 4, 10 + (step < 0 ? -1 : 0)); }
    ctx.fillStyle = '#3a2a1e'; if (dir === 'left' || dir === 'right') { ctx.fillRect(-4 + step * 0.6, 12, 6, 2.5); ctx.fillRect(-2 - step * 0.6, 12, 6, 2.5); } else { ctx.fillRect(-6, 12, 5, 2.5); ctx.fillRect(1, 12, 5, 2.5); }
    // pack
    if (look.pack && dir !== 'up') { ctx.fillStyle = '#5a4630'; rr(ctx, dir === 'left' ? 3 : dir === 'right' ? -11 : -7, -8, 8, 12, 2); ctx.fill(); }
    // body
    ctx.fillStyle = look.top; ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(7, -6); ctx.lineTo(8.5, 5); ctx.lineTo(-8.5, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(look.top, -0.18); ctx.fillRect(-8.5, 3, 17, 2);
    if (look.pack && dir === 'up') { ctx.fillStyle = '#5a4630'; rr(ctx, -6, -6, 12, 12, 2); ctx.fill(); }
    // accent sash / necklace
    if (dir !== 'up') { ctx.strokeStyle = look.accent; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-5, -6); ctx.quadraticCurveTo(0, -1, 5, -6); ctx.stroke(); }
    // arms
    const sw = Math.sin(phase * Math.PI * 2) * 2.5;
    ctx.fillStyle = shade(look.top, -0.08);
    if (dir === 'left' || dir === 'right') ell(ctx, (dir === 'left' ? 1 : -1) * 1 + sw * 0.5, -1, 2.8, 5.5);
    else { ell(ctx, -9, -1 + sw * 0.4, 2.6, 5.2); ell(ctx, 9, -1 - sw * 0.4, 2.6, 5.2); }
    // head
    const hy = -13;
    ell(ctx, 0, hy, 7, 7.3, look.skin);
    drawHair(ctx, look, dir, hy);
    // face
    if (dir === 'down') {
      ell(ctx, -2.6, hy + 0.8, 1, 1.25, look.kind === 'android' ? '#3fb8b0' : '#1b1310'); ell(ctx, 2.6, hy + 0.8, 1, 1.25, look.kind === 'android' ? '#3fb8b0' : '#1b1310');
      ctx.fillStyle = 'rgba(210,110,90,.35)'; ell(ctx, -4, hy + 3, 1.5, 1); ell(ctx, 4, hy + 3, 1.5, 1);
    } else if (dir === 'left' || dir === 'right') {
      const sx = dir === 'left' ? -1 : 1; ell(ctx, sx * 3.6, hy + 0.8, 1, 1.25, look.kind === 'android' ? '#3fb8b0' : '#1b1310');
    }
    if (look.kind === 'android' && dir !== 'up') { ctx.strokeStyle = 'rgba(127,214,207,.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6.5, hy + 2); ctx.lineTo(-3, hy + 6); ctx.stroke(); }
    if (look.cap) { ctx.fillStyle = look.top; ctx.beginPath(); ctx.ellipse(0, hy - 5, 7.5, 3.5, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(dir === 'left' ? -10 : dir === 'right' ? 2 : -6, hy - 5, 8, 2); ell(ctx, 0, hy - 6, 1.4, 1.4, look.accent); }
    if (look.hat) { ctx.fillStyle = '#1a1a22'; ctx.fillRect(-9, hy - 7, 18, 2.5); ctx.fillRect(-5.5, hy - 19, 11, 12); ctx.fillStyle = look.accent; ctx.fillRect(-5.5, hy - 10, 11, 2); ell(ctx, 3, hy - 12, 2, 3, '#b8302a'); }
    if (look.hat) { ctx.fillStyle = look.accent; ctx.fillRect(-10, -6, 4, 2); ctx.fillRect(6, -6, 4, 2); }
    if (opts.staff) drawStaff(ctx, dir, opts);
    if (look.ghost) { ctx.globalAlpha = 0.35; ctx.strokeStyle = '#7fd6cf'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -4, 12, 20, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  function drawHair(ctx, look, dir, hy) {
    ctx.fillStyle = look.hair;
    const st = look.hairStyle;
    if (dir === 'up') {
      ell(ctx, 0, hy - 0.5, 7.4, 7.4);
      if (st === 'tied' || st === 'braid') { ctx.fillRect(-1.5, hy + 4, 3, st === 'braid' ? 12 : 6); }
      if (st === 'bun') ell(ctx, 0, hy - 5, 3.5, 3.5);
      if (st === 'curls') for (let i = 0; i < 5; i++) ell(ctx, -6 + i * 3, hy + 5, 2.4, 2.4);
      return;
    }
    ctx.beginPath(); ctx.ellipse(0, hy - 2.5, 7.6, 5.4, 0, Math.PI, 0); ctx.fill();
    if (dir === 'down') { ctx.fillRect(-7.6, hy - 3, 2.6, 6); ctx.fillRect(5, hy - 3, 2.6, 6); }
    else { const b = dir === 'left' ? 1 : -1; ctx.fillRect(b * 2.5 - 3, hy - 3, 6, 7); }
    if (st === 'bun') ell(ctx, 0, hy - 8, 3.6, 3.2, look.hair);
    if (st === 'curls') { for (let i = 0; i < 6; i++) ell(ctx, -7 + i * 2.8, hy - 5 + (i % 2), 2.6, 2.6, look.hair); if (dir !== 'down') ell(ctx, (dir === 'left' ? 5 : -5), hy + 2, 3, 4, look.hair); else { ell(ctx, -7, hy + 3, 2.5, 3.5, look.hair); ell(ctx, 7, hy + 3, 2.5, 3.5, look.hair); } }
    if ((st === 'tied' || st === 'braid') && dir !== 'down') { const b = dir === 'left' ? 1 : -1; ctx.fillStyle = look.hair; ctx.fillRect(b * 5 - 1.5, hy, 3, st === 'braid' ? 13 : 7); }
    if (st === 'beard' && dir !== 'up') { ctx.fillStyle = look.hair; ctx.beginPath(); ctx.ellipse(dir === 'down' ? 0 : (dir === 'left' ? -2 : 2), hy + 4.5, 5.5, 4, 0, 0, Math.PI); ctx.fill(); }
  }
  function drawStaff(ctx, dir, opts) {
    const sw = opts.swing; // 0..1 during a swing, else null
    ctx.save();
    let ang, px = 8, py = -2;
    const base = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[dir];
    if (sw != null) ang = base - 1.1 + sw * 2.2; else ang = dir === 'up' ? -Math.PI / 2 - 0.3 : dir === 'down' ? -Math.PI / 2 + 0.25 : dir === 'left' ? -Math.PI / 2 - 0.35 : -Math.PI / 2 + 0.35;
    if (dir === 'left') px = -8;
    if (dir === 'up' && sw == null) { px = 8; }
    ctx.translate(px, py); ctx.rotate(ang);
    ctx.fillStyle = '#7b5634'; ctx.fillRect(-1.2, -1.2, sw != null ? 22 : 18, 2.4);
    crystalShape(ctx, sw != null ? 24 : 20, 0, 2.6, 4, '#bff7ef');
    if (sw != null) { ctx.globalAlpha = 0.45 * (1 - Math.abs(sw - 0.5) * 2); ctx.strokeStyle = '#bff7ef'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 24, -0.9, 0.2); ctx.stroke(); }
    ctx.restore();
  }
  function drawMachine(ctx, look, dir, t) {
    const bob = Math.sin(t * 2.2) * 1.5;
    ctx.translate(0, bob - 2);
    ctx.fillStyle = shade(look.top, -0.1); ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-9, 8, -4, 13); ctx.lineTo(4, 13); ctx.quadraticCurveTo(9, 8, 6, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = look.top; ctx.beginPath(); ctx.moveTo(-5, -4); ctx.quadraticCurveTo(-7, 6, -3, 11); ctx.lineTo(2, 11); ctx.quadraticCurveTo(3, 4, 1, -4); ctx.closePath(); ctx.fill();
    ell(ctx, 0, 1, 2.2, 2.2, look.accent);
    ell(ctx, -9, 0, 2.2, 5, look.top); ell(ctx, 9, 0, 2.2, 5, look.top);
    ell(ctx, 0, -12, 6.5, 7.5, look.top);
    if (dir !== 'up') { ctx.fillStyle = '#1f2a30'; rr(ctx, dir === 'left' ? -6 : dir === 'right' ? -2 : -5, -14, dir === 'down' ? 10 : 8, 3.5, 1.7); ctx.fill(); ctx.fillStyle = look.accent; ctx.fillRect(dir === 'left' ? -5 : dir === 'right' ? 0 : -3, -13.2, dir === 'down' ? 6 : 4, 1.6); }
    ctx.strokeStyle = look.accent; ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, -22, 7, 2.2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  function drawBison(ctx, dir, t) {
    ctx.scale(1.25, 1.25); ctx.translate(0, -2);
    const f = dir === 'left' ? -1 : 1;
    ell(ctx, 0, 2, 13, 8, '#5b3a22'); ell(ctx, 4 * f, -3, 8, 8, '#4a2e1a');
    ctx.fillStyle = '#3b2415'; ctx.fillRect(-10, 7, 3, 7); ctx.fillRect(-4, 8, 3, 6); ctx.fillRect(4, 8, 3, 6); ctx.fillRect(9, 7, 3, 7);
    ell(ctx, 11 * f, 1, 5.5, 5, '#3b2415'); ell(ctx, 13 * f, -1, 1, 1, '#fff');
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(11 * f, -4, 3.5, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    ctx.strokeStyle = '#3b2415'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-13 * f, 1); ctx.quadraticCurveTo(-16 * f, 4 + Math.sin(t * 3) * 2, -15 * f, 8); ctx.stroke();
  }
  function drawSign(ctx) {
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(-1.5, -2, 3, 16);
    ctx.fillStyle = '#b08a5a'; rr(ctx, -11, -14, 22, 13, 2); ctx.fill();
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 1; ctx.strokeRect(-10.5, -13.5, 21, 12);
    ctx.fillStyle = '#6b4a2e'; for (let i = 0; i < 3; i++) ctx.fillRect(-7, -11 + i * 3.4, 14 - i * 3, 1.3);
  }

  function drawPortrait(ctx, size, look, t) {
    ctx.clearRect(0, 0, size, size);
    const g = ctx.createLinearGradient(0, 0, 0, size); g.addColorStop(0, '#1d3a47'); g.addColorStop(1, '#0f2029');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    if (!look || look.kind === 'voice') {
      ctx.save(); ctx.translate(size / 2, size / 2);
      ctx.strokeStyle = '#7fd6cf'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.9 - i * 0.28; ctx.beginPath(); ctx.arc(0, 0, 8 + i * 8 + Math.sin(t * 2 + i) * 1.5, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore(); ctx.globalAlpha = 1; return;
    }
    const k = size / 30;
    ctx.save(); ctx.scale(k, k);
    const cy = look.kind === 'bison' ? 22 : look.kind === 'sign' ? 26 : look.hat ? 36 : 32;
    drawPerson(ctx, 15, cy, Object.assign({}, look, { small: false }), 'down', 0, { noShadow: true, t });
    ctx.restore();
  }

  /* ---------- enemies, items, fx ---------- */
  function drawEnemy(ctx, e, t) {
    const x = e.x, y = e.y;
    if (e.flash > 0 && Math.floor(t * 30) % 2) ctx.globalAlpha = 0.4;
    if (e.type === 'wisp') {
      ell(ctx, x, y + 12, 7, 2.5, 'rgba(0,0,0,.2)');
      ctx.save(); ctx.translate(x, y - 2 + Math.sin(t * 5 + e.seed) * 2);
      ctx.fillStyle = '#10161c'; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 8 + hash(i, Math.floor(t * 12), e.seed) * 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#9df2e8' : '#f4f4f4'; ctx.fillRect((hash(i, Math.floor(t * 15), e.seed + 1) - 0.5) * 16, (hash(i + 9, Math.floor(t * 15), e.seed) - 0.5) * 16, 2, 2); }
      ell(ctx, 0, 0, 2.2, 2.2, '#ff5a5a');
      ctx.restore();
    } else if (e.type === 'crawler') {
      ell(ctx, x, y + 12, 13, 4, 'rgba(0,0,0,.25)');
      ctx.save(); ctx.translate(x, y);
      const lp = Math.sin(t * 14) * (e.charging ? 2.5 : 1.2);
      ctx.strokeStyle = '#3b2a22'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-8, i * 5); ctx.lineTo(-14, i * 6 + 5 + lp * (i % 2 ? 1 : -1)); ctx.moveTo(8, i * 5); ctx.lineTo(14, i * 6 + 5 - lp * (i % 2 ? 1 : -1)); ctx.stroke(); }
      ctx.fillStyle = '#6b4a36'; ell(ctx, 0, 1, 12, 10); ctx.fill();
      ctx.fillStyle = '#8a5a3a'; ell(ctx, 0, -1, 10, 8); ctx.fill();
      ctx.fillStyle = '#a0683f'; ctx.beginPath(); ctx.arc(0, -3, 6, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#4a3326'; for (let i = 0; i < 5; i++) ell(ctx, -8 + i * 4, 3, 0.9, 0.9);
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(-1.5, -14, 3, 6);
      ell(ctx, e.dx * 6, -1 + e.dy * 5, 2.4, 2.4, e.charging ? '#ffdd55' : '#ff4a2a');
      ctx.restore();
      const pf = (t * 1.5 + e.seed) % 1; ctx.globalAlpha = (1 - pf) * 0.5; ell(ctx, x, y - 16 - pf * 10, 3 + pf * 4, 3 + pf * 4, '#eeeeee'); ctx.globalAlpha = 1;
    } else if (e.type === 'fog') {
      const a = e.visible ? 0.85 : 0.18;
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
      ctx.fillStyle = '#e8edf0'; ctx.beginPath(); ctx.moveTo(-10, 10);
      for (let i = 0; i <= 4; i++) ctx.lineTo(-10 + i * 5, 10 + (i % 2 ? 4 : 0) + Math.sin(t * 6 + i) * 1.5);
      ctx.lineTo(10, -6); ctx.quadraticCurveTo(10, -18, 0, -18); ctx.quadraticCurveTo(-10, -18, -10, -6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a232a'; ell(ctx, -3.5, -8, 2, 3); ctx.fill(); ell(ctx, 3.5, -8, 2, 3); ctx.fill();
      ctx.restore();
    } else if (e.type === 'boss') {
      ctx.save(); ctx.translate(x, y);
      for (let r = 0; r < 4; r++) {
        ctx.strokeStyle = r % 2 ? 'rgba(157,242,232,.5)' : 'rgba(20,24,30,.8)'; ctx.lineWidth = 4 - r * 0.6;
        ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2 + t * (r % 2 ? 1 : -1) * (0.8 + r * 0.3); const rad = 26 + r * 9 + hash(i, Math.floor(t * 10), r) * 6; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.85); } ctx.stroke();
      }
      ctx.fillStyle = '#0d1116'; ell(ctx, 0, 0, 24, 21); ctx.fill();
      for (let i = 0; i < 14; i++) { ctx.fillStyle = ['#f4f4f4', '#9df2e8', '#ff5a8a'][i % 3]; ctx.fillRect((hash(i, Math.floor(t * 20), 3) - 0.5) * 40, (hash(i + 3, Math.floor(t * 20), 4) - 0.5) * 34, 3, 3); }
      if (e.open) { const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 14); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#ff6aa0'); g.addColorStop(1, 'rgba(255,106,160,0)'); ctx.fillStyle = g; ell(ctx, 0, 0, 14, 14); ctx.fill(); }
      else { ell(ctx, 0, 0, 5, 2, '#ff5a8a'); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function drawShard(ctx, x, y, t) {
    const b = Math.sin(t * 3) * 3;
    ell(ctx, x, y + 13, 7, 2.5, 'rgba(0,0,0,.25)');
    const g = ctx.createRadialGradient(x, y - 4 + b, 2, x, y - 4 + b, 22); g.addColorStop(0, 'rgba(255,180,230,.55)'); g.addColorStop(1, 'rgba(157,242,232,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 24, y - 28 + b, 48, 48);
    const hue = (t * 60) % 360;
    crystalShape(ctx, x, y - 4 + b, 6, 11, `hsl(${hue},70%,78%)`);
    crystalShape(ctx, x, y - 4 + b, 3, 7, 'rgba(255,255,255,.6)');
  }
  function drawHeart(ctx, x, y, s, fill, stroke) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 3.2); ctx.bezierCurveTo(-7, -2, -3.5, -7, 0, -3.5); ctx.bezierCurveTo(3.5, -7, 7, -2, 0, 3.2); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1 / s * 1.4; ctx.stroke(); }
    ctx.restore();
  }

  /* ---------- painted scenes (title / ending) ---------- */
  const SKIES = {
    title: ['#1a2446', '#4d3f6e', '#c9716a', '#f5b36b'],
    dawn: ['#223a5c', '#6a86a8', '#f0c7a0', '#fbe6b8'],
    bridge: ['#5d86a6', '#9fbfd3', '#dfe7e4', '#f2eee2'],
    sunset: ['#2a1e45', '#7a3d63', '#e0694a', '#f7b25a']
  };
  function drawScene(ctx, w, h, t, mode) {
    const sk = SKIES[mode] || SKIES.title;
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    g.addColorStop(0, sk[0]); g.addColorStop(0.45, sk[1]); g.addColorStop(0.8, sk[2]); g.addColorStop(1, sk[3]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (mode === 'title' || mode === 'sunset') {
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t + i)); ell(ctx, hash(i, 1, 1) * w, hash(i, 2, 1) * h * 0.3, 0.9, 0.9, '#fff'); }
      ctx.globalAlpha = 1;
    }
    const horizon = h * 0.62;
    const sunX = w * 0.3, sunY = horizon - h * 0.07;
    const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, h * 0.28); sg.addColorStop(0, 'rgba(255,230,170,.95)'); sg.addColorStop(0.15, 'rgba(255,200,130,.6)'); sg.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
    ell(ctx, sunX, sunY, h * 0.045, h * 0.045, '#ffe7b0');
    // Marin headlands
    ctx.fillStyle = mode === 'bridge' ? '#56705a' : '#2a2c3e';
    ctx.beginPath(); ctx.moveTo(w * 0.42, horizon); ctx.bezierCurveTo(w * 0.55, horizon - h * 0.16, w * 0.7, horizon - h * 0.2, w * 0.85, horizon - h * 0.14); ctx.lineTo(w, horizon - h * 0.12); ctx.lineTo(w, horizon); ctx.fill();
    ctx.fillStyle = mode === 'bridge' ? '#4a6650' : '#20222f';
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(0, horizon - h * 0.06); ctx.bezierCurveTo(w * 0.08, horizon - h * 0.09, w * 0.16, horizon - h * 0.05, w * 0.22, horizon - h * 0.04); ctx.lineTo(w * 0.22, horizon); ctx.fill();
    // water
    const wg = ctx.createLinearGradient(0, horizon, 0, h); wg.addColorStop(0, mode === 'bridge' ? '#6f9cb3' : '#3a4a72'); wg.addColorStop(1, mode === 'bridge' ? '#2d5f7a' : '#141c33');
    ctx.fillStyle = wg; ctx.fillRect(0, horizon, w, h - horizon);
    ctx.strokeStyle = 'rgba(255,215,160,.5)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const yy = horizon + 6 + i * i * 1.6; const ww = 10 + i * 5; const xx = sunX + Math.sin(t * 0.8 + i) * 6; ctx.globalAlpha = 0.8 - i * 0.05; ctx.beginPath(); ctx.moveTo(xx - ww, yy); ctx.lineTo(xx + ww, yy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // Golden Gate Bridge
    const deckY = horizon - h * 0.035, t1 = w * 0.34, t2 = w * 0.74, towerH = h * 0.3;
    const br = mode === 'bridge' ? '#c23a2b' : '#8f2e25';
    ctx.strokeStyle = br; ctx.lineWidth = Math.max(1.2, w * 0.0025);
    const cab = (x1, y1, x2, y2, sag) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2); ctx.stroke(); };
    cab(-w * 0.05, deckY - 4, t1, deckY - towerH, towerH * 0.55);
    cab(t1, deckY - towerH, t2, deckY - towerH, towerH * 0.95);
    cab(t2, deckY - towerH, w * 1.05, deckY - 4, towerH * 0.55);
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 40; i++) {
      const x = t1 + (t2 - t1) * i / 40, u = i / 40; const cy = deckY - towerH + (1 - (1 - 2 * u) * (1 - 2 * u)) * towerH * 0.95 * 0.5 * 0.97;
      ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, deckY); ctx.stroke();
    }
    ctx.fillStyle = br; ctx.fillRect(-10, deckY, w + 20, h * 0.012);
    for (const tx of [t1, t2]) {
      const tw = w * 0.018;
      ctx.fillRect(tx - tw, deckY - towerH, tw * 0.7, towerH + h * 0.06); ctx.fillRect(tx + tw * 0.3, deckY - towerH, tw * 0.7, towerH + h * 0.06);
      for (let i = 0; i < 4; i++) ctx.fillRect(tx - tw, deckY - towerH + i * towerH * 0.26 + 4, tw * 2, h * 0.008);
    }
    // fog bank
    for (let i = 0; i < 9; i++) {
      const fx = ((i * 0.17 + t * 0.012) % 1.3 - 0.15) * w, fy = deckY + h * 0.01 - (i % 3) * h * 0.012;
      ctx.globalAlpha = 0.18 + (i % 3) * 0.06; ell(ctx, fx, fy, w * 0.16, h * 0.022, mode === 'bridge' ? '#ffffff' : '#f6e2d0');
    }
    ctx.globalAlpha = 1;
    // pelicans
    ctx.strokeStyle = mode === 'bridge' ? '#2a3a44' : '#1a1622'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const bx = ((t * 0.02 + i * 0.07) % 1.2) * w - w * 0.1, by = h * 0.2 + i * h * 0.025 + Math.sin(t * 2 + i) * 2, s = w * 0.008; ctx.beginPath(); ctx.moveTo(bx - s * 2, by); ctx.quadraticCurveTo(bx - s, by - s * (1 + Math.sin(t * 5 + i) * 0.6), bx, by); ctx.quadraticCurveTo(bx + s, by - s * (1 + Math.sin(t * 5 + i) * 0.6), bx + s * 2, by); ctx.stroke(); }
    // foreground cypress silhouettes
    ctx.fillStyle = mode === 'bridge' ? '#2e4a36' : '#0f121c';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * 0.8); ctx.bezierCurveTo(w * 0.1, h * 0.76, w * 0.2, h * 0.84, w * 0.3, h * 0.88); ctx.lineTo(w * 0.3, h); ctx.fill();
    const cy0 = h * 0.72;
    ctx.fillStyle = mode === 'bridge' ? '#2b4632' : '#0b0e16';
    ctx.fillRect(w * 0.08, cy0, w * 0.012, h * 0.12);
    ell(ctx, w * 0.085, cy0, w * 0.09, h * 0.04); ctx.fill(); ell(ctx, w * 0.05, cy0 - h * 0.03, w * 0.06, h * 0.03); ctx.fill(); ell(ctx, w * 0.12, cy0 - h * 0.035, w * 0.055, h * 0.028); ctx.fill();
  }

  window.YELAMU_ART = { T, P, hash, shade, drawTileStatic, drawTileAnim, drawLandmark, ANIMATED_LANDMARKS, drawPerson, drawPortrait, drawEnemy, drawShard, drawHeart, drawScene, crystalShape, ell, rr };
})();
