# RepoFrame Pre-release Checklist

Complete this checklist before tagging `v1.0.0`.

## Project identity

- [ ] Add the Git remote and verify the public repository URL used in
      `src/lib/site.ts`.
- [ ] Set the final production domain. If it differs from Vercel's generated
      production URL, replace the automatic URL in `src/lib/site.ts`.
- [ ] Verify canonical URLs, Open Graph URLs, `sitemap.xml`, and `robots.txt`
      against the production domain.

## Renderer-accurate samples

- [ ] Start the production build and open `/app` without importing a repository.
- [ ] Export Minimal, Terminal, and Bento at `16:9`, PNG, 2× using the committed
      sample project.
- [ ] Save the files as `public/og/minimal.png`, `terminal.png`, and `bento.png`.
- [ ] Replace the development-only HTML samples in
      `src/components/site/sampleCard.tsx` with those committed images.
- [ ] Add the default sample image to root and route Open Graph metadata.
- [ ] Add a sample card image to `README.md`.

## Product checks

- [ ] Import `https://github.com/alfaarghya/alfa-leetcode-api` in a cold browser profile and
      export a PNG within 30 seconds using no more than five GitHub requests.
- [ ] Repeat the import and confirm zero GitHub requests and an identical card.
- [ ] Switch every template, ratio, setting section, format, and scale.
- [ ] Reload and confirm the repository, template, ratio, and settings restore.
- [ ] Confirm hiding optional content sends no request and enabling it fetches
      only missing data.
- [ ] Exercise invalid URL, not found, offline, rate limited, empty repository,
      no release, one contributor, dead avatar, and long/non-ASCII text states.
- [ ] Confirm rate-limit copy reports the correct reset time in minutes.
- [ ] Confirm repository text containing HTML and quotes stays literal in the
      canvas and DOM.

## Browser and device matrix

- [ ] Export all three templates at all four ratios as PNG.
- [ ] Confirm Chrome and Firefox offer WebP and produce WebP magic bytes.
- [ ] Confirm Safari hides WebP and exports PNG at every ratio.
- [ ] Confirm a 9:16, 2× export is non-blank on a real iPhone.
- [ ] Confirm preview and 2× export have identical wrapping after a cold font
      cache and a hard reload.
- [ ] Confirm normal exports finish in under two seconds.
- [ ] Test the full editor with keyboard only.
- [ ] Test Content and Design sheets with keyboard and touch on a phone.

## Security, accessibility, and performance

- [ ] Verify the production Content-Security-Policy header on every route and
      resolve every browser console violation.
- [ ] Confirm no GitHub avatar is rendered through a plain `<img>` element.
- [ ] Run Lighthouse on `/`: performance at least 90, SEO at least 95, and
      accessibility at least 95.
- [ ] Verify focus order, labels, contrast, reduced motion, and the preview's
      screen-reader alternative.
- [ ] Confirm every `/templates/[slug]` route is statically generated.

## Release

- [ ] Run `pnpm install`, `pnpm check`, `pnpm typecheck`, `pnpm test`, and
      `pnpm build` from a clean checkout.
- [ ] Deploy the final `main` branch to Vercel and repeat the cold-profile smoke
      test on production.
- [ ] Change the root package version to `1.0.0` and commit
      `bump: version 1.0.0`.
- [ ] Create the annotated `v1.0.0` tag and push with `--follow-tags`.
- [ ] Create the GitHub release with sample cards and notes from the commit log.
- [ ] Paste the production URL into a chat application and verify its link
      preview.
