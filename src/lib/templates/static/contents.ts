import { formatCount, formatDate } from '@/lib/templates/shared/format';
import { type Box, inset } from '@/lib/templates/shared/layout';
import {
  metricOptions,
  metricPaths,
  metricValues,
} from '@/lib/templates/shared/metrics';
import { textNode } from '@/lib/templates/shared/nodes';
import {
  booleanSetting,
  mergeSettings,
  stringArraySetting,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitText } from '@/lib/templates/shared/text';
import {
  autoColor,
  bandScale,
  displayFontOptions,
  monoFontOptions,
  mutedInk,
  palettes,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

/** Fixed row count, so node ids stay stable as entries are toggled. */
const rowSlots = 9;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showLanguage',
    label: 'Top language',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showLicense',
    label: 'Licence',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showRelease',
    label: 'Latest release',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'eyebrow',
    label: 'Eyebrow',
    section: 'content',
    type: 'text',
    maxLength: 40,
  },
  {
    key: 'backgroundColor',
    label: 'Page colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'accentColor',
    label: 'Accent colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'textColor',
    label: 'Text colour',
    section: 'theme',
    type: 'color',
    allowAuto: true,
  },
  {
    key: 'fontFamily',
    label: 'Typeface',
    section: 'typography',
    type: 'select',
    options: displayFontOptions,
  },
  {
    key: 'monoFamily',
    label: 'Number typeface',
    section: 'typography',
    type: 'select',
    options: monoFontOptions,
  },
];

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: palettes.ink.background,
  accentColor: '#1f3ad6',
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'watchers', 'issues'],
  showLanguage: true,
  showLicense: true,
  showRelease: true,
  eyebrow: 'CONTENTS',
  ...defaultColors,
  fontFamily: 'DM Sans Variable',
  monoFamily: 'JetBrains Mono Variable',
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'index',
    name: 'Index',
    settings: defaultColors,
  },
  {
    id: 'ledger',
    name: 'Ledger',
    settings: {
      backgroundColor: '#f7f5f0',
      accentColor: '#1a1a1a',
      textColor: autoColor,
    },
  },
  {
    id: 'rubric',
    name: 'Rubric',
    settings: {
      backgroundColor: '#f6f1ea',
      accentColor: '#b02a1e',
      textColor: autoColor,
    },
  },
  {
    id: 'verdigris',
    name: 'Verdigris',
    settings: {
      backgroundColor: '#eef2f0',
      accentColor: '#2c6e63',
      textColor: autoColor,
    },
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    settings: {
      backgroundColor: '#131417',
      accentColor: '#9db4ff',
      textColor: autoColor,
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showLanguage')) {
    paths.push('languages');
  }

  if (booleanSetting(resolved, 'showRelease')) {
    paths.push('latestRelease');
  }

  paths.push(...metricPaths(metrics));

  return paths;
}

