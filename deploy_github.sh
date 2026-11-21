#!/usr/bin/env bash
# Push this project to GitHub (https://github.com/shibratech-ux/Marthe-Clean).
#
# Usage:
#   ./deploy_github.sh                      # commit message: "Update site"
#   ./deploy_github.sh "Describe change"    # custom commit message
#   ./deploy_github.sh -y "Describe change" # skip the confirmation prompt
#
# Safe to run repeatedly: initialises Git and the remote only if missing,
# runs lint/tests/build before committing, and refuses to push if checks fail
# or if ignored/secret files would be committed.
set -euo pipefail

REMOTE_URL="https://github.com/shibratech-ux/Marthe-Clean.git"
BRANCH="main"

ASSUME_YES=0
if [[ "${1:-}" == "-y" || "${1:-}" == "--yes" ]]; then
  ASSUME_YES=1
  shift
fi
COMMIT_MESSAGE="${1:-Update site}"

cd "$(dirname "$0")"

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[31mError: %s\033[0m\n' "$*" >&2; exit 1; }

command -v git >/dev/null || fail "git is not installed."
command -v npm >/dev/null || fail "npm (Node.js 24) is not installed."

# 1. Checks first: never push a broken build.
say "Running lint, tests and build"
npm run lint
npm test
npm run build

# 2. Initialise the repository (first run only).
if [[ ! -d .git ]]; then
  say "Initialising Git repository"
  git init
fi
git branch -M "$BRANCH" 2>/dev/null || git checkout -B "$BRANCH"

# 3. Configure the remote (add it, or fix it if it points elsewhere).
if git remote get-url origin >/dev/null 2>&1; then
  current_url="$(git remote get-url origin)"
  if [[ "$current_url" != "$REMOTE_URL" ]]; then
    say "Updating remote 'origin': $current_url -> $REMOTE_URL"
    git remote set-url origin "$REMOTE_URL"
  fi
else
  say "Adding remote 'origin' -> $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
fi

# 4. Stage everything that .gitignore allows.
say "Staging files"
git add -A

# 5. Safety net: refuse to commit generated output, editor junk or credentials.
blocked="$(git diff --cached --name-only | grep -E '(^|/)(dist|node_modules|vscode)/|\.DS_Store$|(^|/)\.env$|\.(pem|key|p12|pfx)$|service-account.*\.json$' || true)"
if [[ -n "$blocked" ]]; then
  git reset -q
  fail "These files must not be committed (check .gitignore):
$blocked"
fi

# 6. Commit (skip if nothing changed).
if git diff --cached --quiet; then
  say "No changes to commit"
else
  say "Files in this commit:"
  git diff --cached --stat | tail -n 15
  git commit -m "$COMMIT_MESSAGE"
fi

# 7. Confirm, then push.
if [[ "$ASSUME_YES" -ne 1 ]]; then
  printf '\nPush branch "%s" to %s? [y/N] ' "$BRANCH" "$REMOTE_URL"
  read -r answer
  [[ "$answer" =~ ^[Yy]$ ]] || { echo "Push cancelled. Your commit is saved locally."; exit 0; }
fi

say "Pushing to GitHub"
git push -u origin "$BRANCH"
say "Done: https://github.com/shibratech-ux/Marthe-Clean"
