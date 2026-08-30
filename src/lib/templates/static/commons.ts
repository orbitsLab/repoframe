import { formatCount } from '@/lib/templates/shared/format';
import { type Box, inset, row, stack } from '@/lib/templates/shared/layout';
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
import type { ProjectData } from '@/types/data/project';
import type { Scene, SceneNode } from '@/types/scene';
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

/** Fixed row count in the leaderboard, so node ids hold still. */
const rankSlots = 6;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showContributors',
    label: 'Contributor ranking',
    section: 'content',
    type: 'toggle',
  },
  {
    key: 'showGrid',
    label: 'Graph paper',
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
    label: 'Paper colour',
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
    label: 'Ink colour',
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
    max: 40,
    step: 4,
    unit: 'px',
  },
];

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: '#fdfaec',
  accentColor: '#2f6f4f',
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'watchers'],
  showContributors: true,
  showGrid: true,
  eyebrow: 'THE COMMONS',
  ...defaultColors,
  fontFamily: 'DM Sans Variable',
  avatarRadius: 40,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'commons',
    name: 'Commons',
    settings: defaultColors,
  },
  {
    id: 'bluestocking',
    name: 'Bluebook',
    settings: {
      backgroundColor: '#f7f7f2',
      accentColor: '#2b4a8f',
      textColor: autoColor,
    },
  },
  {
    id: 'terracotta',
    name: 'Clay',
    settings: {
      backgroundColor: '#fbf3ea',
      accentColor: '#b4531f',
      textColor: autoColor,
    },
  },
  {
    id: 'slate',
    name: 'Slate Sheet',
    settings: {
      backgroundColor: '#eef1f2',
      accentColor: '#3a4a54',
      textColor: autoColor,
    },
  },
  {
    id: 'nightledger',
    name: 'Nightfall',
    settings: {
      backgroundColor: '#16150f',
      accentColor: '#b7d97a',
      textColor: autoColor,
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);

  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showContributors')) {
    paths.push('contributors');
  }

  paths.push(...metricPaths(stringArraySetting(resolved, 'metrics')));

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
  const scale = bandScale(height);
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 52 : 68);
  const gutter = spacing.md * Math.min(1.25, scale);

  const eyebrowHeight = 28 * Math.min(1.2, scale);
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 800,
    maxWidth: frame.width,
    minSize: 28,
    maxSize: isWide ? 62 : 78,
    maxLines: 2,
    lineHeight: 1.05,
    letterSpacing: -1.5,
  });
  const bodySize = (isWide ? 22 : 26) * Math.min(1.25, scale);
  const bodyLineHeight = 1.45;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: frame.width,
      lineHeight: bodyLineHeight,
      maxLines: 2,
    },
  );

  const metricBandHeight = (isWide ? 84 : 100) * scale;
  const headingHeight = 30 * Math.min(1.2, scale);
  const footerHeight = 30 * Math.min(1.2, scale);
  const nameY = frame.y + eyebrowHeight + gutter * 0.5;
  const descriptionY = nameY + name.height + gutter * 0.5;
  const metricsTop = descriptionY + description.height + gutter;
  const headingTop = metricsTop + metricBandHeight + gutter;
  const footerTop = frame.y + frame.height - footerHeight;
  const board: Box = {
    x: frame.x,
    y: headingTop + headingHeight,
    width: frame.width,
    height: Math.max(0, footerTop - gutter * 0.5 - headingTop - headingHeight),
  };
  const ranked = rankedPeople(
    input.data,
    booleanSetting(settings, 'showContributors'),
  );

  const nodes: SceneNode[] = [
    ...gridNodes(booleanSetting(settings, 'showGrid'), theme, {
      x: 0,
      y: 0,
      width,
      height,
    }),
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 4,
      maxLines: 1,
    }),
    textNode('repo-name', {
      x: frame.x,
      y: nameY,
      width: frame.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: name.lines.length,
      letterSpacing: -1.5,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: frame.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: 2,
    }),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: frame.x,
      y: metricsTop,
      width: frame.width,
      height: 3,
      fill: { kind: 'solid', color: theme.accent },
    },
    ...metricBandNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      fontFamily,
      theme.foreground,
      {
        x: frame.x,
        y: metricsTop + spacing.xs,
        width: frame.width,
        height: Math.max(0, metricBandHeight - spacing.xs),
      },
    ),
    textNode('contributors-heading', {
      x: frame.x,
      y: headingTop,
      width: frame.width,
      height: headingHeight,
      text: `CONTRIBUTORS · ${ranked.length}`,
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.foreground,
      letterSpacing: 3,
      maxLines: 1,
    }),
    ...rankNodes(
      ranked,
      fontFamily,
      theme,
      numberSetting(settings, 'avatarRadius'),
      board,
    ),
    {
      id: 'footer-rule',
      type: 'rect',
      x: frame.x,
      y: footerTop,
      width: frame.width,
      height: 2,
      fill: { kind: 'solid', color: theme.border },
    },
    textNode('contributor-overflow', {
      x: frame.x,
      y: footerTop + spacing.xs,
      width: frame.width,
      height: Math.max(0, footerHeight - spacing.xs),
      text:
        ranked.length > rankSlots
          ? `+ ${ranked.length - rankSlots} more contributors`
          : 'Every contributor listed',
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 600,
      color: theme.muted,
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

/** One person on the leaderboard. */
type Person = { login: string; avatarUrl: string; contributions: number };

/**
 * Ranks contributors by commits, falling back to the owner alone.
 *
 * @param data - Project data for the current repository.
 * @param shown - Whether the ranking is drawn at all.
 * @returns Contributors ordered by commit count, most first.
 */
function rankedPeople(data: ProjectData, shown: boolean): Person[] {
  const contributors = shown ? (data.contributors ?? []) : [];

  return contributors.length > 0
    ? [...contributors].sort((a, b) => b.contributions - a.contributions)
    : [
        {
          login: data.owner.login,
          avatarUrl: data.owner.avatarUrl,
          contributions: 0,
        },
      ];
}

/**
 * Rules the sheet into graph paper behind the type.
 *
 * @param shown - Whether the ruling is drawn at all.
 * @param theme - Resolved template colours.
 * @param canvas - Bounds of the whole card.
 * @returns One hairline per ruled column and row.
 */
function gridNodes(shown: boolean, theme: Theme, canvas: Box): SceneNode[] {
  if (!shown) {
    return [];
  }

  const pitch = 48;
  const columns = Math.ceil(canvas.width / pitch);
  const rows = Math.ceil(canvas.height / pitch);

  return [
    ...Array.from({ length: columns }, (_, index) => ({
      id: `grid-column-${index + 1}`,
      type: 'rect' as const,
      x: index * pitch,
      y: 0,
      width: 1,
      height: canvas.height,
      fill: { kind: 'solid' as const, color: theme.border },
      opacity: 0.5,
    })),
    ...Array.from({ length: rows }, (_, index) => ({
      id: `grid-row-${index + 1}`,
      type: 'rect' as const,
      x: 0,
      y: index * pitch,
      width: canvas.width,
      height: 1,
      fill: { kind: 'solid' as const, color: theme.border },
      opacity: 0.5,
    })),
  ];
}

/**
 * Lists the top contributors as ranked rows with a bar for their share.
 *
 * Bars are measured against the busiest contributor rather than the total, so
 * a project carried by one person still reads as a ranking instead of one
 * full bar beside five empty ones.
 *
 * @param people - Contributors ordered by commit count, most first.
 * @param fontFamily - Typeface for the logins and counts.
 * @param theme - Resolved template colours.
 * @param radius - Avatar radius chosen in template settings.
 * @param area - Bounds the leaderboard fills.
 * @returns A face, login, bar, and count for every row slot.
 */
function rankNodes(
  people: Person[],
  fontFamily: string,
  theme: Theme,
  radius: number,
  area: Box,
): SceneNode[] {
  const gap = spacing.xs;
  // A wide canvas ranks in two columns, so the rows keep a readable height
  // instead of shrinking the faces to fit six bands into a short board. A
  // project with only a handful of people keeps one column rather than
  // stranding half the board empty.
  const columns =
    area.width > area.height * 2.4 && people.length > rankSlots / 2 ? 2 : 1;
  // Rows are sized to the people who are actually there, so a project with
  // three contributors gets three tall rows rather than six cramped ones.
  const filled = Math.max(1, Math.min(rankSlots, people.length));
  const perColumn = Math.ceil(filled / columns);
  const columnBoxes = row(area, columns, spacing.xl);
  const rowHeight = (area.height - gap * (perColumn - 1)) / perColumn;
  const rows = columnBoxes.flatMap((column) =>
    stack(
      column,
      Array.from({ length: perColumn }, () => rowHeight),
      gap,
    ),
  );
  const columnWidth = columnBoxes[0].width;
  const busiest = Math.max(1, people[0]?.contributions ?? 1);
  const faceSize = Math.max(0, Math.min(rowHeight, columnWidth * 0.12));
  // Konva wraps text to the height of its box, so a one-line label gets a
  // one-line box and is centred in the row rather than filling it.
  const textSize = Math.min(26, faceSize * 0.5);
  const textHeight = textSize * 1.3;
  const loginWidth = columnWidth * 0.3;
  const countWidth = columnWidth * 0.14;
  const trackWidth = Math.max(
    1,
    columnWidth - faceSize - spacing.sm * 2 - loginWidth - countWidth,
  );

  return Array.from({ length: rankSlots }, (_, index): SceneNode[] => {
    const person = people[index];
    // Slots with nobody in them park on the last row so the ids never move.
    const slot = rows[Math.min(index, rows.length - 1)];
    const trackX = slot.x + faceSize + spacing.sm + loginWidth;
    const opacity = person ? 1 : 0;
    const share = person ? person.contributions / busiest : 0;
    const barHeight = Math.max(0, rowHeight * 0.42);

    return [
      {
        id: `contributor-row-${index + 1}`,
        type: 'image',
        x: slot.x,
        y: slot.y + (rowHeight - faceSize) / 2,
        width: faceSize,
        height: faceSize,
        src: person?.avatarUrl ?? people[0].avatarUrl,
        fit: 'cover',
        cornerRadius: Math.min(radius, faceSize / 2),
        opacity,
      },
      textNode(`contributor-${index + 1}-login`, {
        maxLines: 1,
        x: slot.x + faceSize + spacing.sm,
        y: slot.y + (rowHeight - textHeight) / 2,
        width: loginWidth,
        height: textHeight,
        text: person?.login ?? '',
        fontFamily,
        fontSize: textSize,
        fontWeight: 700,
        color: theme.foreground,
        opacity,
      }),
      {
        id: `contributor-${index + 1}-track`,
        type: 'rect',
        x: trackX,
        y: slot.y + (rowHeight - barHeight) / 2,
        width: trackWidth,
        height: barHeight,
        fill: { kind: 'solid', color: theme.border },
        cornerRadius: barHeight / 2,
        opacity,
      },
      {
        id: `contributor-${index + 1}-bar`,
        type: 'rect',
        x: trackX,
        y: slot.y + (rowHeight - barHeight) / 2,
        width: Math.max(barHeight, trackWidth * share),
        height: barHeight,
        fill: { kind: 'solid', color: theme.accent },
        cornerRadius: barHeight / 2,
        opacity,
      },
      textNode(`contributor-${index + 1}-count`, {
        maxLines: 1,
        x: slot.x + slot.width - countWidth,
        y: slot.y + (rowHeight - textHeight) / 2,
        width: countWidth,
        height: textHeight,
        text: person ? formatCount(person.contributions) : '',
        fontFamily,
        fontSize: textSize,
        fontWeight: 700,
        color: theme.foreground,
        align: 'right',
        opacity,
      }),
    ];
  }).flat();
}

/** Bundled contributor sheet that ranks the people behind the repository. */
const commonsTemplate: Template = {
  id: 'commons',
  name: 'Commons',
  description: 'A ruled sheet ranking contributors by the commits they landed.',
  category: 'editorial',
  supportedRatios: ['16:9', '1:1', '4:5', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { commonsTemplate };
