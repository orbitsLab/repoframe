/** Project data sections that templates can request. */
type ProjectDataPath =
  | 'repository'
  | 'owner'
  | 'metrics'
  | 'metrics.issues'
  | 'metrics.pullRequests'
  | 'languages'
  | 'topics'
  | 'contributors'
  | 'latestRelease';

export type { ProjectDataPath };
