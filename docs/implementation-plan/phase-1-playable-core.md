# Phase 1 — Playable Core (PRD Milestone 1)

**Goal:** A fixed, hand-authored chart-shaped course with three rails, slope-driven speed, boost/brake, pickups/hazards, a 60-second active timer, score, keyboard control, and instant restart.
**PRD refs:** §9.1–§9.6, §10 Desktop, §17 (Run, Movement, Rails, Boost/brake, Objects, Fairness, Restart), §19 M1.
**Exit (Gate G1):** Owner completes a run and voluntarily retries; core handling approved; `check-fairness` passes.
**Phase budget:** 12 tasks · ~3,000 LOC total.

**Order:** P1.1 → P1.2 → P1.3 → P1.4 → P1.5 → P1.6 → P1.7 → P1.8 → P1.9 → P1.10 → P1.11 → P1.12
(P1.5 and P1.6 can swap; P1.7 needs P1.3.)

**Phase rule:** everything in `src/sim/` is pure and unit-tested. Rendering tasks (P1.6, P1.8) read `types.ts` + the sim module's export list only.

---

### P1.1 — Track model: path sampling and rails  [Size M]

**Goal:** Turn course control points into an arc-length lookup table: position, slope angle, and per-rail offsets for any distance `s`.
**PRD:** §9.1, §9.2, §9.5 ("course extends beyond max reachable distance") · **Depends on:** P0.2
**Read:** `src/core/types.ts`, `src/config/tuning.ts`, PRD §9.1–§9.2.
**Touch:** `+src/sim/track.ts`, `+src/content/courses/dev-course.json`, `+tests/sim/track.test.ts`

**Steps:**
1. `buildTrack(course: CourseDef)`: smooth points with Catmull-Rom (or monotone cubic) and resample at fixed `ds` (e.g., 1 wu) into typed arrays `x[], y[], angle[]`.
2. Expose `sample(s) → { x, y, angle }` (linear interpolation, clamped) and `railY(s, railOffset)` where offset is continuous (−1..+1) so lane transitions can interpolate. Rails are vertical offsets of `railSpacing` from the centerline (upper rail = 0).
3. Clamp maximum slope angle and flag any segment exceeding a `maxSlopeDeg` tuning value (return in a `warnings` array).
4. `assertCourseLength(track)` throws if `length < vMaxBoost × RUN_SECONDS × 1.15`.
5. `dev-course.json`: a simple ~8-point descending/rising profile long enough to pass the length assertion. No objects yet.

**Accept:**
- [ ] Tests: `sample` is continuous (no jumps > tolerance between adjacent `s`), clamps at ends.
- [ ] Tests: rail spacing is constant at sampled points; rails never cross.
- [ ] Tests: short course fails `assertCourseLength`.

**Verify:** `npm test -- track`
**Out:** Rendering, objects, editorial shaping (P3.8).

---

### P1.2 — Kart longitudinal movement  [Size M]

**Goal:** Slope-driven speed with bounded min/max, integrated at fixed `dt`.
**PRD:** §9.1, §17 Movement · **Depends on:** P1.1
**Read:** `src/core/types.ts`, `src/config/tuning.ts`, `src/sim/track.ts` (exports only).
**Touch:** `+src/sim/kart.ts`, `+tests/sim/kart.test.ts`, `+tests/fixtures/tracks.ts`

**Steps:**
1. `stepKart(kart, track, input, dt)` (mutates or returns new—pick one, document it):
   `a = −gravityK·sin(angle) − drag·(speed − vCruise) + boostTerm − brakeTerm` (boost/brake terms are 0 until P1.4; leave parameters).
2. `speed = clamp(speed + a·dt, vMin, cap)` where `cap = vMax` (boost cap in P1.4). Above-cap speed decays smoothly rather than snapping.
3. `s += speed·dt` using **centerline** arc length (so rail elevation never changes speed — PRD §9.2).
4. Fixtures: flat, constant downhill, constant uphill tracks.

