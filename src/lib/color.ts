/**
 * Reads the red, green, and blue channels of a hex color.
 *
 * @param color - Hex color in three- or six-digit form, with or without a hash.
 * @returns Channel values between 0 and 255.
 */
function hexToRgb(color: string): [number, number, number] {
  const hex = color.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => character + character)
          .join('')
      : hex.padEnd(6, '0').slice(0, 6);

  return [0, 2, 4].map((offset) =>
    Number.parseInt(full.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}

/**
 * Joins 8-bit channels into a six-digit hex color.
 *
 * @param channels - Red, green, and blue channels.
 * @returns Lowercase hex color including the leading hash.
 */
function rgbToHex(channels: number[]) {
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export { hexToRgb, rgbToHex };
