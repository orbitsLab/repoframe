import { ArrowRight, Check, CodeXml, Download, Palette } from 'lucide-react';
import Link from 'next/link';

import { SampleCard } from '@/components/site/sampleCard';
import { Button } from '@/components/ui/button';
import { templates } from '@/lib/templates/registry';

const steps = [
  {
    number: '01',
    title: 'Paste a repository',
    copy: 'Repo Frame loads public project details directly from GitHub.',
  },
  {
    number: '02',
    title: 'Choose what matters',
    copy: 'Select a template, visible content, typography, and card treatment.',
  },
  {
    number: '03',
    title: 'Export the card',
    copy: 'Download a sharp PNG or WebP without uploading your design.',
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-28">
          <div>
            <p className="site-eyebrow mb-5 text-muted-foreground">
              Open-source GitHub card generator
            </p>
            <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">
              Make your repository worth sharing.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              Turn a public GitHub repository into a polished social card. Pick
              the content, tune the design, and export it locally.
            </p>
            <form
              action="/app"
              method="get"
              className="mt-8 flex max-w-lg flex-col gap-2 sm:flex-row"
            >
              <label className="sr-only" htmlFor="hero-repository">
                GitHub repository
              </label>
              <input
                id="hero-repository"
                name="repo"
                className="h-11 min-w-0 flex-1 rounded-md border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="https://github.com/alfaarghya/alfa-leetcode-api"
                required
              />
              <Button type="submit" size="lg">
                Create card
                <ArrowRight aria-hidden="true" />
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              No account. No upload. Public repositories only.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-muted" />
            <SampleCard templateId="minimal" className="shadow-lg" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-xl">
          <p className="site-eyebrow text-muted-foreground">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            From repository to image in three steps.
          </h2>
        </div>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="bg-background p-7">
              <span className="font-mono text-xs text-muted-foreground">
                {step.number}
              </span>
              <h3 className="mt-8 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.copy}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="site-eyebrow text-muted-foreground">Templates</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Start with a composition that works.
              </h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/templates">View all</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group rounded-xl border bg-card p-3 shadow-xs outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SampleCard templateId={template.id} />
                <span className="mt-4 flex items-center justify-between gap-3 px-1 pb-1">
                  <span>
                    <span className="block font-medium">{template.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {template.category}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="site-eyebrow text-muted-foreground">Customization</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Flexible enough to feel yours. Curated enough to stay good.
          </h2>
          <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
            Change visible metrics, colours, typography, spacing, and card
            treatment without wrestling with a free-form canvas.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Theme', 'Background and accent colours', Palette],
            ['Typography', 'Twelve self-hosted font choices', Check],
            ['Cards', 'Radius, spacing, and structure', CodeXml],
            ['Export', 'PNG and supported WebP output', Download],
          ].map(([title, copy, Icon]) => (
            <div key={String(title)} className="rounded-lg border p-5">
              <Icon className="size-5" aria-hidden="true" />
              <h3 className="mt-6 font-semibold">{String(title)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {String(copy)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <p className="site-eyebrow opacity-65">Local-first by design</p>
          <p className="text-xl leading-8 tracking-tight sm:text-2xl">
            Your project stays in your browser. Repo Frame has no accounts, no
            server, and no database. Repository data is fetched from GitHub
            directly by your browser, and your designs never leave your device.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-4xl font-semibold tracking-tight">
          Give your repository a better first impression.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Open the editor with the example project or paste your own public
          repository.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/app?repo=alfaarghya/alfa-leetcode-api">
            Try alfa-leetcode-api
          </Link>
        </Button>
      </section>
    </main>
  );
}
