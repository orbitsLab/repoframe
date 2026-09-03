'use client';

import { useEffect, useRef } from 'react';

import { renderScene } from '@/lib/renderer/stage';
import type { Scene } from '@/types/scene';

type PreviewProps = {
  scene: Scene;
  label: string;
  compact?: boolean;
};

/**
 * Mounts a responsive Konva preview for a renderer-independent scene.
 *
 * @param props - Scene, accessible label, and optional compact presentation.
 */
function Preview({ scene, label, compact = false }: PreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const container = stageRef.current;
    if (!host || !container) {
      return;
    }

    let disposed = false;
    let stage: Awaited<ReturnType<typeof renderScene>> | undefined;
    let observer: ResizeObserver | undefined;

    // A hidden host measures zero, so the scale it reports is zero too and the
    // stage it carries holds no canvas until the host is shown.
    function scaleFor(hostElement: HTMLDivElement) {
      return Math.min(
        hostElement.clientWidth / scene.width,
        hostElement.clientHeight / scene.height,
        1,
      );
    }

    async function mountStage(
      hostElement: HTMLDivElement,
      stageContainer: HTMLDivElement,
    ) {
      const renderContainer = document.createElement('div');
      stage = await renderScene(scene, renderContainer, scaleFor(hostElement));
      if (disposed) {
        stage.destroy();
        stage = undefined;
        return;
      }

      stage.setContainer(stageContainer);

      function resize() {
        if (disposed || !stage) {
          return;
        }

        const scale = scaleFor(hostElement);
        if (scale === 0) {
          return;
        }

        stage.scale({ x: scale, y: scale });
        stage.width(scene.width * scale);
        stage.height(scene.height * scale);
        stage.draw();
      }

      observer = new ResizeObserver(resize);
      observer.observe(hostElement);
      resize();
    }

    void mountStage(host, container);

    return () => {
      disposed = true;
      observer?.disconnect();
      const mountedStage = stage;
      stage = undefined;
      container.replaceChildren();
      mountedStage?.destroy();
    };
  }, [scene]);

  return (
    <div
      ref={hostRef}
      className={
        compact
          ? 'grid size-full min-w-0 place-items-center overflow-hidden rounded-md [contain:layout_size_paint]'
          : 'grid size-full min-h-0 place-items-center overflow-hidden rounded-lg'
      }
      role="img"
      aria-label={label}
    >
      <div ref={stageRef} className="shrink-0" aria-hidden="true" />
    </div>
  );
}

export { Preview };
