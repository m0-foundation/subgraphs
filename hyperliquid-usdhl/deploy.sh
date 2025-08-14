#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"

echo "🧼 Cleaning up..."
rm -rf ./build

echo "👷‍♀️ Building subgraph..."
yarn codegen
yarn build

echo "🚀 Deploying subgraph with version: $VERSION"
goldsky subgraph deploy "hyperliquid-usdhl/$VERSION" --path .

echo "✅ Deployment complete"
