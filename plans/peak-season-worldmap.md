# Peak Season: world map remake plan, "the Relief Table"

Revised 2026-11-23 after Bartol's answer: **"Make it look like this. Everything else you decide."** The reference is a tilted, painted 3D relief map of Europe: low sun with long cast shadows, dark olive lowlands, purple-grey mountains with snowy crests, a lavender sea with a marbled paper texture and the seabed showing through near the coasts, illustrated badge markers standing on the map (colourful when available, grey when not), and dark translucent rounded panels for the UI. The first version of this plan (a spinning globe) is dropped.

The look is the reference's *style* (a relief map, which is a common cartographic look); the badges, panels, layout and everything else are our own designs, not copies.

**Scope:** the world map only. Same places (`Place.All`: 3 own resorts, Gerlitzen, 17 coming-soon pins), same actions. No new resorts or modes.

**Done when:** the map looks like the reference at Europe zoom; any resort can be found and started in under 5 s with mouse, touch or keys; the Alps are readable; 60 fps desktop / 30 fps mid phone; the game's first load is not slower (map art loads only when the map opens, ≤ 4 MB).

---

## 0. Decisions (made by me, as asked)

1. **Flat tilted map, no globe.** Web Mercator projection, like the reference (Scandinavia a bit stretched), cropped to 58° S – 76° N.
2. **Fixed light, no day/night or seasons.** The reference's look depends on one low sun and baked long shadows. Always a winter afternoon: snow on all the northern mountains. Southern resorts (Portillo, Queenstown) get their snow too, because the map shows *ski* country.
3. **Shadows and shading are baked** into the map pictures offline (Python), not computed live. Identical on every device, cheap on phones, and exactly controllable.
4. **Map art loads lazily** from `StreamingAssets` the first time the map opens, so the game's first load (8 MB today) is unchanged.
5. **Badges are generated** by a Python script (original "enamel ski-pin" designs), one per place, with each mountain's own silhouette.
6. **The old flat map** (`worldmap.bytes`, `worldmap.py`) is deleted at the end.

---

## 1. The look in detail

### 1.1 Colour ramp (sampled to match the reference's mood)
| Thing | Colour | Rule |
|---|---|---|
| Lowland | `#3F5A26` dark olive | elevation < 300 m |
| Dry lowland | `#7D6E3C` khaki | arid belts (Sahara, Arabia, Iberian interior, US south-west, Australia) by a latitude + distance-from-coast mask |
| Hills | `#5E6A34` → `#6F6648` | 300–1,200 m |
| Mountain rock | `#6C6A92` purple-grey | > 1,200 m and steep |
| Snow | `#E9ECF6` | above a latitude-dependent snowline (≈1,700 m in the Alps, 0 m in Greenland), more on north faces |
| Ice sheets | `#DDE4F2` | Greenland, Antarctic edge, Svalbard |
| Shallow sea | `#8E95D8` lavender with seabed hillshade at 35 % | 0 to -200 m |
| Deep sea | `#6E74C2` | fades in by -3,000 m |
| Paper marbling on the sea | ±7 % brightness | domain-warped fractal noise, large soft "watercolour" blots |
| Cast shadow | multiply `#3B3F78` at 55 % | ray-marched from the sun |

### 1.2 Light
- Sun from the **north-west**, 11° above the horizon. Shadows fall south-east, so with the camera looking north they fall towards the viewer and read clearly (as in the reference, where the Alps throw long shadows over the Po plain and the Adriatic).
- Hillshade: Lambert with wrap 0.25, plus ambient occlusion from a blurred-height difference (valleys darker).
- Cast shadows: ray-march every pixel towards the sun through the exaggerated heightfield, soft edges (4 jittered rays). Shadows also fall onto the sea near mountainous coasts (Norway, Dalmatia, Greece), which is a big part of the reference's charm.

### 1.3 Relief geometry
- The map is a real 3D mesh displaced by height, so ridges stand up against the tilted camera. Exaggeration ≈ 45× (tuned by eye; the Alps should rise clearly but not look like spikes). Shadows are baked with the **same** exaggeration so they line up with the geometry.
- The seabed is not displaced (the sea is flat), its relief only shows through the colour.

---

## 2. Data and baking (`Tools/data/relief.py`, run with `~/WebBuilds/.tools/bin/python`)

### 2.1 Source
**AWS Terrain Tiles (Mapzen "terrarium" PNG)**, public, global, land + bathymetry, already in Web Mercator. Height = (R·256 + G + B/256) − 32768 m. Cached in `Tools/data/src/terrarium/` (git-ignored). Attribution added to `CREDITS.md` (Mapzen / AWS Terrain Tiles, with its source list: SRTM, GMTED, ETOPO1, EU-DEM and others). Natural Earth `land50.json` (already here) gives a clean coastline mask to sharpen coasts.

