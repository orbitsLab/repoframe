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

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
