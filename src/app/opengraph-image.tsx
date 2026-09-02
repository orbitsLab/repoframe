import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

import { siteName } from '@/lib/site';

/** Ground, ink and rules the card is drawn in, fixed because it has no theme. */
const ground = '#000000';
const ink = '#ffffff';
const muted = '#8a8a8a';
const rule = '#2a2a2a';

/** Size the wordmark is set at, and the mark that stands in for its first letter. */
const wordmarkSize = 104;
const markSize = 90;

/**
 * The stack of cards dealt across the right, back to front.
 *
 * Each is the card the workbench deals for that repository, drawn by the real
 * renderer and captured, because the templates are Konva scenes and this image
 * is drawn from markup. Positions are absolute so the stack can overlap and
 * tilt; `left` and `top` are the untilted top-left corner.
 */
const stack = [
  { file: 'almanac', left: 700, top: 14, rotate: -8 },
  { file: 'release', left: 912, top: 120, rotate: 5 },
  { file: 'cover', left: 685, top: 262, rotate: -6 },
  { file: 'marquee', left: 916, top: 368, rotate: 6 },
];

/**
 * Width the cards are dealt at, keeping the 16:9 the workbench shows.
 *
 * The stack is dealt wider than the frame on purpose: the cards nearest the
 * reader run past the right edge and are trimmed by it, so the sheet reads as
 * one the product is still printing rather than a tidy set of four thumbnails.
 */
const cardWidth = 300;

/** Reads a captured card from the app directory as a data URL. */
async function loadCard(file: string) {
  const data = await readFile(
    join(process.cwd(), 'src/app/cards', `${file}.png`),
  );

  return `data:image/png;base64,${data.toString('base64')}`;
}

/** Reads one of the faces cut for this card from the app directory. */
function loadFont(file: 'archivo-400' | 'archivo-700' | 'azeret-400') {
  return readFile(join(process.cwd(), 'src/app/fonts', `${file}.ttf`));
}

export const alt = 'Repo Frame — turn a GitHub repository into a social card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Draws the Repo Frame mark at the size that makes its letterform match the
 * cap height of the wordmark beside it.
 *
 * The paths are the ones in `components/logo.tsx`, with the theme colours
 * resolved: the share card is always drawn on the same ground. The negative
 * margin trims the side bearing the artwork carries, which is wider than the
 * one the typeface sets after an R.
 */
function Mark() {
  return (
    <svg
      width={markSize}
      height={markSize}
      viewBox="0 0 1000 1000"
      aria-hidden="true"
      style={{ marginRight: -6 }}
    >
      <g transform="translate(500 500)">
        <path
          fill={ink}
          d="M-398.74-395.539L250.48-395.547 398.14-248.482 398.13 91.948 262.7 226.941 398.2 397.04 367.75 396.96 196.2 396.69C182.33 378.18 165.72 358.14 151.26 339.92L65.29 231.92-236.28 231.85-236.28 396.95-399.08 396.89-398.74-395.539Z"
        />
        <path
          fill={ground}
          d="M175.36-283.767C178.44-283.83 181.73-284.328 184.26-282.791 185.9-264.742 184.63-224.969 184.59-205.33L103.64-205.347 103.61-192.532 184.64-192.512 184.61-115.384 197.35-115.365 197.31-192.523 235.2-192.497 235.18 32.23 280.6 32.255 280.58 44.785C268.05 44.783 248.43 45.86 236.61 44.463 233.53 41.81 236.94 42.411 234.19 38.004 227.2 36.65 205.54 37.42 197.38 37.498L197.38-40.618 184.57-40.679 184.54 37.465 103.56 37.457 103.54 49.83 184.54 49.883 184.5 79.466-176.39 79.46-176.45 126.404C-179.5 126.423-181.13 126.291-184.18 125.959-186.88 123.206-185.71 58.908-185.69 49.868L-104.81 49.858-104.7 37.469-185.67 37.476-185.67-40.652-198.37-40.645-198.37 37.466-236.2 37.461-236.3-188.366C-245.52-188.335-273.4-187.66-280.58-188.944-281.91-191.918-281.51-196.579-281.51-200.03-268.6-199.924-251.6-200.811-238.48-199.774-234.86-199.488-237.89-197.047-235.1-193.028-229.21-191.715-205.51-192.469-198.37-192.524L-198.36-115.407-185.66-115.391-185.68-192.529-104.58-192.535-104.62-205.331-185.69-205.366-185.68-235.559 175.36-235.519 175.36-283.767Z"
        />
        <path
          fill={ground}
          d="M-236.3-235.575L-198.31-235.516-198.36-205.328-236.26-205.387-236.3-235.575Z"
        />
        <path
          fill={ground}
          d="M197.33-235.539L235.15-235.517 235.15-205.424C223.28-205.027 209.38-205.359 197.34-205.335L197.33-235.539Z"
        />
        <path
          fill={ground}
          d="M197.38 49.893L235.22 49.906 235.2 79.438 197.26 79.485 197.38 49.893Z"
        />
        <path
          fill={ground}
          d="M-236.18 49.896L-198.37 49.883-198.38 79.467-236.17 79.455-236.18 49.896Z"
        />
      </g>
    </svg>
  );
}

