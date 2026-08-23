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

/** Shared type scale for static templates. */
const typeScale = {
  eyebrow: 22,
  body: 30,
  label: 24,
  heading: 64,
  display: 88,
  metric: 54,
} as const;

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

/** Named color palettes shared by bundled templates. */
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
} as const;

export {
  displayFontOptions,
  monoFontOptions,
  palettes,
  ratioSizes,
  spacing,
  typeScale,
};
