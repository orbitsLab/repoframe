import { formatCount } from '@/lib/templates/shared/format';
import { type Box, inset, row, stack } from '@/lib/templates/shared/layout';
import { textNode } from '@/lib/templates/shared/nodes';
import {
  booleanSetting,
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
import type { RectNode, Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const metricOptions = [
  { label: 'Stars', value: 'stars' },
  { label: 'Forks', value: 'forks' },
  { label: 'Watchers', value: 'watchers' },
  { label: 'Issues', value: 'issues' },
  { label: 'Pull requests', value: 'pullRequests' },
];

const languageColors = ['#6c5ce7', '#00b894', '#0984e3', '#fdcb6e'];

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible metrics',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showLanguages',
    label: 'Show languages',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showContributors',
    label: 'Show contributors',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showRelease',
    label: 'Show latest release',
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
    key: 'cardRadius',
    label: 'Card radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 48,
    step: 4,
    unit: 'px',
  },
  {
    key: 'cardGap',
    label: 'Card gap',
    section: 'cards',
    type: 'range',
    min: 12,
    max: 36,
    step: 4,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues', 'pullRequests'],
  showLanguages: true,
  showContributors: true,
  showRelease: true,
  backgroundColor: palettes.bento.background,
  accentColor: palettes.bento.accent,
  fontFamily: 'Manrope Variable',
  cardRadius: 28,
  cardGap: 24,
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
  const outer = inset({ x: 0, y: 0, width, height }, spacing.lg);
  const isWide = input.ratio === '16:9';
  const header = isWide
    ? { ...outer, width: Math.min(430, outer.width * 0.38) }
    : { ...outer, height: input.ratio === '9:16' ? 420 : 310 };
  const grid = isWide
    ? {
        x: header.x + header.width + spacing.lg,
        y: outer.y,
        width: outer.width - header.width - spacing.lg,
        height: outer.height,
      }
    : {
        x: outer.x,
        y: header.y + header.height + spacing.md,
        width: outer.width,
        height: outer.height - header.height - spacing.md,
      };
  const fontFamily = stringSetting(settings, 'fontFamily');
  const nameSize = fitFontSize(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 800,
    maxWidth: header.width,
    minSize: 34,
    maxSize: isWide ? 54 : 68,
  });
  const description =
    input.data.repository.description ||
    `A GitHub project maintained by ${input.data.owner.login}.`;
  const measuredDescription = input.measure(description, {
    fontFamily,
    fontSize: isWide ? 23 : 26,
    fontWeight: 400,
    maxWidth: header.width,
    lineHeight: 1.35,
    maxLines: isWide ? 6 : 3,
  });
  const boxes = cardBoxes(input, settings, grid);
  const nodes: SceneNode[] = [
    ...headerNodes(
      input,
      fontFamily,
      header,
      nameSize,
      measuredDescription.lines.join('\n'),
      measuredDescription.height,
    ),
    ...statsNodes(input, settings, fontFamily, boxes.stats),
    ...languageNodes(input, settings, fontFamily, boxes.languages),
    ...contributorNodes(input, settings, fontFamily, boxes.contributors),
    ...releaseNodes(input, settings, fontFamily, boxes.release),
  ];

  return {
    width,
    height,
    background: {
      kind: 'linear',
      angle: 140,
      stops: [
        { offset: 0, color: stringSetting(settings, 'backgroundColor') },
        { offset: 1, color: '#d8f4ff' },
      ],
    },
    nodes,
  };
}

function cardBoxes(
  input: BuildInput,
  settings: Record<string, unknown>,
  grid: Box,
) {
  const roles = ['stats'];
  if (booleanSetting(settings, 'showLanguages')) {
    roles.push('languages');
  }
  if (booleanSetting(settings, 'showContributors')) {
    roles.push('contributors');
  }
  if (booleanSetting(settings, 'showRelease') && input.data.latestRelease) {
    roles.push('release');
  }

  const gap = numberSetting(settings, 'cardGap');
  const useColumns = input.ratio !== '9:16';
  const columns = useColumns ? 2 : 1;
  const rows = Math.ceil(roles.length / columns);
  const rowHeight = (grid.height - gap * (rows - 1)) / rows;
  const rowBoxes = stack(
    grid,
    Array.from({ length: rows }, () => rowHeight),
    gap,
  );
  const activeBoxes = rowBoxes.flatMap((box, rowIndex) => {
    const count = Math.min(columns, roles.length - rowIndex * columns);
    return row(box, count, gap);
  });
  const hidden = { x: grid.x, y: grid.y, width: 0, height: 0 };
  const result: Record<string, Box> = {
    stats: hidden,
    languages: hidden,
    contributors: hidden,
    release: hidden,
  };

  roles.forEach((role, index) => {
    result[role] = activeBoxes[index];
  });

  return result;
}

