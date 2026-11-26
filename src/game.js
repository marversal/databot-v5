import { CFG } from './config.js';
import { S, StateManager } from './state.js';
import { Input } from './input.js';
import { Audio8 } from './audio.js';
import { Player } from './player.js';
import { Conveyor } from './conveyor.js';
import { Terminal } from './terminal.js';
import { Drone } from './drone.js';
import { K9 } from './dog.js';
import { FX } from './fx.js';

export class World {
  constructor() {
    this.state = new StateManager(); this.player = new Player(); this.conveyor = new Conveyor(); this.terminal = new Terminal();
    this.fx = new FX(); this.drones = []; this.dogs = []; this.notice = null; this.gameOverReason = ''; this.clock = 0; this.inP2 = false; this.idleT = 0;
    this.stats = { data: 0, cubes: 0 }; this.loadLeft = CFG.loadTime; this.surviveLeft = CFG.surviveTime;
    this.state.on((next, prev) => this.onState(next, prev));
  }
  sfx(n) { Audio8.play(n); }
  canControl() { return this.state.playing; }
  hostile() { return this.state.is(S.PHASE2); }
  notify(text, dur = 1.5) { this.notice = { text, life: dur }; }
  boot() { this.state.go(S.START); }
  resetSession() {
    this.player.reset(); this.conveyor.reset(); this.terminal.reset(); this.fx.reset();
    this.drones = []; this.dogs = []; this.notice = null; this.gameOverReason = ''; this.inP2 = false; this.paused = false;
    this.stats = { data: 0, cubes: 0 }; this.loadLeft = CFG.loadTime; this.surviveLeft = CFG.surviveTime;
  }
  begin() {
    if (this.state.is(S.START, S.GAMEOVER)) { const replay = this.state.is(S.GAMEOVER); this.resetSession(); Input.clear(); this.sfx(replay ? 'replay' : 'start'); this.state.go(S.PHASE1); }
  }
  onState(next) {
    if (next === S.PHASE1) this.notify('PHASE 1: DATA LOADING', 1.6);
    if (next === S.TRANSITION) { this.sfx('phase'); this.fx.screenFlash('#c8ff00', 0.5); }
    if (next === S.PHASE2) {
      this.inP2 = true;
      this.drones = Array.from({ length: CFG.drone.count }, (_, i) => new Drone(CFG.W * (0.3 + 0.4 * i)));
      this.dogs = Array.from({ length: CFG.k9.count }, () => new K9());
    }
    if (next === S.GAMEOVER) { this.sfx('gameover'); this.drones = []; this.dogs = []; }
  }
  gameOver(reason) {
    if (this.state.is(S.GAMEOVER)) return;
    this.gameOverReason = reason; this.state.go(S.GAMEOVER);
  }
  nearGrab() {
    if (this.player.carrying >= CFG.carryCapacity || this.player.stunned) return null;
    return this.conveyor.nearest(this.player.x, this.player.y);
  }
  inTerminalZone() { return this.player.carrying > 0 && this.terminal.inZone(this.player.x); }
  interact() {
    const p = this.player;
    if (this.inTerminalZone()) {
      p.carrying--; p.startAction('load'); this.terminal.deliver(p.x + p.facing * 20, p.y - 70); this.sfx('deliver');
      this.fx.burst(p.x, p.y - 70, '#c8ff00', 6, 100); return;
    }
    const c = this.nearGrab();
    if (c && this.conveyor.take(c)) { p.carrying++; p.startAction('pickup'); this.sfx('pickup'); const q = this.conveyor.pos(c.t); this.fx.burst(q.x, q.y - 20, '#39ff14', 8, 120); }
  }
  returnToStart() {
    this.resetSession(); Input.clear(); this.sheet = false;
    this.state.go(S.START); this.idleT = 0;
  }
  update(dt) {
    if (this.state.is(S.PHASE1, S.TRANSITION, S.PHASE2) && Input.hit('pause')) { this.paused = !this.paused; Input.clear(); }
    if (this.paused) { this.idleT = 0; return; }
    this.clock += dt;
    if (Input.activity() || Input.anyHeld()) this.idleT = 0; else this.idleT += dt;
    if (this.idleT >= CFG.idleTimeout && !this.state.is(S.START, S.INITIALIZING)) { this.returnToStart(); return; } this.state.tick(dt); this.fx.update(dt);
    if (this.notice && (this.notice.life -= dt) <= 0) this.notice = null;
    if (Input.hit('mute')) Audio8.toggleMute();
    if (Input.hit('volup')) Audio8.setVolume(Audio8.volume + 0.1);
    if (Input.hit('voldown')) Audio8.setVolume(Audio8.volume - 0.1);
    const st = this.state;
    if (st.is(S.START)) { if (Input.activity()) this.begin(); return; }
    if (st.is(S.GAMEOVER)) { if (Input.hit('confirm')) this.begin(); this.player.update(dt, this); return; }
    if (st.is(S.TRANSITION)) {
      this.player.update(dt, this); this.terminal.update(dt, this);
      if (st.time >= CFG.transitionTime) st.go(S.PHASE2); return;
    }
    this.player.update(dt, this); this.conveyor.update(dt); this.terminal.update(dt, this);
    if (st.is(S.PHASE1)) { this.loadLeft = Math.max(0, this.loadLeft - dt); if (this.loadLeft <= 0) st.go(S.TRANSITION); }
    else if (st.is(S.PHASE2)) {
      this.drones.forEach(d => d.update(dt, this)); this.dogs.forEach(d => d.update(dt, this));
      this.surviveLeft = Math.max(0, this.surviveLeft - dt);
      if (this.surviveLeft <= 0) this.gameOver('TIME EXPIRED - DRONE PATROL COMPLETE');
    }
  }
}
