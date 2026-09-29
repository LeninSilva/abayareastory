/* Open Your Eyes — first-person encounter art.
 * When you speak to someone, the view becomes what you see: the person in front of you,
 * large and cel-shaded, against a flat silhouette of where you are. */
(function () {
  'use strict';
  const A = window.OYE_ART, INK = A.INK, cel = A.cel, shade = A.shade;

  function backdrop(ctx, w, h, bg, t) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, bg.sky || '#3b4a5c'); g.addColorStop(1, bg.low || '#9aa3a8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const hz = h * 0.78;
    ctx.lineWidth = 1.5; ctx.strokeStyle = INK;
    ctx.fillStyle = bg.far || '#56606b';
    for (let i = 0; i < 16; i++) { const bw = w / 14, bh = h * (0.12 + A.hash(i, bg.seed || 1, 2) * 0.3); ctx.beginPath(); ctx.rect(i * bw - 4, hz - bh, bw - 3, bh + 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = bg.ground || '#6b6f72'; ctx.fillRect(0, hz, w, h - hz); A.line(ctx, 0, hz, w, hz, INK, 1.5);
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.22; A.ell(ctx, ((i * 0.27 + t * 0.012) % 1.3 - 0.15) * w, hz - 10 - (i % 2) * 20, w * 0.3, 16, '#eef1f2'); }
    ctx.globalAlpha = 1;
  }

  function hat(ctx, look, cx, hy, R) {
    const hc = look.hatColor || '#2b2a30';
    const top = hy - R;
    switch (look.hat) {
      case 'top': cel(ctx, A.oval(cx, top + R * 0.18, R * 1.25, R * 0.2), hc, { lw: 2.5 }); cel(ctx, A.rect(cx - R * 0.72, top - R * 1.15, R * 1.44, R * 1.3), hc, { shadow: c => c.rect(cx + R * 0.2, top - R * 1.3, R, R * 1.5), lw: 2.5 }); ctx.fillStyle = look.hatBand || '#6b2a33'; ctx.fillRect(cx - R * 0.72, top - R * 0.02, R * 1.44, R * 0.16); break;
      case 'fedora': cel(ctx, A.oval(cx, top + R * 0.22, R * 1.35, R * 0.24), hc, { lw: 2.5 }); cel(ctx, c => { c.moveTo(cx - R * 0.75, top + R * 0.2); c.lineTo(cx - R * 0.68, top - R * 0.45); c.quadraticCurveTo(cx, top - R * 0.3, cx + R * 0.68, top - R * 0.45); c.lineTo(cx + R * 0.75, top + R * 0.2); c.closePath(); }, hc, { shadow: c => c.rect(cx + R * 0.2, top - R, R, R * 1.4), lw: 2.5 }); ctx.fillStyle = shade(hc, -0.35); ctx.fillRect(cx - R * 0.74, top + R * 0.02, R * 1.48, R * 0.14); break;
      case 'bowler': cel(ctx, A.oval(cx, top + R * 0.2, R * 1.15, R * 0.2), hc, { lw: 2.5 }); cel(ctx, c => { c.arc(cx, top + R * 0.2, R * 0.78, Math.PI, 0); c.closePath(); }, hc, { shadow: c => c.rect(cx + R * 0.2, top - R, R, R * 1.4), lw: 2.5 }); break;
      case 'cap': cel(ctx, c => { c.arc(cx, top + R * 0.35, R * 0.92, Math.PI, 0); c.closePath(); }, hc, { shadow: c => c.rect(cx + R * 0.25, top - R, R, R * 1.4), lw: 2.5 }); cel(ctx, A.oval(cx, top + R * 0.38, R * 1.05, R * 0.18), shade(hc, -0.2), { lw: 2.2 }); break;
      case 'pillbox': cel(ctx, A.rect(cx - R * 0.45, top - R * 0.2, R * 0.9, R * 0.45), hc, { shadow: c => c.rect(cx + R * 0.1, top - R * 0.3, R, R), lw: 2.4 }); ctx.fillStyle = '#d8b44a'; ctx.fillRect(cx - R * 0.45, top + R * 0.12, R * 0.9, R * 0.08); break;
      case 'navy': cel(ctx, A.oval(cx, top + R * 0.12, R * 0.95, R * 0.34), '#f2efe7', { shadow: c => c.rect(cx + R * 0.3, top - R, R, R * 1.4), lw: 2.4 }); break;
      case 'hard': cel(ctx, c => { c.arc(cx, top + R * 0.4, R * 1.02, Math.PI, 0); c.closePath(); }, '#d8a63a', { shadow: c => c.rect(cx + R * 0.3, top - R, R, R * 1.6), lw: 2.5 }); cel(ctx, A.oval(cx, top + R * 0.4, R * 1.2, R * 0.14), '#c4922d', { lw: 2 }); break;
      case 'fire': cel(ctx, c => { c.arc(cx, top + R * 0.4, R * 1.05, Math.PI, 0); c.closePath(); }, '#2b2a30', { shadow: c => c.rect(cx + R * 0.3, top - R, R, R * 1.6), lw: 2.5 }); cel(ctx, A.oval(cx, top + R * 0.42, R * 1.45, R * 0.2), '#2b2a30', { lw: 2.2 }); cel(ctx, A.rect(cx - R * 0.2, top - R * 0.5, R * 0.4, R * 0.5), '#c9a54a', { lw: 1.8 }); break;
      case 'beret': cel(ctx, A.oval(cx + R * 0.15, top + R * 0.12, R * 1.05, R * 0.38), hc, { shadow: c => c.rect(cx + R * 0.35, top - R, R, R * 1.4), lw: 2.4 }); break;
      case 'campaign': cel(ctx, A.oval(cx, top + R * 0.2, R * 1.45, R * 0.22), hc, { lw: 2.5 }); cel(ctx, A.poly([cx - R * 0.7, top + R * 0.2, cx - R * 0.3, top - R * 0.7, cx, top - R * 0.5, cx + R * 0.3, top - R * 0.7, cx + R * 0.7, top + R * 0.2]), hc, { shadow: c => c.rect(cx + R * 0.1, top - R, R, R * 1.4), lw: 2.5 }); break;
      case 'flat': cel(ctx, A.oval(cx, top + R * 0.2, R * 1.5, R * 0.22), hc, { lw: 2.5 }); cel(ctx, A.rect(cx - R * 0.66, top - R * 0.38, R * 1.32, R * 0.58), hc, { shadow: c => c.rect(cx + R * 0.2, top - R, R, R * 1.4), lw: 2.5 }); break;
      case 'nurse': cel(ctx, A.poly([cx - R * 0.7, top + R * 0.25, cx - R * 0.55, top - R * 0.3, cx + R * 0.55, top - R * 0.3, cx + R * 0.7, top + R * 0.25]), '#f2efe7', { lw: 2.3 }); ctx.fillStyle = '#b8412f'; ctx.fillRect(cx - R * 0.08, top - R * 0.22, R * 0.16, R * 0.34); ctx.fillRect(cx - R * 0.17, top - R * 0.13, R * 0.34, R * 0.16); break;
      case 'military': cel(ctx, A.oval(cx, top + R * 0.05, R * 1.05, R * 0.36), hc, { shadow: c => c.rect(cx + R * 0.3, top - R, R, R * 1.4), lw: 2.4 }); cel(ctx, A.oval(cx, top + R * 0.3, R * 0.8, R * 0.14), shade(hc, -0.35), { lw: 2 }); ctx.fillStyle = '#c9a54a'; A.ell(ctx, cx, top, R * 0.1, R * 0.1); break;
      case 'headband': ctx.fillStyle = hc; ctx.fillRect(cx - R * 0.86, hy - R * 0.55, R * 1.72, R * 0.16); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(cx - R * 0.86, hy - R * 0.55, R * 1.72, R * 0.16); break;
      case 'bonnet': cel(ctx, c => { c.arc(cx, hy - R * 0.1, R * 1.08, Math.PI * 0.95, Math.PI * 2.05); c.closePath(); }, hc, { shadow: c => c.rect(cx + R * 0.4, top - R, R, R * 2), lw: 2.4 }); break;
    }
  }

  function human(ctx, w, h, look, t) {
    const cx = w / 2, R = h * 0.2, hy = h * 0.4;
    const coat = look.coat || '#555';
    // torso
    cel(ctx, c => { c.moveTo(cx - R * 2.5, h + 2); c.quadraticCurveTo(cx - R * 2.3, hy + R * 1.5, cx - R * 0.9, hy + R * 1.25); c.lineTo(cx + R * 0.9, hy + R * 1.25); c.quadraticCurveTo(cx + R * 2.3, hy + R * 1.5, cx + R * 2.5, h + 2); c.closePath(); },
      coat, { shadow: c => c.rect(cx + R * 0.6, hy, R * 3, h), lw: 3 });
    const style = look.coatStyle || 'coat';
    if (style === 'suit' || style === 'coat' || style === 'uniform') {
      cel(ctx, A.poly([cx - R * 0.45, hy + R * 1.25, cx, hy + R * 2.3, cx + R * 0.45, hy + R * 1.25]), look.shirt || '#ece6d6', { lw: 2 });
      if (look.tie) cel(ctx, A.poly([cx - R * 0.1, hy + R * 1.4, cx + R * 0.1, hy + R * 1.4, cx + R * 0.16, hy + R * 2.2, cx, hy + R * 2.35, cx - R * 0.16, hy + R * 2.2]), look.tie, { lw: 1.6 });
      cel(ctx, A.poly([cx - R * 0.9, hy + R * 1.25, cx - R * 0.45, hy + R * 1.25, cx, hy + R * 2.4, cx - R * 0.5, hy + R * 2.6]), shade(coat, -0.12), { lw: 2 });
      cel(ctx, A.poly([cx + R * 0.9, hy + R * 1.25, cx + R * 0.45, hy + R * 1.25, cx, hy + R * 2.4, cx + R * 0.5, hy + R * 2.6]), shade(coat, -0.2), { lw: 2 });
      if (style === 'uniform') { ctx.fillStyle = look.accent || '#d8b44a'; for (let i = 0; i < 3; i++) A.ell(ctx, cx + R * 0.02, hy + R * (2.7 + i * 0.4), R * 0.07, R * 0.07); if (look.epaulets) { cel(ctx, A.rect(cx - R * 2, hy + R * 1.35, R * 0.8, R * 0.22), look.accent, { lw: 1.6 }); cel(ctx, A.rect(cx + R * 1.2, hy + R * 1.35, R * 0.8, R * 0.22), look.accent, { lw: 1.6 }); } }
    } else if (style === 'tshirt' || style === 'sweater') {
      cel(ctx, c => { c.arc(cx, hy + R * 1.15, R * 0.55, 0.15, Math.PI - 0.15); }, look.skin, { lw: 2 });
      if (look.print) { ctx.fillStyle = look.print; A.ell(ctx, cx, hy + R * 2.3, R * 0.45, R * 0.45); }
    } else if (style === 'dress' || style === 'shawl') {
      cel(ctx, c => { c.moveTo(cx - R * 0.9, hy + R * 1.25); c.quadraticCurveTo(cx, hy + R * 2.1, cx + R * 0.9, hy + R * 1.25); c.closePath(); }, look.shirt || shade(coat, 0.3), { lw: 2 });
      if (style === 'shawl') cel(ctx, c => { c.moveTo(cx - R * 2.2, h); c.quadraticCurveTo(cx - R * 1.4, hy + R * 1.2, cx, hy + R * 2.6); c.quadraticCurveTo(cx + R * 1.4, hy + R * 1.2, cx + R * 2.2, h); c.closePath(); }, look.accent || '#8a5a3c', { shadow: c => c.rect(cx + R * 0.5, hy, R * 3, h), lw: 2.4 });
    } else if (style === 'overalls') {
      cel(ctx, A.rect(cx - R * 0.9, hy + R * 2.1, R * 1.8, h), look.accent || '#3c5a7a', { lw: 2.2 });
      ctx.strokeStyle = INK; ctx.lineWidth = 2; A.line(ctx, cx - R * 0.8, hy + R * 2.1, cx - R * 1.2, hy + R * 1.3, look.accent || '#3c5a7a', R * 0.2); A.line(ctx, cx + R * 0.8, hy + R * 2.1, cx + R * 1.2, hy + R * 1.3, look.accent || '#3c5a7a', R * 0.2);
    } else if (style === 'robe') {
      cel(ctx, A.poly([cx - R * 0.6, hy + R * 1.2, cx, hy + R * 3, cx + R * 0.6, hy + R * 1.2]), shade(coat, 0.2), { lw: 2 });
    }
    if (look.necklace) { ctx.strokeStyle = look.necklace; ctx.lineWidth = R * 0.08; ctx.beginPath(); ctx.arc(cx, hy + R * 1.1, R * 0.7, 0.3, Math.PI - 0.3); ctx.stroke(); }
    // neck
    cel(ctx, A.rect(cx - R * 0.35, hy + R * 0.6, R * 0.7, R * 0.75), shade(look.skin, -0.12), { lw: 2.2 });
    // hair behind the head
    const hs = look.hairStyle || 'short';
    if (hs === 'long') for (const s of [-1, 1]) cel(ctx, c => { c.moveTo(cx + s * R * 0.6, hy - R * 0.7); c.quadraticCurveTo(cx + s * R * 1.25, hy + R * 0.2, cx + s * R * 1.1, hy + R * 1.75); c.lineTo(cx + s * R * 0.62, hy + R * 1.75); c.quadraticCurveTo(cx + s * R * 0.7, hy + R * 0.6, cx + s * R * 0.6, hy - R * 0.7); c.closePath(); }, look.hair, { lw: 2.4 });
    if (hs === 'afro') cel(ctx, A.circle(cx, hy - R * 0.25, R * 1.3), look.hair, { shadow: c => c.rect(cx + R * 0.4, hy - R * 2, R * 2, R * 3), lw: 2.5 });
    if (hs === 'curly') cel(ctx, A.oval(cx, hy - R * 0.2, R * 1.15, R * 1.2), look.hair, { lw: 2.5 });
    if (hs === 'bun') cel(ctx, A.circle(cx, hy - R * 1.05, R * 0.38), look.hair, { lw: 2.2 });
    // ears + head
    cel(ctx, A.oval(cx - R * 0.83, hy + R * 0.05, R * 0.17, R * 0.26), look.skin, { lw: 2 });
    cel(ctx, A.oval(cx + R * 0.83, hy + R * 0.05, R * 0.17, R * 0.26), shade(look.skin, -0.15), { lw: 2 });
    cel(ctx, A.oval(cx, hy, R * 0.82, R), look.skin, { shadow: c => { c.moveTo(cx + R * 0.25, hy - R * 1.2); c.quadraticCurveTo(cx + R * 0.05, hy, cx + R * 0.35, hy + R * 1.2); c.lineTo(cx + R, hy + R * 1.2); c.lineTo(cx + R, hy - R * 1.2); c.closePath(); }, lw: 3 });
    // hair on top
    if (hs !== 'bald') {
      const top = c => {
        if (hs === 'wild') { c.moveTo(cx - R * 0.95, hy - R * 0.05); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; const rr = R * (1.1 + (i % 2) * 0.25); c.lineTo(cx + Math.cos(a) * rr, hy - R * 0.2 + Math.sin(a) * rr); } c.lineTo(cx + R * 0.95, hy - R * 0.05); c.quadraticCurveTo(cx, hy - R * 0.75, cx - R * 0.95, hy - R * 0.05); }
        else if (hs === 'side') { c.moveTo(cx - R * 0.86, hy - R * 0.1); c.quadraticCurveTo(cx - R * 0.9, hy - R * 1.12, cx, hy - R * 1.05); c.quadraticCurveTo(cx + R * 0.95, hy - R * 1.05, cx + R * 0.86, hy - R * 0.2); c.quadraticCurveTo(cx + R * 0.2, hy - R * 0.75, cx - R * 0.35, hy - R * 0.55); c.quadraticCurveTo(cx - R * 0.7, hy - R * 0.45, cx - R * 0.86, hy - R * 0.1); }
        else if (hs === 'receding') { c.moveTo(cx - R * 0.84, hy - R * 0.05); c.quadraticCurveTo(cx - R * 0.82, hy - R * 0.62, cx - R * 0.55, hy - R * 0.78); c.lineTo(cx - R * 0.6, hy - R * 0.2); c.closePath(); c.moveTo(cx + R * 0.84, hy - R * 0.05); c.quadraticCurveTo(cx + R * 0.82, hy - R * 0.62, cx + R * 0.55, hy - R * 0.78); c.lineTo(cx + R * 0.6, hy - R * 0.2); c.closePath(); }
        else { c.moveTo(cx - R * 0.86, hy - R * 0.05); c.quadraticCurveTo(cx - R * 0.95, hy - R * 1.15, cx, hy - R * 1.08); c.quadraticCurveTo(cx + R * 0.95, hy - R * 1.15, cx + R * 0.86, hy - R * 0.05); c.quadraticCurveTo(cx + R * 0.7, hy - R * 0.6, cx + R * 0.2, hy - R * 0.62); c.quadraticCurveTo(cx - R * 0.5, hy - R * 0.5, cx - R * 0.86, hy - R * 0.05); }
      };
      cel(ctx, top, look.hair, { shadow: c => c.rect(cx + R * 0.3, hy - R * 2, R * 2, R * 2), lw: 2.6 });
    }
    // face
    const eyeY = hy + R * 0.05, ex = R * 0.34;
    for (const s of [-1, 1]) {
      cel(ctx, A.oval(cx + s * ex, eyeY, R * 0.14, R * 0.1), '#f4efe6', { lw: 1.6 });
      A.ell(ctx, cx + s * ex + R * 0.02, eyeY + R * 0.01, R * 0.065, R * 0.075, look.eyes || '#2a2230');
      ctx.strokeStyle = look.brow || shade(look.hair || '#333', -0.2); ctx.lineWidth = R * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + s * (ex - R * 0.16), eyeY - R * 0.2); ctx.lineTo(cx + s * (ex + R * 0.14), eyeY - R * (look.frown ? 0.14 : 0.24)); ctx.stroke(); ctx.lineCap = 'butt';
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - R * 0.02, eyeY + R * 0.12); ctx.lineTo(cx - R * 0.1, eyeY + R * 0.38); ctx.lineTo(cx + R * 0.05, eyeY + R * 0.4); ctx.stroke();
    const smile = look.smile == null ? 0.08 : look.smile;
    ctx.beginPath(); ctx.moveTo(cx - R * 0.24, hy + R * 0.58); ctx.quadraticCurveTo(cx, hy + R * (0.58 + smile * 2), cx + R * 0.24, hy + R * 0.58); ctx.lineWidth = 2.2; ctx.stroke();
    if (look.glasses) { ctx.strokeStyle = INK; ctx.lineWidth = 2.2; for (const s of [-1, 1]) { ctx.beginPath(); look.glasses === 'round' ? ctx.arc(cx + s * ex, eyeY, R * 0.21, 0, Math.PI * 2) : ctx.rect(cx + s * ex - R * 0.22, eyeY - R * 0.15, R * 0.44, R * 0.3); ctx.stroke(); } A.line(ctx, cx - ex + R * 0.21, eyeY, cx + ex - R * 0.21, eyeY, INK, 2); }
    const bc = look.beardColor || look.hair || '#333';
    if (look.beard === 'mustache' || look.beard === 'walrus') cel(ctx, c => { c.moveTo(cx - R * (look.beard === 'walrus' ? 0.45 : 0.3), hy + R * 0.58); c.quadraticCurveTo(cx, hy + R * 0.3, cx + R * (look.beard === 'walrus' ? 0.45 : 0.3), hy + R * 0.58); c.quadraticCurveTo(cx, hy + R * 0.48, cx - R * (look.beard === 'walrus' ? 0.45 : 0.3), hy + R * 0.58); }, bc, { lw: 2 });
    if (look.beard === 'full' || look.beard === 'mutton') cel(ctx, c => { c.moveTo(cx - R * 0.8, hy + R * 0.1); c.quadraticCurveTo(cx - R * 0.8, hy + R * 1.35, cx, hy + R * 1.4); c.quadraticCurveTo(cx + R * 0.8, hy + R * 1.35, cx + R * 0.8, hy + R * 0.1); c.lineTo(cx + R * 0.55, hy + R * 0.45); c.quadraticCurveTo(cx, hy + R * 0.35, cx - R * 0.55, hy + R * 0.45); c.closePath(); }, bc, { shadow: c => c.rect(cx + R * 0.2, hy, R, R * 2), lw: 2.4 });
    if (look.beard === 'goatee') cel(ctx, A.oval(cx, hy + R * 0.85, R * 0.2, R * 0.2), bc, { lw: 1.8 });
    if (look.mask) { cel(ctx, A.rounded(cx - R * 0.7, hy + R * 0.28, R * 1.4, R * 0.62, R * 0.2), '#f1eee6', { shadow: c => c.rect(cx + R * 0.2, hy, R, R), lw: 2.4 }); A.line(ctx, cx - R * 0.7, hy + R * 0.4, cx - R * 0.86, hy + R * 0.1, INK, 1.6); A.line(ctx, cx + R * 0.7, hy + R * 0.4, cx + R * 0.86, hy + R * 0.1, INK, 1.6); }
    if (hs === 'braid') for (let i = 0; i < 5; i++) cel(ctx, A.oval(cx + R * (0.78 + i * 0.05), hy + R * (0.35 + i * 0.3), R * 0.17, R * 0.2), look.hair, { lw: 1.8 });
    if (look.hat) hat(ctx, look, cx, hy, R);
  }

  function animal(ctx, w, h, look, t) {
    const cx = w / 2, R = h * 0.22, hy = h * 0.5;
    if (look.kind === 'dog') {
      cel(ctx, A.oval(cx, h, R * 2, R * 1.2), look.coat, { shadow: c => c.rect(cx + R * 0.5, h - R * 2, R * 3, R * 3), lw: 3 });
      cel(ctx, A.poly([cx - R * 0.9, hy - R * 0.5, cx - R * 1.3, hy - R * 1.6, cx - R * 0.3, hy - R * 0.9]), shade(look.coat, -0.3), { lw: 2.5 });
      cel(ctx, A.poly([cx + R * 0.9, hy - R * 0.5, cx + R * 1.3, hy - R * 1.6, cx + R * 0.3, hy - R * 0.9]), shade(look.coat, -0.3), { lw: 2.5 });
      cel(ctx, A.oval(cx, hy, R, R * 0.95), look.coat, { shadow: c => c.rect(cx + R * 0.3, hy - R * 2, R * 2, R * 4), lw: 3 });
      cel(ctx, A.oval(cx, hy + R * 0.5, R * 0.55, R * 0.42), shade(look.coat, 0.25), { lw: 2.2 });
      A.ell(ctx, cx, hy + R * 0.3, R * 0.16, R * 0.12, INK);
      for (const s of [-1, 1]) A.ell(ctx, cx + s * R * 0.4, hy - R * 0.15, R * 0.1, R * 0.12, INK);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - R * 0.2, hy + R * 0.7); ctx.quadraticCurveTo(cx, hy + R * 0.82, cx + R * 0.2, hy + R * 0.7); ctx.stroke();
      if (Math.sin(t * 4) > 0.3) cel(ctx, A.oval(cx + R * 0.1, hy + R * 0.95, R * 0.14, R * 0.2), '#d9707a', { lw: 1.6 });
    } else if (look.kind === 'bear') {
      cel(ctx, A.oval(cx, h + R * 0.2, R * 2.6, R * 1.6), '#7a5638', { shadow: c => c.rect(cx + R * 0.5, h - R * 2, R * 3, R * 3), lw: 3 });
      for (const s of [-1, 1]) cel(ctx, A.circle(cx + s * R * 0.9, hy - R * 0.85, R * 0.35), '#6a4a30', { lw: 2.5 });
      cel(ctx, A.oval(cx, hy, R * 1.15, R * 1.05), '#7a5638', { shadow: c => c.rect(cx + R * 0.35, hy - R * 2, R * 2, R * 4), lw: 3 });
      cel(ctx, A.oval(cx, hy + R * 0.45, R * 0.55, R * 0.42), '#c9a57e', { lw: 2.2 });
      A.ell(ctx, cx, hy + R * 0.28, R * 0.17, R * 0.12, INK);
      for (const s of [-1, 1]) A.ell(ctx, cx + s * R * 0.45, hy - R * 0.15, R * 0.09, R * 0.1, INK);
    } else if (look.kind === 'gator') {
      cel(ctx, c => { c.moveTo(cx - R * 2.6, hy + R * 0.6); c.quadraticCurveTo(cx - R * 1.8, hy - R * 0.7, cx, hy - R * 0.55); c.lineTo(cx + R * 2.4, hy + R * 0.05); c.lineTo(cx + R * 2.4, hy + R * 0.5); c.lineTo(cx, hy + R * 0.7); c.quadraticCurveTo(cx - R * 1.6, hy + R * 1.2, cx - R * 2.6, hy + R * 0.6); c.closePath(); }, '#efe9dc', { shadow: c => c.rect(cx - R * 3, hy + R * 0.25, R * 6, R), lw: 3 });
      A.ell(ctx, cx - R * 0.3, hy - R * 0.25, R * 0.14, R * 0.14, '#e2708a'); A.ell(ctx, cx - R * 0.3, hy - R * 0.25, R * 0.06, R * 0.1, INK);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx + R * (0.3 + i * 0.32), hy + R * 0.3); ctx.lineTo(cx + R * (0.45 + i * 0.32), hy + R * 0.48); ctx.lineTo(cx + R * (0.6 + i * 0.32), hy + R * 0.3); ctx.fill(); }
      cel(ctx, A.oval(cx, h, R * 2.4, R * 0.7), '#e4ddcf', { lw: 3 });
    }
  }

  // look: the character; bg: backdrop colours; t: seconds; dim: when the line is my own thought
  function drawEncounter(ctx, w, h, look, bg, t, dim) {
    ctx.clearRect(0, 0, w, h);
    backdrop(ctx, w, h, bg || {}, t);
    if (!look || look.kind === 'voice') { return; }
    ctx.save();
    const ghost = look.ghost !== false;
    const sway = Math.sin(t * 1.2) * h * 0.006;
    ctx.translate(0, sway);
    if (ghost) ctx.globalAlpha = 0.92;
    if (look.kind === 'dog' || look.kind === 'bear' || look.kind === 'gator') animal(ctx, w, h, look, t); else human(ctx, w, h, look, t);
    ctx.restore();
    if (ghost) {
      // cold rim light and a faint scanline shimmer: the plane they live on
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(160,220,230,.16)'); g.addColorStop(0.4, 'rgba(160,220,230,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let y = (t * 20) % 6; y < h; y += 6) ctx.fillRect(0, y, w, 1.5);
    }
    if (dim) { ctx.fillStyle = 'rgba(10,14,20,.45)'; ctx.fillRect(0, 0, w, h); }
    const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  }

  window.OYE_BUST = { drawEncounter };
})();
