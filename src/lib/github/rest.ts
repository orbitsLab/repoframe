const apiBaseUrl = 'https://api.github.com';

type RateLimit = {
  remaining?: number;
  resetAt?: Date;
};

type GitHubError =
  /** GitHub is refusing requests; `resetAt` is absent when it names no reset. */
  | { kind: 'rate-limited'; resetAt?: Date }
  | { kind: 'not-found' }
  | { kind: 'unavailable' }
  | { kind: 'network' }
  | { kind: 'unexpected'; status: number; message?: string };

type GitHubResult<T> =
  | { ok: true; data: T; rateLimit: RateLimit }
  | { ok: false; error: GitHubError; rateLimit?: RateLimit };

type ResponseReader<T> = (response: Response) => Promise<T>;

/**
 * Executes a GitHub REST request and normalizes errors and rate limits.
 *
 * @param path - API path relative to the GitHub REST base URL.
 * @param read - Optional successful-response parser.
 * @returns Parsed response data or a typed GitHub error.
 */
async function githubRequest<T>(
  path: string,
  read: ResponseReader<T> = (response) => response.json() as Promise<T>,
): Promise<GitHubResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }

  const rateLimit = readRateLimit(response.headers);

  if (!response.ok) {
    return {
      ok: false,
      error: readError(response.status, rateLimit, await readMessage(response)),
      rateLimit,
    };
  }

  try {
    return { ok: true, data: await read(response), rateLimit };
  } catch {
    return { ok: false, error: { kind: 'network' }, rateLimit };
  }
}

function readRateLimit(headers: Headers): RateLimit {
  const remainingHeader = headers.get('x-ratelimit-remaining');
  const resetHeader = headers.get('x-ratelimit-reset');
  const remaining = remainingHeader ? Number(remainingHeader) : undefined;
  const resetSeconds = resetHeader ? Number(resetHeader) : undefined;

  return {
    remaining: Number.isFinite(remaining) ? remaining : undefined,
    resetAt: Number.isFinite(resetSeconds)
      ? new Date((resetSeconds as number) * 1000)
      : undefined,
  };
}

async function readMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: unknown };

    return typeof body.message === 'string' ? body.message : undefined;
  } catch {
    return undefined;
  }
}

function readError(
  status: number,
  rateLimit: RateLimit,
  message?: string,
): GitHubError {
  // A spent quota is visible in the headers, but a secondary limit says so only
  // in the body, and a browser that cannot read the headers has nothing else.
  if (
    (status === 403 || status === 429) &&
    ((rateLimit.remaining === 0 && rateLimit.resetAt) ||
      /rate limit/i.test(message ?? ''))
  ) {
    return { kind: 'rate-limited', resetAt: rateLimit.resetAt };
  }

  if (status === 404) {
    return { kind: 'not-found' };
  }

  if (status === 451) {
    return { kind: 'unavailable' };
  }

  // The message travels with the error: some endpoints answer 403 for reasons
  // a caller can recover from, and the status alone does not say which.
  return { kind: 'unexpected', status, message };
}

/**
 * Reads the final page number from a GitHub pagination Link header.
 *
 * @param header - Link header value, when pagination metadata is present.
 * @returns The final page number, or undefined when no final link exists.
 */
function readLinkLast(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }

  for (const link of header.split(',')) {
    if (!/rel="last"/.test(link)) {
      continue;
    }

    const page = link.match(/[?&]page=(\d+)/)?.[1];
    if (page) {
      return Number(page);
    }
  }

  return undefined;
}

export type { GitHubError, GitHubResult, RateLimit };
export { githubRequest, readLinkLast };
