'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { type LoadProjectResult, loadProject } from '@/lib/github/load';
import { parseGitHubUrl } from '@/lib/github/url';
import {
  readProject,
  type StoredProject,
  writeProject,
} from '@/lib/storage/project';
import { clearCachedRepo } from '@/lib/storage/repoCache';
import type { ProjectDataPath } from '@/types/data/path';

const basePaths: ProjectDataPath[] = [
  'repository',
  'languages',
  'metrics.issues',
  'latestRelease',
];

function DevPage() {
  const [url, setUrl] = useState('vuejs/core');
  const [includeContributors, setIncludeContributors] = useState(false);
  const [result, setResult] = useState<LoadProjectResult>();
  const [isLoading, setIsLoading] = useState(false);
  const [projectMessage, setProjectMessage] = useState('No saved project.');

  const runLoad = useCallback(
    async (repositoryUrl: string, contributors: boolean) => {
      setIsLoading(true);
      const loaded = await loadProject(
        repositoryUrl,
        getRequiredPaths(contributors),
      );
      setResult(loaded);

      const parsed = parseGitHubUrl(repositoryUrl);
      if (loaded.ok && parsed.ok) {
        await writeProject(createStoredProject(parsed, contributors, 'dev'));
        setProjectMessage('Project saved.');
      }

      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    async function restoreProject() {
      const restored = await readProject(
        { templateId: 'dev', settings: { includeContributors: false } },
        ['dev'],
      );

      if (!restored) {
        return;
      }

      const restoredUrl = `${restored.project.source.owner}/${restored.project.source.repo}`;
      const restoredContributors =
        restored.project.settings.includeContributors === true;

      setUrl(restoredUrl);
      setIncludeContributors(restoredContributors);
      await runLoad(restoredUrl, restoredContributors);
      setProjectMessage(
        restored.templateWasReset
          ? 'Unknown template reset to the default.'
          : 'Saved project restored.',
      );
    }

    void restoreProject();
  }, [runLoad]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runLoad(url, includeContributors);
  }

  async function handleRefresh() {
    const parsed = parseGitHubUrl(url);
    if (!parsed.ok) {
      return;
    }

    await clearCachedRepo(parsed.owner, parsed.repo);
    await runLoad(url, includeContributors);
  }

  async function handleUnknownTemplate() {
    const parsed = parseGitHubUrl(url);
    if (!parsed.ok) {
      return;
    }

    await writeProject(
      createStoredProject(parsed, includeContributors, 'removed-template'),
    );
    setProjectMessage('Unknown template saved. Reload to verify fallback.');
  }

  const requestCount = result?.ok ? result.requestCount : 0;
  const remaining = result?.rateLimit?.remaining;
  const cacheAge = result?.ok ? result.cacheAge : undefined;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          GitHub data verification
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Loads Phase 2 data through the Phase 3 cache and prints the result.
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

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeContributors}
            onChange={(event) => setIncludeContributors(event.target.checked)}
          />
          Include contributors
        </label>

        <div
          className="mt-6 flex flex-wrap items-center gap-4 text-sm"
          aria-live="polite"
        >
          <p>
            Requests: <strong>{requestCount}</strong>
          </p>
          <p>
            Remaining: <strong>{remaining ?? '—'}</strong>
          </p>
          <p>
            Cache age:{' '}
            <strong>
              {cacheAge === undefined
                ? 'fresh'
                : `${Math.floor(cacheAge / 1000)}s`}
            </strong>
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleUnknownTemplate}
          >
            Save unknown template
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{projectMessage}</p>

        <pre className="mt-4 max-h-[60vh] overflow-auto rounded-lg border bg-muted p-4 text-xs leading-5">
          {result ? JSON.stringify(result, null, 2) : 'No result yet.'}
        </pre>
      </section>
    </main>
  );
}

function getRequiredPaths(includeContributors: boolean) {
  return includeContributors
    ? ([...basePaths, 'contributors'] as ProjectDataPath[])
    : basePaths;
}

function createStoredProject(
  source: { owner: string; repo: string },
  includeContributors: boolean,
  templateId: string,
): StoredProject {
  return {
    version: 1,
    source,
    templateId,
    ratio: '16:9',
    settings: { includeContributors },
    savedAt: Date.now(),
  };
}

export default DevPage;
