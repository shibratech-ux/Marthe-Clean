# Architecture

The dependency-free Node build expands trusted local `<!-- include:filename.html -->` directives, copies assets, and emits independent root HTML pages. No runtime layout requests, SPA router, Vite or client framework is necessary. Original HTML filenames are the URL contract. Links to existing same-domain pages now use relative `.html` paths; unresolved external routes remain external.

```
.github/                  CI, dependency audit, Dependabot, PR template
src/pages/                25 authored entry points (moved from root)
src/components/           identical shared header/footer variants
src/scripts/pages/        extracted scripts, deduplicated by original content
src/styles/pages/         extracted style blocks, deduplicated by original content
assets/                   original styles, images and vendored plugins
scripts/                  build, syntax checks, local preview
 tests/                   offline build/security regressions
 docs/                    audit, architecture, security, deployment, references
```

Page-derived filenames indicate the first owner of a shared extracted block; search references before changing one. The original stylesheet remains authoritative for design tokens, typography, breakpoints and layouts. Style blocks retain document order. Inline style attributes remain for legacy plugin compatibility.

Existing Firebase scripts remain ES modules; early language and dialog scripts retain classic execution semantics. This is an incremental migration, not complete module/service decomposition: extracting every script into deferred modules would change parser timing. jQuery and plugin globals are a documented compatibility boundary. Plugin order is unchanged. No collection names were changed. With owner authorization, new `reviews` documents add `uid` and `photoURL` (see SECURITY.md, "Review sign-in"). The home-page review section (de `index.html`, `fr_index.html`, `en_index.html`) is implemented once in `src/scripts/reviews.js` and styled by `fr_index-2.css` / `en_index-2.css`; the page scripts `index-2.js`, `fr_index-2.js`, `en_index-2.js` only call `initReviews()` and keep the request-form handlers.

npm has no runtime/development dependencies. Vendored/CDN libraries require manual inventory and compatibility-tested upgrades; Dependabot only covers package and workflow manifests. No assets were intentionally deleted. Missing legacy template assets remain listed in the reference report. Full HTML semantics, translated navigation behavior and visual parity require browser review.
