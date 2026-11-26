import { CFG } from './config.js';
import { S } from './state.js';
import { drawText, textWidth } from './font.js';

export const COL = { g: '#39ff14', hi: '#c8ff00', dim: '#1f8a10', red: '#ff2a4a', yel: '#ffe600', blk: '#000' };
const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
export const pad = (n, l = 6) => String(Math.floor(n)).padStart(l, '0');

// Draws the live HUD over the baked status strip of DATABOT_LAYOUT.png.
export function drawHeader(ctx, w, t) {
  const p2 = w.inP2 || w.state.is(S.PHASE2);
  ctx.fillStyle = '#000'; ctx.fillRect(22, 56, 980, 27);
  drawText(ctx, p2 ? 'PHASE 2: DRONE THREAT' : 'PHASE 1: DATA LOADING', 34, 30, 2.4, p2 ? COL.red : COL.g);
  drawText(ctx, 'ARROWS MOVE  SPACE JUMP  E GRAB/LOAD', 992, 33, 1.6, COL.dim, { align: 'right' });

  const left = p2 ? w.surviveLeft : w.loadLeft, low = left <= 10 && Math.floor(t * 3) % 2;
  const sc = 2, u = 10, y = 63, cell = 15, cells = CFG.energy;
  const segs = [
    { s: '[ ENERGY : ' }, { cells: true },
    { s: ' // DATA LOADED : ' + pad(w.stats.data) + ' ' + CFG.dataUnit },
    { s: ' // ' + (p2 ? 'SURVIVAL' : 'STACK TIMER') + ' : ' + mmss(left), c: low ? COL.yel : COL.g },
    { s: ' // DRONES DETECTED : ' + pad(w.drones.length, 2) + ' ]', c: w.drones.length ? COL.red : COL.g },
  ];
  const total = segs.reduce((a, g) => a + (g.cells ? cells * cell + 4 : g.s.length * u), 0);
  let x = Math.round(512 - total / 2);
  for (const g of segs) {
    if (g.cells) {
      for (let i = 0; i < cells; i++) {
        const on = i < w.player.energy, bx = x + i * cell;
        ctx.strokeStyle = COL.g; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 1, y - 1, 9, 11);
        if (on) { ctx.fillStyle = (i === w.player.energy - 1 && w.player.invT > 0 && Math.floor(t * 8) % 2) ? COL.red : COL.g; ctx.fillRect(bx + 1, y - 1, 9, 11); }
      }
      x += cells * cell + 4;
    } else x += drawText(ctx, g.s, x, y, sc, g.c || COL.g);
  }
}

export function drawFooter() {}

export function drawPrompt(ctx, text, x, y, t) {
  const w = textWidth(text, 2) + 18, bx = Math.round(x - w / 2), by = Math.round(y - 14);
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(bx, by, w, 28); ctx.strokeStyle = COL.g; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, w - 2, 26);
  drawText(ctx, text, x, y - 5, 2, Math.floor(t * 4) % 2 ? COL.hi : COL.g, { align: 'center' });
}