function headerNodes(
  input: BuildInput,
  fontFamily: string,
  box: Box,
  nameSize: number,
  description: string,
  descriptionHeight: number,
): SceneNode[] {
  const avatarSize = 88;

  return [
    {
      id: 'owner-avatar',
      type: 'image',
      x: box.x,
      y: box.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: 24,
    },
    textNode('owner-login', {
      x: box.x + avatarSize + spacing.sm,
      y: box.y + 16,
      width: box.width - avatarSize - spacing.sm,
      height: 30,
      text: input.data.owner.login,
      fontFamily,
      fontSize: 22,
      fontWeight: 700,
      color: palettes.bento.foreground,
    }),
    textNode('repository-label', {
      x: box.x + avatarSize + spacing.sm,
      y: box.y + 50,
      width: box.width - avatarSize - spacing.sm,
      height: 24,
      text: 'GITHUB REPOSITORY',
      fontFamily,
      fontSize: 16,
      fontWeight: 700,
      color: palettes.bento.muted,
      letterSpacing: 1.5,
    }),
    textNode('repo-name', {
      x: box.x,
      y: box.y + 120,
      width: box.width,
      height: nameSize * 1.15,
      text: input.data.repository.fullName,
      fontFamily,
      fontSize: nameSize,
      fontWeight: 800,
      color: palettes.bento.foreground,
    }),
    textNode('repo-description', {
      x: box.x,
      y: box.y + 140 + nameSize,
      width: box.width,
      height: descriptionHeight,
      text: description,
      fontFamily,
      fontSize: box.width < 500 ? 23 : 26,
      fontWeight: 400,
      color: palettes.bento.muted,
      lineHeight: 1.35,
      maxLines: 6,
    }),
  ];
}

function statsNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  box: Box,
) {
  const visibleMetrics = stringArraySetting(settings, 'metrics');
  const values: Record<string, number | undefined> = {
    stars: input.data.metrics.stars,
    forks: input.data.metrics.forks,
    watchers: input.data.metrics.watchers,
    issues: input.data.metrics.issues,
    pullRequests: input.data.metrics.pullRequests,
  };
  const content = inset(box, spacing.md);
  const visibleBoxes = row(
    content,
    Math.max(1, visibleMetrics.length),
    spacing.sm,
  );
  const nodes: SceneNode[] = [cardNode('stats-card', box, settings, true)];

  metricOptions.forEach((metric) => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const metricBox = visibleBoxes[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;
    nodes.push(
      textNode(`metric-${metric.value}-value`, {
        ...metricBox,
        y: metricBox.y + 12,
        height: 56,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: Math.min(typeScale.metric, metricBox.width * 0.42),
        fontWeight: 800,
        color: stringSetting(settings, 'accentColor'),
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...metricBox,
        y: metricBox.y + 76,
        height: 30,
        text: metric.label,
        fontFamily,
        fontSize: 17,
        fontWeight: 600,
        color: palettes.bento.muted,
        opacity,
      }),
    );
  });

  return nodes;
}

function languageNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  box: Box,
) {
  const visible = booleanSetting(settings, 'showLanguages');
  const content = inset(box, spacing.md);
  const nodes: SceneNode[] = [
    cardNode('languages-card', box, settings, visible),
    textNode('languages-title', {
      x: content.x,
      y: content.y,
      width: content.width,
      height: 32,
      text: 'Top languages',
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: palettes.bento.foreground,
      opacity: visible ? 1 : 0,
    }),
  ];

  for (let index = 0; index < 4; index += 1) {
    const language = input.data.languages[index];
    const y = content.y + 52 + index * 38;
    nodes.push(
      textNode(`language-label-${index + 1}`, {
        x: content.x,
        y,
        width: content.width * 0.45,
        height: 28,
        text: language?.name ?? '',
        fontFamily,
        fontSize: 18,
        fontWeight: 600,
        color: palettes.bento.foreground,
        opacity: visible ? 1 : 0,
      }),
      {
        id: `language-track-${index + 1}`,
        type: 'rect',
        x: content.x + content.width * 0.48,
        y: y + 5,
        width: content.width * 0.52,
        height: 14,
        fill: { kind: 'solid', color: '#eceaf6' },
        cornerRadius: 7,
        opacity: visible ? 1 : 0,
      },
      {
        id: `language-fill-${index + 1}`,
        type: 'rect',
        x: content.x + content.width * 0.48,
        y: y + 5,
        width: language
          ? content.width * 0.52 * (language.percentage / 100)
          : 0,
        height: 14,
        fill: { kind: 'solid', color: languageColors[index] },
        cornerRadius: 7,
        opacity: visible ? 1 : 0,
      },
    );
  }

  return nodes;
}

function contributorNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  box: Box,
) {
  const visible = booleanSetting(settings, 'showContributors');
  const content = inset(box, spacing.md);
  const contributors = input.data.contributors ?? [];
  const avatarSize = Math.min(72, (content.width - spacing.sm * 3) / 4);
  const nodes: SceneNode[] = [
    cardNode('contributors-card', box, settings, visible),
    textNode('contributors-title', {
      x: content.x,
      y: content.y,
      width: content.width,
      height: 32,
      text: 'Contributors',
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: palettes.bento.foreground,
      opacity: visible ? 1 : 0,
    }),
  ];

  for (let index = 0; index < 4; index += 1) {
    const contributor = contributors[index];
    nodes.push({
      id: `contributor-avatar-${index + 1}`,
      type: 'image',
      x: content.x + index * (avatarSize + spacing.sm),
      y: content.y + 58,
      width: avatarSize,
      height: avatarSize,
      src: contributor?.avatarUrl ?? input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: avatarSize / 2,
      opacity: visible && contributor ? 1 : 0,
    });
  }

  nodes.push(
    textNode('contributors-names', {
      x: content.x,
      y: content.y + 58 + avatarSize + 16,
      width: content.width,
      height: 30,
      text: contributors
        .slice(0, 4)
        .map((contributor) => `@${contributor.login}`)
        .join('  '),
      fontFamily,
      fontSize: 16,
      fontWeight: 500,
      color: palettes.bento.muted,
      opacity: visible ? 1 : 0,
    }),
  );

  return nodes;
}

function releaseNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  box: Box,
) {
  const visible =
    booleanSetting(settings, 'showRelease') &&
    Boolean(input.data.latestRelease);
  const content = inset(box, spacing.md);

  return [
    cardNode('release-card', box, settings, visible),
    textNode('release-title', {
      x: content.x,
      y: content.y,
      width: content.width,
      height: 32,
      text: 'Latest release',
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: palettes.bento.foreground,
      opacity: visible ? 1 : 0,
    }),
    textNode('release-tag', {
      x: content.x,
      y: content.y + 54,
      width: content.width,
      height: 54,
      text: input.data.latestRelease?.tagName ?? '',
      fontFamily,
      fontSize: 38,
      fontWeight: 800,
      color: stringSetting(settings, 'accentColor'),
      opacity: visible ? 1 : 0,
    }),
    textNode('release-name', {
      x: content.x,
      y: content.y + 112,
      width: content.width,
      height: 62,
      text: input.data.latestRelease?.name ?? 'Stable release',
      fontFamily,
      fontSize: 19,
      fontWeight: 500,
      color: palettes.bento.muted,
      maxLines: 2,
      lineHeight: 1.3,
      opacity: visible ? 1 : 0,
    }),
  ];
}

function cardNode(
  id: string,
  box: Box,
  settings: Record<string, unknown>,
  visible: boolean,
): RectNode {
  return {
    id,
    type: 'rect',
    ...box,
    fill: { kind: 'solid', color: palettes.bento.surface },
    cornerRadius: numberSetting(settings, 'cardRadius'),
    stroke: { color: palettes.bento.border, width: 1 },
    shadow: {
      color: '#514b7d',
      blur: 22,
      offsetX: 0,
      offsetY: 10,
      opacity: 0.12,
    },
    opacity: visible ? 1 : 0,
  };
}

/** Bundled bento-style repository card template. */
const bentoTemplate: Template = {
  id: 'bento',
  name: 'Bento',
  description: 'A modular card grid for repository activity and people.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { bentoTemplate };
