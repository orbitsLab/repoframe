import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';
import { templates } from '@/lib/templates/registry';

/** Pages worth crawling, ranked by how much of the product each one carries. */
const routes = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/app', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/templates', priority: 0.8, changeFrequency: 'weekly' },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...routes.map(({ path, priority, changeFrequency }) => ({
      url: `${siteUrl}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...templates.map((template) => ({
      url: `${siteUrl}/templates/${template.id}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
