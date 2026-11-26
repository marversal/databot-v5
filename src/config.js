export const CFG = {
  W: 1024, H: 662, OUT_W: 2048, OUT_H: 1323, FLOOR: 552, dataUnit: 'MB',
  loadTime: 120, surviveTime: 60, transitionTime: 2.6,
  energy: 5, carryCapacity: 1,
  stunTime: 1.3, invulnTime: 2.4,
  player: { accel: 2800, decel: 3400, maxSpeed: 330, runThreshold: 0.8, jumpV: 830, gravity: 2600, fallMul: 1.35, minX: 70, maxX: 960 },
  cube: { spawnInterval: 3, value: 64, beltTime: 7, cap: 5, gap: 0.17, reach: 105 },
  belt: { start: [52, 436], end: [216, 518] },
  terminal: { chamber: [876, 432], cubeWidth: 52, zone: [680, 960] },
  idleTimeout: 120,
  drone: { count: 1, y: 200, patrolSpeed: 130, trackSpeed: 260, detectRange: 560, detectTime: 0.7,
    trackTime: 1.1, targetTime: 0.9, chargeTime: 0.65, fireTime: 0.22, cooldown: 1.6, repositionTime: 1.1, hitRadius: 50 },
  k9: { count: 1, speed: 120, minX: 380, maxX: 760, hitRadius: 34 },
};
