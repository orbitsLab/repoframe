'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';

import { CountUp } from '@/components/site/countUp';
import { CropMarks, useFocusRack } from '@/components/site/focusRack';
import { cn } from '@/lib/utils';

type CardFrameProps = {
  children: ReactNode;
  /** Rendered pixel width shown by the horizontal callout. */
  width?: number;
  /** Rendered pixel height shown by the vertical callout. */
  height?: number;
  /** Caption printed below the width callout. */
  caption?: ReactNode;
  /** Counts the measured dimensions up when the frame enters view. */
  animateMeasurements?: boolean;
  /** Allows an owning sequence to release the measurement counters. */
  measurementsStartWhen?: boolean;
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
  animateMeasurements = false,
  measurementsStartWhen = true,
  className,
}: CardFrameProps) {
  const measured = width !== undefined && height !== undefined;
  const scope = useRef<HTMLDivElement>(null);

  useFocusRack(scope, { distance: 8, blur: 2 });

  return (
    <div
      ref={scope}
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

      <div data-focus-frame className="relative">
        <div
          data-focus-subject
          className="relative overflow-hidden border border-current/20 bg-current/5"
        >
          {children}
        </div>

        {/* Crop marks sit outside the plate so the frame reads as registration
            chrome rather than a border. */}
        <CropMarks />

        {measured ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full mt-5 flex items-center gap-3"
          >
            <span className="h-2 w-px bg-current/25" />
            <span className="h-px flex-1 bg-current/25" />
            <span className="site-data text-current/60">
              {animateMeasurements ? (
                <>
                  <CountUp
                    from={0}
                    to={width}
                    startWhen={measurementsStartWhen}
                  />{' '}
                  ×{' '}
                  <CountUp
                    from={0}
                    to={height}
                    startWhen={measurementsStartWhen}
                  />
                </>
              ) : (
                <>
                  {width} × {height}
                </>
              )}
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
