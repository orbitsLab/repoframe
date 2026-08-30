import { inset } from '@/lib/templates/shared/layout';
import {
  metricBandNodes,
  metricOptions,
  metricPaths,
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
  autoColor,
  bandScale,
  displayFontOptions,
  mutedInk,
  ratioSizes,
  resolveInk,
  spacing,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type {
  BuildInput,
  ColorPreset,
  SettingField,
  Template,
} from '@/types/template';

/** Upper bound on repeated lines, so node ids stay stable across ratios. */
const lineSlots = 16;

/** Fewest repeats that still read as a wall of type. */
const minimumLines = 3;

/** Tight stacking so the repeats touch the way a printed marquee does. */
const marqueeLineHeight = 0.86;

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'align',
    label: 'Alignment',
    section: 'content',
    type: 'select',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Centre', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
  },
  {
    key: 'backgroundColor',
    label: 'Field colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'accentColor',
    label: 'Ink colour',
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
    key: 'highlightLine',
    label: 'Highlighted repeat',
    section: 'cards',
    type: 'range',
    min: 1,
    max: 8,
    step: 1,
  },
];

/** Colours this template ships with, shared by its default preset. */
const defaultColors = {
  backgroundColor: '#12100e',
  accentColor: '#f2f0eb',
  textColor: autoColor,
};

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  align: 'left',
  ...defaultColors,
  fontFamily: 'Archivo Variable',
  highlightLine: 3,
};

/** Colour palettes offered for this template. */
const colorPresets: ColorPreset[] = [
  {
    id: 'newsprint',
    name: 'Newsprint',
    settings: defaultColors,
  },
  {
    id: 'acid',
    name: 'Acid',
    settings: {
      backgroundColor: '#0f1005',
      accentColor: '#d8f34a',
      textColor: autoColor,
    },
  },
  {
    id: 'signal',
    name: 'Signal',
    settings: {
      backgroundColor: '#f2efe6',
      accentColor: '#e0432a',
      textColor: autoColor,
    },
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    settings: {
      backgroundColor: '#0b1030',
      accentColor: '#96b0ff',
      textColor: autoColor,
    },
  },
  {
    id: 'rust',
    name: 'Rust',
    settings: {
      backgroundColor: '#1a0f0a',
      accentColor: '#e2703a',
      textColor: autoColor,
    },
  },
];

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  paths.push(...metricPaths(metrics));

  return paths;
}

function build(input: BuildInput): Scene {
  const settings = mergeSettings(defaultSettings, input.settings);
  const { width, height } = ratioSizes[input.ratio];
  const isWide = width / height > 1.35;
  // A marquee commits to two flat colours; one repeat is knocked back out.
  const field = stringSetting(settings, 'backgroundColor');
  const ink = stringSetting(settings, 'accentColor');
  // A chosen text colour drives the type; the footer rule stays on the ink.
  const type = resolveInk(stringSetting(settings, 'textColor'), ink);
  const fontFamily = stringSetting(settings, 'fontFamily');
  const align = stringSetting(settings, 'align') as 'left' | 'center' | 'right';
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 48 : 64);
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.sm : spacing.md) * scale;

  const bodySize = (isWide ? 21 : 25) * Math.min(1.25, scale);
  const bodyLineHeight = 1.4;
  const descriptionLines = isWide ? 1 : 2;
  const metricBandHeight = (isWide ? 82 : 100) * scale;
  const footerHeight =
    bodySize * bodyLineHeight * descriptionLines +
    gutter * 2 +
    metricBandHeight;
  const footerTop = frame.y + frame.height - footerHeight;

  const repeats = repeatLayout(
    input,
    fontFamily,
    frame.width,
    Math.max(0, footerTop - gutter - frame.y),
  );
  const highlighted =
    (numberSetting(settings, 'highlightLine') - 1) % repeats.lines;
  const text = input.data.repository.name.toUpperCase();

  const nodes: SceneNode[] = [
    ...Array.from({ length: lineSlots }, (_, index): SceneNode => {
      const shown = index < repeats.lines;

      return textNode(`marquee-line-${index + 1}`, {
        x: frame.x,
        // Hidden repeats park on the last visible line so ids never move.
        y: frame.y + Math.min(index, repeats.lines - 1) * repeats.step,
        width: frame.width,
        height: repeats.step,
        text,
        fontFamily,
        fontSize: repeats.fontSize,
        fontWeight: 800,
        color: type,
        align,
        lineHeight: marqueeLineHeight,
        overflow: 'clip',
        letterSpacing: -3,
        opacity: shown ? (index === highlighted ? mutedInk : 1) : 0,
      });
    }),
    {
      id: 'footer-rule',
      type: 'rect',
      x: frame.x,
      y: footerTop,
      width: frame.width,
      height: 3,
      fill: { kind: 'solid', color: ink },
    },
    textNode('repo-description', {
      x: frame.x,
      y: footerTop + gutter,
      width: frame.width * (isWide ? 0.62 : 1),
      height: bodySize * bodyLineHeight * descriptionLines,
      text: `@${input.data.owner.login} — ${
        input.data.repository.description ||
        `Open-source software by ${input.data.owner.login}.`
      }`,
      fontFamily,
      fontSize: bodySize,
      fontWeight: 500,
      color: type,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
      opacity: mutedInk,
    }),
    ...metricBandNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      fontFamily,
      type,
      {
        x: frame.x,
        y:
          footerTop + gutter * 2 + bodySize * bodyLineHeight * descriptionLines,
        width: frame.width,
        height: metricBandHeight,
      },
    ),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: field },
    nodes,
  };
}

/**
 * Chooses how many times the name repeats and how large each repeat is.
 *
 * The size that fills the width sets the natural repeat count, then the size
 * is trimmed so the repeats end exactly on the footer. A taller canvas gains
 * repeats rather than a gap, which is what keeps the sheet full at 9:16.
 *
 * @param input - Project data and measurement tools.
 * @param fontFamily - Display typeface for the repeats.
 * @param maxWidth - Width a single repeat may occupy.
 * @param budget - Height available above the footer.
 * @returns The repeat count, font size, and per-line step.
 */
function repeatLayout(
  input: BuildInput,
  fontFamily: string,
  maxWidth: number,
  budget: number,
) {
  const widest = fitText(input.measure, {
    text: input.data.repository.name.toUpperCase(),
    fontFamily,
    fontWeight: 800,
    maxWidth,
    minSize: 32,
    maxSize: 420,
    maxLines: 1,
    lineHeight: marqueeLineHeight,
    letterSpacing: -3,
  });
  const natural = Math.max(1, widest.fontSize * marqueeLineHeight);
  const lines = Math.max(
    minimumLines,
    Math.min(lineSlots, Math.round(budget / natural)),
  );
  const step = budget / lines;

  return {
    lines,
    step,
    fontSize: Math.min(widest.fontSize, step / marqueeLineHeight),
  };
}

/** Bundled marquee poster that repeats the name until the sheet is full. */
const marqueeTemplate: Template = {
  id: 'marquee',
  name: 'Marquee',
  description: 'The repository name repeated until it fills the whole card.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  colorPresets,
  build,
};

export { marqueeTemplate };
