# Contributing to RepoFrame

RepoFrame welcomes bug fixes, documentation improvements, and new templates.
Template authoring is the main contribution path: a template should turn
normalized project data into a scene without accessing GitHub, storage, or
Konva directly.

## Setup

Requires Node.js 22.12 or newer and pnpm 11.17.

```sh
git clone https://github.com/orbitsLab/repoframe.git
cd repoframe
pnpm install
pnpm dev
```

Before opening a pull request, run:

```sh
pnpm check
pnpm typecheck
pnpm test
pnpm build
```

## Commit convention

Use an imperative, lowercase Conventional Commit subject with no trailing
period:

```text
feat: add terminal template
fix: preserve transparent background
docs: explain template requirements
```

Allowed types are `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`,
`build`, `ci`, `perf`, and `bump`.

## Template contributions

Start with a template request so the intended layout and use case can be
discussed. Templates must consume normalized project data, declare the data
they require, produce renderer-independent scene data, and keep stable node
identifiers. Include pure-logic tests for registry behavior and node stability.

Create the template under `src/lib/templates/static/`. A minimal structure is:

```ts
import type { Template } from '@/types/template';

const exampleTemplate: Template = {
  id: 'example',
  name: 'Example',
  description: 'A short description of the composition.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData: () => ['repository'],
  settingsSchema: [],
  defaultSettings: {},
  build({ data, ratio }) {
    return {
      width: ratio === '16:9' ? 1200 : 1080,
      height: ratio === '16:9' ? 675 : 1080,
      background: { kind: 'solid', color: '#ffffff' },
      nodes: [],
    };
  },
};

export { exampleTemplate };
```

Add one import and one entry in `src/lib/templates/registry.ts`. Declare all
controls through `settingsSchema`; do not create a React settings panel. Use
shared spacing and type tokens, handle missing and long text, and keep every
node ID tied to a stable visual role. Add the template to the registry and node
stability tests before opening a pull request.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
