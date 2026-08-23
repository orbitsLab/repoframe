import type { ProjectDataPath } from '@/types/data/path';

type Fetcher =
  | 'repository'
  | 'languages'
  | 'contributors'
  | 'pullRequests'
  | 'latestRelease';

/**
 * Maps requested project fields to the minimum set of GitHub API calls.
 *
 * @param required - Project data paths needed by the caller.
 * @returns Fetchers in execution order, with repository metadata first.
 */
function planRequests(required: ProjectDataPath[]): Fetcher[] {
  const paths = new Set(required);
  const fetchers: Fetcher[] = ['repository'];

  if (paths.has('languages')) {
    fetchers.push('languages');
  }

  if (paths.has('contributors')) {
    fetchers.push('contributors');
  }

  if (paths.has('metrics.issues') || paths.has('metrics.pullRequests')) {
    fetchers.push('pullRequests');
  }

  if (paths.has('latestRelease')) {
    fetchers.push('latestRelease');
  }

  return fetchers;
}

export type { Fetcher };
export { planRequests };
