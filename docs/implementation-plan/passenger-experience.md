# Passenger experience revision - November 1, 2026

This is the current product overlay on plan v1.0 and the original game PRD. The owner chose "experience the market" and approved building a complete passenger recap. Prior implementation evidence remains historical; old gameplay requirements do not define the passenger release.

## Product contract

- The viewer is a passenger. The train follows an authored climb, crest hesitation, plunge and recovery.
- Keep Start, Pause/Resume and Replay. No brake, boost, momentum meter, lane selection, pickups, hazards, predictions, scores or local bests in the passenger experience.
- Use original train/passenger/camera/audio choreography and the navy/orange/cream direction. This remains procedural Canvas 2D art.
- Each recap has a dated introduction, timed editorial captions with classifications, full text and source access, and an ending with takeaways, Share, Replay and the existing attributed CTA.
- Saved daily OHLC candles provide market context. Fetch once when preparing the recap after close; playback/builds make no provider calls. Candles are individually scaled. The track is illustrative and is not derived from those bars.
- Editorial interpretation, factual market candles and hypothetical outlooks remain distinct. Existing draft labels, TODOs and approval metadata remain until explicitly finalized. Do not invent research sources.
- Analytics remains disabled by owner decision. Do not add analytics or use fabricated funnel statistics to evaluate this version.
- Design primarily for phone/social viewers, per owner direction. Use 18px body text, captions at least 22px, readable supporting labels and large touch controls; do not shrink the phone layout back to dashboard-sized type. Full metadata belongs in readable disclosures, not tiny overlays.

## Where the project stands

Phases 0-4 and much of Phase 5 were implemented for the original game. The passenger renderer, automatic 28-second ride and saved ten-symbol market snapshot are implemented. A complete draft passenger recap is now the candidate under development/QA. G5 remains open; Phase 6 has not started.

Owner explicitly approved passenger root promotion on November 1. The Daily Ride is now the default at `/`, with `?b=<briefingId>` for a dated recap. The original game is preserved at `/?experience=game`. Existing `?prototype=coaster` links remain compatible. Sharing preserves only allowlisted experience selection and attribution, removing unrelated/private query parameters.

## P5.R1 - Plan and product transition

Deliver: this revision, updated plan index, revised Phase 6 tasks, and passenger-specific acceptance evidence.
Accept: retired gameplay requirements are not carried forward; no analytics; no G5/G6 completion inferred.
Status: implemented in this revision.

## P5.R2 - One complete passenger recap

Deliver: selected briefing loader, dated intro, timed chapters, readable full briefing/source dialog, draft labels, takeaways, Replay, route-preserving Share and safe CTA attribution.
Accept:

- Start requires a user gesture; Pause/Resume, modal pause, blur/visibility pause, audio failure and reduced motion remain usable.
- The existing recap's first chapter establishes context through the plunge (0-17s), second chapter covers the bounce (17-24s), and final conditional outlook is labeled hypothetical (24-28s). Source chapter timestamps and market coverage dates are not rewritten.
- Replay resets time/captions/camera without refetching the snapshot. Completion contains no score or forecast presented as observed fact.
- Full text/sources work before, during and after the ride, including when canvas is unavailable.
- Native share, clipboard and manual fallback retain recap and candidate route while stripping private inputs. CTA preserves only sanitized attribution.
- Keyboard, automated accessibility and desktop/mobile emulation checks pass, with physical-device evidence recorded separately.

Status: implemented and locally verified. Owner-approved research supports the October 30 edition, with explicit session context and a conditional ending. Public Charts & context contains four owner-supplied screenshots; original notes are archived outside public assets. The ES lower advance/decline panel is correctly described as Nasdaq. See `market-expedition.md` for the separate longer-format outline. Physical-device evidence remains tracked separately.

## P5.R3 - Content and physical-device acceptance

Deliver: approved research links and wording, confirmed dates/cutoff, five real first-time phone sessions, actual Safari/Android checks, screen-reader/audio/reduced-motion observations and recurring-issue fixes.
The session script asks what the briefing meant, whether the viewer understood the passenger role and hypothetical ending, and what they would do next. Automated tests do not count as people or physical devices.
Status: owner research/content approval recorded November 1; source copies and daily adaptation are prepared. Five real first-time phone sessions and physical-device observations remain pending. Use `docs/qa/usability-sessions.md`. Source approval is not launch approval.

## P5.R4 - Release and root-route promotion

Deliver: deliberately promote the validated passenger experience to the normal URL, preserve access to the original game, update canonical/share metadata, verify the full dated/attributed campaign flow, rehearse rollback, and record existing G5 launch approval.
Root-route promotion must update browser tests and legacy entry links together. Earlier game performance/accessibility results cannot substitute for new passenger checks. Draft review deployment is not public-launch sign-off.
Status: owner launch approval and explicit instruction to promote the passenger experience recorded November 1. Root promotion implemented; verify the pushed deployment before claiming live completion. Five first-time sessions, additional device/accessibility checks and actual Vercel rollback rehearsal remain evidence gaps, not silently completed gates. Owner instructed proceeding with release after Pixel 8 Pro feedback; this does not supply the missing observations or complete Phase 6.

## Revised Phase 6

After G5, evaluate observed comprehension/engagement honestly, time a second-recap dry run including after-close snapshot preparation, and record iterate/expand/stop with uncertainty. See `phase-6-evaluation.md`.
Authoring documentation can be prepared before G5 without claiming that Phase 6 or a second-recap experiment has been completed.
