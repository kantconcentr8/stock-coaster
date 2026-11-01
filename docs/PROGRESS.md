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

### P3.1 - Schema and validation (2026-10-31)
Result: implemented; strict hand-rolled validator avoids a new runtime dependency (0 dependency gzip bytes; total preview JS 372.61 kB gzip at initial build).
Files: content/schema.ts, core/types.ts, scripts/validate-content.ts, package.json, schema fixtures/tests.
Rules cover typed fields, dates/timezones, ordered active-time chapters, labels, HTTPS links, references, answer indices and approval metadata. Captions warn above 12 words, fail above 16.
Production build refuses unapproved content; explicit ALLOW_UNAPPROVED=1 preview succeeds.

### P3.2 - Content registry and selection (2026-10-31)
Result: implemented. Bundled briefing/course registry, ID validation, default fallback notices, runtime revalidation and content-error fallback text.
Files: content/{loader,index}.ts, main.ts, fallback.ts, loader tests. Only b is read by loader; no attribution added.

### P3.3 - Campaign draft (2026-10-31)
Result: draft prepared, unapproved. Read campaign headings then thesis/structural/scenario sections only.
Files: content/briefings/2026-10-31-lower-value.json, docs/content/2026-10-31-review-sheet.md.
D2 already resolved to https://predictourney.site/waitlist. D3 pending: public source links, facts, dates/cutoff, ending and usage rights require owner review. No market numbers or fabricated links added.

### P3.4 - Intro (2026-10-31)
Result: implemented. Semantic main, brand/title, named-timezone publication/cutoff, draft/unknown-ID notices, controls, session-only sound preference slot, Start focus and read-without-playing.
Files: intro.ts, format.ts, styles.css, UI tests. Audio delivery/persistence remains outside phase 3; no storage service introduced.

### P3.5 - Active-time chapters (2026-10-31)
Result: implemented. Pure scheduler, once-per-run chapterSeen, reset on retry, pause-safe active time, classification icon/text and polite live announcements.
Files: sim/chapters.ts, ui/captions.ts, app.ts, main.ts, layout.ts, styles.css and tests. Reserved 144px plus safe-top inset HUD band keeps caption text above track; phone visual walkthrough remains owner QA.

### P3.6 - Results debrief (2026-10-31)
Result: implemented. One-second closing bell (immediate with reduced motion), neutral arcade breakdown, labeled takeaways before CTA, optional learning question with event/explanation/reset, Retry and full briefing.
Files: results.ts, learningQuestion.ts, main.ts, UI tests. Best/share slots intentionally remain unwired for phase 4.

### P3.7 - Text briefing (2026-10-31)
Result: implemented. Accessible dialog and fallback, heading structure, chapters/labels, glossary, sources, named-zone dates, disclaimer and CTA; focus trap/restoration; briefingRead event.
Files: briefing.ts, main.ts, fallback.ts, UI tests. Missing research links are openly marked pending; all actual source links must be HTTPS with safe rel attributes.

### P3.8 - Course alignment (2026-10-31)
Result: implemented with illustrative timing limitation documented in review sheet. Stepped descent, partial recovery below prior high, hypothetical fade with generous terrain margin.
Timeline at active 20/40/60s: idle 4964/8056/12833 wu; boost-all 5714/9443/15121; brake-all 2428/4828/7228. Each intended terrain section is encountered during its chapter on idle/boost paths; sustained braking can lag editorial terrain.
Fairness passes: 30268wu track, safe rails/reachability/preview, brake hits 0 vs boost 1. Quiet zones: 0..489, 4964..5549, 8056..8397wu, all hazard-free. No published course existed; version stays 1.
Files: course-01.json, scripts/{course-timeline,caption-quiet-zones,check-fairness}.ts.

### P3.9 - Editorial review / Gate 3 (2026-10-31)
Result: preview built for review; G3 PENDING explicit owner sign-off. approval.approved remains false.
Outstanding review and required facts/links/phone+desktop checks are in docs/content/2026-10-31-review-sheet.md. No owner approval inferred and no phase 4 work started.
Verification: npm run check passed (initial 80 tests); final verification recorded below. Production refusal confirmed; override preview build succeeds. Existing large Phaser bundle warning remains.

