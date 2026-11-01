import { expect, it } from 'vitest';
import { vercelBuildEnv } from '../../scripts/vercel-env';
it('uses the production project domain without requiring SITE_URL', () => {
  expect(
    vercelBuildEnv({
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'stock-coaster.vercel.app',
      VERCEL_URL: 'unique.vercel.app',
    }).SITE_URL,
  ).toBe('https://stock-coaster.vercel.app/');
});
it('falls back to deployment URL and keeps strict production validation by default', () => {
  const env = vercelBuildEnv({ VERCEL_ENV: 'production', VERCEL_URL: 'unique.vercel.app' });
  expect(env.SITE_URL).toBe('https://unique.vercel.app/');
  expect(env.ALLOW_UNAPPROVED).toBeUndefined();
});
it('honors an explicit draft review override without inventing approval', () => {
  expect(
    vercelBuildEnv({
      VERCEL_ENV: 'production',
      VERCEL_URL: 'unique.vercel.app',
      ALLOW_UNAPPROVED: '1',
    }).ALLOW_UNAPPROVED,
  ).toBe('1');
});
it('uses preview domain and allows draft preview', () => {
  const env = vercelBuildEnv({
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'preview.vercel.app',
    VERCEL_PROJECT_PRODUCTION_URL: 'public.vercel.app',
  });
  expect(env.SITE_URL).toBe('https://preview.vercel.app/');
  expect(env.ALLOW_UNAPPROVED).toBe('1');
});
it('preserves explicit HTTPS URL overrides and rejects invalid URLs', () => {
  expect(
    vercelBuildEnv({ VERCEL_ENV: 'production', SITE_URL: 'https://custom.test/game/' }).SITE_URL,
  ).toBe('https://custom.test/game/');
  for (const SITE_URL of ['http://custom.test', 'https://user:pass@custom.test', 'invalid'])
    expect(() => vercelBuildEnv({ VERCEL_ENV: 'production', SITE_URL })).toThrow();
  expect(() => vercelBuildEnv({ VERCEL_ENV: 'production' })).toThrow();
});
