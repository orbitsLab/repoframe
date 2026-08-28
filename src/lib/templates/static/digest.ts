import { formatDate } from '@/lib/templates/shared/format';
import { type Box, inset, row } from '@/lib/templates/shared/layout';
import {
  metricBandNodes,
  metricOptions,
  metricPaths,
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
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

/** Fixed chip count, so node ids hold still as the language list changes. */
const chipSlots = 4;

/** Fixed face count in the contributor cluster. */
const faceSlots = 8;

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
    label: 'Language chips',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showContributors',
    label: 'Contributor cluster',
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
    label: 'Panel radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 56,
    step: 4,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['issues', 'pullRequests', 'stars', 'forks', 'watchers'],
  showLanguages: true,
  showContributors: true,
  backgroundColor: '#e8eaf8',
  accentColor: '#4c5bd4',
  textColor: autoColor,
  fontFamily: 'Manrope Variable',
  cardRadius: 32,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showLanguages')) {
    paths.push('languages');
  }

  if (booleanSetting(resolved, 'showContributors')) {
    paths.push('contributors');
  }

  paths.push(...metricPaths(stringArraySetting(resolved, 'metrics')));

  return paths;
}

/**
 * Resolves the fixed bands that close the panel from its foot upward.
 *
 * @param content - Bounds inside the panel padding.
 * @param isWide - Whether the canvas uses a wide landscape ratio.
 * @param scale - Band multiplier for the height of the canvas.
 * @param showLanguages - Whether the chip row takes a band of its own.
 * @param gutter - Space between adjacent bands.
 * @returns The height of each band and the top of every one of them.
 */
