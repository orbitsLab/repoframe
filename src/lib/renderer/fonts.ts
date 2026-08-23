import {
  displayFontOptions,
  monoFontOptions,
} from '@/lib/templates/shared/tokens';

/** Font families available to template settings and the renderer. */
const fontFamilies = [...displayFontOptions, ...monoFontOptions].map(
  (font) => font.value,
);

/** Font weights preloaded before text measurement and rendering. */
const fontWeights = [400, 500, 600, 700, 800] as const;
let fontsLoaded = false;

async function loadFonts() {
  if (typeof document === 'undefined') {
    fontsLoaded = true;
    return;
  }

  await Promise.all(
    fontFamilies.flatMap((family) =>
      fontWeights.map((weight) =>
        document.fonts.load(`${weight} 72px "${family}"`),
      ),
    ),
  );
  await document.fonts.ready;
  fontsLoaded = true;
}

/** Resolves after every renderer font and weight is ready for use. */
const fontsReady = loadFonts();

/** @returns Whether renderer fonts have finished loading. */
function areFontsReady() {
  return fontsLoaded;
}

export { areFontsReady, fontFamilies, fontsReady, fontWeights };
