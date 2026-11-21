# Implementation report

## Audit and migration

See AUDIT.md for the pre-change assessment. All 25 root HTML sources moved to src/pages. The build restores all 25 original public filenames in dist. No pages or vendor libraries were removed. Extracted 56 deduplicated script blocks and 16 style blocks, plus 41 header/footer variants. Components preserve original DOM positions and markup. Added dependency-free build/preview/check scripts, three offline regressions, lockfile, CI/security workflows, Dependabot, PR template, repository hygiene and documentation. Fixed the malformed data-background selector in legacy main.js. No Git repository exists in this workspace, so no diff/history/remote assessment or commits were possible.

## Security

Implemented: safe DOM construction and bounded ratings for Firestore reviews, moderated pagination, generic text for SDK send errors, same-origin validation for backend redirects. Existing public Firebase/EmailJS configuration retained; no matching privileged secret signatures identified in supplied source. Actual account authorization and historical exposure were not verified. Payment reference acceptance, legacy dependencies and absent backend validation remain high-priority release blockers; see SECURITY.md. Headers/CSP were documented, not falsely represented as enforced on an unknown host. Standalone de_avis uses the external Tailwind runtime CDN, which must also be considered during CSP/dependency review.

## Compatibility and validation

Node 24 syntax/secret-signature checks passed. Three Node tests passed: all page entry points/includes/extracted references, Firestore rendering/moderation regressions, and output filename preservation. Production build passed. Offline npm audit reported zero vulnerabilities for a manifest with zero dependencies; this does not assess vendored/CDN code. Initial test failure was a test selector accidentally matching standalone renderReviews; it was corrected to target the Firestore renderReview function specifically.

Missing HTML/background/CSS font/image references and external dependencies are recorded by `python3 scripts/report-references.py` in REFERENCES.json after building. Existing assets were copied unchanged. Browser tooling was unavailable: visual parity, mobile behavior, console errors, navigation interactions, accessibility and live form/API flows have not been validated. Do not use production services for automated tests. These checks are source/build regressions, not full browser E2E or mocked service integration tests.

## GitHub and deployment

CI installs with npm ci, checks syntax, tests, and builds; security workflow audits dependencies. Actions are pinned and workflows have contents:read permissions; no secrets or deployments. Enable GitHub private vulnerability reporting, secret scanning and branch protection in account settings. No provider was identified: publish dist on the selected static host and follow DEPLOYMENT.md. No deployment, push or backend change was performed.

## Remaining work

This is a reviewable incremental architecture/security migration, not completed production certification. Full service/config consolidation, eliminating duplicate form listeners, dependency upgrades/SRI, trusted backend payment verification, deployed Firestore rules/App Check and abuse controls, enforced hosting headers/CSP, missing original assets, browser E2E/accessibility testing and comprehensive semantic/SEO cleanup remain. Classic scripts and inline style attributes intentionally persist for legacy timing/style compatibility. Confirm extensionless and absent Italian routes with the host owner. Do not claim payment or authorization security until the trusted infrastructure is verified.
