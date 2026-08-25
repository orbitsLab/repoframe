'use client';

import { Check } from 'lucide-react';

import { ColorPicker } from '@/components/ui/color-picker';
import { cn } from '@/lib/utils';

import type { SettingField } from '@/types/template';

type SettingControlProps = {
  field: SettingField;
  value: unknown;
  onChange(value: unknown): void;
};

/**
 * Renders the control declared by a template setting field.
 *
 * @param props - Setting schema, current value, and change callback.
 */
function SettingControl({ field, value, onChange }: SettingControlProps) {
  const id = `setting-${field.key}`;

  if (field.type === 'color') {
    return <ColorControl field={field} value={value} onChange={onChange} />;
  }

  if (field.type === 'select') {
    if (field.options.length <= 4) {
      return (
        <fieldset className="space-y-2.5">
          <legend className="text-xs font-medium">{field.label}</legend>
          <div className="grid grid-cols-2 gap-2">
            {field.options.map((option) => (
              <label
                key={option.value}
                className="grid h-10 cursor-pointer place-items-center rounded-md border bg-background px-2 text-xs font-medium shadow-xs transition-colors hover:bg-accent/50 has-checked:border-foreground/20 has-checked:bg-accent"
              >
                <input
                  type="radio"
                  name={id}
                  className="sr-only"
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    return (
      <label className="block space-y-2 text-xs font-medium" htmlFor={id}>
        <span>{field.label}</span>
        <select
          id={id}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm font-normal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'toggle') {
    return (
      <label className="flex min-h-10 cursor-pointer items-center justify-between gap-4 text-xs font-medium">
        <span>{field.label}</span>
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="relative h-5 w-9 rounded-full border bg-muted shadow-inner transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-3.5 after:rounded-full after:bg-background after:shadow-xs after:transition-transform peer-checked:border-foreground peer-checked:bg-foreground peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
      </label>
    );
  }

  if (field.type === 'text') {
    return (
      <label className="block space-y-2 text-xs font-medium" htmlFor={id}>
        <span>{field.label}</span>
        <input
          id={id}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm font-normal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
        />
      </label>
    );
  }

  if (field.type === 'range') {
    const number = typeof value === 'number' ? value : field.min;
    return (
      <label className="block space-y-2 text-xs font-medium" htmlFor={id}>
        <span className="flex items-center justify-between gap-3">
          {field.label}
          <output className="font-mono text-xs text-muted-foreground">
            {number}
            {field.unit}
          </output>
        </span>
        <input
          id={id}
          type="range"
          className="editor-range w-full"
          min={field.min}
          max={field.max}
          step={field.step}
          value={number}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  }

  const selected = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium">{field.label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {field.options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-accent/50 has-checked:border-foreground/20 has-checked:bg-accent"
          >
            <input
              type="checkbox"
              className="peer sr-only"
              checked={selected.includes(option.value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, option.value]
                    : selected.filter((item) => item !== option.value),
                )
              }
            />
            <span className="grid size-4 shrink-0 place-items-center rounded border bg-background text-background peer-checked:border-foreground peer-checked:bg-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
              <Check className="size-3" aria-hidden="true" />
            </span>
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Preset colours drawn from the palettes the templates already ship with. */
const swatches: Record<string, string[]> = {
  backgroundColor: [
    '#f6f3ec',
    '#ffffff',
    '#ebe9ff',
    '#0b0d10',
    '#0d1117',
    '#101014',
  ],
  accentColor: [
    '#5b5bd6',
    '#6c5ce7',
    '#7ee787',
    '#58a6ff',
    '#f97316',
    '#38bdf8',
  ],
};

/**
 * Renders a color picker and any presets registered for the setting.
 *
 * @param props - Color setting schema, current value, and change callback.
 */
function ColorControl({ field, value, onChange }: SettingControlProps) {
  const id = `setting-${field.key}`;
  const color =
    typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
      ? value.toLowerCase()
      : '#000000';
  const presets = swatches[field.key] ?? [];

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium" id={`${id}-label`}>
        {field.label}
      </span>
      <ColorPicker
        color={color}
        onChange={onChange}
        labelledBy={`${id}-label`}
      />
      {presets.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={cn(
                'size-6 rounded-full border shadow-xs outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring',
                preset === color &&
                  'ring-2 ring-foreground ring-offset-2 ring-offset-sidebar',
              )}
              style={{ backgroundColor: preset }}
              onClick={() => onChange(preset)}
              aria-label={`Use ${preset}`}
              aria-pressed={preset === color}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { SettingControl };
