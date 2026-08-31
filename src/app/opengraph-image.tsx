import { ImageResponse } from 'next/og';

import { siteName } from '@/lib/site';

export const alt = 'Repo Frame — turn a GitHub repository into a social card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Draws the share card the site itself is previewed with: the wordmark inside
 * the same registration frame the product prints around every card.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#000000',
        color: '#ffffff',
        padding: 72,
        border: '1px solid #2a2a2a',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          letterSpacing: 6,
          color: '#8a8a8a',
        }}
      >
        OPEN SOURCE · RUNS IN YOUR BROWSER
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 104, letterSpacing: -4 }}>
          {siteName}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontSize: 34,
            color: '#b4b4b4',
          }}
        >
          Turn a GitHub repository into a social card.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 22,
          letterSpacing: 4,
          color: '#8a8a8a',
        }}
      >
        <div style={{ display: 'flex' }}>26 TEMPLATES</div>
        <div style={{ display: 'flex' }}>PNG · WEBP · JPEG</div>
        <div style={{ display: 'flex' }}>NO ACCOUNT</div>
      </div>
    </div>,
    size,
  );
}
