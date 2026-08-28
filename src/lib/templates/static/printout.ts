import {
  formatCount,
  formatDate,
  formatStatus,
} from '@/lib/templates/shared/format';
import { type Box, inset, row, stack } from '@/lib/templates/shared/layout';
import {
  matrixHeightForWidth,
  matrixNodes,
} from '@/lib/templates/shared/matrix';
import {
  metricOptions,
  metricPaths,
  metricValues,
  splitMetrics,
} from '@/lib/templates/shared/metrics';
import { textNode } from '@/lib/templates/shared/nodes';
import {
  booleanSetting,
  mergeSettings,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitText } from '@/lib/templates/shared/text';
import {
  bandScale,
  monoFontOptions,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

/** Fixed cell count in the metric strip, one per metric off the figure. */
const cellSlots = 4;

/** Fixed sprocket count down each margin. */
const sprocketSlots = 9;

/** Fields listed down the index column, in printing order. */
const fields = ['REPO', 'DESC', 'FIGURE', 'METRICS', 'SYSTEM', 'SHARE'];

const settingsSchema: SettingField[] = [
  {
    key: 'heroMetric',
    label: 'Printed figure',
    section: 'content',
    type: 'select',
    optionsFrom: 'metrics',
    options: metricOptions,
  },
  {
    key: 'metrics',
    label: 'Metric cells',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showLanguages',
    label: 'Language plot',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'wordmark',
    label: 'Wordmark',
    section: 'content',
    type: 'text',
    maxLength: 24,
  },
  {
    key: 'backgroundColor',
    label: 'Paper colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'accentColor',
    label: 'Perforation colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'textColor',
    label: 'Ink colour',
    section: 'theme',
    type: 'color',
    allowAuto: true,
  },
  {
    key: 'fontFamily',
    label: 'Typeface',
    section: 'typography',
    type: 'select',
    options: monoFontOptions,
  },
];

const defaultSettings: Record<string, unknown> = {
  heroMetric: 'stars',
  metrics: ['stars', 'forks', 'watchers', 'issues'],
  showLanguages: true,
  wordmark: 'REPOFRAME',
  backgroundColor: '#f0ebdd',
  accentColor: '#c8503c',
  textColor: '#2b2723',
  fontFamily: 'Source Code Pro Variable',
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const { hero, readings } = splitMetrics(resolved);

  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showLanguages')) {
    paths.push('languages');
  }

  paths.push(...metricPaths([hero, ...readings]));

  return paths;
}

/**
 * Splits the printed area into the bands the report is set in.
 *
 * @param body - Bounds between the two sprocket margins.
 * @param isWide - Whether the canvas uses a wide landscape ratio.
 * @param scale - Band multiplier for the height of the canvas.
 * @returns The header, title, description, figure, cells, keys, and plot bands.
 */
