'use client';

import { Popover } from 'radix-ui';
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useState,
} from 'react';

import { hexToRgb, rgbToHex } from '@/lib/color';
import { cn } from '@/lib/utils';

type ColorPickerProps = {
  color: string;
  onChange(color: string): void;
  labelledBy: string;
  className?: string;
};

const hexPattern = /^#[0-9a-f]{6}$/i;

/**
 * Converts HSV components to 8-bit RGB channels.
 *
 * @param hue - Hue in degrees, from 0 to 360.
 * @param saturation - Saturation from 0 to 1.
 * @param value - Brightness from 0 to 1.
 * @returns Red, green, and blue channels.
 */
function hsvToRgb(
  hue: number,
  saturation: number,
  value: number,
): [number, number, number] {
  const channel = (offset: number) => {
    const position = (offset + hue / 60) % 6;
    const shade = Math.max(0, Math.min(position, 4 - position, 1));
    return Math.round(255 * (value - value * saturation * shade));
  };

  return [channel(5), channel(3), channel(1)];
}

/**
 * Converts 8-bit RGB channels to HSV components.
 *
 * @param channels - Red, green, and blue channels.
 * @returns Hue in degrees, saturation, and brightness.
 */
function rgbToHsv([red, green, blue]: [number, number, number]) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const span = max - min;
  let hue = 0;

  if (span !== 0) {
    if (max === red) {
      hue = ((green - blue) / span + (green < blue ? 6 : 0)) * 60;
    } else if (max === green) {
      hue = ((blue - red) / span + 2) * 60;
    } else {
      hue = ((red - green) / span + 4) * 60;
    }
  }

  return [hue, max === 0 ? 0 : span / max, max / 255] as const;
}

/**
 * Follows a pointer across an element and reports its position as a fraction
 * of the element's size until the pointer is released.
 *
 * @param event - Pointer event that started the drag.
 * @param onMove - Receives horizontal and vertical positions from 0 to 1.
 */
function trackDrag(
  event: ReactPointerEvent<HTMLElement>,
  onMove: (x: number, y: number) => void,
) {
  const element = event.currentTarget;
  const read = (point: { clientX: number; clientY: number }) => {
    const rect = element.getBoundingClientRect();
    onMove(
      Math.max(0, Math.min(1, (point.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (point.clientY - rect.top) / rect.height)),
    );
  };

  const move = (moveEvent: PointerEvent) => read(moveEvent);
  const stop = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
  };

  event.preventDefault();
  read(event.nativeEvent);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
}

/**
 * Hex color picker with a saturation field, hue slider, and channel inputs.
 *
 * @param props - Current hex color, change callback, and the id of its label.
 */
function ColorPicker({
  color,
  onChange,
  labelledBy,
  className,
}: ColorPickerProps) {
  const hex = hexPattern.test(color) ? color.toLowerCase() : '#000000';
  const rgb = hexToRgb(hex);
  const [hue, saturation, value] = rgbToHsv(rgb);
  const hueHex = rgbToHex(hsvToRgb(hue, 1, 1));
  const [draft, setDraft] = useState(hex);

  useEffect(() => {
    setDraft(hex);
  }, [hex]);

  function commitHsv(
    nextHue: number,
    nextSaturation: number,
    nextValue: number,
  ) {
    onChange(rgbToHex(hsvToRgb(nextHue, nextSaturation, nextValue)));
  }

  function commitChannel(index: number, channel: number) {
    const next: [number, number, number] = [...rgb];
    next[index] = Math.max(0, Math.min(255, Math.trunc(channel) || 0));
    onChange(rgbToHex(next));
  }

  function commitDraft(next: string) {
    setDraft(next);
    if (hexPattern.test(next)) {
      onChange(next.toLowerCase());
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-labelledby={labelledBy}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-md border bg-background px-2 shadow-xs outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <span
            className="size-5 shrink-0 rounded border"
            style={{ backgroundColor: hex }}
          />
          <span className="font-mono text-xs uppercase">{hex}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-64 space-y-3 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
        >
          <div
            className="relative h-36 w-full cursor-crosshair rounded"
            style={{
              background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueHex})`,
            }}
            onPointerDown={(event) =>
              trackDrag(event, (x, y) => commitHsv(hue, x, 1 - y))
            }
          >
            <span
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
              style={{
                left: `${saturation * 100}%`,
                top: `${(1 - value) * 100}%`,
                backgroundColor: hex,
              }}
            />
          </div>
          <div
            className="relative h-3 w-full cursor-pointer rounded-full"
            style={{
              background:
                'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
            onPointerDown={(event) =>
              trackDrag(event, (x) => commitHsv(x * 360, saturation, value))
            }
          >
            <span
              className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
              style={{ left: `${(hue / 360) * 100}%`, backgroundColor: hueHex }}
            />
          </div>
          <input
            className="h-8 w-full rounded-md border bg-background px-2 font-mono text-xs uppercase shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={draft}
            onChange={(event) => commitDraft(event.target.value)}
            onBlur={() => setDraft(hex)}
            maxLength={7}
            aria-label="Hex value"
            aria-invalid={!hexPattern.test(draft)}
          />
          <div className="grid grid-cols-3 gap-2">
            {(['R', 'G', 'B'] as const).map((name, index) => (
              <label
                key={name}
                className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground"
              >
                {name}
                <input
                  type="number"
                  min={0}
                  max={255}
                  step={1}
                  value={rgb[index]}
                  onChange={(event) =>
                    commitChannel(index, Number(event.target.value))
                  }
                  className="h-8 w-full min-w-0 rounded-md border bg-background px-1.5 text-center font-mono text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { ColorPicker };
