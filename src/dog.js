import { CFG } from './config.js';
export class K9 {
  constructor() { Object.assign(this, { x: -60, y: CFG.FLOOR, dir: 1, anim: 0, entering: true }); }
  update(dt, w) {
    const C = CFG.k9; this.anim += dt;
    this.x += this.dir * C.speed * (this.entering ? 1.6 : 1) * dt;
    if (this.entering && this.x > C.minX) this.entering = false;
    if (!this.entering) { if (this.x > C.maxX) this.dir = -1; if (this.x < C.minX) this.dir = 1; }
    const p = w.player;
    if (p.y > CFG.FLOOR - 34 && Math.abs(p.x - this.x) < C.hitRadius) p.hurt(w);
  }
  sprite() { return 'dog_run' + (Math.floor(this.anim / 0.09) % 4 + 1); }
}
