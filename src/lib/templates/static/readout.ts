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
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

/** Fixed row count in the ruled metric column. */
const readingSlots = 4;

/** Fixed bar count in the language plot. */
const plotSlots = 6;

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
    label: 'Accent colour',
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

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: '#efeade',
  accentColor: '#b4471f',
  textColor: '#141210',
};

const defaultSettings: Record<string, unknown> = {
  heroMetric: 'stars',
  metrics: ['stars', 'forks', 'watchers', 'issues'],
  showLanguages: true,
  wordmark: 'REPOFRAME',
  ...defaultColors,
  fontFamily: 'JetBrains Mono Variable',
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    settings: defaultColors,
  },
  {
    id: 'graph',
    name: 'Graph',
    settings: {
      backgroundColor: '#eaf0ee',
      accentColor: '#17635a',
      textColor: '#10201d',
    },
  },
  {
    id: 'carbon',
    name: 'Carbon',
    settings: {
      backgroundColor: '#141414',
      accentColor: '#f5a524',
      textColor: '#efe9df',
    },
  },
  {
    id: 'manila',
    name: 'Manila',
    settings: {
      backgroundColor: '#f3e7c9',
      accentColor: '#7a4b12',
      textColor: '#241a08',
    },
  },
  {
    id: 'ozone',
    name: 'Ozone',
    settings: {
      backgroundColor: '#e9eef7',
      accentColor: '#1f3ad6',
      textColor: '#10142a',
    },
  },
];

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
 * Splits the frame into the fixed bands the instrument face is built from.
 *
 * @param frame - Bounds inside the keyline.
 * @param isWide - Whether the canvas uses a wide landscape ratio.
 * @param scale - Band multiplier for the height of the canvas.
 * @returns The header, title, description, dial, plot, and footer bands.
 */
