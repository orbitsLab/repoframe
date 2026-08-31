import Link from 'next/link';

import { Logo } from '@/components/logo';
import { FooterWordmark } from '@/components/site/footerWordmark';
import { githubUrl, orbitsLabUrl, socialLinks } from '@/lib/site';
import { cn } from '@/lib/utils';

/** Footer navigation, grouped the way the site itself is grouped. */
const columns = [
  {
    title: 'Make',
    links: [
      { label: 'Editor', href: '/app' },
      { label: 'Templates', href: '/templates' },
    ],
  },
  {
    title: 'Source',
    links: [{ label: 'GitHub', href: githubUrl }],
  },
  {
    // Shared with the linked data that names the same accounts, so the footer
    // and the Organization node can never drift apart.
    title: 'Social',
    links: socialLinks,
  },
] as const;

/** Facts about the build, printed as a specification strip. */
const meta = [
  ['Runs', 'In your browser'],
  ['Storage', 'IndexedDB'],
  ['Export', 'PNG · WebP · JPEG'],
] as const;

/**
 * Renders the site footer: navigation, a specification strip, and the
 * oversized wordmark the pages sign off with.
 */
function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <div>
            <div className="flex items-start gap-3">
              <Logo />
              <span aria-hidden="true" className="site-data mt-3">
                X
              </span>
              <a
                href={orbitsLabUrl}
                aria-label="Orbits Lab"
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight">
                    Orbits Lab
                  </span>
                  <span
                    aria-hidden="true"
                    className="size-7 w-10 shrink-0 bg-foreground"
                    style={{
                      WebkitMask:
                        'url(/orbitsLabsLogo.svg) center / contain no-repeat',
                      mask: 'url(/orbitsLabsLogo.svg) center / contain no-repeat',
                    }}
                  />
                </div>
                <p className="-mt-2 ml-3 text-[10px]">Powered by</p>
              </a>
            </div>
            <p className="mt-5 max-w-xs text-muted-foreground text-sm leading-6">
              A social card for any public GitHub repository, built and exported
              entirely on your own machine.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="site-data">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground text-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Anchored to the extremes rather than parcelled into equal thirds, so
            the strip reads to both edges of the page. */}
        <dl className="grid gap-px border-t sm:grid-cols-3">
          {meta.map(([label, value], index) => (
            <div
              key={label}
              className={cn(
                'py-5',
                index === meta.length - 1
                  ? 'sm:text-right'
                  : index > 0 && 'sm:text-center',
              )}
            >
              <dt className="site-data">{label}</dt>
              <dd className="mt-2 font-medium text-sm">{value}</dd>
            </div>
          ))}
        </dl>

        {/* The wordmark signs the page off inside its own registration frame,
            the same device the cards are presented in. It sits barely above the
            page ground and runs off the bottom edge, so it reads as a watermark
            rather than a heading. */}
        <div className="@container relative border-t pt-12">
          <span
            aria-hidden="true"
            className="site-crop -top-2 -left-2 border-t border-l"
          />
          <span
            aria-hidden="true"
            className="site-crop -top-2 -right-2 border-t border-r"
          />
          <div className="overflow-hidden">
            <FooterWordmark />
          </div>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
