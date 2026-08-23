import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Learn how to use RepoFrame and author a template.',
};

export default function DocsPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[14rem_minmax(0,1fr)] lg:py-24">
      <nav
        className="lg:sticky lg:top-8 lg:self-start"
        aria-label="Documentation"
      >
        <p className="text-sm font-semibold">Documentation</p>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <a href="#using-repoframe">Using RepoFrame</a>
          <a href="#authoring-a-template">Authoring a template</a>
        </div>
      </nav>

      <div className="min-w-0 max-w-3xl">
        <section id="using-repoframe" className="scroll-mt-8">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Using RepoFrame
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Create and export a repository card.
          </h1>
          <div className="mt-8 space-y-6 leading-7 text-muted-foreground">
            <p>
              Open the editor, paste a public GitHub URL or owner/repository
              shorthand, then select Import. RepoFrame loads only the data the
              active template needs.
            </p>
            <p>
              Use Content to choose visible metrics and optional repository
              sections. Use Design for colour, typography, spacing, and card
              treatment. Choose an aspect ratio in the editor header.
            </p>
            <p>
              Export opens format and scale choices. PNG is always available;
              WebP appears only when the browser can produce a real WebP file.
            </p>
          </div>
          <Button asChild className="mt-8">
            <Link href="/app?repo=alfaarghya/alfa-leetcode-api">
              Open the example
            </Link>
          </Button>
        </section>

        <section
          id="authoring-a-template"
          className="mt-20 scroll-mt-8 border-t pt-16"
        >
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Authoring a template
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            Add one file and one registry entry.
          </h2>
          <div className="mt-8 space-y-6 leading-7 text-muted-foreground">
            <p>
              A template consumes normalized ProjectData and returns a
              renderer-independent Scene. It must not import GitHub, storage, or
              Konva code.
            </p>
            <p>
              Declare every setting in settingsSchema, resolve optional GitHub
              data through requiredData, and derive node IDs from stable visual
              roles. Test those IDs against changed repository content.
            </p>
            <p>
              Place the implementation under src/lib/templates/static and add it
              to src/lib/templates/registry.ts. The editor and public detail
              page are generated from that contract.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
