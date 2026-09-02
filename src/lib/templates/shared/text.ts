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

type FitCommonInput = {
  texts: string[];
  fontFamily: string;
  fontWeight: number;
  maxWidth: number;
  maxSize: number;
  minSize?: number;
  letterSpacing?: number;
};

/**
 * Finds the largest size at or below a cap where every string fits on one line.
 *
 * Figures set side by side share a size, so the widest one decides it: a count
 * in the hundreds of thousands is several times the width of a two-digit one.
 *
 * @param measure - Renderer text measurement function.
 * @param input - Strings, font, the width each may occupy, and size bounds.
 * @returns The largest whole-pixel size that fits them all.
 */
function fitCommonSize(measure: MeasureText, input: FitCommonInput): number {
  return input.texts.reduce(
    (size, text) =>
      Math.min(
        size,
        fitText(measure, {
          text,
          fontFamily: input.fontFamily,
          fontWeight: input.fontWeight,
          maxWidth: input.maxWidth,
          minSize: input.minSize ?? 8,
          maxSize: size,
          maxLines: 1,
          letterSpacing: input.letterSpacing,
        }).fontSize,
      ),
    Math.max(0, Math.floor(input.maxSize)),
  );
}

export type { FittedText };
export { fitCommonSize, fitText };
