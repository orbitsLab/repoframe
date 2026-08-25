import type { MeasuredText, MeasureText } from '@/types/template';

type FitTextInput = {
  text: string;
  fontFamily: string;
  fontWeight: number;
  maxWidth: number;
  minSize: number;
  maxSize: number;
  maxLines?: number;
  lineHeight?: number;
  letterSpacing?: number;
};

/** A fitted block of text and the bounds it occupies. */
type FittedText = MeasuredText & {
  fontSize: number;
  lineHeight: number;
};

/**
 * Finds the largest whole-pixel font size that fits within a line budget.
 *
 * Measures without a line cap so wrapping is counted rather than truncated,
 * then returns the wrapped lines and their bounds at the chosen size.
 *
 * @param measure - Renderer text measurement function.
 * @param input - Text, font, width, and size constraints.
 * @returns The fitted size, wrapped lines, and measured bounds.
 */
function fitText(measure: MeasureText, input: FitTextInput): FittedText {
  const maxLines = input.maxLines ?? 1;
  const lineHeight = input.lineHeight ?? 1;
  const style = (fontSize: number) => ({
    fontFamily: input.fontFamily,
    fontSize,
    fontWeight: input.fontWeight,
    maxWidth: input.maxWidth,
    lineHeight,
    letterSpacing: input.letterSpacing,
  });
  // Bounds are whole pixels so the midpoint always advances and the search ends.
  let low = Math.floor(input.minSize);
  let high = Math.max(low, Math.floor(input.maxSize));

  while (high - low > 1) {
    const size = Math.floor((low + high) / 2);

    if (measure(input.text, style(size)).lines.length <= maxLines) {
      low = size;
    } else {
      high = size;
    }
  }

  const measured = measure(input.text, { ...style(low), maxLines });

  return { ...measured, fontSize: low, lineHeight };
}

export type { FittedText };
export { fitText };
