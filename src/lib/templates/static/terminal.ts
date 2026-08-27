import { formatCount } from '@/lib/templates/shared/format';
import { type Box, inset } from '@/lib/templates/shared/layout';
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
  monoFontOptions,
  palettes,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { ProjectData } from '@/types/data/project';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const languageColors = ['#7ee787', '#58a6ff', '#d2a8ff', '#ffa657', '#f778ba'];

/** Language slots rendered by the template, shown or hidden by data. */
const languageSlots = 5;

/** Titlebar height and the tightest metric row pitch the layout allows. */
const titlebarHeight = 72;
const minMetricRowHeight = 30;

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
    key: 'prompt',
    label: 'Command prompt',
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
    options: monoFontOptions,
  },
  {
    key: 'windowRadius',
    label: 'Window radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 40,
    step: 4,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showLanguages: true,
  prompt: '$ gh repo view',
  backgroundColor: palettes.terminal.background,
  accentColor: palettes.terminal.accent,
  fontFamily: 'JetBrains Mono Variable',
  windowRadius: 24,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

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
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 52 : 64);
  const body = inset(
    {
      x: frame.x,
      y: frame.y + titlebarHeight,
      width: frame.width,
      height: frame.height - titlebarHeight,
    },
    spacing.lg,
  );
  const theme = resolveTheme(
    stringSetting(settings, 'backgroundColor'),
    stringSetting(settings, 'accentColor'),
  );
  const fontFamily = stringSetting(settings, 'fontFamily');
  const radius = numberSetting(settings, 'windowRadius');
  const showLanguages = booleanSetting(settings, 'showLanguages');
  const visibleMetrics = stringArraySetting(settings, 'metrics');

  // Languages sit on the floor; everything above flows down into what is left.
  const languageBlock = showLanguages ? 104 : 0;
  const languageTop = body.y + body.height - languageBlock;
  const metricsFloor = languageTop - (showLanguages ? spacing.md : 0);
  const metricColumns = isWide && visibleMetrics.length > 3 ? 2 : 1;
  const metricRows = Math.ceil(
    Math.max(1, visibleMetrics.length) / metricColumns,
  );
  // Rows keep a tight floor for the text budget but may open up to fill a tall
  // canvas rather than huddling above the languages.
  const maxMetricRowHeight = isWide ? 42 : 72;
  const metricsReserve = metricRows * minMetricRowHeight;
  const metricsPreferred = metricRows * maxMetricRowHeight;

  const commandSize = isWide ? 20 : 26;
  const bodySize = isWide ? 20 : 26;
  const bodyLineHeight = 1.5;
  const nameLineHeight = 1.12;
  // The text may run down only to where the metric rows must begin.
  const textFloor = metricsFloor - metricsReserve - spacing.md;
  const textBudget = textFloor - body.y;
  // The name may only grow into space the description does not need.
  const nameBudget =
    textBudget -
    (commandSize * 1.4 + spacing.md + spacing.md) -
    bodySize * bodyLineHeight * 2;
  const name = fitText(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 700,
    maxWidth: body.width,
    minSize: 26,
    maxSize: Math.max(
      30,
      Math.min(isWide ? 54 : 70, nameBudget / 2 / nameLineHeight),
    ),
    maxLines: 2,
    lineHeight: nameLineHeight,
  });
  const consumed = commandSize * 1.4 + spacing.md + name.height + spacing.md;
  const descriptionLines = Math.max(
    1,
    Math.min(
      4,
      Math.floor((textBudget - consumed) / (bodySize * bodyLineHeight)),
    ),
  );
  const description = input.measure(
    input.data.repository.description || 'No repository description provided.',
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: body.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );

  let cursor = body.y;
  const commandY = cursor;
  cursor += commandSize * 1.4 + spacing.md;
  const nameY = cursor;
  cursor += name.height + spacing.md;
  const descriptionY = cursor;
  // Metrics sit as low as possible without overlapping text or languages.
  const metricsTop = Math.max(
    descriptionY + description.height + spacing.md,
    metricsFloor - metricsPreferred,
  );
  const metricRowHeight = Math.min(
    maxMetricRowHeight,
    Math.max(minMetricRowHeight, (metricsFloor - metricsTop) / metricRows),
  );

  const nodes: SceneNode[] = [
    {
      id: 'terminal-window',
      type: 'rect',
      ...frame,
      fill: { kind: 'solid', color: theme.surface },
      cornerRadius: radius,
      stroke: { color: theme.border, width: 2 },
      shadow: {
        color: '#000000',
        blur: 40,
        offsetX: 0,
        offsetY: 20,
        opacity: 0.28,
      },
    },
    {
      id: 'terminal-titlebar',
      type: 'rect',
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: titlebarHeight,
      fill: { kind: 'solid', color: theme.border },
      cornerRadius: radius,
    },
    {
      // Squares off the titlebar's lower corners against the window body.
      id: 'terminal-titlebar-foot',
      type: 'rect',
      x: frame.x,
      y: frame.y + titlebarHeight - radius,
      width: frame.width,
      height: radius,
      fill: { kind: 'solid', color: theme.border },
    },
    {
      id: 'terminal-titlebar-rule',
      type: 'rect',
      x: frame.x,
      y: frame.y + titlebarHeight - 1,
      width: frame.width,
      height: 1,
      fill: { kind: 'solid', color: theme.border },
    },
    ...terminalDots(frame.x + 28, frame.y + 27),
    textNode('terminal-title', {
      x: frame.x + 160,
      y: frame.y + 25,
      width: frame.width - 320,
      height: 26,
      text: input.data.repository.fullName,
      fontFamily,
      fontSize: 18,
      fontWeight: 500,
      color: theme.muted,
      align: 'center',
    }),
    textNode('command', {
      x: body.x,
      y: commandY,
      width: body.width,
      height: commandSize * 1.4,
      text: stringSetting(settings, 'prompt'),
      fontFamily,
      fontSize: commandSize,
      fontWeight: 500,
      color: theme.accent,
    }),
    textNode('repo-name', {
      x: body.x,
      y: nameY,
      width: body.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 700,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
    }),
    textNode('repo-description', {
      x: body.x,
      y: descriptionY,
      width: body.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    ...metricNodes(
      input,
      visibleMetrics,
      fontFamily,
      theme,
      metricRowHeight,
      metricColumns,
      {
        ...body,
        y: metricsTop,
        height: metricsFloor - metricsTop,
      },
    ),
    ...languageNodes(input, showLanguages, fontFamily, theme, {
      ...body,
      y: languageTop,
      height: languageBlock,
    }),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

function terminalDots(x: number, y: number): SceneNode[] {
  return ['#ff5f57', '#febc2e', '#28c840'].map((color, index) => ({
    id: `window-control-${index + 1}`,
    type: 'rect',
    x: x + index * 32,
    y,
    width: 18,
    height: 18,
    fill: { kind: 'solid', color },
    cornerRadius: 9,
  }));
}

function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  rowHeight: number,
  columns: number,
  area: Box,
) {
  const values = metricValues(input.data);

  const gap = spacing.md;
  const cellWidth = (area.width - gap * (columns - 1)) / columns;
  const fontSize = rowHeight < 34 ? 20 : 23;

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const opacity = visibleIndex >= 0 ? 1 : 0;
    const slot = Math.max(0, visibleIndex);
    const x = area.x + (slot % columns) * (cellWidth + gap);
    const y = area.y + Math.floor(slot / columns) * rowHeight;

    return [
      textNode(`metric-${metric.value}`, {
        x,
        y,
        width: cellWidth * 0.62,
        height: 34,
        text: metric.label.toLowerCase(),
        fontFamily,
        fontSize,
        fontWeight: 500,
        color: theme.muted,
        opacity,
      }),
      textNode(`metric-${metric.value}-value`, {
        x,
        y,
        width: cellWidth,
        height: 34,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize,
        fontWeight: 700,
        color: theme.foreground,
        align: 'right',
        opacity,
      }),
    ];
  });
}

