import type { ProjectData } from '@/types/data/project';

/** Committed repository data used before a user imports a project. */
const sampleProject: ProjectData = {
  repository: {
    name: 'alfa-leetcode-api',
    fullName: 'alfaarghya/alfa-leetcode-api',
    url: 'https://github.com/alfaarghya/alfa-leetcode-api',
    description:
      'A custom LeetCode API for profiles, problems, contests, submissions, and daily questions.',
    homepage: 'https://alfaarghya.github.io/alfa-leetcode-api/',
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
  metrics: {
    stars: 815,
    forks: 327,
    watchers: 1,
    issues: 11,
    pullRequests: 2,
  },
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
    {
      login: 'jamesh48',
      avatarUrl: 'https://avatars.githubusercontent.com/jamesh48',
      url: 'https://github.com/jamesh48',
      contributions: 7,
    },
    {
      login: 'nickbar01234',
      avatarUrl: 'https://avatars.githubusercontent.com/nickbar01234',
      url: 'https://github.com/nickbar01234',
      contributions: 5,
    },
  ],
  latestRelease: {
    tagName: 'v2.0.4',
    name: 'v2.0.4',
    publishedAt: '2026-04-16T13:54:00Z',
    url: 'https://github.com/alfaarghya/alfa-leetcode-api/releases/tag/v2.0.4',
  },
  fetchedAt: '2026-08-23T11:30:00Z',
};

export { sampleProject };
