import type { Metadata } from 'next';

import { EditorLoader } from '@/components/editor/editorLoader';

export const metadata: Metadata = {
  title: 'Editor',
  description: 'Customize and export a social card for a GitHub repository.',
};

export default async function AppPage({ searchParams }: PageProps<'/app'>) {
  const params = await searchParams;
  const repo = typeof params.repo === 'string' ? params.repo : undefined;
  const templateId =
    typeof params.template === 'string' ? params.template : undefined;

  return <EditorLoader repo={repo} templateId={templateId} />;
}
