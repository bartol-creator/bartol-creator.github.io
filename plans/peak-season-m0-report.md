# Peak Season M0: build report (2026-11-21)

Test page: `games/peak-season-test/` on this branch. Unity project: `~/UnityProjects/PeakSeason` (local git, no remote).

## Definition of done

| # | Item | Result |
|---|---|---|
| 1 | Batch-mode compile | Exit 0, 0 errors, 0 warnings (`Unity -batchmode -quit`, fresh `ScriptAssemblies`) |
| 2 | EditMode tests | 37 of 37 pass (trick naming, grabs, scoring, novelty, multiplier, combo timer and crash, landing grades, rotation snapping) |
| 3 | WebGL build | Brotli with decompression fallback, hashed names, stripping, PeakSeason template; copied here and pushed |
| 4 | Browser check | `Tools/web/peaktest.py` in Chromium: no console errors; loading, top, riding, mid-air trick and phone screenshots; real-key park run (hold W, Space at the lips, D spin and Shift grab in the air): 4 airs, landed "180 Octo", "Switch 180", "180" |
| 5 | Report and screenshots | This file and `plans/m0-screenshots/` |
| 6 | Local git | Two commits on `main`, Unity `.gitignore`, no remote |

## Size and speed

- Download: 7.4 MB in total (wasm 5.6 MB, data 1.8 MB, framework 0.06 MB, loader 0.12 MB), well under the 30 MB budget. The mountain, trees, rider and sounds are generated at start-up (about 0.45 s on an M4).
- Frame rate in headless Chromium with Metal at 1280×720 on the M4 Mac: 80 to 95 fps, High quality, about 4,000 trees. Not measured on a phone yet; phones get Low quality (1,800 trees, one shadow cascade, render scale 0.8, with auto-lowering if fps stays under 45).

## What works

- Mountain: about 1 km square, chunked 64 m meshes in two detail levels, flat-shaded snow with rock on steep faces, heavy haze into a gradient sky, far ridged mountains, a summit plateau start, valley run, side bowl, steep face, rollers, a gully half-pipe, three cliff drops, three wind lips, flat run-out with a small village. Blue, red and black run poles.
- Park: small, medium and large kickers (orange lips, flags), a box, down rail, kinked rail, long rail, a down box and a bonk log.
- Rider: our own low-poly figure posed by IK every frame. Carving with grip, skids, hockey stops with spray, tuck, powder drag off piste, top speed about 90 km/h. Hold-to-charge jump with a lip-timing bonus ("Perfect pop!"). Code-driven spins and flips that finish the half turn when released; corks; 8 ski and 8 board grabs by stick direction; rails and boxes with 50-50 or slides and a balance meter; spin-on and spin-off; manuals, nose and tail butters with ground spins; landing grades Perfect, Clean, Sketchy and Crash; tumble with gear popping off and reset after 2 s (or R).
- Skis or snowboard at any time (Tab, D-pad up, or the pause menu).
- HUD: speed, best combo (saved), live trick name in the air, trick stack with points, combo total, multiplier and timer bar, landing grade pop, callouts, "Ride again" at the bottom (T anywhere).
- Pause menu: resume, skis/board, controls list, restart at the top, quality (Auto, Low, High), sound volume. Works with mouse, touch and a gamepad.
- Input: keyboard and mouse, gamepad and touch from one action map. Touch: floating stick, JUMP, GRAB, RESET, pause, drag on the right to look.
- Page: loading screen ("Waxing skis… 42%"), fullscreen button, "← All games", rotate prompt, PWA manifest and mountain icons. Address options for testing: `?spawn=park`, `?gear=board`, `?quality=low|high`, `?autopilot`.

## Known issues and gaps

- Not tested on a real phone, with a real gamepad, or in Safari or Firefox (headless Chromium only).
- Sounds are synthesised in code (hiss, wind, grind, thuds), not CC0 recordings; nothing to credit, but they are basic. No music, as specified.
- Ctrl is the manual key as specified, but Ctrl+W closes a browser tab, so C does the same and the hints show C.
- Ski tracks (nice-to-have) are not in M0.
- The camera can pass through trees; far mountains show large flat facets in the haze.
- Changing quality changes shadows and render scale at once; the tree count only changes on reload.
- Grab poses and the tumble are simple procedural poses.
