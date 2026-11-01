# Phase 5 — Pilot Release (PRD Milestone 5)

**Goal:** Audio and brand polish, accessibility and failure hardening, performance budget, static deployment with preview + rollback, first-time usability sessions, and a full acceptance audit.
**PRD refs:** §10 accessibility, §15 performance/browser targets, §16, §17 (all), §18, §19 M5, §20, §22.
**Exit (Gate G5):** All PRD §17 rows pass or have owner-accepted gaps; ≥ 5 usability sessions done with recurring issues resolved; owner approves public release.
**Phase budget:** 8 tasks · ~1,400 LOC + assets/docs.
**Blocking owner decisions:** D1 (brand) for P5.2; D4 (hosting) for P5.6; D2 final CTA URL and D6 testers for P5.7–P5.8.

---

### P5.1 — Audio: SFX, mute, autoplay-safe loading  [Size M]

**Goal:** Light SFX (pickup, hazard, lane, boost loop, closing bell) that never carry essential information, with mute before/during play.
**PRD:** §10 (mute before/during play; sound never essential), §15 (lazy-load audio), §16 (autoplay restrictions) · **Depends on:** P4.1
**Read:** `src/core/events.ts` (exports), `src/services/storage.ts` (prefs API), `src/ui/screens/pause.ts` + `intro.ts` (sound toggle sites).
**Touch:** `+src/services/audio.ts`, `+public/audio/*.ogg|.mp3` (licensed/original), `~src/ui/screens/intro.ts`, `~src/ui/screens/pause.ts`, `+docs/assets-attribution.md`

**Steps:**
1. `audio.ts`: Web Audio context created/resumed only on the Start gesture; lazy-fetch small SFX after intro renders; total audio ≤ 300 KB.
2. Subscribe to bus events; boost loop starts/stops with boost state; everything stops on pause/results/visibility hidden.
3. Mute toggle on intro and pause, persisted via prefs; respects muted default if stored.
4. Record every asset's source/license in `docs/assets-attribution.md` (PRD §16).

**Accept:**
- [ ] Audio failure (blocked context, 404) produces no visible error and no gameplay impact.
- [ ] Pausing stops all sound immediately.

**Verify:** manual on iOS Safari (silent switch on/off) and desktop; `npm run check`.
**Out:** Music (not required).

---

### P5.2 — Brand and visual polish pass  [Size M]

**Goal:** Apply final brand (name, logo, colors), readable chart-styled art, final social image — without reducing readability.
**PRD:** §6 principles 3 and 5, §13 (branded preview), §16 (licensed visuals), §22 item 1 · **Depends on:** owner decision D1, P3.6
**Read:** `src/styles.css` (custom properties section), `src/render/trackView.ts` + `objectView.ts` (color/style constants only), brand kit from owner.
**Touch:** `~src/styles.css`, `+src/render/palette.ts`, `~src/render/trackView.ts`, `~src/render/objectView.ts`, `+public/brand/*`, `~public/social/default-1200x630.png`

**Steps:**
1. Centralize colors into CSS custom properties + `palette.ts` (Phaser side reads the same tokens).
2. Verify WCAG AA contrast for all text (4.5:1) and UI controls (3:1); keep shape/symbol differences for objects.
3. Brand mark on intro/results and subtle HUD placement that never overlaps the track ahead.
4. Produce the final 1200×630 social image (original art) and favicon/app icons.

**Accept:**
- [ ] Contrast check results recorded; grayscale distinguishability still holds.
- [ ] No unlicensed assets; attribution file updated.

**Verify:** manual + contrast tool; screenshots to `docs/qa/p5.2/`.
**Out:** New gameplay features.

---

### P5.3 — Accessibility and reduced-motion audit  [Size M]

**Goal:** Meet PRD §10 accessibility for menus, briefing, captions, and conversion path.
**PRD:** §10 "Accessibility and alternate consumption", §17 Accessibility · **Depends on:** P5.2
**Read:** PRD §10 accessibility list; `src/ui/screens/*.ts` (one at a time, fix as you go).
**Touch:** `~src/ui/screens/*.ts` (targeted fixes), `~src/render/effects.ts`, `+tests/e2e/a11y.spec.ts`, `+docs/qa/a11y-audit.md`

