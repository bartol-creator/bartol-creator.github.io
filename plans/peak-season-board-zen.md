# Peak Season: Snowboard 2.0 and Zen mode

Status: plan, waiting for the go-ahead (2026-11-26).
Scope: item 5 (snowboard) and Zen mode from the GMA2 gap analysis. Nothing else.
Rule: GMA2 mechanics only. Our own names, art and numbers. Everything polished and animated (feedback 2026-11-26).

## 1. Where we are now (audit, 2026-11-26)

Snowboard: the player can already ride a board (Tab, pause menu, `?gear=board`). It works, but it is a first draft:

| Area | Now | Problem |
|---|---|---|
| Board mesh | `RiderBody.BoardMesh()`: a flat teal box with two kicked beams and black boxes for bindings | Looks like a plank. No sidecut, no bindings, no graphic. |
| Pose | Feet 0.52 m apart sideways, body faces the toe edge | Legs nearly straight, arms held out like a T, no heel/toe lean, no grab poses that touch the board (except a Method tilt). |
| Physics | Same code as skis: turn rate 2.0 (skis 2.5), grip 3.45 (3.9), spin 370°/s (400) | Board feels like slow skis. No reason to pick one over the other. |
| Tricks | Board grab table (Indy, Melon, Stalefish...), Boardslide/Lipslide, presses | Spins are named like ski spins. No frontside/backside, no Cab, no board flip names. |
| Effects | One wide track. Spray and grains shared with skis. Board glide loop sound exists. | No heel-side spray wall, no carve rip, no ollie sound. |
| Ghosts | `Ghosts.cs` stores no gear | A board run replays as a skier ghost. |
| Stance | `Rider.Goofy` field exists | No setting for it. |

Zen: `Hud.Zen` (pause menu "Zen: On/Off", pref `peak.zen`) only hides the HUD. GMA2's Zen mode removes the other skiers, the challenges and the timers: a quiet powder day.

## 2. Decisions (my defaults; say if you want them different)

1. **Medals are shared between skis and board.** A medal is a medal on either gear. The pop-up's Best line shows which gear set it ("Best 34.1 s on board"). The ghost replays on the gear that set it.
2. **The board is the powder tool, skis are the groomer tool.** The board floats and keeps speed off piste; skis are a bit faster on groomed runs and carve harder. The gap is small (about 6%), so either gear can get every medal.
3. **Zen is a proper mode in free ride.** In your own resort the Zen toggle stays HUD-only, because guests are the point of the tycoon. The button says so: "Zen: HUD only in your resort".

## 3. Snowboard

### 3.1 The board (new `Rider/BoardKit.cs`, replaces `RiderBody.BoardMesh`)

Shape, built in code:
- Length 1.55 m. Waist 0.25 m. Nose and tail 0.29 m wide.
- Sidecut: a 7.5 m radius arc each side, 24 segments per edge, so the outline curves in at the waist.
- Twin tip. Nose and tail rise 0.11 m over the last 0.18 m, on a smooth curve (no hard kink).
- Camber: the middle sits 6 mm up when unweighted and flattens when the rider is on it.
- Thickness 15 mm. A thin silver edge line (2 mm) round the bottom. The base is a dark blue-black with a few lighter "sintered" speckles (vertex colour noise).
- Three bones (tail, centre, nose) so the board can bend:
  - 8° on an ollie load;
  - 12° on a nose or tail butter;
  - 4° on a hard landing, springing back over 0.25 s.
- Guests get the same mesh (unskinned, no bend), so the board looks the same everywhere.

Topsheet graphics: six designs painted with vertex colours on a finer top grid (40×6 quads). The colours follow the outfit's accent colour.
- **Peaks:** a mountain-ridge silhouette along the board.
- **Stripes:** three diagonal bands.
- **Chevron:** arrows pointing to the nose.
- **Split:** two colours, cut on a wave line.
- **Sunset:** a three-stop gradient, nose to tail.
- **Dots:** a field of dots, fading out toward the nose.

