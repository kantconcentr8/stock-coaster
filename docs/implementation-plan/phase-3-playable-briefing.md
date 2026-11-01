# Phase 3 — Playable Briefing (PRD Milestone 3)

**Goal:** Turn the game into a dated, labeled market briefing: validated content file, intro, in-run chapter captions, results debrief with takeaways and CTA, and an accessible text briefing.
**PRD refs:** §6, §7, §8, §11, §12, §13 (CTA placement), §16, §17 (Entry, Briefing, Integrity, Results), §19 M3.
**Exit (Gate G3):** Owner approves editorial accuracy, labels, dates/cutoff, hypothetical ending, and clarity.
**Phase budget:** 9 tasks · ~2,300 LOC + content.
**Can run in parallel with Phase 2.** Touches `src/content/`, `src/sim/chapters.ts`, `src/ui/screens/`, `scripts/validate-content.ts`.

**Blocking owner decisions:** D2 (CTA URL — placeholder allowed until P5.8), D3 (facts/approval — required for G3).

> **Content integrity rule for every task in this phase:** never invent market numbers, levels, or source links. Unknown values stay as clearly marked `TODO(owner)` strings and keep `approval.approved = false`.

---

### P3.1 — Briefing schema and build-time validator  [Size M]

**Goal:** A strict schema for briefing JSON with validation run at build and in tests.
**PRD:** §12 (fields + validation rules), §11 integrity, §16 (untrusted input, safe URLs) · **Depends on:** P0.2
**Read:** PRD §11 "Content integrity requirements", §12; `src/core/types.ts` (`Briefing` placeholder).
**Touch:** `+src/content/schema.ts`, `+scripts/validate-content.ts`, `~src/core/types.ts`, `+tests/content/schema.test.ts`, `+tests/fixtures/briefings/*.json`, `~package.json`

**Steps:**
1. Schema (Zod or hand-rolled; record choice + gzip size impact in PROGRESS) for every PRD §12 field, plus:
   - `chapters[]`: `{ id, startSec, endSec, caption (≤ 12 words → warning, ≤ 16 → error), classification: 'historical' | 'interpretation' | 'hypothetical', label }`.
   - `takeaways[]` (1–3), `sources[]` (`{ title, url }`), `cta { id, label, url, campaignId, destinationCategory }`, `learningQuestion?` (`{ id, prompt, answers[2–4], correctIndex, explanation }`).
   - `glossary[]` (`{ term, definition }`) for "breadth" etc. (PRD §11), `disclaimer` string.
   - `approval { approved: boolean, approvedBy?, approvedAt? }`.
2. Rules: ISO dates with explicit timezone; `coverageEnd ≤ publishedAt`; chapters within 0–60 s, non-overlapping, ordered; any chapter whose content is forward-looking must be `hypothetical` and its `label` must contain "Hypothetical"; all URLs `https:` only; `briefingId` matches `^[a-z0-9-]{3,64}$`.
3. `scripts/validate-content.ts`: validates all files in `src/content/briefings/`; in **production** builds also fails if `approval.approved !== true` unless `ALLOW_UNAPPROVED=1` (preview builds).
4. Hook into `npm run check` and `prebuild`.

**Accept:**
- [ ] Fixtures for each rejection reason (missing field, bad date, overlap, out-of-range, missing hypothetical label, `javascript:` URL) fail with readable messages.
- [ ] A valid fixture passes.
- [ ] Production build refuses unapproved content.

**Verify:** `npm test -- schema && npm run validate`
**Out:** Loading at runtime (P3.2).

---

### P3.2 — Content loader, URL briefing ID, and default fallback  [Size S]

**Goal:** Select bundled briefing by `?b=<id>`; unknown/invalid IDs fall back to the default with a visible note.
**PRD:** §8 steps 1–2, §16 (validate IDs), §17 Entry · **Depends on:** P3.1
**Read:** `src/content/schema.ts` (exports), `src/main.ts`, PRD §8.
**Touch:** `+src/content/loader.ts`, `+src/content/index.ts`, `~src/main.ts`, `+tests/content/loader.test.ts`

