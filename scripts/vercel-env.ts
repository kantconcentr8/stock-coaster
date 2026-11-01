/** Resolve public metadata URLs from Vercel system variables; explicit overrides remain authoritative. */
export function vercelBuildEnv(input: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (!input.VERCEL_ENV) throw new Error('Use this build command only on Vercel');
  const env = { ...input };
  const production = env.VERCEL_ENV === 'production';
  const host = production ? env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL : env.VERCEL_URL;
  const candidate = env.SITE_URL || (host ? `https://${host}` : undefined);
  if (!candidate)
    throw new Error('Missing Vercel deployment URL; set SITE_URL to the HTTPS site URL');
  const url = new URL(candidate);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error('SITE_URL must be an HTTPS URL without credentials');
  url.search = '';
  url.hash = '';
  env.SITE_URL = url.href;
  if (!production) env.ALLOW_UNAPPROVED = '1';
  // A deliberate ALLOW_UNAPPROVED=1 also permits review on the default Vercel domain.
  // It never changes editorial approval metadata; strict validation is still the default.
  return env;
}
