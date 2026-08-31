/** Public source repository URL used by site navigation. */
const githubUrl = 'https://github.com/orbitsLab/repoframe';

/** Home of the studio that publishes Repo Frame. */
const orbitsLabUrl = 'https://orbitslab.space';

/** Product name, used wherever the site names itself. */
const siteName = 'Repo Frame';

/** One-sentence description shared by the metadata, manifest and card. */
const siteDescription =
  'Turn any public GitHub repository into a polished social card. Pick a template, tune it, export a PNG — entirely in your browser.';

const productionSiteUrl = 'https://repoframe.orbitslab.space';
const localSiteUrl = 'http://localhost:3000';

/**
 * Canonical origin every absolute URL is built from. Production builds address
 * the live host so preview deployments never publish a canonical of their own;
 * `NEXT_PUBLIC_SITE_URL` overrides both.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === 'production' ? productionSiteUrl : localSiteUrl);

/** Accounts the project publishes under, in the order the footer lists them. */
const socialLinks = [
  { label: 'X', href: 'https://x.com/orbitslab' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/orbitslab' },
  { label: 'Instagram', href: 'https://instagram.com/labs.orbits' },
] as const;

export {
  githubUrl,
  orbitsLabUrl,
  siteDescription,
  siteName,
  siteUrl,
  socialLinks,
};
