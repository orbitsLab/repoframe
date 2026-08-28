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

import { siteUrl } from '@/lib/site';
import { themeScript } from '@/lib/theme';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Repo Frame — GitHub social card generator',
    template: '%s — Repo Frame',
  },
  description: 'Generate polished social cards for GitHub repositories.',
  openGraph: {
    title: 'Repo Frame — GitHub social card generator',
    description: 'Generate polished social cards for GitHub repositories.',
    type: 'website',
    siteName: 'Repo Frame',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      {/* Extensions such as Grammarly stamp attributes onto the body before
          React hydrates, which React reports as a mismatch. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
