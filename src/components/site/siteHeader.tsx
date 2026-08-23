import { CodeXml } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { githubUrl } from '@/lib/site';

function SiteHeader() {
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo className="mr-auto" />
        <nav
          className="hidden items-center gap-5 text-sm text-muted-foreground md:flex"
          aria-label="Primary navigation"
        >
          <Link className="hover:text-foreground" href="/templates">
            Templates
          </Link>
          <Link className="hover:text-foreground" href="/docs">
            Docs
          </Link>
          <Link className="hover:text-foreground" href="/about">
            About
          </Link>
          <a
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            href={githubUrl}
          >
            <CodeXml className="size-4" aria-hidden="true" />
            GitHub
          </a>
        </nav>
        <ThemeToggle />
        <Button asChild size="sm">
          <Link href="/app">Open editor</Link>
        </Button>
      </div>
    </header>
  );
}

export { SiteHeader };
