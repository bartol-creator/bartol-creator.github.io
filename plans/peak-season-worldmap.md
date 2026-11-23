# Peak Season: world map remake plan, "the Expedition Globe"

Today's world map (`Assets/_Game/UI/WorldMap.cs`, 214 lines) is a flat UI picture: a white-land, blue-sea equirectangular texture (`Tools/data/worldmap.py` → `Assets/Resources/worldmap.bytes`), pins made from UI discs, a bottom card with buttons. It works, but it looks like a placeholder. This plan replaces it with a **3D stylised globe** that you spin and zoom, that dives down into the Alps as real relief, and that flies you into a resort when you pick it.

**Scope:** the world map only. Same places (`Place.All`: 3 own resorts, Gerlitzen, 17 coming-soon pins), same actions (continue, new, sandbox, free ride, ride the real resort). No new resorts or game modes. Everything else is look, feel, and clarity.

**Done when:** opening the map makes you go "ooh"; you can find and start any resort in under 5 seconds with mouse, touch, keyboard, or gamepad; the Alps cluster is readable; 60 fps desktop / 30 fps mid phone; build grows by no more than 2.5 MB.

---

## 0. What's wrong today (the things the remake has to fix)

1. **Flat and lifeless.** Two colours, no relief, no mountains. It's a ski game, but the map doesn't show where the mountains are.
2. **The Alps are a pile of pins.** Gerlitzen, Zermatt, Chamonix, Val d'Isère, St. Anton, Kitzbühel, Cortina, and Sljeme sit within ~6° of each other. At the start zoom (2.4) their labels overlap. Birchwood (52° N, 10.5° E) sits right above them.
3. **Labels collide** with each other and with the buttons in the corner (in the old screenshot, "Niseko" sits under the World button).
4. **The bottom quick-pick buttons and the pin card overlap.** Both are anchored bottom-centre or bottom-left.
5. **The card is a button wall.** Up to 5 buttons with long labels, no picture, no stats, nothing that makes you want to pick that mountain.
6. **No transition.** Title → map, and map → resort, are hard cuts.
7. **Zoom is jumpy.** Fixed steps of 1.25×/1.5×, no inertia, no pinch, no zoom towards the cursor.
8. **Locked resorts say nothing useful.** "Meet Birchwood's three goals" with no progress shown.

---

## 1. The look

### 1.1 One-line pitch
A **hand-painted winter planet on a tycoon desk**: a chunky stylised globe with exaggerated mountain ranges dusted in snow, a soft atmosphere glow, slow clouds, a real day/night line with city lights, and little 3D resort markers that look like toys: a flag, a chalet, a gondola.

### 1.2 Palette (matches the existing UI: `UiKit.Ink`, `Paper`, `Accent` orange, `Sky` blue)
| Thing | Colour | Notes |
|---|---|---|
| Deep ocean | `#123A66` | darker towards the poles |
| Shelf sea | `#2E7FB8` | from bathymetry, 0 to -200 m |
| Lowland | `#8FB56A` → `#C9B77E` | green in wet places, sand in deserts (from a Köppen-ish mask) |
| Hills | `#A08A66` | |
| Mountains | `#7A6A5C` rock | |
| Snow | `#F4F8FB` | permanent above a latitude-dependent line, plus seasonal snow |
| Ice caps | `#E6F0F7` | with a faint blue crevasse noise |
| Atmosphere rim | `#9FD3FF` at 35 % | fresnel glow |
| Night side | ocean `#06142A`, land `#0E1626` | city lights `#FFC872` |
| Own resort | `UiKit.Accent` orange | |
| Playable real resort | `#27B35A` green | |
| Coming soon | `#D93340` red, smaller | |
| Locked | `#9AA3AE` grey + padlock | |

### 1.3 Style rules
- **Exaggerated relief:** heights ×40 at globe zoom, so the Rockies, Andes, Alps, Himalaya and the Japanese Alps visibly stick up. Terraced into 6 soft bands (like a contour model) for the toy look, smoothed at the band edges.
- **Painted, not satellite:** colour comes from height + latitude + a wetness mask, with a painterly 2-octave noise breaking up the bands. No photo textures.
- **Flat-ish lighting:** one sun, wrap lighting (0.35), no harsh black shadows. Matches the game's flat-shaded props.

