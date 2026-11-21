# Ski Resort Tycoon: Game Plan

Working title: **Summit Season** (placeholder, easy to change)
Target: free browser game on the Baki Games site, in `games/summit-season/`
Engine: **Unity 6 LTS, URP, WebGL build**, using the same pipeline as Emberfall, Prop Hunt and Coldsnap

---

## 0. Decisions so far

| Topic | Decision |
|---|---|
| Tycoon depth | **Balanced.** Lifts, slopes, buildings, money, guest happiness, grooming, weather, ski patrol. Building and skiing get equal weight. |
| Structure | **4 hand-made mountains** unlocked by goals, plus a **free-build sandbox** |
| Devices | **Keyboard/mouse, gamepad, and touch on phones** |
| Gear | **Skis and snowboard**, switchable at any time, one shared trick system |
| Tricks | **Arcade combos.** Spins, flips, grabs, rails, manuals, multipliers, and landing quality matters. |
| Art | **The closest match to Grand Mountain Adventure 2's look**: minimalist flat-shaded low-poly, soft light, heavy atmospheric haze, tiny people. Palette, UI, characters and mountains are all our own. |
| Extras | Slope challenges · day/night and weather · character customization · photo mode and replays |
| Release | **Vertical slice first** (v0.1 at a test URL), then grow through updates |

---

## 1. Engine choice: Unity

**I recommend Unity.** Here's why it beats the alternatives for this game:

