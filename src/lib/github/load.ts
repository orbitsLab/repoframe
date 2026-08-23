import {
  fetchContributors,
  fetchLanguages,
  fetchLatestRelease,
  fetchOpenPullRequests,
  fetchRepository,
} from '@/lib/github/fetchers';
import {
  mergeProjectData,
  type NormalizeInput,
  normalizeProject,
} from '@/lib/github/normalizer';
import { type Fetcher, planRequests } from '@/lib/github/plan';
import type { GitHubError, RateLimit } from '@/lib/github/rest';
import { type ParseResult, parseGitHubUrl } from '@/lib/github/url';
import { readCachedRepo, writeCachedRepo } from '@/lib/storage/repoCache';
import type { ProjectDataPath } from '@/types/data/path';
import type { ProjectData } from '@/types/data/project';

type LoadProjectError =
  | GitHubError
  | {
      kind: 'invalid-url';
      reason: Extract<ParseResult, { ok: false }>['reason'];
    };

type LoadProjectResult =
  | {
      ok: true;
      data: ProjectData;
      rateLimit: RateLimit;
      requestCount: number;
      cacheAge?: number;
    }
  | { ok: false; error: LoadProjectError; rateLimit?: RateLimit };

/**
 * Loads and normalizes only the GitHub data required by the selected paths.
 *
 * @param url - GitHub repository URL or supported shorthand.
 * @param required - Project data paths needed by the caller.
 * @returns The normalized project or a typed loading error.
 */
async function loadProject(
  url: string,
  required: ProjectDataPath[],
): Promise<LoadProjectResult> {
  const parsed = parseGitHubUrl(url);
  if (!parsed.ok) {
    return {
      ok: false,
      error: { kind: 'invalid-url', reason: parsed.reason },
    };
  }

  const cached = await readCachedRepo(parsed.owner, parsed.repo, required);
  if (cached && cached.missingPaths.length === 0) {
    return {
      ok: true,
      data: cached.data,
      rateLimit: {},
      requestCount: 0,
      cacheAge: cached.age,
    };
  }

  const missingPaths = cached?.missingPaths ?? required;
  const fetchers = cached
    ? planRequests(missingPaths).filter((fetcher) => fetcher !== 'repository')
    : planRequests(missingPaths);
  const input = {} as NormalizeInput;
  let rateLimit: RateLimit = {};

  for (const fetcher of fetchers) {
    const result = await runFetcher(fetcher, parsed.owner, parsed.repo);
    if (!result.ok) {
      return result;
    }

    rateLimit = result.rateLimit;
    Object.assign(input, result.data);
  }

  const openIssuesCount =
    cached?.openIssuesCount ?? input.repository.open_issues_count;
  const data = cached
    ? mergeProjectData(cached.data, input, openIssuesCount)
    : normalizeProject(input);
  const fetchedPaths = cached
    ? missingPaths
    : (['repository', ...missingPaths] as ProjectDataPath[]);

  await writeCachedRepo(
    parsed.owner,
    parsed.repo,
    data,
    fetchedPaths,
    openIssuesCount,
  );

  return { ok: true, data, rateLimit, requestCount: fetchers.length };
}

async function runFetcher(fetcher: Fetcher, owner: string, repo: string) {
  switch (fetcher) {
    case 'repository': {
      const result = await fetchRepository(owner, repo);
      return mapResult(result, (repository) => ({ repository }));
    }
    case 'languages': {
      const result = await fetchLanguages(owner, repo);
      return mapResult(result, (languages) => ({ languages }));
    }
    case 'contributors': {
      const result = await fetchContributors(owner, repo);
      return mapResult(result, (contributors) => ({ contributors }));
    }
    case 'pullRequests': {
      const result = await fetchOpenPullRequests(owner, repo);
      return mapResult(result, (pullRequests) => ({ pullRequests }));
    }
    case 'latestRelease': {
      const result = await fetchLatestRelease(owner, repo);
      return mapResult(result, (latestRelease) => ({ latestRelease }));
    }
  }
}

function mapResult<T>(
  result:
    | { ok: true; data: T; rateLimit: RateLimit }
    | { ok: false; error: GitHubError; rateLimit?: RateLimit },
  map: (data: T) => Partial<NormalizeInput>,
) {
  if (!result.ok) {
    return result;
  }

  return {
    ok: true as const,
    data: map(result.data),
    rateLimit: result.rateLimit,
  };
}

export type { LoadProjectError, LoadProjectResult };
export { loadProject };
