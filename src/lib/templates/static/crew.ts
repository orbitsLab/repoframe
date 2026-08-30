import { formatCount } from '@/lib/templates/shared/format';
import { type Box, inset } from '@/lib/templates/shared/layout';
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
  mutedInk,
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

/** Fixed tile count beside the hero, so node ids stay stable across ratios. */
const tileSlots = 24;

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
    label: 'Contributor wall',
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

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: '#141414',
  accentColor: '#ff5a3c',
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showContributors: true,
  eyebrow: 'BUILT BY',
  ...defaultColors,
  fontFamily: 'Space Grotesk Variable',
  avatarRadius: 0,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'coral',
    name: 'Coral',
    settings: defaultColors,
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    settings: {
      backgroundColor: '#0e1424',
      accentColor: '#4d7cff',
      textColor: autoColor,
    },
  },
  {
    id: 'gold',
    name: 'Gold',
    settings: {
      backgroundColor: '#16140f',
      accentColor: '#e0b83c',
      textColor: autoColor,
    },
  },
  {
    id: 'gallery',
    name: 'Gallery',
    settings: {
      backgroundColor: '#f0eeea',
      accentColor: '#b03a2e',
      textColor: autoColor,
    },
  },
  {
    id: 'jade',
    name: 'Jade',
    settings: {
      backgroundColor: '#0b1512',
      accentColor: '#2dd4a7',
      textColor: autoColor,
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showContributors')) {
    paths.push('contributors');
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
  // The hero plate carries type over the accent, not over the page.
  const overAccent = resolveTheme(theme.accent, theme.accent).foreground;
  const fontFamily = stringSetting(settings, 'fontFamily');
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 48 : 68);
  // Bands grow with the canvas so a tall card does not pool its extra height
  // into one gap above the tiles.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.sm : spacing.md) * scale;

  const eyebrowHeight = 28 * scale;
  const nameLines = isWide ? 1 : 2;
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 700,
    maxWidth: frame.width,
    minSize: 32,
    maxSize: isWide ? 66 : 88,
    maxLines: nameLines,
    lineHeight: 0.98,
    letterSpacing: -2,
  });

  const bodySize = (isWide ? 19 : 23) * Math.min(1.25, scale);
  const bodyLineHeight = 1.4;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: frame.width * (isWide ? 0.68 : 1),
      lineHeight: bodyLineHeight,
      maxLines: 2,
    },
  );

  const metricBandHeight = (isWide ? 84 : 102) * scale;
  const metricsTop = frame.y + frame.height - metricBandHeight;
  const nameY = frame.y + eyebrowHeight + gutter;
  const descriptionY = nameY + name.height + gutter * 0.5;
  // The tiles take everything between the description and the footer, so a
  // taller canvas gains rows of people rather than a gap.
  const tilesTop = descriptionY + description.height + gutter;
  const tiles: Box = {
    x: frame.x,
    y: tilesTop,
    width: frame.width,
    height: Math.max(0, metricsTop - gutter - tilesTop),
  };

  const nodes: SceneNode[] = [
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: frame.width * 0.5,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.accent,
      letterSpacing: 3,
    }),
    textNode('owner-login', {
      x: frame.x + frame.width * 0.5,
      y: frame.y,
      width: frame.width * 0.5,
      height: eyebrowHeight,
      text: `@${input.data.owner.login}`,
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 500,
      color: theme.muted,
      align: 'right',
      letterSpacing: 1,
    }),
    textNode('repo-name', {
      x: frame.x,
      y: nameY,
      width: frame.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: name.lines.length,
      overflow: 'clip',
      letterSpacing: -2,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: frame.width * (isWide ? 0.68 : 1),
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: 2,
    }),
    ...crewNodes(
      people(input.data, booleanSetting(settings, 'showContributors')),
      {
        fontFamily,
        overAccent,
        radius: numberSetting(settings, 'avatarRadius'),
      },
      theme,
      tiles,
    ),
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
        y: metricsTop + spacing.sm * scale,
        width: frame.width,
        height: Math.max(0, metricBandHeight - spacing.sm * scale),
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

/** One person shown in the crew grid. */
type Person = { login: string; avatarUrl: string; contributions: number };

/**
 * Reads the contributor list, falling back to the owner alone.
 *
 * The contributors endpoint is optional and the wall can be switched off, so
 * either way there is still a subject to show rather than an empty grid.
 *
 * @param data - Project data for the current repository.
 * @param showContributors - Whether the wall beside the lead is drawn.
 * @returns Contributors ordered as GitHub returned them.
 */
function people(data: ProjectData, showContributors: boolean): Person[] {
  const contributors = showContributors ? (data.contributors ?? []) : [];

  return contributors.length > 0
    ? contributors
    : [
        {
          login: data.owner.login,
          avatarUrl: data.owner.avatarUrl,
          contributions: 0,
        },
      ];
}

/**
 * Lays the lead contributor out beside a block of the rest of the crew.
 *
 * The block is packed to the number of people rather than to a fixed grid,
 * so a project with three contributors fills its space as squarely as one
 * with thirty instead of stranding the tiles in a half-empty wall.
 *
 * @param crew - Contributors to place, in reading order.
 * @param style - Typeface, knocked-out colour, and avatar radius.
 * @param theme - Resolved template colours.
 * @param area - Bounds the lead and the block share.
 * @returns The lead block and every tile slot, shown or hidden.
 */
