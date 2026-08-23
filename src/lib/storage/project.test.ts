import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  deleteStore: vi.fn(),
  readStore: vi.fn(),
  writeStore: vi.fn(),
}));

vi.mock('@/lib/storage/db', () => database);

import { readProject, type StoredProject } from '@/lib/storage/project';

const storedProject: StoredProject = {
  version: 1,
  source: { owner: 'vuejs', repo: 'core' },
  templateId: 'minimal',
  ratio: '16:9',
  settings: { accent: '#42b883' },
  savedAt: 1_000_000,
};

describe('stored project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores a known template unchanged', async () => {
    database.readStore.mockResolvedValue(storedProject);

    await expect(
      readProject({ templateId: 'minimal', settings: { accent: '#000000' } }, [
        'minimal',
      ]),
    ).resolves.toEqual({ project: storedProject, templateWasReset: false });
  });

  it('resets an unknown template and its settings', async () => {
    database.readStore.mockResolvedValue({
      ...storedProject,
      templateId: 'removed-template',
    });

    const restored = await readProject(
      { templateId: 'minimal', settings: { accent: '#000000' } },
      ['minimal'],
    );

    expect(restored).toEqual({
      project: {
        ...storedProject,
        templateId: 'minimal',
        settings: { accent: '#000000' },
      },
      templateWasReset: true,
    });
  });

  it('ignores records from unsupported versions', async () => {
    database.readStore.mockResolvedValue({ ...storedProject, version: 2 });

    await expect(
      readProject({ templateId: 'minimal', settings: {} }, ['minimal']),
    ).resolves.toBeUndefined();
  });
});
