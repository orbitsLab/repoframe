'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { getActiveTemplate } from '@/editor/scene';
import { fontsReady } from '@/lib/renderer/fonts';
import { measureText } from '@/lib/renderer/measure';
import { sampleProject } from '@/lib/sampleProject';
import { mergeSettings } from '@/lib/templates/shared/settings';
import { cn } from '@/lib/utils';
import type { ProjectData } from '@/types/data/project';
import type { Scene } from '@/types/scene';
import type { AspectRatio } from '@/types/template';

const Preview = dynamic(
  () => import('@/components/editor/preview').then((module) => module.Preview),
  { ssr: false },
);

/** Every metric a template can draw, so a public card reads as a full spec. */
const fullMetrics = ['stars', 'forks', 'watchers', 'issues', 'pullRequests'];

type SampleCardProps = {
  templateId: string;
  /** Repository the card is built from. Defaults to the sample project. */
  data?: ProjectData;
  /** Setting values applied over the template defaults. */
  settings?: Record<string, unknown>;
  ratio?: AspectRatio;
  className?: string;
};

/**
 * Renders a template's real scene from committed repository data.
 *
 * @param props - Template identifier, repository data, setting overrides, ratio, and classes.
 */
function SampleCard({
  templateId,
  data = sampleProject,
  settings,
  ratio = '16:9',
  className,
}: SampleCardProps) {
  const [scene, setScene] = useState<Scene>();
  // Effects compare dependencies by identity, so the overrides travel as a
  // primitive key instead of a fresh object on every render.
  const settingsKey = settings ? JSON.stringify(settings) : '';

  useEffect(() => {
    let cancelled = false;

    void fontsReady.then(() => {
      if (cancelled) {
        return;
      }

      const template = getActiveTemplate(templateId);
      const overrides = settingsKey
        ? (JSON.parse(settingsKey) as Record<string, unknown>)
        : {};

      setScene(
        template.build({
          data,
          ratio,
          settings: mergeSettings(template.defaultSettings, overrides),
          measure: measureText,
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [templateId, data, settingsKey, ratio]);

  return (
    <div
      className={cn(
        // The public frame is square-cornered, so the preview host drops the
        // rounding it carries inside the editor.
        'aspect-video overflow-hidden bg-current/5 [&>div]:rounded-none',
        ratio === '1:1' && 'aspect-square',
        ratio === '4:5' && 'aspect-4/5',
        ratio === '9:16' && 'aspect-9/16',
        className,
      )}
    >
      {scene ? (
        <Preview
          scene={scene}
          label={`${templateId} template preview`}
          compact
        />
      ) : (
        <div
          className="size-full animate-pulse bg-current/10"
          aria-label="Loading preview…"
          role="img"
        />
      )}
    </div>
  );
}

export { fullMetrics, SampleCard };
