#!/bin/sh
# Packs extension/ into extension.zip at the repo root for the Chrome Web Store (git-ignored).
set -e
cd "$(dirname "$0")/.."
rm -f extension.zip
(cd extension && zip -qr ../extension.zip manifest.json background.js icons)
echo "extension.zip: $(du -h extension.zip | cut -f1)"
