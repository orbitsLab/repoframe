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
  mergeSettings,
  numberSetting,
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
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

/** Fixed row count in the ruled reading column. */
const readingSlots = 4;

const settingsSchema: SettingField[] = [
  {
    key: 'heroMetric',
    label: 'Headline reading',
    section: 'content',
    type: 'select',
    optionsFrom: 'metrics',
    options: metricOptions,
  },
  {
    key: 'metrics',
    label: 'Ruled readings',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
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
    label: 'Bezel colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'accentColor',
    label: 'Indicator colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'textColor',
    label: 'Segment colour',
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
  {
    key: 'cardRadius',
    label: 'Bezel radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 48,
    step: 4,
    unit: 'px',
  },
];

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: '#b3bd85',
  accentColor: '#d9822b',
  textColor: '#2b3018',
};

const defaultSettings: Record<string, unknown> = {
  heroMetric: 'stars',
  metrics: ['stars', 'forks', 'watchers', 'issues'],
  wordmark: 'REPOFRAME',
  ...defaultColors,
  fontFamily: 'Azeret Mono Variable',
  cardRadius: 20,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'olive',
    name: 'Olive',
    settings: defaultColors,
  },
  {
    id: 'instrument',
    name: 'Dial',
    settings: {
      backgroundColor: '#1b1f18',
      accentColor: '#cddc39',
      textColor: '#e6ecd8',
    },
  },
  {
    id: 'ivory',
    name: 'Ivory',
    settings: {
      backgroundColor: '#e8e3d2',
      accentColor: '#b02a1e',
      textColor: '#23201a',
    },
  },
  {
    id: 'aqua',
    name: 'Aqua',
    settings: {
      backgroundColor: '#9fc4c0',
      accentColor: '#1f4a55',
      textColor: '#17262a',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    settings: {
      backgroundColor: '#4a5159',
      accentColor: '#ffb000',
      textColor: '#f2f4f6',
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const { hero, readings } = splitMetrics(resolved);

  return [
    'repository',
    ...metricPaths([hero, ...readings]),
  ] as ProjectDataPath[];
}

/**
 * Splits the module into its header strip, glass, and footer strip.
 *
 * @param module - Bounds inside the bezel.
 * @param isWide - Whether the canvas uses a wide landscape ratio.
 * @param scale - Band multiplier for the height of the canvas.
 * @returns The three strips and the gap that separates them.
 */
function gaugeBands(module: Box, isWide: boolean, scale: number) {
  const header = (isWide ? 68 : 82) * Math.min(1.3, scale);
  const footer = (isWide ? 104 : 124) * Math.min(1.4, scale);
  const glass = Math.max(0, module.height - header - footer);
  const [headerBand, glassBand, footerBand] = stack(
    module,
    [header, glass, footer],
    0,
  );

  return { headerBand, glassBand, footerBand };
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
  const radius = numberSetting(settings, 'cardRadius');
  const scale = bandScale(height);
  const bezel = inset({ x: 0, y: 0, width, height }, isWide ? 44 : 58);
  const module = inset(bezel, spacing.sm);
  const { headerBand, glassBand, footerBand } = gaugeBands(
    module,
    isWide,
    scale,
  );
  const glass = inset(glassBand, spacing.md);

  const { hero: heroMetric, readings } = splitMetrics(settings);
  const values = metricValues(input.data);
  // The readings take the left of the glass and the headline figure the right,
  // mirroring the module so the eye lands on the label before the number.
  const stacked = glass.width < glass.height * 1.1;
  const heroLabelHeight = 32 * Math.min(1.3, scale);
  const descriptionHeight = 32 * Math.min(1.3, scale);
  // The figure takes only the depth its display can fill, so it never claims
  // height the dot grid leaves empty.
  const heroDepth = Math.min(
    glass.height * 0.58,
    matrixHeightForWidth(glass.width) + heroLabelHeight,
  );
  const readingsDepth = Math.min(glass.height * 0.5, readingSlots * 104);
  // Stacked, the readings and the figure each keep their own depth and centre
  // in the glass together, so what is left over frames the pair rather than
  // opening a gap between them.
  const stackTop =
    glass.y +
    Math.max(0, glass.height - descriptionHeight - readingsDepth - heroDepth) /
      2;
  const readingsBox: Box = stacked
    ? { ...glass, y: stackTop, height: readingsDepth }
    : {
        ...glass,
        width: glass.width * 0.36,
        height: Math.max(0, glass.height - descriptionHeight),
      };
  const heroBox: Box = stacked
    ? {
        x: glass.x,
        y: stackTop + readingsDepth,
        width: glass.width,
        height: heroDepth,
      }
    : {
        x: glass.x + glass.width * 0.36 + spacing.lg,
        y: glass.y,
        width: Math.max(0, glass.width * 0.64 - spacing.lg),
        height: Math.max(0, glass.height - descriptionHeight),
      };

  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 700,
    maxWidth: headerBand.width * 0.62,
    minSize: 18,
    maxSize: isWide ? 34 : 42,
    maxLines: 1,
    letterSpacing: -0.5,
  });
  const indicator = Math.min(22, headerBand.height * 0.28);

  const nodes: SceneNode[] = [
    {
      id: 'bezel',
      type: 'rect',
      ...bezel,
      fill: { kind: 'solid', color: theme.surface },
      cornerRadius: radius,
      stroke: { color: theme.border, width: 6 },
    },
    textNode('wordmark', {
      x: headerBand.x + spacing.md,
      y: headerBand.y + (headerBand.height - 28) / 2,
      width: Math.max(0, headerBand.width * 0.26 - spacing.md),
      height: 28,
      text: stringSetting(settings, 'wordmark'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.foreground,
      letterSpacing: 4,
      maxLines: 1,
    }),
    textNode('repo-name', {
      maxLines: 1,
      x: headerBand.x + headerBand.width * 0.28,
      y: headerBand.y + (headerBand.height - name.height) / 2,
      width: headerBand.width * 0.62,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      overflow: 'clip',
    }),
    {
      id: 'status-indicator',
      type: 'rect',
      x: headerBand.x + headerBand.width - spacing.md - indicator,
      y: headerBand.y + (headerBand.height - indicator) / 2,
      width: indicator,
      height: indicator,
      fill: { kind: 'solid', color: theme.accent },
      cornerRadius: 4,
    },
    {
      id: 'header-rule',
      type: 'rect',
      x: module.x,
      y: headerBand.y + headerBand.height,
      width: module.width,
      height: 3,
      fill: { kind: 'solid', color: theme.border },
    },
    ...readingNodes(input, readings, fontFamily, theme, readingsBox),
    textNode('hero-label', {
      x: heroBox.x,
      y: heroBox.y,
      width: heroBox.width,
      height: heroLabelHeight,
      text: heroLabel(heroMetric),
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: theme.foreground,
      align: 'right',
      letterSpacing: 5,
      maxLines: 1,
    }),
    ...matrixNodes(
      'hero-value',
      formatCount(values[heroMetric]),
      {
        x: heroBox.x,
        y: heroBox.y + heroLabelHeight,
        width: heroBox.width,
        height: Math.max(0, heroBox.height - heroLabelHeight),
      },
      { color: theme.foreground, align: 'right' },
    ),
    textNode('repo-description', {
      x: glass.x,
      y: glass.y + glass.height - descriptionHeight,
      width: glass.width,
      height: descriptionHeight,
      text:
        input.data.repository.description ||
        `Open-source software by ${input.data.owner.login}.`,
      fontFamily,
      fontSize: Math.min(24, descriptionHeight * 0.7),
      fontWeight: 400,
      color: theme.muted,
      maxLines: 1,
    }),
    {
      id: 'footer-rule',
      type: 'rect',
      x: module.x,
      y: footerBand.y,
      width: module.width,
      height: 3,
      fill: { kind: 'solid', color: theme.border },
    },
    ...footerNodes(input, fontFamily, theme, {
      x: footerBand.x + spacing.md,
      y: footerBand.y + spacing.sm,
      width: Math.max(1, footerBand.width - spacing.md * 2),
      height: Math.max(0, footerBand.height - spacing.sm * 2),
    }),
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
 * @param metric - Metric setting value the headline reading shows.
 * @returns The metric's label in instrument case.
 */
function heroLabel(metric: string) {
  const option = metricOptions.find((entry) => entry.value === metric);

  return (option?.label ?? 'Stars').toUpperCase();
}

/**
 * Stacks the secondary readings as underlined rows down the left of the glass.
 *
 * Hidden readings stay in the tree at zero opacity so the node ids hold still
 * as the selection changes.
 *
 * @param input - Build input carrying project data.
 * @param visibleMetrics - Metric values to show, in display order.
 * @param fontFamily - Typeface for the labels and figures.
 * @param theme - Resolved template colours.
 * @param area - Bounds the column fills.
 * @returns A label, figure, and underline for every reading slot.
 */
function readingNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  // Rows keep their own height rather than stretching to fill, so a tall
  // column reads as a stack of readings instead of four drifting labels.
  const rowHeight = Math.min(area.height / readingSlots, 104);
  const rows = stack(
    area,
    Array.from({ length: readingSlots }, () => rowHeight),
    0,
  );
  const labelHeight = Math.min(24, rowHeight * 0.28);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const slot = rows[Math.min(Math.max(0, visibleIndex), readingSlots - 1)];
    const opacity = visibleIndex >= 0 && visibleIndex < readingSlots ? 1 : 0;
    const valueHeight = Math.max(0, rowHeight - labelHeight - spacing.xs);

    return [
      textNode(`reading-${metric.value}-label`, {
        maxLines: 1,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: labelHeight,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: typeScale.eyebrow * 0.9,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 2,
        opacity,
      }),
      textNode(`reading-${metric.value}-value`, {
        maxLines: 1,
        x: slot.x,
        y: slot.y + labelHeight,
        width: slot.width,
        height: valueHeight,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: Math.min(48, valueHeight * 0.86),
        fontWeight: 700,
        color: theme.foreground,
        opacity,
      }),
      {
        id: `reading-${metric.value}-rule`,
        type: 'rect',
        x: slot.x,
        y: slot.y + rowHeight - 4,
        width: slot.width,
        height: 2,
        fill: { kind: 'solid', color: theme.border },
        opacity,
      },
    ];
  });
}

