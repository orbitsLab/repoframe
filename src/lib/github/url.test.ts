import { describe, expect, it } from 'vitest';

import { parseGitHubUrl } from '@/lib/github/url';

describe('parseGitHubUrl', () => {
  it.each([
    ['https://github.com/owner/repo', 'owner', 'repo'],
    ['http://github.com/owner/repo/', 'owner', 'repo'],
    ['github.com/owner/repo', 'owner', 'repo'],
    ['owner/repo', 'owner', 'repo'],
    ['https://github.com/owner/repo.git', 'owner', 'repo'],
    ['git@github.com:owner/repo.git', 'owner', 'repo'],
    ['https://github.com/owner/repo/tree/main/src', 'owner', 'repo'],
  ])('parses %s', (input, owner, repo) => {
    expect(parseGitHubUrl(input)).toEqual({ ok: true, owner, repo });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['https://gitlab.com/owner/repo', 'not-github'],
    ['gitlab.com/owner/repo', 'not-github'],
    ['github.com.evil.test/owner/repo', 'not-github'],
    ['https://github.com/owner', 'incomplete'],
    ['github.com', 'incomplete'],
    ['https://github.com/settings/profile', 'invalid'],
    ['git@example.com:owner/repo.git', 'not-github'],
    ['owner_name/repo', 'invalid'],
    ['https://github.com/owner/repo name', 'invalid'],
  ] as const)('rejects %s as %s', (input, reason) => {
    expect(parseGitHubUrl(input)).toEqual({ ok: false, reason });
  });
});