You pick the design in the pause menu ("Board: Peaks") and it is saved (`peak.boardart`).

Bindings, per foot:
- A round base disc and a heel cup.
- A curved highback, 0.18 m tall, leaning forward 12°.
- Two straps (ankle and toe) with a small ratchet block.
- Stance width 0.52 m. Angles +15° front, −6° back.
- A small grip pad between the bindings (six little raised bumps). A tiny diamond sticker near the tail.

### 3.2 Poses and animation (`RiderBody` board branch)

Base stance:
- Knees bent 25°. Hips 0.15 m lower than standing.
- Hips open 20° toward the nose. Shoulders open 35° toward the nose.
- The head looks along the direction of travel, clamped to ±80° from the shoulders.
- Front arm forward and low over the nose. Back arm relaxed by the back hip.
- A slow breathing bob (2 cm, 0.25 Hz) when standing still.

Turning (edge angle up to 40°, driven by `Rider.Edge`):
- **Heel-side:** hips sink back over the heel edge, torso upright, arms forward for balance, the board tilts with the toes up.
- **Toe-side:** knees drive forward into the slope, hips forward, upper body low, back hand reaching down.
- **Hand drag (gimmick):** on a deep toe-side carve (edge above 0.85 and over 12 m/s), the back glove trails in the snow. A thin glove line in the track and a small puff of grains.
- **Edge change:** the board passes flat for 0.08 s. A fast change gives a small hop of the hips.

Other moves:
- **Bomb (tuck key):** compact and low, arms tucked in, chin down.
- **Brake (hockey stop):** board across the slope on the heel side (or the toe side after a toe-side turn). The rider sits back, front arm out, and a wall of spray fans uphill.
- **Butters:** the board bends on its bones. The rider leans over the nose or tail and the arms swing to wind the 180 or 360.
- **Ollie:** charging loads the tail (nose lifts 3 cm at full charge). On release the tail snaps, the board bends, then springs, and the knees tuck. A nollie is the mirror image.

Air:
- Knees tuck more with height. A spin is wound up: during the charge, the shoulders turn 25° against the steer direction, then unwind into the spin.
- Grabs: each grab puts a hand on a real point of the board (IK target on the board bones). The tweak builds over 0.4 s, and longer grabs score more, as now.

| Grab | Hand | Where on the board | Extra |
|---|---|---|---|
| Indy | Back | Toe edge between the bindings | — |
| Mute | Front | Toe edge between the bindings | — |
| Melon | Front | Heel edge, behind the front foot | — |
| Stalefish | Back | Heel edge, behind the back leg | — |
| Method | Front | Heel edge | Knees bent, board pulled up behind the back, arched 25° |
| Tail | Back | Tail | — |
| Nose | Front | Nose | Front leg bent |
| Japan | Front | Toe edge | Front knee down, board tweaked behind |

Landings and lifts:
- **Landing:** the rider absorbs (crouch 0.6 over 0.15 s, eased). A sketchy landing throws the arms out briefly.
- **Butter landing:** landing 60–120° off the travel direction no longer crashes on a board. The rider slides sideways and pivots back round, scoring "Revert". Skis keep the 65° crash rule.
- **Drop-in (gimmick):** while waiting at the top, the rider sits on the snow strapping in the back foot (a 2.5 s loop with ratchet clicks). On the first key press they hop up into stance.
- **Flats:** pushing unstraps the back foot. It steps behind the toe edge in a skating push, and the board shows the free foot. Strapping back in happens automatically at speed.
- **Chairlift:** the board hangs from the front foot and the back boot rests on it.

Crashes:
- **Heel-side catch:** butt slam, then a slide on the back.
- **Toe-side catch:** knees, then a face-down slide.
- These replace the ski tumble poses on a board.

### 3.3 Feel and physics (`Rider.cs`; every number is a named constant)

