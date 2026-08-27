import { formatCount } from '@/lib/templates/shared/format';
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
  numberSetting,
  stringArraySetting,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitText } from '@/lib/templates/shared/text';
import {
  bandScale,
  displayFontOptions,
  monoFontOptions,
  palettes,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

/**
 * Bar colours keyed by rank rather than language name.
 *
 * Declared per template so each one can tune its own palette, matching how
 * the other bundled templates carry their colour choices.
 */
const barColors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

/** Fixed slot count so node ids stay stable as data changes. */
const languageSlots = 5;

/** Upper bound on avatar slots, matching what the contributors fetch returns. */
const contributorLimit = 30;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showLanguages',
    label: 'Language bars',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showContributors',
    label: 'Contributors',
    section: 'content',
    type: 'toggle',
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
  {
    key: 'barRadius',
    label: 'Bar radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 12,
    step: 2,
    unit: 'px',
  },
  {
    key: 'avatarRadius',
    label: 'Avatar radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 48,
    step: 4,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showLanguages: true,
  showContributors: true,
  backgroundColor: palettes.terminal.background,
  accentColor: '#f97316',
  fontFamily: 'DM Sans Variable',
  monoFamily: 'Roboto Mono Variable',
  barRadius: 6,
  avatarRadius: 48,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showLanguages')) {
    paths.push('languages');
  }

  if (booleanSetting(resolved, 'showContributors')) {
    paths.push('contributors');
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
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 56 : 88);
  // Bands grow with the canvas so a tall card does not pool its extra height
  // into one gap around the language bars.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.sm : spacing.md) * scale;
  const showLanguages = booleanSetting(settings, 'showLanguages');
  const showContributors = booleanSetting(settings, 'showContributors');

  const avatarSize = (isWide ? 64 : 84) * scale;
  const headerTextWidth = Math.max(0, frame.width - avatarSize - spacing.md);
  const loginHeight = 22 * scale;
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 800,
    maxWidth: headerTextWidth,
    minSize: 22,
    // The name and the login below it both have to sit within the avatar.
    maxSize: Math.max(24, (avatarSize - loginHeight - 4) / 1.1),
    maxLines: 1,
    lineHeight: 1.1,
  });
  const headerTextTop =
    frame.y + Math.max(0, (avatarSize - name.height - 4 - loginHeight) / 2);

  const bodySize = (isWide ? 22 : 26) * Math.min(1.25, scale);
  const bodyLineHeight = 1.4;
  const descriptionLines = isWide ? 1 : 2;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: frame.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );
  const descriptionY = frame.y + avatarSize + gutter;

  const metricBandHeight = (isWide ? 78 : 96) * scale;
  const metricsTop = frame.y + frame.height - metricBandHeight;
  const contributorHeight = showContributors ? (isWide ? 62 : 86) * scale : 0;

  const headingHeight = 24 * scale;
  const blocksTop = descriptionY + description.height;
  const available = Math.max(0, metricsTop - blocksTop);
  const rows = rowsLayout(
    showLanguages,
    isWide,
    Math.max(
      0,
      available - headingHeight - 10 - contributorHeight - gutter * 3,
    ),
    rankedLanguages(input).length,
    scale,
  );
  const languagesBlock =
    rows.visibleRows > 0
      ? headingHeight + 10 + rows.height * rows.visibleRows
      : 0;
  // Slack is split between the description, the bars, and the people, so a
  // tall canvas never opens one large hole around the chart.
  const slack = Math.max(
    gutter,
    (available - languagesBlock - contributorHeight) / 3,
  );
  const languagesTop = blocksTop + slack;
  const rowsTop = languagesTop + headingHeight + 10;
  const rowsBottom = rowsTop + rows.height * rows.visibleRows;
  const contributorsTop = Math.max(
    rowsBottom,
    Math.min(rowsBottom + slack, metricsTop - contributorHeight),
  );

  const nodes: SceneNode[] = [
    {
      id: 'owner-avatar',
      type: 'image',
      x: frame.x,
      y: frame.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: Math.min(
        numberSetting(settings, 'avatarRadius'),
        avatarSize / 2,
      ),
    },
    textNode('repo-name', {
      x: frame.x + avatarSize + spacing.md,
      y: headerTextTop,
      width: headerTextWidth,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      letterSpacing: -0.8,
    }),
    textNode('owner-login', {
      x: frame.x + avatarSize + spacing.md,
      y: headerTextTop + name.height + 4,
      width: headerTextWidth,
      height: loginHeight,
      text: `@${input.data.owner.login}`,
      fontFamily: monoFamily,
      fontSize: 17,
      fontWeight: 500,
      color: theme.accent,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: frame.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    textNode('languages-heading', {
      x: frame.x,
      y: languagesTop,
      width: frame.width,
      height: headingHeight,
      text: 'LANGUAGE BREAKDOWN',
      fontFamily: monoFamily,
      fontSize: 16,
      fontWeight: 600,
      color: theme.muted,
      letterSpacing: 2,
      opacity: showLanguages ? 1 : 0,
    }),
    ...languageNodes(
      input,
      rows.visibleRows,
      numberSetting(settings, 'barRadius'),
      scale,
      { fontFamily, monoFamily },
      theme,
      {
        x: frame.x,
        y: rowsTop,
        width: frame.width,
        height: rows.height,
      },
    ),
    ...contributorNodes(
      input,
      showContributors,
      numberSetting(settings, 'avatarRadius'),
      { fontFamily, monoFamily },
      theme,
      {
        x: frame.x,
        y: contributorsTop,
        width: frame.width,
        height: contributorHeight,
      },
    ),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: frame.x,
      y: metricsTop,
      width: frame.width,
      height: 1,
      fill: { kind: 'solid', color: theme.border },
    },
    ...metricNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      { fontFamily, monoFamily },
      theme,
      {
        x: frame.x,
        y: metricsTop + spacing.sm,
        width: frame.width,
        height: Math.max(0, metricBandHeight - spacing.sm),
      },
    ),
  ];

  return {
    width,
    height,
    background: {
      kind: 'linear',
      angle: 165,
      stops: [
        { offset: 0, color: theme.background },
        { offset: 1, color: theme.surface },
      ],
    },
    nodes,
  };
}

