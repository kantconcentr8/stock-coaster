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
| `src/main.ts` | Bootstrap: capability check, app, Phaser, overlay | — | app, core/*, render/createGame, ui/* |
| `src/app.ts` | Frame-loop hook `tick`; owns bus/machine/clock wiring | `createApp`, `App`, `AppDeps` | core/* |
| `src/config/tuning.ts` | All physics/scoring/timing constants | `TUNING`, `SCORING_VERSION` | — |
| `src/core/types.ts` | Shared contract types (no runtime code) | `RailIndex`, `InputState`, `KartState`, `CourseDef`, `SimState`, `RunPhase`, `GameEvent`, `Briefing`, … | — |
| `src/core/stateMachine.ts` | Run phase transitions | `createRunMachine`, `RunAction`, `RunMachine` | core/types |
| `src/core/runClock.ts` | Fixed-step accumulator, 60 s active clock | `createRunClock`, `RunClock` | config/tuning |
| `src/core/events.ts` | Typed event bus, fault-isolated listeners | `createEventBus`, `EventBus` | core/types |
| `src/sim/` | PURE gameplay: track, kart, lanes, boost, objects, scoring, chapters, simulation | (Phase 1) | core, config |
| `src/input/` | inputState, keyboard, touch | (Phase 1–2) | core |
| `src/render/` | Phaser views: `GameScene`, `createGame`, track/kart/object views, effects, camera | `createGame`, `GameScene` | phaser, app |
| `src/ui/dom.ts` | `el`, `show`, `hide` DOM helpers | `el`, `show`, `hide` | — |
| `src/ui/screens/` | intro, pause, results, briefing, fallback | `renderFallback` | ui/dom |
| `src/content/` | schema, loader, briefings/*.json, courses/*.json | (Phase 3) | core |
| `src/services/` | storage, attribution, share, analytics, audio | (Phase 4) | core |
| `scripts/` | validate-content, check-fairness, report | (later) | — |
| `tests/` | Vitest, mirrors `src/`; `e2e/` from Phase 4 | — | — |
| `docs/` | CONTEXT, PROGRESS, AUTHORING, implementation-plan | — | — |

