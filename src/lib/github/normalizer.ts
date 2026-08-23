import type { ProjectData } from '@/types/data/project';

type RawRepository = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  parent?: { full_name: string };
  license: { key: string; name: string; spdx_id: string | null } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
    type: 'User' | 'Organization';
  };
  stargazers_count: number;
  forks_count: number;
  subscribers_count: number;
  open_issues_count: number;
  topics: string[];
};

type RawLanguages = Record<string, number>;

type RawContributor = {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions: number;
};

type RawRelease = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  html_url: string;
};

type NormalizeInput = {
  repository: RawRepository;
  languages?: RawLanguages;
  contributors?: RawContributor[];
  pullRequests?: number;
  latestRelease?: RawRelease;
  fetchedAt?: string;
};

/**
 * Converts GitHub REST responses into RepoFrame's project data model.
 *
 * @param input - Repository data and any optional endpoint responses.
 * @returns Project data suitable for RepoFrame templates.
 */
function normalizeProject(input: NormalizeInput): ProjectData {
  const { repository, pullRequests } = input;

  return {
    repository: {
      name: repository.name,
      fullName: repository.full_name,
      url: repository.html_url,
      description: repository.description || undefined,
      homepage: repository.homepage || undefined,
      defaultBranch: repository.default_branch,
      createdAt: repository.created_at,
      updatedAt: repository.updated_at,
      pushedAt: repository.pushed_at,
      isFork: repository.fork,
      isArchived: repository.archived,
      parentFullName: repository.parent?.full_name,
      license: repository.license
        ? {
            key: repository.license.key,
            name: repository.license.name,
            spdxId: repository.license.spdx_id || undefined,
          }
        : undefined,
    },
    owner: {
      login: repository.owner.login,
      avatarUrl: repository.owner.avatar_url,
      url: repository.owner.html_url,
      type: repository.owner.type,
    },
    metrics: {
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      // GitHub's watchers_count duplicates stars; subscribers_count is watchers.
      watchers: repository.subscribers_count,
      // open_issues_count includes pull requests, so subtract the PR probe.
      issues:
        pullRequests === undefined
          ? undefined
          : Math.max(0, repository.open_issues_count - pullRequests),
      pullRequests,
    },
    languages: normalizeLanguages(input.languages),
    topics: repository.topics,
    contributors: normalizeContributors(input.contributors),
    latestRelease: normalizeRelease(input.latestRelease),
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
  };
}

/**
 * Applies partial GitHub responses to cached project data without mutating it.
 *
 * @param data - Cached project data to use as the base.
 * @param input - Responses fetched for data missing from the cache.
 * @param openIssuesCount - GitHub's combined issue and pull request count.
 * @returns A new project value containing the merged responses.
 */
function mergeProjectData(
  data: ProjectData,
  input: Partial<Omit<NormalizeInput, 'repository'>>,
  openIssuesCount: number,
): ProjectData {
  const project = {
    ...data,
    metrics: { ...data.metrics },
    fetchedAt: new Date().toISOString(),
  };

  if (input.languages !== undefined) {
    project.languages = normalizeLanguages(input.languages);
  }

  if (input.contributors !== undefined) {
    project.contributors = normalizeContributors(input.contributors);
  }

  if (input.pullRequests !== undefined) {
    project.metrics.pullRequests = input.pullRequests;
    project.metrics.issues = Math.max(0, openIssuesCount - input.pullRequests);
  }

  if ('latestRelease' in input) {
    project.latestRelease = normalizeRelease(input.latestRelease);
  }

  return project;
}

function hasContributorProfile(
  contributor: RawContributor,
): contributor is RawContributor & {
  login: string;
  avatar_url: string;
  html_url: string;
} {
  return Boolean(
    contributor.login && contributor.avatar_url && contributor.html_url,
  );
}

function normalizeContributors(contributors?: RawContributor[]) {
  return contributors?.filter(hasContributorProfile).map((contributor) => ({
    login: contributor.login,
    avatarUrl: contributor.avatar_url,
    url: contributor.html_url,
    contributions: contributor.contributions,
  }));
}

function normalizeRelease(release?: RawRelease) {
  return release
    ? {
        tagName: release.tag_name,
        name: release.name || undefined,
        publishedAt: release.published_at || undefined,
        url: release.html_url,
      }
    : undefined;
}

function normalizeLanguages(languages?: RawLanguages) {
  if (!languages) {
    return [];
  }

  const totalBytes = Object.values(languages).reduce(
    (total, bytes) => total + bytes,
    0,
  );

  if (totalBytes === 0) {
    return [];
  }

  return Object.entries(languages).map(([name, bytes]) => ({
    name,
    bytes,
    // GitHub returns byte counts only, so percentages are computed locally.
    percentage: (bytes / totalBytes) * 100,
  }));
}

export type {
  NormalizeInput,
  RawContributor,
  RawLanguages,
  RawRelease,
  RawRepository,
};
export { mergeProjectData, normalizeProject };