/** Height of the name above each language bar. */
const labelHeight = 24;

/**
 * Thickness of a language bar at the given band scale.
 *
 * @param scale - Band scale for the canvas height.
 * @returns The bar height in pixels.
 */
function barHeightFor(scale: number) {
  return 20 * scale;
}

/** Reads the languages that hold a large enough share to earn a bar. */
function rankedLanguages(input: BuildInput) {
  return input.data.languages
    .filter((language) => language.percentage >= 0.5)
    .slice(0, languageSlots);
}

/**
 * Distributes the language bars across the height left between the
 * description and the contributor strip.
 *
 * Rows follow the languages the repository actually has, so a single-language
 * project gets one full-height bar rather than a block of empty rows. A wide
 * canvas caps the count lower so each row keeps a legible height.
 *
 * @param visible - Whether the language bars are switched on.
 * @param isWide - Whether the canvas is a landscape ratio.
 * @param budget - Height available to the whole bar block.
 * @param available - Number of languages that qualify for a bar.
 * @returns The row count, per-row height, and centring offset.
 */
function rowsLayout(
  visible: boolean,
  isWide: boolean,
  budget: number,
  available: number,
  scale: number,
) {
  if (!visible || available === 0) {
    return { visibleRows: 0, height: 0 };
  }

  const visibleRows = Math.min(isWide ? 3 : languageSlots, available);
  // A row is sized by what it holds, so leftover height falls into the gaps
  // between blocks rather than stretching one row into a void.
  const natural = labelHeight + 8 + barHeightFor(scale) + 26 * scale;

  return {
    visibleRows,
    height: Math.min(natural, budget / visibleRows),
  };
}

