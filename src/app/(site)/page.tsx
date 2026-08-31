import type { Metadata } from 'next';
import FAQ from '@/components/site/faq';

import { Hero } from '@/components/site/hero';
import { GithubMark, XMark } from '@/components/site/platformMarks';
import { RegistrationField } from '@/components/site/registrationField';
import { Reveal } from '@/components/site/reveal';
import { SectionMarker } from '@/components/site/sectionMarker';
import { WaveArrow } from '@/components/site/waveArrow';
import { Workbench } from '@/components/site/workbench';
import { supportContent } from '@/content/support';

/** What a card can read, and whether it is fetched up front or only when shown. */
const readings = [
  ['Name, description, topics', 'Always'],
  ['Stars, forks, watchers', 'Always'],
  ['Open issues, pull requests', 'On request'],
  ['Language split', 'On request'],
  ['Contributors', 'On request'],
  ['Latest release', 'On request'],
  ['Licence', 'Always'],
] as const;

/** The logo each support card is watermarked with, keyed by platform. */
const marks = {
  github: GithubMark,
  x: XMark,
} as const;

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
      aria-labelledby="anatomy"
    >
      <Reveal className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div>
          <p className="site-eyebrow text-muted-foreground">What it reads</p>
          <h2 id="anatomy" className="site-display mt-5 text-3xl sm:text-4xl">
            A card is only as good as the data behind it.
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground text-sm leading-6">
            Paste a URL and every field on the card is read straight from the
            repository itself. Nothing leaves your device.
          </p>
        </div>

        <dl className="border-t">
          {readings.map(([field, source]) => (
            <div
              key={field}
              className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-6"
            >
              <dt className="min-w-0 font-medium text-sm">{field}</dt>
              <dd className="site-data min-w-0 break-words">{source}</dd>
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
      aria-labelledby="local-first"
    >
      <Reveal className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[7fr_5fr] lg:gap-16">
        <div>
          <p className="site-eyebrow text-muted-foreground">Local first</p>
          <h2
            id="local-first"
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
      <SectionMarker index={4} label="Local first" next="FAQ" />
    </section>
  );
}

/** Renders the closing call for support. */
function Support() {
  return (
    <section
      data-snap
      className="relative flex min-h-[calc(100svh-var(--header-height))] items-center pb-20"
      aria-labelledby="support"
    >
      {/* Last block before the footer, so it stays put rather than fading out. */}
      <Reveal
        exit={false}
        className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32"
      >
        <p className="site-eyebrow text-muted-foreground">
          {supportContent.eyebrow}
        </p>
        <h2
          id="support"
          className="site-display mt-5 max-w-5xl text-balance text-4xl sm:text-5xl"
        >
          {supportContent.heading}
        </h2>

        <ol className="mt-12 grid gap-px border bg-border sm:grid-cols-2">
          {supportContent.cards.map(
            ({ platform, action, detail, cta, href }, index) => {
              const Mark = marks[platform];

              return (
                <li key={action} className="bg-background">
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex h-full min-h-56 touch-manipulation flex-col overflow-hidden p-7 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    {/* Both platform marks are achromatic, so the watermark is the
                    page's own foreground held far back until the card is read. */}
                    <Mark className="-right-8 -bottom-10 pointer-events-none absolute size-48 text-foreground opacity-[0.05] transition-[transform,opacity] duration-500 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:scale-105 group-hover:opacity-[0.16] group-focus-visible:opacity-[0.16]" />

                    <span
                      aria-hidden="true"
                      className="site-data relative text-muted-foreground"
                    >
                      {`0${index + 1}`}
                    </span>

                    <span className="relative mt-8 block">
                      <span className="block font-medium text-xl">
                        {action}
                      </span>
                      <span className="mt-2 block max-w-xs text-muted-foreground text-sm leading-6">
                        {detail}
                      </span>
                      <span className="site-data mt-6 flex items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
                        {cta}
                        <WaveArrow className="h-3 w-9 transition-transform duration-300 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1" />
                      </span>
                    </span>
                  </a>
                </li>
              );
            },
          )}
        </ol>
      </Reveal>
      <SectionMarker index={6} label={supportContent.eyebrow} />
    </section>
  );
}

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Renders the landing page in its numbered section order. */
export default function HomePage() {
  return (
    <main id="main" className="relative">
      {/* One field for every section, so the window is never cut at a section
          edge. The header and footer sit outside it. */}
      <RegistrationField />

      <Hero />
      <Anatomy />
      <Workbench />
      <LocalFirst />
      <FAQ />
      <Support />
    </main>
  );
}
