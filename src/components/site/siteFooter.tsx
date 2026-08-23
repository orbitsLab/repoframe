import Link from 'next/link';

import { Logo } from '@/components/logo';
import { githubUrl } from '@/lib/site';

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <Logo className="text-foreground" />
        <p className="sm:mr-auto">Local-first and open source.</p>
        <nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
          <Link href="/templates">Templates</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/about">About</Link>
          <a href={githubUrl}>GitHub</a>
        </nav>
      </div>
    </footer>
  );
}

export { SiteFooter };
