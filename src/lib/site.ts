/** Public source repository URL used by site navigation. */
const githubUrl = 'https://github.com/orbitsLab/repoframe';
const localSiteUrl = 'http://localhost:3000';
/** Canonical production URL with a local development fallback. */
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : localSiteUrl;

export { githubUrl, siteUrl };
