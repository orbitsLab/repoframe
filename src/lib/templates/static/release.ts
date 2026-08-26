import { formatCount, formatDate } from '@/lib/templates/shared/format';
import { type Box, inset, row } from '@/lib/templates/shared/layout';
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
  displayFontOptions,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const metricOptions = [
  { label: 'Stars', value: 'stars' },
  { label: 'Forks', value: 'forks' },
  { label: 'Watchers', value: 'watchers' },
  { label: 'Issues', value: 'issues' },
  { label: 'PRs', value: 'pullRequests' },
];

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showRelease',
    label: 'Release',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showLicense',
    label: 'License',
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
  metrics: ['stars', 'forks'],
  showRelease: true,
  showLicense: true,
  eyebrow: 'NEW RELEASE',
  backgroundColor: '#0f172a',
  accentColor: '#38bdf8',
  fontFamily: 'Archivo Variable',
  cardRadius: 28,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showRelease')) {
    paths.push('latestRelease');
  }

  if (metrics.includes('issues')) {
    paths.push('metrics.issues');
  }

  if (metrics.includes('pullRequests')) {
    paths.push('metrics.pullRequests');
  }

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
  const content = inset({ x: 0, y: 0, width, height }, isWide ? 72 : 88);
  const showRelease = booleanSetting(settings, 'showRelease');
  const release = showRelease ? input.data.latestRelease : undefined;
  const visibleMetrics = stringArraySetting(settings, 'metrics');
  const showLicense = booleanSetting(settings, 'showLicense');

  const footerHeight = 96;
  const footerTop = content.y + content.height - footerHeight;
  const avatarSize = 64;
  const headHeight = avatarSize;
  const eyebrowTop = content.y + headHeight + spacing.lg;
  const subtitleReserve = 34 + spacing.sm;
  const tagBudget = footerTop - spacing.lg - eyebrowTop - 34 - subtitleReserve;
  const tag = fitText(input.measure, {
    text: release?.tagName ?? '—',
    fontFamily,
    fontWeight: 800,
    maxWidth: content.width,
    minSize: 56,
    maxSize: Math.max(60, Math.min(isWide ? 168 : 320, tagBudget / 1.05)),
    maxLines: 1,
    lineHeight: 1.05,
  });
  // The announcement block sits centred between the header and the footer, so a
  // tall canvas reads as deliberate spacing rather than a hole in the middle.
  const announcementHeight = 34 + tag.height + spacing.sm + 34;
  const announcementTop =
    eyebrowTop +
    Math.max(
      0,
      (footerTop - spacing.lg - eyebrowTop - announcementHeight) * 0.45,
    );
  const tagTop = announcementTop + 34;
  // GitHub usually repeats the tag as the release name; fall back to the date.
  const subtitle =
    release?.name && release.name !== release.tagName
      ? release.name
      : formatDate(release?.publishedAt);

  const nodes: SceneNode[] = [
    {
      id: 'owner-avatar',
      type: 'image',
      x: content.x,
      y: content.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: numberSetting(settings, 'cardRadius') / 2,
    },
    textNode('repo-name', {
      x: content.x + avatarSize + spacing.sm,
      y: content.y + 8,
      width: content.width - avatarSize - spacing.sm,
      height: 34,
      text: input.data.repository.fullName,
      fontFamily,
      fontSize: 26,
      fontWeight: 700,
      color: theme.foreground,
    }),
    textNode('repo-license', {
      x: content.x + avatarSize + spacing.sm,
      y: content.y + 40,
      width: content.width - avatarSize - spacing.sm,
      height: 26,
      text: input.data.repository.license?.name ?? '',
      fontFamily,
      fontSize: 18,
      fontWeight: 500,
      color: theme.muted,
      opacity: showLicense && input.data.repository.license ? 1 : 0,
    }),
    textNode('eyebrow', {
      x: content.x,
      y: announcementTop,
      width: content.width,
      height: 30,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: 21,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 3,
    }),
    textNode('release-tag', {
      x: content.x,
      y: tagTop,
      width: content.width,
      height: tag.height,
      text: tag.lines.join('\n'),
      fontFamily,
      fontSize: tag.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: tag.lineHeight,
      letterSpacing: -3,
    }),
    textNode('release-subtitle', {
      x: content.x,
      y: tagTop + tag.height + spacing.sm,
      width: content.width,
      height: 34,
      text: subtitle,
      fontFamily,
      fontSize: 24,
      fontWeight: 500,
      color: theme.muted,
      opacity: release ? 1 : 0,
    }),
    {
      id: 'footer-rule',
      type: 'rect',
      x: content.x,
      y: footerTop,
      width: content.width,
      height: 2,
      fill: { kind: 'solid', color: theme.border },
    },
    ...metricNodes(input, visibleMetrics, fontFamily, theme, {
      x: content.x,
      y: footerTop + spacing.md,
      width: content.width,
      height: footerHeight - spacing.md,
    }),
  ];

  return {
    width,
    height,
    background: {
      kind: 'linear',
      angle: 150,
      stops: [
        { offset: 0, color: theme.background },
        { offset: 1, color: theme.surface },
      ],
    },
    nodes,
  };
}

function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  area: Box,
) {
  const values: Record<string, number | undefined> = {
    stars: input.data.metrics.stars,
    forks: input.data.metrics.forks,
    watchers: input.data.metrics.watchers,
    issues: input.data.metrics.issues,
    pullRequests: input.data.metrics.pullRequests,
  };
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.lg);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: 42,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: 36,
        fontWeight: 800,
        color: theme.foreground,
        letterSpacing: -1,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        x: cell.x,
        y: cell.y + 46,
        width: cell.width,
        height: 24,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: 16,
        fontWeight: 600,
        color: theme.muted,
        letterSpacing: 1.6,
        opacity,
      }),
    ];
  });
}

/** Bundled release announcement template. */
const releaseTemplate: Template = {
  id: 'release',
  name: 'Release',
  description: 'A release announcement card built around the latest tag.',
  category: 'developer',
  supportedRatios: ['16:9', '1:1', '4:5', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { releaseTemplate };
