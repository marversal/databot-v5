export class FX {
  constructor() { this.reset(); }
  reset() { this.parts = []; this.pops = []; this.flash = null; this.shake = 0; }
  burst(x, y, color, n = 10, speed = 160) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = speed * (0.4 + Math.random() * 0.6);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.5, max: 0.5, color }); }
  }
  popup(text, x, y, color) { this.pops.push({ text, x, y, color, life: 1.1 }); }
  screenFlash(color, dur = 0.25) { this.flash = { color, life: dur, max: dur }; }
  update(dt) {
    this.parts = this.parts.filter(p => (p.life -= dt) > 0);
    this.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; });
    this.pops = this.pops.filter(p => (p.life -= dt) > 0); this.pops.forEach(p => p.y -= 28 * dt);
    if (this.flash && (this.flash.life -= dt) <= 0) this.flash = null;
    this.shake = Math.max(0, this.shake - dt);
  }
}