function printoutBands(body: Box, isWide: boolean, scale: number) {
  const gap = spacing.sm * Math.min(1.2, scale);
  const header = 30 * scale;
  const title = (isWide ? 56 : 70) * scale;
  const description = 30 * scale;
  const cells = (isWide ? 74 : 92) * scale;
  const keys = (isWide ? 62 : 78) * scale;
  const plot = (isWide ? 74 : 96) * scale;
  // The figure is limited by its own width, so it never claims height the dot
  // grid cannot fill.
  const figure = Math.min(
    matrixHeightForWidth(body.width * 0.78, 0.5),
    Math.max(
      0,
      body.height -
        (header + title + description + cells + keys + plot + gap * 6),
    ),
  );
  const heights = [header, title, description, figure, cells, keys, plot];
  const printed = heights.reduce((total, band) => total + band, 0) + gap * 6;

  // A tall sheet keeps the report at its printed size and centres it, the way
  // a page carries margins, rather than stretching one band to close the gap.
  return stack(
    { ...body, y: body.y + Math.max(0, (body.height - printed) / 2) },
    heights,
    gap,
  );
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
  const scale = bandScale(height);
  const sheet = inset({ x: 0, y: 0, width, height }, isWide ? 26 : 36);
  const marginWidth = isWide ? 74 : 88;
  const indexWidth = isWide ? 108 : 132;
  const body: Box = {
    x: sheet.x + marginWidth + indexWidth,
    y: sheet.y + spacing.md,
    width: Math.max(1, sheet.width - marginWidth * 2 - indexWidth - spacing.md),
    height: Math.max(0, sheet.height - spacing.md * 2),
  };
  const [header, title, description, figure, cells, keys, plot] = printoutBands(
    body,
    isWide,
    scale,
  );

  const { hero: heroMetric, readings } = splitMetrics(settings);
  const values = metricValues(input.data);
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 700,
    maxWidth: title.width,
    minSize: 20,
    maxSize: isWide ? 48 : 58,
    maxLines: 1,
    letterSpacing: -0.5,
  });
  const heroLabelWidth = title.width * 0.22;

  const nodes: SceneNode[] = [
    ...marginNodes(theme, sheet, marginWidth),
    ...indexNodes(fontFamily, theme, sheet.x + marginWidth, indexWidth, [
      title,
      description,
      figure,
      cells,
      keys,
      plot,
    ]),
    textNode('wordmark', {
      x: header.x,
      y: header.y,
      width: header.width * 0.6,
      height: header.height,
      text: stringSetting(settings, 'wordmark'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      letterSpacing: 5,
      maxLines: 1,
    }),
    textNode('owner-login', {
      x: header.x + header.width * 0.6,
      y: header.y,
      width: header.width * 0.4,
      height: header.height,
      text: `@${input.data.owner.login}`,
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      align: 'right',
      letterSpacing: 2,
      maxLines: 1,
    }),
    textNode('repo-name', {
      maxLines: 1,
      x: title.x,
      y: title.y + (title.height - name.height) / 2,
      width: title.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      overflow: 'clip',
      letterSpacing: -0.5,
    }),
    ...dottedRule('title-rule', theme.border, {
      x: title.x,
      y: title.y + title.height,
      width: title.width,
      height: 2,
    }),
    textNode('repo-description', {
      ...description,
      text:
        input.data.repository.description ||
        `Open-source software by ${input.data.owner.login}.`,
      fontFamily,
      fontSize: Math.min(24, description.height * 0.7),
      fontWeight: 400,
      color: theme.muted,
      maxLines: 1,
    }),
    textNode('hero-label', {
      x: figure.x,
      y: figure.y + figure.height / 2 - 16,
      width: heroLabelWidth,
      height: 32,
      text: `${heroLabel(heroMetric)} >`,
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      letterSpacing: 3,
      maxLines: 1,
    }),
    ...matrixNodes(
      'hero-value',
      formatCount(values[heroMetric]),
      {
        x: figure.x + heroLabelWidth,
        y: figure.y,
        width: Math.max(0, figure.width - heroLabelWidth),
        height: figure.height,
      },
      { color: theme.foreground, gapRatio: 0.5 },
    ),
    ...dottedRule('figure-rule', theme.border, {
      x: figure.x,
      y: figure.y + figure.height,
      width: figure.width,
      height: 2,
    }),
    ...cellNodes(input, readings, fontFamily, theme, cells),
    ...keyNodes(input, fontFamily, theme, keys),
    ...plotNodes(
      input,
      booleanSetting(settings, 'showLanguages'),
      fontFamily,
      theme,
      plot,
    ),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

/**
 * Reads the display label for a metric setting value.
 *
 * @param metric - Metric setting value the printed figure shows.
 * @returns The metric's label in printer case.
 */
function heroLabel(metric: string) {
  const option = metricOptions.find((entry) => entry.value === metric);

  return (option?.label ?? 'Stars').toUpperCase();
}

/**
 * Draws a horizontal rule as a run of separated dashes.
 *
 * @param id - Prefix for every dash's stable identifier.
 * @param color - Ink the dashes are printed in.
 * @param area - Bounds the rule spans.
 * @returns One rect per dash.
 */
function dottedRule(id: string, color: string, area: Box): SceneNode[] {
  const pitch = 12;
  const count = Math.max(1, Math.floor(area.width / pitch));

  return Array.from({ length: count }, (_, index) => ({
    id: `${id}-${index + 1}`,
    type: 'rect' as const,
    x: area.x + index * pitch,
    y: area.y,
    width: pitch * 0.5,
    height: area.height,
    fill: { kind: 'solid' as const, color },
  }));
}

/**
 * Draws the sprocket holes and perforation lines down both margins.
 *
 * @param theme - Resolved template colours.
 * @param sheet - Bounds of the whole sheet.
 * @param marginWidth - Width of one tractor-feed margin.
 * @returns The holes and the two perforation rules.
 */
function marginNodes(
  theme: Theme,
  sheet: Box,
  marginWidth: number,
): SceneNode[] {
  const holeSize = Math.min(20, marginWidth * 0.28);
  const pitch = sheet.height / sprocketSlots;
  const edges = [
    { side: 'left', holeX: sheet.x + (marginWidth - holeSize) / 2 },
    {
      side: 'right',
      holeX: sheet.x + sheet.width - (marginWidth + holeSize) / 2,
    },
  ];

  return edges.flatMap((edge) => [
    {
      id: `perforation-${edge.side}`,
      type: 'rect' as const,
      x:
        edge.side === 'left'
          ? sheet.x + marginWidth
          : sheet.x + sheet.width - marginWidth,
      y: sheet.y,
      width: 2,
      height: sheet.height,
      fill: { kind: 'solid' as const, color: theme.accent },
      opacity: 0.6,
    },
    ...Array.from({ length: sprocketSlots }, (_, index) => ({
      id: `sprocket-${edge.side}-${index + 1}`,
      type: 'rect' as const,
      x: edge.holeX,
      y: sheet.y + index * pitch + (pitch - holeSize) / 2,
      width: holeSize,
      height: holeSize,
      fill: { kind: 'solid' as const, color: theme.foreground },
      cornerRadius: holeSize / 2,
    })),
  ]);
}

/**
 * Numbers the printed fields down the column beside the left perforation.
 *
 * Each entry sits at the top of the band it names, so the index reads as a
 * margin note on the report rather than a list beside it.
 *
 * @param fontFamily - Typeface for the field names and numbers.
 * @param theme - Resolved template colours.
 * @param x - Left edge of the index column.
 * @param width - Width of the index column.
 * @param bands - Bounds of the bands the index names, in printing order.
 * @returns A name and a number for every field.
 */
function indexNodes(
  fontFamily: string,
  theme: Theme,
  x: number,
  width: number,
  bands: Box[],
): SceneNode[] {
  const labelWidth = Math.max(1, width - spacing.sm);

  return fields.flatMap((field, index): SceneNode[] => {
    const band = bands[index];

    return [
      textNode(`index-${index + 1}-name`, {
        maxLines: 1,
        x,
        y: band.y,
        width: labelWidth,
        height: 20,
        text: field,
        fontFamily,
        fontSize: typeScale.eyebrow * 0.8,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 2,
      }),
      textNode(`index-${index + 1}-number`, {
        maxLines: 1,
        x,
        y: band.y + 20,
        width: labelWidth,
        height: 24,
        text: `0${index + 1}`,
        fontFamily,
        fontSize: typeScale.eyebrow,
        fontWeight: 700,
        color: theme.muted,
      }),
    ];
  });
}

/**
 * Prints the metric cells across the strip, divided by dashed rules.
 *
 * Hidden cells stay in the tree at zero opacity so the node ids hold still as
 * the selection changes.
 *
 * @param input - Build input carrying project data.
 * @param visibleMetrics - Metric values to show, in display order.
 * @param fontFamily - Typeface for the labels and figures.
 * @param theme - Resolved template colours.
 * @param area - Bounds the strip fills.
 * @returns A divider, label, and figure for every cell slot.
 */
function cellNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  const cells = row(area, cellSlots, spacing.md);
  const labelHeight = Math.min(24, area.height * 0.3);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.min(Math.max(0, visibleIndex), cellSlots - 1)];
    const opacity = visibleIndex >= 0 && visibleIndex < cellSlots ? 1 : 0;

    return [
      textNode(`cell-${metric.value}-label`, {
        maxLines: 1,
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: labelHeight,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: typeScale.eyebrow * 0.8,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 2,
        opacity,
      }),
      textNode(`cell-${metric.value}-value`, {
        maxLines: 1,
        x: cell.x,
        y: cell.y + labelHeight,
        width: cell.width,
        height: Math.max(0, area.height - labelHeight),
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: Math.min(44, Math.max(0, area.height - labelHeight) * 0.82),
        fontWeight: 700,
        color: theme.foreground,
        opacity,
      }),
    ];
  });
}

