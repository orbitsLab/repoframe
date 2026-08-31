import Link from 'next/link';

import { Logo } from '@/components/logo';
import { GithubMark } from '@/components/site/platformMarks';
import { Button, bareIcon } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { githubUrl } from '@/lib/site';
import { cn } from '@/lib/utils';

/** Renders the public header with navigation, theme, and editor actions. */
function SiteHeader() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-50 h-(--header-height) border-b bg-background/85 backdrop-blur-md"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo className="mr-auto" />
        <nav
          className="hidden items-center gap-5 text-sm text-muted-foreground md:flex"
          aria-label="Primary navigation"
        >
          <Link className="hover:text-foreground" href="/templates">
            Templates
          </Link>
          <Button asChild variant="ghost" size="icon" className={cn(bareIcon)}>
            <a href={githubUrl} aria-label="Repo Frame on GitHub">
              <GithubMark />
            </a>
          </Button>
        </nav>
        <ThemeToggle variant="ghost" className={cn(bareIcon)} />
        <Button asChild size="sm">
          <Link href="/app">Open editor</Link>
        </Button>
      </div>
    </header>
  );
}

export { SiteHeader };
