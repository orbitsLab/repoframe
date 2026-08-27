import Konva from 'konva';

import { fontsReady } from '@/lib/renderer/fonts';
import { loadImage } from '@/lib/renderer/images';
import type {
  Fill,
  ImageNode,
  RectNode,
  Scene,
  SceneNode,
  TextNode,
} from '@/types/scene';

Konva.autoDrawEnabled = false;

/**
 * Renders a scene into a Konva stage after renderer fonts are ready.
 *
 * @param scene - Renderer-independent scene to draw.
 * @param container - Element that hosts the Konva stage.
 * @returns The rendered stage, which the caller must destroy when finished.
 */
async function renderScene(scene: Scene, container: HTMLDivElement) {
  await fontsReady;

  const stage = new Konva.Stage({
    container,
    width: scene.width,
    height: scene.height,
  });
  const layer = new Konva.Layer();
  // A preview is drawn below the scene size, so the layer keeps at least a
  // doubled backing store to stop images softening on low-density screens.
  layer.getCanvas().setPixelRatio(Math.max(2, window.devicePixelRatio || 1));
  layer.add(
    new Konva.Rect({
      id: 'scene-background',
      x: 0,
      y: 0,
      width: scene.width,
      height: scene.height,
      ...fillConfig(scene.background, scene.width, scene.height),
    }),
  );

  for (const node of scene.nodes) {
    layer.add(await createNode(node));
  }

  stage.add(layer);
  layer.draw();
  return stage;
}

async function createNode(
  node: SceneNode,
): Promise<Konva.Rect | Konva.Text | Konva.Image | Konva.Group> {
  if (node.type === 'rect') {
    return createRect(node);
  }

  if (node.type === 'text') {
    return createText(node);
  }

  if (node.type === 'image') {
    return createImage(node);
  }

  const group = new Konva.Group({
    ...baseConfig(node),
    clip: { x: 0, y: 0, width: node.width, height: node.height },
  });

  for (const child of node.children) {
    group.add(await createNode(child));
  }

  return group;
}

function createRect(node: RectNode) {
  return new Konva.Rect({
    ...baseConfig(node),
    ...fillConfig(node.fill, node.width, node.height),
    cornerRadius: node.cornerRadius,
    stroke: node.stroke?.color,
    strokeWidth: node.stroke?.width,
    shadowColor: node.shadow?.color,
    shadowBlur: node.shadow?.blur,
    shadowOffsetX: node.shadow?.offsetX,
    shadowOffsetY: node.shadow?.offsetY,
    shadowOpacity: node.shadow?.opacity,
  });
}

function createText(node: TextNode) {
  return new Konva.Text({
    ...baseConfig(node),
    text: node.text,
    fontFamily: node.fontFamily,
    fontSize: node.fontSize,
    fontStyle: String(node.fontWeight),
    fill: node.color,
    align: node.align,
    lineHeight: node.lineHeight,
    letterSpacing: node.letterSpacing,
    wrap: node.overflow === 'ellipsis' ? 'word' : 'none',
    ellipsis: node.overflow === 'ellipsis',
  });
}

async function createImage(node: ImageNode) {
  const image = await loadImage(node.src);
  const dimensions = fitImage(image, node);

  return new Konva.Image({
    ...baseConfig(node),
    ...dimensions,
    image,
    cornerRadius: node.cornerRadius,
  });
}

function fitImage(image: HTMLImageElement, node: ImageNode) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = node.width / node.height;

  if (node.fit === 'contain') {
    const width = imageRatio > boxRatio ? node.width : node.height * imageRatio;
    const height =
      imageRatio > boxRatio ? node.width / imageRatio : node.height;
    return {
      x: node.x + (node.width - width) / 2,
      y: node.y + (node.height - height) / 2,
      width,
      height,
    };
  }

  const cropWidth =
    imageRatio > boxRatio ? image.naturalHeight * boxRatio : image.naturalWidth;
  const cropHeight =
    imageRatio > boxRatio ? image.naturalHeight : image.naturalWidth / boxRatio;

  return {
    crop: {
      x: (image.naturalWidth - cropWidth) / 2,
      y: (image.naturalHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    },
  };
}

function baseConfig(node: SceneNode) {
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    opacity: node.opacity,
  };
}

function fillConfig(fill: Fill, width: number, height: number) {
  if (fill.kind === 'solid') {
    return { fill: fill.color };
  }

  const radians = (fill.angle * Math.PI) / 180;
  const centerX = width / 2;
  const centerY = height / 2;
  const distance =
    Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const x = (Math.cos(radians) * distance) / 2;
  const y = (Math.sin(radians) * distance) / 2;

  return {
    fillLinearGradientStartPoint: { x: centerX - x, y: centerY - y },
    fillLinearGradientEndPoint: { x: centerX + x, y: centerY + y },
    fillLinearGradientColorStops: fill.stops.flatMap((stop) => [
      stop.offset,
      stop.color,
    ]),
  };
}

export { renderScene };
