'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

import { CardFrame } from '@/components/site/cardFrame';
import { RepoForm } from '@/components/site/repoForm';
import { fullMetrics, SampleCard } from '@/components/site/sampleCard';
import { SectionMarker } from '@/components/site/sectionMarker';

/**
 * Renders the landing hero: the repository form beside a live framed card.
 */
function Hero() {
  const scope = useRef<HTMLElement>(null);

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
            gsap.set('[data-hero-rise], [data-hero-mark]', {
              opacity: 1,
              y: 0,
              scale: 1,
            });
            return;
          }

          gsap
            .timeline({ defaults: { ease: 'power3.out' } })
            .from('[data-hero-rise]', {
              y: 18,
              opacity: 0,
              duration: 0.7,
              stagger: 0.08,
            })
            .from(
              '[data-hero-mark]',
              { scale: 0.4, opacity: 0, duration: 0.5, stagger: 0.04 },
              '-=0.35',
            );
        },
      );

      return () => media.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      data-snap
      className="relative flex min-h-[calc(100svh-var(--header-height))] flex-col border-b pb-20"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-14 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:py-20">
        <div>
          <p data-hero-rise className="site-eyebrow text-muted-foreground">
            Open source · Runs in your browser
          </p>

          <h1
            id="hero-heading"
            className="site-display mt-6 text-5xl sm:text-6xl"
          >
            <span data-hero-rise className="block">
              {/* The product's own crop marks, used on the word they name. */}
              <span className="relative inline-block">
                <span className="relative z-10">Frame</span>
                <span
                  aria-hidden="true"
                  data-hero-mark
                  className="site-crop -top-1 -left-1.5 size-2 border-t border-l"
                />
                <span
                  aria-hidden="true"
                  data-hero-mark
                  className="site-crop -top-1 -right-1.5 size-2 border-t border-r"
                />
                <span
                  aria-hidden="true"
                  data-hero-mark
                  className="site-crop -bottom-1 -left-1.5 size-2 border-b border-l"
                />
                <span
                  aria-hidden="true"
                  data-hero-mark
                  className="site-crop -right-1.5 -bottom-1 size-2 border-r border-b"
                />
              </span>{' '}
              the repo.
            </span>
            <span data-hero-rise className="mt-2 block text-muted-foreground">
              Then ship the link.
            </span>
          </h1>

          <p
            data-hero-rise
            className="mt-7 max-w-md text-base text-muted-foreground leading-7"
          >
            Repo Frame turns a public GitHub repository into a social card worth
            putting on a timeline. Choose a template, tune it, export it —
            nothing leaves your browser.
          </p>

          <div data-hero-rise>
            <RepoForm id="hero-repository" className="mt-8 max-w-md" />
          </div>

          <p data-hero-rise className="mt-4 text-muted-foreground text-xs">
            No account. No upload. Public repositories only.
          </p>
        </div>

        <div data-hero-rise>
          <CardFrame
            width={1200}
            height={675}
            caption="Template Minimal · 16:9 · PNG"
          >
            <SampleCard
              templateId="minimal"
              settings={{ metrics: fullMetrics }}
            />
          </CardFrame>
        </div>
      </div>

      <SectionMarker index={1} label="Overview" next="What it reads" />
    </section>
  );
}

export { Hero };
