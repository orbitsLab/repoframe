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
import type { BuildInput, SettingField, Template } from '@/types/template';

/** Fixed figure count, so node ids stay stable as facts are toggled. */
const figureSlots = 8;

/** Column widths that give the mosaic its uneven, printed rhythm. */
const columnWeights: Record<number, number[]> = {
  2: [0.58, 0.42],
  4: [0.3, 0.22, 0.26, 0.22],
};

/** Room below a figure so its descenders clear the label beneath it. */
const descenderGap = 10;

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
    label: 'Field colour',
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
    label: 'Label typeface',
    section: 'typography',
    type: 'select',
    options: monoFontOptions,
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'watchers', 'issues'],
  showLanguage: true,
  showLicense: true,
  showRelease: true,
  eyebrow: 'BY THE NUMBERS',
  backgroundColor: palettes.paper.background,
  accentColor: '#c8341c',
  textColor: autoColor,
  fontFamily: 'Archivo Variable',
  monoFamily: 'JetBrains Mono Variable',
};

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
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 56 : 76);
  // Bands grow with the canvas so a tall card does not pool its extra height
  // into one gap above the mosaic.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.sm : spacing.md) * scale;

  const eyebrowHeight = 28 * scale;
  const nameLines = isWide ? 1 : 2;
  const nameLineHeight = 0.96;
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 800,
    maxWidth: frame.width,
    minSize: 36,
    maxSize: isWide ? 82 : 108,
    maxLines: nameLines,
    lineHeight: nameLineHeight,
    letterSpacing: -2.5,
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
      fontWeight: 500,
      maxWidth: frame.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );

  const nameY = frame.y + eyebrowHeight + gutter;
  const descriptionY = nameY + name.height + gutter * 0.5;
  // Everything the header leaves belongs to the mosaic, so extra height
  // deepens the cells instead of opening a void beneath the description.
  const mosaic: Box = {
    x: frame.x,
    y: descriptionY + description.height + gutter,
    width: frame.width,
    height: Math.max(
      0,
      frame.y + frame.height - (descriptionY + description.height + gutter),
    ),
  };

  const nodes: SceneNode[] = [
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: frame.width * 0.6,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily: monoFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 3,
    }),
    textNode('owner-login', {
      x: frame.x + frame.width * 0.6,
      y: frame.y,
      width: frame.width * 0.4,
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
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: name.lines.length,
      overflow: 'clip',
      letterSpacing: -2.5,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: frame.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 500,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    ...mosaicNodes(
      input,
      factList(input, settings),
      { fontFamily, monoFamily },
      theme,
      mosaic,
      isWide ? 4 : 2,
    ),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

/** A single figure carried by the mosaic. */
type Fact = { value: string; label: string };

/**
 * Collects the figures the settings ask for, in reading order.
 *
 * Metrics come first because they are the counts people scan for, then the
 * repository facts that describe the project rather than measure it.
 *
 * @param input - Project data and measurement tools.
 * @param settings - Resolved template settings.
 * @returns At most one figure per mosaic slot.
 */
function factList(input: BuildInput, settings: Record<string, unknown>) {
  const visibleMetrics = stringArraySetting(settings, 'metrics');
  const values = metricValues(input.data);
  const facts: Fact[] = metricOptions
    .filter((metric) => visibleMetrics.includes(metric.value))
    .map((metric) => ({
      value: formatCount(values[metric.value]),
      label: metric.label,
    }));

  if (booleanSetting(settings, 'showLanguage')) {
    facts.push({
      value: input.data.languages[0]?.name ?? '—',
      label: 'Top language',
    });
  }

  if (booleanSetting(settings, 'showLicense')) {
    facts.push({
      value: input.data.repository.license?.spdxId ?? 'None',
      label: 'Licence',
    });
  }

  if (booleanSetting(settings, 'showRelease')) {
    facts.push({
      value: input.data.latestRelease?.tagName ?? '—',
      label: 'Latest release',
    });
  }

  facts.push({
    value: formatDate(input.data.repository.updatedAt),
    label: 'Last updated',
  });

  return facts.slice(0, figureSlots);
}

/**
 * Lays the figures into a ruled mosaic of uneven columns.
 *
 * Columns keep the same widths on every row so the vertical rules run the
 * full depth, and the differing widths give each figure its own type size.
 *
 * @param input - Project data and measurement tools.
 * @param facts - Figures to place, in reading order.
 * @param fonts - Display and label typefaces.
 * @param theme - Resolved template colours.
 * @param area - Bounds the mosaic fills.
 * @param columns - Cells per row.
 * @returns The rules and every figure slot, shown or hidden.
 */
function mosaicNodes(
  input: BuildInput,
  facts: Fact[],
  fonts: { fontFamily: string; monoFamily: string },
  theme: Theme,
  area: Box,
  columns: number,
): SceneNode[] {
  const maxRows = figureSlots / columns;
  const rows = Math.min(
    maxRows,
    Math.max(1, Math.ceil(facts.length / columns)),
  );
  const rowHeight = area.height / rows;
  const weights = columnWeights[columns];
  const cellAt = (index: number): Box => {
    const column = index % columns;
    const offset = weights
      .slice(0, column)
      .reduce((total, weight) => total + weight, 0);

    return {
      x: area.x + area.width * offset,
      y: area.y + Math.min(Math.floor(index / columns), rows - 1) * rowHeight,
      width: area.width * weights[column],
      height: rowHeight,
    };
  };

  return [
    ...ruleNodes(theme, area, rows, rowHeight, weights),
    ...Array.from({ length: figureSlots }, (_, index): SceneNode => {
      const cell = cellAt(index);
      const fact = facts[index];
      const padding = spacing.sm;
      const labelHeight = 22;
      // The figure takes the whole cell rather than a fixed ceiling, so a tall
      // canvas grows the numbers instead of stranding them over empty space.
      const value = fitText(input.measure, {
        text: fact?.value ?? '',
        fontFamily: fonts.fontFamily,
        fontWeight: 800,
        maxWidth: Math.max(1, cell.width - padding * 2),
        minSize: 22,
        maxSize: Math.max(
          24,
          cell.height - padding * 2 - labelHeight - descenderGap,
        ),
        maxLines: 1,
        letterSpacing: -2,
      });

      return {
        id: `figure-${index + 1}`,
        type: 'group',
        ...cell,
        opacity: fact ? 1 : 0,
        children: [
          textNode(`figure-${index + 1}-value`, {
            x: padding,
            y:
              cell.height - padding - labelHeight - descenderGap - value.height,
            width: Math.max(1, cell.width - padding * 2),
            height: value.height,
            text: value.lines.join('\n'),
            fontFamily: fonts.fontFamily,
            fontSize: value.fontSize,
            fontWeight: 800,
            color: index === 0 ? theme.accent : theme.foreground,
            overflow: 'clip',
            letterSpacing: -2,
          }),
          textNode(`figure-${index + 1}-label`, {
            x: padding,
            y: cell.height - padding - labelHeight,
            width: Math.max(1, cell.width - padding * 2),
            height: labelHeight,
            text: (fact?.label ?? '').toUpperCase(),
            fontFamily: fonts.monoFamily,
            fontSize: 15,
            fontWeight: 500,
            color: theme.foreground,
            letterSpacing: 1.6,
            opacity: mutedInk,
          }),
        ],
      };
    }),
  ];
}

/** Draws the hairlines that divide the mosaic into rows and columns. */
function ruleNodes(
  theme: Theme,
  area: Box,
  rows: number,
  rowHeight: number,
  weights: number[],
): SceneNode[] {
  const depth = rowHeight * rows;

  return [
    ...Array.from({ length: figureSlots / 2 }, (_, index): SceneNode => {
      const shown = index < rows;

      return {
        id: `mosaic-rule-h-${index + 1}`,
        type: 'rect',
        x: area.x,
        y: area.y + Math.min(index, rows - 1) * rowHeight,
        width: area.width,
        height: 2,
        fill: { kind: 'solid', color: theme.border },
        opacity: shown ? 1 : 0,
      };
    }),
    ...Array.from({ length: 3 }, (_, index): SceneNode => {
      const shown = index < weights.length - 1;
      const offset = weights
        .slice(0, Math.min(index + 1, weights.length))
        .reduce((total, weight) => total + weight, 0);

      return {
        id: `mosaic-rule-v-${index + 1}`,
        type: 'rect',
        x: area.x + area.width * offset,
        y: area.y,
        width: 2,
        height: depth,
        fill: { kind: 'solid', color: theme.border },
        opacity: shown ? 1 : 0,
      };
    }),
  ];
}

/** Bundled infographic poster that sets every repository fact as a figure. */
const almanacTemplate: Template = {
  id: 'almanac',
  name: 'Almanac',
  description: 'A ruled mosaic of figures, each sized by the cell it sits in.',
  category: 'developer',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { almanacTemplate };