/**
 * Fills the footer strip with four cells divided by hairlines.
 *
 * @param input - Build input carrying project data.
 * @param fontFamily - Typeface for the labels and values.
 * @param theme - Resolved template colours.
 * @param area - Bounds the strip fills.
 * @returns A divider, label, and value for every footer cell.
 */
function footerNodes(
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
  const cells = row(area, entries.length, spacing.md);
  const labelHeight = Math.min(24, area.height * 0.34);
  const valueSize = Math.min(28, Math.max(0, area.height - labelHeight) * 0.66);

  return entries.flatMap(([label, value], index): SceneNode[] => {
    const cell = cells[index];

    return [
      {
        id: `footer-${index + 1}-divider`,
        type: 'rect',
        x: cell.x - spacing.md / 2,
        y: cell.y,
        width: 2,
        height: cell.height,
        fill: { kind: 'solid', color: theme.border },
        opacity: index === 0 ? 0 : 1,
      },
      textNode(`footer-${index + 1}-label`, {
        maxLines: 1,
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: labelHeight,
        text: label,
        fontFamily,
        fontSize: typeScale.eyebrow * 0.85,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 2,
      }),
      textNode(`footer-${index + 1}-value`, {
        maxLines: 1,
        x: cell.x,
        y: cell.y + labelHeight,
        width: cell.width,
        height: valueSize * 1.3,
        text: value,
        fontFamily,
        fontSize: valueSize,
        fontWeight: 700,
        color: theme.foreground,
      }),
    ];
  });
}

/** Bundled instrument module that reads the repository out behind glass. */
const gaugeTemplate: Template = {
  id: 'gauge',
  name: 'Gauge',
  description: 'A bezelled display module with the headline figure lit large.',
  category: 'developer',
  supportedRatios: ['16:9', '1:1', '4:5', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { gaugeTemplate };