**Steps:**
1. Add `@axe-core/playwright` scan for intro, pause, results, briefing (zero serious/critical violations).
2. `prefers-reduced-motion` + in-app toggle: disables shake, caption animation, closing-bell motion, decorative particles; no flashing anywhere > 3 Hz.
3. Keyboard-only walk: intro → read briefing → close → start → pause → resume → results → CTA; focus visible and restored after dialogs.
4. Screen reader spot check (VoiceOver iOS or NVDA): intro, briefing, results, CTA announced sensibly; canvas has `aria-hidden="true"` with an adjacent text explanation.

**Accept:**
- [ ] axe spec passes; audit doc lists any accepted gaps (e.g., nonvisual action gameplay is out of scope per PRD §10).
- [ ] Reduced-motion verified on device.

**Verify:** `npx playwright test a11y`
**Out:** Nonvisual gameplay (out of MVP scope).

---

### P5.4 — Failure modes and graceful fallbacks  [Size S]

**Goal:** Every PRD §16 failure path ends in a usable state with the briefing and CTA available.
**PRD:** §15 (unsupported graphics), §16 bullets 1–3, §17 Failure · **Depends on:** P4.4
**Read:** PRD §16; `src/ui/screens/fallback.ts`, `src/main.ts`, `src/services/analytics/contract.ts` (`app_error` codes).
**Touch:** `~src/main.ts`, `~src/ui/screens/fallback.ts`, `+src/core/errorBoundary.ts`, `+tests/e2e/failures.spec.ts`

**Steps:**
1. Global `error`/`unhandledrejection` handler → sanitized `app_error` + non-blocking toast; fatal init errors → fallback screen with text briefing + CTA.
2. Fallback screen reuses the briefing renderer (P3.7) so content stays consistent.
3. E2E cases: WebGL + Canvas disabled (stub `getContext` → null), storage throwing, clipboard denied, analytics blocked, audio blocked, invalid briefing ID.

**Accept:**
- [ ] All six cases show a usable screen; none show a blank page.
- [ ] `app_error` payloads contain only codes + app version.

**Verify:** `npx playwright test failures`
**Out:** Offline/PWA support (not required).

---

### P5.5 — Performance and bundle budget  [Size M]

**Goal:** ≤ 3 MB initial compressed transfer, playable intro ≤ 3 s on fast-4G profile, 60 FPS target / stable 30 FPS on the reference phone.
**PRD:** §15 "Performance and browser targets" · **Depends on:** P5.1, P5.2
**Read:** PRD §15 performance bullets; `vite.config.ts`; `npm run build` size summary (not full logs).
**Touch:** `~vite.config.ts`, `+scripts/check-bundle.ts`, `~package.json`, `+docs/qa/performance.md`, targeted `~src/render/*.ts` fixes

**Steps:**
1. `check-bundle.ts`: sum gzip/brotli sizes of initial assets from Vite manifest; fail if > 3 MB (warn > 2 MB). Add to `npm run check` for production builds.
2. Code-split: intro + content render before Phaser chunk finishes loading (Start button enabled when ready, with progress text); audio/images lazy; no external fonts (system stack).
3. Consider Phaser custom build or tree-shaking if it dominates the bundle; record before/after sizes.
4. Measure Lighthouse (mobile, fast-4G-like throttling) and on-device FPS via debug overlay over a full run; record conditions + results (PRD: "record conditions and actual results").

**Accept:**
- [ ] Bundle check passes; numbers recorded.
- [ ] Reference phone holds ≥ 30 FPS throughout; any gaps recorded honestly.

**Verify:** `npm run build && npx tsx scripts/check-bundle.ts`; Lighthouse report saved.
**Out:** Advanced asset pipelines.

---

### P5.6 — Static deployment, preview builds, headers, rollback  [Size M]

