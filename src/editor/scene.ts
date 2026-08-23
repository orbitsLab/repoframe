import { getTemplate, templates } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';
import type { Scene } from '@/types/scene';
import type {
  AspectRatio,
  MeasureText,
  SettingField,
  Template,
} from '@/types/template';

/**
 * Resolves a template identifier with the first registered template as fallback.
 *
 * @param templateId - Template identifier to resolve.
 * @returns The requested template or the default template.
 */
function getActiveTemplate(templateId: string) {
  return getTemplate(templateId) ?? templates[0];
}

/**
 * Builds the editor preview scene with defaults applied to template settings.
 *
 * @param data - Normalized repository data rendered by the template.
 * @param templateId - Active template identifier.
 * @param ratio - Selected output aspect ratio.
 * @param settings - Current template setting overrides.
 * @param measure - Renderer text measurement function.
 * @returns A renderer-independent preview scene.
 */
function buildEditorScene(
  data: ProjectData,
  templateId: string,
  ratio: AspectRatio,
  settings: Record<string, unknown>,
  measure: MeasureText,
): Scene {
  const template = getActiveTemplate(templateId);
  return template.build({
    data,
    ratio,
    settings: { ...template.defaultSettings, ...settings },
    measure,
  });
}

/**
 * Carries compatible settings into a template and resets invalid values.
 *
 * @param template - Template receiving the settings.
 * @param current - Settings from the previously active template.
 * @returns Validated settings merged over the template defaults.
 */
function settingsForTemplate(
  template: Template,
  current: Record<string, unknown>,
) {
  const settings = { ...template.defaultSettings };

  for (const field of template.settingsSchema) {
    const value = current[field.key];
    if (settingMatchesField(value, field)) {
      settings[field.key] = value;
    }
  }

  return settings;
}

function settingMatchesField(value: unknown, field: SettingField) {
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

export { buildEditorScene, getActiveTemplate, settingsForTemplate };
