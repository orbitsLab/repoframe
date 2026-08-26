import { formatCount } from '@/lib/templates/shared/format';
import { type Box, inset, row } from '@/lib/templates/shared/layout';
import { textNode } from '@/lib/templates/shared/nodes';
import {
  mergeSettings,
  numberSetting,
  stringArraySetting,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitText } from '@/lib/templates/shared/text';
import {
  displayFontOptions,
  palettes,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const metricOptions = [
  { label: 'Stars', value: 'stars' },
  { label: 'Forks', value: 'forks' },
  { label: 'Watchers', value: 'watchers' },
  { label: 'Issues', value: 'issues' },
  { label: 'Pull requests', value: 'pullRequests' },
];

/** Height reserved for the metric band pinned to the bottom edge. */
const metricBandHeight = 124;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'eyebrow',
    label: 'Eyebrow',
    section: 'content',
    type: 'text',
    maxLength: 40,
  },
  {
    key: 'backgroundStyle',
    label: 'Background',
    section: 'theme',
    type: 'select',
    options: [
      { label: 'Solid', value: 'solid' },
      { label: 'Gradient', value: 'gradient' },
    ],
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
    key: 'cardRadius',
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
  eyebrow: 'OPEN SOURCE PROJECT',
  backgroundStyle: 'gradient',
  backgroundColor: palettes.ink.background,
  accentColor: palettes.ink.accent,
  fontFamily: 'Manrope Variable',
  cardRadius: 32,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (metrics.includes('issues')) {
    paths.push('metrics.issues');
  }

  if (metrics.includes('pullRequests')) {
    paths.push('metrics.pullRequests');
  }

  return paths;
}

function build(input: BuildInput) {
  const settings = mergeSettings(defaultSettings, input.settings);
  const { width, height } = ratioSizes[input.ratio];
  const isWide = width / height > 1.35;
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 72 : 88);
  const theme = resolveTheme(
    stringSetting(settings, 'backgroundColor'),
    stringSetting(settings, 'accentColor'),
  );
  const fontFamily = stringSetting(settings, 'fontFamily');
  const avatarSize = isWide ? 132 : 156;
  const text: Box = isWide
    ? {
        x: frame.x + avatarSize + spacing.lg,
        y: frame.y,
        width: frame.width - avatarSize - spacing.lg,
        height: frame.height,
      }
    : {
        x: frame.x,
        y: frame.y + avatarSize + spacing.lg,
        width: frame.width,
        height: frame.height - avatarSize - spacing.lg,
      };
  const metricArea: Box = {
    x: frame.x,
    y: frame.y + frame.height - metricBandHeight,
    width: frame.width,
    height: metricBandHeight,
  };

  // Text flows from the top of its column down to the metric band.
  const textBudget = metricArea.y - spacing.lg - text.y;
  const rule = { height: 4, gap: spacing.md };
  const eyebrow = { size: typeScale.eyebrow, height: 30, gap: spacing.sm };
  const bodySize = isWide ? 26 : typeScale.body;
  const bodyLineHeight = 1.4;
  const nameLineHeight = 1.08;
  const fixed =
    rule.height + rule.gap + eyebrow.height + eyebrow.gap + spacing.md;
  // The name may only grow into space the description does not need.
  const nameBudget = textBudget - fixed - bodySize * bodyLineHeight * 2;
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 800,
    maxWidth: text.width,
    minSize: 40,
    maxSize: Math.max(
      44,
      Math.min(isWide ? 84 : 128, nameBudget / 2 / nameLineHeight),
    ),
    maxLines: 2,
    lineHeight: nameLineHeight,
  });
  const consumed =
    rule.height + rule.gap + eyebrow.height + eyebrow.gap + name.height;
  const descriptionLines = Math.max(
    1,
    Math.min(
      5,
      Math.floor(
        (textBudget - consumed - spacing.md) / (bodySize * bodyLineHeight),
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
      maxWidth: text.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );
  const stackHeight =
    rule.height +
    rule.gap +
    eyebrow.height +
    eyebrow.gap +
    name.height +
    spacing.md +
    description.height;
  // Leftover height is shared above and below the stack rather than pooling
  // into one gap above the metric band.
  let cursor = text.y + Math.max(0, (textBudget - stackHeight) * 0.42);
  const ruleY = cursor;
  cursor += rule.height + rule.gap;
  const eyebrowY = cursor;
  cursor += eyebrow.height + eyebrow.gap;
  const nameY = cursor;
  cursor += name.height + spacing.md;
  const descriptionY = cursor;

  const nodes: SceneNode[] = [
    {
      id: 'accent-line',
      type: 'rect',
      x: text.x,
      y: ruleY,
      width: 96,
      height: rule.height,
      fill: { kind: 'solid', color: theme.accent },
      cornerRadius: 2,
    },
    {
      id: 'owner-avatar',
      type: 'image',
      x: frame.x,
      y: frame.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: numberSetting(settings, 'cardRadius'),
    },
    textNode('eyebrow', {
      x: text.x,
      y: eyebrowY,
      width: text.width,
      height: eyebrow.height,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: eyebrow.size,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 2.5,
    }),
    textNode('repo-name', {
      x: text.x,
      y: nameY,
      width: text.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
      letterSpacing: -1,
    }),
    textNode('repo-description', {
      x: text.x,
      y: descriptionY,
      width: text.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: metricArea.x,
      y: metricArea.y,
      width: metricArea.width,
      height: 2,
      fill: { kind: 'solid', color: theme.border },
    },
    ...metricNodes(
      input,
      fontFamily,
      theme,
      stringArraySetting(settings, 'metrics'),
      {
        ...metricArea,
        y: metricArea.y + spacing.md,
        height: metricArea.height - spacing.md,
      },
    ),
  ];

  return {
    width,
    height,
    background:
      stringSetting(settings, 'backgroundStyle') === 'gradient'
        ? {
            kind: 'linear' as const,
            angle: 135,
            stops: [
              { offset: 0, color: theme.background },
              { offset: 1, color: theme.surface },
            ],
          }
        : { kind: 'solid' as const, color: theme.background },
    nodes,
  };
}

function metricNodes(
  input: BuildInput,
  fontFamily: string,
  theme: Theme,
  visibleMetrics: string[],
  area: Box,
) {
  const values: Record<string, number | undefined> = {
    stars: input.data.metrics.stars,
    forks: input.data.metrics.forks,
    watchers: input.data.metrics.watchers,
    issues: input.data.metrics.issues,
    pullRequests: input.data.metrics.pullRequests,
  };
  // Visible metrics share the band; hidden ones stay in the tree at zero opacity.
  const columns = Math.max(1, visibleMetrics.length);
  const visibleBoxes = row(area, columns, spacing.lg);
  const valueSize = Math.min(typeScale.metric, area.width / columns / 2.6);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const box = visibleBoxes[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        ...box,
        height: valueSize * 1.1,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: valueSize,
        fontWeight: 800,
        color: theme.foreground,
        letterSpacing: -1,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...box,
        y: box.y + valueSize * 1.1 + 6,
        height: 26,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: 18,
        fontWeight: 600,
        color: theme.muted,
        letterSpacing: 1.8,
        opacity,
      }),
    ];
  });
}

/** Bundled minimal editorial repository card template. */
const minimalTemplate: Template = {
  id: 'minimal',
  name: 'Minimal',
  description: 'An editorial repository card with restrained typography.',
  category: 'minimal',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { minimalTemplate };
