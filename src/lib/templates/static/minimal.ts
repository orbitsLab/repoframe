import { formatCount } from '@/lib/templates/shared/format';
import { inset, row } from '@/lib/templates/shared/layout';
import { textNode } from '@/lib/templates/shared/nodes';
import {
  mergeSettings,
  numberSetting,
  stringArraySetting,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitFontSize } from '@/lib/templates/shared/text';
import {
  displayFontOptions,
  palettes,
  ratioSizes,
  spacing,
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

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible metrics',
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
    label: 'Card radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 48,
    step: 4,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'watchers'],
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
  const content = inset({ x: 0, y: 0, width, height }, spacing.xxl);
  const isWide = width / height > 1.35;
  const fontFamily = stringSetting(settings, 'fontFamily');
  const accentColor = stringSetting(settings, 'accentColor');
  const backgroundColor = stringSetting(settings, 'backgroundColor');
  const metrics = stringArraySetting(settings, 'metrics');
  const avatarSize = isWide ? 156 : 180;
  const textX = isWide ? content.x + avatarSize + spacing.lg : content.x;
  const textY = isWide
    ? content.y + spacing.sm
    : content.y + avatarSize + spacing.lg;
  const textWidth = isWide
    ? content.width - avatarSize - spacing.lg
    : content.width;
  const nameSize = fitFontSize(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 800,
    maxWidth: textWidth,
    minSize: 38,
    maxSize: isWide ? typeScale.display : 78,
  });
  const description =
    input.data.repository.description ||
    `Open-source software by ${input.data.owner.login}.`;
  const measuredDescription = input.measure(description, {
    fontFamily,
    fontSize: typeScale.body,
    fontWeight: 400,
    maxWidth: textWidth,
    lineHeight: 1.35,
    maxLines: isWide ? 3 : 5,
  });
  const metricArea = {
    x: content.x,
    y: content.y + content.height - 132,
    width: content.width,
    height: 132,
  };
  const nodes: SceneNode[] = [
    {
      id: 'accent-line',
      type: 'rect',
      x: 0,
      y: 0,
      width: isWide ? 16 : width,
      height: isWide ? height : 16,
      fill: { kind: 'solid', color: accentColor },
    },
    {
      id: 'owner-avatar',
      type: 'image',
      x: content.x,
      y: content.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: numberSetting(settings, 'cardRadius'),
    },
    textNode('eyebrow', {
      x: textX,
      y: textY,
      width: textWidth,
      height: 32,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: accentColor,
      letterSpacing: 2,
    }),
    textNode('repo-name', {
      x: textX,
      y: textY + 48,
      width: textWidth,
      height: nameSize * 1.15,
      text: input.data.repository.fullName,
      fontFamily,
      fontSize: nameSize,
      fontWeight: 800,
      color: palettes.ink.foreground,
    }),
    textNode('repo-description', {
      x: textX,
      y: textY + 64 + nameSize * 1.15,
      width: textWidth,
      height: measuredDescription.height,
      text: measuredDescription.lines.join('\n'),
      fontFamily,
      fontSize: typeScale.body,
      fontWeight: 400,
      color: palettes.ink.muted,
      lineHeight: 1.35,
      maxLines: isWide ? 3 : 5,
    }),
    ...metricNodes(input, fontFamily, metrics, metricArea),
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
              { offset: 0, color: backgroundColor },
              { offset: 1, color: '#e8e2ff' },
            ],
          }
        : { kind: 'solid' as const, color: backgroundColor },
    nodes,
  };
}

function metricNodes(
  input: BuildInput,
  fontFamily: string,
  visibleMetrics: string[],
  area: { x: number; y: number; width: number; height: number },
) {
  const values: Record<string, number | undefined> = {
    stars: input.data.metrics.stars,
    forks: input.data.metrics.forks,
    watchers: input.data.metrics.watchers,
    issues: input.data.metrics.issues,
    pullRequests: input.data.metrics.pullRequests,
  };

  const visibleBoxes = row(
    area,
    Math.max(1, visibleMetrics.length),
    spacing.sm,
  );

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const box = visibleBoxes[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        ...box,
        height: 68,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: typeScale.metric,
        fontWeight: 700,
        color: palettes.ink.foreground,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...box,
        y: box.y + 76,
        height: 36,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: 18,
        fontWeight: 600,
        color: palettes.ink.muted,
        letterSpacing: 1.5,
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
