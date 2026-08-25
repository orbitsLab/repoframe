import { describe, expect, it } from 'vitest';

import { fitText } from '@/lib/templates/shared/text';
import type { MeasureText } from '@/types/template';

const measure: MeasureText = (text, style) => {
  const characterWidth = style.fontSize * 0.55;
  const perLine = Math.max(1, Math.floor(style.maxWidth / characterWidth));
  const lines = Array.from(
    text.matchAll(new RegExp(`.{1,${perLine}}`, 'gu')),
  ).map((match) => match[0]);
  const visible = style.maxLines ? lines.slice(0, style.maxLines) : lines;

  return {
    lines: visible.length > 0 ? visible : [''],
    width: Math.min(style.maxWidth, text.length * characterWidth),
    height: Math.max(1, visible.length) * style.fontSize * style.lineHeight,
  };
};

describe('fitText', () => {
  it('terminates when the size range has fractional bounds', () => {
    const fitted = fitText(measure, {
      text: 'alfaarghya/alfa-leetcode-api',
      fontFamily: 'Manrope Variable',
      fontWeight: 800,
      maxWidth: 876,
      minSize: 40,
      maxSize: 77.9,
      maxLines: 2,
      lineHeight: 1.08,
    });

    expect(Number.isInteger(fitted.fontSize)).toBe(true);
    expect(fitted.fontSize).toBeGreaterThanOrEqual(40);
    expect(fitted.fontSize).toBeLessThanOrEqual(77);
  });

  it('wraps within the line budget instead of truncating', () => {
    const fitted = fitText(measure, {
      text: 'alfaarghya/alfa-leetcode-api',
      fontFamily: 'Manrope Variable',
      fontWeight: 800,
      maxWidth: 400,
      minSize: 30,
      maxSize: 96,
      maxLines: 2,
      lineHeight: 1.1,
    });

    expect(fitted.lines.length).toBeLessThanOrEqual(2);
    expect(fitted.lines.join('')).not.toContain('…');
  });

  it('falls back to the smallest size when nothing fits', () => {
    const fitted = fitText(measure, {
      text: 'a'.repeat(400),
      fontFamily: 'Manrope Variable',
      fontWeight: 700,
      maxWidth: 100,
      minSize: 24,
      maxSize: 60,
      maxLines: 1,
    });

    expect(fitted.fontSize).toBe(24);
  });
});