**Accept:**
- [ ] Tests: downhill accelerates, uphill decelerates, flat converges to `vCruise`.
- [ ] Tests: speed never < `vMin` on the steepest allowed uphill for 60 s; never > `vMax` without boost.
- [ ] Tests: results identical for the same input script (determinism).

**Verify:** `npm test -- kart`
**Out:** Lanes, boost, collisions.

---

### P1.3 — Three-rail lane transitions  [Size M]

**Goal:** One adjacent rail per intentional input; brief eased transition; a single, documented collision-rail rule.
**PRD:** §9.2, §17 Rails · **Depends on:** P1.2
**Read:** `src/core/types.ts`, `src/config/tuning.ts`, `src/sim/kart.ts` (exports only).
**Touch:** `+src/sim/lanes.ts`, `+tests/sim/lanes.test.ts`

**Steps:**
1. `applyLaneInput(kart, input)`: consume `laneUp`/`laneDown` counters; at most one rail change per press; ignore at rail bounds; ignore new presses mid-transition **or** queue exactly one (choose one, document in PROGRESS).
2. `stepLane(kart, dt)`: advance `railT` over `laneChangeSeconds` with ease-in-out; expose `railOffset(kart)` (continuous) for rendering.
3. `collisionRail(kart)`: `railT < 0.5 ? railFrom : rail` — the single rule used by P1.7.
4. Lane changes do not modify `speed` or `s`.

**Accept:**
- [ ] Tests: three rapid presses from rail 2 move to rail 0 only via discrete steps, never skipping.
- [ ] Tests: speed and `s` unchanged by lane changes across a transition.
- [ ] Tests: `collisionRail` switches exactly at the transition midpoint.

**Verify:** `npm test -- lanes`
**Out:** Key bindings (P1.5).

---

### P1.4 — Boost meter and braking  [Size S]

**Goal:** Limited boost resource that raises speed; braking that slows but respects `vMin`.
**PRD:** §9.3, §17 Boost/brake · **Depends on:** P1.2
**Read:** `src/config/tuning.ts`, `src/sim/kart.ts`.
**Touch:** `+src/sim/boost.ts`, `~src/sim/kart.ts`, `+tests/sim/boost.test.ts`

**Steps:**
1. `boost.ts`: `drainBoost(kart, active, dt)`, `addBoost(kart, amount)` clamped to `[0, boostCapacity]`; boosting only applies when `boost > 0`.
2. Wire into `stepKart`: boost raises cap to `vMaxBoost` and adds `boostAccel`; brake subtracts `brakeDecel`; if both held, brake wins (document).

**Accept:**
- [ ] Tests: holding boost for 60 s with no pickups empties the meter and speed returns to normal cap.
- [ ] Tests: meter never exceeds capacity after repeated `addBoost`.
- [ ] Tests: braking on a steep downhill holds speed ≥ `vMin` and lower than not braking.

**Verify:** `npm test -- boost kart`
**Out:** Pickup triggering (P1.7).

---

### P1.5 — Input abstraction and keyboard bindings  [Size S]

**Goal:** Device-agnostic `InputState` filled by a keyboard adapter; page scroll prevented only for game keys while active.
**PRD:** §10 Desktop, §17 Controls · **Depends on:** P0.4
**Read:** `src/core/types.ts` (`InputState`), `src/app.ts`, PRD §10 Desktop.
**Touch:** `+src/input/inputState.ts`, `+src/input/keyboard.ts`, `+tests/input/keyboard.test.ts`

**Steps:**
1. `inputState.ts`: `createInput()` with `press(action)`, `release(action)`, `pulseLane(dir)`, `consumeLanes()`, `clearAll()`.
2. `keyboard.ts`: `attachKeyboard(target, input, isActive)`: Up/W → lane up, Down/S → lane down (on `keydown` without `repeat`), Space → boost hold, Shift → brake hold, Escape → pause callback, R → restart callback only when phase is `results`. `preventDefault` only for these keys and only when `isActive()`. Returns `detach()`.
3. `window.blur` → `input.clearAll()` (no stuck keys).

