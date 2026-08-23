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

function fetchRepository(owner: string, repo: string) {
  return githubRequest<RawRepository>(repositoryPath(owner, repo));
}

function fetchLanguages(owner: string, repo: string) {
  return githubRequest<RawLanguages>(
    `${repositoryPath(owner, repo)}/languages`,
  );
}

async function fetchContributors(
  owner: string,
  repo: string,
): Promise<GitHubResult<RawContributor[]>> {
  return githubRequest<RawContributor[]>(
    `${repositoryPath(owner, repo)}/contributors?per_page=10`,
    async (response) => (response.status === 204 ? [] : response.json()),
  );
}

function fetchOpenPullRequests(owner: string, repo: string) {
  return githubRequest<number>(
    `${repositoryPath(owner, repo)}/pulls?state=open&per_page=1`,
    async (response) => {
      const pulls = (await response.json()) as unknown[];
      // The last page number equals the total when GitHub returns one item per page.
      return readLinkLast(response.headers.get('link')) ?? pulls.length;
    },
  );
}

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
