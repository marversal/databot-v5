import { CFG } from './config.js';
import { Input } from './input.js';
export class Player {
  constructor() { this.reset(); }
  reset() {
    Object.assign(this, { x: 560, y: CFG.FLOOR, vx: 0, vy: 0, facing: 1, onGround: true, carrying: 0, energy: CFG.energy,
      stunT: 0, invT: 0, landT: 0, airT: 0, act: null, anim: 0, jumpBuf: 0, stepT: 0, hitFlash: 0 });
  }
  get stunned() { return this.stunT > 0; }
  update(dt, w) {
    const P = CFG.player, can = w.canControl() && !this.stunned;
    const dir = can ? (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0) : 0;
    const k = this.onGround ? 1 : 0.75;
    if (dir) { this.vx += dir * P.accel * k * dt; this.facing = dir; if (Math.sign(this.vx) !== dir) this.vx += dir * P.decel * dt * 0.5; }
    else { const d = P.decel * dt; this.vx = Math.abs(this.vx) <= d ? 0 : this.vx - Math.sign(this.vx) * d; }
    this.vx = Math.max(-P.maxSpeed, Math.min(P.maxSpeed, this.vx));
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    if (can && Input.hit('jump')) this.jumpBuf = 0.1;
    if (can && this.jumpBuf > 0 && this.onGround) { this.vy = -P.jumpV; this.onGround = false; this.jumpBuf = 0; w.sfx('jump'); }
    if (can && !Input.held('jump') && this.vy < -330) this.vy *= 0.55;
    if (!this.onGround) {
      this.vy += P.gravity * (this.vy > 0 ? P.fallMul : 1) * dt; this.y += this.vy * dt;
      if (this.y >= CFG.FLOOR) {
        const hard = this.vy > 300; this.y = CFG.FLOOR; this.vy = 0; this.onGround = true;
        if (hard) { this.landT = 0.12; w.sfx('land'); w.fx.burst(this.x, this.y, '#39ff14', 5, 80); }
      }
    }
    this.x = Math.max(P.minX, Math.min(P.maxX, this.x + this.vx * dt));
    if (this.onGround && Math.abs(this.vx) > 120) { this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.26; w.sfx('step'); } }
    this.airT = this.onGround ? 0 : this.airT + dt; if (this.act && (this.act.t += dt) > this.act.dur) this.act = null;
    this.landT = Math.max(0, this.landT - dt); this.stunT = Math.max(0, this.stunT - dt);
    this.invT = Math.max(0, this.invT - dt); this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.anim += dt * (Math.abs(this.vx) > P.maxSpeed * P.runThreshold ? 1.6 : 1);
    if (can && Input.hit('grab')) w.interact();
  }
  hurt(w) {
    if (this.invT > 0 || this.stunT > 0 || !w.hostile()) return false;
    this.energy = Math.max(0, this.energy - 1); this.stunT = CFG.stunTime; this.invT = CFG.invulnTime; this.hitFlash = 0.2;
    if (this.carrying) { w.fx.popup('CUBE LOST', this.x, this.y - 150, '#ff2a4a'); this.carrying = 0; }
    this.vx = 0; this.vy = -280; this.onGround = false;
    w.sfx('stun'); w.fx.screenFlash('#ff2a4a', 0.3); w.fx.shake = 0.25; w.fx.burst(this.x, this.y - 60, '#ff2a4a', 14, 220);
    if (this.energy <= 0) w.gameOver('SYSTEM FAILURE - ENERGY DEPLETED');
    return true;
  }
  startAction(type) { this.act = { type, t: 0, dur: type === 'pickup' ? 0.42 : 0.32 }; }
  get lifting() { return this.act && this.act.type === 'pickup' && this.act.t >= 0.16; }
  sprite() {
    const side = this.facing < 0 ? 'L' : 'R';
    if (this.stunned) return 'databot_air_' + side;
    if (this.act && this.onGround) {
      if (this.act.type === 'pickup') return 'databot_' + (this.act.t < 0.16 ? 'reach_' : 'lift_') + side;
      return 'databot_reach_' + side;
    }
    if (!this.onGround) return this.carrying > 0 ? 'databot_carry_' + side : 'databot_' + (this.airT < 0.14 && this.vy < 0 ? 'launch_' : 'air_') + side;
    return (this.carrying > 0 ? 'databot_carry_' : 'databot_run_') + side;
  }
  bob() { return this.onGround && Math.abs(this.vx) > 30 ? Math.abs(Math.sin(this.anim * 11)) * 6 : 0; }
}