/** Draws one captured card, tilted where it falls in the stack. */
function Card({ entry, src }: { entry: (typeof stack)[number]; src: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: Satori renders markup to a bitmap and has no next/image to reach for.
    <img
      src={src}
      alt=""
      width={cardWidth}
      height={Math.round((cardWidth / 16) * 9)}
      style={{
        position: 'absolute',
        left: entry.left,
        top: entry.top,
        transform: `rotate(${entry.rotate}deg)`,
        // A dark card on a dark ground needs an edge of its own to read as a
        // separate sheet; the shadow alone does not carry it.
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 26px 54px rgba(0, 0, 0, 0.62)',
      }}
    />
  );
}

/**
 * Draws the share card the site itself is previewed with: the mark and wordmark
 * inside the registration frame the product prints around every card, with a
 * stack of cards it has made dealt across the right.
 */
export default async function OpengraphImage() {
  const [regular, bold, mono, ...cards] = await Promise.all([
    loadFont('archivo-400'),
    loadFont('archivo-700'),
    loadFont('azeret-400'),
    ...stack.map((entry) => loadCard(entry.file)),
  ]);

  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: ground,
        color: ink,
        padding: 72,
        border: `1px solid ${rule}`,
        fontFamily: 'Archivo',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: 'Azeret Mono',
          fontSize: 21,
          letterSpacing: 4.5,
          color: muted,
        }}
      >
        OPEN SOURCE · RUNS IN YOUR BROWSER
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* The mark is an R, so it sets the first letter of the name and the
              rest of the word runs on from it. */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Mark />
            <div
              style={{
                display: 'flex',
                fontSize: wordmarkSize,
                fontWeight: 700,
                letterSpacing: -4,
              }}
            >
              {siteName.slice(1)}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 18,
              fontSize: 30,
              color: '#b4b4b4',
            }}
          >
            Turn a GitHub repository into a social card.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Azeret Mono',
          fontSize: 19,
          letterSpacing: 3,
          color: muted,
        }}
      >
        <div style={{ display: 'flex' }}>26 TEMPLATES</div>
        <div style={{ display: 'flex' }}>PNG · WEBP · JPEG</div>
        <div style={{ display: 'flex' }}>NO ACCOUNT</div>
      </div>

      {/* Dealt last so each card falls over the one before it. */}
      {stack.map((entry, index) => (
        <Card key={entry.file} entry={entry} src={cards[index]} />
      ))}
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Archivo', data: regular, weight: 400, style: 'normal' },
        { name: 'Archivo', data: bold, weight: 700, style: 'normal' },
        { name: 'Azeret Mono', data: mono, weight: 400, style: 'normal' },
      ],
    },
  );
}
