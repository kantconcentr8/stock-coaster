# Phase 5 acceptance audit - 2026-10-31

Live draft: https://stock-coaster-seven.vercel.app/
Gate G5: OPEN. Technical verification does not constitute editorial or public-launch approval.
Analytics is disabled by owner decision D5; provider/dashboard requirements are waived.

| PRD area | Evidence | Status / remaining gap |
| --- | --- | --- |
| Entry | `p5-live/report.json`, intro screenshots; loader tests | Pass on desktop Chromium/mobile WebKit emulation; dated intro and direct text access |
| Run | Live full runs: 64.3s/69.1s including countdown/closing; runClock/pauseFlow tests | Automated pass; physical-phone check pending |
| Movement | Simulation/track/kart unit tests; fairness checker | Automated pass; owner handling review pending |
| Rails | Lane/collision unit tests | Automated pass; physical touch check pending |
| Controls | Keyboard/touch unit tests, local a11y flow | Automated pass; simultaneous touch/rotation on phone pending |
| Boost/brake | Boost tests; brake-zone fairness check | Automated pass |
| Objects | Object tests; live runs | Automated pass; shape and symbol distinctions retained |
| Fairness | `npm run fairness`, course timeline | Reachable route and preview checks pass; sustained braking can lag editorial terrain (existing documented gap) |
| Briefing | Three chapter scheduler tests; live text access | Technical pass; thesis/source/editorial approval pending |
| Integrity | Content/schema validator; draft labels and noindex | OPEN: no approved research links or final dates/scenario sign-off recorded; TODOs remain |
| Results | Live results screenshots, local funnel/share tests | Pass: score, local best, retry, sharing fallbacks, CTA |
| Restart | Simulation reset and two-run funnel tests | Automated pass |
| Persistence | Storage/versioning tests; local blocked-storage run | Automated pass |
| Attribution | Live intercepted outbound URL, attribution unit tests | Pass; source/campaign retained and email excluded; signup not submitted |
| Analytics | No session ID on live ordinary entry; local event-contract tests | Disabled per owner; no remote analytics |
| Accessibility | Local zero-violation axe scans after landmark fix; contrast.json; Lighthouse 100 | Automated pass; VoiceOver/NVDA and physical reduced-motion check pending |
| Mobile | WebKit iPhone 13 emulation screenshots and full run | Emulated pass; actual Safari/Android/X in-app browser/FPS pending |
| Failure | Graphics/storage/audio/clipboard/transport/runtime tests | Automated pass; no blank page in tested paths |
| Publishing | Live 200 + HTTPS/Brotli/security/cache headers; DEPLOY.md | Partial: live deployed draft, rollback rehearsal and owner launch approval pending |

## Evidence and limits

`p5-live/report.json`: live browser/headers/CTA checks on the deployed build before the final landmark/contrast fixes.
It records a moderate landmark warning; local axe checks after those fixes report zero violations across scanned states.
`p5-live/lighthouse.report.html` / `.json`: Lighthouse simulated mobile run (performance 79, accessibility 100).
`p5-live/start-ready.json`: direct 9 Mbps/40ms network + 4x CPU measurement; Start enabled at approximately 1.3s.
These are Windows-host browser emulations, not actual phone results. No actual phone FPS or assistive-technology result is claimed.
OG/Twitter/canonical metadata and an absolute social-image URL are present; third-party card debugger checks remain pending.

## Required owner input before final launch

1. Supply approved public research source URLs; confirm thesis, dates/cutoff, scenario, wording and rights, then record explicit editorial approval.
2. Return observations from five first-time phone users using `usability-sessions.md` and any real-device/audio/screen-reader issues.
3. Rehearse Vercel rollback (return to the known-good deployment, then restore the candidate) and record the target/result.
4. Resolve or explicitly accept any remaining gaps and approve public release. Remove ALLOW_UNAPPROVED only after content is finalized.

No final release tag or G5 sign-off is issued while these items remain open. Phase 6 has not started.
