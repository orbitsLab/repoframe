/** Rectangular bounds used by template layout helpers. */
type Box = { x: number; y: number; width: number; height: number };

/**
 * Insets every edge of a box by the same amount.
 *
 * @param box - Bounds to inset.
 * @param amount - Distance removed from each edge.
 * @returns The inset bounds with non-negative dimensions.
 */
function inset(box: Box, amount: number): Box {
  return {
    x: box.x + amount,
    y: box.y + amount,
    width: Math.max(0, box.width - amount * 2),
    height: Math.max(0, box.height - amount * 2),
  };
}

/**
 * Splits a box into equal horizontal cells.
 *
 * @param box - Bounds containing the row.
 * @param count - Number of cells to create.
 * @param gap - Space between adjacent cells.
 * @returns Cell bounds ordered from left to right.
 */
function row(box: Box, count: number, gap: number): Box[] {
  const width = (box.width - gap * (count - 1)) / count;

  return Array.from({ length: count }, (_, index) => ({
    x: box.x + index * (width + gap),
    y: box.y,
    width,
    height: box.height,
  }));
}

/**
 * Places fixed-height boxes vertically within shared horizontal bounds.
 *
 * @param box - Bounds that provide the starting position and width.
 * @param heights - Height of each stacked item.
 * @param gap - Space between adjacent items.
 * @returns Item bounds ordered from top to bottom.
 */
function stack(box: Box, heights: number[], gap: number): Box[] {
  let y = box.y;

  return heights.map((height) => {
    const item = { x: box.x, y, width: box.width, height };
    y += height + gap;
    return item;
  });
}

export type { Box };
export { inset, row, stack };
