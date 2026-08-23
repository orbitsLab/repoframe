import { bentoTemplate } from '@/lib/templates/static/bento';
import { minimalTemplate } from '@/lib/templates/static/minimal';
import { terminalTemplate } from '@/lib/templates/static/terminal';

/** Templates available in the current build. */
const templates = [minimalTemplate, terminalTemplate, bentoTemplate];
const templateById = new Map(
  templates.map((template) => [template.id, template]),
);

/**
 * Finds a template by its stable identifier.
 *
 * @param id - Template identifier to resolve.
 * @returns The matching template, or undefined when it is unavailable.
 */
function getTemplate(id: string) {
  return templateById.get(id);
}

export { getTemplate, templates };
