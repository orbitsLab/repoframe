import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchContributors,
  fetchLatestRelease,
  fetchOpenPullRequests,
  fetchRepository,
} from '@/lib/github/fetchers';

/** Stubs the next GitHub response with a status, body, and headers. */
function respondWith(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'x-ratelimit-remaining': '29', ...headers },
        }),
    ),
  );
}

describe('endpoints GitHub answers with an error for a healthy repository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads no open pull requests when a repository has them disabled', async () => {
    // torvalds/linux takes patches by mail, so GitHub 404s the pulls endpoint.
    respondWith(404, { message: 'Not Found' });

    const result = await fetchOpenPullRequests('torvalds', 'linux');

    expect(result).toMatchObject({ ok: true, data: 0 });
  });

  it('reads no contributors when the list is too large to serve', async () => {
    respondWith(403, {
      message:
        'The history or contributor list is too large to list contributors for this repository via the API.',
    });

    const result = await fetchContributors('torvalds', 'linux');

    expect(result).toMatchObject({ ok: true, data: [] });
  });

  it('reads no release when a repository has never published one', async () => {
    respondWith(404, { message: 'Not Found' });

    const result = await fetchLatestRelease('torvalds', 'linux');

    expect(result).toMatchObject({ ok: true, data: undefined });
  });

  it('keeps reporting a forbidden contributor list it cannot explain', async () => {
    respondWith(403, { message: 'Forbidden' });

    const result = await fetchContributors('owner', 'repo');

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'unexpected', status: 403 },
    });
  });

  it('reports a secondary rate limit as rate limited', async () => {
    respondWith(403, {
      message:
        'You have exceeded a secondary rate limit. Please wait a few minutes before you try again.',
    });

    const result = await fetchOpenPullRequests('owner', 'repo');

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'rate-limited', resetAt: undefined },
    });
  });

  it('reports an exhausted quota whose headers it cannot read', async () => {
    respondWith(403, { message: 'API rate limit exceeded for 1.2.3.4.' });

    const result = await fetchRepository('owner', 'repo');

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'rate-limited' },
    });
  });

  it('keeps reporting a rate-limited pull request probe', async () => {
    respondWith(
      403,
      { message: 'API rate limit exceeded' },
      { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '4000000000' },
    );

    const result = await fetchOpenPullRequests('owner', 'repo');

    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'rate-limited' },
    });
  });
});