**Goal:** Repeatable deploys to the chosen free static host with HTTPS, compression, caching, preview URLs, and one-step rollback.
**PRD:** §15 (static hosting), §16 (no secrets), §17 Publishing, §20 (zero incremental cost) · **Depends on:** owner decision D4, P5.5
**Read:** PRD §15, §20; chosen host's official docs (headers + previews + rollback pages only).
**Touch:** `+.github/workflows/ci.yml` (or host-native build config), `+public/_headers` (or host equivalent), `+docs/DEPLOY.md`, `~package.json`

**Steps:**
1. Record host choice, free-tier limits, and that no billing/overage is enabled (PRD §20) in PROGRESS.
2. CI: `npm ci && npm run check && npm run build` on every PR; preview deploy per branch with `ALLOW_UNAPPROVED=1`; production deploy only from `main` with approval required.
3. Headers: long-cache hashed assets (`immutable`), no-cache `index.html`; `Content-Security-Policy` (self + analytics origin only), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` minimal.
4. `DEPLOY.md`: how to deploy, verify, and **roll back** (host's previous-deploy promote or redeploy of a tagged commit); tag releases `v0.x.y`.
5. Confirm no secrets/private campaign files in `dist/` (grep for the campaign path, `TODO(owner)`, `.env`).

**Accept:**
- [ ] Preview URL works on phone; production deploy gated.
- [ ] Rollback rehearsed once and documented.
- [ ] securityheaders-style check shows CSP and other headers present.

**Verify:** deploy preview; `curl -I` the preview URL; rollback rehearsal noted in `DEPLOY.md`.
**Out:** Custom domain (optional, D4).

---

### P5.7 — First-time usability sessions  [Size S]

**Goal:** Observe ≥ 5 first-time players on phones; fix recurring control or comprehension misunderstandings.
**PRD:** §4 hypotheses 2–3, §14 "Provisional pilot thresholds" bullet 1, §18 · **Depends on:** P5.6 (preview URL), owner decision D6
**Read:** PRD §4 hypotheses table, §14 thresholds.
**Touch:** `+docs/qa/usability-sessions.md`, `~docs/PROGRESS.md`

**Steps:**
1. Script: send preview link as if from a social post; no instructions; observe; ask: "What was the main point of the briefing?" and "What would you do next?"
2. Record per session: device, started without help (y/n), controls misunderstood, completed, retried, read briefing, clicked CTA, comprehension answer.
3. Any issue seen in ≥ 2 sessions becomes a fix task `P5.7a/b/...` (≤ size M each); re-test with a new participant if possible.

**Accept:**
- [ ] ≥ 5 sessions recorded; recurring issues resolved or owner-accepted.

**Verify:** completed `usability-sessions.md`.
**Out:** Public promotion.

---

### P5.8 — Acceptance audit, production smoke test, Gate 5  [Size M]

**Goal:** Walk every PRD §17 row with evidence, finalize CTA, deploy to production, smoke-test the real campaign URL, and obtain launch approval.
**PRD:** §17 (all), §12 publishing step 6, §19 M5, §24 · **Depends on:** P5.1–P5.7, owner decision D2 (final CTA)
**Read:** PRD §17 table; README §8 traceability table; `docs/qa/*` summaries.
**Touch:** `~src/content/briefings/2026-10-31-lower-value.json` (final CTA only), `+docs/qa/acceptance-audit.md`, `~docs/PROGRESS.md`

**Steps:**
1. `acceptance-audit.md`: one row per PRD §17 area → evidence link (test name, QA doc, screenshot) → pass/gap → owner decision on gaps.
2. Set final CTA URL; `npm run validate` in production mode passes with no `TODO(owner)` left.
3. Production deploy; smoke test the exact campaign URL with UTM params on iOS Safari, Android Chrome, X in-app browser, and desktop; verify CTA lands with attribution and an analytics event appears.
4. Tag release; confirm rollback target exists; record G5 sign-off.

**Accept:**
- [ ] Every PRD §17 row has evidence; any gap has explicit owner acceptance.
- [ ] Production smoke test passed on the real link; rollback artifact exists.
- [ ] G5 sign-off recorded.

**Verify:** `acceptance-audit.md` complete; production URL check.
**Out:** Paid promotion decisions (owner).

