import { formatCount } from '@/lib/templates/shared/format';
import { type Box, grid, inset } from '@/lib/templates/shared/layout';
import {
  metricOptions,
  metricPaths,
  metricValues,
} from '@/lib/templates/shared/metrics';
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
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
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
  metrics: ['stars', 'forks', 'issues'],
  backgroundColor: '#0d1117',
  accentColor: '#58a6ff',
  fontFamily: 'Space Grotesk Variable',
  cardRadius: 24,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  paths.push(...metricPaths(metrics));

  return paths;
}

/**
 * Resolves badge dimensions for the available canvas shape and metric count.
 *
 * @param isWide - Whether the canvas uses a wide landscape ratio.
 * @param tall - Whether the canvas needs the expanded portrait layout.
 * @param metricCount - Number of visible metric pills.
 * @returns Padding, typography, avatar, and metric-grid dimensions.
 */
function badgeSizing(isWide: boolean, tall: boolean, metricCount: number) {
  const pillColumns = tall ? 2 : Math.max(1, metricCount);
  const pillRows = Math.ceil(Math.max(1, metricCount) / pillColumns);
  const pillHeight = tall ? 116 : 64;

  return {
    pad: isWide ? spacing.lg : spacing.xl,
    avatarSize: isWide ? 88 : tall ? 208 : 104,
    bodySize: isWide ? 24 : tall ? 40 : 27,
    nameMaxSize: isWide ? 52 : tall ? 116 : 62,
    descriptionLines: tall ? 6 : 3,
    pillColumns,
    pillRows,
    pillHeight,
    metricsHeight: pillRows * pillHeight + (pillRows - 1) * spacing.sm,
  };
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
  const radius = numberSetting(settings, 'cardRadius');
  const outer = inset({ x: 0, y: 0, width, height }, isWide ? 40 : 56);
  const visibleMetrics = stringArraySetting(settings, 'metrics');

  // Tall canvases get a bigger badge and stacked pills instead of a lone strip.
  const tall = height / width >= 1.2;
  const {
    pad,
    avatarSize,
    bodySize,
    nameMaxSize,
    descriptionLines,
    pillColumns,
    pillRows,
    metricsHeight,
  } = badgeSizing(isWide, tall, visibleMetrics.length);
  const innerWidth = outer.width - pad * 2;
  const textWidth = innerWidth - avatarSize - spacing.md;
  const loginHeight = 34;
  const bodyLineHeight = 1.4;

  // A badge sizes itself to its content rather than stretching to the canvas.
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 700,
    maxWidth: textWidth,
    minSize: 28,
    maxSize: nameMaxSize,
    maxLines: 2,
    lineHeight: 1.1,
  });
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
  const headerHeight = Math.max(
    avatarSize,
    loginHeight + name.height + spacing.sm + description.height,
  );
  // On a tall canvas the badge claims most of the frame; otherwise it stays the
  // compact strip a README wants.
  const contentHeight = pad * 2 + headerHeight + spacing.lg + metricsHeight;
  const cardHeight = Math.min(
    outer.height,
    Math.max(contentHeight, tall ? outer.height * 0.86 : 0),
  );
  const card = {
    x: outer.x,
    y: outer.y + (outer.height - cardHeight) / 2,
    width: outer.width,
    height: cardHeight,
  };
  const content = inset(card, pad);
  const textX = content.x + avatarSize + spacing.md;
  // Spare height inside the card sits above the header, not below the pills.
  const headerTop = content.y + Math.max(0, (cardHeight - contentHeight) * 0.5);
  const pillTop = card.y + cardHeight - pad - metricsHeight;

  const nodes: SceneNode[] = [
    {
      id: 'badge-card',
      type: 'rect',
      ...card,
      fill: { kind: 'solid', color: theme.surface },
      cornerRadius: radius,
      stroke: { color: theme.border, width: 2 },
    },
    {
      id: 'accent-edge',
      type: 'rect',
      x: card.x,
      y: card.y,
      width: card.width,
      height: 6,
      fill: { kind: 'solid', color: theme.accent },
      cornerRadius: 3,
    },
    {
      id: 'owner-avatar',
      type: 'image',
      x: content.x,
      y: headerTop,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: 18,
    },
    textNode('owner-login', {
      x: textX,
      y: headerTop,
      width: textWidth,
      height: 28,
      text: `@${input.data.owner.login}`,
      fontFamily,
      fontSize: 20,
      fontWeight: 600,
      color: theme.accent,
      letterSpacing: 0.5,
    }),
    textNode('repo-name', {
      x: textX,
      y: headerTop + loginHeight,
      width: textWidth,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
      letterSpacing: -0.5,
    }),
    textNode('repo-description', {
      x: textX,
      y: headerTop + loginHeight + name.height + spacing.sm,
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
    ...metricPills(
      input,
      visibleMetrics,
      fontFamily,
      theme,
      radius,
      pillColumns,
      pillRows,
      {
        x: content.x,
        y: pillTop,
        width: content.width,
        height: metricsHeight,
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

function metricPills(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  radius: number,
  columns: number,
  rows: number,
  area: Box,
) {
  const values = metricValues(input.data);
  const cells = grid(area, columns, rows, spacing.sm);
  const pillHeight = cells[0]?.height ?? area.height;

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      {
        id: `metric-${metric.value}-pill`,
        type: 'rect',
        ...cell,
        fill: { kind: 'solid', color: theme.background },
        cornerRadius: Math.min(radius, pillHeight / 2),
        stroke: { color: theme.border, width: 1 },
        opacity,
      },
      textNode(`metric-${metric.value}-value`, {
        x: cell.x + spacing.sm,
        y: cell.y + (pillHeight - 34) / 2,
        width: cell.width - spacing.sm * 2,
        height: 34,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: pillHeight > 90 ? 34 : 28,
        fontWeight: 700,
        color: theme.foreground,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        x: cell.x + spacing.sm,
        y: cell.y + (pillHeight - 34) / 2,
        width: cell.width - spacing.sm * 2,
        height: 34,
        text: metric.label.toLowerCase(),
        fontFamily,
        fontSize: 20,
        fontWeight: 500,
        color: theme.muted,
        align: 'right',
        opacity,
      }),
    ];
  });
}

/** Bundled compact badge template sized for README embeds. */
const badgeTemplate: Template = {
  id: 'badge',
  name: 'Badge',
  description: 'A compact repository strip sized for READMEs and docs.',
  category: 'developer',
  supportedRatios: ['16:9', '1:1', '4:5', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { badgeTemplate };
