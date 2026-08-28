import { almanacTemplate } from '@/lib/templates/static/almanac';
import { badgeTemplate } from '@/lib/templates/static/badge';
import { bentoTemplate } from '@/lib/templates/static/bento';
import { blueprintTemplate } from '@/lib/templates/static/blueprint';
import { commonsTemplate } from '@/lib/templates/static/commons';
import { contentsTemplate } from '@/lib/templates/static/contents';
import { coverTemplate } from '@/lib/templates/static/cover';
import { crewTemplate } from '@/lib/templates/static/crew';
import { digestTemplate } from '@/lib/templates/static/digest';
import { gaugeTemplate } from '@/lib/templates/static/gauge';
import { gridTemplate } from '@/lib/templates/static/grid';
import { horizonTemplate } from '@/lib/templates/static/horizon';
import { marqueeTemplate } from '@/lib/templates/static/marquee';
import { minimalTemplate } from '@/lib/templates/static/minimal';
import { posterTemplate } from '@/lib/templates/static/poster';
import { printoutTemplate } from '@/lib/templates/static/printout';
import { readoutTemplate } from '@/lib/templates/static/readout';
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
  readoutTemplate,
  gaugeTemplate,
  printoutTemplate,
  crewTemplate,
  commonsTemplate,
  spectrumTemplate,
  horizonTemplate,
  digestTemplate,
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
