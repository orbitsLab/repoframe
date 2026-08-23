import { SiteFooter } from '@/components/site/siteFooter';
import { SiteHeader } from '@/components/site/siteHeader';

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
