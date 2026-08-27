import { readStore, writeStore } from '@/lib/storage/db';
import type { AspectRatio } from '@/types/template';

/** Persisted state required to restore the active project. */
type StoredProject = {
  version: 1;
  source: { owner: string; repo: string };
  templateId: string;
  ratio: AspectRatio;
  settings: Record<string, unknown>;
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
  const project = await readStore<StoredProject>('project', projectKey);
  if (!project || !isStoredProject(project)) {
    return undefined;
  }

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
    value.version === 1 &&
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
