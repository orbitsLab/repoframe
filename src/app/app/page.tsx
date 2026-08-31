import type { Metadata } from 'next';

import { EditorLoader } from '@/components/editor/editorLoader';

export const metadata: Metadata = {
  title: 'Editor',
  description:
    'Paste a GitHub repository URL, pick a template, and export its social card as a PNG. No account, nothing uploaded.',
  // Every ?repo= and ?template= combination renders the same tool, so they all
  // collapse onto one address rather than crawling as separate pages.
  alternates: { canonical: '/app' },
};

export default async function AppPage({ searchParams }: PageProps<'/app'>) {
  const params = await searchParams;
  const repo = typeof params.repo === 'string' ? params.repo : undefined;
  const templateId =
    typeof params.template === 'string' ? params.template : undefined;

  return <EditorLoader repo={repo} templateId={templateId} />;
}
