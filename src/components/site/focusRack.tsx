'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';

import { cn } from '@/lib/utils';

/** Corner offsets per scale, ordered top-left, top-right, bottom-left, bottom-right. */
const insets = {
  card: [
    '-top-2 -left-2',
    '-top-2 -right-2',
    '-bottom-2 -left-2',
    '-right-2 -bottom-2',
  ],
  word: [
    '-top-1 -left-1.5 size-2',
    '-top-1 -right-1.5 size-2',
    '-bottom-1 -left-1.5 size-2',
    '-right-1.5 -bottom-1 size-2',
  ],
} as const;

/** Which two edges each corner draws, in the same order as the offsets. */
const edges = [
  'border-t border-l',
  'border-t border-r',
  'border-b border-l',
  'border-r border-b',
] as const;

type CropMarksProps = {
  /** Mark scale: full size around a card, or reduced around a word. */
  inset?: keyof typeof insets;
};

/**
 * Renders the four registration marks that bracket a framed element.
 *
 * Every mark is drawn from the inherited text colour, so the bracket reads the
 * same wherever it is placed. Place inside a positioned ancestor.
 *
 * @param props - Mark scale.
 */
function CropMarks({ inset = 'card' }: CropMarksProps) {
  return insets[inset].map((offset, index) => (
    <span
      key={offset}
      aria-hidden="true"
      data-focus-mark
      className={cn('site-crop', offset, edges[index])}
    />
  ));
}

type FocusRackOptions = {
  /** How far each corner travels toward the centre, in pixels. */
  distance?: number;
  /** Peak blur on the subject, in pixels. */
  blur?: number;
};

/**
 * Racks every `[data-focus-frame]` in scope like a lens pulling focus on hover:
 * its crop marks close on the frame as its `[data-focus-subject]` goes soft,
 * both hold, then both resolve.
 *
 * The rack runs one way and back, never reversing mid-move — an
 * overshoot-and-correct reads as contrast-detect hunting, not focus. Both
 * tracks share one ease so nothing drifts, and the ramps are long enough that
 * the blur rasterises smoothly instead of in steps.
 *
 * @param scope - The frame itself, or a container holding frames.
 * @param options - Corner travel and peak blur.
 */
function useFocusRack(
  scope: RefObject<HTMLElement | null>,
  { distance = 5, blur = 4 }: FocusRackOptions = {},
) {
  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const root = scope.current;
          const frames = root
            ? [root, ...root.querySelectorAll('[data-focus-frame]')].filter(
                (element) => element.hasAttribute('data-focus-frame'),
              )
            : [];

          const stops = frames.map((frame) => {
            const marks = frame.querySelectorAll('[data-focus-mark]');
            const subject = frame.querySelector('[data-focus-subject]');

            gsap.set(subject, { filter: 'blur(0px)', willChange: 'filter' });

            /** Signed offsets that move every corner toward the frame's centre. */
            const inward = (travel: number) => ({
              x: (index: number) => (index % 2 === 0 ? travel : -travel),
              y: (index: number) => (index < 2 ? travel : -travel),
            });

            const focus = () => {
              gsap
                .timeline({
                  defaults: { ease: 'sine.inOut', overwrite: 'auto' },
                })
                .to(marks, { ...inward(distance), duration: 0.26 }, 0)
                .to(subject, { filter: `blur(${blur}px)`, duration: 0.26 }, 0)
                .to(marks, { x: 0, y: 0, duration: 0.32 }, 0.48)
                .to(subject, { filter: 'blur(0px)', duration: 0.32 }, 0.48);
            };

            frame.addEventListener('mouseenter', focus);
            return () => frame.removeEventListener('mouseenter', focus);
          });

          return () => {
            for (const stop of stops) stop();
          };
        },
      );

      return () => media.revert();
    },
    { scope },
  );
}

type FocusWordProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Brackets a run of text in crop marks that rack it into focus on hover.
 *
 * Self-contained: drop it around any inline text and it wires its own rack.
 *
 * @param props - The text to bracket and optional class names.
 */
function FocusWord({ children, className }: FocusWordProps) {
  const scope = useRef<HTMLSpanElement>(null);

  useFocusRack(scope);

  return (
    <span
      ref={scope}
      data-focus-frame
      className={cn('relative inline-block cursor-default', className)}
    >
      <span data-focus-subject className="relative z-10">
        {children}
      </span>
      <CropMarks inset="word" />
    </span>
  );
}

export { CropMarks, FocusWord, useFocusRack };
