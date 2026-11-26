import { CFG } from './config.js';
export const D = Object.freeze({ IDLE: 'IDLE', PATROL: 'PATROL', DETECT: 'DETECT PLAYER', TRACK: 'TRACK PLAYER', TARGET: 'TARGET PLAYER',
  CHARGE: 'CHARGE ATTACK', FIRE: 'FIRE LASER', COOLDOWN: 'COOLDOWN', REPOSITION: 'REPOSITION' });
export class Drone {
  constructor(x) { Object.assign(this, { x, y: -60, state: D.IDLE, t: 0, dir: 1, aimX: x, lockX: x, destX: x, facing: -1, bob: 0 }); this.set(D.IDLE); }
  set(s) { this.state = s; this.t = 0; }
  get beamVisible() { return [D.TARGET, D.CHARGE, D.FIRE].includes(this.state); }
  get firing() { return this.state === D.FIRE; }
  get impactX() { return this.state === D.TARGET ? this.aimX : this.lockX; }
  moveTo(x, speed, dt) { const d = x - this.x; if (Math.abs(d) > 1) { this.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt); this.facing = Math.sign(d) || this.facing; } return Math.abs(d); }
  update(dt, w) {
    const C = CFG.drone, p = w.player; this.t += dt; this.bob += dt;
    this.y += (C.y + Math.sin(this.bob * 2.2) * 8 - this.y) * Math.min(1, dt * 4);
    switch (this.state) {
      case D.IDLE: if (this.t > 0.9) this.set(D.PATROL); break;
      case D.PATROL:
        this.x += this.dir * C.patrolSpeed * dt; this.facing = this.dir;
        if (this.x < 90) this.dir = 1; if (this.x > CFG.W - 90) this.dir = -1;
        if (Math.abs(p.x - this.x) < C.detectRange && !p.stunned) { this.set(D.DETECT); w.notify('DRONE DETECTED', 1.8); w.sfx('detect'); }
        break;
      case D.DETECT: this.facing = Math.sign(p.x - this.x) || this.facing; if (this.t > C.detectTime) this.set(D.TRACK); break;
      case D.TRACK: this.moveTo(p.x, C.trackSpeed, dt); this.aimX = p.x; if (this.t > C.trackTime) this.set(D.TARGET); break;
      case D.TARGET:
        this.moveTo(p.x, C.trackSpeed * 0.5, dt); this.aimX += Math.sign(p.x - this.aimX) * Math.min(Math.abs(p.x - this.aimX), 300 * dt);
        if (Math.floor(this.t * 10) !== Math.floor((this.t - dt) * 10) && Math.floor(this.t * 10) % 3 === 0) w.sfx('target');
        if (this.t > C.targetTime) { this.lockX = this.aimX; this.set(D.CHARGE); } break;
      case D.CHARGE: if (this.t > C.chargeTime) { this.set(D.FIRE); w.sfx('laser'); w.fx.shake = 0.12; } break;
      case D.FIRE:
        if (p.y > CFG.FLOOR - 28) { if (Math.abs(p.x - this.lockX) < C.hitRadius) p.hurt(w); }
        if (this.t > C.fireTime) this.set(D.COOLDOWN); break;
      case D.COOLDOWN: if (this.t > C.cooldown) { this.destX = Math.max(90, Math.min(CFG.W - 90, p.x + (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 120))); this.set(D.REPOSITION); } break;
      case D.REPOSITION: this.moveTo(this.destX, C.patrolSpeed * 2, dt); if (this.t > C.repositionTime) this.set(D.PATROL); break;
    }
  }
}
