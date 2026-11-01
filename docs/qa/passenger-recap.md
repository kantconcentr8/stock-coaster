# Passenger recap candidate - November 1, 2026

Review route: `/?prototype=coaster&b=2026-10-31-lower-value`.
Status: complete passenger flow with a November 1 daily adaptation of owner-approved research, covering October 30. Research copies are packaged under `/research/`; the original source filename mismatch is disclosed. Physical-phone acceptance, deployment and G5 remain pending. This is not a Phase 6 pilot result. Earlier evidence below describes the draft implementation; the newest validation is recorded in PROGRESS.

Validation: `npm run check` passed (108 unit tests), all 28 browser regression tests passed, and the draft production build/bundle checks passed. Six passenger checks were rerun after the final mobile card adjustment, including zero-violation intro/end axe scans on Chromium and mobile WebKit. The manual-share field is explicitly scrolled into view. No physical-phone results are claimed.

## Evidence

| Area | Check | Evidence / limit |
| --- | --- | --- |
| Dated entry | Selected briefing title and market-close date; full publication/cutoff in briefing; draft disclosure | `tests/e2e/prototype.spec.ts`, intro screenshot |
| Editorial connection | Source chapters at 0-17s, 17-24s, 24-28s; hypothetical label | `tests/prototype/recapTimeline.test.ts`, full passenger browser sequence |
| Reading | Full text, glossary, coverage, pending-source notice; opening pauses and closing restores focus without auto-resume | Passenger browser sequence; existing source dialog reused |
| Ending | Classified takeaways, hypothetical/illustrative distinction, no score | Passenger browser sequence and end screenshot |
| Sharing | Native/clipboard/manual fallback; route and briefing retained, private fields/hash removed | `tests/services/share.test.ts`, manual share in passenger browser sequence |
| CTA | Existing destination and sanitized UTM attribution | Passenger browser sequence, attribution unit tests; no signup submitted |
| Snapshot integrity | One saved-file read; Replay does not refetch; wrong-session data rejected | `tests/e2e/marketSnapshot.spec.ts`; no provider calls from browser |
| Controls | Start, pause/resume, Replay, Escape, blur, reduced motion, blocked audio | Passenger browser specs |
| Failure | Missing canvas leaves dated text, sources and CTA accessible; unknown recap visibly falls back | Passenger browser fallback test |
| Accessibility | Keyboard-accessible scrolling cards; focus restored to explicit read-button opener; automated intro/end axe scans | Chromium + mobile WebKit emulation; actual assistive technology pending |
| Regression | Original game remains available at normal URL | Existing funnel, failure and accessibility suite |
| Build | Draft build and compressed-bundle checks | Run with existing `ALLOW_UNAPPROVED=1`; strict production content gate remains intact |

Screenshot outputs are generated under `test-results/coaster-<browser>-{intro,crest,drop,end,landscape}.png`. These are browser emulations, not physical-phone evidence.

## Phone-first readability revision

Owner reports small desktop text was barely legible and expects most viewers to arrive on phones from social feeds. Phone-first is the design priority, not an analytics-derived audience measurement.

Body copy is now 18px, live captions at least 22px, supporting labels 14-16px, source-dialog text 18px and controls at least 52px tall. Text panels are opaque. The compact intro shows the coverage date and short instructions; full metadata and review notes remain in the briefing. Takeaway cards omit inline internal TODO suffixes while retaining draft labels and full review context in the briefing.

Read briefing moved into the header; three large ride controls remain at the bottom. Market data expands from a readable button into a dated/provider-attributed table, with 16px values. Sparse candle tags use 20px symbols and 16px moves instead of a dense field of tiny labels. Missing data has an explicit illustrative explanation.

Verification: 108 unit tests and 14 focused desktop/mobile browser checks passed; additional narrow-layout checks cover 320x568, 390x664 and 1440x900, readable text, usable scrolling space, non-overlapping header/data/card/controls, source text and touch targets. Screenshots are under `test-results/readability-*`. Actual social in-app browsers, device text scaling and physical-phone viewing remain pending.

## Remaining release work

1. Content preparation is complete locally: owner approved both documents and authorized adaptation. Check the deployed candidate shows The Daily Ride, October 30 coverage and both packaged source links before recruiting viewers; this task does not deploy it. No external research links were invented.
2. Observe five real first-time phone viewers with the revised usability script; verify caption reading time, comprehension, hypothetical distinction and voluntary replay.
3. Check actual Safari/Android/in-app browser performance, audio behavior, reduced motion, screen readers, rotation and app-switch resume.
4. Resolve recurring issues, promote the chosen passenger version to the main route with matching metadata/link tests, and rehearse Vercel rollback.
5. Record the existing G5 launch decision, then begin the revised Phase 6 evaluation/second-recap dry run. Analytics remains disabled.
