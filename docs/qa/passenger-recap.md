# Passenger recap candidate - November 1, 2026

Review route: `/?prototype=coaster&b=2026-10-31-lower-value`.
Status: locally verified complete draft flow. This is not G5 approval or a Phase 6 pilot result.

Validation: `npm run check` passed (108 unit tests), all 28 browser regression tests passed, and the draft production build/bundle checks passed. Six passenger checks were rerun after the final mobile card adjustment, including zero-violation intro/end axe scans on Chromium and mobile WebKit. The manual-share field is explicitly scrolled into view. No physical-phone results are claimed.

## Evidence

| Area | Check | Evidence / limit |
| --- | --- | --- |
| Dated entry | Selected briefing title, publication and coverage cutoff; draft disclosure | `tests/e2e/prototype.spec.ts`, intro screenshot |
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

## Remaining release work

1. Owner supplies/approves public research, confirms thesis/cutoff/scenarios/wording and finalizes editorial approval. The source JSON remains unchanged and unapproved; no research links were invented.
2. Observe five real first-time phone viewers with the revised usability script; verify caption reading time, comprehension, hypothetical distinction and voluntary replay.
3. Check actual Safari/Android/in-app browser performance, audio behavior, reduced motion, screen readers, rotation and app-switch resume.
4. Resolve recurring issues, promote the chosen passenger version to the main route with matching metadata/link tests, and rehearse Vercel rollback.
5. Record the existing G5 launch decision, then begin the revised Phase 6 evaluation/second-recap dry run. Analytics remains disabled.
