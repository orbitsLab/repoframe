'use client';

import { Check, ChevronLeft } from 'lucide-react';

import { Preview } from '@/components/editor/preview';
import { Button } from '@/components/ui/button';
import { buildEditorScene, settingsForTemplate } from '@/editor/scene';
import { measureText } from '@/lib/renderer/measure';
import { templates } from '@/lib/templates/registry';
import { cn } from '@/lib/utils';
import type { ProjectData } from '@/types/data/project';
import type { AspectRatio } from '@/types/template';

const thumbnailRatio: AspectRatio = '16:9';

type TemplatePickerProps = {
  data: ProjectData;
  settings: Record<string, unknown>;
  selectedId: string;
  onBack(): void;
  onSelect(templateId: string): void;
};

/**
 * Renders selectable template previews using the current repository data.
 *
 * @param props - Preview data, current settings, selection, and navigation callbacks.
 */
function TemplatePicker({
  data,
  settings,
  selectedId,
  onBack,
  onSelect,
}: TemplatePickerProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="Back to content settings"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Templates
        </h2>
      </div>
      <div
        className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto p-3"
        role="radiogroup"
        aria-label="Card template"
      >
        {templates.map((template) => {
          const selected = template.id === selectedId;
          const previewSettings = settingsForTemplate(template, settings);
          const scene = buildEditorScene(
            data,
            template.id,
            thumbnailRatio,
            previewSettings,
            measureText,
          );

          return (
            <label
              key={template.id}
              className={cn(
                'block w-full min-w-0 cursor-pointer overflow-hidden rounded-lg border bg-background p-2 shadow-xs outline-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                selected
                  ? 'border-foreground bg-accent'
                  : 'hover:border-muted-foreground/50',
              )}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selected}
                onChange={() => onSelect(template.id)}
                className="sr-only"
              />
              <div className="aspect-video w-full min-w-0 overflow-hidden rounded-md bg-muted">
                <Preview
                  scene={scene}
                  label={`${template.name} template preview for ${data.repository.fullName}`}
                  compact
                />
              </div>
              <span className="mt-2 flex min-w-0 items-center justify-between gap-3 px-1">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {template.name}
                  </span>
                  <span className="line-clamp-2 block text-xs leading-4 text-muted-foreground">
                    {template.description}
                  </span>
                </span>
                {selected ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export { TemplatePicker };