Final phase 3 verification: `npm run check` passed (21 files / 82 tests), final dialog tests passed, and preview build succeeded (JS 372.76 kB gzip). Production approval refusal verified. Physical phone/desktop editorial review remains pending.

### P4.1 - Storage, personal bests and preferences (2026-10-31)
Result: done. Version-scoped bests and schema-safe preferences, with shared page-memory fallback on storage failure.
Files: services/storage.ts, results.ts, intro.ts, GameScene.ts, storage tests.
Notes: sound preference is retained for future audio; reduced motion controls hazard nudge and closing-bell delay.

### P4.2 - Attribution and CTA URLs (2026-10-31)
Result: done. Five allowlisted UTM fields, validated and session-persisted; both CTA sites emit before navigation.
Files: services/attribution.ts, main.ts, results.ts, briefing.ts, attribution tests.
Decision: retain entry URL (no history.replaceState); ignored fields never enter CTA, share or event payloads.
Destination query parameters remain authoritative; HTTPS with no credentials required.

### P4.3 - Sharing and social metadata (2026-10-31)
Result: implemented and locally verified. Native share, silent cancellation, clipboard and selectable manual fallback.
Files: services/share.ts, results.ts, scripts/inject-meta.ts, vite.config.ts, public/social/default-1200x630.png, share tests.
Notes: shared URLs contain only briefing ID and share attribution; build-time tags use default briefing.
Public-domain selection/final artwork remain in Phase 5; external card-debugger check deferred until a hosted URL exists.

### P4.4 - Local event contract (2026-10-31)
Result: done. Ten typed events, explicit property validation, once-per-page landing and once-per-run completion guards.
Files: services/analytics/{contract,adapter,transports}.ts, core/types.ts, app.ts, main.ts, analytics tests.
Notes: failure-isolated sends, ephemeral debug session/run IDs with LAN-safe random fallback; completion includes neutral game stats.
Debug adapter enabled only in dev/test-preview with analytics=debug; ordinary production has no analytics initialization.

### P4.5 - No analytics, owner decision D5 (2026-10-31)
Result: done per explicit owner decision: "not using analytics - not required".
No provider, remote tracking, analytics identifiers on ordinary entry, cookies, consent banner, retention or billing.
Provider-specific integration/dashboard evidence waived; debug transport exists solely for local QA.

### P4.6 - Funnel verification and Gate 4 (2026-10-31)
Result: local funnel verified; developer sign-off recorded in docs/qa/g4-funnel.md.
Files: playwright.config.ts, tests/e2e/{funnel.spec,helpers}.ts, package scripts/lock, QA report.
Verification: npm run check passes (94 tests); all 6 Chromium/mobile WebKit browser tests pass.
Normal preview build succeeds with existing editorial override; built OG/Twitter tags inspected. No editorial approval inferred.
Follow-up: public social-card debugger check requires a hosted URL; deferred. Phase 5 not started.

### P4.UI - Results cleanup before Phase 5 (2026-10-31)
Result: wider opaque results card, compact score summary, desktop columns and mobile scrolling content with always-visible actions.
Files: results.ts, styles.css, funnel.spec.ts; desktop/mobile screenshots generated under test-results/.
Removed stray classification question marks, styled sharing, kept draft review notes in an explicit expandable disclosure.
Original briefing data and approval remain unchanged; Retry focus no longer scrolls away from the score.
Validation: project checks (94 unit tests) and desktop/mobile funnel tests; action visibility and horizontal overflow checked.
Phase 5 remains unstarted.

### P5.1-P5.5 - Release-readiness implementation / GitHub handoff (2026-10-31)
Result: implemented local audio, original brand assets, accessibility/failure specs, lazy renderer and bundle budget; Phase 5 release gate remains open.
Audio is original oscillator synthesis (0 KB transfer); muted default, gesture-only context, pause/visibility stop; Phaser audio disabled.
Intro renders before the dynamic renderer; Start waits for loading. Normal builds retain no diagnostic analytics/test acceleration.
Production validation rejects editorial TODOs as well as missing approval; existing draft content was not edited or approved.
Physical-device audio/screen-reader/FPS checks, Lighthouse measurement, contrast audit and five real usability sessions remain pending.

