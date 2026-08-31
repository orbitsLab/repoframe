'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

/** Diameter of the window the pointer carries over the field, in pixels. */
const lens = 360;

/** Edge of one crosshair cell, in pixels. */
const tile = 72;

/** Folds a distance into a single cell, which the repeat makes equivalent. */
function wrap(distance: number) {
  return ((distance % tile) + tile) % tile;
}

/**
 * Reveals a field of registration crosshairs beneath the pointer, as though the
 * hero were being lined up on a press.
 *
 * The window moves and the crosshairs do not: the pattern is given the opposite
 * move folded into one cell, which pins it to the page however tall the field
 * is while both layers animate on transform alone. Fills its nearest positioned
 * ancestor, and is inert to pointers and to assistive technology.
 */
function RegistrationField() {
  const scope = useRef<HTMLDivElement>(null);
  const window_ = useRef<HTMLDivElement>(null);
  const pattern = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const field = scope.current;
          if (!field) return;

          const half = lens / 2;
          // Long and gentle, so the window trails the pointer rather than
          // tracking it.
          const follow = { duration: 1.15, ease: 'power2' } as const;
          const moveWindow = {
            x: gsap.quickTo(window_.current, 'x', follow),
            y: gsap.quickTo(window_.current, 'y', follow),
          };
          const movePattern = {
            x: gsap.quickSetter(pattern.current, 'x', 'px'),
            y: gsap.quickSetter(pattern.current, 'y', 'px'),
          };

          // Read back the eased window position each frame rather than easing
          // the pattern too, so folding into a cell never animates the fold.
          const pin = () => {
            movePattern.x(
              wrap(half - (gsap.getProperty(window_.current, 'x') as number)),
            );
            movePattern.y(
              wrap(half - (gsap.getProperty(window_.current, 'y') as number)),
            );
          };

          gsap.ticker.add(pin);

          const track = (event: PointerEvent) => {
            const rect = field.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const inside =
              x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;

            gsap.to(field, {
              opacity: inside ? 1 : 0,
              duration: 0.4,
              overwrite: 'auto',
            });

            if (!inside) return;

            moveWindow.x(x);
            moveWindow.y(y);
          };

          window.addEventListener('pointermove', track, { passive: true });

          return () => {
            window.removeEventListener('pointermove', track);
            gsap.ticker.remove(pin);
          };
        },
      );

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0"
    >
      <div
        ref={window_}
        className="absolute top-0 left-0 will-change-transform"
        style={{
          width: lens,
          height: lens,
          marginLeft: -lens / 2,
          marginTop: -lens / 2,
          maskImage:
            'radial-gradient(circle at center, #000 0%, #000 18%, transparent 67%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, #000 0%, #000 18%, transparent 67%)',
        }}
      >
        {/* Oversized and offset so the window never reaches an edge of it. */}
        <svg
          ref={pattern}
          aria-hidden="true"
          className="absolute text-muted-foreground/40 will-change-transform"
          style={{
            left: -tile,
            top: -tile,
            width: lens + tile * 2,
            height: lens + tile * 2,
          }}
        >
          <defs>
            <pattern
              id="registration-crosshair"
              width="72"
              height="72"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M36 30v12M30 36h12"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#registration-crosshair)"
          />
        </svg>
      </div>
    </div>
  );
}

export { RegistrationField };
