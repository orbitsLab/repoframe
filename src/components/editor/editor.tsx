'use client';

import {
  GitFork,
  LayoutTemplate,
  Palette,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Dialog, Popover } from 'radix-ui';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ExportPopover } from '@/components/editor/exportPopover';
import { Preview } from '@/components/editor/preview';
import { SettingsPanel } from '@/components/editor/settingsPanel';
import { TemplatePicker } from '@/components/editor/templatePicker';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { buildEditorScene, getActiveTemplate } from '@/editor/scene';
import { type EditorState, useEditorStore } from '@/editor/store';
import type { LoadProjectError } from '@/lib/github/load';
import { parseGitHubUrl } from '@/lib/github/url';
import { fontsReady, measureText } from '@/lib/renderer/measure';
import { cn } from '@/lib/utils';
import type { ProjectData } from '@/types/data/project';
import type { AspectRatio } from '@/types/template';

type EditorProps = {
  repo?: string;
  templateId?: string;
};

const ratios: AspectRatio[] = ['1:1', '4:5', '16:9', '9:16'];

/**
 * Renders the responsive editor and initializes it from route parameters.
 *
 * @param props - Optional repository and template values from the application URL.
 */
function Editor({ repo, templateId }: EditorProps) {
  const state = useEditorStore();
  const initialized = useRef(false);
  const [repoInput, setRepoInput] = useState(repo ?? '');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const template = getActiveTemplate(state.templateId);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;
    void state.initialize({ repo, templateId });
  }, [repo, state, templateId]);

  useEffect(() => {
    void fontsReady.then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (state.source) {
      setRepoInput(`${state.source.owner}/${state.source.repo}`);
    }
  }, [state.source]);

  const scene = useMemo(
    () =>
      fontsLoaded
        ? buildEditorScene(
            state.projectData,
            state.templateId,
            state.ratio,
            state.settings,
            measureText,
          )
        : undefined,
    [
      fontsLoaded,
      state.projectData,
      state.ratio,
      state.settings,
      state.templateId,
    ],
  );
  const inputError = useMemo(() => {
    if (!repoInput.trim()) {
      return undefined;
    }
    return parseGitHubUrl(repoInput).ok
      ? undefined
      : 'Enter a public GitHub repository like owner/name.';
  }, [repoInput]);
  const previewLabel = buildPreviewLabel(state.projectData, state.settings);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inputError || !repoInput.trim()) {
      return;
    }
    await state.importRepository(repoInput);
  }

  const contentPanel = showTemplates ? (
    <TemplatePicker
      data={state.projectData}
      settings={state.settings}
      selectedId={state.templateId}
      onBack={() => setShowTemplates(false)}
      onSelect={(id) => {
        state.selectTemplate(id);
        setShowTemplates(false);
      }}
    />
  ) : (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeading title="Content" />
      <div className="border-b p-3">
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-lg border bg-background p-2 text-left text-sm shadow-xs outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setShowTemplates(true)}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-md border bg-muted">
            <LayoutTemplate
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">
              Active template
            </span>
            <span className="block truncate font-medium">{template.name}</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground group-hover:text-foreground">
            Change
          </span>
        </button>
      </div>
      <SettingsPanel
        template={template}
        settings={state.settings}
        placement="content"
        onChange={state.setSetting}
      />
    </div>
  );

  const designPanel = (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsPanel
        template={template}
        settings={state.settings}
        placement="design"
        onChange={state.setSetting}
      />
    </div>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex min-h-16 items-center gap-2 border-b bg-background px-3 lg:px-4">
        <Logo compact className="mr-1 sm:hidden" />
        <Logo className="mr-4 hidden sm:inline-flex" />
        <form
          className="flex min-w-0 flex-1 gap-2 lg:max-w-xl"
          onSubmit={handleImport}
        >
          <div className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor="repository-input">
              GitHub repository
            </label>
            <GitFork
              className="absolute left-3 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground sm:block"
              aria-hidden="true"
            />
            <input
              id="repository-input"
              className="h-9 w-full rounded-md border bg-muted/35 px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring sm:pl-9"
              value={repoInput}
              onChange={(event) => setRepoInput(event.target.value)}
              placeholder="owner/repository"
              aria-invalid={Boolean(inputError)}
              aria-describedby={
                inputError ? 'repository-input-error' : undefined
              }
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={Boolean(inputError) || state.status === 'loading'}
          >
            {state.status === 'loading' ? (
              'Loading…'
            ) : (
              <>
                <span className="hidden sm:inline">Load repository</span>
                <span className="sm:hidden">Load</span>
              </>
            )}
          </Button>
        </form>

        <div className="hidden flex-1 lg:block" />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={state.refreshRepository}
          disabled={!state.source || state.status === 'loading'}
          aria-label="Refresh repository data"
          title="Refresh repository data"
        >
          <RefreshCw
            className={cn(state.status === 'loading' && 'animate-spin')}
            aria-hidden="true"
          />
        </Button>
        <RatioPicker value={state.ratio} onChange={state.setRatio} />
        <MobileRatioPicker value={state.ratio} onChange={state.setRatio} />
        <ExportPopover
          scene={scene}
          source={state.source}
          fullName={state.projectData.repository.fullName}
          templateId={state.templateId}
          ratio={state.ratio}
        />
      </header>

      <p
        id="repository-input-error"
        className={cn(
          'border-b px-4 py-1.5 text-xs text-destructive',
          !inputError && 'sr-only',
        )}
        aria-live="polite"
      >
        {inputError}
      </p>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[16.25rem_minmax(0,1fr)_16.25rem]">
        <aside className="hidden min-h-0 border-r bg-sidebar lg:flex">
          {contentPanel}
        </aside>

        <section className="flex min-h-0 flex-col bg-muted/45">
          <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden p-3 sm:p-6 lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:20px_20px]"
              aria-hidden="true"
            />
            {scene ? (
              <div className="relative z-10 grid size-full place-items-center">
                {!state.source ? (
                  <span className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-full border bg-background/95 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground shadow-xs backdrop-blur-sm sm:top-1">
                    Example preview
                  </span>
                ) : null}
                <div
                  className="relative max-h-full max-w-full overflow-hidden rounded-xl border bg-card shadow-lg ring-1 ring-foreground/5"
                  style={{
                    aspectRatio: `${scene.width} / ${scene.height}`,
                    width: `min(100%, calc((100dvh - 12rem) * ${scene.width / scene.height}))`,
                  }}
                >
                  <Preview scene={scene} label={previewLabel} />
                </div>
              </div>
            ) : (
              <div className="relative z-10 aspect-video w-full max-w-4xl animate-pulse rounded-xl border bg-card shadow-lg" />
            )}
          </div>
          <PreviewStatus
            state={state}
            onRetry={() => state.importRepository(repoInput)}
            onClear={() => {
              setRepoInput('');
              state.clearError();
            }}
            onTryExample={() => {
              setRepoInput('alfaarghya/alfa-leetcode-api');
              void state.importRepository('alfaarghya/alfa-leetcode-api');
            }}
          />
        </section>

        <aside className="hidden min-h-0 border-l bg-sidebar lg:flex">
          {designPanel}
        </aside>
      </div>

      <div className="grid h-14 grid-cols-2 gap-2 border-t bg-card p-2 lg:hidden">
        <MobileSheet label="Content" icon={SlidersHorizontal}>
          {contentPanel}
        </MobileSheet>
        <MobileSheet label="Design" icon={Palette}>
          {designPanel}
        </MobileSheet>
      </div>
    </main>
  );
}

