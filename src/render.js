import { CFG } from './config.js';
import { S } from './state.js';
import { D } from './drone.js';
import { drawText, textWidth, loadFont } from './font.js';
import { COL, drawHeader, drawPrompt } from './hud.js';

const POSES = ['launch', 'air', 'reach', 'lift'];
const NAMES = ['databot_run_L', 'databot_run_R', 'databot_carry_L', 'databot_carry_R', ...POSES.flatMap(p => ['databot_' + p + '_L', 'databot_' + p + '_R']),
  'dog_run1', 'dog_run2', 'dog_run3', 'dog_run4', 'drone_fly1', 'drone_fly2', 'drone_shoot', 'drone_tilt', 'cube'];
export const img = {}; const bgs = {};
export function loadAssets() {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('missing ' + src)); i.src = src; });
  return Promise.all([loadFont(), ...NAMES.map(n => load('assets/sprites/' + n + '.png').then(i => { img[n] = i; })),
    load('assets/bg/layout.png').then(i => { bgs.layout = i; }), load('assets/bg/splash.png').then(i => { bgs.splash = i; })]);
}
export const SIZE = { databotK: 0.378, poseK: 0.33, dogH: 76, droneW: 150, cubeBelt: 46 };
const databotH = (name) => img[name].height * (/_(launch|air|reach|lift)_/.test(name) ? SIZE.poseK : SIZE.databotK);
const PLAYER_H = 190;

