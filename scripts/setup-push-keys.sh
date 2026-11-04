#!/usr/bin/env bash
# One-time setup for push alerts: makes a VAPID key pair, stores the private key as the GitHub secret
# VAPID_PRIVATE_KEY (piped straight to gh, never printed or written to disk) and writes the public key to
# data/vapid.json. Commit data/vapid.json afterwards. Re-running makes a new pair, which silently breaks every
# existing subscription, so it refuses unless you pass --force.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${1:-}" != "--force" ] && node -e 'process.exit(require("./data/vapid.json").publicKey ? 0 : 1)'; then
  echo "data/vapid.json already has a key; existing alerts would stop working. Use --force to replace it." >&2
  exit 1
fi
node -e '
const k = require("web-push").generateVAPIDKeys();
require("fs").writeFileSync("data/vapid.json", JSON.stringify({ publicKey: k.publicKey }) + "\n");
process.stdout.write(k.privateKey);
' | gh secret set VAPID_PRIVATE_KEY --repo lariyaharsh88/anilumi
echo "Done: VAPID_PRIVATE_KEY saved in GitHub; public key written to data/vapid.json."
