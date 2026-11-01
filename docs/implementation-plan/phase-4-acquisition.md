# Phase 4 — Acquisition Layer (PRD Milestone 4)

**Goal:** Version-scoped personal bests, preferences, privacy-safe attribution carried to the CTA, native/copy sharing with social metadata, and the analytics event contract — all failing gracefully.
**PRD refs:** §9.5 (local bests), §13, §14, §16, §17 (Persistence, Attribution, Analytics, Results), §19 M4.
**Exit (Gate G4):** End-to-end events and the outbound CTA flow are verified against a nonproduction destination; game works with analytics blocked.
**Phase budget:** 6 tasks · ~1,500 LOC total.
**Blocking owner decision:** D5 (analytics service + consent) before P4.5. P4.1–P4.4 proceed with a no-op/debug adapter.

---

### P4.1 — Storage service, versioned personal best, preferences  [Size S]

**Goal:** Local storage wrapper with in-memory fallback; personal best keyed by briefing, course version, scoring version; sound/reduced-motion preferences.
**PRD:** §9.5, §15 (local storage + fallback), §16, §17 Persistence · **Depends on:** P3.6
**Read:** `src/config/tuning.ts` (`SCORING_VERSION`), `src/ui/screens/results.ts` (best-score slot only), PRD §9.5.
**Touch:** `+src/services/storage.ts`, `~src/ui/screens/results.ts`, `+tests/services/storage.test.ts`

**Steps:**
1. `createStorage()`: probe `localStorage` inside try/catch (Safari private mode, disabled storage, quota); fall back to a `Map`. Namespaced keys `cc:v1:*`. Never store personal data.
2. `getBest(briefingId, courseVersion, scoringVersion)` / `submitScore(...) → { best, isNewBest }`.
3. `getPrefs()/setPrefs({ muted, reducedMotion? })` with schema-safe parsing (corrupt JSON → defaults).
4. Results shows "Your best" + "New best!" badge.

**Accept:**
- [ ] Tests: throwing `localStorage` → in-memory fallback; play/restart unaffected.
- [ ] Tests: changing `courseVersion` or `SCORING_VERSION` yields an empty best.
- [ ] Tests: corrupt stored JSON → defaults, no throw.

**Verify:** `npm test -- storage`
**Out:** Cloud saves/leaderboards (non-goal).

---

### P4.2 — Attribution capture and CTA URL builder  [Size M]

**Goal:** Capture allowlisted UTM fields on entry, keep them for the session (retries included), and append destination-compatible params to the CTA without overwriting existing ones.
**PRD:** §13 bullets 4–6, §16 (allowlisted attribution), §17 Attribution · **Depends on:** P3.6
**Read:** PRD §13; `src/content/schema.ts` (`cta` type); `src/ui/screens/results.ts` + `src/ui/screens/briefing.ts` (CTA render sites only).
**Touch:** `+src/services/attribution.ts`, `~src/ui/screens/results.ts`, `~src/ui/screens/briefing.ts`, `+tests/services/attribution.test.ts`

**Steps:**
1. Allowlist: `utm_source, utm_medium, utm_campaign, utm_content, utm_term`; values trimmed, ≤ 100 chars, charset `[A-Za-z0-9._~-]` (others dropped). Everything else in the query string is ignored.
2. Store in `sessionStorage` (fallback memory) so retries keep attribution; optionally `history.replaceState` to keep URL clean (decide; record in PROGRESS).
3. `buildCtaUrl(cta, attribution)`: parse with `URL`; require `https:`; add only params absent on the destination; add `utm_content=<cta.id>` if not present; never add identifiers.
4. Both CTA render sites use the builder; emit `ctaClick` before navigation (non-blocking — navigation must not wait on analytics).

**Accept:**
- [ ] Tests: existing destination params preserved; disallowed params (`email`, `fbclid`, arbitrary) excluded; non-https destination rejected.
- [ ] Tests: attribution survives a restart within the session.

**Verify:** `npm test -- attribution`
**Out:** Analytics transport (P4.4/P4.5).

---

### P4.3 — Sharing and social metadata  [Size M]

**Goal:** Native share sheet with copy-link fallback; shared URL identifies only the briefing; branded social preview metadata.
**PRD:** §13 bullets 7–10, §16 (share/clipboard failures) · **Depends on:** P3.6, P4.2
**Read:** PRD §13; `src/ui/screens/results.ts` (share slot), `index.html`, `src/content/schema.ts` (`shareText`, `socialImage`).
**Touch:** `+src/services/share.ts`, `~src/ui/screens/results.ts`, `~index.html`, `+scripts/inject-meta.ts` (Vite plugin or build step), `+public/social/default-1200x630.png` (placeholder), `+tests/services/share.test.ts`

**Steps:**
1. `shareBriefing(briefing)`: URL = origin + path + `?b=<id>&utm_source=share&utm_medium=<method>` (no score, no personal data); text = `shareText` (no competitive score claims).
2. `navigator.share` when available; `AbortError` (user cancel) = silent; else `navigator.clipboard.writeText`; else show a selectable read-only input with the link.
3. Emit `shareAction { method: 'native' | 'copy' | 'manual' }` on invocation (never claim a completed post).
4. Build-time meta injection per default briefing: `<title>`, description, `og:*`, `twitter:card=summary_large_image`, canonical URL; placeholder social image (final art in P5.2).

