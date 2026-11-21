# Deployment

No hosting provider configuration or Git remote was supplied. The custom domain alone does not establish a provider. No deployment or push was performed.

Build with Node 24: `npm ci --ignore-scripts && npm run build`. Publish only `dist/`. Netlify/Cloudflare Pages can use this build command and publish directory; Vercel requires a static output setting. GitHub Pages requires a separate deployment workflow/account setup; CI here validates only. All `.html` files support direct URLs, including subdirectory hosting with relative assets. A generated 404 page is included. Existing extensionless external/Italian routes need host redirects or missing source pages; do not configure an SPA fallback.

Before release:

- Restore missing template images/fonts from legitimate original sources (see REFERENCES.json).
- Check every language, mobile menu, sliders, form validation, reviews pagination and payment/reference dialog in staging.
- Verify production Firestore rules/indexes, App Check, EmailJS allowed origins and backend payment verification without entering real customer data in test runs.
- Configure HTTPS, response security headers and a tested CSP at a capable host/proxy (SECURITY.md).
- Keep HTML cache short/revalidated. Extracted filenames are descriptive, not immutable content hashes; revalidate JS/CSS/assets too. No immutable cache policy is configured.
- Set distinct staging Firebase/EmailJS account configuration before integration tests. Current browser modules refer to existing public production identifiers.

The local preview implements safe path containment and basic MIME handling. It is a development server, not a production host.
