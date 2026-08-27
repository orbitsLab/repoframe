import { formatCount, formatDate } from '@/lib/templates/shared/format';
import { type Box, inset, row } from '@/lib/templates/shared/layout';
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
  displayFontOptions,
  monoFontOptions,
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

/** Fixed specification rows so node ids stay stable as data changes. */
const specSlots = 5;

/** Ruled guides drawn across each axis behind the sheet. */
const guideSlots = 3;

/** Arm length and thickness of the corner registration marks. */
const markLength = 26;
const markWeight = 2;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showSpec',
    label: 'Specification table',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'eyebrow',
    label: 'Sheet title',
    section: 'content',
    type: 'text',
    maxLength: 44,
  },
  {
    key: 'backgroundColor',
    label: 'Background colour',
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
    key: 'showGuides',
    label: 'Ruled guides',
    section: 'theme',
    type: 'toggle',
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
  metrics: ['stars', 'forks', 'issues'],
  showSpec: true,
  eyebrow: 'REPOSITORY SPECIFICATION',
  backgroundColor: palettes.blueprint.background,
  accentColor: palettes.blueprint.accent,
  showGuides: true,
  fontFamily: 'Archivo Variable',
  monoFamily: 'JetBrains Mono Variable',
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  // The final specification row reports the dominant language.
  if (booleanSetting(resolved, 'showSpec')) {
    paths.push('languages');
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
  );
  const fontFamily = stringSetting(settings, 'fontFamily');
  const monoFamily = stringSetting(settings, 'monoFamily');
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 64 : 88);
  // Content sits inside the keyline so header text never rides the frame.
  const sheet = inset(frame, isWide ? 26 : 34);
  const showSpec = booleanSetting(settings, 'showSpec');
  const gutter = isWide ? spacing.md : spacing.lg;

  const headerHeight = 28;
  const headerRuleY = sheet.y + headerHeight + spacing.sm;
  const contentTop = headerRuleY + 2 + gutter;
  const metricBandHeight = isWide ? 104 : 120;
  const metricsTop = sheet.y + sheet.height - metricBandHeight;

  // A wide sheet runs the specification beside the title block; a tall one
  // stacks it underneath, where there is room for full-width rows.
  const columnGap = sheet.width * 0.05;
  const textWidth = isWide ? sheet.width * 0.55 : sheet.width;
  // A tall sheet gives the title block a fixed share and lets the table take
  // the rest, so extra height widens the rows instead of opening a void.
  const textBudget = isWide
    ? Math.max(0, metricsTop - gutter - contentTop)
    : sheet.height * 0.34;
  const bodySize = isWide ? 24 : 28;
  const bodyLineHeight = 1.45;
  const nameLineHeight = 1.06;
  // The name may only grow into space the description does not need.
  const nameBudget = Math.max(
    0,
    textBudget - bodySize * bodyLineHeight * 2 - spacing.md,
  );
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 800,
    maxWidth: textWidth,
    minSize: 34,
    maxSize: Math.max(
      36,
      Math.min(
        isWide ? 72 : typeScale.heading + 32,
        nameBudget / 2 / nameLineHeight,
      ),
    ),
    maxLines: 2,
    lineHeight: nameLineHeight,
  });
  const descriptionLines = Math.max(
    1,
    Math.min(
      3,
      Math.floor(
        (textBudget - name.height - spacing.md) / (bodySize * bodyLineHeight),
      ),
    ),
  );
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: textWidth,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );
  const blockHeight = name.height + spacing.md + description.height;
  // A short name leaves the block well under its budget, so the title is
  // centred in the column rather than pinned under the header rule.
  const blockTop = contentTop + Math.max(0, (textBudget - blockHeight) / 2);
  const descriptionY = blockTop + name.height + spacing.md;

  const table = specLayout(
    isWide,
    showSpec,
    sheet,
    { textWidth, gap: columnGap },
    {
      top: contentTop,
      tableTop: contentTop + textBudget + gutter,
      metricsTop,
      gutter,
    },
  );

  const nodes: SceneNode[] = [
    ...guideNodes(booleanSetting(settings, 'showGuides'), theme, width, height),
    ...frameNodes(theme, frame),
    ...markNodes(theme, frame),
    textNode('eyebrow', {
      x: sheet.x,
      y: sheet.y,
      width: sheet.width * 0.6,
      height: headerHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily: monoFamily,
      fontSize: 18,
      fontWeight: 600,
      color: theme.accent,
      letterSpacing: 2.2,
    }),
    textNode('sheet-id', {
      x: sheet.x + sheet.width * 0.6,
      y: sheet.y,
      width: sheet.width * 0.4,
      height: headerHeight,
      text: `github.com/${input.data.owner.login}`,
      fontFamily: monoFamily,
      fontSize: 18,
      fontWeight: 500,
      color: theme.muted,
      align: 'right',
    }),
    {
      id: 'header-rule',
      type: 'rect',
      x: sheet.x,
      y: headerRuleY,
      width: sheet.width,
      height: 2,
      fill: { kind: 'solid', color: theme.accent },
    },
    textNode('repo-name', {
      x: sheet.x,
      y: blockTop,
      width: textWidth,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
      letterSpacing: -1.2,
    }),
    textNode('repo-description', {
      x: sheet.x,
      y: descriptionY,
      width: textWidth,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    ...specNodes(
      input,
      showSpec,
      monoFamily,
      theme,
      table.area,
      table.rowHeight,
    ),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: sheet.x,
      y: metricsTop,
      width: isWide ? textWidth : sheet.width,
      height: 2,
      fill: { kind: 'solid', color: theme.border },
    },
    ...metricNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      monoFamily,
      theme,
      {
        x: sheet.x,
        y: metricsTop + spacing.md,
        width: isWide ? textWidth : sheet.width,
        height: Math.max(0, metricBandHeight - spacing.md),
      },
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
 * Places the specification table and sizes its rows.
 *
 * A wide sheet parks the table in the side column beside the title. A tall
 * one hangs it off the metric band, so leftover height reads as space under
 * the title rather than a gap above the metrics.
 *
 * @param isWide - Whether the canvas is a landscape ratio.
 * @param showSpec - Whether the table is switched on.
 * @param sheet - Bounds of the content area inside the keyline.
 * @param columns - Title column width and the gap beside it.
 * @param bounds - Content top, stacked table top, metric top, and gutter.
 * @returns The table bounds and the height of one row.
 */
function specLayout(
  isWide: boolean,
  showSpec: boolean,
  sheet: Box,
  columns: { textWidth: number; gap: number },
  bounds: {
    top: number;
    tableTop: number;
    metricsTop: number;
    gutter: number;
  },
) {
  const rowHeight = showSpec
    ? rowHeightFor(
        isWide,
        Math.max(0, bounds.metricsTop - bounds.gutter - bounds.tableTop),
      )
    : 0;
  const height = specSlots * rowHeight;

  if (isWide) {
    return {
      rowHeight,
      area: {
        x: sheet.x + columns.textWidth + columns.gap,
        y: bounds.top,
        width: sheet.width - columns.textWidth - columns.gap,
        height,
      },
    };
  }

  return {
    rowHeight,
    area: {
      x: sheet.x,
      y: Math.max(bounds.tableTop, bounds.metricsTop - bounds.gutter - height),
      width: sheet.width,
      height,
    },
  };
}

/**
 * Sizes a specification row to the height the table has been given.
 *
 * A wide sheet keeps compact rows beside the title block; a tall one lets
 * the rows grow so the table fills the sheet rather than leaving a void.
 *
 * @param isWide - Whether the canvas is a landscape ratio.
 * @param budget - Height available to the whole table.
 * @returns The height of a single row.
 */
function rowHeightFor(isWide: boolean, budget: number) {
  return Math.max(44, Math.min(isWide ? 56 : 140, budget / specSlots));
}

/** Builds the ruled guides drawn behind the sheet on both axes. */
function guideNodes(
  visible: boolean,
  theme: Theme,
  width: number,
  height: number,
): SceneNode[] {
  const opacity = visible ? 0.55 : 0;

  return [
    ...Array.from({ length: guideSlots }, (_, index): SceneNode => {
      const offset = (width * (index + 1)) / (guideSlots + 1);

      return {
        id: `guide-column-${index + 1}`,
        type: 'rect',
        x: offset,
        y: 0,
        width: 1,
        height,
        fill: { kind: 'solid', color: theme.border },
        opacity,
      };
    }),
    ...Array.from({ length: guideSlots }, (_, index): SceneNode => {
      const offset = (height * (index + 1)) / (guideSlots + 1);

      return {
        id: `guide-row-${index + 1}`,
        type: 'rect',
        x: 0,
        y: offset,
        width,
        height: 1,
        fill: { kind: 'solid', color: theme.border },
        opacity,
      };
    }),
  ];
}

/** Builds the hairline keyline drawn along each frame edge. */
function frameNodes(theme: Theme, frame: Box): SceneNode[] {
  const edges = [
    { id: 'frame-top', x: frame.x, y: frame.y, width: frame.width, height: 1 },
    {
      id: 'frame-bottom',
      x: frame.x,
      y: frame.y + frame.height,
      width: frame.width,
      height: 1,
    },
    {
      id: 'frame-left',
      x: frame.x,
      y: frame.y,
      width: 1,
      height: frame.height,
    },
    {
      id: 'frame-right',
      x: frame.x + frame.width,
      y: frame.y,
      width: 1,
      height: frame.height,
    },
  ];

  return edges.map(
    (edge): SceneNode => ({
      ...edge,
      type: 'rect',
      fill: { kind: 'solid', color: theme.border },
      opacity: 0.7,
    }),
  );
}

/** Builds the registration marks that sit at each frame corner. */
function markNodes(theme: Theme, frame: Box): SceneNode[] {
  const right = frame.x + frame.width;
  const bottom = frame.y + frame.height;
  const corners = [
    { id: 'tl', x: frame.x, y: frame.y, dx: 0, dy: 0 },
    { id: 'tr', x: right, y: frame.y, dx: -markLength, dy: 0 },
    { id: 'bl', x: frame.x, y: bottom, dx: 0, dy: -markWeight },
    { id: 'br', x: right, y: bottom, dx: -markLength, dy: -markWeight },
  ];

  return corners.flatMap((corner): SceneNode[] => [
    {
      id: `mark-${corner.id}-horizontal`,
      type: 'rect',
      x: corner.x + corner.dx,
      y: corner.y + corner.dy,
      width: markLength,
      height: markWeight,
      fill: { kind: 'solid', color: theme.accent },
    },
    {
      id: `mark-${corner.id}-vertical`,
      type: 'rect',
      x: corner.x + (corner.dx === 0 ? 0 : -markWeight),
      y: corner.y + (corner.dy === 0 ? 0 : -markLength),
      width: markWeight,
      height: markLength,
      fill: { kind: 'solid', color: theme.accent },
    },
  ]);
}

/** Builds the ruled label and value rows of the specification table. */
function specNodes(
  input: BuildInput,
  visible: boolean,
  monoFamily: string,
  theme: Theme,
  area: Box,
  rowHeight: number,
): SceneNode[] {
  const { repository } = input.data;
  const rows = [
    {
      label: 'License',
      value: repository.license?.spdxId || repository.license?.name || 'None',
    },
    { label: 'Branch', value: repository.defaultBranch },
    { label: 'Created', value: formatDate(repository.createdAt) || '—' },
    { label: 'Updated', value: formatDate(repository.pushedAt) || '—' },
    { label: 'Language', value: input.data.languages[0]?.name || '—' },
  ];
  const opacity = visible ? 1 : 0;
  const labelWidth = area.width * 0.42;
  const fontSize = Math.min(19, Math.max(14, area.width / 24));

  return rows.slice(0, specSlots).flatMap((entry, index): SceneNode[] => {
    const top = area.y + index * rowHeight;

    return [
      {
        id: `spec-rule-${index + 1}`,
        type: 'rect',
        x: area.x,
        y: top,
        width: area.width,
        height: 1,
        fill: { kind: 'solid', color: theme.border },
        opacity,
      },
      textNode(`spec-label-${index + 1}`, {
        x: area.x,
        y: top + spacing.xs + 4,
        width: labelWidth,
        height: 26,
        text: entry.label.toUpperCase(),
        fontFamily: monoFamily,
        fontSize,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 1.6,
        opacity,
      }),
      textNode(`spec-value-${index + 1}`, {
        x: area.x + labelWidth,
        y: top + spacing.xs + 4,
        width: Math.max(0, area.width - labelWidth),
        height: 26,
        text: entry.value,
        fontFamily: monoFamily,
        fontSize,
        fontWeight: 700,
        color: theme.foreground,
        align: 'right',
        opacity,
      }),
    ];
  });
}

/** Builds the metric readout pinned under the title block. */
function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  monoFamily: string,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  // Visible metrics share the band; hidden ones stay in the tree at zero opacity.
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.md);
  const valueSize = Math.min(56, area.width / columns / 3);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-label`, {
        ...cell,
        height: 24,
        text: metric.label.toUpperCase(),
        fontFamily: monoFamily,
        fontSize: 16,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 1.6,
        opacity,
      }),
      textNode(`metric-${metric.value}-value`, {
        ...cell,
        y: cell.y + 28,
        height: valueSize * 1.15,
        text: formatCount(values[metric.value]),
        fontFamily: monoFamily,
        fontSize: valueSize,
        fontWeight: 700,
        color: theme.foreground,
        letterSpacing: -1,
        opacity,
      }),
    ];
  });
}

/** Bundled technical specification sheet template. */
const blueprintTemplate: Template = {
  id: 'blueprint',
  name: 'Blueprint',
  description: 'A technical spec sheet with ruled guides and a data table.',
  category: 'developer',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { blueprintTemplate };
