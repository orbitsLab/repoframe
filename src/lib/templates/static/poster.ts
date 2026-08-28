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
  palettes,
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
    key: 'showTopics',
    label: 'Topic strip',
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
    key: 'borderWidth',
    label: 'Keyline weight',
    section: 'cards',
    type: 'range',
    min: 0,
    max: 16,
    step: 2,
    unit: 'px',
  },
];

const defaultSettings: Record<string, unknown> = {
  metrics: ['stars', 'forks', 'issues'],
  showTopics: true,
  eyebrow: 'OPEN SOURCE',
  backgroundColor: palettes.poster.background,
  accentColor: palettes.poster.foreground,
  textColor: autoColor,
  fontFamily: 'Archivo Variable',
  borderWidth: 8,
};

function requiredData(settings: Record<string, unknown>) {
  const resolved = mergeSettings(defaultSettings, settings);
  const metrics = stringArraySetting(resolved, 'metrics');
  const paths: ProjectDataPath[] = ['repository'];

  if (booleanSetting(resolved, 'showTopics')) {
    paths.push('topics');
  }

  paths.push(...metricPaths(metrics));

  return paths;
}

function build(input: BuildInput): Scene {
  const settings = mergeSettings(defaultSettings, input.settings);
  const { width, height } = ratioSizes[input.ratio];
  const isWide = width / height > 1.35;
  // A poster commits to two flat colours rather than a derived surface ramp.
  const field = stringSetting(settings, 'backgroundColor');
  const ink = stringSetting(settings, 'accentColor');
  // A chosen text colour drives the type; keylines and bars stay on the ink.
  const type = resolveInk(stringSetting(settings, 'textColor'), ink);
  const fontFamily = stringSetting(settings, 'fontFamily');
  const border = numberSetting(settings, 'borderWidth');
  const outer = inset({ x: 0, y: 0, width, height }, isWide ? 40 : 56);
  const frame = inset(outer, border + (isWide ? 32 : 44));
  // Bands grow with the canvas so a tall poster does not pool its extra
  // height into one gap under the eyebrow.
  const scale = bandScale(height);
  const gutter = (isWide ? spacing.md : spacing.lg) * scale;
  const showTopics = booleanSetting(settings, 'showTopics');

  const marqueeHeight = showTopics ? (isWide ? 62 : 74) * scale : 0;
  const marqueeTop = frame.y + frame.height - marqueeHeight;
  const metricBandHeight = (isWide ? 94 : 110) * scale;
  const metricsTop = marqueeTop - (showTopics ? gutter : 0) - metricBandHeight;

  const eyebrowHeight = 28 * scale;
  const contentTop = frame.y + eyebrowHeight + gutter;
  const textBudget = Math.max(0, metricsTop - gutter - contentTop);
  const bodySize = isWide ? 24 : 28;
  const bodyLineHeight = 1.4;
  const nameLineHeight = 1;
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
    minSize: 44,
    maxSize: Math.max(
      48,
      Math.min(
        isWide ? 108 : typeScale.display * 2,
        nameBudget / 3 / nameLineHeight,
      ),
    ),
    maxLines: 3,
    lineHeight: nameLineHeight,
    letterSpacing: -3,
  });
  const descriptionLines = Math.max(
    1,
    Math.min(
      2,
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
      fontWeight: 500,
      maxWidth: frame.width,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
    },
  );
  // Slack is split into three equal gaps — under the eyebrow, between the
  // name and the description, and above the rule — so a tall poster never
  // opens one large hole.
  const slack = Math.max(
    0,
    (textBudget - name.height - description.height) / 3,
  );
  const blockTop = contentTop + slack;
  const topics = input.data.topics.slice(0, 6);
  const marqueeText =
    topics.length > 0 ? topics.join('  /  ') : `@${input.data.owner.login}`;

  const nodes: SceneNode[] = [
    ...keylineNodes(ink, outer, border),
    textNode('eyebrow', {
      x: frame.x,
      y: frame.y,
      width: frame.width * 0.5,
      height: eyebrowHeight,
      text: stringSetting(settings, 'eyebrow'),
      fontFamily,
      fontSize: typeScale.eyebrow,
      fontWeight: 700,
      color: type,
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
      color: type,
      align: 'right',
      letterSpacing: 1.4,
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
      color: type,
      lineHeight: name.lineHeight,
      maxLines: 3,
      letterSpacing: -3,
    }),
    textNode('repo-description', {
      x: frame.x,
      y: blockTop + name.height + slack,
      width: frame.width,
      height: description.height,
      text: description.lines.join('\n'),
      fontFamily,
      fontSize: bodySize,
      fontWeight: 500,
      color: type,
      lineHeight: bodyLineHeight,
      maxLines: descriptionLines,
      opacity: mutedInk,
    }),
    {
      id: 'metrics-rule',
      type: 'rect',
      x: frame.x,
      y: metricsTop,
      width: frame.width,
      height: 3,
      fill: { kind: 'solid', color: ink },
    },
    ...metricBandNodes(
      input,
      stringArraySetting(settings, 'metrics'),
      fontFamily,
      type,
      {
        x: frame.x,
        y: metricsTop + spacing.sm * scale,
        width: frame.width,
        height: Math.max(0, metricBandHeight - spacing.sm * scale),
      },
    ),
    {
      id: 'topic-marquee',
      type: 'rect',
      x: frame.x,
      y: marqueeTop,
      width: frame.width,
      height: marqueeHeight,
      fill: { kind: 'solid', color: ink },
      opacity: showTopics ? 1 : 0,
    },
    textNode('topic-marquee-label', {
      x: frame.x + spacing.sm,
      y: marqueeTop + (marqueeHeight - 26 * scale) / 2,
      width: Math.max(0, frame.width - spacing.sm * 2),
      height: 26 * scale,
      text: marqueeText.toUpperCase(),
      fontFamily,
      fontSize: (isWide ? 19 : 21) * Math.min(1.3, scale),
      fontWeight: 700,
      color: field,
      align: 'center',
      letterSpacing: 2.4,
      opacity: showTopics ? 1 : 0,
    }),
  ];

  return {
    width,
    height,
    background: { kind: 'solid', color: field },
    nodes,
  };
}

/** Builds the heavy keyline drawn along each edge of the poster field. */
function keylineNodes(ink: string, outer: Box, weight: number): SceneNode[] {
  const edges = [
    {
      id: 'keyline-top',
      x: outer.x,
      y: outer.y,
      width: outer.width,
      height: weight,
    },
    {
      id: 'keyline-bottom',
      x: outer.x,
      y: outer.y + outer.height - weight,
      width: outer.width,
      height: weight,
    },
    {
      id: 'keyline-left',
      x: outer.x,
      y: outer.y,
      width: weight,
      height: outer.height,
    },
    {
      id: 'keyline-right',
      x: outer.x + outer.width - weight,
      y: outer.y,
      width: weight,
      height: outer.height,
    },
  ];

  return edges.map(
    (edge): SceneNode => ({
      ...edge,
      type: 'rect',
      fill: { kind: 'solid', color: ink },
    }),
  );
}

/** Bundled flat-colour poster template with hard edges and oversized type. */
const posterTemplate: Template = {
  id: 'poster',
  name: 'Poster',
  description: 'A flat-colour poster with a heavy keyline and a topic strip.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData,
  settingsSchema,
  defaultSettings,
  build,
};

export { posterTemplate };
