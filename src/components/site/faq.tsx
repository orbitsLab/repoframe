'use client';

import { Reveal } from '@/components/site/reveal';
import { SectionMarker } from '@/components/site/sectionMarker';
import { UnderlineLink } from '@/components/ui/underline-link';
import { supportContent } from '@/content/support';
import { githubUrl } from '@/lib/site';

const faqCategories = [
  {
    category: 'General & Overview',
    items: [
      {
        question: 'How does Repo Frame fetch repository data?',
        answer:
          "Your browser calls GitHub's public REST API directly, with no server in between. Paste a repository URL or an owner/repo shorthand. The name, description, topics, stars, forks, watchers and licence are read up front; the language split, contributors, open issues, pull requests and latest release are read only when a template asks for them. Responses are cached in your browser for 30 minutes.",
      },
      {
        question: 'Do I need a GitHub account or API token?',
        answer:
          'No. Repo Frame only reads what GitHub already publishes, so there is nothing to sign in to and no token to paste. GitHub does limit how often it answers one address: 60 requests an hour. Your browser keeps each repository for 30 minutes before asking again, which holds normal editing well inside that, and if you reach the limit anyway Repo Frame tells you when it resets.',
      },
      {
        question: 'Does Repo Frame support private repositories?',
        answer:
          'No. Repo Frame works with public repositories only. It reads a repository the same way any visitor without access does, so a private one comes back as not found.',
      },
    ],
  },
  {
    category: 'Templates & Customization',
    items: [
      {
        question: 'What templates and export formats are supported?',
        answer:
          'This build ships 26 templates, among them Minimal, Split, Bento, Release, Cover, Terminal, Almanac, Gauge and Marquee. Each renders in four aspect ratios: 16:9 (1200×675), 1:1, 4:5 and 9:16. Cards export as PNG, and as WebP or JPEG where your browser supports them, at 0.5× to 4× scale, so a 16:9 card can leave at 4800×2700.',
      },
      {
        question: 'Can I customize colors, fonts, and visible metrics?',
        answer:
          'Yes. Every template carries its own palettes as chips you apply in one click, among them Slate, Carbon, Cobalt, Signal and Acid, and every colour can be set by hand instead. The settings panel also controls the typeface, which metrics appear (stars, forks, language split, contributors, licence, latest release, topics), and layout details such as spacing, radius and border weight. Each template declares its own controls, so the panel changes with the template.',
      },
      {
        question:
          "How do I set the exported card as my repository's social preview image?",
        answer:
          'Export the card as a PNG, then open your repository on GitHub and go to Settings → General → Social preview to upload it. You can also commit it to the repository (say, .github/assets/og-card.png) and feature it in your README.',
      },
    ],
  },
  {
    category: 'Privacy & Open Source',
    items: [
      {
        question: 'Is any data stored or uploaded to external servers?',
        answer:
          'None. There is no backend, no database, no analytics and no upload. GitHub is the only host your browser talks to, and it is your browser that talks to it. Everything you make stays on your device: projects and cached repository data in IndexedDB, small preferences such as theme and aspect ratio in localStorage.',
      },
      {
        question: 'Is Repo Frame free and open source?',
        answer:
          'Yes. Repo Frame is free and open source under the Apache License 2.0, built by Orbits Lab. Read the source, host your own instance, or contribute a template on GitHub.',
      },
    ],
  },
] as const;

export default function FAQ() {
  return (
    <section
      data-snap
      className="relative flex min-h-[calc(100svh-var(--header-height))] items-center border-b pb-20"
      aria-labelledby="faq"
    >
      <Reveal className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-24">
        <div>
          <p className="site-eyebrow text-muted-foreground">FAQ</p>
          <h2 id="faq" className="mt-4">
            <UnderlineLink
              href="#faq"
              className="font-semibold text-3xl tracking-tight sm:text-4xl lg:text-5xl"
            >
              Your questions answered.
            </UnderlineLink>
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground text-sm leading-6">
            Everything you need to know about Repo Frame: how repository data is
            read, what the templates and exports can do, and how your work stays
            on your device.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {faqCategories.map((group) => (
            <div key={group.category} className="border-t pt-8">
              <h3 className="site-eyebrow text-muted-foreground mb-4">
                {group.category}
              </h3>
              <div className="divide-y border-b">
                {group.items.map((item) => (
                  <details
                    key={item.question}
                    className="group cursor-pointer py-4 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <summary className="flex items-center justify-between text-left font-medium text-base sm:text-lg text-foreground hover:text-muted-foreground transition-colors select-none">
                      <span className="pr-6">{item.question}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45 group-open:text-foreground"
                        aria-hidden="true"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M12 5l0 14" />
                        <path d="M5 12l14 0" />
                      </svg>
                    </summary>
                    <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      <p>{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t pt-10">
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              Still have questions?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Can't find the answer you're looking for? Reach out to the Orbits
              Lab team or open an issue on GitHub.
            </p>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="site-data inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 shrink-0"
          >
            Ask on GitHub
          </a>
        </div>
      </Reveal>

      <SectionMarker index={5} label="FAQ" next={supportContent.eyebrow} />
    </section>
  );
}
