import { CFG } from './config.js';
let nextId = 1;
export class Conveyor {
  constructor() { this.reset(); }
  reset() { this.cubes = []; this.spawnT = 0.6; this.scroll = 0; }
  pos(t) { const [sx, sy] = CFG.belt.start, [ex, ey] = CFG.belt.end; return { x: sx + (ex - sx) * t, y: sy + (ey - sy) * t }; }
  update(dt) {
    const C = CFG.cube; this.scroll = (this.scroll + dt * 40) % 16;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.cubes.length < C.cap) { this.cubes.push({ id: nextId++, t: 0, state: 'belt' }); this.spawnT = C.spawnInterval; }
    else if (this.spawnT <= 0) this.spawnT = 0.5;
    this.cubes.sort((a, b) => b.t - a.t);
    let limit = 1;
    for (const c of this.cubes) { c.t = Math.min(limit, c.t + dt / C.beltTime); limit = c.t - C.gap; }
  }
  nearest(px, py) {
    let best = null, bd = CFG.cube.reach;
    for (const c of this.cubes) { const p = this.pos(c.t), d = Math.hypot(p.x - px, p.y - (py - 50)); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  take(cube) { const i = this.cubes.indexOf(cube); if (i < 0) return false; this.cubes.splice(i, 1); return true; }
}