1. **The pipeline already exists.** The site already ships Unity WebGL builds with Brotli-compressed `.unityweb` files, a custom loading page, a fullscreen button, a "turn your phone" prompt and PWA manifests. Coldsnap goes further and serves **ASTC (phones) and DXT (desktop) texture variants**. We reuse all of that as is.
2. **3D at this scale needs an engine.** That means a large mountain, thousands of instanced trees, hundreds of animated guests, skinned riders, particles, shadows and post-processing. Three.js or Babylon.js would make a smaller download, but we would be writing an editor, an animation system, an input layer and a UI framework from scratch.
3. **Godot 4** has weaker web export (no C# on web in most versions, and Safari/iOS trouble). That's a poor fit given phone support.
4. **Unity gives us the tools we need:** the Input System (keyboard, gamepad and touch from one action map), Cinemachine (chase and build cameras), Timeline (intros), Addressables (load later mountains on demand to keep the first download small), Burst and Jobs (guest sim and terrain edits; Burst compiles to WASM), and ScriptableObjects for data-driven content.

**Caveats we plan around:** WebGL is single-threaded by default, so the guest sim must be cheap. Memory is capped on iOS Safari, so we target under 600 MB of heap. We avoid Unity Terrain in favour of a custom heightfield mesh, which gives the flat-shaded look and fast runtime editing (see §11).

**Download budget:** at most about 35 MB for first play (engine + UI + Mountain 1). Each later mountain is an Addressables bundle of about 5–10 MB, fetched when you unlock it. That's in the same range as Emberfall (21 MB) and Iron & Ink (34 MB).

---

## 2. Design pillars

1. **"Build it, then ride it."** Every lift, slope and kicker you place is something you can ride yourself seconds later. Switching between building and riding takes one button and no loading screen.
2. **Calm, cosy and beautiful.** Soft light, quiet wind, small crowds clattering onto chairlifts. Money pressure exists but never punishes harshly.
3. **Easy to ride, deep to master.** A new player carves happily straight away. An expert chains a 30-second combo through the park.
4. **A living mountain.** Guests ski your runs, queue at your lifts, get hungry and cold, and fall over. Watching them is half the fun.
5. **Plays everywhere.** It feels good on a phone screen as well as on a monitor with a gamepad.

---

## 3. Core loop

```
            ┌─────────────── BUILD MODE ───────────────┐
            │ shape terrain · draw slopes · place lifts │
            │ buildings · park features · set prices    │
            └──────────────┬───────────────────────────┘
                           │  money, rating, guest feedback
           press [R] / tap │ ▲
           "Ride"          ▼ │  press [B] / tap "Build"
            ┌─────────────── RIDE MODE ────────────────┐
            │ ski or board anywhere · ride your lifts   │
            │ tricks & combos · challenges · photos     │
            └──────────────┬───────────────────────────┘
                           │  rider XP, "hype", unlocks
                           ▼
              RESORT GROWS → GOALS MET → NEXT MOUNTAIN
```

- **The simulation keeps running in both modes.** In ride mode you're one of the guests. In build mode time can be paused or run at 1×, 2× or 4×.
- **Ride mode feeds the tycoon:** completing challenges and landing big tricks raises *Hype*, a short-term boost to visitor numbers ("A pro was spotted shredding your park!").
- **The tycoon feeds ride mode:** new lifts, slopes, park features and challenges are new things to ride. Unlocks such as gear and outfits come from both sides.

### Session flow
1. Title screen → **Mountains** map (4 peaks + sandbox) → choose a mountain.
2. Arrive by drone shot (Timeline) at a near-empty mountain with a car park and a small starting budget.
3. A short tutorial (Mountain 1 only): place a magic carpet, draw a green slope, open the resort, then ride it.
4. The **season** runs as a sequence of days (about 8 real minutes per day at 1×). Each season ends with a report: profit, rating, best day, best combo.
5. Meet the mountain's **goals** (for example 300 guests/day, a 4★ rating, $50k in the bank) to unlock the next mountain. You can keep playing every mountain forever after.

---

## 4. Mountains (campaign)

All names and layouts are original. Each mountain teaches something new.

| # | Mountain | Size | Theme | What it teaches | Goals to unlock the next |
|---|---|---|---|---|---|
| 1 | **Birchwood Hill** | 600 × 600 m, 250 m of vertical | Gentle forested hill next to a village | Basics: carpet, T-bar, chairlift, green and blue slopes, café, rental | 150 guests/day · 3★ · first combo of 5,000 pts |
| 2 | **Kestrel Ridge** | 1 × 1 km, 600 m | Long ridge with a natural bowl and cliffs | Terrain park, snowmaking, red slopes, night skiing | 400 guests/day · 3.5★ · park rated "Good" |
| 3 | **Frostvane Glacier** | 1.2 × 1.2 km, 900 m | High-altitude glacier, crevasses, strong wind | Weather management, gondola, wind holds, ski patrol, black slopes | 700 guests/day · 4★ · all glacier challenges |
| 4 | **Mount Aurel** | 1.5 × 1.5 km, 1,400 m | Huge alpine peak, multiple valleys, a village at the base | Everything together: hotels, a cable car, couloirs, a pro competition event | Endgame: 5★ "World Class Resort" |
| S | **Sandbox** | Choose from the 4 maps or a generated one | Unlimited money toggle, terrain sculpting, free time of day | Creative play | — |

Each mountain has **hand-placed natural features** (cliff bands, wind lips, tree glades, natural half-pipes, frozen lakes) and **6–10 hand-made challenges** that exist from day one, so ride mode is fun before you build anything.

Later updates could add new mountains; the plan leaves room for that.

---

## 5. Tycoon systems

### 5.1 Terrain and snow
- **Light terrain shaping** in campaign (flatten, smooth, raise or lower within a radius) costs money per m³. The sandbox allows unlimited sculpting.
- **Trees** can be cleared (cost) or planted. Glades are a feature: guests who like trees and pros both enjoy them.
- **A snow-depth grid** (8 m cells) holds a depth and a surface type per cell:
  - `Groomed` (fast, predictable, needs a groomer)
  - `Packed` (default after traffic)
  - `Powder` (fresh after snowfall; slow for beginners, a joy for experts)
  - `Moguls` (grow on ungroomed steep runs with traffic)
  - `Ice` (after warm days or heavy traffic; faster and slippery)
  - `Slush` (warm afternoons, slow)
  - `Bare` (closes slopes; guests get unhappy)
- **Snowmaking:** snow cannons near slopes add base depth overnight. They cost power.
- **Ski tracks:** both the rider and guests leave real carved lines in the snow (render-texture trails). Grooming wipes them overnight.

### 5.2 Slopes (pistes)
- **Drawing tool:** click points down the mountain and the slope becomes a spline corridor 10–60 m wide. You can adjust it with handles.
- **Difficulty is worked out from the steepest sustained section**, and you can push it one step harder by hand:

  | Colour | Max gradient | Who rides it |
  |---|---|---|
  | 🟢 Green | < 25% | Beginners and families |
  | 🔵 Blue | 25–40% | Intermediate |
  | 🔴 Red | 40–55% | Advanced |
  | ⚫ Black | > 55% | Experts |
  | 🟠 Freeride | unmarked | Experts, avalanche risk |
- Slopes link to **lift bottoms and tops, other slopes and buildings** in a navigation graph. Disconnected slopes show a warning.
- Each slope has **open/closed, grooming priority, signage and night lighting** (floodlights, which are a separate purchase).
- **Slope rating** depends on length, variety, snow quality, crowding and how well its difficulty matches its colour.

### 5.3 Lifts

| Lift | Unlock | Capacity/hr | Speed | Notes |
|---|---|---|---|---|
| Magic carpet | M1 | 600 | slow | Short and flat, beginners only |
| Rope tow / T-bar | M1 | 900 | medium | Snowboarders dislike it (−happiness) |
| 2-chair | M1 | 1,200 | medium | Cheap chairlift |
| 4-chair (detachable) | M2 | 2,400 | fast | Workhorse |
| 6-chair bubble | M3 | 3,200 | fast | Weather-protected, expensive |
| Gondola | M3 | 2,800 | fast | Can stop mid-station; foot passengers |
| Cable car | M4 | 800 | very fast | Long spans, huge vertical |

- **Placement:** click the bottom station, then the top. Towers are placed automatically on the terrain profile with clearance checks, and you can drag them. Red highlights show where the cable clips terrain or trees.
- **Queues are real:** guests line up in corrals, with visible wait times. Long waits hurt happiness. Each lift has an **operating speed**, **open hours** and an **upkeep** cost.
- **Breakdowns** happen occasionally, more often as lifts age, and slightly more in wind. Mechanics (bought with a maintenance hut) fix them.
- **Wind holds:** exposed lifts (cable car, gondola, high chairs) close above a wind threshold.
- **In ride mode you can ride every lift:** skate into the line, sit on a real chair, and the camera does a lazy orbit while you look at the resort. You can skip the queue, since you're the owner.

### 5.4 Buildings

| Building | Function |
|---|---|
| Ticket office | Required. Sets lift pass price. Larger versions mean shorter entry queues |
| Car park / bus stop | Arrival capacity, which caps guests per day |
| Rental shop | Guests without gear can ski. Income |
| Ski & snowboard school | Beginners progress faster and choose harder slopes over the season |
| Café / hot chocolate hut | Food, warmth, rest |
| Restaurant (mountain-top) | Bigger income, view bonus |
| Toilets | Comfort need |
| Ski patrol hut | Responds to crashes and avalanche control; needed for black and freeride slopes |
| First aid | Injured guests recover here instead of leaving angry |
| Groomer garage | Owns a piste-basher; grooms the chosen slopes overnight (you can watch it at night) |
| Maintenance hut | Mechanics for lifts and snow cannons |
| Snow cannon | Snowmaking, see §5.1 |
| Floodlights | Night skiing on a slope |
| Hotel / chalet (M4) | Overnight guests, which keeps guest numbers up |
| Decorations | Benches, flags, lights, fir trees, ice sculptures (small happiness and rating boost) |

### 5.5 Terrain park builder
- Prefab features you can place, rotate and scale: **kickers (S/M/L/XL), step-downs, tabletops, rails (flat, down, kinked, rainbow), boxes, bonk logs, wall rides, a half-pipe (dug into terrain), and a quarter-pipe**.
- A **park rating** is based on flow (spacing and speed between features), variety and difficulty spread.
- **Park guests** (a guest type) ride the features with simple tricks. Pros show up once the park is rated "Great".

### 5.6 Guests

**Profile:** skill (beginner, intermediate, advanced, expert), gear (ski or board), budget, group (solo, couple, family, friends), and preferences (groomers, powder, trees, park, views).

**Needs** (0–100, decaying): energy, hunger, warmth, toilet, fun. They also feel *crowding* and *queue frustration*.

**Decision making:** at each graph node, a guest scores the available options (slope, lift, building). The score uses skill match, preference, crowding, snow quality, distance and need urgency, and the guest picks one with a softmax so behaviour stays varied.

**Behaviour you can see:** wobbly beginners in a snowplough, carving experts, families in a line, groups waiting for each other, crashes with yard sales (skis flying), and thought bubbles ("This lift line is ridiculous", "The powder on Ridge Run is amazing!").

**Progression:** with a ski school, beginners improve over the season. A resort that grows good skiers earns more.

**Feedback:** a **guest list** and **follow camera** let you click any guest to see their thoughts, needs and route.

### 5.7 Economy
- **Income:** lift passes (day, half-day, night), rental, ski school, food and drink, parking, hotel.
- **Costs:** construction, daily upkeep per lift and building, power (snowmaking, lights), staff wages (automatic, tied to buildings), and grooming.
- **Pricing:** one global slider per income source. Guests compare price with your star rating.
- **Loans:** one small loan line with fixed interest. Not punishing.
- **Bankruptcy:** you can't go bankrupt. If money runs out, a "lean season" prompt lets you sell buildings. That keeps things cosy.

### 5.8 Resort rating (1–5★)
A weighted score of guest happiness (40%), slope variety and quality (20%), lift wait times (15%), facilities (10%), safety (10%) and park (5%). Hype from ride mode gives a temporary bonus to arrivals, not to the rating itself.

### 5.9 Staff (light)
No hiring screens. Each building brings its staff automatically and wages show as upkeep. Some staff are visible in the world: lift operators, patrollers on snowmobiles, the groomer driver, café workers.

### 5.10 Safety (light)
- **Crashes** happen more on slopes that are too hard for the guest, icy or crowded. Patrol response time comes from distance to the nearest patrol hut.
- **Avalanche risk** builds on freeride and steep terrain after heavy snow. Patrol does control work at dawn, and the slope stays closed until then. A natural avalanche is a rare, dramatic event that closes a zone (and it can be ridden away from in ride mode).

---

## 6. Riding and tricks

### 6.1 Feel
- **A custom kinematic controller on the heightfield**, not a Rigidbody. That gives predictable, tunable feel and cheap collision. The terrain height and normal at any point come from bilinear sampling of the heightfield, so there are no mesh colliders on terrain.
- **Carving model:** gravity acts along the slope. Velocity steers toward the ski or board heading according to grip, which is set by edge angle, snow type and speed.
  - Press to tighten a turn and **carve** (grip rises, spray fx).
  - Brake: **skid or hockey stop** (heavy spray).
  - Powder: slower, floaty, with deep spray. Ice: low grip, chattering sound.
- **Skis vs snowboard:**

  | | Skis | Snowboard |
  |---|---|---|
  | Turning | Quicker edge changes | Wider heel/toe arcs |
  | Flat sections | Can skate/pole | Slow, can unstrap and walk on long flats |
  | Switch riding | Possible, small penalty | Natural (regular/goofy) |
  | Grabs | Ski-specific set | Board-specific set |
  | Spin feel | Slightly faster | Slightly slower, more style points |

- **Off-slope:** you can ride anywhere: trees, cliffs, frozen lakes. You can also take off your skis or board and **hike** uphill slowly. Hiking to an untouched line is part of the fun.
- **Speed sense:** FOV widens with speed, wind gets louder, snow particles streak, the camera shakes slightly, and the camera drops lower at speed.

### 6.2 Controls

| Action | Keyboard + mouse | Gamepad | Touch |
|---|---|---|---|
| Steer | A/D | Left stick | Left half: drag-stick |
| Tuck / brake | W / S | Stick up/down | Stick up/down |
| Jump (hold to charge an ollie) | Space | A / ✕ | Right button |
| Spin / flip in air | A/D, W/S | Left stick | Stick in air |
| Grab (+ direction for type) | Shift (+WASD) | RB / R1 (+ stick) | Grab button + stick |
| Tweak / style a grab | Mouse move | Right stick | — (auto style) |
| Manual / butter | Ctrl + W/S | LB / L1 + stick | Hold stick fully + hold jump |
| Grind | Automatic snap on contact | Auto | Auto |
| Reset to slope | R | Y / △ | Reset button |
| Switch skis/board | Tab | View/Select | Gear button in pause menu |
| Build mode | B | Menu → Build | "Build" tab |
| Camera | Mouse | Right stick | Right half drag |
| Photo mode | P | D-pad down | Camera icon |

All bindings can be remapped (Input System rebinding UI).

### 6.3 Trick system

**Rotations:** spins happen in 180° steps (180, 360, 540 … 1440). **Flips** are front or back. **Off-axis "corks"** come from spin + flip together. **Switch** takeoffs and landings are tracked.

**Grabs** (hold for points; tweaking adds style):
- Skis: Mute, Safety, Japan, Tail, Blunt, Critical, Octo, Screamin' Seaman (legs out)
- Snowboard: Indy, Melon, Mute, Stalefish, Method, Tail, Nose, Japan

**Rails and boxes:** 50-50, boardslide/lipslide (side approach), plus spin-on and spin-off.
**Ground:** butters (nose/tail press, spins on the ground), manuals, ollies, nollies.
**Special:** wall-ride, tree tap (bonk), sign bonk, pole jam, and backflips off cliff drops.

**Naming:** tricks are named automatically from their parts, for example *"Switch Cork 900 Mute"* or *"Backflip Tail → 50-50 → 360 Off"*.

**Scoring:**
```
trick points  = base(rotation, flip, grab, grind length)
               × style (tweak, clean grab hold, landing quality)
               × novelty (repeat penalty: −25% each repeat within a combo)
combo score   = Σ trick points × combo multiplier (+1 per trick, +0.5 per distinct trick type)
```
- **The combo stays alive** through airs, grinds, manuals and butters. It breaks after more than 0.6 s of plain riding, or on a crash.
- **Landing judgement** compares the angle between the gear's forward axis and velocity, and between the body up axis and the slope normal:
  - *Perfect* (< 10°): ×1.5 and a speed boost
  - *Clean* (< 25°): ×1.0
  - *Sketchy* (< 45°): ×0.5, wobble animation, combo continues
  - *Crash* (≥ 45°, or landing on your head): combo lost, procedural tumble, then a quick reset prompt
- **The HUD** shows the trick text stack, the multiplier and the combo timer bar. The minimal UI fades away when you're not doing tricks.

### 6.4 Animation
- **Procedural plus authored blend:** authored poses for grabs, crouch and tuck, with procedural lean in turns, IK for feet on the gear, and spring-damped arms and head.
- **Spins and flips are driven by code** (rotation is exact, so landings feel fair). Grabs blend in on top.
- **Crash:** an active "tumble" system (procedural roll along the slope with flailing limbs) instead of full ragdoll physics, which is cheaper and works fine on WebGL. Skis or board can pop off.

### 6.5 Cameras
- **Ride:** a Cinemachine chase cam that looks ahead in the direction of travel, plus an "air cam" that pulls out during big airs and a ride-the-lift orbit cam.
- **Build:** a top-down/isometric free camera (pan, orbit, zoom, tilt) with a slight tilt-shift look when zoomed out, and snap-to-mountain-overview.
- **Follow guest:** click a guest to follow them.
- **Transition:** going from build to ride, the camera swoops down to the rider, who drops in from the nearest lift top or from the clicked spot.

---

## 7. Challenges

- **Types:** slalom (gates), giant slalom, downhill time trial, trick score zone, big air (single jump score), rail line, "collect the flags", follow-the-guide (chase a ghost through a hidden line), and descents with no crash allowed.
- **Hand-made:** 6–10 per mountain, from easy to brutal, each with **bronze, silver and gold** medals.
- **Player-built:** a **challenge tool** in build mode lets you place gates, start and finish lines, trick zones and flag pickups on your own slopes. Challenges you build also attract guests (racing events raise Hype).
- **Ghosts:** your best run is recorded (rider transforms at 20 Hz, compressed) and plays back as a translucent ghost.
- **Events (M2+):** occasional scheduled events such as a *Night Slalom Cup*, a *Big Air Saturday* or a *Pro Invitational*. You compete against AI rivals' ghost scores, and winning gives a Hype boost and cosmetics.

---

## 8. Day/night and weather

- **Day cycle:** dawn grooming → 9:00 open → lunch rush at the cafés → golden-hour light → 16:30 close, or night skiing until 21:00 on lit slopes. At night you see groomers working, lights in chalets, and snow cannons firing.
- **Lighting:** one directional sun on an authored gradient (colour and intensity per hour), a sky gradient shader, height fog and distance haze, which define the minimalist look. Night uses floodlight cones (baked-looking light cards, not real-time point lights, so phones stay fast).
- **Weather** (seeded forecast that you can see 3 days ahead):

  | Weather | Effect |
  |---|---|
  | Bluebird | Happiness bonus, more arrivals |
  | Light snow | Gentle powder top-up |
  | Storm | Big powder, poor visibility, wind holds, fewer arrivals today, a **powder rush** tomorrow |
  | Fog/whiteout | Visibility down, more crashes, flat light (the rider sees fewer terrain details) |
  | Warm spell | Slush in the afternoon, ice the next morning, snow base melts → snowmaking matters |
  | High wind | Exposed lifts close, wind-loaded slopes raise avalanche risk |

- **Season curve:** early season has thin base (snowmaking is vital), mid-season is peak, late spring brings slush and sunshine.

---

## 9. Character customization

- **Rider creator:** body type, skin tone, hair, and face from simple presets (low-poly style, no realistic faces).
- **Slots:** helmet or hat, goggles, jacket, pants, gloves, backpack, and skis or board (each with a shape and a graphic).
- **Colours:** every item has 2–3 tint slots with a curated palette plus a free colour picker.
- **Unlocks come from play:** challenge medals, combo milestones, resort star ratings, events, and secrets hidden on the mountains (for example a hidden yeti-hat on Frostvane).
- **Gear is cosmetic only**, so feel stays consistent. One exception might be a "powder ski" with wider visuals and slightly more float, as an opt-in style.
- **Guests** pick outfits at random from the same item pool, so the crowd stays colourful and matches the art style.

---

## 10. Photo mode and replays

- **Replay buffer:** the last 45 s of rider state (position, rotation, pose parameters, fx events) is always recorded in a ring buffer.
- **Instant replay:** after a big combo or a crash, press a button to watch it. You get scrub, slow-mo (0.1–1×) and camera presets (chase, side-on, fixed tripod, drone orbit).
- **Saved highlights:** keep up to 10 clips per mountain as recorded data (tiny), not video.
- **Photo mode:** pause, free camera within a radius, FOV, roll, depth of field, exposure, filters (film, warm, cool, B&W, vintage), letterbox, hide UI and rider pose presets.
- **Saving photos:** a `.jslib` plugin calls `canvas.toBlob` and downloads a PNG, or opens the share sheet on mobile through the Web Share API.

---

## 11. Art and audio direction

### 11.1 Visual style (as close to GMA2's feel as we can get without copying it)
- **Terrain:** a flat-shaded low-poly heightfield (2 m grid near you, coarser far away). Snow is near-white with a **slight blue in shadows** and a **warm peach tint in sunlight**. Rock bands show through on steep faces, set by slope angle in the shader.
- **Atmosphere:** strong **height fog and distance haze** that fades far mountains into the sky colour. This is the main thing that sells the look.
- **Trees:** simple conical low-poly firs and birches in a few sizes, instanced by the thousands, with a subtle wind sway in the vertex shader.
- **People:** **tiny, simple, stylised figures** (no faces at gameplay distance) with colourful outfits that pop against the white snow.
- **Buildings:** chunky, simplified alpine wood-and-stone shapes with warm window glow at night.
- **Snow fx:** carve spray, powder clouds, falling snow, sparkle in sunlight, and real ski track trails.
- **UI:** clean, minimal and rounded. Soft white panels with an icon-first design so it works on phones. Our own font pairing (open-licence, like the Nunito/Lilita One already used on the site), our own colour palette and our own icons.
- **Shaders (URP):** one custom terrain shader (flat normals from derivatives, snow/rock blend, track RT, fog), one "toon-soft" lit shader for props and characters, plus a sky gradient. Post-processing is limited to colour grading, a bloom touch and (desktop only) SSAO-lite.

### 11.2 Audio
- **Riding:** layered snow surface sounds (groomed hiss, powder whoosh, ice scrape), wind that rises with speed, binding clicks, landing thuds, and crash tumbles.
- **Resort ambience:** distant chatter, lift motor hum and chair clank over towers, the café door bell, snow cannon roar, and the groomer's engine at night.
- **Music:** calm lo-fi/acoustic tracks for building, more upbeat ones in ride mode, with a crossfade between modes. Sources are CC0/royalty-free or your own tracks (open question).
- **UI:** soft wooden clicks and a cash-register "ting" for income.

---

## 12. Technical architecture

### 12.1 Project setup
- **Unity 6 LTS**, URP (mobile-friendly renderer asset plus a desktop "high" asset chosen at runtime), and the new Input System.
- **Packages:** Cinemachine, Addressables, Burst, Collections, Mathematics, Timeline, TextMeshPro and UI Toolkit (or uGUI; see §12.6).
- **Build:** WebGL, Brotli, a custom WebGL template forked from Coldsnap's (loader, rotate prompt, fullscreen, PWA), and **ASTC plus DXT** texture variants.

### 12.2 Folder layout
```
Assets/
  _Game/
    Core/          GameManager, SaveSystem, TimeOfDay, Settings, EventBus
    Terrain/       Heightfield, ChunkMesher, SnowGrid, TrackRT, Sculpt tools
    Resort/        Slopes (splines), Lifts, Buildings, ParkFeatures, NavGraph, Economy, Rating
    Guests/        GuestSim (Burst), GuestRenderer (VAT instancing), Needs, Decisions
    Rider/         RiderController, Carving, AirTricks, Grinds, Scoring, Animation, Crash
    Challenges/    Gates, Zones, Ghosts, Events
    Weather/       Forecast, SnowFall, Wind, Fog, Avalanche
    Cameras/       RideCam, BuildCam, PhotoMode, Replay
    UI/            HUD, BuildMenu, Panels, Touch controls
    Data/          ScriptableObjects: LiftDef, BuildingDef, MountainDef, TrickDef, ItemDef…
  Mountains/       Birchwood, Kestrel, Frostvane, Aurel (Addressable scenes + heightmaps)
  Art/ Audio/ Plugins/WebGL/*.jslib
```

### 12.3 Key systems
- **Heightfield terrain:** a 16-bit heightmap per mountain (authored in an external tool or with in-editor brushes), split into 64 m chunks with 2–3 LOD levels. Runtime sculpting edits the array and rebuilds only the chunks it touches. Height and normal lookup is O(1).
- **Snow grid:** a parallel 8 m grid of depth and surface type, updated once per in-game minute, and sampled by the rider, guests and the terrain shader (packed into a small texture).
- **Ski tracks:** a top-down render texture around the camera in rolling world space. Riders and guests stamp trail quads into it. The terrain shader darkens and offsets normals where it's stamped. Grooming clears regions.
- **Navigation graph:** nodes are lift stations, slope junctions and building doors. Edges are slopes (with difficulty, length and snow), lifts and walking paths. It's rebuilt incrementally when you place things.
- **Guest simulation (Burst job, about 10 Hz for logic):**
  - **Near guests** (inside 150 m of the camera) get full spline-following motion with lateral weave, collision avoidance and animation.
  - **Far guests** are simulated on the graph only (time-to-traverse), drawn as cheap instanced impostors, or culled.
  - **Targets:** 400 active guests on phones, 1,200 on desktop.
- **Guest rendering:** **vertex animation textures** (ride, carve, snowplough, queue, sit on lift, walk, fall) drawn with `Graphics.RenderMeshInstanced`, with outfit colours set per instance. One draw call per LOD bucket.
- **Lifts:** cable spline plus a chair pool moving on it (instanced). Passengers parent to chairs. Capacity logic is decoupled from the visuals.
- **Rider:** a fixed-timestep kinematic integrator (100 Hz substeps). Ground contact comes from the heightfield; props and buildings use simple colliders. Grind detection uses spline proximity against park features.
- **Save system:** JSON (versioned) holding terrain diffs, the placed object list, economy, guests (aggregate only, regenerated on load), unlocks and the customization profile. It's written to `Application.persistentDataPath` (IndexedDB) with `FS.syncfs` through a jslib, with autosave every in-game day. There's also an **export/import save file** button.
- **Settings:** quality preset (auto-detected for phones), render scale, shadows, guest density, invert axes, colourblind-safe slope colours (pattern markers), and audio sliders.

### 12.4 Performance budgets

| | Phone (mid-range, Safari/Chrome) | Desktop |
|---|---|---|
| Target FPS | 30 (60 if headroom) | 60 |
| Draw calls | ≤ 150 | ≤ 400 |
| Triangles on screen | ≤ 300k | ≤ 1.5M |
| Visible guests (animated) | 150 | 500 |
| Trees | 6k instanced | 20k instanced |
| Shadows | 1 cascade, near only | 2 cascades |
| Heap | ≤ 512 MB | ≤ 1 GB |

### 12.5 Web integration with the site
- Builds go into **`games/summit-season-test/`** first (same pattern as `coldsnap-test` and `prop-panic-test`), then **`games/summit-season/`** when ready.
- The loading page uses the same template family: title, progress bar ("Waxing skis… 42%"), a controls hint, fullscreen, a rotate prompt for phones, the PWA manifest and icons, and "← All games".
- **A new card on `index.html`** with poster, gameplay video, a facts line ("Plays in your browser · ~35 MB · Keyboard and mouse, gamepad or touch") and a "Play now" CTA, plus a credits line in the footer for any CC0 assets or fonts.
- Mountain Addressables bundles are hosted next to the build with hashed names (immutable caching on GitHub Pages).

### 12.6 UI technology
- **uGUI** for the HUD and touch controls (mature on WebGL). Build menus are uGUI or UI Toolkit; pick one in M0 after a quick performance test on an iPhone. The UI is designed phone-first: large icon buttons, bottom sheets for menus, and safe-area aware.

---

## 13. Milestones

Each milestone ends with a playable build at the test URL.

### M0: Prototype ("Is riding fun?")
- Grey-box heightfield, the rider controller (skis only), carving, jumps, spins and flips, landing judgement, chase cam.
- Keyboard, gamepad and touch input.
- WebGL build with performance checks on desktop, Android Chrome and iOS Safari.
- **Done when:** riding down a grey hill and hitting a kicker feels good on all three input methods at target FPS.

### M1: Vertical slice, **v0.1** (first public test)
- **Birchwood Hill** with the final art direction (terrain shader, fog, trees, lighting).
- Build mode: slope drawing, magic carpet, T-bar and 2-chair, ticket office, café, rental, toilets, car park.
- Guests: needs, decisions and queues, about 150 of them, with VAT rendering.
- Economy, rating, a basic day cycle (no weather yet), and season reports.
- Riding: snowboard added, grabs, combos, a basic rail and box, crash tumble.
- Seamless build ↔ ride switching, riding lifts, save and load, the tutorial.
- 3 hand-made challenges.
- **Done when:** someone new can build a small resort, ride it, and want to keep going for 30+ minutes.

### M2: v0.2 "Park & Weather"
- Terrain park builder (all features), park rating, park guests.
- Weather system, powder, grooming, snowmaking, the snow surface grid, ski tracks.
- Night skiing and floodlights, the full day cycle.
- **Kestrel Ridge** and the Mountains map with goals and unlocks.
- Challenge tool (player-built), ghosts, medals.

### M3: v0.3 "Glacier & Style"
- **Frostvane Glacier**, the gondola and 6-chair, wind holds, ski patrol, avalanche risk, black and freeride slopes.
- Character creator and customization, the unlock system, guests using the item pool.
- Events (Night Slalom Cup, Big Air Saturday).
- Audio pass 2 and music.

### M4: v0.4 "Big Mountain"
- **Mount Aurel**, the cable car, hotels, the Pro Invitational.
- Photo mode, instant replay and saved highlights.
- Sandbox mode (including a generated mountain option).

### M5: v1.0 Release
- Balancing pass (economy curves, guest counts, scoring), accessibility, remapping, localisation hooks (English first).
- Performance pass on low-end phones, loading time optimisation.
- Trailer and gameplay video, poster, and the site card on `index.html`.

---

## 14. Content checklist (for v1.0)

- **Mountains:** 4 + sandbox
- **Lifts:** 7 types
- **Buildings:** about 15 types, plus about 20 decorations
- **Park features:** about 14
- **Tricks:** 8 ski grabs, 8 board grabs, spins to 1440, front/back flips, corks, 5 grind types, butters, manuals, and specials
- **Challenges:** about 32 hand-made (8 per mountain) + 4 events
- **Cosmetics:** about 80 items × colour tints
- **Guest animations (VAT):** about 12 clips
- **Music:** about 8 tracks; **SFX:** about 120

---

## 15. Risks and how we handle them

| Risk | Mitigation |
|---|---|
| Riding doesn't feel good | M0 exists only to answer this; tune before building tycoon features |
| Phone performance | Phone-first budgets, VAT crowds, instanced trees, guest LOD, no real-time point lights, and quality auto-detection |
| iOS Safari memory limits | Addressables per mountain, texture compression (ASTC), and capping the heap |
| Guest sim cost (single-threaded WebGL) | Burst, 10 Hz logic, graph-only sim for far guests |
| Scope creep | Ship v0.1 early; every extra feature is scheduled into a milestone above |
| Touch controls for tricks | Simplified touch scheme (auto-style tweaks), an early playtest in M0 |
| Download size | Budget tracked per build; Brotli; stripping; Addressables |

---

## 16. Open questions (to settle as we go)

1. **Final title:** "Summit Season" is a placeholder. Alternatives: *Powder Line*, *Lift & Line*, *Snowcrest Tycoon*.
2. **Music:** use CC0 or royalty-free tracks, or do you have tracks of your own (like the one on the site's promo)?
3. **Slope colours:** European style (blue/red/black) or North American (green/blue/black diamond)? The plan currently uses green + blue + red + black.
4. **Unity project location:** the repo only holds builds. Where does the Unity project live, and which Unity version is installed? (The plan assumes Unity 6 LTS.)
5. **Guest characters at close range:** keep them faceless and simple (closest to the target style), or give them simple faces when you follow one?
