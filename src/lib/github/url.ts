const reservedOwners = new Set([
  'about',
  'apps',
  'collections',
  'explore',
  'features',
  'join',
  'login',
  'marketplace',
  'notifications',
  'orgs',
  'pricing',
  'settings',
  'sponsors',
  'topics',
]);

type ParseResult =
  | { ok: true; owner: string; repo: string }
  | { ok: false; reason: 'empty' | 'not-github' | 'incomplete' | 'invalid' };

const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const repoPattern = /^[A-Za-z0-9_.-]+$/;

/**
 * Parses supported GitHub repository URL and shorthand formats.
 *
 * @param value - Repository URL, SSH remote, or owner/repository shorthand.
 * @returns Parsed owner and repository names or a validation failure.
 */
function parseGitHubUrl(value: string): ParseResult {
  const input = value.trim();

  if (!input) {
    return { ok: false, reason: 'empty' };
  }

  const sshMatch = input.match(
    /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/i,
  );
  if (sshMatch) {
    return validateSegments(sshMatch[1], sshMatch[2]);
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      return { ok: false, reason: 'invalid' };
    }

    if (url.hostname.toLowerCase() !== 'github.com') {
      return { ok: false, reason: 'not-github' };
    }

    return parsePath(url.pathname);
  }

  if (/^github\.com(?:\/|$)/i.test(input)) {
    return parsePath(input.slice('github.com'.length).split(/[?#]/, 1)[0]);
  }

  if (input.includes(':') || input.includes('@')) {
    return { ok: false, reason: 'not-github' };
  }

  if (input.split('/')[0].includes('.')) {
    return { ok: false, reason: 'not-github' };
  }

  return parsePath(input);
}

function parsePath(path: string): ParseResult {
  const segments = path.split('/').filter(Boolean);

  if (segments.length < 2) {
    return { ok: false, reason: 'incomplete' };
  }

  return validateSegments(segments[0], segments[1].replace(/\.git$/i, ''));
}

function validateSegments(owner: string, repo: string): ParseResult {
  if (reservedOwners.has(owner.toLowerCase())) {
    return { ok: false, reason: 'invalid' };
  }

  if (
    !ownerPattern.test(owner) ||
    !repoPattern.test(repo) ||
    repo === '.' ||
    repo === '..'
  ) {
    return { ok: false, reason: 'invalid' };
  }

  return { ok: true, owner, repo };
}

export type { ParseResult };
export { parseGitHubUrl };
