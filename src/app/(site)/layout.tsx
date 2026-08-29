import { SiteFooter } from '@/components/site/siteFooter';
import { SiteHeader } from '@/components/site/siteHeader';
import { SmoothScroll } from '@/components/site/smoothScroll';

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:border focus:bg-background focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
