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
  numberSetting,
  stringArraySetting,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitText } from '@/lib/templates/shared/text';
import {
  autoColor,
  bandScale,
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
import type {
  BuildInput,
  MeasureText,
  SettingField,
  Template,
} from '@/types/template';

/** Largest share of the width the rotated title band may claim. */
const bandShare = 0.24;

/** Quarter turn that stands the title on its baseline down the left edge. */
const quarterTurn = -90;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showAvatar',
    label: 'Owner avatar',
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
  showAvatar: true,
  eyebrow: 'REPOSITORY',
  backgroundColor: palettes.paper.background,
  accentColor: '#1f3ad6',
  textColor: autoColor,
  fontFamily: 'Archivo Variable',
  monoFamily: 'Azeret Mono Variable',
  avatarRadius: 0,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

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
  // into one gap beside the title.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.md : spacing.lg) * scale;

  const nameLineHeight = 1.05;
  const name = fitText(input.measure, {
    text: input.data.repository.name.toUpperCase(),
    fontFamily,
    fontWeight: 800,
    // The rotated line runs the height of the frame, so that is its width.
    maxWidth: frame.height,
    minSize: 34,
    maxSize: Math.max(
      36,
      Math.min(isWide ? 104 : 150, (frame.width * bandShare) / nameLineHeight),
    ),
    maxLines: 1,
    lineHeight: nameLineHeight,
    letterSpacing: -2,
  });
  const bandThickness = name.height;
  const column: Box = {
    x: frame.x + bandThickness + gutter,
    y: frame.y,
    width: Math.max(0, frame.width - bandThickness - gutter),
    height: frame.height,
  };

  const eyebrowHeight = 26 * scale;
  const avatarSize = (isWide ? 56 : 72) * scale;
  const contentTop = frame.y + Math.max(eyebrowHeight, avatarSize) + gutter;
  const footerHeight = 30 * scale;
  const footerTop = frame.y + frame.height - footerHeight;
  // The description takes a share of the column and the ruled rows take the
  // rest, so extra height widens the rows instead of opening a void.
  const bodyBudget = (footerTop - gutter - contentTop) * (isWide ? 0.42 : 0.34);

  const bodyLineHeight = 1.45;
  // The description is set as large as the column allows, so a tall canvas
  // gains type rather than a gap between the header and the metrics.
  const description = fitParagraph(
    input.measure,
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    { fontFamily, maxWidth: column.width, lineHeight: bodyLineHeight },
    Math.max(0, bodyBudget),
    { min: isWide ? 18 : 22, max: isWide ? 34 : 48 },
  );
  const metricsTop = contentTop + description.height + gutter;

  const nodes: SceneNode[] = [
    textNode('repo-name', {
      x: frame.x,
      // A quarter turn about this corner lifts the line up the left edge.
      y: frame.y + frame.height,
      width: frame.height,
      height: bandThickness,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      overflow: 'clip',
      letterSpacing: -2,
      rotation: quarterTurn,
    }),
    {
      id: 'band-rule',
      type: 'rect',
      x: frame.x + bandThickness + gutter * 0.4,
      y: frame.y,
      width: 2,
      height: frame.height,
      fill: { kind: 'solid', color: theme.border },
    },
    textNode('eyebrow', {
      x: column.x,
      y: frame.y,
      width: Math.max(0, column.width - avatarSize - spacing.sm),
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily: monoFamily,
      fontSize: typeScale.eyebrow * 0.85,
      fontWeight: 600,
      color: theme.accent,
      letterSpacing: 2.6,
    }),
    textNode('owner-login', {
      x: column.x,
      y: frame.y + eyebrowHeight + 4,
      width: Math.max(0, column.width - avatarSize - spacing.sm),
      height: eyebrowHeight,
      text: `@${input.data.owner.login}`,
      fontFamily: monoFamily,
      fontSize: typeScale.eyebrow * 0.85,
      fontWeight: 600,
      color: theme.muted,
      letterSpacing: 1.2,
    }),
    {
      id: 'owner-avatar',
      type: 'image',
      x: column.x + column.width - avatarSize,
      y: frame.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: Math.min(
        numberSetting(settings, 'avatarRadius'),
        avatarSize / 2,
      ),
      opacity: booleanSetting(settings, 'showAvatar') ? 1 : 0,
    },
    textNode('repo-description', {
      x: column.x,
      y: contentTop,
      width: column.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: description.fontSize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: description.lines.length,
    }),
    ...metricNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      { fontFamily, monoFamily },
      theme,
      {
        x: column.x,
        y: metricsTop,
        width: column.width,
        height: Math.max(0, footerTop - gutter - metricsTop),
      },
    ),
    {
      id: 'footer-rule',
      type: 'rect',
      x: column.x,
      y: footerTop,
      width: column.width,
      height: 1,
      fill: { kind: 'solid', color: theme.border },
    },
    textNode('footer-label', {
      x: column.x,
      y: footerTop + 8,
      width: column.width,
      height: Math.max(0, footerHeight - 8),
      text: footerText(input),
      fontFamily: monoFamily,
      fontSize: 15,
      fontWeight: 500,
      color: theme.muted,
      letterSpacing: 1.4,
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
 * Finds the largest body size whose wrapped text still fits a height budget.
 *
 * Growing the size costs height twice over, in taller lines and in more of
 * them, so a column this tall needs a search rather than a fixed size.
 *
 * @param measure - Renderer text measurement function.
 * @param text - Description to set in the column.
 * @param style - Typeface, column width, and line height.
 * @param budget - Height the wrapped text may occupy.
 * @param range - Smallest and largest sizes to consider.
 * @returns The chosen size, wrapped lines, and measured bounds.
 */
function fitParagraph(
  measure: MeasureText,
  text: string,
  style: { fontFamily: string; maxWidth: number; lineHeight: number },
  budget: number,
  range: { min: number; max: number },
) {
  const at = (fontSize: number, maxLines?: number) =>
    measure(text, { ...style, fontSize, fontWeight: 400, maxLines });
  // Bounds are whole pixels so the midpoint always advances and the search ends.
  let low = Math.floor(range.min);
  let high = Math.max(low, Math.floor(range.max));

  while (high - low > 1) {
    const size = Math.floor((low + high) / 2);

    if (at(size).height <= budget) {
      low = size;
    } else {
      high = size;
    }
  }

  const maxLines = Math.max(1, Math.floor(budget / (low * style.lineHeight)));

  return { ...at(low, maxLines), fontSize: low };
}

/**
 * Builds the single ruled line that closes the sidebar column.
 *
 * @param input - Project data and measurement tools.
 * @returns The language, licence, and update date, separated by bullets.
 */
function footerText(input: BuildInput) {
  return [
    input.data.languages[0]?.name,
    input.data.repository.license?.spdxId,
    formatDate(input.data.repository.updatedAt),
  ]
    .filter(Boolean)
    .join('  ·  ')
    .toUpperCase();
}

/**
 * Builds the ruled metric rows that close the sidebar column.
 *
 * Rows share the height left below the description, so a taller canvas gives
 * each row a larger number rather than leaving the column half empty. Hidden
 * metrics stay in the tree on the first row at zero opacity.
 *
 * @param input - Project data and measurement tools.
 * @param visibleMetrics - Metric keys switched on in settings.
 * @param fonts - Display and label typefaces.
 * @param theme - Resolved template colours.
 * @param area - Bounds the rows fill.
 * @returns A rule, a label, and a value for every metric slot.
 */
function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fonts: { fontFamily: string; monoFamily: string },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  const rows = Math.max(1, visibleMetrics.length);
  const rowHeight = area.height / rows;
  const labelHeight = 20;
  // The label sits top-left and the value bottom-right, so the number is
  // sized against the whole row rather than what the label leaves behind.
  const valueSize = Math.min(rowHeight * 0.66, area.width / 3.4);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const top = area.y + Math.max(0, visibleIndex) * rowHeight;
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      {
        id: `metric-${metric.value}-rule`,
        type: 'rect',
        x: area.x,
        y: top,
        width: area.width,
        height: 1,
        fill: { kind: 'solid', color: theme.border },
        opacity,
      },
      textNode(`metric-${metric.value}-label`, {
        x: area.x,
        y: top + spacing.xs,
        width: area.width,
        height: labelHeight,
        text: metric.label.toUpperCase(),
        fontFamily: fonts.monoFamily,
        fontSize: 14,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 1.6,
        opacity,
      }),
      textNode(`metric-${metric.value}-value`, {
        x: area.x,
        y: top + rowHeight - valueSize * 1.05,
        width: area.width,
        height: valueSize * 1.05,
        text: formatCount(values[metric.value]),
        fontFamily: fonts.fontFamily,
        fontSize: valueSize,
        fontWeight: 800,
        color: theme.foreground,
        align: 'right',
        letterSpacing: -2,
        opacity,
      }),
    ];
  });
}

/** Bundled template that stands the repository name down the left edge. */
const sidebarTemplate: Template = {
  id: 'sidebar',
  name: 'Sidebar',
  description: 'A rotated title down the edge with a ruled detail column.',
  category: 'developer',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { sidebarTemplate };
