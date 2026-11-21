# MarhaClean agent instructions

This is a 25-page static MPA using a dependency-free Node 24 build. Read docs/AUDIT.md, docs/ARCHITECTURE.md and docs/SECURITY.md first.

- Author pages in src/pages; shared trusted HTML includes in src/components. Production filenames must remain unchanged. dist is generated.
- Keep assets paths and jQuery/plugin ordering. Classic parser-time scripts are intentional; preserve timing when converting to modules.
- Extracted page-named scripts/styles may be shared across translations: search all references before editing.
- Preserve the existing visual identity and translated content. Do not fabricate missing images, contact information, backend endpoints or translations.
- Use textContent/DOM creation for untrusted data. Do not add privileged credentials to browser code, logs or public assets. Public Firebase configuration is not a secret.
- Do not change live Firestore document shapes without explicit authorization. Never submit tests to production collections. Moderation filters do not replace backend rules.
- Payment references are unverified user input. Require trusted backend verification before claiming payment success.
- No new dependency without a concrete need and compatibility review. Do not migrate frameworks or edit vendor bundles speculatively.
- Run npm run lint, npm test, npm run build. Report exact failures and distinguish offline checks from browser/live-service verification.
- Definition of done: URL/asset compatibility checked, focused regressions pass, security/deployment limitations documented, no automatic push or deployment.