**Steps:**
1. `import.meta.glob('./briefings/*.json', { eager: true })` → registry keyed by `briefingId`; `defaultBriefingId` constant.
2. `loadBriefing(search: string)`: read only `b` param; validate against the ID regex; return `{ briefing, notice?: 'unknown-id' | 'invalid-id' }`.
3. Runtime re-validation (defense in depth); on failure → `app_error` code + fallback screen with text briefing link.
4. Load the referenced `courseId`/`courseVersion` course JSON the same way.

**Accept:**
- [ ] Tests: valid ID, unknown ID (default + notice), malicious ID (`<script>`, `../`) rejected safely.
- [ ] No other query params are read here (attribution is P4.2).

**Verify:** `npm test -- loader`
**Out:** Attribution parameters.

---

### P3.3 — First briefing draft content (Oct 31–Nov 1 campaign)  [Size M]

**Goal:** Draft the first briefing JSON from the campaign document, flagged unapproved, with every factual claim traceable to a source or marked for owner input.
**PRD:** §2, §11 (proposed adaptation table), §12, §13 · **Depends on:** P3.1
**Read:** PRD §11 and §12 only; the campaign file `C:\Users\sumon\Desktop\market-ta-ugc\campaign\2026-10-31-nov-1-x-campaign.md` — **first list its headings, then read only the thesis, structural-notes, and scenario sections** (keep under ~10K tokens).
**Touch:** `+src/content/briefings/2026-10-31-lower-value.json`, `+docs/content/2026-10-31-review-sheet.md`

**Steps:**
1. Fill fields: title, summary, `publishedAt`, `coverageEnd`, `displayTimezone` (named, e.g., `America/New_York`), three chapters per PRD §11 table, 3 takeaways, glossary (breadth, value area, VWAP only if used), disclaimer ("illustrative briefing and arcade game, not a trading simulation"), `shareText`, CTA placeholder (`TODO(owner)` URL fails production validation by design).
2. Chapter 3 is `hypothetical` with label "Hypothetical scenario"; pick a *proposed* ending and list alternatives for the owner.
3. `review-sheet.md`: table of every claim → source → status (`needs source` / `owner to confirm`), the proposed vs. alternative hypothetical endings, and open questions (D2, D3).
4. Keep `approval.approved = false`.

**Accept:**
- [ ] `npm run validate` passes in non-production mode.
- [ ] No numeric market level appears without a source entry; "VIX" not used unless sourced (PRD §11).
- [ ] Captions ≤ 12 words.

**Verify:** `npm run validate`; owner reads `review-sheet.md`.
**Out:** Owner approval (P3.9).

---

### P3.4 — Introduction screen (accessible HTML)  [Size M]

**Goal:** Replace the placeholder intro with the full PRD screen: brand, title, date, coverage, hook, controls, sound preference, Start, and "Read briefing."
**PRD:** §6 positioning, §7 screen 1, §8 step 3, §10 accessibility · **Depends on:** P3.2, P1.10
**Read:** `src/ui/screens/intro.ts`, `src/ui/dom.ts`, `src/content/schema.ts` (types only), PRD §7, §10 "Accessibility".
**Touch:** `~src/ui/screens/intro.ts`, `+src/ui/format.ts`, `~src/styles.css`, `+tests/ui/intro.test.ts`

**Steps:**
1. Semantic structure: `<main>`, `<h1>` title, dated subtitle "Published {date} · Covers through {coverageEnd} {tz}" via `Intl.DateTimeFormat` with the named timezone (`format.ts`).
2. Controls summary adapts to pointer type (keys vs. buttons), three actions max.
3. Sound toggle (persists later in P4.1), large **Start** (autofocus), secondary "Read the briefing" link opening P3.7 panel without playing.
4. Unknown-ID notice banner when `notice` present; in-app browser hint slot (P2.4).
5. All text via `textContent`.

