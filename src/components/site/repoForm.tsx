import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RepoFormProps = {
  /** Unique input id, since the form appears more than once per page. */
  id: string;
  className?: string;
};

/**
 * Renders the repository field that hands a URL to the editor.
 *
 * A plain GET form, so it works before hydration and supports middle-click.
 *
 * @param props - Input identifier and optional class names.
 */
function RepoForm({ id, className }: RepoFormProps) {
  return (
    <form
      action="/app"
      method="get"
      className={cn('flex flex-col gap-2 sm:flex-row', className)}
    >
      <label className="sr-only" htmlFor={id}>
        GitHub repository URL
      </label>
      <input
        id={id}
        name="repo"
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        translate="no"
        className="h-11 min-w-0 flex-1 border bg-background px-4 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="github.com/owner/repo…"
        required
      />
      <Button type="submit" size="lg" className="h-11 rounded-none">
        Create Card
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}

export { RepoForm };
