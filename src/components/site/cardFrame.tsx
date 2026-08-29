import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type CardFrameProps = {
  children: ReactNode;
  /** Rendered pixel width shown by the horizontal callout. */
  width?: number;
  /** Rendered pixel height shown by the vertical callout. */
  height?: number;
  /** Caption printed below the width callout. */
  caption?: string;
  className?: string;
};

/**
 * Wraps content in the registration frame used throughout the public pages:
 * four crop marks and, when dimensions are given, measured callout rules.
 *
 * Every rule is drawn from the inherited text colour, so the frame reads the
 * same wherever it is placed.
 *
 * @param props - Framed content, optional dimensions, caption, and classes.
 */
function CardFrame({
  children,
  width,
  height,
  caption,
  className,
}: CardFrameProps) {
  const measured = width !== undefined && height !== undefined;

  return (
    <div
      className={cn(
        'relative',
        // The width callout is absolute, so the frame reserves room for it.
        measured && 'pb-10',
        className,
      )}
    >
      {caption ? (
        <p className="site-data mb-4 flex items-center gap-3 text-current/60">
          <span className="min-w-0 truncate">{caption}</span>
          <span aria-hidden="true" className="h-px flex-1 bg-current/25" />
        </p>
      ) : null}

      <div className="relative">
        <div className="relative overflow-hidden border border-current/20 bg-current/5">
          {children}
        </div>

        {/* Crop marks sit outside the plate so the frame reads as registration
            chrome rather than a border. */}
        <span
          aria-hidden="true"
          className="site-crop -top-2 -left-2 border-t border-l"
        />
        <span
          aria-hidden="true"
          className="site-crop -top-2 -right-2 border-t border-r"
        />
        <span
          aria-hidden="true"
          className="site-crop -bottom-2 -left-2 border-b border-l"
        />
        <span
          aria-hidden="true"
          className="site-crop -right-2 -bottom-2 border-r border-b"
        />

        {measured ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full mt-5 flex items-center gap-3"
          >
            <span className="h-2 w-px bg-current/25" />
            <span className="h-px flex-1 bg-current/25" />
            <span className="site-data text-current/60">
              {width} × {height}
            </span>
            <span className="h-px flex-1 bg-current/25" />
            <span className="h-2 w-px bg-current/25" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export { CardFrame };
