import { formatCount, formatDate } from '@/lib/templates/shared/format';
import {
  type Box,
  grid,
  inset,
  row,
  stack,
} from '@/lib/templates/shared/layout';
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
  palettes,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { ProjectData } from '@/types/data/project';
import type { RectNode, Scene, SceneNode } from '@/types/scene';
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

const languageColors = ['#6c5ce7', '#00b894', '#0984e3', '#fdcb6e'];

/** Fixed slot counts so node ids stay stable as data changes. */
const languageSlots = 4;
const contributorSlots = 30;

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
    label: 'Languages',
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
    key: 'showRelease',
    label: 'Latest release',
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

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: palettes.bento.background,
  accentColor: palettes.bento.accent,
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showLanguages: true,
  showContributors: true,
  showRelease: true,
  ...defaultColors,
  fontFamily: 'Manrope Variable',
  cardRadius: 28,
  cardGap: 24,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'lilac',
    name: 'Lilac',
    settings: defaultColors,
  },
  {
    id: 'mint',
    name: 'Mint',
    settings: {
      backgroundColor: '#e6f4ee',
      accentColor: '#0b7a5c',
      textColor: autoColor,
    },
  },
  {
    id: 'butter',
    name: 'Butter',
    settings: {
      backgroundColor: '#fdf3d8',
      accentColor: '#a85f10',
      textColor: autoColor,
    },
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    settings: {
      backgroundColor: '#17171a',
      accentColor: '#a78bfa',
      textColor: autoColor,
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    settings: {
      backgroundColor: '#fdeaf0',
      accentColor: '#d1477a',
      textColor: autoColor,
    },
  },
];

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

  paths.push(...metricPaths(metrics));

  return paths;
}

