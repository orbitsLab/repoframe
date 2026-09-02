import type {
  RawContributor,
  RawLanguages,
  RawRelease,
  RawRepository,
} from '@/lib/github/normalizer';
import {
  type GitHubResult,
  githubRequest,
  readLinkLast,
} from '@/lib/github/rest';

/**
 * Fetches the repository metadata used by the project data model.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @returns Repository metadata or a typed GitHub error.
 */
function fetchRepository(owner: string, repo: string) {
  return githubRequest<RawRepository>(repositoryPath(owner, repo));
}

/**
 * Fetches repository language totals in bytes.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @returns Language totals or a typed GitHub error.
 */
function fetchLanguages(owner: string, repo: string) {
  return githubRequest<RawLanguages>(
    `${repositoryPath(owner, repo)}/languages`,
  );
}

/**
 * Fetches up to thirty repository contributors, ranked by commit count.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @returns Contributors or a typed GitHub error.
 */
async function fetchContributors(
  owner: string,
  repo: string,
): Promise<GitHubResult<RawContributor[]>> {
  const result = await githubRequest<RawContributor[]>(
    `${repositoryPath(owner, repo)}/contributors?per_page=30`,
    async (response) => (response.status === 204 ? [] : response.json()),
  );

  // GitHub refuses the list outright on repositories with a very long history,
  // which is a card drawn without contributors rather than a failed load.
  if (
    !result.ok &&
    result.error.kind === 'unexpected' &&
    result.error.status === 403 &&
    result.error.message?.includes('too large')
  ) {
    return { ok: true, data: [], rateLimit: result.rateLimit ?? {} };
  }

  return result;
}

/**
 * Fetches the total number of open pull requests.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @returns The open pull request count or a typed GitHub error.
 */
async function fetchOpenPullRequests(
  owner: string,
  repo: string,
): Promise<GitHubResult<number>> {
  const result = await githubRequest<number>(
    `${repositoryPath(owner, repo)}/pulls?state=open&per_page=1`,
    async (response) => {
      const pulls = (await response.json()) as unknown[];
      // The last page number equals the total when GitHub returns one item per page.
      return readLinkLast(response.headers.get('link')) ?? pulls.length;
    },
  );

  // GitHub uses 404 when a repository has pull requests turned off. The
  // repository itself is read before this call, so it is a count of none.
  if (!result.ok && result.error.kind === 'not-found') {
    return { ok: true, data: 0, rateLimit: result.rateLimit ?? {} };
  }

  return result;
}

/**
 * Fetches the latest published release when one exists.
 *
 * @param owner - GitHub repository owner.
 * @param repo - GitHub repository name.
 * @returns The latest release, no release, or a typed GitHub error.
 */
async function fetchLatestRelease(
  owner: string,
  repo: string,
): Promise<GitHubResult<RawRelease | undefined>> {
  const result = await githubRequest<RawRelease>(
    `${repositoryPath(owner, repo)}/releases/latest`,
  );

  // GitHub uses 404 when a repository exists but has no published release.
  if (!result.ok && result.error.kind === 'not-found') {
    return { ok: true, data: undefined, rateLimit: result.rateLimit ?? {} };
  }

  return result;
}

function repositoryPath(owner: string, repo: string) {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

export {
  fetchContributors,
  fetchLanguages,
  fetchLatestRelease,
  fetchOpenPullRequests,
  fetchRepository,
};
