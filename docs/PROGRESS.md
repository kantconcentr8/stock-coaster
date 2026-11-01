# PROGRESS

Append a ≤ 10-line entry per task. New sessions read only the tail.

## Entry template

```
### PX.Y — Title (YYYY-MM-DD)
Result: done | partial | deferred
Files: ...
Follow-ups: ...
Notes/tuning: ...
```

---

### P0.1 — Project scaffold and tooling (2026-10-31)
Result: done
Files: package.json, tsconfig.json, vite.config.ts (vitest config inline), eslint.config.js, .prettierrc, .editorconfig, .gitignore, index.html, src/main.ts, tests/smoke.test.ts, folder skeleton with `.gitkeep`.
Versions: phaser 4.2.1, typescript 6.0.3, vite 8.3.5, vitest 4.1.12, eslint 10.14.0, typescript-eslint 8.72.1, prettier 3.9.10, @eslint/js 10.0.1; Node 20.19.4.
Notes: TS 6 deprecates `baseUrl`; alias `@/` uses `paths` only. ESLint blocks `phaser` in sim/core/content/services and app.ts (verified).
Follow-ups: build bundle > 500 kB (Phaser); revisit in P5.

### P0.2 — Contract layer (2026-10-31)
Result: done
Files: src/core/types.ts, src/config/tuning.ts, docs/CONTEXT.md, docs/PROGRESS.md.
Notes: tuning values are starting guesses; P1.12 tunes them. `SCORING_VERSION` exported alongside frozen `TUNING`.

### P0.3 — Run state machine and clock (2026-10-31)
Result: done
Files: src/core/stateMachine.ts, src/core/runClock.ts, tests/core/{stateMachine,runClock}.test.ts.
Notes: active time derived from integer step count; final step truncated so activeTime === 60. Caller must not advance the clock outside `running`.

### P0.4 — Event bus and app skeleton (2026-10-31)
Result: done
Files: src/core/events.ts, src/app.ts, src/main.ts, tests/core/events.test.ts.

### P0.5 — Phaser canvas + HTML overlay + capability check (2026-10-31)
Result: done
Files: src/render/{GameScene,createGame}.ts, src/ui/dom.ts, src/ui/screens/fallback.ts, src/styles.css, src/main.ts.

### P1.1 — Track model: path sampling and rails (2026-10-31)
Result: done
Files: src/sim/track.ts, src/content/courses/dev-course.json, tests/sim/track.test.ts.
Notes: Catmull-Rom resampled at 1 wu step; clamps slopes > maxSlopeDeg (32°) and records warnings; `assertCourseLength` enforces >= vMaxBoost * 60 * 1.15 (28,980 wu).

### P1.2 — Kart longitudinal movement (2026-10-31)
Result: done
Files: src/sim/kart.ts, tests/sim/kart.test.ts, tests/fixtures/tracks.ts.
Notes: `stepKart` mutates `kart` in place along centerline arc length; over-cap speed decays smoothly at `overCapDecel = 120` wu/s².

### P1.3 — Three-rail lane transitions (2026-10-31)
Result: done
Files: src/sim/lanes.ts, tests/sim/lanes.test.ts.
Notes: Policy: new lane inputs are ignored while `railT < 1` (mid-transition); `collisionRail` switches at `railT = 0.5`.

### P1.4 — Boost meter and braking (2026-10-31)
Result: done
Files: src/sim/boost.ts, src/sim/kart.ts, tests/sim/boost.test.ts.
Notes: Brake wins if both boost and brake are held; boost starts at 50/100 capacity.

### P1.5 — Input abstraction and keyboard bindings (2026-10-31)
Result: done
Files: src/input/inputState.ts, src/input/keyboard.ts, tests/input/keyboard.test.ts.
Notes: Prevents default only for active game keys; `window.blur` clears held keys.

### P1.6 — Track and kart rendering with camera (2026-10-31)
Result: done
Files: src/render/{trackView,kartView,camera,GameScene}.ts, tests/render/camera.test.ts.
Notes: Rails distinguished by dash pattern + width; camera guarantees >= 2.0 s preview ahead even on 360×640 viewports.

### P1.7 — Pickups, hazards, collisions, invulnerability (2026-10-31)
Result: done
Files: src/sim/objects.ts, src/content/courses/dev-course.json, tests/sim/objects.test.ts.
Notes: Amortized O(1) sorted cursor; `hitHalfWidth = 14` wu; `invulnSeconds = 1.5` s; `hazardSpeedFactor = 0.6`.

