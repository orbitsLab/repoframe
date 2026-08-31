'use client';

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef } from 'react';

type CountUpProps = {
  from: number;
  to: number;
  startWhen?: boolean;
  className?: string;
};

/** Counts to its final value once it is in view and released to start. */
function CountUp({ from, to, startWhen = true, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);
  const isInView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const digits = String(to).length;

  useEffect(() => {
    return motionValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = String(Math.round(latest));
      }
    });
  }, [motionValue]);

  useEffect(() => {
    if (!isInView || !startWhen) {
      return;
    }

    if (reducedMotion) {
      motionValue.jump(to);
      return;
    }

    const controls = animate(motionValue, to, {
      duration: 2,
      ease: 'easeOut',
    });

    return () => controls.stop();
  }, [isInView, motionValue, reducedMotion, startWhen, to]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-block',
        width: `calc(${digits}ch + ${digits * 0.11}em)`,
        textAlign: 'right',
      }}
    >
      {from}
    </span>
  );
}

export { CountUp };
