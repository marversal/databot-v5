// Automated play-test driven by real key/mouse events in headless Chrome. Usage: node tools/playtest.mjs [url]
import { launch } from './cdp.mjs';
const b = await launch(process.argv[2] || 'http://localhost:8123/');
const E = (x) => b.eval(x), log = [], ok = (n, c, d = '') => { log.push((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); if (!c) process.exitCode = 1; };
const W = 'window.__DATABOT.world';
const hold = async (k, ms) => { await b.key('keyDown', k); await b.sleep(ms); await b.key('keyUp', k); };
const tap = async (k, ms = 60) => hold(k, ms);
const until = async (cond, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await E(cond)) return true; await b.sleep(40); } return false; };

ok('T01 init: no runtime errors, start screen', (await E(`${W}.state.current`)) === 'START SCREEN' && b.errors.length === 0);
await b.shot('/tmp/pt_start.png');
await tap('Enter');
ok('start -> PHASE 1', (await E(`${W}.state.current`)) === 'PHASE 1: DATA LOADING');

const x0 = await E(`${W}.player.x`); await hold('ArrowRight', 400); const x1 = await E(`${W}.player.x`); await hold('ArrowLeft', 400); const x2 = await E(`${W}.player.x`);
ok('T02 move right/left', x1 > x0 + 40 && x2 < x1 - 40, `x ${x0.toFixed(0)} -> ${x1.toFixed(0)} -> ${x2.toFixed(0)}`);

let minY = 9999; await b.key('keyDown', ' '); const t0 = Date.now(); let jumps = 0, prevAir = false; const poses = new Set();
while (Date.now() - t0 < 1400) { const s = JSON.parse(await E(`JSON.stringify({y:${W}.player.y,g:${W}.player.onGround})`)); minY = Math.min(minY, s.y); poses.add(await E(`${W}.player.sprite()`)); if (!s.g && !prevAir) jumps++; prevAir = !s.g; await b.sleep(16); }
await b.key('keyUp', ' ');
ok('jump uses launch + airborne poses', [...poses].some(p => /launch/.test(p)) && [...poses].some(p => /air/.test(p)), [...poses].join(','));
const land = await E(`[${W}.player.y, ${W}.player.onGround]`);
ok('T03 jump, fall, land; held key does not re-jump', minY < 552 - 60 && land[1] && land[0] === 552 && jumps === 1, `peak ${(552 - minY).toFixed(0)}px, airborne episodes ${jumps}`);

await E(`${W}.conveyor.cubes.length`).then(async () => { const got = await until(`${W}.conveyor.cubes.length>0`, 6000); ok('T04 conveyor spawns cubes', got); });
await E(`window.__DATABOT.Input.clear()`);
await hold('ArrowLeft', 2200);
const px = await E(`${W}.player.x`); ok('walk to belt end', px < 330, `x=${px.toFixed(0)}`);
const ready = await until(`${W}.conveyor.cubes.some(c=>c.t>0.98)`, 12000);
await b.shot('/tmp/pt_belt.png');
await tap('e'); const poseA = await E(`${W}.player.sprite()`); await b.sleep(260); const poseB = await E(`${W}.player.sprite()`);
ok('grab reach then lift poses used on pickup', /reach/.test(poseA) && /lift/.test(poseB), poseA + ' -> ' + poseB);
const car = await E(`${W}.player.carrying`);
ok('T05 collect cube with E', ready && car === 1, `carrying=${car}`);
await hold('ArrowRight', 2400);
ok('prompt/zone at terminal', await E(`${W}.inTerminalZone()`), `x=${(await E(`${W}.player.x`)).toFixed(0)}`);
await b.shot('/tmp/pt_zone.png');
await tap('e'); await b.sleep(1100);
const st = await E(`JSON.stringify(${W}.stats)`); const car2 = await E(`${W}.player.carrying`);
ok('T06/T07 deliver, counters update', st === '{"data":64,"cubes":1}' && car2 === 0, st);
await tap('e'); await b.sleep(900);
ok('no double delivery', (await E(`JSON.stringify(${W}.stats)`)) === st);

