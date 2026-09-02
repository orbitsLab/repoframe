import { beforeEach, describe, expect, it, vi } from 'vitest';

const github = vi.hoisted(() => ({ loadProject: vi.fn() }));
const storage = vi.hoisted(() => ({
  readProject: vi.fn(),
  writeProject: vi.fn(),
}));
const prefs = vi.hoisted(() => ({
  readLastRatio: vi.fn(() => undefined),
  readViewportRatio: vi.fn(() => '16:9'),
  writeLastRatio: vi.fn(),
  readPanelWidths: vi.fn(),
  writePanelWidths: vi.fn(),
}));

vi.mock('@/lib/github/load', () => github);
vi.mock('@/lib/storage/project', () => storage);
vi.mock('@/lib/storage/prefs', () => prefs);

import { useEditorStore } from '@/editor/store';
import { sampleProject } from '@/lib/sampleProject';
import type { StoredProject } from '@/lib/storage/project';
import { templates } from '@/lib/templates/registry';
import type { ProjectData } from '@/types/data/project';

const savedData: ProjectData = {
  ...sampleProject,
  repository: { ...sampleProject.repository, fullName: 'orbitsLab/repoframe' },
};

const savedProject: StoredProject = {
  version: 2,
  source: { owner: 'orbitsLab', repo: 'repoframe' },
  templateId: templates[1].id,
  ratio: '4:5',
  settings: templates[1].defaultSettings,
  data: savedData,
  savedAt: 1_000_000,
};

const rateLimited = {
  ok: false as const,
  error: { kind: 'rate-limited' as const, resetAt: new Date(4_000_000_000) },
  rateLimit: { remaining: 0, resetAt: new Date(4_000_000_000) },
};

const initialState = useEditorStore.getState();

describe('editor store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorStore.setState(initialState, true);
    storage.readProject.mockResolvedValue(undefined);
    github.loadProject.mockResolvedValue(rateLimited);
  });

  it('reports restoring until storage answers', () => {
    storage.readProject.mockReturnValue(new Promise(() => {}));

    void useEditorStore.getState().initialize({});

    expect(useEditorStore.getState().status).toBe('restoring');
  });

  it('shows the saved card before GitHub is requested', async () => {
    storage.readProject.mockResolvedValue({
      project: savedProject,
      templateWasReset: false,
    });
    let dataWhenRequested: ProjectData | undefined;
    github.loadProject.mockImplementation(async () => {
      dataWhenRequested = useEditorStore.getState().projectData;
      return rateLimited;
    });

    await useEditorStore.getState().initialize({});

    expect(dataWhenRequested).toBe(savedData);
  });

  it('keeps the saved card when an imported repository fails to load', async () => {
    storage.readProject.mockResolvedValue({
      project: savedProject,
      templateWasReset: false,
    });

    await useEditorStore.getState().initialize({ repo: 'orbitsLab/www' });

    const state = useEditorStore.getState();
    expect(github.loadProject).toHaveBeenCalledWith(
      'orbitsLab/www',
      expect.anything(),
      undefined,
    );
    expect(state.projectData).toBe(savedData);
    expect(state.source).toEqual(savedProject.source);
    expect(state.status).toBe('error');
    expect(state.error).toEqual(rateLimited.error);
  });

  it('keeps the saved design when a repository is imported from the site', async () => {
    storage.readProject.mockResolvedValue({
      project: savedProject,
      templateWasReset: false,
    });

    await useEditorStore.getState().initialize({ repo: 'orbitsLab/www' });

    expect(useEditorStore.getState().templateId).toBe(savedProject.templateId);
    expect(useEditorStore.getState().ratio).toBe('4:5');
  });

  it('leaves an import alone when storage answers after it', async () => {
    let answerStorage = (_restored: unknown) => {};
    storage.readProject.mockReturnValue(
      new Promise((resolve) => {
        answerStorage = resolve;
      }),
    );
    github.loadProject.mockResolvedValue({
      ok: true,
      data: sampleProject,
      rateLimit: {},
      requestCount: 1,
    });

    const restoring = useEditorStore.getState().initialize({});
    await useEditorStore.getState().importRepository('orbitsLab/www');
    answerStorage({ project: savedProject, templateWasReset: false });
    await restoring;

    expect(github.loadProject).toHaveBeenCalledTimes(1);
    expect(useEditorStore.getState().source).toEqual({
      owner: 'orbitsLab',
      repo: 'www',
    });
  });

  it('starts on the example project only when nothing is stored', async () => {
    await useEditorStore.getState().initialize({});

    const state = useEditorStore.getState();
    expect(state.status).toBe('idle');
    expect(state.source).toBeUndefined();
    expect(state.projectData).toBe(sampleProject);
    expect(github.loadProject).not.toHaveBeenCalled();
  });

  it('persists the card data alongside the project', async () => {
    vi.useFakeTimers();
    github.loadProject.mockResolvedValue({
      ok: true,
      data: savedData,
      rateLimit: { remaining: 59 },
      requestCount: 1,
    });

    await useEditorStore.getState().importRepository('orbitsLab/repoframe');
    await vi.advanceTimersByTimeAsync(400);
    vi.useRealTimers();

    expect(storage.writeProject).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 2,
        data: savedData,
        source: { owner: 'orbitsLab', repo: 'repoframe' },
      }),
    );
  });

  it('drops the restore notice once a template is chosen', async () => {
    storage.readProject.mockResolvedValue({
      project: { ...savedProject, templateId: 'a-template-that-was-removed' },
      templateWasReset: true,
    });

    await useEditorStore.getState().initialize({});
    expect(useEditorStore.getState().notice).toBeDefined();

    useEditorStore.getState().selectTemplate(templates[2].id);

    expect(useEditorStore.getState().notice).toBeUndefined();
  });

  it('refreshes without discarding the cached copy first', async () => {
    useEditorStore.setState({ source: { owner: 'orbitsLab', repo: 'www' } });

    await useEditorStore.getState().refreshRepository();

    expect(github.loadProject).toHaveBeenCalledWith(
      'orbitsLab/www',
      expect.anything(),
      { refresh: true },
    );
  });
});
