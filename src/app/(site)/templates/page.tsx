import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { SampleCard } from '@/components/site/sampleCard';
import { templates } from '@/lib/templates/registry';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Browse RepoFrame templates for GitHub social cards.',
};

export default function TemplatesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Template gallery
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          A strong starting point for every repository.
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Every template supports all four export ratios and exposes its design
          choices through the same generated editor controls.
        </p>
      </div>
      <div className="mt-12 grid gap-7 md:grid-cols-2">
        {templates.map((template) => (
          <Link
            key={template.id}
            href={`/templates/${template.id}`}
            className="group rounded-xl border bg-card p-3 shadow-xs outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SampleCard templateId={template.id} />
            <span className="flex items-center justify-between gap-5 px-2 py-4">
              <span>
                <span className="block text-lg font-semibold">
                  {template.name}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {template.description}
                </span>
              </span>
              <ArrowRight
                className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
