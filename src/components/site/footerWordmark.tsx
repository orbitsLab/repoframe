'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useId, useLayoutEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const characters = Array.from('Repo Frame', (character, position) => ({
  character,
  id: `${character}-${position}`,
}));
const fontSize = 256;
const strokeWidth = 1.2;
const dash = fontSize * 7;

type WordmarkBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Draws and fills the footer wordmark when the footer enters the viewport. */
function FooterWordmark() {
  const scope = useRef<HTMLDivElement>(null);
  const strokeText = useRef<SVGTextElement>(null);
  const wipeRect = useRef<SVGRectElement>(null);
  const [box, setBox] = useState<WordmarkBox | null>(null);
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `footer-wordmark-gradient-${rawId}`;
  const wipeId = `footer-wordmark-wipe-${rawId}`;

  useLayoutEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeText.current) {
        return;
      }

      const bounds = strokeText.current.getBBox();
      if (!bounds.width) {
        return;
      }

      const pad = Math.max(4, strokeWidth * 2);
      const next = {
        x: bounds.x - pad,
        y: bounds.y - pad,
        width: bounds.width + pad * 2,
        height: bounds.height + pad * 2,
      };

      setBox((current) =>
        current &&
        Math.abs(current.x - next.x) < 0.5 &&
        Math.abs(current.y - next.y) < 0.5 &&
        Math.abs(current.width - next.width) < 0.5
          ? current
          : next,
      );
    };

    measure();
    document.fonts.ready.then(measure).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      const wipe = wipeRect.current;
      if (!box || !wipe) {
        return;
      }

      const strokes = gsap.utils.toArray<SVGTSpanElement>(
        '[data-stroke-character]',
      );
      if (!strokes.length) {
        return;
      }

      const media = gsap.matchMedia();
      media.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          still: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { still } = context.conditions as { still: boolean };
          if (still) {
            gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
            gsap.set(wipe, { scaleX: 1, transformOrigin: 'left center' });
            return;
          }

          gsap.set(strokes, {
            strokeDasharray: dash,
            strokeDashoffset: dash,
          });
          gsap.set(wipe, { scaleX: 0, transformOrigin: 'left center' });

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: scope.current,
              start: 'top bottom',
              once: true,
            },
          });

          timeline
            .to(strokes, {
              strokeDashoffset: 0,
              duration: 1.6,
              ease: 'sine.inOut',
              stagger: 0.05,
            })
            .to(
              wipe,
              {
                scaleX: 1,
                duration: 0.8,
                ease: 'power2.inOut',
              },
              1.8,
            );
        },
      );

      return () => media.revert();
    },
    { scope, dependencies: [box] },
  );

  const viewBox = box
    ? `${box.x} ${box.y} ${box.width} ${box.height}`
    : `0 ${-fontSize} 1600 ${fontSize * 1.2}`;

  return (
    <div ref={scope} className="-mb-[6cqw]">
      <svg
        aria-hidden="true"
        className="block w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={viewBox}
      >
        {box ? (
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              x2="0"
              y1={box.y}
              y2={box.y + box.height}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="var(--foreground)" />
              <stop
                offset="1"
                stopColor="var(--muted-foreground)"
                stopOpacity="0.4"
              />
            </linearGradient>
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect
                ref={wipeRect}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
              />
            </clipPath>
          </defs>
        ) : null}

        <text
          ref={strokeText}
          x="0"
          y="0"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="select-none font-display font-bold"
          style={{ fontSize, letterSpacing: '-0.045em' }}
        >
          {characters.map(({ character, id }) => (
            <tspan data-stroke-character key={id}>
              {character === ' ' ? '\u00a0' : character}
            </tspan>
          ))}
        </text>

        {box ? (
          <text
            x="0"
            y="0"
            fill={`url(#${gradientId})`}
            clipPath={`url(#${wipeId})`}
            className="select-none font-display font-bold"
            style={{ fontSize, letterSpacing: '-0.045em' }}
          >
            {characters.map(({ character, id }) => (
              <tspan key={id}>{character === ' ' ? '\u00a0' : character}</tspan>
            ))}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

export { FooterWordmark };