**Accept:**
- [ ] Tests: share cancel → no error UI; clipboard rejection → manual fallback.
- [ ] Built `index.html` contains correct OG/Twitter tags (validate with a card debugger in P4.6).

**Verify:** `npm test -- share && npm run build` then inspect `dist/index.html`.
**Out:** Personalized scorecard image (deferred per PRD §13).

---

### P4.4 — Analytics adapter and event contract  [Size M]

**Goal:** Map internal events to the PRD §14 contract through a provider-agnostic adapter, with once-per-run guards, sanitization, and a debug transport.
**PRD:** §14 (event table, rules), §16, §17 Analytics · **Depends on:** P4.2
**Read:** PRD §14 "Event contract" + following paragraph; `src/core/events.ts` (exports), `src/core/types.ts` (`GameEvent`).
**Touch:** `+src/services/analytics/contract.ts`, `+src/services/analytics/adapter.ts`, `+src/services/analytics/transports.ts`, `~src/app.ts`, `+tests/services/analytics.test.ts`

**Steps:**
1. `contract.ts`: typed payloads for the 10 events (`landing_view`, `run_start`, `chapter_seen`, `run_complete`, `run_restart`, `briefing_read`, `learning_answer`, `cta_click`, `share_action`, `app_error`) with an explicit property allowlist each.
2. `adapter.ts`: subscribes to the bus; adds `briefingId`, `contentVersion`, `courseVersion`, app version, device class (`mobile`/`desktop` from pointer + width), session-scoped random ID (`crypto.randomUUID`, sessionStorage, never persisted cross-session), run ID per run. Guards: `run_complete` once per run ID; `landing_view` once per page load.
3. Transports: `noop`, `debug` (`?analytics=debug` logs to console + `window.__ccEvents` for tests), provider slot for P4.5. All sends wrapped in try/catch; use `sendBeacon`/`keepalive` for `cta_click`.
4. `app_error`: sanitized codes only (no messages containing URLs or user data).

**Accept:**
- [ ] Tests: properties not in the allowlist are dropped; no query strings or free text pass through.
- [ ] Tests: completion emitted once per run across pause/resume; restart produces a new run ID.
- [ ] Tests: transport throwing does not affect gameplay or navigation.

**Verify:** `npm test -- analytics`
**Out:** Choosing/integrating a vendor (P4.5).

---

### P4.5 — Analytics provider integration and consent  [Size S]

**Goal:** Plug the owner-selected service into the transport slot with appropriate consent behavior.
**PRD:** §14 ("consent behavior must match service"), §15 (optional analytics after cost/privacy review), §20 · **Depends on:** P4.4, owner decision D5
**Read:** `src/services/analytics/transports.ts`, provider's official docs (custom events + privacy pages only).
**Touch:** `~src/services/analytics/transports.ts`, `+src/ui/consent.ts` (only if required), `~docs/PROGRESS.md`

**Steps:**
1. Record decision in PROGRESS: provider, free-tier limits, cookie usage, data retention, whether consent is needed for target regions.
2. Implement transport with the provider's script loaded **async and lazily after first paint**; if blocked, fall back to `noop` silently.
3. If cookies/identifiers require consent: minimal non-blocking banner; default to no tracking until accepted (or use a cookieless mode).
4. No paid tier enabled; no overage billing (PRD §20).

**Accept:**
- [ ] With an ad blocker: no console errors, full run + CTA works.
- [ ] Test events visible in the provider dashboard from a preview build.

**Verify:** manual with and without blocker; dashboard screenshot in `docs/qa/p4.5/`.
**Out:** Reporting (P6.1).

---

### P4.6 — End-to-end funnel verification and Gate 4  [Size M]

**Goal:** Automated smoke test of the full funnel plus manual verification of attribution and events against a nonproduction destination.
**PRD:** §18 bullets 5–6, §17 (Entry, Results, Attribution, Analytics), §19 M4 · **Depends on:** P4.1–P4.5
**Read:** PRD §14 event table, §18; `src/services/analytics/transports.ts` (debug transport API).
**Touch:** `+playwright.config.ts`, `+tests/e2e/funnel.spec.ts`, `+tests/e2e/helpers.ts`, `~package.json`, `+docs/qa/g4-funnel.md`

**Steps:**
1. Add Playwright (Chromium + WebKit mobile emulation only to keep installs small). Add a test-only hook `?testSpeed=8` (dev/preview builds only) that multiplies sim steps so a 60 s run completes in ~8 s wall time.
2. `funnel.spec.ts`: open `/?b=<id>&utm_source=x&utm_campaign=t&email=a@b.c` → assert `landing_view` → Start → complete → assert `run_complete` once → Retry → `run_restart` → open briefing → `briefing_read` → click CTA (intercept navigation) → assert URL params preserved and `email` absent → share with clipboard mocked.
3. Second spec: analytics transport blocked (route abort) → full run still completes.
4. Manual: CTA to a nonproduction test URL; validate social card with X/LinkedIn debuggers; record in `g4-funnel.md`.

**Accept:**
- [ ] E2E specs pass locally on Chromium and WebKit emulation.
- [ ] Event counts match expectations with no duplicates and no personal data.
- [ ] G4 sign-off recorded in PROGRESS.

**Verify:** `npx playwright test`
**Out:** Performance and deployment (Phase 5).

