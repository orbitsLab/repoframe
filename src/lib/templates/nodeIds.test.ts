import { describe, expect, it } from 'vitest';

import { templates } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';
import type { SceneNode } from '@/types/scene';
import type { MeasureText } from '@/types/template';

const project: ProjectData = {
  repository: {
    name: 'core',
    fullName: 'vuejs/core',
    url: 'https://github.com/vuejs/core',
    description: 'Vue.js is a progressive, incrementally-adoptable framework.',
    defaultBranch: 'main',
    createdAt: '2013-07-29T03:24:51Z',
    updatedAt: '2026-08-22T12:00:00Z',
    pushedAt: '2026-08-22T12:00:00Z',
    isFork: false,
    isArchived: false,
    license: { key: 'mit', name: 'MIT License', spdxId: 'MIT' },
  },
  owner: {
    login: 'vuejs',
    avatarUrl: 'https://avatars.githubusercontent.com/u/6128107?v=4',
    url: 'https://github.com/vuejs',
    type: 'Organization',
  },
  metrics: {
    stars: 52_000,
    forks: 8_900,
    watchers: 1_200,
    issues: 400,
    pullRequests: 90,
  },
  languages: [
    { name: 'TypeScript', bytes: 900, percentage: 90 },
    { name: 'JavaScript', bytes: 100, percentage: 10 },
  ],
  topics: ['vue', 'framework'],
  contributors: [
    {
      login: 'yyx990803',
      avatarUrl: 'https://avatars.githubusercontent.com/u/499550?v=4',
      url: 'https://github.com/yyx990803',
      contributions: 1000,
    },
    {
      login: 'posva',
      avatarUrl: 'https://avatars.githubusercontent.com/u/664177?v=4',
      url: 'https://github.com/posva',
      contributions: 500,
    },
  ],
  latestRelease: {
    tagName: 'v3.5.0',
    name: 'Vue 3.5',
    publishedAt: '2026-08-01T12:00:00Z',
    url: 'https://github.com/vuejs/core/releases/tag/v3.5.0',
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
