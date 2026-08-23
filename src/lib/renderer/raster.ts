import { renderScene } from '@/lib/renderer/stage';
import type { Scene, SceneNode } from '@/types/scene';

/** Image formats supported by raster export. */
type RasterFormat = 'png' | 'webp';

/** Pixel-density multipliers supported by raster export. */
type RasterScale = 1 | 2;

let formats: RasterFormat[] | undefined;

/** @returns Raster formats supported by the current browser. */
function supportedFormats(): RasterFormat[] {
  if (formats) {
    return formats;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const webpSupported = canvas
    .toDataURL('image/webp')
    .startsWith('data:image/webp');
  formats = webpSupported ? ['png', 'webp'] : ['png'];
  return formats;
}

/**
 * Renders a scene to a raster image.
 *
 * @param scene - Renderer-independent scene to export.
 * @param format - Output image format.
 * @param scale - Output pixel-density multiplier.
 * @returns Encoded image data.
 * @throws When the format is unsupported or the canvas cannot be encoded.
 */
async function exportScene(
  scene: Scene,
  format: RasterFormat,
  scale: RasterScale,
) {
  if (!supportedFormats().includes(format)) {
    throw new Error(
      `${format.toUpperCase()} export is unavailable in this browser.`,
    );
  }

  const container = document.createElement('div');
  const stage = await renderScene(scene, container);

  try {
    const canvas = stage.toCanvas({ pixelRatio: scale });
    return await canvasToBlob(canvas, format, collectImageSources(scene.nodes));
  } finally {
    stage.destroy();
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: RasterFormat,
  imageSources: string[],
) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(
              new Error(
                `Could not encode the card as ${format.toUpperCase()}.`,
              ),
            );
          }
        },
        `image/${format}`,
        format === 'webp' ? 0.92 : undefined,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        reject(
          new Error(
            `Export was blocked by a cross-origin image: ${imageSources.join(', ') || 'unknown source'}.`,
          ),
        );
        return;
      }

      reject(error);
    }
  });
}

function collectImageSources(nodes: SceneNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === 'image') {
      return [node.src];
    }

    return node.type === 'group' ? collectImageSources(node.children) : [];
  });
}

export type { RasterFormat, RasterScale };
export { exportScene, supportedFormats };
