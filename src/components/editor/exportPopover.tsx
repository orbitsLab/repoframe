'use client';

import { Download } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { RepositorySource } from '@/editor/store';
import {
  exportScene,
  type RasterFormat,
  type RasterScale,
  supportedFormats,
} from '@/lib/renderer/raster';
import type { Scene } from '@/types/scene';
import type { AspectRatio } from '@/types/template';

type ExportPopoverProps = {
  scene?: Scene;
  source?: RepositorySource;
  fullName: string;
  templateId: string;
  ratio: AspectRatio;
};

/**
 * Provides supported raster options and downloads the active scene.
 *
 * @param props - Scene data and naming values used for the export.
 */
function ExportPopover({
  scene,
  source,
  fullName,
  templateId,
  ratio,
}: ExportPopoverProps) {
  const [formats, setFormats] = useState<RasterFormat[]>(['png']);
  const [format, setFormat] = useState<RasterFormat>('png');
  const [scale, setScale] = useState<RasterScale>(2);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string>();
  const [owner, repo] = source
    ? [source.owner, source.repo]
    : fullName.split('/');
  const filename = `${owner ?? 'repository'}-${repo ?? 'card'}-${templateId}-${ratio.replace(':', 'x')}.${format}`;

  useEffect(() => {
    setFormats(supportedFormats());
  }, []);

  async function handleExport() {
    if (!scene) {
      return;
    }

    setIsExporting(true);
    setError(undefined);

    try {
      const blob = await exportScene(scene, format, scale);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button type="button" size="sm" disabled={!scene}>
          <Download aria-hidden="true" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none"
        >
          <div className="mb-4 border-b pb-3">
            <p className="text-sm font-semibold">Export card</p>
            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
              {filename}
            </p>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium">Format</legend>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((item) => (
                <label
                  key={item}
                  className="grid h-9 cursor-pointer place-items-center rounded-md border text-xs font-medium has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background"
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="export-format"
                    value={item}
                    checked={format === item}
                    onChange={() => setFormat(item)}
                  />
                  {item.toUpperCase()}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4 space-y-2">
            <legend className="text-xs font-medium">Size</legend>
            <div className="grid grid-cols-2 gap-2">
              {([1, 2] as RasterScale[]).map((item) => (
                <label
                  key={item}
                  className="grid h-9 cursor-pointer place-items-center rounded-md border text-xs font-medium has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background"
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="export-scale"
                    value={item}
                    checked={scale === item}
                    onChange={() => setScale(item)}
                  />
                  {item}× ·{' '}
                  {scene ? `${scene.width * item}×${scene.height * item}` : '—'}
                </label>
              ))}
            </div>
          </fieldset>

          {error ? (
            <p className="mt-3 text-xs text-destructive" aria-live="polite">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="mt-4 w-full"
            onClick={handleExport}
            disabled={isExporting || !scene}
          >
            {isExporting ? 'Exporting…' : `Download ${format.toUpperCase()}`}
          </Button>
          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { ExportPopover };
