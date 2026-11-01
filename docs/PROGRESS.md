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
Result: done (manual browser check of `npm run dev` pending by owner)
Files: src/render/{GameScene,createGame}.ts, src/ui/dom.ts, src/ui/screens/fallback.ts, src/styles.css, src/main.ts.

