'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { getActiveTemplate } from '@/editor/scene';
import { fontsReady } from '@/lib/renderer/fonts';
import { measureText } from '@/lib/renderer/measure';
import { sampleProject } from '@/lib/sampleProject';
import { cn } from '@/lib/utils';
import type { Scene } from '@/types/scene';

const Preview = dynamic(
  () => import('@/components/editor/preview').then((module) => module.Preview),
  { ssr: false },
);

type SampleCardProps = {
  templateId: string;
  className?: string;
};

/**
 * Renders a template's real 16:9 scene using the committed sample project.
 *
 * @param props - Template identifier and optional class names.
 */
function SampleCard({ templateId, className }: SampleCardProps) {
  const [scene, setScene] = useState<Scene>();

  useEffect(() => {
    let cancelled = false;

    void fontsReady.then(() => {
      if (cancelled) {
        return;
      }

      const template = getActiveTemplate(templateId);
      setScene(
        template.build({
          data: sampleProject,
          ratio: '16:9',
          settings: template.defaultSettings,
          measure: measureText,
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  return (
    <div
      className={cn(
        'aspect-video overflow-hidden rounded-xl bg-muted',
        className,
      )}
    >
      {scene ? (
        <Preview
          scene={scene}
          label={`${templateId} template preview`}
          compact
        />
      ) : null}
    </div>
  );
}

export { SampleCard };