const tintCv = document.createElement('canvas'), tintCtx = tintCv.getContext('2d');
// Draws a sprite scaled to a target height (or width), anchored bottom-centre (default) or centre.
function spr(ctx, name, x, y, { h = null, w = null, flip = false, alpha = 1, tint = null, anchor = 'bottom', rot = 0 } = {}) {
  const i = img[name], k = h ? h / i.height : w / i.width, dw = i.width * k, dh = i.height * k;
  let src = i;
  if (tint) {
    tintCv.width = i.width; tintCv.height = i.height; tintCtx.clearRect(0, 0, i.width, i.height);
    tintCtx.drawImage(i, 0, 0); tintCtx.globalCompositeOperation = 'source-atop'; tintCtx.fillStyle = tint; tintCtx.fillRect(0, 0, i.width, i.height);
    tintCtx.globalCompositeOperation = 'source-over'; src = tintCv;
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(src, -dw / 2, anchor === 'bottom' ? -dh : -dh / 2, dw, dh); ctx.restore();
}
function shadow(ctx, x, w) {
  const g = ctx.createRadialGradient(x, CFG.FLOOR, 2, x, CFG.FLOOR, w / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.65)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.translate(0, CFG.FLOOR); ctx.scale(1, 0.22); ctx.translate(0, -CFG.FLOOR); ctx.fillStyle = g; ctx.fillRect(x - w / 2, CFG.FLOOR - w / 2, w, w); ctx.restore();
}
function dashed(ctx, x0, y0, x1, y1, color, on) {
  const n = 28; ctx.fillStyle = color;
  for (let i = 0; i < n; i++) { if (i % 2 && !on) continue; const t = i / n; ctx.fillRect(x0 + (x1 - x0) * t - 2, y0 + (y1 - y0) * t - 2, 4, 4); }
}
function ring(ctx, x, r, color, w = 3) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(x, CFG.FLOOR + 2, r, r * 0.25, 0, 0, 6.283); ctx.stroke();
}
function glow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(200,255,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function droneSprite(d, t) {
  if (d.state === D.FIRE) return 'drone_shoot';
  if (d.state === D.TARGET || d.state === D.CHARGE) return 'drone_tilt';
  return Math.floor(t / 0.28) % 2 ? 'drone_fly2' : 'drone_fly1';
}
function drawLaser(ctx, d, t) {
  if (!d.beamVisible) return;
  const x0 = d.x, y0 = d.y + 38, x1 = d.impactX, y1 = CFG.FLOOR;
  if (d.state === D.TARGET) { dashed(ctx, x0, y0, x1, y1, '#ff2a4a', true); ring(ctx, x1, 52 - Math.min(10, d.t * 8), 'rgba(255,42,74,0.9)'); }
  else if (d.state === D.CHARGE) {
    const on = Math.floor(t * 14) % 2 === 0; dashed(ctx, x0, y0, x1, y1, on ? '#ffffff' : '#ff2a4a', true);
    ring(ctx, x1, CFG.drone.hitRadius, on ? '#ffffff' : '#ff2a4a', 4);
    ctx.fillStyle = 'rgba(255,42,74,0.25)'; ctx.fillRect(x1 - CFG.drone.hitRadius, CFG.FLOOR - 2, CFG.drone.hitRadius * 2, 6);
  } else {
    ctx.save();
    for (const [w, c] of [[24, 'rgba(255,42,74,0.35)'], [12, '#ff2a4a'], [5, '#ffffff']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    ctx.restore(); ring(ctx, x1, CFG.drone.hitRadius + 8, '#ff2a4a', 5);
  }
}

export const START_BTN = { x: 208, y: 458, w: 582, h: 78 };
function drawStart(ctx, w, t) {
  ctx.drawImage(bgs.splash, 0, 0, CFG.W, CFG.H);
  const b = START_BTN, pulse = 0.5 + 0.5 * Math.sin(t * 5);
  ctx.save(); ctx.shadowColor = '#c8ff00'; ctx.shadowBlur = 10 + 14 * pulse; ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.65 * pulse})`; ctx.lineWidth = 4;
  ctx.strokeRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8); ctx.restore();
  drawText(ctx, 'ENTER / SPACE / CLICK TO START   E : GRAB-LOAD', 512, 589, 1.5, COL.hi, { align: 'center' });
}

export const REPLAY = { x: 392, y: 440, w: 240, h: 52 };
function drawGameOver(ctx, w, t) {
  ctx.fillStyle = 'rgba(0,0,0,0.84)'; ctx.fillRect(22, 90, 980, 500);
  const bx = 212, by = 160, bw = 600, bh = 380; ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = COL.g; ctx.lineWidth = 6; ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6); ctx.strokeStyle = COL.dim; ctx.lineWidth = 2; ctx.strokeRect(bx + 14, by + 14, bw - 28, bh - 28);
  drawText(ctx, 'GAME OVER', 512, by + 40, 9, COL.g, { align: 'center', shadow: '#0b4a06' });
  drawText(ctx, w.gameOverReason, 512, by + 118, 1.7, w.gameOverReason.startsWith('TIME') ? COL.hi : COL.red, { align: 'center' });
  ctx.fillStyle = COL.dim; ctx.fillRect(bx + 40, by + 150, bw - 80, 2);
  drawText(ctx, 'DATA LOADED: ' + w.stats.data + ' ' + CFG.dataUnit, 512, by + 182, 3, COL.g, { align: 'center' });
  drawText(ctx, 'CUBES DELIVERED: ' + w.stats.cubes, 512, by + 224, 3, COL.g, { align: 'center' });
  const r = REPLAY, on = Math.floor(t * 3) % 2 === 0; r.y = by + 280; ctx.fillStyle = on ? COL.g : '#1c9a0c'; ctx.fillRect(r.x, r.y, r.w, r.h);
  drawText(ctx, 'REPLAY', 512, r.y + 15, 4, '#000', { align: 'center' });
  drawText(ctx, 'PRESS ENTER OR CLICK REPLAY', 512, by + 346, 1.4, COL.dim, { align: 'center' });
}

function drawSheet(ctx) {
  ctx.drawImage(bgs.layout, 0, 0, CFG.W, CFG.H); ctx.fillStyle = '#000'; ctx.fillRect(22, 56, 980, 27); ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(22, 90, 980, 500);
  const tw = textWidth('DATABOT SPRITE SHEET', 4) + 28; ctx.fillStyle = COL.g; ctx.fillRect(512 - tw / 2, 100, tw, 36);
  drawText(ctx, 'DATABOT SPRITE SHEET', 512, 108, 4, '#000', { align: 'center' });
  const rows = [
    [['databot_run_L', 'RUN'], ['databot_carry_L', 'CARRY'], ['databot_launch_L', 'JUMP LAUNCH'], ['databot_air_R', 'AIRBORNE'], ['databot_reach_L', 'GRAB REACH'], ['databot_lift_L', 'GRAB LIFT']],
    [['drone_fly1', 'DRONE FLY'], ['drone_shoot', 'LASER SHOOT'], ['drone_tilt', 'LASER TILT'], ['dog_run1', 'K9 RUN 1'], ['dog_run3', 'K9 RUN 3'], ['cube', 'DATA CUBE']]];
  rows.forEach((row, r) => row.forEach(([n, label], i) => {
    const cx = 100 + i * 165, top = 148 + r * 215;
    ctx.fillStyle = '#000'; ctx.fillRect(cx - 76, top, 152, 200); ctx.strokeStyle = COL.g; ctx.lineWidth = 3; ctx.strokeRect(cx - 75, top + 1, 150, 198);
    const im = img[n] || null; if (!im) return;
    const k = Math.min(120 / im.width, (n === 'cube' ? 90 : 130) / im.height); spr(ctx, n, cx, top + 150, { h: im.height * k });
    drawText(ctx, label, cx, top + 170, 1.4, COL.hi, { align: 'center' });
  }));
}

export function draw(ctx, w, t) {
  ctx.setTransform(CFG.OUT_W / CFG.W, 0, 0, CFG.OUT_H / CFG.H, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (w.sheet) { drawSheet(ctx); return; }
  if (w.state.is(S.START, S.INITIALIZING)) { drawStart(ctx, w, t); return; }
  ctx.save();
  if (w.fx.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  ctx.fillStyle = '#000'; ctx.fillRect(-10, -10, CFG.W + 20, CFG.H + 20); ctx.drawImage(bgs.layout, 0, 0, CFG.W, CFG.H);
  const T = CFG.terminal, [cx, cy] = T.chamber, p = w.player;
  const cubes = [...w.conveyor.cubes].sort((a, b) => a.t - b.t), grab = w.nearGrab();
  cubes.forEach(c => {
    const q = w.conveyor.pos(c.t), qy = q.y - SIZE.cubeBelt * 0.42;
    if (c === grab) { glow(ctx, q.x, qy, 46, Math.floor(t * 6) % 2 ? 'rgba(200,255,0,0.55)' : 'rgba(57,255,20,0.4)'); }
    spr(ctx, 'cube', q.x, qy, { w: SIZE.cubeBelt, anchor: 'center' });
  });
  if (w.terminal.glow > 0) { const k = w.terminal.glow / 0.6; glow(ctx, cx, cy, 80, `rgba(200,255,0,${0.55 * k})`); spr(ctx, 'cube', cx, cy, { w: T.cubeWidth, anchor: 'center', alpha: Math.min(1, k * 1.6) }); }
  w.terminal.flying.forEach(f => { const q = w.terminal.flyPos(f); spr(ctx, 'cube', q.x, q.y, { w: T.cubeWidth * (0.6 + 0.4 * f.t), anchor: 'center' }); });
  if (w.state.playing && w.inTerminalZone() && Math.floor(t * 3) % 2) {
    ctx.fillStyle = COL.hi; ctx.beginPath(); ctx.moveTo(cx - 12, 366); ctx.lineTo(cx + 12, 366); ctx.lineTo(cx, 384); ctx.fill();
  }
  w.dogs.forEach(d => { shadow(ctx, d.x, 90); spr(ctx, d.sprite(), d.x, d.y, { h: SIZE.dogH, flip: d.dir > 0 }); });
  shadow(ctx, p.x, 80 - Math.min(30, (CFG.FLOOR - p.y) / 5));
  const blink = p.invT > 0 && !p.stunned && Math.floor(t * 14) % 2;
  if (!blink) {
    const tint = p.hitFlash > 0 ? '#ffffff' : (p.stunned && Math.floor(t * 10) % 2 ? 'rgba(255,42,74,0.45)' : null);
    const sn = p.sprite();
    spr(ctx, sn, p.x + (p.stunned ? Math.sin(t * 70) * 3 : 0), p.y - p.bob(), { h: databotH(sn), tint, rot: p.onGround && Math.abs(p.vx) > 30 ? Math.sin(p.anim * 11) * 0.03 : 0 });
  }
  if (p.lifting && !blink) spr(ctx, 'cube', p.x + p.facing * 62, p.y - 150 - Math.sin(Math.min(1, (p.act.t - 0.16) / 0.26) * Math.PI) * 6, { w: 40, anchor: 'center' });
  w.drones.forEach(d => {
    drawLaser(ctx, d, t); shadow(ctx, d.x, 50);
    spr(ctx, droneSprite(d, t), d.x, d.y, { w: SIZE.droneW, flip: d.facing > 0, anchor: 'center', rot: d.state === D.TARGET || d.state === D.CHARGE ? 0.04 * d.facing : 0 });
    if (d.state === D.CHARGE || d.state === D.FIRE) glow(ctx, d.x, d.y + 36, 22, 'rgba(255,42,74,0.9)');
  });
  w.fx.parts.forEach(q => { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.color; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }); ctx.globalAlpha = 1;
  if (w.state.playing) {
    if (p.stunned) drawText(ctx, 'STUNNED', p.x, p.y - PLAYER_H - 26, 3, COL.red, { align: 'center', shadow: '#000' });
    else if (w.inTerminalZone()) drawPrompt(ctx, '[E] LOAD BELT', p.x, p.y - PLAYER_H - 14, t);
    else if (grab) drawPrompt(ctx, '[E] GRAB CUBE', p.x, p.y - PLAYER_H - 14, t);
  }
  w.fx.pops.forEach(q => drawText(ctx, q.text, q.x, q.y, 2, q.color, { align: 'center', shadow: '#000' }));
  drawHeader(ctx, w, t);
  if (w.notice && !w.state.is(S.GAMEOVER)) {
    const alert = w.notice.text === 'DRONE DETECTED', sc = alert ? 4 : 3, tw = textWidth(w.notice.text, sc) + 40;
    if (!alert || Math.floor(t * 5) % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(512 - tw / 2, 108, tw, 22 + sc * 8); ctx.strokeStyle = alert ? COL.red : COL.g; ctx.lineWidth = 3; ctx.strokeRect(512 - tw / 2 + 1, 109, tw - 2, 20 + sc * 8);
      drawText(ctx, w.notice.text, 512, 119, sc, alert ? COL.red : COL.g, { align: 'center' });
    }
  }
  if (w.state.is(S.TRANSITION)) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(22, 230, 980, 140);
    ctx.fillStyle = COL.red; ctx.fillRect(22, 228, 980, 3); ctx.fillRect(22, 370, 980, 3);
    drawText(ctx, 'PHASE 2: DRONE THREAT', 512, 262, 5.4, COL.red, { align: 'center', shadow: '#300' });
    drawText(ctx, 'LOADING COMPLETE - HOSTILE DRONE INBOUND', 512, 332, 1.8, COL.g, { align: 'center' });
  }
  if (w.state.is(S.GAMEOVER)) drawGameOver(ctx, w, t);
  if (w.fx.flash) { ctx.globalAlpha = (w.fx.flash.life / w.fx.flash.max) * 0.4; ctx.fillStyle = w.fx.flash.color; ctx.fillRect(0, 0, CFG.W, CFG.H); ctx.globalAlpha = 1; }
  ctx.restore();
}
