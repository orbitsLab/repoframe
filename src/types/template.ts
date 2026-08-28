import type { ProjectDataPath } from '@/types/data/path';
import type { ProjectData } from '@/types/data/project';
import type { Scene } from '@/types/scene';

/** Aspect ratios supported by RepoFrame templates and exports. */
type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16';

/** Categories used to group templates in the gallery. */
type TemplateCategory = 'minimal' | 'developer' | 'editorial';

/** Settings panel sections available to template controls. */
type SettingSection = 'content' | 'theme' | 'typography' | 'cards' | 'icons';

/** Label and stored value used by select controls. */
type SettingOption = { label: string; value: string };

type SettingFieldBase = {
  key: string;
  label: string;
  section: SettingSection;
  description?: string;
};

/** Closed setting union used to generate template controls. */
type SettingField =
  | (SettingFieldBase & { type: 'color'; allowAuto?: boolean })
  | (SettingFieldBase & {
      type: 'select';
      options: SettingOption[];
      /** Multi-select key whose chosen values narrow these options. */
      optionsFrom?: string;
    })
  | (SettingFieldBase & { type: 'toggle' })
  | (SettingFieldBase & {
      type: 'text';
      placeholder?: string;
      maxLength?: number;
    })
  | (SettingFieldBase & {
      type: 'range';
      min: number;
      max: number;
      step: number;
      unit?: string;
    })
  | (SettingFieldBase & {
      type: 'multi-select';
      options: SettingOption[];
    });

/** Typography and layout constraints used for text measurement. */
type MeasureTextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  maxWidth: number;
  lineHeight: number;
  maxLines?: number;
  letterSpacing?: number;
};

/** Wrapped text lines and their measured bounds. */
type MeasuredText = {
  lines: string[];
  width: number;
  height: number;
};

/** Measures text using the renderer's loaded fonts. */
type MeasureText = (text: string, style: MeasureTextStyle) => MeasuredText;

/** Project data, settings, ratio, and measurement tools passed to a template. */
type BuildInput = {
  data: ProjectData;
  settings: Record<string, unknown>;
  ratio: AspectRatio;
  measure: MeasureText;
};

/** Community-facing contract implemented by every RepoFrame template. */
type Template = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  supportedRatios: AspectRatio[];
  /** Returns the project data paths required by the resolved settings. */
  requiredData(settings: Record<string, unknown>): ProjectDataPath[];
  settingsSchema: SettingField[];
  defaultSettings: Record<string, unknown>;
  /** Builds a renderer-independent scene from project data and settings. */
  build(input: BuildInput): Scene;
};

export type {
  AspectRatio,
  BuildInput,
  MeasuredText,
  MeasureText,
  MeasureTextStyle,
  SettingField,
  SettingOption,
  SettingSection,
  Template,
  TemplateCategory,
};
