# Phase 6 - Passenger pilot evaluation (revised November 1, 2026)

Goal: evaluate the passenger pilot honestly, prove the second-recap workflow, and record an iterate / expand / stop decision.
Depends on: Gate 5 for the selected passenger release. Phase 6 has not started.
Exit (G6): owner decision recorded with actual observations, sample sizes and uncertainty.

The original analytics-export/report-script task is retired because analytics is disabled by owner decision D5. Scores, hazards, lane changes, boost usage and gameplay retry thresholds are not passenger evaluation criteria. No analytics integration is authorized by this plan.

## P6.1 - Observed pilot evidence

Use the five first-time phone sessions from Phase 5 and any additional explicitly observed sessions. Record anonymous participant ID, device/browser, whether they started without help, completed, replayed voluntarily, understood the briefing, distinguished hypothetical outcomes from observed data, and understood the next action.

- Report counts and denominators, e.g. 4 of 5 observed viewers, not a site-wide conversion rate.
- Preserve the viewer's comprehension answer and note any coaching or missing observations.
- Identify recurring issues, observed at least twice, without treating a small convenience sample as representative.
- CTA completion, acquisition and campaign-cost claims require separately supplied owner records. If unavailable, mark them unresolved.
- Produce a short markdown evidence report; no provider CSV export, tracking IDs, cookies or reporting code is required.

Accept: every claim traces to a recorded observation; automated browser runs are excluded from participant counts.

## P6.2 - Timed second-recap dry run

Write a concise authoring guide covering the briefing fields, source/classification rules, coverage cutoff, after-close snapshot command, candle limitations, passenger chapter timing, preview, editorial approval, deploy, share-link verification and dated old links.

An owner or developer following only the guide prepares a second recap from supplied research. Record actual time per step, including snapshot import and review, keeping research time separate. The original under-30-minute preparation target is a hypothesis to measure, not a promise.

Accept:

- A second dated recap and matching snapshot load at `?prototype=coaster&b=<second-id>` (or the promoted passenger route) without code changes.
- Timing and friction are recorded, with no invented facts or editorial approval.
- Publishing follows the existing approval/content rules. No authoring CMS is required.

Preparing the guide or test fixtures before G5 does not constitute completion of this pilot experiment.

## P6.3 - Pilot decision (Gate 6)

Combine the observed comprehension/engagement evidence, second-recap effort and any owner-supplied campaign outcomes. Record what is supported, unresolved or contradicted, including device issues, sample limitations and missing data.

Recommend one: iterate (at most three changes), expand (with scope/cost notes), or stop. Record the owner's actual decision. Without downstream acquisition/cost evidence, do not claim an acquisition hypothesis passed.

Accept: evidence-backed report, explicit uncertainty, owner G6 decision. Out: implementing expansion features or silently re-enabling analytics.
