import type { Metadata } from 'next';
import Script from 'next/script';

import { themeScript } from '@/lib/theme';

import './globals.css';

export const metadata: Metadata = {
  title: 'RepoFrame',
  description: 'Generate polished social cards for GitHub repositories.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
