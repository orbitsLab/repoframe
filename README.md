# RepoFrame

RepoFrame turns GitHub repositories into polished social cards. Paste a
repository URL, choose a template, adjust the design, and export an image.

## Privacy

RepoFrame runs entirely in your browser. Repository data comes directly from
GitHub, and your designs, assets, and exported images are never uploaded to a
RepoFrame server.

## Quick start

Requires Node.js 22.12 or newer and pnpm 11.17.

```sh
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the local quality gates before pushing:

```sh
pnpm check
pnpm typecheck
pnpm test
pnpm build
```

## Browser support

RepoFrame supports the latest two versions of Chrome, Edge, Firefox, and Safari
on desktop and mobile. PNG export is supported everywhere. WebP export is
hidden where the browser cannot produce it. Storage caching may be unavailable
in Firefox private browsing and some embedded webviews; the app continues
without caching.

## License

Licensed under the [Apache License 2.0](LICENSE).