function build(input: BuildInput): Scene {
  const settings = mergeSettings(defaultSettings, input.settings);
  const { width, height } = ratioSizes[input.ratio];
  const isWide = width / height > 1.35;
  const theme = resolveTheme(
    stringSetting(settings, 'backgroundColor'),
    stringSetting(settings, 'accentColor'),
    stringSetting(settings, 'textColor'),
  );
  const fontFamily = stringSetting(settings, 'fontFamily');
  const monoFamily = stringSetting(settings, 'monoFamily');
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 56 : 80);
  // Bands grow with the canvas so a tall card does not pool its extra height
  // into one gap above the list.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.sm : spacing.md) * scale;

  const eyebrowHeight = 28 * scale;
  const nameLines = isWide ? 1 : 2;
  const nameLineHeight = 0.98;
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 700,
    maxWidth: frame.width,
    minSize: 34,
    maxSize: isWide ? 74 : 96,
    maxLines: nameLines,
    lineHeight: nameLineHeight,
    letterSpacing: -2,
  });

  const bodySize = (isWide ? 20 : 24) * Math.min(1.25, scale);
  const bodyLineHeight = 1.4;
  const descriptionLines = 2;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: frame.width * (isWide ? 0.72 : 1),
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );

  const nameY = frame.y + eyebrowHeight + gutter;
  const descriptionY = nameY + name.height + gutter * 0.5;
  // The list takes everything the header leaves, so extra height opens the
  // rows rather than dropping a gap between the description and the first one.
  const listTop = descriptionY + description.height + gutter * 1.5;
  const list: Box = {
    x: frame.x,
    y: listTop,
    width: frame.width,
    height: Math.max(0, frame.y + frame.height - listTop),
  };

  const nodes: SceneNode[] = [
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: frame.width * 0.5,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily: monoFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 3,
    }),
    textNode('owner-login', {
      x: frame.x + frame.width * 0.5,
      y: frame.y,
      width: frame.width * 0.5,
      height: eyebrowHeight,
      text: `@${input.data.owner.login}`,
      fontFamily: monoFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      align: 'right',
      letterSpacing: 1,
    }),
    textNode('repo-name', {
      x: frame.x,
      y: nameY,
      width: frame.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: name.lines.length,
      overflow: 'clip',
      letterSpacing: -2,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: frame.width * (isWide ? 0.72 : 1),
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    ...rowNodes(
      input,
      entryList(input, settings),
      { fontFamily, monoFamily },
      theme,
      list,
    ),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

/** A single line of the contents list. */
type Entry = { label: string; value: string };

/**
 * Collects the entries the settings ask for, in reading order.
 *
 * The metric counts come first, then the facts that describe the project,
 * and the update date always closes the list.
 *
 * @param input - Project data and measurement tools.
 * @param settings - Resolved template settings.
 * @returns At most one entry per row slot.
 */
function entryList(input: BuildInput, settings: Record<string, unknown>) {
  const visibleMetrics = stringArraySetting(settings, 'metrics');
  const values = metricValues(input.data);
  const entries: Entry[] = metricOptions
    .filter((metric) => visibleMetrics.includes(metric.value))
    .map((metric) => ({
      label: metric.label,
      value: formatCount(values[metric.value]),
    }));

  if (booleanSetting(settings, 'showLanguage')) {
    entries.push({
      label: 'Language',
      value: input.data.languages[0]?.name ?? '—',
    });
  }

  if (booleanSetting(settings, 'showLicense')) {
    entries.push({
      label: 'Licence',
      value: input.data.repository.license?.spdxId ?? 'None',
    });
  }

  if (booleanSetting(settings, 'showRelease')) {
    entries.push({
      label: 'Release',
      value: input.data.latestRelease?.tagName ?? '—',
    });
  }

  entries.push({
    label: 'Updated',
    value: formatDate(input.data.repository.updatedAt),
  });

  return entries.slice(0, rowSlots);
}

/**
 * Draws the numbered list, one ruled row per entry.
 *
 * Rows share the list depth equally, so a taller canvas opens every row by
 * the same amount instead of leaving the last one adrift.
 *
 * @param input - Project data and measurement tools.
 * @param entries - Entries to place, in reading order.
 * @param fonts - Display and numbering typefaces.
 * @param theme - Resolved template colours.
 * @param area - Bounds the list fills.
 * @returns Every row slot, shown or hidden.
 */
function rowNodes(
  input: BuildInput,
  entries: Entry[],
  fonts: { fontFamily: string; monoFamily: string },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const rows = Math.max(1, entries.length);
  const rowHeight = area.height / rows;
  const padding = Math.min(spacing.sm, rowHeight * 0.16);
  const numberWidth = Math.min(96, area.width * 0.12);
  const valueWidth = area.width * 0.5;
  const valueSize = commonValueSize(
    input,
    entries,
    fonts.fontFamily,
    valueWidth,
    Math.max(20, rowHeight - padding * 2),
  );
  const labelSize = Math.min(valueSize * 0.5, 30);

  return Array.from({ length: rowSlots }, (_, index): SceneNode => {
    const entry = entries[index];
    // Hidden rows park on the last visible row so ids never move.
    const top = area.y + Math.min(index, rows - 1) * rowHeight;

    return {
      id: `entry-${index + 1}`,
      type: 'group',
      x: area.x,
      y: top,
      width: area.width,
      height: rowHeight,
      opacity: entry ? 1 : 0,
      children: [
        {
          id: `entry-${index + 1}-rule`,
          type: 'rect',
          x: 0,
          y: 0,
          width: area.width,
          height: index === 0 ? 3 : 2,
          fill: {
            kind: 'solid',
            color: index === 0 ? theme.foreground : theme.border,
          },
        },
        textNode(`entry-${index + 1}-number`, {
          x: 0,
          y: rowHeight - padding - labelSize * 1.2,
          width: numberWidth,
          height: labelSize * 1.2,
          text: String(index + 1).padStart(2, '0'),
          fontFamily: fonts.monoFamily,
          fontSize: labelSize * 0.8,
          fontWeight: 500,
          color: theme.accent,
          letterSpacing: 1,
        }),
        textNode(`entry-${index + 1}-label`, {
          x: numberWidth,
          y: rowHeight - padding - labelSize * 1.2,
          width: Math.max(1, area.width * 0.5 - numberWidth),
          height: labelSize * 1.2,
          text: (entry?.label ?? '').toUpperCase(),
          fontFamily: fonts.fontFamily,
          fontSize: labelSize,
          fontWeight: 500,
          color: theme.foreground,
          letterSpacing: 1.5,
          opacity: mutedInk,
        }),
        textNode(`entry-${index + 1}-value`, {
          x: area.width - valueWidth,
          y: rowHeight - padding - valueSize,
          width: valueWidth,
          height: valueSize,
          text: entry?.value ?? '',
          fontFamily: fonts.fontFamily,
          fontSize: valueSize,
          fontWeight: 700,
          color: theme.foreground,
          align: 'right',
          overflow: 'clip',
          letterSpacing: -1.5,
        }),
      ],
    };
  });
}

/**
 * Finds one figure size that every value fits at.
 *
 * The list reads as a list only if the values share a size, so the longest
 * entry sets the size for all of them rather than being clipped to fit.
 *
 * @param input - Project data and measurement tools.
 * @param entries - Entries the list will show.
 * @param fontFamily - Typeface the values are set in.
 * @param maxWidth - Width a value may occupy.
 * @param maxSize - Largest size a row can carry.
 * @returns The largest size that fits every value on one line.
 */
function commonValueSize(
  input: BuildInput,
  entries: Entry[],
  fontFamily: string,
  maxWidth: number,
  maxSize: number,
) {
  return entries.reduce((size, entry) => {
    const fitted = fitText(input.measure, {
      text: entry.value,
      fontFamily,
      fontWeight: 700,
      maxWidth,
      minSize: 16,
      maxSize,
      maxLines: 1,
      letterSpacing: -1.5,
    });

    return Math.min(size, fitted.fontSize);
  }, maxSize);
}

/** Bundled contents poster that lists every repository fact as a ruled row. */
const contentsTemplate: Template = {
  id: 'contents',
  name: 'Contents',
  description: 'A numbered index of repository facts, each on its own rule.',
  category: 'minimal',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { contentsTemplate };
