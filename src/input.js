const down = new Set(), pressed = new Set();
const MAP = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'jump', ' ': 'jump', w: 'jump', e: 'grab', enter: 'confirm', r: 'confirm', m: 'mute', '+': 'volup', '=': 'volup', '-': 'voldown', _: 'voldown' };
let bound = false;
const onDown = (ev) => {
  const a = MAP[ev.key.toLowerCase()]; if (!a) return;
  if (ev.key.startsWith('Arrow') || ev.key === ' ') ev.preventDefault();
  if (!down.has(a)) pressed.add(a);
  down.add(a);
};
const onUp = (ev) => { const a = MAP[ev.key.toLowerCase()]; if (a) down.delete(a); };
export const Input = {
  bind() { if (bound) return; bound = true; addEventListener('keydown', onDown); addEventListener('keyup', onUp); addEventListener('blur', () => down.clear()); },
  held: (a) => down.has(a),
  hit(a) { return pressed.has(a); },
  endFrame() { pressed.clear(); },
  clear() { down.clear(); pressed.clear(); },
  inject(a, isDown) { if (isDown) { if (!down.has(a)) pressed.add(a); down.add(a); } else down.delete(a); },
};