### P5.6-P5.8 - Vercel preparation and release status (2026-10-31)
Result: Vercel config, build script, GitHub CI and deployment/rollback instructions prepared. Owner will configure Vercel.
GitHub target supplied by owner: https://github.com/kantconcentr8/stock-coaster.git.
Vercel preview permits draft content; production requires HTTPS SITE_URL and approved content without TODOs.
No deployed URL, live headers, public card-debugger result, rollback rehearsal, usability sessions or G5 release approval claimed.
No analytics added; no paid plan/overage enabled. Phase 6 has not started.

GitHub handoff verification: `npm run check` passed (96 unit tests); all 16 Chromium/mobile WebKit tests passed.
Local draft preview build passed: initial HTML/CSS/JS 20,395 bytes gzip; full playable payload 378,177 bytes gzip.
Repository sync includes the existing local review-sheet edits; their checklist alone does not modify content approval metadata.

### P5.6a - Vercel reimport build fix (2026-10-31)
Result: SITE_URL now defaults to Vercel project/deployment URLs; explicit overrides are HTTPS-validated.
Strict editorial validation remains the default; explicit ALLOW_UNAPPROVED=1 supports draft review on the default domain.
Unapproved builds carry noindex/nofollow and retain draft labels/approval metadata. README/DEPLOY instructions updated.

### P5.2-P5.8 - Live technical audit and remaining owner gates (2026-10-31)
Result: live Chromium/mobile WebKit full runs pass; headers, caching, Brotli, canonical/OG and attributed CTA verified.
Files: scripts/{audit-live,measure-live-performance}.mjs, check-contrast.ts, docs/qa/{p5-live,p5.2,acceptance-audit,usability-sessions}.
Contrast: eight pairs pass. Fixed fallback CTA contrast and persistent main landmark; zero-violation local axe scans pass on both engines.
Performance: Lighthouse 79/100, accessibility 100/100; throttled Start ready 1.3s (9 Mbps, 40ms, CPU 4x, Windows host emulation).
Social asset field now points to the original final PNG; no editorial facts or approval metadata changed.
G5 remains OPEN: approved source links/content sign-off, five real phone sessions, physical-device checks, rollback rehearsal and launch approval pending.
No Phase 6 work started. Analytics remains disabled.

### Visual direction reset - Coaster motion study 01 (2026-10-31)
Result: separate ?prototype=coaster scene built from the chosen references' crest/drop composition and restrained palette.
Four cars follow one physical track independently, with wheels, riders, couplings, steel trestles and layered candlestick scenery.
Original procedural Canvas 2D study, not final 3D artwork. Held boost/brake changes momentum; pause/replay and reduced-motion/visibility behavior included.
Existing normal-route game, editorial draft, scoring and release gates unchanged. Phase 6 not started.
Verification: prototype sequence passes Chromium and mobile WebKit smoke checks; crest/drop screenshots inspected.

### Passenger direction - Automatic coaster study 02 (2026-11-01)
Result: implemented the agreed passenger experience in the isolated prototype; removed brake, boost and momentum.
28 active seconds: climb 7s, crest 3s, plunge 5s, trough 2s, recovery 11s; continuous Hermite pacing, reactive passengers and camera.
Added illustrative section captions and optional gesture-only synthesized sound (muted by default); no sourced market claims added.
Start/Pause/Resume/Replay, Escape, blur/visibility pause, reduced motion and blocked-audio fallback verified.
Validation: npm run check passes (101 unit tests); draft production build/bundle checks pass; four desktop/mobile WebKit prototype checks pass.
Inspected crest/drop and landscape screenshots; mobile frame cap raised to 100ms after slow-render timing failure; disclaimer spacing refined.
Original game, analytics-disabled decision, editorial draft and open G5 gates retained. Phase 6 has not started; physical-device/audio review pending.