---

## 2. Data and baking (offline, Python, `Tools/data/globe.py`)

Everything is baked once into small textures. Nothing is downloaded at runtime.

### 2.1 Sources (all public domain)
| Source | What for | Resolution used |
|---|---|---|
| Natural Earth `land50.json` (already in `Tools/data/`) | coastlines, land mask | rasterised at 4096×2048 |
| ETOPO 2022, 15 arc-second downsampled to 10 arc-min (NOAA) | land height + bathymetry | 2048×1024 |
| Natural Earth 10 m lakes + glaciated areas | lakes (Ossiacher See, Geneva, Great Lakes), glaciers | rasterised |
| NASA Black Marble 2016 (grey, 0.1°) | night city lights | 2048×1024, single channel |
| EU-DEM / Copernicus GLO-90 (the `dem.py` pipeline used for Gerlitzen) | the Alps detail patch (§4) | 1024×512 over 43–49° N, 4–17° E |

### 2.2 Baked outputs (into `Assets/Resources/Globe/`)
| File | Size | Format | Content |
|---|---|---|---|
| `globe_albedo.bytes` | 4096×2048 (2048×1024 on phones, mip 1) | JPG q85, ~900 KB | painted colour, no snow, no lighting |
| `globe_data.bytes` | 2048×1024 | PNG RGBA, ~700 KB | R = height (0–1, land), G = snow-line factor (height relative to local snowline), B = city lights, A = land mask |
| `globe_normal` | — | computed in shader from R | saves a texture |
| `alps_height.bytes` | 1024×512 | PNG 16-bit grey, ~500 KB | Alps patch heights |
| `alps_albedo.bytes` | 1024×512 | JPG, ~180 KB | Alps patch painted colour with lakes, forests below 1,800 m |
| `clouds.bytes` | 1024×512 | PNG L8, ~120 KB | tileable cloud noise (generated, not real data) |

Budget: about **2.4 MB** total. Phones load the half-size albedo.