**Accept:**
- [ ] Test: renders dates in the named timezone; no `innerHTML` with content strings (grep test).
- [ ] Keyboard: Tab order logical, focus visible, Enter on Start begins countdown.

**Verify:** `npm test -- intro`; manual keyboard walk-through.
**Out:** Brand art (P5.2).

---

### P3.5 — Chapter scheduler and in-run captions  [Size M]

**Goal:** Show each chapter's caption and classification label based on **active run time**, placed away from immediate hazard decisions.
**PRD:** §9.5 (chapter timing = run clock), §11 (≤ 12 words, away from hazards, labels), §14 `chapter_seen` · **Depends on:** P3.2, P1.9
**Read:** `src/core/types.ts`, `src/content/schema.ts` (chapter type), `src/core/events.ts` (exports), `src/ui/hud.ts`.
**Touch:** `+src/sim/chapters.ts`, `+src/ui/captions.ts`, `~src/app.ts`, `+tests/sim/chapters.test.ts`

**Steps:**
1. `chapters.ts` (pure): `createChapterScheduler(chapters)` → `update(activeTime)` returns current chapter and emits `chapterSeen` once per chapter per run; `reset()`.
2. `captions.ts`: caption band in the HUD region (not over the track ahead); shows label chip ("Recap" / "Interpretation" / "Hypothetical scenario") with icon + text, caption fades in/out (no motion under reduced motion). `aria-live="polite"` so screen readers announce once.
3. Hypothetical chapter keeps its label visible for the full chapter duration.

**Accept:**
- [ ] Tests: `chapterSeen` fires once per chapter; pause/resume doesn't re-fire; restart re-arms.
- [ ] Tests: chapter boundaries follow active time, not distance.
- [ ] Manual: captions never overlap the track region on 360×640.

**Verify:** `npm test -- chapters`; manual.
**Out:** Editorial course shaping (P3.8).

---

### P3.6 — Results and debrief screen  [Size M]

**Goal:** Full results: closing transition, score breakdown, local best slot, three takeaway cards with labels, optional learning question, primary CTA, Retry, Share slot.
**PRD:** §7 screen 4, §8 steps 6–8, §9.5, §11, §13 (CTA after takeaways), §17 Results/Integrity · **Depends on:** P3.5
**Read:** `src/ui/screens/results.ts`, `src/ui/dom.ts`, `src/sim/scoring.ts` (exports), `src/content/schema.ts` (types), PRD §7, §13.
**Touch:** `~src/ui/screens/results.ts`, `+src/ui/screens/learningQuestion.ts`, `~src/styles.css`, `+tests/ui/results.test.ts`

**Steps:**
1. Closing transition: "Closing bell" overlay ≤ 1.5 s (static under reduced motion), then results.
2. Order: score breakdown (distance points + pickup points; label "Arcade score" — never currency) → takeaways (cards with classification chips) → learning question (optional, never blocks; shows explanation after answer; no free text) → CTA button (`<a>` with `rel="noopener"`, label from content) → Retry (prominent) → Share slot (wired in P4.3) → "Read full briefing" link.
3. Local-best placeholder element (filled in P4.1).
4. Emit `learningAnswer` event (`questionId`, `correct`).

**Accept:**
- [ ] Test: no `$`, "P&L", "return", "portfolio" in rendered results text.
- [ ] Test: CTA appears after takeaways in DOM order; question can be skipped.
- [ ] Keyboard: Retry, CTA, and question answers reachable with visible focus.

**Verify:** `npm test -- results`; manual.
**Out:** Attribution on the CTA URL (P4.2), share (P4.3), best score (P4.1).

---

### P3.7 — Text briefing details panel  [Size S]

**Goal:** Accessible text version: context, chapter-by-chapter summary with labels, glossary, sources, cutoff, disclaimer, CTA — reachable from intro and results without playing.
**PRD:** §7 screen 5, §10 ("Read briefing" without completing), §11, §13 · **Depends on:** P3.4
**Read:** `src/ui/dom.ts`, `src/content/schema.ts` (types), PRD §7 screen 5, §11 integrity list.
**Touch:** `+src/ui/screens/briefing.ts`, `~src/styles.css`, `+tests/ui/briefing.test.ts`

