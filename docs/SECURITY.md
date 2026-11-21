# Security policy and residual risks

Do not send secrets or customer information in public issues. Use GitHub private vulnerability reporting when enabled by the repository owner; otherwise obtain a private maintainer channel first. No security contact address was supplied.

## Implemented

Review rendering uses DOM nodes/textContent and bounded star counts. The home-page review list no longer filters on `autoriser` (owner decision 2026-11-21, see below). SDK errors are no longer interpolated into feedback markup. API-provided redirects must resolve to the page origin. No private credentials matching the inspected signatures were identified. No Git history is available in this workspace. Security checks are signature-based and incomplete by design.

Firebase browser config and EmailJS public keys are not secrets. Protect Firestore with deployed rules and App Check, validate allowed fields/types/lengths server-side, deny public reads of contact/request/payment data, prohibit clients changing moderation state, restrict anonymous writes and configure quotas/rate limits. Verify these controls in the actual account; this repository contains no evidence they are enabled. Client moderation queries do not authorize reads.

Payment pages contain example amounts and accept user-supplied transaction identifiers. Never mark an invoice paid on that basis. A backend must verify signed provider webhooks, invoice ownership, amount/currency and replay/idempotency. These pages are not a trusted payment processor. No backend has been invented or deployed.

LocalStorage is used for language and the standalone local review demonstration, not authentication credentials. Do not add session tokens there. Future server sessions require Secure, HttpOnly, SameSite cookies, backend authorization and CSRF controls as appropriate.

## Review sign-in (Google) and the `reviews` collection

The home-page review form requires Firebase Authentication with Google (`signInWithPopup`). All reviews are publicly listed, newest first by `createdAt`. On 2026-11-21 the owner decided to remove the `autoriser == true` display filter, so submissions appear immediately without moderation. Documents without `createdAt` are not listed. New documents written by the browser have the shape below. The owner authorized adding `uid`, `photoURL` and (2026-11-21) `authorName`, the full Google account name; older documents without them still render, using an initial instead of a photo:

```
{ name: string (2–25 chars, "…" appended if truncated), rating: int 1–5,
  message: string (10–800 chars, "…" appended if truncated), createdAt: serverTimestamp(),
  uid: request.auth.uid, authorName: Google display name string (≤ 100 chars) | null,
  photoURL: https URL string | null }
```

The client never sets `autoriser`. Because there is no moderation step, abusive or spam reviews are visible until someone deletes them in the console. Rendering uses textContent, so review text cannot inject markup. Every stored field, including `authorName`, `uid` and `photoURL`, is publicly readable even though the page shows only `name`. Email addresses are deliberately not stored in reviews; look them up by `uid` in Firebase Authentication. **The sign-in requirement is only a browser check until Firestore rules enforce it.** None of the following has been verified or deployed from this repository:

1. Firebase console → Authentication → Sign-in method: enable **Google**.
2. Authentication → Settings → Authorized domains: add the production domain(s). **Verified 2026-11-21 via the public Identity Toolkit config:** the Google provider is enabled, but the authorized domains are only `localhost`, `marthaclean-be6dc.firebaseapp.com` and `marthaclean-be6dc.web.app`. `marthacleanbesia.ch` (and `www.marthacleanbesia.ch` if used) must be added, or sign-in fails in production with `auth/unauthorized-domain`. For local tests, open the preview at `http://localhost:8000`. `http://127.0.0.1:8000` is not authorized. The page logs the Firebase error code (`Google sign-in failed: auth/...`) to the browser console and shows visitors a generic "not available" message for configuration errors.
3. Deploy rules equivalent to the following, adapted to the existing rules. Test them in the Rules Playground or emulator first, not against production data:

```
match /reviews/{reviewId} {
  allow read: if true;   // no moderation filter (owner decision); restore `resource.data.autoriser == true` to re-enable
  allow create: if request.auth != null
    && request.resource.data.keys().hasOnly(['name','rating','message','createdAt','uid','authorName','photoURL'])
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.name is string
    && request.resource.data.name.size() >= 2 && request.resource.data.name.size() <= 26
    && request.resource.data.rating is int
    && request.resource.data.rating >= 1 && request.resource.data.rating <= 5
    && request.resource.data.message is string
    && request.resource.data.message.size() >= 10 && request.resource.data.message.size() <= 801
    && request.resource.data.createdAt == request.time
    && (request.resource.data.authorName == null
        || (request.resource.data.authorName is string && request.resource.data.authorName.size() <= 100))
    && (request.resource.data.photoURL == null
        || (request.resource.data.photoURL is string && request.resource.data.photoURL.size() <= 2048));
  allow update, delete: if false;   // removal via console/Admin SDK, which bypass rules
}
```

If the current rules whitelist only the old fields, new submissions will be rejected until the rules are updated. The rules above do not rate-limit a signed-in user. Add App Check and, if needed, a per-user limit, for example a one-review-per-`uid` document ID scheme. That would be a further shape change and needs authorization. The list orders by `createdAt` (single-field index). The header count and average use `count()` and `average("rating")` over the whole collection without `orderBy`, so no composite index is needed. Verified exact in a browser on 2026-11-21 (4.8 over 11 reviews, no console warning). Documents without `createdAt` would be counted there but not listed; there are currently none. If the aggregate is ever rejected, the page falls back to averaging the loaded reviews. **If the deployed read rule still requires `autoriser == true`, the unfiltered list query is rejected entirely and the section shows "Reviews unavailable". Update the read rule as well.**

CSP impact of Google sign-in: script `apis.google.com`, frame `https://<authDomain>` (`marthaclean-be6dc.firebaseapp.com`) and `accounts.google.com`, connect `identitytoolkit.googleapis.com` and `securetoken.googleapis.com`, img `*.googleusercontent.com` (avatars, loaded with `referrerpolicy="no-referrer"`). Browsers that block third-party storage (Safari, some Firefox modes) can break popup sign-in when `authDomain` differs from the site's domain. See Firebase "Best practices for using signInWithRedirect on browsers that block third-party storage access" before launch. Firebase Auth keeps its session in IndexedDB, which is managed by the SDK.

## Deployment controls still required

Use HTTPS. At the actual host configure HSTS after confirming HTTPS for all included hosts, nosniff, Referrer-Policy, Permissions-Policy, and CSP frame-ancestors. GitHub Pages cannot configure arbitrary response headers; use a capable host/proxy for these controls.

Start CSP in report-only mode on a staging host. Script sources currently require self, www.gstatic.com and cdn.jsdelivr.net. Styles require self, cdnjs.cloudflare.com and legacy inline styles; fonts/images/connect/frame hosts must be inventoried during browser testing. Do not add wildcard connect sources or unsafe-eval to silence failures. Promote a tested policy to enforced mode; no unverified policy is represented here as enforced. CDN dependencies lack comprehensive SRI/version locking and vendored Bootstrap is a beta release; upgrade under browser regression coverage.

Firestore rules, EmailJS origin restrictions, CORS, rate limiting, backend validation, dependency CVE coverage, console cleanliness, accessibility and payment integrity remain unverified. Review PII retention and avoid logging submitted form data. Existing raw SDK error logging should be reduced during the next integration refactor.

If an actual privileged credential was ever committed: revoke/rotate it immediately, audit access, then coordinate history cleanup with repository collaborators. Ignoring files does not remove tracked secrets or history. Do not rotate public Firebase config merely because it is visible.

References: [OWASP DOM XSS](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html), [Firebase API key policy](https://firebase.google.com/docs/projects/api-keys), [Firestore rules](https://firebase.google.com/docs/firestore/security/get-started).
