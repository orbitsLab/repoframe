import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SampleCard } from '@/components/site/sampleCard';
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

  const dataLabels = template
    .requiredData(template.defaultSettings)
    .map(formatDataPath);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <SampleCard templateId={template.id} className="shadow-lg" />
        <div>
          <p className="site-eyebrow text-muted-foreground">
            {template.category} template
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {template.name}
          </h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            {template.description}
          </p>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-sm font-semibold">Included data</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              {dataLabels.map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <Check
                    className="size-4 text-foreground"
                    aria-hidden="true"
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-sm font-semibold">Supported ratios</h2>
            <p className="mt-3 font-mono text-sm text-muted-foreground">
              {template.supportedRatios.join(' · ')}
            </p>
          </div>

          <Button asChild size="lg" className="mt-8 w-full">
            <a href={`/app?template=${template.id}`}>Use this template</a>
          </Button>
        </div>
      </div>
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
