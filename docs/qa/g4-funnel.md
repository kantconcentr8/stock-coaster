# Gate 4 - Acquisition funnel verification (2026-10-31)

Scope: Phase 4 only. No hosting, deployment, promotion or Phase 5 work performed.

## Owner decision D5

Owner explicitly chose: "not using analytics - not required".
Ordinary builds do not initialize the analytics adapter or create analytics session/run IDs.
No remote analytics script, requests, cookies, consent banner, retention service, paid tier or overage billing.
Provider-dashboard and blocker checks specific to a vendor are waived by this decision.
The typed event contract is retained for local QA only: use dev server or explicit
`test-preview` build with `?analytics=debug` to inspect `window.__ccEvents`.
Debug logs and simulation acceleration are compiled out of ordinary production builds.

## Automated evidence

- `npm run check`: typecheck, lint, 94 unit tests, course fairness and content validation.
- `npm run test:e2e`: all 6 tests passed; Chromium desktop and mobile WebKit (iPhone 13 emulation).
- Funnel: entry with approved UTM fields plus `email`, complete, retry, complete,
  text briefing, manual share fallback, and an outbound CTA fulfilled by Playwright.
  The outbound popup is intercepted at browser-context level; no signup is submitted.
- Counts per two-run funnel: 1 landing, 2 run starts, 6 chapter views,
  2 completions with distinct run IDs, 1 retry, 1 briefing read, 1 manual share, 1 CTA click.
- CTA preserves source/campaign, adds `utm_content=waitlist`, excludes entry email.
  Unit tests also verify destination parameters are preserved and HTTPS required.
- Shared links contain only briefing ID and share source/method, without score, entry query or hash.
- Throwing debug transport plus aborted external requests: two runs still complete,
  retry works and attributed CTA remains available on both browser projects.
- Ordinary entry has no debug collection or analytics identity; preferences survive reload.
- Unit tests cover corrupt/throwing/quota storage, versioned bests, native share cancellation,
  clipboard rejection/manual fallback, payload allowlists and failed transports.

## Build and social metadata

Local preview build: `$env:ALLOW_UNAPPROVED='1'; npm run build`.
The override previews existing draft content; it does not change editorial approval.
Built HTML includes default briefing title, description, canonical, OG and Twitter card tags.
Placeholder `public/social/default-1200x630.png` is 1200 x 630.
`SITE_URL` defaults to `http://localhost:4173/`; set the actual public URL when hosting is selected.
Existing Phaser large-chunk warning remains assigned to Phase 5.

## Gate status and deferred external check

Developer funnel sign-off: automated local checks passed; production analytics disabled per owner.
Public X/LinkedIn card debugger verification remains pending: a publicly reachable site/domain
has not been selected or published. That check requires hosting and is deliberately deferred,
consistent with the instruction not to start Phase 5. No public-card validation is claimed.
Physical-device checks and editorial approval from earlier phases remain recorded in their existing review sheets.
