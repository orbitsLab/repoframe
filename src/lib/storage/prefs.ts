import type { AspectRatio } from '@/types/template';

const themeStorageKey = 'repoframe-theme';
const ratioStorageKey = 'repoframe-ratio';
const howItWorksStorageKey = 'repoframe-how-it-works-dismissed';

/** Color themes persisted by RepoFrame. */
type Theme = 'light' | 'dark';

/** @returns The saved theme, or undefined when no valid preference exists. */
function readTheme(): Theme | undefined {
  const value = readValue(themeStorageKey);
  return value === 'light' || value === 'dark' ? value : undefined;
}

/** @param theme - Theme to persist for future visits. */
function writeTheme(theme: Theme): void {
  writeValue(themeStorageKey, theme);
}

/** @returns The most recently selected export ratio, when available. */
function readLastRatio(): AspectRatio | undefined {
  const value = readValue(ratioStorageKey);
  return value === '1:1' ||
    value === '4:5' ||
    value === '16:9' ||
    value === '9:16'
    ? value
    : undefined;
}

/** @param ratio - Export ratio to persist for future projects. */
function writeLastRatio(ratio: AspectRatio): void {
  writeValue(ratioStorageKey, ratio);
}

/** @returns Whether the introductory explanation has been dismissed. */
function readHowItWorksDismissed(): boolean {
  return readValue(howItWorksStorageKey) === 'true';
}

/** @param dismissed - Whether the introductory explanation is dismissed. */
function writeHowItWorksDismissed(dismissed: boolean): void {
  writeValue(howItWorksStorageKey, String(dismissed));
}

function readValue(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export type { Theme };
export {
  readHowItWorksDismissed,
  readLastRatio,
  readTheme,
  themeStorageKey,
  writeHowItWorksDismissed,
  writeLastRatio,
  writeTheme,
};