### 2.2 Tiers
| Tier | Area | Zoom | Picture size | Mesh grid |
|---|---|---|---|---|
| World | 180° W – 180° E, 58° S – 76° N | z4 | 4096 × ~2350 | 512 × 294 |
| Europe | 25° W – 45° E, 34° N – 72° N | z6 | ~3200 × ~3000 → split in 2 | 400 × 380 |
| Alps | 4° E – 18° E, 43° N – 48.6° N | z7 | ~2550 × ~1450 | 320 × 180 |
| North America West | 128° W – 100° W, 35° N – 55° N | z6 | ~1280 × ~1300 | 160 × 160 |
| Japan | 135° E – 146° E, 34° N – 46° N | z6 | ~500 × ~700 | 64 × 90 |
| Andes (Portillo) | 74° W – 66° W, 37° S – 29° S | z6 | ~360 × ~380 | 48 × 48 |
| New Zealand | 166° E – 179° E, 47.5° S – 34° S | z6 | ~600 × ~800 | 76 × 100 |

Each tier is baked from its own zoom's tiles, so the detail is real, not upscaled. The finer tier draws on top; the coarser tier's shader discards its pixels inside the finer tier's rectangle (rect list as shader uniforms), with a 2 % feathered blend so there is no seam.

### 2.3 Files (into `Assets/StreamingAssets/map/`)
Per tier: `<tier>.jpg` (baked colour with shading and shadows, q82) and `<tier>_h.png` (8-bit height at mesh resolution, land only, for the mesh and for placing badges). Plus `badges.png` atlas. Budget: **≤ 4 MB** total.

### 2.4 Checklist
- [ ] `fetch_tiles.py`: download the tiles for each tier, polite (1 request at a time, cached, retries).
- [ ] `relief.py`: mosaic → colour ramp → hillshade + AO → cast shadows → sea + marbling → JPG/PNG per tier, plus a contact sheet `Builds/shots/relief_bake.png`.
- [ ] Compare the Europe tier against the reference side by side and tune colours.

---

## 3. Runtime (Unity)

### 3.1 Stage
- `MapStage` builds its own small 3D scene far away from the mountain (at y = −20,000, so nothing of the resort is visible), its own camera, and its own light-free unlit materials. The title flight's camera is disabled while the map is open and restored when it closes.
- World units: 1 unit = 1 world-tier pixel (≈ 9.8 km at the equator). Map spans x 0…4096, z 0…~2350 (north = +z).
- `WorldMap.Open(root, onClose)` keeps its signature, so `TitleScreen` doesn't change.

