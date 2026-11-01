# Phase 0 — Foundation

**Goal:** A buildable, testable TypeScript project with the contract layer (types, tuning, state machine, clock, events) and an empty Phaser canvas under an HTML overlay. No gameplay yet.
**PRD refs:** §15 (technical approach, logical components), §9.1 (fixed step), §9.6 (pause), §18 (verification).
**Exit:** `npm run dev` shows a canvas with an HTML overlay; `npm run check` passes; `docs/CONTEXT.md` and `docs/PROGRESS.md` exist.
**Phase budget:** 5 tasks · ~1,000 LOC total.

---

### P0.1 — Project scaffold and tooling  [Size M]

**Goal:** Vite + TypeScript (strict) + Phaser + Vitest + ESLint/Prettier, with folder skeleton.
**PRD:** §15 · **Depends on:** —
**Read:** README §2–§4 of this plan only.
**Touch:** `+package.json`, `+tsconfig.json`, `+vite.config.ts`, `+vitest.config.ts` (or inline), `+eslint.config.js`, `+.prettierrc`, `+.gitignore`, `+index.html`, `+src/main.ts`, `+.editorconfig`

**Steps:**
1. `git init` (if not already); create the folder skeleton from README §3 with `.gitkeep` files.
2. Install current stable `phaser`, `typescript`, `vite`, `vitest`, `eslint`, `typescript-eslint`, `prettier`. Record exact versions in PROGRESS.
3. `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `moduleResolution: bundler`, path alias `@/` → `src/`.
4. Scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`, `check` (= typecheck + lint + test, non-watch).
5. ESLint rule: forbid importing `phaser` from `src/sim/**`, `src/core/**`, `src/content/**`, `src/services/**` (`no-restricted-imports` override). This enforces the pure-sim boundary.
6. `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `lang="en"`, containers `#game` and `#ui`.
7. A trivial `tests/smoke.test.ts` so `npm run check` is green.

**Accept:**
- [ ] `npm run check` passes; `npm run build` produces `dist/`.
- [ ] Importing `phaser` inside `src/sim/` fails lint.
- [ ] No secrets or private material committed (PRD §16).

**Verify:** `npm run check && npm run build`
**Out:** Any game code, hosting, CI.

---

### P0.2 — Contract layer: types, tuning, docs map  [Size M]

**Goal:** Define the shared interfaces every later task reads instead of implementation files.
**PRD:** §9 (all), §12 (content fields), §15 logical components · **Depends on:** P0.1
**Read:** PRD §9.1–§9.6, §12 "Required content fields" table.
**Touch:** `+src/core/types.ts`, `+src/config/tuning.ts`, `+docs/CONTEXT.md`, `+docs/PROGRESS.md`

**Steps:**
1. `types.ts` — define (types only, no logic):
   - `RailIndex = 0 | 1 | 2` (0 = upper).
   - `InputState { boost: boolean; brake: boolean; laneUp: number; laneDown: number }` (lane fields are edge-trigger counters consumed per step).
   - `KartState { s; speed; rail; railFrom; railT; boost; invulnUntil }` (s = distance along course in wu).
   - `CourseObject { id; kind: 'pickup' | 'hazard'; rail; s }`, `CourseDef { courseId; courseVersion; length; points: {x,y}[]; railSpacing; objects: CourseObject[] }`.
   - `RunStats { distance; pickups; hazards; score }`, `SimState { t; kart; stats; consumed: Set<string>; done }`.
   - `RunPhase = 'intro' | 'countdown' | 'running' | 'paused' | 'results'`.
   - `GameEvent` discriminated union: `runStart`, `chapterSeen`, `pickup`, `hazardHit`, `runComplete`, `pause`, `resume`, `restart`.
   - Placeholder `Briefing` type mirroring PRD §12 fields (refined in P3.1).
2. `tuning.ts` — exported frozen object with **named, commented** constants: `RUN_SECONDS=60`, `SIM_DT=1/120`, `MAX_FRAME=0.25`, `COUNTDOWN_SECONDS=3`, `RESUME_COUNTDOWN_SECONDS=3`, speed (`vMin`, `vCruise`, `vMax`, `vMaxBoost`), `gravityK`, `drag`, `boostAccel`, `brakeDecel`, `boostCapacity`, `boostDrainPerSec`, `pickupBoost`, `pickupPoints`, `hazardSpeedFactor`, `invulnSeconds`, `laneChangeSeconds`, `distancePointsPerWu`, plus `SCORING_VERSION=1`. Values are starting guesses; P1.12 tunes them.
3. `docs/CONTEXT.md` — module map table (path → responsibility → public exports → depends on), the pure-sim rule, and the session protocol pointer. Keep ≤ 150 lines.
4. `docs/PROGRESS.md` — header + entry template + first entries for P0.1/P0.2.

**Accept:**
- [ ] `types.ts` has zero runtime code; `tuning.ts` has no imports.
- [ ] No identifier or comment frames score as money/returns.
- [ ] CONTEXT.md lists every planned folder from README §3.

