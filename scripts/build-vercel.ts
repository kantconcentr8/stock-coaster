import { execFileSync } from 'node:child_process';
import { vercelBuildEnv } from './vercel-env';
const env = vercelBuildEnv(process.env);
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
