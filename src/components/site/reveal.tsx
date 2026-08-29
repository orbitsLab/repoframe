'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ReactNode, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: ReactNode;
  /** Fades the block back out as it leaves the top of the viewport. */
  exit?: boolean;
  className?: string;
};

/**
 * Ties a block's opacity and offset to its own position in the viewport, so it
 * resolves on approach and dissolves again on the way out, in both directions.
 *
 * @param props - Framed content, exit behaviour, and optional class names.
 */
function Reveal({ children, exit = true, className }: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          still: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { still } = context.conditions as { still: boolean };
          if (still) {
            return;
          }

          // One timeline over the block's whole travel. Two competing tweens
          // on the same property leave it stuck at zero on the way back up.
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: scope.current,
              start: 'top bottom',
              end: exit ? 'bottom top' : 'top 52%',
              scrub: true,
            },
          });

          timeline.fromTo(
            scope.current,
            { opacity: 0, y: 56 },
            { opacity: 1, y: 0, ease: 'none', duration: 1 },
          );

          if (exit) {
            timeline.to(scope.current, { duration: 2.6 }).to(scope.current, {
              opacity: 0,
              y: -40,
              ease: 'none',
              duration: 1,
            });
          }
        },
      );

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}

export { Reveal };