await E(`window.__DATABOT.Input.clear(); ${W}.loadLeft=2`);
ok('T08 load timer -> TRANSITION', await until(`${W}.state.current==='PHASE TRANSITION'`, 5000));
const xt = await E(`${W}.player.x`); await hold('ArrowLeft', 300);
ok('input disabled during transition', Math.abs((await E(`${W}.player.x`)) - xt) < 5);
await b.shot('/tmp/pt_transition.png');
ok('-> PHASE 2', await until(`${W}.state.current==='PHASE 2: DRONE THREAT'`, 5000));

const seen = new Set(); let detect = false; const t1 = Date.now();
while (Date.now() - t1 < 14000 && !(await E(`${W}.player.stunned`))) { seen.add(await E(`${W}.drones[0].state`)); if (await E(`${W}.notice&&${W}.notice.text`) === 'DRONE DETECTED') detect = true; if (seen.has('CHARGE ATTACK') && !globalThis.sh) { globalThis.sh = 1; await b.shot('/tmp/pt_charge.png'); } await b.sleep(30); }
seen.add(await E(`${W}.drones[0].state`));
ok('T09/T10 drone detects, tracks, targets, charges, fires', detect && ['DETECT PLAYER', 'TRACK PLAYER', 'TARGET PLAYER', 'CHARGE ATTACK', 'FIRE LASER'].every(s => seen.has(s)), [...seen].join(','));
const stunned = await E(`${W}.player.stunned`); const en = await E(`${W}.player.energy`);
await b.shot('/tmp/pt_stun.png');
ok('T12 stationary player is stunned (energy -1)', stunned && en === 4, `energy=${en}`);
const sx = await E(`${W}.player.x`); await hold('ArrowRight', 250);
ok('stun blocks movement', Math.abs((await E(`${W}.player.x`)) - sx) < 3);
ok('stun expires, control restored', await until(`!${W}.player.stunned`, 3000) && (await (async () => { const a = await E(`${W}.player.x`); await hold('ArrowRight', 300); return (await E(`${W}.player.x`)) > a + 20; })()));

// T11 evasion: respond to the telegraph by running / jumping
for (const mode of ['run', 'jump']) {
  globalThis.j = 0;
  await E(`${W}.player.invT=0;${W}.player.energy=5;${W}.player.x=500;${W}.dogs.length=0;`);
  const e0 = await E(`${W}.player.energy`); let fired = false; const t2 = Date.now();
  while (Date.now() - t2 < 14000) {
    const s = await E(`${W}.drones[0].state`);
    if (s === 'CHARGE ATTACK' && !fired) { fired = true; if (mode === 'run') await b.key('keyDown', await E(`${W}.player.x>600`) ? 'ArrowLeft' : 'ArrowRight'); }
    if (s === 'CHARGE ATTACK' && mode === 'jump' && !globalThis.j) { globalThis.j = 1; await b.sleep(420); await hold(' ', 400); }
    if (fired && s === 'COOLDOWN') break; await b.sleep(15);
  }
  await b.key('keyUp', 'ArrowLeft'); await b.key('keyUp', 'ArrowRight');
  ok(`T11 evade by ${mode === 'run' ? 'moving' : 'jumping'}`, fired && (await E(`${W}.player.energy`)) === e0, `energy ${await E(`${W}.player.energy`)}`);
}

await E(`${W}.surviveLeft=1.5; ${W}.player.energy=5`);
const gm = await until(`${W}.state.current==='GAME OVER'`, 5000);
const rs = await E(`JSON.stringify([${W}.stats, ${W}.gameOverReason])`);
await b.sleep(300); await b.shot('/tmp/pt_gameover.png');
ok('T13/T14 survival ends -> GAME OVER with TIME EXPIRED', gm && rs.includes('TIME EXPIRED'), rs);
ok('T15 results reflect real stats', rs.includes('"data":64') && rs.includes('"cubes":1'));
const go = await E(`${W}.state.current`); await E(`${W}.gameOver('again')`); ok('game over fires once', (await E(`${W}.gameOverReason`)).startsWith('TIME'));

