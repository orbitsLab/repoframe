import { formatCount } from '@/lib/templates/shared/format';
import { inset } from '@/lib/templates/shared/layout';
import { textNode } from '@/lib/templates/shared/nodes';
import {
  booleanSetting,
  mergeSettings,
  numberSetting,
  stringArraySetting,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitFontSize } from '@/lib/templates/shared/text';
import {
  monoFontOptions,
  palettes,
  ratioSizes,
  spacing,
  typeScale,
} from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { Scene, SceneNode } from '@/types/scene';
import type { BuildInput, SettingField, Template } from '@/types/template';

const metricOptions = [
  { label: 'stars', value: 'stars' },
  { label: 'forks', value: 'forks' },
  { label: 'watchers', value: 'watchers' },
  { label: 'issues', value: 'issues' },
  { label: 'pull requests', value: 'pullRequests' },
];

const languageColors = ['#7ee787', '#58a6ff', '#d2a8ff', '#ffa657', '#f778ba'];

const settingsSchema: SettingField[] = [
  {
    key: 'metrics',
    label: 'Visible metrics',
    section: 'content',
    type: 'multi-select',
    options: metricOptions.map((metric) => ({
      label: metric.label,
      value: metric.value,
    })),
  },
  {
    key: 'showLanguages',
    label: 'Show languages',
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

  if (metrics.includes('issues')) {
    paths.push('metrics.issues');
  }

  if (metrics.includes('pullRequests')) {
    paths.push('metrics.pullRequests');
  }

  return paths;
}

function build(input: BuildInput): Scene {
  const settings = mergeSettings(defaultSettings, input.settings);
  const { width, height } = ratioSizes[input.ratio];
  const isWide = width / height > 1.35;
  const frame = inset({ x: 0, y: 0, width, height }, isWide ? 52 : 64);
  const content = inset(frame, spacing.lg);
  const fontFamily = stringSetting(settings, 'fontFamily');
  const accentColor = stringSetting(settings, 'accentColor');
  const nameSize = fitFontSize(input.measure, {
    text: input.data.repository.fullName,
    fontFamily,
    fontWeight: 700,
    maxWidth: content.width,
    minSize: 34,
    maxSize: isWide ? 64 : 72,
  });
  const description =
    input.data.repository.description || 'No repository description provided.';
  const measuredDescription = input.measure(description, {
    fontFamily,
    fontSize: isWide ? 24 : 28,
    fontWeight: 400,
    maxWidth: content.width,
    lineHeight: 1.5,
    maxLines: isWide ? 2 : 5,
  });
  const detailsY = content.y + 118 + nameSize + measuredDescription.height;
  const languageY = frame.y + frame.height - (isWide ? 98 : 136);
  const nodes: SceneNode[] = [
    {
      id: 'terminal-window',
      type: 'rect',
      ...frame,
      fill: { kind: 'solid', color: palettes.terminal.surface },
      cornerRadius: numberSetting(settings, 'windowRadius'),
      stroke: { color: palettes.terminal.border, width: 2 },
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
      height: 72,
      fill: { kind: 'solid', color: '#1b2028' },
      cornerRadius: numberSetting(settings, 'windowRadius'),
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
      color: palettes.terminal.muted,
      align: 'center',
    }),
    textNode('command', {
      x: content.x,
      y: content.y + 56,
      width: content.width,
      height: 36,
      text: stringSetting(settings, 'prompt'),
      fontFamily,
      fontSize: typeScale.label,
      fontWeight: 500,
      color: accentColor,
    }),
    textNode('repo-name', {
      x: content.x,
      y: content.y + 108,
      width: content.width,
      height: nameSize * 1.1,
      text: input.data.repository.fullName,
      fontFamily,
      fontSize: nameSize,
      fontWeight: 700,
      color: palettes.terminal.foreground,
    }),
    textNode('repo-description', {
      x: content.x,
      y: content.y + 124 + nameSize,
      width: content.width,
      height: measuredDescription.height,
      text: measuredDescription.lines.join('\n'),
      fontFamily,
      fontSize: isWide ? 24 : 28,
      fontWeight: 400,
      color: palettes.terminal.muted,
      lineHeight: 1.5,
      maxLines: isWide ? 2 : 5,
    }),
    ...metricNodes(input, settings, fontFamily, detailsY, content),
    ...languageNodes(input, settings, fontFamily, languageY, content),
  ];

  return {
    width,
    height,
    background: {
      kind: 'solid',
      color: stringSetting(settings, 'backgroundColor'),
    },
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
  settings: Record<string, unknown>,
  fontFamily: string,
  y: number,
  content: { x: number; width: number },
) {
  const visibleMetrics = stringArraySetting(settings, 'metrics');
  const values: Record<string, number | undefined> = {
    stars: input.data.metrics.stars,
    forks: input.data.metrics.forks,
    watchers: input.data.metrics.watchers,
    issues: input.data.metrics.issues,
    pullRequests: input.data.metrics.pullRequests,
  };

  return metricOptions.map((metric) => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    return textNode(`metric-${metric.value}`, {
      x: content.x,
      y: y + Math.max(0, visibleIndex) * 42,
      width: content.width,
      height: 34,
      text: `${metric.label.padEnd(16, '.')} ${formatCount(values[metric.value])}`,
      fontFamily,
      fontSize: 23,
      fontWeight: 500,
      color: palettes.terminal.foreground,
      opacity: visibleIndex >= 0 ? 1 : 0,
    });
  });
}

function languageNodes(
  input: BuildInput,
  settings: Record<string, unknown>,
  fontFamily: string,
  y: number,
  content: { x: number; width: number },
) {
  const visible = booleanSetting(settings, 'showLanguages');
  const languages = input.data.languages.slice(0, 5);
  const nodes: SceneNode[] = [
    textNode('languages-heading', {
      x: content.x,
      y,
      width: content.width,
      height: 30,
      text: 'languages',
      fontFamily,
      fontSize: 20,
      fontWeight: 600,
      color: palettes.terminal.muted,
      opacity: visible ? 1 : 0,
    }),
    {
      id: 'languages-track',
      type: 'rect',
      x: content.x,
      y: y + 42,
      width: content.width,
      height: 18,
      fill: { kind: 'solid', color: palettes.terminal.border },
      cornerRadius: 9,
      opacity: visible ? 1 : 0,
    },
  ];
  let offset = 0;

  for (let index = 0; index < 5; index += 1) {
    const language = languages[index];
    const segmentWidth = language
      ? content.width * (language.percentage / 100)
      : 0;
    nodes.push({
      id: `language-segment-${index + 1}`,
      type: 'rect',
      x: content.x + offset,
      y: y + 42,
      width: segmentWidth,
      height: 18,
      fill: { kind: 'solid', color: languageColors[index] },
      cornerRadius: 9,
      opacity: visible ? 1 : 0,
    });
    offset += segmentWidth;

    if (index < 3) {
      nodes.push(
        textNode(`language-label-${index + 1}`, {
          x: content.x + index * (content.width / 3),
          y: y + 74,
          width: content.width / 3,
          height: 30,
          text: language
            ? `${language.name} ${Math.round(language.percentage)}%`
            : '',
          fontFamily,
          fontSize: 18,
          fontWeight: 500,
          color: palettes.terminal.muted,
          opacity: visible ? 1 : 0,
        }),
      );
    }
  }

  return nodes;
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
