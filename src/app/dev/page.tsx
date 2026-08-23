'use client';

import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { type LoadProjectResult, loadProject } from '@/lib/github/load';
import { planRequests } from '@/lib/github/plan';
import type { ProjectDataPath } from '@/types/data/path';

const requiredPaths: ProjectDataPath[] = [
  'repository',
  'languages',
  'contributors',
  'metrics.issues',
  'latestRelease',
];

function DevPage() {
  const [url, setUrl] = useState('vuejs/core');
  const [result, setResult] = useState<LoadProjectResult>();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(await loadProject(url, requiredPaths));
    setIsLoading(false);
  }

  const requestCount = result?.ok ? planRequests(requiredPaths).length : 0;
  const remaining = result?.rateLimit?.remaining;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          GitHub data verification
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Loads every Phase 2 data path and prints the normalized result.
        </p>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={handleSubmit}
        >
          <label
            className="flex-1 text-sm font-medium"
            htmlFor="repository-url"
          >
            Repository URL
            <input
              id="repository-url"
              className="mt-2 h-9 w-full rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://github.com/vuejs/core"
              required
            />
          </label>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load project'}
          </Button>
        </form>

        <div className="mt-6 flex gap-6 text-sm" aria-live="polite">
          <p>
            Requests: <strong>{requestCount}</strong>
          </p>
          <p>
            Remaining: <strong>{remaining ?? '—'}</strong>
          </p>
        </div>

        <pre className="mt-4 max-h-[60vh] overflow-auto rounded-lg border bg-muted p-4 text-xs leading-5">
          {result ? JSON.stringify(result, null, 2) : 'No result yet.'}
        </pre>
      </section>
    </main>
  );
}

export default DevPage;
