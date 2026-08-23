/** A solid colour or linear gradient used by a scene shape. */
type Fill =
  | { kind: 'solid'; color: string }
  | {
      kind: 'linear';
      angle: number;
      stops: { offset: number; color: string }[];
    };

/** Drop-shadow values shared by renderers. */
type Shadow = {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

/** Position and bounds shared by every scene node. */
type BaseNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
};

/** Rectangle scene node with optional stroke and shadow styling. */
type RectNode = BaseNode & {
  type: 'rect';
  fill: Fill;
  cornerRadius?: number;
  stroke?: { color: string; width: number };
  shadow?: Shadow;
};

/** Text scene node with renderer-independent typography constraints. */
type TextNode = BaseNode & {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing?: number;
  maxLines?: number;
  overflow: 'clip' | 'ellipsis';
};

/** Image scene node with cover or contain fitting. */
type ImageNode = BaseNode & {
  type: 'image';
  src: string;
  fit: 'cover' | 'contain';
  cornerRadius?: number;
};

/** Clipped group of child scene nodes. */
type GroupNode = BaseNode & {
  type: 'group';
  children: SceneNode[];
};

/** Renderer-independent node with stable role-based identity. */
type SceneNode = RectNode | TextNode | ImageNode | GroupNode;

/** Complete renderer-independent card description. */
type Scene = {
  width: number;
  height: number;
  background: Fill;
  nodes: SceneNode[];
};

export type {
  BaseNode,
  Fill,
  GroupNode,
  ImageNode,
  RectNode,
  Scene,
  SceneNode,
  Shadow,
  TextNode,
};
