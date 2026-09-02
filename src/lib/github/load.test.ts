import { beforeEach, describe, expect, it, vi } from 'vitest';

import emptyRepo from '@/lib/github/__fixtures__/emptyRepo.json';
import { type NormalizeInput, normalizeProject } from '@/lib/github/normalizer';

const fetchers = vi.hoisted(() => ({
  fetchContributors: vi.fn(),
  fetchLanguages: vi.fn(),
  fetchLatestRelease: vi.fn(),
  fetchOpenPullRequests: vi.fn(),
  fetchRepository: vi.fn(),
}));

const cache = vi.hoisted(() => ({
  readCachedRepo: vi.fn(),
  writeCachedRepo: vi.fn(),
}));

vi.mock('@/lib/github/fetchers', () => fetchers);
vi.mock('@/lib/storage/repoCache', () => cache);

import { loadProject } from '@/lib/github/load';

const project = normalizeProject(emptyRepo as NormalizeInput);

describe('loadProject cache orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores the cached record when refreshing', async () => {
    cache.readCachedRepo.mockResolvedValue({
      data: project,
      fetchedAt: 1_000_000,
      requestedPaths: ['repository'],
      openIssuesCount: 0,
      age: 60_000,
      missingPaths: [],
    });
    fetchers.fetchRepository.mockResolvedValue({
      ok: true,
      data: (emptyRepo as NormalizeInput).repository,
      rateLimit: { remaining: 59 },
    });

    const result = await loadProject('Owner/Repo', ['repository'], {
      refresh: true,
    });

    expect(cache.readCachedRepo).not.toHaveBeenCalled();
    expect(fetchers.fetchRepository).toHaveBeenCalledWith('Owner', 'Repo');
    expect(cache.writeCachedRepo).toHaveBeenCalledWith(
      'Owner',
      'Repo',
      expect.anything(),
      expect.arrayContaining(['repository']),
      expect.any(Number),
      true,
    );
    expect(result).toMatchObject({ ok: true, requestCount: 1 });
  });

  it('returns a complete cache hit without fetching', async () => {
    cache.readCachedRepo.mockResolvedValue({
      data: project,
      fetchedAt: 1_000_000,
      requestedPaths: ['repository', 'contributors'],
      openIssuesCount: 0,
      age: 60_000,
      missingPaths: [],
    });

    const result = await loadProject('Owner/Repo', [
      'repository',
      'contributors',
    ]);

    expect(result).toMatchObject({
      ok: true,
      requestCount: 0,
      cacheAge: 60_000,
    });
    expect(fetchers.fetchRepository).not.toHaveBeenCalled();
    expect(fetchers.fetchContributors).not.toHaveBeenCalled();
  });

  it('fetches and merges only a missing contributors endpoint', async () => {
    cache.readCachedRepo.mockResolvedValue({
      data: project,
      fetchedAt: 1_000_000,
      requestedPaths: ['repository'],
      openIssuesCount: 0,
      age: 60_000,
      missingPaths: ['contributors'],
    });
    fetchers.fetchContributors.mockResolvedValue({
      ok: true,
      data: [
        {
          login: 'octocat',
          avatar_url: 'https://example.com/avatar.png',
          html_url: 'https://github.com/octocat',
          contributions: 10,
        },
      ],
      rateLimit: { remaining: 50 },
    });

    const result = await loadProject('Owner/Repo', [
      'repository',
      'contributors',
    ]);

    expect(result).toMatchObject({
      ok: true,
      requestCount: 1,
      data: { contributors: [{ login: 'octocat' }] },
    });
    expect(fetchers.fetchRepository).not.toHaveBeenCalled();
    expect(fetchers.fetchContributors).toHaveBeenCalledOnce();
    expect(cache.writeCachedRepo).toHaveBeenCalledOnce();
  });

  it('uses cached open issues when the pull request probe is deferred', async () => {
    cache.readCachedRepo.mockResolvedValue({
      data: project,
      fetchedAt: 1_000_000,
      requestedPaths: ['repository'],
      openIssuesCount: 10,
      age: 60_000,
      missingPaths: ['metrics.issues'],
    });
    fetchers.fetchOpenPullRequests.mockResolvedValue({
      ok: true,
      data: 3,
      rateLimit: { remaining: 50 },
    });

    const result = await loadProject('Owner/Repo', [
      'repository',
      'metrics.issues',
    ]);

    expect(result).toMatchObject({
      ok: true,
      requestCount: 1,
      data: { metrics: { issues: 7, pullRequests: 3 } },
    });
    expect(fetchers.fetchRepository).not.toHaveBeenCalled();
    expect(fetchers.fetchOpenPullRequests).toHaveBeenCalledOnce();
  });
});
