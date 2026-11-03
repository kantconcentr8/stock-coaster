# Candlestick Coaster

A TypeScript/Phaser arcade briefing: a 60-second run, accessible text briefing,
versioned local bests, sharing and an attributed waitlist link. Production analytics are disabled.

The current passenger pilot is **The Daily Ride**, a 28-second October 30 recap at
`/` (dated link: `/?b=2026-10-31-lower-value`), with owner-approved research and saved
session candles. The original game remains at `/?experience=game`; earlier
`?prototype=coaster` links continue working. The separate longer experience,
**The Market Expedition**, is [outlined here](docs/implementation-plan/market-expedition.md)
for prototyping after real-phone observations; it is not yet playable.

Separate November 2 intraday review: `/intraday.html?symbol=ES` or
`/intraday.html?symbol=AAPL`. Both use saved 15-minute bars and 54-second data-shaped
rides. [Data, research corrections and import workflow](docs/intraday-prototype.md).

## Local development

Requires Node.js 22 and npm.

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium webkit
npm run test:e2e
```

For a local draft preview in PowerShell:

```powershell
$env:ALLOW_UNAPPROVED='1'
npm run build
npm run preview
```

The override allows review of existing draft content; it does not grant editorial approval.
`?analytics=debug&testSpeed=8` is available only in dev or explicit test-preview builds.
Ordinary builds contain neither diagnostic analytics collection nor accelerated gameplay.

## Vercel setup

Import this GitHub repository into your Vercel project. Framework: Vite.
Install command: `npm ci`. Build command: `npm run build:vercel`. Output: `dist`.
Use `main` as the production branch. Do not set `VITE_*` variables containing secrets.

Vercel's project/deployment URL is used automatically for social metadata; `SITE_URL` is an optional HTTPS override.
Preview deployments permit draft content. Production builds require approved content by default.
To review the existing draft on the default Vercel domain, set `ALLOW_UNAPPROVED=1` in the
Vercel project's Production environment and redeploy. This review override leaves the draft
label and approval metadata intact; unapproved builds include `noindex, nofollow` metadata.
Remove the override and complete editorial approval before public launch.

Security/cache headers are in `vercel.json`. No analytics provider, paid service, server,
API token or database is required by the game. Hosting/account eligibility and billing are managed by the owner.
See [deployment details](docs/DEPLOY.md), [progress](docs/PROGRESS.md), and the
[implementation plan](docs/implementation-plan/README.md).
