# Architecture

RepoFrame is a single Next.js application. Its product architecture follows
four non-negotiable rules.

1. There is no backend. The browser talks directly to GitHub, so every visitor
   uses their own unauthenticated rate limit.
2. Nothing leaves the browser. Designs, assets, and generated images are never
   uploaded.
3. Templates never access GitHub. They receive normalized project data through
   a provider-independent boundary.
4. The scene graph never depends on Konva. Renderers consume the scene graph,
   which keeps future render targets possible.

## Source layout

```text
src/
├── app/          Next.js routes and global styles
├── components/   React components grouped by feature
├── editor/       Editor state and scene operations without React
├── hooks/        Shared React hooks
├── lib/          Data, storage, rendering, templates, and utilities
└── types/        Shared type declarations without runtime code
```

Files that render React belong in `components/` or `hooks/`. Editor state and
scene operations belong in `editor/`. Other non-React code belongs in `lib/`.
Shared domain declarations belong in `types/`.

## Enforced boundaries

Biome prevents templates and renderers from importing GitHub or storage code.
It also prevents scene types and templates from importing Konva. These rules
replace package boundaries that a monorepo would otherwise provide.

The restrictions are enforced because a direct data-provider import makes a
template impossible to reuse or test with normalized data, while a renderer
import in the scene model makes every future renderer depend on Konva. Keeping
the checks in lint catches violations before review, including in community
templates.
