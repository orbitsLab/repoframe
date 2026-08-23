import type { TextNode } from '@/types/scene';

/**
 * Creates a text scene node with template-wide layout defaults.
 *
 * @param id - Stable role-based node identifier.
 * @param values - Text content, style, and bounds.
 * @returns A complete text scene node.
 */
function textNode(
  id: string,
  values: Omit<
    TextNode,
    'id' | 'type' | 'align' | 'overflow' | 'lineHeight'
  > & {
    align?: TextNode['align'];
    lineHeight?: number;
    overflow?: TextNode['overflow'];
  },
): TextNode {
  return {
    id,
    type: 'text',
    align: values.align ?? 'left',
    overflow: values.overflow ?? 'ellipsis',
    lineHeight: values.lineHeight ?? 1,
    maxLines: values.maxLines ?? 1,
    ...values,
  };
}

export { textNode };
