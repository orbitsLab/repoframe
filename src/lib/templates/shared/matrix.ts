import type { Box } from '@/lib/templates/shared/layout';
import type { SceneNode } from '@/types/scene';

/** Columns in one glyph's dot grid. */
const glyphColumns = 5;

/** Rows in one glyph's dot grid. */
const glyphRows = 7;

/** Glyph positions a figure always draws, so its node ids never move. */
const glyphSlots = 5;

/**
 * Lit dots for every glyph a formatted metric can contain.
 *
 * Counts arrive from `formatCount`, so the set covers digits, the compact
 * suffixes, both separators, and the dash it returns for a missing value.
 */
const glyphs: Record<string, string> = {
  '0': '01110 10001 10011 10101 11001 10001 01110',
  '1': '00100 01100 00100 00100 00100 00100 01110',
  '2': '01110 10001 00001 00010 00100 01000 11111',
  '3': '11111 00010 00100 00010 00001 10001 01110',
  '4': '00010 00110 01010 10010 11111 00010 00010',
  '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110',
  '7': '11111 00001 00010 00100 01000 01000 01000',
  '8': '01110 10001 10001 01110 10001 10001 01110',
  '9': '01110 10001 10001 01111 00001 00010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001',
  M: '10001 11011 10101 10101 10001 10001 10001',
  '.': '00000 00000 00000 00000 00000 01100 01100',
  ',': '00000 00000 00000 00000 01100 01100 11000',
  '—': '00000 00000 00000 11111 00000 00000 00000',
};

/** Style applied to every dot in a figure. */
type MatrixStyle = {
  color: string;
  /** Dot spacing as a share of one dot, from 0 for solid strokes. */
  gapRatio?: number;
  align?: 'left' | 'right';
  opacity?: number;
};

/** Columns the fixed display spans, glyph tracking included. */
const displayColumns = glyphSlots * (glyphColumns + 1) - 1;

/**
 * Reports the height the display occupies when its width is the limit.
 *
 * The grid is far wider than it is tall, so a box taller than this leaves the
 * figure floating in space. Callers size the band with it rather than handing
 * the display height it cannot use.
 *
 * @param width - Width available to the display.
 * @param gapRatio - Dot spacing as a share of one dot.
 * @returns The height the display fills at that width.
 */
function matrixHeightForWidth(width: number, gapRatio = 0) {
  const cell = width / (displayColumns + (displayColumns - 1) * gapRatio);

  return glyphRows * cell * (1 + gapRatio) - cell * gapRatio;
}

/**
 * Draws a formatted count as lit dots on a fixed 5x7 grid.
 *
 * The display always holds the same number of glyph positions and every dot
 * in it, lit or not, so a count that shrinks keeps its node ids and the
 * figure keeps its size instead of growing to fill the box. Unused positions
 * fall on the side the figure is aligned away from, so the digits stay flush
 * to the edge they were aligned to.
 *
 * @param id - Prefix for every dot's stable identifier.
 * @param text - Formatted count to draw.
 * @param box - Bounds the display fits inside.
 * @param style - Dot colour, spacing, alignment, and opacity.
 * @returns One rect per dot position, unlit ones held at zero opacity.
 */
function matrixNodes(
  id: string,
  text: string,
  box: Box,
  style: MatrixStyle,
): SceneNode[] {
  const characters = [...text]
    .filter((character) => character in glyphs)
    .slice(0, glyphSlots);
  const lead = style.align === 'right' ? glyphSlots - characters.length : 0;
  const gapRatio = style.gapRatio ?? 0;
  const columns = displayColumns;
  const cell = Math.max(
    0,
    Math.min(
      box.width / (columns + (columns - 1) * gapRatio),
      box.height / (glyphRows + (glyphRows - 1) * gapRatio),
    ),
  );
  const pitch = cell * (1 + gapRatio);
  const width = columns * pitch - cell * gapRatio;
  const height = glyphRows * pitch - cell * gapRatio;
  const left = style.align === 'right' ? box.x + box.width - width : box.x;
  const top = box.y + (box.height - height) / 2;

  return Array.from({ length: glyphSlots }, (_, slot) => {
    const rows = glyphs[characters[slot - lead]]?.split(' ') ?? [];
    const originX = left + slot * (glyphColumns + 1) * pitch;

    return Array.from({ length: glyphRows }, (_, rowIndex) =>
      Array.from({ length: glyphColumns }, (_, columnIndex): SceneNode => {
        const lit = rows[rowIndex]?.[columnIndex] === '1';

        return {
          id: `${id}-dot-${slot + 1}-${rowIndex + 1}-${columnIndex + 1}`,
          type: 'rect',
          x: originX + columnIndex * pitch,
          y: top + rowIndex * pitch,
          width: cell,
          height: cell,
          fill: { kind: 'solid', color: style.color },
          opacity: lit ? (style.opacity ?? 1) : 0,
        };
      }),
    ).flat();
  }).flat();
}

export type { MatrixStyle };
export { matrixHeightForWidth, matrixNodes };
