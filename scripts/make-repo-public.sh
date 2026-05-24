#!/usr/bin/env bash
# Flips selucas12/vault from PRIVATE to PUBLIC.
#
# The autonomous build classifier blocked the initial public-repo creation as
# irreversible. This script is the one-line escape hatch for when you're ready
# to flip visibility yourself.
#
# Requires: gh CLI logged in as selucas12 (`gh auth status` should be green).
#
# Fallback if this script fails: manually click through
#   https://github.com/selucas12/vault/settings
#   → Danger Zone → "Change repository visibility" → Public → confirm
#
# NOTE: this is irreversible in the sense that once people clone the repo
# during its public window, copies persist even if you later flip it back to
# private. Don't run this until the build report's "Stephen must do" items
# are far enough along that you're comfortable with the world seeing the
# source.

set -euo pipefail

REPO="selucas12/vault"

read -r -p "About to flip ${REPO} to PUBLIC. Continue? [y/N] " ans
case "$ans" in
  [yY]|[yY][eE][sS]) ;;
  *) echo "Aborted."; exit 1 ;;
esac

gh repo edit "$REPO" \
  --visibility public \
  --accept-visibility-change-consequences

echo
echo "Visibility flipped. Verify:"
echo "  gh repo view ${REPO} --json visibility -q .visibility"
