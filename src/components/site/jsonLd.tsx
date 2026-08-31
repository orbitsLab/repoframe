import {
  githubUrl,
  orbitsLabUrl,
  siteDescription,
  siteName,
  siteUrl,
  socialLinks,
} from '@/lib/site';

type JsonLdProps = {
  /** Schema.org node, or list of nodes, to publish. */
  data: object;
};

/**
 * Prints a Schema.org node as a linked-data script.
 *
 * The payload is serialised rather than interpolated, so a value carrying a
 * closing tag cannot break out of the script element.
 */
function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: linked data has to be printed as script content.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

/**
 * Describes the publisher, the site and the application as one linked graph, so
 * search engines resolve them to a single entity rather than three pages.
 */
const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'Orbits Lab',
      url: orbitsLabUrl,
      logo: `${siteUrl}/android-chrome-512x512.png`,
      sameAs: [githubUrl, ...socialLinks.map((link) => link.href)],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      publisher: { '@id': organizationId },
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires a browser with canvas support',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
      publisher: { '@id': organizationId },
      featureList: [
        'GitHub repository social card generator',
        '26 card templates',
        'Aspect ratios 1:1, 4:5, 16:9 and 9:16',
        'PNG, WebP and JPEG export up to 4x scale',
        'Runs entirely in the browser with no account',
      ],
    },
  ],
};

/**
 * Builds a breadcrumb trail for a template page, the one rich result these
 * pages are eligible for.
 *
 * @param name - Template name shown as the final crumb.
 * @param slug - Template identifier used in the URL.
 */
function templateBreadcrumb(name: string, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Templates',
        item: `${siteUrl}/templates`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: `${siteUrl}/templates/${slug}`,
      },
    ],
  };
}

export { JsonLd, siteGraph, templateBreadcrumb };