**Verify:** `npm run typecheck`
**Out:** Behavior; content schema validation (P3.1).

---

### P0.3 — Run state machine and active-time clock  [Size M]

**Goal:** Deterministic phase transitions and a fixed-step accumulator whose clock only advances while `running`.
**PRD:** §8 steps 4–6, §9.1, §9.6, §15 component 2 · **Depends on:** P0.2
**Read:** `src/core/types.ts`, `src/config/tuning.ts`, PRD §9.6.
**Touch:** `+src/core/stateMachine.ts`, `+src/core/runClock.ts`, `+tests/core/stateMachine.test.ts`, `+tests/core/runClock.test.ts`

**Steps:**
1. `stateMachine.ts`: `createRunMachine()` with `phase`, `send(action)` where actions = `start | countdownDone | pause | resume | resumeCountdownDone | timeUp | restart | exit`. Illegal transitions are no-ops returning `false`. Resume goes `paused → countdown(resume) → running`.
2. `runClock.ts`: `createRunClock()` with `advance(frameSeconds, stepFn)`; clamps frame to `MAX_FRAME`, runs `stepFn(SIM_DT)` N times, tracks `activeTime`, stops exactly at `RUN_SECONDS` (last step truncated so `activeTime === 60`), returns `{steps, finished}`. `reset()`.
3. Clock does not advance when caller is not in `running` (caller responsibility; document it).

**Accept:**
- [ ] Tests: frame jitter (e.g., 7 ms/33 ms/250 ms+) yields identical `activeTime` and step count totals.
- [ ] Tests: pause for 10 s wall time consumes 0 active time.
- [ ] Tests: `finished` fires exactly once at 60.000 s.
- [ ] Tests: every illegal transition is rejected; restart from `results` and `paused` returns to `countdown`.

**Verify:** `npm test -- core`
**Out:** Visibility auto-pause wiring (P2.3), UI.

---

### P0.4 — Typed event bus and app controller skeleton  [Size S]

**Goal:** One place where sim events fan out to UI, audio, analytics, storage — so later tasks plug in without touching each other.
**PRD:** §14 event contract (shape only), §15 · **Depends on:** P0.3
**Read:** `src/core/types.ts` (`GameEvent`), `src/core/stateMachine.ts` (exports only).
**Touch:** `+src/core/events.ts`, `+src/app.ts`, `~src/main.ts`, `+tests/core/events.test.ts`

**Steps:**
1. `events.ts`: tiny typed emitter `on(type, fn) → unsubscribe`, `emit(event)`; listener exceptions are caught and logged so one failing subscriber (e.g., analytics) never breaks gameplay (PRD §14, §16).
2. `app.ts`: `createApp({ bus, machine, clock })` that owns the frame loop hook `tick(frameSeconds)`; for now `stepFn` is a no-op stub.
3. `main.ts` instantiates the app.

**Accept:**
- [ ] Test: a throwing listener does not prevent other listeners or the emitter caller.
- [ ] `app.ts` has no Phaser import.

**Verify:** `npm test -- events`
**Out:** Actual simulation step.

---

### P0.5 — Phaser canvas + HTML overlay shell + capability check  [Size M]

**Goal:** Layered page: Phaser canvas in `#game`, accessible HTML UI in `#ui` above it; graceful fallback if graphics are unavailable.
**PRD:** §10 accessibility (HTML UI), §15 performance ("unsupported graphics → readable briefing"), §16 · **Depends on:** P0.4
**Read:** `src/app.ts`, `src/main.ts`, `index.html`.
**Touch:** `+src/render/GameScene.ts`, `+src/render/createGame.ts`, `+src/ui/dom.ts`, `+src/ui/screens/fallback.ts`, `+src/styles.css`, `~src/main.ts`

**Steps:**
1. `createGame.ts`: Phaser config `type: AUTO`, `scale: RESIZE`, parent `#game`, transparent DOM overlay friendly; one empty `GameScene` whose `update(time, delta)` calls `app.tick(delta/1000)`.
2. `dom.ts`: helpers `el(tag, attrs, children)` that set text via `textContent` only; `show(screenId)` / `hide`.
3. Capability check before creating Phaser (WebGL or Canvas2D available, `requestAnimationFrame` present). On failure, render `fallback.ts` (static text: "This game needs a newer browser — read the briefing instead" + placeholder link).
4. `styles.css`: full-viewport layout, `#ui` positioned over `#game`, `pointer-events: none` on overlay except interactive children; CSS custom properties for colors (brand tokens later).

**Accept:**
- [ ] `npm run dev` shows a resizable canvas with an overlay heading rendered as real HTML.
- [ ] Forcing capability check to fail shows the fallback screen, no console errors.
- [ ] Page does not scroll at desktop sizes.

**Verify:** `npm run dev` manual check; `npm run check`.
**Out:** Track drawing, real screens, touch layout.

