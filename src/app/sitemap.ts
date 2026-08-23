import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';
import { templates } from '@/lib/templates/registry';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/templates', '/docs', '/about'];
  const templatePaths = templates.map(
    (template) => `/templates/${template.id}`,
  );

  return [...paths, ...templatePaths].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));
}
