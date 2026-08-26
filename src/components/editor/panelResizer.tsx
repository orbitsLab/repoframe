'use client';

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useRef,
} from 'react';

import { cn } from '@/lib/utils';

/** Bounds a side panel may be dragged between. */
const minPanelWidth = 232;
const maxPanelWidth = 420;
const keyboardStep = 16;

type PanelResizerProps = {
  value: number;
  side: 'left' | 'right';
  label: string;
  onChange(width: number): void;
};

/**
 * Restricts a requested panel width to the supported bounds.
 *
 * @param width - Requested width in pixels.
 * @returns A whole-pixel width between the minimum and maximum bounds.
 */
function clampPanelWidth(width: number): number {
  return Math.round(Math.min(maxPanelWidth, Math.max(minPanelWidth, width)));
}

/**
 * Renders a separator that resizes an editor side panel by drag or arrow keys.
 *
 * @param props - Current width, which edge it sits on, label, and change callback.
 */
function PanelResizer({ value, side, label, onChange }: PanelResizerProps) {
  const drag = useRef<{ x: number; width: number } | undefined>(undefined);
  const direction = side === 'left' ? 1 : -1;

  function handlePointerDown(event: ReactPointerEvent<HTMLHRElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = 'none';
    drag.current = { x: event.clientX, width: value };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLHRElement>) {
    if (!drag.current) {
      return;
    }

    const delta = (event.clientX - drag.current.x) * direction;
    onChange(clampPanelWidth(drag.current.width + delta));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLHRElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.userSelect = '';
    drag.current = undefined;
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLHRElement>) {
    const keyDirection =
      event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;

    if (!keyDirection) {
      return;
    }

    event.preventDefault();
    onChange(clampPanelWidth(value + keyDirection * keyboardStep * direction));
  }

  return (
    <hr
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={minPanelWidth}
      aria-valuemax={maxPanelWidth}
      tabIndex={0}
      className={cn(
        'absolute inset-y-0 z-20 m-0 hidden h-auto w-2 cursor-col-resize touch-none border-none bg-transparent outline-none lg:block',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors',
        'hover:after:bg-foreground focus-visible:after:bg-foreground focus-visible:after:w-0.5',
        side === 'left' ? '-right-1' : '-left-1',
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    />
  );
}

export { clampPanelWidth, PanelResizer };
