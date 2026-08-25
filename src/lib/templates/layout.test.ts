import { describe, expect, it } from 'vitest';

import { getTemplate } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';
import type { Scene, SceneNode } from '@/types/scene';
import type { AspectRatio, MeasureText, Template } from '@/types/template';

const project: ProjectData = {
  repository: {
    name: 'alfa-leetcode-api',
    fullName: 'alfaarghya/alfa-leetcode-api',
    url: 'https://github.com/alfaarghya/alfa-leetcode-api',
    description:
      'A custom LeetCode API for profiles, problems, contests, submissions, and daily questions.',
    defaultBranch: 'main',
    createdAt: '2024-01-21T13:58:56Z',
    updatedAt: '2026-08-23T11:30:00Z',
    pushedAt: '2026-08-02T17:56:24Z',
    isFork: false,
    isArchived: false,
    license: { key: 'mit', name: 'MIT License', spdxId: 'MIT' },
  },
  owner: {
    login: 'alfaarghya',
    avatarUrl: 'https://avatars.githubusercontent.com/alfaarghya',
    url: 'https://github.com/alfaarghya',
    type: 'User',
  },
  metrics: { stars: 815, forks: 327, watchers: 1, issues: 11, pullRequests: 2 },
  languages: [
    { name: 'TypeScript', bytes: 226_495, percentage: 99.8 },
    { name: 'Dockerfile', bytes: 440, percentage: 0.2 },
  ],
  topics: ['api', 'leetcode-api', 'typescript', 'rest-api'],
  contributors: [
    {
      login: 'alfaarghya',
      avatarUrl: 'https://avatars.githubusercontent.com/alfaarghya',
      url: 'https://github.com/alfaarghya',
      contributions: 140,
    },
  ],
  latestRelease: {
    tagName: 'v2.0.4',
    name: 'v2.0.4',
    publishedAt: '2026-04-16T13:54:00Z',
    url: 'https://github.com/alfaarghya/alfa-leetcode-api/releases/tag/v2.0.4',
  },
  fetchedAt: '2026-08-23T12:00:00Z',
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

/** Blocks that must stay in order, top to bottom, without overlapping. */
const stacks: Record<string, string[]> = {
  minimal: ['eyebrow', 'repo-name', 'repo-description', 'metrics-rule'],
  terminal: [
    'command',
    'repo-name',
    'repo-description',
    'metric-stars',
    'languages-heading',
  ],
  bento: ['repo-name', 'repo-description'],
  badge: ['owner-login', 'repo-name', 'repo-description', 'metric-stars-pill'],
  showcase: ['repo-name', 'owner-login', 'repo-description', 'topic-pill-1'],
  release: ['eyebrow', 'release-tag', 'release-subtitle', 'footer-rule'],
};

const ratios: AspectRatio[] = ['1:1', '4:5', '16:9', '9:16'];

const allMetrics = ['stars', 'forks', 'watchers', 'issues', 'pullRequests'];

/** Turns on every toggle a template exposes so the layout runs at full density. */
function maximalSettings(template: Template): Record<string, unknown> {
  const settings = { ...template.defaultSettings };

  for (const field of template.settingsSchema) {
    if (field.type === 'toggle') {
      settings[field.key] = true;
    }

    if (field.type === 'multi-select' && field.key === 'metrics') {
      settings[field.key] = allMetrics.filter((metric) =>
        field.options.some((option) => option.value === metric),
      );
    }
  }

  return settings;
}

/** Turns off every toggle a template exposes so hidden blocks are exercised. */
function minimalSettings(template: Template): Record<string, unknown> {
  const settings = { ...template.defaultSettings };

  for (const field of template.settingsSchema) {
    if (field.type === 'toggle') {
      settings[field.key] = false;
    }
  }

  return settings;
}

describe('template block flow', () => {
  it.each(Object.entries(stacks))(
    '%s keeps its blocks from colliding at every ratio',
    (templateId, ids) => {
      const template = getTemplate(templateId);
      if (!template) {
        throw new Error(`Unknown template: ${templateId}`);
      }

      const variants: [string, Record<string, unknown>][] = [
        ['defaults', template.defaultSettings],
        ['all settings on', maximalSettings(template)],
      ];

      for (const [variant, settings] of variants) {
        for (const ratio of ratios) {
          const scene = template.build({
            data: project,
            settings,
            ratio,
            measure,
          });
          const found = ids.map((id) => {
            const node = findNode(scene.nodes, id);
            if (!node) {
              throw new Error(`${templateId}: missing node ${id}`);
            }
            return node;
          });

          for (let index = 1; index < found.length; index += 1) {
            const previous = found[index - 1];
            const current = found[index];

            expect(
              {
                ratio,
                pair: `${previous.id} -> ${current.id}`,
                bottom: Math.round(previous.y + previous.height),
                top: Math.round(current.y),
              },
              `${templateId} ${ratio} (${variant}): ${previous.id} overlaps ${current.id}`,
            ).toEqual({
              ratio,
              pair: `${previous.id} -> ${current.id}`,
              bottom: Math.round(previous.y + previous.height),
              top: Math.max(
                Math.round(current.y),
                Math.round(previous.y + previous.height),
              ),
            });
          }
        }
      }
    },
  );
});

describe('template geometry', () => {
  it.each(Object.keys(stacks))(
    '%s never emits negative geometry at any ratio',
    (templateId) => {
      const template = getTemplate(templateId);
      if (!template) {
        throw new Error(`Unknown template: ${templateId}`);
      }

      const variants: [string, Record<string, unknown>][] = [
        ['defaults', template.defaultSettings],
        ['all settings on', maximalSettings(template)],
        ['all settings off', minimalSettings(template)],
      ];

      for (const [variant, settings] of variants) {
        for (const ratio of ratios) {
          const scene = template.build({
            data: project,
            settings,
            ratio,
            measure,
          });

          expectPositiveGeometry(scene, `${templateId} ${ratio} (${variant})`);
        }
      }
    },
  );
});

/** Fails when any node would hand the renderer a negative size or radius. */
function expectPositiveGeometry(scene: Scene, label: string) {
  for (const node of flatten(scene.nodes)) {
    const radius = 'cornerRadius' in node ? (node.cornerRadius ?? 0) : 0;

    expect(
      {
        width: node.width >= 0,
        height: node.height >= 0,
        radius: radius >= 0,
      },
      `${label}: ${node.id} has negative geometry`,
    ).toEqual({ width: true, height: true, radius: true });
  }
}

function flatten(nodes: SceneNode[]): SceneNode[] {
  return nodes.flatMap((node) =>
    node.type === 'group' ? [node, ...flatten(node.children)] : [node],
  );
}

function findNode(nodes: SceneNode[], id: string): SceneNode | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    if (node.type === 'group') {
      const child = findNode(node.children, id);
      if (child) {
        return child;
      }
    }
  }

  return undefined;
}
