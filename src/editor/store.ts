import { create } from 'zustand';

import { getActiveTemplate, settingsForTemplate } from '@/editor/scene';
import {
  type LoadProjectError,
  type LoadProjectOptions,
  loadProject,
} from '@/lib/github/load';
import type { RateLimit } from '@/lib/github/rest';
import { parseGitHubUrl } from '@/lib/github/url';
import { sampleProject } from '@/lib/sampleProject';
import {
  readLastRatio,
  readViewportRatio,
  writeLastRatio,
} from '@/lib/storage/prefs';
import {
  type RestoredProject,
  readProject,
  type StoredProject,
  writeProject,
} from '@/lib/storage/project';
import { getTemplate, templates } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';
import type { AspectRatio, Template } from '@/types/template';

/** Repository loading states exposed by the editor. */
type EditorStatus = 'restoring' | 'idle' | 'loading' | 'ready' | 'error';

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
  /** Requests repository data again, ignoring the cached copy. */
  refreshRepository(): Promise<void>;
  /** Selects a template and fetches newly required project data. */
  selectTemplate(templateId: string): void;
  /** Updates and persists the output aspect ratio. */
  setRatio(ratio: AspectRatio): void;
  /** Updates a template setting and fetches newly required project data. */
  setSetting(key: string, value: unknown): void;
  /** Applies several template settings at once, such as a colour preset. */
  applySettings(patch: Record<string, unknown>): void;
  /** Clears the current loading error. */
  clearError(): void;
};

const defaultTemplate = templates[0];
let persistTimer: ReturnType<typeof setTimeout> | undefined;
let latestLoad = 0;

/** Zustand store containing the active Repo Frame editor session. */
const useEditorStore = create<EditorState>((set, get) => ({
  projectData: sampleProject,
  templateId: defaultTemplate.id,
  ratio: '16:9',
  settings: defaultTemplate.defaultSettings,
  status: 'restoring',
  rateLimit: {},
  requestCount: 0,

  async initialize(input) {
    const loadsBeforeRestore = latestLoad;
    const requestedTemplate = input.templateId
      ? getTemplate(input.templateId)
      : undefined;
    const restored = await readProject(
      {
        templateId: defaultTemplate.id,
        settings: defaultTemplate.defaultSettings,
      },
      templates.map((template) => template.id),
    );
    // Storage can answer after an impatient reader has already imported
    // something, and their repository outranks the saved one.
    if (latestLoad !== loadsBeforeRestore) {
      return;
    }

    const saved = restored?.project.source;
    const target = input.repo ?? (saved && `${saved.owner}/${saved.repo}`);

    set(
      restored
        ? restoredState(restored, requestedTemplate, get())
        : freshState(requestedTemplate, get(), Boolean(target)),
    );

    if (target) {
      await loadRepository(target, set, get);
    }
  },

  async importRepository(url) {
    await loadRepository(url, set, get);
  },

  async refreshRepository() {
    const source = get().source;
    if (!source) {
      return;
    }

    await loadRepository(`${source.owner}/${source.repo}`, set, get, {
      refresh: true,
    });
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

    // Choosing a template answers the notice that a saved one was unavailable.
    set({ templateId: template.id, settings, notice: undefined });
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
    get().applySettings({ [key]: value });
  },

  applySettings(patch) {
    const state = get();
    const template = getActiveTemplate(state.templateId);
    const previousRequired = template.requiredData(state.settings);
    const settings = { ...state.settings, ...patch };
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

/**
 * Builds the state that puts a saved project back on screen before any request.
 *
 * @param restored - Project read from storage.
 * @param requestedTemplate - Template named by the application URL, when valid.
 * @param current - Current editor state.
 * @returns The state patch restoring the saved card and design.
 */
function restoredState(
  restored: RestoredProject,
  requestedTemplate: Template | undefined,
  current: EditorState,
): Partial<EditorState> {
  const project = restored.project;
  const template = requestedTemplate ?? getActiveTemplate(project.templateId);

  return {
    templateId: template.id,
    ratio: project.ratio,
    settings: settingsForTemplate(
      template,
      requestedTemplate ? template.defaultSettings : project.settings,
    ),
    // Records written before v2 hold no card, so the example stands in until
    // the repository loads.
    projectData: project.data ?? current.projectData,
    source: project.data ? project.source : undefined,
    status: 'loading',
    notice: restored.templateWasReset
      ? 'The saved template is unavailable, so Repo Frame selected Minimal.'
      : undefined,
  };
}

/**
 * Builds the opening state for a visitor with no saved project.
 *
 * @param requestedTemplate - Template named by the application URL, when valid.
 * @param current - Current editor state.
 * @param loading - Whether a repository request follows immediately.
 * @returns The state patch opening the editor on the example project.
 */
function freshState(
  requestedTemplate: Template | undefined,
  current: EditorState,
  loading: boolean,
): Partial<EditorState> {
  return {
    ratio: readLastRatio() ?? readViewportRatio(),
    templateId: requestedTemplate?.id ?? current.templateId,
    settings: requestedTemplate?.defaultSettings ?? current.settings,
    status: loading ? 'loading' : 'idle',
  };
}

async function loadRepository(
  url: string,
  set: (state: Partial<EditorState>) => void,
  get: () => EditorState,
  options?: LoadProjectOptions,
) {
  const loadId = ++latestLoad;
  const state = get();
  const template = getActiveTemplate(state.templateId);
  set({ status: 'loading', error: undefined });

  const result = await loadProject(
    url,
    template.requiredData(state.settings),
    options,
  );
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
      version: 2,
      source: state.source,
      templateId: state.templateId,
      ratio: state.ratio,
      settings: state.settings,
      data: state.projectData,
      savedAt: Date.now(),
    };
    void writeProject(project);
  }, 300);
}

export type { EditorState, EditorStatus, RepositorySource };
export { useEditorStore };
