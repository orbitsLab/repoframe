/** Renders the editor layout placeholder while the client bundle loads. */
function EditorSkeleton() {
  return (
    <main
      className="flex h-dvh flex-col overflow-hidden bg-background"
      aria-busy="true"
    >
      <div className="h-16 animate-pulse border-b bg-muted/50" />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[16.25rem_minmax(0,1fr)_16.25rem]">
        <div className="hidden border-r bg-sidebar lg:block" />
        <div className="grid place-items-center bg-muted/45 p-6">
          <div className="aspect-video w-full max-w-4xl animate-pulse rounded-xl border bg-card shadow-lg" />
        </div>
        <div className="hidden border-l bg-sidebar lg:block" />
      </div>
      <span className="sr-only">Loading RepoFrame editor</span>
    </main>
  );
}

export { EditorSkeleton };
