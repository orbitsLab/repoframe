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

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible content',
    section: 'content',
    type: 'multi-select',
    options: metricOptions,
  },
  {
    key: 'showAvatar',
    label: 'Owner avatar',
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
    key: 'cardRadius',
    label: 'Footer radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 48,
    step: 4,
    unit: 'px',
  },
  {
    key: 'avatarRadius',
    label: 'Avatar radius',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 72,
    step: 8,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showAvatar: true,
  eyebrow: 'NOW ON GITHUB',
  backgroundColor: '#141026',
  accentColor: '#a78bfa',
  textColor: autoColor,
  fontFamily: 'Sora Variable',
  cardRadius: 28,
  avatarRadius: 72,
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
    stringSetting(settings, 'textColor'),
  );
  const fontFamily = stringSetting(settings, 'fontFamily');
  // Story margins are proportional so the card keeps clear of the chrome
  // that social apps overlay on a full-height canvas.
  const sideInset = width * (isWide ? 0.07 : 0.09);
  const topInset = height * (isWide ? 0.1 : 0.08);
  const bottomInset = height * (isWide ? 0.1 : 0.09);
  const frame: Box = {
    x: sideInset,
    y: topInset,
    width: width - sideInset * 2,
    height: height - topInset - bottomInset,
  };
  // Bands grow with the canvas so a tall story does not pool its extra
  // height into one gap above the footer.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.md : spacing.lg) * scale;

  const avatarSize = (isWide ? 84 : 132) * scale;
  const eyebrowHeight = 28 * scale;
  const eyebrowY = frame.y + avatarSize + spacing.md * scale;
  const footerHeight = (isWide ? 108 : 136) * scale;
  const footerTop = frame.y + frame.height - footerHeight;

  const textTop = eyebrowY + eyebrowHeight + gutter;
  const textBudget = Math.max(0, footerTop - gutter - textTop);
  const bodySize = (isWide ? 24 : 30) * Math.min(1.2, scale);
  const bodyLineHeight = 1.45;
  const nameLineHeight = 1.05;
  const nameLines = isWide ? 2 : 3;
  // The name may only grow into space the description does not need.
  const nameBudget = Math.max(
    0,
    textBudget - bodySize * bodyLineHeight * 2 - spacing.md,
  );
  const name = fitText(input.measure, {
    text: input.data.repository.name,
    fontFamily,
    fontWeight: 800,
    maxWidth: frame.width,
    minSize: 40,
    maxSize: Math.max(
      44,
      Math.min(
        isWide ? 88 : typeScale.display * 1.7,
        nameBudget / nameLines / nameLineHeight,
      ),
    ),
    maxLines: nameLines,
    lineHeight: nameLineHeight,
  });
  const descriptionLines = Math.max(
    1,
    Math.min(
      3,
      Math.floor(
        (textBudget - name.height - spacing.md) / (bodySize * bodyLineHeight),
      ),
    ),
  );
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
  // The title block is centred in its region so a tall canvas does not open
  // a hole between the description and the footer.
  const stackHeight = name.height + spacing.md + description.height;
  const blockTop = textTop + Math.max(0, (textBudget - stackHeight) / 2);

  const nodes: SceneNode[] = [
    {
      id: 'owner-avatar',
      type: 'image',
      x: frame.x + (frame.width - avatarSize) / 2,
      y: frame.y,
      width: avatarSize,
      height: avatarSize,
      src: input.data.owner.avatarUrl,
      fit: 'cover',
      cornerRadius: Math.min(
        numberSetting(settings, 'avatarRadius'),
        avatarSize / 2,
      ),
      opacity: booleanSetting(settings, 'showAvatar') ? 1 : 0,
    },
    textNode('eyebrow', {
      x: frame.x,
      y: eyebrowY,
      width: frame.width,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: theme.accent,
      align: 'center',
      letterSpacing: 3,
    }),
    textNode('repo-name', {
      x: frame.x,
      y: blockTop,
      width: frame.width,
      height: name.height,
      text: name.lines.join('\n'),
      fontFamily,
      fontSize: name.fontSize,
      fontWeight: 800,
      color: theme.foreground,
      align: 'center',
      lineHeight: name.lineHeight,
      maxLines: nameLines,
      letterSpacing: -2,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: blockTop + name.height + spacing.md,
      width: frame.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 400,
      color: theme.muted,
      align: 'center',
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    }),
    {
      id: 'footer-panel',
      type: 'rect',
      x: frame.x,
      y: footerTop,
      width: frame.width,
      height: footerHeight,
      fill: { kind: 'solid', color: theme.surface },
      cornerRadius: numberSetting(settings, 'cardRadius'),
      stroke: { color: theme.border, width: 1 },
    },
    ...metricNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      fontFamily,
      theme,
      inset(
        {
          x: frame.x,
          y: footerTop,
          width: frame.width,
          height: footerHeight,
        },
        (isWide ? 20 : 26) * scale,
      ),
    ),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: theme.background },
    nodes,
  };
}

/** Builds the metric readout carried inside the story footer panel. */
function metricNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  theme: Theme,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  // Visible metrics share the panel; hidden ones stay in the tree at zero opacity.
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.sm);
  const valueSize = Math.min(area.height * 0.55, area.width / columns / 3);

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const opacity = visibleIndex >= 0 ? 1 : 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        ...cell,
        height: valueSize * 1.15,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: valueSize,
        fontWeight: 800,
        color: theme.foreground,
        align: 'center',
        letterSpacing: -1,
        opacity,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...cell,
        y: cell.y + valueSize * 1.15 + 2,
        height: 22,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: 15,
        fontWeight: 600,
        color: theme.muted,
        align: 'center',
        letterSpacing: 1.8,
        opacity,
      }),
    ];
  });
}

/** Bundled portrait-first story template with a pinned metric footer. */
const storyTemplate: Template = {
  id: 'story',
  name: 'Story',
  description: 'A portrait-first card with safe margins and a metric footer.',
  category: 'editorial',
  supportedRatios: ['9:16', '4:5', '1:1', '16:9'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { storyTemplate };
