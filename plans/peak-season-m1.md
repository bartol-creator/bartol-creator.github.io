# Peak Season: M1 plan, "v0.1 vertical slice"

M0 proved the riding (live at `games/peak-season-test/`). M1 turns it into the game: **build a small resort on Birchwood Hill, open it, watch guests use it, and ride it yourself**. The full design is in `plans/ski-resort-tycoon.md`; this file is the build plan for M1 only, with numbers, set dressing and a checklist per phase.

**Done when:** someone new can build a small resort, ride it, and want to keep going for 30+ minutes, on a computer and on a phone, at 60 fps (desktop) / 30 fps (mid phone), under 35 MB.

---

## 0. Decisions I need from you

1. **Guest faces up close** (the plan's open question). My suggestion: faceless (goggles and a scarf hide the face), the same as the target look. Simple faces would only show when you follow a guest.
2. **The M0 mountain** (1 km, 600 m, steep face, cliffs, park) is too big and steep for the beginner mountain. My suggestion: keep it as the start of **Kestrel Ridge** (Mountain 2, M2), and make Birchwood Hill new in M1. Until M2, the M0 mountain stays reachable as "Free ride: Kestrel Ridge (preview)" on the title screen, so nothing you liked is lost.
3. **Rider model upgrade** goes into M1 (phase P2), as you asked.
4. **Check-ins:** I would stop for you only twice, after P2 (rider and Birchwood look) and at the end. Everything else I test myself and publish to the test page as I go.

---

## 1. Birchwood Hill (phase P1)

### 1.1 Shape
- **600 × 600 m, 250 m vertical**, chunked heightfield as in M0 (64 m chunks, 2 m grid, two levels of detail), but **authored**: a 16-bit heightmap (`Mountains/Birchwood/height.r16`, 301 × 301 at 2 m) made by an editor tool from layered shapes, so I can sculpt by hand and it loads fast.
- **The village** sits on a flat shelf at the bottom (z 0–90): 14 chalets, a small church with an onion dome, a frozen pond with an ice rink outline, a bus stop, and the empty **car park field** where the first car park goes.
- **Above the village**: a gentle **beginner meadow** (8–12 % grade, 120 × 90 m) next to the car park, the natural spot for the first magic carpet.
- **The hill itself**: two broad shoulders split by a shallow wooded **creek valley** (the natural place for a T-bar), a rounded **summit knoll** with a lookout and a wooden cross, and a **north-east bowl** with birch glades. Steepest sustained pitch about 32 % (a red run is possible, a black is not).
- **Natural features to ride before you build anything**: a fallen-log line in the birches, two small wind lips under the summit, a **roller section** on the west shoulder, a **creek gully** (mini half-pipe, 4 m deep), a **forest road** cat track that traverses the hill (perfect for a blue run's return), and a **hidden jump** behind the old hay barn.

### 1.2 Set dressing (all low-poly, made in code like the M0 props, flat shaded)
- **Trees:** firs (4 sizes) plus **birches** (white trunks with dark bands, sparse yellow-brown crowns), clustered into glades with noise. About 3,500 desktop / 1,600 phone, instanced, with wind sway.
- **Rocks** poking through on the steepest spots (3 boulder meshes, snow caps).
- **Fences:** split-rail fences around the village and the beginner meadow, snow fences (orange slat panels) on the ridge.
- **Hay barns** (3) half buried in snow, one with the hidden jump behind it.
- **The lookout:** a small wooden platform and bench on the summit, with a bronze sign plate.
- **Power line** crossing the valley bottom (poles and sagging wires): a cable lift must clear it, which is a gentle placement puzzle.
- **Village life (decoration, no simulation):** smoke from chimneys (particles), lit windows at dusk, a parked snowplough, firewood stacks, a sledge leaning on a wall, 4 villagers walking a loop in the street.
- **Birds:** a few crows that lift off when you ski past the lookout (a 30-line flock script).

### 1.3 Art pass on top of M0's look
- **Time-of-day sky**: 5 authored keys (09:00 cool blue, 12:00 bright, 14:30 warm, 16:00 golden, 17:00 pink dusk) for sun angle, sun colour, sky zenith/horizon, ambient and haze; blended over the day.
- **Snow shader:** keep M0's flat shading and blue-shade/peach-light idea; add **sparkle** (tiny view-dependent glints on lit faces, desktop only), **groomed corduroy** (faint stripes on slopes that have been groomed) and a **packed-snow tint** on walkways and queue corrals.
- **Ski tracks** (M0's nice-to-have): a 256 m render texture centred on the camera; the rider and near guests stamp lines; the terrain shader darkens and offsets the normal. Grooming wipes them each night.
- **Far mountains:** replace the blotchy 64 m far mesh with three layered silhouette ridges at 2, 4 and 7 km, each a single strip with its own haze value (the "stage flats" trick), much closer to the target look and cheaper.

---

## 2. Rider model upgrade (phase P2)

Your note: "make the skier model better". The M0 rider is boxes on a bone chain. The new one:

- **One skinned mesh** (about 1,400 triangles) generated in code around the same procedural skeleton, so all M0 posing (crouch, lean, grabs, tumble, IK) keeps working. Each vertex is weighted to one or two bones, so knees, elbows and the waist bend smoothly instead of boxes crossing.
- **Shape:** tapered legs with knee pads, ski boots with buckles (skis) or soft boots with bindings (board); puffy jacket built from rings with a collar, hood bump and a chest zip line; gloves with a separate thumb; helmet with a vent ridge, goggle strap and a reflective lens (two-tone so it catches the sun); a little backpack on the board rider.
- **Colours:** 3 slots (jacket, pants, helmet) with 8 presets for now (full customisation is M3). The guests use the same mesh at low detail.
- **Poles** become proper poles with baskets and grips; **skis** get a slight sidecut and twin tips; the **board** gets a rounded outline and bindings.
- **Motion polish:** a short **secondary motion** spring on the head, backpack and hood; arms swing on pole plants when skating on flats; a **landing squash** (knees absorb, 0.15 s); a clean **"wobble" pose** on sketchy landings; better grab shapes (Japan, Method, Screamin' Seaman with legs out, Octo).
- **Check:** side-by-side turntable shots of old and new rider, plus 6 grab poses, before moving on.

---

## 3. Build mode (phase P4)

### 3.1 Camera and controls
- **Build camera:** orbit, pan, zoom (8–600 m), tilt 25–75°. Mouse: right drag orbit, middle/left drag pan, wheel zoom. Gamepad: sticks plus triggers. Touch: one-finger pan, two-finger pinch/rotate.
- **Tilt-shift** blur at the top and bottom of the screen when zoomed out past 250 m (desktop only), the miniature look of the target style.
- **Switch:** `B` / pause-menu "Build" / the touch "Build" tab. Going back to riding, the camera swoops down to the rider, who drops in at the nearest lift top or where you tapped ("Drop in here").

### 3.2 Toolbar (phone-first bottom bar, icons with labels)
`Slopes` · `Lifts` · `Buildings` · `Info` · `Bulldoze` · speed `⏸ 1× 2× 4×` · money · day and time · stars.

### 3.3 Slope tool
- Tap points down the hill; the slope is a **Catmull-Rom spline corridor**, 10–60 m wide (handle at each point), drawn as a translucent band in its colour.
- **Grading (European):** worked out from the steepest sustained 30 m section: beginner area < 15 %, blue < 25 %, red 25–40 %, black > 40 %; you can push it one step harder by hand. The colour shows live while you draw, with the steepest section highlighted.
- **Signs:** a numbered sign at the top ("1 Meadow", "2 Creek Run") in the slope's colour; poles every 50 m on both edges (as in M0).
- **Cost:** $6 per metre of length × width/20 (a 400 m, 30 m wide blue costs $3,600), plus $40/day upkeep.
- **Validation:** red warnings for "no lift reaches the top", "ends nowhere", "crosses a lift line", "too steep for its colour".

### 3.4 Lifts (M1 set)

| Lift | Cost | Per metre | Capacity/h | Speed | Max length | Upkeep/day | Notes |
|---|---|---|---|---|---|---|---|
| Magic carpet | $3,000 | $40 | 600 | 0.8 m/s | 120 m | $60 | Beginners only, covered tunnel option +$1,500 (gimmick: guests wave from inside) |
| T-bar | $8,000 | $90 | 900 | 2.5 m/s | 700 m | $150 | Board riders −5 fun; it bends around nothing, so it needs a straight line |
| 2-chair | $18,000 | $160 | 1,200 | 2.0 m/s | 1,100 m | $320 | Towers every ≤ 60 m, 6 m clearance, auto-placed on the profile; drag to move |

- **Placement:** tap bottom station, tap top station; the line shows its profile, towers and clearance live; red where it clips terrain, trees or the power line. Trees under the line can be cleared for $25 each.
- **Stations:** chunky timber stations with a bullwheel that turns, an operator hut with a lit window, a "maze" **queue corral** (rope and posts) sized to the capacity.
- **Moving parts:** chairs (instanced) loop on the cable at the real speed; T-bar hangers swing; the carpet belt scrolls.
- **Queues are real:** guests line up in the corral; wait time shows on a little board at the station.
- **Ride every lift yourself:** skate into the corral (you skip the queue as the owner), sit down; the camera does a slow orbit and shows a "postcard" view of your resort; press jump to drop off at the top.

### 3.5 Buildings (M1 set)

| Building | Cost | Upkeep/day | Effect |
|---|---|---|---|
| Ticket office | $4,000 | $80 | Required to open; sells passes; 2 windows (guests queue) |
| Car park | $2,500 | $20 | 60 cars: caps arrivals at about 150 guests/day; a second one doubles it |
| Rental shop | $5,000 | $90 | Guests without gear can ski (about 40 % of beginners); $15 each |
| Café | $6,000 | $110 | Food and warmth; $9 per visit; tables outside with umbrellas |
| Toilets | $1,500 | $30 | Toilet need; tiny wooden hut with a heart cut in the door |

- Placed on a 2 m grid, rotate in 15° steps, must touch flat-enough ground (< 12 %), door faces a path. Walking paths are drawn automatically to the nearest slope or lift (packed snow tint).
- **Gimmick:** each building has a little idle life: the café chimney smokes and a steaming cup sign spins, the rental shop has skis racked outside that disappear as they are rented, the ticket office flag flaps.

---

## 4. Guests (phase P5)

- **Up to 150 at once in M1** (phones 100). Profile: skill (beginner 45 %, intermediate 35 %, advanced 18 %, expert 2 %), gear (ski 70 % / board 30 %), budget, group (solo, couple, family of 3–4, friends of 3), preferences (groomers, trees, views).
- **Needs (0–100):** energy, hunger, warmth, toilet, fun; decay per in-game hour 8 / 10 / 6 / 12 / −; fun rises with good runs, drops with queues and too-hard slopes.
- **Decisions:** at each node of the resort graph (lift bottoms and tops, slope ends, building doors, car park) a guest scores every option (skill match, preference, crowding, queue length, distance, urgent needs) and picks one with a softmax so behaviour stays varied. Groups decide together and wait for each other at the bottom.
- **Movement:** near guests (< 150 m from the camera) follow the slope spline with a lateral weave (beginners snowplough in wide zig-zags, experts carve short turns), avoid each other, fall over sometimes (beginners on reds); far guests move along the graph only (time to traverse) and draw as cheap impostors.
- **Rendering:** the new rider mesh **baked into vertex animation textures at start-up from our own procedural rig** (no animation files): ski carve L/R, snowplough, walk, idle in queue, sit on chair, hold T-bar, fall and get up. Drawn instanced, outfit colours per instance, one draw call per LOD.
- **Thought bubbles** over guests ("This lift line is ridiculous", "Best hot chocolate!", "Too steep for me…"), and a **guest list** plus **follow camera**: tap a guest to see needs, thoughts, money spent and route.
- **Gimmick:** a guest who has a great day leaves a **postcard** in the season report ("Lovely little hill! — Mia, 34").

---

## 5. Economy, rating and time (phase P6)

- **Start:** $20,000, empty hill, village and car park field. You cannot go bankrupt; below $0 a "lean season" prompt offers to sell things back at 60 %.
- **Income:** day pass (default $25, slider $10–80), rental, café, parking ($3). **Costs:** building, upkeep, staff (included in upkeep), grooming ($0.02/m² of groomed slope per night).
- **Arrivals:** base demand × star rating × price fairness × parking cap, with a morning peak and an afternoon trickle.
- **Rating (1–5★):** happiness 40 %, slope variety and quality 20 %, lift waits 15 %, facilities 10 %, safety 10 %, park 5 % (no park in M1, so max 4.75★ there; the plan's weighting stays).
- **Day:** 09:00 opening bell, 16:30 close, about 8 real minutes at 1×. Grooming happens overnight (you see the snowcat's lights in a 6 s night transition).
- **Season:** 20 days (December to March, compressed). The **season report**: profit chart, best day, guests per day, rating trend, your best combo, 3 guest postcards, and the goals for Birchwood: **150 guests/day, 3★, a 5,000-point combo** (the combo goal is the "build it, then ride it" link).

---

## 6. Ride ↔ build, tutorial, challenges (phase P7)

- **Seamless switch** with no loading: the simulation keeps running while you ride; build mode can pause it.
- **Tutorial (Birchwood only, skippable, about 6 minutes):** 1) place a magic carpet in the meadow; 2) draw a beginner slope beside it; 3) place the ticket office and car park; 4) open the resort and watch the first bus arrive; 5) press Ride and take the carpet yourself; 6) build a T-bar and a blue run, and get a first guest thought. A friendly mountain guide, "Ida", speaks in short text bubbles (no voice).
- **3 hand-made challenges** on Birchwood, each with bronze/silver/gold:
  1. **"Village Slalom"**: 14 gates down the west shoulder to the village (time: 0:48 / 0:42 / 0:38).
  2. **"Birch Glade Flags"**: collect 10 flags hidden in the birch glades and the creek gully in one run (any time; medals by how many: 6 / 8 / 10).
  3. **"Barn Jump"**: one trick off the hidden barn jump (points: 800 / 1,500 / 2,500).
  Challenge starts are little wooden start huts with a flag; a ghost of your best run plays on retries (M1 keeps only your own best).