**Accept:**
- [ ] Tests (jsdom): held key auto-repeat produces one lane pulse; blur clears holds.
- [ ] Tests: Space does not call `preventDefault` when inactive (e.g., on intro with a focused button).

**Verify:** `npm test -- keyboard`
**Out:** Touch (P2.2), pause UI (P2.3).

---

### P1.6 — Track and kart rendering with camera  [Size M]

**Goal:** Draw the course, three rails, and the kart from `SimState`; camera follows and guarantees hazard preview distance.
**PRD:** §9.2, §9.4 (≥ 2 s preview), §6 principle 3 (readability) · **Depends on:** P1.3
**Read:** `src/core/types.ts`, `src/sim/track.ts` + `src/sim/lanes.ts` (exports only), `src/render/GameScene.ts`.
**Touch:** `+src/render/trackView.ts`, `+src/render/kartView.ts`, `+src/render/camera.ts`, `~src/render/GameScene.ts`

**Steps:**
1. `trackView`: pre-render rails as Phaser Graphics paths in chunks (only visible chunks updated); upper/middle/lower rails distinguished by **line style + thickness**, not color alone; dark grid background.
2. `kartView`: simple vector kart; position = `track.sample(s)` + `railOffset`; rotate to slope angle.
3. `camera.ts`: kart anchored at ~25–30 % from the left; compute zoom so `visibleAheadWu ≥ vMaxBoost × previewSeconds (2.0)` at the current viewport width; recompute on resize. Expose `visibleAheadSeconds()` for the fairness check and debug overlay.
4. Temporary: GameScene runs a dev loop (auto-advance kart with keyboard input) to see motion.

**Accept:**
- [ ] Kart sits on the correct rail and follows slopes smoothly at 60 FPS on desktop.
- [ ] At 360×640 viewport, `visibleAheadSeconds() ≥ 2.0` at `vMaxBoost`.
- [ ] No per-frame allocation of large Graphics objects (chunked).

**Verify:** `npm run dev` manual; `npm run check`.
**Out:** Objects, HUD, juice.

---

### P1.7 — Pickups, hazards, collisions, invulnerability  [Size M]

**Goal:** Course objects with forgiving collision; pickups apply once; one hazard hit per invulnerability window; hazards never end the run.
**PRD:** §9.4, §17 Objects · **Depends on:** P1.3, P1.4
**Read:** `src/core/types.ts`, `src/config/tuning.ts`, `src/sim/lanes.ts` + `src/sim/boost.ts` (exports only).
**Touch:** `+src/sim/objects.ts`, `+tests/sim/objects.test.ts`, `~src/content/courses/dev-course.json`

**Steps:**
1. Index objects by `s` (sorted array + moving cursor) for O(1) amortized checks.
2. Collision when `|object.s − kart.s| ≤ hitHalfWidth` **and** `object.rail === collisionRail(kart)`; `hitHalfWidth` is a tuning value slightly smaller than the visual size (forgiving).
3. Pickup: add points + `pickupBoost`, mark consumed (`consumed` set), emit `pickup` event.
4. Hazard: if `t ≥ invulnUntil`, multiply speed by `hazardSpeedFactor` (still ≥ `vMin`), set `invulnUntil = t + invulnSeconds`, emit `hazardHit`; never sets `done`.
5. Add ~10 pickups and ~6 hazards to `dev-course.json`.

**Accept:**
- [ ] Tests: a pickup applies exactly once even when the kart overlaps it for many consecutive steps (slow speed).
- [ ] Tests: two hazards inside the invulnerability window apply one hit.
- [ ] Tests: a mid-transition kart collides per the `collisionRail` rule only.

**Verify:** `npm test -- objects`
**Out:** Visuals (P1.8), fairness tooling (P1.11).

---

### P1.8 — Object rendering and hit feedback  [Size S]