function digestBands(
  content: Box,
  isWide: boolean,
  scale: number,
  showLanguages: boolean,
  gutter: number,
) {
  const footerHeight = 32 * Math.min(1.3, scale);
  const metricBandHeight = (isWide ? 86 : 104) * scale;
  const chipHeight = showLanguages ? 48 * Math.min(1.3, scale) : 0;
  const chipBand = showLanguages ? chipHeight + gutter * 0.6 : 0;
  const bottomTop =
    content.y +
    content.height -
    (footerHeight + gutter + metricBandHeight + chipBand);

  return {
    footerHeight,
    metricBandHeight,
    chipHeight,
    bottomTop,
    chipsTop: bottomTop,
    metricsTop: bottomTop + chipBand,
    footerTop: content.y + content.height - footerHeight,
  };
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
  const radius = numberSetting(settings, 'cardRadius');
  const scale = bandScale(height);
  const showLanguages = booleanSetting(settings, 'showLanguages');
  const showContributors = booleanSetting(settings, 'showContributors');

  const panel = inset({ x: 0, y: 0, width, height }, isWide ? 40 : 52);
  const content = inset(panel, isWide ? spacing.lg : spacing.xl);
  const gutter = spacing.md * Math.min(1.25, scale);

  const avatarSize = (isWide ? 96 : 124) * Math.min(1.2, scale);
  const headerTextX = content.x + avatarSize + spacing.md;
  const headerTextWidth = Math.max(1, content.width - avatarSize - spacing.md);
  const loginHeight = 30 * Math.min(1.2, scale);
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 800,
    maxWidth: headerTextWidth,
    minSize: 26,
    maxSize: isWide ? 58 : 72,
    maxLines: 2,
    lineHeight: 1.05,
    letterSpacing: -1,
  });
  const headerHeight = Math.max(avatarSize, loginHeight + name.height);

  const linkSize = (isWide ? 21 : 25) * Math.min(1.2, scale);
  const linkHeight = linkSize * 1.5;
  const linkY = content.y + headerHeight + gutter * 0.6;

  // Everything below the description is measured from the foot of the panel,
  // so the description can only ever take the space that is genuinely spare.
  const {
    footerHeight,
    metricBandHeight,
    chipHeight,
    bottomTop,
    chipsTop,
    metricsTop,
    footerTop,
  } = digestBands(content, isWide, scale, showLanguages, gutter);

  const bodySize = (isWide ? 23 : 27) * Math.min(1.25, scale);
  const bodyLineHeight = 1.45;
  const descriptionY = linkY + linkHeight + gutter * 0.5;
  const descriptionLines = Math.max(
    1,
    Math.min(
      6,
      Math.floor(
        (bottomTop - gutter - descriptionY) / (bodySize * bodyLineHeight),
      ),
    ),
  );
  const descriptionWidth =
    content.width * (showContributors && isWide ? 0.72 : 1);
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: descriptionWidth,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );

  const nodes: SceneNode[] = [
    {
      id: 'digest-panel',
      type: 'rect',
      ...panel,
      fill: {
        kind: 'linear',
        angle: 145,
        stops: [
          { offset: 0, color: theme.surface },
          { offset: 1, color: theme.background },
        ],
      },
      cornerRadius: radius,
      stroke: { color: theme.border, width: 2 },
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
      cornerRadius: avatarSize / 2,
    },
    textNode('owner-login', {
      x: headerTextX,
      y: content.y,
      width: headerTextWidth,
      height: loginHeight,
      text: `@${input.data.owner.login}`,
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 1.5,
      maxLines: 1,
    }),
    textNode('repo-name', {
      x: headerTextX,
      y: content.y + loginHeight,
      width: headerTextWidth,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: name.lines.length,
      letterSpacing: -1,
    }),
    textNode('repo-link', {
      x: content.x,
      y: linkY,
      width: content.width,
      height: linkHeight,
      text: input.data.repository.homepage || input.data.repository.url,
      fontFamily,
      fontSize: linkSize,
      fontWeight: 600,
      color: theme.accent,
      maxLines: 1,
    }),
    textNode('repo-description', {
      x: content.x,
      y: descriptionY,
      width: descriptionWidth,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    ...faceNodes(input, showContributors, theme, {
      x: content.x,
      y: descriptionY,
      width: content.width,
      height: Math.max(0, bottomTop - gutter - descriptionY),
    }),
    ...chipNodes(input, showLanguages, fontFamily, theme, radius, {
      x: content.x,
      y: chipsTop,
      width: content.width,
      height: chipHeight,
    }),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: content.x,
      y: metricsTop,
      width: content.width,
      height: 2,
      fill: { kind: 'solid', color: theme.border },
    },
    ...metricBandNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      fontFamily,
      theme.foreground,
      {
        x: content.x,
        y: metricsTop + spacing.xs,
        width: content.width,
        height: Math.max(0, metricBandHeight - spacing.xs),
      },
    ),
    textNode('repo-license', {
      x: content.x,
      y: footerTop,
      width: content.width * 0.6,
      height: footerHeight,
      text: licenceLine(input),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 600,
      color: theme.muted,
      letterSpacing: 0.5,
      maxLines: 1,
    }),
    textNode('repo-updated', {
      x: content.x + content.width * 0.6,
      y: footerTop,
      width: content.width * 0.4,
      height: footerHeight,
      text: formatDate(input.data.repository.pushedAt),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 600,
      color: theme.muted,
      align: 'right',
      letterSpacing: 0.5,
      maxLines: 1,
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
 * Reads the repository licence as a footer line.
 *
 * @param input - Build input carrying project data.
 * @returns The licence identifier, or a note that none is declared.
 */
function licenceLine(input: BuildInput) {
  const licence = input.data.repository.license;

  return licence
    ? `Licensed ${licence.spdxId ?? licence.name}`
    : 'No licence declared';
}

/**
 * Lays the top languages out as a row of outlined chips.
 *
 * Every slot stays in the tree and hidden chips collapse to zero opacity, so
 * a repository reporting one language keeps the same node ids as one
 * reporting four.
 *
 * @param input - Build input carrying project data.
 * @param shown - Whether the chip row is drawn at all.
 * @param fontFamily - Typeface for the chip labels.
 * @param theme - Resolved template colours.
 * @param radius - Panel radius the chips round themselves against.
 * @param area - Bounds the row fills.
 * @returns A pill and a label for every chip slot.
 */
function chipNodes(
  input: BuildInput,
  shown: boolean,
  fontFamily: string,
  theme: Theme,
  radius: number,
  area: Box,
): SceneNode[] {
  const languages = shown ? input.data.languages.slice(0, chipSlots) : [];
  const cells = row(area, chipSlots, spacing.xs);

  return cells.flatMap((cell, index): SceneNode[] => {
    const language = languages[index];
    const opacity = language ? 1 : 0;

    return [
      {
        id: `language-chip-${index + 1}`,
        type: 'rect',
        ...cell,
        fill: { kind: 'solid', color: theme.background },
        cornerRadius: Math.min(radius, cell.height / 2),
        stroke: { color: theme.border, width: 2 },
        opacity,
      },
      textNode(`language-chip-${index + 1}-label`, {
        maxLines: 1,
        x: cell.x + spacing.xs,
        y: cell.y + (cell.height - area.height * 0.44) / 2,
        width: Math.max(1, cell.width - spacing.xs * 2),
        height: area.height * 0.44,
        text: language
          ? `${language.name} ${Math.round(language.percentage)}%`
          : '',
        fontFamily,
        fontSize: Math.min(24, area.height * 0.42),
        fontWeight: 700,
        color: theme.foreground,
        align: 'center',
        opacity,
      }),
    ];
  });
}

/**
 * Clusters contributor avatars into the bottom-right of the description band.
 *
 * The cluster only appears where the description leaves it room, so a long
 * description on a narrow canvas keeps its lines rather than losing them to
 * a row of faces.
 *
 * @param input - Build input carrying project data.
 * @param shown - Whether the cluster is drawn at all.
 * @param theme - Resolved template colours.
 * @param area - Bounds the description and cluster share.
 * @returns A face for every cluster slot, shown or hidden.
 */
function faceNodes(
  input: BuildInput,
  shown: boolean,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const people = shown ? (input.data.contributors ?? []) : [];
  const columns = 4;
  const rows = Math.ceil(faceSlots / columns);
  const size = Math.max(
    0,
    Math.min(56, area.height / rows - spacing.xs, area.width * 0.1),
  );
  const clusterWidth = columns * size + (columns - 1) * spacing.xs;
  const left = area.x + area.width - clusterWidth;
  const top = area.y + area.height - (rows * size + (rows - 1) * spacing.xs);

  return Array.from({ length: faceSlots }, (_, index): SceneNode => {
    const person = people[index];

    return {
      id: `contributor-face-${index + 1}`,
      type: 'image',
      x: left + (index % columns) * (size + spacing.xs),
      y: top + Math.floor(index / columns) * (size + spacing.xs),
      width: size,
      height: size,
      src: person?.avatarUrl ?? input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: size / 2,
      opacity: person ? 1 : 0,
    };
  }).concat([
    {
      id: 'contributor-overflow',
      type: 'rect',
      x: left,
      y: top - spacing.xs - 4,
      width: clusterWidth,
      height: 4,
      fill: { kind: 'solid', color: theme.accent },
      opacity: people.length > faceSlots ? 1 : 0,
    },
  ]);
}

/** Bundled summary panel that fits every headline repository fact in one frame. */
const digestTemplate: Template = {
  id: 'digest',
  name: 'Digest',
  description: 'A rounded panel holding links, people, languages, and licence.',
  category: 'developer',
  supportedRatios: ['16:9', '1:1', '4:5', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { digestTemplate };
