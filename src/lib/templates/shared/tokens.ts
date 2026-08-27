import { hexToRgb, rgbToHex } from '@/lib/color';
import type { AspectRatio, SettingOption } from '@/types/template';

/** Export dimensions for each supported aspect ratio. */
const ratioSizes: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1200, height: 1200 },
  '4:5': { width: 1080, height: 1350 },
  '16:9': { width: 1200, height: 675 },
  '9:16': { width: 1080, height: 1920 },
};

/** Shared spacing scale for static templates. */
const spacing = {
  xs: 12,
  sm: 20,
  md: 32,
  lg: 48,
  xl: 72,
  xxl: 96,
} as const;

/**
 * Scales fixed vertical bands to the height of the canvas.
 *
 * Templates are tuned around a 1200px canvas. Without this, a 1920px story
 * canvas keeps the same band heights and pools every extra pixel into one
 * gap in the middle of the card.
 *
 * @param height - Canvas height in pixels.
 * @returns A multiplier between 1 and 1.6.
 */
function bandScale(height: number) {
  return Math.min(1.6, Math.max(1, height / 1200));
}

/** Shared type scale for static templates. */
const typeScale = {
  eyebrow: 20,
  label: 24,
  body: 30,
  metric: 72,
  heading: 64,
  display: 96,
} as const;

/** Opacity that stands in for a muted tone against a flat colour field. */
const mutedInk = 0.7;

/** Proportional font options available to template settings. */
const displayFontOptions: SettingOption[] = [
  { label: 'Manrope', value: 'Manrope Variable' },
  { label: 'DM Sans', value: 'DM Sans Variable' },
  { label: 'Space Grotesk', value: 'Space Grotesk Variable' },
  { label: 'Outfit', value: 'Outfit Variable' },
  { label: 'Sora', value: 'Sora Variable' },
  { label: 'Archivo', value: 'Archivo Variable' },
];

/** Monospace font options available to template settings. */
const monoFontOptions: SettingOption[] = [
  { label: 'JetBrains Mono', value: 'JetBrains Mono Variable' },
  { label: 'Roboto Mono', value: 'Roboto Mono Variable' },
  { label: 'Source Code Pro', value: 'Source Code Pro Variable' },
  { label: 'Azeret Mono', value: 'Azeret Mono Variable' },
  { label: 'Fira Code', value: 'Fira Code Variable' },
  { label: 'Inconsolata', value: 'Inconsolata Variable' },
];

/** Named color palettes used as template setting defaults. */
const palettes = {
  ink: {
    background: '#f6f3ec',
    surface: '#ffffff',
    foreground: '#151515',
    muted: '#66645f',
    accent: '#5b5bd6',
    border: '#d9d5cb',
  },
  terminal: {
    background: '#0b0d10',
    surface: '#12161c',
    foreground: '#e6edf3',
    muted: '#8b949e',
    accent: '#7ee787',
    border: '#30363d',
  },
  bento: {
    background: '#ebe9ff',
    surface: '#ffffff',
    foreground: '#19172b',
    muted: '#69657e',
    accent: '#6c5ce7',
    border: '#d7d2f2',
  },
  paper: {
    background: '#f2efe6',
    surface: '#ffffff',
    foreground: '#161513',
    muted: '#5f5c54',
    accent: '#b4471f',
    border: '#d6d1c2',
  },
  poster: {
    background: '#ff4a1c',
    surface: '#ffffff',
    foreground: '#100c08',
    muted: '#3a2a20',
    accent: '#100c08',
    border: '#100c08',
  },
  blueprint: {
    background: '#0d1b2a',
    surface: '#152a3f',
    foreground: '#e8f1ff',
    muted: '#8fa8c4',
    accent: '#4cc9f0',
    border: '#28455f',
  },
} as const;

/** Resolved surface and text colors derived from a background. */
type Theme = {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  accent: string;
};

/**
 * Derives readable text and surface colors from a chosen background.
 *
 * Keeps templates legible when a user picks a background the bundled
 * palette never anticipated.
 *
 * @param background - Background color chosen in template settings.
 * @param accent - Accent color chosen in template settings.
 * @returns Theme colors tinted toward the background hue.
 */
function resolveTheme(background: string, accent: string): Theme {
  const isDark = luminance(background) < 0.45;
  const contrast = isDark ? '#ffffff' : '#0b0b0f';

  return {
    background,
    // Surfaces always lift away from the background, in either direction.
    surface: mix(background, '#ffffff', isDark ? 0.08 : 0.72),
    foreground: mix(background, contrast, 0.92),
    muted: mix(background, contrast, 0.55),
    border: mix(background, contrast, isDark ? 0.2 : 0.16),
    accent,
  };
}

/**
 * Computes the perceived lightness of a hex color.
 *
 * @param color - Hex color string.
 * @returns Relative luminance between 0 and 1.
 */
function luminance(color: string) {
  const [red, green, blue] = hexToRgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * Blends two hex colors in sRGB space.
 *
 * @param from - Starting hex color.
 * @param to - Target hex color.
 * @param amount - Share of the target color, from 0 to 1.
 * @returns The blended hex color.
 */
function mix(from: string, to: string, amount: number) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const blended = start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * amount),
  );

  return rgbToHex(blended);
}

export type { Theme };
export {
  bandScale,
  displayFontOptions,
  monoFontOptions,
  mutedInk,
  palettes,
  ratioSizes,
  resolveTheme,
  spacing,
  typeScale,
};
