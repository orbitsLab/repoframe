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
          'Repo Frame queries GitHub\'s public REST and GraphQL APIs directly from your browser. Simply paste any GitHub URL or "owner/repo" path to fetch repository metadata, star counts, fork counts, language breakdown, open issues, pull requests, and licence details.',
      },
      {
        question: 'Do I need a GitHub account or API token?',
        answer:
          "No account or token is required for standard usage. GitHub allows 60 unauthenticated API requests per hour per IP. If you generate cards heavily or run into rate limits, you can optionally supply a Personal Access Token (PAT), which is stored strictly in your browser's local storage.",
      },
      {
        question: 'Does Repo Frame support private repositories?',
        answer:
          'Repo Frame is primarily designed for public GitHub repositories. Because data processing is 100% client-side without intermediate servers, accessing private repositories would require elevated token permissions, which we leave optional to ensure complete privacy and security.',
      },
    ],
  },
  {
    category: 'Templates & Customization',
    items: [
      {
        question: 'What templates and export formats are supported?',
        answer:
          'Repo Frame includes multiple hand-crafted compositions—including Cover, Release, Marquee, Almanac, Gauge, Minimal, and Terminal. Cards can be exported as high-resolution PNG or SVG images rendered at the standard 1200×675 (16:9) aspect ratio, ideal for OpenGraph preview images, Twitter posts, or README headers.',
      },
      {
        question: 'Can I customize colors, fonts, and visible metrics?',
        answer:
          'Yes. The Workbench gives you full control over color presets (Ink, Terminal, Paper, Poster, Default), custom accent colors, metric visibility (stars, forks, open PRs, language breakdown, release tags), and typographic layout density.',
      },
      {
        question:
          "How do I set the exported card as my repository's social preview image?",
        answer:
          'Once you export your card as a PNG image, navigate to your repository on GitHub, go to Settings → General → Social preview, and upload the image. You can also save it in your repository root (such as .github/assets/og-card.png) and feature it in your README.',
      },
    ],
  },
  {
    category: 'Privacy & Open Source',
    items: [
      {
        question: 'Is any data stored or uploaded to external servers?',
        answer:
          'Zero. Repo Frame is built on a 100% local-first architecture. There are no backend databases, tracking scripts, server-side processing, or file uploads. Everything—from API fetching to canvas rendering and image export—happens entirely within your web browser.',
      },
      {
        question: 'Is Repo Frame free and open source?',
        answer:
          'Yes. Repo Frame is completely free and open source under the MIT License by OrbitsLab. You can inspect the source code, self-host your own instance, or contribute new templates and features on GitHub.',
      },
    ],
  },
] as const;

export default function FAQ() {
  return (
    <section
      data-snap
      className="relative flex min-h-[calc(100svh-var(--header-height))] items-center border-b pb-20"
      aria-labelledby="faq-heading"
    >
      <Reveal className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-24">
        <div>
          <p className="site-eyebrow text-muted-foreground">FAQ</p>
          <div className="mt-4">
            <UnderlineLink
              href="#faq"
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight"
            >
              Your questions answered.
            </UnderlineLink>
          </div>
          <p className="mt-4 max-w-xl text-muted-foreground text-sm leading-6">
            Everything you need to know about Repo Frame, how repository data is
            fetched, card templates, and our local-first guarantee.
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
                    <div className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
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
              Can't find the answer you're looking for? Reach out to the
              OrbitsLab team or open an issue on GitHub.
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
