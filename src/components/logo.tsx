import Link from 'next/link';

import { cn } from '@/lib/utils';

type LogoProps = {
  compact?: boolean;
  className?: string;
  href?: string;
};

/**
 * Renders the RepoFrame brand link in full or compact form.
 *
 * @param props - Display mode, destination, and optional class names.
 */
function Logo({ compact = false, className, href = '/' }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label="RepoFrame home"
    >
      <span className="grid size-7 place-items-center rounded-md bg-foreground text-background shadow-xs">
        <span className="relative block size-3.5 rounded-[2px] border border-current">
          <span className="absolute -right-1 -top-1 size-3.5 rounded-[2px] border border-current bg-foreground" />
        </span>
      </span>
      {compact ? null : <span>RepoFrame</span>}
    </Link>
  );
}

export { Logo };
