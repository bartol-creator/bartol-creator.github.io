# Peak Season: Challenges (GMA2-style)

Status: plan written 2026-11-25. Bartol went to sleep and said: plan, then build overnight, publishing to the test page after each tested step.

Build status 2026-11-26: P1 to P7 done, published to peak-season-test, peaktest PASS (now with a challenge section). Calibration lessons and the final bot table are in section 12.

## 1. What Bartol asked for

- Challenges modelled closely on Grand Mountain Adventure 2.
- Ghosts of your past runs.
- Ranks green, blue, red, black, with black the hardest.

His answers before sleeping:

| Question | Answer |
|---|---|
| How ranks work | **Per run.** Every challenge has 4 targets. Beat a target to earn that rank. Replay to rank up. |
| Types in v1 | **Race (slalom gates)** and **Trick score**. Big air and collectibles come later. |
| Mountains | **All of them.** Challenges are auto-placed along each mountain's real pistes, plus hand-placed ones on Birchwood. |
| Overnight | Plan, then build, publishing after each tested phase. |

What "copy GMA2" covers: we copy the **mechanics and flow**:
- start arches you ride into, then a countdown;
- gates, a timer and split deltas against your ghost;
- instant retry;
- a results card with targets;
- a challenge list with a warp to each start;
- markers on the map.

We do not copy GMA2's challenge names, art, sounds or levels. Peak Season keeps its own look and mountains.

## 2. The GMA2 loop we reproduce

1. **Find it.** Each challenge has a start arch on the mountain, with a floating name and icon you can see from far away. It also shows on the ski map and in the pause menu list, and you can warp to any start from either.
2. **Start it.** Riding into the start zone brings up a compact card: the name, the goal, your best, and the 4 rank targets with ticks for the ones you have. Tap **Start**, or press Enter or gamepad A. The screen fades and you stand at the start line. A 3-2-1-GO countdown runs, then the clock starts.
3. **Ride it.** The HUD shows:
   - the clock (race) or points (tricks);
   - your gate count;
   - a split delta against your ghost at every gate (green when ahead, red when behind);
   - a small chip for the rank you are on pace for.

   Your ghost rides beside you. **Retry** is one tap, or one key (R), from anywhere.
4. **Finish.** A results card shows:
   - the result and the rank earned, as a badge in its colour;
   - every target, each ticked or with the exact gap ("Black needs 41.0 s: you were 2.3 s slower");
   - a "New best!" line when you beat your best.

   Buttons: **Retry** and **Ride on**. Ranking up plays a small fanfare and confetti.
5. **Progress.** The best rank per challenge is saved globally, not per resort, like GMA2. Each mountain shows "Challenges: n/N black" on the world map, and the pause list shows a badge per challenge.

## 3. Ranks

| Rank | Colour | Badge shape (ski-map style) | Meaning |
|---|---|---|---|
| Green | #2f9e44 | circle | Finished cleanly at a relaxed pace |
| Blue | #1c6fd1 | square | Good run |
| Red | #d6332b | diamond | Strong run, few mistakes |
| Black | #1b1b22 | double diamond | Near-perfect: the hardest target |

- Results are compared against `Targets[4]`. Races use a time, and lower is better. Trick challenges use points, and higher is better.
- No target met means "No rank yet", and the card says exactly how far off green you were.
- The **old Birchwood medals migrate**: bronze becomes green, silver becomes blue, gold becomes red. Black needs a fresh run, so the old gold is worth one rank less, which is fair because black is new.

## 4. Challenge types (v1)

### 4.1 Race (slalom gates)
- **Course:** a start arch, then 10–30 gate pairs (giant-slalom panels alternating red and blue), then a finish arch.
- **Passing a gate:** your path (last frame to this frame) crosses the gate's line *between* its two poles. Crossing the extended line outside the poles is a **missed gate**, and so is reaching the next gate first.
  - A missed gate adds **+3 s**, with the banner "Missed gate 7: +3 s".
  - Missing more than a third of the gates disqualifies the run, with the banner "Missed 9 of 24 gates: disqualified (more than a third)".
