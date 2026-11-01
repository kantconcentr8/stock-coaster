# Candlestick Coaster

A TypeScript/Phaser arcade briefing: a 60-second run, accessible text briefing,
versioned local bests, sharing and an attributed waitlist link. Production analytics are disabled.

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

Preview deployments automatically permit draft content and use the deployment URL for social metadata.
For production, set `SITE_URL` to the final HTTPS URL and finish editorial approval in the briefing JSON.
Production builds intentionally fail while `TODO(owner)` text or unapproved content remains,
even if `ALLOW_UNAPPROVED` is set. Use a preview deployment to review the current draft.
The Vercel build command expects Vercel's standard `VERCEL_ENV` and `VERCEL_URL` system variables.

Security/cache headers are in `vercel.json`. No analytics provider, paid service, server,
API token or database is required by the game. Hosting/account eligibility and billing are managed by the owner.
See [deployment details](docs/DEPLOY.md), [progress](docs/PROGRESS.md), and the
[implementation plan](docs/implementation-plan/README.md).
