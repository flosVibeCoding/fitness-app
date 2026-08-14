#!/bin/bash
set -e
cd "$(dirname "$0")"

read -p "Prod-Deploy für Fitness Coach starten? (ja/nein): " CONFIRM
if [ "$CONFIRM" != "ja" ]; then
  echo "Abgebrochen."
  exit 0
fi

CURRENT=$(cat VERSION 2>/dev/null || echo "1.0.0")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "$NEW_VERSION" > VERSION

DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > web/src/version-info.json <<EOF
{
  "version": "$NEW_VERSION",
  "deployedAt": "$DEPLOYED_AT"
}
EOF

echo "→ Deploying PROD v$NEW_VERSION..."

cd web
npm install --no-audit --no-fund
npm run build
cd ..

cd api
npm install --no-audit --no-fund
cd ..

sudo systemctl restart fitness-api

echo "✓ PROD v$NEW_VERSION deployed — https://fitness.seliflo-orga.de"