function build(input: BuildInput): Scene {
  const settings = mergeSettings(defaultSettings, input.settings);
  const { width, height } = ratioSizes[input.ratio];
  const outer = inset({ x: 0, y: 0, width, height }, spacing.lg);
  const isWide = input.ratio === '16:9';
  const theme = resolveTheme(
    stringSetting(settings, 'backgroundColor'),
    stringSetting(settings, 'accentColor'),
    stringSetting(settings, 'textColor'),
  );
  const header = isWide
    ? { ...outer, width: Math.min(430, outer.width * 0.38) }
    : { ...outer, height: input.ratio === '9:16' ? 420 : 310 };
  const gridArea = isWide
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
  const boxes = cardBoxes(input, settings, gridArea);
  const nodes: SceneNode[] = [
    ...headerNodes(input, fontFamily, theme, header, isWide),
    ...statsNodes(input, settings, fontFamily, theme, boxes.stats),
    ...languageNodes(input, settings, fontFamily, theme, boxes.languages),
    ...contributorNodes(input, settings, fontFamily, theme, boxes.contributors),
    ...releaseNodes(input, settings, fontFamily, theme, boxes.release),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

function cardBoxes(
  input: BuildInput,
  settings: Record<string, unknown>,
  gridArea: Box,
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
  const columns = input.ratio === '9:16' ? 1 : 2;
  const rows = Math.ceil(roles.length / columns);
  const rowHeight = (gridArea.height - gap * (rows - 1)) / rows;
  const rowBoxes = stack(
    gridArea,
    Array.from({ length: rows }, () => rowHeight),
    gap,
  );
  // A lone card on the final row spans the full width instead of leaving a hole.
  const activeBoxes = rowBoxes.flatMap((box, rowIndex) => {
    const count = Math.min(columns, roles.length - rowIndex * columns);
    return row(box, count, gap);
  });
  const hidden = { x: gridArea.x, y: gridArea.y, width: 0, height: 0 };
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
  theme: Theme,
  box: Box,
  isWide: boolean,
): SceneNode[] {
  const avatarSize = 88;
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 800,
    maxWidth: box.width,
    minSize: 32,
    maxSize: isWide ? 52 : 68,
    maxLines: 2,
    lineHeight: 1.1,
  });
  const bodySize = box.width < 500 ? 22 : 26;
  const bodyLineHeight = 1.4;
  let cursor = box.y + avatarSize + spacing.md;
  const nameY = cursor;
  cursor += name.height + spacing.sm;
  const descriptionY = cursor;
  const descriptionLines = Math.max(
    1,
    Math.min(
      6,
      Math.floor(
        (box.y + box.height - descriptionY) / (bodySize * bodyLineHeight),
      ),
    ),
  );
  const description = input.measure(
    input.data.repository.description ||
      `A GitHub project maintained by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: box.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );

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
      color: theme.foreground,
    }),
    textNode('repository-label', {
      x: box.x + avatarSize + spacing.sm,
      y: box.y + 50,
      width: box.width - avatarSize - spacing.sm,
      height: 24,
      text: 'GITHUB REPOSITORY',
      fontFamily,
      fontSize: 15,
      fontWeight: 700,
      color: theme.muted,
      letterSpacing: 1.5,
    }),
    textNode('repo-name', {
      x: box.x,
      y: nameY,
      width: box.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
      letterSpacing: -0.5,
    }),
    textNode('repo-description', {
      x: box.x,
      y: descriptionY,
      width: box.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
  ];
}

function statsNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  theme: Theme,
  box: Box,
) {
  const visibleMetrics = stringArraySetting(settings, 'metrics');
  const values = metricValues(input.data);
  const content = inset(box, spacing.md);
  // Past two metrics the tile splits into rows so labels keep their full width.
  const columns =
    visibleMetrics.length > 2 ? 2 : Math.max(1, visibleMetrics.length);
  const rows = Math.max(1, Math.ceil(visibleMetrics.length / columns));
  const cells = grid(content, columns, rows, spacing.sm);
  const valueSize = Math.min(56, content.width / columns / 2.4);
  const nodes: SceneNode[] = [
    cardNode('stats-card', box, settings, theme, true),
  ];

  metricOptions.forEach((metric) => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)] ?? cells[0];
    const opacity = visibleIndex >= 0 ? 1 : 0;
    nodes.push(
      textNode(`metric-${metric.value}-value`, {
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: valueSize * 1.15,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: valueSize,
        fontWeight: 800,
        color: theme.accent,
        letterSpacing: -1,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        x: cell.x,
        y: cell.y + valueSize * 1.15 + 4,
        width: cell.width,
        height: 26,
        text: metric.label,
        fontFamily,
        fontSize: 17,
        fontWeight: 600,
        color: theme.muted,
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
  theme: Theme,
  box: Box,
) {
  const visible = booleanSetting(settings, 'showLanguages');
  const content = inset(box, spacing.md);
  // Only languages that actually exist get a row, so no empty skeleton bars.
  const languages = input.data.languages
    .filter((language) => language.percentage >= 0.5)
    .slice(0, languageSlots);
  const pitch = Math.min(
    72,
    (content.height - 52) / Math.max(1, languages.length),
  );
  const nodes: SceneNode[] = [
    cardNode('languages-card', box, settings, theme, visible),
    textNode('languages-title', {
      x: content.x,
      y: content.y,
      width: content.width,
      height: 32,
      text: 'Top languages',
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: theme.foreground,
      opacity: visible ? 1 : 0,
    }),
  ];

  for (let index = 0; index < languageSlots; index += 1) {
    nodes.push(
      ...languageRow(
        index,
        content,
        languages[index],
        pitch,
        fontFamily,
        theme,
        visible && Boolean(languages[index]),
      ),
    );
  }

  return nodes;
}

/** Builds one language row: name and share above a proportional bar. */
function languageRow(
  index: number,
  content: Box,
  language: ProjectData['languages'][number] | undefined,
  pitch: number,
  fontFamily: string,
  theme: Theme,
  shown: boolean,
): SceneNode[] {
  const y = content.y + 52 + index * pitch;
  const barY = y + 28;

  return [
    textNode(`language-label-${index + 1}`, {
      x: content.x,
      y,
      width: content.width * 0.7,
      height: 26,
      text: language ? language.name : '',
      fontFamily,
      fontSize: 18,
      fontWeight: 600,
      color: theme.foreground,
      opacity: shown ? 1 : 0,
    }),
    textNode(`language-percent-${index + 1}`, {
      x: content.x + content.width * 0.7,
      y,
      width: content.width * 0.3,
      height: 26,
      text: language ? `${language.percentage.toFixed(1)}%` : '',
      fontFamily,
      fontSize: 16,
      fontWeight: 600,
      color: theme.muted,
      align: 'right',
      opacity: shown ? 1 : 0,
    }),
    {
      id: `language-track-${index + 1}`,
      type: 'rect',
      x: content.x,
      y: barY,
      width: content.width,
      height: 12,
      fill: { kind: 'solid', color: theme.border },
      cornerRadius: 6,
      opacity: shown ? 1 : 0,
    },
    {
      id: `language-fill-${index + 1}`,
      type: 'rect',
      x: content.x,
      y: barY,
      width: language
        ? Math.max(12, content.width * (language.percentage / 100))
        : 0,
      height: 12,
      fill: { kind: 'solid', color: languageColors[index] },
      cornerRadius: 6,
      opacity: shown ? 1 : 0,
    },
  ];
}

function contributorNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  theme: Theme,
  box: Box,
) {
  const visible = booleanSetting(settings, 'showContributors');
  const content = inset(box, spacing.md);
  const contributors = (input.data.contributors ?? []).slice(
    0,
    contributorSlots,
  );
  const headingHeight = 52;
  const gridTop = content.y + headingHeight;
  const gridHeight = content.height - headingHeight;
  const gap = 10;
  // Faces alone read faster than a list, so size the grid to the contributors
  // actually present and let them be as large as the tile allows.
  const count = Math.max(1, contributors.length);
  const options = Array.from({ length: count }, (_, index) => {
    const candidate = index + 1;
    const rows = Math.ceil(count / candidate);

    return {
      columns: candidate,
      rows,
      size: Math.min(
        (content.width - gap * (candidate - 1)) / candidate,
        (gridHeight - gap * (rows - 1)) / rows,
        120,
      ),
    };
  });
  const largest = Math.max(...options.map((option) => option.size));
  // Among grids that fit nearly as well, the flattest one reads best.
  const chosen =
    options
      .filter((option) => option.size >= largest * 0.85)
      .sort((first, second) => first.rows - second.rows)[0] ?? options[0];
  const columns = chosen.columns;
  // A hidden card has no box to measure, so the grid collapses instead of
  // producing negative geometry.
  const avatarSize = Math.max(0, chosen.size);

  const nodes: SceneNode[] = [
    cardNode('contributors-card', box, settings, theme, visible),
    textNode('contributors-title', {
      x: content.x,
      y: content.y,
      width: content.width,
      height: 32,
      text: 'Contributors',
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: theme.foreground,
      opacity: visible ? 1 : 0,
    }),
  ];

  for (let index = 0; index < contributorSlots; index += 1) {
    const contributor = contributors[index];
    const shown = visible && Boolean(contributor);

    nodes.push({
      id: `contributor-avatar-${index + 1}`,
      type: 'image',
      x: content.x + (index % columns) * (avatarSize + gap),
      y: gridTop + Math.floor(index / columns) * (avatarSize + gap),
      width: avatarSize,
      height: avatarSize,
      src: contributor?.avatarUrl ?? input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: avatarSize / 2,
      opacity: shown ? 1 : 0,
    });
  }

  return nodes;
}

function releaseNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  theme: Theme,
  box: Box,
) {
  const release = input.data.latestRelease;
  const visible = booleanSetting(settings, 'showRelease') && Boolean(release);
  const content = inset(box, spacing.md);
  // GitHub often repeats the tag as the release name; show the date instead.
  const subtitle =
    release?.name && release.name !== release.tagName
      ? release.name
      : formatDate(release?.publishedAt);

  return [
    cardNode('release-card', box, settings, theme, visible),
    textNode('release-title', {
      x: content.x,
      y: content.y,
      width: content.width,
      height: 32,
      text: 'Latest release',
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 700,
      color: theme.foreground,
      opacity: visible ? 1 : 0,
    }),
    textNode('release-tag', {
      x: content.x,
      y: content.y + 54,
      width: content.width,
      height: 58,
      text: release?.tagName ?? '',
      fontFamily,
      fontSize: 44,
      fontWeight: 800,
      color: theme.accent,
      letterSpacing: -1,
      opacity: visible ? 1 : 0,
    }),
    textNode('release-name', {
      x: content.x,
      y: content.y + 118,
      width: content.width,
      height: 56,
      text: subtitle,
      fontFamily,
      fontSize: 19,
      fontWeight: 500,
      color: theme.muted,
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
  theme: Theme,
  visible: boolean,
): RectNode {
  return {
    id,
    type: 'rect',
    ...box,
    fill: { kind: 'solid', color: theme.surface },
    cornerRadius: numberSetting(settings, 'cardRadius'),
    stroke: { color: theme.border, width: 1 },
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
  colorPresets,
  build,
};

export { bentoTemplate };