---

## 7. Saving, UI and tech (phases P3 and P8)

- **Save:** versioned JSON (resort objects, slopes, money, day, season stats, guests as aggregates, medals, best combo, settings) in `persistentDataPath` (IndexedDB on the web) with an autosave every in-game midnight and on pause. Title screen: Continue, New resort, Free ride, Settings, Credits. Export/import of a save file comes later (M2).
- **UI:** stay on uGUI (it worked well in M0 on touch); rounded white panels, icon buttons, the Lilita One font; bottom sheets on phones.
- **Data:** `LiftDef`, `BuildingDef`, `SlopeRules`, `MountainDef`, `ChallengeDef` ScriptableObjects so numbers can be tuned without code.
- **Performance targets:** desktop 60 fps with 150 guests, phone 30 fps with 100; ≤ 150 draw calls on phones; download ≤ 35 MB (M0 is 7.4 MB, so there is room).
- **Tests:** EditMode tests for slope grading, lift capacity and queue maths, economy day ledger, rating, needs decay, save/load round-trip; the browser test grows a "build a carpet and a slope via script, open, fast-forward a day, check guests rode it" run.

---

## 8. Phases and checklist

| Phase | What | Check |
|---|---|---|
| P1 | Birchwood Hill terrain, set dressing, art pass (sky keys, sparkle, tracks, silhouette ridges) | Screenshots from 8 fixed views, fps on desktop and phone tiers |
| P2 | New rider model and motion polish | Turntable + grab poses, old vs new — **check-in 1 with you** |
| P3 | Resort data, save/load, title screen | Save round-trip tests |
| P4 | Build mode: camera, toolbar, slopes, 3 lifts, 5 buildings, lift riding | Build a full small resort by script and by hand; phone layout |
| P5 | Guests: profile, needs, decisions, queues, movement, VAT crowds, thoughts, follow cam | 150 guests at 60 fps; queue and choice sanity tests |
| P6 | Economy, rating, day cycle, grooming night, season report, goals | Ledger tests; one full fast-forwarded season |
| P7 | Ride ↔ build, tutorial with Ida, 3 challenges with medals | Tutorial played start to end by an autopilot |
| P8 | Performance and phone pass, publish v0.1 to the test page | **Final check with you** |

Everything stays on the test page (`games/peak-season-test/`) until you say it goes on the home page.