### P1.8 — Object rendering and hit feedback (2026-10-31)
Result: done
Files: src/render/{objectView,effects,GameScene}.ts.
Notes: Pickups = cyan diamond with `+`; hazards = orange warning triangle with `!`; kart pulses at 2.5 Hz (<= 3 Hz) during invulnerability; screen nudge respects `prefers-reduced-motion`.

### P1.9 — Simulation integration, scoring, and restart reset (2026-10-31)
Result: done
Files: src/sim/{simulation,scoring}.ts, src/app.ts, tests/sim/simulation.test.ts, tests/core/app.test.ts, tests/fixtures/inputScripts.ts.
Notes: `SCORING_VERSION = 1`; `score = floor(distance * 0.05) + pickups * 100`.

### P1.10 — Minimal HUD and placeholder intro/results flow (2026-10-31)
Result: done
Files: src/ui/hud.ts, src/ui/screens/{intro,countdown,results}.ts, src/main.ts, src/styles.css.
Notes: Full keyboard-accessible loop: Start -> 3s countdown -> 60s active run -> Results -> Retry (or R key).

### P1.11 — Course v1 layout and fairness checker (2026-10-31)
Result: done
Files: scripts/check-fairness.ts, src/content/courses/course-01.json, tests/scripts/fairness.test.ts, package.json.
Notes: `npm run fairness` verifies course length, >=1 open rail per cluster, DP reachability, >=2s decision preview, and brake-zone effectiveness (`[6200..7400]`).

### P1.12 — Debug overlay, handling tuning pass, Gate 1 (2026-10-31)
Result: done (awaiting owner Gate 1 playtest sign-off)
Files: src/ui/debugOverlay.ts, src/config/tuning.ts, src/main.ts.
Notes: `?debug=1` loads `debugOverlay.ts` only under `import.meta.env.DEV` (tree-shaken from production build). Tuning baseline: `vMin=120`, `vCruise=220`, `vMax=320`, `vMaxBoost=420`, `gravityK=180`, `boostAccel=160`, `brakeDecel=220`, `laneChangeSeconds=0.25`.

### P2.1 — Responsive layout, safe areas, DPR scaling (2026-10-31)
Result: done
Files: src/ui/layout.ts, src/styles.css, src/render/{camera,createGame,GameScene}.ts, tests/ui/layout.test.ts.
Notes: `computeLayoutMetrics` reserves HUD top band and portrait controls bottom band (~24% height), caps DPR at 2, and centers camera vertically in `trackRegion` while keeping `visibleAheadSeconds >= 2.0`.

### P2.2 — Touch controls with Pointer Events (2026-10-31)
Result: done
Files: src/input/touch.ts, src/ui/touchControls.ts, src/styles.css, tests/input/touch.test.ts.
Notes: Four `<button>` controls (>= 44x44px) with ARIA labels and shape+text; multi-touch tracked per `pointerId` with `pointercancel`/`lostpointercapture`/`blur`/`orientationchange` cleanup.

### P2.3 — Pause, visibility auto-pause, resume countdown (2026-10-31)
Result: done
Files: src/ui/screens/pause.ts, src/ui/hud.ts, src/app.ts, src/main.ts, tests/core/pauseFlow.test.ts.
Notes: HUD pause button + Escape key; `visibilitychange` (hidden) and `pagehide` auto-pause without auto-resuming; Resume triggers 3s `RESUME_COUNTDOWN_SECONDS`; focus trapped inside Pause modal.

### P2.4 — Scroll, zoom, and gesture suppression; in-app browser hardening (2026-10-31)
Result: done
Files: src/styles.css, src/app.ts, src/ui/inAppBrowser.ts, docs/qa/p2.4.md, tests/ui/layout.test.ts.
Notes: `body.is-playing` suppresses touch-action/overscroll/selection only during `running`/`countdown`; in-app WebView detector shows dismissible copy-link banner on intro.

### P2.5 — Reference-device test pass and Gate 2 (2026-10-31)
Result: done (automated checks green; physical device rows in `docs/qa/device-matrix.md` ready for owner LAN check)
Files: docs/qa/device-matrix.md, docs/PROGRESS.md.
