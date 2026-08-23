import type { MeasureText } from '@/types/template';

type FitTextInput = {
  text: string;
  fontFamily: string;
  fontWeight: number;
  maxWidth: number;
  minSize: number;
  maxSize: number;
};

/**
 * Finds the largest whole-pixel font size that fits on one line.
 *
 * @param measure - Renderer text measurement function.
 * @param input - Text, font, width, and size constraints.
 * @returns The fitted font size within the requested range.
 */
function fitFontSize(measure: MeasureText, input: FitTextInput) {
  let low = input.minSize;
  let high = input.maxSize;

  while (high - low > 1) {
    const size = Math.floor((low + high) / 2);
    const measured = measure(input.text, {
      fontFamily: input.fontFamily,
      fontSize: size,
      fontWeight: input.fontWeight,
      maxWidth: input.maxWidth,
      lineHeight: 1,
      maxLines: 1,
    });

    if (measured.lines.length === 1 && measured.width <= input.maxWidth) {
      low = size;
    } else {
      high = size;
    }
  }

  return low;
}

export { fitFontSize };
