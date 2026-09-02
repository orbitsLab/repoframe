import { readStore, writeStore } from '@/lib/storage/db';
import type { ProjectData } from '@/types/data/project';
import type { AspectRatio } from '@/types/template';

/** Persisted state required to restore the active project. */
type StoredProject = {
  version: 2;
  source: { owner: string; repo: string };
  templateId: string;
  ratio: AspectRatio;
  settings: Record<string, unknown>;
  /** Repository data as last loaded, absent in records written before v2. */
  data?: ProjectData;
  savedAt: number;
};

/** Default template state used when a saved template is unavailable. */
type ProjectDefaults = {
  templateId: string;
  settings: Record<string, unknown>;
};

/** Restored project state and whether its template required a fallback. */
type RestoredProject = {
  project: StoredProject;
  templateWasReset: boolean;
};

const projectKey = 'current';
const supportedVersions = [1, 2];
const aspectRatios: AspectRatio[] = ['1:1', '4:5', '16:9', '9:16'];

/**
 * Restores the active project and replaces unavailable templates with defaults.
 *
 * @param defaults - Template state used when the saved template is unavailable.
 * @param knownTemplateIds - Template identifiers available in the current build.
 * @returns The restored project, or undefined when no valid project is stored.
 */
async function readProject(
  defaults: ProjectDefaults,
  knownTemplateIds: readonly string[],
): Promise<RestoredProject | undefined> {
  const stored = await readStore<StoredProject>('project', projectKey);
  if (!stored || !isStoredProject(stored)) {
    return undefined;
  }

  // Records written before v2 carry no repository data, so they restore the
  // design and load the card again.
  const project: StoredProject = { ...stored, version: 2 };

  if (knownTemplateIds.includes(project.templateId)) {
    return { project, templateWasReset: false };
  }

  return {
    project: {
      ...project,
      templateId: defaults.templateId,
      settings: defaults.settings,
    },
    templateWasReset: true,
  };
}

/** @param project - Active project state to persist. */
async function writeProject(project: StoredProject): Promise<void> {
  await writeStore('project', projectKey, project);
}

function isStoredProject(value: StoredProject) {
  return (
    supportedVersions.includes(value.version) &&
    typeof value.source?.owner === 'string' &&
    typeof value.source.repo === 'string' &&
    typeof value.templateId === 'string' &&
    aspectRatios.includes(value.ratio) &&
    typeof value.settings === 'object' &&
    value.settings !== null &&
    !Array.isArray(value.settings) &&
    typeof value.savedAt === 'number'
  );
}

export type { ProjectDefaults, RestoredProject, StoredProject };
export { readProject, writeProject };
