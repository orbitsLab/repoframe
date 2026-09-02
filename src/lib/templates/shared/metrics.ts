import { formatCount } from '@/lib/templates/shared/format';
import { type Box, row } from '@/lib/templates/shared/layout';
import { textNode } from '@/lib/templates/shared/nodes';
import {
  stringArraySetting,
  stringSetting,
} from '@/lib/templates/shared/settings';
import { fitCommonSize } from '@/lib/templates/shared/text';
import { mutedInk, spacing, typeScale } from '@/lib/templates/shared/tokens';
import type { ProjectDataPath } from '@/types/data/path';
import type { ProjectData } from '@/types/data/project';
import type { SceneNode } from '@/types/scene';
import type { BuildInput, SettingOption } from '@/types/template';

/** Metrics a template can offer in its visible-content setting. */
const metricOptions: SettingOption[] = [
  { label: 'Stars', value: 'stars' },
  { label: 'Forks', value: 'forks' },
  { label: 'Watchers', value: 'watchers' },
  { label: 'Issues', value: 'issues' },
  { label: 'PRs', value: 'pullRequests' },
];

/**
 * Reads every metric a template can display, keyed by setting value.
 *
 * @param data - Project data the card is built from.
 * @returns Metric counts, undefined where the endpoint was not fetched.
 */
function metricValues(data: ProjectData): Record<string, number | undefined> {
  return {
    stars: data.metrics.stars,
    forks: data.metrics.forks,
    watchers: data.metrics.watchers,
    issues: data.metrics.issues,
    pullRequests: data.metrics.pullRequests,
  };
}

/**
 * Splits the chosen metrics into the headline figure and the smaller readings.
 *
 * The headline never repeats among the readings, and moves to the first metric
 * still chosen when its own option is cleared.
 *
 * @param settings - Resolved template settings.
 * @returns The headline metric and the readings, in the order options are listed.
 */
function splitMetrics(settings: Record<string, unknown>) {
  const chosen = stringArraySetting(settings, 'metrics');
  const ordered = metricOptions
    .map((option) => option.value)
    .filter((value) => chosen.includes(value));
  const requested = stringSetting(settings, 'heroMetric');
  const hero = ordered.includes(requested)
    ? requested
    : (ordered[0] ?? requested);

  return { hero, readings: ordered.filter((value) => value !== hero) };
}

/**
 * Lists the extra data paths a set of visible metrics needs fetching.
 *
 * Stars, forks and watchers arrive with the repository, so only the two
 * counted endpoints add a request.
 *
 * @param metrics - Metric values the template will draw.
 * @returns Paths to append to a template's required data.
 */
function metricPaths(metrics: string[]): ProjectDataPath[] {
  const paths: ProjectDataPath[] = [];

  if (metrics.includes('issues')) {
    paths.push('metrics.issues');
  }

  if (metrics.includes('pullRequests')) {
    paths.push('metrics.pullRequests');
  }

  return paths;
}

/**
 * Builds an evenly divided band of metric figures with a label under each.
 *
 * Visible metrics share the band; hidden ones stay in the tree at zero opacity
 * so node ids hold still as the selection changes.
 *
 * @param input - Build input carrying project data.
 * @param visibleMetrics - Metric values to show, in display order.
 * @param fontFamily - Typeface for both the figure and its label.
 * @param color - Ink for both the figure and its label.
 * @param area - Bounds the band fills.
 * @returns Value and label nodes for every metric the template offers.
 */
function metricBandNodes(
  input: BuildInput,
  visibleMetrics: string[],
  fontFamily: string,
  color: string,
  area: Box,
): SceneNode[] {
  const values = metricValues(input.data);
  const columns = Math.max(1, visibleMetrics.length);
  const cells = row(area, columns, spacing.md);
  const valueSize = fitCommonSize(input.measure, {
    texts: visibleMetrics.map((metric) => formatCount(values[metric])),
    fontFamily,
    fontWeight: 800,
    letterSpacing: -1.5,
    maxWidth: cells[0].width,
    maxSize: Math.min(area.height * 0.56, area.width / columns / 3),
  });

  return metricOptions.flatMap((metric): SceneNode[] => {
    const visibleIndex = visibleMetrics.indexOf(metric.value);
    const cell = cells[Math.max(0, visibleIndex)];
    const shown = visibleIndex >= 0;

    return [
      textNode(`metric-${metric.value}-value`, {
        ...cell,
        height: valueSize * 1.12,
        text: formatCount(values[metric.value]),
        fontFamily,
        fontSize: valueSize,
        fontWeight: 800,
        color,
        letterSpacing: -1.5,
        opacity: shown ? 1 : 0,
      }),
      textNode(`metric-${metric.value}-label`, {
        ...cell,
        y: cell.y + valueSize * 1.12 + 2,
        height: 24,
        text: metric.label.toUpperCase(),
        fontFamily,
        fontSize: typeScale.eyebrow * 0.8,
        fontWeight: 700,
        color,
        letterSpacing: 2,
        opacity: shown ? mutedInk : 0,
      }),
    ];
  });
}

export {
  metricBandNodes,
  metricOptions,
  metricPaths,
  metricValues,
  splitMetrics,
};
