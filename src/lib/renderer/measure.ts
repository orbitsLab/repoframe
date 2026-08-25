import { areFontsReady, fontsReady } from '@/lib/renderer/fonts';
import type { MeasuredText, MeasureTextStyle } from '@/types/template';

let context: CanvasRenderingContext2D | undefined;

function getContext() {
  if (context) {
    return context;
  }

  const canvas = document.createElement('canvas');
  const nextContext = canvas.getContext('2d');

  if (!nextContext) {
    throw new Error('Canvas text measurement is unavailable in this browser.');
  }

  context = nextContext;
  return context;
}

/**
 * Measures and wraps text using the fonts loaded by the renderer.
 *
 * @param text - Text content to measure.
 * @param style - Typography and layout constraints.
 * @returns Visible lines and their measured bounds.
 * @throws When called before fonts are ready or canvas is unavailable.
 */
function measureText(text: string, style: MeasureTextStyle): MeasuredText {
  if (!areFontsReady()) {
    throw new Error(
      'Fonts are not ready. Await fontsReady before measuring text.',
    );
  }

  const canvasContext = getContext();
  canvasContext.font = `${style.fontWeight} ${style.fontSize}px "${style.fontFamily}"`;

  const letterSpacing = style.letterSpacing ?? 0;
  const widthOf = (value: string) =>
    canvasContext.measureText(value).width +
    Math.max(0, value.length - 1) * letterSpacing;
  const lines = wrapText(text, style.maxWidth, widthOf);
  const visibleLines = style.maxLines
    ? truncateLines(lines, style.maxLines, style.maxWidth, widthOf)
    : lines;

  return {
    lines: visibleLines,
    width: Math.min(style.maxWidth, Math.max(0, ...visibleLines.map(widthOf))),
    height: visibleLines.length * style.fontSize * style.lineHeight,
  };
}

function wrapText(
  text: string,
  maxWidth: number,
  widthOf: (value: string) => number,
) {
  return text
    .split('\n')
    .flatMap((paragraph) => wrapParagraph(paragraph, maxWidth, widthOf));
}

function wrapParagraph(
  paragraph: string,
  maxWidth: number,
  widthOf: (value: string) => number,
) {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }

  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (widthOf(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) {
      lines.push(line);
    }

    const parts = splitLongWord(word, maxWidth, widthOf);
    lines.push(...parts.slice(0, -1));
    line = parts.at(-1) ?? '';
  }

  return line ? [...lines, line] : lines;
}

function splitLongWord(
  word: string,
  maxWidth: number,
  widthOf: (value: string) => number,
) {
  const parts: string[] = [];
  let part = '';

  // Prefer breaking after a slash or hyphen so owner/repo names stay readable.
  for (const chunk of word.split(/(?<=[/-])/)) {
    if (part && widthOf(part + chunk) > maxWidth) {
      parts.push(part);
      part = '';
    }

    if (widthOf(chunk) > maxWidth) {
      const characters = splitCharacters(chunk, maxWidth, widthOf, part);
      parts.push(...characters.slice(0, -1));
      part = characters.at(-1) ?? '';
      continue;
    }

    part += chunk;
  }

  if (part) {
    parts.push(part);
  }

  return parts;
}

/**
 * Splits a text chunk at character boundaries while preserving any prefix.
 *
 * @param chunk - Text that cannot fit as a complete semantic chunk.
 * @param maxWidth - Maximum width available to each part.
 * @param widthOf - Function that measures a candidate part.
 * @param prefix - Text already accumulated for the first part.
 * @returns Text split at the narrowest available character boundaries.
 */
function splitCharacters(
  chunk: string,
  maxWidth: number,
  widthOf: (value: string) => number,
  prefix: string,
) {
  const parts: string[] = [];
  let part = prefix;

  for (const character of Array.from(chunk)) {
    if (part && widthOf(part + character) > maxWidth) {
      parts.push(part);
      part = character;
    } else {
      part += character;
    }
  }

  return [...parts, part];
}

function truncateLines(
  lines: string[],
  maxLines: number,
  maxWidth: number,
  widthOf: (value: string) => number,
) {
  if (lines.length <= maxLines) {
    return lines;
  }

  const visible = lines.slice(0, maxLines);
  let lastLine = visible.at(-1) ?? '';

  while (lastLine && widthOf(`${lastLine}…`) > maxWidth) {
    lastLine = Array.from(lastLine).slice(0, -1).join('');
  }

  visible[maxLines - 1] = `${lastLine.trimEnd()}…`;
  return visible;
}

export { fontsReady, measureText };
