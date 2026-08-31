import type { Metadata } from 'next';
import Script from 'next/script';

import '@fontsource-variable/archivo';
import '@fontsource-variable/azeret-mono';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/fira-code';
import '@fontsource-variable/inconsolata';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/manrope';
import '@fontsource-variable/outfit';
import '@fontsource-variable/roboto-mono';
import '@fontsource-variable/sora';
import '@fontsource-variable/source-code-pro';
import '@fontsource-variable/space-grotesk';

import { JsonLd, siteGraph } from '@/components/site/jsonLd';
import { siteDescription, siteName, siteUrl } from '@/lib/site';
import { themeScript } from '@/lib/theme';

import './globals.css';

const title = 'Repo Frame — GitHub social card generator';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s — Repo Frame',
  },
  description: siteDescription,
  applicationName: siteName,
  creator: 'Orbits Lab',
  publisher: 'Orbits Lab',
  category: 'technology',
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description: siteDescription,
    type: 'website',
    siteName,
    url: siteUrl,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: siteDescription,
    site: '@orbitslab',
    creator: '@orbitslab',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <JsonLd data={siteGraph} />
      </head>
      {/* Extensions such as Grammarly stamp attributes onto the body before
          React hydrates, which React reports as a mismatch. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
