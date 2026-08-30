'use client';

import {
  hexPattern,
  luminance,
  resolveTheme,
} from '@/lib/templates/shared/tokens';
import { cn } from '@/lib/utils';

import type { ColorPreset } from '@/types/template';

type ColorPresetsProps = {
  presets: ColorPreset[];
  settings: Record<string, unknown>;
  onApply(settings: Record<string, string>): void;
};

/**
 * Renders the palettes a template ships with as one-click theme chips.
 *
 * The active chip is derived from the current settings rather than held
 * locally, so editing a colour by hand releases the chip and applying a
 * palette moves the colour fields with it.
 *
 * @param props - Template palettes, current settings, and apply callback.
 */
function ColorPresets({ presets, settings, onApply }: ColorPresetsProps) {
  const active = presets.find((preset) => presetMatches(preset, settings));

  return (
    <fieldset>
      <legend className="editor-label mb-2 block text-foreground">
        Palette
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={cn(
              'flex h-9 min-w-0 items-center gap-1.5 border border-muted-foreground/40 px-1.5 outline-none transition-colors hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring',
              preset === active && 'border-foreground bg-accent',
            )}
            onClick={() => onApply(preset.settings)}
            aria-pressed={preset === active}
          >
            <span className="flex h-4 w-6 shrink-0 border border-muted-foreground/40">
              {presetColors(preset).map(([key, color]) => (
                <span
                  key={key}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            <span className="truncate text-[11px] font-medium">
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Collects the palette colours a template offers for one setting key.
 *
 * A palette that leaves the key derived contributes the ink it resolves to,
 * one per pole, because every light ground lands on the same near-black. The
 * accents follow it, since an accent doubles as a coloured ink.
 *
 * @param presets - Palettes shipped by the active template.
 * @param key - Colour setting key the swatches belong to.
 * @returns Up to five unique hex colours, one row like every other field.
 */
function presetSwatches(presets: ColorPreset[], key: string) {
  const colors = new Set<string>();
  const poles = new Set<boolean>();

  for (const preset of presets) {
    const color = preset.settings[key];

    if (color !== undefined && hexPattern.test(color)) {
      colors.add(color.toLowerCase());
      continue;
    }

    const { foreground } = resolveTheme(
      preset.settings.backgroundColor,
      preset.settings.accentColor,
    );
    const isLight = luminance(foreground) > 0.5;

    if (!poles.has(isLight)) {
      poles.add(isLight);
      colors.add(foreground.toLowerCase());
    }
  }

  if (poles.size > 0) {
    for (const preset of presets) {
      colors.add(preset.settings.accentColor.toLowerCase());
    }
  }

  return [...colors].slice(0, 5);
}

/** @returns The palette's hex colours by setting key, skipping derived values. */
function presetColors(preset: ColorPreset) {
  return Object.entries(preset.settings).filter(([, color]) =>
    hexPattern.test(color),
  );
}

/** @returns Whether every colour a palette sets is the current setting. */
function presetMatches(preset: ColorPreset, settings: Record<string, unknown>) {
  return Object.entries(preset.settings).every(
    ([key, color]) => settings[key] === color,
  );
}

export { ColorPresets, presetSwatches };
