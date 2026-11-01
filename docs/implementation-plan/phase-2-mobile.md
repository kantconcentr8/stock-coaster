# Phase 2 — Mobile Experience (PRD Milestone 2)

**Goal:** Portrait-first responsive layout, simultaneous touch controls, pause/visibility handling, and gesture suppression that work on real phones and the X in-app browser.
**PRD refs:** §10 Mobile, §9.6, §15 browser targets, §16, §17 (Controls, Mobile, Failure), §19 M2.
**Exit (Gate G2):** A full run on each reference phone completes without control or layout failures.
**Phase budget:** 5 tasks · ~1,100 LOC total.
**Can run in parallel with Phase 3** (different folders). Touches `src/input/`, `src/ui/layout.ts`, `src/ui/screens/pause.ts`, `src/styles.css`.

**Blocking owner decision:** D6 (reference phones, testers) before P2.5.

---

### P2.1 — Responsive layout, safe areas, DPR scaling  [Size M]

**Goal:** Layout regions (HUD top, track middle, controls bottom) that adapt to portrait/landscape and device safe areas without hiding the track ahead.
**PRD:** §10 Mobile (portrait primary, safe areas, no overlap), §15 · **Depends on:** G1
**Read:** `src/styles.css`, `src/render/camera.ts`, `src/render/createGame.ts`, PRD §10 Mobile.
**Touch:** `+src/ui/layout.ts`, `~src/styles.css`, `~src/render/camera.ts`, `~src/render/createGame.ts`

**Steps:**
1. `layout.ts`: compute regions from `visualViewport` (fallback `innerWidth/innerHeight`) + `env(safe-area-inset-*)`; emit `layoutChange` on resize/orientation change (debounced ~100 ms).
2. Portrait: controls band at bottom (~22–28 % height), HUD band at top; Phaser camera viewport = middle region. Landscape: controls split left/right edges.
3. Use `100dvh` with fallback; cap Phaser resolution at `min(devicePixelRatio, 2)` for performance.
4. Camera re-runs its preview-distance zoom on each `layoutChange`; log a warning in debug if `visibleAheadSeconds < 2`.

**Accept:**
- [ ] At 360×640, 390×844, 412×915 portrait and 844×390 landscape: track ahead ≥ 2 s preview, nothing overlaps HUD/controls.
- [ ] Orientation change mid-run does not reset or break the run.

**Verify:** devtools device emulation for each size; screenshot set saved to `docs/qa/p2.1/`.
**Out:** Touch handling (P2.2).

---

### P2.2 — Touch controls with Pointer Events  [Size M]

**Goal:** Large on-screen Up/Down rail buttons and separate hold-to-boost and hold-to-brake, supporting simultaneous touches with no stuck inputs.
**PRD:** §10 Mobile, §17 Controls · **Depends on:** P2.1, P1.5
**Read:** `src/input/inputState.ts`, `src/ui/layout.ts` (exports), `src/ui/dom.ts`, PRD §10 Mobile.
**Touch:** `+src/input/touch.ts`, `+src/ui/touchControls.ts`, `~src/styles.css`, `+tests/input/touch.test.ts`

**Steps:**
1. `touchControls.ts`: four real `<button>` elements with `aria-label`s ("Move up a rail", "Move down a rail", "Boost (hold)", "Brake (hold)"); ≥ 44×44 CSS px, ≥ 8 px gaps; shapes/icons plus text labels.
2. `touch.ts`: track active pointers by `pointerId` per button using `pointerdown` + `setPointerCapture`; release on `pointerup`, `pointercancel`, `lostpointercapture`. Lane buttons pulse once per `pointerdown`.
3. Global safety: `visibilitychange`, `blur`, `orientationchange`, and `layoutChange` call `input.clearAll()`.
4. Show touch controls only on coarse pointers (`matchMedia('(pointer: coarse)')`) or after first touch; keyboard remains active.

**Accept:**
- [ ] Tests (synthetic PointerEvents): boost held + lane tap simultaneously → both applied; `pointercancel` clears boost.
- [ ] Manual on device: holding boost with one thumb while tapping rails with the other works.

**Verify:** `npm test -- touch`; manual device check via LAN `npm run dev -- --host`.
**Out:** Haptics/gamepad (post-MVP).

---

### P2.3 — Pause, visibility auto-pause, resume countdown  [Size M]

