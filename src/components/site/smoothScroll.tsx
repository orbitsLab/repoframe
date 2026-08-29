'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

/** How far the reader may sit from an edge and still be drawn to it. */
const reachRatio = 1;
/** Idle time after the last scroll frame before the viewport settles. */
const settleDelay = 120;
/** Speed, in pixels a frame, below which the reader's glide is spent. */
const glideVelocity = 2;
/** Travel below which the reader counts as still resting on the last edge. */
const restTolerance = 2;

/**
 * Settles idle landing-page scrolling on the next section edge.
 *
 * @param lenis - Active smooth-scroll controller.
 * @returns A cleanup function that removes the listener and pending timer.
 */
function settleOnSections(lenis: Lenis) {
  let timer: number | undefined;
  let direction = 1;
  let landed: number | undefined;

  function settle() {
    const scroll = window.scrollY;
    const header =
      document.querySelector<HTMLElement>('[data-site-header]')?.offsetHeight ??
      0;
    // Read the targets each time: the workbench adds and drops its steps with
    // the viewport, and a resize moves every edge anyway.
    const edges = Array.from(
      document.querySelectorAll<HTMLElement>('[data-snap]'),
      (target) => target.getBoundingClientRect().top + scroll - header,
    );

    // The nearest edge the way the reader is already going, within a screenful:
    // one gesture carries them exactly one section, or one workbench card. A
    // stop further off than that is a long section the reader is still inside,
    // and it stays freely scrollable until its far edge comes into reach.
    const reach = (window.innerHeight - header) * reachRatio;
    const target = edges
      .filter((edge) => (direction > 0 ? edge > scroll : edge < scroll))
      .filter((edge) => Math.abs(edge - scroll) <= reach)
      .reduce<number | undefined>(
        (best, edge) =>
          best === undefined ||
          Math.abs(edge - scroll) < Math.abs(best - scroll)
            ? edge
            : best,
        undefined,
      );

    // Sitting on the edge the last settle chose is not a gesture, so the walk
    // stops there until the reader moves again. Without this it would step on
    // through the page on its own.
    if (
      target === undefined ||
      (landed !== undefined && Math.abs(scroll - landed) < restTolerance)
    ) {
      return;
    }

    landed = target;
    lenis.scrollTo(target, { duration: 0.65 });
  }

  function onScroll() {
    direction = lenis.direction === 0 ? direction : lenis.direction;
    window.clearTimeout(timer);
    // Lenis keeps emitting scroll events while its glide asymptotes, long after
    // the movement has rounded to nothing, so an idle timer alone never elapses
    // until it fully stops — about a second of stillness before the pull even
    // begins. Take over as soon as the glide is spent instead.
    timer = window.setTimeout(
      settle,
      Math.abs(lenis.velocity) > glideVelocity ? settleDelay : 0,
    );
  }

  lenis.on('scroll', onScroll);

  return () => {
    window.clearTimeout(timer);
    lenis.off('scroll', onScroll);
  };
}

/**
 * Connects Lenis to GSAP and enables section settling on the landing page.
 *
 * @returns No UI; scrolling is managed through effects.
 */
function SmoothScroll() {
  const pathname = usePathname();
  const [lenis, setLenis] = useState<Lenis>();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const instance = new Lenis({ duration: 1.05 });
    instance.on('scroll', ScrollTrigger.update);

    function step(time: number) {
      instance.raf(time * 1000);
    }

    gsap.ticker.add(step);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      gsap.ticker.remove(step);
      instance.destroy();
      setLenis(undefined);
    };
  }, []);

  // Only the landing page is built as a sequence of full-height sections, so
  // it is the only route that settles.
  useEffect(() => {
    if (!lenis || pathname !== '/') {
      return;
    }

    return settleOnSections(lenis);
  }, [lenis, pathname]);

  return null;
}

export { SmoothScroll };
