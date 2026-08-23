import { describe, expect, it } from 'vitest';

import alfaLeetcodeApi from '@/lib/github/__fixtures__/alfaLeetcodeApi.json';
import emptyRepo from '@/lib/github/__fixtures__/emptyRepo.json';
import noRelease from '@/lib/github/__fixtures__/noRelease.json';
import singlePr from '@/lib/github/__fixtures__/singlePr.json';
import {
  mergeProjectData,
  type NormalizeInput,
  normalizeProject,
} from '@/lib/github/normalizer';

function normalizeFixture(fixture: unknown) {
  return normalizeProject(fixture as NormalizeInput);
}

describe('normalizeProject', () => {
  it('maps GitHub metrics and computes language percentages', () => {
    const project = normalizeFixture(alfaLeetcodeApi);
    const percentageTotal = project.languages.reduce(
      (total, language) => total + language.percentage,
      0,
    );

    expect(project.metrics.watchers).toBe(1);
    expect(project.metrics.watchers).not.toBe(
      alfaLeetcodeApi.repository.watchers_count,
    );
    expect(project.metrics.issues).toBe(11);
    expect(project.metrics.pullRequests).toBe(2);
    expect(
      (project.metrics.issues ?? 0) + (project.metrics.pullRequests ?? 0),
    ).toBe(alfaLeetcodeApi.repository.open_issues_count);
    expect(percentageTotal).toBeCloseTo(100, 5);
  });

  it('normalizes an empty repository', () => {
    const project = normalizeFixture(emptyRepo);

    expect(project.metrics.stars).toBe(0);
    expect(project.languages).toEqual([]);
    expect(project.contributors).toEqual([]);
  });

  it('leaves the latest release absent for a repository without releases', () => {
    const project = normalizeFixture(emptyRepo);

    expect(noRelease.status).toBe('404');
    expect(project.latestRelease).toBeUndefined();
  });

  it('keeps a single pull request from a response without a Link header', () => {
    const project = normalizeFixture(singlePr);

    expect(project.metrics.pullRequests).toBe(1);
    expect(project.metrics.issues).toBe(0);
  });

  it('omits issue metrics when the pull request probe was not run', () => {
    const project = normalizeFixture(emptyRepo);

    expect(project.metrics.pullRequests).toBeUndefined();
    expect(project.metrics.issues).toBeUndefined();
  });

  it('merges a deferred pull request probe without mutating cached data', () => {
    const cached = normalizeFixture(emptyRepo);
    const merged = mergeProjectData(cached, { pullRequests: 3 }, 10);

    expect(merged.metrics).toMatchObject({ issues: 7, pullRequests: 3 });
    expect(cached.metrics.issues).toBeUndefined();
    expect(cached.metrics.pullRequests).toBeUndefined();
  });
});
