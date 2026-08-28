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
  displayFontOptions,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const languageColors = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

/** Fixed slot counts so node ids stay stable as data changes. */
const topicSlots = 6;
const languageSlots = 5;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showTopics',
    label: 'Topics',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showLanguages',
    label: 'Languages',
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
    max: 96,
    step: 8,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showTopics: true,
  showLanguages: true,
  backgroundColor: '#101014',
  accentColor: '#f97316',
  textColor: autoColor,
  fontFamily: 'Sora Variable',
  avatarRadius: 96,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showTopics')) {
    paths.push('topics');
  }

  if (booleanSetting(resolved, 'showLanguages')) {
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
    stringSetting(settings, 'textColor'),
  );
  const fontFamily = stringSetting(settings, 'fontFamily');
  const content = inset({ x: 0, y: 0, width, height }, isWide ? 64 : 96);
  const showTopics = booleanSetting(settings, 'showTopics');
  const showLanguages = booleanSetting(settings, 'showLanguages');
  const visibleMetrics = stringArraySetting(settings, 'metrics');

  // Bottom-anchored blocks are measured first so the centred stack knows its room.
  const gutter = isWide ? spacing.md : spacing.lg;
  const metricsHeight = isWide ? 92 : 108;
  const languageBlock = showLanguages ? (isWide ? 64 : 74) : 0;
  const metricsTop = content.y + content.height - metricsHeight;
  const languageTop = metricsTop - gutter - languageBlock;
  const topicsHeight = showTopics ? (isWide ? 44 : 48) : 0;
  const topicsTop =
    (showLanguages ? languageTop : metricsTop) - gutter - topicsHeight;

  const avatarSize = isWide ? 96 : 168;
  const avatarX = content.x + (content.width - avatarSize) / 2;
  const bodySize = isWide ? 24 : 28;
  const bodyLineHeight = 1.45;
  const nameLineHeight = 1.08;
  const nameTop = content.y + avatarSize + spacing.md;
  const ownerBlock = 26 + spacing.sm;
  // The name may only grow into space the byline and description do not need.
  const nameBudget =
    topicsTop -
    spacing.md -
    nameTop -
    ownerBlock -
    bodySize * bodyLineHeight * 2;
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 800,
    maxWidth: content.width,
    minSize: 40,
    maxSize: Math.max(
      44,
      Math.min(
        isWide ? 76 : typeScale.display * 1.5,
        nameBudget / 1 / nameLineHeight,
      ),
    ),
    maxLines: 2,
    lineHeight: nameLineHeight,
  });
  // Leftover height is shared above and below the centred stack so a tall
  // canvas does not open a hole between the description and the topics.
  const stackHeight = name.height + 10 + ownerBlock;
  const slack = Math.max(
    0,
    (topicsTop -
      spacing.md -
      nameTop -
      stackHeight -
      bodySize * bodyLineHeight) *
      0.35,
  );
  // Byline sits between the name and the description, never on top of either.
  const ownerY = nameTop + slack + name.height + 10;
  const descriptionY = ownerY + ownerBlock;
  const descriptionLines = Math.max(
    1,
    Math.min(
      4,
      Math.floor(
        (topicsTop - spacing.md - descriptionY) / (bodySize * bodyLineHeight),
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
      maxWidth: content.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );

  const nodes: SceneNode[] = [
    {
      id: 'owner-avatar',
      type: 'image',
      x: avatarX,
      y: content.y,
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
      x: content.x,
      y: nameTop + slack,
      width: content.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      align: 'center',
      lineHeight: name.lineHeight,
      maxLines: 2,
      letterSpacing: -1.5,
    }),
    textNode('owner-login', {
      x: content.x,
      y: ownerY,
      width: content.width,
      height: 26,
      text: `by @${input.data.owner.login}`,
      fontFamily,
      fontSize: 20,
      fontWeight: 600,
      color: theme.accent,
      align: 'center',
    }),
    textNode('repo-description', {
      x: content.x,
      y: descriptionY,
      width: content.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      align: 'center',
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    ...topicNodes(input, showTopics, fontFamily, theme, {
      x: content.x,
      y: topicsTop,
      width: content.width,
      height: topicsHeight,
    }),
    ...languageNodes(input, showLanguages, fontFamily, theme, {
      x: content.x,
      y: languageTop,
      width: content.width,
      height: languageBlock,
    }),
    ...metricNodes(input, visibleMetrics, fontFamily, theme, {
      x: content.x,
      y: metricsTop,
      width: content.width,
      height: metricsHeight,
    }),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

function topicNodes(
  input: BuildInput,
  visible: boolean,
  fontFamily: string,
  theme: Theme,
  area: Box,
) {
  const fontSize = 19;
  const padding = spacing.sm;
  const gap = 12;
  const topics = input.data.topics.slice(0, topicSlots);
  // Pills are measured so the row can be centred as a whole.
  const widths = topics.map(
    (topic) =>
      input.measure(topic, {
        fontFamily,
        fontSize,
        fontWeight: 600,
        maxWidth: area.width,
        lineHeight: 1,
        maxLines: 1,
      }).width +
      padding * 2,
  );
  const total = widths.reduce((sum, value) => sum + value + gap, -gap);
  let offset = area.x + Math.max(0, (area.width - total) / 2);
  const nodes: SceneNode[] = [];

  for (let index = 0; index < topicSlots; index += 1) {
    const topic = topics[index];
    const shown = visible && Boolean(topic);
    const pillWidth = widths[index] ?? 0;

    nodes.push(
      {
        id: `topic-pill-${index + 1}`,
        type: 'rect',
        x: offset,
        y: area.y,
        width: pillWidth,
        height: 44,
        fill: { kind: 'solid', color: theme.surface },
        cornerRadius: 22,
        stroke: { color: theme.border, width: 1 },
        opacity: shown ? 1 : 0,
      },
      textNode(`topic-label-${index + 1}`, {
        x: offset,
        y: area.y + 12,
        width: pillWidth,
        height: 24,
        text: topic ?? '',
        fontFamily,
        fontSize,
        fontWeight: 600,
        color: theme.foreground,
        align: 'center',
        opacity: shown ? 1 : 0,
      }),
    );
    offset += topic ? pillWidth + gap : 0;
  }

  return nodes;
}

function languageNodes(
  input: BuildInput,
  visible: boolean,
  fontFamily: string,
  theme: Theme,
  area: Box,
) {
  const languages = input.data.languages
    .filter((language) => language.percentage >= 0.5)
    .slice(0, languageSlots);
  const gap = 6;
  const trackWidth = area.width - gap * Math.max(0, languages.length - 1);
  const nodes: SceneNode[] = [];
  let offset = 0;

  for (let index = 0; index < languageSlots; index += 1) {
    const language = languages[index];
    const shown = visible && Boolean(language);
    const segmentWidth = language
      ? Math.max(16, trackWidth * (language.percentage / 100))
      : 0;

    nodes.push({
      id: `language-segment-${index + 1}`,
      type: 'rect',
      x: area.x + offset,
      y: area.y,
      width: Math.max(0, Math.min(segmentWidth, area.width - offset)),
      height: 14,
      fill: { kind: 'solid', color: languageColors[index] },
      cornerRadius: 7,
      opacity: shown ? 1 : 0,
    });
    offset += language ? segmentWidth + gap : 0;
  }

  nodes.push(
    textNode('languages-summary', {
      x: area.x,
      y: area.y + 32,
      width: area.width,
      height: 28,
      text: languages
        .slice(0, 3)
        .map(
          (language) => `${language.name} ${language.percentage.toFixed(1)}%`,
        )
        .join('   ·   '),
      fontFamily,
      fontSize: 18,
      fontWeight: 500,
      color: theme.muted,
      align: 'center',
      opacity: visible ? 1 : 0,
    }),
  );

  return nodes;
}

function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  area: Box,
) {
  const values = metricValues(input.data);
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.md);
  const valueSize = Math.min(64, area.width / columns / 2.6);

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
        fontWeight: 800,
        color: theme.foreground,
        align: 'center',
        letterSpacing: -1,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...cell,
        y: cell.y + valueSize * 1.15 + 4,
        height: 26,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: 17,
        fontWeight: 600,
        color: theme.muted,
        align: 'center',
        letterSpacing: 1.6,
        opacity,
      }),
    ];
  });
}

/** Bundled portrait showcase template with topics and languages. */
const showcaseTemplate: Template = {
  id: 'showcase',
  name: 'Showcase',
  description: 'A centred project poster with topics, languages, and stats.',
  category: 'editorial',
  supportedRatios: ['4:5', '1:1', '9:16', '16:9'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { showcaseTemplate };
