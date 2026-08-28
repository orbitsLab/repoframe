import { describe, expect, it } from 'vitest';

import { splitMetrics } from '@/lib/templates/shared/metrics';

describe('splitMetrics', () => {
  it('keeps the headline out of the readings', () => {
    const split = splitMetrics({
      heroMetric: 'stars',
      metrics: ['stars', 'forks', 'issues'],
    });

    expect(split).toEqual({ hero: 'stars', readings: ['forks', 'issues'] });
  });

  it('returns the readings in the order the options are listed', () => {
    const split = splitMetrics({
      heroMetric: 'forks',
      metrics: ['issues', 'stars', 'forks', 'watchers'],
    });

    expect(split.readings).toEqual(['stars', 'watchers', 'issues']);
  });

  it('moves the headline on when its own metric is cleared', () => {
    const split = splitMetrics({
      heroMetric: 'stars',
      metrics: ['watchers', 'issues'],
    });

    expect(split).toEqual({ hero: 'watchers', readings: ['issues'] });
  });

  it('holds the headline when nothing is chosen', () => {
    const split = splitMetrics({ heroMetric: 'stars', metrics: [] });

    expect(split).toEqual({ hero: 'stars', readings: [] });
  });
});