**Goal:** Pause screen (Resume, Restart, Sound, Exit), Escape/pause button, auto-pause on hidden page, and resume via countdown.
**PRD:** §7 screen 3, §9.6, §10 Desktop (Escape), §17 Run/Failure · **Depends on:** P1.10
**Read:** `src/core/stateMachine.ts`, `src/app.ts`, `src/ui/dom.ts`, `src/ui/screens/countdown.ts`, PRD §9.6.
**Touch:** `+src/ui/screens/pause.ts`, `~src/ui/hud.ts` (pause button), `~src/app.ts`, `+tests/core/pauseFlow.test.ts`

**Steps:**
1. Pause button in HUD (≥ 44 px, `aria-label="Pause"`); Escape toggles pause where the browser allows.
2. `document.visibilitychange → hidden` and `pagehide` send `pause` if running; never auto-resume.
3. Pause screen: Resume (focused), Restart, Sound toggle (stub until P5.1), Exit to intro. Focus is trapped inside while open; Escape = Resume.
4. Resume → `RESUME_COUNTDOWN_SECONDS` overlay → running; input cleared on pause and on resume.
5. Emit `pause`/`resume` events.

**Accept:**
- [ ] Test: hidden → paused; 30 s hidden consumes 0 active time; resume requires explicit action + countdown.
- [ ] Test: restart from pause yields a fresh run (reuses P1.9 reset assertions).
- [ ] Manual: switching tabs/apps on a phone pauses the run.

**Verify:** `npm test -- pauseFlow`; manual.
**Out:** Sound implementation (P5.1).

---

### P2.4 — Scroll, zoom, and gesture suppression; in-app browser hardening  [Size S]

**Goal:** No page scroll, pinch/double-tap zoom, pull-to-refresh, or text selection during active control; menus remain normally scrollable.
**PRD:** §10 Desktop/Mobile ("prevent scrolling only while active"), §15 (X in-app browser), §17 Mobile · **Depends on:** P2.2
**Read:** `src/styles.css`, `src/input/touch.ts` (exports), `index.html`.
**Touch:** `~src/styles.css`, `~src/app.ts`, `+src/ui/inAppBrowser.ts`

**Steps:**
1. While `running`/`countdown`: add `body.is-playing` → `overscroll-behavior: none`, `touch-action: none` on game + controls, `user-select: none`, `-webkit-touch-callout: none`. Remove on other phases so briefing/results scroll normally.
2. Keep `viewport` meta without `user-scalable=no` (accessibility); rely on `touch-action` for in-game zoom suppression.
3. `inAppBrowser.ts`: detect common in-app UAs (X/Twitter, Instagram, Facebook) → non-blocking hint on intro: "For best results, open in your browser" with copy-link button. Never block play.

**Accept:**
- [ ] On iOS Safari and Android Chrome: no scroll/zoom/pull-to-refresh during a run; results page scrolls.
- [ ] In-app hint appears only for matched UAs and is dismissible.

**Verify:** manual device check; record in `docs/qa/p2.4.md`.
**Out:** Performance work (P5.5).

---

### P2.5 — Reference-device test pass and Gate 2  [Size S]

**Goal:** Prove mobile readiness on real hardware, including the X in-app browser, and fix-list anything that fails.
**PRD:** §15 targets, §18 bullets 3–4, §19 M2 · **Depends on:** P2.1–P2.4, owner decision D6
**Read:** PRD §15 "Performance and browser targets", §18; `docs/qa/` notes.
**Touch:** `+docs/qa/device-matrix.md`, `~docs/PROGRESS.md`

**Steps:**
1. Device matrix: device, OS, browser (Safari, Chrome, X in-app), orientation, FPS (debug overlay), result.
2. Checklist per device: full run; simultaneous boost+lane; pointer cancel (drag finger off button); app switch → pause; orientation change; controls never cover the hazard lane ahead.
3. File each failure as `P2.5a/b/...` (≤ size M each), fix, retest.
4. Record G2 decision in PROGRESS.

**Accept:**
- [ ] ≥ 1 iOS and ≥ 1 Android reference device pass all checklist items, or gaps are explicitly recorded (PRD §18: "record gaps rather than claiming untested support").
- [ ] X in-app browser smoke result recorded.

**Verify:** completed `device-matrix.md`.
**Out:** Final performance budget (P5.5).

