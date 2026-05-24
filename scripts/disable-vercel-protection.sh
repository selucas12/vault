#!/usr/bin/env bash
# Disables Vercel production deployment protection on the vault project.
# This is what makes the production URL world-readable instead of 401-gated.
#
# Requires: Vercel CLI logged in (`vercel whoami`), team `cheesyboy` accessible.
#
# Fallback if this script fails: manually click through
#   https://vercel.com/cheesyboy/vault/settings/deployment-protection
#   → "Standard Protection (Vercel Authentication)" → switch to "Disabled"
#   (or "Only Preview Deployments" if you want previews to stay gated).
#
# As of Vercel CLI 54.x, project protection is configured via the project's
# REST API rather than a top-level CLI verb. We do it through `vercel project`
# REST passthrough using a short curl call against the Vercel API. This is
# safer than UI clicks because it leaves a command-line audit trail.

set -euo pipefail

PROJECT="vault"
TEAM="cheesyboy"

# Resolve a token from the local Vercel auth cache.
TOKEN_PATH="$HOME/Library/Application Support/com.vercel.cli/auth.json"
if [ ! -f "$TOKEN_PATH" ]; then
  echo "Could not find Vercel auth cache at $TOKEN_PATH"
  echo "Run \`vercel login\` first, or use the manual click-path:"
  echo "  https://vercel.com/${TEAM}/${PROJECT}/settings/deployment-protection"
  exit 1
fi
TOKEN=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).token)" "$TOKEN_PATH")

# Look up the team id once.
TEAM_ID=$(curl -fsSL -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v2/teams" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const t=JSON.parse(d).teams.find(x=>x.slug===process.argv[1]);if(!t){process.exit(2)}console.log(t.id)})" "$TEAM")

echo "Disabling deployment protection for ${TEAM}/${PROJECT} (team ${TEAM_ID})…"

# PATCH the project to disable SSO protection on production.
# ssoProtection=null clears the gate; passwordProtection=null too.
curl -fsSL -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v9/projects/${PROJECT}?teamId=${TEAM_ID}" \
  -d '{"ssoProtection":null,"passwordProtection":null}' \
  > /tmp/vercel-protection-response.json

echo "Done. Verify with:"
echo "  curl -s -o /dev/null -w 'HTTP %{http_code}\n' https://vault-3i6pa9l1c-cheesyboy.vercel.app/"
echo
echo "Response saved to /tmp/vercel-protection-response.json"
