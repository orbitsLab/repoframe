import type { Theme } from '@/lib/storage/prefs';

/** Nominal edge of one wipe tile, in pixels. */
const tile = 96;

/** Most tiles the wipe will draw, however large the viewport is. */
const maxTiles = 320;

/** How long one tile takes to grow into place, in milliseconds. */
const tileMs = 260;

/** How long the whole grid takes to close over the page, in milliseconds. */
const coverMs = 560;

/** How long the whole grid takes to clear away again, in milliseconds. */
const clearMs = 520;

const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

let running = false;

/** Hashes an index into a stable pseudo-random number between 0 and 1. */
function noise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Reads the page ground a theme resolves to, by measuring the document under
 * that theme and putting it back before the browser can paint.
 */
function readGround(theme: Theme) {
  const root = document.documentElement;
  const wasDark = root.classList.contains('dark');

  root.classList.toggle('dark', theme === 'dark');
  const ground = getComputedStyle(root).getPropertyValue('--background').trim();
  root.classList.toggle('dark', wasDark);

  return ground || 'var(--background)';
}

/** Builds a grid of absolutely placed tiles covering the viewport. */
function buildTiles(width: number, height: number, ground: string) {
  let size = tile;
  let columns = Math.ceil(width / size);
  let rows = Math.ceil(height / size);

  if (columns * rows > maxTiles) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / maxTiles));
    columns = Math.ceil(width / size);
    rows = Math.ceil(height / size);
  }

  const tiles: { element: HTMLDivElement; offset: number }[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.left = `${column * size}px`;
      element.style.top = `${row * size}px`;
      // A pixel of overlap on each tile, so no seam shows through at rest.
      element.style.width = `${size + 1}px`;
      element.style.height = `${size + 1}px`;
      element.style.background = ground;
      element.style.willChange = 'transform, opacity';

      tiles.push({ element, offset: noise(row * columns + column + 1) });
    }
  }

  return tiles;
}

/**
 * Repaints the page pixel by pixel while the theme changes: a grid of tiles
 * closes over the viewport in scattered order, `apply` runs behind the cover,
 * then the tiles clear away to reveal the new theme.
 *
 * Every tile is painted in the ground the incoming theme resolves to, read from
 * the token rather than named, so the new colour spreads tile by tile and the
 * switch underneath is invisible. Runs `apply` on its own under reduced motion,
 * or while a wipe is already in flight.
 *
 * @param theme - The theme being switched to, whose ground the tiles take.
 * @param apply - Switches the theme; called once the page is fully covered.
 */
function wipeTheme(theme: Theme, apply: () => void): void {
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;

  if (
    running ||
    !width ||
    !height ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    apply();
    return;
  }

  running = true;

  let applied = false;
  const applyOnce = () => {
    if (applied) return;
    applied = true;
    apply();
  };

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '60';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';

  const tiles = buildTiles(width, height, readGround(theme));
  for (const { element } of tiles) overlay.append(element);
  document.body.append(overlay);

  const settle = (animations: Animation[]) =>
    Promise.all(animations.map((animation) => animation.finished));

  const cover = tiles.map(({ element, offset }) =>
    element.animate(
      [
        { transform: 'scale(0.35)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      {
        duration: tileMs,
        delay: offset * (coverMs - tileMs),
        easing: ease,
        fill: 'both',
      },
    ),
  );

  settle(cover)
    .then(() => {
      applyOnce();

      // Cleared in the opposite order to the cover, so the second half reads as
      // a new pass over the page rather than a rewind of the first.
      const clear = tiles.map(({ element, offset }) =>
        element.animate(
          [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.35)', opacity: 0 },
          ],
          {
            duration: tileMs,
            delay: (1 - offset) * (clearMs - tileMs),
            easing: ease,
            fill: 'both',
          },
        ),
      );

      return settle(clear);
    })
    .catch(() => {
      // A cancelled animation only means the wipe was cut short; the theme is
      // applied either way.
      applyOnce();
    })
    .finally(() => {
      overlay.remove();
      running = false;
    });
}

export { wipeTheme };
