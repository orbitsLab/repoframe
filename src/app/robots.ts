import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Opens the whole site to crawlers, except the API-shaped query strings the
 * editor accepts. Preview deployments are closed entirely, so they can never
 * compete with the live host for the same pages.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The editor itself is worth indexing; its parameter combinations are the
      // same page over and over.
      disallow: ['/app?', '/dev'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
