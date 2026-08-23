'use client';

import dynamic from 'next/dynamic';

import { EditorSkeleton } from '@/components/editor/editorSkeleton';

const Editor = dynamic(
  () => import('@/components/editor/editor').then((module) => module.Editor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

type EditorLoaderProps = {
  repo?: string;
  templateId?: string;
};

/**
 * Loads the browser-only editor without server-side rendering.
 *
 * @param props - Optional repository and template values from the application URL.
 */
function EditorLoader(props: EditorLoaderProps) {
  return <Editor {...props} />;
}

export { EditorLoader };
