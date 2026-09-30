// Sound, synthesized: wind and surf, the foghorns, footsteps, blows, murmurs, and a slow score.
export class Audio {
  constructor() { this.ctx = null; this.vol = { master: 0.8, music: 0.5, fx: 0.8 }; this.muted = false; this.nextHorn = 20; this.nextChord = 0; this.chordI = 0; }
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.connect(this.master);
    this.fxBus = c.createGain(); this.fxBus.connect(this.master);
    const rev = c.createConvolver(); rev.buffer = this._impulse(2.8); const revGain = c.createGain(); revGain.gain.value = 0.35; rev.connect(revGain); revGain.connect(this.master); this.rev = rev;
    // noise buffer
    const n = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noise = n;
    // wind: filtered noise with slow movement
    const wind = c.createBufferSource(); wind.buffer = n; wind.loop = true;
    this.windF = c.createBiquadFilter(); this.windF.type = 'bandpass'; this.windF.frequency.value = 400; this.windF.Q.value = 0.6;
    this.windG = c.createGain(); this.windG.gain.value = 0.05; wind.connect(this.windF); this.windF.connect(this.windG); this.windG.connect(this.fxBus); wind.start();
    // surf
    const surf = c.createBufferSource(); surf.buffer = n; surf.loop = true; this.surfF = c.createBiquadFilter(); this.surfF.type = 'lowpass'; this.surfF.frequency.value = 700;
    this.surfG = c.createGain(); this.surfG.gain.value = 0; surf.connect(this.surfF); this.surfF.connect(this.surfG); this.surfG.connect(this.fxBus); surf.start();
    this.apply();
  }
  _impulse(sec) { const c = this.ctx, len = c.sampleRate * sec, b = c.createBuffer(2, len, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); } return b; }
  apply() { if (!this.ctx) return; const m = this.muted ? 0 : this.vol.master; this.master.gain.value = m; this.musicBus.gain.value = this.vol.music * 0.5; this.fxBus.gain.value = this.vol.fx; }
  // env: { t, sea (0..1 closeness to water), height, night, wind }
  update(dt, env) {
    if (!this.ctx) return; const c = this.ctx, now = c.currentTime;
    this.windG.gain.setTargetAtTime(0.03 + Math.min(0.12, env.height / 2000) + Math.sin(env.t * 0.13) * 0.015, now, 0.8);
    this.windF.frequency.setTargetAtTime(300 + Math.sin(env.t * 0.21) * 150 + env.height, now, 1);
    this.surfG.gain.setTargetAtTime(env.sea * 0.12 * (0.7 + 0.3 * Math.sin(env.t * 0.5)), now, 0.5);
    this.nextHorn -= dt;
    if (this.nextHorn < 0 && env.fog > 0.3) { this.horn(); this.nextHorn = 40 + Math.random() * 50; }
    this.nextChord -= dt;
    if (this.nextChord < 0) { this.chord(env.night, env.under); this.nextChord = 9 + Math.random() * 5; }
  }
  tone(freq, dur, type = 'sine', gain = 0.2, bus = this.fxBus, attack = 0.01, toRev = false) {
    if (!this.ctx) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); if (toRev) g.connect(this.rev); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  noiseHit(dur, freq, gain, q = 1) {
    if (!this.ctx) return; const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    s.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.fxBus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  horn() { // the two-tone diaphone of the Golden Gate
    if (!this.ctx) return; const c = this.ctx;
    [[175, 0], [147, 1.6]].forEach(([f, d]) => setTimeout(() => { const o = this.tone(f, 1.8, 'sawtooth', 0.05, this.fxBus, 0.2, true); }, d * 1000));
  }
  chord(night, under) {
    const roots = under ? [110, 103.8, 98, 92.5] : night ? [130.8, 116.5, 103.8, 98] : [146.8, 130.8, 164.8, 123.5];
    const r = roots[this.chordI++ % roots.length], ints = [1, 1.5, 2, 2.4, 3];
    ints.forEach((k, i) => this.tone(r * k, 10, i % 2 ? 'triangle' : 'sine', 0.035 / (1 + i * 0.3), this.musicBus, 2.5, true));
  }
  // the jetpack: a roar of filtered noise with a low hum under it, following thrust
  jet(level) {
    if (!this.ctx) return; const c = this.ctx, now = c.currentTime;
    if (!this.jetG) {
      if (level <= 0) return;
      const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
      this.jetF = c.createBiquadFilter(); this.jetF.type = 'lowpass'; this.jetF.frequency.value = 400; this.jetF.Q.value = 0.8;
      this.jetG = c.createGain(); this.jetG.gain.value = 0; s.connect(this.jetF); this.jetF.connect(this.jetG); this.jetG.connect(this.fxBus); s.start();
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 48; this.jetO = o; const og = c.createGain(); og.gain.value = 0.18; const of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 160;
      o.connect(of); of.connect(og); og.connect(this.jetF); o.start();
    }
    this.jetG.gain.setTargetAtTime(level * 0.16, now, 0.15);
    this.jetF.frequency.setTargetAtTime(300 + level * 1500, now, 0.2);
    this.jetO.frequency.setTargetAtTime(40 + level * 40, now, 0.2);
  }
  jetStart() { this.noiseHit(0.5, 600, 0.25, 0.6); this.tone(60, 0.5, 'sawtooth', 0.08); }
  step(surface) { this.noiseHit(0.08, surface === 'stone' ? 1800 : 900, 0.06, 2); }
  swing() { this.noiseHit(0.18, 2400, 0.08, 0.7); }
  hit() { this.noiseHit(0.12, 500, 0.25, 1); this.tone(90, 0.2, 'sine', 0.2); }
  hurt() { this.tone(70, 0.4, 'sawtooth', 0.12); }
  block() { this.tone(900, 0.15, 'square', 0.05); this.noiseHit(0.1, 3000, 0.1, 3); }
  chime() { [660, 880, 990].forEach((f, i) => setTimeout(() => this.tone(f, 1.2, 'sine', 0.08, this.fxBus, 0.01, true), i * 90)); }
  bell() { [220, 440, 553, 660].forEach(f => this.tone(f, 4, 'sine', 0.07, this.fxBus, 0.005, true)); }
  murmur() { for (let i = 0; i < 6; i++) setTimeout(() => this.noiseHit(0.4, 500 + Math.random() * 900, 0.05, 6), i * 140); }
  ui() { this.tone(520, 0.08, 'sine', 0.05); }
  hollow() { this.tone(55 + Math.random() * 20, 1.4, 'sawtooth', 0.04, this.fxBus, 0.3, true); }
  flare() { this.noiseHit(0.6, 1200, 0.3, 0.5); this.tone(880, 0.8, 'sine', 0.1, this.fxBus, 0.01, true); }
}