/**
 * Prints the system facts as a two-column key and value block.
 *
 * @param input - Build input carrying project data.
 * @param fontFamily - Typeface for the keys and values.
 * @param theme - Resolved template colours.
 * @param area - Bounds the block fills.
 * @returns A key and a value for every fact.
 */
function keyNodes(
  input: BuildInput,
  fontFamily: string,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const licence = input.data.repository.license;
  const entries = [
    ['STATUS', formatStatus(input.data.repository)],
    ['LICENCE', licence?.spdxId ?? licence?.name ?? '—'],
    ['BRANCH', input.data.repository.defaultBranch],
    ['UPDATED', formatDate(input.data.repository.pushedAt)],
  ];
  const columns = row(area, 2, spacing.lg);
  const rowHeight = area.height / 2;
  const size = Math.min(22, rowHeight * 0.6);

  return entries.map((entry, index) => {
    const column = columns[index % 2];

    return textNode(`key-${index + 1}`, {
      maxLines: 1,
      x: column.x,
      y: column.y + Math.floor(index / 2) * rowHeight,
      width: column.width,
      height: size * 1.3,
      text: `${entry[0].padEnd(10, ' ')}: ${entry[1]}`,
      fontFamily,
      fontSize: size,
      fontWeight: 500,
      color: theme.foreground,
    });
  });
}

