import { formatCount } from '@/lib/templates/shared/format';
import {
  type Box,
  grid as gridCells,
  inset,
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
import { fitCommonSize, fitText } from '@/lib/templates/shared/text';
import {
  autoColor,
  displayFontOptions,
  monoFontOptions,
  palettes,
  ratioSizes,
  resolveTheme,
  type Theme,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

/** Cells the name band spans before the avatar cell closes the top rows. */
const nameRows = 2;

/** First row that carries the description across the full width of the sheet. */
const descriptionRow = 2;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showLanguage',
    label: 'Language cell',
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
    key: 'monoFamily',
    label: 'Label typeface',
    section: 'typography',
    type: 'select',
    options: monoFontOptions,
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
  backgroundColor: palettes.ink.background,
  accentColor: '#e0432a',
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'watchers', 'issues', 'pullRequests'],
  showLanguage: true,
  ...defaultColors,
  fontFamily: 'Space Grotesk Variable',
  monoFamily: 'JetBrains Mono Variable',
  avatarRadius: 0,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'signal',
    name: 'Signal',
    settings: defaultColors,
  },
  {
    id: 'klein',
    name: 'Klein',
    settings: {
      backgroundColor: '#f2f2f4',
      accentColor: '#002fa7',
      textColor: autoColor,
    },
  },
  {
    id: 'ochre',
    name: 'Ochre',
    settings: {
      backgroundColor: '#f7f1e2',
      accentColor: '#9a6a08',
      textColor: autoColor,
    },
  },
  {
    id: 'carbon',
    name: 'Carbon',
    settings: {
      backgroundColor: '#141414',
      accentColor: '#f5f5f5',
      textColor: autoColor,
    },
  },
  {
    id: 'teal',
    name: 'Teal',
    settings: {
      backgroundColor: '#eaf2f2',
      accentColor: '#0f6f70',
      textColor: autoColor,
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showLanguage')) {
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
  const monoFamily = stringSetting(settings, 'monoFamily');
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 48 : 64);
  // The module count is fixed per orientation so every cell stays a slot the
  // layout can rely on, whatever the repository turns out to hold.
  const columns = isWide ? 6 : 5;
  const rows = isWide ? 4 : 6;
  const gap = isWide ? 10 : 12;
  const cells = gridCells(frame, columns, rows, gap);
  const at = (column: number, line: number) => cells[line * columns + column];

  const nameBox = union(at(0, 0), at(columns - 2, nameRows - 1));
  // The avatar keeps a square of the side column at every ratio, so the crop
  // never turns into a letterbox slice of the face. What is left of the
  // column below it becomes the accent block.
  const sideColumn = union(at(columns - 1, 0), at(columns - 1, nameRows - 1));
  const avatarSize = Math.min(sideColumn.width, sideColumn.height);
  const avatarBox: Box = {
    x: sideColumn.x,
    y: sideColumn.y,
    width: avatarSize,
    height: avatarSize,
  };
  const spareBox: Box = {
    x: sideColumn.x,
    y: sideColumn.y + avatarSize + gap,
    width: sideColumn.width,
    height: Math.max(0, sideColumn.height - avatarSize - gap),
  };
  // A tall sheet gives the description a second row, which keeps the pool of
  // fact cells close to the number of facts there are to show.
  const descriptionRows = isWide ? 1 : 2;
  const descriptionBox = union(
    at(0, descriptionRow),
    at(columns - 1, descriptionRow + descriptionRows - 1),
  );
  // Every cell below the description is a slot the readout fills in order.
  const pool = cells.slice((descriptionRow + descriptionRows) * columns);
  const metrics = stringArraySetting(settings, 'metrics');
  const showLanguage = booleanSetting(settings, 'showLanguage');
  const flooded = floodedCells(
    pool.length,
    metrics.length + (showLanguage ? 1 : 0),
  );
  const padding = isWide ? 16 : 20;

  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 700,
    maxWidth: nameBox.width - padding * 2,
    minSize: 32,
    // The login sits on the last line of the panel, so the name may only
    // grow into what is left above it.
    maxSize: Math.max(36, (nameBox.height - padding * 2 - 32) / 2 / 1.05),
    maxLines: 2,
    lineHeight: 1.05,
    letterSpacing: -2,
  });

  const nodes: SceneNode[] = [
    // Merged blocks are drawn as one panel each, so no cell rule ever runs
    // through the name or the description.
    ...panelNodes(
      [
        ['name-panel', nameBox],
        ['avatar-panel', avatarBox],
        ['description-panel', descriptionBox],
      ],
      theme,
    ),
    {
      id: 'spare-panel',
      type: 'rect',
      ...spareBox,
      fill: { kind: 'solid', color: theme.accent },
      stroke: { color: theme.border, width: 1 },
    },
    ...cellNodes(pool, flooded, theme),
    textNode('repo-name', {
      x: nameBox.x + padding,
      y: nameBox.y + padding,
      width: nameBox.width - padding * 2,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
      overflow: 'clip',
      letterSpacing: -2,
    }),
    textNode('owner-login', {
      x: nameBox.x + padding,
      y: nameBox.y + nameBox.height - padding - 24,
      width: nameBox.width - padding * 2,
      height: 24,
      text: `@${input.data.owner.login}`,
      fontFamily: monoFamily,
      fontSize: 18,
      fontWeight: 500,
      color: theme.accent,
      letterSpacing: 1.2,
    }),
    {
      id: 'owner-avatar',
      type: 'image',
      x: avatarBox.x,
      y: avatarBox.y,
      width: avatarBox.width,
      height: avatarBox.height,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: numberSetting(settings, 'avatarRadius'),
    },
    ...descriptionNodes(
      input,
      { fontFamily, padding },
      theme,
      descriptionBox,
      isWide,
    ),
    ...poolNodes(
      input,
      { metrics, showLanguage },
      { fontFamily, monoFamily, padding },
      theme,
      pool,
      flooded,
    ),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

/**
 * Merges two cell bounds into the block they enclose.
 *
 * @param from - Top-left cell of the block.
 * @param to - Bottom-right cell of the block.
 * @returns Bounds covering both cells and the gaps between them.
 */
function union(from: Box, to: Box): Box {
  return {
    x: from.x,
    y: from.y,
    width: to.x + to.width - from.x,
    height: to.y + to.height - from.y,
  };
}

/**
 * Draws the merged blocks that carry the name, avatar, and description.
 *
 * @param panels - Node id and bounds for each merged block.
 * @param theme - Resolved template colours.
 * @returns One ruled rect per block.
 */
function panelNodes(panels: [string, Box][], theme: Theme): SceneNode[] {
  return panels.map(
    ([id, box]): SceneNode => ({
      id,
      type: 'rect',
      ...box,
      fill: { kind: 'solid', color: theme.surface },
      stroke: { color: theme.border, width: 1 },
    }),
  );
}

/**
 * Draws the ruled module behind every cell of the sheet.
 *
 * A scattered share of the cells is flooded with the accent colour, which is
 * what keeps a large canvas reading as a filled grid rather than a void.
 *
 * @param cells - Every cell of the module grid.
 * @param flooded - Whether each cell carries the accent colour.
 * @param theme - Resolved template colours.
 * @returns One rect per cell.
 */
function cellNodes(
  cells: Box[],
  flooded: boolean[],
  theme: Theme,
): SceneNode[] {
  return cells.map(
    (cell, index): SceneNode => ({
      id: `cell-${index + 1}`,
      type: 'rect',
      ...cell,
      fill: {
        kind: 'solid',
        color: flooded[index] ? theme.accent : theme.surface,
      },
      stroke: { color: theme.border, width: 1 },
    }),
  );
}

/** Builds the description band that spans the full width of the sheet. */
function descriptionNodes(
  input: BuildInput,
  style: { fontFamily: string; padding: number },
  theme: Theme,
  area: Box,
  isWide: boolean,
): SceneNode[] {
  const bodySize = isWide ? 22 : 30;
  const lineHeight = 1.35;
  const maxLines = Math.max(
    1,
    Math.floor((area.height - style.padding * 2) / (bodySize * lineHeight)),
  );
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily: style.fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: area.width - style.padding * 2,
      lineHeight,
      maxLines,
    },
  );

  return [
    textNode('repo-description', {
      x: area.x + style.padding,
      y:
        area.y +
        Math.max(style.padding, (area.height - description.height) / 2),
      width: area.width - style.padding * 2,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily: style.fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight,
      maxLines,
    }),
  ];
}

