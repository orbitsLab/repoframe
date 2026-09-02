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

/**
 * Bar colours keyed by rank rather than language name.
 *
 * Declared per template so each one can tune its own palette, matching how
 * the other bundled templates carry their colour choices.
 */
const barColors = ['#ff5a3c', '#ffb02e', '#3ddc97', '#4cc9f0', '#a86bff'];

/** Fixed slot count so node ids stay stable as data changes. */
const languageSlots = 5;

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
    key: 'showLanguageLabels',
    label: 'Language labels',
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
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showLanguageLabels: true,
  eyebrow: 'BUILT WITH',
  ...defaultColors,
  fontFamily: 'Sora Variable',
  monoFamily: 'JetBrains Mono Variable',
  settlePoint: 50,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'prism',
    name: 'Prism',
    settings: defaultColors,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    settings: {
      backgroundColor: '#06121a',
      accentColor: '#34d399',
      textColor: autoColor,
    },
  },
  {
    id: 'vapour',
    name: 'Vapour',
    settings: {
      backgroundColor: '#0d0a18',
      accentColor: '#c084fc',
      textColor: autoColor,
    },
  },
  {
    id: 'solar',
    name: 'Solar',
    settings: {
      backgroundColor: '#140c04',
      accentColor: '#fbbf24',
      textColor: autoColor,
    },
  },
  {
    id: 'chalk',
    name: 'Chalk',
    settings: {
      backgroundColor: '#f3f1ea',
      accentColor: '#e0432a',
      textColor: autoColor,
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showLanguageLabels')) {
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
  // Bands grow with the canvas so a tall card does not pool its extra height
  // between the colour and the readout.
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
  // colour keeps every pixel above it.
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
  // The colour has to have settled into the ground before the type starts,
  // so the readout always sits on a calm field whatever colours are chosen.
  const settleAt =
    ((readoutTop - gutter) * (numberSetting(settings, 'settlePoint') / 50)) /
    height;

  const nodes: SceneNode[] = [
    ...barNodes(
      input,
      {
        showLabels: booleanSetting(settings, 'showLanguageLabels'),
        monoFamily,
        labelTop: frame.y,
      },
      theme,
      { x: 0, y: 0, width, height },
      Math.min(0.95, Math.max(0.15, settleAt)),
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
 * Reads the highest-ranked languages a repository reports.
 *
 * Every language that fits a slot earns a bar whatever its share, so a
 * long tail shows as a set of thin bands rather than being dropped.
 *
 * @param input - Project data and measurement tools.
 * @returns Ranked languages, capped at the available slots.
 */
function rankedLanguages(input: BuildInput) {
  return input.data.languages.slice(0, languageSlots);
}

/**
 * Builds the full-bleed gradient bars the whole card is set on.
 *
 * Bar widths are normalised across the ranked languages, so the bars always
 * span the whole canvas whether a repository reports one language or five.
 * A repository with no language data falls back to a single accent bar.
 *
 * @param input - Project data and measurement tools.
 * @param options - Label visibility, label typeface, and label position.
 * @param theme - Resolved template colours.
 * @param area - Bounds the bars fill.
 * @param settleAt - Share of the height by which the colour reaches the ground.
 * @returns A rect and a label for every language slot.
 */
function barNodes(
  input: BuildInput,
  options: { showLabels: boolean; monoFamily: string; labelTop: number },
  theme: Theme,
  area: Box,
  settleAt: number,
): SceneNode[] {
  const languages = rankedLanguages(input);
  const total = languages.reduce(
    (sum, language) => sum + language.percentage,
    0,
  );
  const shares = languages.map((language) => language.percentage / total);
  // With no language data the accent still has to cover the canvas.
  const widths = total > 0 ? shares.map((share) => share * area.width) : [];
  let offset = area.x;

  const bars = Array.from(
    { length: languageSlots },
    (_, index): SceneNode[] => {
      const language = languages[index];
      const barWidth = widths[index] ?? 0;
      const barX = offset;
      offset += barWidth;

      return [
        {
          id: `language-bar-${index + 1}`,
          type: 'rect',
          x: barX,
          y: area.y,
          width: barWidth,
          height: area.height,
          fill: {
            kind: 'linear',
            angle: 90,
            stops: [
              { offset: 0, color: barColors[index] },
              { offset: colorHold, color: barColors[index] },
              { offset: 1, color: theme.background },
            ],
          },
          opacity: language ? 1 : 0,
        },
        textNode(`language-label-${index + 1}`, {
          x: barX + spacing.xs,
          y: options.labelTop,
          width: Math.max(0, barWidth - spacing.xs * 2),
          height: 26,
          text: language ? language.name.toUpperCase() : '',
          fontFamily: options.monoFamily,
          fontSize: 15,
          fontWeight: 600,
          color: theme.background,
          overflow: 'clip',
          letterSpacing: 1.8,
          opacity: options.showLabels && language ? 1 : 0,
        }),
      ];
    },
  ).flat();

  return [
    {
      id: 'language-fallback',
      type: 'rect',
      ...area,
      fill: fadeToGround(theme.accent, theme.background, settleAt),
      opacity: total > 0 ? 0 : 1,
    },
    ...bars,
  ];
}

/**
 * Builds a vertical fade from a language colour into the card ground.
 *
 * The colour is held flat across the top, then settles into the background
 * before the readout begins, so the type below never fights the field.
 *
 * @param color - Colour the bar holds at the top of the card.
 * @param ground - Background colour the fade resolves to.
 * @param settleAt - Share of the height by which the fade is complete.
 * @returns A vertical linear fill.
 */
function fadeToGround(color: string, ground: string, settleAt: number): Fill {
  return {
    kind: 'linear',
    angle: 90,
    stops: [
      { offset: 0, color },
      { offset: settleAt * colorHold, color },
      { offset: settleAt, color: ground },
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

/** Bundled template that turns the language split into a gradient field. */
const spectrumTemplate: Template = {
  id: 'spectrum',
  name: 'Spectrum',
  description: 'A full-bleed gradient field sized by language, set with type.',
  category: 'developer',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { spectrumTemplate };
