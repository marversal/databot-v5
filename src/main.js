import { CFG } from './config.js';
import { World } from './game.js';
import { Input } from './input.js';
import { Audio8 } from './audio.js';
import { S } from './state.js';
import { loadAssets, draw, REPLAY, START_BTN } from './render.js';
import { installDebug } from './debug.js';

const cv = document.getElementById('game'), ctx = cv.getContext('2d');
cv.width = CFG.OUT_W; cv.height = CFG.OUT_H;
const world = new World();
let last = 0, running = false, raf = 0, acc = 0, stopped = false;

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!stopped) { world.update(dt); Input.endFrame(); }
  draw(ctx, world, world.clock);
}
function pause(v) { stopped = v; if (v) Input.clear(); last = performance.now(); }
document.addEventListener('visibilitychange', () => pause(document.hidden));
addEventListener('blur', () => Input.clear());
addEventListener('keydown', () => Audio8.unlock());
cv.addEventListener('pointerdown', (e) => {
  Audio8.unlock();
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * CFG.W, y = (e.clientY - r.top) / r.height * CFG.H;
  if (world.state.is(S.START)) world.begin();
  else if (world.state.is(S.GAMEOVER) && x >= REPLAY.x && x <= REPLAY.x + REPLAY.w && y >= REPLAY.y && y <= REPLAY.y + REPLAY.h) world.begin();
});

Input.bind();
loadAssets().then(() => {
  world.boot(); installDebug(world, { pause });
  last = performance.now(); raf = requestAnimationFrame(frame);
}).catch((e) => { document.body.insertAdjacentHTML('beforeend', '<pre style="color:#39ff14">' + e.message + '</pre>'); });