// T16 replay via real mouse click on the REPLAY button (canvas 2048x1323 => 2x logical)
await b.click(2 * 512, 1323 * 466 / 662);
ok('T16 REPLAY click restarts', await until(`${W}.state.current==='PHASE 1: DATA LOADING'`, 2000));
const r = JSON.parse(await E(`JSON.stringify({s:${W}.stats,l:${W}.loadLeft,d:${W}.drones.length,k:${W}.dogs.length,c:${W}.conveyor.cubes.length,e:${W}.player.energy,car:${W}.player.carrying})`));
ok('replay resets state, no leftover enemies/objects', r.s.data === 0 && r.s.cubes === 0 && r.d === 0 && r.k === 0 && r.e === 5 && r.car === 0 && r.c <= 1 && r.l > 59, JSON.stringify(r));
const c0 = await E(`${W}.clock`), p0 = Date.now(); await b.sleep(2000); const c1 = await E(`${W}.clock`);
ok('no duplicated loop/listeners after replay (clock rate ~1x)', Math.abs((c1 - c0) / ((Date.now() - p0) / 1000) - 1) < 0.15, `rate ${((c1 - c0) / ((Date.now() - p0) / 1000)).toFixed(2)}`);
await E(`${W}.loadLeft=0`); await until(`${W}.state.current==='PHASE 2: DRONE THREAT'`, 6000);
ok('2nd session: exactly 1 drone + 1 K9', (await E(`${W}.drones.length`)) === 1 && (await E(`${W}.dogs.length`)) === 1);

// IDLE RETURN: 2 minutes (CFG.idleTimeout) without input -> splash + clean reset; any input starts again
ok('idle timeout configured at 120s', (await E(`__DATABOT.CFG.idleTimeout`)) === 120);
await E(`${W}.stats.data=999; ${W}.stats.cubes=9; ${W}.idleT = __DATABOT.CFG.idleTimeout - 1.0`);
await b.key('keyDown', 'ArrowLeft'); await b.key('keyUp', 'ArrowLeft'); await b.sleep(1800);
ok('input resets the idle timer (no return)', (await E(`${W}.state.current`)) !== 'START SCREEN' && (await E(`${W}.idleT`)) < 5);
await E(`${W}.idleT = __DATABOT.CFG.idleTimeout - 1.0`); await b.sleep(1600);
const ir = JSON.parse(await E(`JSON.stringify({s:${W}.state.current,st:${W}.stats,d:${W}.drones.length,k:${W}.dogs.length,c:${W}.conveyor.cubes.length,e:${W}.player.energy,car:${W}.player.carrying,l:${W}.loadLeft,sv:${W}.surviveLeft,p2:${W}.inP2})`));
ok('T17 idle 120s returns to splash with clean reset', ir.s === 'START SCREEN' && ir.st.data === 0 && ir.st.cubes === 0 && ir.d === 0 && ir.k === 0 && ir.c === 0 && ir.e === 5 && ir.car === 0 && ir.l === 60 && ir.sv === 60 && !ir.p2, JSON.stringify(ir));
await b.shot('/tmp/pt_idle_splash.png');
await b.key('keyDown', 'q'); await b.key('keyUp', 'q');
ok('T18 any key from splash starts a new session', await until(`${W}.state.current==='PHASE 1: DATA LOADING'`, 2000));
await E(`${W}.idleT = __DATABOT.CFG.idleTimeout - 0.5`); await b.sleep(1200);
ok('idle also fires from an active session again (no double start / stale timers)', (await E(`${W}.state.current`)) === 'START SCREEN');
await b.click(1024, 660); ok('click on splash starts', await until(`${W}.state.current==='PHASE 1: DATA LOADING'`, 2000));
const c2 = await E(`${W}.clock`), pp = Date.now(); await b.sleep(2000); const c3 = await E(`${W}.clock`);
ok('loop rate still ~1x after idle resets', Math.abs((c3 - c2) / ((Date.now() - pp) / 1000) - 1) < 0.15);
ok('no runtime errors during run', b.errors.length === 0, b.errors.join(' | '));
console.log(log.join('\n')); b.close();