/**
 * Fills the cells below the description with the metric and language readout.
 *
 * Visible metrics claim cells in order; hidden ones stay in the tree on the
 * first cell at zero opacity so their node ids never move.
 *
 * @param input - Project data and measurement tools.
 * @param content - Which metrics are on and whether the language cell shows.
 * @param style - Typefaces and cell padding.
 * @param theme - Resolved template colours.
 * @param pool - Cells available below the description row.
 * @param flooded - Whether each pool cell carries the accent colour.
 * @returns Text nodes for every metric slot and the language slot.
 */
function poolNodes(
  input: BuildInput,
  content: { metrics: string[]; showLanguage: boolean },
  style: { fontFamily: string; monoFamily: string; padding: number },
  theme: Theme,
  pool: Box[],
  flooded: boolean[],
): SceneNode[] {
  const values = metricValues(input.data);
  const language = input.data.languages[0];
  const languageSlot = Math.min(content.metrics.length, pool.length - 1);
  const languageCell = pool[languageSlot];
  const languageInk = flooded[languageSlot] ? theme.background : undefined;

  const metricNodes = metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = content.metrics.indexOf(metric.value);
    const slot = Math.max(0, Math.min(visibleIndex, pool.length - 1));
    const cell = pool[slot];
    const shown = visibleIndex >= 0 && visibleIndex < pool.length;
    const valueSize = fitCommonSize(input.measure, {
      texts: [formatCount(values[metric.value])],
      fontFamily: style.fontFamily,
      fontWeight: 700,
      letterSpacing: -1.5,
      maxWidth: cell.width - style.padding * 2,
      maxSize: Math.min(
        (cell.height - style.padding * 2) * 0.62,
        (cell.width - style.padding * 2) / 2.4,
      ),
    });

    return [
      textNode(`metric-${metric.value}-value`, {
        x: cell.x + style.padding,
        y: cell.y + style.padding,
        width: cell.width - style.padding * 2,
        height: valueSize * 1.15,
        text: formatCount(values[metric.value]),
        fontFamily: style.fontFamily,
        fontSize: valueSize,
        fontWeight: 700,
        // Numbers sitting on a flooded cell need the background back.
        color: flooded[slot] ? theme.background : theme.foreground,
        letterSpacing: -1.5,
        opacity: shown ? 1 : 0,
      }),
      textNode(`metric-${metric.value}-label`, {
        x: cell.x + style.padding,
        y: cell.y + cell.height - style.padding - 20,
        width: cell.width - style.padding * 2,
        height: 20,
        text: metric.label.toUpperCase(),
        fontFamily: style.monoFamily,
        fontSize: 14,
        fontWeight: 500,
        color: flooded[slot] ? theme.background : theme.muted,
        letterSpacing: 1.6,
        opacity: shown ? 1 : 0,
      }),
    ];
  });

  return [
    ...metricNodes,
    textNode('language-name', {
      x: languageCell.x + style.padding,
      y: languageCell.y + style.padding,
      width: languageCell.width - style.padding * 2,
      height: 30,
      text: language?.name ?? '',
      fontFamily: style.fontFamily,
      fontSize: 26,
      fontWeight: 700,
      color: languageInk ?? theme.foreground,
      letterSpacing: -0.6,
      opacity: content.showLanguage && language ? 1 : 0,
    }),
    textNode('language-share', {
      x: languageCell.x + style.padding,
      y: languageCell.y + languageCell.height - style.padding - 20,
      width: languageCell.width - style.padding * 2,
      height: 20,
      text: language ? `${language.percentage.toFixed(1)}%` : '',
      fontFamily: style.monoFamily,
      fontSize: 14,
      fontWeight: 500,
      color: languageInk ?? theme.muted,
      letterSpacing: 1.6,
      opacity: content.showLanguage && language ? 1 : 0,
    }),
  ];
}

/**
 * Floods the pool cells that no fact claimed.
 *
 * The readout fills cells in order, so every other cell past it is flooded
 * with the accent colour. Alternating keeps a tall sheet reading as a grid
 * rather than a row of facts above one slab of colour.
 *
 * @param count - Number of cells in the pool.
 * @param used - Number of leading cells the readout claims.
 * @returns One flag per pool cell, in grid order.
 */
function floodedCells(count: number, used: number) {
  return Array.from(
    { length: count },
    (_, index) => index >= used && (index - used) % 2 === 0,
  );
}

/** Bundled Swiss module grid where every cell is a filled slot. */
const gridTemplate: Template = {
  id: 'grid',
  name: 'Grid',
  description: 'A Swiss module grid with a filled cell for every fact.',
  category: 'minimal',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { gridTemplate };