### 3.2 Meshes and shader
- Each tier = a grid mesh (UInt32 indices where needed) displaced on the CPU from its `_h.png`, UVs into its JPG.
- `Shaders/ReliefMap.shader`: hand-written URP unlit HLSL: sample colour, discard inside finer-tier rects (feathered by dithering), a very slight distance haze towards the horizon (lavender, like the reference's far edge), and a soft vignette. Referenced from a material made by `SceneBuilder`, so WebGL keeps it.
- **Drifting cloud shadows:** a big transparent quad above the map with a soft tileable noise, multiply 8 %, drifting east at 3 units/s. Barely noticeable, makes the map feel alive.

### 3.3 Camera and controls
| Zoom | Camera height (units) | Pitch (down from horizontal) | View |
|---|---|---|---|
| Far | 2,200 | 72° | most of the world |
| Continent | 700 | 62° | Europe, as in the reference |
| Region | 220 | 54° | Alps, Rockies |
| Close | 70 | 48° | single resort area |

- Perspective, FOV 32°. Pitch follows zoom on a smooth curve, so zooming in feels like a drone swooping down.
- **Mouse:** drag pans (the point under the cursor stays under the cursor), with inertia (damping 5/s). Scroll zooms towards the cursor (smooth). Double-click zooms in ×2.5 at that spot.
- **Touch:** drag pans, pinch zooms around the pinch centre, double-tap zooms in.
- **Keys:** WASD / arrows pan, Q/E or +/− zoom, Tab / Shift+Tab cycle playable resorts, Enter opens the card's main action, Esc closes card → map.
- **Gamepad:** left stick pans, triggers zoom, shoulders cycle resorts, A select, B back.
- **Fly-to:** eased pan + zoom (up then down for far jumps), 0.6–1.2 s. Used by Tab, the resort dock, and the opening move: the map opens at Far zoom and swoops to the last played resort at Continent/Region zoom.
- Pan clamped to the map; zoom clamped Far…Close; only the tier detail you can see is drawn.

### 3.4 Checklist
- [ ] `World/Map/MapStage.cs`, `MapTiers.cs` (load tier files from StreamingAssets with `UnityWebRequest`, build meshes), `MapCamera.cs`, `MapInput.cs`.
- [ ] `Shaders/ReliefMap.shader`, `Shaders/MapClouds.shader`, materials in `SceneBuilder`.
- [ ] `Mercator.cs`: lat/lon ↔ map units (used by badges and tests).

---

## 4. Badges (markers)

### 4.1 Designs (generated by `Tools/art/badges.py` into one atlas)
- **Own resorts:** round "enamel pin" badges, 256 px: sky gradient in the resort's colour (Birchwood warm orange dusk, Kestrel cold teal, Frostvane icy violet), the mountain's own silhouette (from its heightfield in the game: a profile along its fall line), a few firs for Birchwood, a glacier band for Frostvane, a thick cream rim, and a **ribbon banner** across the bottom with the name in caps.
- **Gerlitzen (playable real resort):** a rounded-square tile, green sky, its real skyline from the DEM already in `Tools/data/dem.json`, a little gondola cable, and a ribbon.
- **Coming soon (17):** rounded-square tiles, each with its own skyline (a procedural silhouette seeded by the name, steeper for Zermatt/Chamonix, rounder for Jahorina), drawn in **greyscale** with a darker rim, so the map shows "not yet" at a glance, like the reference's grey badges.
- **Locked own resorts:** their full design in greyscale with a small padlock on the rim.
- Each badge has a soft **ground shadow** blob under it, so it reads as standing on the map.

### 4.2 Behaviour
- Billboards on the terrain (always face the camera, upright), size constant on screen (playable 84 px, coming soon 56 px), clamped.
- **Overlap rule:** sorted by priority (selected > own > playable > coming soon); a lower-priority badge that would overlap a higher one shrinks to a small grey dot with a white rim. Zoom in and they open up with a 0.2 s scale animation. This keeps the Alps readable at Europe zoom.
- **Hover:** badge rises 10 px and grows 8 %. **Selected:** it grows 20 %, a soft pulsing ring spreads on the ground under it.
- Picking: screen-space distance to the badge centre (no colliders).

### 4.3 Checklist
- [ ] `badges.py` (+ contact sheet), `World/Map/MapBadges.cs` (placement, overlap, hover, select).

---

## 5. UI (dark translucent panels, our own layout)

- Panel style: rounded, `#262845` at 78 %, 1 px light rim at 10 %, 14 px corner radius; text cream `#F2EEDC`; the primary button khaki-gold `#B9B07A` (matches the map's palette) with dark text.
- **Top-left panel:** "◀◀ Back to title". Under it the title "WORLD MAP" in small caps.
- **Top-right:** zoom + / − and a "Home" button (fly to the last resort), round, same style.
- **Bottom: resort dock** — a translucent strip with one small badge per playable place (Birchwood, Kestrel, Frostvane, Gerlitzen); tap = fly-to + card. Locked ones grey.
- **Resort card:** a right-side panel (400 px) on landscape, a bottom sheet on narrow/portrait screens. Top to bottom: the badge (big), name, country, blurb, a stat line (top and base elevation, vertical; for own resorts also lifts and runs from the save), your save line ("Day 14 · ★★★½ · €128,400"), then the buttons: one primary (Continue / Build a resort), a row of secondary (New, Sandbox, Ride). Locked: the goals with ticks or missing numbers. Coming soon: blurb + "Coming soon" stamp. The camera nudges so the selected badge isn't hidden behind the card.
- Hint text bottom-left at first open ("Drag to move · scroll to zoom · tap a badge"), fades after the first move.

### Checklist
- [ ] `UI/MapPanels.cs` (panel style helper), `UI/ResortCard.cs`, `UI/ResortDock.cs`; `Places.cs` gets `TopM`, `BaseM`.

---

## 6. Transitions and sound
- **Open:** a quick cloud wipe (white noise wipe, 0.5 s), the map appears at Far zoom and swoops in.
- **Play:** the camera dives at the badge for 0.7 s while the wipe closes, then `Session.Start` loads behind it.
- **Back:** wipe, title flight resumes.
- **Sounds** (synthesised like the rest): soft paper rustle on drag start, a woody tick on badge hover, a clack when the card opens, a whoosh on fly-to.

---

## 7. Phones and performance
- Phones: Europe and Alps tiers load at half size, mesh grids halved, no cloud shadows.
- Map art is decoded once and cached for the session (~60 MB GPU on desktop, ~20 MB on phones).
- Title flight paused while the map is open.

---

## 8. Phases
| Phase | What |
|---|---|
| **R1 Bake** | tiles, relief.py for all tiers, contact sheet; tune against the reference |
| **R2 Map stage** | tiers + meshes + shader + camera + input; old map replaced |
| **R3 Badges** | badges.py, billboards, overlap, hover/select |
| **R4 UI** | panels, card, dock, hint |
| **R5 Life + polish** | cloud shadows, transitions, sounds, phone tiers, keys/gamepad, delete old map, credits, test page |

Tests (`peaktest.py`): `worldmap` (open, wait for swoop, screenshot, drag, scroll, pick Gerlitzen, card, Ride loads), `worldmap-phone` (390×844, touch, pinch, bottom sheet), `worldmap-keys` (Tab/Enter/Esc).

## 9. Risks
| Risk | Plan |
|---|---|
| Seams between tiers | feathered discard + both tiers baked with the same light and colour ramp |
| Badges jumble in the Alps | priority + dot collapse; Alps tier gives room when zoomed |
| Shader stripped in WebGL | material made by `SceneBuilder`; fallback to URP Unlit |
| Tile download etiquette | one request at a time, cached forever, only ~1,500 tiles in total |
| Recompiling during Play | only via `Tools/rc.sh` |
