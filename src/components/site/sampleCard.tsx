import { GitFork, Star } from 'lucide-react';

import { cn } from '@/lib/utils';

type SampleCardProps = {
  templateId: string;
  className?: string;
};

/**
 * Renders a lightweight static template sample for public pages.
 *
 * @param props - Template identifier and optional class names.
 */
function SampleCard({ templateId, className }: SampleCardProps) {
  if (templateId === 'terminal') {
    return (
      <div
        className={cn(
          'aspect-video overflow-hidden rounded-xl bg-[#0b0d10] p-[5%] font-mono text-[#e6edf3]',
          className,
        )}
      >
        <div className="size-full rounded-lg border border-[#30363d] bg-[#12161c] p-[6%] shadow-2xl">
          <p className="text-[clamp(0.55rem,1.5vw,1rem)] text-[#7ee787]">
            $ gh repo view
          </p>
          <p className="mt-[4%] text-[clamp(1rem,4vw,2.6rem)] font-bold">
            alfaarghya/alfa-leetcode-api
          </p>
          <p className="mt-[3%] max-w-xl text-[clamp(0.55rem,1.5vw,1rem)] text-[#8b949e]">
            A custom API for LeetCode profiles and problems.
          </p>
        </div>
      </div>
    );
  }

  if (templateId === 'bento') {
    return (
      <div
        className={cn(
          'aspect-video rounded-xl bg-gradient-to-br from-[#ebe9ff] to-[#d8f4ff] p-[6%] text-[#19172b]',
          className,
        )}
      >
        <p className="text-[clamp(1rem,3vw,2.2rem)] font-extrabold">
          alfaarghya/alfa-leetcode-api
        </p>
        <div className="mt-[5%] grid grid-cols-3 gap-[3%]">
          {['815 Stars', '327 Forks', 'TypeScript 98%'].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-[#d7d2f2] bg-white p-[10%] text-[clamp(0.45rem,1.3vw,0.9rem)] font-bold shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'aspect-video rounded-xl bg-gradient-to-br from-[#f6f3ec] to-[#e8e2ff] p-[8%] text-[#151515]',
        className,
      )}
    >
      <p className="text-[clamp(0.5rem,1.4vw,0.9rem)] font-bold tracking-widest text-[#5b5bd6]">
        OPEN SOURCE PROJECT
      </p>
      <p className="mt-[4%] text-[clamp(1.3rem,5vw,3.5rem)] font-extrabold tracking-tight">
        alfaarghya/alfa-leetcode-api
      </p>
      <p className="mt-[3%] text-[clamp(0.6rem,1.5vw,1rem)] text-[#66645f]">
        A custom API for LeetCode profiles and problems.
      </p>
      <div className="mt-[6%] flex gap-5 text-[clamp(0.55rem,1.4vw,0.9rem)] font-semibold">
        <span className="inline-flex items-center gap-1">
          <Star className="size-[1em]" aria-hidden="true" /> 815
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-[1em]" aria-hidden="true" /> 327
        </span>
      </div>
    </div>
  );
}

export { SampleCard };