### 2.3 Paint recipe (in `globe.py`)
1. Land mask from Natural Earth at 2× size, downsampled (anti-aliased coasts).
2. Height from ETOPO, clamped to 0..6,000 m for land, gamma 0.6 so mid-range mountains (Alps at 3–4 km) read strongly next to the Himalaya.
3. Terrace into 6 bands with smoothstep edges (width 0.15 band).
4. Colour: lerp lowland → hill → rock by height; mix desert sand where a simple aridity mask says dry (latitude bands 15–35° away from coasts, plus the Gobi/Atacama by box); forest-green tint in the boreal belt 50–65° N.
5. Bathymetry: shelf colour for 0 to -200 m, fade to deep by -4,000 m, plus a 1-px lighter coastline halo (keeps the current map's nice glow).
6. Lakes painted shelf-blue; glaciers painted ice.
7. Painterly noise: 2 octaves of value noise, ±6 % brightness, ±3 % hue.
8. Snow-line factor (G channel): `snowline(lat) = 5,200 m · cos(lat)^1.4` roughly (≈2,800 m in the Alps, ≈5,000 m at the equator, 0 m at the poles). G = height − snowline, remapped. The shader adds seasonal snow on top (§3.3).

### 2.4 Checklist
- [ ] `Tools/data/fetch_globe.sh` downloads the sources into `Tools/data/src/` (git-ignored), with checksums.
- [ ] `globe.py` writes the 6 files and a contact sheet `Builds/shots/globe_bake.png` (all layers side by side).
- [ ] `alps.py` reuses `dem.py` tiles for the patch.
- [ ] Add the sources to `CREDITS.md` (NOAA ETOPO, NASA Black Marble, Natural Earth, Copernicus).

---

## 3. The globe (runtime)

### 3.1 Scene setup
- The map is a **separate little 3D stage**, not UI: `GlobeStage` spawns its own camera (depth above the title camera, clear to the space background), on layer 30 `Globe`, so the Birchwood title flight keeps running underneath and we can blend between them.
- UI (title, buttons, labels, card) stays on the existing `UiKit` canvas above it.
- `WorldMap.Open(root, onClose)` keeps its signature, so `TitleScreen.cs` doesn't change.

### 3.2 Meshes
- **Globe:** a cube-sphere (6 faces × 96×96 quads = 55 k triangles desktop, 48×48 = 14 k phone), built by `MeshKit`. The vertex shader displaces by the height texture × exaggeration. Cube-sphere avoids pole pinching.
- **Ocean:** the same sphere, not displaced, slightly larger than sea level, drawn first.
- **Clouds:** a sphere at radius 1.012, transparent, alpha from `clouds.bytes`, rotating 0.4°/s, a second layer offset and slower for parallax.
- **Atmosphere:** a sphere at 1.06 with inverted normals, additive fresnel glow, brighter on the day side.
- **Space backdrop:** a big quad behind with a dark gradient (`#060B18` → `#0F2240`) and 600 star points (a static mesh of tiny quads, twinkle in the shader). It is a ski game, so a few stars are snowflakes that drift if you look closely: cheap and silly.

### 3.3 Globe shader (`Assets/_Game/Shaders/Globe.shader`, hand-written URP unlit HLSL, so it is safe on WebGL 2)
- **Lighting:** sun direction from the **real date and time** (UTC from the browser clock, solar declination from the day of year). The day/night line sweeps across the planet as in real life. Wrap lighting on the day side, a 6° soft twilight band in warm orange.
- **Night side:** albedo dims to 12 % and tints blue; city lights (B channel) glow and flicker very slightly. **Gimmick:** your own resorts glow orange on the night side if you've built floodlights there (read from the save: `ResortData` has floodlights since M2).
- **Real seasons:** seasonal snow line drops in the hemisphere that is in winter. In late November, snow covers the Alps, the Rockies, Scandinavia, and Hokkaido; Portillo and Queenstown are brown. In July it flips. Formula: `snowline -= 1,400 m · winterAmount(lat, dayOfYear)`, where winterAmount follows the sun's declination with a 30-day lag.
- **Snow sparkle:** high-frequency noise × sun specular on snow pixels, only when zoomed in.
- **Ocean:** fresnel, a sun glint, and a faint scrolling ripple normal. Sea ice near the poles in winter (white noise mask above ~70° in the winter hemisphere).
- **Terrace edges:** a thin darker line at each terrace band (contour lines) that fades in when zoomed in past continent level. Looks like a relief map.
- **Variants:** `GLOBE_LOW` keyword for phones (no sparkle, no second cloud layer, half-res normal sampling).

### 3.4 Checklist
- [ ] `World/Globe/GlobeMesh.cs`: cube-sphere generator with LOD by device.
- [ ] `Shaders/Globe.shader`, `GlobeOcean.shader`, `GlobeClouds.shader`, `GlobeAtmo.shader`.
- [ ] Materials made by `SceneBuilder` (so shaders get into the build; check them in the WebGL build log).
- [ ] `GlobeSun.cs`: date → sun direction; `?date=2026-07-15&hour=22` page override for testing (through `Page.cs`).
- [ ] Screenshot tests at November noon UTC, July, and night over Europe.

---

## 4. Diving into the Alps (the coolest bit)

The globe alone can't show eight resorts within 400 km. So below a zoom threshold, an **Alps relief patch** rises out of the globe.

- **What it is:** a curved patch mesh (192×96 quads) covering 43–49° N, 4–17° E, sitting on the globe surface, displaced by `alps_height` with ×6 exaggeration (much less than the globe's ×40; it is local). Real valleys, real lakes (Geneva, Constance, Garda, Ossiacher See), the Matterhorn as a visible spike above Zermatt, Mont Blanc above Chamonix.
- **Transition:** between zoom 6 and 9 (from "Europe" to "Alps"), the patch fades in from 0 to 100 % while its exaggeration grows from 0 to ×6, so the mountains **grow out of the map**. The globe's own detail fades under it. Takes about 0.4 s on a scroll.
- **Detail on the patch:** forests painted below 1,800 m, rock above 2,400 m, snow above 2,000 m (seasonal), lakes with the ocean shader, country borders as a faint dashed line (Natural Earth 10 m borders), names of 6 big peaks in small italic (Mont Blanc 4,808, Matterhorn 4,478, Großglockner 3,798, Zugspitze 2,962, Marmolada 3,343, Triglav 2,864).
- **Gimmick:** on the patch, each playable resort gets a tiny **animated gondola** (two pylons, one cabin moving back and forth on a line) next to its pin. Coming-soon resorts get a static tiny chairlift icon.
- **Birchwood** (fictional, 52° N) sits outside the patch on the plain north of it. That's fine, it's a hill, and the globe shows it as one.

### Checklist
- [ ] `World/Globe/AlpsPatch.cs`, `Shaders/AlpsPatch.shader` (shares the globe's lighting include).
- [ ] Seam: the patch is skirted 300 m down at its edges and blended by alpha over 0.3°, so no crack against the globe.
- [ ] Peak labels and borders, culled when the patch is under 50 %.

---

## 5. Camera and controls

### 5.1 Model
The camera orbits the globe: state = `(lat, lon, distance)` plus a small tilt that grows as you zoom in (0° at full globe, 35° at Alps zoom, so the relief looks 3D from an angle, like a drone view).

| Zoom level | Distance (globe radii) | Tilt | What you see |
|---|---|---|---|
| World | 3.2 | 0° | the whole planet, slowly spinning when idle |
| Continent | 1.8 | 12° | Europe / North America |
| Region | 1.25 | 25° | the Alps patch fading in |
| Close | 1.06 | 35° | the Alps patch, gondolas, peak names |

### 5.2 Input
- **Mouse:** drag to spin (with **inertia**, damping 4/s), scroll to zoom **towards the cursor** (smooth, 12 % per notch, eased over 0.15 s), double-click to zoom ×2 at that spot, right-drag to tilt ±15°.
- **Touch:** one finger spins, pinch zooms around the pinch centre, two-finger twist does nothing (keeps north up; less confusing), double-tap zooms.
- **Keyboard:** WASD / arrows spin, Q/E or +/− zoom, Tab cycles playable resorts, Enter opens the selected one, Esc closes the card, then the map.
- **Gamepad:** left stick spins, triggers zoom, shoulder buttons cycle playable resorts, A selects, B backs out.
- **Idle:** after 8 s without input at World zoom, the globe slowly turns west to east (2°/s), like a desk globe.
- **Spin speed scales with zoom**, so a drag feels the same at every zoom.
- **Clamp:** latitude ±75°, so you can't flip upside down.

### 5.3 Fly-to
`FlyTo(lat, lon, distance)`: an arc along the great circle with a "hop": distance first rises (up to +0.6 radii for far jumps), then drops, eased with smoothstep, 0.6–1.4 s depending on the angle. Used by the quick-pick bar, Tab cycling, cluster taps and the start position.

**Start position:** fly in from World view to the last played resort (`peak.last`), or to Birchwood the first time. 1.2 s, starts the moment the map opens, so it feels alive.

### Checklist
- [ ] `World/Globe/GlobeCamera.cs` (state, inertia, fly-to, tilt curve).
- [ ] `World/Globe/GlobeInput.cs` (Input System; mouse, touch with pinch, keyboard, gamepad; ignores pointer over UI).
- [ ] Unit-ish test: `Boot.Test("globefly")` flies through all playable resorts and screenshots each.

---

## 6. Markers and labels

### 6.1 3D markers (low-poly, made in code like the props, flat shaded)
| Kind | Model | Size | Animation |
|---|---|---|---|
| Own resort, unlocked | a little **chalet** with an orange flag on a pole | 1.0 | flag waves; chimney puffs a smoke particle every 2 s |
| Own resort, locked | the same chalet, grey, with a **padlock** floating above | 1.0 | padlock bobs |
| Playable real resort (Gerlitzen) | a green **gondola cabin** on a pole | 1.0 | cabin swings |
| Coming soon | a **small red pin** (sphere on a stick) | 0.6 | none |
| Selected (any) | marker scales to 1.3 and a ring pulses on the ground | — | replaces today's `Pulse` halo |

- Markers sit on the displaced surface (height sampled from the same texture on the CPU, cached).
- Constant screen size: scale by camera distance, clamped, so they never become huge at close zoom.
- **Horizon culling:** markers behind the planet fade out over the last 5° before the horizon.
- **Hover** (mouse): marker hops up 20 %, label brightens, a tooltip shows name + one-line status ("Your resort · ★★★½ · Day 14" / "Coming soon").

### 6.2 Labels (screen space, on the UI canvas)
- Label plate = today's white rounded plate, plus a coloured dot and, for own resorts, the star rating from the save.
- **Collision avoidance:** each frame (cheap, 21 labels), sort by priority (selected > own > playable > coming soon), try 4 positions around the marker (right, left, above, below), skip a label if all 4 overlap a higher-priority one. A thin **leader line** when a label is offset more than 30 px.
- Coming-soon labels only show at Continent zoom and closer; own and playable labels always.
- Labels never go under the corner buttons or the card: those rects are added as blockers.

### 6.3 Clustering
At World and Continent zoom, markers closer than 48 px on screen merge into a **cluster bubble**: "Alps · 8" with a mini stack of icons (orange/green/red dots for what's inside). Tap a cluster → fly-to that fits them all. Clusters split smoothly (markers slide out from the bubble over 0.25 s).

### 6.4 Locked progress
A locked chalet shows a **progress ring** under the padlock: Kestrel = Birchwood goals met / 3, Frostvane = Kestrel stars / 3.5. The card spells out each goal with a tick or the missing number (see the "explain everything" rule from Iron & Ink; same spirit here).

### 6.5 Picking
Raycast from the pointer to the globe sphere (analytic ray-sphere, no colliders), then the nearest marker within 28 px on screen wins; else a click on empty land does nothing (no accidental closes).

### Checklist
- [ ] `World/Globe/GlobeMarkers.cs` (models, placement, culling, hover, selection).
- [ ] `UI/GlobeLabels.cs` (placement, leader lines, clusters).
- [ ] Read save summaries once on open (`Resort.SaveSummary`, stars, floodlights) into a small `PlaceStatus` struct.

---

## 7. The resort card (redesign)

Moves from bottom-centre to a **right-side panel** (420 px wide, full height minus 40 px margins) on landscape; on phone portrait or under 900 px wide it becomes a **bottom sheet** (drag up for more). Slides in over 0.2 s; the globe shifts left by a quarter of the card's width so the selected marker stays visible.

### 7.1 Layout, top to bottom
1. **Hero picture** (420×210): a baked screenshot of that mountain at golden hour (made once with `Tools/shot.sh`, stored as JPG ~40 KB each, 4 pictures). For coming-soon resorts: a painted silhouette of the skyline in their palette, generated in code from a few peaks (cheap and still charming), with a "COMING SOON" stamp at 8° rotation.
2. **Name** (34 px) and **country with a tiny flag** (drawn as 2–3 coloured bars, no images; just for the countries in the list).
3. **Stat strip:** top elevation · base elevation · vertical · lifts · runs. For own resorts, the numbers come from the mountain data and the save (lifts and runs *you* built). For real resorts, a hard-coded line in `Places.cs` (top/base elevation only, so the content stays the same).
4. **Difficulty bar** (own and Gerlitzen): a stacked bar green/blue/red/black from the slope grades.
5. **Today:** local time at that resort (from longitude) with a sun/moon icon, and "Snow: winter / spring / no season" from the globe's season model, so Portillo says "No season (summer)" in November. Pure cosmetics, ties in with the seasons gimmick.
6. **Your save:** "Day 14 · ★★★½ · €128,400 · 312 guests yesterday" or "No resort yet".
7. **Actions**, grouped and shorter:
   - Main button (big, orange): **Continue** or **Build a resort**.
   - Secondary row: **New** (with a confirm, as today: "replaces save"), **Sandbox** (shows "20× money"), **Ride** (free ride, or "Ride the real resort" on Gerlitzen).
   - Locked: goal list with ticks, plus **Free ride** (as today).
   - Coming soon: the blurb, and nothing to press.
8. **×** in the corner; Esc / B / tap on empty globe also closes.

### 7.2 Quick-pick bar
Today's bottom buttons become a **compact dock** at bottom-left: one round icon per playable place (chalet / gondola), name under it, tap = fly-to + open card. On phones it collapses to a single "Resorts ▾" button. It never overlaps the card (the card reserves its rect).

### Checklist
- [ ] `UI/ResortCard.cs` (both layouts), `UI/ResortDock.cs`.
- [ ] `Places.cs`: add `TopM`, `BaseM` for each place (21 numbers), a `CountryColours` table, `Hero` resource name.
- [ ] Hero shots: `Tools/shot.sh hero_birchwood ...` ×4, cropped, into `Assets/Resources/Globe/`.

---

## 8. Transitions

1. **Title → map:** the title camera (circling Birchwood) rises and pulls back into the sky over 0.8 s while the screen whites out like flying through cloud (a full-screen white with noise, alpha 0→1→0); behind it the globe is waiting at Birchwood at Close zoom, then pulls back to Continent. The title menu slides out left.
2. **Map → resort:** pressing a play button: the card slides out, the camera **dives** at the marker (distance to 1.01, tilt to 50°) over 0.9 s, the cloud layer thickens and rushes past, white-out, then `Session.Start` loads. Load happens behind the white, so the cut is hidden.
3. **Back:** the reverse of 1, shorter (0.5 s).
4. All transitions skippable with any key/tap after 0.2 s.

### Checklist
- [ ] `UI/CloudWipe.cs` (full-screen shader wipe, reused for both ways).
- [ ] Hook in `TitleScreen` (one call change at the "World map" button) and `Session.Start` (already a single entry point).

---

## 9. Ambient life and little gimmicks (all cheap)

- **Flight arcs:** dotted great-circle arcs between your own resorts that you've started, with a tiny plane icon travelling along each (one every 6 s). Only between unlocked own resorts, so the line grows as you progress.
- **Weather on own resorts:** if your save's weather forecast (M2 `Weather`) says snow tomorrow, a small swirl of snow particles hangs over that marker; powder day = a "POWDER" tag on the label. Read-only from the save, no sim on the map.
- **Satellite:** a tiny satellite on a slow polar orbit, blinks. Clicking it 5 times makes it wobble and say "Peak Season Weather Service" in a toast. Pure Easter egg.
- **Aurora:** above 60° N on the night side, a soft green ribbon in the atmosphere shader in winter. Frostvane (Iceland) gets it in November.
- **Desk-globe idle:** idle spin (§5.2) plus a soft "whirr".
- **Sounds** (synthesised like the rest of the game's audio, in `RiderAudio` style): low space wind loop, a soft tick when a marker gets hovered, a woody "clack" when the card opens, a rushing whoosh for fly-to (pitch by distance), the white-out roar for dive-in.

---

## 10. Phones and performance

| Item | Desktop | Phone |
|---|---|---|
| Globe triangles | 55 k | 14 k |
| Albedo | 4096×2048 | 2048×1024 |
| Cloud layers | 2 | 1 |
| Snow sparkle, aurora | on | off |
| Alps patch | 192×96 | 96×48 |
| Stars | 600 | 200 |
| Target | 60 fps | 30 fps |

- The title flight (Birchwood terrain, trees, guests) is **paused and its camera disabled** while the globe fills the screen, so the map doesn't pay for both.
- Textures load lazily on first open (not at boot) and stay cached; first open shows the cloud wipe while they decode (~150 ms on desktop).
- Shaders: no loops, ≤ 6 texture samples in the globe fragment shader.
- Safe area for notches; minimum tap target 44 px; card text ≥ 16 px.

---

## 11. Code layout

```
Assets/_Game/World/Globe/
  GlobeStage.cs      creates camera, layers, meshes; Open/Close; pauses the title flight
  GlobeMesh.cs       cube-sphere + Alps patch mesh generation
  GlobeSun.cs        date → sun direction, season amount per latitude
  GlobeCamera.cs     orbit state, inertia, zoom-to-cursor, tilt curve, FlyTo
  GlobeInput.cs      mouse / touch / keyboard / gamepad
  GlobeMarkers.cs    3D markers, hover, selection, culling, gondola anims
  GlobeAmbient.cs    flight arcs, satellite, weather swirls, stars
  AlpsPatch.cs       fade/grow logic, peak labels, borders
Assets/_Game/UI/
  WorldMap.cs        becomes a thin wrapper: Open() → GlobeStage + UI; same signature
  GlobeLabels.cs     labels, collision, leader lines, clusters
  ResortCard.cs      side panel / bottom sheet
  ResortDock.cs      quick picks
  CloudWipe.cs       transition wipe
Assets/_Game/Shaders/
  GlobeCommon.hlsl, Globe.shader, GlobeOcean.shader, GlobeClouds.shader,
  GlobeAtmo.shader, AlpsPatch.shader, CloudWipe.shader
Assets/_Game/Core/Places.cs   + TopM, BaseM, Hero, country colours
Tools/data/
  fetch_globe.sh, globe.py, alps.py   (old worldmap.py and worldmap.bytes deleted at the end)
```

---

## 12. Phases

Each phase ends with screenshots in `Builds/shots/globe-*.png`, a WebGL build, and `peaktest.py` passing. I publish to `games/peak-season-test/` between phases without asking, as agreed. One check-in with you after **G3** (the look), and one at the end.

| Phase | What | Rough size |
|---|---|---|
| **G1 Bake** | sources, `globe.py`, `alps.py`, contact sheet | data only |
| **G2 Globe** | stage, cube-sphere, 4 shaders, sun and seasons, camera + input, idle spin | biggest phase |
| **G3 Markers + labels** | 3D markers, labels with collision, clusters, picking, hover. **Check-in: the look.** | |
| **G4 Alps dive** | patch, grow-in, peaks, gondolas, borders | |
| **G5 Card + dock** | new card both layouts, hero shots, stats, locked goals, dock | |
| **G6 Transitions + ambient** | cloud wipe both ways, dive-in, arcs, weather swirls, aurora, satellite, sounds | |
| **G7 Polish + phone** | LOD, phone layout, gamepad, perf pass, delete old map code/texture, credits. **Final check-in.** | |

### Tests to add to `Tools/web/peaktest.py`
- `worldmap`: open map, wait for fly-in, screenshot; drag, scroll, screenshot; tap Gerlitzen marker, card visible, screenshot; press Ride, resort loads.
- `worldmap-phone`: same at 390×844 with touch, pinch zoom, bottom sheet.
- `worldmap-night`: `?date=2026-12-21&hour=21`, screenshot over Europe (lights, Birchwood floodlights if saved).
- `worldmap-keys`: Tab through playable resorts, Enter, Esc, Esc.

---

## 13. Risks

| Risk | Plan |
|---|---|
| Custom shaders stripped from the WebGL build | materials created by `SceneBuilder` and referenced in the scene; check the build log; fallback to `Universal Render Pipeline/Unlit` |
| Vertex texture fetch on weak phones | heights also baked into the mesh on the CPU at load (one-time, 14 k vertices) on `GLOBE_LOW`; shader displacement only on desktop |
| Seam between the Alps patch and the globe | skirt + alpha blend (§4); worst case, hide by fading the globe's own Alps area to the patch colour |
| ETOPO is large to download | only needed once on my Mac; the 10 arc-min version is ~60 MB; keep `src/` git-ignored |
| Labels flicker when swapping positions | hysteresis: a label keeps its slot unless blocked for 0.2 s |
| Build size | 2.4 MB budget, phones load half-res albedo; measured in G7 |
| Recompiling during Play | only via `Tools/rc.sh`, as always |

---

## 14. Open questions for you

1. **Style:** the plan goes for a *painted, toy-like* planet (terraced relief, painted colours). The other option is *satellite-realistic* (NASA Blue Marble colours, real relief shading). My pick: painted, it fits the game's flat-shaded look and the UI. OK?
2. **Real date and time** drive day/night and seasons, so in July the Alps are green and Portillo is snowy. Fun and "real", but it means the map looks different depending on when you play. Keep it, or fix it to a permanent winter afternoon?
3. **Keep a flat map?** I'd drop the flat map entirely. If you like it for an overview, I can add a "Flat" toggle that unrolls the globe into the flat view (a nice animation, but extra work: about half a phase).
