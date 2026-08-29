import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { CardFrame } from '@/components/site/cardFrame';
import { Reveal } from '@/components/site/reveal';
import { SampleCard } from '@/components/site/sampleCard';
import { templates } from '@/lib/templates/registry';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Browse Repo Frame templates for GitHub social cards.',
};

/** Facts about the set, printed as a specification strip. */
const specs = [
  ['Templates', String(templates.length)],
  ['Ratios', '1:1 · 4:5 · 16:9 · 9:16'],
  ['Export', 'PNG · WebP · JPEG'],
] as const;

export default function TemplatesPage() {
  return (
    <main id="main">
      <section className="border-b" aria-labelledby="gallery-heading">
        <Reveal exit={false} className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="site-eyebrow text-muted-foreground">Template gallery</p>
          <h1
            id="gallery-heading"
            className="site-display mt-5 max-w-3xl text-4xl sm:text-6xl"
          >
            A strong starting point for every repository.
          </h1>
          <p className="mt-7 max-w-md text-muted-foreground text-base leading-7">
            Every template is a finished layout, not a blank canvas. Each one
            reads the same repository data and exposes its design choices
            through the same generated editor controls.
          </p>

          {/* Anchored to the extremes rather than parcelled into equal thirds,
              so the strip reads to both edges of the page. */}
          <dl className="mt-12 grid border-t sm:grid-cols-3">
            {specs.map(([label, value], index) => (
              <div
                key={label}
                className={cn(
                  'py-5',
                  index === specs.length - 1
                    ? 'sm:text-right'
                    : index > 0 && 'sm:text-center',
                )}
              >
                <dt className="site-data">{label}</dt>
                <dd className="mt-2 font-medium text-sm" translate="no">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section aria-label="All templates">
        <ol className="mx-auto grid max-w-6xl gap-x-16 gap-y-16 px-6 py-16 md:grid-cols-2 sm:py-24">
          {templates.map((template, index) => (
            <li key={template.id}>
              <Reveal exit={false}>
                <Link
                  href={`/templates/${template.id}`}
                  className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CardFrame
                    caption={`${String(index + 1).padStart(3, '0')} — ${template.category}`}
                  >
                    <SampleCard templateId={template.id} />
                  </CardFrame>

                  <div className="mt-5 flex items-baseline justify-between gap-5 border-t pt-4">
                    <span>
                      <span className="block font-semibold text-lg tracking-tight">
                        {template.name}
                      </span>
                      <span className="mt-1 block text-muted-foreground text-sm leading-6">
                        {template.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