function MobileRatioPicker({
  value,
  onChange,
}: {
  value: AspectRatio;
  onChange(ratio: AspectRatio): void;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button type="button" size="sm" variant="outline" className="md:hidden">
          {value}
          <span className="sr-only">Change aspect ratio</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <fieldset className="grid grid-cols-2 gap-1">
            <legend className="sr-only">Aspect ratio</legend>
            {ratios.map((ratio) => (
              <label
                key={ratio}
                className={cn(
                  'grid h-8 cursor-pointer place-items-center rounded px-3 text-xs font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  value === ratio
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="mobile-ratio"
                  value={ratio}
                  checked={value === ratio}
                  onChange={() => onChange(ratio)}
                />
                {ratio}
              </label>
            ))}
          </fieldset>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function PanelHeading({ title }: { title: string }) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b px-4">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
    </div>
  );
}

function RatioPicker({
  value,
  onChange,
}: {
  value: AspectRatio;
  onChange(ratio: AspectRatio): void;
}) {
  return (
    <fieldset className="hidden items-center rounded-md border p-0.5 md:flex">
      <legend className="sr-only">Aspect ratio</legend>
      {ratios.map((ratio) => (
        <label
          key={ratio}
          className={cn(
            'grid h-7 cursor-pointer place-items-center rounded px-2 text-xs font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
            value === ratio
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name="ratio"
            value={ratio}
            checked={value === ratio}
            onChange={() => onChange(ratio)}
          />
          {ratio}
        </label>
      ))}
    </fieldset>
  );
}

function PreviewStatus({
  state,
  onRetry,
  onClear,
  onTryExample,
}: {
  state: EditorState;
  onRetry(): void;
  onClear(): void;
  onTryExample(): void;
}) {
  const error = state.error ? errorMessage(state.error) : undefined;
  const cache = formatCacheAge(state.cacheAge);

  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t bg-background/95 px-4 py-2 text-[11px] text-muted-foreground">
      <div aria-live="polite">
        {error ? (
          <ErrorStatus
            error={state.error}
            message={error}
            onRetry={onRetry}
            onClear={onClear}
          />
        ) : null}
        {!error && state.notice ? <span>{state.notice}</span> : null}
        {!error && !state.notice ? (
          <span>
            {state.source ? cache : 'Example project'}
            {state.rateLimit.remaining !== undefined
              ? ` · ${state.rateLimit.remaining} / 60 requests left`
              : ''}
            {!state.source ? (
              <>
                {' · '}
                <StatusAction onClick={onTryExample}>
                  Try alfaarghya/alfa-leetcode-api
                </StatusAction>
              </>
            ) : null}
          </span>
        ) : null}
      </div>
      <span>Canvas editing comes in v2.</span>
    </div>
  );
}

function ErrorStatus({
  error,
  message,
  onRetry,
  onClear,
}: {
  error?: LoadProjectError;
  message: string;
  onRetry(): void;
  onClear(): void;
}) {
  const canRetry =
    error?.kind === 'network' ||
    error?.kind === 'unavailable' ||
    error?.kind === 'unexpected';
  const canClear = error?.kind === 'invalid-url' || error?.kind === 'not-found';

  return (
    <span className="text-destructive">
      {message}{' '}
      {canRetry ? <StatusAction onClick={onRetry}>Retry</StatusAction> : null}
      {canClear ? (
        <StatusAction onClick={onClear}>Clear input</StatusAction>
      ) : null}
    </span>
  );
}

function StatusAction({
  onClick,
  children,
}: {
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MobileSheet({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Palette;
  children: ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button type="button" variant="outline" className="h-full">
          <Icon aria-hidden="true" />
          {label}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background outline-none sm:left-auto sm:w-96 sm:border-l">
          <Dialog.Title className="sr-only">{label} settings</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10"
              aria-label={`Close ${label.toLowerCase()} settings`}
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function buildPreviewLabel(
  data: ProjectData,
  settings: Record<string, unknown>,
) {
  const metrics = Array.isArray(settings.metrics) ? settings.metrics : [];
  const values: Record<string, string> = {
    stars: `${data.metrics.stars} stars`,
    forks: `${data.metrics.forks} forks`,
    watchers: `${data.metrics.watchers} watchers`,
    issues: `${data.metrics.issues ?? 0} open issues`,
    pullRequests: `${data.metrics.pullRequests ?? 0} open pull requests`,
  };
  const visibleMetrics = metrics
    .filter((metric): metric is string => typeof metric === 'string')
    .map((metric) => values[metric])
    .filter(Boolean)
    .join(', ');

  return `${data.repository.fullName}. ${data.repository.description ?? 'No description.'}${visibleMetrics ? ` ${visibleMetrics}.` : ''}`;
}

function formatCacheAge(cacheAge?: number) {
  if (cacheAge === undefined) {
    return 'Fresh repository data';
  }

  const minutes = Math.max(1, Math.floor(cacheAge / 60_000));
  return `Cached ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
}

function errorMessage(error: LoadProjectError) {
  if (error.kind === 'invalid-url') {
    return 'Enter a public GitHub repository like owner/name.';
  }
  if (error.kind === 'not-found') {
    return 'Repository not found. RepoFrame only works with public repositories.';
  }
  if (error.kind === 'network') {
    return "Can't reach GitHub. Check your connection and try again.";
  }
  if (error.kind === 'rate-limited') {
    const minutes = Math.max(
      1,
      Math.ceil((error.resetAt.getTime() - Date.now()) / 60_000),
    );
    return `You've used your 60 GitHub requests for this hour. Resets in ${minutes} minute${minutes === 1 ? '' : 's'}. You can keep editing the current card.`;
  }
  if (error.kind === 'unavailable') {
    return 'This repository is unavailable from GitHub.';
  }
  return `GitHub returned an unexpected ${error.status} response. Try again.`;
}

export { Editor };
