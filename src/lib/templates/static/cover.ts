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
  bandScale,
  displayFontOptions,
  mutedInk,
  ratioSizes,
  resolveTheme,
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
    label: 'Background colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'accentColor',
    label: 'Wash colour',
    section: 'theme',
    type: 'color',
  },
  {
    key: 'fontFamily',
    label: 'Typeface',
    section: 'typography',
    type: 'select',
    options: displayFontOptions,
  },
  {
    key: 'washStrength',
    label: 'Wash strength',
    section: 'cards',
    type: 'range',
    min: 40,
    max: 100,
    step: 5,
    unit: '%',
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

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  eyebrow: 'OPEN SOURCE',
  backgroundColor: '#0e0e10',
  accentColor: '#2b31e8',
  fontFamily: 'Archivo Variable',
  washStrength: 70,
  avatarRadius: 0,
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
  const theme = resolveTheme(
    stringSetting(settings, 'backgroundColor'),
    stringSetting(settings, 'accentColor'),
  );
  // Type set over the wash has to answer to the accent rather than the page,
  // so its colour is derived as though the accent were the background.
  const overWash = resolveTheme(theme.accent, theme.accent).foreground;
  const fontFamily = stringSetting(settings, 'fontFamily');
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 48 : 64);
  // Bands grow with the canvas so a tall card does not pool its extra height
  // into one gap above the panel.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.sm : spacing.md) * scale;
  const padding = (isWide ? spacing.md : spacing.lg) * Math.min(1.2, scale);

  const eyebrowHeight = 28 * scale;
  const metricBandHeight = (isWide ? 88 : 108) * scale;
  const metricsTop = frame.y + frame.height - metricBandHeight;

  const bodySize = (isWide ? 21 : 25) * Math.min(1.25, scale);
  const bodyLineHeight = 1.4;
  const descriptionLines = isWide ? 2 : 3;
  const description = input.measure(
    input.data.repository.description ||
      `Open-source software by ${input.data.owner.login}.`,
    {
      fontFamily,
      fontSize: bodySize,
      fontWeight: 500,
      maxWidth: frame.width * (isWide ? 0.7 : 1),
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );
  const descriptionY = metricsTop - gutter - description.height;

  // The panel takes every pixel between the eyebrow and the description, and
  // the avatar claims the largest square that fits inside it.
  const panel: Box = {
    x: frame.x,
    y: frame.y + eyebrowHeight + gutter,
    width: frame.width,
    height: Math.max(
      0,
      descriptionY - gutter - (frame.y + eyebrowHeight + gutter),
    ),
  };
  const avatarSize = Math.min(panel.width, panel.height);

  const nameLines = isWide ? 2 : 3;
  const nameLineHeight = 0.94;
  const nameBudget = Math.max(0, panel.height * 0.52 - padding);
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 800,
    maxWidth: Math.max(1, panel.width - padding * 2),
    minSize: 40,
    // Capped so a long single word still fits the panel, since wrapping only
    // counts lines and will happily let one of them run past the edge.
    maxSize: Math.max(
      44,
      Math.min(
        isWide ? 130 : typeScale.display * 1.6,
        nameBudget / nameLines / nameLineHeight,
      ),
    ),
    maxLines: nameLines,
    lineHeight: nameLineHeight,
    letterSpacing: -4,
  });
  const loginHeight = 26 * scale;
  const nameTop = panel.y + panel.height - padding - name.height;

  const nodes: SceneNode[] = [
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.muted,
      letterSpacing: 3,
    }),
    {
      id: 'cover-panel',
      type: 'rect',
      ...panel,
      fill: { kind: 'solid', color: theme.accent },
    },
    {
      id: 'owner-avatar',
      type: 'image',
      // Anchored right so a wide panel sets the portrait against open colour
      // while a tall panel, whose square is the full width, stays centred.
      x: panel.x + panel.width - avatarSize,
      y: panel.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: Math.min(
        numberSetting(settings, 'avatarRadius'),
        avatarSize / 2,
      ),
    },
    {
      id: 'avatar-wash',
      type: 'rect',
      x: panel.x + panel.width - avatarSize,
      y: panel.y,
      width: avatarSize,
      height: avatarSize,
      fill: { kind: 'solid', color: theme.accent },
      opacity: numberSetting(settings, 'washStrength') / 100,
    },
    textNode('owner-login', {
      x: panel.x + padding,
      y: Math.max(panel.y, nameTop - loginHeight),
      width: Math.max(1, panel.width - padding * 2),
      height: loginHeight,
      text: `@${input.data.owner.login}`,
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: overWash,
      letterSpacing: 2,
      opacity: mutedInk,
    }),
    textNode('repo-name', {
      x: panel.x + padding,
      y: nameTop,
      width: Math.max(1, panel.width - padding * 2),
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: overWash,
      lineHeight: name.lineHeight,
      maxLines: name.lines.length,
      overflow: 'clip',
      letterSpacing: -4,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: descriptionY,
      width: frame.width * (isWide ? 0.7 : 1),
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 500,
      color: theme.muted,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
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

/** Bundled portrait poster that washes the owner avatar in a single colour. */
const coverTemplate: Template = {
  id: 'cover',
  name: 'Cover',
  description: 'A washed portrait panel with the name knocked out over it.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { coverTemplate };