**Steps:**
1. Render as a dialog/sheet (`<dialog>` with fallback) or route section; headings `h2/h3`; close returns focus to the opener.
2. Sections: Summary · What the course shows (each chapter + label) · Key terms · Sources (external links `rel="noopener noreferrer"`, https only) · Coverage & publication · Disclaimer · CTA.
3. Emit `briefingRead { entryScreen }` on open.

**Accept:**
- [ ] Test: opening from intro does not start a run; focus restored on close.
- [ ] Test: all source links are https and open safely.

**Verify:** `npm test -- briefing`
**Out:** Styling polish (P5.2).

---

### P3.8 — Editorial course geometry alignment  [Size M]

**Goal:** Shape `course-01` terrain to the three chapters (descent → recovery bounce → hypothetical ending) by **run time at typical speed**, while staying fair.
**PRD:** §11 adaptation table (geometry is illustrative, not a chart), §9.4, §9.5 · **Depends on:** P3.5, P1.11
**Read:** `src/content/courses/course-01.json`, `src/content/briefings/2026-10-31-lower-value.json` (chapters only), `scripts/check-fairness.ts` (usage only), PRD §11.
**Touch:** `~src/content/courses/course-01.json`, `+scripts/course-timeline.ts`, `~docs/PROGRESS.md`

**Steps:**
1. `course-timeline.ts`: simulate `idle`, `boost-all`, `brake-all` scripts and print `s` reached at t = 20/40/60 s, so terrain sections can align with chapter windows across play styles.
2. Reshape: section 1 "repeated lower value" = stepped descents with small failed rebounds; section 2 = a bounce that does **not** regain the earlier high; section 3 = chosen hypothetical ending shape. Add terrain margin so fast players don't outrun section 3 visuals.
3. Keep hazards out of the 1–2 s window when each caption appears (add `captionQuietZone` check to `check-fairness`, using the idle-speed timeline).
4. Bump `courseVersion` if previously published (not yet — record).

**Accept:**
- [ ] `npm run fairness` passes, including caption quiet zones.
- [ ] Timeline output recorded in PROGRESS shows each section visible during its chapter for idle and boost-all scripts.
- [ ] No numeric price levels are encoded or displayed from geometry.

**Verify:** `npm run fairness && npx tsx scripts/course-timeline.ts`
**Out:** Art pass (P5.2).

---

### P3.9 — Editorial review and Gate 3  [Size S]

**Goal:** Owner reviews the complete briefing on phone and desktop; approved content is locked.
**PRD:** §11 integrity, §12 publishing workflow steps 4–5, §18 last bullet, §19 M3 · **Depends on:** P3.3–P3.8, owner decision D3
**Read:** `docs/content/2026-10-31-review-sheet.md`, the briefing JSON.
**Touch:** `~src/content/briefings/2026-10-31-lower-value.json`, `~docs/content/2026-10-31-review-sheet.md`, `~docs/PROGRESS.md`

**Steps:**
1. Produce a preview build with `ALLOW_UNAPPROVED=1`; owner plays on phone + desktop and reads the text briefing.
2. Walk the review sheet: every claim sourced/confirmed, date + cutoff + timezone correct, hypothetical ending chosen and labeled, disclaimer present, CTA intent confirmed (URL may remain placeholder until P5.8).
3. Apply edits (content only — no code changes in this task; code issues become `P3.9a/b`).
4. Set `approval = { approved: true, approvedBy, approvedAt }` only on explicit owner sign-off; record in PROGRESS.

**Accept:**
- [ ] Review sheet has no open `needs source` items.
- [ ] G3 sign-off recorded (or required fixes listed).

**Verify:** `npm run validate` in production mode (`NODE_ENV=production`) passes except for any deliberately deferred CTA URL.
**Out:** Second briefing (P6.2).

