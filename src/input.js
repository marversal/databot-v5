const down = new Set(), pressed = new Set(), anyDown = new Set(); let activity = false;
const MAP = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'jump', ' ': 'jump', w: 'jump', e: 'grab', enter: 'confirm', r: 'confirm', m: 'mute', '+': 'volup', '=': 'volup', '-': 'voldown', _: 'voldown' };
let bound = false;
const onDown = (ev) => {
  activity = true; anyDown.add(ev.key);
  const a = MAP[ev.key.toLowerCase()]; if (!a) return;
  if (ev.key.startsWith('Arrow') || ev.key === ' ') ev.preventDefault();
  if (!down.has(a)) pressed.add(a);
  down.add(a);
};
const onUp = (ev) => { activity = true; anyDown.delete(ev.key); const a = MAP[ev.key.toLowerCase()]; if (a) down.delete(a); };
export const Input = {
  bind() { if (bound) return; bound = true; addEventListener('pointerdown', () => { activity = true; }); addEventListener('touchstart', () => { activity = true; }, { passive: true }); addEventListener('keydown', onDown); addEventListener('keyup', onUp); addEventListener('blur', () => { down.clear(); anyDown.clear(); }); },
  held: (a) => down.has(a),
  anyHeld: () => anyDown.size > 0,
  touch() { activity = true; },
  activity() { return activity; },
  hit(a) { return pressed.has(a); },
  endFrame() { pressed.clear(); activity = false; },
  clear() { down.clear(); pressed.clear(); anyDown.clear(); },
  inject(a, isDown) { if (isDown) { if (!down.has(a)) pressed.add(a); down.add(a); } else down.delete(a); },
};
