# CONTEXT — Module map

Living architecture map. Update when a public export, file, or folder changes. Keep ≤ 150 lines.

## Rules

- **Pure-sim rule:** `src/sim/**`, `src/core/**`, `src/content/**`, `src/services/**` and `src/app.ts` never import `phaser` (enforced by ESLint). Phaser lives in `src/render/` and is bootstrapped from `src/main.ts`.
- Units: world units (wu), seconds of *active* simulation. Fixed step `SIM_DT = 1/120`.
- All text renders via `textContent`, never HTML.
- Scoring is neutral game language only: no money/returns/portfolio framing.
- Session protocol: see [implementation-plan/README.md](implementation-plan/README.md) §2.3.

## Module map

| Path | Responsibility | Public exports | Depends on |
| --- | --- | --- | --- |
| `src/main.ts` | Bootstrap: capability check, app, Phaser, HUD & screens, debug overlay | — | app, core/*, input/keyboard, render/createGame, ui/* |
| `src/app.ts` | Frame-loop hook `tick`; owns bus/machine/clock/sim/input wiring | `createApp`, `App`, `AppDeps` | core/*, sim/*, input/inputState |
| `src/config/tuning.ts` | All physics/scoring/timing constants | `TUNING`, `SCORING_VERSION`, `Tuning` | — |
| `src/core/types.ts` | Shared contract types (no runtime code) | `RailIndex`, `InputState`, `KartState`, `CourseDef`, `CourseSegment`, `SimState`, `RunPhase`, `GameEvent`, `Briefing` | — |
| `src/core/stateMachine.ts` | Run phase transitions | `createRunMachine`, `RunAction`, `RunMachine` | core/types |
| `src/core/runClock.ts` | Fixed-step accumulator, 60 s active clock | `createRunClock`, `RunClock` | config/tuning |
| `src/core/events.ts` | Typed event bus, fault-isolated listeners | `createEventBus`, `EventBus` | core/types |
| `src/sim/track.ts` | Catmull-Rom path resampling, rail offsets, length check | `buildTrack`, `assertCourseLength`, `Track`, `TrackSample` | config/tuning, core/types |
| `src/sim/kart.ts` | Longitudinal slope/drag/boost/brake integration | `createKart`, `stepKart` | config/tuning, core/types, sim/boost, sim/track |
| `src/sim/lanes.ts` | Three-rail transitions, ease-in-out offset, collisionRail | `applyLaneInput`, `stepLane`, `railOffset`, `collisionRail` | config/tuning, core/types |
| `src/sim/boost.ts` | Boost meter clamp, drain, brake-wins rule | `addBoost`, `drainBoost`, `canBoost` | config/tuning, core/types |
| `src/sim/objects.ts` | Amortized O(1) pickup/hazard collision + invulnerability | `createObjectIndex`, `processObjects`, `ObjectIndex` | config/tuning, core/types, sim/{boost,lanes,scoring} |
| `src/sim/scoring.ts` | Neutral score formula + breakdown | `scoreBreakdown`, `computeScore`, `SCORING_VERSION` | config/tuning, core/types |
| `src/sim/simulation.ts` | Pure step composition + deterministic reset | `createSim`, `Sim` | core/types, sim/* |
| `src/input/inputState.ts` | Device-agnostic `InputState` controller | `createInput`, `InputController` | core/types |
| `src/input/keyboard.ts` | Desktop keyboard adapter (Up/W, Down/S, Space, Shift, Esc, R) | `attachKeyboard`, `KeyboardOptions` | core/types, input/inputState |
| `src/render/camera.ts` | Camera zoom & scroll guaranteeing >= 2.0s preview | `createCameraRig`, `CameraRig` | config/tuning |
| `src/render/trackView.ts` | Chunked Phaser Graphics rails distinguished by style + width | `createTrackView`, `TrackView` | phaser, sim/track |
| `src/render/kartView.ts` | Vector kart view + <= 3 Hz invulnerability pulse | `createKartView`, `KartView` | phaser, core/types, sim/{lanes,track} |
| `src/render/objectView.ts` | Pooled pickups (+) and hazards (!) distinguishable in grayscale | `createObjectView`, `ObjectView` | phaser, core/types, sim/track |
| `src/render/effects.ts` | Screen-nudge on hazard hit (respects `reducedMotion`) | `createEffects`, `Effects` | — |
| `src/render/GameScene.ts` | Phaser scene syncing sim state to views | `GameScene` | phaser, app, render/* |
| `src/render/createGame.ts` | Phaser game factory | `createGame` | phaser, app, render/GameScene |
| `src/ui/dom.ts` | `el`, `show`, `hide` DOM helpers (`textContent` only) | `el`, `show`, `hide` | — |
| `src/ui/hud.ts` | HTML HUD (remaining time, score, ARIA boost meter) | `createHud`, `Hud` | config/tuning, core/types, ui/dom |
| `src/ui/screens/` | `intro.ts`, `countdown.ts`, `results.ts`, `fallback.ts` | `createIntroScreen`, `createCountdownScreen`, `createResultsScreen`, `renderFallback` | core/types, sim/scoring, ui/dom |
| `src/ui/debugOverlay.ts` | Dev-only `?debug=1` live readout & tuning sliders | `createDebugOverlay`, `DebugOverlay` | config/tuning, core/types, sim/track, ui/dom |
| `src/content/courses/` | `dev-course.json`, `course-01.json` | — | — |
| `scripts/check-fairness.ts` | Automated fairness verifier (`npm run fairness`) | `evaluateCourseFairness` | config/tuning, core/types, sim/* |
