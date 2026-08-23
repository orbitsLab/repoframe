import { describe, expect, it } from 'vitest';

import { planRequests } from '@/lib/github/plan';

describe('planRequests', () => {
  it('uses one request for repository fields', () => {
    expect(planRequests(['repository', 'owner', 'metrics', 'topics'])).toEqual([
      'repository',
    ]);
  });

  it('maps optional paths to the minimum requests', () => {
    expect(
      planRequests([
        'languages',
        'contributors',
        'metrics.issues',
        'latestRelease',
      ]),
    ).toEqual([
      'repository',
      'languages',
      'contributors',
      'pullRequests',
      'latestRelease',
    ]);
  });

  it('does not duplicate requests', () => {
    expect(
      planRequests([
        'languages',
        'languages',
        'metrics.issues',
        'metrics.pullRequests',
      ]),
    ).toEqual(['repository', 'languages', 'pullRequests']);
  });
});
