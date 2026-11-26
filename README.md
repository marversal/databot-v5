# DATABOT V5

Neon-green / black 16-bit arcade game: load data cubes, then survive the drone. Pure static site (HTML5 canvas + ES modules), no build step, deploys to Vercel as-is.

Built from `DATABOT V5 - MASTER GAMEPLAY MECHANICS & DEVELOPMENT PROMPT` and the reference art (start screen, DATABOT sprite sheet, HUD screens, K9 dog, drone). Art is the supplied 4K set: sprites are sliced from the sheets into clean transparent PNGs (no downscaling), with `DATABOT_LAYOUT` as the gameplay backdrop and `DATABOT_SPLASH` as the intro. The HUD is drawn live over the backdrop in Press Start 2P (bundled, OFL).

## Play

| Key | Action |
| --- | --- |
| Left / Right (or A / D) | Move |
| Space / Up (or W) | Jump (hold for full height) |
| E | Grab cube at belt end / load cube into the terminal |
| Enter | Start / Replay |
| M, + / - | Mute, master volume |

1. **Phase 1: Data Loading (60s).** Cubes ride the conveyor (left). Grab one with `E`, carry it to the terminal (right), `E` again to load it. Each cube = 64 MB.
2. **Phase 2: Drone Threat (60s survival).** The drone runs a 9-state FSM (idle, patrol, detect, track, target, charge, fire, cooldown, reposition). A red telegraphed laser locks the floor point under you: run out of the ring or be airborne when it fires. A hit stuns you, costs 1 of 5 energy and drops your cube. A K9 patrol dog also stuns on ground contact (jump it).
3. Survive until zero for `GAME OVER - TIME EXPIRED`; energy 0 ends the run early. Results show real MB loaded and cubes delivered. REPLAY resets everything.

All tuning lives in `src/config.js`.

## Run / test locally
```
python3 -m http.server 8000      # then open http://localhost:8000
node tools/playtest.mjs http://localhost:8000/   # real key/mouse play-test in headless Chrome (needs google-chrome, Node 22)
node tools/export_finder.mjs     # re-export FINDER mockups (server on :8123)
```

## Deploy
Import the repo in Vercel (framework "Other", no build command, output directory `.`) or run `vercel`.

## Layout
- `src/` modules: `config`, `state` (state manager), `player`, `conveyor`, `terminal`, `drone`, `dog`, `fx`, `hud`, `render`, `audio`, `input`, `font`, `game` (world), `main`, `debug` (scene hooks).
- `assets/sprites/` sliced 4K sprites: `databot_{run,carry,jump}_{L,R}`, `dog_run1-4` (faces left, flipped in game), `drone_{fly1,fly2,shoot,tilt}`, `cube`. `assets/bg/` `layout.png` + `splash.png`. `assets/fonts/` Press Start 2P.
- `FINDER/` 2048x1323 mockups (screenshots of the live game scenes) + sprite sheet.
- `tools/` `slice_art.py` (re-slices the original sheets if you drop them in `tools/art4k/`; not committed to keep the repo small), `cdp.mjs`, `playtest.mjs`, `export_finder.mjs`.

## Notes
- Data unit is `CFG.dataUnit` (`MB` per the spec; the supplied layout art shows `TB`).
- Cube drop point on the printer comes from template-matching `CUBE_placement.png` against the layout (`CFG.terminal.chamber`).

## Update: Data Center backdrop, grab/jump poses, idle return
- Backdrop `assets/bg/layout.png`; cube lands on the top ring of the front DATA LINK console.
- Poses: `databot_{launch,air,reach,lift}_{L,R}` (jump + pickup/load); run and carry sprites unchanged.
- After `CFG.idleTimeout` (120 s) with no input the game resets and returns to the splash; any input restarts.