### Recap data - After-close Twelve Data snapshots (2026-11-01)
Result: connected local private-key import and prototype candle rendering; no live polling or provider calls during playback/builds.
Command: npm run recap:snapshot -- <briefingId>; uses New York coverage date, after-close guard, exact-date/type/OHLC validation, immutable saved files and no-call reuse.
Saved October 30 OHLC for Mag 7 + SPY/QQQ/IWM in public/market/2026-10-31-lower-value.json; NDX/SPX/VIX/ES unavailable, no substitute instruments used.
Symbol discovery exposed unrelated NDX/SPX listings and ES as Eversource; index/futures identifiers/access remain unresolved.
Prototype labels real candles, independently scaled, with open-to-close percentages and accessible daily-data table; distant candles/track remain illustrative.
Validation: npm run check (105 unit tests), all 24 desktop/mobile browser tests, repeat-import no-call check and draft build/bundle checks pass; key absent from build/snapshot.
Inspected desktop/mobile labels; refined disclosure placement and reran four snapshot browser checks plus build. Workflow in docs/market-snapshots.md.
Original game/editorial approval/open G5 gates unchanged. Analytics disabled; Phase 6 unstarted. Physical-device review remains pending.

### P5.R1-R2 - Complete draft passenger recap and revised plan (2026-11-01)
Result: plan v1.1 makes passenger release the active milestone; Phase 6 revised to observed evidence + timed second recap, without analytics.
Candidate now loads the dated briefing, introduces its context, times actual classified chapters to the ride and ends with takeaways, Replay, Share and attributed CTA.
Chapter presentation: lower-value context through plunge 0-17s, bounce 17-24s, hypothetical outlook 24-28s; source JSON/timestamps/approval unchanged.
Read briefing & sources works throughout and pauses the ride; canvas failure retains dated text/source/CTA access; unknown recap visibly falls back.
Shared links retain the allowlisted prototype route and discard private/debug fields; backdrop rejects wrong-session data and Replay never refetches.
Split scene/audio/HTML/timeline modules; scrolling text is keyboard accessible, mobile dialog focus restored, end actions remain visible and manual share scrolls into view.
Validation: npm run check (108 unit tests), all 28 browser regressions, six passenger rechecks after card adjustment, draft production build/bundle pass; intro/end axe scans clear.
Updated plan/acceptance/session docs; candidate remains isolated until release promotion. G5 open: editorial sources/approval, five real phone sessions, physical-device checks and rollback/launch sign-off. Phase 6 unstarted.

### P5.R2a - Phone-first readability (2026-11-01)
Result: addressed owner-reported illegible desktop text; phone/social is the primary audience assumption.
Body/source copy 18px, captions >=22px, labels 14-16px, controls >=52px; opaque text panels and wider desktop cards.
Shorter intro copy/date; full metadata/review context in briefing. Read briefing moved to header; three large ride controls at bottom.
Sparse candle tags now use 20px symbols/16px moves; market table 16px values behind readable disclosure, with explicit missing-data explanation.
Validation: npm run check (108 units), 14 focused browser checks, draft build/bundle pass; 320/390/1440px reading/scroll/touch/overlap checks and screenshots inspected.
Narrow-phone header collision found visually and fixed; additional overlap check added. No real-phone testing or launch approval inferred; G5 remains open, analytics disabled.

### P5.R2b - Briefing footer actions (2026-11-01)
Result: replaced adjacent plain links with orange Join waitlist CTA and secondary Back to game button; side by side on desktop, stacked on phones.
Waitlist retains attributed destination. Back closes the briefing and restores opener focus, preserving the paused ride instead of navigating to the original game.
Verification: four desktop/mobile footer and text-fallback checks pass; typecheck, lint and draft production build/bundle pass. Release gates unchanged.

