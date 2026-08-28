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
  autoColor,
  bandScale,
  displayFontOptions,
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

const settingsSchema: SettingField[] = [
  {
    key: 'heroMetric',
    label: 'Headline metric',
    section: 'content',
    type: 'select',
    options: metricOptions,
  },
  {
    key: 'metrics',
    label: 'Supporting metrics',
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
  heroMetric: 'stars',
  metrics: ['forks', 'watchers', 'issues'],
  showAvatar: true,
  eyebrow: 'GITHUB REPOSITORY',
  backgroundColor: palettes.paper.background,
  accentColor: palettes.paper.accent,
  textColor: autoColor,
  fontFamily: 'Outfit Variable',
  avatarRadius: 40,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const shown = [
    stringSetting(resolved, 'heroMetric'),
    ...stringArraySetting(resolved, 'metrics'),
  ];
  const paths: ProjectDataPath[] = ['repository'];

  // The headline and supporting rows can name the same metric, which the
  // shared lookup already collapses into one path.
  paths.push(...metricPaths(shown));

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
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 72 : 96);
  // Bands grow with the canvas so a tall ratio does not pool its extra
  // height into one gap around the headline.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.md : spacing.lg) * scale;

  const avatarSize = (isWide ? 72 : 88) * scale;
  const eyebrowHeight = 30 * scale;
  const headerWidth = Math.max(0, frame.width - avatarSize - spacing.md);
  const nameTop = frame.y + eyebrowHeight + spacing.sm;
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 700,
    maxWidth: headerWidth,
    minSize: 26,
    maxSize: isWide ? 44 : 54,
    maxLines: 2,
    lineHeight: 1.12,
  });
  const bodySize = (isWide ? 22 : 26) * Math.min(1.25, scale);
  const bodyLineHeight = 1.45;
  // A tall canvas has room for more of the description above the headline.
  const descriptionLines = isWide ? 2 : 3;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: headerWidth,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );
  const descriptionY = nameTop + name.height + spacing.sm * scale;

  const metricBandHeight = (isWide ? 104 : 122) * scale;
  const metricsTop = frame.y + frame.height - metricBandHeight;
  const heroTop = descriptionY + description.height + gutter;
  const heroBudget = Math.max(0, metricsTop - gutter - heroTop);
  const heroLabelHeight = 36 * scale;
  const heroMetric = stringSetting(settings, 'heroMetric');
  const heroOption =
    metricOptions.find((option) => option.value === heroMetric) ??
    metricOptions[0];
  const heroValues = metricValues(input.data);
  // The numeral takes every pixel the label and gaps do not need.
  const hero = fitText(input.measure, {
    text: formatCount(heroValues[heroOption.value]),
    fontFamily,
    fontWeight: 800,
    maxWidth: frame.width,
    minSize: 64,
    maxSize: Math.max(
      68,
      Math.min(
        typeScale.display * 4,
        (heroBudget - heroLabelHeight - spacing.sm) / 1.02,
      ),
    ),
    maxLines: 1,
    lineHeight: 1.02,
    letterSpacing: -6,
  });
  const heroStackHeight = hero.height + spacing.sm + heroLabelHeight;
  const heroValueY = heroTop + Math.max(0, (heroBudget - heroStackHeight) / 2);
  const heroLabelY = heroValueY + hero.height + spacing.sm;

  const nodes: SceneNode[] = [
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: headerWidth,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 2.5,
    }),
    {
      id: 'owner-avatar',
      type: 'image',
      x: frame.x + frame.width - avatarSize,
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
    textNode('repo-name', {
      x: frame.x,
      y: nameTop,
      width: headerWidth,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
      letterSpacing: -0.6,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: headerWidth,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    textNode('hero-value', {
      x: frame.x,
      y: heroValueY,
      width: frame.width,
      height: hero.height,
      text: hero.lines.join('\n'),
      fontFamily,
      fontSize: hero.fontSize,
      fontWeight: 800,
      color: theme.accent,
      lineHeight: hero.lineHeight,
      letterSpacing: -6,
    }),
    textNode('hero-label', {
      x: frame.x,
      y: heroLabelY,
      width: frame.width,
      height: heroLabelHeight,
      text: heroOption.label.toUpperCase(),
      fontFamily,
      fontSize: 24 * Math.min(1.3, scale),
      fontWeight: 700,
      color: theme.muted,
      letterSpacing: 4,
    }),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: frame.x,
      y: metricsTop,
      width: frame.width,
      height: 2,
      fill: { kind: 'solid', color: theme.border },
    },
    ...metricNodes(
      input,
      // The headline already carries its own metric, so the row never
      // repeats it back underneath.
      stringArraySetting(settings, 'metrics').filter(
        (metric) => metric !== heroOption.value,
      ),
      fontFamily,
      theme,
      {
        x: frame.x,
        y: metricsTop + spacing.md * scale,
        width: frame.width,
        height: Math.max(0, metricBandHeight - spacing.md * scale),
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

/** Builds the supporting metric row pinned to the bottom edge. */
function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  // Visible metrics share the band; hidden ones stay in the tree at zero opacity.
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.lg);
  const valueSize = Math.min(area.height * 0.52, area.width / columns / 3.2);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        ...cell,
        height: valueSize * 1.15,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: valueSize,
        fontWeight: 700,
        color: theme.foreground,
        letterSpacing: -0.8,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...cell,
        y: cell.y + valueSize * 1.15 + 4,
        height: 24,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: 16,
        fontWeight: 600,
        color: theme.muted,
        letterSpacing: 1.8,
        opacity,
      }),
    ];
  });
}

/** Bundled headline-metric template built around one large number. */
const signalTemplate: Template = {
  id: 'signal',
  name: 'Signal',
  description: 'A headline metric card built around one oversized number.',
  category: 'minimal',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { signalTemplate };
