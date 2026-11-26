import { CFG } from './config.js';
import { S } from './state.js';
import { D, Drone } from './drone.js';
import { K9 } from './dog.js';
import { Input } from './input.js';

export function installDebug(world, ctl) {
  window.__DATABOT = {
    world, CFG, S, D, Input,
    step(sec) { for (let i = 0; i < Math.round(sec * 60); i++) { world.update(1 / 60); Input.endFrame(); } },
    scene(name) {
      const w = world; if (w.state.is(S.START) && name !== 'start') w.begin();
      const goPhase = (target) => { while (!w.state.is(target)) { if (w.state.is(S.PHASE1)) w.state.go(S.TRANSITION); else if (w.state.is(S.TRANSITION)) w.state.go(S.PHASE2); else break; } };
      w.fx.reset(); w.notice = null;
      if (name === 'sheet') { w.sheet = true; return; }
      if (name === 'start') { if (!w.state.is(S.START)) { w.gameOver('x'); w.state.go(S.START); } return; }
      if (name === 'load') { w.stats = { data: 256, cubes: 4 }; w.loadLeft = 42; w.player.x = 330; w.player.carrying = 0; w.conveyor.cubes = [0.99, 0.82, 0.55, 0.3, 0.08].map((t, i) => ({ id: 90 + i, t, state: 'belt' })); w.notice = null; }
      if (name === 'carry') { w.stats = { data: 256, cubes: 4 }; w.loadLeft = 38; w.player.x = 770; w.player.carrying = 1; w.player.facing = 1; w.conveyor.cubes = [0.7, 0.4, 0.15].map((t, i) => ({ id: 80 + i, t, state: 'belt' })); w.notice = null; }
      if (name === 'grab') { w.stats = { data: 192, cubes: 3 }; w.loadLeft = 45; w.player.x = 300; w.player.facing = 1; w.player.carrying = 1; w.player.startAction('pickup'); w.player.act.t = 0.3; w.conveyor.cubes = [0.9, 0.6, 0.3].map((t, i) => ({ id: 50 + i, t, state: 'belt' })); w.notice = null; }
      if (name === 'reach') { w.stats = { data: 192, cubes: 3 }; w.loadLeft = 45; w.player.x = 300; w.player.facing = 1; w.player.carrying = 0; w.player.startAction('pickup'); w.player.act.t = 0.05; w.conveyor.cubes = [0.99, 0.7, 0.4].map((t, i) => ({ id: 40 + i, t, state: 'belt' })); w.notice = null; }
      if (name === 'jump') { w.stats = { data: 192, cubes: 3 }; w.loadLeft = 44; w.player.x = 520; w.player.facing = 1; w.player.carrying = 0; w.player.onGround = false; w.player.y = CFG.FLOOR - 70; w.player.vy = -200; w.player.airT = 0.4; w.conveyor.cubes = [0.8, 0.5, 0.2].map((t, i) => ({ id: 30 + i, t, state: 'belt' })); w.notice = null; }
      if (name === 'deliver') { w.stats = { data: 320, cubes: 5 }; w.loadLeft = 35; w.player.x = 800; w.player.carrying = 0; w.terminal.glow = 0.5; w.terminal.processT = 0.5; w.conveyor.cubes = [0.6, 0.3].map((t, i) => ({ id: 70 + i, t, state: 'belt' })); }
      if (name === 'detect' || name === 'laser' || name === 'stun' || name === 'over') {
        w.stats = { data: 576, cubes: 9 }; w.loadLeft = 0; goPhase(S.PHASE2); w.inP2 = true; w.surviveLeft = 44; w.player.energy = 4; w.conveyor.cubes = [0.5, 0.2].map((t, i) => ({ id: 60 + i, t, state: 'belt' }));
        w.player.x = 520; w.player.carrying = 1; const d = w.drones[0]; d.x = 520; d.y = CFG.drone.y; if (w.dogs[0]) Object.assign(w.dogs[0], { x: 420, entering: false, dir: -1 });
        if (name === 'detect') { d.set(D.DETECT); w.notify('DRONE DETECTED', 5); d.x = 620; }
        if (name === 'laser') { d.set(D.FIRE); d.t = 0.1; d.lockX = 700; d.aimX = 700; d.x = 640; w.player.x = 460; w.player.invT = 0; }
        if (name === 'stun') { d.set(D.COOLDOWN); d.x = 520; w.player.carrying = 0; w.player.invT = 0; w.player.hurt(w); w.player.energy = 3; w.player.vy = 0; w.player.onGround = true; w.player.y = CFG.FLOOR; w.player.stunT = 1.1; w.player.hitFlash = 0; w.fx.flash = null; }
        if (name === 'over') { w.surviveLeft = 0; w.stats = { data: 1152, cubes: 18 }; w.gameOver('TIME EXPIRED - DRONE PATROL COMPLETE'); }
        if (name !== 'detect') w.notice = null; if (name !== 'stun') w.fx.flash = null;
      }
    },
    freeze() { ctl.pause(true); },
  };
  const q = new URLSearchParams(location.search).get('scene');
  if (q) { window.__DATABOT.scene(q); window.__DATABOT.freeze(); }
}