**Goal:** Pickups and hazards distinguishable by **shape and symbol**, plus color; brief feedback on pickup/hit; invulnerability indicator.
**PRD:** §9.4, §10 (no red/green-only, no rapid flashing) · **Depends on:** P1.6, P1.7
**Read:** `src/core/types.ts`, `src/core/events.ts` (exports), `src/render/kartView.ts`.
**Touch:** `+src/render/objectView.ts`, `+src/render/effects.ts`, `~src/render/GameScene.ts`

**Steps:**
1. Pickup = rounded/diamond orb with "+" glyph; hazard = angular barrier with "!" or stripes. Use a color-blind-safe pair (e.g., cyan vs. orange), never red/green only.
2. Consumed pickups hidden; object pool reused (no create/destroy per frame).
3. On `pickup`: small pop; on `hazardHit`: short screen nudge (respect a `reducedMotion` flag stub = disables shake) and kart opacity pulse at ≤ 3 Hz during invulnerability.

**Accept:**
- [ ] Grayscale screenshot still distinguishes pickups vs hazards.
- [ ] No flashing above 3 Hz.

**Verify:** manual in `npm run dev` (toggle grayscale via devtools rendering emulation).
**Out:** Audio (P5.1), branding (P5.2).

---

### P1.9 — Simulation integration, scoring, and restart reset  [Size M]

**Goal:** One pure `step(state, input, dt)` composing all sim modules; documented score formula; complete reset.
**PRD:** §9.5, §9.6, §17 Run/Restart · **Depends on:** P1.7
**Read:** `src/core/types.ts`, `src/config/tuning.ts`, export lists of `src/sim/*.ts`, `src/app.ts`.
**Touch:** `+src/sim/simulation.ts`, `+src/sim/scoring.ts`, `~src/app.ts`, `+tests/sim/simulation.test.ts`, `+tests/fixtures/inputScripts.ts`

**Steps:**
1. `scoring.ts`: `score = floor(distance × distancePointsPerWu) + pickups × pickupPoints`; export `scoreBreakdown(stats)`; document constants and `SCORING_VERSION` in a comment block.
2. `simulation.ts`: `createSim(track, course)` → `{ state, step(input, dt), reset() }`; order per step: lanes → boost/brake → kart → objects → stats → `t += dt`.
3. `reset()` returns a state structurally equal to a freshly created one (new `consumed` set, input cleared by caller).
4. `app.ts`: wire `clock.advance(frame, dt => sim.step(input.snapshot(), dt))`; on `finished` emit `runComplete` once and `machine.send('timeUp')`.
5. Input-script fixtures: "idle", "boost-all", "brake-all", "lane-zigzag".

**Accept:**
- [ ] Tests: every fixture ends at exactly `t = 60` with `distance < track.length` (terrain never runs out).
- [ ] Tests: `runComplete` emitted exactly once per run, including after pause/resume.
- [ ] Tests: after a run + `reset()`, state deep-equals a new sim (no stale objects/timer/boost/score).
- [ ] Tests: same script ⇒ identical final score (determinism).

**Verify:** `npm test -- simulation scoring`
**Out:** UI screens.

---

### P1.10 — Minimal HUD and placeholder intro/results flow  [Size M]

**Goal:** HTML HUD (timer, score, boost meter), a minimal Start screen, countdown, and a results screen with Retry — enough for a full loop.
**PRD:** §7 screens 1/2/4 (minimal), §8, §9.6 retry, §17 Results · **Depends on:** P1.9, P1.5
**Read:** `src/ui/dom.ts`, `src/core/stateMachine.ts` + `src/core/events.ts` (exports), `src/sim/scoring.ts` (exports).
**Touch:** `+src/ui/hud.ts`, `+src/ui/screens/intro.ts`, `+src/ui/screens/results.ts`, `+src/ui/screens/countdown.ts`, `~src/app.ts`, `~src/styles.css`

