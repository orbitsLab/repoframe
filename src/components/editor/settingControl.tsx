'use client';

import { Check } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { ColorPicker } from '@/components/ui/color-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { autoColor } from '@/lib/templates/shared/tokens';
import { cn } from '@/lib/utils';

import type { SettingField } from '@/types/template';

type SettingControlProps = {
  field: SettingField;
  value: unknown;
  onChange(value: unknown): void;
};

/** Shared classes for a selectable chip in an option group. */
const chip =
  'flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-accent/50 has-checked:border-foreground/20 has-checked:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';

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
    // A narrowed select keeps its dropdown as its option list grows and
    // shrinks, rather than switching between two control styles.
    if (field.options.length <= 4 && !field.optionsFrom) {
      return (
        <fieldset>
          <ControlLabel as="legend">{field.label}</ControlLabel>
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => (
              <label key={option.value} className={cn(chip, 'flex-1 basis-24')}>
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

    return <SelectControl field={field} value={value} onChange={onChange} />;
  }

  if (field.type === 'toggle') {
    return (
      <label className="flex min-h-9 cursor-pointer items-center justify-between gap-4">
        <span className="editor-label">{field.label}</span>
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="relative h-5 w-9 shrink-0 rounded-full border border-transparent bg-muted-foreground/75 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-3.5 after:rounded-full after:bg-background after:shadow-sm after:transition-transform peer-checked:border-foreground peer-checked:bg-foreground peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
      </label>
    );
  }

  if (field.type === 'text') {
    return (
      <div>
        <ControlLabel htmlFor={id}>{field.label}</ControlLabel>
        <input
          id={id}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
        />
      </div>
    );
  }

  if (field.type === 'range') {
    const number = typeof value === 'number' ? value : field.min;
    const fill = ((number - field.min) / (field.max - field.min)) * 100;

    return (
      <div>
        <ControlLabel htmlFor={id}>
          {field.label}
          <output className="editor-value">
            {number}
            {field.unit}
          </output>
        </ControlLabel>
        <input
          id={id}
          type="range"
          className="editor-range w-full"
          style={{ '--fill': `${fill}%` } as CSSProperties}
          min={field.min}
          max={field.max}
          step={field.step}
          value={number}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    );
  }

  const selected = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

  return (
    <fieldset>
      <ControlLabel as="legend">{field.label}</ControlLabel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2">
        {field.options.map((option) => (
          <CheckChip
            key={option.value}
            label={option.label}
            checked={selected.includes(option.value)}
            onChange={(checked) =>
              onChange(
                checked
                  ? [...selected, option.value]
                  : selected.filter((item) => item !== option.value),
              )
            }
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Renders a labelled checkbox styled as a chip.
 *
 * @param props - Chip text, checked state, and change callback.
 */
function CheckChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange(checked: boolean): void;
}) {
  return (
    <label className={cn(chip, 'justify-start')}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="grid size-4 shrink-0 place-items-center rounded border border-muted-foreground/75 bg-background text-background peer-checked:border-foreground peer-checked:bg-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        <Check className="size-3" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </label>
  );
}

/**
 * Control copy for metric values, kept apart from the text each template
 * draws on the card so lowercase card styling stays out of the panel.
 */
const metricLabels: Record<string, string> = {
  stars: 'Stars',
  forks: 'Forks',
  watchers: 'Watchers',
  issues: 'Issues',
  pullRequests: 'PRs',
};

/**
 * Renders every content inclusion the template offers as one chip group.
 *
 * Merges the multi-select options with the section's booleans so switching
 * template grows or shrinks a single group instead of two control styles.
 *
 * @param props - Content fields, current settings, and change callback.
 */
function VisibleContentControl({
  fields,
  settings,
  onChange,
}: {
  fields: SettingField[];
  settings: Record<string, unknown>;
  onChange(key: string, value: unknown): void;
}) {
  const multiSelect = fields.find((field) => field.type === 'multi-select');
  const toggles = fields.filter((field) => field.type === 'toggle');
  const selected = Array.isArray(settings[multiSelect?.key ?? ''])
    ? (settings[multiSelect?.key ?? ''] as unknown[]).filter(
        (item): item is string => typeof item === 'string',
      )
    : [];

  return (
    <fieldset>
      <ControlLabel as="legend">
        {multiSelect?.label ?? 'Visible content'}
      </ControlLabel>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2">
        {multiSelect?.type === 'multi-select'
          ? multiSelect.options.map((option) => (
              <CheckChip
                key={option.value}
                label={metricLabels[option.value] ?? option.label}
                checked={selected.includes(option.value)}
                onChange={(checked) =>
                  onChange(
                    multiSelect.key,
                    checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value),
                  )
                }
              />
            ))
          : null}
        {toggles.map((field) => (
          <CheckChip
            key={field.key}
            label={field.label}
            checked={settings[field.key] === true}
            onChange={(checked) => onChange(field.key, checked)}
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Renders the label line above a control, with any trailing readout.
 *
 * @param props - Label content, and either the controlled id or legend usage.
 */
function ControlLabel({
  as,
  htmlFor,
  children,
}: {
  as?: 'legend';
  htmlFor?: string;
  children: ReactNode;
}) {
  const className =
    'editor-label mb-2 flex items-center justify-between gap-3 text-foreground';

  if (as === 'legend') {
    return <legend className={className}>{children}</legend>;
  }

  return (
    <label className={className} htmlFor={htmlFor}>
      {children}
    </label>
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
  textColor: ['#0b0b0f', '#ffffff', '#e6edf3', '#b4471f', '#4cc9f0'],
};

/**
 * Renders a dropdown for a setting with more options than fit as chips.
 *
 * Typography options store a CSS family name, so each one is set in the face
 * it selects.
 *
 * @param props - Select setting schema, current value, and change callback.
 */
function SelectControl({ field, value, onChange }: SettingControlProps) {
  if (field.type !== 'select') {
    return null;
  }

  const id = `setting-${field.key}`;
  const preview = field.section === 'typography';
  const selected = typeof value === 'string' ? value : '';

  return (
    <div>
      <span
        className="editor-label mb-2 block text-foreground"
        id={`${id}-label`}
      >
        {field.label}
      </span>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger
          aria-labelledby={`${id}-label`}
          style={preview ? { fontFamily: selected } : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              style={preview ? { fontFamily: option.value } : undefined}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Renders a color picker and any presets registered for the setting.
 *
 * @param props - Color setting schema, current value, and change callback.
 */
function ColorControl({ field, value, onChange }: SettingControlProps) {
  const id = `setting-${field.key}`;
  const isHex = typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const allowAuto = field.type === 'color' && field.allowAuto === true;
  const isAuto = allowAuto && !isHex;
  const color = isHex ? (value as string).toLowerCase() : '#000000';
  const presets = swatches[field.key] ?? [];

  return (
    <div>
      <span
        className="editor-label mb-2 block text-foreground"
        id={`${id}-label`}
      >
        {field.label}
      </span>
      <ColorPicker
        color={color}
        onChange={onChange}
        labelledBy={`${id}-label`}
        auto={isAuto}
      />
      {allowAuto || presets.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {allowAuto ? (
            <button
              type="button"
              className={cn(
                'flex h-6 items-center rounded-full border border-muted-foreground/40 px-2.5 text-[10px] font-medium shadow-xs outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring',
                isAuto && 'border-foreground bg-accent',
              )}
              onClick={() => onChange(autoColor)}
              aria-pressed={isAuto}
            >
              Auto
            </button>
          ) : null}
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={cn(
                'size-6 rounded-full border border-muted-foreground/40 shadow-xs outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring',
                !isAuto &&
                  preset === color &&
                  'ring-1 ring-foreground ring-offset-2 ring-offset-sidebar',
              )}
              style={{ backgroundColor: preset }}
              onClick={() => onChange(preset)}
              aria-label={`Use ${preset}`}
              aria-pressed={!isAuto && preset === color}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { SettingControl, VisibleContentControl };
