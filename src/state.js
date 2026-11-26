export const S = Object.freeze({
  INITIALIZING: 'INITIALIZING', START: 'START SCREEN', PHASE1: 'PHASE 1: DATA LOADING', TRANSITION: 'PHASE TRANSITION',
  PHASE2: 'PHASE 2: DRONE THREAT', GAMEOVER: 'GAME OVER',
});
const ALLOWED = {
  [S.INITIALIZING]: [S.START], [S.START]: [S.PHASE1], [S.PHASE1]: [S.TRANSITION, S.GAMEOVER, S.START],
  [S.TRANSITION]: [S.PHASE2, S.GAMEOVER, S.START], [S.PHASE2]: [S.GAMEOVER, S.START], [S.GAMEOVER]: [S.PHASE1, S.START],
};
export class StateManager {
  constructor() { this.current = S.INITIALIZING; this.time = 0; this.listeners = []; }
  on(fn) { this.listeners.push(fn); }
  go(next) {
    if (!(ALLOWED[this.current] || []).includes(next)) return false;
    const prev = this.current; this.current = next; this.time = 0; this.listeners.forEach(f => f(next, prev)); return true;
  }
  tick(dt) { this.time += dt; }
  is(...s) { return s.includes(this.current); }
  get playing() { return this.is(S.PHASE1, S.PHASE2); }
}