### P5.R2c - Directional O/C label colors (2026-11-01)
Result: negative open-to-close labels red (#ff8585), positive green (#6ee7a0), zero neutral; signed values retained.
Verification: draft production build/typecheck and bundle checks pass. No data or candle-body semantics changed.

### P5.R2d / P5.R3 content - Approved Daily Ride and expedition outline (2026-11-01)
Owner approved both supplied research documents and authorized the recommended daily-first adaptation; this is content authorization, not launch approval.
Result: current passenger candidate identifies itself as The Daily Ride, covers October 30 and uses session weakness → late bounce → conditional participation test. Readable briefing explains prior-session context and separates editorial ES references from saved stock/ETF candles.
Content version 2 removes editorial TODOs, records approval and November 1 adaptation time, and links unchanged packaged research copies. Original Oct_10 filename mismatch is disclosed; hashes match both owner files. Existing briefing ID is retained for snapshot/share compatibility.
Source validation/rendering allow only HTTPS or restricted packaged /research/*.txt paths; build validation checks packaged files. Source URL safety tests reject traversal, active URLs and arbitrary local files.
Separate Market Expedition outline defines a roughly 90-second October 20–30 chapter journey and optional hypothetical November explanations. It is planning, not a playable second ride or Phase 6 work; prototype after daily phone observations.
Validation: npm run check passes (109 unit tests), strict npm run build passes without editorial override and bundle budgets pass. All 16 focused Chromium/mobile WebKit browser cases passed, including source retrieval, complete ride, controls, fallback, readability, CTA/share and saved snapshot behavior. Desktop/mobile intro screenshots visually inspected. The sandbox's Node user-info error required running build/check outside the sandbox; no product workaround introduced.
Updated phone-session script and current acceptance status. Changes remain local; no deployment/root promotion, real-phone observations, rollback rehearsal or launch approval claimed. G5 remains open; analytics disabled; Phase 6 not started.
Browser-runner limitation: all 16 individual cases reported ok, but the sandboxed runner stalled during shutdown without a final summary; interrupted the completed test session. This is not a clean runner-exit claim.

### P5.R3 observation / P5.R2e - Mobile symbol coverage (2026-11-01)
Owner reports Pixel 8 Pro viewing looks good: CTA, sharing and market-data disclosure work. Browser/build unspecified; audio, reduced motion and screen-reader results not inferred. Recorded separately from the five first-time phone sessions, which remain pending.
Observed issue: only one or two candle symbols appear on small screens, while desktop exposes more. Cause: foreground parallax travels only about two candle spacings across the full camera route.
Fix: below 600px, saved foreground candles traverse one full symbol set across the 28-second active ride. Spacing, label type size, OHLC values and directional colors remain intact. The sweep follows active ride time, so pause freezes it and Replay resets it. Desktop parallax remains unchanged.
Verification: typecheck, lint and strict production build/bundle pass. New real-time canvas-label coverage case reports all ten saved symbols drawn during a complete 390x844 ride on Chromium and mobile WebKit. Changes remain local; Pixel recheck after deployment remains pending. Analytics disabled; Phase 6 not started.
Both browser cases reported ok; the runner again stalled after case completion and was interrupted during shutdown.

### P5.R2f - CI narrow-header overlap (2026-11-01)
Owner supplied GitHub Actions failure: both browser engines measured header bottom 131.375px versus market-data top 108px. Fixed offsets assumed fewer wrapped title lines; platform font differences can expose the overlap.
Fix: measure header bounds with ResizeObserver and position market-data/stage rows and portrait recap cards below the actual header, retaining minimum spacing. Added a 320px regression that forces wider title glyphs and extra line wrapping; original overlap assertion retained.
Removed the reported Vite native-config import warnings with explicit .ts imports and noEmit-compatible allowImportingTsExtensions. No warning suppression added.
Validation: npm run check passes (109 unit tests), strict production build/bundle passes, and six focused Chromium/mobile WebKit cases report ok (original readability sweep, forced header reflow, resize/reduced-motion controls). Forced-reflow screenshot visually inspected. GitHub/Linux CI has not been rerun by this task; fixes remain local pending commit/push.
The local browser runner again stalled after all cases reported ok and was interrupted during shutdown; no clean runner exit claimed.
