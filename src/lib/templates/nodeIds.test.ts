import { describe, expect, it } from 'vitest';

import { templates } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';
import type { SceneNode } from '@/types/scene';
import type { MeasureText } from '@/types/template';

const project: ProjectData = {
  repository: {
    name: 'alfa-leetcode-api',
    fullName: 'alfaarghya/alfa-leetcode-api',
    url: 'https://github.com/alfaarghya/alfa-leetcode-api',
    description: 'A custom API for LeetCode profiles and problems.',
    defaultBranch: 'main',
    createdAt: '2013-07-29T03:24:51Z',
    updatedAt: '2026-08-22T12:00:00Z',
    pushedAt: '2026-08-22T12:00:00Z',
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
  metrics: {
    stars: 815,
    forks: 327,
    watchers: 1,
    issues: 11,
    pullRequests: 2,
  },
  languages: [
    { name: 'TypeScript', bytes: 900, percentage: 90 },
    { name: 'JavaScript', bytes: 100, percentage: 10 },
  ],
  topics: ['api', 'leetcode-api'],
  contributors: [
    {
      login: 'alfaarghya',
      avatarUrl: 'https://avatars.githubusercontent.com/alfaarghya',
      url: 'https://github.com/alfaarghya',
      contributions: 140,
    },
    {
      login: 'jamesh48',
      avatarUrl: 'https://avatars.githubusercontent.com/jamesh48',
      url: 'https://github.com/jamesh48',
      contributions: 7,
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
  const charactersPerLine = Math.max(
    1,
    Math.floor(style.maxWidth / characterWidth),
  );
  const lines = Array.from(
    text.matchAll(new RegExp(`.{1,${charactersPerLine}}`, 'gu')),
  ).map((match) => match[0]);
  const visibleLines = style.maxLines ? lines.slice(0, style.maxLines) : lines;

  return {
    lines: visibleLines.length > 0 ? visibleLines : [''],
    width: Math.min(style.maxWidth, text.length * characterWidth),
    height:
      Math.max(1, visibleLines.length) * style.fontSize * style.lineHeight,
  };
};

describe('template node ids', () => {
  it.each(templates)(
    '$id keeps role ids stable when data changes',
    (template) => {
      const modifiedProject: ProjectData = {
        ...project,
        metrics: { ...project.metrics, stars: 0 },
        contributors: project.contributors?.slice(0, 1),
      };

      for (const ratio of template.supportedRatios) {
        const first = template.build({
          data: project,
          settings: template.defaultSettings,
          ratio,
          measure,
        });
        const second = template.build({
          data: project,
          settings: template.defaultSettings,
          ratio,
          measure,
        });
        const modified = template.build({
          data: modifiedProject,
          settings: template.defaultSettings,
          ratio,
          measure,
        });
        const firstIds = collectIds(first.nodes);

        expect(new Set(firstIds).size).toBe(firstIds.length);
        expect(collectIds(second.nodes)).toEqual(firstIds);
        expect(collectIds(modified.nodes)).toEqual(firstIds);
      }
    },
  );
});

function collectIds(nodes: SceneNode[]): string[] {
  return nodes.flatMap((node) => [
    node.id,
    ...(node.type === 'group' ? collectIds(node.children) : []),
  ]);
}