- **Crash:** you get up as usual, and the clock keeps running. Crashing costs time, like GMA2. Rewind is turned off during a challenge, and its button and key become **Retry**, so a challenge time can't be rewound.
- **Leaving the course:** more than 60 m from the course line, or 120 s over the black time, cancels the run with the reason given.
- **Gates have no collision.** Panels wobble when brushed, so a gate never throws the rider.

### 4.2 Trick score
- **Course:** a start arch, then 3–6 features (kickers, plus a box or rail where one fits), then a finish arch.
- **Score:** points banked by the finish line. A combo still running at the line is banked as you cross it. Crashing loses the running combo, as it already does.
- **Leaving the course** (more than 60 m away) or a 180 s cap cancels the run with the reason given.
- Banner at the start: "Score as many points as you can before the finish".

### 4.3 Kept from today
- **Birch Glade Flags** (collect flags) stays, moved onto the new ranks. It counts as a hand-placed Birchwood challenge.
- **Barn Jump** becomes a one-feature trick challenge.

## 5. Where challenges come from

### 5.1 Hand-placed (Birchwood)
- Village Slalom (race): existing gates, but crossing is now judged as in §4.1.
- Birch Glade Flags (flags).
- Barn Jump (trick, one feature).
- **New:** Park Line (trick through Birchwood's existing park kickers and rails).
- **New:** Top to Village (a long race from the top to the village, about 25 gates).

### 5.2 Auto-placed (every other mountain)
`ChallengePlanner.Plan(mountainId)` runs right after `Mountain.Generate`, before `Park.Draw`, so trick features can be added to `Park.Kickers` and `Park.Rails` and get drawn and ridden like any other feature.

1. **Candidate runs** come from a new `MountainShape.AllRuns(list)`, which returns the shape's natural runs **in every mode**. Today `Runs()` returns nothing in Resort mode for real resorts, Gerlitzen and Sljeme. Runs shorter than 250 m or with less than 60 m of drop are skipped.
2. **Resampling:** each centreline is resampled every 2 m, with the cumulative length, slope, half width and difficulty (from the run colour).
3. **Race layout:**
   - Pick a stretch of up to 900 m that starts 6% below the run's top.
   - Gate spacing is 20 m on gentle ground, rising to 30 m on steep.
   - Gates alternate ±offset across the centreline, at 35% of the half width, clamped to 3–8 m.
   - Each pair is 5 m wide.
   - Reject a gate if a pole lands in an obstacle (`Obstacles.TopAt`), near a cliff (`NearCliff`) or outside the square. Then try again with a smaller offset, then skip it.
   - A race needs at least 10 gates.
4. **Trick layout:**
   - Pick a stretch of up to 700 m on a *different* run where possible, otherwise the lower half of the same run.
   - Place a kicker every 70–110 m, sized by slope and difficulty (small on green and blue runs, medium on red and black).
   - Each kicker needs a clear landing: no obstacle and no cliff for 30 m beyond its lip, with a landing slope between 8° and 32°.
   - Add one box where a 15 m straight fits.
   - A trick course needs at least 3 features.
5. **How many:** up to **2 races and 2 trick courses** per mountain. Prefer different runs, and prefer the runs that are longest and have the most drop.
6. **Deterministic:** the seed is the mountain id plus the run name. Each challenge id is `"{mountain}:{run}:{kind}"`. A **layout hash** (gate and feature positions, rounded to 0.5 m) is stored with each ghost. If code changes the layout, the old ghost is dropped, but the rank is kept.
7. **Names:** "{Run name} Slalom" and "{Run name} Trick Run". Duplicate names get " II".

### 5.3 Resort mode
- Challenges exist in Resort mode too, active while riding and hidden while building.
- `BuildingObj.Problem` refuses a building on a course: "The {challenge} runs over this spot. Build beside the course." This matches the lift rule.
- Lifts may pass over courses, and slopes may be built on them.
- Bulldoze never touches challenge features.

## 6. Targets (green, blue, red, black)

### 6.1 Race: a par-time model
`ParTime(course)` integrates a simple point-mass ride along the gate line, sampled every 1 m:
- gravity along the slope, minus snow friction (μ about 0.06) and air drag (k about 0.0035 v²);
- speed capped through each turn by the carve limit `v ≤ sqrt(a_lat · R)`, where `R` is the circle through three consecutive gate centres and `a_lat` is about 0.55 g;
- the same caps as the rider: top speed in a tuck, and the brake.

Then, multiplied by tuning constants that the bot calibrates (§6.3):

| Rank | Target time |
|---|---|
| Black | `par × 1.00` |
| Red | `par × 1.10` |
| Blue | `par × 1.25` |
| Green | `par × 1.55` |

Times are rounded up to 0.5 s.

### 6.2 Trick: points per feature
`ExpectedPoints(feature)` comes from `TrickNamer`'s base points: a clean 360 on a small kicker, a 540 with a grab on a medium one.

| Rank | Target |
|---|---|
| Green | sum of "a clean 180 on every feature" |
| Blue | sum of "a 360 on every feature" |
| Red | blue × 2.2: needs short combos (chain features before the bar runs out) |
| Black | blue × 4: needs one long combo through most of the course, with a variety of tricks |

Targets are rounded to "nice" numbers (2 significant figures). Calibrated with the trick bot (§6.3).

### 6.3 Calibration bots (test-only)
- **`RaceBot`:** steers toward the next gate centre with look-ahead, tucks on straights and brakes when over the par-model speed.
  - The planner's acceptance test: **every auto race on every mountain must be finishable by the bot** with at most 1 missed gate, and in green or better.
  - The bot's times tune the par constants so that black is hard but possible: a few % faster than a careful bot.
- **Trick bot** (the existing `Autopilot` logic, aimed at course features): must reach green on every trick course.
- An Editor eval script prints a table for each mountain and challenge: par, the bot's time, targets, gates and missed gates. This goes in the build report.

## 7. Ghosts of your past runs

### 7.1 What you see
- A translucent copy of **your own rider**, using the same model and the gear you used in that run (skis or board). It has a pale blue fresnel tint and no shadow. It fades out when it overlaps the camera or the rider, and has a small name tag such as "Best 41.2 s".
- **Ghost setting** (start card toggle, saved as a pref):

| Setting | What rides with you |
|---|---|
| **Best** (default) | your personal-best run |
| **Best + Last** | also your previous attempt, as a grey ghost |
| **Off** | no ghost |

- Splits: at each gate the HUD shows your time against the ghost's time at that gate. For trick courses it shows your points against the ghost's points at each feature.

### 7.2 Recording
- `GhostRecorder` samples at **15 Hz** from the start GO to the finish:
  - position (float32 ×3) and rotation (quaternion packed in 3 × int16);
  - pose inputs (packed bytes): state, crouch, tuck, edge, balance, skid, push bob, spin so far, grab id, wobbling, goofy;
  - speed.
- This is about 24 bytes per sample, so about 22 KB per minute, before deflate. Gate splits are stored as a float list.

### 7.3 Playback with the real body
- `RiderBody` reads about 15 values from `Rider` (State, GrabName, Goofy, PushBob, Gear, Position, Wobbling, Velocity, Tuck, SpinSoFar, Speed, Skid, Edge, Crouch, Balance) and listens to its events (Landed, Popped, Reset, GotUp, GearChanged, Crashed).
- **Refactor:** pull these into an `IRiderPose` interface. `Rider` implements it, and so does a new `GhostPose`, which interpolates the recorded samples and fires the events on state changes. `RiderBody.Build(IRiderPose, …)` then poses a second body for the ghost, with the material swapped for the new `PeakGhost` shader.
- Behaviour for the player's own rider stays identical. A Jolt test and a screenshot comparison guard this.

### 7.4 Storage
- Ghost files go in `Application.persistentDataPath/ghosts/{id}-best.bin` and `-last.bin`. On WebGL this is IndexedDB.
- **Phase 3 verifies that it survives a page reload.** If it doesn't, the fallback is PlayerPrefs base64, deflated, at 10 Hz.
- The file header holds: version, layout hash, gear, result, sample rate, count, and splits.
- Progress lives in PlayerPrefs `peak.ch` as JSON: `{id: {rank, best, runs}}`. It migrates `peak.medal.*`, `peak.best.slalom` and `peak.ghost.slalom`. The old slalom ghost is a position-only track, so it plays back as a simple pose: the Ski pose, facing along its path.

## 8. UI (uGUI via UiKit, 1280×720 scaler, phone first)

| Piece | Where / what |
|---|---|
| Start marker | A world-space arch in the colour of your best rank (orange when unplayed), with a floating label (name and type icon) visible from 250 m, drawn like ThoughtBubbles |
| Start card | Bottom centre while in the start zone: name, goal line, 4 rank chips (target and tick), your best, ghost toggle, **Start** (≥ 88 px tall for thumbs) |
| Countdown | Big 3, 2, 1, GO in the centre with a synth beep per number; the rider is held in Waiting |
| Challenge HUD | Top centre: clock or points, "Gate 7/24", split delta (fades after 2 s), on-pace rank chip; **Retry** top right (R key, or the rewind button on touch) |
| Results card | Result, rank badge, the 4 targets each with a tick or the gap, new best, splits summary, **Retry** / **Ride on** |
| Pause menu | A **Challenges** button opens a list of this mountain's challenges: badge, best, **Go** (warp to the start). During a run there is also **Quit challenge** |
| Ski map | Challenge icons at each start; tap one to warp there |
| Minimap | A small arch icon at each start |
| World map | Under each resort badge: "Challenges 2/4", with a black-rank count |

The rest of the normal HUD stays quiet during a challenge (zen-like), so the clock reads clearly.

Explain-everything rule: every cancel or refusal says why. Examples:
- "Crashed out of the course: more than 60 m off the line."
- "Can't start: you're on a lift."
- "Can't start while building."

## 9. Code layout

```
Assets/_Game/Challenges/
  ChallengeDef.cs        // data: id, name, kind, start/dir, gates, features, finish, targets, layout hash
  Ranks.cs               // enum Rank {None, Green, Blue, Red, Black}, colours, badge drawing, Rate(def, result)
  ChallengeSave.cs       // progress JSON, migration, ghost file IO
  ChallengePlanner.cs    // auto layout from runs + par model + trick targets
  BirchwoodChallenges.cs // hand-placed defs
  ChallengeWorld.cs      // meshes: arches, gate panels (wobble), labels, finish
  ChallengeRun.cs        // the state machine: Idle, Card, Countdown, Running, Results
  ChallengeHud.cs        // start card, countdown, HUD, results card, list
  Ghosts.cs              // GhostRecorder, GhostPose : IRiderPose, ghost body pool
  RaceBot.cs             // test bot
Rider/IRiderPose.cs      // interface extracted from Rider for RiderBody
Shaders/PeakGhost.shader
```

`World/Challenges.cs` is removed. `Boot` builds `ChallengeWorld`, `ChallengeRun` and `ChallengeHud` in place of `Challenges`.

`ChallengePlanner.Plan()` is called between `Mountain.Generate` and `Park.Draw`. `ResortData.medals` stays in the save file but becomes unused once migrated.

Test hooks (`Boot.Test`):
- `ch:list`: logs every challenge, its targets and its hash.
- `ch:go:<i>`: warp and start.
- `ch:bot:<i>`: start, then the bot rides it.
- `ch:finish:<i>:<result>`: force the results card.
- `ch:card:<i>`: show the start card.
- `ch:ghost`: record a bot run, then race it.
- `ch:list:ui`: open the pause list.

## 10. Phases (each one tested, published to peak-season-test, and committed)

| # | Phase | Done when |
|---|---|---|
| P1 | **Core:** ChallengeDef, Ranks, save and migration, generic gate crossing, the run state machine; Birchwood's 3 challenges ported to 4 ranks | `ch:bot` finishes Village Slalom with a rank; the old medals are migrated; peaktest passes |
| P2 | **UI:** start card, countdown, HUD, results card with gaps, Retry, pause list with warp; desktop and phone screenshots | screenshots readable on phone; every refusal explained |
| P3 | **Ghosts:** IRiderPose refactor, recorder, PeakGhost shader, playback, Best / Best+Last / Off, splits, persistent storage | the ghost visibly replays a bot run with the full body; it survives a page reload; the player's rider is unchanged |
| P4 | **Auto races:** AllRuns, planner, gates and arches on every mountain, par model, RaceBot calibration table | every mountain has races; the bot finishes all of them at green or better |
| P5 | **Trick courses:** planner features, trick targets, banking at the finish, two new Birchwood challenges | the trick bot gets green on every course; features ride well |
| P6 | **Maps:** ski-map icons and warp, minimap arches, world-map counts, building refusals on courses | screenshots |
| P7 | **Polish:** countdown, gate and finish sounds (synthesised), confetti on rank-up, a loading-screen tip, peaktest challenge flow (desktop and phone) | peaktest PASS; published; report written |

## 11. Risks and choices to confirm with Bartol

- **Rewind is off during challenges** (it becomes Retry). GMA2 doesn't let a rewound run count either.
- **A missed gate costs +3 s**, and a run is disqualified past a third missed. This could instead be "a missed gate fails the run", if he prefers it stricter.
- **The trick-target multipliers** (red = blue × 2.2, black = blue × 4) are guesses until he plays.
- **Auto-placed gates may sit oddly on some real-resort runs** with sharp bends. The bot test catches courses that can't be finished, but not ugly ones, so screenshots of each mountain go in the report.
- **Ghost storage on iPhone Safari:** IndexedDB may be cleared in private mode. The ghost silently disappears then, and ranks (PlayerPrefs) behave the same as they do now.
- **Auto trick kickers in Resort mode** take some ground on his mountain. Buildings are refused there, and it can be revisited.

## 12. Build notes (2026-11-26)

- Par model: the rider's own turn limit, v <= TurnShare * 3.375 R / (1 + 0.0625 R) with TurnShare 0.8. The bot's raw time is about 0.99x par.
- The planner rejects a course (race or trick) that is ridden more than half its length above 33 m/s, or that has a flight over 40 m off a drop. The par ride follows a ballistic arc wherever the ground falls away. This removes Kestrel's Face and Valley races. Kestrel keeps one trick run (Bowl).
- Gates: none in roll landings. Gaps run 24 to 40 m, and offsets shrink on steep ground. A start must be sloped, and a flat tail ends the course.
- RaceBot: pure pursuit, no braking in races (a brake is a hockey stop). It pushes off on flats and swings off tree trunks.
- Rider: a rewind or a reset to a safe spot no longer cancels a run. Only going back to the top does. Place() seeds a safe spot.
- Birch Glade Flags: moved into the north valley. The old line crossed the ridge to the creek, which no one could ride.
- Bot calibration (13 m/s), run 6: every race ranked clean or with 1 miss, except Glacier road (5 misses, Blue). Trick runs rank Green to Black. Bot misses on Kestrel Bowl, Kranjska Vitranc, the Village Slalom misses and the Barn Jump crash are bot limits (switch landings, no carving). The courses themselves are fine.