function languageNodes(
  input: BuildInput,
  visible: boolean,
  fontFamily: string,
  theme: Theme,
  area: Box,
) {
  // Only languages above a rounding threshold get a slot, so no empty pills.
  const languages = input.data.languages
    .filter((language) => language.percentage >= 0.5)
    .slice(0, languageSlots);
  const gap = 6;
  const trackWidth = area.width - gap * Math.max(0, languages.length - 1);
  const nodes: SceneNode[] = [
    textNode('languages-heading', {
      x: area.x,
      y: area.y,
      width: area.width,
      height: 28,
      text: 'languages',
      fontFamily,
      fontSize: 20,
      fontWeight: 600,
      color: theme.muted,
      opacity: visible ? 1 : 0,
    }),
  ];
  let offset = 0;

  for (let index = 0; index < languageSlots; index += 1) {
    const language = languages[index];
    const width = language
      ? Math.max(14, trackWidth * (language.percentage / 100))
      : 0;

    nodes.push(
      languageSegment(index, area, offset, width, visible && Boolean(language)),
    );

    if (index < 3) {
      nodes.push(
        languageLabel(
          index,
          area,
          language,
          fontFamily,
          theme,
          visible && Boolean(language),
        ),
      );
    }

    offset += language ? width + gap : 0;
  }

  return nodes;
}

/** Builds one proportional language pill within the track. */
function languageSegment(
  index: number,
  area: Box,
  offset: number,
  width: number,
  shown: boolean,
): SceneNode {
  return {
    id: `language-segment-${index + 1}`,
    type: 'rect',
    x: area.x + offset,
    y: area.y + 42,
    // Never let rounding push the last pill past the track.
    width: Math.max(0, Math.min(width, area.width - offset)),
    height: 18,
    fill: { kind: 'solid', color: languageColors[index] },
    cornerRadius: 9,
    opacity: shown ? 1 : 0,
  };
}

/** Builds the caption sitting under the language track. */
function languageLabel(
  index: number,
  area: Box,
  language: ProjectData['languages'][number] | undefined,
  fontFamily: string,
  theme: Theme,
  shown: boolean,
): SceneNode {
  return textNode(`language-label-${index + 1}`, {
    x: area.x + index * (area.width / 3),
    y: area.y + 76,
    width: area.width / 3,
    height: 28,
    text: language ? `${language.name} ${language.percentage.toFixed(1)}%` : '',
    fontFamily,
    fontSize: 18,
    fontWeight: 500,
    color: theme.muted,
    opacity: shown ? 1 : 0,
  });
}

/** Bundled terminal-style repository card template. */
const terminalTemplate: Template = {
  id: 'terminal',
  name: 'Terminal',
  description: 'A command-line view with repository output and languages.',
  category: 'developer',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { terminalTemplate };
