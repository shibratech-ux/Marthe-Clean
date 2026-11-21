# MarhaClean

Multilingual cleaning-service static MPA with 25 German, French and English HTML entry points, Bootstrap, jQuery plugins, EmailJS, Firebase Firestore and Firebase Authentication (Google sign-in for customer reviews). No framework or build dependency is required. This migration is not a certification of production security: see [audit](docs/AUDIT.md) and [security requirements](docs/SECURITY.md).

## Quick start

Use Node.js 24 and npm:

```sh
npm ci --ignore-scripts
npm run lint
npm test
npm run build
npm run dev
```

Preview at **http://localhost:8000**. Use `localhost`, not `127.0.0.1`: Firebase only allows Google sign-in from authorized domains, and `127.0.0.1` is not one of them. The preview builds once on start, so restart it after editing. Serve `dist`, not the repository root.

## Project layout

| Path | Contents |
|---|---|
| `src/pages/` | The 25 authored HTML entry points (emitted unchanged by name at the output root) |
| `src/components/` | Shared header/footer includes (`<!-- include:name.html -->`) |
| `src/styles/pages/`, `src/scripts/pages/` | Extracted page CSS and scripts. Some are shared across translations, so search references before editing |
| `src/scripts/reviews.js` | Customer review section on the de/fr/en home pages |
| `src/config/firebase.config.js` | Public Firebase web configuration |
| `assets/` | Legacy template assets and vendored plugins. Paths are preserved |
| `scripts/` | Build, syntax/secret check, local preview server |
| `tests/` | Offline regression tests (no live services) |
| `docs/` | Audit, architecture, security, deployment, references |

`dist/` is generated and not committed.

## Customer reviews

The home pages (`index.html` German, `fr_index.html`, `en_index.html`) show the 5 newest reviews from the Firestore `reviews` collection, ordered by `createdAt`. A "See all" dialog has sort and search, and long reviews open in a detail dialog. On phones the list becomes a horizontal swipe row. Writing a review requires Google sign-in. Each review stores `name, rating, message, createdAt, uid, authorName, photoURL`. Reviews are published without moderation (owner decision). See [SECURITY.md, "Review sign-in"](docs/SECURITY.md) for the data shape and recommended rules.

**Firebase console setup the site depends on (not managed by this repository):**

1. Authentication → Sign-in method: Google enabled (verified enabled).
2. Authentication → Settings → Authorized domains: add `marthacleanbesia.ch` (and `www.` if used). Without it, sign-in fails in production with `auth/unauthorized-domain`.
3. Firestore rules: deploy rules that require sign-in for writes and validate fields. A suggested rule is in SECURITY.md. Until then, the sign-in requirement is enforced only in the browser.

## Public keys and configuration

There are no required environment variables (see `.env.example`). The Firebase web config and EmailJS public key are public by design and ship in browser code. Once the repository is public, anyone can copy them, so restrict them at the provider:

- Google Cloud console → APIs & Services → Credentials: restrict the Firebase browser API key to HTTP referrers (`marthacleanbesia.ch/*`, `localhost:8000/*`, the Firebase auth domain).
- EmailJS dashboard: allow only the site's origins. Consider Firebase App Check for Firestore.

Never put backend credentials (Firebase Admin/service-account JSON, private keys) in this repository. `.gitignore` blocks common credential filenames, and `npm run lint` scans first-party JavaScript for private-key signatures.

## Checks and CI

`npm run lint` is a dependency-free syntax and secret-signature check, not ESLint/style validation. `npm test` runs offline regressions and never contacts live services. GitHub Actions (`.github/workflows`) run lint, tests and build on every push and pull request, plus a weekly dependency audit. There are zero npm dependencies, so `npm audit` does not cover the vendored/CDN libraries. Dependabot watches npm and GitHub Actions.

Open a branch and PR. See [architecture](docs/ARCHITECTURE.md), [deployment](docs/DEPLOYMENT.md) and [contributing](CONTRIBUTING.md).
