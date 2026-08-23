import { describe, expect, it } from 'vitest';

import { templates } from '@/lib/templates/registry';
import type { ProjectDataPath } from '@/types/data/path';

const validPaths = new Set<ProjectDataPath>([
  'repository',
  'owner',
  'metrics',
  'metrics.issues',
  'metrics.pullRequests',
  'languages',
  'topics',
  'contributors',
  'latestRelease',
]);

describe('template registry', () => {
  it('contains unique template ids', () => {
    const ids = templates.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(templates)('$id has valid defaults and data paths', (template) => {
    expect(template.supportedRatios.length).toBeGreaterThan(0);

    for (const field of template.settingsSchema) {
      expect(template.defaultSettings).toHaveProperty(field.key);
      expect(
        settingMatchesField(template.defaultSettings[field.key], field),
      ).toBe(true);
    }

    const paths = template.requiredData(template.defaultSettings);
    expect(paths.every((path) => validPaths.has(path))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('repository');
  });

  it.each(templates)('$id removes disabled optional data', (template) => {
    const settings = Object.fromEntries(
      template.settingsSchema.map((field) => {
        if (field.type === 'toggle' && field.section === 'content') {
          return [field.key, false];
        }

        if (field.type === 'multi-select' && field.section === 'content') {
          return [field.key, []];
        }

        return [field.key, template.defaultSettings[field.key]];
      }),
    );

    expect(template.requiredData(settings)).toEqual(['repository']);
  });
});

function settingMatchesField(
  value: unknown,
  field: (typeof templates)[number]['settingsSchema'][number],
) {
  if (field.type === 'toggle') {
    return typeof value === 'boolean';
  }

  if (field.type === 'range') {
    return (
      typeof value === 'number' && value >= field.min && value <= field.max
    );
  }

  if (field.type === 'multi-select') {
    return (
      Array.isArray(value) &&
      value.every(
        (item) =>
          typeof item === 'string' &&
          field.options.some((option) => option.value === item),
      )
    );
  }

  if (field.type === 'select') {
    return (
      typeof value === 'string' &&
      field.options.some((option) => option.value === value)
    );
  }

  return typeof value === 'string';
}
