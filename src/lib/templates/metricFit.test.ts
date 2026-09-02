import { describe, expect, it } from 'vitest';

import { templates } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';
import type { SceneNode, TextNode } from '@/types/scene';
import type { AspectRatio, MeasureText, Template } from '@/types/template';

/** A repository whose counts run to six figures, as the popular ones do. */
const project: ProjectData = {
  repository: {
    name: 'linux',
    fullName: 'torvalds/linux',
    url: 'https://github.com/torvalds/linux',
    description: 'Linux kernel source tree',
    defaultBranch: 'master',
    createdAt: '2011-09-04T22:48:12Z',
    updatedAt: '2026-09-02T02:22:22Z',
    pushedAt: '2026-09-01T20:49:36Z',
    isFork: false,
    isArchived: false,
    license: { key: 'other', name: 'Other', spdxId: 'NOASSERTION' },
  },
  owner: {
    login: 'torvalds',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    url: 'https://github.com/torvalds',
    type: 'User',
  },
  metrics: {
    stars: 245_874,
    forks: 64_251,
    watchers: 8392,
    issues: 1208,
    pullRequests: 2249,
  },
  languages: [
    { name: 'C', bytes: 1_451_560_550, percentage: 97.8 },
    { name: 'Assembly', bytes: 9_614_338, percentage: 0.6 },
  ],
  topics: ['kernel', 'linux'],
  contributors: [
    {
      login: 'torvalds',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4',
      url: 'https://github.com/torvalds',
      contributions: 34_567,
    },
  ],
  latestRelease: {
    tagName: 'v6.12',
    name: 'v6.12',
    publishedAt: '2026-04-16T13:54:00Z',
    url: 'https://github.com/torvalds/linux/releases/tag/v6.12',
  },
  fetchedAt: '2026-09-02T02:30:00Z',
};

const measure: MeasureText = (text, style) => {
  const characterWidth = style.fontSize * 0.55;
  const perLine = Math.max(1, Math.floor(style.maxWidth / characterWidth));
  const lines = Array.from(
    text.matchAll(new RegExp(`.{1,${perLine}}`, 'gu')),
  ).map((match) => match[0]);
  const visible = style.maxLines ? lines.slice(0, style.maxLines) : lines;

  return {
    lines: visible.length > 0 ? visible : [''],
    width: Math.min(style.maxWidth, text.length * characterWidth),
    height: Math.max(1, visible.length) * style.fontSize * style.lineHeight,
  };
};

const ratios: AspectRatio[] = ['1:1', '4:5', '16:9', '9:16'];
const allMetrics = ['stars', 'forks', 'watchers', 'issues', 'pullRequests'];

/** Turns on every metric a template offers so the band runs at full density. */
function everyMetric(template: Template): Record<string, unknown> {
  const settings = { ...template.defaultSettings };

  for (const field of template.settingsSchema) {
    if (field.type === 'multi-select' && field.key === 'metrics') {
      settings[field.key] = allMetrics.filter((metric) =>
        field.options.some((option) => option.value === metric),
      );
    }
  }

  return settings;
}

/**
 * Collects every text node drawing a metric figure.
 *
 * The scene carries the whole figure: it is the renderer that cuts it to the
 * node's width, so a fit has to be measured rather than read off the text.
 */
function metricValues(nodes: SceneNode[]): TextNode[] {
  return nodes.flatMap((node) => {
    if (node.type === 'group') {
      return metricValues(node.children);
    }

    // Templates keep every metric in the tree and hide the ones not on show,
    // so a figure only has to fit when it is actually drawn.
    return node.type === 'text' &&
      /(^|-)(metric|hero)-.*value/.test(node.id) &&
      node.opacity !== 0
      ? [node]
      : [];
  });
}

describe('metric figures on a repository with six-figure counts', () => {
  it.each(templates.map((template) => [template.id, template] as const))(
    '%s sets every figure to fit its cell',
    (templateId, template) => {
      for (const ratio of template.supportedRatios) {
        if (!ratios.includes(ratio)) {
          continue;
        }

        const scene = template.build({
          data: project,
          settings: everyMetric(template),
          ratio,
          measure,
        });

        for (const node of metricValues(scene.nodes)) {
          const drawn = measure(node.text, {
            fontFamily: node.fontFamily,
            fontSize: node.fontSize,
            fontWeight: node.fontWeight,
            maxWidth: Number.MAX_SAFE_INTEGER,
            lineHeight: node.lineHeight,
            letterSpacing: node.letterSpacing,
          });

          expect(
            Math.round(drawn.width),
            `${templateId} ${ratio}: ${node.id} sets "${node.text}" wider than its ${Math.round(node.width)}px cell`,
          ).toBeLessThanOrEqual(Math.round(node.width));
        }
      }
    },
  );
});
