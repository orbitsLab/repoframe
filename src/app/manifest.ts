import type { MetadataRoute } from 'next';

import { siteDescription } from '@/lib/site';

/** Web app manifest describing install metadata and launcher icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Repo Frame — GitHub social card generator',
    short_name: 'Repo Frame',
    description: siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
