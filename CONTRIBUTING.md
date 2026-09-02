# Contributing to Repo Frame

Repo Frame welcomes bug fixes, documentation improvements, and new templates.
Template authoring is the main contribution path: a template turns normalized
project data into a scene without touching GitHub, storage, or Konva.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs

Check the [issues](https://github.com/orbitsLab/repoframe/issues) first. If the
problem is new, open a [bug report](https://github.com/orbitsLab/repoframe/issues/new?template=bug_report.md)
with a clear title and enough detail to reproduce it: the steps you took, what
you expected, your browser and operating system, and the repository URL you
used. Screenshots and exported files help. Remove private information first.

## Suggesting templates and features

Start a [template request](https://github.com/orbitsLab/repoframe/issues/new?template=template_request.md)
before writing a template, so the layout and the repositories it suits can be
discussed first. Broader product ideas belong in
[discussions](https://github.com/orbitsLab/repoframe/discussions).

## Working on issues

Use the app before contributing to it. Issues are assigned once there has been
enough discussion of the approach, and an assignment that stops moving is
released so someone else can pick it up. If you want to write code for an open
issue, discuss the issue and your proposed solution first.

A pull request for a small bug fix without prior discussion is fine, as long as
you explain the why and the how.

## Generative AI use

Some AI use is inevitable and this project does not prohibit it. Purely
vibe-coded pull requests are not approved.

If you use AI to generate code, say so in the pull request. You own the result
and you maintain it, and you should expect as many review questions as the code
warrants. Not disclosing generated code is treated as dishonest, and the pull
request is closed.

## Setup

Requires Node.js 22.12 or newer and pnpm 11.17.

```sh
git clone https://github.com/orbitsLab/repoframe.git
cd repoframe
pnpm install
pnpm dev
```

The dev server runs on [http://localhost:3001](http://localhost:3001).

## Submitting a pull request

1. Fork the repository and branch from `main`, named `feature/xyz` or `fix/xyz`.
2. Make the change, keeping it to one concern.
3. Run the full gate:

   ```sh
   pnpm check
   pnpm typecheck
   pnpm test
   pnpm build
   ```

4. Open a pull request against `main`, describe the change and why it is
   needed, and reference the issue it addresses. Images or a short video make a
   visual change much quicker to review.

## Code quality

Biome handles both linting and formatting. There is no ESLint and no Prettier.
Run `pnpm check:fix` before committing.

| Task | Command |
| --- | --- |
| Lint and format check | `pnpm check` |
| Autofix | `pnpm check:fix` |
| Type check | `pnpm typecheck` |
| Tests | `pnpm test` |
| Build | `pnpm build` |

Biome also enforces the architecture boundaries described in
[ARCHITECTURE.md](ARCHITECTURE.md): templates and renderers cannot import
GitHub or storage code, and scene types and templates cannot import Konva.

### Git hooks

Husky installs three hooks on `pnpm install`:

- `pre-commit` formats and lints staged files through lint-staged.
- `commit-msg` rejects a subject that is not a Conventional Commit.
- `pre-push` runs check, typecheck, test, and build.

## Commit convention

Use an imperative, lowercase Conventional Commit subject with no trailing
period:

```text
feat: add terminal template
fix: preserve transparent background
docs: explain template requirements
```

Allowed types are `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`,
`build`, `ci`, `perf`, and `bump`. An optional scope goes in parentheses, as in
`feat(site):`.

## Template contributions

A template must consume normalized project data, declare the data it requires,
produce renderer-independent scene data, and keep stable node identifiers.

Create it under `src/lib/templates/static/`:

```ts
import type { Scene } from '@/types/scene';
import type { Template } from '@/types/template';

const exampleTemplate: Template = {
  id: 'example',
  name: 'Example',
  description: 'A short description of the composition.',
  category: 'editorial',
  supportedRatios: ['1:1', '4:5', '16:9', '9:16'],
  requiredData: () => ['repository', 'owner'],
  settingsSchema: [
    {
      key: 'background',
      label: 'Background',
      section: 'theme',
      type: 'color',
    },
  ],
  defaultSettings: { background: '#ffffff' },
  colorPresets: [
    {
      id: 'paper',
      name: 'Paper',
      settings: { background: '#ffffff' },
    },
  ],
  build({ ratio, settings }): Scene {
    return {
      width: ratio === '16:9' ? 1200 : 1080,
      height: ratio === '16:9' ? 675 : 1080,
      background: { kind: 'solid', color: settings.background as string },
      nodes: [],
    };
  },
};

export { exampleTemplate };
```

`build` also receives `data` and a `measure` function that wraps and measures
text with the renderer's loaded fonts. Use it rather than estimating text
widths.

Then add one import and one entry in `src/lib/templates/registry.ts`.

Declare every control through `settingsSchema`; do not write a React settings
panel. Use the shared spacing and type tokens in
`src/lib/templates/shared/`, handle missing and overlong text, and tie every
node ID to a stable visual role. Add the template to the registry and node
stability tests before opening a pull request.

Thank you for helping improve Repo Frame.