| Value | Skis now | Board now | Board new |
|---|---|---|---|
| Turn rate at low speed (under 10 m/s) | 2.5 | 2.0 | 2.3 (tighter: the board pivots) |
| Turn rate at speed (over 25 m/s) | — | — | 1.7 |
| Grip on piste | 3.9 | 3.45 | 3.45 (unchanged) |
| Skid slowdown | 6 | 6 | 7.5 (sideslip scrubs speed: the board way to control speed) |
| Snow friction off piste | 0.064 | 0.064 | 0.050 (floats) |
| Grip off piste | ×0.85 | ×0.85 | ×0.95 |
| Sinks into powder | 0.09 m | 0.09 m | 0.06 m (rides higher) |
| Top speed | 100% | 100% | 94%, and a tuck adds 5 m/s instead of 7 |
| Push on flats | 100% | 100% | 70% (no poles) |
| Spin rate | 400°/s | 370°/s | 370°/s (unchanged) |

Also:
- **Stance:** Regular/Goofy setting in the pause menu (`peak.goofy`), with a one-line explanation of each.
- **Switch:** riding fakie is a full equal on a board. No slowdown, named "Fakie" on the ground and "Switch" in tricks.
- **Heel/toe mapping:** steer right is toe-side for a regular rider going forward. It flips for goofy and for fakie, so the pose always matches the turn.
- **Calibration:** check with tricktest (keep landing ≥ 80% on the board) and the race bot (every challenge's black medal is reachable on the board).

### 3.4 Trick names (`TrickNamer`, board only)

Spins:
- Frontside or Backside by rotation direction relative to the toe edge. Frontside means the chest opens downhill first.
- Riding switch: a frontside spin is a "Cab" (Cab 540) and a frontside 180 is a "Half Cab". Backside switch spins are "Switch Backside 360".
- Blind spins pay a little more: Backside 540 and up gets +10%.

Flips (a board rider faces sideways, so the axes swap):
- A flip across the travel direction (our pitch axis) is a "Wildcat" (back) or "Tamedog" (front).
- A flip along the travel direction (our roll axis) is a "Backflip" or "Frontflip".

Spins combined with flips:
- Backside spin with a backflip: "Backside Rodeo 540".
- Frontside spin with a frontflip: "Frontside Misty 720".
- Off-axis: "Cork" stays.

Ground and rails:
- Butters: "Nose Roll 180/360", "Tail Roll 180/360"; presses keep "Nose Press"/"Tail Press".
- Rails: "Frontside Boardslide" or "Backside Boardslide" (from approach side), "Lipslide", "50-50", "Nosepress", "Tailpress".
- Butter landing: "Revert" (+100 points).

Unit tests in the Tricks assembly for every name rule above, both stances, forward and switch.

### 3.5 Effects and sound

Tracks:
- Carving: a thin, deep 0.12 m line.
- Skidding: a wide 0.45 m smear. The track painter already takes a width per stamp.

Spray (crisp grains only, never soft blobs):
- Heel-side stop: a high wall fanned uphill over 160°.
- Toe-side: a lower, sharper fan.
- Ollie: a tail flick of about 20 grains.

Sounds (CC0 recordings from Freesound like the snow sounds, a synth fallback if none fit):
- A carve "rip" loop, its pitch rising with the edge angle.
- A sideslip scrape.
- An ollie tail clack plus a short flex twang.
- A board landing thud.
- A butter scrape.
- A board-on-rail grind.
- Ratchet clicks for the strap-in gimmick.

### 3.6 Menus, challenges, ghosts

Gear switch (spruced up):
- A "Skis | Board" segmented switch in the pause menu and the title screen.
- The highlight pill slides across with a back-out ease and a whoosh. The rider swaps behind a puff of snow grains.
- Tab and the gamepad D-pad up keep working. On a phone, the switch is in the pause menu.

Challenges:
- The pop-up shows a gear chip under the title ("On board · tap to switch") with the same sliding animation.
- Best lines say the gear ("Best 34.1 s on board").
- Medals are shared (decision 1).

Ghosts:
- `Ghosts.cs` tape gains a gear byte (old tapes read as skis).
- A board ghost is the hologram rider on a hologram board.

Other:
- **Board art:** "Board: Peaks" button in the pause menu cycles the six designs, with a little spin of a board icon.
- **First ride tips:** the first time on a board, three one-off tips ("Steer to carve heel-side and toe-side", "Hold back to sideslip and stop", "Board floats in powder: try off piste"). Each is shown once and saved.

### 3.7 Testing

- Turntable sheets (`orbit:`):
  - stance, both edges, hand drag;
  - each of the 8 grabs;
  - butters, brake, drop-in strap gimmick;
  - chairlift, crashes.
- `tricktest.py` with `?gear=board`: landing ≥ 80%.
- `peaktest.py`: a board section (ride, a jump, a rail, a challenge on board, ghost shows a board).
- Touch test on the phone layout.
- Race bot on board through every Vogel and Birchwood challenge.

## 4. Zen mode

### 4.1 What it does (free ride)

Removes:
- the free skiers (they fade out with the ghost dissolve over 1.5 s, and back in when Zen ends);
- challenge starts, markers, nets, ghosts, the pop-up and the challenge list;
- the HUD, trick text and hint toasts (the old Zen toggle).

Keeps: rewind, the pause menu, back to the top, the ski map (opened by hand).

### 4.2 Atmosphere

- **Fresh powder:** entering Zen clears the track texture, so the mountain is untracked. Your own tracks stay for the rest of the ride.
- **Zen weather**, chosen in the pause menu:
  - **Bluebird:** clear, light wind.
  - **Gentle snow:** slow flakes, no gusts.
  - **Golden hour:** time frozen in late-afternoon light, long shadows.
- **Music:** a calm subset of the 30 recordings (slow pieces only, listed in `music.json` with a `calm` flag), played softer. Wind and birds 30% louder.
- **Camera:** 4° wider view and a slightly stronger tilt-shift blur. The follow speed is not changed.

### 4.3 Polish

- **Entering:** the screen breathes. A soft white vignette swells and fades over 1.2 s. A thin title card fades in and out over 3 s ("Zen ride · Vogel"), then the screen is clean.
- **Leaving:** a short "Zen off" card. Skiers and challenges fade back in.
- **Pause menu:** the Zen button gets a small drawn circle mark (Lilita One has no lotus glyph).

### 4.4 Where you turn it on

- Title screen, Free ride card: "Ride" and "Zen ride" buttons.
- World map, mountain panel: a "Zen" button next to "Ride".
- Pause menu: the Zen toggle switches live, with the fades above.
- Address `?zen=1`. Test command `zen:on` / `zen:off`, and the status log reports skiers 0, challenge markers hidden.

## 5. Phases

Each phase ends with build, tests, publish to peak-season-test and a commit.

| Phase | Work | Size |
|---|---|---|
| B1 | Board mesh, sidecut, bones, bindings, six graphics, guests share it | 1 day |
| B2 | Poses: stance, heel/toe, hand drag, bomb, brake, butters, ollie, 8 grabs, landings, drop-in strap, flats, chairlift, crashes | 2 days |
| B3 | Feel numbers, stance setting, heel/toe mapping, butter landing / Revert, calibration | 1 day |
| B4 | Trick names and unit tests | 0.5 day |
| B5 | Tracks, spray, sounds | 0.5–1 day |
| B6 | Gear switch UI, pop-up gear chip, ghost gear, board art button, first ride tips | 1 day |
| Z1 | Zen mode: remove/fade, fresh powder, weather, calm music, camera, polish, entry points | 1 day |
| T | Full verification, peaktest, tricktest, phone check | 0.5 day |

Check-ins: after B2 (does the board rider look right?) and at the end. Z1 can go first if you want Zen sooner (it is independent).
