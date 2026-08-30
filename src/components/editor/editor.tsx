'use client';

import {
  ChevronRight,
  GitFork,
  LoaderCircle,
  Palette,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Dialog, Popover } from 'radix-ui';
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ExportPopover } from '@/components/editor/exportPopover';
import {
  clampPanelWidth,
  PanelResizer,
} from '@/components/editor/panelResizer';
import { Preview } from '@/components/editor/preview';
import { SettingsPanel } from '@/components/editor/settingsPanel';
import { TemplatePicker } from '@/components/editor/templatePicker';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { buildEditorScene, getActiveTemplate } from '@/editor/scene';
import { type EditorState, useEditorStore } from '@/editor/store';
import type { LoadProjectError } from '@/lib/github/load';
import type { RateLimit } from '@/lib/github/rest';
import { parseGitHubUrl } from '@/lib/github/url';
import { fontsReady, measureText } from '@/lib/renderer/measure';
import { readPanelWidths, writePanelWidths } from '@/lib/storage/prefs';
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
  const [panelWidths, setPanelWidths] = useState(restorePanelWidths);
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
    const timer = setTimeout(() => writePanelWidths(panelWidths), 300);
    return () => clearTimeout(timer);
  }, [panelWidths]);

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
  // The template thumbnail is a fixed height, so its width carries the ratio.
  const thumbnailWidth = scene
    ? Math.round((40 * scene.width) / scene.height)
    : 40;

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
          className="flex w-full items-center gap-3 border bg-background p-2 text-left outline-none transition-colors hover:border-foreground hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setShowTemplates(true)}
        >
          <span
            className="block h-10 shrink-0 overflow-hidden border bg-muted"
            style={{ width: thumbnailWidth }}
            aria-hidden="true"
          >
            {scene ? (
              <Preview scene={scene} label={template.name} compact />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="editor-eyebrow block text-muted-foreground">
              Template
            </span>
            <span className="mt-1.5 block truncate text-sm font-medium">
              {template.name}
            </span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Change template</span>
        </button>
      </div>
      <SettingsPanel
        template={template}
        settings={state.settings}
        placement="content"
        onChange={state.setSetting}
        onApplyPreset={state.applySettings}
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
        onApplyPreset={state.applySettings}
      />
    </div>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex min-h-16 flex-wrap items-center gap-2 border-b bg-background px-3 py-2 sm:flex-nowrap sm:py-0 lg:px-4">
        <Logo compact className="mr-1 sm:mr-4" />
        {/* The field wraps below the brand and actions until the header has
            room for it, so a narrow screen still shows a full-width box. */}
        <form
          className="order-last flex w-full min-w-0 gap-2 sm:order-none sm:w-auto sm:flex-1 lg:max-w-xl"
          onSubmit={handleImport}
        >
          <div className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor="repository-input">
              GitHub repository
            </label>
            <GitFork
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="repository-input"
              className="h-9 w-full border bg-muted/35 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
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
            size="icon"
            variant="outline"
            disabled={Boolean(inputError) || state.status === 'loading'}
            aria-label="Load repository"
            title="Load repository"
          >
            {state.status === 'loading' ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Search aria-hidden="true" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex"
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
        </form>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <RatioPicker value={state.ratio} onChange={state.setRatio} />
          <MobileRatioPicker value={state.ratio} onChange={state.setRatio} />
          <ExportPopover
            scene={scene}
            source={state.source}
            fullName={state.projectData.repository.fullName}
            templateId={state.templateId}
            ratio={state.ratio}
          />
        </div>
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

      <div
        className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[var(--panel-left)_minmax(0,1fr)_var(--panel-right)]"
        style={
          {
            '--panel-left': `${panelWidths.left}px`,
            '--panel-right': `${panelWidths.right}px`,
          } as CSSProperties
        }
      >
        <aside className="relative hidden min-h-0 border-r bg-sidebar lg:flex">
          {contentPanel}
          <PanelResizer
            value={panelWidths.left}
            side="left"
            label="Resize content panel"
            onChange={(left) =>
              setPanelWidths((widths) => ({ ...widths, left }))
            }
          />
        </aside>

        <section className="flex min-h-0 flex-col bg-muted/45">
          <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden p-3 sm:p-6 lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,var(--muted-foreground)_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.18]"
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

        <aside className="relative hidden min-h-0 border-l bg-sidebar lg:flex">
          <PanelResizer
            value={panelWidths.right}
            side="right"
            label="Resize design panel"
            onChange={(right) =>
              setPanelWidths((widths) => ({ ...widths, right }))
            }
          />
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

/** @returns Saved panel widths clamped to the resizer bounds, or the defaults. */
function restorePanelWidths(): { left: number; right: number } {
  const saved = readPanelWidths();
  if (!saved) {
    return { left: 260, right: 260 };
  }

  return {
    left: clampPanelWidth(saved.left),
    right: clampPanelWidth(saved.right),
  };
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 md:hidden"
        >
          {value}
          <span className="sr-only">Change aspect ratio</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <fieldset className="grid grid-cols-2 gap-1">
            <legend className="sr-only">Aspect ratio</legend>
            {ratios.map((ratio) => (
              <label
                key={ratio}
                className={cn(
                  'grid h-8 cursor-pointer place-items-center px-3 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
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
      <h2 className="editor-eyebrow text-muted-foreground">{title}</h2>
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
    <fieldset className="hidden h-9 items-stretch border md:flex">
      <legend className="sr-only">Aspect ratio</legend>
      {ratios.map((ratio) => (
        <label
          key={ratio}
          className={cn(
            'grid cursor-pointer place-items-center px-2.5 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
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
  const status = [
    state.source ? '' : 'Example project',
    formatRateLimit(state.rateLimit),
  ].filter(Boolean);

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
            {status.join(' · ')}
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
      <span className="hidden sm:inline">Canvas editing comes in v2.</span>
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

/**
 * Formats GitHub quota details for the preview status bar.
 *
 * @param rateLimit - Remaining request count and optional reset time.
 * @returns A quota summary, or an empty string when quota data is unavailable.
 */
function formatRateLimit(rateLimit: RateLimit) {
  if (rateLimit.remaining === undefined) {
    return '';
  }

  const left = `${rateLimit.remaining} / 60 requests left`;

  return rateLimit.resetAt
    ? `${left} · resets in ${formatMinutes(rateLimit.resetAt)}`
    : left;
}

/**
 * Formats the wait until a GitHub rate-limit reset in whole minutes.
 *
 * @param resetAt - Time when GitHub restores the request quota.
 * @returns A duration rounded up to at least one minute.
 */
function formatMinutes(resetAt: Date) {
  const minutes = Math.max(
    1,
    Math.ceil((resetAt.getTime() - Date.now()) / 60_000),
  );

  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function errorMessage(error: LoadProjectError) {
  if (error.kind === 'invalid-url') {
    return 'Enter a public GitHub repository like owner/name.';
  }
  if (error.kind === 'not-found') {
    return 'Repository not found. Repo Frame only works with public repositories.';
  }
  if (error.kind === 'network') {
    return "Can't reach GitHub. Check your connection and try again.";
  }
  if (error.kind === 'rate-limited') {
    return `You've used your 60 GitHub requests for this hour. Resets in ${formatMinutes(error.resetAt)}. You can keep editing the current card.`;
  }
  if (error.kind === 'unavailable') {
    return 'This repository is unavailable from GitHub.';
  }
  return `GitHub returned an unexpected ${error.status} response. Try again.`;
}

export { Editor };
