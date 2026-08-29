import { Hero } from '@/components/site/hero';
import { RepoForm } from '@/components/site/repoForm';
import { Reveal } from '@/components/site/reveal';
import { SectionMarker } from '@/components/site/sectionMarker';
import { Workbench } from '@/components/site/workbench';

/** What Repo Frame reads from GitHub, and where each field comes from. */
const readings = [
  ['Name, description, topics', 'repos/{owner}/{repo}'],
  ['Stars, forks, watchers', 'Repository counts'],
  ['Open issues, pull requests', 'pulls (link header)'],
  ['Language split', 'repos/{owner}/{repo}/languages'],
  ['Contributors', 'repos/{owner}/{repo}/contributors'],
  ['Latest release', 'releases/latest'],
  ['Licence', 'Repository licence'],
] as const;

/** The three claims behind running entirely on the client. */
const guarantees = [
  ['Accounts', 'None'],
  ['Uploads', 'None'],
  ['Storage', 'Your browser'],
] as const;

/** Renders the specification table of the data a card is built from. */
function Anatomy() {
  return (
    <section
      data-snap
      className="relative flex min-h-[calc(100svh-var(--header-height))] items-center border-b pb-20"
      aria-labelledby="anatomy-heading"
    >
      <Reveal className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div>
          <p className="site-eyebrow text-muted-foreground">What it reads</p>
          <h2
            id="anatomy-heading"
            className="site-display mt-5 text-3xl sm:text-4xl"
          >
            A card is only as good as the data behind it.
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground text-sm leading-6">
            Paste a URL and Repo Frame calls the public GitHub API from your
            browser, normalises the response, and hands the result to the
            template. Nothing is invented, and nothing is stored on a server.
          </p>
        </div>

        <dl className="border-t">
          {readings.map(([field, source]) => (
            <div
              key={field}
              className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-6"
            >
              <dt className="min-w-0 font-medium text-sm">{field}</dt>
              <dd
                className="site-data min-w-0 break-words normal-case"
                translate="no"
              >
                {source}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
      <SectionMarker index={2} label="What it reads" next="The workbench" />
    </section>
  );
}

/** Renders the section stating the local-first guarantee. */
function LocalFirst() {
  return (
    <section
      data-snap
      className="relative flex min-h-[calc(100svh-var(--header-height))] items-center border-b pb-20"
      aria-labelledby="local-heading"
    >
      <Reveal className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[7fr_5fr] lg:gap-16">
        <div>
          <p className="site-eyebrow text-muted-foreground">Local first</p>
          <h2
            id="local-heading"
            className="site-display mt-5 text-balance text-3xl sm:text-5xl"
          >
            There is no server to trust, because there is no server.
          </h2>
        </div>
        <dl className="self-end">
          {guarantees.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-6 border-t py-4 last:border-b"
            >
              <dt className="site-data">{label}</dt>
              <dd className="font-medium text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
      <SectionMarker index={4} label="Local first" next="Get started" />
    </section>
  );
}

/** Renders the closing repository field. */
function Closing() {
  return (
    <section
      data-snap
      className="relative flex min-h-[calc(100svh-var(--header-height))] items-center pb-20"
      aria-labelledby="cta-heading"
    >
      {/* Last block before the footer, so it stays put rather than fading out. */}
      <Reveal
        exit={false}
        className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32"
      >
        <p className="site-eyebrow text-muted-foreground">Get started</p>
        <h2
          id="cta-heading"
          className="site-display mt-5 max-w-2xl text-4xl sm:text-5xl"
        >
          Give the link something to show.
        </h2>
        <RepoForm id="closing-repository" className="mt-8 max-w-xl" />
        <p className="mt-4 text-muted-foreground text-xs">
          Or open the editor with{' '}
          <a
            className="underline underline-offset-4 hover:no-underline"
            href="/app?repo=alfaarghya/alfa-leetcode-api"
            translate="no"
          >
            alfa-leetcode-api
          </a>{' '}
          to look around first.
        </p>
      </Reveal>
      <SectionMarker index={5} label="Get started" />
    </section>
  );
}

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <Anatomy />
      <Workbench />
      <LocalFirst />
      <Closing />
    </main>
  );
}
