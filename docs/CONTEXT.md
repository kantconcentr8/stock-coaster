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
| `src/main.ts` | Bootstrap: capability check, app, Phaser, HUD, touch, screens, debug | — | app, core/*, input/*, render/*, ui/* |
| `src/app.ts` | Frame-loop hook `tick`; owns bus/machine/clock/sim/input + visibility pause | `createApp`, `App`, `AppDeps` | core/*, sim/*, input/inputState |
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
| `src/input/touch.ts` | Multi-touch Pointer Events adapter with pointerId tracking | `attachTouch`, `TouchBindingOptions` | input/inputState, ui/touchControls |
| `src/render/camera.ts` | Camera zoom & scroll guaranteeing >= 2.0s preview in trackRegion | `createCameraRig`, `CameraRig` | config/tuning, ui/layout |
| `src/render/trackView.ts` | Chunked Phaser Graphics rails distinguished by style + width | `createTrackView`, `TrackView` | phaser, sim/track |
| `src/render/kartView.ts` | Vector kart view + <= 3 Hz invulnerability pulse | `createKartView`, `KartView` | phaser, core/types, sim/{lanes,track} |
| `src/render/objectView.ts` | Pooled pickups (+) and hazards (!) distinguishable in grayscale | `createObjectView`, `ObjectView` | phaser, core/types, sim/track |
| `src/render/effects.ts` | Screen-nudge on hazard hit (respects `reducedMotion`) | `createEffects`, `Effects` | — |
| `src/render/GameScene.ts` | Phaser scene syncing sim state and layout trackRegion | `GameScene` | phaser, app, render/*, ui/layout |
| `src/render/createGame.ts` | Phaser game factory (DPR capped at 2) | `createGame` | phaser, app, render/GameScene |
| `src/ui/dom.ts` | `el`, `show`, `hide` DOM helpers (`textContent` only) | `el`, `show`, `hide` | — |
| `src/ui/layout.ts` | Portrait/landscape regions, DPR cap, debounced resize | `computeLayoutMetrics`, `createLayoutManager`, `LayoutMetrics` | — |
| `src/ui/touchControls.ts` | Accessible on-screen Up/Down/Brake/Boost buttons | `createTouchControls`, `TouchControlElements` | ui/dom |
| `src/ui/inAppBrowser.ts` | In-app WebView detector & non-blocking copy-link banner | `isInAppBrowser`, `createInAppBrowserBanner` | ui/dom |
| `src/ui/hud.ts` | HTML HUD (time, score, boost meter, pause button) | `createHud`, `Hud` | config/tuning, core/types, ui/dom |
| `src/ui/screens/` | `intro.ts`, `countdown.ts`, `pause.ts`, `results.ts`, `fallback.ts` | `createIntroScreen`, `createCountdownScreen`, `createPauseScreen`, `createResultsScreen`, `renderFallback` | core/types, sim/scoring, ui/dom |
| `src/ui/debugOverlay.ts` | Dev-only `?debug=1` live readout & tuning sliders | `createDebugOverlay`, `DebugOverlay` | config/tuning, core/types, sim/track, ui/dom |
| `src/content/courses/` | `dev-course.json`, `course-01.json` | — | — |
| `scripts/check-fairness.ts` | Automated fairness verifier (`npm run fairness`) | `evaluateCourseFairness` | config/tuning, core/types, sim/* |

## Phase 3 additions

- `content/schema.ts`: `BRIEFING_ID`, `isHttps`, `isSourceUrl`, `validateBriefing` (production approval gate; sources allow HTTPS or `/charts/*.jpg`, with required chart descriptions and attribution).
- `content/loader.ts`: `createBriefingLoader`, `defaultBriefingId`, `BriefingNotice`; `content/index.ts`: bundled `loadBriefing(search)` including referenced course.
- `core/types.ts`: concrete `Briefing`, `Chapter`, `Classification`, `LearningQuestion`; `GameEvent` adds learningAnswer, briefingRead, app_error.
- `sim/chapters.ts`: `createChapterScheduler` based on active time; `AppDeps.chapters` wires chapterSeen and reset per run.
- `ui/captions.ts`: `createCaptions`; caption band reserved by layout above track (HUD band 144px plus safe-top inset).
- `ui/format.ts`: `formatCoverage` formats publication and cutoff in named timezone.
- `ui/screens/briefing.ts`: `createBriefingPanel`, accessible modal with source safety, focus restoration, fallback and briefingRead callback.
- `ui/screens/learningQuestion.ts`: `createLearningQuestion`, optional answer/explanation/reset; intro/results accept briefing and callbacks.
- `scripts/validate-content.ts`: `npm run validate`, runs under check and production prebuild; preview override `ALLOW_UNAPPROVED=1`.
- `scripts/course-timeline.ts`: `courseTimeline` for idle/boost-all/brake-all; `caption-quiet-zones.ts`: `checkCaptionQuietZones`, consumed by fairness.
- `docs/content/2026-10-31-review-sheet.md`: claim audit and outstanding Gate 3 owner review. Editorial content remains unchanged by Phase 4.

## Phase 4 additions

- `services/storage.ts`: `createSafeStore`, `createStorage`, shared `gameStorage`; page memory fallback, namespaced versioned bests and preferences.
- `services/attribution.ts`: `sanitizeAttribution`, `captureAttribution`, `buildCtaUrl`; five validated UTM fields, session persistence, HTTPS destination preservation.
- `services/share.ts`: `buildShareUrl`, `shareBriefing`, `ShareMethod`; native/copy/manual with silent cancellation and privacy-safe URLs.
- `services/analytics/contract.ts`: typed `Payloads`, `sanitizeEvent`, explicit event/property allowlists. `adapter.ts`: `createAnalytics`, session/run IDs, landing/completion guards, fault isolation.
- `services/analytics/transports.ts`: production disabled, opt-in local `?analytics=debug` console/`window.__ccEvents`. D5: owner chose no analytics; no remote provider/consent UI.
- Intro persists preferences; renderer honors reduced motion. Results submit versioned bests and share; briefing/results use attributed CTA and emit click before navigation.
- `scripts/inject-meta.ts`: Vite default-briefing social metadata; `SITE_URL` overrides local preview canonical; placeholder PNG under `public/social/`.
- `playwright.config.ts`, `tests/e2e/`: Chromium and mobile WebKit funnel/failure checks. `?testSpeed=8` available in dev or explicit `test-preview` mode, compiled out of normal production builds.
- `docs/qa/g4-funnel.md`: evidence and remaining public social-card check; Phase 5 local implementation is in progress; see PROGRESS.

## Phase 5 additions

- `main.ts`: imports styles and starts `bootstrap.ts`, with fatal initialization fallback.
- `bootstrap.ts`: HTML-first UI lifecycle; dynamically imports renderer; wires gesture-only audio and frame sync.
- `ui/setupServices.ts`: storage, attribution, local diagnostic analytics, reduced-motion CSS state, briefing and recovery wiring.
- `core/errorBoundary.ts`: `installErrorBoundary`, sanitized runtime error handling and text-access recovery.
- `services/audio.ts`: `createAudio`, original synthesized SFX, gesture unlock, mute/visibility/pause cleanup. Phaser built-in audio disabled.
- `ui/brand.ts`, `render/palette.ts`, `public/brand/`: original mark/icons and CSS-derived renderer colors.
- `scripts/check-bundle.ts`: Vite manifest initial + playable gzip budget; `build-vercel.ts`: preview/production policy and build.
- `vercel.json`, `.github/workflows/ci.yml`, `README.md`, `docs/DEPLOY.md`: hosting handoff, headers, CI and rollback instructions.
- `tests/e2e/a11y.spec.ts`, `failures.spec.ts`: axe, keyboard, reduced motion, blocked graphics/storage/audio, runtime and renderer download failures.
- `docs/assets-attribution.md`: original visual/audio sources. Production schema rejects unresolved editorial TODOs.

- `scripts/vercel-env.ts`: `vercelBuildEnv` resolves metadata URLs from Vercel system variables and preserves an explicit draft-review override; unapproved HTML has noindex/nofollow.

- Phase 5 live QA: `scripts/audit-live.mjs` (full runs, metadata, headers, axe and intercepted CTA), `measure-live-performance.mjs` (CDP start readiness), `check-contrast.ts`; evidence under `docs/qa/p5-live/` and `p5.2/`.
- `docs/qa/acceptance-audit.md`, `usability-sessions.md`: per-area release evidence and remaining real-user/owner gates. UI shell is the persistent main landmark.

## Coaster visual prototype

- `main.ts`: lazily mounts passenger Daily Ride by default; `?experience=game` loads the original game. Prior `?prototype=coaster` links remain compatible.
- `prototype/{geometry,track,train,scenery,prototype}.ts`, `prototype.css`: original Canvas 2D coaster, arc-length cars, rails/trestles, candlestick parallax, timed passenger choreography, captions, optional synthesized audio and responsive controls.
- `docs/coaster-visual-prototype.md`, `tests/e2e/prototype.spec.ts`: scope, art limitations and desktop/mobile motion verification. No main-game mechanics or editorial changes.

## Recap candle snapshots

- `content/marketSnapshot.ts`: `MarketCandle`, `MarketSnapshot`, `MARKET_SYMBOLS`, `parseMarketCandle`, `isMarketSnapshot`; exact-session OHLC and instrument validation.
- `scripts/import-market-snapshot.ts`: `npm run recap:snapshot -- <briefingId>`; private-key, after-close import to immutable `public/market/<briefingId>.json`; repeat imports skip provider calls.
- `prototype/marketBackdrop.ts`: `createMarketBackdrop`, one saved-file read, accessible data disclosure/table, illustrative fallback. `scenery.ts` draws labeled normalized candles; `drawMarketLabels` preserves label visibility over supports.
- `docs/market-snapshots.md`: recap workflow, timing, symbol limitations and data semantics. No provider requests from browser playback or builds.

## Complete passenger recap candidate

- `prototype/prototype.ts`: selects the dated briefing and matching candle session; composes flow, scene and saved backdrop on the isolated route.
- `prototype/recapFlow.ts`, `recap.css`: dated intro, classified captions, pause-to-read source dialog, score-free takeaways, safe share/manual fallback and attributed CTA; text access when canvas is absent.
- `prototype/recapTimeline.ts`: `RIDE_DURATION`, `rideStage`, `recapChapter`; source chapter objects retimed for the passenger presentation without editing editorial timestamps.
- `prototype/scene.ts`, `rideAudio.ts`: renderer/camera/pause/replay lifecycle and gesture-only original synthesis, separated from recap UI.
- `services/share.ts`: shared URL allowlist also preserves `prototype=coaster` for passenger links; other private/debug fields remain excluded.
- `docs/implementation-plan/passenger-experience.md`: current product overlay; revised Phase 6 uses observed evidence and a timed second recap, with analytics still disabled. G5 open.
- `docs/implementation-plan/market-expedition.md`: daily pilot script and separate longer-format chapter outline; expedition prototype follows phone observations.
- `public/charts/*.jpg`: four unchanged owner-supplied screenshots; `ui/screens/briefingCharts.css` styles public chart cards, full-size links and expandable NDX/SPX context. Build validation checks JPEG assets.
- `docs/editorial/`: archived working notes outside public assets; README records the Nasdaq/NYSE correction. This is editorial separation, not repository access control.

## November 2 intraday prototype

- `intraday/data.ts`: `validateIntraday`, `loadIntraday`, `priceAt`, fixed-session ESZ26/AAPL 15-minute contracts; rejects missing/mismatched bars.
- `intraday/track.ts`, `scene.ts`: piecewise-linear percentage track, 54-second playback, real bar endpoints and stationary reduced-motion overview; reuse procedural track/train art.
- `intraday/app.ts`, `style.css`: isolated review screen with ES/AAPL selection, independent context, bar table, safe selected-symbol sharing and missing-data fallback.
- `scripts/{probe-intraday,probe-es-intraday,import-intraday}.ts`: date-specific retrieval and immutable normalized imports; no browser provider calls.
- `docs/intraday-prototype.md`: session boundaries, provenance, geometry semantics, original-note corrections and reproduction steps.
