import { describe, expect, it } from 'vitest';

import { matrixNodes } from '@/lib/templates/shared/matrix';

const box = { x: 0, y: 0, width: 600, height: 200 };

describe('matrixNodes', () => {
  it('draws the same dot positions whatever the count reads', () => {
    const ids = (text: string) =>
      matrixNodes('hero', text, box, { color: '#000' }).map((node) => node.id);

    expect(ids('0')).toEqual(ids('12.3K'));
  });

  it('lights only the dots the glyphs call for', () => {
    const lit = matrixNodes('hero', '1', box, { color: '#000' }).filter(
      (node) => node.opacity === 1,
    );

    expect(lit.length).toBe(10);
  });

  it('keeps the figure inside the box it was given', () => {
    const nodes = matrixNodes('hero', '817', box, {
      color: '#000',
      gapRatio: 0.5,
    });

    for (const node of nodes) {
      expect(node.x + node.width).toBeLessThanOrEqual(box.width + 0.001);
      expect(node.y + node.height).toBeLessThanOrEqual(box.height + 0.001);
    }
  });

  it('pads a right-aligned figure on its leading side', () => {
    const nodes = matrixNodes('hero', '8', box, {
      color: '#000',
      align: 'right',
    });
    const leading = nodes.filter((node) => node.id.startsWith('hero-dot-1-'));

    expect(leading.every((node) => node.opacity === 0)).toBe(true);
  });
});
