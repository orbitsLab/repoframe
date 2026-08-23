import { create } from 'zustand';

import { getActiveTemplate, settingsForTemplate } from '@/editor/scene';
import { type LoadProjectError, loadProject } from '@/lib/github/load';
import type { RateLimit } from '@/lib/github/rest';
import { parseGitHubUrl } from '@/lib/github/url';
import { sampleProject } from '@/lib/sampleProject';
import { readLastRatio, writeLastRatio } from '@/lib/storage/prefs';
import {
  readProject,
  type StoredProject,
  writeProject,
} from '@/lib/storage/project';
import { clearCachedRepo } from '@/lib/storage/repoCache';
import { getTemplate, templates } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';
import type { AspectRatio } from '@/types/template';

/** Repository loading states exposed by the editor. */
type EditorStatus = 'idle' | 'loading' | 'ready' | 'error';

/** GitHub owner and repository currently loaded in the editor. */
type RepositorySource = { owner: string; repo: string };

type InitializeInput = {
  repo?: string;
  templateId?: string;
};

/** Editor state and actions shared by the responsive application shell. */
type EditorState = {
  projectData: ProjectData;
  templateId: string;
  ratio: AspectRatio;
  settings: Record<string, unknown>;
  status: EditorStatus;
  rateLimit: RateLimit;
  source?: RepositorySource;
  cacheAge?: number;
  requestCount: number;
  error?: LoadProjectError;
  notice?: string;
  /** Restores persisted state or loads repository parameters from the URL. */
  initialize(input: InitializeInput): Promise<void>;
  /** Loads a public GitHub repository into the active template. */
  importRepository(url: string): Promise<void>;
  /** Clears cached repository data and requests it again. */
  refreshRepository(): Promise<void>;
  /** Selects a template and fetches newly required project data. */
  selectTemplate(templateId: string): void;
  /** Updates and persists the output aspect ratio. */
  setRatio(ratio: AspectRatio): void;
  /** Updates a template setting and fetches newly required project data. */
  setSetting(key: string, value: unknown): void;
  /** Clears the current loading error. */
  clearError(): void;
};

const defaultTemplate = templates[0];
let persistTimer: ReturnType<typeof setTimeout> | undefined;
let latestLoad = 0;

/** Zustand store containing the active RepoFrame editor session. */
const useEditorStore = create<EditorState>((set, get) => ({
  projectData: sampleProject,
  templateId: defaultTemplate.id,
  ratio: '16:9',
  settings: defaultTemplate.defaultSettings,
  status: 'idle',
  rateLimit: {},
  requestCount: 0,

  async initialize(input) {
    const requestedTemplate = input.templateId
      ? getTemplate(input.templateId)
      : undefined;

    if (input.repo) {
      if (requestedTemplate) {
        set({
          templateId: requestedTemplate.id,
          settings: requestedTemplate.defaultSettings,
        });
      }
      await get().importRepository(input.repo);
      return;
    }

    const restored = await readProject(
      {
        templateId: defaultTemplate.id,
        settings: defaultTemplate.defaultSettings,
      },
      templates.map((template) => template.id),
    );

    if (!restored) {
      const ratio = readLastRatio() ?? get().ratio;
      set({
        ratio,
        templateId: requestedTemplate?.id ?? get().templateId,
        settings: requestedTemplate?.defaultSettings ?? get().settings,
      });
      return;
    }

    const template =
      requestedTemplate ?? getActiveTemplate(restored.project.templateId);
    set({
      templateId: template.id,
      ratio: restored.project.ratio,
      settings: settingsForTemplate(template, restored.project.settings),
      notice: restored.templateWasReset
        ? 'The saved template is unavailable, so RepoFrame selected Minimal.'
        : undefined,
    });
    await loadRepository(
      `${restored.project.source.owner}/${restored.project.source.repo}`,
      set,
      get,
    );
  },

  async importRepository(url) {
    await loadRepository(url, set, get);
  },

  async refreshRepository() {
    const source = get().source;
    if (!source) {
      return;
    }

    await clearCachedRepo(source.owner, source.repo);
    await loadRepository(`${source.owner}/${source.repo}`, set, get);
  },

  selectTemplate(templateId) {
    const template = getActiveTemplate(templateId);
    const state = get();
    const previousTemplate = getActiveTemplate(state.templateId);
    const settings = settingsForTemplate(template, state.settings);
    const addedPaths = template
      .requiredData(settings)
      .filter(
        (path) => !previousTemplate.requiredData(state.settings).includes(path),
      );

    set({ templateId: template.id, settings });
    schedulePersistence(get);

    if (addedPaths.length > 0 && state.source) {
      void loadRepository(
        `${state.source.owner}/${state.source.repo}`,
        set,
        get,
      );
    }
  },

  setRatio(ratio) {
    set({ ratio });
    writeLastRatio(ratio);
    schedulePersistence(get);
  },

  setSetting(key, value) {
    const state = get();
    const template = getActiveTemplate(state.templateId);
    const previousRequired = template.requiredData(state.settings);
    const settings = { ...state.settings, [key]: value };
    const addedPaths = template
      .requiredData(settings)
      .filter((path) => !previousRequired.includes(path));

    set({ settings });
    schedulePersistence(get);

    if (addedPaths.length > 0 && state.source) {
      void loadRepository(
        `${state.source.owner}/${state.source.repo}`,
        set,
        get,
      );
    }
  },

  clearError() {
    set({ error: undefined, status: get().source ? 'ready' : 'idle' });
  },
}));

async function loadRepository(
  url: string,
  set: (state: Partial<EditorState>) => void,
  get: () => EditorState,
) {
  const loadId = ++latestLoad;
  const state = get();
  const template = getActiveTemplate(state.templateId);
  set({ status: 'loading', error: undefined, notice: undefined });

  const result = await loadProject(url, template.requiredData(state.settings));
  if (loadId !== latestLoad) {
    return;
  }

  if (!result.ok) {
    const current = get();
    set({
      status: 'error',
      error: result.error,
      rateLimit: mergeRateLimit(current.rateLimit, result.rateLimit),
    });
    return;
  }

  const parsed = parseGitHubUrl(url);
  if (!parsed.ok) {
    return;
  }

  const source = { owner: parsed.owner, repo: parsed.repo };
  const current = get();
  set({
    projectData: result.data,
    source,
    status: 'ready',
    rateLimit: mergeRateLimit(current.rateLimit, result.rateLimit),
    cacheAge: result.cacheAge,
    requestCount: result.requestCount,
    error: undefined,
  });
  schedulePersistence(get);
}

function mergeRateLimit(current: RateLimit, next?: RateLimit): RateLimit {
  return {
    remaining: next?.remaining ?? current.remaining,
    resetAt: next?.resetAt ?? current.resetAt,
  };
}

function schedulePersistence(get: () => EditorState) {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    const state = get();
    if (!state.source) {
      return;
    }

    const project: StoredProject = {
      version: 1,
      source: state.source,
      templateId: state.templateId,
      ratio: state.ratio,
      settings: state.settings,
      savedAt: Date.now(),
    };
    void writeProject(project);
  }, 300);
}

export type { EditorState, EditorStatus, RepositorySource };
export { useEditorStore };