**Steps:**
1. HUD: remaining time (`60 − activeTime`, 1 decimal), score, boost meter (`<meter>` or ARIA progressbar). Update at most every animation frame; avoid layout thrash (update `textContent`/`style.transform` only).
2. Intro (placeholder): title, one-line controls, **Start** button (focus on load).
3. Countdown overlay 3-2-1 driven by `COUNTDOWN_SECONDS`; timer starts only after countdown (`runStart` event).
4. Results (placeholder): score, distance, pickups, **Retry** (focused), R key works here only.
5. Retry → `machine.send('restart')` → `sim.reset()` → countdown.

**Accept:**
- [ ] Full loop Start → countdown → 60 s → results → Retry → new run, keyboard only.
- [ ] Retry leaves no stale HUD values.

**Verify:** manual; `npm run check`.
**Out:** Editorial content (Phase 3), pause UI (P2.3), styling polish (P5.2).

---

### P1.11 — Course v1 layout and fairness checker  [Size M]

**Goal:** A designed (not editorial yet) course plus an automated script that proves a reachable safe path, preview time, and at least one braking moment.
**PRD:** §9.2 ("reachable safe path"), §9.3 (braking sequence), §9.4 (≥ 2 s preview), §17 Fairness · **Depends on:** P1.9
**Read:** `src/core/types.ts`, `src/config/tuning.ts`, `src/sim/track.ts` + `src/sim/simulation.ts` (exports).
**Touch:** `+scripts/check-fairness.ts`, `+src/content/courses/course-01.json`, `+tests/scripts/fairness.test.ts`, `~package.json`

**Steps:**
1. `check-fairness.ts <course.json>` checks:
   a. **Safe rail exists:** for every `s`, at least one rail has no hazard within ±hitHalfWidth.
   b. **Reachability:** BFS/DP over hazard clusters in `s` order — from the starting rail, a sequence of single-rail moves exists where each move has time ≥ `laneChangeSeconds + reactionSeconds` at `vMaxBoost`.
   c. **Preview:** spacing between successive *required* decisions ≥ `vMaxBoost × 2 s`.
   d. **Length:** `assertCourseLength`.
   e. **Braking moment:** at least one tagged segment (`"brakeZone": true`) where simulated `brake-all` through the zone collides with fewer hazards than `boost-all`.
   Prints a short pass/fail table; exit code 1 on failure.
2. Add `npm run fairness` and run it inside `npm run check`.
3. `course-01.json`: three ~20 s sections (descent, recovery, final), ~25 pickups, ~12 hazards, one brake zone. Keep pure layout; editorial shaping happens in P3.8.

**Accept:**
- [ ] `npm run fairness` passes for `course-01`; a deliberately blocked fixture fails with a readable reason.
- [ ] The brake-zone check passes.

**Verify:** `npm run fairness && npm test -- fairness`
**Out:** Chapter captions (P3.5).

---

### P1.12 — Debug overlay, handling tuning pass, Gate 1  [Size S]

**Goal:** Make tuning fast and record the approved values; owner playtest for G1.
**PRD:** §9.3 ("tuning through playtesting"), §19 M1 exit · **Depends on:** P1.10, P1.11
**Read:** `src/config/tuning.ts`, `src/render/camera.ts` (exports), PRD §19.
**Touch:** `+src/ui/debugOverlay.ts`, `~src/config/tuning.ts`, `~docs/PROGRESS.md`

**Steps:**
1. `?debug=1` overlay (dev builds only, tree-shaken in production): speed, slope, boost, `visibleAheadSeconds`, FPS, step count; sliders/inputs for 6–8 key tuning values (in-memory only).
2. Play 10+ runs; adjust `tuning.ts`; rerun `npm run check` (fairness must still pass at new `vMaxBoost`).
3. Owner G1 playtest: record completion, voluntary retry (yes/no), handling notes, and the approved tuning values in PROGRESS.

**Accept:**
- [ ] Debug overlay absent from `npm run build` output (grep the bundle).
- [ ] G1 entry in PROGRESS with owner sign-off or a list of required fixes (each becomes a `P1.12x` task).

**Verify:** `npm run build` + bundle grep for `debugOverlay`; owner playtest.
**Out:** Mobile tuning (Phase 2).
