# Initial audit and migration plan

Discovery completed before architecture changes. All 51 text sources/configurations were read; 78 files inventoried (about 4 MB). There are 25 independent German, French and English HTML pages. Existing `.github/copilot-instructions.md` is stale (omits English). No Git metadata, package manifest, deployment configuration, backend, Firebase rules or tests exist. No private-key, GitHub-token or AWS-key signatures were found in the supplied files; this is not a history scan. Firebase browser configuration and EmailJS public identifiers are public configuration, not privileged credentials.

## Findings

- High: Firestore review pagination omits the moderation filter. Fix client query; backend rules still require independent verification.
  - Update 2026-11-21: the home-page review section was rewritten (`src/scripts/reviews.js`) with Google sign-in for writes. By owner decision the `autoriser` display filter was then removed, so reviews publish without moderation. See SECURITY.md "Review sign-in".
- High: payment screens accept a transaction reference and use hardcoded example amounts. A reference submission is not payment verification. A trusted provider webhook/backend is required before treating a booking as paid.
- Medium: error objects interpolated into HTML feedback. Replace with generic text feedback.
- Medium: untrusted review records rendered using string templates; existing escaping is inconsistent and rating repetition unbounded. Use DOM nodes and bounded ratings.
- High residual: anonymous Firestore writes/reads and EmailJS abuse controls cannot be audited without deployed rules/account settings. No session authentication exists in supplied code. Hidden moderation fields do not authorize access.
- Medium: Bootstrap 5.0.0-beta3, jQuery 3.6.0 and assorted vendored plugins lack dependency tracking. Remote Firebase versions differ (9.6.1/11.0.1), EmailJS uses a major-version CDN URL. Compatibility-tested upgrades remain necessary.
- Broken paths: many images/fonts referenced by the template are absent from this snapshot. External same-domain links rely on extensionless hosting routes; Italian pages are absent.
- Maintainability: repeated layout, inline styles/scripts, duplicated form handlers, large template stylesheet and legacy unused feature initializers. Preserve plugin ordering and avoid speculative removal.

## Planned migration

1. Keep every HTML filename at the production root. Move authored pages to `src/pages`; build into `dist` with no framework or runtime layout fetch.
2. Extract inline style blocks and executable scripts into content-deduplicated files. Preserve classic script execution order; existing module scripts remain ES modules. Retain legacy plugin compatibility rather than blindly converting globals.
3. Extract identical complete headers/footers into build-time components, preserving translated variants and DOM positions.
4. Copy existing assets unchanged. Normalize only same-domain URLs with known local targets. Produce a missing-reference report instead of inventing assets or translations.
5. Add dependency-free build, checks, regression tests, least-privilege CI and security workflow, contribution/security/deployment documentation.
6. Validate generated scripts, page coverage, local links and security regressions offline. Browser/live integration checks require separate verification; never submit production data during tests.

No deployment provider can be inferred reliably from a hostname. Production readiness remains conditional on missing assets, backend authorization, payment verification and browser validation.
