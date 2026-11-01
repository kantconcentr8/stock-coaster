# Deployment handoff - Vercel

Owner chose Vercel and will configure the account/project and deploy from GitHub.
No Vercel account, paid plan, production deployment or public release was created by the agent.

## Build and preview

Import `https://github.com/kantconcentr8/stock-coaster` using Vercel's Git integration.
Use Vite, `npm ci`, `npm run build:vercel`, output `dist`, production branch `main`.
Pull requests/branches produce previews according to the project's Git settings.
`build-vercel.ts` validates content, typechecks, builds and enforces the 3 MB compressed budget.
Preview environment permits the draft and uses `https://$VERCEL_URL` for metadata.
Unlike local test-preview, Vercel previews compile out diagnostic analytics and accelerated simulation.

SITE_URL is optional: production uses VERCEL_PROJECT_PRODUCTION_URL then VERCEL_URL; previews use VERCEL_URL.
An explicit SITE_URL must be HTTPS. Strict production builds require approved content and zero TODOs.
For draft review on the default Vercel domain, explicitly set ALLOW_UNAPPROVED=1 in Production and redeploy.
This permits review only; editorial approval stays false, draft labels remain, and robots metadata is noindex/nofollow.
Remove the override before public launch.
Configure deployment protection/approval controls in the Vercel project before enabling public release.
The repository CI verifies code, a preview build, and browser tests; CI success is not launch approval.

## Verify before release

1. Open the preview on iOS Safari, Android Chrome, desktop, and the X in-app browser.
2. Complete a run, pause/resume, retry, share and open the briefing without playing.
3. Test the CTA on a nonproduction destination and verify approved attribution.
4. Inspect response headers with `curl -I https://<preview-host>/` and a hashed asset URL.
   Expect CSP, Referrer-Policy, nosniff, Permissions-Policy, revalidated HTML and immutable hashed assets.
5. Validate social metadata against the public preview URL using a card debugger.
6. Conduct five first-time phone sessions; resolve recurring misunderstandings.
7. Record editorial approval, acceptance gaps and owner launch sign-off before production.

## Rollback

Record the last approved production deployment URL and commit before release.
Use the Vercel deployment menu's Instant Rollback to select the previous known-good production deployment.
Alternatively, use the authenticated CLI `vercel rollback <deployment-url>` where supported by the team plan.
Verify the restored campaign URL, asset load, CTA and headers after rollback.
Keep a Git release tag and build artifact so a known-good commit can be rebuilt if retention removes it.
Rollback rehearsal remains pending an actual deployment; no successful rehearsal is claimed.

## Account and cost

No account credentials or billing configuration were accessed. Owner must confirm eligibility and budget.
Vercel Hobby is restricted to personal noncommercial use; this waitlist acquisition campaign may require
an eligible existing team/plan. No paid tier or overage was enabled by this work.

Official references, checked 2026-10-31:
- [Vercel configuration and headers](https://vercel.com/docs/project-configuration/vercel-json)
- [Git deployments](https://vercel.com/docs/deployments/git)
- [Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Hobby plan](https://vercel.com/docs/plans/hobby)
- [Fair use](https://vercel.com/docs/limits/fair-use-guidelines)

## Live draft verification (2026-10-31)

Owner deployed https://stock-coaster-seven.vercel.app/.
Automated checks confirmed HTTP 200, Brotli, CSP, Referrer-Policy, nosniff, Permissions-Policy,
revalidated HTML, immutable hashed assets, correct canonical/OG image URLs, noindex draft metadata,
and working full runs/attributed CTA on Chromium and WebKit emulation. See qa/p5-live/report.json.
Actual Vercel rollback rehearsal remains pending owner execution/account access; it is not claimed complete.
