'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { CardFrame } from '@/components/site/cardFrame';
import { fullMetrics, SampleCard } from '@/components/site/sampleCard';
import { SectionMarker } from '@/components/site/sectionMarker';
import { cn } from '@/lib/utils';

/** Scroll-driven compositions, each pairing a template with its own copy. */
const moves = [
  {
    templateId: 'cover',
    name: 'Cover',
    heading: 'Twenty-six compositions, none of them a blank canvas.',
    copy: 'Every template is a finished layout with its own opinion about hierarchy. Pick the one that suits the project and the work is mostly done.',
  },
  {
    templateId: 'release',
    name: 'Release',
    heading: 'A tag is news. Give it a card that says so.',
    copy: 'The latest release, its date and the licence, set around the repository name. The card you post the day you ship, not the one you leave in the README.',
  },
  {
    templateId: 'marquee',
    name: 'Marquee',
    heading: 'The name, until the name is the whole card.',
    copy: 'The repository name repeated line after line, one line picked out in the accent. Nothing but type, sized to the card it has to fill.',
  },
  {
    templateId: 'almanac',
    name: 'Almanac',
    heading: 'For projects whose numbers do the talking.',
    copy: 'A ruled mosaic where every figure is sized by the cell it sits in. Stars lead, the rest fall in behind, and nothing is padded to fill space.',
  },
  {
    templateId: 'gauge',
    name: 'Gauge',
    heading: 'One figure, lit large.',
    copy: 'A bezelled module built around a single headline number, with the supporting readings kept small. Choose which metric leads and the layout follows.',
  },
] as const;

/** Colour presets drawn from the palettes the templates already ship with. */
const presets = [
  { id: 'default', name: 'Default', settings: {} },
  {
    id: 'ink',
    name: 'Ink',
    settings: {
      backgroundColor: '#f6f3ec',
      accentColor: '#5b5bd6',
      textColor: '#151515',
    },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    settings: {
      backgroundColor: '#0b0d10',
      accentColor: '#7ee787',
      textColor: '#e6edf3',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    settings: {
      backgroundColor: '#f2efe6',
      accentColor: '#b4471f',
      textColor: '#161513',
    },
  },
  {
    id: 'poster',
    name: 'Poster',
    settings: {
      backgroundColor: '#ff4a1c',
      accentColor: '#100c08',
      textColor: '#100c08',
    },
  },
] as const;

/**
 * Renders the landing workbench: a card that follows the reader down the
 * section, changing template on scroll while colour stays under their control.
 */
function Workbench() {
  const scope = useRef<HTMLDivElement>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [presetId, setPresetId] = useState<string>('default');

  const preset = useMemo(
    () => presets.find((entry) => entry.id === presetId) ?? presets[0],
    [presetId],
  );

  useGSAP(
    () => {
      // One trigger over the whole list. Deriving the index from progress keeps
      // the card in step however fast the reader moves, which per-item toggles
      // do not: they fire in registration order rather than positional order.
      const trigger = ScrollTrigger.create({
        trigger: '[data-moves]',
        start: 'top center',
        end: 'bottom center',
        onUpdate: (self) => {
          const index = Math.min(
            moves.length - 1,
            Math.max(0, Math.floor(self.progress * moves.length)),
          );
          setMoveIndex((current) => (current === index ? current : index));
        },
      });

      // Beside the sticky card each step is a screenful of its own, so it earns
      // a settle stop and the sequence steps one card at a time either way. The
      // first step shares the section's own edge. Stacked, the steps are far too
      // short to rest on.
      const media = gsap.matchMedia();
      media.add('(min-width: 1024px)', () => {
        const steps = gsap.utils.toArray<HTMLElement>('[data-move]').slice(1);
        for (const step of steps) {
          step.setAttribute('data-snap', '');
        }

        return () => {
          for (const step of steps) {
            step.removeAttribute('data-snap');
          }
        };
      });

      return () => {
        trigger.kill();
        media.revert();
      };
    },
    { scope },
  );

  const move = moves[moveIndex];

  return (
    <section
      data-snap
      className="relative border-b pb-20"
      aria-labelledby="workbench-heading"
    >
      <div
        ref={scope}
        // Flex while stacked, so the sticky card's containing block is the whole
        // column and it holds through the steps. A grid item would be penned
        // into its own row and let go immediately.
        className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:grid lg:max-w-6xl lg:grid-cols-[7fr_5fr] lg:gap-x-16 lg:py-24"
      >
        <div className="lg:col-start-2 lg:row-start-1">
          <p className="site-eyebrow text-muted-foreground">The workbench</p>
          <h2
            id="workbench-heading"
            className="site-display mt-5 text-3xl sm:text-4xl"
          >
            Check how your repository card look.
          </h2>
        </div>

        {/* Sticky at every width. On a narrow screen the card is the whole
            section: it holds the viewport while the steps below it scroll past
            unseen, so the only thing that moves is the card itself. */}
        <div className="sticky top-[calc(var(--header-height)+0.75rem)] z-10 flex h-[calc(100svh-var(--header-height)-1.5rem)] flex-col justify-center lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block lg:h-auto lg:self-start lg:top-24">
          <CardFrame
            width={1200}
            height={675}
            caption={`Template ${move.name} · Palette ${preset.name}`}
          >
            <SampleCard
              templateId={move.templateId}
              settings={{ ...preset.settings, metrics: fullMetrics }}
            />
          </CardFrame>

          <fieldset className="mt-6 border-t pt-5">
            <legend className="sr-only">Card colour preset</legend>
            <p className="site-eyebrow mb-3 text-muted-foreground">
              Try a palette
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((option) => {
                const active = option.id === presetId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPresetId(option.id)}
                    aria-pressed={active}
                    className={cn(
                      'site-data border px-3 py-2 outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'text-muted-foreground hover:border-foreground hover:text-foreground',
                    )}
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <p className="mt-4 text-muted-foreground text-xs">
            Five cards out of many,{' '}
            <Link
              href="/templates"
              className="underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              see all the templates
            </Link>
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-start-2">
          <ol data-moves className="mt-2 lg:mt-10">
            {moves.map((entry, index) => (
              <li
                key={entry.templateId}
                data-move={index}
                data-active={index === moveIndex}
                // Stacked, the step is pure travel for the card above it: it
                // keeps its height and drops its copy, since the card already
                // names itself in its caption.
                className="h-[42svh] transition-opacity duration-500 lg:flex lg:h-auto lg:min-h-[64vh] lg:flex-col lg:justify-center lg:border-t lg:opacity-35 lg:first:justify-start lg:first:border-t-0 lg:data-[active=true]:opacity-100"
              >
                <div className="hidden lg:block">
                  <p className="site-eyebrow text-foreground">{entry.name}</p>
                  <h3 className="mt-4 text-balance font-semibold text-2xl tracking-tight">
                    {entry.heading}
                  </h3>
                  <p className="mt-3 text-muted-foreground text-sm leading-6">
                    {entry.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Sticky lets go a card's height before the column ends, so stacked
              the last steps would play with the card already gone. This holds
              the column open for exactly that overhang. */}
          <div aria-hidden="true" className="h-[62svh] lg:hidden" />
        </div>
      </div>
      <SectionMarker index={3} label="The workbench" next="Local first" />
    </section>
  );
}

export { Workbench };
