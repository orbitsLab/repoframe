import { describe, expect, it } from 'vitest';

import {
  autoColor,
  resolveInk,
  resolveTheme,
} from '@/lib/templates/shared/tokens';

describe('resolveTheme', () => {
  it('derives light ink on a dark background', () => {
    const theme = resolveTheme('#0b0d10', '#7ee787');

    expect(theme.foreground).toBe('#ebecec');
  });

  it('derives dark ink on a light background', () => {
    const theme = resolveTheme('#f6f3ec', '#5b5bd6');

    expect(theme.foreground).toBe('#1e1e21');
  });

  it('keeps the derived ink when the text colour is auto', () => {
    const derived = resolveTheme('#f6f3ec', '#5b5bd6');
    const auto = resolveTheme('#f6f3ec', '#5b5bd6', autoColor);

    expect(auto).toEqual(derived);
  });

  it('keeps the derived ink when the text colour is not a hex value', () => {
    const derived = resolveTheme('#f6f3ec', '#5b5bd6');

    expect(resolveTheme('#f6f3ec', '#5b5bd6', '')).toEqual(derived);
    expect(resolveTheme('#f6f3ec', '#5b5bd6', 'tomato')).toEqual(derived);
  });

  it('uses a chosen text colour as the foreground', () => {
    const theme = resolveTheme('#f6f3ec', '#5b5bd6', '#b4471f');

    expect(theme.foreground).toBe('#b4471f');
  });

  it('pulls muted text from the chosen colour toward the background', () => {
    const theme = resolveTheme('#ffffff', '#5b5bd6', '#000000');

    expect(theme.muted).toBe('#666666');
  });

  it('leaves surfaces and borders tied to the background', () => {
    const derived = resolveTheme('#f6f3ec', '#5b5bd6');
    const custom = resolveTheme('#f6f3ec', '#5b5bd6', '#b4471f');

    expect(custom.surface).toBe(derived.surface);
    expect(custom.border).toBe(derived.border);
  });
});

describe('resolveInk', () => {
  it('returns the fallback when the text colour is auto', () => {
    expect(resolveInk(autoColor, '#100c08')).toBe('#100c08');
  });

  it('returns the chosen text colour in lower case', () => {
    expect(resolveInk('#B4471F', '#100c08')).toBe('#b4471f');
  });
});
