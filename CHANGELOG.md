# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-01

First public release. Repo Frame turns a public GitHub repository into a social
card, entirely in the browser.

### Added

#### Repository data

- GitHub URL parser accepting the forms a repository is usually shared in
- GitHub REST client and a normalized, provider-independent project data model
- IndexedDB storage layer, a 30-minute repository cache, and local persistence
  of the active project
- Content-aware requests that fetch only the data the chosen template declares
- Repositories that turn pull requests off, and those whose contributor list
  GitHub declines to serve, load as cards drawn without those figures

#### Templates and rendering

- Renderer-independent scene graph and a schema-driven template contract
- 26 static templates across the minimal, developer, and editorial categories
- Four aspect ratios: 1:1, 4:5, 16:9, and 9:16
- Shared layout, theme, spacing, and typography foundation for template authors
- Konva scene renderer with self-hosted font loading and text measurement
- Per-template colour palettes offered as one-click themes
- Metric figures measured against the cell that holds them, so counts in the
  hundreds of thousands are set to fit rather than cut short
- Export to PNG, WebP, and JPEG at five pixel densities

#### Editor

- Editor workspace with schema-generated settings panels
- HSV colour picker and a styled dropdown replacing the native controls
- Template picker that centres the selected template when it opens
- Header and panel layout reworked for narrow screens

#### Public site

- Landing page, template gallery, and template detail pages
- Landing page cards drawn from six well-known repositories, each a committed
  snapshot so the page renders without a network call
- Repo Frame mark, app icons, and the display, data, and crop type styles
- Scroll and motion stack: GSAP with ScrollTrigger, Lenis, and motion
- FAQ section, a call for support, and an Orbits Lab footer lockup
- Canonical URLs, an Open Graph card drawn at build time, structured data, a
  sitemap, and crawl rules

#### Project

- Apache-2.0 licence and community health files
- Biome for linting and formatting, with enforced architecture boundaries
- Vitest suite covering URL parsing, data normalization, template layout, text
  fitting, metric fit across every template and ratio, the GitHub fetchers, the
  registry, and node stability
- Husky hooks for staged formatting, commit message format, and the pre-push
  gate

### Fixed

- Template picker scrolled the whole application instead of its own list
- Images looked soft in the canvas preview
- Preview failed to draw when its host measured zero
- Create card button height did not match its input
- FAQ answers stated behaviour the codebase does not have

### Changed

- Theme changes repaint the page pixel by pixel
- Docs and about pages removed in favour of the landing page and the repository

[Unreleased]: https://github.com/orbitsLab/repoframe/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/orbitsLab/repoframe/releases/tag/v1.0.0
