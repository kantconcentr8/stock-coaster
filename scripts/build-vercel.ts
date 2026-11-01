import { execFileSync } from 'node:child_process';
const production = process.env.VERCEL_ENV === 'production';
if (!process.env.VERCEL_ENV) throw new Error('Use this build command only on Vercel');
const env = { ...process.env };
if (production) {
  delete env.ALLOW_UNAPPROVED;
  if (!env.SITE_URL?.startsWith('https://')) throw new Error('Production requires HTTPS SITE_URL');
} else {
  env.ALLOW_UNAPPROVED = '1';
  env.SITE_URL = `https://${env.VERCEL_URL}`;
}
// Preview has draft content, but no debug analytics or test-speed hooks.
execFileSync(
  process.execPath,
  ['node_modules/tsx/dist/cli.mjs', 'scripts/validate-content.ts', '--production'],
  { env, stdio: 'inherit' },
);
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], {
  env,
  stdio: 'inherit',
});
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
  env,
  stdio: 'inherit',
});
execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/check-bundle.ts'], {
  env,
  stdio: 'inherit',
});
