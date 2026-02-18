#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="${1:-$(node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('system.json','utf8')); process.stdout.write(String(m.version||''));")}"
if [[ -z "$VERSION" ]]; then
  echo "Unable to resolve version from system.json."
  exit 1
fi

TAG="v${VERSION}"
RELEASE_DIR="release/${TAG}"
ZIP_NAME="remasters-rpg-${VERSION}.zip"
ZIP_PATH="${RELEASE_DIR}/${ZIP_NAME}"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

npm run build

cp system.json "${RELEASE_DIR}/system.json"
zip -r "$ZIP_PATH" \
  assets \
  dist \
  lang \
  templates \
  template.json \
  system.json \
  -x "*.DS_Store" \
  -x "__MACOSX/*"

echo "Release artifacts created:"
echo " - ${RELEASE_DIR}/system.json"
echo " - ${ZIP_PATH}"
echo ""
echo "Next:"
echo "1) Create git tag: ${TAG}"
echo "2) Publish a GitHub release with ${ZIP_NAME} attached."
echo "3) Upload ${RELEASE_DIR}/system.json as release asset named system.json."
