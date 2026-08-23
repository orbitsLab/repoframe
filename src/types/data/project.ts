/** GitHub repository data exposed to RepoFrame templates. */
type ProjectData = {
  /** Repository details from GET /repos/{owner}/{repo}. */
  repository: {
    /** Repository name. From name. */
    name: string;
    /** Owner-qualified repository name. From full_name. */
    fullName: string;
    /** Public repository URL. From html_url. */
    url: string;
    /** Repository description. From description. */
    description?: string;
    /** Project homepage. From homepage. */
    homepage?: string;
    /** Default branch name. From default_branch. */
    defaultBranch: string;
    /** Repository creation time. From created_at. */
    createdAt: string;
    /** Repository update time. From updated_at. */
    updatedAt: string;
    /** Most recent push time. From pushed_at. */
    pushedAt: string;
    /** Whether the repository is a fork. From fork. */
    isFork: boolean;
    /** Whether the repository is archived. From archived. */
    isArchived: boolean;
    /** Parent repository name for forks. From parent.full_name. */
    parentFullName?: string;
    /** Repository license. From license. */
    license?: { key: string; name: string; spdxId?: string };
  };
  /** Repository owner. From the repository response owner. */
  owner: {
    /** Owner login. From owner.login. */
    login: string;
    /** Owner avatar URL. From owner.avatar_url. */
    avatarUrl: string;
    /** Public owner URL. From owner.html_url. */
    url: string;
    /** GitHub account type. From owner.type. */
    type: 'User' | 'Organization';
  };
  /** Repository counts from the repository response and pull request probe. */
  metrics: {
    /** Star count. From stargazers_count. */
    stars: number;
    /** Fork count. From forks_count. */
    forks: number;
    /** Watcher count. From subscribers_count because watchers_count duplicates stars. */
    watchers: number;
    /** Issues only. Derived: open_issues_count - pullRequests. */
    issues?: number;
    /** Open pull requests. Derived from the pulls endpoint Link header. */
    pullRequests?: number;
  };
  /** Language byte totals from GET /repos/{owner}/{repo}/languages. */
  languages: {
    /** Language name. From the languages response key. */
    name: string;
    /** Language size in bytes. From the languages response value. */
    bytes: number;
    /** Percentage of total bytes. Computed locally; GitHub returns bytes only. */
    percentage: number;
  }[];
  /** Repository topics. From topics. */
  topics: string[];
  /** Top contributors from GET /repos/{owner}/{repo}/contributors. */
  contributors?: {
    /** Contributor login. From login. */
    login: string;
    /** Contributor avatar URL. From avatar_url. */
    avatarUrl: string;
    /** Public contributor URL. From html_url. */
    url: string;
    /** Commit count attributed by GitHub. From contributions. */
    contributions: number;
  }[];
  /** Latest stable release from GET /repos/{owner}/{repo}/releases/latest. */
  latestRelease?: {
    /** Release tag. From tag_name. */
    tagName: string;
    /** Release name. From name. */
    name?: string;
    /** Release publication time. From published_at. */
    publishedAt?: string;
    /** Public release URL. From html_url. */
    url: string;
  };
  /** Time when RepoFrame finished loading the project. */
  fetchedAt: string;
};

export type { ProjectData };
