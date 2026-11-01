# Phase 6 — Evaluation (PRD Milestone 6)

**Goal:** Measure the pilot honestly, prove the second-briefing workflow, and record an iterate / expand / stop decision.
**PRD refs:** §4 hypotheses, §12 publishing workflow, §14 definitions + thresholds, §19 M6, §20, §21, §24.
**Exit (Gate G6):** Decision recorded with sample sizes and uncertainty stated.
**Phase budget:** 3 tasks · ~400 LOC + docs.
**Blocking owner decision:** D7 (campaign baseline + acceptable acquisition cost) for P6.3.

---

### P6.1 — Funnel metrics report script  [Size M]

**Goal:** Compute PRD §14 rates from exported analytics data so reporting is repeatable rather than manual.
**PRD:** §14 "Definitions" and "Provisional pilot thresholds" · **Depends on:** G5 (pilot live)
**Read:** PRD §14 Definitions + thresholds; `src/services/analytics/contract.ts` (event names/properties).
**Touch:** `+scripts/report.ts`, `+tests/scripts/report.test.ts`, `+tests/fixtures/events-sample.csv`, `+docs/reports/TEMPLATE.md`

**Steps:**
1. Input: CSV/JSON export from the chosen provider (adapter function per format; one format is enough for MVP).
2. Compute per briefing + per `utm_source`: valid landing sessions, start rate, completion rate, retry rate, CTA rate (of landings and of completers), learning-question correct rate (with response count), median runs per session.
3. Output a markdown table with **sample sizes** next to every rate and a note when starting sessions < 100 ("directional only").
4. `TEMPLATE.md`: sections for funnel table, qualified acquisitions (owner-supplied downstream count), cost (cash vs. owner hours, separately), qualitative notes, threats to validity (traffic source mix).

**Accept:**
- [ ] Tests on the fixture verify each rate's numerator/denominator exactly per PRD definitions.
- [ ] Report flags small samples automatically.

**Verify:** `npm test -- report && npx tsx scripts/report.ts tests/fixtures/events-sample.csv`
**Out:** Dashboards.

---

### P6.2 — Second-briefing dry run and authoring guide  [Size M]

**Goal:** Document the content workflow and time how long a second briefing takes (target < 30 min after research exists — measured, not promised).
**PRD:** §4 hypothesis 5, §5 owner stories, §12 publishing workflow, §24 ("owner can publish a second briefing") · **Depends on:** G5
**Read:** PRD §12; `src/content/schema.ts` (field list); the first briefing JSON; `docs/DEPLOY.md`.
**Touch:** `+docs/AUTHORING.md`, `+src/content/briefings/<second-id>.json`, `~docs/PROGRESS.md`

**Steps:**
1. `AUTHORING.md` (≤ 200 lines): field-by-field guide with limits, classification rules, integrity checklist (PRD §11), how to reuse `course-01` or bump a course version, preview → approval → publish → URL test steps, and how to keep old links dated.
2. Owner (or developer following only `AUTHORING.md`) prepares a second briefing from existing research using a stopwatch; record time per step.
3. Validate, preview-deploy, owner approval; publish only if the owner wants it live.
4. Note friction points → candidate improvements (not implemented here).

**Accept:**
- [ ] Second briefing validates and loads via `?b=<second-id>` with no code changes.
- [ ] Prep time recorded per step in PROGRESS.

**Verify:** `npm run validate`; open preview with the new ID.
**Out:** Authoring UI/CMS (post-MVP).

---

### P6.3 — Pilot report and decision (Gate 6)  [Size S]

**Goal:** Compare pilot results to thresholds and the owner's baseline; decide iterate, expand, or stop.
**PRD:** §4, §14 thresholds and caveats, §19 M6, §21, §23 · **Depends on:** P6.1, P6.2, owner decision D7
**Read:** `docs/reports/TEMPLATE.md`, latest `scripts/report.ts` output, `docs/qa/usability-sessions.md` summary, PRD §14 thresholds, §23.
**Touch:** `+docs/reports/pilot-<date>.md`, `~docs/PROGRESS.md`

**Steps:**
1. Fill the report: funnel vs. thresholds (70 % completion, 20 % retry, 5 % CTA among completers), qualified acquisitions and cost vs. baseline, comprehension evidence, operating effort (second-briefing time), hypotheses table status (supported / unresolved / rejected).
2. State sample sizes and confounders; if reach is insufficient, mark acquisition hypothesis **unresolved** (PRD §14).
3. Recommend one: iterate (list ≤ 3 changes), expand (pick from PRD §23 candidates with cost notes), or stop.
4. Record owner decision as G6.

**Accept:**
- [ ] Report contains no claim unsupported by recorded data.
- [ ] G6 decision recorded.

**Verify:** owner review of the report.
**Out:** Implementing post-MVP features.

