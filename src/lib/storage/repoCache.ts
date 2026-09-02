import { deleteStore, readStore, writeStore } from '@/lib/storage/db';
import type { ProjectDataPath } from '@/types/data/path';
import type { ProjectData } from '@/types/data/project';

const cacheTtl = 30 * 60 * 1000;

const repositoryPaths: ProjectDataPath[] = [
  'repository',
  'owner',
  'metrics',
  'topics',
];

const pullRequestPaths: ProjectDataPath[] = [
  'metrics.issues',
  'metrics.pullRequests',
];

type RepoCacheRecord = {
  data: ProjectData;
  fetchedAt: number;
  requestedPaths: ProjectDataPath[];
  openIssuesCount: number;
};

/** Fresh cached data and the paths still missing from the record. */
type CacheHit = RepoCacheRecord & {
  age: number;
  missingPaths: ProjectDataPath[];
};

function getRepoKey(owner: string, repo: string) {
  return `${owner}/${repo}`.toLowerCase();
}

/**
 * Reads a fresh repository record and reports paths still requiring a request.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @param required - Project data paths required by the caller.
 * @returns A fresh cache hit, or undefined when no usable record exists.
 */
async function readCachedRepo(
  owner: string,
  repo: string,
  required: ProjectDataPath[],
): Promise<CacheHit | undefined> {
  const record = await readStore<RepoCacheRecord>(
    'repos',
    getRepoKey(owner, repo),
  );

  if (!record || !isCacheRecord(record)) {
    return undefined;
  }

  const age = Date.now() - record.fetchedAt;
  if (age < 0 || age >= cacheTtl) {
    await deleteStore('repos', getRepoKey(owner, repo));
    return undefined;
  }

  const requestedPaths = new Set(record.requestedPaths);

  return {
    ...record,
    age,
    missingPaths: required.filter((path) => !requestedPaths.has(path)),
  };
}

/**
 * Stores repository data while preserving paths fetched by earlier partial loads.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @param data - Normalized project data to cache.
 * @param required - Project data paths supplied by the current load.
 * @param openIssuesCount - GitHub's combined issue and pull request count.
 * @param replace - Whether to drop the paths recorded by earlier loads.
 */
async function writeCachedRepo(
  owner: string,
  repo: string,
  data: ProjectData,
  required: ProjectDataPath[],
  openIssuesCount: number,
  replace = false,
): Promise<void> {
  const key = getRepoKey(owner, repo);
  const current = replace
    ? undefined
    : await readStore<RepoCacheRecord>('repos', key);
  const requestedPaths = new Set(current?.requestedPaths ?? []);

  for (const path of expandRequestedPaths(required)) {
    requestedPaths.add(path);
  }

  await writeStore<RepoCacheRecord>('repos', key, {
    data,
    fetchedAt: Date.now(),
    requestedPaths: [...requestedPaths],
    openIssuesCount,
  });
}

function expandRequestedPaths(required: ProjectDataPath[]) {
  const paths = new Set(required);

  if (required.some((path) => repositoryPaths.includes(path))) {
    for (const path of repositoryPaths) {
      paths.add(path);
    }
  }

  if (required.some((path) => pullRequestPaths.includes(path))) {
    for (const path of pullRequestPaths) {
      paths.add(path);
    }
  }

  return paths;
}

function isCacheRecord(value: RepoCacheRecord) {
  return (
    typeof value.fetchedAt === 'number' &&
    Array.isArray(value.requestedPaths) &&
    typeof value.openIssuesCount === 'number' &&
    typeof value.data === 'object' &&
    value.data !== null
  );
}

export type { CacheHit };
export { cacheTtl, readCachedRepo, writeCachedRepo };
