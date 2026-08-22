import Image from 'next/image';

import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-xl sm:p-12">
        <div className="flex items-start justify-between gap-6">
          <Image
            src="/repoframe-logo.svg"
            alt="RepoFrame"
            width={180}
            height={36}
            priority
          />
          <ThemeToggle />
        </div>
        <div className="mt-20 max-w-xl">
          <p className="text-sm font-medium text-primary">Foundation ready</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Make your repository worth sharing.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            RepoFrame will turn GitHub repositories into polished social cards,
            entirely in your browser.
          </p>
        </div>
      </section>
    </main>
  );
}