/** Builds a labelled proportional bar for each ranked language. */
function languageNodes(
  input: BuildInput,
  visibleRows: number,
  barRadius: number,
  scale: number,
  fonts: { fontFamily: string; monoFamily: string },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const languages = rankedLanguages(input);
  const barHeight = Math.max(
    8,
    Math.min(barHeightFor(scale), Math.max(0, area.height - labelHeight - 8)),
  );

  return Array.from({ length: languageSlots }, (_, index): SceneNode[] => {
    const language = languages[index];
    const shown = index < visibleRows && Boolean(language);
    const top = area.y + index * area.height;
    const barTop = top + labelHeight + 8;
    const share = language ? language.percentage / 100 : 0;

    return [
      textNode(`language-label-${index + 1}`, {
        x: area.x,
        y: top,
        width: area.width * 0.6,
        height: labelHeight,
        text: language?.name ?? '',
        fontFamily: fonts.fontFamily,
        fontSize: 20,
        fontWeight: 700,
        color: theme.foreground,
        opacity: shown ? 1 : 0,
      }),
      textNode(`language-value-${index + 1}`, {
        x: area.x + area.width * 0.6,
        y: top,
        width: area.width * 0.4,
        height: labelHeight,
        text: language ? `${language.percentage.toFixed(1)}%` : '',
        fontFamily: fonts.monoFamily,
        fontSize: 19,
        fontWeight: 600,
        color: theme.muted,
        align: 'right',
        opacity: shown ? 1 : 0,
      }),
      {
        id: `language-track-${index + 1}`,
        type: 'rect',
        x: area.x,
        y: barTop,
        width: area.width,
        height: barHeight,
        fill: { kind: 'solid', color: theme.border },
        cornerRadius: barRadius,
        opacity: shown ? 1 : 0,
      },
      {
        id: `language-fill-${index + 1}`,
        type: 'rect',
        x: area.x,
        y: barTop,
        width: Math.max(barHeight, area.width * share),
        height: barHeight,
        fill: { kind: 'solid', color: barColors[index] },
        cornerRadius: barRadius,
        opacity: shown ? 1 : 0,
      },
    ];
  }).flat();
}

/** Builds the contributor avatar strip and its heading. */
function contributorNodes(
  input: BuildInput,
  visible: boolean,
  avatarRadius: number,
  fonts: { fontFamily: string; monoFamily: string },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const all = input.data.contributors ?? [];
  const headingHeight = 22;
  const avatarSize = Math.max(0, Math.min(48, area.height - headingHeight - 6));
  const gap = 12;
  // Slots come from the width the row has, not from how many contributors
  // came back, so the node ids stay put when the data changes.
  const slots =
    avatarSize > 0
      ? Math.max(
          1,
          Math.min(
            contributorLimit,
            Math.floor((area.width + gap) / (avatarSize + gap)),
          ),
        )
      : 0;
  const contributors = all.slice(0, slots);
  const opacity = visible ? 1 : 0;

  return [
    textNode('contributors-heading', {
      x: area.x,
      y: area.y,
      width: area.width * 0.6,
      height: headingHeight,
      text: 'CONTRIBUTORS',
      fontFamily: fonts.monoFamily,
      fontSize: 16,
      fontWeight: 600,
      color: theme.muted,
      letterSpacing: 2,
      opacity,
    }),
    textNode('contributors-summary', {
      x: area.x + area.width * 0.6,
      y: area.y,
      width: area.width * 0.4,
      height: headingHeight,
      text: all.length > 0 ? String(all.length) : '',
      fontFamily: fonts.monoFamily,
      fontSize: 16,
      fontWeight: 600,
      color: theme.muted,
      align: 'right',
      letterSpacing: 2,
      opacity,
    }),
    ...Array.from({ length: slots }, (_, index): SceneNode => {
      const contributor = contributors[index];

      return {
        id: `contributor-avatar-${index + 1}`,
        type: 'image',
        x: area.x + index * (avatarSize + gap),
        y: area.y + headingHeight + 6,
        width: avatarSize,
        height: avatarSize,
        src: contributor?.avatarUrl ?? input.data.owner.avatarUrl,
        fit: 'cover',
        cornerRadius: Math.min(avatarRadius, avatarSize / 2),
        opacity: visible && contributor ? 1 : 0,
      };
    }),
  ];
}

/** Builds the metric readout pinned to the bottom edge. */
function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fonts: { fontFamily: string; monoFamily: string },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  // Visible metrics share the band; hidden ones stay in the tree at zero opacity.
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.md);
  const valueSize = Math.min(area.height * 0.52, area.width / columns / 3.4);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        ...cell,
        height: valueSize * 1.15,
        text: formatCount(values[metric.value]),
        fontFamily: fonts.fontFamily,
        fontSize: valueSize,
        fontWeight: 800,
        color: theme.foreground,
        letterSpacing: -0.8,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...cell,
        y: cell.y + valueSize * 1.15 + 2,
        height: 22,
        text: metric.label.toUpperCase(),
        fontFamily: fonts.monoFamily,
        fontSize: 15,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 1.6,
        opacity,
      }),
    ];
  });
}

/** Bundled template that leads with the repository language breakdown. */
const stackTemplate: Template = {
  id: 'stack',
  name: 'Stack',
  description: 'A language breakdown card with proportional bars and people.',
  category: 'developer',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { stackTemplate };
