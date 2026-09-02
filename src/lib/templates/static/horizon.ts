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
import { fitCommonSize, fitText } from '@/lib/templates/shared/text';
import {
  autoColor,
  bandScale,
  displayFontOptions,
  monoFontOptions,
  palettes,
  ratioSizes,
  resolveTheme,
  spacing,
  type Theme,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Fill, Scene, SceneNode } from '@/types/scene';
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

/** Share of the fade that holds full colour before it starts to settle. */
const colorHold = 0.5;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showLanguageLabel',
    label: 'Language label',
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
    key: 'bannerColor',
    label: 'Banner colour',
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
    key: 'settlePoint',
    label: 'Colour depth',
    section: 'cards',
    type: 'range',
    min: 30,
    max: 70,
    step: 5,
    unit: '%',
  },
];

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: palettes.terminal.background,
  accentColor: '#ff5a3c',
  bannerColor: '#ff5a3c',
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showLanguageLabel: true,
  eyebrow: 'BUILT WITH',
  ...defaultColors,
  fontFamily: 'Sora Variable',
  monoFamily: 'JetBrains Mono Variable',
  settlePoint: 50,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    settings: defaultColors,
  },
  {
    id: 'tide',
    name: 'Tide',
    settings: {
      backgroundColor: '#05121a',
      accentColor: '#22d3ee',
      bannerColor: '#1d4ed8',
      textColor: autoColor,
    },
  },
  {
    id: 'meadow',
    name: 'Meadow',
    settings: {
      backgroundColor: '#08130d',
      accentColor: '#4ade80',
      bannerColor: '#15803d',
      textColor: autoColor,
    },
  },
  {
    id: 'dusk',
    name: 'Dusk',
    settings: {
      backgroundColor: '#0f0a18',
      accentColor: '#c084fc',
      bannerColor: '#6d28d9',
      textColor: autoColor,
    },
  },
  {
    id: 'daybreak',
    name: 'Daybreak',
    settings: {
      backgroundColor: '#f4f1e8',
      accentColor: '#a85f10',
      bannerColor: '#f59e0b',
      textColor: autoColor,
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showLanguageLabel')) {
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
  // The banner grows with the canvas so a tall card does not pool its extra
  // height between the colour and the readout.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.sm : spacing.md) * scale;

  const eyebrowHeight = 26 * scale;
  const metricBandHeight = (isWide ? 82 : 98) * scale;
  const bodySize = (isWide ? 21 : 24) * Math.min(1.2, scale);
  const bodyLineHeight = 1.4;
  const descriptionLines = isWide ? 2 : 3;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      maxWidth: frame.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 800,
    maxWidth: frame.width,
    minSize: 34,
    maxSize: isWide ? 74 : 96,
    maxLines: 2,
    lineHeight: 1.05,
    letterSpacing: -2,
  });
  // The readout is sized by what it carries and pinned to the foot, so the
  // banner keeps every pixel above it.
  const readoutHeight =
    eyebrowHeight +
    gutter +
    name.height +
    gutter +
    description.height +
    gutter +
    metricBandHeight;
  const readoutTop = frame.y + frame.height - readoutHeight;
  const contentX = frame.x;
  const contentWidth = frame.width;
  const nameY = readoutTop + eyebrowHeight + gutter;
  const descriptionY = nameY + name.height + gutter;
  const metricsTop = descriptionY + description.height + gutter;
  // The banner holds its colour across the top and then spreads the whole way
  // down, so the readout sits inside the colour rather than below it.
  const holdAt = colorHold * (numberSetting(settings, 'settlePoint') / 50);

  const nodes: SceneNode[] = [
    ...bannerNodes(
      input,
      {
        showLabel: booleanSetting(settings, 'showLanguageLabel'),
        color: stringSetting(settings, 'bannerColor'),
        monoFamily,
        labelTop: frame.y,
      },
      theme,
      { x: 0, y: 0, width, height },
      Math.min(0.95, Math.max(0.15, holdAt)),
    ),
    textNode('eyebrow', {
      x: contentX,
      y: readoutTop,
      width: contentWidth * 0.5,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily: monoFamily,
      fontSize: typeScale.eyebrow * 0.85,
      fontWeight: 600,
      color: theme.accent,
      letterSpacing: 2.6,
    }),
    textNode('owner-login', {
      x: contentX + contentWidth * 0.5,
      y: readoutTop,
      width: contentWidth * 0.5,
      height: eyebrowHeight,
      text: `@${input.data.owner.login}`,
      fontFamily: monoFamily,
      fontSize: typeScale.eyebrow * 0.85,
      fontWeight: 600,
      color: theme.muted,
      align: 'right',
      letterSpacing: 1.2,
    }),
    textNode('repo-name', {
      x: contentX,
      y: nameY,
      width: contentWidth,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      lineHeight: name.lineHeight,
      maxLines: 2,
      letterSpacing: -2,
    }),
    textNode('repo-description', {
      x: contentX,
      y: descriptionY,
      width: contentWidth,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: contentX,
      y: metricsTop,
      width: contentWidth,
      height: 1,
      fill: { kind: 'solid', color: theme.muted },
    },
    ...metricNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      { fontFamily, monoFamily },
      theme,
      {
        x: contentX,
        y: metricsTop + spacing.xs,
        width: contentWidth,
        height: Math.max(0, metricBandHeight - spacing.xs),
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

/**
 * Builds the full-bleed banner the whole card is set on.
 *
 * The colour is the user's alone, so it never moves with the language split.
 * Only the leading language is named, and a repository with no language data
 * keeps the banner and drops the label.
 *
 * @param input - Project data and measurement tools.
 * @param options - Label visibility, banner colour, label typeface, and position.
 * @param theme - Resolved template colours.
 * @param area - Bounds the banner fills.
 * @param holdAt - Share of the height that keeps the colour at full strength.
 * @returns The banner field and its language label.
 */
function bannerNodes(
  input: BuildInput,
  options: {
    showLabel: boolean;
    color: string;
    monoFamily: string;
    labelTop: number;
  },
  theme: Theme,
  area: Box,
  holdAt: number,
): SceneNode[] {
  const leading = input.data.languages[0];

  return [
    {
      id: 'banner-field',
      type: 'rect',
      ...area,
      fill: fadeToGround(options.color, theme.background, holdAt),
    },
    textNode('language-label', {
      x: area.x + spacing.md,
      y: options.labelTop,
      width: Math.max(0, area.width - spacing.md * 2),
      height: 26,
      text: leading ? leading.name.toUpperCase() : '',
      fontFamily: options.monoFamily,
      fontSize: 15,
      fontWeight: 600,
      color: theme.background,
      overflow: 'clip',
      letterSpacing: 1.8,
      opacity: options.showLabel && leading ? 1 : 0,
    }),
  ];
}

/**
 * Builds a vertical fade from the banner colour into the card ground.
 *
 * The colour is held flat across the top, then runs the rest of the card to
 * reach the ground at the very foot, so the type is set inside the colour.
 *
 * @param color - Colour the banner holds at the top of the card.
 * @param ground - Background colour the fade resolves to.
 * @param holdAt - Share of the height that keeps the colour at full strength.
 * @returns A vertical linear fill.
 */
function fadeToGround(color: string, ground: string, holdAt: number): Fill {
  return {
    kind: 'linear',
    angle: 90,
    stops: [
      { offset: 0, color },
      { offset: holdAt, color },
      { offset: 1, color: ground },
    ],
  };
}

/** Builds the metric readout pinned to the foot of the card. */
function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fonts: { fontFamily: string; monoFamily: string },
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  // Visible metrics share the band; hidden ones stay in the tree at zero opacity.
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.md);
  const valueSize = fitCommonSize(input.measure, {
    texts: visibleMetrics.map((metric) => formatCount(values[metric])),
    fontFamily: fonts.fontFamily,
    fontWeight: 800,
    letterSpacing: -1,
    maxWidth: cells[0].width,
    maxSize: Math.min(area.height * 0.54, area.width / columns / 3.2),
  });

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        ...cell,
        height: valueSize * 1.15,
        text: formatCount(values[metric.value]),
        fontFamily: fonts.fontFamily,
        fontSize: valueSize,
        fontWeight: 800,
        color: theme.foreground,
        letterSpacing: -1,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...cell,
        y: cell.y + valueSize * 1.15 + 2,
        height: 22,
        text: metric.label.toUpperCase(),
        fontFamily: fonts.monoFamily,
        fontSize: 14,
        fontWeight: 500,
        color: theme.muted,
        letterSpacing: 1.6,
        opacity,
      }),
    ];
  });
}

/** Bundled template that sets the card on a single chosen banner colour. */
const horizonTemplate: Template = {
  id: 'horizon',
  name: 'Horizon',
  description: 'A chosen banner colour settling into the ground, led by type.',
  category: 'developer',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { horizonTemplate };
