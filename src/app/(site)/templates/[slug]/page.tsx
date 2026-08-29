import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CardFrame } from '@/components/site/cardFrame';
import { Reveal } from '@/components/site/reveal';
import { fullMetrics, SampleCard } from '@/components/site/sampleCard';
import { Button } from '@/components/ui/button';
import { getTemplate, templates } from '@/lib/templates/registry';

type TemplatePageProps = PageProps<'/templates/[slug]'>;

export function generateStaticParams() {
  return templates.map((template) => ({ slug: template.id }));
}

export async function generateMetadata({
  params,
}: TemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplate(slug);

  return template
    ? {
        title: `${template.name} template`,
        description: template.description,
      }
    : {};
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) {
    notFound();
  }

  const index = templates.findIndex((entry) => entry.id === template.id);
  const readings = template
    .requiredData(template.defaultSettings)
    .map((path) => [formatDataPath(path), path] as const);

  return (
    <main id="main">
      <section className="border-b" aria-labelledby="template-heading">
        <Reveal exit={false} className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="site-data">
            <Link
              href="/templates"
              className="outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true">↑</span> Template gallery
            </Link>{' '}
            — {String(index + 1).padStart(3, '0')}
          </p>

          <div className="mt-10 grid gap-12 lg:grid-cols-[7fr_5fr] lg:gap-16">
            <div>
              <p className="site-eyebrow text-muted-foreground">
                {template.category} template
              </p>
              <h1
                id="template-heading"
                className="site-display mt-5 text-4xl sm:text-6xl"
              >
                {template.name}
              </h1>
              <p className="mt-7 max-w-md text-muted-foreground text-base leading-7">
                {template.description}
              </p>
            </div>

            <div className="lg:self-end">
              <Button asChild size="lg" className="w-full">
                <a href={`/app?template=${template.id}`}>Use this template</a>
              </Button>
              <p className="mt-4 text-muted-foreground text-xs">
                Opens the editor with this template selected. Paste a repository
                and it redraws with your own data.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-b" aria-label="Specimen">
        <Reveal
          exit={false}
          className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[7fr_5fr] lg:gap-16 sm:py-24"
        >
          <CardFrame
            width={1200}
            height={675}
            caption={`Template ${template.name} · 16:9 · PNG`}
          >
            <SampleCard
              templateId={template.id}
              settings={{ metrics: fullMetrics }}
            />
          </CardFrame>

          <div>
            <p className="site-eyebrow text-muted-foreground">Specification</p>
            <dl className="mt-6 border-t">
              {readings.map(([label, path]) => (
                <div
                  key={path}
                  className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-6"
                >
                  <dt className="min-w-0 font-medium text-sm">{label}</dt>
                  <dd
                    className="site-data min-w-0 break-words normal-case"
                    translate="no"
                  >
                    {path}
                  </dd>
                </div>
              ))}
              <div className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-6">
                <dt className="min-w-0 font-medium text-sm">
                  Supported ratios
                </dt>
                <dd className="site-data min-w-0" translate="no">
                  {template.supportedRatios.join(' · ')}
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function formatDataPath(path: string) {
  const labels: Record<string, string> = {
    repository: 'Repository details and core metrics',
    languages: 'Repository languages',
    contributors: 'Top contributors',
    latestRelease: 'Latest stable release',
    'metrics.issues': 'Open issue count',
    'metrics.pullRequests': 'Open pull request count',
  };

  return labels[path] ?? path;
}
