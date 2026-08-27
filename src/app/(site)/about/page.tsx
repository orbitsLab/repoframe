import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

import { Button } from '@/components/ui/button';
import { githubUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why RepoFrame is local-first and open source.',
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <p className="site-eyebrow text-muted-foreground">About RepoFrame</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        A focused tool for presenting open-source work clearly.
      </h1>

      <div className="mt-12 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2">
        <section className="bg-background p-7">
          <h2 className="font-semibold">What it is</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            RepoFrame turns public GitHub repository data into customizable
            social cards. It is a template customizer, not a free-form canvas.
          </p>
        </section>
        <section className="bg-background p-7">
          <h2 className="font-semibold">Why local-first</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Your project stays in your browser. RepoFrame has no accounts, no
            server, and no database. Repository data is fetched from GitHub
            directly by your browser, and your designs never leave your device.
          </p>
        </section>
        <section className="bg-background p-7">
          <h2 className="font-semibold">Open source</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            The source is available under the Apache License 2.0. Templates are
            the primary contribution path and use a documented public contract.
          </p>
        </section>
        <section className="bg-background p-7">
          <h2 className="font-semibold">No analytics</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            RepoFrame ships without analytics in v1. There is no quiet tracking
            layer behind the local-first promise.
          </p>
        </section>
      </div>

      <Button asChild variant="outline" size="lg" className="mt-10">
        <a href={githubUrl}>
          View source on GitHub
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    </main>
  );
}
