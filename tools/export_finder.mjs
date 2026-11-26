// Exports the 2048x1323 FINDER mockups by screenshotting real game scenes in headless Chrome.
import { launch } from './cdp.mjs';
import { mkdirSync } from 'node:fs';
mkdirSync('FINDER', { recursive: true });
const scenes = [['start', '01_start_screen'], ['load', '02_phase1_data_loading'], ['carry', '03_carry_cube_load_belt_prompt'], ['deliver', '04_delivery_processing'],
  ['detect', '05_phase2_drone_detected'], ['laser', '06_drone_laser_attack'], ['stun', '07_player_stunned'], ['over', '08_game_over_results'], ['sheet', '09_sprite_sheet']];
for (const [s, name] of scenes) {
  const b = await launch('http://localhost:8123/?scene=' + s); await b.sleep(400);
  await b.shot(`FINDER/${name}.png`); if (b.errors.length) console.log('errors', s, b.errors); b.close(); console.log(name);
}