function crewNodes(
  crew: Person[],
  style: { fontFamily: string; overAccent: string; radius: number },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const gap = 10;
  const others = crew.slice(1);
  // The split follows the shape of the space the tiles were given rather than
  // the shape of the canvas, so the lead never sits beside its own empty half.
  const stacked = area.height >= area.width * 1.35;
  // A lone contributor has no block to sit beside, so the lead takes the
  // whole area rather than leaving a gap where the crew would have been.
  const leadSize =
    others.length === 0
      ? Math.min(area.width, area.height)
      : Math.min(
          stacked ? area.width : area.height,
          stacked ? area.height : area.width * 0.5,
        );
  const rest: Box = stacked
    ? {
        x: area.x,
        y: area.y + leadSize + gap,
        width: area.width,
        height: Math.max(0, area.height - leadSize - gap),
      }
    : {
        x: area.x + leadSize + gap,
        y: area.y,
        width: Math.max(0, area.width - leadSize - gap),
        height: area.height,
      };
  const columns = bestColumns(others.length, rest, gap);
  const rows = Math.max(1, Math.ceil(Math.max(1, others.length) / columns));
  const cellWidth = (rest.width - gap * (columns - 1)) / columns;
  const cellHeight = (rest.height - gap * (rows - 1)) / rows;

  return [
    ...heroNodes(crew[0], style, theme, {
      x: area.x,
      y: area.y,
      width: leadSize,
      // Side by side, the lead owns its column to the foot of the area so the
      // plate can close the depth its square cannot reach.
      height: stacked ? leadSize : area.height,
    }),
    ...Array.from({ length: tileSlots }, (_, index): SceneNode => {
      const person = others[index];
      // Hidden tiles park on the last cell so ids never move.
      const slot = Math.min(index, columns * rows - 1);
      const size = Math.max(0, Math.min(cellWidth, cellHeight));
      const cellX = rest.x + (slot % columns) * (cellWidth + gap);
      const cellY = rest.y + Math.floor(slot / columns) * (cellHeight + gap);

      return {
        id: `crew-tile-${index + 1}`,
        type: 'image',
        x: cellX + Math.max(0, (cellWidth - size) / 2),
        y: cellY + Math.max(0, (cellHeight - size) / 2),
        width: size,
        height: size,
        src: person?.avatarUrl ?? crew[0].avatarUrl,
        fit: 'cover',
        cornerRadius: Math.min(style.radius, size / 2),
        opacity: person ? 1 : 0,
      };
    }),
  ];
}

/**
 * Picks the column count that gives the crew the largest square tiles.
 *
 * @param count - People to place in the block.
 * @param area - Bounds the block fills.
 * @param gap - Space between adjacent tiles.
 * @returns The best column count, at least one.
 */
function bestColumns(count: number, area: Box, gap: number) {
  const total = Math.max(1, Math.min(count, tileSlots));
  let best = 1;
  let bestSize = 0;

  for (let columns = 1; columns <= total; columns += 1) {
    const rows = Math.ceil(total / columns);
    const size = Math.min(
      (area.width - gap * (columns - 1)) / columns,
      (area.height - gap * (rows - 1)) / rows,
    );

    if (size > bestSize) {
      bestSize = size;
      best = columns;
    }
  }

  return best;
}

/**
 * Draws the lead contributor and the plate that names them.
 *
 * The avatar keeps a square so the crop never slices the face, and the plate
 * takes whatever depth is left under it, so a column taller than the square
 * closes on the plate instead of on empty ground.
 *
 * @param lead - Contributor with the most commits.
 * @param style - Typeface, knocked-out colour, and avatar radius.
 * @param theme - Resolved template colours.
 * @param area - Bounds of the lead column.
 * @returns The lead avatar and its name plate.
 */
function heroNodes(
  lead: Person,
  style: { fontFamily: string; overAccent: string; radius: number },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const size = Math.min(area.width, area.height);
  const plateHeight = Math.max(
    Math.min(88, Math.max(44, size * 0.24)),
    area.height - size,
  );
  const plateTop = area.y + area.height - plateHeight;
  // Type is sized from the avatar, not the plate, so a plate that stretches to
  // close a tall column does not blow the login up with it.
  const loginSize = Math.min(34, Math.max(16, size * 0.08));
  const plateInset = spacing.sm;
  // The caption sits on the foot of the plate, so a plate stretched to close a
  // tall column reads as a block of colour under the face rather than a void.
  const commitsY = plateTop + plateHeight - plateInset - loginSize * 0.86;

  return [
    {
      id: 'lead-avatar',
      type: 'image',
      x: area.x,
      y: area.y,
      width: size,
      height: size,
      src: lead.avatarUrl,
      fit: 'cover',
      cornerRadius: Math.min(style.radius, size / 2),
    },
    {
      id: 'lead-plate',
      type: 'rect',
      x: area.x,
      y: plateTop,
      width: size,
      height: plateHeight,
      fill: { kind: 'solid', color: theme.accent },
    },
    textNode('lead-login', {
      x: area.x + spacing.xs,
      y: commitsY - loginSize * 1.2,
      width: Math.max(1, size - spacing.xs * 2),
      height: loginSize * 1.2,
      text: lead.login,
      fontFamily: style.fontFamily,
      fontSize: loginSize,
      fontWeight: 700,
      color: style.overAccent,
      overflow: 'ellipsis',
      letterSpacing: -0.5,
    }),
    textNode('lead-commits', {
      x: area.x + spacing.xs,
      y: commitsY,
      width: Math.max(1, size - spacing.xs * 2),
      height: loginSize * 0.86,
      text: `${formatCount(lead.contributions)} COMMITS`,
      fontFamily: style.fontFamily,
      fontSize: loginSize * 0.56,
      fontWeight: 700,
      color: style.overAccent,
      letterSpacing: 1.5,
      opacity: mutedInk,
    }),
  ];
}

/** Bundled contributor poster that makes the people the subject of the card. */
const crewTemplate: Template = {
  id: 'crew',
  name: 'Crew',
  description: 'A tiled wall of contributors with the lead committer named.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { crewTemplate };
