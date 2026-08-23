const imageCache = new Map<string, Promise<HTMLImageElement>>();

/**
 * Loads and caches an image, substituting a generated fallback on failure.
 *
 * @param src - Image URL to load.
 * @returns The loaded image or its generated fallback.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) {
    return cached;
  }

  const pending = new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => {
      void createFallbackImage(src).then(resolve);
    };
    image.src = src;
  });

  imageCache.set(src, pending);
  return pending;
}

function createFallbackImage(src: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;

  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#343941';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.font = '700 52px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(getInitials(src), canvas.width / 2, canvas.height / 2);
  }

  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = canvas.toDataURL('image/png');
  });
}

function getInitials(src: string) {
  try {
    const name = new URL(src).pathname.split('/').filter(Boolean).at(-1) ?? '';
    return (
      Array.from(name.replace(/\.[^.]+$/, ''))
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'
    );
  } catch {
    return '?';
  }
}

export { loadImage };