function readoutBands(frame: Box, isWide: boolean, scale: number) {
  const gap = spacing.xs * Math.min(1.4, scale);
  const header = 40 * Math.min(1.3, scale);
  const title = (isWide ? 88 : 116) * Math.min(1.3, scale);
  const description = 32 * Math.min(1.3, scale);
  const footer = 72 * Math.min(1.4, scale);
  // The dial is the face of the instrument, so it claims most of what the
  // fixed bands leave rather than taking only what the plot does not want.
  const free = Math.max(
    0,
    frame.height - (header + title + description + footer + gap * 5),
  );
  // Neither the dot display nor the ruled column can use depth beyond what
  // their own width allows, so the dial stops at what the pair fills.
  const dial = Math.min(
    free * 0.74,
    Math.max(
      matrixHeightForWidth(frame.width * 0.58) + 30 * Math.min(1.3, scale),
      readingSlots * 96,
    ),
  );
  const plot = Math.min(free - dial, 300 * Math.min(1.4, scale));
  const heights = [header, title, description, dial, plot, footer];
  const printed = heights.reduce((total, band) => total + band, 0);
  // A tall sheet spreads what is left between the bands, so the face reads as
  // ruled sections rather than a block of rules over an empty page.
  const spread = Math.max(gap, (frame.height - printed) / (heights.length - 1));
  const bands = stack(frame, heights, spread);

  return { gap, bands };
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
  const keyline = inset({ x: 0, y: 0, width, height }, isWide ? 32 : 44);
  const frame = inset(keyline, spacing.sm);
  const { gap, bands } = readoutBands(frame, isWide, scale);
  const [header, title, description, dial, plot, footer] = bands;

  const { hero: heroMetric, readings } = splitMetrics(settings);
  const values = metricValues(input.data);
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 700,
    maxWidth: title.width,
    minSize: 22,
    maxSize: isWide ? 56 : 68,
    maxLines: 1,
    letterSpacing: -1,
  });
  // The dial keeps the hero figure and the ruled column side by side while
  // there is width for both, and stacks them when the canvas turns portrait.
  const heroLabelHeight = 30 * Math.min(1.3, scale);
  const stacked = dial.width < dial.height * 1.1;
  // Stacked, the hero takes only the depth its display can fill, so the
  // readings close the band instead of sitting under a void.
  const heroDepth = Math.min(
    dial.height * 0.62,
    matrixHeightForWidth(dial.width) + heroLabelHeight,
  );
  const heroBox: Box = stacked
    ? { ...dial, height: heroDepth }
    : { ...dial, width: dial.width * 0.58 };
  const readingsBox: Box = stacked
    ? {
        x: dial.x,
        y: dial.y + heroDepth + gap,
        width: dial.width,
        height: Math.max(0, dial.height - heroDepth - gap),
      }
    : {
        x: dial.x + dial.width * 0.58 + spacing.lg,
        y: dial.y,
        width: Math.max(0, dial.width * 0.42 - spacing.lg),
        height: dial.height,
      };

  const nodes: SceneNode[] = [
    {
      id: 'keyline',
      type: 'rect',
      ...keyline,
      fill: { kind: 'solid', color: theme.surface },
      stroke: { color: theme.foreground, width: 3 },
    },
    textNode('wordmark', {
      x: header.x,
      y: header.y,
      width: header.width * 0.6,
      height: header.height,
      text: stringSetting(settings, 'wordmark'),
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: theme.foreground,
      letterSpacing: 6,
      maxLines: 1,
    }),
    textNode('owner-login', {
      x: header.x + header.width * 0.6,
      y: header.y,
      width: header.width * 0.4,
      height: header.height,
      text: `@${input.data.owner.login}`,
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 500,
      color: theme.accent,
      align: 'right',
      letterSpacing: 1,
      maxLines: 1,
    }),
    {
      id: 'header-rule',
      type: 'rect',
      x: header.x,
      y: header.y + header.height,
      width: header.width,
      height: 3,
      fill: { kind: 'solid', color: theme.foreground },
    },
    textNode('title-label', {
      x: title.x,
      y: title.y,
      width: title.width * 0.5,
      height: 26,
      text: 'REPOSITORY',
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      letterSpacing: 3,
      maxLines: 1,
    }),
    textNode('updated-label', {
      x: title.x + title.width * 0.5,
      y: title.y,
      width: title.width * 0.5,
      height: 26,
      text: `UPDATED ${formatDate(input.data.repository.pushedAt).toUpperCase()}`,
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      align: 'right',
      letterSpacing: 3,
      maxLines: 1,
    }),
    textNode('repo-name', {
      maxLines: 1,
      x: title.x,
      y: title.y + 30,
      width: title.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      overflow: 'clip',
      letterSpacing: -1,
    }),
    textNode('repo-description', {
      ...description,
      text:
        input.data.repository.description ||
        `Open-source software by ${input.data.owner.login}.`,
      fontFamily,
      fontSize: Math.min(26, description.height * 0.72),
      fontWeight: 400,
      color: theme.muted,
      maxLines: 1,
    }),
    textNode('hero-label', {
      maxLines: 1,
      x: heroBox.x,
      y: heroBox.y,
      width: heroBox.width,
      height: heroLabelHeight,
      text: heroLabel(heroMetric),
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: theme.foreground,
      letterSpacing: 5,
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
      { color: theme.foreground },
    ),
    ...readingNodes(input, readings, fontFamily, theme, readingsBox),
    ...plotNodes(
      input,
      booleanSetting(settings, 'showLanguages'),
      fontFamily,
      theme,
      plot,
    ),
    {
      id: 'footer-rule',
      type: 'rect',
      x: footer.x,
      y: footer.y,
      width: footer.width,
      height: 3,
      fill: { kind: 'solid', color: theme.foreground },
    },
    ...footerNodes(input, fontFamily, theme, {
      x: footer.x,
      y: footer.y + spacing.xs,
      width: footer.width,
      height: Math.max(0, footer.height - spacing.xs),
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
 * Stacks the secondary readings as ruled rows with the figure on the right.
 *
 * Hidden readings stay in the tree at zero opacity so the node ids hold still
 * as the selection changes.
 *
 * @param input - Build input carrying project data.
 * @param visibleMetrics - Metric values to show, in display order.
 * @param fontFamily - Typeface for the labels and figures.
 * @param theme - Resolved template colours.
 * @param area - Bounds the column fills.
 * @returns A rule, label, and figure for every reading slot.
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
  const rowHeight = Math.min(area.height / readingSlots, 96);
  const rows = stack(
    area,
    Array.from({ length: readingSlots }, () => rowHeight),
    0,
  );
  const labelHeight = Math.min(26, rowHeight * 0.3);

  return metricOptions.flatMap((metric, index): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const slot = rows[Math.min(Math.max(0, visibleIndex), readingSlots - 1)];
    const opacity = visibleIndex >= 0 && visibleIndex < readingSlots ? 1 : 0;

    return [
      textNode(`reading-${metric.value}-label`, {
        maxLines: 1,
        x: slot.x,
        y: slot.y,
        width: slot.width * 0.4,
        height: labelHeight,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: typeScale.eyebrow,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 2,
        opacity,
      }),
      textNode(`reading-${metric.value}-value`, {
        maxLines: 1,
        x: slot.x + slot.width * 0.42,
        y: slot.y,
        width: slot.width * 0.58,
        height: Math.max(0, rowHeight - labelHeight - 6),
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: Math.min(52, Math.max(0, rowHeight - labelHeight - 6) * 0.8),
        fontWeight: 700,
        color: theme.foreground,
        align: 'right',
        opacity,
      }),
      {
        id: `reading-${metric.value}-rule`,
        type: 'rect',
        x: slot.x,
        y: slot.y + rowHeight - 4,
        width: slot.width,
        height: 2,
        fill: {
          kind: 'solid',
          color: index === 0 ? theme.accent : theme.border,
        },
        opacity,
      },
    ];
  });
}

/**
 * Plots the language mix as a run of columns under a caption.
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
  const languages = shown ? input.data.languages.slice(0, plotSlots) : [];
  const tallest = Math.max(1, ...languages.map((entry) => entry.percentage));
  const captionHeight = 24;
  const plot = {
    x: area.x,
    y: area.y + captionHeight,
    width: area.width,
    height: Math.max(0, area.height - captionHeight),
  };
  const cells = row(plot, plotSlots, spacing.sm);

  return [
    textNode('plot-caption', {
      x: area.x,
      y: area.y,
      width: area.width,
      height: captionHeight,
      text: 'LANGUAGE SHARE',
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      letterSpacing: 3,
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

/**
 * Fills the footer with the four facts that never change shape.
 *
 * @param input - Build input carrying project data.
 * @param fontFamily - Typeface for the labels and values.
 * @param theme - Resolved template colours.
 * @param area - Bounds the footer fills.
 * @returns A label and a value for every footer cell.
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
    ['CREATED', formatDate(input.data.repository.createdAt)],
  ];
  const cells = row(area, entries.length, spacing.md);
  const labelHeight = Math.min(24, area.height * 0.36);
  const valueSize = Math.min(30, Math.max(0, area.height - labelHeight) * 0.7);

  return entries.flatMap(([label, value], index): SceneNode[] => {
    const cell = cells[index];

    return [
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

/** Bundled instrument face that prints the repository as a paper readout. */
const readoutTemplate: Template = {
  id: 'readout',
  name: 'Readout',
  description: 'A dotted instrument figure printed on a ruled paper face.',
  category: 'developer',
  supportedRatios: ['16:9', '1:1', '4:5', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { readoutTemplate };