/**
 * Prints the language share as a run of columns under a caption.
 *
 * @param input - Build input carrying project data.
 * @param shown - Whether the plot is drawn at all.
 * @param fontFamily - Typeface for the caption.
 * @param theme - Resolved template colours.
 * @param area - Bounds the plot fills.
 * @returns A caption and a column for every plot slot.
 */
function plotNodes(
  input: BuildInput,
  shown: boolean,
  fontFamily: string,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const slots = 8;
  const languages = shown ? input.data.languages.slice(0, slots) : [];
  const tallest = Math.max(1, ...languages.map((entry) => entry.percentage));
  const captionHeight = 24;
  const plot = {
    x: area.x,
    y: area.y + captionHeight,
    width: area.width,
    height: Math.max(0, area.height - captionHeight),
  };
  const cells = row(plot, slots, spacing.sm);

  return [
    textNode('plot-caption', {
      x: area.x,
      y: area.y,
      width: area.width,
      height: captionHeight,
      text: 'SHARE / BYTES PER LANGUAGE',
      fontFamily,
      fontSize: typeScale.eyebrow * 0.8,
      fontWeight: 500,
      color: theme.muted,
      letterSpacing: 2,
      maxLines: 1,
    }),
    ...cells.flatMap((cell, index): SceneNode[] => {
      const language = languages[index];
      // A repository is usually one language and a rounding error, so every
      // column keeps a floor rather than collapsing to an invisible hairline.
      const columnHeight = language
        ? plot.height * (0.14 + 0.86 * (language.percentage / tallest))
        : 0;

      return [
        {
          id: `plot-column-${index + 1}`,
          type: 'rect',
          x: cell.x,
          y: cell.y + cell.height - columnHeight,
          width: cell.width,
          height: columnHeight,
          fill: { kind: 'solid', color: theme.foreground },
          opacity: language ? 1 : 0,
        },
      ];
    }),
  ];
}

/** Bundled tractor-feed report that prints the repository as a ledger page. */
const printoutTemplate: Template = {
  id: 'printout',
  name: 'Printout',
  description:
    'A tractor-feed ledger with a sprocket margin and dotted figure.',
  category: 'developer',
  supportedRatios: ['16:9', '1:1', '4:5', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { printoutTemplate };
