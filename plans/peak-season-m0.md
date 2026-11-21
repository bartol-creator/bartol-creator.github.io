# Peak Season: M0 build spec ("ski and do tricks on a mountain")

This is the first playable version. The full design is in `plans/ski-resort-tycoon.md` (§6 riding and tricks, §11 art, §12 tech). M0 has **no tycoon features yet**: one mountain, one rider, tricks.

- **Unity project:** `~/UnityProjects/PeakSeason` (Unity 6000.6.6f1, URP blank template)
- **Publish to:** `games/peak-season-test/` in the site repo, branch `claude/ski-resort-tycoon-plan-yovbo2`. Not `main`, and don't change `index.html` or any other game.

---

## 1. What the player can do in M0

1. Load the page and see a loading screen ("PEAK SEASON", a progress bar, "Waxing skis… 42%", a controls hint).
2. Spawn at the top of a mountain, with a short "Press any key / tap to drop in".
3. Ski down with real carving, tuck for speed, and brake or hockey-stop.
4. Hit kickers, cliffs and natural rolls; spin, flip and grab in the air; land and get judged.
5. Grind rails and boxes, and do manuals and butters, to chain combos with a multiplier.
6. Crash with a tumble, then auto-reset (or reset by hand) to the slope.
7. Switch between skis and snowboard at any time.
8. At the bottom, **teleport back to the top** (a "Ride again" prompt, or a key). Lifts come in M1.
9. Pause menu: resume, skis/board, controls list, restart at the top, quality (Auto/Low/High), sound volume.

## 2. Mountain (procedural for M0, one fixed seed)

- **Heightfield:** about 1 km × 1 km, 600–700 m vertical, 2 m grid near the player. Use chunked custom meshes (64 m chunks, 2 LODs), **not Unity Terrain**. Generate it from layered noise plus a hand-shaped main fall line: a broad main valley run, a side bowl, a steep face, rolling sections, a gully that works as a natural half-pipe, and a flat run-out at the base.
- **Flat-shaded low-poly look:** flat normals (no shared vertex normals, or derivatives in the shader). Snow is near-white with a blue tint in shadow and a warm peach tint in sunlight, and rock shows on faces steeper than about 45°.
- **Atmosphere:** strong height fog and distance haze that blends into a gradient sky, with a low afternoon sun and soft blue shadows. This is the most important part of the look.
- **Trees:** low-poly firs in 3–4 sizes, a few thousand drawn with `Graphics.RenderMeshInstanced`. Keep them off the main runs and use them as glades and edges.
- **Trick features:** a hand-placed **terrain park** about halfway down: 3 kickers (S, M, L), a down rail, a flat box, a kinked rail and a bonk log. Also put 2–3 natural cliff drops and a few wind lips elsewhere.
- **Collision:** the rider samples terrain height and normal from the heightfield directly (bilinear). Park features use simple colliders or spline proximity for rails.
- **Markers:** a few blue/red/black pole markers along the main runs (European style) as a hint of the full game.

## 3. Rider controller (the core of M0)

- **Kinematic, not a Rigidbody**, on a fixed step (100 Hz substeps).
- **On the ground:**
  - Gravity acts along the slope.
  - Velocity is pulled toward the gear's heading by grip, which depends on edge angle and speed. Strong grip when carving, sideslip when skidding.
  - Braking puts the gear sideways (hockey stop, with spray).
  - Tucking cuts drag and lowers the camera.
  - Use speed-dependent drag, with a top speed of about 90 km/h.
- **Skis vs board:** skis have quicker edge changes; the board has wider arcs and a regular/goofy stance with switch riding. Each has its own grab set.
- **Jump:** hold to crouch, release to pop. A charged pop jumps higher, and timing the pop at a kicker lip gives a bonus.
- **Air:**
  - Steer input spins (yaw) and forward/back flips (pitch).
  - Spin and flip together make an off-axis cork.
  - Rotation is code-driven, so landings are fair.
  - Grab button plus a direction picks the grab type.
  - The air camera pulls out on big airs.
- **Landing judgement:** compare the gear's forward axis to the velocity direction, and the body's up axis to the slope normal.
  - Perfect (< 10°): ×1.5 and a small speed boost
  - Clean (< 25°)
  - Sketchy (< 45°): wobble, combo kept
  - Crash (≥ 45°): combo lost
  - Spin landings are snapped to the nearest 180° (switch landings are allowed).
- **Rails and boxes:** snap to the rail spline when close and roughly aligned. The approach angle picks 50-50 or a slide (boardslide/lipslide). Keep balance with a small left/right balance meter. Spin-on and spin-off count as tricks.
- **Ground tricks:** manuals and butters (nose/tail press) keep the combo alive; ground spins are allowed in butters.
- **Crash:** a procedural tumble (roll along the slope with limb flail; skis or board can pop off). After 2 s, or on a key press, reset to the last safe point on the slope.
- **Off-piste:** ridable anywhere. Use powder feel (more drag, deeper spray) where it isn't on a run, to taste.

