import { CFG } from './config.js';
export class Terminal {
  constructor() { this.reset(); }
  reset() { this.flying = []; this.processT = 0; this.glow = 0; }
  inZone(px) { return px >= CFG.terminal.zone[0] && px <= CFG.terminal.zone[1]; }
  deliver(fromX, fromY) { this.flying.push({ t: 0, fx: fromX, fy: fromY }); }
  update(dt, w) {
    this.processT = Math.max(0, this.processT - dt); this.glow = Math.max(0, this.glow - dt);
    this.flying = this.flying.filter(f => {
      f.t += dt / 0.7; if (f.t < 1) return true;
      w.stats.data += CFG.cube.value; w.stats.cubes++;
      this.processT = 0.6; this.glow = 0.6; w.sfx('process');
      const [cx, cy] = CFG.terminal.chamber; w.fx.burst(cx, cy, '#c8ff00', 16, 200); w.fx.popup('+' + CFG.cube.value + ' ' + CFG.dataUnit, cx, cy - 70, '#c8ff00');
      return false;
    });
  }
  flyPos(f) {
    const [cx, cy] = CFG.terminal.chamber, e = f.t * f.t * (3 - 2 * f.t);
    return { x: f.fx + (cx - f.fx) * e, y: f.fy + (cy - f.fy) * e - Math.sin(f.t * Math.PI) * 90 };
  }
}
