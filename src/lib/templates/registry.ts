import { almanacTemplate } from '@/lib/templates/static/almanac';
import { badgeTemplate } from '@/lib/templates/static/badge';
import { bentoTemplate } from '@/lib/templates/static/bento';
import { blueprintTemplate } from '@/lib/templates/static/blueprint';
import { contentsTemplate } from '@/lib/templates/static/contents';
import { coverTemplate } from '@/lib/templates/static/cover';
import { crewTemplate } from '@/lib/templates/static/crew';
import { gridTemplate } from '@/lib/templates/static/grid';
import { marqueeTemplate } from '@/lib/templates/static/marquee';
import { minimalTemplate } from '@/lib/templates/static/minimal';
import { posterTemplate } from '@/lib/templates/static/poster';
import { releaseTemplate } from '@/lib/templates/static/release';
import { showcaseTemplate } from '@/lib/templates/static/showcase';
import { sidebarTemplate } from '@/lib/templates/static/sidebar';
import { signalTemplate } from '@/lib/templates/static/signal';
import { spectrumTemplate } from '@/lib/templates/static/spectrum';
import { splitTemplate } from '@/lib/templates/static/split';
import { stackTemplate } from '@/lib/templates/static/stack';
import { storyTemplate } from '@/lib/templates/static/story';
import { terminalTemplate } from '@/lib/templates/static/terminal';

/** Templates available in the current build. */
const templates = [
  minimalTemplate,
  splitTemplate,
  bentoTemplate,
  releaseTemplate,
  signalTemplate,
  gridTemplate,
  coverTemplate,
  showcaseTemplate,
  blueprintTemplate,
  almanacTemplate,
  terminalTemplate,
  posterTemplate,
  stackTemplate,
  storyTemplate,
  marqueeTemplate,
  sidebarTemplate,
  contentsTemplate,
  crewTemplate,
  spectrumTemplate,
  badgeTemplate,
];
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
