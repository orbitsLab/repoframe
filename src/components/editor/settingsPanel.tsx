'use client';

import {
  CircleDot,
  type LucideIcon,
  Palette,
  PanelsTopLeft,
  Type,
} from 'lucide-react';
import { useState } from 'react';

import {
  SettingControl,
  VisibleContentControl,
} from '@/components/editor/settingControl';
import { cn } from '@/lib/utils';
import type { SettingField, SettingSection, Template } from '@/types/template';

type SettingsPanelProps = {
  template: Template;
  settings: Record<string, unknown>;
  placement: 'content' | 'design';
  onChange(key: string, value: unknown): void;
};

const designSections: SettingSection[] = [
  'theme',
  'typography',
  'cards',
  'icons',
];

const sectionLabels: Record<SettingSection, string> = {
  content: 'Content',
  theme: 'Theme',
  typography: 'Typography',
  cards: 'Cards',
  icons: 'Icons',
};

const sectionIcons: Record<SettingSection, LucideIcon> = {
  content: PanelsTopLeft,
  theme: Palette,
  typography: Type,
  cards: PanelsTopLeft,
  icons: CircleDot,
};

/**
 * Renders schema-driven content or design controls for the active template.
 *
 * @param props - Active template, settings, panel placement, and change callback.
 */
function SettingsPanel({
  template,
  settings,
  placement,
  onChange,
}: SettingsPanelProps) {
  const sections =
    placement === 'content'
      ? (['content'] as SettingSection[])
      : designSections.filter((section) =>
          template.settingsSchema.some((field) => field.section === section),
        );
  const [activeSection, setActiveSection] = useState<SettingSection>(
    sections[0] ?? 'theme',
  );
  const currentSection = sections.includes(activeSection)
    ? activeSection
    : sections[0];
  const fields = template.settingsSchema.filter(
    (field) => field.section === currentSection,
  );
  const inclusionFields = fields.filter(
    (field) => field.type === 'multi-select' || field.type === 'toggle',
  );
  const remainingFields = fields.filter(
    (field) => field.type !== 'multi-select' && field.type !== 'toggle',
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {placement === 'design' && sections.length > 1 ? (
        <div className="shrink-0 border-b p-3">
          <div
            className="grid grid-flow-col auto-cols-fr gap-0.5 rounded-md border bg-foreground/[0.04] p-0.5"
            role="tablist"
            aria-label="Design settings"
          >
            {sections.map((section) => {
              const Icon = sectionIcons[section];

              return (
                <button
                  key={section}
                  type="button"
                  role="tab"
                  aria-selected={currentSection === section}
                  className={cn(
                    'flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-[5px] px-1 text-[11px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    currentSection === section
                      ? 'bg-foreground/[0.1] text-foreground shadow-xs ring-1 ring-foreground/5'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setActiveSection(section)}
                >
                  {sections.length < 3 ? (
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                  <span className="truncate">{sectionLabels[section]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
        {inclusionFields.length > 0 ? (
          <VisibleContentControl
            fields={inclusionFields}
            settings={settings}
            onChange={onChange}
          />
        ) : null}
        {remainingFields.map((field) => {
          const control = narrowOptions(field, settings);

          return (
            <div key={field.key}>
              <SettingControl
                field={control.field}
                value={control.value}
                onChange={(value) => onChange(field.key, value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Narrows a select to the values chosen in the field it follows.
 *
 * Keeps the whole list when nothing is chosen, so the control never empties,
 * and shows the first remaining option when the stored value has just been
 * cleared, matching the value the template falls back to.
 *
 * @param field - Setting field about to be rendered.
 * @param settings - Current setting values.
 * @returns The field and the value its control should display.
 */
function narrowOptions(field: SettingField, settings: Record<string, unknown>) {
  const value = settings[field.key];

  if (field.type !== 'select' || !field.optionsFrom) {
    return { field, value };
  }

  const chosen = settings[field.optionsFrom];
  const options = Array.isArray(chosen)
    ? field.options.filter((option) => chosen.includes(option.value))
    : [];

  if (options.length === 0) {
    return { field, value };
  }

  return {
    field: { ...field, options },
    value: options.some((option) => option.value === value)
      ? value
      : options[0].value,
  };
}

export { SettingsPanel };