## 4. Tricks and scoring

- **Spins:** 180 to 1440 in 180° steps. **Flips:** front and back. **Corks:** off-axis spins. **Switch:** takeoffs and landings are tracked.
- **Grabs:**
  - Skis: Mute, Safety, Japan, Tail, Blunt, Critical, Octo, Screamin' Seaman.
  - Board: Indy, Melon, Mute, Stalefish, Method, Tail, Nose, Japan.
- **Grinds:** 50-50 and slide, plus spin-on and spin-off.
- **Ground:** manual, nose butter, tail butter, ollie, nollie.
- **Auto-naming:** for example "Switch Cork 900 Mute", "Backflip Tail", "50-50 → 360 Off".
- **Scoring:**
  - trick points = base × style (grab hold time, landing quality) × novelty (−25% per repeat within the combo)
  - combo = Σ points × multiplier (+1 per trick, +0.5 for each new trick type)
  - The combo breaks after more than 0.6 s of plain riding, or on a crash.
- **HUD (minimal, fades when idle):**
  - Trick text stack, multiplier, and combo timer bar.
  - Landing grade pop-up ("PERFECT!").
  - Speed in km/h.
  - Best combo this session (saved in PlayerPrefs).
- **Separate logic from presentation:** keep the scoring logic in plain C# classes so EditMode tests can cover it.

## 5. Rider and visuals

- **Rider:** our own simple low-poly stylised character (no face detail; a colourful jacket, pants, helmet and goggles). It can be built in code or from simple modelled meshes, with procedural posing: crouch, lean into turns, tuck, and authored grab poses as transforms or a simple rig. No imported third-party characters. If you use any CC0 models, list them in a CREDITS file.
- **Effects:** carve spray, powder puffs, landing puffs and light falling snow.
- **Ski tracks (nice-to-have in M0):** a render-texture trail stamped behind the rider and sampled by the terrain shader. If it costs too much time, leave it for M1.
- **Audio:** carving hiss, wind that rises with speed, landing thud and a tumble sound. CC0 only (for example freesound CC0 or Kenney), credited. No music in M0.

## 6. Input (new Input System, one action map)

| Action | Keyboard + mouse | Gamepad | Touch |
|---|---|---|---|
| Steer / spin | A/D | Left stick | Left-side virtual stick |
| Tuck / brake, flip | W / S | Left stick | Stick up/down |
| Jump (hold to charge) | Space | South (A/✕) | Right button "Jump" |
| Grab (+ direction) | Shift | RB/R1 | "Grab" button + stick |
| Manual/butter | Ctrl | LB/L1 | Hold "Jump" while holding stick fully |
| Camera | Mouse | Right stick | Right-side drag |
| Reset | R | North (Y/△) | Reset button |
| Back to top | T | View/Select | Shown on the "Ride again" prompt |
| Skis ↔ board | Tab | D-pad up | Pause menu |
| Pause | Esc | Start | Pause button |

Touch controls appear only on touch devices. Phones need a landscape-orientation prompt (same as Coldsnap).

## 7. Camera

A chase camera (Cinemachine or custom) that looks ahead along the velocity, with FOV that widens with speed, slight shake at high speed, an air cam that pulls out, and a crash cam that holds still. Mouse or right stick orbits temporarily, then the camera recentres.

## 8. Web build

- WebGL with Brotli, decompression fallback **on** (GitHub Pages doesn't send Content-Encoding), and code stripping.
- Use the same custom WebGL template family as Coldsnap and Emberfall: loading screen, fullscreen button, "← All games" back link, rotate prompt, and a PWA manifest and icons (a simple mountain icon is fine).
- Mobile: render scale is set automatically, and Low quality is used on phones.
- **Budgets:** the download should be at most 30 MB. Aim for 60 fps on desktop and 30 fps on a mid-range phone.

## 9. Definition of done (check every item before reporting)

1. The project compiles with **0 errors and 0 warnings from our scripts** in batch mode.
2. EditMode tests pass for trick naming, scoring, combo rules and landing judgement.
3. The WebGL build succeeds and is copied to `games/peak-season-test/` in the site repo, committed and pushed to `claude/ski-resort-tycoon-plan-yovbo2` (only that folder plus `plans/` if needed).
4. Load the page locally in a browser (a local HTTP server with Playwright/Chrome) and confirm:
   - it loads with no console errors;
   - screenshots of the loading screen, riding, mid-air with a trick name on screen, and touch controls in a phone viewport;
   - an automated input run (hold forward, jump at the park) gets airborne without crashing the game.
5. Report: what works, what doesn't, the build size, fps observations, known issues, and the screenshot paths. Also commit the screenshots to `plans/m0-screenshots/` so the cloud session can see them.
6. Commit the Unity project to a **local** git repo in `~/UnityProjects/PeakSeason` (with a Unity .gitignore). Don't add a remote.

## 10. If something blocks you

Unity licence, sign-in, or anything that needs Bartol at the Mac: stop and report exactly what's needed. Don't install editors or modules without asking.
