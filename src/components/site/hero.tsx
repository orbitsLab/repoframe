'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, useState } from 'react';

import { CardFrame } from '@/components/site/cardFrame';
import { CountUp } from '@/components/site/countUp';
import { FocusWord } from '@/components/site/focusRack';
import { RepoForm } from '@/components/site/repoForm';
import { fullMetrics, SampleCard } from '@/components/site/sampleCard';
import { SectionMarker } from '@/components/site/sectionMarker';

/**
 * Renders the landing hero: the repository form beside a live framed card.
 */
function Hero() {
  const scope = useRef<HTMLElement>(null);
  const [cardReady, setCardReady] = useState(false);

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
            gsap.set('[data-hero-rise], [data-focus-mark]', {
              opacity: 1,
              y: 0,
              scale: 1,
            });
            setCardReady(true);
            return;
          }

          gsap
            .timeline({
              defaults: { ease: 'power3.out' },
              onComplete: () => setCardReady(true),
            })
            .from('[data-hero-rise]', {
              y: 18,
              opacity: 0,
              duration: 0.7,
              stagger: 0.08,
            })
            .from(
              '#hero-heading [data-focus-mark]',
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
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-14 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:py-20">
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
              <FocusWord>Frame</FocusWord> the repo.
            </span>
            <span data-hero-rise className="mt-2 block text-muted-foreground">
              Share the <FocusWord>card</FocusWord>.
            </span>
          </h1>

          <p
            data-hero-rise
            className="mt-7 max-w-md text-base text-muted-foreground leading-7"
          >
            Repo Frame turns a public GitHub repository into a social card worth
            putting on a timeline. Choose a template, tune it, export it.
            Nothing leaves your browser.
          </p>

          <div data-hero-rise>
            <RepoForm id="hero-repository" className="mt-8 max-w-md" />
          </div>

          <p data-hero-rise className="mt-4 text-muted-foreground text-xs">
            No account · No upload · Public repositories only
          </p>
        </div>

        <div data-hero-rise>
          <CardFrame
            width={1200}
            height={675}
            animateMeasurements
            measurementsStartWhen={cardReady}
            caption={
              <>
                Template Minimal ·{' '}
                <CountUp from={1} to={16} startWhen={cardReady} />:
                <CountUp from={1} to={9} startWhen={cardReady} /> · PNG
              </>
            }
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
