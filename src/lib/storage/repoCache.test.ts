import { beforeEach, describe, expect, it, vi } from 'vitest';

import emptyRepo from '@/lib/github/__fixtures__/emptyRepo.json';
import { type NormalizeInput, normalizeProject } from '@/lib/github/normalizer';

const database = vi.hoisted(() => ({
  deleteStore: vi.fn(),
  readStore: vi.fn(),
  writeStore: vi.fn(),
}));

vi.mock('@/lib/storage/db', () => database);

import {
  cacheTtl,
  readCachedRepo,
  writeCachedRepo,
} from '@/lib/storage/repoCache';

const project = normalizeProject(emptyRepo as NormalizeInput);

describe('repository cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  it('returns fresh data and reports only missing paths', async () => {
    database.readStore.mockResolvedValue({
      data: project,
      fetchedAt: 940_000,
      requestedPaths: ['repository', 'owner', 'metrics', 'topics'],
      openIssuesCount: 0,
    });

    const cached = await readCachedRepo('Owner', 'Repo', [
      'repository',
      'contributors',
    ]);

    expect(database.readStore).toHaveBeenCalledWith('repos', 'owner/repo');
    expect(cached?.age).toBe(60_000);
    expect(cached?.missingPaths).toEqual(['contributors']);
  });

  it('removes an expired entry', async () => {
    database.readStore.mockResolvedValue({
      data: project,
      fetchedAt: 1_000_000 - cacheTtl,
      requestedPaths: ['repository'],
      openIssuesCount: 0,
    });

    expect(
      await readCachedRepo('Owner', 'Repo', ['repository']),
    ).toBeUndefined();
    expect(database.deleteStore).toHaveBeenCalledWith('repos', 'owner/repo');
  });

  it('records every path supplied by shared endpoints', async () => {
    database.readStore.mockResolvedValue({
      requestedPaths: ['repository', 'owner', 'metrics', 'topics'],
    });

    await writeCachedRepo('Owner', 'Repo', project, ['metrics.issues'], 10);

    expect(database.writeStore).toHaveBeenCalledWith(
      'repos',
      'owner/repo',
      expect.objectContaining({
        requestedPaths: [
          'repository',
          'owner',
          'metrics',
          'topics',
          'metrics.issues',
          'metrics.pullRequests',
        ],
        openIssuesCount: 10,
      }),
    );
  });
});
