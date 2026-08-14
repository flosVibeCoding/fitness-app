#!/bin/bash
set -e
cd "$(dirname "$0")"

CURRENT=$(cat VERSION 2>/dev/null || echo "1.0.0")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "$NEW_VERSION" > VERSION

DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > web/src/version-info.json <<EOJSON
{
  "version": "$NEW_VERSION",
  "deployedAt": "$DEPLOYED_AT"
}
EOJSON

echo "→ Deploying DEV v$NEW_VERSION..."

cd web
npm install --no-audit --no-fund
npm run build
cd ..

cd api
npm install --no-audit --no-fund
cd ..

sudo systemctl restart fitness-api-dev

echo "→ Committe & push nach dev..."
git add -A
git commit -m "Deploy dev v$NEW_VERSION" || echo "  (nichts Neues zu committen)"
git push origin dev

echo "✓ DEV v$NEW_VERSION deployed — https://fitness-dev.seliflo-orga.de"
