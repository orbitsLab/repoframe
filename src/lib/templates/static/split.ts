import { type Box, inset } from '@/lib/templates/shared/layout';
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
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
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
    key: 'seamPosition',
    label: 'Seam position',
    section: 'cards',
    type: 'range',
    min: 30,
    max: 70,
    step: 5,
    unit: '%',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  eyebrow: 'OPEN SOURCE',
  backgroundColor: '#f0ece3',
  accentColor: '#e0432a',
  textColor: autoColor,
  fontFamily: 'Archivo Variable',
  seamPosition: 55,
};

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
  // A split poster commits to two flat colours that trade places at the seam.
  const field = stringSetting(settings, 'backgroundColor');
  const ink = stringSetting(settings, 'accentColor');
  // A chosen text colour drives the type on the field; type crossing onto the
  // ink panel stays on the field colour so the seam keeps its contrast.
  const type = resolveInk(stringSetting(settings, 'textColor'), ink);
  const fontFamily = stringSetting(settings, 'fontFamily');
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 56 : 76);
  // Bands grow with the canvas so a tall card does not pool its extra height
  // into one gap above the seam.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.md : spacing.lg) * scale;
  const seamY = height * (numberSetting(settings, 'seamPosition') / 100);
  /** Reads the legible text colour for a block on either side of the seam. */
  const inkAt = (y: number) => (y < seamY ? type : field);

  const eyebrowHeight = 28 * scale;
  const contentTop = frame.y + eyebrowHeight + gutter;
  const metricBandHeight = (isWide ? 92 : 112) * scale;
  const metricsTop = frame.y + frame.height - metricBandHeight;

  const bodySize = (isWide ? 22 : 26) * Math.min(1.25, scale);
  const bodyLineHeight = 1.4;
  const descriptionLines = isWide ? 2 : 3;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 500,
      maxWidth: frame.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );

  const nameLines = isWide ? 2 : 3;
  const nameLineHeight = 0.95;
  // The name takes every pixel the eyebrow, description and metrics leave.
  const nameBudget = Math.max(
    0,
    metricsTop - gutter * 2 - contentTop - description.height,
  );
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 800,
    maxWidth: frame.width,
    minSize: 44,
    // Capped so a long single word still fits the frame, since wrapping only
    // counts lines and will happily let one of them run past the edge.
    maxSize: Math.max(
      48,
      Math.min(
        isWide ? 120 : typeScale.display * 1.5,
        nameBudget / nameLines / nameLineHeight,
      ),
    ),
    maxLines: nameLines,
    lineHeight: nameLineHeight,
    letterSpacing: -4,
  });
  // The name is centred on the seam so the colour flip lands mid-word, then
  // held clear of the description above it and the metrics below it.
  const nameTop = Math.min(
    Math.max(contentTop + description.height + gutter, seamY - name.height / 2),
    Math.max(contentTop, metricsTop - gutter - name.height),
  );
  const descriptionY =
    contentTop +
    Math.max(0, (nameTop - gutter - contentTop - description.height) / 2);

  const nodes: SceneNode[] = [
    {
      id: 'seam-panel',
      type: 'rect',
      x: 0,
      y: seamY,
      width,
      height: Math.max(0, height - seamY),
      fill: { kind: 'solid', color: ink },
    },
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: frame.width * 0.5,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: inkAt(frame.y),
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
      fontWeight: 700,
      color: inkAt(frame.y),
      align: 'right',
      letterSpacing: 1.4,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: frame.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 500,
      color: inkAt(descriptionY + description.height / 2),
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
      opacity: mutedInk,
    }),
    ...nameNodes(
      name,
      seamY,
      { field, ink: type, fontFamily },
      {
        x: frame.x,
        y: nameTop,
        width: frame.width,
        height: name.height,
      },
    ),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: frame.x,
      y: metricsTop,
      width: frame.width,
      height: 3,
      fill: { kind: 'solid', color: inkAt(metricsTop) },
    },
    ...metricBandNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      fontFamily,
      inkAt(metricsTop),
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
    background: { kind: 'solid', color: field },
    nodes,
  };
}

/**
 * Draws the repository name once per side of the seam.
 *
 * Both halves carry the whole name at the same position and are clipped to
 * their own side, so a single word changes colour where the seam crosses it.
 *
 * @param name - Fitted name lines and their bounds.
 * @param seamY - Canvas position of the colour seam.
 * @param colors - Field and ink colours plus the display typeface.
 * @param area - Bounds the full name occupies.
 * @returns The two clipped halves of the name.
 */
function nameNodes(
  name: ReturnType<typeof fitText>,
  seamY: number,
  colors: { field: string; ink: string; fontFamily: string },
  area: Box,
): SceneNode[] {
  // Clamping keeps both halves inside the name band, so a seam that misses
  // the name leaves one half empty rather than out of order.
  const cut = Math.min(Math.max(seamY, area.y), area.y + area.height);
  const halves = [
    { id: 'repo-name-top', y: area.y, height: cut - area.y, color: colors.ink },
    {
      id: 'repo-name-bottom',
      y: cut,
      height: area.y + area.height - cut,
      color: colors.field,
    },
  ];

  return halves.map(
    (half): SceneNode => ({
      id: half.id,
      type: 'group',
      x: area.x,
      y: half.y,
      width: area.width,
      height: half.height,
      children: [
        textNode(`${half.id}-text`, {
          x: 0,
          y: area.y - half.y,
          width: area.width,
          height: area.height,
          text: name.lines.join('\n'),
          fontFamily: colors.fontFamily,
          fontSize: name.fontSize,
          fontWeight: 800,
          color: half.color,
          lineHeight: name.lineHeight,
          maxLines: name.lines.length,
          letterSpacing: -4,
        }),
      ],
    }),
  );
}

/** Bundled two-colour poster whose name changes colour across a hard seam. */
const splitTemplate: Template = {
  id: 'split',
  name: 'Split',
  description: 'A hard two-colour seam with the name knocked out across it.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { splitTemplate };
